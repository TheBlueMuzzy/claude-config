// File away a finished sprint (F69 — /sprint B1, /develop §4).
//   node ~/.claude/config/bmuz/scripts/archive-sprint.mjs
// Refuses while any feature in SPRINT.md isn't ✅ done or 🎛️ tuning in ROADMAP (unticked 🙋 tasks are named too).
// Then: .planning/SPRINT.md → .planning/archive/sprints/sprint-NN.md (NN from its "# Sprint NN" title) and commits
// "Sprint NN done" with just those two paths.
import { existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { readRoadmap, readSprint } from '../templates/ppp/plan-reader.mjs'
import { git, run, ok, refuse, projectDir } from './lib.mjs'

const root = git(projectDir(), 'rev-parse', '--show-toplevel')
if (!root) refuse("this folder isn't a git repo")
const read = (name) => { try { return readFileSync(join(root, '.planning', name), 'utf8').replace(/\r\n/g, '\n') } catch { return null } }
const sprintText = read('SPRINT.md')
if (sprintText === null) refuse('no .planning/SPRINT.md — nothing to archive')
const sprint = readSprint(sprintText)
const number = (sprint.title.match(/^Sprint\s+(\d+)/i) || [])[1]
if (!number) refuse(`SPRINT.md's title doesn't start "Sprint NN" (it says "${sprint.title}")`)
const { byId } = readRoadmap(read('ROADMAP.md') ?? '')
const notDone = sprint.features.filter(f => !['done'].includes(byId[f.id]?.state.key) && !/tuning/.test(byId[f.id]?.state.label ?? ''))
if (notDone.length) {
  const lines = notDone.map(f => {
    const left = f.steps.filter(s => !s.done).map(s => s.text.slice(0, 50))
    return `${f.id} is ${byId[f.id]?.state.label ?? 'not in ROADMAP'}${left.length ? ` — open: ${left.join(' · ')}` : ''}`
  })
  refuse(`the sprint isn't finished:\n    ${lines.join('\n    ')}`, 'finish (or get Muzzy\'s "approved" → ✅ in ROADMAP) first')
}
const nn = String(number).padStart(2, '0')
const target = join('.planning', 'archive', 'sprints', `sprint-${nn}.md`)
if (existsSync(join(root, target))) refuse(`${target} already exists`, 'is the sprint number in SPRINT.md\'s title right?')
mkdirSync(join(root, '.planning', 'archive', 'sprints'), { recursive: true })
const tracked = git(root, 'ls-files', '--error-unmatch', '.planning/SPRINT.md') !== null
// a SPRINT.md never committed has no old path for git to record — then only the new file goes in the commit
if (tracked) {
  const move = run('git', ['mv', '.planning/SPRINT.md', target], { cwd: root })
  if (move.code !== 0) refuse(`moving it failed:\n${move.out}`)
} else {
  renameSync(join(root, '.planning', 'SPRINT.md'), join(root, target))
  const add = run('git', ['add', '--', target], { cwd: root })
  if (add.code !== 0) { renameSync(join(root, target), join(root, '.planning', 'SPRINT.md')); refuse(`staging it failed (put back):\n${add.out}`) }
}
const paths = tracked ? ['.planning/SPRINT.md', target] : [target]
const commit = run('git', ['commit', '-q', '-m', `Sprint ${nn} done`, '--', ...paths], { cwd: root })
if (commit.code !== 0) refuse(`moved, but the commit failed:\n${commit.out}`)
ok(`Sprint ${nn} archived → ${target.split('\\').join('/')} (committed "Sprint ${nn} done")`)
