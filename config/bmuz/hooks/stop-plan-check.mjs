// The plan keeps up with the work (F67). Global Stop hook. Sends Claude back once when, this turn:
//  1. work was committed in a project with a running sprint, but SPRINT.md wasn't touched — every mid-sprint request
//     becomes a SPRINT task line (ticked when done), or it vanishes from the planner (Goops sprint 05);
//  2. the plan files changed (plan-lint rebuilt .planning/ppp.html) in a project with a published planner page
//     (STATE "Planner (PPP):" link), but it wasn't republished;
//  3. a milestone went out (tag / "Release vX.Y.0") without a look-back in .planning/archive/lookbacks/, or a look-back
//     names a home that doesn't exist (F74, templates/lookback.md — the self-improving loop).
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { readInput, readTurn, isCommit, gitCalls, git, commitMessage } from './lib.mjs'

const MILESTONE_TAG = /^v\d+\.\d+\.0$/ // v0.9.0 = a milestone / release stage (v0.9.3 = an update)
const input = readInput()
if (input.stop_hook_active) process.exit(0) // already sent back once — never loop
if (!input.transcript_path || !existsSync(input.transcript_path)) process.exit(0)
const turn = readTurn(input.transcript_path)

// The projects this turn worked in: where it committed, and where it edited plan files.
const projects = new Map() // root → { committed, touchedSprint, published }
const project = (dir) => {
  const top = dir && git(dir, 'rev-parse', '--show-toplevel')
  if (!top) return null
  const root = resolve(top)
  if (!projects.has(root)) projects.set(root, { committed: false, touchedSprint: false, published: false, milestone: false, lookbacks: new Set() })
  return projects.get(root)
}
for (const tool of turn.tools) {
  const file = tool.input.file_path || ''
  if (isCommit(tool)) {
    for (const call of gitCalls(tool.input.command, tool.cwd)) if (call.sub === 'commit') { const p = project(call.dir); if (p) p.committed = true }
  }
  // a milestone / release stage went out: tag vX.Y.0, or a "Release vX.Y.0" commit
  if (tool.name === 'Bash' || tool.name === 'PowerShell') {
    for (const call of gitCalls(tool.input.command || '', tool.cwd)) {
      const tagged = call.sub === 'tag' && !call.args.some(a => a === '-d' || a === '--delete') && call.args.some(a => MILESTONE_TAG.test(a))
      const released = call.sub === 'commit' && /^Release v\d+\.\d+\.0\b/.test(commitMessage(tool.input.command, call.args))
      if (tagged || released) { const p = project(call.dir); if (p) p.milestone = true }
    }
  }
  if (/[\\/]\.planning[\\/]archive[\\/]lookbacks[\\/][^\\/]+\.md$/.test(file)) { const p = project(resolve(file, '..')); if (p) p.lookbacks.add(file) }
  if (/[\\/]\.planning[\\/][^\\/]+\.md$/.test(file)) project(resolve(file, '..')) // any plan edit: the planner may need republishing
  if (/[\\/]\.planning[\\/]SPRINT\.md$/.test(file)) { const p = project(resolve(file, '..')); if (p) p.touchedSprint = true }
  if ((tool.name === 'Bash' || tool.name === 'PowerShell') && /SPRINT\.md/.test(tool.input.command || '')) { const p = project(tool.cwd); if (p) p.touchedSprint = true }
  if (tool.name === 'Artifact' && /ppp\.html$/.test(file)) { const p = project(resolve(file, '..', '..')); if (p) p.published = true }
}

