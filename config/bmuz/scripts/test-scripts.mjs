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

// A stand-in for config-sync.sh, so no test ever pulls or pushes the real ~/.claude-config (save.mjs step 7):
// `status` prints $FAKE_SYNC_STATUS, `push` appends to $FAKE_SYNC_LOG and says PUSHED.
const FAKE_SYNC = join(mkdtempSync(join(tmpdir(), 'bmuz-sync-')), 'sync.sh')
writeFileSync(FAKE_SYNC, 'if [ "$1" = status ]; then [ -n "$FAKE_SYNC_STATUS" ] && printf "%s\\n" "$FAKE_SYNC_STATUS"; else echo "push $2" >> "${FAKE_SYNC_LOG:-/dev/null}"; echo "PUSHED: abc $2"; fi\nexit 0\n')

// Run a script; returns { code, out }.
function script(name, args, { cwd, env = {} } = {}) {
  const r = spawnSync('node', [join(SCRIPTS, name), ...args], { cwd, encoding: 'utf8', env: { ...process.env, BMUZ_CONFIG_SYNC: FAKE_SYNC, ...env }, timeout: 300_000 })
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

// Today as the plan files write it (local date — release.mjs accepts local or UTC)
const d = new Date()
const TODAY = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// A BMUZ game ready to release v0.9.3 (update): code committed as "F01: cards", STATE records today's Log line, a
// RESUME HERE naming the tag, a Release line, and both reviews + the full check through that commit. `opts` breaks
// pieces of it: state: { resume, log, release, reviewed, security, full } (false = leave the line out), roadmap, scripts.
function releaseProject(root, name, opts = {}) {
  const repo = makeRepo(root, name)
  write(join(repo, '.gitignore'), 'node_modules/\n')
  write(join(repo, 'version.json'), JSON.stringify({ name: 'T', version: '0.9.2', build: 7, history: [] }, null, 2) + '\n')
  write(join(repo, 'package.json'), JSON.stringify({ name: 't', version: '0.9.2', scripts: { 'check:fast': 'node pass.js', ...opts.scripts } }, null, 2) + '\n')
  write(join(repo, 'package-lock.json'), JSON.stringify({ name: 't', version: '0.9.2', packages: { '': { version: '0.9.2' } } }, null, 2) + '\n')
  write(join(repo, 'pass.js'), 'process.exit(0)\n')
  write(join(repo, 'src', 'game.js'), 'export const cards = 7\n')
  sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'F01: cards')
  const sha = sh(repo, 'rev-parse', '--short', 'HEAD')
  const s = { resume: 'Released v0.9.3 — next: /sprint', log: `- ${TODAY} — Cards fan out in your hand`, release: '**Release:** none (library)', reviewed: sha, security: sha, full: sha, ...opts.state }
  write(join(repo, '.planning', 'STATE.md'), ['# State', '## ▶ RESUME HERE', s.resume, '## Where we are', 'Stage: deliver · Version: 0.9.2.7 · Branch: main', '## Key facts', s.release,
    s.reviewed !== false ? `Reviewed through: ${s.reviewed} (F01)` : '', s.security !== false ? `**Security reviewed:** ${s.security}` : '', s.full !== false ? `Last full check: ${s.full} — all green` : '',
    '## Log', s.log, '- 2026-01-01 — older', ''].join('\n'))
  write(join(repo, '.planning', 'ROADMAP.md'), opts.roadmap || '# T — Roadmap\nRelease target: alpha\n## v0.1 — First  ← current\n- ✅ F01 🧱 Cards — must:alpha\n')
  sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'plan')
  return repo
}
const FAKE_CLEANUP = join(dirname(FAKE_SYNC), 'cleanup.sh')
writeFileSync(FAKE_CLEANUP, 'echo "🧹 cleaned 1 MB — test"\n')

function testRelease() {
  console.log('release — version, history, commit, tag in one go')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-release-'))
  const plain = makeRepo(root, 'plain')
  expect('no version.json → refused', script('release.mjs', ['update', 'x'], { cwd: plain }).code === 1)
  const repo = releaseProject(root, 'game')
  const release = (...a) => script('release.mjs', a, { cwd: repo, env: { BMUZ_CLEANUP: FAKE_CLEANUP } })
  write(join(repo, 'src', 'game.js'), 'export const cards = 8\n')
  const dirty = release('update', 'x')
  expect('uncommitted code → refused, lists it', dirty.code === 1 && /src\/game\.js/.test(dirty.out), dirty.out)
  sh(repo, 'checkout', '-q', '--', 'src/game.js')
  expect('no summary → refused', release('update').code === 1)
  expect('unknown kind → refused', release('huge', 'x').code === 1)
  expect('unknown option → refused, lists the overrides', /--musts-open-ok/.test(release('update', 'x', '--yolo').out))
  const dry = release('update', 'Cards fan out', '--dry-run')
  expect('--dry-run → every gate passes, says 0.9.2.7 → 0.9.3.0, changes nothing', dry.code === 0 && /0\.9\.2\.7 → 0\.9\.3\.0/.test(dry.out) && /every gate passes/.test(dry.out) && !sh(repo, 'status', '--porcelain'), dry.out)
  write(join(repo, '.planning', 'BUGS.md'), '# T — Bugs\n## Open\n### B004 · P1 · open · found 2026-10-01\nScore sometimes off by one\n')
  const up = release('update', 'Cards fan out')
  const v = JSON.parse(readFileSync(join(repo, 'version.json'), 'utf8'))
  expect('update → 0.9.3, build 0, history entry', up.code === 0 && v.version === '0.9.3' && v.build === 0 && v.history.at(-1).summary === 'Cards fan out', up.out)
  expect('…package.json + lock synced', JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).version === '0.9.3' && JSON.parse(readFileSync(join(repo, 'package-lock.json'), 'utf8')).packages[''].version === '0.9.3')
  expect('…committed "Release v0.9.3: …" and tagged (annotated)', sh(repo, 'log', '-1', '--format=%s') === 'Release v0.9.3: Cards fan out' && sh(repo, 'cat-file', '-t', 'v0.9.3') === 'tag')
  expect('…nothing pushed', !sh(repo, 'ls-remote', '--tags', 'origin'))
  expect('D32: …STATE\'s Version: written by the script (0.9.3.0), in the same commit as BUGS.md', /Version: 0\.9\.3\.0 ·/.test(readFileSync(join(repo, '.planning', 'STATE.md'), 'utf8')) && sh(repo, 'show', '--name-only', '--format=', 'HEAD').includes('.planning/STATE.md') && !sh(repo, 'status', '--porcelain'), sh(repo, 'show', '--name-only', 'HEAD'))
  expect('D7: …check:fast green (the dry run\'s green record reused — same code)', /✓ check:fast already green on this exact code/.test(up.out) && /✓ check:fast green/.test(dry.out), up.out)
  expect('D13: …the open P1 printed, not refused', /open P1s/.test(up.out) && /B004/.test(up.out), up.out)
  expect('D46: …cleanup.sh ran after the release, its line shown', /🧹 cleaned 1 MB — test/.test(up.out), up.out)
  sh(repo, 'tag', 'v0.9.4')
  expect('tag already there → refused', /tag v0\.9\.4 already exists/.test(release('update', 'again').out))
  sh(repo, 'tag', '-d', 'v0.9.4')
  sh(repo, 'checkout', '-q', '-b', 'dev/x')
  const branch = release('update', 'x')
  expect('on a work branch → refused (merge first), names merge.mjs', branch.code === 1 && /merges the work branch/.test(branch.out) && /merge\.mjs dev\/x/.test(branch.out), branch.out)
  sh(repo, 'checkout', '-q', 'main')
  write(join(repo, 'version.json'), JSON.stringify({ name: 'T', version: '1..3', build: 0, history: [] }) + '\n'); sh(repo, 'commit', '-qam', 'odd version')
  expect('version "1..3" (not X.Y.Z) → refused (review)', /isn't X\.Y\.Z/.test(release('update', 'x').out))
  rmSync(root, { recursive: true, force: true })
}

