export default {
  id: 'PL17',
  name: 'plan.feature-name-format',
  what: 'Every open feature is written `F## <type> <Name> — <short description>`, the name 2–6 words (✅ lines keep their old shape)',
  why: 'The name goes with the number everywhere (handoff-check HC2 holds Claude to it) — Muzzy, 2026-10-26: "if you bring up F##, it should instead be F## - High Level Name"',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ roadmap, add }) {
    for (const item of roadmap.allItems) {
      if (!item.id || item.state.key === 'done') continue
      const [name, ...description] = (item.title || '').split(' — ')
      const words = name.trim().split(/\s+/).length
      if (!description.join('').trim()) add('ROADMAP.md', item.lineNo, `${item.id}: write it "${item.id} <type> <Name> — <short description>" — a clear 2–6 word name, then " — ", then what it does (the name goes with ${item.id} everywhere)`)
      else if (words > 8 || /: /.test(name)) add('ROADMAP.md', item.lineNo, `${item.id}: the name "${name.trim().slice(0, 50)}" is too long — keep it 2–6 words and move the rest after " — "`)
    }
  },
}
