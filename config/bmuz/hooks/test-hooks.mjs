// Proves every BMUZ hook blocks what it should and lets the normal case through (F68).
// Run: node ~/.claude/config/bmuz/hooks/test-hooks.mjs   (a few seconds; makes throwaway repos in the temp folder)
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync, rmSync, symlinkSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HOOKS = dirname(fileURLToPath(import.meta.url))
let failed = 0
let passed = 0

// Send a tool call to a hook; returns 'deny' | 'block' | 'allow' plus the message.
export function runHook(script, input) {
  const out = spawnSync('node', [join(HOOKS, script)], { input: JSON.stringify(input), encoding: 'utf8', timeout: 600_000 })
  const text = (out.stdout || '').trim()
  if (!text) return { result: 'allow', message: out.stderr || '' }
  const json = JSON.parse(text)
  if (json.hookSpecificOutput?.permissionDecision === 'deny') return { result: 'deny', message: json.hookSpecificOutput.permissionDecisionReason }
  if (json.decision === 'block') return { result: 'block', message: json.reason }
  return { result: 'allow', message: text }
}

export function expect(name, got, want) {
  if (got.result === want) { passed++; console.log(`  ✓ ${name}`) }
  else { failed++; console.log(`  ✗ ${name} — wanted ${want}, got ${got.result}: ${got.message.slice(0, 300)}`) }
}

export function sh(dir, ...args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

// A repo with main, a merged branch, an unmerged branch, and a fake "origin" holding the same.
export function makeRepo() {
  const root = mkdtempSync(join(tmpdir(), 'bmuz-hooks-'))
  const origin = join(root, 'origin.git')
  const repo = join(root, 'repo')
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origin])
  execFileSync('git', ['clone', '-q', origin, repo], { stdio: 'ignore' })
  sh(repo, 'config', 'user.email', 'test@example.com')
  sh(repo, 'config', 'user.name', 'test')
  sh(repo, 'checkout', '-q', '-b', 'main')
  writeFileSync(join(repo, 'a.txt'), 'a\n')
  sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'one')
  sh(repo, 'checkout', '-q', '-b', 'dev/done'); writeFileSync(join(repo, 'b.txt'), 'b\n')
  sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'done work')
  sh(repo, 'checkout', '-q', 'main'); sh(repo, 'merge', '-q', '--ff-only', 'dev/done')
  sh(repo, 'checkout', '-q', '-b', 'dev/open'); writeFileSync(join(repo, 'c.txt'), 'c\n')
  sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'open work')
  sh(repo, 'checkout', '-q', 'main')
  sh(repo, 'push', '-q', 'origin', 'main', 'dev/done', 'dev/open')
  sh(repo, 'remote', 'set-head', 'origin', 'main')
  return { root, repo }
}

const bash = (cwd, command) => ({ cwd, tool_name: 'Bash', tool_input: { command } })
const pwsh = (cwd, command) => ({ cwd, tool_name: 'PowerShell', tool_input: { command } })

