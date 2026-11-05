// lint-edit — lint checked the moment a code file changes (F70, layer 1 of 3 → rule files F184).
// After Claude edits a .ts/.tsx/.js/.jsx/.mjs/.cjs file, find the nearest project with an ESLint setup (a game, or a
// framework checkout / worktree), run THAT project's own eslint on THAT one file, and show Claude the errors.
import { existsSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'

const CONFIGS = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts']
const SKIP_FOLDERS = ['node_modules', 'dist', 'e2e-shots', 'screenshots', 'spike'] // built, downloaded, or throwaway

export default {
  hook: 'lint-edit',
  event: 'PostToolUse',
  matcher: 'Edit|Write|MultiEdit',
  when: 'After Claude edits or writes a code file (.ts, .tsx, .js, .jsx, .mjs, .cjs)',
  order: ['LE2', 'LE1'],

  async run(ctx) {
    const file = ctx.input.tool_input?.file_path
    if (!file || !/\.(tsx?|jsx?|mjs|cjs)$/.test(file)) return
    const path = resolve(file)
    const root = findLintRoot(path)
    if (!root) return // no ESLint setup above this file
    const where = relative(root, path).split('\\').join('/')
    if (where.split('/').some(part => SKIP_FOLDERS.includes(part))) return
    const eslint = findLocalEslint(root)
    if (!eslint) return ctx.rule('LE2', { root }) // not installed here (no `npm install` yet) → nothing to run
    await ctx.rule('LE1', { root, path, where, eslint })
  },
}

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
