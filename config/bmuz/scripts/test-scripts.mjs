// Proves every BMUZ script does its job — or refuses before changing anything (F69).
// Run: node ~/.claude/config/bmuz/scripts/test-scripts.mjs [suite]   (throwaway folders + repos in the temp folder)
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SCRIPTS = dirname(fileURLToPath(import.meta.url))
let passed = 0
let failed = 0

// A stand-in for config-sync.sh, so no test ever pulls or pushes the real ~/.claude-config (save.mjs step 7):
// `status` prints $FAKE_SYNC_STATUS, `push` appends to $FAKE_SYNC_LOG and says PUSHED.
const FAKE_SYNC = join(mkdtempSync(join(tmpdir(), 'bmuz-sync-')), 'sync.sh')
writeFileSync(FAKE_SYNC, 'if [ "$1" = status ]; then [ -n "$FAKE_SYNC_STATUS" ] && printf "%s\\n" "$FAKE_SYNC_STATUS"; else echo "push $2" >> "${FAKE_SYNC_LOG:-/dev/null}"; echo "PUSHED: abc $2"; fi\nexit 0\n')

// A stand-in for `npm audit` (deps-check, F85), so no test asks the network: prints $FAKE_AUDIT, or a clean report.
const FAKE_AUDIT = join(dirname(FAKE_SYNC), 'audit.mjs')
writeFileSync(FAKE_AUDIT, "console.log(process.env.FAKE_AUDIT || JSON.stringify({ vulnerabilities: {}, metadata: { vulnerabilities: { low: 0, moderate: 0, high: 0, critical: 0, total: 0 } } }))\n")

// Run a script; returns { code, out }.
function script(name, args, { cwd, env = {} } = {}) {
  const r = spawnSync('node', [join(SCRIPTS, name), ...args], { cwd, encoding: 'utf8', env: { ...process.env, BMUZ_CONFIG_SYNC: FAKE_SYNC, BMUZ_NPM_AUDIT: FAKE_AUDIT, ...env }, timeout: 300_000 })
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

async function testInstallModule() {
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
  expect('F85: ….npmrc gets min-release-age=7 (a week before taking a new package version), said', readFileSync(join(game, '.npmrc'), 'utf8') === 'min-release-age=7\n' && /min-release-age=7/.test(good.out), good.out)
  write(join(game, '.npmrc'), 'save-exact=true')
  install('audio', '.'); install('audio', '.')
  expect('F85: …an existing .npmrc keeps its lines and gets the line once, never twice', readFileSync(join(game, '.npmrc'), 'utf8') === 'save-exact=true\nmin-release-age=7\n', readFileSync(join(game, '.npmrc'), 'utf8'))
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
  expect('…and without the port pre-flight (F118)', /no port pre-flight/.test(lintGreen.out), lintGreen.out)
  // F112: the game's eslint.config ignores the module's folder, and the game's OWN lint runs after the install.
  // The game's "lint" stands in for Vite's eslint with react-refresh on: it fails while src/audio isn't ignored.
  write(join(game, 'package.json'), JSON.stringify({ scripts: { lint: 'node lint.mjs' } }))
  write(join(game, 'lint.mjs'), "import { readFileSync } from 'node:fs'\nif (!readFileSync('eslint.config.js', 'utf8').includes(\"'src/audio'\")) { console.log('src/audio/Panel.tsx  error  react-refresh/only-export-components'); process.exit(1) }\nconsole.log('lint clean')\n")
  write(join(game, 'node_modules', '.keep'), '')
  const crlf = "import { defineConfig, globalIgnores } from 'eslint/config'\r\nexport default defineConfig([\r\n  globalIgnores(['dist', 'src/ui/kit', 'sketches', '.claude']), // framework copies\r\n  { files: ['**/*.tsx'] },\r\n])\r\n"
  write(join(game, 'eslint.config.js'), crlf)
  const lintDry = install('audio', '.', '--dry-run')
  expect('F112: dry run names the eslint ignore it would add, file untouched', lintDry.code === 0 && /eslint\.config\.js: would add 'src\/audio' to globalIgnores/.test(lintDry.out) && readFileSync(join(game, 'eslint.config.js'), 'utf8') === crlf, lintDry.out)
  const lintOk = install('audio', '.')
  const after = readFileSync(join(game, 'eslint.config.js'), 'utf8')
  expect("F112: installed → only 'src/audio' added to globalIgnores, every other byte the same (CRLF kept)", after === crlf.replace("'.claude']", "'.claude', 'src/audio']"), JSON.stringify(after))
  expect("F112: …then the game's own lint runs and passes, said", lintOk.code === 0 && /lint clean|the game's own lint passes/.test(lintOk.out) && /game's own lint passes/.test(lintOk.out), lintOk.out)
  const again = install('audio', '.')
  expect('F112: a second install adds nothing (already ignored)', again.code === 0 && readFileSync(join(game, 'eslint.config.js'), 'utf8') === after && /already ignores src\/audio/.test(again.out), again.out)
  // a multi-line list gets a new line in the same indent; LF stays LF
  write(join(game, 'eslint.config.js'), "export default defineConfig([\n  globalIgnores([\n    'dist',\n    '**/spike', // throwaway\n  ]),\n])\n")
  install('audio', '.')
  expect('F112: a one-per-line list gets its own new line, same indent, trailing comma kept', readFileSync(join(game, 'eslint.config.js'), 'utf8') === "export default defineConfig([\n  globalIgnores([\n    'dist',\n    '**/spike', // throwaway\n    'src/audio',\n  ]),\n])\n", readFileSync(join(game, 'eslint.config.js'), 'utf8'))
  // a config it can't edit safely → refused BEFORE installing, with the exact line to add
  rmSync(join(game, 'src', 'audio'), { recursive: true, force: true })
  const odd = "const base = ['dist']\nexport default [globalIgnores([...base]), {}]\n"
  write(join(game, 'eslint.config.js'), odd)
  const refused = install('audio', '.')
  expect("F112: a globalIgnores list with more than strings → refused before installing, names the line; file untouched", refused.code === 1 && /can't be edited safely/.test(refused.out) && /'src\/audio',/.test(refused.out) && !existsSync(join(game, 'src', 'audio')) && readFileSync(join(game, 'eslint.config.js'), 'utf8') === odd, refused.out)
  write(join(game, 'eslint.config.js'), "export default [{ ignores: ['dist'] }]\n")
  const noList = install('audio', '.', '--dry-run')
  expect('F112: no globalIgnores at all → refused with the whole line to add', noList.code === 1 && /globalIgnores\(\['src\/audio'\]\), \/\/ framework module copies/.test(noList.out), noList.out)
  // the game's own lint red (its own code) → exit 1, says where to look
  write(join(game, 'eslint.config.js'), "export default [globalIgnores(['src/audio'])]\n")
  write(join(game, 'lint.mjs'), "console.log('src/game.tsx  error  no-unused-vars'); process.exit(1)\n")
  write(join(game, 'src', 'devkit', 'check-framework.mjs'), 'process.exit(0)')
  const gameRed = install('audio', '.')
  expect("F112: the game's own lint red → exit 1, its output shown, the module's checks still run", gameRed.code === 1 && /game's own lint fails/.test(gameRed.out) && /src\/game\.tsx/.test(gameRed.out) && /audio's code checks pass in the game/.test(gameRed.out), gameRed.out)
  rmSync(root, { recursive: true, force: true })
  // F112 review fixes — addEslintIgnores itself: a globalIgnores([ in a comment or a string is never the real list,
  // and an empty list's comment stays
  const { addEslintIgnores } = await import(pathToFileURL(join(SCRIPTS, 'lib.mjs')).href)
  const add = (t) => addEslintIgnores(t, ['src/audio'])
  const onlyInComment = "// globalIgnores(['dist'])\nconst ig = ['dist']\nexport default [globalIgnores(ig)]\n"
  const r1 = add(onlyInComment)
  expect('F112 review: a commented-out globalIgnores([...]) is never edited (the real one is a variable → refused)', r1.text === onlyInComment && /no globalIgnores/.test(r1.refuse ?? ''), JSON.stringify(r1))
  const r2 = add("// old: globalIgnores(['x']),\n/* see globalIgnores([...]) */\nconst s = 'globalIgnores(['\nexport default [globalIgnores(['dist'])]\n")
  expect('F112 review: a mention in a comment / block comment / string is not a second list — the real one gets the folder', r2.refuse === null && r2.text.endsWith("[globalIgnores(['dist', 'src/audio'])]\n") && r2.text.startsWith("// old: globalIgnores(['x']),\n"), JSON.stringify(r2))
  const r3 = add("export default [globalIgnores([\n  // nothing yet\n])]\n")
  expect("F112 review: an empty list keeps the comment inside it", r3.text === "export default [globalIgnores(['src/audio'\n  // nothing yet\n])]\n", JSON.stringify(r3))
  const r4 = add("export default [\r\n  globalIgnores([\r\n    'dist', // the build [old] it's\r\n  ]),\r\n]\r\n")
  expect('F112 review: CRLF list with brackets + a quote in a comment → new CRLF line, comment kept', r4.text === "export default [\r\n  globalIgnores([\r\n    'dist', // the build [old] it's\r\n    'src/audio',\r\n  ]),\r\n]\r\n", JSON.stringify(r4))
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
  // F84: finished patch notes for the update (0.9.3) and the milestone/stage (0.10.0) versions — notes: false = none
  if (opts.notes !== false) for (const v of ['0.9.3', '0.10.0']) write(join(repo, '.planning', 'archive', 'releases', `v${v}.md`), GOOD_NOTES(v))
  sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'plan')
  return repo
}
const GOOD_NOTES = (v) => `# v${v}\n\n## Highlights\nCards now fan out in your hand.\n\n## New\n- Cards fan out when you hold more than five.\n\n## Changed\n\n## Fixed\n- Fixed the crash when a save is loaded.\n`
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
  write(join(st, '.planning', 'research', 'playtests', `${TODAY}.md`), '# Playtest\n') // F87: a stage needs a playtest log
  fillChecklist(st, 'alpha') // F83: …and its release checklist
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

// A finished sprint's 3-line retro (F81 — archive-sprint refuses without it)
const RETRO = 'Retro:\n- went well: the fan looked right first try\n- went wrong: tuning took two extra days\n- change: try the feel on the phone sooner\n'

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
  write(join(repo, '.planning', 'ROADMAP.md'), roadmap('✅'))
  write(join(repo, '.planning', 'SPRINT.md'), `${readFileSync(join(repo, '.planning', 'SPRINT.md'), 'utf8')}${RETRO}`); sh(repo, 'commit', '-qam', 'F02 done')
  expect('musts-check → all done (exit 0)', musts().code === 0)
  const done = archive()
  expect('archive-sprint when done → sprint-04.md + "Sprint 04 done" commit', done.code === 0 && existsSync(join(repo, '.planning', 'archive', 'sprints', 'sprint-04.md')) && !existsSync(join(repo, '.planning', 'SPRINT.md')) && sh(repo, 'log', '-1', '--format=%s') === 'Sprint 04 done', done.out)
  expect('…nothing else committed with it', !sh(repo, 'status', '--porcelain'))
  expect('no SPRINT.md → refused', archive().code === 1)
  // review: a SPRINT.md that was never committed
  write(join(repo, '.planning', 'SPRINT.md'), `# Sprint 05 — more\n## F02 🎮 Cards\n- [x] 🤖 1. a\n${RETRO}`)
  const fresh = archive()
  expect('never-committed SPRINT.md → archived and committed, nothing half-done (review)', fresh.code === 0 && existsSync(join(repo, '.planning', 'archive', 'sprints', 'sprint-05.md')) && !sh(repo, 'status', '--porcelain'), fresh.out + sh(repo, 'status', '--porcelain'))
  expect('musts-check "alpha(" (odd stage name) → refused, no crash', /no feature says/.test(musts('alpha(').out))
  rmSync(root, { recursive: true, force: true })
}

