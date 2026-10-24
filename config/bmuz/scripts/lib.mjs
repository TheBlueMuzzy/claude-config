// Shared helpers for the BMUZ scripts (F69). A script does one fragile job from start to end, or refuses with a
// plain-words reason before it changes anything — never half-finished. Plain Node, no packages (PC + laptop).
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { git, codeFingerprint, holdCheckLock } from '../hooks/lib.mjs'
export { git, NEVER_COMMIT } from '../hooks/lib.mjs'

const HOOKS = join(import.meta.dirname, '..', 'hooks')

// The framework checkout (tests point this at a fake one).
export const FRAMEWORK = process.env.BMUZ_FRAMEWORK || join(homedir(), 'Documents', 'dev', 'framework')

// Run a command; returns { code, out, stdout } — out = stdout + stderr together (for messages), stdout alone for
// output that gets parsed (a stderr warning glued onto JSON broke stop-servers' process list under load). Never throws.
export function run(command, args, { cwd = process.cwd(), timeout = 600_000 } = {}) {
  const [file, list] = withoutShell(command, args)
  const result = spawnSync(file, list, { cwd, encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 })
  return { code: result.status ?? 1, out: `${result.stdout || ''}${result.stderr || ''}${result.error ? String(result.error.message) : ''}`, stdout: result.stdout || '' }
}

// npm / npx are .cmd files on Windows, which only start through a shell — and a shell reads the arguments as code
// (F120: Node's DEP0190 warning in install-module / extract runs). So they run as this Node + npm's own npm-cli.js /
// npx-cli.js (next to the npm that started this, or beside node.exe): the arguments stay a list, no shell at all.
export function withoutShell(command, args) {
  if (process.platform !== 'win32' || !/^(npm|npx)$/.test(command)) return [command, args]
  const npm = [process.env.npm_execpath, join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')]
    .find(p => /npm-cli\.js$/.test(p || '') && existsSync(p))
  return npm ? [process.execPath, [join(dirname(npm), `${command}-cli.js`), ...args]] : [command, args] // no npm found → spawn says so
}

export const say = (text) => console.log(text)
export const ok = (text) => console.log(`✓ ${text}`)

// Stop the job: what went wrong, and what to do about it. Exit code 1.
export function refuse(text, fix = '') {
  console.log(`✗ ${text}${fix ? `\n  → ${fix}` : ''}`)
  process.exit(1)
}

// The last lines of a command's output, indented (enough to see why it failed).
export const tail = (out, lines = 15) => out.trim().split(/\r?\n/).slice(-lines).map(l => `    ${l}`).join('\n')

export const readJson = (path) => { try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return null } }
// JSON written the way the projects keep it: 2-space indent, a final line break.
export const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)

// The arguments after the script name, split into words and --flags.
export function args() {
  const all = process.argv.slice(2)
  return { words: all.filter(a => !a.startsWith('--')), flags: new Set(all.filter(a => a.startsWith('--'))) }
}

export const projectDir = (dir) => resolve(dir || '.')

// Uncommitted changes: [{ status: ' M' | '??' | ' D' …, path }]. Read raw (-z): a trimmed `git status` loses the first
// line's leading space, and quoted names (spaces, accents) come back exactly.
export function changedFiles(root) {
  const out = run('git', ['status', '--porcelain', '-z', '--untracked-files=all'], { cwd: root }).out
  const parts = out.split('\0').filter(Boolean)
  const files = []
  for (let i = 0; i < parts.length; i++) {
    const status = parts[i].slice(0, 2)
    files.push({ status, path: parts[i].slice(3) })
    if (/R|C/.test(status)) i++ // a rename's old name follows
  }
  return files
}
export const exists = (...parts) => existsSync(join(...parts))

// Ask GitHub's command-line tool. Tests point BMUZ_GH at a fake gh (a .mjs file run with this same Node).
export function gh(args, { cwd } = {}) {
  return process.env.BMUZ_GH ? run(process.execPath, [process.env.BMUZ_GH, ...args], { cwd }) : run('gh', args, { cwd, timeout: 60_000 })
}

