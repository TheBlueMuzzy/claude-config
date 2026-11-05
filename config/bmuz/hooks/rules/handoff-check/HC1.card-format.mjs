import { templateLabels, section, escape } from './_shared.mjs'

export default {
  id: 'HC1',
  name: 'card.format',
  what: 'A turn that did work (edited or committed) ends with the hand-off card (templates/handoff.md: Done · You\'ll see · Try it · Proof · Your to-dos · Questions · Next `/command` — what it covers) or the progress line; Try it has links, Questions are numbered real questions — sent back up to 3 times in a row',
  why: 'Every hand-off looks the same (Muzzy, 2026-10-18: "I never want to see it any other way going forward!")',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  check({ message }) {
    const missing = [...cardProblems(message)]
    if (missing.length) return `You did work this turn, so end with the hand-off card (~/.claude/config/bmuz/templates/handoff.md) — or, if work is still running, the progress line. Missing: ${missing.join('; ')}. Rewrite your final message in that format now (same content, nothing new to do).`
  },
}

// What the card is missing, judged against the template's labels.
function* cardProblems(text) {
  const labels = templateLabels()
  if (!/^##\s+\S.*\s[—-]\s+\S/m.test(text)) yield 'a "## <what> — ready for you to check" heading'
  for (const label of labels) {
    if (!new RegExp(`\\*\\*${escape(label)}:?\\*\\*:?`, 'i').test(text)) yield `**${label}:**`
  }
  const next = section(text, 'Next')
  // Work still running on its own (a helper mid-feature) → "nothing to type — <what Claude does next>": a bare /command
  // there read as "type this", and Muzzy typed /develop five times to keep things moving (2026-10-30)
  if (next !== null && !/`?\/[a-z][\w-]*`?.*\s[—-]\s+\S|^\s*nothing to type\s*[—-]\s+\S/i.test(next)) yield 'a **Next:** line with `/command` — what it will cover (or, while work keeps going on its own, "nothing to type — <what happens next>")'
  const tryIt = section(text, 'Try it')
  if (tryIt !== null && !/https?:\/\/|nothing to try/i.test(tryIt)) yield 'links (http…) under **Try it:** — or "nothing to try: <why>"'
  const notAsked = notQuestions(section(text, 'Questions'))
  if (notAsked.length) yield `**Questions:** holds only questions ending in "?" (or "none") — move ${notAsked.map(l => `"${l.slice(0, 50)}"`).join(', ')} to **Done:** / **You'll see:** (information) or **Your to-dos:** (something Muzzy does)`
  if (unnumbered(section(text, 'Questions'))) yield '**Questions:** numbered 1. 2. 3. (Muzzy, 2026-10-26: "always number your questions so I can reference them with numbers") — options under each stay indented'
}

// Questions that aren't numbered "1." / "2)" — Muzzy answers by number
function unnumbered(questions) {
  if (questions === null) return false
  const lines = questions.split('\n').filter(l => l.trim() && !/^\s{2,}|^\t/.test(l))
  if (lines.length === 1 && /^\s*([-*•]\s*)?none\b/i.test(lines[0].replace(/[*_`]/g, ''))) return false
  return lines.some(l => !/^\s*\d+[.)]\s/.test(l))
}

// The Questions items that aren't questions (Muzzy, 2026-10-23: "it felt like information… i'm confused by that").
// Each top-level line (a bullet, a numbered item or plain text) must ask something; indented lines under a question
// (its options) are fine.
function notQuestions(questions) {
  if (questions === null) return []
  const lines = questions.split('\n').filter(l => l.trim() && !/^\s{2,}|^\t/.test(l))
  const items = lines.map(l => l.trim().replace(/^([-*•]|\d+[.)])\s*/, ''))
  if (items.length === 1 && /^none\b/i.test(items[0].replace(/[*_`]/g, ''))) return []
  return items.filter(item => !item.includes('?'))
}