function testGuardGit() {
  console.log('guard-git — never-rules')
  const { root, repo } = makeRepo()
  const g = cmd => runHook('guard-git.mjs', bash(repo, cmd))
  expect('reset --hard blocked', g('git reset --hard HEAD~1'), 'deny')
  expect('reset --hard after cd blocked', g(`cd "${repo}" && git reset --hard`), 'deny')
  expect('reset --hard via -C blocked (PowerShell)', runHook('guard-git.mjs', pwsh('C:\\', `git -C "${repo}" reset --hard`)), 'deny')
  expect('plain reset allowed', g('git reset HEAD a.txt'), 'allow')
  expect('push --force blocked', g('git push --force origin main'), 'deny')
  expect('push -f blocked', g('git push -f'), 'deny')
  expect('push -uf blocked', g('git push -uf origin main'), 'deny')
  expect('push --force-with-lease blocked', g('git push --force-with-lease'), 'deny')
  expect('push +main blocked', g('git push origin +main'), 'deny')
  expect('normal push allowed', g('git push origin main'), 'allow')
  expect('push --follow-tags allowed', g('git push --follow-tags'), 'allow')
  expect('branch -D merged allowed', g('git branch -D dev/done'), 'allow')
  expect('branch -D unmerged blocked', g('git branch -D dev/open'), 'deny')
  expect('branch -d -f unmerged blocked', g('git branch -d -f dev/open'), 'deny')
  expect('branch -d allowed (git guards it)', g('git branch -d dev/open'), 'allow')
  expect('remote delete merged allowed', g('git push origin --delete dev/done'), 'allow')
  expect('remote delete unmerged blocked', g('git push origin --delete dev/open'), 'deny')
  expect('remote :branch unmerged blocked', g('git push origin :dev/open'), 'deny')
  expect('remote delete unknown blocked', g('git push origin --delete nope'), 'deny')
  expect('words in a commit message are fine', g('git commit -m "never use reset --hard"'), 'allow')
  expect('not git at all', g('echo git reset --hard'), 'allow')
  // from the review (2026-10-18)
  expect('heredoc commit message mentioning force-push → allowed', g("git commit -F - <<'EOF'\nF68: guard\ngit push --force now blocked\nEOF"), 'allow')
  expect('$(cat <<EOF) message → allowed', g(`git commit -m "$(cat <<'EOF'\nF68: guard\n\ngit reset --hard is refused\nEOF\n)"`), 'allow')
  expect('heredoc message, then a real force-push → blocked', g("git commit -F - <<'EOF'\nmsg\nEOF\ngit push -f"), 'deny')
  expect("PowerShell here-string with an apostrophe → allowed", runHook('guard-git.mjs', pwsh(repo, "git commit -m @'\nF68: don't allow\ngit push -f blocked\n'@")), 'allow')
  expect('escaped quote inside a message → allowed', g('git commit -m "it\\"s; git reset --hard"'), 'allow')
  expect('(cd x && git push --force) → blocked', g(`(cd "${repo}" && git push --force)`), 'deny')
  expect('PowerShell & git reset --hard → blocked', runHook('guard-git.mjs', pwsh(repo, '& git reset --hard')), 'deny')
  expect('sudo/command prefix → blocked', g('command git push -f'), 'deny')
  expect('branch -Df unmerged → blocked', g('git branch -Df dev/open'), 'deny')
  expect('push -u origin dev/x → allowed', g('git push -u origin dev/x'), 'allow')
  rmSync(root, { recursive: true, force: true })
}

// A TypeScript repo that uses the framework's own TypeScript (a junction, nothing downloaded).
function makeTsRepo() {
  const { root, repo } = makeRepo()
  const typescript = join(HOOKS, '..', '..', '..', '..', 'Documents', 'dev', 'framework', 'devkit', 'node_modules', 'typescript')
  mkdirSync(join(repo, 'node_modules'))
  symlinkSync(typescript, join(repo, 'node_modules', 'typescript'), 'junction')
  writeFileSync(join(repo, '.gitignore'), 'node_modules/\n')
  writeFileSync(join(repo, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, noEmit: true }, include: ['src'] }))
  mkdirSync(join(repo, 'src'))
  writeFileSync(join(repo, 'src', 'ok.ts'), 'export const n: number = 1\n')
  sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'ts')
  return { root, repo }
}

function testCommitTypecheck() {
  console.log('commit-typecheck — no commit with a type error')
  const { root, repo } = makeTsRepo()
  const c = cmd => runHook('commit-typecheck.mjs', bash(repo, cmd))
  writeFileSync(join(repo, 'notes.md'), 'hi\n'); sh(repo, 'add', 'notes.md')
  expect('no TypeScript staged → allowed', c('git commit -m "notes"'), 'allow')
  writeFileSync(join(repo, 'src', 'ok.ts'), 'export const n: number = 2\n'); sh(repo, 'add', '.')
  expect('good TypeScript → allowed', c('git commit -m "two"'), 'allow')
  writeFileSync(join(repo, 'src', 'bad.ts'), 'export const s: string = 1\n'); sh(repo, 'add', '.')
  const broken = c('git commit -m "broken"')
  expect('type error staged → blocked', broken, 'deny')
  expect('…and the message names the error', { result: /bad\.ts.*TS2322/s.test(broken.message) ? 'deny' : 'allow', message: broken.message }, 'deny')
  // the type check looks at the working folder, so a broken file not yet added still blocks (the build would fail too)
  expect('broken untracked file + commit -am → blocked', (sh(repo, 'reset', '-q'), c('git commit -am "x"')), 'deny')
  expect('…message says where', { result: broken.message.includes('in the project') ? 'deny' : 'allow', message: broken.message }, 'deny')
  sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'broken on purpose')
  writeFileSync(join(repo, 'src', 'ok.ts'), 'export const n: number = 3\n')
  expect('tracked file changed + -am, project broken → blocked', c('git commit -am "x"'), 'deny')
  expect('--dry-run → allowed', c('git commit --dry-run -am "x"'), 'allow')
  rmSync(root, { recursive: true, force: true })

  const fresh = makeTsRepo() // good code, then a broken NEW file nobody has staged yet
  const f = cmd => runHook('commit-typecheck.mjs', bash(fresh.repo, cmd))
  writeFileSync(join(fresh.repo, 'src', 'later.ts'), 'export const t: string = 2\n')
  expect('`git add -A && git commit` with a broken new file → blocked (found in a real try)', f('git add -A && git commit -m "try"'), 'deny')
  writeFileSync(join(fresh.repo, 'doc.md'), 'x\n'); sh(fresh.repo, 'add', 'doc.md')
  expect('same broken file, but only a doc committed → allowed', f('git commit -m "doc"'), 'allow')
  writeFileSync(join(fresh.repo, 'src', 'ok.ts'), 'export const n: number = "no"\n') // tracked file, broken, not staged
  expect('`git commit -m x src/ok.ts` → blocked (paths on the commit line)', f('git commit -m "x" src/ok.ts'), 'deny')
  expect('`git stage -A && git commit` → blocked', f('git stage -A && git commit -m "x"'), 'deny')
  expect('the type check leaves no files behind (no .tsbuildinfo, no .js)', { result: sh(fresh.repo, 'status', '--porcelain', '--ignored').split('\n').some(l => /tsbuildinfo|\.js$/.test(l)) ? 'no' : 'ok', message: sh(fresh.repo, 'status', '--porcelain', '--ignored') }, 'ok')
  rmSync(fresh.root, { recursive: true, force: true })
}

