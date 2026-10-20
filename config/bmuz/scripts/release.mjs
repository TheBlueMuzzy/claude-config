// Version + release commit + tag, in one go (F69) — /deliver §5. Rules: ~/.claude/references/versioning.md
//   node ~/.claude/config/bmuz/scripts/release.mjs <update|milestone|stage|major> "<one-line summary>" [--stage=<alpha|beta|1.0…>] [--dry-run] [overrides]
//     update    → Z (0.9.2 → 0.9.3)      milestone / stage → Y (0.9.3 → 0.10.0)      major → X (only when Muzzy says 1.0)
//
// F80: every "make sure it's ready" step of /deliver is a gate here. ALL gates are checked first and every failing one
// is reported together; only when all pass does anything change ("refuse before changing anything"). --dry-run runs
// every gate and changes nothing. The gates (D-rows of reviews/2026-10-19-triggers/AUDIT.md):
//   always       version.json is X.Y.Z · no uncommitted code · on the default branch · the tag is new
//                D26 GitHub green for the last work branch merged since the last tag (+ HEAD when code landed after it)
//                D7  the Fast tier is green (check:fast, reusing stop-check-fast's green record; else test + build)
//                D10 check:framework is green (a game with framework copies but no check:framework → refused)
//   BMUZ project (.planning/STATE.md)
//                D6  STATE's Log has a line dated today          D32 RESUME HERE names the new tag (Version: is written here)
//                D38 Key facts has a `Release:` line             D11 no code since `Last full check:` (with check:full)
//                D20 no code since `Reviewed through:`           D19 no code since `Security reviewed:`
//                D12 no open P0 (BUGS.md) · D13 open P1s printed
//                D15 every Fnn with commits since the last tag is ✅ in ROADMAP     (override: --unapproved-ok)
//                D18 no finished SPRINT.md left un-archived
//                D31 milestone/stage/major: a ROADMAP milestone heading is ✅ with today's date
//                D4  stage/major: musts-check for --stage (override: --musts-open-ok) and `Release target:` moved on
//                F87 stage/major: a playtest log dated since the last stage release (override: --no-playtest-ok)
//                F84 patch notes: .planning/archive/releases/vX.Y.Z.md exists, isn't a DRAFT, has Highlights, and a
//                    game's has no dev talk (override: --no-notes-ok) — notes.mjs
//   package.json + lockfile
//                F85 deps-check: no GPL-family / unlicensed package and no high security problem in what players get
//                    (override: --deps-risk-ok) — deps-check.mjs
//   printed      D42 "server code changed since <tag>: yes/no"
// Overrides are Muzzy's judgement calls, so each one used goes in the release commit's body ("Released with: …").
// Then: bump (build → 0), history entry, package.json + lock, STATE `Version:`, CHANGELOG.md + the itch text (from the
// notes, F84), public/third-party-notices.txt (games, F85), commit "Release vX.Y.Z: <summary>" (asked of the commit
// hooks first, F80), annotated tag vX.Y.Z, cleanup.sh (D46). It never pushes: /deliver pushes after the smoke pass.
//   release.mjs <kind> --draft-notes   writes the notes draft for the next version from the commits since the last tag
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { git, run, say, ok, refuse, tail, readJson, writeJson, args, projectDir, exists, changedFiles, checksVerdict,
  todays, section, stateValue, commitsIn, codeCommitsSince, lastTag, isCode, fastChecks, cleanup, guardCommit } from './lib.mjs'
import { defaultBranch } from '../hooks/lib.mjs'
import { readBugs, isOpenBug, readRoadmap, readSprint } from '../templates/ppp/plan-reader.mjs'
import { notesFile, itchFile, notesPath, notesProblems, draftNotes, changelogEntry, addToChangelog, itchText } from './notes.mjs'
import { checkDeps, noticesText, summaryLines } from './deps-check.mjs'

const KINDS = { update: 2, milestone: 1, stage: 1, major: 0 } // which part of X.Y.Z goes up
const NOTICES = 'public/third-party-notices.txt' // F85: the licence texts the Credits screen links to
const OVERRIDES = { '--musts-open-ok': 'released with open musts', '--unapproved-ok': 'released with features Muzzy hasn\'t approved yet', '--no-playtest-ok': 'released without a playtest since the last stage',
  '--no-notes-ok': 'released without finished patch notes', '--deps-risk-ok': 'released with a risky package (licence or security)' }