// F80: every /deliver "make sure it's ready" step is a release.mjs gate — refused (all at once) and passing
function testReleaseGates() {
  console.log('release gates (F80) — everything /deliver used to remember, checked before anything changes')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-gates-'))
  const env = { BMUZ_CLEANUP: FAKE_CLEANUP }
  const release = (repo, ...a) => script('release.mjs', a, { cwd: repo, env })

  // everything wrong at once → ONE run lists every gate, nothing changes
  const bad = releaseProject(root, 'bad', { state: { resume: 'Working on cards', log: '- 2026-01-02 — old news', release: '', reviewed: false, security: false },
    roadmap: '# T — Roadmap\nRelease target: alpha\n## v0.1 — First  ← current\n- ✅ F01 🧱 Cards — must:alpha\n- 🔨 F02 🎮 Wiggle — must:alpha\n' })
  write(join(bad, 'pass.js'), 'console.log("score test fails"); process.exit(1)\n')
  write(join(bad, 'src', 'wiggle.js'), 'export const w = 1\n'); sh(bad, 'add', '-A'); sh(bad, 'commit', '-q', '-m', 'F02: wiggle')
  write(join(bad, '.planning', 'BUGS.md'), '# T — Bugs\n## Open\n### B001 · P0 · open · found 2026-10-18\nCrash on start\n')
  write(join(bad, '.planning', 'SPRINT.md'), '# Sprint 03 — cards\n## F01 🧱 Cards\n- [x] 🤖 1. a\n')
  const head = sh(bad, 'rev-parse', 'HEAD')
  const all = release(bad, 'update', 'x')
  const has = (re) => re.test(all.out)
  expect('everything wrong → ONE refusal listing every failing gate (exit 1)', all.code === 1 && /not ready to release — \d+ things/.test(all.out), all.out)
  expect('D6: no Log line dated today → named', has(/Log has no line dated today/), all.out)
  expect('D32: RESUME HERE doesn\'t name v0.9.3 → named, with the words to write', has(/RESUME HERE doesn't name v0\.9\.3/) && has(/Released v0\.9\.3/), all.out)
  expect('D38: no Release: line → named, with the 4 accepted forms', has(/no `Release:` line/) && has(/none \(library\)/), all.out)
  expect('D20: no Reviewed through: → named, lists the unreviewed commits', has(/no "Reviewed through:" line/) && has(/F02: wiggle/), all.out)
  expect('D19: no Security reviewed: → named, says /security-review', has(/no "Security reviewed:" line/) && has(/\/security-review/), all.out)
  expect('D11: code after Last full check: (project has check:full? no → not asked)', !has(/Last full check/), all.out)
  expect('D7: check:fast red → named with its output', has(/check:fast fails/) && has(/score test fails/), all.out)
  expect('D12: open P0 → named', has(/open P0/) && has(/B001: Crash on start/), all.out)
  expect('D15: F02 not ✅ but in this delivery → named, says --unapproved-ok', has(/not approved by Muzzy yet/) && has(/F02 \(Develop\)/) && has(/--unapproved-ok/), all.out)
  expect('D18: finished SPRINT.md → "archive-sprint.mjs"', has(/archived before the release/) && has(/archive-sprint\.mjs/), all.out)
  expect('…and nothing changed (no commit, no tag, version.json the same)', sh(bad, 'rev-parse', 'HEAD') === head && !sh(bad, 'tag') && JSON.parse(readFileSync(join(bad, 'version.json'), 'utf8')).version === '0.9.2', all.out)

  // D7: the green record — this exact code passed check:fast before → not re-run
  const g = releaseProject(root, 'green')
  const firstRun = release(g, 'update', 'x', '--dry-run') // runs check:fast, records green
  const cached = release(g, 'update', 'x', '--dry-run')
  expect('D7: first run → check:fast run fresh', /✓ check:fast green/.test(firstRun.out), firstRun.out)
  expect('D7: same code already passed check:fast → "already green on this exact code"', cached.code === 0 && /already green on this exact code/.test(cached.out), cached.out)

  // D11: with check:full, code after Last full check → refused; a docs-only change after it → fine
  const full = releaseProject(root, 'full', { scripts: { 'check:full': 'node pass.js' }, state: { full: 'abc1234' } })
  const noFull = release(full, 'update', 'x', '--dry-run')
  expect('D11: Last full check names no commit here → refused, says run check:full', noFull.code === 1 && /"Last full check:/.test(noFull.out) && /npm run check:full/.test(noFull.out), noFull.out)
  const fullOk = releaseProject(root, 'fullok', { scripts: { 'check:full': 'node pass.js' } })
  write(join(fullOk, 'README.md'), '# docs\n'); sh(fullOk, 'add', '-A'); sh(fullOk, 'commit', '-q', '-m', 'docs only')
  expect('D11: only docs changed since the full check → passes', release(fullOk, 'update', 'x', '--dry-run').code === 0)
  // D20 / D19: a code commit after the reviews → refused, naming it
  write(join(fullOk, 'src', 'late.js'), 'x\n'); sh(fullOk, 'add', '-A'); sh(fullOk, 'commit', '-q', '-m', 'tiny fix after the review')
  const late = release(fullOk, 'update', 'x', '--dry-run')
  expect('D20 + D19 + D11: a code commit after Reviewed through / Security reviewed / Last full check → all three refused, naming it', late.code === 1 && /after STATE's "Reviewed through/.test(late.out) && /after STATE's "Security reviewed/.test(late.out) && /after STATE's "Last full check/.test(late.out) && /tiny fix after the review/.test(late.out), late.out)

  // D10: framework pieces without check:framework → refused; check:framework red → refused; green → passes
  const fw = releaseProject(root, 'fw')
  write(join(fw, 'src', 'ui', 'kit', 'VERSION'), '0.20.1\n')
  const noFw = release(fw, 'update', 'x', '--dry-run')
  expect('D10: src/ui/kit/VERSION but no check:framework → refused, says reinstall the Dev Kit', noFw.code === 1 && /no check:framework script/.test(noFw.out) && /install-module\.mjs/.test(noFw.out), noFw.out)
  const fwRed = releaseProject(root, 'fwred', { scripts: { 'check:framework': 'node -e "console.log(\'✗ ui: a button is 30 px\');process.exit(1)"' } })
  const red = release(fwRed, 'update', 'x', '--dry-run')
  expect('D10: check:framework red → refused with its output', red.code === 1 && /check:framework fails/.test(red.out) && /a button is 30 px/.test(red.out), red.out)
  const fwGreen = releaseProject(root, 'fwgreen', { scripts: { 'check:framework': 'node pass.js' } })
  expect('D10: check:framework green → passes, said', /✓ check:framework green/.test(release(fwGreen, 'update', 'x', '--dry-run').out))

  // D31 / D4: milestone and stage releases
  const ms = releaseProject(root, 'ms', { state: { resume: 'Released v0.10.0 — next: /sprint' } })
  const msOpen = release(ms, 'milestone', 'Card play', '--dry-run')
  expect('D31: milestone release, no ROADMAP heading ✅ with today\'s date → refused, shows the heading to write', msOpen.code === 1 && /no ROADMAP milestone heading is marked ✅/.test(msOpen.out) && msOpen.out.includes(`✅ released ${TODAY}`), msOpen.out)
  write(join(ms, '.planning', 'ROADMAP.md'), `# T — Roadmap\nRelease target: alpha\n## v0.1 — First  ✅ released ${TODAY} (v0.10.0)\n- ✅ F01 🧱 Cards — must:alpha\n## v0.2 — Next  ← current\n- 🟢 F03 🎮 More — must:beta\n`)
  const msDone = release(ms, 'milestone', 'Card play')
  expect('D31: …marked ✅ today → released 0.10.0, reminds the look-back', msDone.code === 0 && sh(ms, 'tag') === 'v0.10.0' && /look-back/.test(msDone.out), msDone.out)
  const st = releaseProject(root, 'stage', { state: { resume: 'Released v0.10.0 — alpha' },
    roadmap: `# T — Roadmap\nRelease target: alpha\n## v0.1 — First  ✅ released ${TODAY}\n- ✅ F01 🧱 Cards — must:alpha\n- 🟢 F05 🎮 Sound — must:alpha\n` })
  expect('D4: stage release without --stage → refused', /--stage=alpha/.test(release(st, 'stage', 'Alpha').out))
  const stOpen = release(st, 'stage', 'Alpha', '--stage=alpha', '--dry-run')
  expect('D4: alpha musts open → refused, names F05, says --musts-open-ok', stOpen.code === 1 && /alpha musts aren't all done/.test(stOpen.out) && /F05/.test(stOpen.out) && /--musts-open-ok/.test(stOpen.out), stOpen.out)
  expect('D31: …and "Release target:" still says alpha → refused', /"Release target:" still says alpha/.test(stOpen.out), stOpen.out)
  write(join(st, '.planning', 'ROADMAP.md'), readFileSync(join(st, '.planning', 'ROADMAP.md'), 'utf8').replace('Release target: alpha', 'Release target: beta — musts not set (/define)'))
  const stOk = release(st, 'stage', 'Alpha', '--stage=alpha', '--musts-open-ok')
  expect('D4: --musts-open-ok (Muzzy\'s call) → released, open musts listed for the notes', stOk.code === 0 && sh(st, 'tag') === 'v0.10.0' && /released with open musts/.test(stOk.out), stOk.out)
  expect('…the override is on record in the release commit body ("Released with: --musts-open-ok (alpha: F05)")', /Released with: --musts-open-ok \(alpha: F05\)/.test(sh(st, 'log', '-1', '--format=%B')), sh(st, 'log', '-1', '--format=%B'))

  // D15: --unapproved-ok is Muzzy's call, on record
  const un = releaseProject(root, 'unapproved', { roadmap: '# T — Roadmap\nRelease target: alpha\n## v0.1 — First  ← current\n- ✅ F01 🧱 Cards — must:alpha\n- 🎛️ F02 🎮 Wiggle — could\n' })
  write(join(un, 'src', 'w.js'), 'x\n'); sh(un, 'add', '-A'); sh(un, 'commit', '-q', '-m', 'F02: wiggle')
  const w = sh(un, 'rev-parse', '--short', 'HEAD')
  write(join(un, '.planning', 'STATE.md'), readFileSync(join(un, '.planning', 'STATE.md'), 'utf8').replace(/(Reviewed through:|Security reviewed:\*\*|Last full check:) \w+/g, `$1 ${w}`)); sh(un, 'commit', '-qam', 'reviews')
  const unOk = release(un, 'update', 'x', '--unapproved-ok')
  expect('D15: F02 still tuning + --unapproved-ok → released, "Released with: --unapproved-ok (F02)" in the commit', unOk.code === 0 && /Released with: --unapproved-ok \(F02\)/.test(sh(un, 'log', '-1', '--format=%B')), unOk.out)

  // D38: the four accepted Release: forms
  for (const line of ['- Release: GitHub Pages (recipe github-pages.md)', 'Release: not set up (declined 2026-10-01)', '**Release:** itch — blocked: no butler key']) {
    const r = releaseProject(root, `rel${line.length}`, { state: { release: line } })
    expect(`D38: "${line}" → accepted`, release(r, 'update', 'x', '--dry-run').code === 0)
  }

  // D42: server code changed since the last tag → said
  const srv = releaseProject(root, 'server')
  write(join(srv, 'party', 'server.ts'), 'x\n'); sh(srv, 'add', '-A'); sh(srv, 'commit', '-q', '-m', 'server'); sh(srv, 'tag', 'v0.9.2')
  const srvSame = release(srv, 'update', 'x', '--dry-run')
  expect('D42: no server change since v0.9.2 → "server code changed since v0.9.2: no"', /server code changed since v0\.9\.2: no/.test(srvSame.out), srvSame.out)
  write(join(srv, 'party', 'server.ts'), 'y\n'); sh(srv, 'commit', '-qam', 'server change')
  expect('D42: …party/ changed → "yes (party/server.ts) → redeploy it first"', /changed since v0\.9\.2: yes \(party\/server\.ts\)/.test(release(srv, 'update', 'x', '--dry-run').out))
  rmSync(root, { recursive: true, force: true })
}

function testSave() {
  console.log('save — commit, push, and only then "safe"')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-save-'))
  const repo = makeRepo(root)
  const scratch = join(root, '.scratch') // never the real ~/Documents/dev/.scratch
  // Claude rewrites RESUME HERE before every save (F80 refuses it unchanged) — the helper does the same
  let resumes = 0
  const rewriteResume = () => {
    const file = join(repo, '.planning', 'STATE.md')
    if (existsSync(file)) writeFileSync(file, readFileSync(file, 'utf8').replace(/(## ▶ RESUME HERE\n)[^\n]*/, `$1resume ${++resumes}`))
  }
  const save = (...a) => { rewriteResume(); return script('save.mjs', a, { cwd: repo, env: { BMUZ_SCRATCH: scratch.split('\\').join('/') } }) }
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
  rewriteResume()
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

// F80 review #1: a save on one machine must never push its older setup over the other machine's newer changes
function testConfigSync() {
  console.log('config-sync — never pushes over the other machine\'s changes')
  const r = spawnSync('bash', [join(SCRIPTS, 'test-config-sync.sh')], { encoding: 'utf8', timeout: 120_000 })
  const out = `${r.stdout || ''}${r.stderr || ''}`
  expect('the run finished', r.status === 0 && /DONE/.test(out), out)
  expect('the laptop pushed its change', /LAPTOP-PUSH PUSHED/.test(out), out)
  expect('PC 1st status → INCOMING', /STATUS-1 INCOMING/.test(out), out)
  expect('PC 2nd status, still not applied → still INCOMING (the review\'s bug: it went quiet)', /STATUS-2 INCOMING/.test(out), out)
  expect('PC push → refused (NOT-APPLIED), nothing pushed', /PC-PUSH-2 NOT-APPLIED/.test(out) && !/PC-PUSH-2 PUSHED/.test(out), out)
  expect('…GitHub keeps the laptop\'s version', /REMOTE v2-laptop/.test(out), out)
  expect('after applying it → status quiet', !/STATUS-3/.test(out), out)
}

// F80: what /save's skill text used to ask Claude to remember — checks, RESUME HERE, planner, setup sync — now the script
function testSaveTriggers() {
  console.log('save (F80) — checks, RESUME HERE, planner page and setup sync happen by themselves')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-save80-'))
  const repo = makeRepo(root)
  const scratch = join(root, '.scratch').split('\\').join('/')
  const syncLog = join(root, 'sync.log')
  const stateFile = join(repo, '.planning', 'STATE.md')
  const state = (resume) => write(stateFile, `# State\n## ▶ RESUME HERE\n${resume}\n## Key facts\n**Planner (PPP):** https://claude.ai/artifact/abc123\n## Log\n- 2026-10-19 — one\n`)
  const save = (args, env = {}) => script('save.mjs', args, { cwd: repo, env: { BMUZ_SCRATCH: scratch, FAKE_SYNC_LOG: syncLog, BMUZ_BUILD_PPP: join(root, 'ppp.mjs'), ...env } })
  // a stand-in planner builder: writes ppp.html from STATE, so the page changes when STATE does
  write(join(root, 'ppp.mjs'), "import { readFileSync, writeFileSync } from 'node:fs'\nconst dir = process.argv[2]\nwriteFileSync(dir + '/.planning/ppp.html', '<p>' + readFileSync(dir + '/.planning/STATE.md', 'utf8').length + '</p>')\n")
  write(join(repo, '.gitignore'), '.claude/worktrees/\n.planning/ppp.html\n')
  write(join(repo, 'pass.js'), 'process.exit(0)\n')
  write(join(repo, 'package.json'), JSON.stringify({ scripts: { 'check:fast': 'node pass.js' } }))
  state('first notes')
  const first = save(['first'])
  expect('check:fast run by the save, green → said', first.code === 0 && /✓ check:fast green/.test(first.out), first.out)
  expect('…planner page rebuilt, "republish" + its link said, Stop-hook marker written', /republish \.planning\/ppp\.html to https:\/\/claude\.ai\/artifact\/abc123/.test(first.out) && existsSync(join(repo, '.git', 'bmuz-ppp-rebuilt')), first.out)
  expect('…setup in sync (status quiet) → nothing pushed, nothing said', !existsSync(syncLog) && !/Setup/.test(first.out), first.out)
  // RESUME HERE unchanged since the last save, with new work → refused, nothing committed
  write(join(repo, 'a2.txt'), 'x\n')
  const head = sh(repo, 'rev-parse', 'HEAD')
  const stale = save(['stale notes'])
  expect('RESUME HERE same as GitHub has + new work → refused, says rewrite it / --resume-unchanged', stale.code === 1 && /RESUME HERE/.test(stale.out) && /--resume-unchanged/.test(stale.out) && sh(repo, 'rev-parse', 'HEAD') === head, stale.out)
  const forced = save(['on purpose', '--resume-unchanged'])
  expect('…--resume-unchanged → saved (a decision on record, not a forget)', forced.code === 0 && /safe to switch machines/.test(forced.out), forced.out)
  state('only the notes changed')
  const notesOnly = save(['notes only'])
  expect('…next save with only plan notes changed → check:fast not re-run (same code as the last green)', notesOnly.code === 0 && /already green on this exact code/.test(notesOnly.out), notesOnly.out)
  // red check → a heads-up, the save still happens
  write(join(repo, 'pass.js'), 'console.log("score test fails"); process.exit(1)\n')
  state('broke the score test')
  const red = save(['red'])
  expect('check:fast red → "heads up … fails (saving anyway)" with its output, still saved', red.code === 0 && /heads up — check:fast fails/.test(red.out) && /score test fails/.test(red.out) && /safe to switch machines/.test(red.out), red.out)
  // no check:fast → npm test + build
  write(join(repo, 'package.json'), JSON.stringify({ scripts: { test: 'node pass.js', build: 'node -e ""' } }))
  state('no check:fast')
  const plain = save(['plain'])
  expect('no check:fast → npm test + npm run build run, each said', plain.code === 0 && /npm run test fails/.test(plain.out) && /✓ npm run build green/.test(plain.out), plain.out)
  // setup sync: this machine changed something → pushed with the summary; the other machine pushed → named, not pushed
  state('sync')
  const synced = save(['synced'], { FAKE_SYNC_STATUS: 'CHANGED: skills/save/SKILL.md\nCHANGED: config/bmuz/scripts/save.mjs' })
  expect('setup changed here → pushed to the laptop with the summary, files named', synced.code === 0 && /Setup synced to the laptop \(2 files: skills\/save\/SKILL\.md/.test(synced.out) && readFileSync(syncLog, 'utf8').includes('push synced'), synced.out)
  state('incoming')
  const incoming = save(['incoming'], { FAKE_SYNC_STATUS: 'INCOMING: the other machine pushed config changes:\n  abc laptop fix\nCHANGED: skills/save/SKILL.md' })
  expect('the other machine pushed setup → "NOT synced", apply first; nothing pushed; the game save still safe', incoming.code === 0 && /setup NOT synced/.test(incoming.out) && !readFileSync(syncLog, 'utf8').includes('push incoming') && /safe to switch machines/.test(incoming.out), incoming.out)
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
  // D26 (audit §3 #3): a fast-forward merge (no merge commit) used to skip the check silently
  sh(repo, 'checkout', '-q', '-b', 'dev/y'); write(join(repo, 'c.txt'), 'c\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'more work')
  sh(repo, 'checkout', '-q', 'main'); sh(repo, 'merge', '-q', '--ff-only', 'dev/y')
  const ff = script('release.mjs', ['update', 'y'], { cwd: repo, env: env(runs('completed', 'failure')) })
  expect('D26: fast-forward merge of a red branch → still asked about (HEAD) and refused', ff.code === 1 && /is red/.test(ff.out) && readFileSync(log, 'utf8').trim().split('\n').at(-1).includes(`--commit ${sh(repo, 'rev-parse', 'HEAD')}`) && sh(repo, 'tag').split('\n').length === 1, ff.out)
  // a merge, then more code straight on main → both the merged branch and HEAD are asked about
  sh(repo, 'checkout', '-q', '-b', 'dev/z'); write(join(repo, 'd.txt'), 'd\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'z work')
  sh(repo, 'checkout', '-q', 'main'); sh(repo, 'merge', '-q', '--no-ff', '-m', 'merge dev/z', 'dev/z')
  write(join(repo, 'e.txt'), 'e\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'straight on main')
  writeFileSync(log, '')
  const both = script('release.mjs', ['update', 'z'], { cwd: repo, env: env(runs('completed', 'success')) })
  const asks = readFileSync(log, 'utf8').trim().split('\n')
  expect('D26: merge + a later commit on main → the merged branch AND HEAD are checked', both.code === 0 && asks.length === 2 && asks[1].includes(sh(repo, 'rev-parse', 'HEAD^')), both.out + asks.join('\n'))
  rmSync(root, { recursive: true, force: true })
}

// A fake gh that answers from a queue: FAKE_GH_QUEUE = a file with a JSON array of answers ("fail" = gh not logged
// in); each call takes the first, the last one sticks. Every call's arguments land in FAKE_GH_LOG.
function queueGh(root) {
  const fake = join(root, 'queue-gh.mjs')
  write(fake, [
    "import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'",
    "appendFileSync(process.env.FAKE_GH_LOG, process.argv.slice(2).join(' ') + '\\n')",
    'const queue = JSON.parse(readFileSync(process.env.FAKE_GH_QUEUE, "utf8"))',
    'const answer = queue.length > 1 ? queue.shift() : queue[0]',
    'writeFileSync(process.env.FAKE_GH_QUEUE, JSON.stringify(queue))',
    "if (answer === 'fail') { console.error('gh: please run gh auth login'); process.exit(4) }",
    'console.log(answer)',
  ].join('\n'))
  const queue = join(root, 'gh-queue.json')
  const log = join(root, 'gh-queue.log')
  return { env: (...answers) => { writeFileSync(queue, JSON.stringify(answers)); return { BMUZ_GH: fake, FAKE_GH_QUEUE: queue, FAKE_GH_LOG: log, BMUZ_POLL_MS: '10' } }, log }
}
const ghRuns = (status, conclusion, url = 'https://github.com/x/y/actions/runs/7') => JSON.stringify([{ status, conclusion, url, headSha: 'abc' }])

// F80 (D25–D29): merge.mjs — push, GitHub green, pull, merge --no-ff, delete the branch
function testMerge() {
  console.log('merge — push, GitHub green, merge --no-ff, delete the branch (F80)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-merge-'))
  const repo = makeRepo(root)
  const gh = queueGh(root)
  const merge = (envs, ...a) => script('merge.mjs', a, { cwd: repo, env: envs })
  write(join(repo, '.github', 'workflows', 'checks.yml'), 'name: Checks\non: push\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'checks'); sh(repo, 'push', '-q')
  sh(repo, 'checkout', '-q', '-b', 'dev/v0-2'); write(join(repo, 'b.txt'), 'b\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'F02: b')
  expect('no branch named → refused', merge(gh.env(ghRuns('completed', 'success'))).code === 1)
  expect('unknown branch → refused', /no branch "dev\/nope"/.test(merge(gh.env(ghRuns('completed', 'success')), 'dev/nope').out))
  expect('the main branch itself → refused', /is the main branch itself/.test(merge(gh.env(ghRuns('completed', 'success')), 'main').out))
  write(join(repo, 'b.txt'), 'changed\n')
  expect('uncommitted code → refused', /uncommitted code/.test(merge(gh.env(ghRuns('completed', 'success')), 'dev/v0-2').out))
  sh(repo, 'checkout', '-q', '--', 'b.txt')
  const red = merge(gh.env(ghRuns('completed', 'failure')), 'dev/v0-2')
  expect('red on GitHub → refused with the run link, "never merge around", still on the branch, not merged', red.code === 1 && /is red/.test(red.out) && /never merge around/.test(red.out) && sh(repo, 'rev-parse', '--abbrev-ref', 'HEAD') === 'dev/v0-2' && !sh(repo, 'branch', '--merged', 'main').includes('dev/v0-2'), red.out)
  expect('…the branch was pushed first (GitHub can only check what it has)', sh(repo, 'ls-remote', '--heads', 'origin', 'dev/v0-2') !== '')
  const good = merge(gh.env('[]', ghRuns('in_progress', ''), ghRuns('completed', 'success')), 'dev/v0-2')
  expect('not checked yet → still running → green: waited for, then merged', good.code === 0 && /waiting for GitHub's Checks run/.test(good.out) && /merged into main/.test(good.out), good.out)
  expect('…a real merge commit (--no-ff: two parents), on main', sh(repo, 'rev-parse', '--abbrev-ref', 'HEAD') === 'main' && sh(repo, 'log', '-1', '--format=%P').split(' ').length === 2 && sh(repo, 'log', '-1', '--format=%s') === 'Merge dev/v0-2 into main', sh(repo, 'log', '-1', '--format=%P %s'))
  expect('…deleted here; GitHub\'s copy kept until main is pushed (said)', !sh(repo, 'branch', '--list', 'dev/v0-2') && sh(repo, 'ls-remote', '--heads', 'origin', 'dev/v0-2') !== '' && /stays until main is pushed/.test(good.out), good.out)
  expect('…main not pushed (that\'s after the smoke pass)', sh(repo, 'rev-parse', 'origin/main') !== sh(repo, 'rev-parse', 'HEAD'))
  // conflicts: version.json → main's copy by itself; any other file → stop mid-merge with the way out
  write(join(repo, 'version.json'), '{"version":"0.1.0","build":3}\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'v')
  sh(repo, 'checkout', '-q', '-b', 'dev/v'); write(join(repo, 'version.json'), '{"version":"0.1.0","build":9}\n'); write(join(repo, 'f.txt'), 'f\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'build 9')
  sh(repo, 'checkout', '-q', 'main'); write(join(repo, 'version.json'), '{"version":"0.1.0","build":4}\n'); sh(repo, 'commit', '-qam', 'build 4')
  const ver = merge(gh.env(ghRuns('completed', 'success')), 'dev/v')
  expect('only version.json clashes → main\'s copy kept, merged', ver.code === 0 && /kept main's copy/.test(ver.out) && readFileSync(join(repo, 'version.json'), 'utf8').includes('"build":4') && existsSync(join(repo, 'f.txt')), ver.out)
  sh(repo, 'checkout', '-q', '-b', 'dev/c'); write(join(repo, 'a.txt'), 'branch side\n'); sh(repo, 'commit', '-qam', 'c branch')
  sh(repo, 'checkout', '-q', 'main'); write(join(repo, 'a.txt'), 'main side\n'); sh(repo, 'commit', '-qam', 'c main')
  const clash = merge(gh.env(ghRuns('completed', 'success')), 'dev/c')
  expect('a real conflict → refused, names a.txt, left mid-merge, says how to finish or `git merge --abort`', clash.code === 1 && /a\.txt/.test(clash.out) && /git merge --abort/.test(clash.out) && /commit --no-edit/.test(clash.out) && existsSync(join(repo, '.git', 'MERGE_HEAD')), clash.out)
  expect('…running it again mid-merge → refused (finish or abort first)', /half-done/.test(merge(gh.env(ghRuns('completed', 'success')), 'dev/c').out))
  write(join(repo, 'a.txt'), 'both sides\n'); sh(repo, 'add', 'a.txt'); sh(repo, 'commit', '-q', '--no-edit')
  const after = merge(gh.env(ghRuns('completed', 'success')), 'dev/c')
  expect('…finished by hand, run again → "already in main", branch deleted', after.code === 0 && /already in main/.test(after.out) && !sh(repo, 'branch', '--list', 'dev/c'), after.out)
  // no Checks workflow → a warning, the merge goes ahead
  sh(repo, 'rm', '-q', '.github/workflows/checks.yml'); sh(repo, 'commit', '-qm', 'no checks')
  sh(repo, 'checkout', '-q', '-b', 'dev/w'); write(join(repo, 'w.txt'), 'w\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'w')
  const warn = merge(gh.env(ghRuns('completed', 'failure')), 'dev/w')
  expect('no Checks workflow → ⚠ says how to add it, merges anyway', warn.code === 0 && /no GitHub Checks workflow/.test(warn.out) && /merged into main/.test(warn.out), warn.out)
  // once main is pushed, the GitHub copies go (merge.mjs again, or live-check.mjs)
  sh(repo, 'push', '-q', 'origin', 'main')
  sh(repo, 'checkout', '-q', '-b', 'dev/last'); write(join(repo, 'l.txt'), 'l\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'last')
  const tidy = merge(gh.env(ghRuns('completed', 'success')), 'dev/last')
  expect('…next merge after main was pushed → the earlier branches are deleted on GitHub (all in main there)', tidy.code === 0 && /deleted dev\/v0-2 on GitHub/.test(tidy.out) && sh(repo, 'ls-remote', '--heads', 'origin', 'dev/v0-2') === '' && sh(repo, 'ls-remote', '--heads', 'origin', 'dev/last') !== '', tidy.out)
  rmSync(root, { recursive: true, force: true })
}

// F80 (D43–D45, D49–D50): live-check.mjs against a local web server (no real network)
async function testLiveCheck() {
  console.log('live-check — deploy run, public, new version, e2e:update, live pass (F80)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-live-'))
  const site = join(root, 'site')
  const port = 5900 + Math.floor(Math.random() * 300)
  // a tiny host: files from site/, /private → 403, /members → 302 to a login page
  write(join(root, 'host.mjs'), [
    "import http from 'node:http'; import { readFileSync } from 'node:fs'; import { join } from 'node:path'",
    `const dir = ${JSON.stringify(site)}`,
    'http.createServer((q, s) => {',
    "  const path = q.url.split('?')[0]",
    "  if (path === '/private/') { s.writeHead(403); return s.end('no') }",
    "  if (path === '/members/') { s.writeHead(302, { location: '/login?next=/members/' }); return s.end() }",
    "  if (path === '/login') { s.writeHead(200); return s.end('<form>sign in</form>') }",
    "  let body; try { body = readFileSync(join(dir, path.endsWith('/') ? path + 'index.html' : path)) } catch { s.writeHead(404); return s.end('nope') }",
    '  s.writeHead(200); s.end(body)',
    `}).listen(${port}, '127.0.0.1')`,
  ].join('\n'))
  const { spawn } = await import('node:child_process')
  const host = spawn(process.execPath, [join(root, 'host.mjs')], { stdio: 'ignore' })
  const base = `http://127.0.0.1:${port}`
  for (let i = 0; i < 40; i++) { try { await fetch(base); break } catch { await new Promise(r => setTimeout(r, 100)) } }
  const repo = makeRepo(root, 'game')
  const gh = queueGh(root)
  const state = (release, live = `${base}/game/`) => write(join(repo, '.planning', 'STATE.md'), `# State\n## ▶ RESUME HERE\nReleased v0.3.0\n## Where we are\nStage: deliver · Version: 0.3.0.0 · Live: ${live} (v0.3.0, alpha)\n## Key facts\n${release}\n## Log\n- ${TODAY} — x\n`)
  write(join(repo, 'version.json'), '{"version":"0.3.0","build":0}\n')
  state('**Release:** none (library)'); sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'Release v0.3.0: x'); sh(repo, 'tag', '-a', 'v0.3.0', '-m', 'v0.3.0')
  const live = (envs = {}, ...a) => script('live-check.mjs', a, { cwd: repo, env: { BMUZ_POLL_MS: '10', BMUZ_LIVE_TRIES: '2', ...envs } })
  const pass = () => readFileSync(join(repo, '.planning', 'live-pass'), 'utf8')

  const lib = live()
  expect('Release: none (library) → nothing to check, says "not hosted", the skip recorded', lib.code === 0 && /not hosted/.test(lib.out) && /skipped — Release: none \(library\)/.test(pass()), lib.out)
  state('Release: not set up (declined 2026-10-01)')
  expect('Release: not set up → "NOT live anywhere yet", exit 0', /NOT live anywhere yet/.test(live().out))
  state('')
  expect('no Release: line → refused, with the accepted forms', /no `Release:` line/.test(live().out))
  state('**Release:** GitHub Pages', '')
  expect('no Live URL → refused', /no `Live: https/.test(live().out))
  state('**Release:** GitHub Pages')
  write(join(site, 'game', 'index.html'), '<title>v0.2.9</title>')
  const old = live()
  expect('page still shows the old version → retried, then refused in plain words', old.code === 1 && /trying again \(1\/2\)/.test(old.out) && /0\.3\.0 isn't in it/.test(old.out), old.out)
  write(join(site, 'game', 'index.html'), '<title>Game</title><script type="module" src="./assets/index-abc.js"></script>')
  write(join(site, 'game', 'assets', 'index-abc.js'), 'const VERSION="0.3.0.0";')
  const ok1 = live()
  expect('new version in the JS bundle (not the HTML) → found, public, live pass recorded for the commit', ok1.code === 0 && /is public and shows 0\.3\.0 \(found in index-abc\.js\)/.test(ok1.out) && pass().startsWith(sh(repo, 'rev-parse', 'HEAD')) && pass().includes(`v0.3.0 ${base}/game/`), ok1.out)
  expect('…no smoke:live → says the console check is Claude\'s (Playwright), recorded as such', /console check is Claude's/.test(ok1.out) && /console: Claude's check/.test(pass()), ok1.out)
  state('**Release:** GitHub Pages', `${base}/private/`)
  const priv = live()
  expect('403 → "isn\'t public", not retried', priv.code === 1 && /isn't public/.test(priv.out) && !/trying again/.test(priv.out), priv.out)
  state('**Release:** GitHub Pages', `${base}/members/`)
  expect('redirect to a login → "isn\'t public"', /sends visitors to a login/.test(live().out))
  state('**Release:** GitHub Pages', `${base}/old/`)
  const moved = live({}, `--url=${base}/game/`)
  expect('--url=<new> → STATE\'s Live URL replaced (D50), then checked', moved.code === 0 && /Live URL updated/.test(moved.out) && readFileSync(join(repo, '.planning', 'STATE.md'), 'utf8').includes(`Live: ${base}/game/ (v0.3.0`), moved.out)
  // e2e:update + smoke:live
  write(join(repo, 'package.json'), JSON.stringify({ scripts: { 'e2e:update': 'node -e "process.exit(1)"' } }))
  expect('e2e:update fails → refused (returning players may get the old version)', /e2e:update fails/.test(live().out))
  write(join(repo, 'package.json'), JSON.stringify({ scripts: { 'e2e:update': 'node -e ""', 'smoke:live': 'node -e "if(!process.env.LIVE_URL)process.exit(1);console.log(\'live console clean\')"' } }))
  const smoke = live()
  expect('e2e:update + smoke:live (given LIVE_URL) green → both said, the console check recorded as smoke:live', smoke.code === 0 && /e2e:update green/.test(smoke.out) && /smoke:live green on the live site/.test(smoke.out) && /console: npm run smoke:live passed/.test(pass()), smoke.out)
  // a deploy workflow: wait for its run on this commit
  write(join(repo, '.github', 'workflows', 'deploy.yml'), 'name: Deploy\non:\n  push:\n    branches: [main]\njobs:\n  d:\n    steps:\n      - uses: actions/deploy-pages@v4\n')
  sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'deploy workflow')
  const unpushed = live(gh.env(ghRuns('completed', 'success')))
  expect('deploy workflow, commit not on GitHub → refused: push first', unpushed.code === 1 && /isn't on GitHub yet/.test(unpushed.out), unpushed.out)
  sh(repo, 'push', '-q', 'origin', 'main')
  const redRun = live(gh.env(ghRuns('completed', 'failure')))
  expect('deploy run red → refused with the link', redRun.code === 1 && /deploy run \(deploy\.yml\) is red/.test(redRun.out), redRun.out)
  const waited = live(gh.env('[]', ghRuns('in_progress', ''), ghRuns('completed', 'success')))
  expect('deploy run not started → running → green: waited for, then the page checked', waited.code === 0 && /waiting for the deploy run/.test(waited.out) && /finished green/.test(waited.out) && /is public/.test(waited.out), waited.out)
  expect('…asked about this commit\'s run of deploy.yml', readFileSync(gh.log, 'utf8').trim().split('\n').at(-1).includes(`--workflow deploy.yml --commit ${sh(repo, 'rev-parse', 'HEAD')}`))
  const noGh = live(gh.env('fail'))
  expect('gh not logged in → a warning, the page check still decides', noGh.code === 0 && /couldn't ask GitHub/.test(noGh.out), noGh.out)
  host.kill()
  rmSync(root, { recursive: true, force: true })
}

// F80 (studio gap): rollback.mjs — a new commit with the old code, history kept
async function testRollback() {
  console.log('rollback — the code back to a released tag, as a new commit (F80)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-rollback-'))
  const repo = makeRepo(root)
  write(join(repo, 'version.json'), '{"version":"0.1.0","build":0}\n'); write(join(repo, 'src', 'game.js'), 'good\n')
  sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'Release v0.1.0: x'); sh(repo, 'tag', '-a', 'v0.1.0', '-m', 'v0.1.0')
  write(join(repo, 'version.json'), '{"version":"0.1.1","build":0}\n'); write(join(repo, 'src', 'game.js'), 'bad\n'); write(join(repo, 'src', 'new.js'), 'new\n')
  write(join(repo, 'party', 'server.ts'), 'server\n'); write(join(repo, '.planning', 'STATE.md'), 'notes about the bad release\n')
  sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'F02: risky'); sh(repo, 'commit', '-q', '--allow-empty', '-m', 'Release v0.1.1: y'); sh(repo, 'tag', '-a', 'v0.1.1', '-m', 'v0.1.1')
  const rollback = (...a) => script('rollback.mjs', a, { cwd: repo })
  expect('no tag named → refused', rollback().code === 1)
  expect('unknown tag → refused', /no tag v9/.test(rollback('v9').out))
  write(join(repo, 'src', 'game.js'), 'dirty\n')
  expect('uncommitted code → refused', /uncommitted code/.test(rollback('v0.1.0').out))
  sh(repo, 'checkout', '-q', '--', 'src/game.js')
  sh(repo, 'checkout', '-q', '-b', 'dev/x')
  expect('not on main → refused', /not main/.test(rollback('v0.1.0').out))
  sh(repo, 'checkout', '-q', 'main')
  const before = sh(repo, 'rev-parse', 'HEAD')
  const back = rollback('v0.1.0', 'v0.1.1 crashes on phones')
  expect('rolled back → the code is v0.1.0\'s (game.js good, new.js gone)', back.code === 0 && readFileSync(join(repo, 'src', 'game.js'), 'utf8').replace(/\r/g, '') === 'good\n' && !existsSync(join(repo, 'src', 'new.js')), back.out)
  expect('…as ONE new commit on top (history kept), subject names both versions + why', sh(repo, 'rev-parse', 'HEAD^') === before && sh(repo, 'log', '-1', '--format=%s') === 'Rollback to v0.1.0: undo v0.1.1 — v0.1.1 crashes on phones')
  expect('….planning/ and version.json kept as they are now (the version only goes forward)', readFileSync(join(repo, '.planning', 'STATE.md'), 'utf8').includes('bad release') && readFileSync(join(repo, 'version.json'), 'utf8').includes('0.1.1') && !sh(repo, 'status', '--porcelain'))
  expect('…nothing pushed; says what still needs doing, incl. the server redeploy (party/ differs)', sh(repo, 'rev-parse', 'origin/main') !== sh(repo, 'rev-parse', 'HEAD') && /release\.mjs update "Rolled back to v0\.1\.0"/.test(back.out) && /redeploy the server FIRST/.test(back.out) && /live-check\.mjs/.test(back.out), back.out)
  expect('again → refused: the code already matches v0.1.0', /already matches v0\.1\.0/.test(rollback('v0.1.0').out))
  const { codeCommitsSince } = await import('./lib.mjs')
  expect('…release gates don\'t ask to re-review the rollback (its code was already released)', codeCommitsSince(repo, [], 'v0.1.1').length === 0)
  rmSync(root, { recursive: true, force: true })
}

// F80 (audit §3 #2): a script's own commit asks the same hooks a typed `git commit` does
function testScriptCommitGuards() {
  console.log('script commits — the commit hooks now cover save.mjs / release.mjs (F80)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-guards-'))
  const repo = makeRepo(root)
  const scratch = join(root, '.scratch').split('\\').join('/')
  const stateFile = join(repo, '.planning', 'STATE.md')
  let resumes = 0 // Claude rewrites RESUME HERE before every save (save.mjs refuses it unchanged)
  const save = (...a) => {
    write(stateFile, readFileSync(stateFile, 'utf8').replace(/(## ▶ RESUME HERE\n)[^\n]*/, `$1resume ${++resumes}`))
    return script('save.mjs', a, { cwd: repo, env: { BMUZ_SCRATCH: scratch, BMUZ_CLEANUP: FAKE_CLEANUP } })
  }
  write(join(repo, '.gitignore'), 'node_modules/\n.claude/worktrees/\n.planning/ppp.html\n')
  write(stateFile, '# State\n## ▶ RESUME HERE\nstart\n## Key facts\nReviewed through: none yet\n## Log\n- x\n')
  sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'plan'); sh(repo, 'push', '-q')
  // guard-git: feature code on main
  write(join(repo, 'src', 'cards.js'), 'x\n')
  const onMain = save('F08: cards')
  expect('save "F08: …" with code on main → refused by guard-git\'s main rule, nothing committed', onMain.code === 1 && /work branch/.test(onMain.out) && sh(repo, 'log', '-1', '--format=%s') === 'plan', onMain.out)
  // guard-git F72/F75: `F08: done` needs STATE + review
  sh(repo, 'checkout', '-q', '-b', 'dev/v0-1')
  expect('…on the work branch → saved', save('F08: cards').code === 0)
  write(join(repo, 'src', 'cards.js'), 'y\n')
  const done = save('F08: done')
  expect('save "F08: done" with Reviewed through unchanged → refused by the F75 gate (it used to slip past)', done.code === 1 && /Reviewed through/.test(done.out) && /F75/.test(done.out) && sh(repo, 'log', '-1', '--format=%s') === 'F08: cards', done.out)
  write(stateFile, readFileSync(stateFile, 'utf8').replace('Reviewed through: none yet', `Reviewed through: ${sh(repo, 'rev-parse', '--short', 'HEAD')}`))
  const doneOk = save('F08: done')
  expect('…Reviewed through written → "F08: done" saved', doneOk.code === 0 && sh(repo, 'log', '-1', '--format=%s') === 'F08: done', doneOk.out)
  // commit-typecheck: a type error in a staged .ts file
  write(join(repo, 'tsconfig.json'), '{}\n')
  write(join(repo, 'node_modules', 'typescript', 'bin', 'tsc'), 'console.log("src/a.ts(1,7): error TS2322: Type string is not assignable to type number."); process.exit(2)\n')
  write(join(repo, 'src', 'a.ts'), 'const n: number = "x"\n')
  const typed = save('score as text')
  expect('save with a type error → refused by commit-typecheck, with the error', typed.code === 1 && /type check failed/.test(typed.out) && /TS2322/.test(typed.out) && sh(repo, 'log', '-1', '--format=%s') === 'F08: done', typed.out)
  rmSync(join(repo, 'node_modules'), { recursive: true, force: true })
  // guard-git: secrets (save had its own list; the hook agrees)
  write(join(repo, 'src', 'a.ts'), 'const n: number = 1\n')
  expect('…type error fixed → saved', save('score as number').code === 0)
  rmSync(root, { recursive: true, force: true })
}

const only = process.argv[2]
const suites = { 'install-module': testInstallModule, release: testRelease, 'release-gates': testReleaseGates,'checks-gate': testChecksGate, save: testSave, 'save-triggers': testSaveTriggers, 'config-sync': testConfigSync, 'sprint-helpers': testSprintHelpers, 'stop-servers': testStopServers, 'ppp-framework': testPppFramework, merge: testMerge, 'live-check': testLiveCheck, rollback: testRollback, 'script-commit-guards': testScriptCommitGuards }
if (only && !suites[only]) { console.log(`✗ no suite "${only}" — the suites: ${Object.keys(suites).join(', ')}`); process.exit(1) } // a typo isn't "0 failed"
for (const [name, run] of Object.entries(suites)) if (!only || only === name) await run()
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
