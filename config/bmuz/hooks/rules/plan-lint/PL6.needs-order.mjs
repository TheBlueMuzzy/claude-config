import { met } from './_lint.mjs'

export default {
  id: 'PL6',
  name: 'plan.needs-first',
  what: 'Every `needs:` points at a real feature, and a feature that is 🟢 ready / building / done has everything it needs done first (a soft "~" need only has to work: 🎛️ is enough; two features built in the same sprint are fine)',
  why: 'Never build before what it needs (CLAUDE.md "Respect dependencies", F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ roadmap, byId, add }) {
    for (const item of [...roadmap.allItems, ...roadmap.parking]) {
      for (const need of item.needs) {
        const id = need.replace(/^~/, '')
        const other = byId[id]
        if (!/^F\d+[a-z]?$/.test(id)) continue // "—", another project's feature ("fw F27"), words
        if (!other) { add('ROADMAP.md', item.lineNo, `${item.id || item.title} needs ${id}, but there's no ${id} in the roadmap`); continue }
        // ready / building / done means everything it needs is done (a feature built in the same sprint counts — sprint
        // rule); a soft "~" need only has to work (🎛️ tuning is enough)
        const started = ['develop', 'deliver', 'done'].includes(item.state.key) || /^- 🟢/.test(item.raw)
        const needDone = need.startsWith('~') ? met(need, byId) : other.state.key === 'done'
        const sameSprint = item.state.key === 'develop' && other.state.key === 'develop'
        if (started && !needDone && !sameSprint) add('ROADMAP.md', item.lineNo, `${item.id} is ${item.state.label} but needs ${id}, which is ${other.state.label} — never build before what it needs`)
      }
    }
  },
}
