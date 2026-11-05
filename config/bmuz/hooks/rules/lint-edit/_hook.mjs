// lint-edit — lint checked the moment a code file changes (F70, layer 1 of 3 → rule files F184).
// After Claude edits a .ts/.tsx/.js/.jsx/.mjs/.cjs file, find the nearest project with an ESLint setup (a game, or a
// framework checkout / worktree), run THAT project's own eslint on THAT one file, and show Claude the errors that can't
// wait: the file doesn't parse, or it uses a name that doesn't exist (LE1). Every other lint error is said once at the
// end of the turn, for all the files the turn edited (stop-check-fast's LE3 — F185).
import { resolve } from 'node:path'
import { CODE, findLintRoot, findLocalEslint, whereIn } from './_lint.mjs'

export default {
  hook: 'lint-edit',
  event: 'PostToolUse',
  matcher: 'Edit|Write|MultiEdit',
  when: 'After Claude edits or writes a code file (.ts, .tsx, .js, .jsx, .mjs, .cjs)',
  order: ['LE2', 'LE1'],

  async run(ctx) {
    const file = ctx.input.tool_input?.file_path
    if (!file || !CODE.test(file)) return
    const path = resolve(file)
    const root = findLintRoot(path)
    if (!root) return // no ESLint setup above this file
    const where = whereIn(root, path)
    if (!where) return
    const eslint = findLocalEslint(root)
    if (!eslint) return ctx.rule('LE2', { root }) // not installed here (no `npm install` yet) → nothing to run
    await ctx.rule('LE1', { root, path, where, eslint })
  },
}
