export default {
  id: 'PL16',
  name: 'plan.tasks-under-feature',
  what: 'SPRINT tasks under a heading that isn\'t a feature ("## Extras") → put them under the "## F…" feature they belong to (a "## Carried to sprint NN" section keeps its tasks on purpose)',
  why: 'Tasks outside a feature never show in the planner (F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ text, add }) {
    let heading = null
    text.split('\n').forEach((line, n) => {
      // (a "## Carried to sprint NN — … (Fxx)" section keeps its tasks on purpose — they move on with it, PROJECT-FILES)
      if (/^## /.test(line)) heading = /^## (F\d+[a-z]?\b|Carried to sprint\b)/i.test(line) ? null : { text: line.slice(3).trim(), lineNo: n + 1, warned: false }
      else if (heading && !heading.warned && /^- \[( |x)\]/i.test(line)) {
        heading.warned = true
        add('SPRINT.md', heading.lineNo, `tasks under "## ${heading.text}" don't show in the planner — put them under the "## F…" feature they belong to`)
      }
    })
  },
}
