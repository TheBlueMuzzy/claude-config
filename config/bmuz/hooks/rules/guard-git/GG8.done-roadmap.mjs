import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readRoadmap } from '../../../templates/ppp/plan-reader.mjs'
import { featureIds } from './_shared.mjs'
import { doneCommit } from './_done.mjs'

export default {
  id: 'GG8',
  name: 'commit.done-roadmap',
  what: 'Refuses `F08: done` while ROADMAP still shows F08 as anything but ✅ / 🎛️',
  why: '"Approved" means done in the plan too, not just in git — so the planner, the ready states and /sprint agree (F80)',
  on: true,
  mode: 'block',
  tests: 'guard-git-safety',
  check({ commit }, { deny }) {
    const done = doneCommit(commit)
    if (!done) return
    let roadmap = null
    try { roadmap = readRoadmap(readFileSync(join(done.root, '.planning', 'ROADMAP.md'), 'utf8').replace(/\r\n/g, '\n')) } catch { /* no roadmap */ }
    const notDone = roadmap ? featureIds(done.ids).filter(id => roadmap.byId[id] && roadmap.byId[id].state.key !== 'done' && !/^- 🎛/.test(roadmap.byId[id].raw)) : []
    if (notDone.length) {
      deny(`Blocked: "${done.ids}: done" but ROADMAP.md still shows ${notDone.map(id => `${id} as ${roadmap.byId[id].state.label}`).join(', ')}. Approved means done in the plan too: set ${notDone.join(', ')} ✅ in .planning/ROADMAP.md (🎛️ if tuning goes on), refresh which features became 🟢 ready (plan-lint names them), then commit again.`)
    }
  },
}
