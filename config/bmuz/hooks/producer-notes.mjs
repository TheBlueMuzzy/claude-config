// The producer's eye (F81) — session-start.sh runs this in a project folder every session.
//   node ~/.claude/config/bmuz/hooks/producer-notes.mjs [projectDir]
// Prints the sprint line every time a SPRINT.md is running ("Sprint 07 · day 9 (the last 3 took ~4 days)"), then
// only the lines that need attention: the milestone's target date when it's close or passed, features that haven't
// moved for a week, and what's waiting on Muzzy. Nothing to say → nothing printed. Muzzy 2026-10-19: "sprint line
// always + only the lines that need attention". Local only: no network, a few git calls, well under a second.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { readRoadmap, readSprint, readBugs } from '../templates/ppp/plan-reader.mjs'

const dir = resolve(process.argv[2] || '.')
const read = (...parts) => { try { return readFileSync(join(dir, '.planning', ...parts), 'utf8').replace(/\r\n/g, '\n') } catch { return null } }
const git = (...args) => { try { return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return '' } }

// Calendar days between two YYYY-MM-DD dates (time of day and clock changes don't matter)
const dayNumber = (ymd) => { const [y, m, d] = ymd.split('-').map(Number); return Date.UTC(y, m - 1, d) / 86_400_000 }
const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const daysSince = (ymd) => dayNumber(today) - dayNumber(ymd)
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

const sprintText = read('SPRINT.md')
const roadmapText = read('ROADMAP.md')
if (sprintText === null && roadmapText === null) process.exit(0) // not a BMUZ project
const sprint = sprintText === null ? null : readSprint(sprintText)
const roadmap = readRoadmap(roadmapText ?? '')
const out = []
const attention = []

// --- the sprint line: "Sprint 07 · day 9 (the last 3 took ~4 days)" ---
if (sprint) {
  const name = (sprint.title.match(/^Sprint\s+\d+/i) || ['This sprint'])[0]
  // (a start date in the future is a typo — no "day -5"; review)
  const age = sprint.started && daysSince(sprint.started) >= 0 ? daysSince(sprint.started) : null
  let line = age === null ? name : `${name} · day ${age + 1}` // the day it started is day 1
  // How long the last 3 finished sprints took: their "Started" date → the day they were archived ("Sprint NN done")
  const archiveDir = join(dir, '.planning', 'archive', 'sprints')
  const files = existsSync(archiveDir) ? readdirSync(archiveDir).filter(f => /^sprint-\d+\.md$/.test(f)).sort((a, b) => parseInt(b.slice(7)) - parseInt(a.slice(7))) : []
  const doneDates = {}
  for (const l of git('log', '--all', '-E', '--grep=^Sprint [0-9]+ done', '--format=%cI %s').split('\n')) {
    const m = l.match(/^(\d{4}-\d{2}-\d{2})\S* Sprint (\d+) done/)
    if (m && !doneDates[Number(m[2])]) doneDates[Number(m[2])] = m[1] // newest first — keep the latest
  }
  const lengths = []
  for (const f of files) {
    if (lengths.length === 3) break
    const archived = read('archive', 'sprints', f)
    const started = archived === null ? '' : readSprint(archived).started // the one shared reading of "Started"
    // no "Sprint NN done" commit (archived by hand) → the first commit that has the file
    const done = doneDates[parseInt(f.slice(7))] || (git('log', '--format=%cI', '--', `.planning/archive/sprints/${f}`).trim().split('\n').pop() || '').slice(0, 10)
    if (started && /^\d{4}-/.test(done)) lengths.push(Math.max(1, dayNumber(done) - dayNumber(started) + 1))
  }
  if (lengths.length) {
    const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
    line += lengths.length === 1 ? ` (the last one took ${plural(avg, 'day')})` : ` (the last ${lengths.length} took ~${plural(avg, 'day')})`
  }
  out.push(line)

  // --- features that haven't moved: 🔨/🎛️ in this sprint, no commit naming them for 7+ days, sprint 7+ days old ---
  if (age !== null && age >= 7) {
    const log = git('log', '--all', `--since=${sprint.started}T00:00:00`, '--format=%x1e%cI%x1f%B')
    const commits = log.split('\x1e').filter(Boolean).map(c => ({ date: c.slice(0, 10), text: c.slice(c.indexOf('\x1f') + 1) }))
    // the features the sprint started with ("Started … · Features: F08, F11") — one added later has no sprint-long idle
    const planned = (sprintText.replace(/\r\n/g, '\n').match(/^\**Started[^\n]*/m) || [''])[0]
    for (const f of sprint.features) {
      const item = roadmap.byId[f.id]
      if (item?.state.key !== 'develop') continue
      if (/❓/.test(item.raw || '')) continue // a decision waits on Muzzy — it's in "Waiting on you", not stalled (review)
      const mention = new RegExp(`\\b${f.id}(?![0-9a-z])`)
      const last = commits.find(c => mention.test(c.text)) // newest first
      if (!last && !new RegExp(`\\b${f.id}\\b`).test(planned)) continue // added mid-sprint, nothing yet — too soon to say
      const idle = last ? daysSince(last.date) : age
      if (idle >= 7) attention.push(`${f.id} hasn't moved in ${idle} days — ship it as is, or what's in the way?`)
    }
  }
}