async function testArchiveRetro() {
  console.log('archive-sprint — the 3-line retro first (F81)')
  // review: a retro written the Obsidian way is still a retro (plan-reader is what archive-sprint reads it with)
  const { readSprint } = await import('../templates/ppp/plan-reader.mjs')
  const full = (r) => ['went well', 'went wrong', 'change'].every(k => readSprint(`# Sprint 06 — x\n## F02 🎮 a\n${r}`).retro[k])
  for (const [name, r] of [
    ['"## Retro" heading', '## Retro\n- went well: a\n- went wrong: b\n- change: c\n'],
    ['"**Retro:**" + bold labels', '**Retro:**\n- **went well:** a\n- **went wrong:** b\n- **change:** c\n'],
    ['a blank line before the bullets, "*" bullets', 'Retro:\n\n* went well: a\n* went wrong: b\n* change: c\n'],
    ['"—" instead of ":"', 'Retro:\n- Went well — a\n- Went wrong — b\n- Change — c\n'],
    ['CRLF', 'Retro:\r\n- went well: a\r\n- went wrong: b\r\n- change: c\r\n'],
  ]) expect(`review: retro read from ${name}`, full(r), JSON.stringify(readSprint(`# S\n${r}`).retro))
  expect('review: "Started: 2026-10-01" / "**Started:** …" read too (one reading for every tool)', readSprint('# S\n**Started:** 2026-10-01 · x\n').started === '2026-10-01' && readSprint('# S\nStarted: 2026-10-02\n').started === '2026-10-02')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-retro-'))
  const repo = makeRepo(root)
  write(join(repo, '.planning', 'ROADMAP.md'), '# T — Roadmap\n## v0.1 — First ← current\n- ✅ F02 🎮 Cards — must:alpha\n')
  const sprint = (retro) => write(join(repo, '.planning', 'SPRINT.md'), `# Sprint 06 — cards\nStarted 2026-10-01\n## F02 🎮 Cards\n- [x] 🤖 1. a\nNotes:\n- fan done\n${retro}`)
  sprint(''); sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'plan')
  const archive = () => script('archive-sprint.mjs', [], { cwd: repo })
  const none = archive()
  expect('all features done but no Retro: → refused, says to ask Muzzy the three questions, nothing moved', none.code === 1 && /retro/i.test(none.out) && /ask Muzzy/.test(none.out) && /went well/.test(none.out) && existsSync(join(repo, '.planning', 'SPRINT.md')), none.out)
  sprint('Retro:\n- went well: the fan\n- went wrong:\n- change: phone sooner\n')
  const half = archive()
  expect('a Retro: with an empty "went wrong" → refused, names what\'s missing', half.code === 1 && /missing: went wrong/.test(half.out) && existsSync(join(repo, '.planning', 'SPRINT.md')), half.out)
  sprint(RETRO)
  const done = archive()
  expect('all three lines filled → archived, the retro kept in sprint-06.md', done.code === 0 && /went wrong: tuning/.test(readFileSync(join(repo, '.planning', 'archive', 'sprints', 'sprint-06.md'), 'utf8')), done.out)
  rmSync(root, { recursive: true, force: true })
}

async function testStopServers() {
  console.log('stop-servers — the whole tree, so nothing restarts')
  // run from a helper's workspace (.claude/worktrees/…) — "claude" in the path once made it look like Claude Code itself
  const root = join(mkdtempSync(join(tmpdir(), 'bmuz-servers-')), '.claude', 'worktrees', 'helper')
  mkdirSync(root, { recursive: true })
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
  expect('--dry-run names the supervisor (the top of the tree), stops nothing', /would stop/.test(dry.out) && dry.out.includes(`stop ${sup.pid}:`) && await listening(), dry.out)
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

async function testPortPreflight() {
  console.log('port pre-flight — a busy port fails check:full at once, naming who holds it (F118)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-ports-'))
  const game = join(root, 'game')
  const base = 6000 + Math.floor(Math.random() * 900)
  const [inArgs, constant, declared] = [base, base + 1, base + 2]
  // the game's copy: the template with its own FAST + E2E lists, ports.mjs beside it (as a game update copies them)
  const template = readFileSync(join(SCRIPTS, '..', 'templates', 'check-all.mjs'), 'utf8')
  write(join(game, 'scripts', 'check-all.mjs'), template
    .replace(/const FAST = \[[\s\S]*?\n\]\n/, "const FAST = [['quick', 'node e2e/ok.mjs']]\n")
    .replace(/const E2E = \[[\s\S]*?\n\]\n/, `const E2E = [['shots', 'e2e/shots.mjs', 'e2e-shots ${inArgs} 4']]\n`))
  write(join(game, 'scripts', 'ports.mjs'), readFileSync(join(SCRIPTS, '..', 'templates', 'ports.mjs'), 'utf8'))
  write(join(game, 'e2e', 'ok.mjs'), '')
  write(join(game, 'e2e', 'shots.mjs'), `// Shots at 3 sizes.\n// ports: ${declared}\nconst PORT = ${constant}, OUT = 'e2e-shots'\nconst ARGS_PORT = Number(process.argv[3] ?? 6999)\nexport const DEFAULT_PORT = ${base + 3}\n`)
  // a stand-in for a forgotten dev server (another folder), listening on the ports it's given — IPv6 localhost, like Vite
  const other = join(root, 'other-project')
  write(join(other, 'hold.mjs'), "import http from 'node:http'; for (const p of process.argv.slice(2)) http.createServer((q, s) => s.end('ok')).listen(Number(p), '::1')")
  const { spawn } = await import('node:child_process')
  const hold = async (ports) => {
    const child = spawn(process.execPath, [join(other, 'hold.mjs'), ...ports.map(String)], { cwd: other, stdio: 'ignore' })
    const up = async (p) => { try { await fetch(`http://[::1]:${p}`); return true } catch { return false } }
    for (let i = 0; i < 40 && !(await Promise.all(ports.map(up))).every(Boolean); i++) await new Promise(r => setTimeout(r, 150))
    return child
  }
  const full = () => {
    const started = Date.now()
    const r = spawnSync('node', ['scripts/check-all.mjs', 'full'], { cwd: game, encoding: 'utf8', timeout: 120_000 })
    return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}`, seconds: (Date.now() - started) / 1000 }
  }

  let server = await hold([inArgs, declared])
  const busy = full()
  expect('a port from the E2E args and a "// ports:" one held → refused before any check starts', busy.code === 1 && /NOT STARTED — 2 ports/.test(busy.out) && !/Fast checks/.test(busy.out), busy.out)
  expect('…each named with the script that uses it, the holder\'s command, its folder and the line that frees it',
    new RegExp(`Port ${inArgs} \\(shots\\) is held by \`.*hold\\.mjs ${inArgs} ${declared}\` in ${other.replace(/\\/g, '\\\\')} — free it: node ~/.claude/config/bmuz/scripts/stop-servers\\.mjs ${inArgs}`).test(busy.out)
      && busy.out.includes(`Port ${declared} (shots)`), busy.out)
  expect(`…in seconds (${busy.seconds.toFixed(1)} s)`, busy.seconds < 10, busy.seconds)
  expect('…and the lock is freed', !existsSync(join(game, 'e2e-shots', '.check-lock')))
  server.kill()
  server = await hold([constant, base + 3])
  const constantBusy = full()
  expect('a script\'s `const PORT = …` held → named (a port read from the args isn\'t guessed: 6999 never counts)', constantBusy.code === 1 && constantBusy.out.includes(`Port ${constant} (shots)`) && !/6999/.test(constantBusy.out), constantBusy.out)
  expect('…a DEFAULT_PORT (the fallback the args replace, e.g. check-framework\'s 5197) never counts', /NOT STARTED — 1 port /.test(constantBusy.out) && !constantBusy.out.includes(`Port ${base + 3}`), constantBusy.out)
  // the lookup can't name the holder (process list broken or stuck) → still refused, by port and process number
  if (process.platform === 'win32') {
    const bin = join(root, 'bin')
    mkdirSync(bin, { recursive: true })
    copyFileSync(process.execPath, join(bin, 'powershell.exe')) // found first: "node -NoProfile …" fails at once, like a broken WMI
    const path = `${bin};${join(process.env.SystemRoot || 'C:\\Windows', 'System32')}` // netstat still the real one
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.toUpperCase() !== 'PATH'))
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', `import { heldPorts } from ${JSON.stringify(pathToFileURL(join(SCRIPTS, '..', 'templates', 'ports.mjs')).href)}; console.log(JSON.stringify(heldPorts([${constant}])))`], { encoding: 'utf8', env: { ...env, PATH: path } })
    let got = []; try { got = JSON.parse(r.stdout) } catch { /* shown below */ }
    expect('…and when the process list can\'t be read, the port is still named as held (`process <id>`, no crash)', got.length === 1 && got[0].port === constant && /^process \d+$/.test(got[0].cmd), r.stdout + r.stderr)
  }
  server.kill()
  // a check-all copied without its ports.mjs: check:fast still works, check:full stops at once saying what to copy
  const lookup = join(game, 'scripts', 'ports.mjs')
  const kept = readFileSync(lookup, 'utf8')
  rmSync(lookup)
  const noLookupFast = spawnSync('node', ['scripts/check-all.mjs', 'fast'], { cwd: game, encoding: 'utf8' })
  const noLookupFull = full()
  expect('no scripts/ports.mjs → check:fast still passes, check:full refuses naming the file to copy (lock freed)', noLookupFast.status === 0 && noLookupFull.code === 1 && /scripts\/ports\.mjs is missing/.test(noLookupFull.out) && !existsSync(join(game, 'e2e-shots', '.check-lock')), noLookupFast.stdout + noLookupFast.stderr + noLookupFull.out)
  write(lookup, kept)
  await new Promise(r => setTimeout(r, 300))
  const free = full()
  expect('every port free → the run goes on as before (fast, then the e2e script) and passes', free.code === 0 && /Fast checks/.test(free.out) && /PASS\s+shots/.test(free.out) && !/held by/.test(free.out), free.out)
  const area = spawnSync('node', ['scripts/check-all.mjs', 'fast'], { cwd: game, encoding: 'utf8' })
  expect('check:fast never looks at ports', area.status === 0 && !/Port /.test(area.stdout), area.stdout)

  // the lookup itself, shared with stop-servers.mjs
  const { shortCommand, heldPorts } = await import(pathToFileURL(join(SCRIPTS, '..', 'templates', 'ports.mjs')).href)
  expect('a tool in node_modules is shown by its name: `vite --port 5291 --strictPort`', shortCommand('"C:\\Program Files\\nodejs\\node.exe" C:\\dev\\ui-kit\\node_modules\\vite\\bin\\vite.js --port 5291 --strictPort') === 'vite --port 5291 --strictPort')
  expect('…npm too: `npm run dev`', shortCommand('"C:\\Program Files\\nodejs\\node.exe" "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js" run dev') === 'npm run dev')
  expect('free ports → [] (no process list asked for)', heldPorts([inArgs, constant, declared]).length === 0)
  rmSync(root, { recursive: true, force: true })
}

