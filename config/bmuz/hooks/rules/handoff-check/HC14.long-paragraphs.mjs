const MAX_WORDS = 80

export default {
  id: 'HC14',
  name: 'text.lists-not-paragraphs',
  what: `A paragraph of prose over ~${MAX_WORDS} words in Claude's last message (not a list, table, heading or code) → written to the firing log only; Claude and Muzzy see nothing. Measuring first: it speaks only once the log shows it rarely fires on a fine answer`,
  why: 'Muzzy, 2026-10-23: "reading paragraphs makes me more likely to just approve something so it moves forward… I get overwhelmed with the technical and then blindly trust you" (audit 2026-11 §5 #4 — log-only first, F185)',
  on: true,
  mode: 'log',
  tests: 'handoff-check',
  check({ message }, { log }) {
    const prose = message.replace(/```[\s\S]*?```/g, '').split(/\n\s*\n/)
      .map(p => p.split('\n').filter(l => !/^\s*([-*•>|#]|\d+[.)])\s?/.test(l)).join(' ').trim())
    const long = prose.map(p => ({ p, words: p.split(/\s+/).filter(Boolean).length })).filter(x => x.words > MAX_WORDS)
    if (!long.length) return undefined
    log(`${long.length} paragraph(s) over ${MAX_WORDS} words (longest ${Math.max(...long.map(x => x.words))}): ${long[0].p.slice(0, 120)}`)
    return undefined // log-only: nothing to answer
  },
}
