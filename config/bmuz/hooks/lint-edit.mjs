// Lint checked the moment a code file changes (F70, layer 1 of 3). Hooked on Edit|Write|MultiEdit (PostToolUse).
// After Claude edits a .ts/.tsx/.js/.jsx/.mjs/.cjs file, find the nearest project with an ESLint setup (a game, or a
// framework checkout / worktree), run THAT project's own eslint on THAT one file, and show Claude the errors.
// Warnings are left out (the games' own `npm run lint` shows them). No local eslint → skip quietly (never downloads).
// Why: framework code was never linted anywhere — games ignore their kit copies — so Dev Kit 0.8.0's errors only
// showed up inside Glyphtender.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { readInput, tellClaude } from './lib.mjs'

const CONFIGS = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts']
const SKIP_FOLDERS = ['node_modules', 'dist', 'e2e-shots', 'screenshots', 'spike'] // built, downloaded, or throwaway

const input = readInput()
const file = input.tool_input?.file_path
if (!file || !/\.(tsx?|jsx?|mjs|cjs)$/.test(file)) process.exit(0)

const path = resolve(file)
const root = findLintRoot(path)
if (!root) process.exit(0) // no ESLint setup above this file
const where = relative(root, path).split('\\').join('/')
if (where.split('/').some(part => SKIP_FOLDERS.includes(part))) process.exit(0)

const eslint = findLocalEslint(root)
if (!eslint) process.exit(0) // not installed here (no `npm install` yet) → nothing to run

// Games ignore their framework copies on purpose (they can't be edited there anyway), so their ignores are kept.
// In a framework checkout nothing is skipped: the framework is the one place its code gets linted.
const args = [eslint, '--format', 'json', '--no-warn-ignored']
if (isFramework(root)) args.push('--no-ignore')
args.push(path)

let output = ''
try {
  output = execFileSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 20_000, stdio: ['ignore', 'pipe', 'pipe'] })
} catch (error) {
  if (error.status !== 1) process.exit(0) // 2 = ESLint itself broke (config, crash), or the timeout — not this file's fault
  output = error.stdout || '' // 1 = the file has errors
}

let results = []
try { results = JSON.parse(output) } catch { process.exit(0) }
const errors = results.flatMap(result => result.messages || []).filter(message => message.severity === 2)
if (errors.length) {
  const lines = errors.slice(0, 15).map(m => `${where}:${m.line ?? '?'}:${m.column ?? '?'}  ${m.message.split('\n')[0]}  (${m.ruleId || 'parse'})`)
  if (errors.length > 15) lines.push(`…and ${errors.length - 15} more`)
  tellClaude(`ESLint found ${errors.length} error${errors.length === 1 ? '' : 's'} in ${where} (the project's own lint rules — fix them now, in this same task):\n${lines.join('\n')}`)
}
process.exit(0)

// The nearest folder above the file with an ESLint flat config and a package.json.
function findLintRoot(start) {
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
function findLocalEslint(start) {
  let folder = start
  while (true) {
    const bin = join(folder, 'node_modules', 'eslint', 'bin', 'eslint.js')
    if (existsSync(bin)) return bin
    const up = dirname(folder)
    if (up === folder) return null
    folder = up
  }
}

// The framework root's package.json is named "game-framework" (main checkout and its worktrees alike).
function isFramework(folder) {
  try { return JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8')).name === 'game-framework' } catch { return false }
}
