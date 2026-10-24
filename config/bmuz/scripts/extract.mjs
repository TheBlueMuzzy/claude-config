// The extraction queue (F114, Muzzy only): a game session hands a finished piece to the framework session, which builds
// it as a module; the game then swaps its own copy for the module. The queue is the framework's
// .planning/extractions.md (lib.mjs parseQueue / writeQueue); every change to it is committed in the framework repo
// (on whatever branch it's on — never pushed; /save does that).
//   In the game:
//     node extract.mjs add <file…> --what="what it does" --checks=test,e2e:smoke [--name="short name"]
//         one entry at the game's current commit. Refuses a missing or uncommitted file, a file already queued, a check
//         that isn't one of the game's package.json scripts.
//     node extract.mjs fix <id> "<what was fixed>"     a bug fix made to a frozen file, logged on the entry
//     node extract.mjs swap <id>                       the released module in, the game's old copy out, the checks
//         unchanged, ONE game commit. Red → the attempt is set aside on a branch, the game is left exactly as it was.
//   In the framework:
//     node extract.mjs list [--all]                    open entries (--all: swapped ones too)
//     node extract.mjs status <id> building | released <module>@<version>
// While an entry is open, guard-edits warns on every edit to its files in that game: bug fixes only, log each one.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, relative, resolve } from 'node:path'
import {
  FRAMEWORK, run, say, ok, refuse, tail, readJson, git, changedFiles, guardCommit, todays, moduleFolders, NEVER_COMMIT,
  queuePath, readQueue, writeQueue, statusWord, isOpenEntry, nextExtractionId, gameName,
} from './lib.mjs'

const INSTALL = join(import.meta.dirname, 'install-module.mjs')
const all = process.argv.slice(2)
const flag = (name) => { const f = all.find(a => a === `--${name}` || a.startsWith(`--${name}=`)); return f === undefined ? null : f.includes('=') ? f.slice(f.indexOf('=') + 1) : '' }
const words = all.filter(a => !a.startsWith('--'))
const [command, ...rest] = words
const today = todays()[0]

const USAGE = [
  'node extract.mjs add <file…> --what="what it does" --checks=test,e2e:smoke [--name="short name"]   (in the game)',
  'node extract.mjs list [--all]',
  'node extract.mjs status <id> building | released <module>@<version>   (in the framework)',
  'node extract.mjs fix <id> "<what was fixed>"',
  'node extract.mjs swap <id>   (in the game)',
].join('\n    ')

if (command === 'add') add()
else if (command === 'list') list()
else if (command === 'status') status()
else if (command === 'fix') fix()
else if (command === 'swap') swap()
else refuse(`what should extract.mjs do? (got "${command ?? ''}")`, `one of:\n    ${USAGE}`)

// --- the queue, saved + committed in the framework ----------------------------------------------------------------

function entryOf(queue, id) {
  const entry = queue.entries.find(e => e.id.toLowerCase() === String(id || '').toLowerCase())
  if (!entry) refuse(`no entry "${id ?? ''}" in the extraction queue`, `\`node extract.mjs list --all\` shows them (${queuePath()})`)
  return entry
}

// Write the queue and commit just that file in the framework repo — through the same commit guards a typed commit gets.
function saveQueue(queue, message) {
  mkdirSync(dirname(queuePath()), { recursive: true })
  writeFileSync(queuePath(), writeQueue(queue))
  if (git(FRAMEWORK, 'rev-parse', '--git-dir') === null) { say(`(the framework at ${FRAMEWORK} isn't a git repo — the queue is written, not committed)`); return }
  const file = '.planning/extractions.md'
  run('git', ['add', '--', file], { cwd: FRAMEWORK })
  const why = guardCommit(FRAMEWORK, message)
  if (why) { say(`! the queue is written but not committed in the framework — a commit guard said:\n    ${why}\n  → commit .planning/extractions.md there by hand once that's sorted`); return }
  const done = run('git', ['commit', '-q', '-m', message, '--', file], { cwd: FRAMEWORK })
  if (done.code !== 0) say(`! the queue is written but the framework commit failed:\n${tail(done.out, 5)}`)
  else ok(`framework: committed "${message}" on ${git(FRAMEWORK, 'branch', '--show-current') || 'a detached HEAD'} (not pushed — /save there does that)`)
}

