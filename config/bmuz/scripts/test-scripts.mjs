// Proves every BMUZ script does its job — or refuses before changing anything (F69).
// Run: node ~/.claude/config/bmuz/scripts/test-scripts.mjs [suite]   (throwaway folders + repos in the temp folder)
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPTS = dirname(fileURLToPath(import.meta.url))
let passed = 0
let failed = 0

// Run a script; returns { code, out }.
function script(name, args, { cwd, env = {} } = {}) {
  const r = spawnSync('node', [join(SCRIPTS, name), ...args], { cwd, encoding: 'utf8', env: { ...process.env, ...env }, timeout: 300_000 })
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` }
}
function expect(name, ok, detail = '') {
  if (ok) { passed++; console.log(`  ✓ ${name}`) } else { failed++; console.log(`  ✗ ${name}\n${String(detail).slice(0, 600)}`) }
}
const sh = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const write = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text) }

// A git repo with a bare "origin", main checked out, one commit.
function makeRepo(root, name = 'repo') {
  const origin = join(root, `${name}-origin.git`)
  const repo = join(root, name)
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origin])
  execFileSync('git', ['clone', '-q', origin, repo], { stdio: 'ignore' })
  sh(repo, 'config', 'user.email', 'test@example.com'); sh(repo, 'config', 'user.name', 'test')
  sh(repo, 'checkout', '-q', '-b', 'main')
  write(join(repo, 'a.txt'), 'a\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'one'); sh(repo, 'push', '-q', '-u', 'origin', 'main')
  return repo
}

function testInstallModule() {
  console.log('install-module — one safe way to install a module')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-install-'))
  const fw = join(root, 'framework')
  // a fake "audio" module: its test passes or fails on a flag file; its installer copies VERSION into the game
  const audio = join(fw, 'audio')
  write(join(audio, 'package.json'), JSON.stringify({ scripts: { test: 'node -e "process.exit(require(\'fs\').existsSync(\'RED\') ? 1 : 0)"' } }))
  write(join(audio, 'kit', 'VERSION'), '0.4.0\n')
  write(join(audio, 'scripts', 'install-audio.mjs'), [
    "import { mkdirSync, copyFileSync } from 'node:fs'",
    "import { join } from 'node:path'",
    "const [game, ...rest] = process.argv.slice(2)",
    "if (rest.includes('--dry-run')) { console.log('would copy kit/ → src/audio/'); process.exit(0) }",
    "mkdirSync(join(game, 'src', 'audio'), { recursive: true })",
    "copyFileSync(join(import.meta.dirname, '..', 'kit', 'VERSION'), join(game, 'src', 'audio', 'VERSION'))",
    "console.log('copied. Wire it: import { useAudio } in main.tsx')",
  ].join('\n'))
  const game = join(root, 'game')
  write(join(game, 'package.json'), '{}')
  const install = (...a) => script('install-module.mjs', a, { cwd: game, env: { BMUZ_FRAMEWORK: fw } })

  const bad = install('nope', '.')
  expect('unknown module → refused, says which exist', bad.code === 1 && /devkit/.test(bad.out), bad.out)
  const dry = install('audio', '.', '--dry-run')
  expect('--dry-run → shows the plan, changes nothing', dry.code === 0 && /would copy/.test(dry.out) && !existsSync(join(game, 'src', 'audio')), dry.out)
  write(join(audio, 'RED'), '')
  const red = install('audio', '.')
  expect("module's own test red → refused, nothing installed", red.code === 1 && /own "test" fails/.test(red.out) && !existsSync(join(game, 'src', 'audio')), red.out)
  rmSync(join(audio, 'RED'))
  const good = install('audio', '.')
  expect('green → installed, the wiring steps are shown', good.code === 0 && existsSync(join(game, 'src', 'audio', 'VERSION')) && /Wire it/.test(good.out), good.out)
  // the game's framework checks run after the install
  write(join(game, 'src', 'devkit', 'check-framework.mjs'), "console.log('✗ audio: no volume setting'); process.exit(process.argv.includes('audio') ? 1 : 0)")
  const unwired = install('audio', '.')
  expect("installed but the game doesn't keep its promises → says so (exit 1)", unwired.code === 1 && /no volume setting/.test(unwired.out), unwired.out)
  expect('not a game folder → refused', install('audio', root).code === 1)
  // F70: the framework's linter runs as one of the module's own checks
  rmSync(join(game, 'src', 'devkit'), { recursive: true, force: true })
  write(join(audio, 'package.json'), JSON.stringify({ scripts: { test: 'node -e "0"', lint: 'node -e "process.exit(require(\'fs\').existsSync(\'LINTRED\') ? 1 : 0)"' } }))
  const noEslint = install('audio', '.', '--dry-run')
  expect('a lint script but the framework root has no eslint installed → refused, says to npm install', noEslint.code === 1 && /npm install/.test(noEslint.out), noEslint.out)
  write(join(fw, 'node_modules', 'eslint', 'package.json'), '{}')
  write(join(audio, 'LINTRED'), '')
  const lintRed = install('audio', '.')
  expect("module's lint red → refused before installing", lintRed.code === 1 && /own "lint" fails/.test(lintRed.out), lintRed.out)
  rmSync(join(audio, 'LINTRED'))
  write(join(game, 'scripts', 'check-all.mjs'), '// an old copy\n')
  const lintGreen = install('audio', '.')
  expect('lint green → installed; an old check-all.mjs without the lock is named (F79)', lintGreen.code === 0 && /audio: lint/.test(lintGreen.out) && /no one-run-at-a-time lock/.test(lintGreen.out), lintGreen.out)
  rmSync(root, { recursive: true, force: true })
}

function testRelease() {
  console.log('release — version, history, commit, tag in one go')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-release-'))
  const repo = makeRepo(root)
  const release = (...a) => script('release.mjs', a, { cwd: repo })
  expect('no version.json → refused', release('update', 'x').code === 1)
  write(join(repo, 'version.json'), JSON.stringify({ name: 'T', version: '0.9.2', build: 7, history: [] }, null, 2) + '\n')
  write(join(repo, 'package.json'), JSON.stringify({ name: 't', version: '0.9.2' }, null, 2) + '\n')
  write(join(repo, 'package-lock.json'), JSON.stringify({ name: 't', version: '0.9.2', packages: { '': { version: '0.9.2' } } }, null, 2) + '\n')
  const dirty = release('update', 'x')
  expect('uncommitted code → refused, lists it', dirty.code === 1 && /version\.json/.test(dirty.out), dirty.out)
  sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'versions')
  write(join(repo, '.planning', 'STATE.md'), 'Released v0.9.3\n') // the release's plan notes ride along
  expect('no summary → refused', release('update').code === 1)
  expect('unknown kind → refused', release('huge', 'x').code === 1)
  const dry = release('update', 'Cards fan out', '--dry-run')
  expect('--dry-run → says 0.9.2.7 → 0.9.3.0, changes nothing', dry.code === 0 && /0\.9\.2\.7 → 0\.9\.3\.0/.test(dry.out) && sh(repo, 'status', '--porcelain') === '?? .planning/', dry.out)
  const up = release('update', 'Cards fan out')
  const v = JSON.parse(readFileSync(join(repo, 'version.json'), 'utf8'))
  expect('update → 0.9.3, build 0, history entry', up.code === 0 && v.version === '0.9.3' && v.build === 0 && v.history.at(-1).summary === 'Cards fan out', up.out)
  expect('…package.json + lock synced', JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).version === '0.9.3' && JSON.parse(readFileSync(join(repo, 'package-lock.json'), 'utf8')).packages[''].version === '0.9.3')
  expect('…committed "Release v0.9.3: …" and tagged (annotated)', sh(repo, 'log', '-1', '--format=%s') === 'Release v0.9.3: Cards fan out' && sh(repo, 'cat-file', '-t', 'v0.9.3') === 'tag')
  expect('…nothing pushed', !sh(repo, 'ls-remote', '--tags', 'origin'))
  expect('…STATE.md went in the same commit', sh(repo, 'show', '--name-only', '--format=', 'HEAD').includes('.planning/STATE.md') && !sh(repo, 'status', '--porcelain'))
  const ms = release('milestone', 'Card play')
  expect('milestone → 0.10.0 (Z resets) + reminds the look-back', ms.code === 0 && JSON.parse(readFileSync(join(repo, 'version.json'), 'utf8')).version === '0.10.0' && /look-back/.test(ms.out), ms.out)
  sh(repo, 'tag', 'v0.10.1')
  expect('tag already there → refused', release('update', 'again').code === 1)
  sh(repo, 'tag', '-d', 'v0.10.1')
  sh(repo, 'checkout', '-q', '-b', 'dev/x')
  const branch = release('update', 'x')
  expect('on a work branch → refused (merge first)', branch.code === 1 && /merges the work branch/.test(branch.out), branch.out)
  sh(repo, 'checkout', '-q', 'main')
  write(join(repo, 'version.json'), JSON.stringify({ name: 'T', version: '1..3', build: 0, history: [] }) + '\n'); sh(repo, 'commit', '-qam', 'odd version')
  expect('version "1..3" (not X.Y.Z) → refused (review)', /isn't X\.Y\.Z/.test(release('update', 'x').out))
  rmSync(root, { recursive: true, force: true })
}

function testSave() {
  console.log('save — commit, push, and only then "safe"')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-save-'))
  const repo = makeRepo(root)
  const scratch = join(root, '.scratch') // never the real ~/Documents/dev/.scratch
  const save = (...a) => script('save.mjs', a, { cwd: repo, env: { BMUZ_SCRATCH: scratch.split('\\').join('/') } })
  write(join(repo, 'version.json'), JSON.stringify({ name: 'T', version: '0.3.0', build: 4, history: [] }, null, 2) + '\n')
  const log = Array.from({ length: 13 }, (_, i) => `- 2026-10-${String(30 - i).padStart(2, '0')} — entry ${i + 1}`)
  write(join(repo, '.planning', 'STATE.md'), ['# State', '## ▶ RESUME HERE', 'x', '## Log', ...log, ''].join('\n'))
  expect('no summary → refused', save().code === 1)
  const first = save('Lobby shows seats')
  const state = readFileSync(join(repo, '.planning', 'STATE.md'), 'utf8')
  expect('saved + pushed → "safe to switch machines" with v0.3.0.5', first.code === 0 && /safe to switch machines/.test(first.out) && /v0\.3\.0\.5/.test(first.out), first.out)
  expect('…build bumped in version.json', JSON.parse(readFileSync(join(repo, 'version.json'), 'utf8')).build === 5)
  expect('…Log keeps the newest 10', (state.match(/^- /gm) || []).length === 10 && state.includes('entry 1') && !state.includes('entry 11'), state)
  const archive = readFileSync(join(repo, '.planning', 'archive', 'log.md'), 'utf8')
  expect('…3 older lines moved to archive/log.md, newest first', /entry 11\n- .*entry 12\n- .*entry 13/.test(archive), archive)
  expect('…GitHub has the commit', sh(repo, 'rev-parse', 'HEAD') === sh(repo, 'rev-parse', 'origin/main'))
  // F78: a BMUZ project's .gitignore gets the lines every project needs, committed with the save
  const ignore = readFileSync(join(repo, '.gitignore'), 'utf8')
  expect('F78: no .gitignore → made with .claude/worktrees/ + .planning/ppp.html (LF), said in the output', ignore.includes('.claude/worktrees/\n') && ignore.includes('.planning/ppp.html\n') && !ignore.includes('\r') && /\.gitignore now ignores/.test(first.out), `${ignore}\n${first.out}`)
  expect('…committed with the save', sh(repo, 'show', '--name-only', '--format=', 'HEAD').split('\n').includes('.gitignore'))
  write(join(repo, '.gitignore'), 'node_modules/\r\n/.planning/ppp.html\r\ndist') // CRLF, no final line break, one line already there
  const again = save('ignore lines')
  const crlf = readFileSync(join(repo, '.gitignore'), 'utf8')
  expect('…an existing CRLF file: only the missing line appended, in CRLF, nothing doubled', again.code === 0 && crlf === 'node_modules/\r\n/.planning/ppp.html\r\ndist\r\n# BMUZ: helper worktrees + the rebuilt planner page are never committed\r\n.claude/worktrees/\r\n' && /now ignores \.claude\/worktrees\/\)/.test(again.out), JSON.stringify(crlf) + again.out)
  write(join(repo, 'e.txt'), 'x\n')
  const quiet = save('nothing to add')
  expect('…all there → .gitignore left alone, nothing said', quiet.code === 0 && !/gitignore/.test(quiet.out) && readFileSync(join(repo, '.gitignore'), 'utf8') === crlf, quiet.out)
  // F78: save runs cleanup.sh itself — temp files and .scratch entries untouched for 24 h go, fresh ones stay
  write(join(repo, 'notes.tmp.txt'), 'scratch\n')
  write(join(scratch, 'game-spike', 'index.html'), 'old copy')
  write(join(scratch, 'game-proof', 'shot.png'), 'fresh')
  const old = new Date(Date.now() - 48 * 3600 * 1000)
  utimesSync(join(scratch, 'game-spike', 'index.html'), old, old); utimesSync(join(scratch, 'game-spike'), old, old)
  const cleaned = save('cleanup runs')
  expect('F78: save runs cleanup — the temp file is gone (never committed), its 🧹 line shown', cleaned.code === 0 && !existsSync(join(repo, 'notes.tmp.txt')) && /🧹 cleaned/.test(cleaned.out) && !sh(repo, 'show', '--name-only', '--format=', 'HEAD').includes('notes.tmp.txt'), cleaned.out)
  expect('…a .scratch entry untouched for 2 days → removed; one from just now → kept', !existsSync(join(scratch, 'game-spike')) && existsSync(join(scratch, 'game-proof', 'shot.png')) && /old scratch folder/.test(cleaned.out), cleaned.out)
  write(join(root, 'bad-cleanup.sh'), 'echo "disk on fire"\nexit 3\n')
  write(join(repo, 'f.txt'), 'x\n')
  const failing = script('save.mjs', ['cleanup broke'], { cwd: repo, env: { BMUZ_CLEANUP: join(root, 'bad-cleanup.sh'), BMUZ_SCRATCH: scratch } })
  expect('…cleanup fails → a warning, the save still happens', failing.code === 0 && /⚠ cleanup didn't finish/.test(failing.out) && /disk on fire/.test(failing.out) && /safe to switch machines/.test(failing.out), failing.out)
  write(join(repo, '.env'), 'SECRET=1\n')
  const env = save('oops')
  expect('.env not ignored → refused, nothing committed', env.code === 1 && /\.env/.test(env.out) && sh(repo, 'log', '-1', '--format=%s') === 'cleanup broke', env.out)
  rmSync(join(repo, '.env'))
  write(join(repo, '.env.example'), 'SECRET=\n')
  expect('.env.example is fine to commit', save('example env').code === 0)
  // review: the commit is refused (a hook) → build number and Log put back, so the next save doesn't count twice
  const hook = join(repo, '.git', 'hooks', 'pre-commit')
  write(hook, '#!/bin/sh\necho "type error in a.ts"\nexit 1\n')
  write(join(repo, 'd.txt'), 'x\n')
  const buildBefore = JSON.parse(readFileSync(join(repo, 'version.json'), 'utf8')).build
  const blocked = save('blocked')
  expect('commit refused by a hook → says so, build number put back (review)', blocked.code === 1 && /type error/.test(blocked.out) && JSON.parse(readFileSync(join(repo, 'version.json'), 'utf8')).build === buildBefore, blocked.out)
  rmSync(hook)
  expect('…saving again works, build +1 only once', save('unblocked').code === 0 && JSON.parse(readFileSync(join(repo, 'version.json'), 'utf8')).build === buildBefore + 1)
  // GitHub moved on (the other machine pushed) → the push is refused → NOT safe
  const other = join(root, 'other'); execFileSync('git', ['clone', '-q', join(root, 'repo-origin.git'), other], { stdio: 'ignore' })
  sh(other, 'config', 'user.email', 't@e.st'); sh(other, 'config', 'user.name', 't')
  write(join(other, 'b.txt'), 'laptop\n'); sh(other, 'add', '.'); sh(other, 'commit', '-q', '-m', 'laptop'); sh(other, 'push', '-q')
  write(join(repo, 'c.txt'), 'pc\n')
  const behind = save('pc work')
  expect('GitHub has newer commits → "NOT safe", says git pull', behind.code === 1 && /NOT safe/.test(behind.out) && /git pull/.test(behind.out), behind.out)
  const local = join(root, 'local'); mkdirSync(local); execFileSync('git', ['init', '-q', '-b', 'main', local])
  sh(local, 'config', 'user.email', 't@e.st'); sh(local, 'config', 'user.name', 't'); write(join(local, 'a.txt'), 'a')
  const noRemote = script('save.mjs', ['first'], { cwd: local, env: { BMUZ_SCRATCH: scratch.split('\\').join('/') } })
  expect('no GitHub remote → "Saved locally … NOT safe"', noRemote.code === 0 && /NOT safe/.test(noRemote.out), noRemote.out)
  rmSync(root, { recursive: true, force: true })
}

function testSprintHelpers() {
  console.log('archive-sprint + musts-check — plan files, by the shared reader')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-sprint-'))
  const repo = makeRepo(root)
  const roadmap = (f2) => ['# T — Roadmap', 'Release target: alpha', '## v0.1 — First ← current',
    '- ✅ F01 🧱 Base — must:alpha', `- ${f2} F02 🎮 Cards — must:alpha · needs: F01`, '- 🟢 F03 ✨ Wiggle — could · needs: F01', ''].join('\n')
  write(join(repo, '.planning', 'ROADMAP.md'), roadmap('🔨'))
  write(join(repo, '.planning', 'SPRINT.md'), '# Sprint 04 — cards\n## F02 🎮 Cards\n- [x] 🤖 1. a\n- [x] 🤖 2. b\n- [ ] 🙋 3. Look at it\n')
  sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'plan')
  const musts = (...a) => script('musts-check.mjs', a, { cwd: repo })
  const archive = () => script('archive-sprint.mjs', [], { cwd: repo })
  const open = musts()
  expect('musts-check (stage from "Release target:") → 1/2, names F02 (exit 1)', open.code === 1 && /1\/2/.test(open.out) && /F02/.test(open.out), open.out)
  expect('musts-check beta → no musts → refused', musts('beta').code === 1)
  const early = archive()
  expect('archive-sprint while F02 is building → refused, names the open 🙋 task', early.code === 1 && /Look at it/.test(early.out) && existsSync(join(repo, '.planning', 'SPRINT.md')), early.out)
  write(join(repo, '.planning', 'ROADMAP.md'), roadmap('✅')); sh(repo, 'commit', '-qam', 'F02 done')
  expect('musts-check → all done (exit 0)', musts().code === 0)
  const done = archive()
  expect('archive-sprint when done → sprint-04.md + "Sprint 04 done" commit', done.code === 0 && existsSync(join(repo, '.planning', 'archive', 'sprints', 'sprint-04.md')) && !existsSync(join(repo, '.planning', 'SPRINT.md')) && sh(repo, 'log', '-1', '--format=%s') === 'Sprint 04 done', done.out)
  expect('…nothing else committed with it', !sh(repo, 'status', '--porcelain'))
  expect('no SPRINT.md → refused', archive().code === 1)
  // review: a SPRINT.md that was never committed
  write(join(repo, '.planning', 'SPRINT.md'), '# Sprint 05 — more\n## F02 🎮 Cards\n- [x] 🤖 1. a\n')
  const fresh = archive()
  expect('never-committed SPRINT.md → archived and committed, nothing half-done (review)', fresh.code === 0 && existsSync(join(repo, '.planning', 'archive', 'sprints', 'sprint-05.md')) && !sh(repo, 'status', '--porcelain'), fresh.out + sh(repo, 'status', '--porcelain'))
  expect('musts-check "alpha(" (odd stage name) → refused, no crash', /no feature says/.test(musts('alpha(').out))
  rmSync(root, { recursive: true, force: true })
}

async function testStopServers() {
  console.log('stop-servers — the whole tree, so nothing restarts')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-servers-'))
  const port = 5600 + Math.floor(Math.random() * 300)
  // like wrangler: a supervisor that starts the worker again whenever it dies
  // listening on IPv6 localhost only, like Vite on Windows (the real try's miss)
  write(join(root, 'worker.mjs'), `import http from 'node:http'; http.createServer((q, s) => s.end('ok')).listen(${port}, '::1')`)
  write(join(root, 'supervisor.mjs'), [
    "import { spawn } from 'node:child_process'",
    "const start = () => spawn(process.execPath, [new URL('./worker.mjs', import.meta.url).pathname.replace(/^\\/(\\w:)/, '$1')], { stdio: 'ignore' }).on('exit', () => setTimeout(start, 300))",
    'start(); setInterval(() => {}, 1000)',
  ].join('\n'))
  const { spawn } = await import('node:child_process')
  const sup = spawn(process.execPath, [join(root, 'supervisor.mjs')], { stdio: 'ignore', detached: true })
  sup.unref()
  const listening = async () => { try { await fetch(`http://[::1]:${port}`); return true } catch { return false } }
  for (let i = 0; i < 40 && !(await listening()); i++) await new Promise(r => setTimeout(r, 150))
  expect('test server is up', await listening())
  const dry = script('stop-servers.mjs', [String(port), '--dry-run'])
  expect('--dry-run names the supervisor (the top of the tree), stops nothing', /would stop/.test(dry.out) && /supervisor\.mjs/.test(dry.out) && await listening(), dry.out)
  const stop = script('stop-servers.mjs', [String(port)])
  await new Promise(r => setTimeout(r, 1200)) // a restarting supervisor would be back by now
  expect('stopped by port → the port stays free (supervisor gone too)', stop.code === 0 && !(await listening()), stop.out)
  const none = script('stop-servers.mjs', [String(port)])
  expect('nothing on the port → says so (exit 0)', none.code === 0 && /nothing is listening/.test(none.out), none.out)
  expect('no port or name → refused', script('stop-servers.mjs', []).code === 1)
  expect('a bare "node" (would match MCP servers, other tools) → refused (review)', script('stop-servers.mjs', ['node']).code === 1)
  // check-all template: a second full run while one is going → refused before it starts anything
  const game = join(root, 'game')
  write(join(game, 'e2e-shots', '.check-lock'), `${process.pid} 11:00:00 PM`) // this test process = "a run still going"
  const second = spawnSync('node', [join(SCRIPTS, '..', 'templates', 'check-all.mjs'), 'full'], { cwd: game, encoding: 'utf8' })
  expect('check-all full while another run holds the lock → refused', second.status === 1 && /still going/.test(second.stdout), second.stdout + second.stderr)
  write(join(game, 'e2e-shots', '.check-lock'), '999999 11:00:00 PM') // a run that died
  const stale = spawnSync('node', [join(SCRIPTS, '..', 'templates', 'check-all.mjs'), 'full'], { cwd: game, encoding: 'utf8', timeout: 120_000 })
  expect('…a lock left by a run that died is ignored (the run starts, then frees the lock)', /Fast checks/.test(stale.stdout) && !existsSync(join(game, 'e2e-shots', '.check-lock')), stale.stdout)
  try { process.kill(sup.pid) } catch {}
  rmSync(root, { recursive: true, force: true })
}

