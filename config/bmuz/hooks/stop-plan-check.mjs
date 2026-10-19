// The plan keeps up with the work (F67). Global Stop hook. Sends Claude back (until fixed, up to 3 times in a row —
// lib.stopVerdict, F80) when, this turn:
//  1. work was committed in a project with a running sprint, but SPRINT.md wasn't touched — every mid-sprint request
//     becomes a SPRINT task line (ticked when done), or it vanishes from the planner (Goops sprint 05);
//  2. the plan files changed (plan-lint rebuilt .planning/ppp.html) in a project with a published planner page
//     (STATE "Planner (PPP):" link), but it wasn't republished;
//  3. a milestone went out (a vX.Y.0 tag made this turn — by hand or by release.mjs — or a "Release vX.Y.0" commit)
//     without a look-back in .planning/archive/lookbacks/, or a look-back names a home that doesn't exist (F74,
//     templates/lookback.md — the self-improving loop);
//  4. a feature was approved (`F08: done` commit) but not saved + pushed — /develop saves in the same turn (F80);
//  5. every feature in SPRINT.md is ✅ in ROADMAP but the sprint wasn't archived (archive-sprint.mjs) — with the open
//     P0/P1/P2 counts, so the bug-sweep offer comes with it (F80);
//  6. a new data file under content/ this turn that TDD.md doesn't mention (by its path, folder or name) — the data
//     files Muzzy can edit are listed in the TDD (/develop "A new data file → update TDD §1/§3") (F80);
//  7. a sketch (.planning/research/sketches/*.html) written or changed this turn in a project with a planner page,
//     but not sent with the planner's publish as a `files` entry — the Sketches tab would show the old one (F80);
//  8. a release tag (any vX.Y.Z) made this turn in a BMUZ project, but .planning/live-pass (written by
//     scripts/live-check.mjs: line 1 commit, line 2 "<tag> <url>" or "<tag> skipped — Release: …") doesn't name it —
//     "is it really live?" is checked, not assumed (F80).
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { readInput, readTurn, isCommit, gitCalls, git, commitMessage, stopVerdict } from './lib.mjs'
import { readRoadmap, readSprint, readBugs, isOpenBug } from '../templates/ppp/plan-reader.mjs'

const MILESTONE_TAG = /^v\d+\.\d+\.0$/ // v0.9.0 = a milestone / release stage (v0.9.3 = an update)
const input = readInput()
if (!input.transcript_path || !existsSync(input.transcript_path)) process.exit(0)
const turn = readTurn(input.transcript_path)

