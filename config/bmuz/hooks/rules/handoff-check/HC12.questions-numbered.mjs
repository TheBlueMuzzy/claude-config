export default {
  id: 'HC12',
  name: 'text.questions-numbered',
  what: 'Outside the hand-off card (HC1 checks its **Questions:**): 2 or more bulleted lines that ask something (end in "?") → sent back to number them 1. 2. 3., options indented under each',
  why: 'Muzzy, 2026-10-26: "always number your questions so I can reference them with numbers" — the card had a check, other answers didn\'t (audit 2026-11 §5 #3, F185)',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  check({ message }) {
    const text = message
      .replace(/```[\s\S]*?```/g, '') // code isn't questions
      .replace(/\*\*Questions:?\*\*:?[\s\S]*?(?=\n\s*\*\*[^*\n]+:?\*\*|$(?![\s\S]))/i, '') // the card's own section (HC1)
    const asked = text.split('\n').filter(line => /^[-*•]\s+\S.*\?[*_)`"”]*\s*$/.test(line))
    if (asked.length < 2) return undefined
    return `Your questions are bullets, not numbers — Muzzy answers by number (2026-10-26: "always number your questions so I can reference them with numbers"). Rewrite them 1. 2. 3., options indented under each, your pick first: ${asked.slice(0, 3).map(l => `"${l.slice(2, 60).trim()}"`).join(', ')}.`
  },
}
