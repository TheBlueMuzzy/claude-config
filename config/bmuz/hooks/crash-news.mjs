// What broke for players since last time? (framework F89) — session-start.sh runs this in a project folder every session.
//   node ~/.claude/config/bmuz/hooks/crash-news.mjs [projectDir]
// A game whose STATE has a `Crashes: https://…` line (its own crash server, framework crashes module) asks that server
// for its summary since the last session on this machine, and prints ONE line when there's news:
//   🐞 3 new errors from players, 1 came back since last time — `npm run crashes` shows them with real file lines.
// Nothing new → nothing printed. No answer within 3 s (BMUZ_PING_MS), offline, no Crashes line → nothing printed:
// session start must never wait on it. The token lives outside the repo, per machine (never synced, like ~/.config/gws),
// in a file named after the server it opens:
//   ~/.config/bmuz/crashes/<server host>.token   e.g. goops-crashes.muzzy.workers.dev.token, localhost_1995.token
// STATE.md belongs to whatever repo the session is in (a collab's, a cloned stranger's), so the token is found by the
// address itself: a repo pointing at another server finds no token to send (security review, framework v0.11.2).
// https only (http just to this PC); CRASHES_TOKEN in the environment only for a server on this PC.
// The address and token-file rules are the PC command's (framework crashes/scripts/crash-report.mjs serverAddress,
// tokenFile) — keep the two in step. "Last time" is kept beside it: <server host>.seen (the server's clock, in ms).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const dir = resolve(process.argv[2] || '.')
let state
try { state = readFileSync(join(dir, '.planning', 'STATE.md'), 'utf8') } catch { process.exit(0) } // not a BMUZ project
const given = ((state.match(/^[- \t]*\*{0,2}Crashes:\*{0,2}[ \t]*(https?:\/\/[^\s)>,`*]+)/m) || [])[1] || '').replace(/[.,;:'"\]]+$/, '').replace(/\/+$/, '')
if (!given) process.exit(0)

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]']
const url = /^https?:\/\/[A-Za-z0-9.-]+(:\d{1,5})?(\/[A-Za-z0-9._~/-]*)?$/.test(given) ? given : ''
const local = url !== '' && LOCAL_HOSTS.includes(new URL(url).hostname)
if (!url || (!url.startsWith('https://') && !local)) {
  console.log(`🐞 STATE's Crashes: address isn't one a token may go to (https://, plain letters and digits) — not asked.`)
  process.exit(0)
}
const host = new URL(url).host.toLowerCase().replace(':', '_')
const folder = process.env.BMUZ_CRASHES_DIR || join(homedir(), '.config', 'bmuz', 'crashes')
const read = (file) => { try { return readFileSync(join(folder, file), 'utf8').trim() } catch { return '' } }
const token = (local && process.env.CRASHES_TOKEN) || read(`${host}.token`)
if (!token) {
  console.log(`🐞 This project has a crash server (${url}) but this machine has no token for it — put it in ${join(folder, `${host}.token`)} (the one given to wrangler secret put CRASHES_TOKEN).`)
  process.exit(0)
}
const WEEK = 7 * 24 * 3600 * 1000
const seen = Number(read(`${host}.seen`))
const since = Number.isFinite(seen) && seen > 0 ? seen : Date.now() - WEEK // first time on this machine: the last week

// No process.exit from here on: Node 24 on Windows aborts (UV_HANDLE_CLOSING) when it lands right after fetches (live-ping)
let answer = null
try {
  const res = await fetch(`${url}/summary?since=${since}`, {
    headers: { authorization: `Bearer ${token}`, 'cache-control': 'no-cache' },
    redirect: 'error', // the token never follows a redirect to somewhere else
    signal: AbortSignal.timeout(Number(process.env.BMUZ_PING_MS || 3000)),
  })
  if (res.status === 404) console.log(`🐞 The crash server at ${url} didn't accept this machine's token (${join(folder, `${host}.token`)}) — check it matches CRASHES_TOKEN.`)
  else if (res.ok) answer = await res.json()
  else await res.body?.cancel()
} catch { /* slow or offline: say nothing */ }

if (answer && typeof answer === 'object') {
  const count = (n) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0)
  const fresh = count(answer.newKinds)
  const back = count(answer.cameBack)
  const parts = []
  if (fresh) parts.push(`${fresh} new error${fresh === 1 ? '' : 's'} from players`)
  if (back) parts.push(`${back} came back`)
  if (parts.length) console.log(`🐞 ${parts.join(', ')} since last time — \`npm run crashes\` shows them with real file lines. Tell Muzzy first thing.`)
  const now = Number.isFinite(answer.now) && answer.now > 0 ? answer.now : Date.now()
  try {
    mkdirSync(folder, { recursive: true })
    writeFileSync(join(folder, `${host}.seen`), String(Math.floor(now)))
  } catch { /* can't remember: next time repeats the news, which is harmless */ }
}
