export default {
  id: 'PL18',
  name: 'plan.released-open',
  what: 'An open feature inside a released (✅) milestone → "move it to Later" (or the milestone that will build it)',
  why: 'Anything still open in a released milestone hides from /roadmap\'s "what\'s left" (framework 2026-10-26: 8 parked features sat in released v0.8 / v0.10 and the roadmap view said "that\'s all")',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ roadmap, add }) {
    for (const milestone of roadmap.milestones.filter(m => m.released)) {
      for (const item of milestone.items.filter(i => i.id && i.state.key !== 'done')) {
        const name = (item.title || '').split(' — ')[0].split(': ')[0]
        add('ROADMAP.md', item.lineNo, `${item.id} — ${name} is still ${item.state.label} inside a released milestone (${milestone.name.split(/\s+✅/)[0].trim()}) — move it to Later (or the milestone that will build it), so it shows as open`)
      }
    }
  },
}
