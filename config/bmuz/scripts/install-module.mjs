// Install or update one framework module in a game — the one safe way (F69).
//   node ~/.claude/config/bmuz/scripts/install-module.mjs <module> [game-folder] [--dry-run] [extra installer args]
//   modules: devkit · ui-kit · audio · table · ai · rooms · saves · version · crashes · emotes     e.g.  install-module.mjs ui-kit . cozy
//   (+ any module born from the extraction queue, F114: kit/VERSION + "bmuz": { "folders" } in its package.json)
// Steps, stopping at the first problem:
//   0. the module's UPGRADES.md (F168): refused when it says "Needs Dev Kit: X" and the game's Dev Kit is older (the
//      fix: update devkit first); its hand steps after the game's version are printed with the dry run
//   1. the module's OWN tests + type check (+ ui-kit's check-ui) pass in the framework — a red module never ships
//      (ui-kit 0.4.4 once shipped with its own check-ui failing)
//   2. the installer's dry run (what will change) + the module's folders the game's eslint.config must ignore (F112)
//   3. the real install (skipped with --dry-run); the game's eslint.config gets those folders in its globalIgnores
//      (refused BEFORE installing, with the one line to add, when the file isn't a shape it can edit safely)
//   4. the game's OWN lint (its "lint" script) — a module copy must never trip it (F112: Dev Kit 0.26.0 broke Goops')
//   5. the module's code checks in the game: check:framework --static --only <module>
//   (a red 4 or 5 = exit 1; the install stays, the message says what to fix)
//   (after 3: `min-release-age=7` in the game's .npmrc, added once — F85)
// The installer prints the hand-wiring steps left; this script repeats where to look.
import { join } from 'node:path'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { FRAMEWORK, run, say, ok, refuse, tail, readJson, args, projectDir, exists, moduleFolders, ESLINT_CONFIGS, addEslintIgnores } from './lib.mjs'

const CHECK_ID = { devkit: 'devkit', 'ui-kit': 'ui', audio: 'audio', table: 'table', ai: 'ai', rooms: 'rooms', saves: 'saves', version: 'version', crashes: 'crashes', emotes: 'emotes' }
const { words, flags } = args()
const [module, gameArg, ...words2] = words
const extra = [...words2, ...[...flags].filter(f => f !== '--dry-run')] // the installer's own options (a style, --force…) go through
// a module born from the extraction queue (F114) counts too: its own folder in the framework, a kit/VERSION, and its
// game folders named in its package.json ("bmuz": { "folders": [...] } — see moduleFolders)
const isNewModule = (name) => /^[a-z0-9][a-z0-9-]*$/.test(name) && exists(FRAMEWORK, name, 'kit', 'VERSION') && !!moduleFolders(name)
if (!module || !(CHECK_ID[module] || isNewModule(module))) refuse(`which module? (got "${module ?? ''}")`, `node install-module.mjs <${Object.keys(CHECK_ID).join('|')}> <game-folder>  (a new module needs kit/VERSION + "bmuz": { "folders": [...] } in its package.json)`)
const checkId = CHECK_ID[module] ?? readJson(join(FRAMEWORK, module, 'package.json'))?.bmuz?.check ?? null
const game = projectDir(gameArg)
if (!exists(game, 'package.json')) refuse(`${game} has no package.json — is that the game folder?`)
const moduleDir = join(FRAMEWORK, module)
const installer = exists(moduleDir, 'scripts') && readdirSync(join(moduleDir, 'scripts')).find(f => /^install-.*\.mjs$/.test(f) && !f.includes('.test.'))
if (!installer) refuse(`no installer in ${join(moduleDir, 'scripts')}`)