const DEPLOY_WORKFLOW = 'name: Deploy to GitHub Pages\n\non:\n  push:\n    branches:\n      - main\n\n  workflow_dispatch:\n\njobs:\n  deploy:\n    steps:\n      - uses: actions/deploy-pages@v4\n'

function commitFile(repo, file, text, message) {
  mkdirSync(dirname(join(repo, file)), { recursive: true })
  writeFileSync(join(repo, file), text)
  sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', message)
}

function smoke(repo) {
  return spawnSync('node', [join(HOOKS, 'smoke-pass.mjs')], { cwd: repo, encoding: 'utf8' })
}

function testLivePush() {
  console.log('live-push — nothing goes live without a smoke pass')
  const { root, repo } = makeRepo()
  const p = cmd => runHook('live-push.mjs', bash(repo, cmd))
  expect('no deploy workflow → push main allowed', p('git push origin main'), 'allow')
  commitFile(repo, '.github/workflows/deploy.yml', DEPLOY_WORKFLOW, 'deploy')
  commitFile(repo, 'package.json', JSON.stringify({ scripts: { smoke: 'node -e "process.exit(0)"', deploy: 'echo' } }), 'pkg')
  expect('no smoke pass → push main blocked', p('git push origin main'), 'deny')
  expect('…bare `git push` on main blocked', p('git push'), 'deny')
  expect('work branch push allowed', p('git push origin dev/open'), 'allow')
  expect('push dev:main blocked', p('git push origin dev/open:main'), 'deny')
  expect('push main --tags blocked', p('git push origin main --tags'), 'deny')
  expect('push origin @ blocked', p('git push origin @'), 'deny')
  expect('(git push) blocked', p('(git push)'), 'deny')
  expect('ENV=x npx --yes wrangler@3 deploy blocked', p('CLOUDFLARE_ACCOUNT_ID=1 npx --yes wrangler@3 deploy'), 'deny')
  expect('tags only allowed', p('git push --tags'), 'allow')
  expect('npm run deploy blocked', p('npm run deploy'), 'deny')
  expect('dry-run allowed', p('git push --dry-run origin main'), 'allow')

  const pass = smoke(repo)
  expect('smoke-pass.mjs records a pass', { result: pass.status === 0 ? 'ok' : 'no', message: pass.stdout }, 'ok')
  sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'smoke pass')
  expect('after the pass → push main allowed', p('git push origin main'), 'allow')
  commitFile(repo, '.planning/STATE.md', 'notes\n', 'save')
  commitFile(repo, 'README.md', 'docs\n', 'docs')
  expect('docs-only commits since the pass → allowed', p('git push'), 'allow')
  expect('npm run deploy after the pass → allowed', p('npm run deploy'), 'allow')
  writeFileSync(join(repo, 'a.txt'), 'changed but not committed\n')
  expect('deploy with uncommitted code → blocked', p('npm run deploy'), 'deny')
  expect('`git commit -am && git push` with new code → blocked', p('git commit -am "x" && git push origin main'), 'deny')
  expect('`git merge && git push` → blocked (push on its own line)', p('git merge dev/open && git push origin main'), 'deny')
  expect('a plain push of the passed code still allowed', p('git push origin main'), 'allow')
  sh(repo, 'checkout', '-q', 'a.txt')
  commitFile(repo, 'src/game.ts', 'export {}\n', 'code')
  const late = p('git push origin main')
  expect('code since the pass → blocked', late, 'deny')
  expect('…message lists the file', { result: late.message.includes('src/game.ts') ? 'deny' : 'allow', message: late.message }, 'deny')

  writeFileSync(join(repo, 'package.json'), JSON.stringify({ scripts: { smoke: 'node -e "process.exit(3)"' } }))
  sh(repo, 'add', '.'); sh(repo, 'commit', '-q', '-m', 'failing smoke')
  const before = readFileSync(join(repo, '.planning', 'smoke-pass'), 'utf8')
  const failing = smoke(repo)
  expect('failing smoke → nothing recorded', { result: failing.status !== 0 && readFileSync(join(repo, '.planning', 'smoke-pass'), 'utf8') === before ? 'ok' : 'no', message: failing.stdout }, 'ok')
  writeFileSync(join(repo, 'b.txt'), 'uncommitted\n')
  const dirty = smoke(repo)
  expect('uncommitted code → smoke-pass refuses', { result: dirty.status !== 0 && /Commit/.test(dirty.stdout) ? 'ok' : 'no', message: dirty.stdout }, 'ok')
  rmSync(root, { recursive: true, force: true })
}