// The game this command runs in: its git root, and its name under ~/Documents/dev.
function thisGame() {
  const root = git(process.cwd(), 'rev-parse', '--show-toplevel')
  if (!root) refuse(`${process.cwd()} isn't inside a git repo — run this in the game's folder`)
  const name = gameName(root)
  if (!name) refuse(`${root} isn't under ~/Documents/dev, so the queue couldn't find it again on the other machine`, 'run this in the game\'s own folder (games/<name>)')
  if (resolve(root).toLowerCase() === resolve(FRAMEWORK).toLowerCase()) refuse('this is the framework itself — `add` and `swap` run in the game the piece comes from')
  return { root: resolve(root), name }
}

// --- add -----------------------------------------------------------------------------------------------------------

function add() {
  const { root, name } = thisGame()
  const what = (flag('what') || '').trim()
  const checks = (flag('checks') || '').split(',').map(c => c.trim().replace(/^npm run\s+/, '')).filter(Boolean)
  if (!rest.length) refuse('which files? none named', `node extract.mjs add src/engine/rng.ts --what="…" --checks=test`)
  if (!what) refuse('what does the piece do? --what is missing', '--what="seeded random numbers: same seed, same shift" (one line the framework session builds from)')
  if (!checks.length) refuse('which of the game\'s checks prove the piece works? --checks is missing', '--checks=test,e2e:smoke — the game\'s own npm scripts; the swap runs them unchanged')
  const files = []
  for (const f of rest) {
    const rel = relative(root, resolve(process.cwd(), f)).split('\\').join('/')
    if (!rel || rel.startsWith('..')) refuse(`${f} isn't inside the game (${root})`)
    if (!existsSync(join(root, rel))) refuse(`${rel} doesn't exist in the game`, 'name the files as they are now (git ls-files shows them)')
    if (git(root, 'ls-files', '--error-unmatch', '--', rel) === null) refuse(`${rel} isn't committed in the game yet — the entry points at a commit, so the framework session reads exactly what you queued`, `commit it first, then add it`)
    if (changedFiles(root).some(c => c.path === rel)) refuse(`${rel} has uncommitted changes — the entry's commit wouldn't hold them`, 'commit it first (the piece should be finished), then add it')
    files.push(rel)
  }
  const scripts = readJson(join(root, 'package.json'))?.scripts ?? {}
  const missing = checks.filter(c => !scripts[c])
  if (missing.length) refuse(`not one of the game's npm scripts: ${missing.join(', ')} — the swap runs each check unchanged, so it has to exist`, `pick from: ${Object.keys(scripts).join(', ') || '(the game has no scripts)'}`)
  const queue = readQueue()
  for (const f of files) {
    const taken = queue.entries.find(e => isOpenEntry(e) && e.game === name && e.files.includes(f))
    if (taken) refuse(`${f} is already in ${taken.id} (${taken.status}) — one piece per file`, `\`node extract.mjs list\` shows it`)
  }
  const commit = git(root, 'rev-parse', '--short', 'HEAD')
  const id = nextExtractionId(queue.entries)
  const label = (flag('name') || '').trim() || files[0].split('/').pop().replace(/\.[^.]+$/, '')
  queue.entries.push({ id, name: label, status: 'queued', game: name, commit, files, what, checks, added: today, fixes: [], notes: [] })
  saveQueue(queue, `Extraction queue: ${id} queued — ${name.split('/').pop()} ${label}`)
  ok(`${id} queued: ${files.join(', ')} at ${commit}`)
  say(`  While it's open these files get bug fixes only — each one logged: node ~/.claude/config/bmuz/scripts/extract.mjs fix ${id} "<what>"`)
  say(`  Next: tell the framework session "${id} is queued" (SendMessage), or Muzzy opens it there. Once it's released: extract.mjs swap ${id} here.`)
}

// --- list ----------------------------------------------------------------------------------------------------------

function list() {
  const { entries } = readQueue()
  const shown = flag('all') !== null ? entries : entries.filter(isOpenEntry)
  if (!shown.length) { say(`The extraction queue is empty${entries.length ? ' (everything is swapped — --all shows it)' : ''}. (${queuePath()})`); return }
  for (const e of shown) {
    const fixes = e.fixes.length ? ` · ${e.fixes.length} fix${e.fixes.length > 1 ? 'es' : ''} while frozen` : ''
    say(`${e.id} · ${e.status} · ${e.game} @ ${e.commit} · ${e.name}${fixes}\n    ${e.what}\n    files: ${e.files.join(', ')} · checks: ${e.checks.map(c => `npm run ${c}`).join(', ')}`)
  }
}

