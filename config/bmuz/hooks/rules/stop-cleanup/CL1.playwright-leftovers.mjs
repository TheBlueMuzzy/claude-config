import { lstatSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { git } from '../../lib.mjs'

export default {
  id: 'CL1',
  name: 'cleanup.playwright',
  what: 'Deletes a `.playwright-mcp/` folder (the browser tool\'s leftover screenshots/snapshots) in the session\'s folder and its project root. Only that exact folder name, only a real folder (never a link), nothing else',
  why: 'It cluttered games and slipped toward commits (F78)',
  on: true,
  mode: 'action',
  tests: 'stop-cleanup',
  check(_, { input }) {
    const folders = new Set()
    for (const dir of [input.cwd, process.env.CLAUDE_PROJECT_DIR]) {
      if (!dir) continue
      folders.add(resolve(dir))
      const top = git(dir, 'rev-parse', '--show-toplevel')
      if (top) folders.add(resolve(top))
    }
    for (const folder of folders) {
      const leftovers = join(folder, '.playwright-mcp')
      try {
        const info = lstatSync(leftovers)
        if (info.isDirectory() && !info.isSymbolicLink()) rmSync(leftovers, { recursive: true, force: true })
      } catch { /* not there (the usual case) or can't be removed — never block the turn */ }
    }
  },
}
