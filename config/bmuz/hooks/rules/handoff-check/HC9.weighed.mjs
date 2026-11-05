import { weighedProblem } from '../../lib.mjs'

export default {
  id: 'HC9',
  name: 'card.weighed',
  what: 'A decision question from Muzzy answered with a pick → the answer carries a **Weighed:** block (Why it\'s this way now · Long term · Standards · Your goals · Against my pick), its "why" naming what was checked',
  why: 'Muzzy, 2026-11-04: "I don\'t want you making a decision with only half of a perspective"',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  check({ turn, message }) {
    return weighedProblem(turn.muzzySaid, message)
  },
}