// 0. (F168) the module's UPGRADES.md (beside its README) — `- <version>: <hand step>` lines, newest first, and maybe
// `Needs Dev Kit: <version>` (its checks call something only that Dev Kit's runner has: ai 0.8.3 on Glyphtender's Dev Kit
// 0.20 crashed with "t.warn is not a function"). A framework from before F168 has none: nothing printed, nothing refused.
const parts = (v) => v.split('.').map(Number)
const newer = (a, b) => { const x = parts(a), y = parts(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false }
const notes = exists(moduleDir, 'UPGRADES.md') ? readFileSync(join(moduleDir, 'UPGRADES.md'), 'utf8').split(/\r?\n/) : []
const needsDevkit = notes.map(l => l.match(/^Needs Dev Kit:\s*(\d+\.\d+\.\d+)/)?.[1]).find(Boolean)
const handSteps = notes.map(l => l.match(/^- (\d+\.\d+\.\d+): (.+)$/)).filter(Boolean).map(([, version, text]) => ({ version, text }))
// the version a game has of a module = the first x.y.z in <its first folder>/VERSION ("0.3.1 (framework b3626bf)")
const versionInGame = (name) => {
  const folder = moduleFolders(name)?.[0]
  const file = folder && join(game, folder, 'VERSION')
  return file && existsSync(file) ? readFileSync(file, 'utf8').match(/\d+\.\d+\.\d+/)?.[0] ?? null : null
}
const newVersion = readFileSync(join(moduleDir, 'kit', 'VERSION'), 'utf8').trim()
const gameVersion = versionInGame(module)
if (needsDevkit && module !== 'devkit') {
  const gameDevkit = versionInGame('devkit')
  if (gameDevkit && newer(needsDevkit, gameDevkit)) {
    refuse(`${module} ${newVersion}'s checks need Dev Kit ${needsDevkit} or newer — the game has Dev Kit ${gameDevkit}, so nothing was installed`,
      `update devkit first: node ~/.claude/config/bmuz/scripts/install-module.mjs devkit ${gameArg ?? '.'}   then run this again`)
  }
  // no Dev Kit at all: nothing runs the checks yet, so nothing can crash — said, not refused
  if (!gameDevkit) say(`! ${module}'s checks need Dev Kit ${needsDevkit} or newer, and the game has no Dev Kit — they won't run until it's installed (install-module.mjs devkit)`)
}
// the steps after the game's version, up to the new one (none for a first install or when already current)
const stepsSince = gameVersion ? handSteps.filter(s => newer(s.version, gameVersion) && !newer(s.version, newVersion)) : []
const stepsNote = stepsSince.length
  ? `\n--- hand steps: ${module} ${gameVersion} → ${newVersion} (from ${module}/UPGRADES.md — the installer doesn't do these) ---\n${stepsSince.map(s => `  ${s.version}: ${s.text}`).join('\n')}\n---`
  : ''

// 1. the module's own checks, in the framework
const scripts = readJson(join(moduleDir, 'package.json'))?.scripts ?? {}
// lint (F70): the framework's one ESLint setup lives at its root. Games ignore their kit copies, so this is the only
// place framework code is linted before it ships.
if (!scripts.lint) say(`! ${module} has no "lint" script (a framework older than the linter) — installing without the lint check`)
else if (!exists(FRAMEWORK, 'node_modules/eslint')) refuse(`the framework's linter isn't installed, so ${module} can't be checked`, `run \`npm install\` once in ${FRAMEWORK}, then try again`)
for (const name of ['test', 'typecheck', 'check-ui', 'check-devkit', 'lint'].filter(n => scripts[n])) {
  say(`… ${module}: npm run ${name}`)
  const result = run('npm', ['run', name], { cwd: moduleDir })
  if (result.code !== 0) refuse(`${module}'s own "${name}" fails in the framework, so it isn't installed:\n${tail(result.out)}`, `fix it in ${moduleDir} first (a module ships green)`)
  ok(`${module}: ${name}`)
}

// The game's eslint.config ignores the module's folders (F112) — planned here, so a file it can't edit safely is
// refused before anything changes. The module's code was linted in step 1 by the framework's own rules.
const folders = moduleFolders(module)
const eslintFile = ESLINT_CONFIGS.find(f => exists(game, f))
const eslintText = eslintFile ? readFileSync(join(game, eslintFile), 'utf8') : ''
const ignores = eslintFile ? addEslintIgnores(eslintText, folders) : null
if (ignores?.refuse) {
  const list = folders.map(f => `'${f}'`).join(', ')
  const line = /no globalIgnores/.test(ignores.refuse)
    ? `globalIgnores([${list}]), // framework module copies — linted in the framework (install-module)`
    : `${list},`
  refuse(`${eslintFile} can't be edited safely (${ignores.refuse}), so ${module} isn't installed — the game's own lint would read the module's copy`,
    /no globalIgnores/.test(ignores.refuse)
      ? `add this line first inside the config list (defineConfig([ … ]) or the exported [ … ]), with import { globalIgnores } from 'eslint/config':\n      ${line}\n    then run this again`
      : `add these to its globalIgnores([...]) list by hand:\n      ${line}\n    then run this again`)
}
const ignoreNote = (done) => !eslintFile ? `eslint: no eslint.config.* in the game — nothing to ignore`
  : ignores.added.length ? `${eslintFile}: ${done ? 'added' : 'would add'} ${ignores.added.map(f => `'${f}'`).join(', ')} to globalIgnores (the module is linted in the framework)`
  : `${eslintFile}: already ignores ${folders.join(', ')}`

// 2. dry run — 3. the real install
const installerPath = join(moduleDir, 'scripts', installer)
const dry = run('node', [installerPath, game, ...extra, '--dry-run'])
if (dry.code !== 0) refuse(`the installer's dry run failed:\n${tail(dry.out)}`)
say(`\n--- dry run ---\n${dry.out.trim()}\n${ignoreNote(false)}\n---${stepsNote}`)
if (flags.has('--dry-run')) { say('Dry run only — nothing changed.'); process.exit(0) }
const real = run('node', [installerPath, game, ...extra])
if (real.code !== 0) refuse(`the install failed part-way:\n${tail(real.out)}`, 'git status in the game shows what it changed — `git checkout -- src/` puts the old copy back (ask Muzzy first if there is other uncommitted work)')
say(real.out.trim())
ok(`${module} installed`)
// The ignores are added to the file as it is NOW: an installer may have edited it too (lint adds its rules there,
// F90) — writing the copy read before the install would wipe that edit
const ignoresNow = eslintFile ? addEslintIgnores(readFileSync(join(game, eslintFile), 'utf8'), folders) : null
if (ignoresNow?.refuse) refuse(`${module}'s installer left ${eslintFile} in a shape the ignores can't be added to (${ignoresNow.refuse})`, `add ${folders.map(f => `'${f}'`).join(', ')} to its globalIgnores([...]) by hand`)
if (ignoresNow?.added.length) {
  writeFileSync(join(game, eslintFile), ignoresNow.text)
  ok(`${ignoreNote(true)} — commit it with the module`)
} else say(`  ${ignoreNote(true)}`)
// F85: every game waits 7 days before taking a brand-new package version — the 2025 npm worm pushed poisoned versions
// that were caught within days. npm 11.10+ reads min-release-age from .npmrc (older npm ignores the line, no harm).
const npmrc = join(game, '.npmrc')
const rc = existsSync(npmrc) ? readFileSync(npmrc, 'utf8') : ''
if (!/^\s*min-release-age\s*=/m.test(rc)) {
  writeFileSync(npmrc, `${rc}${rc && !rc.endsWith('\n') ? '\n' : ''}min-release-age=7\n`)
  ok('.npmrc: min-release-age=7 (new package versions are only taken once they\'re a week old) — commit it with the module')
}

// 4. the game's OWN lint, with the game's own rules (F112) — the proof a module copy doesn't trip it. A red lint is
// said here and ends the run with exit 1 after step 5 (so both answers show at once).
let lintRed = false
const gameScripts = readJson(join(game, 'package.json'))?.scripts ?? {}
if (!gameScripts.lint) say(`(the game has no "lint" script — its own lint not run)`)
else if (!exists(game, 'node_modules')) say(`! the game's packages aren't installed, so its own lint wasn't run — \`npm install\` there, then \`npm run lint\``)
else {
  say(`… the game's own lint: npm run lint`)
  const lint = run('npm', ['run', 'lint'], { cwd: game })
  lintRed = lint.code !== 0
  if (lintRed) say(`✗ installed, but the game's own lint fails:\n${tail(lint.out, 25)}\n  → if it names files in ${folders.join(' or ')}, that folder isn't ignored by ${eslintFile ?? 'the game\'s eslint config'} — add it; otherwise it's the game's own code (fix it as a game task)`)
  else ok(`the game's own lint passes`)
}
// 5. the module's code checks in the game
const runner = ['src/devkit/check-framework.mjs'].find(p => exists(game, p))
if (!checkId) {
  say(`(${module} has no framework promise checks — "bmuz": { "check": … } in its package.json names them once it does)`)
} else if (!runner) {
  say(`(no src/devkit/check-framework.mjs in the game yet — install the Dev Kit 0.19+ to get the framework checks)`)
} else {
  const check = run('node', [runner, '--static', '--only', checkId], { cwd: game })
  if (check.code !== 0) refuse(`installed, but the game doesn't keep ${module}'s promises yet:\n${tail(check.out, 25)}`, 'wire what the failures name (MODULE-CONTRACTS.md), then run `npm run check:framework`')
  ok(`${module}'s code checks pass in the game`)
}
// the same safety kit in every game (F79): an old check-all.mjs without the one-run-at-a-time lock gets named
if (exists(game, 'scripts/check-all.mjs') && !readFileSync(join(game, 'scripts', 'check-all.mjs'), 'utf8').includes('check-lock')) {
  say(`! scripts/check-all.mjs has no one-run-at-a-time lock — copy it from ~/.claude/config/bmuz/templates/check-all.mjs (two check runs at once break each other)`)
}
// …and one without the port pre-flight (F118): a busy port fails one script late, as a vague timeout
if (exists(game, 'scripts/check-all.mjs') && !readFileSync(join(game, 'scripts', 'check-all.mjs'), 'utf8').includes('heldPorts')) {
  say(`! scripts/check-all.mjs has no port pre-flight — copy its "Port pre-flight" block + import from ~/.claude/config/bmuz/templates/check-all.mjs, and templates/ports.mjs to scripts/ports.mjs (a busy port then fails the run at once, naming who holds it)`)
} else if (exists(game, 'scripts/check-all.mjs') && !exists(game, 'scripts/ports.mjs')) { // (review, F118: copied without its lookup)
  say(`! scripts/ports.mjs is missing — check:full stops at once without it: copy ~/.claude/config/bmuz/templates/ports.mjs to scripts/ports.mjs`)
}
say(`\nNext: do the wiring steps the installer printed above${stepsSince.length ? ` and the ${stepsSince.length} hand step${stepsSince.length > 1 ? 's' : ''} since ${gameVersion} (under the dry run)` : ''}, then prove the module's main promise in the game (develop skill: "Installing a module = proving its main promise").`)
if (lintRed) process.exit(1)