async function testNoShell() {
  console.log('run() — npm / npx get their arguments as a list, never through a shell (F120)')
  const { run, withoutShell } = await import(pathToFileURL(join(SCRIPTS, 'lib.mjs')).href)
  const game = mkdtempSync(join(tmpdir(), 'bmuz-noshell-'))
  const ODD = ['$(echo pwned).test.ts', 'a;echo pwned.test.ts', 'b&echo.>marker.txt', 'c|echo.>marker2.txt', 'd %PATH% "q".test.ts']
  write(join(game, 'package.json'), '{ "name": "g", "version": "1.0.0" }')
  write(join(game, 'tool', 'package.json'), '{ "name": "show-args", "version": "1.0.0", "bin": { "show-args": "show.mjs" } }')
  write(join(game, 'tool', 'show.mjs'), '#!/usr/bin/env node\nconsole.log(JSON.stringify(process.argv.slice(2)))\n')
  const install = run('npm', ['install', '--offline', '--no-audit', '--no-fund', './tool'], { cwd: game })
  expect('npm runs (a .cmd on Windows) — a local folder installs', install.code === 0, install.out)
  const shown = run('npx', ['--offline', 'show-args', ...ODD], { cwd: game })
  let got = null; try { got = JSON.parse(shown.stdout.trim().split('\n').pop()) } catch { /* shown below */ }
  expect('npx hands odd file names to the tool unchanged ($( ), ;, &, |, %PATH%, quotes)', JSON.stringify(got) === JSON.stringify(ODD), shown.out)
  expect('…and nothing a shell would have run wrote a file', !existsSync(join(game, 'marker.txt')) && !existsSync(join(game, 'marker2.txt')))
  // Node prints that warning in the process that asks for the shell — so ask from a child and read ITS output
  write(join(game, 'ask.mjs'), `import { run } from ${JSON.stringify(pathToFileURL(join(SCRIPTS, 'lib.mjs')).href)}\nconsole.log(run('npm', ['--version']).code)\n`)
  const asked = spawnSync(process.execPath, [join(game, 'ask.mjs')], { encoding: 'utf8' })
  expect('no DEP0190 warning (Node warns when a shell gets an argument list)', asked.stdout.trim() === '0' && !/DEP0190/.test(asked.stderr), asked.stdout + asked.stderr)
  if (process.platform === 'win32') expect('on Windows: this Node + npm\'s own npx-cli.js', withoutShell('npx', ['x'])[0] === process.execPath && /npx-cli\.js$/.test(withoutShell('npx', ['x'])[1][0]))
  rmSync(game, { recursive: true, force: true })
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
  // a branch that ADDS the workflow: main doesn't have it yet, the branch does → GitHub's verdict counts (framework 2026-10-19)
  sh(repo, 'checkout', '-q', 'main'); sh(repo, 'checkout', '-q', '-b', 'dev/adds')
  write(join(repo, '.github', 'workflows', 'checks.yml'), 'name: Checks\non: push\n'); sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'adds checks')
  const adds = merge(gh.env(ghRuns('completed', 'failure')), 'dev/adds')
  expect('…a branch that adds the Checks workflow, red on GitHub → refused (looks at the branch, not main)', adds.code === 1 && !/no GitHub Checks workflow/.test(adds.out), adds.out)
  sh(repo, 'checkout', '-q', 'main')
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
    "  if (path === '/rooms-up/health') { s.writeHead(200); return s.end('{\"ok\":true}') }",
    "  if (path === '/rooms-broken/health') { s.writeHead(500); return s.end('oops') }",
    "  if (path === '/rooms-gone/health') { s.writeHead(404, { 'content-type': 'application/json' }); return s.end('{\"title\":\"Error 1042: Cloudflare Error\"}') }",
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
  // F82: the room server's /health
  const rooms = (line) => { state(`**Release:** GitHub Pages\n${line}`); return live() }
  const up = rooms(`Rooms: ${base}/rooms-up`)
  expect('F82: Rooms: <url> answering /health → "the room server is up"', up.code === 0 && /room server is up \(.*\/rooms-up\/health\)/.test(up.out), up.out)
  const broken = rooms(`Rooms: ${base}/rooms-broken/`)
  expect('F82: room server answers HTTP 500 → refused: DOWN, with the redeploy step', broken.code === 1 && /room server is DOWN.*HTTP 500/.test(broken.out) && /party:deploy/.test(broken.out), broken.out)
  const oldWorker = rooms(`Rooms: ${base}/rooms-old`)
  expect('F82: 404 at /health (a worker from before 0.8.0) → a warning only, the live pass still recorded', oldWorker.code === 0 && /not at \/health yet/.test(oldWorker.out) && /live pass recorded/.test(oldWorker.out), oldWorker.out)
  const deleted = rooms(`Rooms: ${base}/rooms-gone`)
  expect('F82: Cloudflare "no such worker" 404 (error 1042) → refused: DOWN, not mistaken for an old worker', deleted.code === 1 && /room server is DOWN.*Cloudflare error 1042/.test(deleted.out), deleted.out)
  const gone = rooms('Rooms: http://127.0.0.1:1/')
  expect('F82: nothing listening → refused: DOWN', gone.code === 1 && /room server is DOWN/.test(gone.out), gone.out)
  state('**Release:** GitHub Pages')
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
  write(join(repo, '.planning', 'SPRINT.md'), '# Sprint 01 — cards\n## F08 🎮 Cards\nCheck: a test\nChecked: test green\n') // F87: "done" needs Checked:
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

// F87: a stage release (alpha/beta/1.0) goes out after someone played it — a playtest log since the last stage
// F83: a stage's release checklist written by release-check.mjs, then every <…> line filled and ticked (or only some)
function fillChecklist(repo, stage, { leave = [] } = {}) {
  script('release-check.mjs', [stage], { cwd: repo })
  const file = join(repo, '.planning', 'archive', 'release-checks', `${stage}.md`)
  const text = readFileSync(file, 'utf8').replace(/^- \[ \] ((?:\[[^\]]+\] )?)([^:]+): <[^>]*>$/gm, (line, tag, label) => leave.includes(label) ? line : `- [x] ${tag}${label}: done (test)`)
  write(file, text)
  return file
}

