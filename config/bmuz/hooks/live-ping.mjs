// Is the live game up? (F82) — session-start.sh runs this in a project folder every session.
//   node ~/.claude/config/bmuz/hooks/live-ping.mjs [projectDir]
// Reads STATE's `Live: https://…` page and the room server (`Rooms:` line, or the *.workers.dev host on the Release /
// Server line), asks both at once, and prints one line per one that is DOWN. Nothing printed when they're up, when
// nothing is hosted, when this machine is offline, or when an answer takes longer than 3 seconds (BMUZ_PING_MS) —
// a slow connection isn't proof the site is down, and session start must never wait on it.
// Muzzy 2026-10-20 (gap rank 1): a live game that's broken and nobody notices hurts a solo designer most.
import { lookup } from 'node:dns/promises'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { askAddress, liveUrl, roomsHealthUrl } from './lib.mjs'

const dir = resolve(process.argv[2] || '.')
let state
try { state = readFileSync(join(dir, '.planning', 'STATE.md'), 'utf8') } catch { process.exit(0) } // not a BMUZ project
// nothing hosted on purpose (a library, not set up, blocked) → nothing to ask
const release = (state.match(/^[- \t]*\*{0,2}Release:\*{0,2}[ \t]*([^\n]*)/m) || [])[1] || ''
if (/^(none|not set up)\b/i.test(release.trim()) || /blocked\s*:/i.test(release)) process.exit(0)

const waitMs = Number(process.env.BMUZ_PING_MS || 3000)
const checks = [
  { what: 'the live site', url: liveUrl(state), health: false },
  { what: 'the room server', url: roomsHealthUrl(state), health: true },
].filter(c => c.url)
if (!checks.length) process.exit(0)

// No process.exit from here on: Node 24 on Windows aborts (UV_HANDLE_CLOSING) when it lands right after fetches
const answers = await Promise.all(checks.map(c => askAddress(c.url, waitMs, { health: c.health })))
const isDown = ({ status, room }) => status !== 'slow' && (room ? room === 'down' : !(typeof status === 'number' && status < 400))
let down = checks.map((c, i) => ({ ...c, answer: answers[i].status, gone: isDown(answers[i]) })).filter(c => c.gone)

// A network error could just mean this machine is offline: if a well-known name doesn't resolve either, say nothing
if (down.some(c => typeof c.answer !== 'number' && !/^no such server/.test(c.answer))) {
  const online = await Promise.race([
    lookup(process.env.BMUZ_ONLINE_PROBE || 'github.com').then(() => true, () => false),
    new Promise(r => setTimeout(() => r(false), 1000).unref()),
  ])
  if (!online) down = []
}

for (const c of down) {
  const why = typeof c.answer === 'number' ? `HTTP ${c.answer}` : /^no such server/.test(c.answer) ? c.answer : c.answer === 'ENOTFOUND' ? 'the address no longer exists' : `no answer: ${c.answer}`
  const fix = c.what === 'the room server' ? 'npm run party:deploy, then live-check.mjs' : 'live-check.mjs to look closer · rollback.mjs if the last release broke it'
  console.log(`⚠ ${c.what.replace(/^t/, 'T')} is DOWN — ${c.url} (${why}). Tell Muzzy first thing; ${fix}.`)
}
