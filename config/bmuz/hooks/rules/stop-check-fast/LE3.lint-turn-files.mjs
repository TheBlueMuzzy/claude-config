import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { readTurn, isFileEdit } from '../../lib.mjs'
import { CODE, findLintRoot, findLocalEslint, whereIn, eslintErrors, errorLines } from '../lint-edit/_lint.mjs'

export default {
  id: 'LE3',
  name: 'lint.turn-files',
  what: 'When a turn ends, runs each project\'s own ESLint once on every code file Claude edited this turn, and sends Claude back with the errors (unused names, prefer-const… — LE1 already said parse errors and undefined names at edit time)',
  why: 'Lint after every edit fired 724 times in 17 days; 326 were an import added a moment before its use, fixed by the very next edit (audit 2026-11). Checking the rest once, when the edits are finished, keeps every real catch without the mid-edit noise (F185)',
  on: true,
  mode: 'block',
  tests: 'lint-edit',
  // returns the send-back text, or nothing
  check(_, { input }) {
    if (!input.transcript_path) return undefined
    const files = [...new Set(readTurn(input.transcript_path).tools.filter(isFileEdit)
      .map(tool => tool.input.file_path).filter(file => file && CODE.test(file)).map(file => resolve(file)))].filter(existsSync)
    const byRoot = new Map()
    for (const path of files) {
      const root = findLintRoot(path)
      if (!root || !whereIn(root, path)) continue
      byRoot.set(root, [...(byRoot.get(root) || []), path])
    }
    const errors = []
    for (const [root, paths] of byRoot) {
      const eslint = findLocalEslint(root)
      if (eslint) errors.push(...eslintErrors(root, eslint, paths))
    }
    if (!errors.length) return undefined
    return `ESLint found ${errors.length} error${errors.length === 1 ? '' : 's'} in the files you edited this turn (the project's own lint rules) — fix them before handing back:\n${errorLines(errors, 20)}`
  },
}
