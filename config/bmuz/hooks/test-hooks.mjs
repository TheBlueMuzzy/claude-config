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
  // feature work never lands on main outside /deliver (F67)
  writeFileSync(join(repo, 'game.ts'), 'export {}\n')
  expect('`git add -A && git commit -m "F08: …"` with code on main → blocked', g('git add -A && git commit -m "F08: hover"'), 'deny')
  expect('…heredoc message too', g(`git add -A && git commit -m "$(cat <<'EOF'\nF08: hover\n\nmore\nEOF\n)"`), 'deny')
  expect('a tiny fix (no F08: prefix) on main → allowed', g('git add -A && git commit -m "fix typo"'), 'allow')
  expect('file made, added and committed on ONE line (it does not exist yet) → blocked (found in a real try)',
    g("mkdir -p src && printf 'export const speed = 2\\n' > src/speed.ts && git add src/speed.ts && git commit -m \"F08: speed\n\nCo-Authored-By: x\""), 'deny')
  expect('same commit on a work branch → allowed', g('git checkout dev/open && git add -A && git commit -m "F08: hover"'), 'allow')
  rmSync(join(repo, 'game.ts'))
  mkdirSync(join(repo, '.planning')); writeFileSync(join(repo, '.planning', 'SPRINT.md'), 'x\n')
  expect('"F08: …" plan-only commit on main → allowed', g('git add -A && git commit -m "F08: tick task"'), 'allow')
  expect('merging a work branch into main → blocked', g('git merge dev/open'), 'deny')
  expect('merging origin/main into main (catching up) → allowed', g('git merge --ff-only origin/main'), 'allow')
  expect('git merge --abort → allowed', g('git merge --abort'), 'allow')
  expect('merging main into a work branch → allowed', g('git checkout dev/open && git merge main'), 'allow')
  expect('PowerShell here-string "F08:" commit, plan files only → allowed', runHook('guard-git.mjs', pwsh(repo, "git add -A; git commit -m @'\r\nF08: thing\r\n'@")), 'allow')
  writeFileSync(join(repo, 'game2.ts'), 'export {}\n')
  expect('…with code in it → blocked', runHook('guard-git.mjs', pwsh(repo, "git add -A; git commit -m @'\r\nF08: thing\r\n'@")), 'deny')
  expect('`git checkout -b hotfix main && git commit "F08:"` → on hotfix, allowed', g('git checkout -b hotfix main && git add -A && git commit -m "F08: x"'), 'allow')
  rmSync(join(repo, 'game2.ts'))
  const mention = join(root, 'mention.jsonl')
  writeFileSync(mention, JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', content: 'guard-git looks for <command-name>/deliver</command-name>' }] } }) + '\n')
  expect('a file that only MENTIONS /deliver doesn\'t unlock merges', runHook('guard-git.mjs', { ...bash(repo, 'git merge dev/open'), transcript_path: mention }), 'deny')
  const log = join(root, 'session.jsonl')
  writeFileSync(log, JSON.stringify({ type: 'user', message: { content: '<command-name>/deliver</command-name>' } }) + '\n')
  expect('merge during /deliver → allowed', runHook('guard-git.mjs', { ...bash(repo, 'git merge --no-ff dev/open -m "Release"'), transcript_path: log }), 'allow')
  rmSync(root, { recursive: true, force: true })
}

