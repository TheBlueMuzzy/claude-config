import { stateSections } from './_state.mjs'

export default {
  id: 'PL8',
  name: 'plan.resume-here',
  what: 'STATE has a "## ▶ RESUME HERE" section of 2–5 lines (over 12 is flagged), REPLACED each time, never appended',
  why: 'A fresh session (or the other machine) picks up from it (F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ text, add }) {
    const resume = stateSections(text).section(/^## ▶ RESUME HERE/)
    if (!resume) add('STATE.md', null, 'no "## ▶ RESUME HERE" section')
    else if (resume.body.length > 12) add('STATE.md', resume.start + 1, `RESUME HERE is ${resume.body.length} lines — 2–5 lines, REPLACED each time, never appended`)
  },
}