function testStopCheckFast() {
  console.log('stop-check-fast — /develop never stops on broken code')
  const { root, repo } = makeRepo()
  const marker = join(root, 'runs.txt') // outside the repo: counts how often check:fast really ran
  process.env.BMUZ_TEST_MARK = marker
  const runs = () => (existsSync(marker) ? readFileSync(marker, 'utf8').length : 0)
  const stop = (extra = {}) => runHook('stop-check-fast.mjs', { cwd: repo, hook_event_name: 'Stop', stop_hook_active: false, ...extra })
  const check = exitCode => JSON.stringify({ scripts: { 'check:fast': `node -e "require('fs').appendFileSync(process.env.BMUZ_TEST_MARK,'x');console.log('CHECK OUTPUT');process.exit(${exitCode})"` } })

  expect('no check:fast script → allowed', stop(), 'allow')
  commitFile(repo, 'package.json', check(0), 'green check')
  expect('green → allowed', stop(), 'allow')
  expect('…it ran once', { result: runs() === 1 ? 'ok' : 'no', message: `runs=${runs()}` }, 'ok')
  stop()
  expect('nothing changed → not run again', { result: runs() === 1 ? 'ok' : 'no', message: `runs=${runs()}` }, 'ok')
  commitFile(repo, '.planning/STATE.md', 'notes\n', 'docs')
  writeFileSync(join(repo, 'NOTES.md'), 'draft\n')
  stop()
  expect('docs-only changes → not run again', { result: runs() === 1 ? 'ok' : 'no', message: `runs=${runs()}` }, 'ok')
  writeFileSync(join(repo, 'package.json'), check(1))
  const red = stop()
  expect('code changed + red → blocked', red, 'block')
  expect('…with the check output', { result: red.message.includes('CHECK OUTPUT') ? 'ok' : 'no', message: red.message }, 'ok')
  expect('already continuing (stop_hook_active) → allowed', stop({ stop_hook_active: true }), 'allow')
  writeFileSync(join(repo, 'new.ts'), 'export {}\n')
  expect('still red after a new file → blocked', stop(), 'block')
  writeFileSync(join(repo, 'package.json'), JSON.stringify({ scripts: { 'check:fast': 'node -e "setTimeout(() => {}, 60000)"' } }))
  process.env.BMUZ_STOP_LIMIT_MS = '2000'
  const started = Date.now()
  const slow = stop()
  delete process.env.BMUZ_STOP_LIMIT_MS
  expect('slow check → stopped at the time limit and reported', { result: slow.result === 'block' && /ran over/.test(slow.message) && Date.now() - started < 20_000 ? 'ok' : 'no', message: `${Date.now() - started} ms: ${slow.message}` }, 'ok')
  rmSync(root, { recursive: true, force: true })
}

