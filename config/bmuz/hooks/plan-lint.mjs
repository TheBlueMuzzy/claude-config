// Plan files stay well-formed (F67). Hooked on Edit|Write|MultiEdit (PostToolUse).
// After Claude edits .planning/ROADMAP.md, SPRINT.md, BUGS.md or STATE.md: check the rules from PROJECT-FILES.md,
// tell Claude about any problem in the file it just edited, and rebuild the planner page (.planning/ppp.html).
// Reads the files with the same reader as the planner page (templates/ppp/plan-reader.mjs), so both agree.
// Also a command: `node plan-lint.mjs <projectDir>` prints every problem (exit 1 if any).
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { readRoadmap, readSprint, readBugs, isOpenBug } from '../templates/ppp/plan-reader.mjs'
import { git, readInput, tellClaude } from './lib.mjs'

const PLAN_FILES = ['ROADMAP.md', 'SPRINT.md', 'BUGS.md', 'STATE.md']
const LISTING = '.planning/' // texts[LISTING] = the folder's entries (the last commit's, for "new since HEAD")
// What may sit in .planning/ (PROJECT-FILES "Layout"): the plan files, the optional folders, and what the tools write
const ALLOWED = new Set([...PLAN_FILES, 'GDD.md', 'TDD.md', 'design', 'research', 'bugs', 'archive', 'ppp.html', 'smoke-pass', 'live-pass', 'STATE.md.bak'])
const BUILD_PPP = join(homedir(), '.claude', 'config', 'bmuz', 'templates', 'ppp', 'build-ppp.mjs')

if (process.argv[2]) {
  // command mode
  const problems = lintProject(resolve(process.argv[2]))
  for (const p of problems) console.log(`${p.file}:${p.line || ''}  ${p.message}`)
  console.log(problems.length ? `${problems.length} problem(s)` : 'plan files OK')
  process.exit(problems.length ? 1 : 0)
}

const input = readInput()
const file = input.tool_input?.file_path
if (!file) process.exit(0)
const full = resolve(file)
if (basename(dirname(full)) !== '.planning' || !PLAN_FILES.includes(basename(full))) process.exit(0)
const project = dirname(dirname(full))

// Only problems that are new since the last commit: old ones (history, another session's files) don't nag every edit.
const before = {}
for (const name of PLAN_FILES) before[name] = git(project, 'show', `HEAD:.planning/${name}`)
before[LISTING] = (git(project, 'ls-tree', '--name-only', 'HEAD', '.planning/') || '').split('\n').filter(Boolean).map(p => basename(p))
const old = new Set(lintProject(project, before).map(p => `${p.file} ${p.message}`))
// problems with the .planning folder itself show on any plan edit
const mine = lintProject(project).filter(p => (p.file === basename(full) || p.file === '.planning/') && !old.has(`${p.file} ${p.message}`))
const pppNote = rebuildPlanner(project)
if (mine.length) {
  const lines = mine.map(p => `- ${p.file}${p.line ? `:${p.line}` : ''}  ${p.message}`)
  tellClaude(`plan-lint found problems in .planning/${basename(full)} (rules: ~/.claude/config/bmuz/PROJECT-FILES.md) — fix them now:\n${lines.join('\n')}${pppNote}`)
}
process.exit(0)