const { words, flags } = args()
const [kind, summary] = words
const drafting = flags.has('--draft-notes')
if (!(kind in KINDS)) refuse(`what kind of release? (got "${kind ?? ''}")`, 'release.mjs <update|milestone|stage|major> "<summary>"')
if (!drafting && !summary?.trim()) refuse('a one-line summary is needed (it goes in version.json history and the commit)', 'release.mjs update "Cards fan out in your hand"')
const stageFlag = [...flags].find(f => f.startsWith('--stage='))
const stage = (stageFlag ? stageFlag.slice(8) : kind === 'major' ? '1.0' : '').toLowerCase()
if (kind === 'stage' && !stage && !drafting) refuse('a stage release names its stage', 'release.mjs stage "<summary>" --stage=alpha')
const unknown = [...flags].filter(f => f !== '--dry-run' && f !== '--draft-notes' && !f.startsWith('--stage=') && !(f in OVERRIDES))
if (unknown.length) refuse(`unknown option${unknown.length > 1 ? 's' : ''}: ${unknown.join(' ')}`, `the overrides are ${Object.keys(OVERRIDES).join(', ')} — each is Muzzy's call`)
const dir = projectDir()
const root = git(dir, 'rev-parse', '--show-toplevel')
if (!root) refuse(`${dir} isn't a git repo`)
const versionFile = join(root, 'version.json')
const version = readJson(versionFile)
if (!version?.version) refuse('no version.json with a "version" here', 'new projects start with {"name": "…", "version": "0.0.0", "build": 0, "history": []}')
if (!/^\d+\.\d+\.\d+$/.test(version.version)) refuse(`version.json "version" isn't X.Y.Z: "${version.version}"`)
const parts = version.version.split('.').map(Number)
const at = KINDS[kind]
parts[at] += 1
for (let i = at + 1; i < 3; i++) parts[i] = 0
const next = parts.join('.')
const tag = `v${next}`
const since = lastTag(root)
// A library (STATE `Release: none (library)`, like dev/framework) gets library notes (Breaking · New · Fixed) and no
// notices file; anything else is a game.
const stateRelease = stateValue((() => { try { return readFileSync(join(root, '.planning', 'STATE.md'), 'utf8') } catch { return '' } })(), 'Release') || ''
const library = /^none \(library\)/i.test(stateRelease)

// --- F84: --draft-notes writes the next version's notes draft and stops (never over an existing file) ---------------
if (drafting) {
  const file = notesPath(root, next)
  if (existsSync(file)) refuse(`${notesFile(next)} already exists — not overwritten`, 'edit it (or delete it first to start a fresh draft)')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, draftNotes({ version: next, commits: codeCommitsSince(root, [], since), game: !library }))
  ok(`drafted ${notesFile(next)} from the commits since ${since || 'the start'} (${library ? 'library' : 'game'} notes)`)
  say(`Next: rewrite it with Muzzy in the player's words (neutral voice: "Fixed the crash when…"), fill Highlights, delete the DRAFT line — then release.`)
  process.exit(0)
}

// Every failing gate lands here: [text, fix]. Reported together at the end of the checks.
const problems = []
const fail = (text, fix = '') => problems.push([text, fix])
const used = [] // overrides used → the commit body
const override = (flag, why) => { if (!flags.has(flag)) return false; used.push(`${flag} (${why})`); return true }