// Does the repo have the "Checks" workflow (templates/checks.yml)? Any workflow file named "Checks" counts.
// With a commit, it looks in THAT commit, not the checkout: a branch that adds the workflow is merged from main, which
// doesn't have it yet (framework dev/conformance, 2026-10-19: merged with "no workflow" while GitHub had checked it).
export function hasChecksWorkflow(root, commit) {
  const isChecks = (text) => /^name:\s*["']?Checks["']?\s*$/m.test(text)
  if (commit) {
    const files = run('git', ['ls-tree', '--name-only', `${commit}:.github/workflows`], { cwd: root })
    if (files.code === 0) return files.stdout.split('\n').filter(f => /\.ya?ml$/i.test(f)).some(f => isChecks(run('git', ['show', `${commit}:.github/workflows/${f}`], { cwd: root }).stdout))
  }
  const dir = join(root, '.github', 'workflows')
  if (!existsSync(dir)) return false
  return readdirSync(dir).filter(f => /\.ya?ml$/i.test(f)).some(f => isChecks(readFileSync(join(dir, f), 'utf8')))
}

// Did GitHub's Checks run pass for this commit? (F70 — /deliver won't merge or release red or unchecked work.)
// Returns { verdict: 'green' | 'red' | 'warn', text, fix, url }. 'warn' = can't tell (no workflow, no gh, not logged
// in): it never blocks, it says how to fix it. 'red' also covers "still running" and "never checked".
export function checksVerdict(root, { commit, branch } = {}) {
  const short = (commit || '').slice(0, 7)
  if (!hasChecksWorkflow(root, commit)) {
    return { verdict: 'warn', text: 'this repo has no GitHub Checks workflow, so nothing re-checked it on GitHub', fix: 'copy ~/.claude/config/bmuz/templates/checks.yml to .github/workflows/checks.yml, commit, push' }
  }
  const query = ['run', 'list', '--workflow', 'Checks', '--limit', '1', '--json', 'status,conclusion,url,headSha', '--commit', commit, ...(branch ? ['--branch', branch] : [])]
  const asked = gh(query, { cwd: root })
  let runs = null
  try { runs = JSON.parse(asked.out) } catch { /* not JSON = gh failed */ }
  if (asked.code !== 0 || !Array.isArray(runs)) {
    return { verdict: 'warn', text: `couldn't ask GitHub about the Checks run (is gh installed and logged in?)\n${tail(asked.out, 3)}`, fix: '`gh auth login` — meanwhile look at the Actions tab on GitHub by hand' }
  }
  const latest = runs[0]
  if (!latest) return { verdict: 'red', text: `GitHub hasn't checked ${short}${branch ? ` (the tip of ${branch})` : ''} yet`, fix: 'push the branch and wait for the Checks run to finish (`gh run watch`)' }
  if (latest.status !== 'completed') return { verdict: 'red', text: `GitHub is still checking ${short} — wait for it to finish: ${latest.url}`, url: latest.url, fix: '`gh run watch`, then try again' }
  if (latest.conclusion !== 'success') return { verdict: 'red', text: `GitHub's Checks run for ${short} is red (${latest.conclusion}) — something is broken: ${latest.url}`, url: latest.url, fix: 'open the run, fix it on the work branch, push, and wait for green' }
  return { verdict: 'green', text: `GitHub's Checks run for ${short} is green: ${latest.url}`, url: latest.url }
}

// The same verdict, said out loud: green → ✓, can't tell → ⚠ (carries on), red → refuse (exit 1).
export function requireGreenChecks(root, where) {
  const v = checksVerdict(root, where)
  if (v.verdict === 'green') ok(v.text)
  else if (v.verdict === 'warn') say(`⚠ ${v.text}\n  → ${v.fix}`)
  else refuse(v.text, v.fix)
  return v
}

// Wait in place (scripts are synchronous; this keeps them simple).
export const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.max(0, ms))

// The same verdict, but a run that hasn't finished (or hasn't started yet, right after a push) is waited for —
// up to BMUZ_CHECKS_TIMEOUT ms (default 15 min), asking every BMUZ_POLL_MS (default 15 s). (F80: merge.mjs)
export function waitForChecks(root, where) {
  const until = Date.now() + Number(process.env.BMUZ_CHECKS_TIMEOUT || 15 * 60_000)
  let v = checksVerdict(root, where)
  let said = false
  while (v.verdict === 'red' && /still checking|hasn't checked/.test(v.text) && Date.now() < until) {
    if (!said) { say(`… waiting for GitHub's Checks run (${(where.commit || '').slice(0, 7)})`); said = true }
    sleep(Number(process.env.BMUZ_POLL_MS || 15_000))
    v = checksVerdict(root, where)
  }
  return v
}

