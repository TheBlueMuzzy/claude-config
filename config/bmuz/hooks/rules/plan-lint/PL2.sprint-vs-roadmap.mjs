import { unknownFeature } from './_lint.mjs'

export default {
  id: 'PL2',
  name: 'plan.sprint-feature-building',
  what: 'A feature in the sprint (not all tasks done) is 🔨 in ROADMAP',
  why: 'The roadmap and the sprint say the same thing about what\'s being built (F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ sprint, roadmap, add }) {
    for (const feature of sprint.features) {
      if (unknownFeature(feature, roadmap)) continue
      const item = roadmap?.byId[feature.id]
      const allDone = feature.steps.length > 0 && feature.steps.every(s => s.done)
      if (item && !allDone && !['develop', 'done'].includes(item.state.key)) add('SPRINT.md', feature.lineNo, `${feature.id} is in the sprint but ROADMAP says ${item.state.label} — set it 🔨`)
    }
  },
}
