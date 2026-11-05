import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { git } from '../../lib.mjs'

export default {
  id: 'SP1',
  name: 'plan.sprint-line',
  what: 'A commit this turn that names a feature of the running sprint ("F08: hover tilt"), but SPRINT.md untouched (not edited, and in no commit this turn — a helper\'s merge counts) → log it as a (ticked) task under that feature, or say in one line why not. `F08: done` commits and commits naming no sprint feature (a tiny fix) aren\'t asked about',
  why: 'Every mid-sprint request becomes a SPRINT task line, or it vanishes from the planner (Goops sprint 05). Narrowed in F185 — Muzzy, 2026-11-04 ("your pick"): small tweaks and fixes don\'t need a task, so only a commit naming a sprint feature (Fnn) does (audit 2026-11: ~50 % of its 54 send-backs were done / save commits or tiny fixes)',
  on: true,
  mode: 'block',
  tests: 'stop-plan-check',
  check({ root, p, name, turn }) {
    const sprint = join(root, '.planning', 'SPRINT.md')
    if (!p.committed || p.touchedSprint || !existsSync(sprint)) return undefined
    const text = readFileSync(sprint, 'utf8')
    if (!/- \[ \]/.test(text)) return undefined // no running sprint
    const inSprint = new Set([...text.matchAll(/^## (F\d+[a-z]?)\b/gm)].map(m => m[1]))
    const named = [...new Set(p.messages.filter(m => !/^\s*F\d+[a-z]?(\s*\+\s*F\d+[a-z]?)*\s*:\s*done\b/i.test(m))
      .flatMap(m => (m.match(/\bF\d+[a-z]?\b/g) || [])).filter(id => inSprint.has(id)))]
    if (!named.length || sprintInCommitsSince(root, turn.startedAt) || !codeCommittedSince(root, turn.startedAt)) return undefined
    return `${name}: you committed work on ${named.join(', ')} this turn, but ${sprint} wasn't touched. Every mid-sprint request becomes a SPRINT task line (ticked when done) so the planner shows it — add it as a ticked task under "## ${named[0]} …". If it was part of a task already ticked, say so in one line instead.`
  },
}

// Did commits since the turn began change anything besides plan files and docs?
function codeCommittedSince(root, startedAt) {
  return filesCommittedSince(root, startedAt).some(f => !f.startsWith('.planning/') && !/\.md$/i.test(f))
}
// …or carry SPRINT.md (a helper's merge, a save)?
function sprintInCommitsSince(root, startedAt) {
  return filesCommittedSince(root, startedAt).includes('.planning/SPRINT.md')
}
function filesCommittedSince(root, startedAt) {
  const since = startedAt ? ['--since', startedAt] : ['-1']
  return (git(root, 'log', ...since, '--name-only', '--format=') || '').split('\n').filter(Boolean)
}