// --- dates, STATE lines, commits (F80: what /deliver used to remember, read by the scripts) --------------------

// Today, as the plan files write it. Local date AND UTC date both count — late at night they differ.
export function todays() {
  const now = new Date()
  const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return [...new Set([local, now.toISOString().slice(0, 10)])]
}

// The lines of one `## <heading>` section of a markdown file (heading matched as a regex at the line start).
export function section(text, heading) {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex(l => new RegExp(`^## ${heading}`).test(l))
  if (start < 0) return null
  let end = lines.findIndex((l, n) => n > start && /^## /.test(l)); if (end < 0) end = lines.length
  return lines.slice(start + 1, end)
}

// A STATE label's value: "Reviewed through: abc", "**Last full check:** abc", "- Release: GitHub Pages",
// "Stage: x · Version: 0.3.0.4 · Live: …". Only a real label (line start or after a " · " / 3 spaces), never words
// inside a sentence. Returns the rest of that line (trimmed), or null.
export function stateValue(text, label) {
  const re = new RegExp(`(?:^|\\s·\\s|\\S {3})[- \\t]*\\*{0,2}${label}(?::\\*{0,2}|\\*{0,2}:)[ \\t]*([^\\n]*)`, 'im')
  const m = (text || '').match(re)
  return m ? m[1].trim() : null
}

// Commits named in a STATE line ("framework 1e30635 · Glyphtender eb032a7") that exist in THIS repo.
export function commitsIn(root, value) {
  return [...new Set((value || '').match(/\b[0-9a-f]{7,40}\b/g) || [])].filter(c => git(root, 'rev-parse', '--verify', '--quiet', `${c}^{commit}`) !== null)
}

// Code = anything but plan notes, docs and the save/release bookkeeping (save.mjs bumps version.json and may add
// .gitignore lines on every save — those never need a re-check or a re-review). The licence notices release.mjs
// writes (F85) are made from the packages, not written by hand.
export const isCode = (f) => !!f && !f.startsWith('.planning/') && !/\.md$/i.test(f) && f !== 'version.json' && f !== '.gitignore' && f !== 'public/third-party-notices.txt'

// The newest version tag HEAD contains (null before the first release).
export const lastTag = (root) => git(root, 'describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*', 'HEAD')

// Commits (no merges) since the last tag that change code and aren't inside any of `covered` (commits a STATE line
// names): [{ sha, subject, files }]. A "Rollback to vX.Y.Z" commit brings back code that was already released —
// already reviewed and checked — so it never counts.
export function codeCommitsSince(root, covered = [], since = lastTag(root)) {
  const range = ['HEAD', ...covered.map(c => `^${c}`), ...(since ? [`^${since}`] : [])]
  const out = git(root, 'log', '--no-merges', '--format=%x01%h%x02%s', '--name-only', ...range) || ''
  return out.split('\x01').filter(Boolean).map(chunk => {
    const [head, ...rest] = chunk.split('\n')
    const [sha, subject] = head.split('\x02')
    return { sha, subject, files: rest.map(f => f.trim()).filter(isCode) }
  }).filter(c => c.files.length && !/^Rollback to v\d/.test(c.subject))
}

// --- merged work branches on GitHub (F80: merge.mjs notes them, live-check.mjs deletes them after the push) -------
// <git dir>/bmuz-merged-branches: one branch per line, waiting until GitHub's main has every commit of it.
const pendingFile = (root) => join(resolve(root, git(root, 'rev-parse', '--git-dir')), 'bmuz-merged-branches')
export function pendingRemoteDeletes(root, add = []) {
  const file = pendingFile(root)
  const list = new Set([...(existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : []), ...add])
  writeFileSync(file, [...list].join('\n') + (list.size ? '\n' : ''))
  return [...list]
}
// Deletes each noted branch on GitHub once origin/<main> holds all of it (the same rule guard-git enforces by hand).
// Returns the lines to say. Branches already gone on GitHub are dropped from the list.
export function deleteMergedRemotes(root, main) {
  const lines = []
  const left = []
  run('git', ['fetch', '-q', '--prune', 'origin'], { cwd: root, timeout: 60_000 })
  for (const name of pendingRemoteDeletes(root)) {
    if (git(root, 'rev-parse', '--verify', '--quiet', `refs/remotes/origin/${name}`) === null) continue // already gone
    if (git(root, 'merge-base', '--is-ancestor', `origin/${name}`, `origin/${main}`) === null) { left.push(name); lines.push(`GitHub's copy of ${name} stays until ${main} is pushed (then live-check.mjs deletes it)`); continue }
    const gone = run('git', ['push', '-q', 'origin', '--delete', name], { cwd: root })
    if (gone.code === 0) lines.push(`✓ deleted ${name} on GitHub (all of it is in ${main} there)`)
    else { left.push(name); lines.push(`⚠ couldn't delete ${name} on GitHub:\n    ${gone.out.trim()}`) }
  }
  writeFileSync(pendingFile(root), left.join('\n') + (left.length ? '\n' : ''))
  return lines
}

// --- the project's own checks -------------------------------------------------------------------------------------

// <git dir>/bmuz-last-green: the code fingerprint check:fast last passed on (shared with stop-check-fast).
export const greenRecord = (root) => join(resolve(root, git(root, 'rev-parse', '--git-dir')), 'bmuz-last-green')

// The Fast tier: `npm run check:fast` (skipped when this exact code already passed it — recorded as green), else
// `npm test` + `npm run build`. Returns [{ name, ok, cached, out }] — empty when the project has none of them.
export function fastChecks(root) {
  const scripts = readJson(join(root, 'package.json'))?.scripts || {}
  const record = greenRecord(root)
  if (scripts['check:fast']) {
    const fingerprint = codeFingerprint(root)
    const isGreen = () => existsSync(record) && readFileSync(record, 'utf8').trim() === fingerprint
    if (isGreen()) return [{ name: 'check:fast', ok: true, cached: true, out: '' }]
    // one check:fast at a time per project (another session or a hook may be running it — Goops 2026-10-19): wait for
    // it (up to 10 min), then reuse its pass on this exact code
    const release = holdCheckLock(root, 600_000)
    if (!release) return [{ name: 'check:fast', ok: false, cached: false, out: 'another check:fast in this project has been running for over 10 minutes — not run again here' }]
    if (isGreen()) { release(); return [{ name: 'check:fast', ok: true, cached: true, out: '' }] }
    const check = run('npm', ['run', 'check:fast'], { cwd: root, timeout: 300_000 })
    release()
    if (check.code === 0) writeFileSync(record, fingerprint + '\n')
    return [{ name: 'check:fast', ok: check.code === 0, cached: false, out: check.out }]
  }
  const results = []
  const realTest = scripts.test && !/no test specified/.test(scripts.test)
  for (const [name, has] of [['test', realTest], ['build', scripts.build]]) {
    if (!has) continue
    const check = run('npm', ['run', name], { cwd: root, timeout: 300_000 })
    results.push({ name, ok: check.code === 0, cached: false, out: check.out })
  }
  return results
}

// cleanup.sh (temp files, finished helper workspaces, old check output, old .scratch entries). Returns its line,
// or a ⚠ when it failed — cleanup never stops a save or a release. BMUZ_CLEANUP = tests' stand-in.
export function cleanup(root, what = 'the save') {
  const script = process.env.BMUZ_CLEANUP || join(import.meta.dirname, '..', 'cleanup.sh')
  const result = run('bash', [script, root], { timeout: 120_000 })
  if (result.code !== 0) return `⚠ cleanup didn't finish (${what} carries on):\n${result.out.trim().split(/\r?\n/).slice(-3).map(l => `    ${l}`).join('\n')}`
  return result.out.trim()
}

// --- a script's own commit gets the same guards as a commit Claude types (F80, audit §3 #2) ---------------------
// Claude Code's commit hooks only see `git commit` typed in the shell — a commit inside a script slipped past all of
// them. So, with the files already staged, the script asks the same hook files the same question a Bash
// `git commit -m "<message>"` would: guard-git (secrets, F08 code on main, `F08: done` needs STATE + review + full
// check) and commit-typecheck (tsc on staged .ts files). Returns null (go ahead) or the hook's reason.
export function guardCommit(root, message) {
  const subject = String(message).split(/\r?\n/)[0]
  const payload = JSON.stringify({ cwd: root, tool_name: 'Bash', tool_input: { command: `git commit -q -m ${JSON.stringify(subject)}` } })
  for (const hook of ['guard-git.mjs', 'commit-typecheck.mjs']) {
    const result = spawnSync(process.execPath, [join(HOOKS, hook)], { cwd: root, input: payload, encoding: 'utf8', timeout: 200_000 })
    let answer = null
    try { answer = JSON.parse(result.stdout || 'null') } catch { /* no answer = allowed */ }
    const decision = answer?.hookSpecificOutput?.permissionDecision
    if (decision === 'deny' || decision === 'ask') return answer.hookSpecificOutput.permissionDecisionReason
  }
  return null
}

// --- a module's copy in a game is never linted by the game (F112) --------------------------------------------------
// A game's own lint (Vite's eslint: react-refresh ON) tripped on Dev Kit 0.26.0's copy, which the framework's lint (that
// rule OFF) had passed — Goops 2026-10-23. Module code is linted in the framework (install-module step 1), so the
// game's eslint.config ignores every module folder. Where each installer copies a module's code in a game:
export const MODULE_FOLDERS = {
  devkit: ['src/devkit', 'vite-plugins/devkit'], 'ui-kit': ['src/ui/kit'], audio: ['src/audio'], table: ['src/table'], ai: ['src/ai/kit'],
  rooms: ['src/rooms'], saves: ['src/saves'], version: ['src/version'], crashes: ['src/crashes'], emotes: ['src/emotes'],
}
// A module born from the extraction queue (F114) isn't in that list: it names its folders in its own package.json,
// "bmuz": { "folders": ["src/rng"], "check": "rng" } (check = its check:framework id, when it has promise checks).
export function moduleFolders(module) {
  return MODULE_FOLDERS[module] ?? readJson(join(FRAMEWORK, module, 'package.json'))?.bmuz?.folders ?? null
}
export const ESLINT_CONFIGS = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts', 'eslint.config.mts', 'eslint.config.cts']

// Does an ignore entry already cover a folder? 'src/ui/kit', './src/ui/kit/', 'src/ui/kit/**', a parent 'src', '**/kit'.
function ignoreCovers(entry, folder) {
  const e = entry.replace(/^\.\//, '').replace(/(\/\*\*(\/\*)?|\/)$/, '')
  if (!e || e.startsWith('!')) return false
  if (e.startsWith('**/')) { const rest = e.slice(3); return folder === rest || folder.startsWith(`${rest}/`) || folder.endsWith(`/${rest}`) || folder.includes(`/${rest}/`) }
  return folder === e || folder.startsWith(`${e}/`)
}

// The text with every comment and the inside of every string blanked to spaces (same length, line breaks kept), so a
// globalIgnores([ named in a comment, a commented-out old list or a string is never taken for the real one (review fix).
function codeOnly(text) {
  const blank = (s) => s.replace(/[^\r\n]/g, ' ')
  let out = ''
  for (let i = 0; i < text.length;) {
    const c = text[i]
    let end = -1
    if (text.startsWith('//', i)) { end = text.indexOf('\n', i); if (end < 0) end = text.length }
    else if (text.startsWith('/*', i)) { end = text.indexOf('*/', i + 2); end = end < 0 ? text.length : end + 2 }
    if (end >= 0) { out += blank(text.slice(i, end)); i = end; continue }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1
      while (j < text.length && text[j] !== c) j += text[j] === '\\' ? 2 : 1
      j = Math.min(j, text.length) // j = the closing quote (or the end of an unclosed string)
      out += c + blank(text.slice(i + 1, j)) + text.slice(j, j + 1); i = j + 1; continue
    }
    out += c; i++
  }
  return out
}

/** The game's eslint config text + the module's folders → { text, added, refuse }. Only the ONE globalIgnores([...])
 *  list changes, and only by the missing folders, written after its last entry in that entry's quote style: on the
 *  same line for a one-line list, else one per new line in the last entry's indent and the file's own line ending
 *  (CRLF stays CRLF). Every other byte stays. refuse = why the file can't be edited safely (text unchanged), else null. */
export function addEslintIgnores(text, folders) {
  const calls = [...codeOnly(text).matchAll(/\bglobalIgnores\s*\(\s*\[/g)]
  if (calls.length !== 1) return { text, added: [], refuse: calls.length ? 'it has more than one globalIgnores([...])' : 'it has no globalIgnores([...]) list' }
  const open = calls[0].index + calls[0][0].length // just after the [
  const entries = [] // { value, start, end, quote }
  let close = -1
  for (let i = open; i < text.length;) {
    const c = text[i]
    if (c === ']') { close = i; break }
    if (/[\s,]/.test(c)) { i++; continue }
    if (text.startsWith('//', i)) { const nl = text.indexOf('\n', i); i = nl < 0 ? text.length : nl; continue }
    if (text.startsWith('/*', i)) { const end = text.indexOf('*/', i + 2); if (end < 0) break; i = end + 2; continue }
    if (c !== "'" && c !== '"') break // a variable, a spread, a template, a call… — not a plain list to edit safely
    const end = text.indexOf(c, i + 1)
    if (end < 0 || /[\\\n]/.test(text.slice(i + 1, end))) break
    entries.push({ value: text.slice(i + 1, end), start: i, end: end + 1, quote: c })
    i = end + 1
  }
  if (close < 0) return { text, added: [], refuse: 'its globalIgnores([...]) holds more than plain strings and comments' }
  const added = folders.filter(f => !entries.some(e => ignoreCovers(e.value, f)))
  if (!added.length) return { text, added, refuse: null }
  const last = entries.at(-1)
  const quote = last?.quote ?? "'"
  const items = added.map(f => `${quote}${f}${quote}`)
  if (!last) return { text: text.slice(0, open) + items.join(', ') + text.slice(open), added, refuse: null } // [] (a comment inside stays)
  const lineStart = text.lastIndexOf('\n', last.start) + 1
  const indent = text.slice(lineStart, last.start)
  const ownLines = text.slice(open, close).includes('\n') && !/\S/.test(indent)
  if (!ownLines) return { text: text.slice(0, last.end) + items.map(s => `, ${s}`).join('') + text.slice(last.end), added, refuse: null }
  // one entry per line: the rest of the last entry's line (a comma, a // comment) stays where it is
  const lineEnd = Math.min(close, ...[text.indexOf('\n', last.end)].filter(n => n >= 0))
  const rest = text.slice(last.end, lineEnd).replace(/\r$/, '')
  if (!/^\s*,?\s*(\/\/.*)?$/.test(rest)) return { text, added: [], refuse: 'its globalIgnores([...]) has more after its last entry than this script can extend safely' }
  const trailingComma = /^\s*,/.test(rest)
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const newLines = items.map((s, n) => `${eol}${indent}${s}${trailingComma || n < items.length - 1 ? ',' : ''}`).join('')
  return { text: text.slice(0, last.end) + (trailingComma ? '' : ',') + rest + newLines + text.slice(last.end + rest.length), added, refuse: null }
}

// --- the extraction queue (F114, Muzzy only) ------------------------------------------------------------------------
// A game session hands a finished piece to the framework session: one entry per piece in the framework's
// .planning/extractions.md (Muzzy reads it in Obsidian). extract.mjs writes it; guard-edits reads it (frozen files).
// An entry:
//   ## X01 · seeded random numbers
//   - Status: queued | building | released rng@0.1.0 | swapped in 1a2b3c4
//   - Game: games/goops                       (the game's folder under ~/Documents/dev — same on both machines)
//   - Commit: a481eb1                         (the game's commit the files were queued at)
//   - Files: `src/engine/rng.ts`, …
//   - What it does: …
//   - Checks: `npm run test`, `npm run build` (the game's own scripts that prove it, run unchanged at the swap)
//   - Added: 2026-10-24
//   - Fixes while frozen: none | then one "  - <date> — <what>" line each
// Any other line inside an entry (Muzzy's notes) is kept where the entry ends.
export const DEV = process.env.BMUZ_DEV || join(homedir(), 'Documents', 'dev')
export const queuePath = () => join(FRAMEWORK, '.planning', 'extractions.md')
const QUEUE_HEAD = [
  '# Extraction queue',
  '',
  'Finished game pieces waiting to become framework modules (F114 — Muzzy only). One entry per piece.',
  'Written by `node ~/.claude/config/bmuz/scripts/extract.mjs` (add · list · status · fix · swap) — the words of an entry can be edited by hand.',
  'Status: queued → building → released <module>@<version> → swapped. While an entry is open, its files in the game get bug fixes only (each one logged under "Fixes while frozen").',
]
const QUEUE_FIELDS = [['status', 'Status'], ['game', 'Game'], ['commit', 'Commit'], ['files', 'Files'], ['what', 'What it does'], ['checks', 'Checks'], ['added', 'Added']]
const listOf = (value) => value.split(',').map(s => s.replace(/`/g, '').replace(/^\s*npm run\s+/, '').trim()).filter(Boolean)

/** The queue file's text → { head: [lines before the first entry], entries: [{ id, name, status, game, commit, files[],
 *  what, checks[], added, fixes[], notes[] }], eol }. */
export function parseQueue(text) {
  const eol = (text || '').includes('\r\n') ? '\r\n' : '\n'
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n')
  const head = []
  const entries = []
  let entry = null
  let inFixes = false
  for (const line of lines) {
    const title = line.match(/^## (X\d+)\s*·?\s*(.*)$/)
    if (title) {
      entry = { id: title[1], name: title[2].trim(), status: '', game: '', commit: '', files: [], what: '', checks: [], added: '', fixes: [], notes: [] }
      entries.push(entry); inFixes = false; continue
    }
    if (!entry) { head.push(line); continue }
    const fix = inFixes && line.match(/^\s+- (.+)$/)
    if (fix) { entry.fixes.push(fix[1].trim()); continue }
    inFixes = false
    if (/^- Fixes while frozen:/.test(line)) { inFixes = true; continue }
    const field = QUEUE_FIELDS.find(([, label]) => line.startsWith(`- ${label}:`))
    if (!field) { entry.notes.push(line); continue }
    const value = line.slice(field[1].length + 3).trim()
    entry[field[0]] = field[0] === 'files' || field[0] === 'checks' ? listOf(value) : value
  }
  while (head.length && head.at(-1) === '') head.pop()
  for (const e of entries) while (e.notes.length && e.notes.at(-1).trim() === '') e.notes.pop()
  return { head, entries, eol }
}

/** The queue back to text — the head and Muzzy's own lines kept, the file's line ending kept. */
export function writeQueue({ head, entries, eol = '\n' }) {
  const out = [...(head.length ? head : QUEUE_HEAD), '']
  for (const e of entries) {
    out.push(`## ${e.id} · ${e.name}`,
      `- Status: ${e.status}`, `- Game: ${e.game}`, `- Commit: ${e.commit}`,
      `- Files: ${e.files.map(f => `\`${f}\``).join(', ')}`,
      `- What it does: ${e.what}`,
      `- Checks: ${e.checks.map(c => `\`npm run ${c}\``).join(', ')}`,
      `- Added: ${e.added}`,
      `- Fixes while frozen:${e.fixes.length ? '' : ' none'}`, ...e.fixes.map(f => `  - ${f}`),
      ...e.notes, '')
  }
  return out.join(eol)
}

export const readQueue = () => parseQueue(existsSync(queuePath()) ? readFileSync(queuePath(), 'utf8') : '')
export const statusWord = (entry) => (entry.status.split(/\s+/)[0] || '').toLowerCase()
export const isOpenEntry = (entry) => statusWord(entry) !== 'swapped'
export const nextExtractionId = (entries) => `X${String(Math.max(0, ...entries.map(e => Number(e.id.slice(1)))) + 1).padStart(2, '0')}`

// The game folder as the queue names it: its path under ~/Documents/dev with forward slashes (null when outside it).
export function gameName(dir) {
  const rel = relative(DEV, resolve(dir)).split('\\').join('/')
  return !rel || rel.startsWith('..') || /^[a-zA-Z]:/.test(rel) ? null : rel
}

// The open entry (not swapped) a game file belongs to, or null. Windows paths match whatever their case.
export function frozenEntry(entries, filePath) {
  const name = gameName(filePath)
  if (!name) return null
  const same = process.platform === 'win32' ? (a, b) => a.toLowerCase() === b.toLowerCase() : (a, b) => a === b
  return entries.find(e => isOpenEntry(e) && e.game && e.files.some(f => same(`${e.game}/${f}`, name))) || null
}
