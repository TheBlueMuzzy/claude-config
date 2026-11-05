import { stateSections } from './_state.mjs'

// (F185) the caps that keep session start small: every session prints RESUME HERE, and the framework's had grown a
// 12.5 KB "Reviewed through:" chain (audit 2026-11) — older history belongs in .planning/archive/log.md
const RESUME_MAX = 1500
const REVIEWED_MAX = 400
const GATE_LINE = /^\s*(?:[-*]\s*)?\**(Reviewed through|Last full check|Security reviewed)\**:/i

export default {
  id: 'PL8',
  name: 'plan.resume-here',
  what: `STATE has a "## ▶ RESUME HERE" section of 2–5 lines (over 12 is flagged), REPLACED each time, never appended; its text (without the Reviewed through / Last full check / Security reviewed lines) at most ~${RESUME_MAX} characters, and the "Reviewed through:" line at most ~${REVIEWED_MAX}`,
  why: 'A fresh session (or the other machine) picks up from it (F67). Capped in F185: session start prints it every session — the framework\'s had a 12.5 KB "Reviewed through" chain and Goops\' ~45 KB of notes (audit 2026-11)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ text, add }) {
    const { lines, section } = stateSections(text)
    const resume = section(/^## ▶ RESUME HERE/)
    if (!resume) { add('STATE.md', null, 'no "## ▶ RESUME HERE" section'); return }
    if (resume.body.length > 12) add('STATE.md', resume.start + 1, `RESUME HERE is ${resume.body.length} lines — 2–5 lines, REPLACED each time, never appended`)
    const size = resume.body.filter(l => !GATE_LINE.test(l)).join('\n').length
    if (size > RESUME_MAX) add('STATE.md', resume.start + 1, `RESUME HERE is ${size} characters — keep it under ~${RESUME_MAX} (every session start prints it): the next step and what a fresh session needs; move the history to .planning/archive/log.md`)
    const reviewed = lines.findIndex(l => /^\s*(?:[-*]\s*)?\**Reviewed through\**:/i.test(l))
    if (reviewed >= 0 && lines[reviewed].length > REVIEWED_MAX) add('STATE.md', reviewed + 1, `the "Reviewed through:" line is ${lines[reviewed].length} characters — keep it under ~${REVIEWED_MAX}: the latest reviewed commit and what was checked; the older "· before: …" history goes to .planning/archive/log.md`)
  },
}
