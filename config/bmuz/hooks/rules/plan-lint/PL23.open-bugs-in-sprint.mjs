import { readBugs, isOpenBug } from '../../../templates/ppp/plan-reader.mjs'

export default {
  id: 'PL23',
  name: 'plan.open-bugs-in-sprint',
  what: 'Every open P0/P1 is named in the sprint (a task, or a Notes line saying why it waits); a P1 open since before the sprint\'s `Started` date is a task — or lowered to P2 with a reason',
  why: 'Open P0/P1 bugs always go in as tasks (F80); old bugs don\'t sit (F87)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ sprint, text, bugsText, add }) {
    if (bugsText === null || bugsText === undefined) return
    const lines = text.split('\n')
    const label = sprint.title || 'This sprint'
    const started = sprint.started // the one shared reading of "Started" (plan-reader)
    // the sprint's work: its task lines and feature headings (a 🐞 feature can carry the bug id in its title)
    const work = lines.filter(l => /^- \[( |x)\]/i.test(l) || /^## F\d/.test(l)).join('\n')
    for (const bug of readBugs(bugsText).filter(b => isOpenBug(b) && /P[01]/.test(b.priority) && !/watching/i.test(b.status))) {
      const named = new RegExp(`\\b${bug.id}\\b`)
      // F87: old bugs don't sit — a P1 already open when the sprint began is a task now (a "why it waits" note is
      // only for a P1 found during the sprint), or it isn't really a P1
      const found = (`${bug.status} ${bug.rest}`.match(/\bfound\s+(\d{4}-\d{2}-\d{2})/) || [])[1]
      if (bug.priority === 'P1' && started && found && found < started && !named.test(work)) add('SPRINT.md', null, `${bug.id} (P1) has been open since before this sprint (found ${found}) — put it in the sprint as a task, or lower it to P2 in BUGS.md with a reason`)
      else if (!named.test(text)) add('SPRINT.md', null, `"${label}" doesn't name open ${bug.priority} ${bug.id} — open P0/P1 bugs always go in as tasks (or a Notes line saying why it waits)`)
    }
  },
}
