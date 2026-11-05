import { stateSections } from './_state.mjs'

export default {
  id: 'PL29',
  name: 'plan.where-we-are',
  what: 'STATE has a "## Where we are" section',
  why: 'Stage · sprint · doing — what session start shows (F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ text, add }) {
    if (!stateSections(text).section(/^## Where we are/)) add('STATE.md', null, 'no "## Where we are" section')
  },
}
