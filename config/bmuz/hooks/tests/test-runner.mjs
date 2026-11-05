// Proves the rule runner (F184): a crashing rule is loud and the others still run; broken shared files never let
// everything through; the firing log names the rule; --no-verify is refused; git's own commit step runs the commit
// rules in a BMUZ project (and save.mjs never touches a non-BMUZ repo).
// Run: node ~/.claude/config/bmuz/hooks/tests/test-runner.mjs   (test-hooks.mjs runs it as its "runner" suite)
// Every test works on a throwaway copy of the BMUZ folder in the temp folder — the real hooks are never changed.
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HOOKS = join(dirname(fileURLToPath(import.meta.url)), '..')
const BMUZ = join(HOOKS, '..')
let passed = 0
let failed = 0
const expect = (name, ok, detail = '') => {
  if (ok) { passed++; console.log(`  ✓ ${name}`) } else { failed++; console.log(`  ✗ ${name} — ${String(detail).slice(0, 400)}`) }
}

const ROOT = mkdtempSync(join(tmpdir(), 'bmuz-runner-'))
const LOG = join(ROOT, 'fire-log.jsonl')
const CTX = join(ROOT, 'ctx')
const env = { ...process.env, BMUZ_FIRE_LOG: LOG, BMUZ_CTX_DIR: CTX }
const logLines = () => (existsSync(LOG) ? readFileSync(LOG, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [])
const sh = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

// A throwaway copy of the BMUZ folder (hooks + the scripts/templates they import), under a path that still says
// .claude/config/bmuz — the broken-hooks way out is anything touching that folder.
function copyBmuz(name) {
  const to = join(ROOT, name, '.claude', 'config', 'bmuz')
  for (const part of ['hooks', 'scripts', 'templates', 'git-hooks']) cpSync(join(BMUZ, part), join(to, part), { recursive: true })
  return join(to, 'hooks')
}
function run(hooks, script, input) {
  const out = spawnSync(process.execPath, [join(hooks, script)], { input: JSON.stringify(input), encoding: 'utf8', env, timeout: 120_000 })
  let json = null
  try { json = out.stdout.trim() ? JSON.parse(out.stdout) : null } catch { /* not JSON */ }
  return { json, stdout: out.stdout, stderr: out.stderr, status: out.status }
}
const reason = (r) => r.json?.hookSpecificOutput?.permissionDecisionReason || r.json?.reason || r.json?.hookSpecificOutput?.additionalContext || ''

function testCrashingRule() {
  console.log('runner — a rule that crashes is loud, and the other rules still run')
  const hooks = copyBmuz('crash')
  writeFileSync(join(hooks, 'rules', 'guard-git', 'GG1.reset-hard.mjs'), "export default { id: 'GG1', name: 'x', what: 'x', why: 'x', check() { throw new Error('on purpose') } }\n")
  const repo = join(ROOT, 'crash-repo'); mkdirSync(repo); sh(repo, 'init', '-q')
  const both = run(hooks, 'guard-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git reset --hard && git push --force' } })
  expect('GG1 crashes → GG2 still refuses the force-push', both.json?.hookSpecificOutput?.permissionDecision === 'deny' && /force-pushing/.test(reason(both)), both.stdout + both.stderr)
  expect('…and the refusal names the crashed rule, its file and the error', /GG1 \(rules\/guard-git\/GG1\.reset-hard\.mjs\): on purpose/.test(reason(both)) && /crashed in guard-git/.test(both.json?.systemMessage || ''), reason(both))
  const quiet = run(hooks, 'guard-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git status' } })
  expect('a command no rule refuses → allowed, but the crash is told to Claude and shown to Muzzy', !quiet.json?.hookSpecificOutput?.permissionDecision && /GG1/.test(quiet.json?.hookSpecificOutput?.additionalContext || '') && /GG1/.test(quiet.json?.systemMessage || ''), quiet.stdout)
  const lines = logLines().filter(l => l.kind === 'crash' && l.rule === 'GG1')
  expect('the firing log has a "crash" line with the rule id', lines.length >= 2 && /on purpose/.test(lines[0].text) && lines[0].hook === 'guard-git', JSON.stringify(lines[0]))
  const deny = logLines().find(l => l.kind === 'deny' && l.hook === 'guard-git')
  expect('…and the refusal\'s line names GG2', deny?.rule === 'GG2', JSON.stringify(deny))

  // a rule file that won't even load (a syntax error) → that rule is skipped, loudly; the rest still guard
  writeFileSync(join(hooks, 'rules', 'guard-git', 'GG1.reset-hard.mjs'), 'export default { id: \'GG1\', check( {\n')
  const syntax = run(hooks, 'guard-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git push -f' } })
  expect('a rule file with a syntax error → named in the answer, GG2 still refuses', /force-pushing/.test(reason(syntax)) && /GG1/.test(reason(syntax)), syntax.stdout + syntax.stderr)
  // a rule file nobody lists → said (it would never run)
  writeFileSync(join(hooks, 'rules', 'guard-git', 'GG99.extra.mjs'), "export default { id: 'GG99', check() {} }\n")
  const unlisted = run(hooks, 'guard-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git status' } })
  expect('a rule file missing from _hook.mjs\'s order → said, not silently skipped', /GG99.*isn't in rules\/guard-git\/_hook\.mjs's order/.test(unlisted.json?.systemMessage || ''), unlisted.stdout)

  // a Stop hook's rule crashing → sent back with the note (counted like any send-back), no crash of its own
  const transcript = join(ROOT, 'turn.jsonl')
  writeFileSync(transcript, `${JSON.stringify({ type: 'user', message: { content: 'hi' } })}\n${JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'hello' }] } })}\n`)
  writeFileSync(join(hooks, 'rules', 'stop-unsaved', 'SU1.unsaved-stop.mjs'), "export default { id: 'SU1', check() { throw new Error('stop rule broke') } }\n")
  const stop = run(hooks, 'stop-unsaved.mjs', { hook_event_name: 'Stop', session_id: 'crash-stop', cwd: repo, transcript_path: transcript })
  expect('Stop: a crashed rule → sent back once with the crash named', stop.json?.decision === 'block' && /SU1.*stop rule broke/.test(stop.json.reason), stop.stdout + stop.stderr)
  // a PostToolUse rule crashing → a message beside the result
  writeFileSync(join(hooks, 'rules', 'sketch-lint', 'SL1.sketch-kit.mjs'), "export default { id: 'SL1', check() { throw new Error('after-edit broke') } }\n")
  const post = run(hooks, 'sketch-lint.mjs', { hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: join(repo, 'a.txt') } })
  expect('PostToolUse: a crashed rule → told to Claude beside the result', post.json?.decision === 'block' && /SL1.*after-edit broke/.test(post.json.reason), post.stdout + post.stderr)
}

