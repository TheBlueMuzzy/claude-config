// PDS deck tools: deploy the shared library, make new decks, install/update the deck menu stub.
// Runs with Muzzy's work Google login (gws, config dir ~/.config/gws-relatable).
//
//   node pds.mjs status
//   node pds.mjs deploy-library [folderId]        create or update the "PDS Tools" library from ./library
//   node pds.mjs mark-template <presentationId>   tag a deck as THE template (pdsRole=template)
//   node pds.mjs new-deck <folderId> <item#> "<Game Name>"
//   node pds.mjs install-stub <presentationId>    add or refresh the PDS menu in one deck
//   node pds.mjs update-folder <folderId>         refresh the menu in every PDS deck in a folder (and sub-folders)
//   node pds.mjs fresh-test <folderId>            bin the last test deck, make a clean one from the template
//   node pds.mjs set-specs-root <folder link>     the shared Product Specs folder New PDS lists seasons from
//   node pds.mjs set-backup-folder <folder link>  Muzzy's personal folder for the template backup (saves one now)
//   node pds.mjs backup-template [--force]        refresh the backup if the template changed (also runs after deploy / fresh-test)
//
// Files are found by Drive tags (appProperties), never by stored IDs:
//   library  -> pdsRole=library   template -> pdsRole=template   deck -> pdsStubScriptId=<its menu script>
import { execFileSync, execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const EXE = process.platform === "win32"
  ? join(process.env.APPDATA, "npm/node_modules/@googleworkspace/cli/node_modules/.bin_real/gws.exe")
  : "gws";
const ENV = { ...process.env, GOOGLE_WORKSPACE_CLI_CONFIG_DIR: join(homedir(), ".config/gws-relatable") };
const SLIDES = "application/vnd.google-apps.presentation";
const SCRIPT = "application/vnd.google-apps.script";

function gws(...args) {
  try {
    const out = execFileSync(EXE, args, { encoding: "utf8", env: ENV, maxBuffer: 1e8, stdio: ["ignore", "pipe", "pipe"] });
    return out.trim() ? JSON.parse(out) : {};
  } catch (e) {
    const body = String(e.stdout || "") + String(e.stderr || "");
    const msg = (body.match(/"message":\s*"([^"]+)"/) || [])[1] || body.slice(0, 400);
    throw new Error(msg);
  }
}
const p = (o) => JSON.stringify(o);

// Apps Script work goes through clasp (Google's own Apps Script CLI, signed in as the work account with `clasp login`)
const CLASP = join(execSync("npm root -g", { encoding: "utf8" }).trim(), "@google/clasp/build/src/index.js");

function clasp(dir, ...args) {
  try {
    return execFileSync(process.execPath, [CLASP, ...args], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    throw new Error("clasp " + args[0] + ": " + (String(e.stderr || "") + String(e.stdout || "")).trim().slice(0, 400));
  }
}
function workDir() { return mkdtempSync(join(tmpdir(), "pds-")); }

// New script project (standalone, or bound to a deck when parentId is given); returns its id
function createScript(title, parentId) {
  const dir = workDir();
  clasp(dir, "create-script", "--title", title, "--rootDir", dir, ...(parentId ? ["--parentId", parentId] : []));
  return JSON.parse(readFileSync(join(dir, ".clasp.json"), "utf8")).scriptId;
}

// Replace a project's code with these files
function pushScript(scriptId, files, versionNote) {
  const dir = workDir();
  writeFileSync(join(dir, ".clasp.json"), JSON.stringify({ scriptId, rootDir: dir }));
  for (const f of files) writeFileSync(join(dir, f.name + (f.type === "JSON" ? ".json" : ".js")), f.source);
  clasp(dir, "push", "--force");
  if (versionNote) return (clasp(dir, "create-version", versionNote).match(/version (\d+)/i) || [])[1];
}

// Copies of a file carry its tags, so a tag only counts on the file it names (pdsSelf / pdsStubFor = that file's id)
function findByTag(key, value) {
  const q = `appProperties has { key='${key}' and value='${value}' } and trashed=false`;
  return gws("drive", "files", "list", "--params", p({ q, fields: "files(id,name,mimeType,parents,appProperties)", supportsAllDrives: true, includeItemsFromAllDrives: true, corpora: "allDrives" })).files || [];
}
function template() {
  const t = findByTag("pdsRole", "template").filter((f) => f.mimeType === SLIDES && (f.appProperties || {}).pdsSelf === f.id);
  if (t.length !== 1) throw new Error(`Expected exactly one template (tag pdsRole=template on itself), found ${t.length}. Use mark-template.`);
  return t[0];
}
function tag(fileId, props) {
  gws("drive", "files", "update", "--params", p({ fileId, supportsAllDrives: true, fields: "id" }), "--json", p({ appProperties: props }));
}
function fileInfo(fileId) {
  return gws("drive", "files", "get", "--params", p({ fileId, supportsAllDrives: true, fields: "id,name,mimeType,parents,appProperties" }));
}

function source(dir) {
  return [
    { name: "Code", type: "SERVER_JS", source: readFileSync(join(HERE, dir, "Code.js"), "utf8") },
    { name: "appsscript", type: "JSON", source: readFileSync(join(HERE, dir, "appsscript.json"), "utf8") },
  ];
}

function library() {
  const found = findByTag("pdsRole", "library").filter((f) => f.mimeType === SCRIPT);
  if (found.length > 1) throw new Error("More than one file is tagged as the PDS library: " + found.map((f) => f.id).join(", "));
  return found[0] || null;
}

async function deployLibrary(folderId) {
  // Never ship code that fails its tests
  for (const t of ["test/defined.test.mjs", "test/placement.test.mjs"]) {
    try { execFileSync(process.execPath, [join(HERE, t)], { stdio: ["ignore", "pipe", "pipe"] }); }
    catch (e) { throw new Error(t + " failed — not deploying:\n" + String(e.stdout || "")); }
  }
  let lib = library();
  if (!lib) {
    const id = createScript("PDS Tools");
    tag(id, { pdsRole: "library" });
    if (folderId) gws("drive", "files", "update", "--params", p({ fileId: id, addParents: folderId, supportsAllDrives: true, fields: "id" }));
    lib = { id, name: "PDS Tools" };
    console.log("created library", lib.id);
  }
  // The library needs the template's id for "New PDS…"; it's filled in here so the repo never holds it
  // The specs-folder id is kept as a tag on the template (our own file — the shared folder is never tagged or changed)
  const tpl = template();
  const root = (fileInfo(tpl.id).appProperties || {}).pdsSpecsRoot;
  if (!root) throw new Error("No Product Specs folder recorded — run: set-specs-root <folder link or id>");
  const files = source("library").map((f) => f.name === "Code" ? { ...f, source: f.source.replace("TEMPLATE_ID_SET_AT_DEPLOY", tpl.id).replace("SPECS_ROOT_ID_SET_AT_DEPLOY", root) } : f);
  const v = pushScript(lib.id, files, "deployed " + new Date().toISOString().slice(0, 10));
  console.log(`library updated: ${lib.id} (version ${v || "?"}). Decks pick it up next time they open.`);
  backupTemplate();
  return lib.id;
}

function stubFiles(libId) {
  return source("stub").map((f) => f.name === "appsscript" ? { ...f, source: f.source.replace("LIBRARY_SCRIPT_ID", libId) } : f);
}

// Add the menu to a deck, or refresh it if this tool installed it before
async function installStub(deckId, libId) {
  libId = libId || (library() || {}).id;
  if (!libId) throw new Error("No PDS library yet — run deploy-library first.");
  const info = fileInfo(deckId);
  const props = info.appProperties || {};
  let scriptId = props.pdsStubFor === deckId ? props.pdsStubScriptId : null;
  if (scriptId) {
    try { pushScript(scriptId, stubFiles(libId)); console.log(`menu refreshed: ${info.name}`); return; }
    catch (e) { console.log(`recorded menu script not reachable (${e.message.slice(0, 80)}); installing a new one`); }
  }
  scriptId = createScript("PDS menu", deckId);
  tag(deckId, { pdsStubScriptId: scriptId, pdsStubFor: deckId });
  pushScript(scriptId, stubFiles(libId));
  console.log(`menu installed: ${info.name}`);
}

// A deck counts as PDS if it has the PDS layouts
function isPdsDeck(id) {
  const d = gws("slides", "presentations", "get", "--params", p({ presentationId: id, fields: "layouts(layoutProperties(displayName))" }));
  return (d.layouts || []).filter((l) => (l.layoutProperties.displayName || "").startsWith("PDS - ")).length >= 7;
}

function decksIn(folderId) {
  const out = [];
  const walk = (id) => {
    const r = gws("drive", "files", "list", "--params", p({ q: `'${id}' in parents and trashed=false`, fields: "files(id,name,mimeType)", supportsAllDrives: true, includeItemsFromAllDrives: true, corpora: "allDrives", pageSize: 1000 }));
    for (const f of r.files || []) {
      if (f.mimeType === "application/vnd.google-apps.folder") walk(f.id);
      else if (f.mimeType === SLIDES) out.push(f);
    }
  };
  walk(folderId);
  return out;
}

// Refresh the menu stub everywhere this tool installed one. Decks copied from the template (menu button or by hand)
// carry the template's stub, which keeps working through the library; only a stub change needs this.
async function updateFolder(folderId) {
  const libId = (library() || {}).id;
  if (!libId) throw new Error("No PDS library yet — run deploy-library first.");
  let done = 0, copied = 0, other = 0;
  for (const f of decksIn(folderId)) {
    const props = fileInfo(f.id).appProperties || {};
    if (props.pdsStubFor === f.id) { await installStub(f.id, libId); done++; }
    else if (isPdsDeck(f.id)) copied++;
    else other++;
  }
  console.log(`menu refreshed in ${done} deck(s); ${copied} deck(s) carry a copied menu (still works via the library); ${other} non-PDS file(s) skipped.`);
}

// The template carries the menu, so a copy is ready to use; its copied tags don't count (see findByTag)
async function newDeck(folderId, item, game) {
  const tpl = template();
  const name = `${item} - ${game} - PDS`;
  const copy = gws("drive", "files", "copy", "--params", p({ fileId: tpl.id, supportsAllDrives: true, fields: "id,name" }), "--json", p({ name, parents: [folderId] }));
  console.log(`new deck: ${name}\nhttps://docs.google.com/presentation/d/${copy.id}/edit`);
  return copy.id;
}

// A clean test deck every time: bin the previous test deck(s) (tag pdsTest=1), copy the template fresh
async function freshTest(folderId) {
  for (const old of findByTag("pdsTest", "1")) {
    gws("drive", "files", "update", "--params", p({ fileId: old.id, supportsAllDrives: true, fields: "id" }), "--json", p({ trashed: true }));
    console.log("binned old test deck:", old.name);
  }
  // Local time, so the name matches the clock (e.g. "TEST 10-28 3.59pm")
  const n = new Date(), h = n.getHours();
  const stamp = `${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")} ${h % 12 || 12}.${String(n.getMinutes()).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
  const id = await newDeck(folderId, "TEST " + stamp, "Example Game");
  tag(id, { pdsTest: "1" });
  backupTemplate();
}

// One always-current backup of the template in Muzzy's personal folder (tag pdsBackupFolder on the template).
// Copies only when the template changed since the last backup, then bins the older backup.
function backupTemplate(force) {
  const tpl = template();
  const info = gws("drive", "files", "get", "--params", p({ fileId: tpl.id, supportsAllDrives: true, fields: "name,modifiedTime,appProperties" }));
  const folder = (info.appProperties || {}).pdsBackupFolder;
  if (!folder) { console.log("backup: no backup folder set (set-backup-folder <link>)"); return; }
  const q = `'${folder}' in parents and trashed=false and appProperties has { key='pdsBackupOf' and value='${tpl.id}' }`;
  const old = gws("drive", "files", "list", "--params", p({ q, fields: "files(id,name,appProperties)", supportsAllDrives: true, includeItemsFromAllDrives: true, corpora: "allDrives" })).files || [];
  if (!force && old.some((b) => (b.appProperties || {}).pdsBackupSourceModified === info.modifiedTime)) { console.log("backup: up to date"); return; }
  const copy = gws("drive", "files", "copy", "--params", p({ fileId: tpl.id, supportsAllDrives: true, fields: "id,name" }), "--json", p({ name: `${info.name} (backup)`, parents: [folder] }));
  tag(copy.id, { pdsBackupOf: tpl.id, pdsBackupSourceModified: info.modifiedTime, pdsRole: "backup" });
  for (const b of old) gws("drive", "files", "update", "--params", p({ fileId: b.id, supportsAllDrives: true, fields: "id" }), "--json", p({ trashed: true }));
  console.log(`backup: saved "${copy.name}"${old.length ? " (older backup binned)" : ""}`);
}

function status() {
  const lib = library();
  const tpl = findByTag("pdsRole", "template");
  console.log("library :", lib ? `${lib.name} ${lib.id}` : "none");
  console.log("template:", tpl.length ? tpl.map((t) => `${t.name} ${t.id}${(t.appProperties || {}).pdsSelf === t.id ? " (the template)" : " (copy — ignored)"}`).join("; ") : "none");
}

const [cmd, a, b, c] = process.argv.slice(2);
try {
  if (cmd === "status") status();
  else if (cmd === "deploy-library") await deployLibrary(a);
  else if (cmd === "mark-template") { tag(a, { pdsRole: "template", pdsSelf: a }); await installStub(a); console.log("tagged as template (menu installed):", fileInfo(a).name); }
  else if (cmd === "install-stub") await installStub(a);
  else if (cmd === "update-folder") await updateFolder(a);
  else if (cmd === "new-deck") await newDeck(a, b, c);
  else if (cmd === "fresh-test") await freshTest(a);
  else if (cmd === "set-backup-folder") { const id = (a.match(/folders\/([A-Za-z0-9_-]+)/) || [])[1] || a; tag(template().id, { pdsBackupFolder: id }); console.log("backup folder recorded on the template:", id); backupTemplate(true); }
  else if (cmd === "backup-template") backupTemplate(b === "--force" || a === "--force");
  else if (cmd === "set-specs-root") { const id = (a.match(/folders\/([A-Za-z0-9_-]+)/) || [])[1] || a; tag(template().id, { pdsSpecsRoot: id }); console.log("Product Specs folder recorded on the template:", id); }
  else console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(0, 9).join("\n"));
} catch (e) {
  console.error("PDS tools error: " + e.message);
  process.exit(1);
}
