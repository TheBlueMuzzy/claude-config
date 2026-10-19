// Every piece of work is handed to Muzzy the same way (F73). Global Stop hook.
// If Claude did work this turn (edited a file or committed), its last message must be the hand-off card from
// templates/handoff.md — or, while work is still running, the standard progress line. Missing → sent back once to fix.
// Turns that only answer questions are left alone. The card's labels are read from the template, so editing the
// template changes the check.
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readInput } from './lib.mjs'

const TEMPLATE = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'handoff.md')
const WORK_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])

const input = readInput()
if (input.stop_hook_active) process.exit(0) // already sent back once — never loop
if (!input.transcript_path || !existsSync(input.transcript_path)) process.exit(0)

const turn = thisTurn(input.transcript_path)
if (!turn.didWork) process.exit(0)

const message = (input.last_assistant_message ?? turn.lastText ?? '').trim()
const problems = [...cardProblems(message)]
if (!problems.length || isProgressLine(message)) process.exit(0)

process.stdout.write(JSON.stringify({
  decision: 'block',
  reason: `You did work this turn, so end with the hand-off card (~/.claude/config/bmuz/templates/handoff.md) — or, if work is still running, the progress line. Missing: ${problems.join('; ')}. Rewrite your final message in that format now (same content, nothing new to do).`,
}))
process.exit(0)

// What happened since Muzzy's last message: did Claude edit files or commit? And Claude's last text.
function thisTurn(path) {
  const entries = readFileSync(path, 'utf8').split('\n').filter(Boolean).map(line => {
    try { return JSON.parse(line) } catch { return null }
  }).filter(Boolean)
  let start = 0
  entries.forEach((entry, i) => { if (isPrompt(entry)) start = i })
  let didWork = false
  let lastText = null
  for (const entry of entries.slice(start + 1)) {
    if (entry.type !== 'assistant' || !Array.isArray(entry.message?.content)) continue
    for (const block of entry.message.content) {
      if (block.type === 'text') lastText = block.text
      if (block.type !== 'tool_use') continue
      if (WORK_TOOLS.has(block.name)) didWork = true
      const command = block.input?.command || ''
      if ((block.name === 'Bash' || block.name === 'PowerShell') && /\bgit\b[^\n]*\bcommit\b/.test(command)) didWork = true
    }
  }
  return { didWork, lastText }
}

// A message from Muzzy (or a helper's report) starts a turn; tool results don't.
function isPrompt(entry) {
  if (entry.type !== 'user' || entry.isMeta) return false
  const content = entry.message?.content
  if (typeof content === 'string') return true
  return Array.isArray(content) && content.length > 0 && content.every(block => block.type === 'text')
}

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
