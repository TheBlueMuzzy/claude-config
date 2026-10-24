// /save's mechanical part, in one go (F69). Claude writes STATE's words first (RESUME HERE, Where we are, Key facts, one
// new Log line) — this script does the rest:
//   node ~/.claude/config/bmuz/scripts/save.mjs "<plain summary>" [--resume-unchanged]
//   0. runs cleanup.sh (its one line is shown; a failing cleanup only warns) (F78)
//   0b. runs the project's checks — `npm run check:fast` (skipped when this exact code already passed it), else
//       `npm test` + `npm run build`. Red → a plain heads-up, the save still happens (F80)
//   0c. refuses when STATE's ▶ RESUME HERE is word-for-word what GitHub already has but there's work to save — a fresh
//       session would resume from stale notes. Nothing a fresh session needs changed? --resume-unchanged (F80)
//   1. refuses if a secret or junk would be committed (.env, *.pem, credentials, .playwright-mcp/)
//   1b. a BMUZ project's .gitignore gets `.claude/worktrees/` + `.planning/ppp.html` if missing (F78)
//   2. build +1 in version.json (versioning.md: B = saves since the last delivery)
//   3. STATE Log keeps 10 entries; older ones move to .planning/archive/log.md (newest first)
//   4. commit everything — after asking the same commit hooks a typed `git commit` gets (secrets, F08 code on main,
//      `F08: done` without STATE / review / full check, type errors) (F80) — push the branch (upstream the first time)
//   5. checks GitHub really has this commit — only then says "safe to switch machines"
//   6. rebuilds the planner page (STATE has a `Planner (PPP):` link) — the Stop hook then asks Claude to republish (F80)
//   7. syncs the shared setup (~/.claude ↔ ~/.claude-config, PC ↔ laptop): this machine's changes pushed, the other
//      machine's incoming changes named (applying them is Claude's job — they may clash) (F80)
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { git, run, say, ok, refuse, tail, readJson, writeJson, args, projectDir, changedFiles, NEVER_COMMIT, cleanup, fastChecks, greenRecord, guardCommit } from './lib.mjs'
import { codeFingerprint, trimLog } from '../hooks/lib.mjs'

// Lines every BMUZ project's .gitignore needs (F78): helper worktrees and the rebuilt planner page are never committed
const IGNORE_LINES = ['.claude/worktrees/', '.planning/ppp.html']

const { words, flags } = args()
const summary = (words[0] || '').trim()
if (!summary) refuse('a plain summary is needed for the commit', 'save.mjs "Lobby shows seats; host can kick"')
const root = git(projectDir(), 'rev-parse', '--show-toplevel')
if (!root) refuse("this folder isn't a git repo")

// 0. clean up after ourselves first (F78: was only run when the skill text was remembered) — temp files, finished
//    helper workspaces, old check output, old .scratch entries. Its one line is shown; if it fails, warn and carry on.
const cleaned = cleanup(root, 'the save')
if (cleaned) say(cleaned)

// 0b. the project's checks (the skill used to ask Claude to remember them). Red never stops a save — it's said plainly.
let green = false // this code passed check:fast — re-recorded after the commit (same code, new fingerprint)
for (const check of fastChecks(root)) {
  const label = check.name === 'check:fast' ? 'check:fast' : `npm run ${check.name}`
  if (check.name === 'check:fast' && check.ok) green = true
  if (check.cached) say('✓ check:fast already green on this exact code')
  else say(check.ok ? `✓ ${label} green` : `⚠ heads up — ${label} fails (saving anyway; say so in the report):\n${tail(check.out, 8)}`)
}