const problems = []
for (const [root, p] of projects) {
  const name = root.split(/[\\/]/).pop()
  // 1. committed work, sprint running, SPRINT.md untouched
  const sprint = join(root, '.planning', 'SPRINT.md')
  if (p.committed && !p.touchedSprint && existsSync(sprint) && /- \[ \]/.test(readFileSync(sprint, 'utf8')) && codeCommittedSince(root, turn.startedAt)) {
    problems.push(`${name}: you committed work this turn, but ${sprint} wasn't touched. Every mid-sprint request becomes a SPRINT task line (ticked when done) so the planner shows it — add it as a ticked task under the "## F…" feature it belongs to (the planner only shows tasks under a feature; with no fitting feature, the one being built now). If it was part of a task already ticked, or a tiny fix outside the sprint, say so in one line instead.`)
  }
  // 3. a milestone went out without a look-back; a look-back item whose home isn't a real file
  // (one written in an earlier turn of the release, or through the shell, counts: changed in the last 7 days)
  if (p.milestone && !p.lookbacks.size && !recentLookback(root)) {
    problems.push(`${name}: a milestone / release stage went out this turn, but there's no look-back. Write .planning/archive/lookbacks/<milestone>.md and land each lesson in its home (~/.claude/config/bmuz/templates/lookback.md).`)
  }
  for (const file of p.lookbacks) problems.push(...lookbackProblems(file, root).map(problem => `${name}: look-back ${problem}`))
  // 2. planner page rebuilt but not republished
  const gitDir = git(root, 'rev-parse', '--absolute-git-dir')
  const rebuilt = gitDir && join(gitDir, 'bmuz-ppp-rebuilt')
  const link = plannerLink(root)
  if (!rebuilt || !link || !existsSync(rebuilt)) continue
  const published = join(gitDir, 'bmuz-ppp-published')
  if (p.published) { writeFileSync(published, new Date().toISOString()); continue }
  if (!existsSync(published) || statSync(published).mtimeMs < statSync(rebuilt).mtimeMs) {
    problems.push(`${name}: the plan files changed, so the planner page was rebuilt (.planning/ppp.html) — republish it to ${link} with the Artifact tool (url = that link).`)
  }
}
if (problems.length) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason: `Before handing back:\n- ${problems.join('\n- ')}` }))
}
process.exit(0)

function recentLookback(root) {
  const dir = join(root, '.planning', 'archive', 'lookbacks')
  try {
    return readdirSync(dir).some(f => f.endsWith('.md') && statSync(join(dir, f)).mtimeMs > Date.now() - 7 * 24 * 3600 * 1000)
  } catch {
    return false
  }
}

// Every item ("- … → hook: <path> (…)") names a home that exists; "→ nothing (why)" needs its reason.
function lookbackProblems(file, root) {
  let text
  try { text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n') } catch { return [`${file} can't be read`] }
  const problems = []
  let inSection = false
  for (const line of text.split('\n')) {
    if (/^## /.test(line)) { inSection = true; continue }
    if (!inSection || !/^- /.test(line)) continue
    const item = line.slice(2, 62)
    const home = line.match(/→\s*(hook|check|script|module|checklist|game|nothing)\b\s*(.*)$/)
    if (!home) { problems.push(`item "${item}…" has no home — end it with "→ hook|check|script|module|checklist|game: <path>" or "→ nothing (why)"`); continue }
    if (home[1] === 'nothing') { if (!/^\(.+\)/.test(home[2])) problems.push(`item "${item}…" → nothing needs a reason in brackets`); continue }
    const path = (home[2].match(/^:\s*`?([^\s`(]+)/) || [])[1]
    if (!path) { problems.push(`item "${item}…" → ${home[1]} needs the file it landed in ("→ ${home[1]}: <path>")`); continue }
    const full = path.startsWith('~') ? join(homedir(), path.slice(1)) : resolve(root, path)
    if (!existsSync(full.replace(/[.,;:]+$/, ''))) problems.push(`item "${item}…" → ${path} doesn't exist — land the lesson there first`)
  }
  return problems
}

// Did commits since the turn began change anything besides plan files and docs?
function codeCommittedSince(root, startedAt) {
  const since = startedAt ? ['--since', startedAt] : ['-1']
  const files = (git(root, 'log', ...since, '--name-only', '--format=') || '').split('\n').filter(Boolean)
  return files.some(f => !f.startsWith('.planning/') && !/\.md$/i.test(f))
}

function plannerLink(root) {
  try {
    return (readFileSync(join(root, '.planning', 'STATE.md'), 'utf8').match(/Planner \(PPP\):\*{0,2}\s*(https:\/\/claude\.ai\/\S+)/) || [])[1] || null
  } catch {
    return null
  }
}
