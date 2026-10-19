// Shared helpers for the BMUZ scripts (F69). A script does one fragile job from start to end, or refuses with a
// plain-words reason before it changes anything — never half-finished. Plain Node, no packages (PC + laptop).
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
export { git } from '../hooks/lib.mjs'

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