// 0c. RESUME HERE rewritten for a fresh session — compared with what GitHub has (the last save), when there's work to save
const stateFile = join(root, '.planning', 'STATE.md')
const upstream = git(root, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}')
if (existsSync(stateFile) && upstream && !flags.has('--resume-unchanged')) {
  const resumeOf = (text) => {
    const lines = (text || '').replace(/\r\n/g, '\n').split('\n')
    const start = lines.findIndex(l => /^## ▶ RESUME HERE/.test(l))
    if (start < 0) return null
    let end = lines.findIndex((l, n) => n > start && /^## /.test(l)); if (end < 0) end = lines.length
    return lines.slice(start, end).join('\n').trim()
  }
  const now = resumeOf(readFileSync(stateFile, 'utf8'))
  const ahead = parseInt(git(root, 'rev-list', '--count', `${upstream}..HEAD`) || '0', 10)
  const work = ahead > 0 || changedFiles(root).length > 0
  if (now !== null && work && now === resumeOf(git(root, 'show', `${upstream}:.planning/STATE.md`))) {
    refuse("STATE's ▶ RESUME HERE is word-for-word the last save's, but there's new work — a fresh session would resume from old notes", 'rewrite it (where things stand, the exact next action, any Muzzy: lines), then save again — or, if nothing a fresh session needs has changed, save again with --resume-unchanged')
  }
}

// 1. nothing secret
const secret = changedFiles(root).filter(f => !f.status.includes('D') && NEVER_COMMIT.test(f.path)).map(f => f.path) // deleting one is fine
if (secret.length) refuse(`these must never be committed: ${secret.join(', ')}`, 'add them to .gitignore (or delete .playwright-mcp/), then save again')

// Files this script changes, as they were — put back if the commit is refused, so saving again doesn't count twice
const originals = new Map()
const keep = (path) => { if (!originals.has(path)) originals.set(path, existsSync(path) ? readFileSync(path, 'utf8') : null) }
function putBack() {
  for (const [path, text] of originals) { if (text === null) rmSync(path, { force: true }); else writeFileSync(path, text) }
  run('git', ['reset', '-q', '--', ...originals.keys()], { cwd: root }) // unstage them again (nothing else is touched)
}

// 1b. a BMUZ project's .gitignore has the lines every project needs (missing ones appended, committed with the save)
const ignoreFile = join(root, '.gitignore')
let ignoreAdded = []
if (existsSync(join(root, '.planning', 'STATE.md'))) {
  const before = existsSync(ignoreFile) ? readFileSync(ignoreFile, 'utf8') : ''
  const have = new Set(before.split(/\r?\n/).map(l => l.trim().replace(/^\//, '').replace(/\/$/, '')))
  ignoreAdded = IGNORE_LINES.filter(line => !have.has(line.replace(/\/$/, '')) && !(line.startsWith('.claude/') && have.has('.claude')))
  if (ignoreAdded.length) {
    const eol = before.includes('\r\n') ? '\r\n' : '\n' // keep the file's own line endings (LF when new)
    const start = before && !before.endsWith('\n') ? eol : ''
    keep(ignoreFile)
    writeFileSync(ignoreFile, before + start + ['# BMUZ: helper worktrees + the rebuilt planner page are never committed', ...ignoreAdded].join(eol) + eol)
  }
}

// 2. build +1
const versionFile = join(root, 'version.json')
const version = readJson(versionFile)
let label = ''
if (version?.version) {
  version.build = (version.build ?? 0) + 1
  keep(versionFile)
  writeJson(versionFile, version)
  label = `v${version.version}.${version.build}`
}

// 3. STATE Log: keep the newest 10 (the same trim the plan-lint hook does after a STATE edit — F117)
let moved = 0
if (existsSync(stateFile)) {
  const archive = join(root, '.planning', 'archive', 'log.md')
  const archiveText = existsSync(archive) ? readFileSync(archive, 'utf8') : null
  const trim = trimLog(readFileSync(stateFile, 'utf8'), archiveText)
  if (trim.moved) {
    mkdirSync(join(root, '.planning', 'archive'), { recursive: true })
    keep(archive); keep(stateFile)
    if (trim.archive !== archiveText) writeFileSync(archive, trim.archive)
    writeFileSync(stateFile, trim.state)
    moved = trim.moved
  }
}

// 4. commit + push
const add = run('git', ['add', '-A'], { cwd: root })
if (add.code !== 0) { putBack(); refuse(`git add failed (build number and Log put back):\n${add.out}`) }
const staged = git(root, 'diff', '--cached', '--name-only')
if (staged) {
  // the commit hooks, asked first (F80): secrets, F08 code on main, `F08: done` without STATE / review / full check, types
  const blocked = guardCommit(root, summary)
  if (blocked) { putBack(); refuse(`the save's commit was refused by the same check a typed \`git commit\` gets — the build number and Log are put back:\n    ${blocked.replace(/\n/g, '\n    ')}`, 'fix what it names, then save again') }
  const commit = run('git', ['commit', '-q', '-m', summary], { cwd: root })
  if (commit.code !== 0) { putBack(); refuse(`the commit failed (a hook or a type error?) — the build number and Log are put back:\n${commit.out.trim()}`, 'fix what it names, then save again') }
  if (green) writeFileSync(greenRecord(root), codeFingerprint(root) + '\n')
}
const branch = git(root, 'rev-parse', '--abbrev-ref', 'HEAD')
const where = `${label ? `${label}, ` : ''}branch ${branch}${moved ? `, ${moved} old Log line(s) → archive/log.md` : ''}${ignoreAdded.length ? `, .gitignore now ignores ${ignoreAdded.join(' + ')}` : ''}`
if (!git(root, 'remote')) {
  afterSave()
  say(`Saved locally (${where}) — no GitHub copy, so NOT safe to switch machines.`)
  process.exit(0)
}
const push = run('git', upstream ? ['push', '-q'] : ['push', '-q', '-u', 'origin', branch], { cwd: root })
if (push.code !== 0) refuse(`committed, but the push failed — NOT safe to switch machines:\n${push.out.trim()}`, /rejected|fetch first|non-fast-forward/.test(push.out) ? 'GitHub has newer commits: `git pull`, then save again' : 'check the internet / GitHub login, then save again')

// 5. GitHub really has it
run('git', ['fetch', '-q', 'origin', branch], { cwd: root })
if (git(root, 'rev-parse', 'HEAD') !== git(root, 'rev-parse', `origin/${branch}`)) refuse('pushed, but GitHub\'s copy isn\'t at this commit — NOT safe to switch machines', '`git status` / `git log origin/' + branch + '` show the difference')
afterSave()
ok(`Saved + pushed (${where}) — safe to switch machines.`)

// 6 + 7: the planner page and the shared setup. Neither can undo the save; trouble is said, never a refusal.
function afterSave() {
  // 6. planner page (gitignored, so it's never in the commit): rebuilt; the Stop hook (stop-plan-check) sends Claude
  //    back to republish it when it changed
  const planner = existsSync(stateFile) && readFileSync(stateFile, 'utf8').match(/Planner \(PPP\):\*{0,2}\s*(https:\S+)/)
  if (planner) {
    const page = join(root, '.planning', 'ppp.html')
    const before = existsSync(page) ? readFileSync(page, 'utf8') : ''
    const build = run(process.execPath, [process.env.BMUZ_BUILD_PPP || join(import.meta.dirname, '..', 'templates', 'ppp', 'build-ppp.mjs'), root], { timeout: 60_000 })
    if (build.code !== 0) say(`⚠ the planner page didn't rebuild:\n${tail(build.out, 4)}`)
    else if (existsSync(page) && readFileSync(page, 'utf8') !== before) {
      const gitDir = resolve(root, git(root, 'rev-parse', '--git-dir'))
      writeFileSync(join(gitDir, 'bmuz-ppp-rebuilt'), new Date().toISOString())
      say(`Planner page rebuilt → republish .planning/ppp.html to ${planner[1]}`)
    }
  }
  // 7. shared setup, PC ↔ laptop (Muzzy, 2026-10-14: "always sync to the laptop"). BMUZ_CONFIG_SYNC = tests' fake.
  const configRepo = join(homedir(), '.claude-config')
  if (resolve(root) === resolve(configRepo)) return
  const sync = process.env.BMUZ_CONFIG_SYNC || join(import.meta.dirname, '..', 'config-sync.sh')
  const status = run('bash', [sync, 'status'], { timeout: 120_000 })
  const lines = status.out.trim().split(/\r?\n/).filter(Boolean)
  if (lines.some(l => /^(INCOMING|PULL-FAILED|NO-REPO)/.test(l))) {
    say(`⚠ setup NOT synced — the other machine's changes come first:\n${lines.map(l => `    ${l}`).join('\n')}\n  → apply them (cd ~/.claude-config && bash setup.sh; a file changed on both machines → show Muzzy both versions), then save again`)
    return
  }
  const changed = lines.filter(l => /^CHANGED: /.test(l))
  const mine = changed.filter(l => !/only in repo/.test(l))
  const theirs = changed.filter(l => /only in repo/.test(l))
  if (mine.length) {
    const push = run('bash', [sync, 'push', summary], { timeout: 120_000 })
    if (/^PUSHED/m.test(push.out)) say(`Setup synced to the laptop (${mine.length} file${mine.length === 1 ? '' : 's'}: ${mine.slice(0, 4).map(l => l.slice(9)).join(', ')}${mine.length > 4 ? ', …' : ''})`)
    else if (!/NOTHING-TO-PUSH/.test(push.out)) say(`⚠ setup sync push failed:\n${tail(push.out, 4)}`)
  }
  if (theirs.length) say(`Setup: ${theirs.length} file(s) only in ~/.claude-config (retired here on purpose, or added on the other machine) — mention once, never delete without asking`)
}
