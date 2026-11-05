import { sectionLine } from './_lint.mjs'

export default {
  id: 'PL9',
  name: 'plan.check-line',
  what: 'Every `## Fnn` sprint feature (❓ decisions and `## Carried to…` aside) has a `Check:` line — its test plan',
  why: 'What proves it works is decided before it\'s built (F87)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  // A ❓ decision's check is Muzzy's answer, so it needs none. (`## Carried to sprint NN — … (Fxx)` isn't a feature heading here.)
  check({ sprint, roadmap, text, add }) {
    const lines = text.split('\n')
    for (const feature of sprint.features) {
      if (roadmap?.byId[feature.id]?.type === '❓' || /^## F\d+[a-z]?\s+❓/.test(lines[feature.lineNo - 1])) continue
      const plan = sectionLine(lines, feature.lineNo, 'Check')
      if (!plan) add('SPRINT.md', feature.lineNo, `${feature.id} has no "Check:" line — its test plan: what proves it works (a test, a screenshot, "Muzzy fans 7 cards on his phone"). Add "Check: …" under its tasks`)
    }
  },
}
