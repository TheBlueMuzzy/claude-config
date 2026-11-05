export default {
  id: 'PL20',
  name: 'plan.typed-scoped',
  what: 'Every open feature in a live milestone has a type (❓ 🧱 🎮 ✨ 🔧 🐞) and a scope ("— must:<stage>" / "— should" / "— could")',
  why: 'Every live feature says what kind it is and how much it matters — "typed, scoped" (F80)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ roadmap, add }) {
    for (const m of roadmap.milestones.filter(m => !m.released)) {
      for (const item of m.items.filter(i => i.id && !['done', 'wont'].includes(i.state.key))) {
        if (!item.type) add('ROADMAP.md', item.lineNo, `${item.id} has no type — put ❓ 🧱 🎮 ✨ 🔧 or 🐞 right after the ID`)
        if (!item.scope && item.type !== '❓') add('ROADMAP.md', item.lineNo, `${item.id} has no scope — end the line with "— must:<stage>" / "— should" / "— could" (then "· needs: …")`)
      }
    }
  },
}
