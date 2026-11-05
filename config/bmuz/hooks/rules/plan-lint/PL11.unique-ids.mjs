export default {
  id: 'PL11',
  name: 'plan.unique-ids',
  what: 'A feature id (ROADMAP) or bug id (BUGS) used twice',
  why: 'IDs are permanent and unique — everything else points at them (PROJECT-FILES, F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ roadmap, bugs, add }) {
    if (roadmap) {
      const first = {}
      for (const item of [...roadmap.allItems, ...roadmap.parking].filter(i => i.id)) {
        if (first[item.id]) add('ROADMAP.md', item.lineNo, `${item.id} is used twice (also line ${first[item.id].lineNo}) — IDs are permanent and unique`)
        else first[item.id] = item
      }
    }
    if (bugs) {
      const seen = {}
      for (const bug of bugs) {
        if (seen[bug.id]) add('BUGS.md', bug.lineNo, `${bug.id} is used twice (also line ${seen[bug.id]})`)
        seen[bug.id] = bug.lineNo
      }
    }
  },
}
