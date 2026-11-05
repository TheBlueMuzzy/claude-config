import { isOpenBug } from '../../../templates/ppp/plan-reader.mjs'

export default {
  id: 'PL24',
  name: 'plan.bug-section',
  what: 'An open bug sits under ## Open, a fixed one under ## Fixed',
  why: 'The counts and the P0 gate read the sections (F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ bugs, add }) {
    for (const bug of bugs) {
      const open = isOpenBug(bug)
      if (bug.section === 'open' && !open) add('BUGS.md', bug.lineNo, `${bug.id} is "${bug.status}" but sits under ## Open — move it to ## Fixed`)
      if (bug.section === 'fixed' && open) add('BUGS.md', bug.lineNo, `${bug.id} is "${bug.status}" but sits under ## Fixed — move it to ## Open`)
    }
  },
}
