import { readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { git } from '../../lib.mjs'
import { projectRoots } from './_shared.mjs'

export default {
  id: 'HC11',
  name: 'roadmap.idea-landed',
  what: 'A message saying "Noted in the roadmap\'s Ideas" needs a line dated today under "## Ideas" in a ROADMAP.md that changed this turn — else sent back to add it (and read it back) or take the words back',
  why: 'CLAUDE.md: say "Noted in the roadmap\'s Ideas." only after reading the line back from the file — framework sprint 23: an edit missed its spot in a CRLF file, said nothing, and the idea was lost. A rule only Claude remembered → a hook (audit 2026-11 §5 #2, F185)',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  check({ turn, message }, { input }) {
    if (!/noted in the roadmap'?s ideas/i.test(message.replace(/[’‘]/g, "'"))) return undefined
    const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, this machine's day
    const since = turn.startedAt ? Date.parse(turn.startedAt) - 5_000 : 0
    const top = input.cwd && git(input.cwd, 'rev-parse', '--show-toplevel')
    const roots = new Set([...(top ? [resolve(top)] : []), ...projectRoots(turn)])
    for (const root of roots) {
      const file = join(root, '.planning', 'ROADMAP.md')
      try {
        if (statSync(file).mtimeMs < since) continue // not changed this turn
        if (ideaLines(readFileSync(file, 'utf8')).some(line => line.includes(today))) return undefined
      } catch { /* no roadmap there */ }
    }
    return `You wrote "Noted in the roadmap's Ideas", but no line dated ${today} landed under "## Ideas" in a ROADMAP.md this turn. Add it (\`- ${today} — <the idea>\`), read the line back from the file, then say it — or take the words back.`
  },
}

// The lines under a "## …Ideas…" heading, up to the next "## " heading (CRLF-safe)
function ideaLines(text) {
  const lines = text.split(/\r?\n/)
  const at = lines.findIndex(l => /^##\s.*\bIdeas\b/i.test(l))
  if (at < 0) return []
  const end = lines.findIndex((l, i) => i > at && /^## /.test(l))
  return lines.slice(at + 1, end < 0 ? undefined : end)
}
