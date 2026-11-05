import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { trimLog, LOG_KEEP } from '../../lib.mjs'

export default {
  id: 'PL1',
  name: 'plan.log-trim',
  what: 'After a STATE edit, a Log over 10 entries is MOVED: the oldest go to the top of `archive/log.md` (newest first; header made if missing; each file keeps its CRLF/LF; a line already there isn\'t added twice), and Claude is told to re-read STATE',
  why: 'It was moved by hand 6+ times in sprints 28–30 (F117)',
  on: true,
  mode: 'action',
  tests: 'plan-lint',
  // returns the note for Claude ('' = nothing moved)
  check({ full, project }) {
    if (basename(full) !== 'STATE.md') return ''
    // The edit has already landed (PostToolUse), so rewriting STATE here doesn't fight it; a hook's own file writes don't
    // start hooks, so nothing loops. Claude's next Edit of STATE is told to read it again — the note says why.
    try {
      const archive = join(project, '.planning', 'archive', 'log.md')
      const archiveText = existsSync(archive) ? readFileSync(archive, 'utf8') : null
      const trim = trimLog(readFileSync(full, 'utf8'), archiveText)
      if (!trim.moved) return ''
      mkdirSync(dirname(archive), { recursive: true })
      if (trim.archive !== archiveText) writeFileSync(archive, trim.archive) // the archive first: a line is never lost
      writeFileSync(full, trim.state)
      return `Moved ${trim.moved} old Log line(s) to archive/log.md (STATE keeps ${LOG_KEEP}) — STATE.md changed, read it again before the next edit.`
    } catch (error) {
      return `(the Log wasn't trimmed: ${String(error.message).split('\n')[0]})`
    }
  },
}
