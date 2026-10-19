// Every piece of work is handed to Muzzy the same way (F73). Global Stop hook.
// If Claude did work this turn (edited a file or committed), its last message must be the hand-off card from
// templates/handoff.md — or, while work is still running, the standard progress line. Missing → sent back until it's
// there (up to 3 times in a row — lib.stopVerdict, F80). Turns that only answer questions are left alone. The card's
// labels are read from the template, so editing the template changes the check.
// F80 — what the card used to leave to memory, now checked too:
//  - a local link under **Try it:** (localhost / LAN IP) must answer — "start the servers, curl them" (/develop §4);
//  - a turn that changed how the game looks (src/**/*.tsx|css…) took a screenshot, or **Proof:** says "no visual change";
//  - a finished feature with a `why:` line (ROADMAP) ends with its feel question "Did … feel …?" (/develop §4);
//  - a sprint archived this turn → the report opens with "Sprint NN — <goal>" (CLAUDE.md, 2026-10-07);
//  - never "your game" — any turn (Muzzy, 2026-10-07: "this entire thing is 'my game'").
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readInput, readTurn, isCommit, isFileEdit, stopVerdict, git, gitCalls, commitMessage } from './lib.mjs'
import { readRoadmap, readSprint } from '../templates/ppp/plan-reader.mjs'

