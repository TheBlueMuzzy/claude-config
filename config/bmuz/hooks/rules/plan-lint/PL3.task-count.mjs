import { unknownFeature } from './_lint.mjs'

export default {
  id: 'PL3',
  name: 'plan.task-count',
  what: 'Each sprint feature has 3–8 tasks (a ❓ decision 1–2)',
  why: 'Fewer is too vague to track, more is two features (PROJECT-FILES, F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ sprint, roadmap, add }) {
    for (const feature of sprint.features) {
      if (unknownFeature(feature, roadmap)) continue
      const isDecision = roadmap?.byId[feature.id]?.type === '❓'
      const [min, max] = isDecision ? [1, 2] : [3, 8]
      const n = feature.steps.length
      if (n < min || n > max) add('SPRINT.md', feature.lineNo, `${feature.id} has ${n} task(s) — a ${isDecision ? '❓ decision has 1–2' : 'feature has 3–8'}`)
    }
  },
}