// F83: a stage release needs its release checklist (devices, first-time player, store, privacy…) and, from beta, no
// stand-in art
async function testReleaseStageChecks() {
  console.log('release — stage-release checklist + no stand-in art from beta (F83)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-stagecheck-'))
  // commits art (= code) and moves STATE's reviewed / security / full-check marks onto it, as a real review would
  const commitArt = (repo) => {
    sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'F01: art')
    const sha = sh(repo, 'rev-parse', '--short', 'HEAD')
    const statePath = join(repo, '.planning', 'STATE.md')
    write(statePath, readFileSync(statePath, 'utf8').replace(/^(Reviewed through: |\*\*Security reviewed:\*\* |Last full check: )[0-9a-f]+/gm, `$1${sha}`))
    sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'plan')
  }
  const release = (repo, ...a) => script('release.mjs', a, { cwd: repo, env: { BMUZ_CLEANUP: FAKE_CLEANUP } })
  const ready = (name, stage = 'alpha') => {
    const repo = releaseProject(root, name, { state: { resume: `Released v0.10.0 — ${stage}` },
      roadmap: `# T — Roadmap\nRelease target: 1.0 — musts not set (/define)\n## v0.1 — First  ✅ released ${TODAY}\n- ✅ F01 🧱 Cards — must:${stage}\n` })
    write(join(repo, '.planning', 'research', 'playtests', `${TODAY}.md`), '# Playtest\n')
    return repo
  }
  const game = ready('game')
  const none = release(game, 'stage', 'Alpha', '--stage=alpha', '--dry-run')
  expect('alpha, no checklist → refused, names the file and how to write it', none.code === 1 && /no release checklist for alpha \(\.planning\/archive\/release-checks\/alpha\.md\)/.test(none.out) && /release-check\.mjs alpha/.test(none.out), none.out)
  const update = release(game, 'update', 'x', '--dry-run')
  expect('…a plain update release is never asked for one', !/release checklist/.test(update.out), update.out)
  const made = script('release-check.mjs', ['alpha'], { cwd: game })
  const file = join(game, '.planning', 'archive', 'release-checks', 'alpha.md')
  const alpha = existsSync(file) ? readFileSync(file, 'utf8') : ''
  expect('release-check.mjs alpha → writes the alpha list (Devices, First-time player, Store page, Privacy…), no beta / 1.0 lines', made.code === 0 && /^# Release check — alpha/.test(alpha) && /Devices:/.test(alpha) && /First-time player:/.test(alpha) && /Store page:/.test(alpha) && /Privacy and age rating:/.test(alpha) && !/^- \[.\] \[(beta\+|1\.0)\]/m.test(alpha), made.out + alpha)
  write(file, alpha.replace('- [ ] Devices: <', '- [x] Devices: <'))
  const blank = release(game, 'stage', 'Alpha', '--stage=alpha', '--dry-run')
  expect('untouched list → refused, each line named once (ticked but unfilled = "isn\'t filled in")', blank.code === 1 && /"Devices" isn't filled in/.test(blank.out) && /"First-time player" isn't filled in/.test(blank.out) && (blank.out.match(/release checklist: "/g) || []).length === 8, blank.out)
  write(file, alpha)
  const again = script('release-check.mjs', ['alpha'], { cwd: game })
  expect('…run again → the edited list is kept, not overwritten', /already there/.test(again.out), again.out)
  fillChecklist(game, 'alpha', { leave: ['Store page'] })
  write(file, readFileSync(file, 'utf8').replace('- [x] Devices: done (test)', '- [ ] Devices: iPhone 13, PC Chrome'))
  const half = release(game, 'stage', 'Alpha', '--stage=alpha', '--dry-run')
  expect('half done → refused naming only what\'s open: Devices filled but unticked, Store page unfilled', half.code === 1 && /"Devices" isn't ticked/.test(half.out) && /"Store page" isn't filled in/.test(half.out) && !/"First-time player"/.test(half.out), half.out)
  write(file, readFileSync(file, 'utf8').replace(/^- \[ \] Store page:.*$/m, ''))
  expect('a line deleted → refused: "the Store page line is missing"', /the "Store page" line is missing/.test(release(game, 'stage', 'Alpha', '--stage=alpha', '--dry-run').out))
  rmSync(file)
  fillChecklist(game, 'alpha')
  const full = release(game, 'stage', 'Alpha', '--stage=alpha', '--dry-run')
  expect('every line filled + ticked → passes ("release checklist for alpha done")', full.code === 0 && /release checklist for alpha done/.test(full.out), full.out)
  write(join(game, 'content', 'credits.json'), JSON.stringify([{ paths: ['public/art/hero.png'], source: 'Muzzy — stand-in until redrawn', licence: 'own work', light: '🟢' }]))
  commitArt(game)
  expect('alpha with stand-in art → still passes (stand-ins are fine before beta)', release(game, 'stage', 'Alpha', '--stage=alpha', '--dry-run').code === 0)

  // beta: the beta+ lines, and no stand-in art
  const beta = ready('beta', 'beta')
  fillChecklist(beta, 'beta')
  const betaList = readFileSync(join(beta, '.planning', 'archive', 'release-checks', 'beta.md'), 'utf8')
  expect('the beta list has the beta+ lines (No stand-in art, Bugs) but not the 1.0 ones', /\[beta\+\] No stand-in art:/.test(betaList) && /\[beta\+\] Bugs:/.test(betaList) && !/^- \[.\] \[1\.0\]/m.test(betaList), betaList)
  expect('beta, list done, no stand-ins → passes', release(beta, 'stage', 'Beta', '--stage=beta', '--dry-run').code === 0)
  write(join(beta, 'content', 'credits.json'), JSON.stringify([
    { paths: ['public/art/hero.png'], source: 'Muzzy — stand-in until redrawn', licence: 'own work', light: '🟢' },
    { paths: ['public/sfx/tap.mp3'], source: 'ZzFX', licence: 'own work', light: '🟢', standIn: true },
    { paths: ['public/fonts/nunito.woff2'], source: 'Google Fonts', licence: 'SIL OFL 1.1', light: '🟡', credit: 'Nunito' },
  ]))
  write(join(beta, 'public', 'art', 'placeholder-card.png'), 'png')
  write(join(beta, '.planning', 'SPRINT.md'), '# Sprint 09 — x\n## F12 🎮 Cards\n- [ ] 🙋 3. Card backs (stand-in)\n- [x] 🙋 4. Card fronts (stand-in)\n')
  commitArt(beta)
  const art = release(beta, 'stage', 'Beta', '--stage=beta', '--dry-run')
  expect('beta with stand-ins → refused, naming each: credits "stand-in" text, standIn: true, a placeholder file, an open (stand-in) task', art.code === 1 && /stand-in art left in a beta \(4\)/.test(art.out) && /public\/art\/hero\.png/.test(art.out) && /public\/sfx\/tap\.mp3 — "standIn: true"/.test(art.out) && /file: public\/art\/placeholder-card\.png/.test(art.out) && /SPRINT\.md: 🙋 3\. Card backs \(stand-in\)/.test(art.out) && !/nunito/.test(art.out) && !/Card fronts/.test(art.out), art.out)
  const skipped = release(beta, 'stage', 'Beta', '--stage=beta', '--no-release-check-ok')
  const body = sh(beta, 'log', '-1', '--format=%B')
  expect('--no-release-check-ok (Muzzy\'s call) → released, on record in the commit body', skipped.code === 0 && /Released with: --no-release-check-ok \(beta: 1 release-check item open\)/.test(body), `${skipped.out}\n${body}`)

  // 1.0 (a major release): the name check + press kit
  const gold = ready('gold', '1.0')
  fillChecklist(gold, '1.0', { leave: ['Press kit'] })
  const goldList = readFileSync(join(gold, '.planning', 'archive', 'release-checks', '1.0.md'), 'utf8')
  const one = release(gold, 'major', '1.0', '--dry-run')
  expect('1.0 → its list has Name check + Press kit; an unfilled Press kit is refused', /\[1\.0\] Name check:/.test(goldList) && one.code === 1 && /"Press kit" isn't filled in/.test(one.out) && !/"Name check"/.test(one.out), one.out)

  // review F83: stage names, real answers with <…>, camelCase stand-in files, odd credits.json
  const { stageRank, readChecklist, standIns } = await import(pathToFileURL(join(import.meta.dirname, 'release-check.mjs')).href)
  const ranks = ['alpha', 'Beta', 'beta2', 'open-beta', 'rc1', '1.0.0', 'gold', 'demo'].map(s => `${s}=${stageRank(s)}`).join(' ')
  expect('stage names: beta2 / open-beta → beta rules, rc1 / 1.0.0 / gold → 1.0 rules, demo → alpha', ranks === 'alpha=1 Beta=2 beta2=2 open-beta=2 rc1=3 1.0.0=3 gold=3 demo=1', ranks)
  const answers = readChecklist('- [x] Store page: <https://muzzy.itch.io/glyphtender>\n- [x] First-time player: Sam, under <10 min, works >90%\n- [X]  Devices :  iPhone 13 <3\n- [x] Press kit: <link to the press kit: short and long description>\r\n')
  expect('real answers with a <link>, "<10 min … >90%", "<3" count as filled; the template\'s own <prompt> doesn\'t', answers.map(a => `${a.label}:${a.filled && a.ticked}`).join(' ') === 'Store page:true First-time player:true Devices:true Press kit:false', JSON.stringify(answers))
  const odd = join(root, 'odd')
  write(join(odd, 'content', 'credits.json'), JSON.stringify([null, 'x', { paths: 'public/a.png', source: 'placeholder by Muzzy' }, { source: 'Google Fonts', licence: 7 }]))
  write(join(odd, 'public', 'PlaceholderIcon.png'), 'png')
  write(join(odd, 'public', 'standInHero.webp'), 'png')
  write(join(odd, 'public', 'Planet.png'), 'png')
  let found = []
  try { found = standIns(odd) } catch (e) { found = [`crashed: ${e.message}`] }
  expect('odd credits.json (null, a string, "paths" as one string, a number) → no crash, the stand-in still found; PlaceholderIcon.png + standInHero.webp found, Planet.png not', found.length === 3 && found.some(f => /credits\.json: public\/a\.png — "placeholder"/.test(f)) && found.some(f => /PlaceholderIcon/.test(f)) && found.some(f => /standInHero/.test(f)), found.join('\n'))
  write(join(odd, 'content', 'credits.json'), JSON.stringify({ entries: [{ paths: ['public/b.png'], standIn: true }] }))
  expect('credits.json wrapped as { entries: [...] } → still read', standIns(odd).some(f => /public\/b\.png — "standIn: true"/.test(f)), standIns(odd).join('\n'))
  rmSync(root, { recursive: true, force: true })
}

function testReleasePlaytest() {
  console.log('release — a stage release needs a playtest log (F87)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-playtest-'))
  const release = (repo, ...a) => script('release.mjs', a, { cwd: repo, env: { BMUZ_CLEANUP: FAKE_CLEANUP } })
  const ready = (name) => { const repo = releaseProject(root, name, { state: { resume: 'Released v0.10.0 — alpha' },
    roadmap: `# T — Roadmap\nRelease target: beta — musts not set (/define)\n## v0.1 — First  ✅ released ${TODAY}\n- ✅ F01 🧱 Cards — must:alpha\n` }); fillChecklist(repo, 'alpha'); return repo }
  const logs = (repo, ...dates) => { for (const date of dates) write(join(repo, '.planning', 'research', 'playtests', `${date}.md`), `# Playtest ${date}\n`) }
  const none = ready('none')
  const noLog = release(none, 'stage', 'Alpha', '--stage=alpha', '--dry-run')
  expect('stage release, no playtest log → refused, says /play watch mode and --no-playtest-ok', noLog.code === 1 && /no playtest log since/.test(noLog.out) && /--no-playtest-ok/.test(noLog.out), noLog.out)
  const update = release(none, 'update', 'x', '--dry-run') // (refused for its RESUME HERE naming v0.10.0 — not for a playtest)
  expect('…a plain update release isn\'t asked for one', !/playtest/.test(update.out), update.out)
  logs(none, TODAY)
  const withLog = release(none, 'stage', 'Alpha', '--stage=alpha', '--dry-run')
  expect(`…a log dated ${TODAY} → passes, names it`, withLog.code === 0 && withLog.out.includes(`${TODAY}.md`), withLog.out)
  // the window starts at the last stage release (its commit says "Stage: …"), not at the first commit
  const old = ready('old')
  execFileSync('git', ['-C', old, 'commit', '-q', '--allow-empty', '-m', 'Release v0.9.0: Proto\n\nStage: prototype'], { env: { ...process.env, GIT_COMMITTER_DATE: '2026-10-10T12:00:00', GIT_AUTHOR_DATE: '2026-10-10T12:00:00' } })
  logs(old, '2026-10-05')
  const stale = release(old, 'stage', 'Alpha', '--stage=alpha', '--dry-run')
  expect('a log older than the last stage release (prototype, 2026-10-10) → refused, names the newest log', stale.code === 1 && /since the last stage release \(2026-10-10\)/.test(stale.out) && /2026-10-05\.md/.test(stale.out), stale.out)
  const skipped = release(old, 'stage', 'Alpha', '--stage=alpha', '--no-playtest-ok')
  const body = sh(old, 'log', '-1', '--format=%B')
  expect('--no-playtest-ok (Muzzy\'s call) → released, on record in the commit body', skipped.code === 0 && /Released with: --no-playtest-ok \(alpha: no playtest log since 2026-10-10\)/.test(body), `${skipped.out}\n${body}`)
  expect('…and the commit says "Stage: alpha", so the next stage counts from here', /^Stage: alpha$/m.test(body), body)
  rmSync(root, { recursive: true, force: true })
}

// F84: one notes file per release — drafted from the commits, refused until it's finished, then CHANGELOG + itch text
function testReleaseNotes() {
  console.log('release — patch notes (F84): draft, gates, CHANGELOG.md, itch text')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-notes-'))
  const release = (repo, ...a) => script('release.mjs', a, { cwd: repo, env: { BMUZ_CLEANUP: FAKE_CLEANUP } })
  const notes = (repo, v = '0.9.3') => join(repo, '.planning', 'archive', 'releases', `v${v}.md`)

  // missing → refused, says --draft-notes
  const lib = releaseProject(root, 'lib', { notes: false })
  const none = release(lib, 'update', 'x', '--dry-run')
  expect('no notes file for v0.9.3 → refused, names the file and --draft-notes', none.code === 1 && /no patch notes for this release \(\.planning\/archive\/releases\/v0\.9\.3\.md\)/.test(none.out) && /release\.mjs update --draft-notes/.test(none.out), none.out)
  // --draft-notes: library notes from the commits, never overwritten
  const drafted = release(lib, 'update', '--draft-notes')
  const draft = existsSync(notes(lib)) ? readFileSync(notes(lib), 'utf8') : ''
  expect('--draft-notes → v0.9.3.md drafted: DRAFT first line, the commits grouped by feature ("F01: cards"), library sections', drafted.code === 0 && /^DRAFT — edit, then delete this line/.test(draft) && /## New\n- F01: cards/.test(draft) && /## Breaking/.test(draft) && !/## Balance/.test(draft), drafted.out + draft)
  write(notes(lib), draft + '\nMuzzy was here\n')
  const again = release(lib, 'update', '--draft-notes')
  expect('…run again → refused, the edited file is not overwritten', again.code === 1 && /already exists — not overwritten/.test(again.out) && readFileSync(notes(lib), 'utf8').includes('Muzzy was here'), again.out)
  const stillDraft = release(lib, 'update', 'x', '--dry-run')
  expect('a DRAFT with empty Highlights → refused for both, in the one list', stillDraft.code === 1 && /still a draft/.test(stillDraft.out) && /no Highlights/.test(stillDraft.out), stillDraft.out)
  expect('…a library\'s notes may name features (no dev-talk check for the framework)', !/dev talk/.test(stillDraft.out), stillDraft.out)

  // a game: dev talk refused, naming the lines
  const game = releaseProject(root, 'game', { notes: false, state: { release: 'Release: GitHub Pages (recipe github-pages.md)' } })
  release(game, 'update', '--draft-notes')
  const gameDraft = readFileSync(notes(game), 'utf8')
  expect('a game\'s draft has the game sections (Highlights · New · Changed · Balance · Fixed · Known issues)', ['Highlights', 'New', 'Changed', 'Balance', 'Fixed', 'Known issues'].every(s => gameDraft.includes(`## ${s}`)), gameDraft)
  write(notes(game), '# v0.9.3\n## Highlights\nFixed B012 in src/x.ts\n## New\n- Better tuning in the Dev Kit\n- Faster check:fast, merged the branch\n- F07: card arc\n')
  const talk = release(game, 'update', 'x', '--dry-run')
  expect('"Fixed B012 in src/x.ts" in a game\'s notes → refused, naming each line and what\'s wrong', talk.code === 1 && /dev talk players won't follow/.test(talk.out) && /line 3: "Fixed B012 in src\/x\.ts" \(a feature or bug number, a file path, a file name\)/.test(talk.out) && /"Dev Kit"/.test(talk.out) && /a check name, git talk/.test(talk.out) && /"- F07: card arc" \(a feature or bug number\)/.test(talk.out), talk.out)
  // review fix: ordinary player sentences with a key name or the word "commit" aren't dev talk
  const keys = releaseProject(root, 'keys', { notes: false, state: { release: 'Release: GitHub Pages (recipe github-pages.md)' } })
  write(notes(keys), '# v0.9.3\n## Highlights\nPress F11 for fullscreen.\n## New\n- Commit your move with the new confirm button.\n- The F1–F12 keys pick a card.\n- F11 key toggles fullscreen.\n')
  const keysRun = release(keys, 'update', 'x', '--dry-run')
  expect('"Press F11 for fullscreen" / "Commit your move with the new confirm button" / "F1–F12 keys" → not dev talk, passes', keysRun.code === 0 && /patch notes ready/.test(keysRun.out), keysRun.out)
  // review fix: Muzzy keeps flagged lines (--no-notes-ok) → the notes are still used for CHANGELOG + itch text
  const kept = releaseProject(root, 'kept', { notes: false, state: { release: 'Release: GitHub Pages (recipe github-pages.md)' } })
  write(notes(kept), '# v0.9.3\n## Highlights\nThe B612 asteroid level is back.\n')
  const keptRun = release(kept, 'update', 'x', '--no-notes-ok')
  expect('only dev-talk lines + --no-notes-ok → released WITH CHANGELOG.md + itch text, on record as "dev-talk lines kept"', keptRun.code === 0 && existsSync(join(kept, 'CHANGELOG.md')) && /B612 asteroid/.test(readFileSync(join(kept, 'CHANGELOG.md'), 'utf8')) && existsSync(join(kept, '.planning', 'archive', 'releases', 'v0.9.3-itch.txt')) && /--no-notes-ok \(dev-talk lines kept\)/.test(sh(kept, 'log', '-1', '--format=%B')), keptRun.out)

  // good notes → released: CHANGELOG.md made (newest first, dated), itch text printed + saved, all in the release commit
  write(notes(game), GOOD_NOTES('0.9.3'))
  const up = release(game, 'update', 'Cards fan out')
  const changelog = existsSync(join(game, 'CHANGELOG.md')) ? readFileSync(join(game, 'CHANGELOG.md'), 'utf8') : ''
  const itchPath = join(game, '.planning', 'archive', 'releases', 'v0.9.3-itch.txt')
  expect('good notes → released; CHANGELOG.md made with a header and "## v0.9.3 — <date>", empty sections left out', up.code === 0 && /^# Changelog\n\n## v0\.9\.3 — \d{4}-\d{2}-\d{2}\n\nCards now fan out in your hand\.\n\n### New\n- Cards fan out/.test(changelog) && !/### Changed/.test(changelog), up.out + changelog)
  expect('…the itch text printed and saved beside the notes (plain text: NEW, • bullets)', /itch\.io devlog text/.test(up.out) && /^NEW$/m.test(up.out) && /• Cards fan out when you hold more than five\./.test(up.out) && existsSync(itchPath) && /^FIXED\n• Fixed the crash/m.test(readFileSync(itchPath, 'utf8')), up.out)
  const files = sh(game, 'show', '--name-only', '--format=', 'HEAD')
  expect('…CHANGELOG.md, the notes and the itch text are in the release commit, nothing left over', files.includes('CHANGELOG.md') && files.includes('v0.9.3-itch.txt') && !sh(game, 'status', '--porcelain'), files)
  // the next release goes on top
  write(join(game, '.planning', 'STATE.md'), readFileSync(join(game, '.planning', 'STATE.md'), 'utf8').replace('Released v0.9.3', 'Released v0.9.4'))
  write(notes(game, '0.9.4'), '# v0.9.4\n## Highlights\nThe deck shuffles faster.\n')
  sh(game, 'add', '-A'); sh(game, 'commit', '-q', '-m', 'notes')
  const up2 = release(game, 'update', 'Faster shuffle')
  const log2 = readFileSync(join(game, 'CHANGELOG.md'), 'utf8')
  expect('…the next release\'s entry goes above the old one (newest first)', up2.code === 0 && log2.indexOf('## v0.9.4') > 0 && log2.indexOf('## v0.9.4') < log2.indexOf('## v0.9.3') && log2.startsWith('# Changelog'), up2.out + log2)

  // --no-notes-ok: Muzzy's call, on record, no CHANGELOG entry
  const skip = releaseProject(root, 'skip', { notes: false })
  const skipped = release(skip, 'update', 'x', '--no-notes-ok')
  expect('--no-notes-ok → released without notes, on record ("Released with: --no-notes-ok (no notes file)"), no CHANGELOG.md', skipped.code === 0 && /Released with: --no-notes-ok \(no notes file\)/.test(sh(skip, 'log', '-1', '--format=%B')) && !existsSync(join(skip, 'CHANGELOG.md')), skipped.out)

  // the commit fails → the new files are taken away again (putBack)
  const fails = releaseProject(root, 'fails')
  write(join(fails, '.git', 'hooks', 'pre-commit'), '#!/bin/sh\necho "hook says no"\nexit 1\n')
  try { execFileSync('chmod', ['+x', join(fails, '.git', 'hooks', 'pre-commit')]) } catch { /* Windows: git runs it anyway */ }
  write(join(fails, '.planning', 'research', 'idea.md'), 'an idea\n') // the user's own plan edits, carried along…
  write(join(fails, '.planning', 'research', 'staged.md'), 'staged\n'); sh(fails, 'add', '.planning/research/staged.md') // …one already staged
  const failed = release(fails, 'update', 'x')
  expect('the release commit fails → CHANGELOG.md and the itch text are removed again, version.json put back', failed.code === 1 && !existsSync(join(fails, 'CHANGELOG.md')) && !existsSync(join(fails, '.planning', 'archive', 'releases', 'v0.9.3-itch.txt')) && JSON.parse(readFileSync(join(fails, 'version.json'), 'utf8')).version === '0.9.2', failed.out)
  const index = sh(fails, 'diff', '--cached', '--name-only')
  expect('…and the index is as it was: the user\'s plan edit unstaged again, the file they had staged still staged (review fix)', index === '.planning/research/staged.md', index)
  rmSync(root, { recursive: true, force: true })
}

// Fake installed packages: { name: { license, deps: { child: '1.0.0' }, licenseFile, dev } } → node_modules + a lockfile
function fakePackages(dir, packages, direct) {
  const lock = { name: 'g', version: '0.9.2', lockfileVersion: 3, requires: true, packages: { '': { name: 'g', version: '0.9.2', dependencies: {}, devDependencies: {} } } }
  for (const [name, p] of Object.entries(packages)) {
    write(join(dir, 'node_modules', name, 'package.json'), JSON.stringify({ name, version: '1.0.0', ...(p.license !== undefined ? { license: p.license } : {}), dependencies: p.deps || {} }))
    if (p.licenseFile) write(join(dir, 'node_modules', name, 'LICENSE'), p.licenseFile)
    lock.packages[`node_modules/${name}`] = { version: '1.0.0', ...(p.license !== undefined ? { license: p.license } : {}), ...(p.deps ? { dependencies: p.deps } : {}), ...(p.dev ? { dev: true } : {}) }
  }
  for (const name of direct) lock.packages[''][packages[name].dev ? 'devDependencies' : 'dependencies'][name] = '1.0.0'
  const pkg = JSON.parse(existsSync(join(dir, 'package.json')) ? readFileSync(join(dir, 'package.json'), 'utf8') : '{"name":"g","version":"0.9.2"}')
  pkg.dependencies = lock.packages[''].dependencies; pkg.devDependencies = lock.packages[''].devDependencies
  write(join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
  write(join(dir, 'package-lock.json'), JSON.stringify(lock, null, 2) + '\n')
}

// F85: deps-check — the packages players get: licences, security, the notices file; and release.mjs's gate
async function testDepsCheck() {
  console.log('deps-check (F85) — licences + security of what players get, notices, the release gate')
  const { licenceVerdict } = await import('./deps-check.mjs')
  const v = (l) => licenceVerdict(l).verdict
  expect('licences: MIT / "Apache 2.0" / BSD-3-Clause / 0BSD / MPL-2.0 / CC0-1.0 / Unlicense → fine', ['MIT', 'Apache 2.0', 'BSD-3-Clause', '0BSD', 'MPL-2.0', 'CC0-1.0', 'Unlicense', 'ISC'].every(l => v(l) === 'ok'))
  expect('…"(MIT OR GPL-3.0)" → fine (either side will do); "(MIT AND GPL-3.0)" → refused (both must)', v('(MIT OR GPL-3.0)') === 'ok' && v('(MIT AND GPL-3.0)') === 'refuse')
  expect('…GPL-3.0 / AGPL-3.0 / LGPL-2.1 / "Apache-2.0 AND LGPL-3.0-or-later AND MIT" / none / UNLICENSED → refused', ['GPL-3.0', 'AGPL-3.0-only', 'LGPL-2.1', 'Apache-2.0 AND LGPL-3.0-or-later AND MIT', '', 'UNLICENSED'].every(l => v(l) === 'refuse'))
  expect('…CC-BY-4.0 / "SEE LICENSE IN x" → a warning to read it, not a refusal', v('CC-BY-4.0') === 'warn' && v('SEE LICENSE IN LICENSE.txt') === 'warn')

  const root = mkdtempSync(join(tmpdir(), 'bmuz-deps-'))
  const check = (dir, env = {}, ...a) => script('deps-check.mjs', [dir, ...a], { env })
  // a project pulling in a GPL package through another one, a package with no licence, and a GPL dev tool (never ships)
  const risky = join(root, 'risky')
  fakePackages(risky, { good: { license: 'MIT', licenseFile: 'MIT License\nCopyright (c) Good' }, wrapper: { license: 'MIT', deps: { gplthing: '1.0.0' } }, gplthing: { license: 'GPL-3.0' }, bare: {}, devtool: { license: 'GPL-3.0', dev: true } }, ['good', 'wrapper', 'bare', 'devtool'])
  const r = check(risky)
  expect('GPL package pulled in by another → refused in plain words, naming it and who pulls it in', r.code === 1 && /✗ gplthing@1\.0\.0 is GPL-3\.0 — a "copyleft" licence/.test(r.out) && /pulled in by wrapper/.test(r.out), r.out)
  expect('…a package with no licence → refused ("all rights reserved", added directly)', /✗ bare@1\.0\.0 has no licence at all/.test(r.out) && /bare@1\.0\.0 [^\n]*added directly in package\.json/.test(r.out), r.out)
  expect('…the GPL dev tool isn\'t counted (dev tools never ship)', !/devtool/.test(r.out) && /production only\): 4/.test(r.out), r.out)
  // security: a high advisory refuses; npm unreachable → a warning
  const clean = join(root, 'clean')
  fakePackages(clean, { good: { license: 'MIT', licenseFile: 'MIT License\nCopyright (c) Good' }, helper: { license: '(MIT OR Apache-2.0)' },
    fileonly: { licenseFile: 'Copyright 2020 X\n\nPermission is hereby granted, free of charge, to any person obtaining a copy' } }, ['good', 'helper', 'fileonly'])
  write(join(clean, 'node_modules', 'helper', 'NOTICE'), 'Helper\nCopyright Apache folks')
  const high = JSON.stringify({ vulnerabilities: { good: { name: 'good', severity: 'high', via: [{ title: 'Prototype pollution in good' }], fixAvailable: { name: 'good', version: '1.0.1', isSemVerMajor: false } } }, metadata: { vulnerabilities: { high: 1, moderate: 2 } } })
  const sec = check(clean, { FAKE_AUDIT: high })
  expect('a high security problem → refused, naming the package, the advisory and the fix', sec.code === 1 && /✗ good has a high security problem: Prototype pollution in good/.test(sec.out) && /update good to 1\.0\.1/.test(sec.out) && /2 moderate\/low — not blocking/.test(sec.out), sec.out)
  const offline = check(clean, { FAKE_AUDIT: JSON.stringify({ error: { code: 'ENOTFOUND', summary: 'request to registry.npmjs.org failed' } }) })
  // review fix: an installed package package.json doesn't list (`npm i --no-save`) → a warning; a dev tool's leftover → quiet
  const stray = join(root, 'stray')
  fakePackages(stray, { good: { license: 'MIT' } }, ['good'])
  write(join(stray, 'node_modules', 'sneaky', 'package.json'), JSON.stringify({ name: 'sneaky', version: '3.0.0', license: 'GPL-3.0' }))
  write(join(stray, 'node_modules', 'devbit', 'package.json'), JSON.stringify({ name: 'devbit', version: '1.0.0', license: 'LGPL-3.0' }))
  const strayLock = JSON.parse(readFileSync(join(stray, 'package-lock.json'), 'utf8'))
  strayLock.packages['node_modules/devbit'] = { version: '1.0.0', dev: true, optional: true }
  write(join(stray, 'package-lock.json'), JSON.stringify(strayLock, null, 2))
  const strayRun = check(stray)
  expect('an installed package package.json doesn\'t list → a warning (it would ship unchecked), not a refusal; a dev tool\'s leftover stays quiet', strayRun.code === 0 && /⚠ sneaky@3\.0\.0 is installed but package\.json doesn't list it/.test(strayRun.out) && !/devbit/.test(strayRun.out), strayRun.out)
  expect('no licence in package.json but an MIT LICENSE file → read from the file, fine to ship', /MIT \(LICENSE file\) 1/.test(offline.out) && !/fileonly/.test(offline.out), offline.out)
  expect('npm unreachable (offline) → a warning that says it wasn\'t checked, not a refusal', offline.code === 0 && /⚠ security: couldn't reach npm's security list \(offline\? request to registry\.npmjs\.org failed\) — not checked this time/.test(offline.out), offline.out)
  // --notices: every shipped package with its licence text + NOTICE
  const n = check(clean, {}, '--notices')
  const text = existsSync(join(clean, 'public', 'third-party-notices.txt')) ? readFileSync(join(clean, 'public', 'third-party-notices.txt'), 'utf8') : ''
  expect('--notices → public/third-party-notices.txt: each package, its licence, its LICENSE and NOTICE text', n.code === 0 && /good@1\.0\.0 — MIT\n\nMIT License\nCopyright \(c\) Good/.test(text) && /helper@1\.0\.0 — \(MIT OR Apache-2\.0\)/.test(text) && /Copyright Apache folks/.test(text), n.out + text)
  const noModules = join(root, 'nomods'); write(join(noModules, 'package.json'), JSON.stringify({ name: 'x', dependencies: { react: '1' } }))
  expect('production packages but no node_modules → refused, says npm ci', /aren't installed here[\s\S]*npm ci/.test(check(noModules).out))

  // release.mjs: the gate, its override, and the notices file in a game's release commit
  const release = (repo, ...a) => script('release.mjs', a, { cwd: repo, env: { BMUZ_CLEANUP: FAKE_CLEANUP } })
  const game = releaseProject(root, 'game', { state: { release: 'Release: GitHub Pages (recipe github-pages.md)' } })
  write(join(game, 'public', 'favicon.txt'), 'x\n')
  fakePackages(game, { good: { license: 'MIT', licenseFile: 'MIT License' }, wrapper: { license: 'MIT', deps: { gplthing: '1.0.0' } }, gplthing: { license: 'AGPL-3.0' } }, ['good', 'wrapper'])
  sh(game, 'add', '-A'); sh(game, 'commit', '-q', '-m', 'packages')
  const sha = sh(game, 'rev-parse', '--short', 'HEAD')
  write(join(game, '.planning', 'STATE.md'), readFileSync(join(game, '.planning', 'STATE.md'), 'utf8').replace(/(Reviewed through:|Security reviewed:\*\*|Last full check:) \w+/g, `$1 ${sha}`)); sh(game, 'commit', '-qam', 'reviews')
  const refused = release(game, 'update', 'x', '--dry-run')
  expect('release: an AGPL package in a game → refused in the one list, says --deps-risk-ok', refused.code === 1 && /package check: gplthing@1\.0\.0 is AGPL-3\.0/.test(refused.out) && /--deps-risk-ok/.test(refused.out), refused.out)
  const risked = release(game, 'update', 'x', '--deps-risk-ok')
  expect('…--deps-risk-ok (Muzzy\'s call) → released, on record in the commit body', risked.code === 0 && /Released with: --deps-risk-ok \(gplthing@1\.0\.0\)/.test(sh(game, 'log', '-1', '--format=%B')), risked.out)
  expect('…a game\'s release commit carries public/third-party-notices.txt listing every shipped package', sh(game, 'show', '--name-only', '--format=', 'HEAD').includes('public/third-party-notices.txt') && ['good@1.0.0', 'wrapper@1.0.0', 'gplthing@1.0.0'].every(p => readFileSync(join(game, 'public', 'third-party-notices.txt'), 'utf8').includes(p)), risked.out)
  // a library (Release: none (library)) gets the check but no notices file
  const lib = releaseProject(root, 'lib')
  write(join(lib, 'public', 'x.txt'), 'x\n')
  fakePackages(lib, { good: { license: 'MIT' } }, ['good'])
  sh(lib, 'add', '-A'); sh(lib, 'commit', '-q', '-m', 'packages')
  const libSha = sh(lib, 'rev-parse', '--short', 'HEAD')
  write(join(lib, '.planning', 'STATE.md'), readFileSync(join(lib, '.planning', 'STATE.md'), 'utf8').replace(/(Reviewed through:|Security reviewed:\*\*|Last full check:) \w+/g, `$1 ${libSha}`)); sh(lib, 'commit', '-qam', 'reviews')
  const libUp = release(lib, 'update', 'x')
  expect('…a library: checked ("1 of 1 … fine to ship"), released, no notices file', libUp.code === 0 && /licences: 1 of 1 packages players get are fine to ship \(MIT 1\)/.test(libUp.out) && !existsSync(join(lib, 'public', 'third-party-notices.txt')), libUp.out)
  rmSync(root, { recursive: true, force: true })
}

async function testExtract() {
  console.log('extract — the extraction queue: a game hands a piece over, the framework builds it, the game swaps it in (F114)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-extract-'))
  const dev = join(root, 'dev')
  const fw = makeRepo(dev, 'framework')
  const game = makeRepo(join(dev, 'games'), 'g')
  const env = { BMUZ_FRAMEWORK: fw, BMUZ_DEV: dev }
  const x = (cwd, ...a) => script('extract.mjs', a, { cwd, env })
  const queue = () => readFileSync(join(fw, '.planning', 'extractions.md'), 'utf8')
  // the game: src/main.mjs uses src/engine/rng.mjs; its "test" check proves the answer is 42
  write(join(game, 'package.json'), JSON.stringify({ type: 'module', scripts: { test: 'node checks/test.mjs', build: 'node -e ""' } }))
  write(join(game, 'src', 'engine', 'rng.mjs'), 'export const answer = () => 42\n')
  write(join(game, 'src', 'other.mjs'), 'export const other = 1\n')
  write(join(game, 'src', 'main.mjs'), "import { answer } from './engine/rng.mjs'\nexport const main = () => answer()\n")
  write(join(game, 'checks', 'test.mjs'), "import { main } from '../src/main.mjs'\nif (main() !== 42) { console.log('main() is', main()); process.exit(1) }\nconsole.log('42 ok')\n")
  sh(game, 'add', '.'); sh(game, 'commit', '-q', '-m', 'game')
  const head = sh(game, 'rev-parse', '--short', 'HEAD')

  // add — refusals first, nothing written
  const none = x(game, 'add', '--what=x', '--checks=test')
  expect('add: no files → refused', none.code === 1 && /which files/.test(none.out), none.out)
  const missing = x(game, 'add', 'src/nope.mjs', '--what=x', '--checks=test')
  expect('add: a missing file → refused', missing.code === 1 && /doesn't exist/.test(missing.out), missing.out)
  write(join(game, 'src', 'new.mjs'), 'x\n')
  const untracked = x(game, 'add', 'src/new.mjs', '--what=x', '--checks=test')
  expect('add: a file never committed → refused, says commit it first', untracked.code === 1 && /isn't committed/.test(untracked.out), untracked.out)
  rmSync(join(game, 'src', 'new.mjs'))
  write(join(game, 'src', 'other.mjs'), 'export const other = 2\n')
  const dirty = x(game, 'add', 'src/other.mjs', '--what=x', '--checks=test')
  expect('add: a file with uncommitted changes → refused', dirty.code === 1 && /uncommitted changes/.test(dirty.out), dirty.out)
  write(join(game, 'src', 'other.mjs'), 'export const other = 1\n')
  const noCheck = x(game, 'add', 'src/engine/rng.mjs', '--what=x', '--checks=test,e2e:nope')
  expect('add: a check that isn\'t a game script → refused, lists the scripts', noCheck.code === 1 && /e2e:nope/.test(noCheck.out) && /pick from: test, build/.test(noCheck.out), noCheck.out)
  const noWhat = x(game, 'add', 'src/engine/rng.mjs', '--checks=test')
  expect('add: no --what → refused', noWhat.code === 1 && /--what is missing/.test(noWhat.out), noWhat.out)
  const outside = makeRepo(root, 'elsewhere')
  const out = x(outside, 'add', 'a.txt', '--what=x', '--checks=test')
  expect('add: a game outside ~/Documents/dev → refused', out.code === 1 && /isn't under ~\/Documents\/dev/.test(out.out), out.out)
  expect('…and nothing was written to the queue', !existsSync(join(fw, '.planning', 'extractions.md')))

  // add — the real one
  const added = x(join(game, 'src'), 'add', 'engine/rng.mjs', '--what=seeded random numbers', '--checks=npm run test', '--name=rng')
  expect('add: green → X01 queued at the game\'s commit, said with the fix command', added.code === 0 && /X01 queued: src\/engine\/rng\.mjs at/.test(added.out) && /extract\.mjs fix X01/.test(added.out), added.out)
  expect('…the entry: game, commit, files, what, checks (npm run stripped), fixes none', /## X01 · rng/.test(queue()) && /- Game: games\/g\n/.test(queue()) && queue().includes(`- Commit: ${head}`) && /- Files: `src\/engine\/rng\.mjs`/.test(queue()) && /- Checks: `npm run test`\n/.test(queue()) && /- Fixes while frozen: none/.test(queue()), queue())
  expect('…committed in the framework, just the queue', /Extraction queue: X01 queued — g rng/.test(sh(fw, 'log', '-1', '--format=%s')) && sh(fw, 'show', '--name-only', '--format=', 'HEAD') === '.planning/extractions.md', sh(fw, 'log', '-1', '--stat'))
  const twice = x(game, 'add', 'src/engine/rng.mjs', '--what=x', '--checks=test')
  expect('add: a file already in an open entry → refused', twice.code === 1 && /already in X01/.test(twice.out), twice.out)
  const listed = x(fw, 'list')
  expect('list: shows the open entry', listed.code === 0 && /X01 · queued · games\/g @ \w+ · rng/.test(listed.out) && /checks: npm run test/.test(listed.out), listed.out)

  // status (the framework session)
  const early = x(fw, 'status', 'X01', 'released', 'rng@0.1.0')
  expect('status released: no such module in the framework yet → refused', early.code === 1 && /no rng\/kit\/VERSION/.test(early.out), early.out)
  const building = x(fw, 'status', 'x01', 'building')
  expect('status building → said and committed', building.code === 0 && /- Status: building/.test(queue()) && /X01 building/.test(sh(fw, 'log', '-1', '--format=%s')), building.out)
  const bad = x(fw, 'status', 'X01', 'done')
  expect('status: an unknown word → refused', bad.code === 1 && /which status/.test(bad.out), bad.out)
  // the module, as the framework session builds it (first with a bug: 41)
  const rng = join(fw, 'rng')
  write(join(rng, 'kit', 'VERSION'), '0.1.0\n')
  write(join(rng, 'kit', 'index.mjs'), 'export const answer = () => 41\n')
  write(join(rng, 'package.json'), JSON.stringify({ scripts: {}, bmuz: { folders: ['src/rng'], entry: 'src/rng/index.mjs' } }))
  write(join(rng, 'scripts', 'install-rng.mjs'), [
    "import { mkdirSync, copyFileSync } from 'node:fs'",
    "import { join } from 'node:path'",
    "const [game, ...rest] = process.argv.slice(2)",
    "if (rest.includes('--dry-run')) { console.log('would copy kit/ → src/rng/'); process.exit(0) }",
    "mkdirSync(join(game, 'src', 'rng'), { recursive: true })",
    "for (const f of ['VERSION', 'index.mjs']) copyFileSync(join(import.meta.dirname, '..', 'kit', f), join(game, 'src', 'rng', f))",
  ].join('\n'))
  const uncommitted = x(fw, 'status', 'X01', 'released', 'rng@0.1.0')
  expect('status released: the module has uncommitted changes → refused', uncommitted.code === 1 && /uncommitted changes in the framework/.test(uncommitted.out), uncommitted.out)
  sh(fw, 'add', '.'); sh(fw, 'commit', '-q', '-m', 'rng module')
  const wrongVersion = x(fw, 'status', 'X01', 'released', 'rng@0.2.0')
  expect('status released: a version the module isn\'t → refused, says the real one', wrongVersion.code === 1 && /says 0\.1\.0, not 0\.2\.0/.test(wrongVersion.out), wrongVersion.out)

  // fix (while frozen) + Muzzy's own note kept on rewrite
  const notSwapYet = x(game, 'swap', 'X01')
  expect('swap: not released yet → refused', notSwapYet.code === 1 && /not released yet/.test(notSwapYet.out), notSwapYet.out)
  writeFileSync(join(fw, '.planning', 'extractions.md'), queue().replace('- Fixes while frozen: none', '- Fixes while frozen: none\nMuzzy: keep the name rng'))
  const fixed = x(game, 'fix', 'X01', 'the seed wraps at 2^32')
  expect('fix: logged on the entry with the date, committed', fixed.code === 0 && /- Fixes while frozen:\n {2}- \d{4}-\d\d-\d\d — the seed wraps at 2\^32/.test(queue()) && /fix while frozen/.test(sh(fw, 'log', '-1', '--format=%s')), queue())
  expect('…Muzzy\'s own line in the entry is kept', /Muzzy: keep the name rng/.test(queue()), queue())
  const released = x(fw, 'status', 'X01', 'released', 'rng@0.1.0')
  expect('status released → said, with the swap command for the game', released.code === 0 && /- Status: released rng@0\.1\.0/.test(queue()) && /extract\.mjs swap X01/.test(released.out), released.out)

  // swap — refusals
  write(join(game, 'scratch.txt'), 'wip\n')
  const unclean = x(game, 'swap', 'X01')
  expect('swap: uncommitted work in the game → refused (a clean tree first)', unclean.code === 1 && /needs a clean tree/.test(unclean.out), unclean.out)
  rmSync(join(game, 'scratch.txt'))
  const wrongGame = x(outside, 'swap', 'X01')
  expect('swap: run outside the game → refused', wrongGame.code === 1, wrongGame.out)
  // swap — red: the module answers 41, the game's own check fails → set aside, the game exactly as it was
  const before = sh(game, 'rev-parse', 'HEAD')
  const red = x(game, 'swap', 'X01')
  expect('swap red: refused, names the failing check', red.code === 1 && /isn't swapped — it went red/.test(red.out) && /npm run test/.test(red.out) && /main\(\) is 41/.test(red.out), red.out)
  expect('…the game is back on main, same commit, clean, old file still there', sh(game, 'branch', '--show-current') === 'main' && sh(game, 'rev-parse', 'HEAD') === before && sh(game, 'status', '--porcelain') === '' && existsSync(join(game, 'src', 'engine', 'rng.mjs')) && !existsSync(join(game, 'src', 'rng')), sh(game, 'status', '--porcelain'))
  expect('…the attempt is kept on extract/X01-swap (nothing lost), the drop command needs Muzzy', sh(game, 'branch', '--list', 'extract/X01-swap') !== '' && /git branch -D extract\/X01-swap \(Muzzy's OK/.test(red.out) && /- Status: released rng@0\.1\.0/.test(queue()), red.out)
  // the framework session fixes the module; the swap goes green
  write(join(rng, 'kit', 'index.mjs'), 'export const answer = () => 42\n'); sh(fw, 'commit', '-qam', 'rng: 42')
  const green = x(game, 'swap', 'X01')
  expect('swap green: one game commit "Swap rng for the rng module (X01)"', green.code === 0 && sh(game, 'log', '-1', '--format=%s') === 'Swap rng for the rng module (X01)' && sh(game, 'rev-list', '--count', `${before}..HEAD`) === '1', green.out)
  expect('…old copy gone, the module in, the import pointed at it, the check unchanged and green', !existsSync(join(game, 'src', 'engine', 'rng.mjs')) && existsSync(join(game, 'src', 'rng', 'index.mjs')) && readFileSync(join(game, 'src', 'main.mjs'), 'utf8').includes("from './rng/index.mjs'") && /✓ npm run test/.test(green.out) && readFileSync(join(game, 'package.json'), 'utf8').includes('"test":"node checks/test.mjs"'), green.out)
  expect('…the tree is clean, the queue says swapped in <that commit>', sh(game, 'status', '--porcelain') === '' && queue().includes(`- Status: swapped in ${sh(game, 'rev-parse', '--short', 'HEAD')}`), queue())
  const hidden = x(fw, 'list'), every = x(fw, 'list', '--all')
  expect('list: a swapped entry is hidden; --all shows it', /is empty/.test(hidden.out) && /X01 · swapped in/.test(every.out), hidden.out + every.out)
  const lateFix = x(game, 'fix', 'X01', 'too late')
  expect('fix: a swapped entry → refused (fix the module in the framework)', lateFix.code === 1 && /already swapped/.test(lateFix.out), lateFix.out)

  // swap: a queued file changed since, with no fix logged → refused before anything changes
  const q2 = x(game, 'add', 'src/other.mjs', '--what=other', '--checks=test')
  expect('add: a second entry gets X02', q2.code === 0 && /X02 queued/.test(q2.out), q2.out)
  x(fw, 'status', 'X02', 'released', 'rng@0.1.0')
  write(join(game, 'src', 'other.mjs'), 'export const other = 3\n'); sh(game, 'commit', '-qam', 'other changed')
  const unlogged = x(game, 'swap', 'X02')
  expect('swap: a file changed since it was queued, no fix logged → refused, nothing touched', unlogged.code === 1 && /changed since .* no fix was logged/.test(unlogged.out) && existsSync(join(game, 'src', 'other.mjs')) && sh(game, 'status', '--porcelain') === '', unlogged.out)

  // review: a line break in --what can't write a fake Checks line; a hand-edited queue can't run a shell command or
  // delete outside the game; a module that refuses before installing leaves the game where it was (no empty branch)
  write(join(game, 'src', 'piece.mjs'), 'export const piece = 1\n'); sh(game, 'add', '.'); sh(game, 'commit', '-q', '-m', 'piece')
  const sneaky = x(game, 'add', 'src/piece.mjs', '--what=a piece\n- Checks: `npm run evil`\n## X99 · fake', '--checks=test')
  const { parseQueue: readQ } = await import(pathToFileURL(join(SCRIPTS, 'lib.mjs')).href)
  const x03 = readQ(queue()).entries.find(e => e.id === 'X03')
  expect('add: a line break in --what stays one line — no fake Checks line, no fake entry', sneaky.code === 0 && x03?.checks.join() === 'test' && !/## X99/m.test(queue().replace(/^- What it does:.*$/gm, '')) && readQ(queue()).entries.length === 3, queue())
  const badMod = join(fw, 'bad')
  write(join(badMod, 'kit', 'VERSION'), '0.1.0\n'); write(join(badMod, 'kit', 'index.mjs'), 'export const piece = 1\n')
  write(join(badMod, 'package.json'), JSON.stringify({ scripts: { test: 'node -e "process.exit(1)"' }, bmuz: { folders: ['src/bad'], entry: 'src/bad/index.mjs' } }))
  write(join(badMod, 'scripts', 'install-bad.mjs'), "import { mkdirSync, writeFileSync } from 'node:fs'\nconst [game] = process.argv.slice(2)\nmkdirSync(game + '/src/bad', { recursive: true }); writeFileSync(game + '/src/bad/VERSION', '0.1.0')\n")
  sh(fw, 'add', '.'); sh(fw, 'commit', '-q', '-m', 'bad module')
  x(fw, 'status', 'X03', 'released', 'bad@0.1.0')
  const q3 = queue()
  writeFileSync(join(fw, '.planning', 'extractions.md'), q3.replace(/(## X03[\s\S]*?\n- Checks: ).*/,'$1`npm run test & echo PWNED > pwned.txt`'))
  const injected = x(game, 'swap', 'X03')
  expect('swap: a hand-edited check that isn\'t a plain game script ("test & echo …") → refused, nothing run', injected.code === 1 && /aren't all the game's own npm scripts/.test(injected.out) && !existsSync(join(game, 'pwned.txt')) && sh(game, 'status', '--porcelain') === '', injected.out)
  write(join(root, 'dev', 'games', 'keep.txt'), 'not the game\'s\n')
  writeFileSync(join(fw, '.planning', 'extractions.md'), q3.replace(/(## X03[\s\S]*?\n- Files: ).*/, '$1`../keep.txt`'))
  const outsideFile = x(game, 'swap', 'X03')
  expect('swap: a hand-edited file outside the game ("../keep.txt") → refused, never deleted', outsideFile.code === 1 && /not a plain path inside the game/.test(outsideFile.out) && existsSync(join(root, 'dev', 'games', 'keep.txt')), outsideFile.out)
  writeFileSync(join(fw, '.planning', 'extractions.md'), q3.replace(/(## X03[\s\S]*?\n- Commit: ).*/, '$1--output=../hit.txt'))
  const optCommit = x(game, 'swap', 'X03')
  expect('swap: a hand-edited Commit that is a git option ("--output=…") → refused, no file written', optCommit.code === 1 && /isn't a commit id/.test(optCommit.out) && !existsSync(join(root, 'dev', 'games', 'hit.txt')), optCommit.out)
  writeFileSync(join(fw, '.planning', 'extractions.md'), q3.replace(/(## X03[\s\S]*?\n- Files: ).*/, '$1`src`'))
  const folderFile = x(game, 'swap', 'X03')
  expect('swap: a hand-edited Files line naming a folder ("src") → refused, nothing deleted', folderFile.code === 1 && /isn't one file the game's git tracks/.test(folderFile.out) && existsSync(join(game, 'src', 'main.mjs')), folderFile.out)
  writeFileSync(join(fw, '.planning', 'extractions.md'), q3)
  const early2 = x(game, 'swap', 'X03')
  expect('swap: install-module refuses before installing (the module\'s own test is red) → the game stays on main, no empty extract/ branch', early2.code === 1 && /before anything in the game changed/.test(early2.out) && sh(game, 'branch', '--show-current') === 'main' && sh(game, 'branch', '--list', 'extract/X03-swap') === '' && sh(game, 'status', '--porcelain') === '', early2.out + sh(game, 'branch'))
  write(join(game, 'src', 'bad', 'old.mjs'), 'export const old = 1\n'); sh(game, 'add', '.'); sh(game, 'commit', '-q', '-m', 'old in bad')
  x(game, 'add', 'src/bad/old.mjs', '--what=old', '--checks=test')
  x(fw, 'status', 'X04', 'released', 'bad@0.1.0')
  const overlap = x(game, 'swap', 'X04')
  expect('swap: an old file inside the module\'s own install folder → refused before installing', overlap.code === 1 && /sits inside src\/bad/.test(overlap.out) && existsSync(join(game, 'src', 'bad', 'old.mjs')), overlap.out)

  // the reader: a CRLF file stays CRLF
  const { parseQueue, writeQueue } = await import(pathToFileURL(join(SCRIPTS, 'lib.mjs')).href)
  const crlf = queue().replace(/\n/g, '\r\n')
  expect('queue reader: a CRLF file (Obsidian on Windows) comes back CRLF, unchanged', writeQueue(parseQueue(crlf)) === crlf)
  rmSync(root, { recursive: true, force: true })
}

const only = process.argv[2]
const suites = { 'install-module': testInstallModule, release: testRelease, 'release-gates': testReleaseGates,'checks-gate': testChecksGate, save: testSave, 'save-triggers': testSaveTriggers, 'config-sync': testConfigSync, 'sprint-helpers': testSprintHelpers, 'archive-retro': testArchiveRetro, 'stop-servers': testStopServers, 'port-preflight': testPortPreflight, 'no-shell': testNoShell,'ppp-framework': testPppFramework, merge: testMerge, 'live-check': testLiveCheck, rollback: testRollback, 'script-commit-guards': testScriptCommitGuards, 'release-playtest': testReleasePlaytest, 'release-stage-checks': testReleaseStageChecks, 'release-notes': testReleaseNotes, 'deps-check': testDepsCheck, extract: testExtract }
if (only && !suites[only]) { console.log(`✗ no suite "${only}" — the suites: ${Object.keys(suites).join(', ')}`); process.exit(1) } // a typo isn't "0 failed"
for (const [name, run] of Object.entries(suites)) if (!only || only === name) await run()
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