// --- status (the framework session) --------------------------------------------------------------------------------

function status() {
  const [id, word, release] = rest
  const queue = readQueue()
  const entry = entryOf(queue, id)
  if (statusWord(entry) === 'swapped') refuse(`${entry.id} is already swapped into ${entry.game} — it's finished`)
  if (word === 'building') {
    entry.status = 'building'
  } else if (word === 'released') {
    const m = (release || '').match(/^([a-z0-9][a-z0-9-]*)@(\d+\.\d+\.\d+)$/)
    if (!m) refuse(`released as what? (got "${release ?? ''}")`, `node extract.mjs status ${entry.id} released <module>@<version>   e.g. rng@0.1.0`)
    const [, module, version] = m
    const versionFile = join(FRAMEWORK, module, 'kit', 'VERSION')
    if (!existsSync(versionFile)) refuse(`the framework has no ${module}/kit/VERSION — there's no ${module} module to swap in yet`, `build it in ${join(FRAMEWORK, module)} (the module pattern: kit/ + VERSION + scripts/install-${module}.mjs + README + tests)`)
    const has = readFileSync(versionFile, 'utf8').trim().split(/\s+/)[0]
    if (has !== version) refuse(`${module}/kit/VERSION says ${has}, not ${version}`, `release the version the module really is: released ${module}@${has}`)
    if (!moduleFolders(module)) refuse(`${module}'s package.json doesn't name the game folders it installs into, so install-module can't install it`, `add "bmuz": { "folders": ["src/${module}"], "entry": "src/${module}/index.ts" } to ${join(FRAMEWORK, module, 'package.json')}`)
    if (git(FRAMEWORK, 'rev-parse', '--git-dir') !== null && changedFiles(FRAMEWORK).some(c => c.path.startsWith(`${module}/`))) refuse(`${module}/ has uncommitted changes in the framework — the game would install code no commit holds`, 'commit the module first')
    entry.status = `released ${module}@${version}`
  } else refuse(`which status? (got "${word ?? ''}")`, `building, or released <module>@<version> (swapped is set by \`swap\` in the game)`)
  saveQueue(queue, `Extraction queue: ${entry.id} ${entry.status}`)
  ok(`${entry.id} → ${entry.status}`)
  if (word === 'released') say(`  Next: tell ${entry.game}'s session "${entry.id} released — run: node ~/.claude/config/bmuz/scripts/extract.mjs swap ${entry.id}" (SendMessage).`)
}

// --- fix (a bug fix to a frozen file) ------------------------------------------------------------------------------

function fix() {
  const [id, ...text] = rest
  const line = text.join(' ').trim()
  const queue = readQueue()
  const entry = entryOf(queue, id)
  if (!isOpenEntry(entry)) refuse(`${entry.id} is already swapped — its files are the module's now; fix the module in the framework`)
  if (!line) refuse('what was fixed? (one line)', `node extract.mjs fix ${entry.id} "the shift seed now wraps at 2^32"`)
  entry.fixes.push(`${today} — ${line}`)
  saveQueue(queue, `Extraction queue: ${entry.id} fix while frozen — ${line.slice(0, 60)}`)
  ok(`logged on ${entry.id} (${entry.fixes.length} fix${entry.fixes.length > 1 ? 'es' : ''} while frozen) — the framework session carries it into the module`)
}

// --- swap (in the game) --------------------------------------------------------------------------------------------

