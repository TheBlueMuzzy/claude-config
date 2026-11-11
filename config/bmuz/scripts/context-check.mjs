#!/usr/bin/env node
// How full is this chat, and should an auto run start another feature? (Muzzy, 2026-11-11: "check between sprints for
// what % tokens we've used, and determine if we should exit auto mode or continue")
// Reads the % the status line writes to ~/.claude/ctx/<session>.txt ("<pct> <session> <time>"); sessions compact at
// about 60 % (SM2's audit). Usage: node context-check.mjs [session-id]   (no id → the most recently updated session)
// Prints one line: "Context 28% — keep going: …" and exits 0 (keep going), 1 (wrap up), 2 (unknown).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const DIR = process.env.BMUZ_CTX_DIR || join(homedir(), '.claude', 'ctx')
const KEEP_GOING_BELOW = 45 // room for another feature (a feature with fresh helpers has cost ~5% of the main chat)
const WRAP_UP_AT = 52 // close enough to the ~60% compaction that the next feature would likely cross it

function newestSession() {
  if (!existsSync(DIR)) return null
  const files = readdirSync(DIR).filter(f => f.endsWith('.txt'))
    .map(f => ({ f, t: statSync(join(DIR, f)).mtimeMs })).sort((a, b) => b.t - a.t)
  return files[0] ? files[0].f.replace(/\.txt$/, '') : null
}

const session = process.argv[2] || newestSession()
const file = session && join(DIR, `${session}.txt`)
if (!file || !existsSync(file)) {
  console.log('Context: unknown (the status line has written nothing for this session) — keep going, and /save after each feature.')
  process.exit(2)
}
const pct = parseInt(readFileSync(file, 'utf8'), 10)
const ageMin = Math.round((Date.now() - statSync(file).mtimeMs) / 60000)
const stale = ageMin > 30 ? ` (last updated ${ageMin} min ago)` : ''

if (Number.isNaN(pct)) {
  console.log(`Context: unknown (couldn't read ${file}) — keep going, and /save after each feature.`)
  process.exit(2)
}
if (pct < KEEP_GOING_BELOW) {
  console.log(`Context ${pct}%${stale} — keep going: room for the next feature (chats compact at about 60%).`)
  process.exit(0)
}
if (pct < WRAP_UP_AT) {
  console.log(`Context ${pct}%${stale} — keep going, carefully: /save first, write the next feature's brief so a fresh chat could run it, and check again after it.`)
  process.exit(0)
}
console.log(`Context ${pct}%${stale} — wrap up: finish the feature in hand, /save with a full RESUME HERE. Muzzy here → stop auto mode and suggest /clear, then "keep going". Muzzy away → carry on: the plan files hold everything, and a compaction loses nothing written down.`)
process.exit(1)
