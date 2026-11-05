// Running a project's own ESLint — shared by LE1 (after each edit) and LE3 (once at the end of the turn, F185).
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'

export const CODE = /\.(tsx?|jsx?|mjs|cjs)$/
const CONFIGS = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts']
const SKIP_FOLDERS = ['node_modules', 'dist', 'e2e-shots', 'screenshots', 'spike'] // built, downloaded, or throwaway

// The nearest folder above the file with an ESLint flat config and a package.json.
export function findLintRoot(start) {
  let folder = dirname(start)
  while (true) {
    if (CONFIGS.some(name => existsSync(join(folder, name))) && existsSync(join(folder, 'package.json'))) return folder
    const up = dirname(folder)
    if (up === folder) return null
    folder = up
  }
}

// The project's own eslint: node_modules/eslint in the project or a folder above it (the way Node finds packages —
// a helper's worktree without its own node_modules uses the main checkout's).
export function findLocalEslint(start) {
  let folder = start
  while (true) {
    const bin = join(folder, 'node_modules', 'eslint', 'bin', 'eslint.js')
    if (existsSync(bin)) return bin
    const up = dirname(folder)
    if (up === folder) return null
    folder = up
  }
}

// The file's path inside its project ("src/a.ts"), or null when it's in a built / downloaded / throwaway folder.
export function whereIn(root, path) {
  const where = relative(root, path).split('\\').join('/')
  return where.split('/').some(part => SKIP_FOLDERS.includes(part)) ? null : where
}

// ESLint's errors (severity 2) for these files: [{ where, line, column, message, ruleId, fatal }]. [] when ESLint
// itself broke (config, crash, timeout) — not the files' fault.
export function eslintErrors(root, eslint, paths) {
  // Games ignore their framework copies on purpose (they can't be edited there anyway), so their ignores are kept.
  // In a framework checkout nothing is skipped: the framework is the one place its code gets linted.
  const args = [eslint, '--format', 'json', '--no-warn-ignored']
  if (isFramework(root)) args.push('--no-ignore')
  args.push(...paths)
  let output = ''
  try {
    output = execFileSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 20_000 + 2_000 * paths.length, stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (error) {
    if (error.status !== 1) return [] // 2 = ESLint itself broke (config, crash), or the timeout
    output = error.stdout || '' // 1 = a file has errors
  }
  let results = []
  try { results = JSON.parse(output) } catch { return [] }
  return results.flatMap(result => (result.messages || []).filter(m => m.severity === 2).map(m => ({
    where: relative(root, result.filePath).split('\\').join('/'), line: m.line, column: m.column, message: m.message, ruleId: m.ruleId, fatal: m.fatal,
  })))
}

export function errorLines(errors, most = 15) {
  const lines = errors.slice(0, most).map(m => `${m.where}:${m.line ?? '?'}:${m.column ?? '?'}  ${m.message.split('\n')[0]}  (${m.ruleId || 'parse'})`)
  if (errors.length > most) lines.push(`…and ${errors.length - most} more`)
  return lines.join('\n')
}

// The framework root's package.json is named "game-framework" (main checkout and its worktrees alike).
function isFramework(folder) {
  try { return JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8')).name === 'game-framework' } catch { return false }
}
