import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { git } from '../../lib.mjs'

export default {
  id: 'SP1',
  name: 'plan.sprint-line',
  what: 'Work committed this turn in a project with a running sprint, but SPRINT.md untouched → log it as a (ticked) task under its feature, or say in one line why not',
  why: 'Every mid-sprint request becomes a SPRINT task line, or it vanishes from the planner (Goops sprint 05)',
  on: true,
  mode: 'block',
  tests: 'stop-plan-check',
  check({ root, p, name, turn }) {
    const sprint = join(root, '.planning', 'SPRINT.md')
    if (p.committed && !p.touchedSprint && existsSync(sprint) && /- \[ \]/.test(readFileSync(sprint, 'utf8')) && codeCommittedSince(root, turn.startedAt)) {
      return `${name}: you committed work this turn, but ${sprint} wasn't touched. Every mid-sprint request becomes a SPRINT task line (ticked when done) so the planner shows it — add it as a ticked task under the "## F…" feature it belongs to (the planner only shows tasks under a feature; with no fitting feature, the one being built now). If it was part of a task already ticked, or a tiny fix outside the sprint, say so in one line instead.`
    }
  },
}

// Did commits since the turn began change anything besides plan files and docs?
function codeCommittedSince(root, startedAt) {
  const since = startedAt ? ['--since', startedAt] : ['-1']
  const files = (git(root, 'log', ...since, '--name-only', '--format=') || '').split('\n').filter(Boolean)
  return files.some(f => !f.startsWith('.planning/') && !/\.md$/i.test(f))
}
