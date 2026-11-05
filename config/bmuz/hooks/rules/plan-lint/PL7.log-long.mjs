import { LOG_KEEP } from '../../lib.mjs'
import { stateSections } from './_state.mjs'

export default {
  id: 'PL7',
  name: 'plan.log-long',
  what: 'STATE\'s Log over 10 entries (the command reports it; after an edit PL1 has already moved them)',
  why: 'Older entries belong in archive/log.md (F67; PL1 moves them since F117)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ text, add }) {
    const log = stateSections(text).section(/^## Log/)
    const entries = log ? log.body.filter(l => /^- /.test(l)).length : 0
    if (entries > LOG_KEEP) add('STATE.md', log.start + 1, `Log has ${entries} entries — keep ${LOG_KEEP}, older → archive/log.md (the hook moves them on the next STATE edit; save.mjs does too)`)
  },
}
