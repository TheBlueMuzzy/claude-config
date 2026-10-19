// Session moments (F67): reminders Claude used to have to remember, given at the right moment instead.
// Hooked on UserPromptSubmit (every message from Muzzy) and PostToolUse Bash|PowerShell (after commits — autonomous runs
// send no messages, but they commit after every task).
//  1. Context 80% / 90% full (the status line writes ~/.claude/ctx/<session>.txt) → finish what's in hand, write what a
//     fresh Claude would need into the plan files, /save, keep going. Said once per level per session.
//  2. Muzzy is stopping ("going to bed", "switching machines", "done for now") → /save before he goes.
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { readInput } from './lib.mjs'

const CTX_DIR = process.env.BMUZ_CTX_DIR || join(homedir(), '.claude', 'ctx') // (tests use their own folder)
const LEVELS = [90, 80]
const STOPPING = /\b(going to bed|off to bed|heading to bed|bed ?time|good ?night|switching (machines|computers|to (the|my) (laptop|pc|desktop))|done for (now|today|tonight|the (day|night))|signing off|calling it a (day|night)|that'?s it for (now|today|tonight)|logging off)\b/i

const input = readInput()
const event = input.hook_event_name
const notes = []

// only Muzzy's own words: a helper's report or a background-task notice arrives as a "prompt" too (2026-10-18: a
// review report saying "shutting down" fired this)
const fromMuzzy = !/<(system-reminder|task-notification|agent-message)\b/.test(input.prompt || '')
if (event === 'UserPromptSubmit' && fromMuzzy && STOPPING.test(input.prompt || '')) {
  notes.push('Muzzy says they are stopping or switching machines. If they asked you to keep working while they are away (autonomous mode), keep going and /save after every feature. Otherwise run /save now and confirm "pushed — safe to switch machines."')
}

const isCommit = event === 'PostToolUse' && /\bgit\b[^\n]*\bcommit\b/.test(input.tool_input?.command || '')
if (event === 'UserPromptSubmit' || isCommit) {
  const level = contextLevel(input.session_id)
  if (level) {
    notes.push(`Context is ${level.pct}% full (checkpoint at ${level.at}%). Finish and commit what's in hand, then a quick sweep: anything a fresh Claude would get wrong or have to re-ask Muzzy (an unrecorded decision, Muzzy's exact words on a taste call, an open question, the in-flight plan) goes into SPRINT Notes / STATE / GDD / TDD within their size limits — then /save and keep going. Never rely on remembering something that isn't written down.`)
  }
}

if (notes.length) {
  const text = notes.join('\n\n')
  if (event === 'UserPromptSubmit') process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: text } }))
  else process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text } }))
}
process.exit(0)

// The checkpoint level this session just reached, once per level: { pct, at } or null.
function contextLevel(session) {
  if (!session || !existsSync(CTX_DIR)) return null
  pruneOldFiles()
  let pct
  try { pct = parseInt(readFileSync(join(CTX_DIR, `${session}.txt`), 'utf8'), 10) } catch { return null }
  const said = join(CTX_DIR, `${session}.said`)
  const at = LEVELS.find(level => pct >= level)
  if (!at) { if (existsSync(said)) unlinkSync(said); return null } // after a compact the levels count again
  const already = existsSync(said) ? parseInt(readFileSync(said, 'utf8'), 10) : 0
  if (already >= at) return null
  writeFileSync(said, String(at))
  return { pct, at }
}

// Sessions older than 3 days are over — drop their files.
function pruneOldFiles() {
  const old = Date.now() - 3 * 24 * 3600 * 1000
  for (const name of readdirSync(CTX_DIR)) {
    try { if (statSync(join(CTX_DIR, name)).mtimeMs < old) unlinkSync(join(CTX_DIR, name)) } catch {}
  }
}