function testGuardEdits() {
  console.log('guard-edits — kit copies, piped checks, heredoc code')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-edits-'))
  const game = join(root, 'game')
  mkdirSync(join(game, 'src', 'ui', 'kit'), { recursive: true }); writeFileSync(join(game, 'src', 'ui', 'kit', 'VERSION'), '0.18.0\n')
  mkdirSync(join(game, 'src', 'audio'), { recursive: true }); writeFileSync(join(game, 'src', 'audio', 'VERSION'), '0.3.0\n')
  mkdirSync(join(game, 'src', 'ai'), { recursive: true }) // the game's own AI plug — not a copy
  const edit = file => runHook('guard-edits.mjs', { cwd: game, tool_name: 'Edit', tool_input: { file_path: join(game, file) } })
  const b = cmd => runHook('guard-edits.mjs', bash(game, cmd))
  const ps = cmd => runHook('guard-edits.mjs', pwsh(game, cmd))
  expect("Edit in the game's UI kit copy → blocked", edit('src/ui/kit/Button.tsx'), 'deny')
  expect('…says where to change it', { result: /framework\/ui-kit\/kit\/Button\.tsx/.test(edit('src/ui/kit/Button.tsx').message) ? 'ok' : 'no', message: edit('src/ui/kit/Button.tsx').message }, 'ok')
  expect('Write in the audio copy → blocked', runHook('guard-edits.mjs', { cwd: game, tool_name: 'Write', tool_input: { file_path: join(game, 'src', 'audio', 'engine.ts') } }), 'deny')
  expect("Edit the game's own code → allowed", edit('src/ui/Hud.tsx'), 'allow')
  expect("Edit the game's AI plug (src/ai/, no VERSION) → allowed", edit('src/ai/goals.ts'), 'allow')
  expect('sed -i on a kit copy → blocked', b("sed -i 's/a/b/' src/ui/kit/Button.tsx"), 'deny')
  expect('echo > into a kit copy → blocked', b('echo x > src/audio/new.ts'), 'deny')
  expect('reading a kit copy into a file elsewhere → allowed', b('cat src/ui/kit/Button.tsx > /tmp/copy.txt'), 'allow')
  expect('running the installer → allowed', b('node ../../framework/ui-kit/scripts/install-kit.mjs .'), 'allow')
  expect('npm test | tail → blocked', b('npm test | tail -5'), 'deny')
  expect('npm run check:fast 2>&1 | grep FAIL → blocked', b('npm run check:fast 2>&1 | grep FAIL'), 'deny')
  expect('node e2e/game.mjs | tail → blocked', b('node e2e/game.mjs | tail -3'), 'deny')
  expect('PowerShell npm run lint | Select-Object → blocked', ps('npm run lint | Select-Object -Last 5'), 'deny')
  expect('set -o pipefail; npm test | tail → allowed', b('set -o pipefail; npm test | tail -5'), 'allow')
  expect('npm test > out.txt; echo $? → allowed', b('npm test > out.txt 2>&1; echo "exit $?"; tail -30 out.txt'), 'allow')
  expect('npm run check:fast || echo failed → allowed', b('npm run check:fast || echo failed'), 'allow')
  expect('git log | head → allowed', b('git log --oneline | head -5'), 'allow')
  expect("python heredoc writing a .ts with a backslash → blocked", b("python - <<'EOF'\nopen('src/a.ts','w').write(\"x.split('\\\\n')\")\nEOF"), 'deny')
  expect("python heredoc, file name in a variable → blocked", b("python - <<'EOF'\np='src/a.mjs'\ns=open(p).read().replace('a','\\\\d')\nopen(p,'w').write(s)\nEOF"), 'deny')
  const catHeredoc = b("cat > src/a.ts <<'EOF'\nconst r = /\\d+/\nEOF")
  expect('cat > a.ts heredoc with a backslash → blocked, for that reason', { result: catHeredoc.result === 'deny' && /writes a code file/.test(catHeredoc.message) ? 'ok' : 'no', message: catHeredoc.message }, 'ok')
  expect('python -c writing a .js with a backslash → blocked', b("python -c \"open('a.js','w').write('a\\\\nb')\""), 'deny')
  expect('sed -i with a backslash on a .mjs → blocked (2026-10-18)', b("sed -i 's/^const A = 1$/const A = \\/^v\\\\d+$\\//' hooks/x.mjs"), 'deny')
  expect('sed -i with a backslash on a .md → allowed', b("sed -i 's/^- \\[ \\] 🤖 2/- [x] 🤖 2/' .planning/SPRINT.md"), 'allow')
  expect('node --input-type=module -e writing a .mjs with a backslash → blocked (2026-10-18)', b("node --input-type=module -e \"import { writeFileSync } from 'node:fs'; writeFileSync('a.mjs', 'const r = /\\\\d/')\""), 'deny')
  // from the review (2026-10-18)
  expect('grep -rn vitest src | head (a search, not a check) → allowed', b('grep -rn vitest src | head -20'), 'allow')
  expect('npm ls | grep eslint → allowed', b('npm ls | grep eslint'), 'allow')
  expect('PowerShell Get-ChildItem … | Select-String tsc → allowed', ps('Get-ChildItem node_modules/.bin | Select-String tsc'), 'allow')
  expect('a commit message quoting "npm test | tail" → allowed', b('git commit -m "fix: npm test | tail hid a failure"'), 'allow')
  expect('read-only sed -n with "-item" in its pattern → allowed', b('sed -n "/multi-item\\b/p" src/a.ts'), 'allow')
  expect('heredoc with a backslash into a quoted path with spaces → blocked', b("cat > \"C:/Program Files/x/a.ts\" <<'EOF'\nconst r = /\\d/\nEOF"), 'deny')
  expect('python heredoc writing a .ts, no backslash → allowed', b("python - <<'EOF'\nopen('src/a.ts','w').write('export {}')\nEOF"), 'allow')
  expect('heredoc writing a .md with a backslash → allowed', b("cat > notes.md <<'EOF'\nuse \\d\nEOF"), 'allow')
  expect('commit message heredoc with a backslash and "-> a.ts" → allowed', b("git commit -F - <<'EOF'\nF08: regex \\d -> a.ts\nEOF"), 'allow')
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
  const bugs = '# T — Bugs\nOpen: 1 (P0 1 · P1 0 · P2 0 · P3 0)\n## Open\n### B001 · P0 · open · found 2026-10-18\nThe game crashes on start\n## Fixed (newest first)\n'
  commitFile(repo, '.planning/BUGS.md', bugs, 'bug')
  const blockedByBug = p('git push origin main')
  expect('an open P0 in BUGS.md → push main blocked', blockedByBug, 'deny')
  expect('…names the bug', { result: /B001/.test(blockedByBug.message) ? 'ok' : 'no', message: blockedByBug.message }, 'ok')
  commitFile(repo, '.planning/BUGS.md', bugs.replace('P0 · open', 'P0 · verified 2026-10-18 · Guarded by: e2e/a.mjs'), 'bug fixed')
  expect('P0 verified → allowed again', p('git push origin main'), 'allow')
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

function testPlanLint() {
  console.log('plan-lint — plan files stay well-formed')
  const { root, repo } = makeRepo()
  const plan = join(repo, '.planning')
  mkdirSync(plan)
  const roadmap = [
    '# Test — Roadmap', '## v0.1 — First ← current', 'Goal: something',
    '- ✅ F01 🧱 Base — must', '- 🔨 F02 🎮 Cards — must · needs: F01', '- 🟢 F03 ✨ Wiggle — could · needs: F01, fw F27',
    '```mermaid', 'flowchart LR', '  F01[F01 Base] --> F02[F02 Cards]', '  F01 --> F03[F03 Wiggle]', '```', '',
  ].join('\n')
  const sprint = [
    '# Sprint 01 — cards', '## F02 🎮 Cards', 'Done when: x',
    '- [x] 🤖 1. Layout — src/a.ts', '- [ ] 🤖 2. Hover — src/b.ts', '- [ ] 🙋 3. Look at it', '',
  ].join('\n')
  const bugs = [
    '# Test — Bugs', 'Open: 1 (P0 0 · P1 1 · P2 0 · P3 0)', '## Open', '### B002 · P1 · open · found 2026-10-18', 'Broken',
    '## Fixed (newest first)', '### B001 · P1 · verified 2026-10-17 · Guarded by: tests/a.test.ts', 'Was broken', '',
  ].join('\n')
  const state = ['# State', '## ▶ RESUME HERE', 'Doing F02.', '## Where we are', 'Stage: develop', '## Log', '- 2026-10-18 start', ''].join('\n')
  const files = { 'ROADMAP.md': roadmap, 'SPRINT.md': sprint, 'BUGS.md': bugs, 'STATE.md': state }
  for (const [name, text] of Object.entries(files)) writeFileSync(join(plan, name), text)
  writeFileSync(join(repo, '.gitignore'), '.planning/ppp.html\n')
  sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'plan')
  const edit = (name, text) => { writeFileSync(join(plan, name), text); return runHook('plan-lint.mjs', { cwd: repo, hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: join(plan, name) } }) }
  const says = (got, re) => ({ result: re.test(got.message) ? 'ok' : 'no', message: got.message })

  expect('well-formed files → quiet', edit('ROADMAP.md', roadmap), 'allow')
  expect('…and the planner page was rebuilt', { result: existsSync(join(plan, 'ppp.html')) ? 'ok' : 'no', message: 'no ppp.html' }, 'ok')
  const unknown = edit('ROADMAP.md', roadmap.replace('needs: F01, fw F27', 'needs: F09'))
  expect('needs a feature that does not exist → told', unknown, 'block')
  expect('…names it', says(unknown, /F03 needs F09/), 'ok')
  expect('ready before what it needs is done → told', edit('ROADMAP.md', roadmap.replace('- ✅ F01', '- 🔨 F01')), 'block')
  expect('graph arrow without the needs line → told', edit('ROADMAP.md', roadmap.replace('- 🔨 F02 🎮 Cards — must · needs: F01', '- 🔨 F02 🎮 Cards — must')), 'block')
  expect('duplicate ID → told', edit('ROADMAP.md', roadmap.replace('F03 ✨ Wiggle', 'F02 ✨ Wiggle')), 'block')
  expect('"needs:" hidden by a later " — " → told', edit('ROADMAP.md', roadmap.replace('needs: F01, fw F27', 'needs: F01, fw F27 · built — big')), 'block')
  expect('labelled dotted arrow "-.working.->" is read', edit('ROADMAP.md', roadmap.replace('F01 --> F03[F03 Wiggle]', 'F01 -.working.-> F03[F03 Wiggle]')), 'allow')
  edit('ROADMAP.md', roadmap)
  expect('sprint feature with 2 tasks → told', edit('SPRINT.md', sprint.replace('- [ ] 🙋 3. Look at it\n', '')), 'block')
  expect('task with no owner → told', edit('SPRINT.md', sprint.replace('🤖 2. Hover', 'Hover')), 'block')
  expect('sprint feature not 🔨 in ROADMAP → told', edit('SPRINT.md', sprint.replace('## F02', '## F03').replace('Cards', 'Wiggle')), 'block')
  expect('sub-task "3b." is fine', edit('SPRINT.md', sprint + '- [ ] 🤖 3b. Extra\n'), 'allow')
  expect('tasks under "## Extras" (not a feature) → told (found in a real try)', edit('SPRINT.md', sprint + '## Extras\n- [x] 🤖 4. blue button\n'), 'block')
  edit('SPRINT.md', sprint)
  const count = edit('BUGS.md', bugs.replace('Open: 1 (P0 0 · P1 1', 'Open: 2 (P0 1 · P1 1'))
  expect('wrong "Open:" count → told', count, 'block')
  expect('…with the right count', says(count, /1 \(P0 0 · P1 1 · P2 0 · P3 0\)/), 'ok')
  expect('fixed bug left under Open → told', edit('BUGS.md', bugs.replace('B002 · P1 · open', 'B002 · P1 · fixed 2026-10-18')), 'block')
  expect('fixed P1 without "Guarded by:" → told', edit('BUGS.md', bugs.replace(' · Guarded by: tests/a.test.ts', '')), 'block')
  edit('BUGS.md', bugs)
  expect('STATE over 120 lines → told', edit('STATE.md', state + 'x\n'.repeat(130)), 'block')
  expect('Log over 10 entries → told', edit('STATE.md', state + '- old\n'.repeat(11)), 'block')
  expect('RESUME HERE appended, not replaced → told', edit('STATE.md', state.replace('Doing F02.', 'line\n'.repeat(14))), 'block')
  edit('STATE.md', state)
  // a problem already in the last commit doesn't nag every edit
  writeFileSync(join(plan, 'STATE.md'), state + '- old\n'.repeat(11)); sh(repo, 'commit', '-qam', 'long log')
  expect('old problem (already committed) → quiet', edit('STATE.md', state + '- old\n'.repeat(11) + '\n'), 'allow')
  expect('other files (not plan files) → ignored', runHook('plan-lint.mjs', { tool_name: 'Edit', tool_input: { file_path: join(repo, 'a.txt') } }), 'allow')
  const cli = spawnSync('node', [join(HOOKS, 'plan-lint.mjs'), repo], { encoding: 'utf8' })
  expect('command mode lists every problem (exit 1)', { result: cli.status === 1 && /Log has 22|Log has 12/.test(cli.stdout) ? 'ok' : 'no', message: cli.stdout }, 'ok')
  rmSync(root, { recursive: true, force: true })
}