function swap() {
  const { root, name } = thisGame()
  const queue = readQueue()
  const entry = entryOf(queue, rest[0])
  if (entry.game !== name) refuse(`${entry.id} comes from ${entry.game}, not ${name}`, `run the swap in ~/Documents/dev/${entry.game}`)
  const released = entry.status.match(/^released\s+([a-z0-9][a-z0-9-]*)@(\d+\.\d+\.\d+)/)
  if (!released) refuse(`${entry.id} is "${entry.status}", not released yet — there's no module to swap in`, 'wait for the framework session\'s "released" (extract.mjs list shows the status)')
  const [, module, version] = released
  // a clean tree: a red swap is set aside on a branch, and nothing of the game's own work may get mixed into it
  const dirty = changedFiles(root)
  if (dirty.length) refuse(`the game has uncommitted changes (${dirty.slice(0, 5).map(c => c.path).join(', ')}${dirty.length > 5 ? ', …' : ''}) — the swap needs a clean tree so a red swap can be put aside with nothing lost`, 'commit (or /save) first, then swap')
  const branch = git(root, 'branch', '--show-current')
  if (!branch) refuse('the game is on a detached HEAD — the swap commits on a branch', 'switch to the work branch first')
  // the game's old copy: only the entry's files, and only when every change since it was queued was logged
  for (const f of entry.files) {
    if (!existsSync(join(root, f))) refuse(`${f} is gone from the game — was it moved?`, `fix the Files line of ${entry.id} in ${queuePath()}, then swap`)
    const changed = git(root, 'diff', '--quiet', entry.commit, 'HEAD', '--', f) === null
    if (changed && !entry.fixes.length) refuse(`${f} changed since ${entry.commit} (when it was queued) but no fix was logged on ${entry.id} — the module may be missing that change`, `look: git diff ${entry.commit} HEAD -- ${f} · then log it (extract.mjs fix ${entry.id} "…"), make sure the module has it, and swap`)
    if (changed) say(`! ${f} changed since it was queued — the logged fixes: ${entry.fixes.join(' · ')} (the module should hold them)`)
  }
  const meta = readJson(join(FRAMEWORK, module, 'package.json'))?.bmuz ?? {}
  const has = existsSync(join(FRAMEWORK, module, 'kit', 'VERSION')) ? readFileSync(join(FRAMEWORK, module, 'kit', 'VERSION'), 'utf8').trim().split(/\s+/)[0] : null
  if (!has) refuse(`the framework at ${FRAMEWORK} has no ${module} module`, 'pull the framework (or set BMUZ_FRAMEWORK to the checkout that has it)')
  if (has !== version) say(`! ${entry.id} was released as ${module}@${version}; the framework has ${has} now — installing ${has}`)

  // the imports of the old files, pointed at the module's entry (planned before anything changes)
  const rewrites = planImports(root, entry.files, meta.entry)
  if (rewrites.refuse) refuse(rewrites.refuse.text, rewrites.refuse.fix)

  say(`… swapping ${entry.id} (${entry.files.join(', ')}) for ${module} ${has} in ${name}`)
  const results = []
  const install = run(process.execPath, [INSTALL, module, root], { cwd: root })
  results.push({ name: `install-module ${module}`, ok: install.code === 0, out: install.out })
  if (install.code === 0) {
    ok(`install-module ${module}`)
    for (const { file, text } of rewrites.files) writeFileSync(join(root, file), text)
    if (rewrites.files.length) ok(`imports pointed at the module: ${rewrites.files.map(r => r.file).join(', ')}`)
    for (const f of entry.files) rmSync(join(root, f))
    ok(`the game's old copy deleted: ${entry.files.join(', ')}`)
    for (const check of entry.checks) {
      say(`… npm run ${check}`)
      const r = run('npm', ['run', check], { cwd: root })
      results.push({ name: `npm run ${check}`, ok: r.code === 0, out: r.out })
      say(r.code === 0 ? `✓ npm run ${check}` : `✗ npm run ${check}`)
    }
  }
  const red = results.filter(r => !r.ok)
  const message = `Swap ${entry.name} for the ${module} module (${entry.id})`
  let why = null
  if (!red.length) {
    run('git', ['add', '-A'], { cwd: root })
    why = guardCommit(root, message)
    if (!why) {
      const done = run('git', ['commit', '-q', '-m', `${message}\n\n${entry.what}\nRemoved: ${entry.files.join(', ')} · ${module} ${has} installed with install-module.mjs\nChecks green, unchanged: ${entry.checks.map(c => `npm run ${c}`).join(', ')}`], { cwd: root })
      if (done.code !== 0) why = `the commit failed:\n${tail(done.out, 5)}`
    }
    if (!why) {
      const sha = git(root, 'rev-parse', '--short', 'HEAD')
      ok(`${name}: committed "${message}" (${sha}) on ${branch}`)
      entry.status = `swapped in ${sha}`
      saveQueue(queue, `Extraction queue: ${entry.id} swapped into ${name.split('/').pop()} (${sha})`)
      return
    }
  }
  setAside(root, branch, entry, red, why)
}