// Every problem in a project's plan files: { file, line, message }.
// `texts` replaces files' contents (name → text, or null = no such file) — used for the last commit's version.
function lintProject(dir, texts = null) {
  const read = (name) => { if (texts) return texts[name] ?? null; try { return readFileSync(join(dir, '.planning', name), 'utf8').replace(/\r\n/g, '\n') } catch { return null } }
  const problems = []
  const add = (file, line, message) => problems.push({ file, line, message })
  const roadmapText = read('ROADMAP.md')
  const roadmap = roadmapText === null ? null : readRoadmap(roadmapText)
  if (roadmap) lintRoadmap(roadmap, add)
  const sprintText = read('SPRINT.md')
  const bugsText = read('BUGS.md')
  if (sprintText !== null) lintSprint(readSprint(sprintText), roadmap, add, sprintText, dir, bugsText)
  if (bugsText !== null) lintBugs(bugsText, add, dir)
  const stateText = read('STATE.md')
  if (stateText !== null) lintState(stateText, add)
  // nothing else in .planning/ (F80) — only in a BMUZ project (an old GSD one has its own files until converted)
  if (stateText !== null && /RESUME HERE/.test(stateText)) {
    let names = texts ? texts[LISTING] || [] : []
    if (!texts) try { names = readdirSync(join(dir, '.planning')) } catch {}
    for (const name of names.filter(n => !ALLOWED.has(n) && !n.startsWith('.'))) {
      if (!texts && git(dir, 'check-ignore', '-q', `.planning/${name}`) !== null) continue // gitignored: the tools' own
      add(LISTING, null, `.planning/${name} doesn't belong in .planning/ — only GDD, TDD, ROADMAP, SPRINT, BUGS, STATE + design/ research/ bugs/ archive/ (PROJECT-FILES "Layout"). Move it into research/ or design/ (or archive/ once its rules are in Key facts)`)
    }
  }
  return problems
}

function lintRoadmap({ milestones, parking, allItems }, add) {
  const F = 'ROADMAP.md'
  const everything = [...allItems, ...parking]
  const byId = {}
  for (const item of everything.filter(i => i.id)) {
    if (byId[item.id]) add(F, item.lineNo, `${item.id} is used twice (also line ${byId[item.id].lineNo}) — IDs are permanent and unique`)
    else byId[item.id] = item
  }
  for (const item of everything) {
    // scope + needs must come after the line's LAST " — ", or the planner page (and this check) can't see them
    if (!item.needs.length && /\bneeds:\s*~?F\d/.test(item.raw)) add(F, item.lineNo, `${item.id || item.title}: "needs:" isn't read — a " — " later in the line hides it; keep "— must · needs: …" last (use ":" inside notes)`)
    for (const need of item.needs) {
      const id = need.replace(/^~/, '')
      const other = byId[id]
      if (!/^F\d+[a-z]?$/.test(id)) continue // "—", another project's feature ("fw F27"), words
      if (!other) { add(F, item.lineNo, `${item.id || item.title} needs ${id}, but there's no ${id} in the roadmap`); continue }
      // ready / building / done means everything it needs is done (a feature built in the same sprint counts — sprint
      // rule); a soft "~" need only has to work (🎛️ tuning is enough)
      const started = ['develop', 'deliver', 'done'].includes(item.state.key) || /^- 🟢/.test(item.raw)
      const needDone = need.startsWith('~') ? met(need, byId) : other.state.key === 'done'
      const sameSprint = item.state.key === 'develop' && other.state.key === 'develop'
      if (started && !needDone && !sameSprint) add(F, item.lineNo, `${item.id} is ${item.state.label} but needs ${id}, which is ${other.state.label} — never build before what it needs`)
    }
    // the ready rule, kept fresh by the hook (F80 — /sprint and /roadmap used to "refresh states" from memory):
    // ⏳ waiting whose needs are all met → 🟢 ready
    const featureNeeds = item.needs.filter(n => /^~?F\d+[a-z]?$/.test(n))
    // (a line that says it waits on something else — a note like "when a 3D game needs it", "(needs framework F25)" — stays ⏳)
    const waitsOnMore = item.notes.length || /\bneeds\b|\bwait/i.test(item.title || '')
    if (/^- ⏳/.test(item.raw) && item.id && featureNeeds.length && !waitsOnMore && featureNeeds.every(n => met(n, byId))) {
      add(F, item.lineNo, `${item.id} is ⏳ waiting, but everything it needs (${featureNeeds.join(', ')}) is done — set it 🟢 ready (ready rule, PROJECT-FILES), or add what else it waits for ("· waits: <what>")`)
    }
  }
  // every feature in a live milestone says what kind it is and how much it matters (F80 — "typed, scoped")
  for (const m of milestones.filter(m => !m.released)) {
    for (const item of m.items.filter(i => i.id && !['done', 'wont'].includes(i.state.key))) {
      if (!item.type) add(F, item.lineNo, `${item.id} has no type — put ❓ 🧱 🎮 ✨ 🔧 or 🐞 right after the ID`)
      if (!item.scope && item.type !== '❓') add(F, item.lineNo, `${item.id} has no scope — end the line with "— must:<stage>" / "— should" / "— could" (then "· needs: …")`)
    }
  }
  // the Mermaid graph shows the same needs as the item lines
  // (released milestones are history — not re-checked)
  for (const m of milestones.filter(m => m.mermaid && !m.released)) {
    const edges = mermaidEdges(m.mermaid)
    const inGraph = new Set(edges.flatMap(([a, b]) => [a, b]))
    for (const [from, to] of edges) {
      if (!byId[from] || !byId[to]) { add(F, null, `graph in "${m.name}": ${!byId[from] ? from : to} isn't in the roadmap`); continue }
      if (!byId[to].needs.some(n => n.replace(/^~/, '') === from)) add(F, byId[to].lineNo, `graph in "${m.name}" says ${from} → ${to}, but ${to} doesn't list "needs: ${from}"`)
    }
    for (const item of m.items.filter(i => i.id && inGraph.has(i.id))) {
      for (const need of item.needs.map(n => n.replace(/^~/, ''))) {
        if (inGraph.has(need) && !edges.some(([a, b]) => a === need && b === item.id)) add(F, item.lineNo, `${item.id} needs ${need}, but the graph in "${m.name}" has no ${need} → ${item.id} arrow`)
      }
    }
  }
}