async function testPppFramework() {
  console.log('ppp-framework — the planner\'s Framework row in plain words (F66)')
  const { frameworkStatus, checkSentence, CHECK_WORDS } = await import('../templates/ppp/framework-words.mjs')
  const now = Date.parse('2026-10-19T12:00:00Z')
  const run = (failed = {}, date = '2026-10-19T08:00:00Z') => ({ date, commit: '', only: null, modules: ['devkit', 'ui'].map((id) => ({ id, version: '1.0.0', passed: 3, failed: failed[id] ?? [], skipped: 0 })) })
  const current = [{ id: 'devkit', version: '1.0.0', latest: '1.0.0' }, { id: 'ui', version: '1.0.0', latest: '1.0.0' }]

  const ok = frameworkStatus(current, { full: run() }, now)
  expect('healthy → ONE green line, hint "all good"', ok.healthy && ok.lines.length === 0 && ok.green === '✅ Framework pieces are up to date and working (checked today).' && ok.hint === 'all good', JSON.stringify(ok))
  const patch = frameworkStatus([{ id: 'devkit', version: '1.0.0', latest: '1.0.1' }, current[1]], { full: run() }, now)
  expect('one small update → "A newer Dev Kit is out (small fixes). Claude updates it in the next /develop."', patch.lines.length === 1 && patch.lines[0].text === 'A newer Dev Kit is out (small fixes). Claude updates it in the next /develop.' && patch.hint === '1 thing to sort — Claude handles it', JSON.stringify(patch))
  const never = frameworkStatus(current, {}, now)
  expect('never checked → says so, Claude runs the checks', !never.healthy && /haven't been checked/.test(never.lines[0].text) && /Claude runs the checks/.test(never.lines[0].text), JSON.stringify(never))
  const old = frameworkStatus(current, { full: run({}, '2026-10-07T08:00:00Z') }, now)
  expect('checked 12 days ago → "may be out of date"', old.lines.length === 1 && old.lines[0].text.startsWith('Last checked 12 days ago, so this may be out of date.'), JSON.stringify(old))
  const gapRun = run()
  gapRun.modules[0].knownGaps = [{ name: '◐ half pause stops the rules, not the looks', why: 'Turns move on when animations finish, so half pause can\'t hold them yet', roadmap: 'F89' }]
  const gap = frameworkStatus(current, { full: gapRun }, now)
  expect('a known gap → still healthy, one 📌 "Planned for later (F89 on the roadmap): …" line', gap.healthy && gap.planned.length === 1 && gap.planned[0].text === 'Planned for later (F89 on the roadmap): Turns move on when animations finish, so half pause can\'t hold them yet.' && gap.hint === 'all good · 1 planned for later', JSON.stringify(gap))
  const closedRun = run()
  closedRun.modules[0].gapsToRemove = ['◐ half pause stops the rules, not the looks']
  const closed = frameworkStatus(current, { full: closedRun }, now)
  expect('a known gap that passes now → Claude takes it off the list', !closed.healthy && /takes it off/.test(closed.lines[0].text) && closed.lines[0].who === 'claude', JSON.stringify(closed))
  const quick = frameworkStatus(current, { static: run() }, now)
  expect('only the quick check ran → not healthy, Claude runs the full one', !quick.healthy && /quick check/.test(quick.lines[0].text), JSON.stringify(quick))
  const fails = frameworkStatus(current, { full: run({ devkit: ['a snapshot restores exactly', 'no errors in the console'], ui: ['no errors in the console', 'nothing 🔴 ships'] }) }, now)
  expect('failures → one sentence each, a repeat said once, 🔴 needs you', fails.lines.length === 3 && fails.lines.filter((l) => l.who === 'you').length === 1 && fails.hint === '3 things to sort — 1 needs you', JSON.stringify(fails))
  expect('a failing snapshot check → plain words, Claude fixes it', checkSentence('a snapshot restores exactly', 'devkit').text === 'Loading a Dev Kit snapshot doesn\'t bring back exactly the same moment of play. Claude fixes it.')
  const unknown = checkSentence('the frobnicator agrees (selfTest2)', 'audio')
  expect('unknown check → a generic sentence naming the piece, never the raw check name', unknown.text === 'One of the sound kit\'s checks didn\'t pass. Claude looks into it in the next /develop.' && !/frobnicator/.test(unknown.text), unknown.text)
  const tech = /\d+\.\d+\.\d+|npm |\.mjs|\.json|check:|selfTest|canRestore|content\//
  const leaky = Object.keys(CHECK_WORDS).map((k) => checkSentence(k, 'ui').text).filter((s) => tech.test(s))
  expect('no sentence names a version, command, file or test', leaky.length === 0, leaky.join('\n'))

  // the whole page: a game with two current pieces and a passing full check → the row shows only the green line
  const root = mkdtempSync(join(tmpdir(), 'bmuz-ppp-'))
  const game = join(root, 'game'), fwDir = join(root, 'framework')
  write(join(game, '.planning', 'ROADMAP.md'), '# Test — Roadmap\nRelease target: alpha\n## v0.1 — First  ← current\n- 🔨 F01 🎮 Thing — must:alpha\n')
  write(join(game, 'src', 'devkit', 'VERSION'), '1.0.0\ncommit abc\n'); write(join(game, 'src', 'ui', 'kit', 'VERSION'), '1.0.0\n')
  write(join(fwDir, 'devkit', 'kit', 'VERSION'), '1.0.0\n'); write(join(fwDir, 'ui-kit', 'kit', 'VERSION'), '1.0.0\n')
  write(join(game, 'e2e-shots', 'framework.json'), JSON.stringify({ full: run({}, new Date().toISOString()) }))
  const build = () => { spawnSync('node', [join(SCRIPTS, '..', 'templates', 'ppp', 'build-ppp.mjs'), game], { encoding: 'utf8', env: { ...process.env, BMUZ_FRAMEWORK: fwDir } }); const h = readFileSync(join(game, '.planning', 'ppp.html'), 'utf8'); const s = h.indexOf('data-key="framework"'); return h.slice(s, h.indexOf('<details class="map fold"', s)) }
  const shown = build()
  expect('page, healthy → the row shows the one green line and no version numbers', /✅ Framework pieces are up to date and working \(checked today\)\./.test(shown) && !/fw-list/.test(shown) && !/\d+\.\d+\.\d+/.test(shown), shown)
  write(join(fwDir, 'devkit', 'kit', 'VERSION'), '1.1.0\n')
  const behind = build()
  expect('page, an update out → a plain sentence, still no version numbers before the details fold', /A newer Dev Kit is out \(new features and fixes\)/.test(behind) && !/\d+\.\d+\.\d+/.test(behind), behind)
  rmSync(root, { recursive: true, force: true })
}

// F70: /deliver won't merge or release while GitHub's Checks run is red. gh is faked (BMUZ_GH): FAKE_GH = "fail" or
// the JSON gh would print; every call's arguments land in FAKE_GH_LOG.
function testChecksGate() {
  console.log('checks-gate — GitHub must be green before merge / release')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-checks-'))
  const repo = makeRepo(root)
  const fake = join(root, 'fake-gh.mjs')
  const log = join(root, 'gh.log')
  write(fake, [
    "import { appendFileSync } from 'node:fs'",
    "appendFileSync(process.env.FAKE_GH_LOG, process.argv.slice(2).join(' ') + '\\n')",
    "if (process.env.FAKE_GH === 'fail') { console.error('gh: To get started with GitHub CLI, please run: gh auth login'); process.exit(4) }",
    'console.log(process.env.FAKE_GH)',
  ].join('\n'))
  const URL = 'https://github.com/x/y/actions/runs/1'
  const runs = (status, conclusion) => JSON.stringify([{ status, conclusion, url: URL, headSha: 'abc' }])
  const env = (answer) => ({ BMUZ_GH: fake, FAKE_GH: answer, FAKE_GH_LOG: log })
  const gate = (answer, ...a) => script('checks-gate.mjs', a, { cwd: repo, env: env(answer) })

  const none = gate(runs('completed', 'failure'))
  expect('no Checks workflow → warning that says how to add it, not a refusal', none.code === 0 && /no GitHub Checks workflow/.test(none.out) && /templates\/checks\.yml/.test(none.out), none.out)
  expect('…and GitHub isn\'t even asked', !existsSync(log))
  write(join(repo, '.github', 'workflows', 'checks.yml'), 'name: Checks\non: push\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'checks')
  const noGh = gate('fail')
  expect('gh missing / not logged in → warning, not a refusal', noGh.code === 0 && /⚠/.test(noGh.out) && /gh auth login/.test(noGh.out), noGh.out)
  const never = gate('[]')
  expect('commit never checked (not pushed) → refused', never.code === 1 && /hasn't checked/.test(never.out), never.out)
  const running = gate(runs('in_progress', ''))
  expect('still running → refused, with the run link', running.code === 1 && /still checking/.test(running.out) && running.out.includes(URL), running.out)
  const red = gate(runs('completed', 'failure'))
  expect('red → refused in plain words, with the run link', red.code === 1 && /is red \(failure\)/.test(red.out) && red.out.includes(URL), red.out)
  const green = gate(runs('completed', 'success'))
  const tip = sh(repo, 'rev-parse', 'HEAD')
  const asked = readFileSync(log, 'utf8').trim().split('\n').at(-1)
  expect('green → ✓ carries on', green.code === 0 && /✓ .*green/.test(green.out), green.out)
  expect('…asked about the branch\'s latest commit on the Checks workflow', asked.includes(`--commit ${tip}`) && asked.includes('--branch main') && asked.includes('--workflow Checks'), asked)
  expect('unknown branch → refused', gate(runs('completed', 'success'), 'dev/nope').code === 1)

  // release.mjs: after `git merge --no-ff <work branch>`, the merged commit must be green too
  write(join(repo, 'version.json'), JSON.stringify({ name: 'T', version: '0.1.0', build: 0, history: [] }) + '\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'version')
  sh(repo, 'checkout', '-q', '-b', 'dev/x'); write(join(repo, 'b.txt'), 'b\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'work')
  const work = sh(repo, 'rev-parse', 'HEAD')
  sh(repo, 'checkout', '-q', 'main'); sh(repo, 'merge', '-q', '--no-ff', '-m', 'merge dev/x', 'dev/x')
  const relRed = script('release.mjs', ['update', 'x'], { cwd: repo, env: env(runs('completed', 'failure')) })
  expect('release after merging a red branch → refused, nothing changed', relRed.code === 1 && /is red/.test(relRed.out) && JSON.parse(readFileSync(join(repo, 'version.json'), 'utf8')).version === '0.1.0' && !sh(repo, 'tag'), relRed.out)
  expect('…it asked about the merged branch\'s last commit', readFileSync(log, 'utf8').trim().split('\n').at(-1).includes(`--commit ${work}`))
  const relGreen = script('release.mjs', ['update', 'x'], { cwd: repo, env: env(runs('completed', 'success')) })
  expect('release after merging a green branch → released', relGreen.code === 0 && sh(repo, 'tag') === 'v0.1.1', relGreen.out)
  rmSync(root, { recursive: true, force: true })
}

const only = process.argv[2]
const suites = { 'install-module': testInstallModule, release: testRelease, 'checks-gate': testChecksGate, save: testSave, 'sprint-helpers': testSprintHelpers, 'stop-servers': testStopServers, 'ppp-framework': testPppFramework }
for (const [name, run] of Object.entries(suites)) if (!only || only === name) await run()
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
