import { stateSections } from './_state.mjs'

export default {
  id: 'PL30',
  name: 'plan.key-facts-short',
  what: 'STATE\'s Key facts stays ~40 lines (over 50 is flagged)',
  why: 'Stale facts crowd out the ones that matter (F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ text, add }) {
    const facts = stateSections(text).section(/^## Key facts/)
    if (facts && facts.body.length > 50) add('STATE.md', facts.start + 1, `Key facts is ${facts.body.length} lines — ~40 max, prune stale ones`)
  },
}
