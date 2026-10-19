// Shared helpers for the BMUZ scripts (F69). A script does one fragile job from start to end, or refuses with a
// plain-words reason before it changes anything — never half-finished. Plain Node, no packages (PC + laptop).
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
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
