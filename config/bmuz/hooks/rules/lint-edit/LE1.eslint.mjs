import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export default {
  id: 'LE1',
  name: 'lint.syntax-now',
  what: 'Runs the project\'s own ESLint on just the edited file (~1–2 s) and tells Claude its errors, to fix in the same task. Warnings aren\'t repeated. In the framework nothing is skipped; a game keeps skipping its kit copies',
  why: 'Framework code was never linted: games skip their kit copies, so Dev Kit 0.8.0\'s errors only showed up inside Glyphtender (F70)',
  on: true,
  mode: 'block',
  tests: 'lint-edit',
  check({ root, path, where, eslint }, { tell }) {
    // Games ignore their framework copies on purpose (they can't be edited there anyway), so their ignores are kept.
    // In a framework checkout nothing is skipped: the framework is the one place its code gets linted.
    const args = [eslint, '--format', 'json', '--no-warn-ignored']
    if (isFramework(root)) args.push('--no-ignore')
    args.push(path)
    let output = ''
    try {
      output = execFileSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 20_000, stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (error) {
      if (error.status !== 1) return // 2 = ESLint itself broke (config, crash), or the timeout — not this file's fault
      output = error.stdout || '' // 1 = the file has errors
    }
    let results = []
    try { results = JSON.parse(output) } catch { return }
    const errors = results.flatMap(result => result.messages || []).filter(message => message.severity === 2)
    if (!errors.length) return
    const lines = errors.slice(0, 15).map(m => `${where}:${m.line ?? '?'}:${m.column ?? '?'}  ${m.message.split('\n')[0]}  (${m.ruleId || 'parse'})`)
    if (errors.length > 15) lines.push(`…and ${errors.length - 15} more`)
    tell(`ESLint found ${errors.length} error${errors.length === 1 ? '' : 's'} in ${where} (the project's own lint rules — fix them now, in this same task):\n${lines.join('\n')}`)
  },
}

// The framework root's package.json is named "game-framework" (main checkout and its worktrees alike).
function isFramework(folder) {
  try { return JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8')).name === 'game-framework' } catch { return false }
}
