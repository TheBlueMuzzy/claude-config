import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { fromMuzzy, wordingNoteFile } from '../../lib.mjs'

export default {
  id: 'SM5',
  name: 'card.wording-slips-next-turn',
  what: 'The wording slips handoff-check found in Claude\'s last hand-off (labels, feature names, the clock, the sprint header…) — not sent back — reach Claude with Muzzy\'s next message, once, so this turn\'s hand-off is right',
  why: 'Muzzy, 2026-11-06: "why do I get double messages like this? it\'s been happening forever" — a send-back for wording shows him the same message twice (8 of the session\'s 10 send-backs were wording); substance is still sent back',
  on: true,
  mode: 'warn',
  tests: 'session-moments',
  check({ event }, { input }) {
    if (event !== 'UserPromptSubmit' || !fromMuzzy(input.prompt)) return undefined // a helper's report isn't Claude's next hand-off
    const file = wordingNoteFile(input.session_id)
    if (!existsSync(file)) return undefined
    let text = ''
    try { text = readFileSync(file, 'utf8').trim() } catch {}
    try { unlinkSync(file) } catch {}
    return text || undefined
  },
}