// Red: the whole attempt committed on its own branch, the game switched back to exactly where it was. Nothing is lost
// and no guarded undo (git checkout -- .) is needed.
function setAside(root, branch, entry, red, why) {
  let aside = `extract/${entry.id}-swap`
  for (let n = 2; git(root, 'rev-parse', '--verify', '--quiet', `refs/heads/${aside}`) !== null; n++) aside = `extract/${entry.id}-swap-${n}`
  run('git', ['switch', '-q', '-c', aside], { cwd: root })
  run('git', ['add', '-A'], { cwd: root })
  const secret = (git(root, 'diff', '--cached', '--name-only') || '').split('\n').filter(f => NEVER_COMMIT.test(f))
  for (const f of secret) run('git', ['rm', '-q', '--cached', '--', f], { cwd: root })
  const kept = run('git', ['commit', '-q', '-m', `Swap attempt ${entry.id} — red, set aside by extract.mjs`], { cwd: root })
  const lines = red.map(r => `  ✗ ${r.name}:\n${tail(r.out, 12)}`)
  if (why) lines.push(`  ✗ the swap commit: ${why}`)
  if (kept.code !== 0) { // (a game's own commit hook said no) — stay on the side branch, the attempt uncommitted there
    refuse(`${entry.id} isn't swapped — it went red:\n${lines.join('\n')}\n  ⚠ the attempt couldn't be committed on ${aside} either:\n${tail(kept.out, 5)}\n  The game is on ${aside} with the attempt uncommitted; ${branch} itself is untouched.`,
      `look at it with git status / git diff · then put it away: \`git stash -u\` and \`git switch ${branch}\``)
  }
  const back = run('git', ['switch', '-q', branch], { cwd: root })
  refuse(`${entry.id} isn't swapped — it went red:\n${lines.join('\n')}\n  The game is back on ${branch} exactly as before${back.code === 0 ? '' : ' (⚠ switching back failed — `git switch ' + branch + '`)'}; the attempt is kept on the branch ${aside}${secret.length ? ` (not committed there: ${secret.join(', ')})` : ''}.`,
    `look at it: git diff ${branch} ${aside} · fix the module in the framework (or the game's imports), release again, swap again · drop the attempt: git branch -D ${aside} (Muzzy's OK — it isn't merged)`)
}

// Every relative import in the game's own code that reaches one of the old files → the module's entry instead.
// Returns { files: [{ file, text }], refuse }. No entry named and nothing imports the old files → nothing to do.
function planImports(root, oldFiles, entryPath) {
  const CODE = /\.(m?[jt]sx?|c[jt]s)$/
  const EXTS = ['', '.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs']
  const old = new Set(oldFiles)
  const tracked = (git(root, 'ls-files') || '').split('\n').filter(f => CODE.test(f) && !old.has(f) && !f.includes('node_modules/'))
  const resolveSpec = (from, spec) => {
    const base = posix.normalize(posix.join(posix.dirname(from), spec))
    const stems = [base, base.replace(/\.(m?js|jsx)$/, '')] // './rng.js' in TypeScript means rng.ts
    for (const stem of stems) for (const ext of EXTS) for (const c of [`${stem}${ext}`, `${stem}/index${ext || '.ts'}`]) if (old.has(c)) return c
    return null
  }
  const out = []
  const IMPORT = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])(\.{1,2}\/[^'"\n]+)\2/g
  for (const file of tracked) {
    const text = readFileSync(join(root, file), 'utf8')
    if (!text.includes('.')) continue
    let touched = false
    const next = text.replace(IMPORT, (all, lead, q, spec) => {
      if (!resolveSpec(file, spec)) return all
      touched = true
      if (!entryPath) return all
      let to = posix.relative(posix.dirname(file), entryPath)
      if (!to.startsWith('.')) to = `./${to}`
      if (!/\.[a-z]+$/i.test(spec)) to = to.replace(/\.(m?[jt]sx?)$/, '').replace(/\/index$/, '')
      else if (/\.js$/.test(spec)) to = to.replace(/\.tsx?$/, '.js')
      return `${lead}${q}${to}${q}`
    })
    if (touched && !entryPath) return { files: [], refuse: { text: `${file} imports the old copy, but the module's package.json names no "bmuz": { "entry" } to point it at`, fix: `add "entry": "src/<module>/index.ts" to the module's "bmuz" block in the framework, release again, then swap` } }
    if (touched) out.push({ file, text: next })
  }
  return { files: out, refuse: null }
}
