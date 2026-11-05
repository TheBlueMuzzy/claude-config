import { DECIDING, DECISION_BRIEF, fromMuzzy } from '../../lib.mjs'

export default {
  id: 'SM3',
  name: 'moments.decision-brief',
  what: 'Muzzy asks a decision question ("should I…", "is it better…", "split…") → Claude gets the brief to weigh it from every side before answering (lib.DECISION_BRIEF); HC9 then checks the Weighed block',
  why: 'Muzzy, 2026-11-04: "I don\'t want you making a decision with only half of a perspective"',
  on: true,
  mode: 'warn',
  tests: 'session-moments',
  check({ event }, { input }) {
    if (event === 'UserPromptSubmit' && fromMuzzy(input.prompt) && DECIDING.test(input.prompt || '')) return DECISION_BRIEF
  },
}