function testCheckUiEdit() {
  console.log('check-ui-edit — UI rules checked right after an edit')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-ui-'))
  const goopsKit = join(HOOKS, '..', '..', '..', '..', 'Documents', 'dev', 'games', 'goops', 'src', 'ui', 'kit')
  cpSync(goopsKit, join(root, 'src', 'ui', 'kit'), { recursive: true }) // a copy — Goops itself is never touched
  writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts: { 'check:ui': 'node src/ui/kit/check-ui.mjs src/ui --css src' } }))
  const edit = file => runHook('check-ui-edit.mjs', { cwd: root, hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: join(root, file) } })
  mkdirSync(join(root, 'src', 'game'))
  writeFileSync(join(root, 'src', 'ui', 'Good.tsx'), 'export const Good = () => <div className="x" />\n')
  expect('clean UI file → quiet', edit('src/ui/Good.tsx'), 'allow')
  writeFileSync(join(root, 'src', 'ui', 'Bad.tsx'), "export const Bad = () => <div style={{ color: 'red' }} />\n")
  const bad = edit('src/ui/Bad.tsx')
  expect('inline style → Claude told', bad, 'block')
  expect('…names the file and line', { result: /src\/ui\/Bad\.tsx/.test(bad.message) && /Bad\.tsx:1/.test(bad.message.split('\\').join('/')) ? 'ok' : 'no', message: bad.message }, 'ok')
  expect('another file edited → old problem elsewhere not repeated', edit('src/ui/Good.tsx'), 'allow')
  expect('file outside src → ignored', edit('notes.ts'), 'allow')
  expect('game without the UI kit → ignored', runHook('check-ui-edit.mjs', { tool_name: 'Edit', tool_input: { file_path: join(tmpdir(), 'x', 'src', 'ui', 'a.tsx') } }), 'allow')
  rmSync(root, { recursive: true, force: true })
}

function testHandoffCheck() {
  console.log('handoff-check — every hand-off uses the card')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-handoff-'))
  const say = text => ({ type: 'assistant', message: { content: [{ type: 'text', text }] } })
  const tool = (name, input) => ({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } })
  const result = { type: 'user', message: { content: [{ type: 'tool_result', content: 'ok' }] } }
  const prompt = text => ({ type: 'user', message: { content: text } })
  let n = 0
  const stop = (entries, extra = {}) => {
    const path = join(root, `t${n++}.jsonl`)
    writeFileSync(path, entries.map(e => JSON.stringify(e)).join('\n'))
    const last = [...entries].reverse().find(e => e.type === 'assistant' && e.message.content[0].type === 'text')
    return runHook('handoff-check.mjs', { hook_event_name: 'Stop', transcript_path: path, stop_hook_active: false, last_assistant_message: last?.message.content[0].text, ...extra })
  }
  const card = [
    '## F73 Standard hand-off card — ready for you to check',
    '**Done:** built the hook + template (new code), 9 tests',
    "**You'll see:** every hand-off looks like this; nothing else changes",
    '**Try it:** nothing to try: it shows up at the next hand-off',
    '**Proof:** test-hooks 9/9',
    '**Questions:** none',
    '**Next:** `/develop` — continues F67, the lesson audit',
  ].join('\n')
  const work = [prompt('go'), tool('Edit', { file_path: 'a.ts' }), result]
  expect('question only, no work → no card needed', stop([prompt('what does 1 do?'), say('It stops three git commands.')]), 'allow')
  expect('work + plain message → sent back', stop([...work, say('Done! I fixed it.')]), 'block')
  expect('work + the card → allowed', stop([...work, say(card)]), 'allow')
  expect('work + progress line → allowed', stop([...work, say('Waiting on the helper.\n\n`████████░░ 80% · 4/5 steps · ~2 min left (waiting on helper) · posted 10:44 PM`')]), 'allow')
  const noNextCover = stop([...work, say(card.replace('`/develop` — continues F67, the lesson audit', '`/develop`'))])
  expect('card whose Next has no "— what it covers" → sent back', noNextCover, 'block')
  const noLinks = stop([...work, say(card.replace('nothing to try: it shows up at the next hand-off', 'open the game'))])
  expect('Try it without links or "nothing to try" → sent back', noLinks, 'block')
  expect('…and the message names what is missing', { result: /Try it/.test(noLinks.message) ? 'ok' : 'no', message: noLinks.message }, 'ok')
  expect('a commit counts as work', stop([prompt('go'), tool('Bash', { command: 'git add -A && git commit -m x' }), result, say('committed')]), 'block')
  expect('already sent back once → allowed (no loop)', stop([...work, say('Done!')], { stop_hook_active: true }), 'allow')
  expect('work in an EARLIER turn only → no card needed now', stop([...work, say(card), prompt('thanks, what next?'), say('F67.')]), 'allow')
  rmSync(root, { recursive: true, force: true })
}

const only = process.argv[2]
const suites = { 'guard-git': testGuardGit, 'commit-typecheck': testCommitTypecheck, 'live-push': testLivePush, 'stop-check-fast': testStopCheckFast, 'check-ui-edit': testCheckUiEdit, 'handoff-check': testHandoffCheck }
for (const [name, run] of Object.entries(suites)) if (!only || only === name) run()
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
