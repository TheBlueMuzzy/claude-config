import { unknownFeature } from './_lint.mjs'

export default {
  id: 'PL12',
  name: 'plan.task-owner',
  what: 'Every sprint task reads "🤖 3. …" or "🙋 3. …" (owner + number)',
  why: 'Who does it (Claude or Muzzy) and which one, at a glance — /sprint lists them by owner (F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ sprint, roadmap, add }) {
    for (const feature of sprint.features) {
      if (unknownFeature(feature, roadmap)) continue
      for (const step of feature.steps) {
        if (!/^(🤖|🙋)\s*\d+[a-z]?\.\s/.test(step.text)) add('SPRINT.md', step.lineNo, `task should read "🤖 3. …" or "🙋 3. …" (owner + number)`)
      }
    }
  },
}