function testSessionMoments() {
  console.log('session-moments — /save at the right moments')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-ctx-'))
  process.env.BMUZ_CTX_DIR = root
  const prompt = (text, session = 's1') => runHook('session-moments.mjs', { hook_event_name: 'UserPromptSubmit', session_id: session, prompt: text })
  const commit = (session = 's1') => runHook('session-moments.mjs', { hook_event_name: 'PostToolUse', session_id: session, tool_name: 'Bash', tool_input: { command: 'git add -A && git commit -m x' } })
  const told = (got, re) => ({ result: re.test(got.message) ? 'told' : 'quiet', message: got.message })
  const ctx = (pct, session = 's1') => writeFileSync(join(root, `${session}.txt`), `${pct} ${session} 2026-10-18T22:00:00\n`)
  expect('"going to bed" → /save', told(prompt("ok I'm going to bed"), /\/save/), 'told')
  expect('"switching to the laptop" → /save', told(prompt('switching to the laptop now'), /\/save/), 'told')
  expect('normal message → quiet', told(prompt('make the cards bigger'), /\/save/), 'quiet')
  expect("a helper's report saying \"going to bed\" → quiet (it's not Muzzy)", told(prompt('<agent-message from="x">done — going to bed</agent-message>'), /\/save/), 'quiet')
  ctx(40)
  expect('context 40% → quiet', told(prompt('go'), /Context is/), 'quiet')
  ctx(81)
  expect('context 81% → checkpoint', told(prompt('go'), /Context is 81%/), 'told')
  expect('…said once, not every message', told(prompt('go'), /Context is/), 'quiet')
  ctx(91)
  expect('context 91% after a commit (autonomous) → said again at 90', told(commit(), /Context is 91%/), 'told')
  ctx(20); prompt('go'); ctx(85)
  expect('after a compact (20%) it counts again', told(prompt('go'), /Context is 85%/), 'told')
  ctx(95, 's2')
  expect("another session's context doesn't count here", told(prompt('go', 's3'), /Context is/), 'quiet')
  expect('a command that is not a commit → quiet', told(runHook('session-moments.mjs', { hook_event_name: 'PostToolUse', session_id: 's2', tool_name: 'Bash', tool_input: { command: 'ls' } }), /Context/), 'quiet')
  delete process.env.BMUZ_CTX_DIR
  rmSync(root, { recursive: true, force: true })
}

