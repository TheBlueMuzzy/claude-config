// /save's mechanical part, in one go (F69). Claude writes STATE's words first (RESUME HERE, Where we are, Key facts, one
// new Log line) — this script does the rest:
//   node ~/.claude/config/bmuz/scripts/save.mjs "<plain summary>"
//   1. refuses if a secret or junk would be committed (.env, *.pem, credentials, .playwright-mcp/)
//   2. build +1 in version.json (versioning.md: B = saves since the last delivery)
//   3. STATE Log keeps 10 entries; older ones move to .planning/archive/log.md (newest first)
//   4. commit everything, push the branch (sets the upstream the first time)
//   5. checks GitHub really has this commit — only then says "safe to switch machines"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { git, run, say, ok, refuse, readJson, writeJson, args, projectDir, changedFiles } from './lib.mjs'

const LOG_KEEP = 10
const NEVER = /(^|\/)(\.env(\.(?!example$|sample$|template$)[^/]*)?|.*\.pem|.*\.key|credentials\.json|client_secret.*\.json|\.playwright-mcp\/.*)$/

const { words } = args()
const summary = (words[0] || '').trim()
if (!summary) refuse('a plain summary is needed for the commit', 'save.mjs "Lobby shows seats; host can kick"')
const root = git(projectDir(), 'rev-parse', '--show-toplevel')
if (!root) refuse("this folder isn't a git repo")

// 1. nothing secret
const secret = changedFiles(root).filter(f => !f.status.includes('D') && NEVER.test(f.path)).map(f => f.path) // deleting one is fine
if (secret.length) refuse(`these must never be committed: ${secret.join(', ')}`, 'add them to .gitignore (or delete .playwright-mcp/), then save again')

// Files this script changes, as they were — put back if the commit is refused, so saving again doesn't count twice
const originals = new Map()
const keep = (path) => { if (!originals.has(path)) originals.set(path, existsSync(path) ? readFileSync(path, 'utf8') : null) }
function putBack() {
  for (const [path, text] of originals) { if (text === null) rmSync(path, { force: true }); else writeFileSync(path, text) }
  run('git', ['reset', '-q', '--', ...originals.keys()], { cwd: root }) // unstage them again (nothing else is touched)
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

// 3. STATE Log: keep the newest 10
const stateFile = join(root, '.planning', 'STATE.md')
let moved = 0
if (existsSync(stateFile)) {
  const lines = readFileSync(stateFile, 'utf8').split('\n')
  const start = lines.findIndex(l => /^## Log\b/.test(l))
  if (start >= 0) {
    let end = lines.findIndex((l, n) => n > start && /^## /.test(l)); if (end < 0) end = lines.length
    // an entry is its "- " line plus any indented lines it wraps onto
    const entries = []
    for (let n = start + 1; n < end; n++) {
      if (/^- /.test(lines[n])) entries.push({ rows: [n] })
      else if (/^\s+\S/.test(lines[n]) && entries.length) entries.at(-1).rows.push(n)
    }
    const old = entries.slice(LOG_KEEP)
    if (old.length) {
      const archive = join(root, '.planning', 'archive', 'log.md')
      mkdirSync(join(root, '.planning', 'archive'), { recursive: true })
      keep(archive); keep(stateFile)
      const before = existsSync(archive) ? readFileSync(archive, 'utf8') : '# Log archive (newest first)\n'
      const [title, ...rest] = before.split('\n')
      writeFileSync(archive, [title, ...old.flatMap(e => e.rows.map(n => lines[n])), ...rest].join('\n'))
      const drop = new Set(old.flatMap(e => e.rows))
      writeFileSync(stateFile, lines.filter((_, n) => !drop.has(n)).join('\n'))
      moved = old.length
    }
  }
}

// 4. commit + push
const add = run('git', ['add', '-A'], { cwd: root })
if (add.code !== 0) { putBack(); refuse(`git add failed (build number and Log put back):\n${add.out}`) }
const staged = git(root, 'diff', '--cached', '--name-only')
if (staged) {
  const commit = run('git', ['commit', '-q', '-m', summary], { cwd: root })
  if (commit.code !== 0) { putBack(); refuse(`the commit failed (a hook or a type error?) — the build number and Log are put back:\n${commit.out.trim()}`, 'fix what it names, then save again') }
}
const branch = git(root, 'rev-parse', '--abbrev-ref', 'HEAD')
const where = `${label ? `${label}, ` : ''}branch ${branch}${moved ? `, ${moved} old Log line(s) → archive/log.md` : ''}`
if (!git(root, 'remote')) {
  say(`Saved locally (${where}) — no GitHub copy, so NOT safe to switch machines.`)
  process.exit(0)
}
const hasUpstream = git(root, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}') !== null
const push = run('git', hasUpstream ? ['push', '-q'] : ['push', '-q', '-u', 'origin', branch], { cwd: root })
if (push.code !== 0) refuse(`committed, but the push failed — NOT safe to switch machines:\n${push.out.trim()}`, /rejected|fetch first|non-fast-forward/.test(push.out) ? 'GitHub has newer commits: `git pull`, then save again' : 'check the internet / GitHub login, then save again')

// 5. GitHub really has it
run('git', ['fetch', '-q', 'origin', branch], { cwd: root })
if (git(root, 'rev-parse', 'HEAD') !== git(root, 'rev-parse', `origin/${branch}`)) refuse('pushed, but GitHub\'s copy isn\'t at this commit — NOT safe to switch machines', '`git status` / `git log origin/' + branch + '` show the difference')
ok(`Saved + pushed (${where}) — safe to switch machines.`)
