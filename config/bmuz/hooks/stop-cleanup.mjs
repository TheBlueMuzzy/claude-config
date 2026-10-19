// Tidy up at the end of every turn (F78). Global Stop hook. Deletes Playwright's leftover folder `.playwright-mcp/`
// (screenshots + page snapshots the browser tool drops) in the session's folder and its project root — so it never
// clutters the game or slips into a commit. Only that exact folder name, only a real folder (never a link), nothing else.
// Never sends Claude back; runs even when another Stop hook already did.
import { lstatSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { readInput, git } from './lib.mjs'

const input = readInput()
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
process.exit(0)
