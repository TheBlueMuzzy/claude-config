// Stop local dev servers properly (F69). On Windows, killing what holds a port only kills the worker
// (wrangler's `workerd`); wrangler starts it again and old servers pile up on the port, answering nothing
// (Glyphtender sprint 25: 4 leftover servers). This ends each server's WHOLE process tree.
//   node ~/.claude/config/bmuz/scripts/stop-servers.mjs <port>      the server listening there (+ its parents: npm, cmd, wrangler)
//   node ~/.claude/config/bmuz/scripts/stop-servers.mjs <name>      every server whose command line has <name> (e.g. wrangler, vite)
//   --dry-run                                                       only list what would stop
// Never stops Claude Code itself, a shell, or anything this script runs inside.
import { run, say, ok, refuse, args } from './lib.mjs'
import { listeners, processes } from '../templates/ports.mjs' // the one who-holds-this-port lookup (check-all's port pre-flight uses it too, F118)

const { words, flags } = args()
const target = words[0]
if (!target) refuse('which port or name?', 'stop-servers.mjs 5173   ·   stop-servers.mjs wrangler')
const SERVERISH = /\b(node|npm|npx|wrangler|workerd|vite|partykit|esbuild)\b|cmd(\.exe)?"?\s+\/d\s+\/s\s+\/c/i
// ("claude" = Claude Code itself — but not a dev server run from a helper's workspace in .claude/worktrees/)
const PROTECTED = /claude(?![\\/]worktrees[\\/])|\\Code\\|code\.exe|bash\.exe|powershell|pwsh|explorer\.exe|WindowsTerminal|mcp|chrome|msedge|firefox/i
// a bare runtime name would match every node process (MCP servers, other sessions' tools) — name the server instead
if (/^(node|npm|npx|cmd|cmd\.exe|node\.exe)$/i.test(target)) refuse(`"${target}" would match far more than a dev server`, 'give the port (stop-servers.mjs 5173) or the server\'s name (wrangler, vite)')

let all
try { all = processes() } catch (error) { refuse(error.message) }
const byPid = new Map(all.map(p => [p.pid, p]))
const mine = new Set() // this script and everything it runs inside
for (let p = byPid.get(process.pid); p && !mine.has(p.pid); p = byPid.get(p.ppid)) mine.add(p.pid)
const stoppable = (p) => p && !mine.has(p.pid) && !PROTECTED.test(p.cmd) && SERVERISH.test(p.cmd)

let seeds
if (/^\d+$/.test(target)) {
  seeds = listeners(Number(target)).map(pid => byPid.get(pid)).filter(Boolean)
  if (!seeds.length) { ok(`nothing is listening on port ${target}`); process.exit(0) }
  const other = seeds.find(p => !stoppable(p))
  if (other) refuse(`port ${target} belongs to something that isn't a dev server: ${other.pid} ${other.cmd.slice(0, 90) || '(a system process)'}`, 'close it yourself if you really mean to')
} else {
  seeds = all.filter(p => p.cmd.toLowerCase().includes(target.toLowerCase()) && stoppable(p))
  if (!seeds.length) { ok(`no server matching "${target}" is running`); process.exit(0) }
}
// climb from each one to the top of its server tree (npm → cmd → node → workerd: stop at the shell above npm)
const roots = new Set()
for (const seed of seeds) {
  let top = seed
  const visited = new Set([seed.pid])
  // a parent must be OLDER than its child — Windows keeps a dead parent's ID, which may now belong to an unrelated process
  const realParent = (p) => { const up = byPid.get(p.ppid); return up && !visited.has(up.pid) && (!up.started || !p.started || up.started <= p.started) ? up : null }
  for (let up = realParent(top); stoppable(up); up = realParent(top)) { top = up; visited.add(up.pid) }
  if (mine.has(top.pid) || PROTECTED.test(top.cmd)) { say(`skipped ${top.pid} (it's part of this session)`); continue }
  roots.add(top)
}
for (const root of roots) say(`${flags.has('--dry-run') ? 'would stop' : 'stopping'} ${root.pid}: ${root.cmd.slice(0, 110)}`)
if (flags.has('--dry-run')) process.exit(0)
for (const root of roots) {
  const result = process.platform === 'win32'
    ? run('taskkill', ['/PID', String(root.pid), '/T', '/F'])
    : run('kill', ['-TERM', `-${root.pid}`])
  if (result.code !== 0 && !/not found|No such process/i.test(result.out)) refuse(`couldn't stop ${root.pid}:\n${result.out.trim()}`)
}
if (/^\d+$/.test(target) && listeners(Number(target)).length) refuse(`port ${target} is still in use after stopping ${roots.size} tree(s)`, 'run this again in a few seconds; if it persists, look at Task Manager for the process')
ok(`stopped ${roots.size} server tree(s)${/^\d+$/.test(target) ? ` — port ${target} is free` : ''}`)