// --- the milestone target: "alpha target: 5 days left · musts 6/9" — only within 14 days, or overdue ---
const milestone = roadmap.milestones.find(m => m.current && !m.released)
if (milestone?.target) {
  const left = dayNumber(milestone.target) - dayNumber(today)
  if (left <= 14) {
    const label = milestone.release || milestone.name.split(/\s+—\s+/)[0]
    const when = left > 0 ? `${plural(left, 'day')} left` : left === 0 ? 'due today' : `${plural(-left, 'day')} overdue`
    const musts = milestone.items.filter(i => /^must/i.test(i.scope) && i.type !== '❓') // "Musts X/Y" counts non-❓ (PROJECT-FILES)
    const done = musts.filter(i => i.state.key === 'done').length
    attention.unshift(`${label} target: ${when}${musts.length ? ` · musts ${done}/${musts.length}` : ''}`)
  }
}

// --- waiting on Muzzy: his open 🙋 tasks + P0/P1 fixes he hasn't checked yet (they need "verified") ---
const waiting = []
if (sprint) {
  const mine = sprint.features.flatMap(f => f.steps).filter(s => !s.done && /^🙋/.test(s.text))
    .map(s => s.text.replace(/^🙋️?\s*(\d+\.\s*)?/, '').split(' — ')[0].replace(/^\([^)]*\)\s*/, '').replace(/\s*\([^)]*\)\s*$/, '').trim()) // drop "(tuning)" / "(stand-in)" tags
    .map(t => (t.length > 40 ? `${t.slice(0, 39)}…` : t).replace(/^./, c => c.toLowerCase()))
  if (mine.length) waiting.push(`${plural(mine.length, 'task')} (${mine.slice(0, 3).join(' · ')}${mine.length > 3 ? ' …' : ''})`)
}
const bugsText = read('BUGS.md')
if (bugsText) {
  const toCheck = readBugs(bugsText).filter(b => /^P[01]$/.test(b.priority) && /^fixed/i.test(b.status)).map(b => b.id)
  if (toCheck.length) waiting.push(`${toCheck.length} ${toCheck.length === 1 ? 'fix' : 'fixes'} to check (${toCheck.join(', ')})`)
}
if (waiting.length) attention.push(`Waiting on you: ${waiting.join(' · ')}`)

if (!out.length && !attention.length) process.exit(0)
console.log('')
for (const l of out) console.log(`📅 ${l}`)
for (const l of attention) console.log(`  ⚠ ${l}`)
if (attention.length) console.log('  → producer notes: bring the ⚠ lines up with Muzzy in plain words before starting work.')
