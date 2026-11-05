export default {
  id: 'HC8',
  name: 'text.no-your-game',
  what: 'Never "your game" in any answer in a game project (quoted is fine) — the game\'s name, "the game", or "the game you played on <date>"',
  why: 'Muzzy, 2026-10-07: "this entire thing is \'my game\'"',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  check({ message }) {
    if (/(^|[^"'“‘`\w])your game\b(?!["'”’`])/i.test(message)) return 'Never say "your game" (Muzzy, 2026-10-07: "this entire thing is \'my game\'") — say the game\'s name, "the game", or "the game you played on <date>". Rewrite that line.'
  },
}
