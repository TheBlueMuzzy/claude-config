import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readRoadmap, readSprint, readBugs, isOpenBug } from '../../../templates/ppp/plan-reader.mjs'

export default {
  id: 'SP5',
  name: 'plan.sprint-archive',
  what: 'Every SPRINT.md feature ✅ in ROADMAP → ask Muzzy\'s 3-line retro, then archive it (archive-sprint.mjs) — with the open P0/P1/P2 counts, so the bug-sweep offer comes with it',
  why: 'Finished sprints don\'t linger (F80); archive-sprint needs the retro first (F81)',
  on: true,
  mode: 'block',
  tests: 'stop-plan-check',
  check({ root, name, lastSaid }) {
    const finished = finishedSprint(root)
    if (!finished) return
    // archive-sprint needs Muzzy's 3-line retro first (F81) — without it, the step is to ASK him, and a turn whose last
    // message already asks isn't sent back (review: "archive it" bounced a turn that was waiting on his answers)
    if (!finished.retro && /\bretro\b|went well/i.test(lastSaid)) return // waiting on Muzzy's retro — fine
    if (!finished.retro) {
      return `${name}: every feature in SPRINT.md (${finished.ids}) is ✅ in ROADMAP — before archiving, ask Muzzy the 3-line retro (went well · went wrong · change; you may draft from the sprint's Notes, his words win), write it as "Retro:" in SPRINT.md, then node ~/.claude/config/bmuz/scripts/archive-sprint.mjs.`
    }
    const bugs = openBugs(root)
    const sweep = bugs.P0 + bugs.P1 > 0 || bugs.P2 >= 3
      ? ` BUGS.md has ${bugs.P0} P0 · ${bugs.P1} P1 · ${bugs.P2} P2 open — offer Muzzy a /bug sweep first (/develop §4).`
      : ''
    return `${name}: every feature in SPRINT.md (${finished.ids}) is ✅ in ROADMAP — archive it: node ~/.claude/config/bmuz/scripts/archive-sprint.mjs, then say "Next: /sprint".${sweep}`
  },
}

// Every sprint feature ✅ in ROADMAP → { ids: "F08, F11", retro: all 3 retro lines written? } (archive-sprint needs
// both), else null.
function finishedSprint(root) {
  const read = (name) => { try { return readFileSync(join(root, '.planning', name), 'utf8').replace(/\r\n/g, '\n') } catch { return null } }
  const sprintText = read('SPRINT.md')
  if (!sprintText) return null
  const sprint = readSprint(sprintText)
  if (!sprint.features.length) return null
  const { byId } = readRoadmap(read('ROADMAP.md') ?? '')
  if (!sprint.features.every(f => byId[f.id]?.state.key === 'done')) return null
  return { ids: sprint.features.map(f => f.id).join(', '), retro: ['went well', 'went wrong', 'change'].every(k => sprint.retro[k]) }
}

function openBugs(root) {
  const counts = { P0: 0, P1: 0, P2: 0 }
  try {
    for (const b of readBugs(readFileSync(join(root, '.planning', 'BUGS.md'), 'utf8').replace(/\r\n/g, '\n'))) if (isOpenBug(b) && b.priority in counts) counts[b.priority]++
  } catch { /* no BUGS.md */ }
  return counts
}
