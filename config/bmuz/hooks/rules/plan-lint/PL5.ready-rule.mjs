import { met } from './_lint.mjs'

export default {
  id: 'PL5',
  name: 'plan.ready-rule',
  what: 'A ⏳ waiting feature whose needs are all done → "set it 🟢 ready" (unless its line says it waits on something else)',
  why: 'The ready rule, kept fresh by the hook — /sprint and /roadmap used to "refresh states" from memory (F80)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ roadmap, byId, add }) {
    for (const item of [...roadmap.allItems, ...roadmap.parking]) {
      const featureNeeds = item.needs.filter(n => /^~?F\d+[a-z]?$/.test(n))
      // (a line that says it waits on something else — a note like "when a 3D game needs it", "(needs framework F25)" — stays ⏳)
      // (only a note that says so counts — "· gap rank 1" or "· sprint 13" isn't something it waits for)
      const waitsOnMore = item.notes.some(t => /\bneeds?\b|\bwait|\bwhen\b|\bafter\b|\buntil\b/i.test(t)) || /\bneeds\b|\bwait/i.test(item.title || '')
      if (/^- ⏳/.test(item.raw) && item.id && featureNeeds.length && !waitsOnMore && featureNeeds.every(n => met(n, byId))) {
        add('ROADMAP.md', item.lineNo, `${item.id} is ⏳ waiting, but everything it needs (${featureNeeds.join(', ')}) is done — set it 🟢 ready (ready rule, PROJECT-FILES), or add what else it waits for ("· waits: <what>")`)
      }
    }
  },
}