// The projects this turn worked in: where it committed, and where it edited plan files.
const projects = new Map() // root → { committed, touchedSprint, published }
const project = (dir) => {
  const top = dir && git(dir, 'rev-parse', '--show-toplevel')
  if (!top) return null
  const root = resolve(top)
  if (!projects.has(root)) projects.set(root, { committed: false, touchedSprint: false, published: false, milestone: false, done: false, lookbacks: new Set(), sketches: new Set(), sentFiles: [] })
  return projects.get(root)
}
for (const tool of turn.tools) {
  const file = tool.input.file_path || ''
  if (isCommit(tool)) {
    for (const call of gitCalls(tool.input.command, tool.cwd)) {
      if (call.sub !== 'commit') continue
      const p = project(call.dir)
      if (!p) continue
      p.committed = true
      if (/^F\d+[a-z]?: done\b/.test(commitMessage(tool.input.command, call.args))) p.done = true
    }
  }
  // the release scripts commit + tag inside their own process (git calls the shell never shows): note the project,
  // the tags made this turn are looked up below
  if ((tool.name === 'Bash' || tool.name === 'PowerShell') && /\b(release|save|merge|archive-sprint)\.mjs\b/.test(tool.input.command || '')) project(tool.cwd)
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
  if (tool.name === 'Artifact' && /ppp\.html$/.test(file)) {
    const p = project(resolve(file, '..', '..'))
    if (p) { p.published = true; p.sentFiles.push(...sentFiles(tool.input.files)) }
  }
  if (/[\\/]\.planning[\\/]research[\\/]sketches[\\/][^\\/]+\.html$/.test(file) && tool.name !== 'Artifact') { const p = project(existingDir(file)); if (p) p.sketches.add(basename(file)) }
  if (['Write', 'Edit', 'MultiEdit'].includes(tool.name) && /[\\/]content[\\/]/.test(file)) project(existingDir(file)) // a data file: checked against the TDD (6)
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
  if (milestoneTaggedSince(root, turn.startedAt)) p.milestone = true
  if (p.milestone && !p.lookbacks.size && !recentLookback(root)) {
    problems.push(`${name}: a milestone / release stage went out this turn, but there's no look-back. Write .planning/archive/lookbacks/<milestone>.md and land each lesson in its home (~/.claude/config/bmuz/templates/lookback.md).`)
  }
  for (const file of p.lookbacks) problems.push(...lookbackProblems(file, root).map(problem => `${name}: look-back ${problem}`))
  // 8. a release went out (any vX.Y.Z tag made this turn) in a BMUZ project → .planning/live-pass names that tag
  const released = tagsSince(root, turn.startedAt, /^v\d+\.\d+\.\d+$/).pop()
  if (released && existsSync(join(root, '.planning', 'STATE.md'))) {
    let pass = ''
    try { pass = readFileSync(join(root, '.planning', 'live-pass'), 'utf8').split(/\r?\n/)[1] || '' } catch {}
    if (pass.split(/\s+/)[0] !== released) problems.push(`${name}: ${released} was released this turn, but .planning/live-pass doesn't record a live check for it — after the push run node ~/.claude/config/bmuz/scripts/live-check.mjs (it waits for the deploy, checks the page has ${released}, and records it; a project with nothing hosted records the skip), then commit live-pass with STATE.`)
  }
  // 4. approved but not saved
  if (p.done) {
    const unsaved = unsavedWork(root)
    if (unsaved) problems.push(`${name}: a feature was approved (\`Fnn: done\` commit) but ${unsaved} — /save now, in this turn (/develop §4: "save + keep going").`)
  }
  // 5. the sprint is finished but still sitting there
  const finished = finishedSprint(root)
  // archive-sprint needs Muzzy's 3-line retro first (F81) — without it, the step is to ASK him, and a turn whose last
  // message already asks isn't sent back (review: "archive it" bounced a turn that was waiting on his answers)
  const lastWords = input.last_assistant_message ?? turn.lastText ?? ''
  if (finished && !finished.retro && /\bretro\b|went well/i.test(lastWords)) { /* waiting on Muzzy's retro — fine */ }
  else if (finished && !finished.retro) {
    problems.push(`${name}: every feature in SPRINT.md (${finished.ids}) is ✅ in ROADMAP — before archiving, ask Muzzy the 3-line retro (went well · went wrong · change; you may draft from the sprint's Notes, his words win), write it as "Retro:" in SPRINT.md, then node ~/.claude/config/bmuz/scripts/archive-sprint.mjs.`)
  } else if (finished) {
    const bugs = openBugs(root)
    const sweep = bugs.P0 + bugs.P1 > 0 || bugs.P2 >= 3
      ? ` BUGS.md has ${bugs.P0} P0 · ${bugs.P1} P1 · ${bugs.P2} P2 open — offer Muzzy a /bug sweep first (/develop §4).`
      : ''
    problems.push(`${name}: every feature in SPRINT.md (${finished.ids}) is ✅ in ROADMAP — archive it: node ~/.claude/config/bmuz/scripts/archive-sprint.mjs, then say "Next: /sprint".${sweep}`)
  }
  // 6. new data files the TDD doesn't list
  const unlisted = newContentFiles(root, turn.startedAt).filter(f => !tddMentions(root, f))
  if (unlisted.length) problems.push(`${name}: new data file(s) ${unlisted.slice(0, 4).join(', ')} this turn, but .planning/TDD.md doesn't mention ${unlisted.length > 1 ? 'them' : 'it'} (or ${unlisted.length > 1 ? 'their' : 'its'} folder). Add ${unlisted.length > 1 ? 'them' : 'it'} to the TDD's data-files list (§1/§3: what it holds, who edits it — Muzzy in the Dev Kit or Obsidian) so the next session knows it's there.`)
  // 2. planner page rebuilt but not republished
  const gitDir = git(root, 'rev-parse', '--absolute-git-dir')
  const rebuilt = gitDir && join(gitDir, 'bmuz-ppp-rebuilt')
  const link = plannerLink(root)
  // 7. a sketch changed, not sent with the planner
  const unsent = link ? [...p.sketches].filter(s => !p.sentFiles.some(f => basename(f) === s)) : []
  if (unsent.length) problems.push(`${name}: sketch ${unsent.join(', ')} changed this turn, but the planner wasn't republished with ${unsent.length > 1 ? 'them' : 'it'} — publish .planning/ppp.html to ${link} with files: {${unsent.map(s => `"sketches/${s}": ".planning/research/sketches/${s}"`).join(', ')}} (/ppp step 2), so its Sketches tab shows the new version.`)
  if (!rebuilt || !link || !existsSync(rebuilt)) continue
  const published = join(gitDir, 'bmuz-ppp-published')
  if (p.published) { writeFileSync(published, new Date().toISOString()); continue }
  if (!existsSync(published) || statSync(published).mtimeMs < statSync(rebuilt).mtimeMs) {
    problems.push(`${name}: the plan files changed, so the planner page was rebuilt (.planning/ppp.html) — republish it to ${link} with the Artifact tool (url = that link).`)
  }
}
stopVerdict('stop-plan-check', input, problems.length && `Before handing back:\n- ${problems.join('\n- ')}`)
process.exit(0)