function testBrokenShared() {
  console.log('runner — a broken shared file (lib.mjs) never lets everything through')
  const hooks = copyBmuz('broken')
  writeFileSync(join(hooks, 'lib.mjs'), readFileSync(join(hooks, 'lib.mjs'), 'utf8') + '\nexport const = oops\n')
  const repo = join(ROOT, 'broken-repo'); mkdirSync(repo); sh(repo, 'init', '-q')
  const before = logLines().length
  const bash = run(hooks, 'guard-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'git push --force' } })
  expect('PreToolUse: refused, saying "BMUZ hooks are broken" and where', bash.json?.hookSpecificOutput?.permissionDecision === 'deny' && /^BMUZ hooks are broken: .*lib\.mjs/.test(reason(bash)) && /BMUZ hooks are broken/.test(bash.json.systemMessage), bash.stdout + bash.stderr)
  const plain = run(hooks, 'guard-edits.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'ls' } })
  expect('…even a harmless command (every guard is off)', plain.json?.hookSpecificOutput?.permissionDecision === 'deny', plain.stdout)
  const fix = run(hooks, 'guard-edits.mjs', { cwd: repo, tool_name: 'Edit', tool_input: { file_path: join(hooks, 'lib.mjs') } })
  expect('…but an edit of the hooks themselves is let through (loudly) — the way out', !fix.json?.hookSpecificOutput?.permissionDecision && /BMUZ hooks are broken/.test(fix.json?.systemMessage || ''), fix.stdout)
  const restore = run(hooks, 'guard-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'cp ~/.claude-config/config/bmuz/hooks/lib.mjs ~/.claude/config/bmuz/hooks/lib.mjs' } })
  expect('…and so is a command that puts a good copy back', !restore.json?.hookSpecificOutput?.permissionDecision, restore.stdout)
  const post = run(hooks, 'plan-lint.mjs', { hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: join(repo, 'a.md') } })
  expect('PostToolUse: a message to Claude beside the result', post.json?.decision === 'block' && /BMUZ hooks are broken/.test(post.json.reason), post.stdout)
  const stop = run(hooks, 'handoff-check.mjs', { hook_event_name: 'Stop', cwd: repo })
  expect('Stop: sent back to fix it', stop.json?.decision === 'block' && /BMUZ hooks are broken/.test(stop.json.reason), stop.stdout)
  const again = run(hooks, 'handoff-check.mjs', { hook_event_name: 'Stop', cwd: repo, stop_hook_active: true })
  expect('…but only once in a row (stop_hook_active → just the message, no loop)', !again.json?.decision && /BMUZ hooks are broken/.test(again.json?.systemMessage || ''), again.stdout)
  const prompt = run(hooks, 'session-moments.mjs', { hook_event_name: 'UserPromptSubmit', prompt: 'hi' })
  expect('UserPromptSubmit: a note to Claude + a message on screen; Muzzy\'s message still goes in', !prompt.json?.decision && /BMUZ hooks are broken/.test(prompt.json?.hookSpecificOutput?.additionalContext || ''), prompt.stdout)
  const crash = logLines().slice(before).filter(l => l.kind === 'crash' && l.rule === '(hooks broken)')
  expect('each one is logged as a "crash" line', crash.length >= 6 && crash[0].hook === 'guard-git', JSON.stringify(crash[0]))
  // the runner itself broken (not lib) — the same
  writeFileSync(join(hooks, 'lib.mjs'), readFileSync(join(HOOKS, 'lib.mjs'), 'utf8'))
  writeFileSync(join(hooks, 'runner.mjs'), 'export async function main() { throw new Error("runner broke at run time") }\n')
  const runtime = run(hooks, 'live-push.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command: 'npm run deploy' } })
  expect('the runner breaking while it runs → refused the same way', runtime.json?.hookSpecificOutput?.permissionDecision === 'deny' && /runner broke at run time/.test(reason(runtime)), runtime.stdout + runtime.stderr)
}

function testRuleIdsAndNoVerify() {
  console.log('runner — the firing log names the rule; --no-verify is refused (GG14)')
  const repo = join(ROOT, 'ids-repo'); mkdirSync(repo); sh(repo, 'init', '-q')
  const g = (command) => run(HOOKS, 'guard-git.mjs', { cwd: repo, tool_name: 'Bash', tool_input: { command } })
  const before = logLines().length
  g('git push --force origin main')
  const line = logLines()[before] || {}
  expect('a force-push refusal → its log line says rule GG2 (and hook guard-git)', line.rule === 'GG2' && line.hook === 'guard-git' && line.kind === 'deny', JSON.stringify(line))
  expect('git commit --no-verify → refused', g('git commit --no-verify -m "x"').json?.hookSpecificOutput?.permissionDecision === 'deny')
  expect('git commit -n → refused', g('git commit -n -m "x"').json?.hookSpecificOutput?.permissionDecision === 'deny')
  expect('git commit -anm "x" → refused', g('git commit -anm "x"').json?.hookSpecificOutput?.permissionDecision === 'deny')
  expect('git -c core.hooksPath=/dev/null commit → refused', g('git -c core.hooksPath=/dev/null commit -m "x"').json?.hookSpecificOutput?.permissionDecision === 'deny')
  expect('git merge --no-verify dev → refused', g('git merge --no-verify dev').json?.hookSpecificOutput?.permissionDecision === 'deny')
  expect('a message that starts with -n (git commit -m "-nope") → allowed', !g('git commit -m "-nope"').json?.hookSpecificOutput?.permissionDecision)
  expect('a plain commit → allowed', !g('git commit -m "fine"').json?.hookSpecificOutput?.permissionDecision)
  expect('git log -n 3 → allowed (not a commit)', !g('git log -n 3').json)
}

function testGitCommitStep() {
  console.log('git\'s own commit step — the commit rules run inside `git commit` in a BMUZ project (F184)')
  const typescript = join(HOOKS, '..', '..', '..', '..', 'Documents', 'dev', 'framework', 'devkit', 'node_modules', 'typescript')
  if (!existsSync(typescript)) { console.log('  (skipped: no framework devkit TypeScript on this machine)'); return }
  const gitHooks = join(BMUZ, 'git-hooks').split('\\').join('/')
  const repo = join(ROOT, 'bmuz-game')
  mkdirSync(join(repo, '.planning'), { recursive: true }); mkdirSync(join(repo, 'src')); mkdirSync(join(repo, 'node_modules'))
  sh(repo, 'init', '-q', '-b', 'dev/v1'); sh(repo, 'config', 'user.email', 't@example.com'); sh(repo, 'config', 'user.name', 't')
  symlinkSync(typescript, join(repo, 'node_modules', 'typescript'), 'junction')
  writeFileSync(join(repo, '.gitignore'), 'node_modules/\n')
  writeFileSync(join(repo, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, noEmit: true }, include: ['src'] }))
  writeFileSync(join(repo, '.planning', 'STATE.md'), '# State\n## ▶ RESUME HERE\n- start\n## Where we are\n- here\n')
  writeFileSync(join(repo, '.planning', 'ROADMAP.md'), '# Roadmap\n## v1\n- 🔨 F08 🎮 Card fan — cards spread out — must:alpha\n')
  writeFileSync(join(repo, 'src', 'ok.ts'), 'export const n: number = 1\n')
  sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'start')
  sh(repo, 'config', '--local', 'core.hooksPath', gitHooks)
  const commit = (message) => spawnSync('git', ['-C', repo, 'commit', '-q', '-m', message], { encoding: 'utf8', env })
  writeFileSync(join(repo, 'src', 'bad.ts'), 'export const n: number = "not a number"\n')
  sh(repo, 'add', 'src/bad.ts')
  const bad = commit('add a broken file')
  expect('a commit with a type error → refused by git itself, naming the type check', bad.status !== 0 && /BMUZ commit check CT1/.test(bad.stderr) && /type check failed/.test(bad.stderr), bad.stderr)
  expect('…and nothing was committed', sh(repo, 'log', '--format=%s', '-1') === 'start')
  writeFileSync(join(repo, 'src', 'bad.ts'), 'export const m: number = 2\n'); sh(repo, 'add', 'src/bad.ts')
  const good = commit('add a good file')
  expect('a clean commit → goes through', good.status === 0 && sh(repo, 'log', '--format=%s', '-1') === 'add a good file', good.stderr)
  writeFileSync(join(repo, '.planning', 'STATE.md'), '# State\n## ▶ RESUME HERE\n- F08 done\n## Where we are\n- here\n'); sh(repo, 'add', '.planning/STATE.md')
  const ownHook = join(repo, '.git', 'hooks', 'pre-commit')
  writeFileSync(ownHook, '#!/bin/sh\necho "the repo\'s own pre-commit said no" >&2\nexit 1\n')
  const own = commit('F08: done')
  expect('the repo\'s own .git/hooks/pre-commit still runs (and can refuse)', own.status !== 0 && /own pre-commit said no/.test(own.stderr), own.stderr)
  rmSync(ownHook)
  const done = commit('F08: done')
  expect('`F08: done` while ROADMAP still says 🔨 → refused (GG8), also for a commit no Claude hook saw', done.status !== 0 && /GG8/.test(done.stderr) && /ROADMAP\.md still shows F08/.test(done.stderr), done.stderr)
  const secret = join(repo, '.env'); writeFileSync(secret, 'KEY=1\n'); sh(repo, 'add', '-f', '.env')
  const leak = commit('config')
  expect('a staged .env → refused (GG6)', leak.status !== 0 && /GG6/.test(leak.stderr), leak.stderr)
  sh(repo, 'rm', '-q', '--cached', '.env'); rmSync(secret)
  const logged = logLines().filter(l => l.event === 'git commit-msg')
  expect('git\'s refusals are in the firing log with their rule ids', logged.some(l => l.rule === 'CT1') && logged.some(l => l.rule === 'GG8'), JSON.stringify(logged.slice(-2)))

  // save.mjs points a BMUZ project at it, leaves a non-BMUZ repo and a repo with its own hooks alone
  // (stand-ins for cleanup.sh and config-sync.sh — a test save never touches ~/.claude-config)
  const save = (dir) => spawnSync(process.execPath, [join(BMUZ, 'scripts', 'save.mjs'), 'a save'], { cwd: dir, encoding: 'utf8', env: { ...env, BMUZ_CLEANUP: join(ROOT, 'no-op.sh'), BMUZ_CONFIG_SYNC: join(ROOT, 'no-op.sh') }, timeout: 300_000 })
  writeFileSync(join(ROOT, 'no-op.sh'), 'exit 0\n')
  const fresh = join(ROOT, 'fresh-game')
  mkdirSync(join(fresh, '.planning'), { recursive: true })
  sh(fresh, 'init', '-q', '-b', 'dev/v1'); sh(fresh, 'config', 'user.email', 't@example.com'); sh(fresh, 'config', 'user.name', 't')
  writeFileSync(join(fresh, '.planning', 'STATE.md'), '# State\n## ▶ RESUME HERE\n- start\n## Where we are\n- here\n')
  const s1 = save(fresh)
  const set = spawnSync('git', ['-C', fresh, 'config', '--local', '--get', 'core.hooksPath'], { encoding: 'utf8' }).stdout.trim()
  expect('save.mjs in a BMUZ project → core.hooksPath set (local, to git-hooks/) and said', set.toLowerCase() === gitHooks.toLowerCase() && /git's own commit step now runs/.test(s1.stdout + s1.stderr), `${set} | ${s1.stdout}${s1.stderr}`)
  const globalSet = spawnSync('git', ['config', '--global', '--get', 'core.hooksPath'], { encoding: 'utf8' }).stdout.trim()
  expect('…never globally', globalSet.toLowerCase() !== gitHooks.toLowerCase(), globalSet)
  const plainRepo = join(ROOT, 'not-bmuz')
  mkdirSync(plainRepo); sh(plainRepo, 'init', '-q'); sh(plainRepo, 'config', 'user.email', 't@example.com'); sh(plainRepo, 'config', 'user.name', 't')
  writeFileSync(join(plainRepo, 'a.txt'), 'a\n')
  save(plainRepo)
  expect('save.mjs in a non-BMUZ repo → core.hooksPath untouched', spawnSync('git', ['-C', plainRepo, 'config', '--local', '--get', 'core.hooksPath'], { encoding: 'utf8' }).stdout.trim() === '')
  const husky = join(ROOT, 'husky-game')
  mkdirSync(join(husky, '.planning'), { recursive: true }); mkdirSync(join(husky, '.husky'))
  sh(husky, 'init', '-q'); sh(husky, 'config', 'user.email', 't@example.com'); sh(husky, 'config', 'user.name', 't')
  writeFileSync(join(husky, '.planning', 'STATE.md'), '# State\n## ▶ RESUME HERE\n- start\n## Where we are\n- here\n')
  writeFileSync(join(husky, '.husky', 'pre-commit'), 'exit 0\n')
  const s3 = save(husky)
  expect('a BMUZ project that uses husky → left alone and named', spawnSync('git', ['-C', husky, 'config', '--local', '--get', 'core.hooksPath'], { encoding: 'utf8' }).stdout.trim() === '' && /uses husky/.test(s3.stdout + s3.stderr), s3.stdout + s3.stderr)
}

function testDoc() {
  console.log('HOOKS.md — its rule table is made from the rule files (scripts/hooks-doc.mjs)')
  const check = spawnSync(process.execPath, [join(BMUZ, 'scripts', 'hooks-doc.mjs'), '--check'], { encoding: 'utf8' })
  expect('HOOKS.md\'s table matches the rule files (else: node scripts/hooks-doc.mjs)', check.status === 0, check.stdout + check.stderr)
  const doc = readFileSync(join(BMUZ, 'HOOKS.md'), 'utf8')
  expect('…with a row for every rule, each marked ①', ['GG2', 'GE3', 'CT1', 'LP1', 'LE1', 'PL17', 'HC1', 'SP1', 'SC1', 'SM2'].every(id => new RegExp(`^\\| ${id} ① \``, 'm').test(doc)))
}

const suites = { doc: testDoc, crash: testCrashingRule, broken: testBrokenShared, ids: testRuleIdsAndNoVerify, git: testGitCommitStep }
const only = process.argv[2]
for (const [name, suite] of Object.entries(suites)) if (!only || only === name) suite()
rmSync(ROOT, { recursive: true, force: true })
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