// Is a need met? ✅ done — or, for a soft "~F07" need, 🎛️ tuning is enough (it only has to work). Unknown → no.
function met(need, byId) {
  const other = byId[need.replace(/^~/, '')]
  if (!other) return false
  return other.state.key === 'done' || (need.startsWith('~') && /^- 🎛/.test(other.raw))
}

// "A --> B[label] --> C" and "A -.-> B" → [[A, B], [B, C]]
function mermaidEdges(text) {
  const edges = []
  for (const line of text.split('\n')) {
    // arrows: --> · -.-> · ==> · --- · labelled "-.working.->" / "-- text -->" / "-->|text|"
    const parts = line.replace(/\[[^\]]*\]|\([^)]*\)|\{[^}]*\}|"[^"]*"/g, '').split(/\s*(?:-\.[^>]*?\.?->|--[^->]*-->|-->|==>|---)(?:\|[^|]*\|)?\s*/)
    if (parts.length < 2) continue
    const ids = parts.map(p => (p.trim().match(/^[A-Za-z]\w*/) || [''])[0])
    const isFeature = (id) => /^F\d+[a-z]?$/.test(id) // other nodes (another project's "FW19") aren't checked
    for (let i = 0; i + 1 < ids.length; i++) if (isFeature(ids[i]) && isFeature(ids[i + 1])) edges.push([ids[i], ids[i + 1]])
  }
  return edges
}

