import { isOpenBug } from '../../../templates/ppp/plan-reader.mjs'

export default {
  id: 'PL25',
  name: 'plan.fix-has-guard',
  what: 'A fixed P0/P1 has a "Guarded by: <test>" line',
  why: 'A P0/P1 fix needs a test that keeps it fixed — "we fixed this before and it\'s back" (F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ bugs, add }) {
    for (const bug of bugs) {
      if (!isOpenBug(bug) && /fixed|verified/i.test(bug.status) && /P[01]/.test(bug.priority) && !/Guarded by:/i.test(bug.rest)) {
        add('BUGS.md', bug.lineNo, `${bug.id} (${bug.priority}) is fixed but has no "Guarded by: <test>" — a P0/P1 fix needs a test that keeps it fixed`)
      }
    }
  },
}
