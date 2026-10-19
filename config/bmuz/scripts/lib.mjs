// Shared helpers for the BMUZ scripts (F69). A script does one fragile job from start to end, or refuses with a
// plain-words reason before it changes anything — never half-finished. Plain Node, no packages (PC + laptop).
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { git, codeFingerprint } from '../hooks/lib.mjs'
export { git, NEVER_COMMIT } from '../hooks/lib.mjs'

const HOOKS = join(import.meta.dirname, '..', 'hooks')

// The framework checkout (tests point this at a fake one).
export const FRAMEWORK = process.env.BMUZ_FRAMEWORK || join(homedir(), 'Documents', 'dev', 'framework')

// Run a command; returns { code, out } with stdout + stderr together. Never throws.
export function run(command, args, { cwd = process.cwd(), timeout = 600_000 } = {}) {
  const shell = process.platform === 'win32' && /^(npm|npx)$/.test(command) // npm is npm.cmd on Windows
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout, shell, stdio: ['ignore', 'pipe', 'pipe'] })
  return { code: result.status ?? 1, out: `${result.stdout || ''}${result.stderr || ''}${result.error ? String(result.error.message) : ''}` }
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
export function hasChecksWorkflow(root) {
  const dir = join(root, '.github', 'workflows')
  if (!existsSync(dir)) return false
  return readdirSync(dir).filter(f => /\.ya?ml$/i.test(f)).some(f => /^name:\s*["']?Checks["']?\s*$/m.test(readFileSync(join(dir, f), 'utf8')))
}

// Did GitHub's Checks run pass for this commit? (F70 — /deliver won't merge or release red or unchecked work.)
// Returns { verdict: 'green' | 'red' | 'warn', text, fix, url }. 'warn' = can't tell (no workflow, no gh, not logged
// in): it never blocks, it says how to fix it. 'red' also covers "still running" and "never checked".
export function checksVerdict(root, { commit, branch } = {}) {
  const short = (commit || '').slice(0, 7)
  if (!hasChecksWorkflow(root)) {
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
// .gitignore lines on every save — those never need a re-check or a re-review).
export const isCode = (f) => !!f && !f.startsWith('.planning/') && !/\.md$/i.test(f) && f !== 'version.json' && f !== '.gitignore'

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
    if (existsSync(record) && readFileSync(record, 'utf8').trim() === fingerprint) return [{ name: 'check:fast', ok: true, cached: true, out: '' }]
    const check = run('npm', ['run', 'check:fast'], { cwd: root, timeout: 300_000 })
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
