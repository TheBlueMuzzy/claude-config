import { basename } from 'node:path'
import { plannerLink } from './_shared.mjs'

export default {
  id: 'SP7',
  name: 'plan.sketch-published',
  what: 'A sketch (.planning/research/sketches/*.html) written or changed this turn in a project with a planner page, but not sent with the planner\'s publish as a `files` entry → republish with it',
  why: 'The planner\'s Sketches tab would show the old one (F80)',
  on: true,
  mode: 'block',
  tests: 'stop-plan-check',
  check({ root, p, name }) {
    const link = plannerLink(root)
    const unsent = link ? [...p.sketches].filter(s => !p.sentFiles.some(f => basename(f) === s)) : []
    if (unsent.length) return `${name}: sketch ${unsent.join(', ')} changed this turn, but the planner wasn't republished with ${unsent.length > 1 ? 'them' : 'it'} — publish .planning/ppp.html to ${link} with files: {${unsent.map(s => `"sketches/${s}": ".planning/research/sketches/${s}"`).join(', ')}} (/ppp step 2), so its Sketches tab shows the new version.`
  },
}
