export default {
  id: 'PL15',
  name: 'plan.needs-readable',
  what: 'A "needs:" the reader can\'t see — a " — " later in the line hides it; keep "— must · needs: …" last',
  why: 'Scope + needs must come after the line\'s LAST " — ", or the planner page (and the needs checks) can\'t see them (F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ roadmap, add }) {
    for (const item of [...roadmap.allItems, ...roadmap.parking]) {
      if (!item.needs.length && /\bneeds:\s*~?F\d/.test(item.raw)) add('ROADMAP.md', item.lineNo, `${item.id || item.title}: "needs:" isn't read — a " — " later in the line hides it; keep "— must · needs: …" last (use ":" inside notes)`)
    }
  },
}