// A vX.Y.0 tag made since the turn began (by hand or by a script — the tag's own date is what counts).
function milestoneTaggedSince(root, startedAt) {
  return tagsSince(root, startedAt, MILESTONE_TAG).length > 0
}

// Tags matching `pattern` made since the turn began, oldest first.
function tagsSince(root, startedAt, pattern) {
  if (!startedAt) return []
  const since = Date.parse(startedAt) / 1000 - 5
  const tags = (git(root, 'for-each-ref', '--sort=creatordate', '--format=%(creatordate:unix) %(refname:short)', 'refs/tags') || '').split('\n')
  return tags.map(line => line.split(' ')).filter(([when, tag]) => pattern.test(tag || '') && Number(when) >= since).map(([, tag]) => tag)
}

// Why the project isn't saved, or '' — uncommitted files, commits GitHub doesn't have, a branch never pushed.
function unsavedWork(root) {
  if ((git(root, 'status', '--porcelain') || '').trim()) return 'there are uncommitted changes'
  if (!git(root, 'remote')) return ''
  const upstream = git(root, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}')
  if (!upstream) return 'the branch was never pushed'
  const ahead = parseInt(git(root, 'rev-list', '--count', `${upstream}..HEAD`) || '0', 10)
  return ahead ? `${ahead} commit(s) aren't on GitHub yet` : ''
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

// The nearest folder above a file that exists (a file may have been moved or deleted since).
function existingDir(file) {
  let dir = resolve(file, '..')
  while (!existsSync(dir) && resolve(dir, '..') !== dir) dir = resolve(dir, '..')
  return dir
}

// The published paths and sources an Artifact call sent as `files` (a map or a list).
function sentFiles(files) {
  if (!files) return []
  if (Array.isArray(files)) return files.map(f => (typeof f === 'string' ? f : f?.path || '')).filter(Boolean)
  return Object.entries(files).flatMap(([key, v]) => [key, typeof v === 'string' ? v : v?.from || v?.path || ''])
}

function openBugs(root) {
  const counts = { P0: 0, P1: 0, P2: 0 }
  try {
    for (const b of readBugs(readFileSync(join(root, '.planning', 'BUGS.md'), 'utf8').replace(/\r\n/g, '\n'))) if (isOpenBug(b) && b.priority in counts) counts[b.priority]++
  } catch { /* no BUGS.md */ }
  return counts
}

// Files under content/ that are new this turn: added by a commit since the turn began, or staged-new / untracked AND
// created since the turn began (review: a file Muzzy is still drafting sent every working turn back).
function newContentFiles(root, startedAt) {
  if (!startedAt || !existsSync(join(root, 'content')) || !existsSync(join(root, '.planning', 'TDD.md'))) return []
  const since = Date.parse(startedAt) - 5000
  const lines = (...args) => (git(root, ...args) || '').split('\n').filter(f => f.startsWith('content/'))
  const madeThisTurn = (f) => { try { const s = statSync(join(root, f)); return (s.birthtimeMs || s.mtimeMs) >= since } catch { return false } }
  return [...new Set([
    ...lines('log', '--since', startedAt, '--diff-filter=A', '--name-only', '--format='),
    ...[...lines('diff', '--cached', '--name-only', '--diff-filter=A'), ...lines('ls-files', '--others', '--exclude-standard')].filter(madeThisTurn),
  ])]
}

// Does the TDD name this data file — its path, its folder ("content/lessons/"), or its file name?
function tddMentions(root, file) {
  let tdd = ''
  try { tdd = readFileSync(join(root, '.planning', 'TDD.md'), 'utf8') } catch { return true }
  const folder = file.split('/').slice(0, -1).join('/')
  const name = basename(file)
  return tdd.includes(file) || (folder !== 'content' && (tdd.includes(`${folder}/`) || tdd.includes(`${folder}\``) || tdd.includes(`${folder} `))) || tdd.includes(name)
}

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
    // a checklist line is the last resort (F80): it says its kind — ② what refuses until it's on record, ③ why nothing can
    if (home[1] === 'checklist' && !/[②③]/.test(home[2])) problems.push(`item "${item}…" → checklist needs its kind in the brackets: "(② <what refuses until it's on record>)" or "(③ <why nothing can check it>)" — or a stronger home (hook / check / script)`)
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
