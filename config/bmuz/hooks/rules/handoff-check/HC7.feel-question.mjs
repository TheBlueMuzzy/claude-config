import { readRoadmap, readSprint } from '../../../templates/ppp/plan-reader.mjs'
import { projectRoots, readPlan } from './_shared.mjs'

export default {
  id: 'HC7',
  name: 'card.feel-question',
  what: 'A built feature (all 🤖 tasks ticked) whose ROADMAP line has a `why:` ends its card with its feel question "Did … feel …?"',
  why: '/develop §4: the feeling a feature is for gets asked in players\' words; his answer goes into SPRINT Notes (F80)',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  // returns a list (one per feature)
  check({ turn, message }) {
    const out = []
    for (const root of projectRoots(turn)) {
      const roadmap = readPlan(root, 'ROADMAP.md')
      const sprint = readPlan(root, 'SPRINT.md')
      if (!roadmap || !sprint) continue
      const { byId } = readRoadmap(roadmap)
      for (const feature of readSprint(sprint).features) {
        const item = byId[feature.id]
        const mine = feature.steps.filter(s => /^🤖/.test(s.text))
        const built = mine.length && mine.every(s => s.done)
        if (!built || !item?.why || item.state.key === 'done' || !new RegExp(`\\b${feature.id}\\b`).test(message)) continue
        if (!/\bdid\b[^?\n]*\bfeel\b[^?\n]*\?/i.test(message)) out.push(`${feature.id} is built and its ROADMAP line has a "why:" (${item.why.slice(0, 80)}) — end the card with its one feel question, in players' words: "Did <moment> feel like <target>?" (/develop §4). His answer goes into SPRINT Notes.`)
      }
    }
    return out
  },
}
