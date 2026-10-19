// Install or update one framework module in a game — the one safe way (F69).
//   node ~/.claude/config/bmuz/scripts/install-module.mjs <module> [game-folder] [--dry-run] [extra installer args]
//   modules: devkit · ui-kit · audio · table · ai · rooms      e.g.  install-module.mjs ui-kit . cozy
// Steps, stopping at the first problem:
//   1. the module's OWN tests + type check (+ ui-kit's check-ui) pass in the framework — a red module never ships
//      (ui-kit 0.4.4 once shipped with its own check-ui failing)
//   2. the installer's dry run (what will change)
//   3. the real install (skipped with --dry-run)
//   4. the module's code checks in the game: check:framework --static --only <module>
// The installer prints the hand-wiring steps left; this script repeats where to look.
import { join } from 'node:path'
import { readdirSync, readFileSync } from 'node:fs'
import { FRAMEWORK, run, say, ok, refuse, tail, readJson, args, projectDir, exists } from './lib.mjs'

const CHECK_ID = { devkit: 'devkit', 'ui-kit': 'ui', audio: 'audio', table: 'table', ai: 'ai', rooms: 'rooms' }
const { words, flags } = args()
const [module, gameArg, ...words2] = words
const extra = [...words2, ...[...flags].filter(f => f !== '--dry-run')] // the installer's own options (a style, --force…) go through
if (!module || !CHECK_ID[module]) refuse(`which module? (got "${module ?? ''}")`, `node install-module.mjs <${Object.keys(CHECK_ID).join('|')}> <game-folder>`)
const game = projectDir(gameArg)
if (!exists(game, 'package.json')) refuse(`${game} has no package.json — is that the game folder?`)
const moduleDir = join(FRAMEWORK, module)
const installer = exists(moduleDir, 'scripts') && readdirSync(join(moduleDir, 'scripts')).find(f => /^install-.*\.mjs$/.test(f) && !f.includes('.test.'))
if (!installer) refuse(`no installer in ${join(moduleDir, 'scripts')}`)

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

// 2. dry run — 3. the real install
const installerPath = join(moduleDir, 'scripts', installer)
const dry = run('node', [installerPath, game, ...extra, '--dry-run'])
if (dry.code !== 0) refuse(`the installer's dry run failed:\n${tail(dry.out)}`)
say(`\n--- dry run ---\n${dry.out.trim()}\n---`)
if (flags.has('--dry-run')) { say('Dry run only — nothing changed.'); process.exit(0) }
const real = run('node', [installerPath, game, ...extra])
if (real.code !== 0) refuse(`the install failed part-way:\n${tail(real.out)}`, 'git status in the game shows what it changed — `git checkout -- src/` puts the old copy back (ask Muzzy first if there is other uncommitted work)')
say(real.out.trim())
ok(`${module} installed`)

// 4. the module's code checks in the game
const runner = ['src/devkit/check-framework.mjs'].find(p => exists(game, p))
if (!runner) {
  say(`(no src/devkit/check-framework.mjs in the game yet — install the Dev Kit 0.19+ to get the framework checks)`)
} else {
  const check = run('node', [runner, '--static', '--only', CHECK_ID[module]], { cwd: game })
  if (check.code !== 0) refuse(`installed, but the game doesn't keep ${module}'s promises yet:\n${tail(check.out, 25)}`, 'wire what the failures name (MODULE-CONTRACTS.md), then run `npm run check:framework`')
  ok(`${module}'s code checks pass in the game`)
}
// the same safety kit in every game (F79): an old check-all.mjs without the one-run-at-a-time lock gets named
if (exists(game, 'scripts/check-all.mjs') && !readFileSync(join(game, 'scripts', 'check-all.mjs'), 'utf8').includes('check-lock')) {
  say(`! scripts/check-all.mjs has no one-run-at-a-time lock — copy it from ~/.claude/config/bmuz/templates/check-all.mjs (two check runs at once break each other)`)
}
say(`\nNext: do the wiring steps the installer printed above, then prove the module's main promise in the game (develop skill: "Installing a module = proving its main promise").`)
