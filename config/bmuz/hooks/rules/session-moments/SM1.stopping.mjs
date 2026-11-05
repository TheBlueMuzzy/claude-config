import { STOPPING, fromMuzzy } from '../../lib.mjs'

export default {
  id: 'SM1',
  name: 'moments.stopping',
  what: 'Muzzy says he\'s stopping ("going to bed", "switching machines", "done for now") → /save before he goes (or keep going and /save after every feature, in autonomous mode)',
  why: 'Nothing lives only in Claude\'s memory (F67); stop-unsaved (SU1) then refuses to end the turn while work isn\'t pushed (F80)',
  on: true,
  mode: 'warn',
  tests: 'session-moments',
  // only Muzzy's own words (lib.fromMuzzy)
  check({ event }, { input }) {
    if (event === 'UserPromptSubmit' && fromMuzzy(input.prompt) && STOPPING.test(input.prompt || '')) {
      return 'Muzzy says they are stopping or switching machines. If they asked you to keep working while they are away (autonomous mode), keep going and /save after every feature. Otherwise run /save now and confirm "pushed — safe to switch machines."'
    }
  },
}