function lintSprint(sprint, roadmap, add, text, dir, bugsText) {
  const F = 'SPRINT.md'
  // tasks under a heading that isn't a feature ("## Extras") never show in the planner
  let heading = null
  text.split('\n').forEach((line, n) => {
    if (/^## /.test(line)) heading = /^## F\d+[a-z]?\b/.test(line) ? null : { text: line.slice(3).trim(), lineNo: n + 1, warned: false }
    else if (heading && !heading.warned && /^- \[( |x)\]/i.test(line)) {
      heading.warned = true
      add(F, heading.lineNo, `tasks under "## ${heading.text}" don't show in the planner — put them under the "## F…" feature they belong to`)
    }
  })
  for (const feature of sprint.features) {
    const item = roadmap?.byId[feature.id]
    if (roadmap && !item) { add(F, feature.lineNo, `${feature.id} isn't in ROADMAP.md`); continue }
    const isDecision = item?.type === '❓'
    const [min, max] = isDecision ? [1, 2] : [3, 8]
    const n = feature.steps.length
    if (n < min || n > max) add(F, feature.lineNo, `${feature.id} has ${n} task(s) — a ${isDecision ? '❓ decision has 1–2' : 'feature has 3–8'}`)
    for (const step of feature.steps) {
      if (!/^(🤖|🙋)\s*\d+[a-z]?\.\s/.test(step.text)) add(F, step.lineNo, `task should read "🤖 3. …" or "🙋 3. …" (owner + number)`)
    }
    const allDone = n > 0 && feature.steps.every(s => s.done)
    if (item && !allDone && !['develop', 'done'].includes(item.state.key)) add(F, feature.lineNo, `${feature.id} is in the sprint but ROADMAP says ${item.state.label} — set it 🔨`)
    // tasks name real files (F80 — "look at the code first"): each path after the task's last " — " exists, or its
    // folder does (a file the task will create)
    for (const step of feature.steps) {
      for (const path of taskPaths(step.text)) {
        // the project's own files; the framework's sprints also name BMUZ's files (~/.claude/config/bmuz/…, then "templates/x.md")
        const bases = path.startsWith('~') ? [homedir()] : [dir, join(homedir(), '.claude', 'config', 'bmuz'), join(homedir(), '.claude')]
        const real = bases.some(base => { const full = join(base, path.replace(/^~[\\/]?/, '')).replace(/[\\/]+$/, ''); return existsSync(full) || existsSync(dirname(full)) })
        if (!real) add(F, step.lineNo, `${feature.id} task names ${path}, but neither it nor its folder exists — look at the code and name the real files`)
      }
    }
  }
  // open P0/P1 bugs always go in as tasks (F80): each one is named somewhere in the sprint (a task, or a Notes line saying why it waits)
  if (bugsText !== null && bugsText !== undefined) {
    const label = sprint.title || 'This sprint'
    for (const bug of readBugs(bugsText).filter(b => isOpenBug(b) && /P[01]/.test(b.priority) && !/watching/i.test(b.status))) {
      if (!new RegExp(`\\b${bug.id}\\b`).test(text)) add(F, null, `"${label}" doesn't name open ${bug.priority} ${bug.id} — open P0/P1 bugs always go in as tasks (or a Notes line saying why it waits)`)
    }
  }
}

// The file paths a task names after its last " — " ("… — src/a.ts, content/x/"): words with a slash or a file
// extension, no spaces. "(tuning)", "answered 2026-10-19 (…)" and plain words aren't paths.
function taskPaths(text) {
  const dash = text.lastIndexOf(' — ')
  if (dash < 0) return []
  return text.slice(dash + 3).split(/,\s*|\s+\+\s+/).map(w => w.trim().replace(/^`|`$/g, '').replace(/\s*\((stand-in|tuning)\)$/, ''))
    .filter(w => w && !/\s/.test(w) && /^[\w.~@-]/.test(w) && (/\//.test(w) || /\.[a-z]{1,5}$/i.test(w)) && !/^https?:/.test(w) && !/^\d/.test(w))
}

function lintBugs(text, add, dir) {
  const F = 'BUGS.md'
  const bugs = readBugs(text)
  const seen = {}
  for (const bug of bugs) {
    if (seen[bug.id]) add(F, bug.lineNo, `${bug.id} is used twice (also line ${seen[bug.id]})`)
    seen[bug.id] = bug.lineNo
    const open = isOpenBug(bug)
    if (bug.section === 'open' && !open) add(F, bug.lineNo, `${bug.id} is "${bug.status}" but sits under ## Open — move it to ## Fixed`)
    if (bug.section === 'fixed' && open) add(F, bug.lineNo, `${bug.id} is "${bug.status}" but sits under ## Fixed — move it to ## Open`)
    if (!open && /fixed|verified/i.test(bug.status) && /P[01]/.test(bug.priority) && !/Guarded by:/i.test(bug.rest)) {
      add(F, bug.lineNo, `${bug.id} (${bug.priority}) is fixed but has no "Guarded by: <test>" — a P0/P1 fix needs a test that keeps it fixed`)
    }
    // the guarding test really exists (F80) — a name that points nowhere guards nothing
    // "Guarded by: e2e/a.mjs (what it checks) + src/b.test.ts — …": the first word of each part, when it's a file
    let guard = ((bug.rest.match(/Guarded by:\s*(.*?)(?:\s+—\s|\s+·\s|$)/i) || [])[1] || '')
    for (let i = 0; i < 5; i++) guard = guard.replace(/\([^()]*\)/g, '')
    for (const part of guard.split(/,|\s\+\s|\sand\s/)) {
      const path = (part.trim().split(/\s+/)[0] || '').replace(/^`|`$/g, '')
      if (!/^[\w.~-][\w./~-]*\.[a-z]{1,4}$/i.test(path)) continue // words, npm scripts ("e2e"), folders
      if (!existsSync(join(dir, path))) add(F, bug.lineNo, `${bug.id} is "Guarded by: ${path}", but that file doesn't exist — name the real test file`)
    }
  }
  // a "### B…" heading the reader can't parse drops out of the counts and the P0 gate (F80)
  text.split('\n').forEach((line, n) => {
    if (/^###\s*B\d/.test(line) && !/^### (B\d+) · (P\d) · ([^·\n]+)/.test(line)) add(F, n + 1, `"${line.slice(0, 60)}" isn't read as a bug — write it "### B014 · P2 · open · found <date> …" (middle dots ·), or it drops out of the counts and the P0 check`)
  })
  const header = text.match(/^Open:\s*(\d+)(?:\s*\(([^)]*)\))?/m)
  const count = (list) => `${list.length} (${['P0', 'P1', 'P2', 'P3'].map(p => `${p} ${list.filter(b => b.priority === p).length}`).join(' · ')})`
  const open = bugs.filter(isOpenBug)
  const want = count(open)
  const wantNoWatching = count(open.filter(b => !/watching/i.test(b.status))) // "Open: 0 (…) · watching: 2" counts them apart
  const line = text.split('\n').findIndex(l => /^Open:/.test(l)) + 1
  const says = header && `${header[1]} (${(header[2] || '').trim()})`
  if (!header) add(F, null, `no "Open: N (P0 · P1 · P2 · P3)" line under the title — should be "Open: ${want}"`)
  else if (says !== want && says !== wantNoWatching) add(F, line, `"Open:" line says ${says} — the open bugs are ${want}`)
}

function lintState(text, add) {
  const F = 'STATE.md'
  const lines = text.replace(/\n+$/, '').split('\n')
  if (lines.length > 120) add(F, null, `STATE is ${lines.length} lines — keep it under ~120 (prune Key facts, move old Log lines to archive/log.md)`)
  const section = (re) => {
    const start = lines.findIndex(l => re.test(l)); if (start < 0) return null
    let end = lines.findIndex((l, n) => n > start && /^## /.test(l)); if (end < 0) end = lines.length
    return { start, body: lines.slice(start + 1, end).filter(l => l.trim()) }
  }
  const resume = section(/^## ▶ RESUME HERE/)
  if (!resume) add(F, null, 'no "## ▶ RESUME HERE" section')
  else if (resume.body.length > 12) add(F, resume.start + 1, `RESUME HERE is ${resume.body.length} lines — 2–5 lines, REPLACED each time, never appended`)
  if (!section(/^## Where we are/)) add(F, null, 'no "## Where we are" section')
  const facts = section(/^## Key facts/)
  if (facts && facts.body.length > 50) add(F, facts.start + 1, `Key facts is ${facts.body.length} lines — ~40 max, prune stale ones`)
  const log = section(/^## Log/)
  const entries = log ? log.body.filter(l => /^- /.test(l)).length : 0
  if (entries > 10) add(F, log.start + 1, `Log has ${entries} entries — keep 10, older → archive/log.md`)
}

// Rebuild .planning/ppp.html when the project has a planner page (it's gitignored). Returns a note for Claude.
function rebuildPlanner(dir) {
  const page = join(dir, '.planning', 'ppp.html')
  if (!existsSync(page) && git(dir, 'check-ignore', '-q', '.planning/ppp.html') === null) return ''
  try {
    execFileSync(process.execPath, [BUILD_PPP, dir], { encoding: 'utf8', timeout: 20_000, stdio: 'pipe' })
  } catch (error) {
    return `\n(the planner page didn't rebuild: ${String(error.stderr || error.message).split('\n')[0]})`
  }
  const gitDir = git(dir, 'rev-parse', '--absolute-git-dir')
  if (gitDir) writeFileSync(join(gitDir, 'bmuz-ppp-rebuilt'), new Date().toISOString())
  return ''
}
