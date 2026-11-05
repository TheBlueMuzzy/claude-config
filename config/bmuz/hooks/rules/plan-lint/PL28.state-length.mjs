import { stateSections } from './_state.mjs'

export default {
  id: 'PL28',
  name: 'plan.state-short',
  what: 'STATE.md stays under ~120 lines',
  why: 'STATE is read at every session start — short is what makes it useful (PROJECT-FILES, F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ text, add }) {
    const { lines } = stateSections(text)
    if (lines.length > 120) add('STATE.md', null, `STATE is ${lines.length} lines — keep it under ~120 (prune Key facts, move old Log lines to archive/log.md)`)
  },
}