const TEMPLATE = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'handoff.md')
const LOCAL_LINK = /https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?[^\s)<>`'"]*/g

const input = readInput()
if (!input.transcript_path || !existsSync(input.transcript_path)) process.exit(0)

const turn = readTurn(input.transcript_path)
const message = (input.last_assistant_message ?? turn.lastText ?? '').trim()
const worked = turn.tools.some(tool => isFileEdit(tool) || isCommit(tool))
const problems = []
if (worked && !isProgressLine(message)) {
  const missing = [...cardProblems(message)]
  if (missing.length) problems.push(`You did work this turn, so end with the hand-off card (~/.claude/config/bmuz/templates/handoff.md) — or, if work is still running, the progress line. Missing: ${missing.join('; ')}. Rewrite your final message in that format now (same content, nothing new to do).`)
  else problems.push(...await deeperProblems(message))
}
// only in a game project (PC help like "open your game library in Steam" isn't about Muzzy's game); quoted is fine
const top = input.cwd && git(input.cwd, 'rev-parse', '--show-toplevel')
const inProject = top && existsSync(join(top, '.planning'))
if (inProject && /(^|[^"'“‘`\w])your game\b(?!["'”’`])/i.test(message)) problems.push('Never say "your game" (Muzzy, 2026-10-07: "this entire thing is \'my game\'") — say the game\'s name, "the game", or "the game you played on <date>". Rewrite that line.')
stopVerdict('handoff-check', input, problems.length && problems.join('\n\n'))
process.exit(0)

// What the card is missing, judged against the template's labels.
function* cardProblems(text) {
  const labels = templateLabels()
  if (!/^##\s+\S.*\s[—-]\s+\S/m.test(text)) yield 'a "## <what> — ready for you to check" heading'
  for (const label of labels) {
    if (!new RegExp(`\\*\\*${escape(label)}:?\\*\\*:?`, 'i').test(text)) yield `**${label}:**`
  }
  const next = section(text, 'Next')
  if (next !== null && !/`?\/[a-z][\w-]*`?.*\s[—-]\s+\S/i.test(next)) yield 'a **Next:** line with `/command` — what it will cover'
  const tryIt = section(text, 'Try it')
  if (tryIt !== null && !/https?:\/\/|nothing to try/i.test(tryIt)) yield 'links (http…) under **Try it:** — or "nothing to try: <why>"'
}

// The card is there — now what it promises (F80).
async function deeperProblems(text) {
  const out = []
  // 1. local links answer
  // (a link ending a sentence or a list item — "…:5173, phone …" — loses its trailing punctuation first)
  const links = [...new Set(((section(text, 'Try it') || '').match(LOCAL_LINK) || []).map(link => link.replace(/[.,;:!?*]+$/, '')))].slice(0, 6)
  const dead = (await Promise.all(links.map(async link => (await answers(link)) ? null : link))).filter(Boolean)
  if (dead.length) out.push(`These links under **Try it:** don't answer: ${dead.join(', ')}. Start the servers they need the way /play does (dev server with --host, plus the online server if it's in it), check each link answers, then hand off — Muzzy clicks them next.`)
  // 2. a visual change was looked at
  const visual = turn.tools.filter(t => isFileEdit(t) && /[\\/]src[\\/].*\.(tsx|jsx|css|scss|vue|svelte)$/i.test(t.input.file_path || '')).map(t => t.input.file_path)
  const looked = turn.tools.some(t => /screenshot/i.test(t.name) || ((t.name === 'Bash' || t.name === 'PowerShell') && /screenshot|playwright|e2e|check:full|check:framework|shots/i.test(t.input.command || '')) || (t.name === 'Agent' && /screenshot/i.test(t.input.prompt || '')))
  if (visual.length && !looked && !/no visual change/i.test(section(text, 'Proof') || '')) {
    out.push(`You changed how the game looks (${visual.slice(0, 2).map(f => f.split(/[\\/]/).pop()).join(', ')}) but took no screenshot this turn. Open it in Playwright, screenshot it at phone and desktop size, look at it yourself and describe it under **Proof:** — or, if nothing on screen changed, write "no visual change" there.`)
  }
  // 3. + 4. the plan says what this hand-off needs
  for (const root of projectRoots()) {
    const roadmap = readPlan(root, 'ROADMAP.md')
    const sprint = readPlan(root, 'SPRINT.md')
    if (roadmap && sprint) {
      const { byId } = readRoadmap(roadmap)
      for (const feature of readSprint(sprint).features) {
        const item = byId[feature.id]
        const mine = feature.steps.filter(s => /^🤖/.test(s.text))
        const built = mine.length && mine.every(s => s.done)
        if (!built || !item?.why || item.state.key === 'done' || !new RegExp(`\\b${feature.id}\\b`).test(text)) continue
        if (!/\bdid\b[^?\n]*\bfeel\b[^?\n]*\?/i.test(text)) out.push(`${feature.id} is built and its ROADMAP line has a "why:" (${item.why.slice(0, 80)}) — end the card with its one feel question, in players' words: "Did <moment> feel like <target>?" (/develop §4). His answer goes into SPRINT Notes.`)
      }
    }
  }
  const archived = turn.tools.some(t => (t.name === 'Bash' || t.name === 'PowerShell') && (/archive-sprint\.mjs/.test(t.input.command || '') || gitCalls(t.input.command || '', t.cwd).some(c => c.sub === 'commit' && /^Sprint \d+ done\b/i.test(commitMessage(t.input.command, c.args)))))
  if (archived && !/^\W*Sprint \d+\s+[—-]\s+\S/im.test(text)) out.push('A sprint was archived this turn, so the report opens with its header (CLAUDE.md, 2026-10-07): "Sprint NN — <its goal in plain words>", then each feature as ID + what it was meant to do, then what was built (new code / content / tests) vs only measured or researched — before the results.')
  return out
}

// The projects this turn worked in: where it edited files and where it committed.
function projectRoots() {
  const roots = new Set()
  const add = (dir) => { const top = dir && git(dir, 'rev-parse', '--show-toplevel'); if (top) roots.add(resolve(top)) }
  for (const t of turn.tools) {
    if (isFileEdit(t) && t.input.file_path) add(dirname(resolve(t.cwd || '.', t.input.file_path)))
    if (isCommit(t)) for (const c of gitCalls(t.input.command, t.cwd)) if (c.sub === 'commit') add(c.dir)
  }
  return roots
}

function readPlan(root, name) {
  try { return readFileSync(join(root, '.planning', name), 'utf8').replace(/\r\n/g, '\n') } catch { return null }
}

// Does a local link answer at all (any HTTP status)? A refused connection or 3 s of silence = no.
async function answers(link) {
  try {
    await fetch(link, { signal: AbortSignal.timeout(3000), redirect: 'manual' })
    return true
  } catch {
    return false
  }
}

function templateLabels() {
  try {
    const card = readFileSync(TEMPLATE, 'utf8').split('## The card')[1]?.split('```')[1] ?? ''
    const labels = [...card.matchAll(/\*\*([^*:]+):\*\*/g)].map(m => m[1].trim())
    if (labels.length) return labels
  } catch { /* template missing — fall back */ }
  return ['Done', "You'll see", 'Try it', 'Proof', 'Questions', 'Next']
}

// The text after **Label:** up to the next **Label:** (or the end); null when the label isn't there.
function section(text, label) {
  const match = text.match(new RegExp(`\\*\\*${escape(label)}:?\\*\\*:?([\\s\\S]*?)(?=\\n\\s*\\*\\*[^*\\n]+:?\\*\\*|$)`, 'i'))
  return match ? match[1] : null
}

function isProgressLine(text) {
  return /[█░]{10}\s+\d{1,3}%\s+·\s+\d+\/\d+[^\n]*·[^\n]*left[^\n]*·\s*posted\s+\d{1,2}:\d{2}\s*(AM|PM)/i.test(text)
}

function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