function testStopPlanCheck() {
  console.log('stop-plan-check — the plan keeps up with the work')
  const { root, repo } = makeRepo()
  mkdirSync(join(repo, '.planning'))
  const sprint = '# Sprint 01 — x\n## F02 🎮 Cards\n- [x] 🤖 1. a\n- [ ] 🤖 2. b\n- [ ] 🤖 3. c\n'
  writeFileSync(join(repo, '.planning', 'SPRINT.md'), sprint)
  sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'sprint')
  let n = 0
  const startedAt = new Date(Date.now() - 2000).toISOString()
  const prompt = { type: 'user', timestamp: startedAt, message: { content: 'make the button blue' } }
  const tool = (name, input) => ({ type: 'assistant', cwd: repo, message: { content: [{ type: 'tool_use', name, input }] } })
  const stop = (tools, extra = {}) => {
    const path = join(root, `t${n++}.jsonl`)
    writeFileSync(path, [prompt, ...tools].map(e => JSON.stringify(e)).join('\n'))
    return runHook('stop-plan-check.mjs', { hook_event_name: 'Stop', transcript_path: path, stop_hook_active: false, ...extra })
  }
  const commitCmd = tool('Bash', { command: 'git add -A && git commit -m "blue button"' })
  commitFile(repo, 'src/button.ts', 'export const blue = 1\n', 'blue button')
  expect('code committed, SPRINT.md untouched → sent back', stop([commitCmd]), 'block')
  expect('…unless SPRINT.md was edited this turn', stop([commitCmd, tool('Edit', { file_path: join(repo, '.planning', 'SPRINT.md') })]), 'allow')
  expect('already sent back once → allowed (no loop)', stop([commitCmd], { stop_hook_active: true }), 'allow')
  expect('no commit this turn → allowed', stop([tool('Edit', { file_path: join(repo, 'src', 'button.ts') })]), 'allow')
  writeFileSync(join(repo, '.planning', 'SPRINT.md'), sprint.replace(/- \[ \]/g, '- [x]'))
  expect('sprint finished (all ticked) → allowed', stop([commitCmd]), 'allow')
  writeFileSync(join(repo, '.planning', 'SPRINT.md'), sprint)
  const later = makeRepo() // a turn that only committed plan files
  mkdirSync(join(later.repo, '.planning')); writeFileSync(join(later.repo, '.planning', 'SPRINT.md'), sprint)
  // the setup commits are seconds old, so this turn "starts" 5 s from now and the save commit is dated 10 s from now
  writeFileSync(join(later.repo, '.planning', 'STATE.md'), 'saved\n'); sh(later.repo, 'add', '-A')
  execFileSync('git', ['-C', later.repo, 'commit', '-q', '-m', 'save'], { env: { ...process.env, GIT_COMMITTER_DATE: new Date(Date.now() + 10_000).toISOString() } })
  const planOnly = join(root, 'plan.jsonl')
  writeFileSync(planOnly, [{ ...prompt, timestamp: new Date(Date.now() + 5_000).toISOString() }, { ...commitCmd, cwd: later.repo }].map(e => JSON.stringify(e)).join('\n'))
  expect('only plan files committed (/save) → allowed', runHook('stop-plan-check.mjs', { hook_event_name: 'Stop', transcript_path: planOnly }), 'allow')
  rmSync(later.root, { recursive: true, force: true })

  // planner page: rebuilt by plan-lint, must be republished
  writeFileSync(join(repo, '.planning', 'STATE.md'), '## ▶ RESUME HERE\nx\n**Planner (PPP):** https://claude.ai/artifact/abc123 (pilot)\n')
  const gitDir = sh(repo, 'rev-parse', '--absolute-git-dir')
  writeFileSync(join(gitDir, 'bmuz-ppp-rebuilt'), 'now')
  const editSprint = tool('Edit', { file_path: join(repo, '.planning', 'SPRINT.md') })
  const notPublished = stop([editSprint])
  expect('planner rebuilt, not republished → sent back', notPublished, 'block')
  expect('…with the link', { result: /artifact\/abc123/.test(notPublished.message) ? 'ok' : 'no', message: notPublished.message }, 'ok')
  expect('republished this turn → allowed', stop([editSprint, tool('Artifact', { file_path: join(repo, '.planning', 'ppp.html'), url: 'https://claude.ai/artifact/abc123' })]), 'allow')
  expect('next turn, nothing rebuilt since → allowed', stop([editSprint]), 'allow')

  // F74: a milestone needs a look-back, and every look-back item a real home
  const tagMilestone = tool('Bash', { command: 'git tag v0.9.0 && git push --tags' })
  expect('milestone tagged (v0.9.0) without a look-back → sent back', stop([tagMilestone]), 'block')
  expect('an update (v0.9.3) needs no look-back', stop([tool('Bash', { command: 'git tag v0.9.3' })]), 'allow')
  expect('deleting a tag (git tag -d v0.9.0) is not a release', stop([tool('Bash', { command: 'git tag -d v0.9.0' })]), 'allow')
  expect('"Release v0.9.0" commit counts as a milestone too', stop([tool('Bash', { command: 'git commit -m "Release v0.9.0: hooks"' })]), 'block')
  const lookback = join(repo, '.planning', 'archive', 'lookbacks', 'v0.9.md')
  mkdirSync(dirname(lookback), { recursive: true })
  const good = '# Look-back — test v0.9\n## Went wrong\n- chained commands slipped past → hook: .planning/SPRINT.md (stand-in path)\n- laptop clock was off → nothing (a one-off)\n'
  writeFileSync(lookback, good)
  const wroteLookback = tool('Write', { file_path: lookback })
  expect('milestone + a look-back whose homes exist → allowed', stop([tagMilestone, wroteLookback]), 'allow')
  writeFileSync(lookback, good + '- tests were slow → script: scripts/nope.mjs (made up)\n')
  const missing = stop([tagMilestone, wroteLookback])
  expect('an item whose home file does not exist → sent back', missing, 'block')
  expect('…names it', { result: /scripts\/nope\.mjs/.test(missing.message) ? 'ok' : 'no', message: missing.message }, 'ok')
  writeFileSync(lookback, good + '- forgot to save → maybe later\n')
  expect('an item with no "→ home:" → sent back', stop([wroteLookback]), 'block')
  writeFileSync(lookback, good + '- a fluke → nothing\n')
  expect('"→ nothing" without a reason → sent back', stop([wroteLookback]), 'block')
  writeFileSync(lookback, good + '- hooks file → hook: ~/.claude/settings.json (wired)\n')
  expect('a ~/ home path is read from the home folder', stop([wroteLookback]), 'allow')
  expect('look-back written in an earlier turn → milestone allowed', stop([tagMilestone]), 'allow')
  writeFileSync(join(gitDir, 'bmuz-ppp-rebuilt'), 'later')
  expect('only ROADMAP edited, planner rebuilt, not republished → sent back (review)', stop([tool('Edit', { file_path: join(repo, '.planning', 'ROADMAP.md') })]), 'block')
  rmSync(root, { recursive: true, force: true })
}

const only = process.argv[2]
const suites = { 'guard-git': testGuardGit, 'commit-typecheck': testCommitTypecheck, 'live-push': testLivePush, 'stop-check-fast': testStopCheckFast, 'check-ui-edit': testCheckUiEdit, 'handoff-check': testHandoffCheck, 'plan-lint': testPlanLint, 'session-moments': testSessionMoments, 'guard-edits': testGuardEdits, 'stop-plan-check': testStopPlanCheck }
for (const [name, run] of Object.entries(suites)) if (!only || only === name) run()
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