// --- git: what's being released ------------------------------------------------------------------------------------
// ROADMAP / STATE updates for the release ride along in the release commit (/deliver §5); code never does
const dirty = changedFiles(root).map(f => f.path)
const code = dirty.filter(f => !/^\.planning\//.test(f) && !/\.md$/i.test(f) && f !== NOTICES)
if (code.length) fail(`there's uncommitted code — a release commit holds only the version change and plan notes:\n${code.slice(0, 8).map(l => `    ${l}`).join('\n')}`, 'commit it on the work branch (or /save) first')
const branch = git(root, 'rev-parse', '--abbrev-ref', 'HEAD')
const main = defaultBranch(root)
if (main && branch !== main) fail(`on "${branch}", not ${main} — /deliver merges the work branch into ${main} first`, `node ~/.claude/config/bmuz/scripts/merge.mjs ${branch}`)

if (git(root, 'rev-parse', '--verify', '--quiet', `refs/tags/${tag}`) !== null) fail(`tag ${tag} already exists`, 'look at `git tag` — was this release already made?')

// D26: GitHub green (F70) for the last work branch merged since the last tag — not only when HEAD itself is the merge
// (a fast-forward, or any commit after the merge, used to skip the check). Code on main after that merge → HEAD too.
const lastMerge = git(root, 'log', '-1', '--merges', '--format=%H', since ? `${since}..HEAD` : 'HEAD')
const toCheck = []
if (lastMerge) toCheck.push({ commit: git(root, 'rev-parse', `${lastMerge}^2`), what: 'the work branch merged in' })
const after = codeCommitsSince(root, lastMerge ? [lastMerge] : [], since)
if (after.length && git(root, 'rev-parse', 'HEAD') !== lastMerge) toCheck.push({ commit: git(root, 'rev-parse', 'HEAD'), what: `${branch} (code committed straight on it)` })
for (const { commit, what } of toCheck) {
  const v = checksVerdict(root, { commit })
  if (v.verdict === 'green') ok(`${what}: ${v.text}`)
  else if (v.verdict === 'warn') say(`⚠ ${v.text}\n  → ${v.fix}`)
  else fail(`${what}: ${v.text}`, v.fix)
}

// --- the project's checks ----------------------------------------------------------------------------------------
// D7: the Fast tier, fresh (or this exact code already passed it — stop-check-fast's record)
const pkg = readJson(join(root, 'package.json'))
const scripts = pkg?.scripts || {}
const fast = fastChecks(root)
for (const check of fast) {
  const label = check.name === 'check:fast' ? 'check:fast' : `npm run ${check.name}`
  if (check.ok) ok(check.cached ? `${label} already green on this exact code` : `${label} green`)
  else fail(`${label} fails:\n${tail(check.out, 8)}`, 'fix it on a work branch, merge, then release')
}
if (!fast.length && pkg) say('⚠ no check:fast, test or build script — nothing checked the code (add check:fast: templates/check-all.mjs)')
// D10: the framework pieces' promises
const srcDir = join(root, 'src')
const pieces = existsSync(srcDir) && readdirSync(srcDir, { withFileTypes: true }).some(d => d.isDirectory() && (exists(srcDir, d.name, 'VERSION') || exists(srcDir, d.name, 'kit', 'VERSION')))
if (scripts['check:framework']) {
  const fw = run('npm', ['run', 'check:framework'], { cwd: root, timeout: 600_000 })
  if (fw.code === 0) ok('check:framework green')
  else fail(`check:framework fails (the framework pieces' promises, credits included):\n${tail(fw.out, 10)}`, 'fix what it names (each failure names the file + the fix)')
} else if (pieces) {
  fail('this game has framework pieces (src/*/VERSION) but no check:framework script, so their promises (live tuning, pause, snapshots, UI sizes, credits) go unchecked', 'reinstall the Dev Kit with install-module.mjs (it adds check:framework), commit, merge, then release')
}
// F85: the packages players get — licences that can't ship and high security problems refuse; offline → a warning
let notices = null // public/third-party-notices.txt for a game, written only after every gate passes
if (pkg && (exists(root, 'package-lock.json') || exists(root, 'npm-shrinkwrap.json'))) {
  const deps = checkDeps(root)
  for (const line of summaryLines(deps)) say(line)
  for (const w of deps.warnings) say(`⚠ ${w}`)
  if (deps.refusals.length && !override('--deps-risk-ok', deps.refusals.map(([t]) => t.split(' ')[0]).join(', '))) {
    for (const [text, fix] of deps.refusals) fail(`package check: ${text}`, fix)
  } else if (deps.refusals.length) say(`⚠ released with risky packages (Muzzy's call):\n    ${deps.refusals.map(([t]) => t.split('\n')[0]).join('\n    ')}`)
  const isGame = !library && (exists(root, 'public') || ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'].some(f => exists(root, f)))
  if (isGame && !deps.refusals.some(([t]) => /aren't installed|couldn't list/.test(t))) notices = noticesText(deps)
} else if (pkg) say('dependency check skipped — no package-lock.json, so what players get can\'t be pinned down (commit the lockfile)')
else say('dependency check skipped — no package.json (no npm packages)')

// --- the plan files (BMUZ projects) ------------------------------------------------------------------------------
const read = (name) => { try { return readFileSync(join(root, '.planning', name), 'utf8').replace(/\r\n/g, '\n') } catch { return null } }
const stateText = read('STATE.md')
const today = todays()
const isToday = (text) => today.some(d => (text || '').includes(d))
let stateOut = null // STATE with the new Version:, written only after every gate passes
let notesText = null // F84: this release's notes file
let notesReady = false // …finished, so CHANGELOG.md + the itch text are made from it
if (stateText !== null) {
  // D6: /save's STATE + Log step happened for this delivery
  const log = section(stateText, 'Log\\b') || []
  if (!log.some(l => /^- /.test(l) && isToday(l.slice(0, 20)))) fail(`STATE's Log has no line dated today (${today[0]}) — the log should record what's being delivered`, 'add one dated line, player\'s-eye (what this release brings)')
  // D32: RESUME HERE names the new tag; Version: is written here
  const resume = (section(stateText, '▶ RESUME HERE') || []).join('\n')
  if (!new RegExp(`\\bv${next.replace(/\./g, '\\.')}(?!\\d)`).test(resume)) fail(`STATE's ▶ RESUME HERE doesn't name ${tag} — a fresh session wouldn't know this went out`, `rewrite it: "Released ${tag} — next: /sprint (or /roadmap)", plus Stage = deliver and the Live line`)
  const oldVersion = stateText.match(/(Version:\*{0,2}[ \t]*)v?(\d+\.\d+\.\d+(?:\.\d+)?)/)
  const written = oldVersion && oldVersion[2].split('.').length === 3 ? next : `${next}.0`
  stateOut = oldVersion
    ? stateText.replace(oldVersion[0], `${oldVersion[1]}${written}`)
    : stateText.replace(/^(## Where we are[^\n]*\n)/m, `$1Version: ${next}.0\n`)
  // D38: where it goes is on record
  const release = stateValue(stateText, 'Release')
  if (!release) fail('STATE Key facts has no `Release:` line — where this goes (or why nowhere) isn\'t on record', 'add one: `Release: <platform> (recipe …)` · `Release: none (library)` · `Release: not set up (declined <date>)` · `Release: <platform> — blocked: <why>`')
  // D11 / D20 / D19: the full check and both reviews cover every code commit since the last tag
  const covers = [
    ...(scripts['check:full'] ? [['Last full check', 'the full check', '`npm run check:full`, then `Last full check: <commit> — <date> <result>` in STATE']] : []),
    ['Reviewed through', 'the code review', '/code-review (low) on the commits after `Reviewed through:`, fix real bugs, then move `Reviewed through: <commit>`'],
    ['Security reviewed', 'the security review', '/security-review on the changes since the last release, fix real issues, then `Security reviewed: <commit>` in STATE Key facts'],
  ]
  for (const [label, what, fix] of covers) {
    const value = stateValue(stateText, label)
    const missed = codeCommitsSince(root, commitsIn(root, value), since)
    if (!missed.length) continue
    const list = missed.slice(0, 5).map(c => `${c.sha} ${c.subject.slice(0, 60)}`).join('\n    ') + (missed.length > 5 ? `\n    … and ${missed.length - 5} more` : '')
    fail(`${value ? `code changed after STATE's "${label}: ${value.slice(0, 40)}"` : `STATE has no "${label}:" line`}, so ${what} doesn't cover ${missed.length} commit${missed.length > 1 ? 's' : ''}${since ? ` since ${since}` : ''}:\n    ${list}`, fix)
  }
  // D12 / D13: bugs
  const bugs = readBugs(read('BUGS.md') || '').filter(isOpenBug)
  const p0 = bugs.filter(b => b.priority === 'P0')
  if (p0.length) fail(`BUGS.md has an open P0 — a P0 blocks every release:\n    ${p0.map(b => `${b.id}: ${b.next.trim().slice(0, 70)}`).join('\n    ')}`, 'fix it (and get Muzzy\'s "verified"), or ask Muzzy to re-rate it if it isn\'t really a P0')
  const p1 = bugs.filter(b => b.priority === 'P1')
  if (p1.length) say(`⚠ open P1s (ask Muzzy: release anyway, or a bug sweep first?):\n    ${p1.map(b => `${b.id}: ${b.next.trim().slice(0, 70)}`).join('\n    ')}`)
  // D15: features in this delivery that Muzzy hasn't approved (✅ in ROADMAP)
  const roadmapText = read('ROADMAP.md')
  const roadmap = readRoadmap(roadmapText || '')
  const subjects = (git(root, 'log', '--format=%s', since ? `${since}..HEAD` : 'HEAD') || '').split('\n')
  const ids = [...new Set(subjects.flatMap(s => ((s.match(/^\s*(F\d+[a-z]?(?:\s*\+\s*F\d+[a-z]?)*)\s*:/) || [])[1] || '').match(/F\d+[a-z]?/g) || []))].sort()
  const unapproved = ids.filter(id => roadmap.byId[id] && roadmap.byId[id].state.key !== 'done')
  const unknownIds = ids.filter(id => !roadmap.byId[id])
  if (unknownIds.length) say(`⚠ commits since ${since || 'the start'} name ${unknownIds.join(', ')}, which ROADMAP doesn't list`)
  if (unapproved.length && !override('--unapproved-ok', unapproved.join(', '))) {
    fail(`not approved by Muzzy yet (not ✅ in ROADMAP), but in this delivery: ${unapproved.map(id => `${id} (${roadmap.byId[id].state.label})`).join(', ')}`, 'ask Muzzy once: "<id> hasn\'t had your OK yet — release anyway?" — yes → run again with --unapproved-ok; or mark it ✅ when he approves')
  }
  // D18: a finished sprint gets archived before the release
  const sprintText = read('SPRINT.md')
  if (sprintText !== null) {
    const sprint = readSprint(sprintText)
    if (sprint.features.length && sprint.features.every(f => roadmap.byId[f.id]?.state.key === 'done')) fail('SPRINT.md\'s features are all ✅ — the finished sprint should be archived before the release', 'node ~/.claude/config/bmuz/scripts/archive-sprint.mjs')
  }
  // F84: the patch notes — written, edited (not a DRAFT), with Highlights, and in the player's words for a game
  notesText = (() => { try { return readFileSync(notesPath(root, next), 'utf8') } catch { return null } })()
  const notesIssues = notesProblems(notesText, { game: !library, file: notesFile(next), kind })
  // only dev-talk lines left (Muzzy says they're fine) → the notes are still finished: CHANGELOG + itch text are made
  const onlyTalk = notesIssues.length > 0 && notesIssues.every(([, , what]) => what === 'talk')
  if (notesIssues.length && !override('--no-notes-ok', notesText === null ? 'no notes file' : onlyTalk ? 'dev-talk lines kept' : 'notes not finished')) for (const [text, fix] of notesIssues) fail(text, fix)
  else if (onlyTalk) say(`⚠ patch notes released with the lines flagged as dev talk (Muzzy's call) — CHANGELOG + itch text made as written`)
  else if (notesIssues.length) say(`⚠ released without finished patch notes (Muzzy's call) — no CHANGELOG entry or itch text this time`)
  else ok(`patch notes ready: ${notesFile(next)}`)
  notesReady = !notesIssues.length || onlyTalk
  // D31 / D4: a milestone or stage release closes its milestone (and a stage release its stage)
  if (at < 2) {
    // (the milestone's own "· target: <date>" doesn't count as the day it was closed — review)
    const closed = headings(roadmapText).some(h => /✅/.test(h) && isToday(h.replace(/·\s*target:\s*\S+/i, '')))
    if (!closed) fail(`a ${kind} release, but no ROADMAP milestone heading is marked ✅ with today's date`, `mark it: "## v0.3 — <name>  ✅ released ${today[0]} (${tag})"`)
  }
  if (stage) {
    const musts = run(process.execPath, [join(import.meta.dirname, 'musts-check.mjs'), stage], { cwd: root })
    if (musts.code === 0) ok(musts.out.trim().replace(/^✓ /, ''))
    else if (!override('--musts-open-ok', `${stage}: ${musts.out.trim().split('\n').slice(1).map(l => l.trim().split(' ')[0]).join(', ') || 'no musts set'}`)) {
      fail(`the ${stage} musts aren't all done:\n${tail(musts.out, 10)}`, 'finish them, or ask Muzzy: release anyway? yes → run again with --musts-open-ok (list what\'s missing in the release notes)')
    } else say(`⚠ released with open musts — say what's missing in the notes:\n${tail(musts.out, 10)}`)
    const target = ((roadmapText || '').match(/^Release target:\s*([a-z0-9.]+)/im) || [])[1]
    if (target && target.toLowerCase() === stage) fail(`ROADMAP's "Release target:" still says ${stage}`, `move it to the next stage (e.g. "Release target: beta — musts not set (/define)")`)
    // F87: a stage goes out after someone played it — a playtest log (.planning/research/playtests/<date>.md) dated on
    // or after the last stage release (its commit carries "Stage: <x>"; none yet → the first commit)
    const stageReleases = (git(root, 'log', '--format=%cs %s', '--grep=^Stage: ', 'HEAD') || '').split('\n').filter(l => / Release v\d/.test(l))
    const lastStage = (stageReleases[0] || (git(root, 'log', '--reverse', '--format=%cs', 'HEAD') || '').split('\n')[0]).slice(0, 10)
    let logs = []
    try { logs = readdirSync(join(root, '.planning', 'research', 'playtests')).filter(f => /^\d{4}-\d{2}-\d{2}.*\.md$/.test(f)) } catch { /* none yet */ }
    const fresh = logs.filter(f => f.slice(0, 10) >= lastStage)
    if (fresh.length) ok(`playtest log${fresh.length > 1 ? 's' : ''} since ${lastStage}: ${fresh.join(', ')}`)
    else if (!override('--no-playtest-ok', `${stage}: no playtest log since ${lastStage}`)) {
      fail(`no playtest log since the last stage release (${lastStage})${logs.length ? ` — the newest is ${logs.sort().at(-1)}` : ''} — a ${stage} goes out after someone has played it`, '/play in watch mode while Muzzy (or a friend) plays it writes .planning/research/playtests/<date>.md; or ask Muzzy: release without one? yes → run again with --no-playtest-ok')
    }
  }
}
// ROADMAP's milestone headings as written (readRoadmap keeps only the cleaned-up name)
function headings(text) { return (text || '').split('\n').filter(l => /^## /.test(l) && !/^## (later|ideas|parking lot)\b/i.test(l)) }

// D42: a companion server only redeploys when its code changed
const SERVER = ['party', 'worker', 'workers', 'server', 'wrangler.toml', 'wrangler.json', 'wrangler.jsonc']
const servers = SERVER.filter(p => exists(root, p))
if (servers.length) {
  const changed = since ? (git(root, 'diff', '--name-only', since, 'HEAD', '--', ...servers) || '').split('\n').filter(Boolean) : ['(first release)']
  say(`server code changed since ${since || 'the start'}: ${changed.length ? `yes (${changed.slice(0, 4).join(', ')}${changed.length > 4 ? ', …' : ''}) → redeploy it first` : 'no → don\'t redeploy it (say "server unchanged")'}`)
}

// --- the verdict -----------------------------------------------------------------------------------------------------
say(`${version.version}.${version.build ?? 0} → ${next}.0 (${kind}${stage ? ` ${stage}` : ''}) — "${summary}"`)
if (problems.length) {
  say(`✗ not ready to release — ${problems.length} thing${problems.length > 1 ? 's' : ''} to sort first (nothing was changed):`)
  problems.forEach(([text, fix], n) => say(`  ${n + 1}. ${text.replace(/\n/g, '\n  ')}${fix ? `\n     → ${fix}` : ''}`))
  process.exit(1)
}
if (flags.has('--dry-run')) { say('Dry run — every gate passes; nothing changed.'); process.exit(0) }

// --- release ------------------------------------------------------------------------------------------------------
const date = today[0] // the local date (UTC said "tomorrow" for an evening release — F84's CHANGELOG showed it)
// what will change, and a dry-run `git add` of it — an ignored or unreadable file refuses BEFORE anything is written
const lock = readJson(join(root, 'package-lock.json'))
// F84 / F85: the files made from the notes and the packages — { path: new text }, only the ones that change
const readOr = (f) => { try { return readFileSync(join(root, f), 'utf8') } catch { return null } }
const made = {}
if (notesReady) {
  made['CHANGELOG.md'] = addToChangelog(readOr('CHANGELOG.md'), changelogEntry(notesText, next, date))
  made[itchFile(next)] = itchText(notesText, next, date)
}
if (notices !== null && notices !== readOr(NOTICES)) made[NOTICES] = notices
const changed = ['version.json', ...(pkg && 'version' in pkg ? ['package.json'] : []), ...(lock && 'version' in lock && git(root, 'check-ignore', '-q', 'package-lock.json') === null ? ['package-lock.json'] : []), ...(stateOut !== null && stateOut !== stateText ? ['.planning/STATE.md'] : []), ...Object.keys(made)]
const before = new Map(changed.map(f => [f, readOr(f)])) // null = a new file (put back = deleted)
// a new file can't be dry-run added (git doesn't know it yet) — it's asked whether .gitignore would hide it instead
const ignored = [...before].filter(([f, text]) => text === null && git(root, 'check-ignore', '-q', f) !== null).map(([f]) => f)
if (ignored.length) refuse(`.gitignore hides ${ignored.join(', ')}, so the release commit couldn't hold ${ignored.length > 1 ? 'them' : 'it'} — nothing was changed`, 'take that line out of .gitignore (these files belong in the repo), commit, then release')
const trial = run('git', ['add', '-n', '--', ...new Set([...changed.filter(f => before.get(f) !== null), ...dirty])], { cwd: root })
if (trial.code !== 0) refuse(`git can't stage these files, so nothing was changed:\n${trial.out.trim()}`)
// the index as it is now: files the user had already staged stay staged when a failed release is put back
const stagedBefore = new Set(changedFiles(root).filter(f => !/^[ ?]/.test(f.status)).map(f => f.path))
const putBack = () => {
  for (const [f, text] of before) text === null ? rmSync(join(root, f), { force: true }) : writeFileSync(join(root, f), text)
  // unstage what the release staged — its own files AND the user's plan edits it carried along (review fix)
  const unstage = [...new Set([...changed, ...dirty])].filter(f => !stagedBefore.has(f))
  if (unstage.length) run('git', ['reset', '-q', '--', ...unstage], { cwd: root })
}

version.version = next
version.build = 0
version.history = [...(version.history ?? []), { version: next, date, summary }]
writeJson(versionFile, version)
if (changed.includes('package.json')) { pkg.version = next; writeJson(join(root, 'package.json'), pkg) }
if (changed.includes('package-lock.json')) {
  lock.version = next
  if (lock.packages?.['']) lock.packages[''].version = next
  writeJson(join(root, 'package-lock.json'), lock)
}
if (changed.includes('.planning/STATE.md')) writeFileSync(join(root, '.planning', 'STATE.md'), stateOut)
for (const [f, text] of Object.entries(made)) { mkdirSync(dirname(join(root, f)), { recursive: true }); writeFileSync(join(root, f), text) }
// "Stage: alpha" marks a stage release, so the next one knows where its playtest window starts (F87)
const body = [...(stage ? [`Stage: ${stage}`] : []), ...(used.length ? [`Released with: ${used.join('; ')}`] : [])]
const message = `Release ${tag}: ${summary}${body.length ? `\n\n${body.join('\n')}` : ''}`
const add = run('git', ['add', '--', ...new Set([...changed, ...dirty])], { cwd: root })
if (add.code !== 0) { putBack(); refuse(`git add failed — the version files are put back:\n${add.out}`) }
const blocked = guardCommit(root, message) // the commit hooks a typed `git commit` gets (F80)
if (blocked) { putBack(); refuse(`the release commit was refused by the same check a typed \`git commit\` gets — the version files are put back:\n    ${blocked.replace(/\n/g, '\n    ')}`) }
const commit = run('git', ['commit', '-q', '-m', message], { cwd: root })
if (commit.code !== 0) { putBack(); refuse(`the release commit failed — the version files are put back:\n${commit.out}`) }
const tagged = run('git', ['tag', '-a', tag, '-m', `${tag}: ${summary}`], { cwd: root })
if (tagged.code !== 0) refuse(`committed, but the tag failed:\n${tagged.out}`, `\`git tag -a ${tag} -m "${summary}"\``)
ok(`Release ${tag} committed and tagged (${changed.join(', ')})${used.length ? ` — on record: ${used.join('; ')}` : ''}`)
if (made[itchFile(next)]) say(`\n--- itch.io devlog text (saved as ${itchFile(next)}) — paste it into the devlog editor ---\n${made[itchFile(next)].trim()}\n---\n`)
const cleaned = cleanup(root, 'the release') // D46: clean up after ourselves, as /save does
if (cleaned) say(cleaned)
const release = stateText !== null ? stateValue(stateText, 'Release') || '' : ''
const hosted = !/^(none|not set up)/i.test(release)
say(`Next (/deliver): smoke pass → \`git push --follow-tags\`${exists(root, '.github', 'workflows') ? ' (a deploy workflow may start)' : ''}${hosted && stateText !== null ? ' → live-check.mjs' : ''}${at < 2 ? ' · milestone → write the look-back (§7c)' : ''}`)
