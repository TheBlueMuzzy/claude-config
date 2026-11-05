import { unknownFeature } from './_lint.mjs'

export default {
  id: 'PL4',
  name: 'plan.sprint-feature-in-roadmap',
  what: 'A sprint feature that isn\'t in ROADMAP.md',
  why: 'The roadmap is the one list of features; the planner and every check read it (F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ sprint, roadmap, add }) {
    for (const feature of sprint.features) if (unknownFeature(feature, roadmap)) add('SPRINT.md', feature.lineNo, `${feature.id} isn't in ROADMAP.md`)
  },
}
