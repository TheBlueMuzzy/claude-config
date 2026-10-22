// Proves every BMUZ hook blocks what it should and lets the normal case through (F68).
// Run: node ~/.claude/config/bmuz/hooks/test-hooks.mjs   (a few seconds; makes throwaway repos in the temp folder)
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync, rmSync, symlinkSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HOOKS = dirname(fileURLToPath(import.meta.url))
let failed = 0
let passed = 0
// Stop hooks count their send-backs per session (lib.stopVerdict) — in a throwaway folder, never the real ~/.claude/ctx
const CTX = mkdtempSync(join(tmpdir(), 'bmuz-hooks-ctx-'))
process.env.BMUZ_CTX_DIR = CTX

// Send a tool call to a hook; returns 'deny' | 'block' | 'allow' plus the message.
export function runHook(script, input) {
  const out = spawnSync('node', [join(HOOKS, script)], { input: JSON.stringify(input), encoding: 'utf8', timeout: 600_000 })
  const text = (out.stdout || '').trim()
  if (!text) return { result: 'allow', message: out.stderr || '' }
  const json = JSON.parse(text)
  if (json.hookSpecificOutput?.permissionDecision === 'deny') return { result: 'deny', message: json.hookSpecificOutput.permissionDecisionReason }
  if (json.hookSpecificOutput?.permissionDecision === 'ask') return { result: 'ask', message: json.hookSpecificOutput.permissionDecisionReason }
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
  expect('`git add .planning && git commit -m "F08: …"` → allowed (the folder itself, found in use)', g('git add .planning && git commit -m "F08: tick task"'), 'allow')
  writeFileSync(join(repo, 'version.json'), '{"version":"0.1.0","build":3}\n')
  expect('F80: a "F08: …" save on main (plan files + version.json build bump) → allowed (found by the first real save)', g('git add -A && git commit -m "F08: built, waiting for approval"'), 'allow')
  rmSync(join(repo, 'version.json'))
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
  // F80: the scripts that change main inside their own process count as a merge into main
  expect('F80: node merge.mjs outside /deliver → blocked', runHook('guard-git.mjs', { ...bash(repo, 'node ~/.claude/config/bmuz/scripts/merge.mjs dev/open'), transcript_path: mention }), 'deny')
  expect('F80: node rollback.mjs outside /deliver → blocked (PowerShell)', runHook('guard-git.mjs', { ...pwsh(repo, 'node "$env:USERPROFILE/.claude/config/bmuz/scripts/rollback.mjs" v0.9.2 "crash"'), transcript_path: mention }), 'deny')
  expect('…merge.mjs during /deliver → allowed', runHook('guard-git.mjs', { ...bash(repo, 'node ~/.claude/config/bmuz/scripts/merge.mjs dev/open'), transcript_path: log }), 'allow')
  expect('…other scripts (save.mjs) → allowed', runHook('guard-git.mjs', { ...bash(repo, 'node ~/.claude/config/bmuz/scripts/save.mjs "x"'), transcript_path: mention }), 'allow')
  expect('review: a game\'s own tools/merge.mjs → allowed', runHook('guard-git.mjs', { ...bash(repo, 'node tools/merge.mjs sprites'), transcript_path: mention }), 'allow')
  expect('review: node --check on BMUZ\'s merge.mjs (a syntax check) → allowed', runHook('guard-git.mjs', { ...bash(repo, 'node --check ~/.claude/config/bmuz/scripts/merge.mjs'), transcript_path: mention }), 'allow')
  expect('"F08: done" in a repo without .planning/STATE.md → allowed (not a BMUZ project)', g('git commit -m "F08: done"'), 'allow')
  rmSync(root, { recursive: true, force: true })

  // F72: a feature's "done" commit leaves STATE.md telling the truth
  const bmuz = makeRepo()
  const d = cmd => runHook('guard-git.mjs', bash(bmuz.repo, cmd))
  sh(bmuz.repo, 'checkout', '-q', 'dev/open')
  mkdirSync(join(bmuz.repo, '.planning')); writeFileSync(join(bmuz.repo, '.planning', 'STATE.md'), 'RESUME HERE: F09 next\n')
  // F87: every feature below has its "Checked:" record, so these tests see only the rule they're about
  writeFileSync(join(bmuz.repo, '.planning', 'SPRINT.md'), ['F09', 'F11', 'F12', 'F99'].map(id => `## ${id} 🎮 x\nCheck: a test\nChecked: test green\n`).join(''))
  sh(bmuz.repo, 'add', '.'); sh(bmuz.repo, 'commit', '-q', '-m', 'STATE: start')
  writeFileSync(join(bmuz.repo, 'notes.md'), 'one\n'); sh(bmuz.repo, 'add', '.'); sh(bmuz.repo, 'commit', '-q', '-m', 'F09: first task')
  writeFileSync(join(bmuz.repo, 'notes.md'), 'two\n')
  expect('"F09: done" with STATE untouched since F09 started → blocked', d('git commit -am "F09: done"'), 'deny')
  expect('…a PowerShell here-string message too', runHook('guard-git.mjs', pwsh(bmuz.repo, "git commit -am @'\r\nF09: done — Muzzy approved\r\n'@")), 'deny')
  expect('"F09: tick task 2" (not done) → allowed', d('git commit -am "F09: tick task 2"'), 'allow')
  writeFileSync(join(bmuz.repo, '.planning', 'STATE.md'), 'RESUME HERE: F09 done, F10 next\n')
  expect('F75: "F09: done" with STATE changed but no "Reviewed through" → blocked', d('git add -A && git commit -m "F09: done"'), 'deny')
  writeFileSync(join(bmuz.repo, '.planning', 'STATE.md'), 'RESUME HERE: F09 done, F10 next\nReviewed through: abc1234\n')
  expect('"F09: done" with STATE.md (+ a new review line) in the commit → allowed', d('git add -A && git commit -m "F09: done"'), 'allow')
  sh(bmuz.repo, 'commit', '-q', '-am', 'STATE: F09 done')
  expect('"F09: done" when STATE changed in a commit since F09 started → allowed', d('git commit --allow-empty -m "F09: done"'), 'allow')
  writeFileSync(join(bmuz.repo, 'notes.md'), 'three\n'); sh(bmuz.repo, 'commit', '-q', '-am', 'F11: first task')
  expect('"F11 + F12: done" with STATE older than F11 → blocked', d('git commit --allow-empty -m "F11 + F12: done"'), 'deny')
  writeFileSync(join(bmuz.repo, '.planning', 'STATE.md'), 'RESUME HERE: F11 done\nReviewed through: abc1234\n')
  expect('F75: STATE changed but the review line is the SAME as before F11 → blocked', d('git add -A && git commit -m "F11: done"'), 'deny')
  writeFileSync(join(bmuz.repo, '.planning', 'STATE.md'), 'RESUME HERE: F11 built; next: /code-review, then write Reviewed through\nReviewed through: abc1234\n')
  expect('F75 (review fix): prose MENTIONING "Reviewed through" changed, the real line didn\'t → blocked', d('git add -A && git commit -m "F11: done"'), 'deny')
  writeFileSync(join(bmuz.repo, '.planning', 'STATE.md'), 'RESUME HERE: F11 done\n**Reviewed through:** def5678\n')
  expect('F75: review line updated during F11, no check:full in the project → allowed', d('git add -A && git commit -m "F11: done"'), 'allow')
  writeFileSync(join(bmuz.repo, 'package.json'), '{ "scripts": { "check:full": "node x" } }\n'); sh(bmuz.repo, 'add', 'package.json'); sh(bmuz.repo, 'commit', '-q', '-m', 'add check:full')
  expect('F75: a project WITH check:full but no "Last full check" → blocked', d('git add -A && git commit -m "F11: done"'), 'deny')
  writeFileSync(join(bmuz.repo, '.planning', 'STATE.md'), 'RESUME HERE: F11 done\n**Reviewed through:** def5678\n**Last full check:** def5678 — 2026-10-19 37/37\n')
  expect('F75: both lines updated during F11 → allowed', d('git add -A && git commit -m "F11: done"'), 'allow')
  // F80: approved → ✅ in ROADMAP first
  writeFileSync(join(bmuz.repo, '.planning', 'ROADMAP.md'), '# T — Roadmap\n## v0.1 — x ← current\n- 🔨 F11 🎮 Hover — must\n- 🔨 F12 🎮 Wiggle — could\n')
  const notApproved = d('git add -A && git commit -m "F11: done"')
  expect('F80: "F11: done" while ROADMAP still says 🔨 → blocked', notApproved, 'deny')
  expect('…says to set it ✅ in ROADMAP', { result: /F11 ✅|set F11 ✅/.test(notApproved.message) ? 'ok' : 'no', message: notApproved.message }, 'ok')
  writeFileSync(join(bmuz.repo, '.planning', 'ROADMAP.md'), '# T — Roadmap\n## v0.1 — x ← current\n- ✅ F11 🎮 Hover — must\n- 🎛️ F12 🎮 Wiggle — could\n')
  expect('…✅ in ROADMAP → allowed', d('git add -A && git commit -m "F11: done"'), 'allow')
  expect('…🎛️ tuning (tuning goes on) counts too', d('git add -A && git commit -m "F12: done"'), 'allow')
  expect('…a feature not in ROADMAP at all is not blocked by this rule', d('git add -A && git commit -m "F99: done"'), 'allow')
  sh(bmuz.repo, 'add', '-A'); sh(bmuz.repo, 'commit', '-q', '-m', 'roadmap')
  // F80: a stage commit carries STATE.md
  writeFileSync(join(bmuz.repo, '.planning', 'SPRINT.md'), '# Sprint 04 — hover\n')
  expect('F80: "Sprint 04: <goal>" without STATE.md → blocked', d('git add .planning/SPRINT.md && git commit -m "Sprint 04: fanned hand"'), 'deny')
  // the check runs before the line does: an edit earlier on the same line isn't seen — the refusal says so (2026-10-19)
  const sameLine = d('sed -i "s/a/b/" .planning/STATE.md && git add .planning/SPRINT.md && git commit -m "Sprint 04: fanned hand"')
  expect('…an edit earlier on the same line → still blocked, and told to edit in its own command first', { result: sameLine.result === 'deny' && /in its own command first/.test(sameLine.message) ? 'ok' : 'no', message: sameLine.message }, 'ok')
  expect('…a plain refusal (no edit on the line) doesn\'t carry that hint', { result: /in its own command first/.test(d('git add .planning/SPRINT.md && git commit -m "Sprint 04: fanned hand"').message) ? 'no' : 'ok' }, 'ok')
  writeFileSync(join(bmuz.repo, '.planning', 'STATE.md'), 'RESUME HERE: sprint 04 started\n')
  expect('…with STATE.md → allowed', d('git add -A && git commit -m "Sprint 04: fanned hand"'), 'allow')
  expect('"GDD: discover" without STATE → blocked', d('git commit --allow-empty -m "GDD: discover"'), 'deny')
  expect('"GDD + roadmap: fast-track" without STATE → blocked', d('git commit --allow-empty -m "GDD + roadmap: fast-track"'), 'deny')
  expect('"GDD: bigger hands" (a /gdd what-if) → allowed', d('git commit --allow-empty -m "GDD: bigger hands"'), 'allow')
  expect('review: "GDD: define the lobby flow better" (a /gdd change that starts with a stage word) → allowed', d('git commit --allow-empty -m "GDD: define the lobby flow better"'), 'allow')
  expect('…"GDD: build plan — pass 2" is still a stage commit → blocked', d('git commit --allow-empty -m "GDD: build plan — pass 2"'), 'deny')
  expect('"Sprint 04 done" (archive-sprint) → allowed', d('git commit --allow-empty -m "Sprint 04 done"'), 'allow')
  // F80: helpers' worktrees never go into a commit
  sh(bmuz.repo, 'add', '-A'); sh(bmuz.repo, 'commit', '-q', '-m', 'sprint')
  const wt = join(bmuz.repo, '.claude', 'worktrees', 'agent-1')
  mkdirSync(wt, { recursive: true }); execFileSync('git', ['init', '-q', wt]); writeFileSync(join(wt, 'x.txt'), 'x\n')
  const worktree = d('git add -A && git commit -m "F12: tick"')
  expect('F80: `git add -A && git commit` with a helper worktree in .claude/worktrees/ → blocked', worktree, 'deny')
  expect('…says to add the .gitignore line', { result: /\.claude\/worktrees\//.test(worktree.message) && /\.gitignore/.test(worktree.message) ? 'ok' : 'no', message: worktree.message }, 'ok')
  writeFileSync(join(bmuz.repo, '.gitignore'), '.claude/worktrees/\n')
  expect('…ignored → allowed', d('git add -A && git commit -m "F12: tick"'), 'allow')
  rmSync(bmuz.root, { recursive: true, force: true })
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
  expect("…even when the text has => and <Tag /> (they read as shell > targets — F102 2026-10-20) → blocked", b("python - <<'EOF'\np='kit/a.test.mjs'\ns=open(p,encoding='utf-8',newline='').read()\ns+='''it('x', () => { f('<Settings />\\\\nb') })'''\nopen(p,'w',encoding='utf-8',newline='').write(s)\nEOF"), 'deny')
  const catHeredoc = b("cat > src/a.ts <<'EOF'\nconst r = /\\d+/\nEOF")
  expect('cat > a.ts heredoc with a backslash → blocked, for that reason', { result: catHeredoc.result === 'deny' && /writes a code file/.test(catHeredoc.message) ? 'ok' : 'no', message: catHeredoc.message }, 'ok')
  expect('python -c writing a .js with a backslash → blocked', b("python -c \"open('a.js','w').write('a\\\\nb')\""), 'deny')
  expect('sed -i with a backslash on a .mjs → blocked (2026-10-18)', b("sed -i 's/^const A = 1$/const A = \\/^v\\\\d+$\\//' hooks/x.mjs"), 'deny')
  expect('sed -i on a .md whose new text names a .mjs → allowed (found in use)', b("sed -i 's/^- Next: `\\/sprint`/- Next: `\\/develop` — install-module.mjs/' .planning/STATE.md"), 'allow')
  expect('sed -i with two "; "-joined edits on a .md naming a .mjs → allowed (found in use)', b("sed -i 's/^- \\[ \\] 🤖 2. `build-ppp.mjs` x/y/; s/^- \\[ \\] 🤖 3. a/b/' .planning/SPRINT.md"), 'allow')
  expect('sed -i with a backslash on a .md → allowed', b("sed -i 's/^- \\[ \\] 🤖 2/- [x] 🤖 2/' .planning/SPRINT.md"), 'allow')
  expect('node --input-type=module -e writing a .mjs with a backslash → blocked (2026-10-18)', b("node --input-type=module -e \"import { writeFileSync } from 'node:fs'; writeFileSync('a.mjs', 'const r = /\\\\d/')\""), 'deny')
  // from the review (2026-10-18)
  expect('grep -rn vitest src | head (a search, not a check) → allowed', b('grep -rn vitest src | head -20'), 'allow')
  expect('npm ls | grep eslint → allowed', b('npm ls | grep eslint'), 'allow')
  expect('PowerShell Get-ChildItem … | Select-String tsc → allowed', ps('Get-ChildItem node_modules/.bin | Select-String tsc'), 'allow')
  expect('a commit message quoting "npm test | tail" → allowed', b('git commit -m "fix: npm test | tail hid a failure"'), 'allow')
  expect('read-only sed -n with "-item" in its pattern → allowed', b('sed -n "/multi-item\\b/p" src/a.ts'), 'allow')
  expect('heredoc with a backslash into a quoted path with spaces → blocked', b("cat > \"C:/Program Files/x/a.ts\" <<'EOF'\nconst r = /\\d/\nEOF"), 'deny')
  expect("python heredoc writing a .ts, no backslash, newline='' → allowed", b("python - <<'EOF'\nopen('src/a.ts','w',newline='').write('export {}')\nEOF"), 'allow')
  // F80: Python's text mode turns LF into CRLF on Windows (Glyphtender F71)
  expect("F80: python writing a .ts without newline= → blocked", b("python - <<'EOF'\nopen('src/a.ts','w').write('export {}')\nEOF"), 'deny')
  expect("…Path.write_text without newline= → blocked", b("python -c \"from pathlib import Path; Path('src/a.ts').write_text('x')\""), 'deny')
  expect("…python writing a .md → allowed", b("python - <<'EOF'\nopen('notes.md','w').write('x')\nEOF"), 'allow')
  expect("…binary mode 'wb' → allowed", b("python - <<'EOF'\nopen('src/a.ts','wb').write(b'x')\nEOF"), 'allow')
  // F80: servers stop with stop-servers.mjs
  const killed = b('taskkill //PID 1234 //F')
  expect('F80: taskkill → blocked, names stop-servers.mjs', { result: killed.result === 'deny' && /stop-servers\.mjs/.test(killed.message) ? 'ok' : 'no', message: killed.message }, 'ok')
  expect('…PowerShell Stop-Process → blocked', ps('Stop-Process -Id 1234 -Force'), 'deny')
  expect('…npx kill-port 5173 → blocked', b('npx kill-port 5173'), 'deny')
  expect('…kill $(lsof -t -i:5173) → blocked', b('kill $(lsof -t -i:5173)'), 'deny')
  expect('…stop-servers.mjs itself → allowed', b('node ~/.claude/config/bmuz/scripts/stop-servers.mjs 5173'), 'allow')
  expect('…a commit message mentioning taskkill → allowed', b('git commit -m "never taskkill a server"'), 'allow')
  expect('review: searching for taskkill (grep -rn taskkill …) → allowed', b('grep -rn taskkill ~/.claude/config/bmuz/scripts'), 'allow')
  expect('review: Get-Help Stop-Process → allowed', ps('Get-Help Stop-Process'), 'allow')
  expect('…Get-Process node | Stop-Process → blocked', ps('Get-Process -Name node | Stop-Process'), 'deny')
  expect("review: python reading src/**/*.ts and writing report.json → allowed", b("python - <<'EOF'\nimport glob, json\nfiles = glob.glob('src/**/*.ts', recursive=True)\nopen('report.json','w').write(json.dumps(files))\nEOF"), 'allow')
  expect("…python writing a .ts held in a variable → blocked", b("python - <<'EOF'\np = 'src/a.ts'\nopen(p,'w').write('x')\nEOF"), 'deny')
  expect("review: python with a backslash writing STATE.md whose text names merge.mjs → allowed (it writes no code)", b("python - <<'EOF'\np = 'STATE.md'\ns = 'new merge.mjs + live-check.mjs; nl = \\\\r\\\\n'\nopen(p,'w',newline='').write(s)\nEOF"), 'allow')
  expect("…the same backslash script writing a .mjs → still blocked", b("python - <<'EOF'\np = 'hooks/x.mjs'\nopen(p,'w',newline='').write('a\\\\nb')\nEOF"), 'deny')
  expect("found in use: python writing SPRINT.md whose long note has a quoted span ending in .mjs (+ a backslash) → allowed", b("python - <<'EOF'\np='.planning/SPRINT.md'\ns = open(p).read()\ns += \"- it said 'archive it' then lib.mjs' and \\\\n more\"\nopen(p,'w',newline='').write(s)\nEOF"), 'allow')
  // F80: throwaway copies go in ~/Documents/dev/.scratch/, never straight in the home folder
  const home = join(root, 'home'); mkdirSync(join(home, 'Documents', 'dev'), { recursive: true }); mkdirSync(join(home, 'AppData'))
  process.env.BMUZ_HOME = home
  const hb = cmd => runHook('guard-edits.mjs', bash(home, cmd))
  const spike = hb(`mkdir -p "${join(home, 'spike')}"`)
  expect('F80: mkdir a new folder in the home folder → blocked, points to .scratch', { result: spike.result === 'deny' && /\.scratch/.test(spike.message) ? 'ok' : 'no', message: spike.message }, 'ok')
  expect('…cp -r a game into ~/ppp-proof → blocked', hb(`cp -r "${game}" "${join(home, 'ppp-proof')}"`), 'deny')
  expect('…git worktree add ~/wt → blocked', hb(`git worktree add "${join(home, 'wt')}" main`), 'deny')
  expect('…a relative mkdir while sitting in the home folder → blocked', hb('mkdir proof-shots'), 'deny')
  expect('…Write a new file straight into the home folder → blocked', runHook('guard-edits.mjs', { cwd: home, tool_name: 'Write', tool_input: { file_path: join(home, 'shot.png') } }), 'deny')
  expect('…mkdir under ~/Documents/dev/.scratch → allowed', hb(`mkdir -p "${join(home, 'Documents', 'dev', '.scratch', 'goops-proof')}"`), 'allow')
  expect('…a dot-folder (~/.claude) → allowed', runHook('guard-edits.mjs', { cwd: home, tool_name: 'Write', tool_input: { file_path: join(home, '.claude', 'x.md') } }), 'allow')
  expect('…an existing home folder (AppData) → allowed', hb(`mkdir -p "${join(home, 'AppData', 'tmp')}"`), 'allow')
  expect('…mkdir inside a game → allowed', b('mkdir -p src/new'), 'allow')
  delete process.env.BMUZ_HOME
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

  // F80: a bug fix commit needs the whole suite green (/bug "verify")
  const bugRepo = makeRepo()
  const b = cmd => runHook('commit-typecheck.mjs', bash(bugRepo.repo, cmd))
  const marker = join(bugRepo.root, 'runs.txt')
  process.env.BMUZ_TEST_MARK = marker
  const runs = () => (existsSync(marker) ? readFileSync(marker, 'utf8').length : 0)
  const check = exitCode => JSON.stringify({ scripts: { 'check:fast': `node -e "require('fs').appendFileSync(process.env.BMUZ_TEST_MARK,'x');console.log('SUITE OUTPUT');process.exit(${exitCode})"` } })
  mkdirSync(join(bugRepo.repo, '.planning')); writeFileSync(join(bugRepo.repo, '.planning', 'STATE.md'), '## ▶ RESUME HERE\n')
  writeFileSync(join(bugRepo.repo, 'package.json'), check(1))
  const red = b('git add -A && git commit -m "Fix B014: dice pulse"')
  expect('F80: "Fix B014: …" with check:fast red → blocked', red, 'deny')
  expect('…shows the suite output', { result: /SUITE OUTPUT/.test(red.message) ? 'ok' : 'no', message: red.message }, 'ok')
  expect('review: "(suite already red: B015)" but B015 not logged → blocked', b('git add -A && git commit -m "Fix B014: dice pulse (suite already red: B015)"'), 'deny')
  writeFileSync(join(bugRepo.repo, '.planning', 'BUGS.md'), '# Bugs\n## Open\n### B015 · P2 · the score test was red before\n')
  expect('…B015 logged in BUGS.md → allowed (on record, not hostage)', b('git add -A && git commit -m "Fix B014: dice pulse (suite already red: B015)"'), 'allow')
  expect('a normal commit is not checked here (stop-check-fast does it at hand-back)', b('git add -A && git commit -m "F08: tick"'), 'allow')
  writeFileSync(join(bugRepo.repo, 'package.json'), check(0))
  const before = runs()
  expect('…check:fast green → allowed', b('git add -A && git commit -m "Fix B014: dice pulse"'), 'allow')
  expect('…the same code again → not run twice (green record)', { result: (b('git commit -am "Fix B014: dice pulse"'), runs() === before + 1) ? 'ok' : 'no', message: `runs ${runs() - before}` }, 'ok')
  rmSync(join(bugRepo.repo, '.planning'), { recursive: true })
  writeFileSync(join(bugRepo.repo, 'package.json'), check(1))
  expect('not a BMUZ project (no STATE.md) → not checked', b('git add -A && git commit -m "Fix B014: x"'), 'allow')
  delete process.env.BMUZ_TEST_MARK
  rmSync(bugRepo.root, { recursive: true, force: true })
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
  // F80 review: global now, so a turn that only answered a question never runs it (nor gets sent back for red WIP)
  const turnFile = (tools) => { const p = join(root, `turn${tools.length}.jsonl`); writeFileSync(p, [{ type: 'user', message: { content: 'what does F08 do?' } }, ...tools.map(t => ({ type: 'assistant', message: { content: [{ type: 'tool_use', ...t }] } }))].map(e => JSON.stringify(e)).join('\n')); return p }
  const beforeQ = runs()
  expect('F80: question-only turn, code red → allowed, check not run', stop({ transcript_path: turnFile([]) }), 'allow')
  expect('…it really did not run', { result: runs() === beforeQ ? 'ok' : 'no', message: `runs ${runs() - beforeQ}` }, 'ok')
  expect('…a turn that edited a file → checked (red → blocked)', stop({ transcript_path: turnFile([{ name: 'Edit', input: { file_path: join(repo, 'a.txt') } }]) }), 'block')
  writeFileSync(join(repo, 'new.ts'), 'export {}\n')
  expect('still red after a new file → blocked', stop(), 'block')
  // One check:fast at a time per project (Goops 2026-10-19: two runs both build into dist/ and break each other).
  // A stand-in for "another session's run": holds the lock, optionally records a pass on this exact code, then exits.
  const lock = join(repo, '.git', 'bmuz-check.lock')
  const holderFile = join(root, 'holder.mjs')
  writeFileSync(holderFile, `import { writeFileSync } from 'node:fs'\nimport { codeFingerprint } from ${JSON.stringify(new URL('./lib.mjs', import.meta.url).href)}\nconst [lock, repo, ms, passes] = process.argv.slice(2)\nwriteFileSync(lock, process.pid + ' ' + Date.now())\nsetTimeout(() => { if (passes === 'pass') writeFileSync(repo + '/.git/bmuz-last-green', codeFingerprint(repo) + '\\n'); process.exit(0) }, Number(ms))\n`)
  const holdFor = (ms, passes = '') => { const h = spawn('node', [holderFile, lock, repo, String(ms), passes], { stdio: 'ignore' }); for (let i = 0; i < 100 && !existsSync(lock); i++) spawnSync('node', ['-e', 'setTimeout(()=>{},50)']); return h }
  process.env.BMUZ_LOCK_WAIT_MS = '1500'
  let before = runs()
  const holder = holdFor(30_000)
  expect('Goops note: another check:fast is running here (lock held) → this one waits, then leaves it (allowed)', stop(), 'allow')
  expect('…and did not start a second run', { result: runs() === before ? 'ok' : 'no', message: `runs ${runs() - before}` }, 'ok')
  holder.kill()
  for (let i = 0; i < 40 && (() => { try { process.kill(holder.pid, 0); return true } catch { return false } })(); i++) spawnSync('node', ['-e', 'setTimeout(()=>{},50)'])
  expect('…a lock left by a run that died → taken over, the check runs (red → blocked)', stop(), 'block')
  expect('…the lock is freed afterwards', { result: existsSync(lock) ? 'no' : 'ok', message: '' }, 'ok')
  process.env.BMUZ_LOCK_WAIT_MS = '8000'
  before = runs()
  holdFor(1000, 'pass')
  expect('…the other run passes this exact code while we wait → its pass is reused (allowed, no second run)', stop(), 'allow')
  expect('…no second run', { result: runs() === before ? 'ok' : 'no', message: `runs ${runs() - before}` }, 'ok')
  delete process.env.BMUZ_LOCK_WAIT_MS
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

function testLintEdit() {
  console.log('lint-edit — ESLint on the one file Claude just edited')
  // A tiny project: a flat config with one plain rule (no plugins), and node_modules/eslint linked to Glyphtender's
  // real eslint (a junction — nothing downloaded, Glyphtender untouched).
  const realEslint = join(HOOKS, '..', '..', '..', '..', 'Documents', 'dev', 'games', 'glyphtender', 'node_modules', 'eslint')
  if (!existsSync(realEslint)) { console.log('  (skipped: Glyphtender has no node_modules/eslint on this machine)'); return }
  const root = mkdtempSync(join(tmpdir(), 'bmuz-lint-'))
  const makeProject = (name, packageName, withEslint = true) => {
    const dir = join(root, name)
    mkdirSync(join(dir, 'src'), { recursive: true })
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: packageName }))
    writeFileSync(join(dir, 'eslint.config.mjs'), "export default [{ ignores: ['kit/**'] }, { files: ['**/*.{js,mjs,ts}'], rules: { 'no-unused-vars': 'error', 'no-console': 'warn' } }]\n")
    if (withEslint) { mkdirSync(join(dir, 'node_modules')); symlinkSync(realEslint, join(dir, 'node_modules', 'eslint'), 'junction') }
    return dir
  }
  const edit = (file, tool = 'Edit') => runHook('lint-edit.mjs', { hook_event_name: 'PostToolUse', tool_name: tool, tool_input: { file_path: file } })
  const write = (file, text) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); return file }
  const BAD = 'const unused = 1\nexport const used = 2\n'

  const game = makeProject('game', 'some-game')
  expect('clean file → quiet', edit(write(join(game, 'src', 'good.js'), 'export const a = 1\n')), 'allow')
  expect('only a warning (console.log) → quiet', edit(write(join(game, 'src', 'warn.js'), 'console.log(1)\nexport const a = 1\n')), 'allow')
  const bad = edit(write(join(game, 'src', 'bad.js'), BAD), 'Write')
  expect('unused variable → Claude told', bad, 'block')
  expect('…names the file, line and rule', { result: /src\/bad\.js:1:7/.test(bad.message) && /no-unused-vars/.test(bad.message) ? 'ok' : 'no', message: bad.message }, 'ok')
  expect('a game keeps its ignores (its kit copy) → quiet', edit(write(join(game, 'kit', 'copy.js'), BAD)), 'allow')
  expect('file under node_modules / dist → skipped', edit(write(join(game, 'dist', 'out.js'), BAD)), 'allow')
  expect('not a code file (.css) → skipped', edit(write(join(game, 'src', 'a.css'), 'a { }\n')), 'allow')

  const framework = makeProject('framework', 'game-framework')
  expect('framework checkout: nothing ignored (--no-ignore) → Claude told', edit(write(join(framework, 'kit', 'part.js'), BAD)), 'block')

  const bare = makeProject('bare', 'not-installed', false)
  const notInstalled = edit(write(join(bare, 'src', 'bad.js'), BAD))
  expect('F80: no local eslint (never downloads) → Claude told once to run npm install', notInstalled, 'block')
  expect('…names npm install', { result: /npm install/.test(notInstalled.message) ? 'ok' : 'no', message: notInstalled.message }, 'ok')
  expect('…only once per session (the next edit is quiet)', edit(write(join(bare, 'src', 'bad2.js'), BAD)), 'allow')
  expect('no eslint setup above the file → skipped', edit(write(join(root, 'loose', 'bad.js'), BAD)), 'allow')
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
    return runHook('handoff-check.mjs', { hook_event_name: 'Stop', transcript_path: path, session_id: `hand${n}`, stop_hook_active: false, last_assistant_message: last?.message.content[0].text, ...extra })
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
  expect('work in an EARLIER turn only → no card needed now', stop([...work, say(card), prompt('thanks, what next?'), say('F67.')]), 'allow')
  // F80: sent back until it's fixed (it used to give up after once), but never forever
  const loop = { session_id: 'loop', stop_hook_active: true }
  expect('F80: still no card after being sent back → sent back again (2nd)', (stop([...work, say('Done!')], { session_id: 'loop' }), stop([...work, say('Done!')], loop)), 'block')
  expect('…3rd time', stop([...work, say('Done!')], loop), 'block')
  expect('…then lets the turn end (no endless loop)', stop([...work, say('Done!')], loop), 'allow')
  expect('…and the count starts over afterwards', stop([...work, say('Done!')], { session_id: 'loop' }), 'block')

  // F80: what the card promises is checked too
  const withLinks = (links) => card.replace('nothing to try: it shows up at the next hand-off', links)
  const deadLink = stop([...work, say(withLinks('PC http://localhost:1/ · phone http://192.168.1.250:1/'))])
  expect('F80: a local link under Try it that does not answer → sent back', deadLink, 'block')
  expect('…names the dead link and says to start the servers', { result: /localhost:1\//.test(deadLink.message) && /\/play/.test(deadLink.message) ? 'ok' : 'no', message: deadLink.message }, 'ok')
  const port = 47000 + Math.floor(Math.random() * 1000)
  const server = spawn('node', ['-e', `require('http').createServer((q, s) => s.end('ok')).listen(${port})`], { stdio: 'ignore' })
  for (let i = 0; i < 50 && spawnSync('node', ['-e', `fetch('http://localhost:${port}/').then(() => process.exit(0), () => process.exit(1))`]).status !== 0; i++);
  expect('…a link that answers → allowed', stop([...work, say(withLinks(`PC http://localhost:${port}/`))]), 'allow')
  expect('…a working link followed by a comma or a full stop → allowed (review: "…:47123," looked dead)', stop([...work, say(withLinks(`desktop http://localhost:${port}, phone http://localhost:${port}.`))]), 'allow')
  expect('…a live (https) link is not fetched → allowed', stop([...work, say(withLinks('LIVE https://example.invalid/game/'))]), 'allow')
  server.kill()
  const look = (extra = []) => [prompt('make the button blue'), tool('Edit', { file_path: join(root, 'src', 'ui', 'Hud.tsx') }), result, ...extra]
  const noShot = stop([...look(), say(card)])
  expect('F80: a src/**/*.tsx edit with no screenshot this turn → sent back', noShot, 'block')
  expect('…says to screenshot it, or write "no visual change"', { result: /screenshot/.test(noShot.message) && /no visual change/.test(noShot.message) ? 'ok' : 'no', message: noShot.message }, 'ok')
  expect('…a Playwright screenshot this turn → allowed', stop([...look([tool('mcp__plugin_playwright_playwright__browser_take_screenshot', {}), result]), say(card)]), 'allow')
  expect('…"no visual change" under Proof → allowed', stop([...look(), say(card.replace('test-hooks 9/9', 'test-hooks 9/9 · no visual change (a rename)'))]), 'allow')
  expect('…a .ts logic edit is not a visual change → allowed', stop([prompt('go'), tool('Edit', { file_path: join(root, 'src', 'rules.ts') }), result, say(card)]), 'allow')
  // the feel question for a built feature with a why: line
  const { root: gameRoot, repo: game } = makeRepo()
  mkdirSync(join(game, '.planning'))
  writeFileSync(join(game, '.planning', 'ROADMAP.md'), '# T — Roadmap\n## v0.1 — x ← current\n- 🔨 F08 🎮 Fan — must\n  why: fan layout → players scan the whole hand → Mastery\n')
  writeFileSync(join(game, '.planning', 'SPRINT.md'), '# Sprint 04 — fan\n## F08 🎮 Fan\n- [x] 🤖 1. a — src/a.ts\n- [x] 🤖 2. b — src/a.ts\n- [x] 🤖 3. c — src/a.ts\n- [ ] 🙋 4. Try it on the phone\n')
  const inGame = [prompt('go'), { ...tool('Edit', { file_path: join(game, '.planning', 'SPRINT.md') }), cwd: game }, result]
  const fanCard = card.replace('F73 Standard hand-off card', 'F08 Fan')
  const noFeel = stop([...inGame, say(fanCard)])
  expect('F80: F08 built + a why: line, card without the feel question → sent back', noFeel, 'block')
  expect('…quotes the why', { result: /Did <moment> feel like/.test(noFeel.message) && /Mastery/.test(noFeel.message) ? 'ok' : 'no', message: noFeel.message }, 'ok')
  expect('…with "Did … feel …?" → allowed', stop([...inGame, say(fanCard.replace('**Questions:** none', '**Questions:** Did fanning 7 cards feel like holding a real hand?'))]), 'allow')
  expect('…a card about another feature (F08 not named) → allowed', stop([...inGame, say(card)]), 'allow')
  rmSync(gameRoot, { recursive: true, force: true })
  // the sprint report header
  const archive = [prompt('go'), tool('Bash', { command: 'node ~/.claude/config/bmuz/scripts/archive-sprint.mjs' }), result, tool('Edit', { file_path: 'a.ts' }), result]
  expect('F80: a sprint archived, report without "Sprint NN — <goal>" → sent back', stop([...archive, say(card)]), 'block')
  expect('…with the header line → allowed', stop([...archive, say(card.replace('## F73', 'Sprint 04 — a fanned hand you can play from\n\n## F73'))]), 'allow')
  const noteOnly = [prompt('go'), tool('Bash', { command: "cat >> .planning/SPRINT.md <<'EOF'\n- Proposed: archive-sprint.mjs names the carry-over option\nEOF" }), result]
  expect('F80: text that merely NAMES archive-sprint.mjs (a Notes line) is not an archive → allowed (found in use)', stop([...noteOnly, say(card)]), 'allow')
  // never "your game"
  const { root: projRoot, repo: proj } = makeRepo() // "your game" counts in a game project only
  mkdirSync(join(proj, '.planning'))
  expect('F80: "your game" in any answer, in a game project → sent back', stop([prompt('how is it?'), say('Your game looks great on the phone.')], { cwd: proj }), 'block')
  expect('…quoting the rule ("your game") → allowed', stop([prompt('what is the rule?'), say('Never say "your game" — it is his game.')], { cwd: proj }), 'allow')
  expect('…in backticks (`your game`) → allowed', stop([prompt('what is the rule?'), say('The check looks for `your game` in the card.')], { cwd: proj }), 'allow')
  expect('…outside a game project (PC help: "your game library in Steam") → allowed', stop([prompt('steam?'), say('Open your game library in Steam.')], { cwd: root }), 'allow')
  rmSync(projRoot, { recursive: true, force: true })
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
  mkdirSync(join(repo, 'src')); writeFileSync(join(repo, 'src', 'a.ts'), 'export {}\n') // the sprint's tasks name real files
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
  expect('F87 follow-up: tasks under "## Carried to sprint 05 — … (F09)" → quiet (they move on with it)', edit('SPRINT.md', sprint + '## Carried to sprint 05 — Card hover (F09): not approved yet\n- [ ] 🤖 1. hover lifts the card\n'), 'allow')
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
  // F80: the checks that used to be "remember to…"
  const add = (line) => roadmap.replace('```mermaid', `${line}\n\`\`\`mermaid`)
  const ready = edit('ROADMAP.md', add('- ⏳ F04 🎮 Pile — must · needs: F01'))
  expect('F80: ⏳ waiting but everything it needs is ✅ → told to set it 🟢 (ready rule)', ready, 'block')
  expect('…names it', says(ready, /F04 is ⏳ waiting/), 'ok')
  expect('…unless the line says what else it waits for ("· waits: art")', edit('ROADMAP.md', add('- ⏳ F04 🎮 Pile — must · needs: F01 · waits: art')), 'allow')
  expect('…a plain note ("· gap rank 1") doesn\'t hide it (framework F82–F84 were missed this way)', says(edit('ROADMAP.md', add('- ⏳ F04 🎮 Pile — must · needs: F01 · gap rank 1')), /F04 is ⏳ waiting/), 'ok')
  expect('…a note that says when it waits ("· when a 3D game needs it") still does', edit('ROADMAP.md', add('- ⏳ F04 🎮 Pile — must · needs: F01 · when a 3D game needs it')), 'allow')
  expect('⏳ whose need is still 🔨 → quiet', edit('ROADMAP.md', add('- ⏳ F04 🎮 Pile — must · needs: F02')), 'allow')
  expect('🟢 with a soft ~need that is only 🔨 (not 🎛️ yet) → told', edit('ROADMAP.md', add('- 🟢 F05 ✨ Glow — could · needs: ~F02')), 'block')
  expect('…the ~need 🎛️ tuning → quiet', edit('ROADMAP.md', add('- 🟢 F05 ✨ Glow — could · needs: ~F02').replace('- 🔨 F02', '- 🎛️ F02')), 'allow')
  expect('a feature with no type → told', edit('ROADMAP.md', add('- ⏳ F06 Thing — must · needs: F02')), 'block')
  expect('a feature with no scope → told', edit('ROADMAP.md', add('- ⏳ F06 🎮 Thing — needs: F02')), 'block')
  expect('a ❓ decision needs no scope → quiet', edit('ROADMAP.md', add('- ⏳ F06 ❓ Which board? — needs: F02')), 'allow')
  edit('ROADMAP.md', roadmap)
  const badPath = edit('SPRINT.md', sprint + '- [ ] 🤖 4. Deep — src/nowhere/deep/x.ts\n')
  expect('F80: a task naming a file whose folder does not exist → told ("tasks name real files")', badPath, 'block')
  expect('…names the path', says(badPath, /src\/nowhere\/deep\/x\.ts/), 'ok')
  expect('a task naming a NEW file in a real folder → quiet', edit('SPRINT.md', sprint + '- [ ] 🤖 4. New — src/new.ts, content/\n'), 'allow')
  expect('"(tuning)" / "answered 2026-10-19 (…)" are not paths → quiet', edit('SPRINT.md', sprint + '- [ ] 🤖 4. Tune it (tuning)\n- [x] 🙋 5. Read it — answered 2026-10-19 (research/x.md §8: fine)\n'), 'allow')
  const bugMissing = edit('SPRINT.md', sprint.replace('# Sprint 01 — cards', '# Sprint 02 — hover'))
  expect('F80: a new sprint that does not name an open P1 (B002) → told', bugMissing, 'block')
  expect('…names the bug', says(bugMissing, /P1 B002/), 'ok')
  expect('…named in a task or a Notes line → quiet', edit('SPRINT.md', sprint.replace('# Sprint 01 — cards', '# Sprint 02 — hover') + '## Notes\n- B002 waits for the art pass\n'), 'allow')
  edit('SPRINT.md', sprint)
  expect('F80: a "### B…" header the reader can\'t parse → told', edit('BUGS.md', bugs.replace('## Fixed', '### B003 - P2 - open\nx\n## Fixed')), 'block')
  expect('F80: "Guarded by:" a test file that does not exist → told', edit('BUGS.md', bugs.replace('tests/a.test.ts', 'tests/gone.test.ts')), 'block')
  mkdirSync(join(repo, 'tests'), { recursive: true }); writeFileSync(join(repo, 'tests', 'real.test.ts'), 'x')
  expect('…a real one (with "(what it checks)" after it) → quiet', edit('BUGS.md', bugs.replace('tests/a.test.ts', 'tests/real.test.ts ("B001: x", 3 sizes) + e2e')), 'allow')
  edit('BUGS.md', bugs)
  writeFileSync(join(plan, 'NOTES.md'), 'side doc\n')
  const stray = edit('STATE.md', state)
  expect('F80: a stray file in .planning/ → told on any plan edit', stray, 'block')
  expect('…names it', says(stray, /\.planning\/NOTES\.md/), 'ok')
  rmSync(join(plan, 'NOTES.md'))
  expect('…gone → quiet (ppp.html, gitignored, never counts)', edit('STATE.md', state), 'allow')
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
  ctx(92, 's4')
  expect('F80: a save (its commit happens inside save.mjs) counts as a commit', told(runHook('session-moments.mjs', { hook_event_name: 'PostToolUse', session_id: 's4', tool_name: 'Bash', tool_input: { command: 'node ~/.claude/config/bmuz/scripts/save.mjs "F80: x"' } }), /Context is 92%/), 'told')
  process.env.BMUZ_CTX_DIR = CTX
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
    return runHook('stop-plan-check.mjs', { hook_event_name: 'Stop', transcript_path: path, session_id: `plan${n}`, stop_hook_active: false, ...extra })
  }
  const commitCmd = tool('Bash', { command: 'git add -A && git commit -m "blue button"' })
  commitFile(repo, 'src/button.ts', 'export const blue = 1\n', 'blue button')
  expect('code committed, SPRINT.md untouched → sent back', stop([commitCmd]), 'block')
  expect('…unless SPRINT.md was edited this turn', stop([commitCmd, tool('Edit', { file_path: join(repo, '.planning', 'SPRINT.md') })]), 'allow')
  const stuck = { session_id: 'stuck', stop_hook_active: true }
  expect('F80: still not fixed after being sent back → sent back again', (stop([commitCmd], { session_id: 'stuck' }), stop([commitCmd], stuck)), 'block')
  expect('…3rd time', stop([commitCmd], stuck), 'block')
  expect('…then lets the turn end (no endless loop)', stop([commitCmd], stuck), 'allow')
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
  writeFileSync(lookback, good + '- forgot the phone test → checklist: .planning/SPRINT.md (added a line)\n')
  expect('F80: "→ checklist" without its kind (② / ③) → sent back', stop([wroteLookback]), 'block')
  writeFileSync(lookback, good + '- forgot the phone test → checklist: .planning/SPRINT.md (③ only Muzzy can judge it on his phone)\n')
  expect('…with "(③ why)" → allowed', stop([wroteLookback]), 'allow')
  writeFileSync(lookback, good + '- hooks file → hook: ~/.claude/settings.json (wired)\n')
  expect('a ~/ home path is read from the home folder', stop([wroteLookback]), 'allow')
  expect('look-back written in an earlier turn → milestone allowed', stop([tagMilestone]), 'allow')
  writeFileSync(join(gitDir, 'bmuz-ppp-rebuilt'), 'later')
  expect('only ROADMAP edited, planner rebuilt, not republished → sent back (review)', stop([tool('Edit', { file_path: join(repo, '.planning', 'ROADMAP.md') })]), 'block')
  rmSync(root, { recursive: true, force: true })

  // F80 — in a fresh project (no look-back yet, no planner page)
  const fresh = makeRepo()
  const r = fresh.repo
  mkdirSync(join(r, '.planning'))
  writeFileSync(join(r, '.planning', 'ROADMAP.md'), '# T — Roadmap\n## v0.1 — Cards ← current\n- 🔨 F02 🎮 Cards — must · needs: — · sprint 1\n')
  writeFileSync(join(r, '.planning', 'SPRINT.md'), sprint)
  sh(r, 'add', '-A'); sh(r, 'commit', '-q', '-m', 'plan'); sh(r, 'push', '-q')
  const turnStart = new Date(Date.now() + 1000).toISOString() // this turn begins after the setup
  const inFresh = (tools, session) => {
    const path = join(fresh.root, `f${n++}.jsonl`)
    writeFileSync(path, [{ ...prompt, timestamp: turnStart }, ...tools.map(t => ({ ...t, cwd: r }))].map(e => JSON.stringify(e)).join('\n'))
    return runHook('stop-plan-check.mjs', { hook_event_name: 'Stop', transcript_path: path, session_id: session || `fresh${n}` })
  }
  const releaseCmd = tool('Bash', { command: 'node ~/.claude/config/bmuz/scripts/release.mjs milestone "Cards"' })
  const tagAt = (name, when) => execFileSync('git', ['-C', r, 'tag', '-a', name, '-m', name], { env: { ...process.env, GIT_COMMITTER_DATE: when.toISOString() } })
  tagAt('v0.0.0', new Date(Date.now() - 86_400_000)) // a milestone from yesterday
  expect('F80: release.mjs ran but made no new milestone tag (an old one exists) → no look-back needed', inFresh([releaseCmd]), 'allow')
  tagAt('v0.1.0', new Date(Date.now() + 2000)) // made by release.mjs inside its own process, this turn
  expect('F80: release.mjs made a milestone tag (v0.1.0) this turn, no look-back → sent back (audit: it never fired)', inFresh([releaseCmd]), 'block')
  tagAt('v0.1.1', new Date(Date.now() + 2000))
  sh(r, 'tag', '-d', 'v0.1.0')
  expect('…an update tag (v0.1.1) needs no look-back', inFresh([releaseCmd]), 'allow')
  // an approved feature that isn't saved
  commitFile(r, 'src/cards.ts', 'export const cards = 1\n', 'F02: done')
  const doneCmd = tool('Bash', { command: 'git add -A && git commit -m "F02: done"' })
  const tick = tool('Edit', { file_path: join(r, '.planning', 'SPRINT.md') })
  const unsaved = inFresh([doneCmd, tick])
  expect('F80: `F02: done` committed, not pushed → sent back to /save', unsaved, 'block')
  expect('…says /save', { result: /\/save/.test(unsaved.message) ? 'ok' : 'no', message: unsaved.message }, 'ok')
  sh(r, 'push', '-q')
  expect('…pushed (/save ran) → allowed', inFresh([doneCmd, tick]), 'allow')
  // the sprint's features are all ✅ but SPRINT.md is still there
  writeFileSync(join(r, '.planning', 'ROADMAP.md'), '# T — Roadmap\n## v0.1 — Cards ← current\n- ✅ F02 🎮 Cards — must · needs: — · sprint 1\n')
  const finished = inFresh([tool('Edit', { file_path: join(r, '.planning', 'ROADMAP.md') })])
  expect('F80: every sprint feature ✅ in ROADMAP, sprint not archived → sent back', finished, 'block')
  expect('…names archive-sprint.mjs', { result: /archive-sprint\.mjs/.test(finished.message) ? 'ok' : 'no', message: finished.message }, 'ok')
  expect('review: no Retro yet → the step is to ASK Muzzy the 3-line retro (archive-sprint would refuse)', { result: /ask Muzzy the 3-line retro/.test(finished.message) ? 'ok' : 'no', message: finished.message }, 'ok')
  const asking = join(fresh.root, 'asking.jsonl')
  writeFileSync(asking, [{ ...prompt, timestamp: turnStart }, { ...tool('Edit', { file_path: join(r, '.planning', 'ROADMAP.md') }), cwd: r }, { type: 'assistant', message: { content: [{ type: 'text', text: 'Sprint done. Before I archive it — your retro: what went well, what went wrong, one thing to change?' }] } }].map(e => JSON.stringify(e)).join('\n'))
  expect('review: …a turn that ends by asking for the retro → allowed (waiting on Muzzy, not bounced)', runHook('stop-plan-check.mjs', { hook_event_name: 'Stop', transcript_path: asking, session_id: 'asking' }), 'allow')
  writeFileSync(join(r, '.planning', 'SPRINT.md'), readFileSync(join(r, '.planning', 'SPRINT.md'), 'utf8') + '\n## Retro\n- **went well:** quick\n- **went wrong:** nothing\n- **change:** smaller sprints\n')
  expect('…retro written (Obsidian style: "## Retro", bold labels) → "archive it"', { result: /archive it/.test(inFresh([tool('Edit', { file_path: join(r, '.planning', 'ROADMAP.md') })]).message) ? 'ok' : 'no', message: '' }, 'ok')
  writeFileSync(join(r, '.planning', 'BUGS.md'), '# T — Bugs\nOpen: 1 (P0 0 · P1 1 · P2 0 · P3 0)\n## Open\n### B004 · P1 · open · found 2026-10-19\nx\n')
  const withBugs = inFresh([tool('Edit', { file_path: join(r, '.planning', 'ROADMAP.md') })])
  expect('F80: …with an open P1 → the message offers the /bug sweep with the counts', { result: /1 P1/.test(withBugs.message) && /\/bug sweep/.test(withBugs.message) ? 'ok' : 'no', message: withBugs.message }, 'ok')
  rmSync(join(r, '.planning', 'SPRINT.md'))
  expect('…archived (no SPRINT.md) → allowed', inFresh([tool('Edit', { file_path: join(r, '.planning', 'ROADMAP.md') })]), 'allow')
  // F80: a new data file under content/ is listed in the TDD
  writeFileSync(join(r, '.planning', 'TDD.md'), '# TDD\n## 3. Data files\n- `content/tuning/` — every tuning knob\n')
  mkdirSync(join(r, 'content', 'tuning'), { recursive: true }); mkdirSync(join(r, 'content', 'lessons'), { recursive: true })
  sh(r, 'add', '-A'); sh(r, 'commit', '-q', '-m', 'tdd'); sh(r, 'push', '-q')
  writeFileSync(join(r, 'content', 'lessons', 'visor.json'), '{}\n')
  const writeLesson = tool('Write', { file_path: join(r, 'content', 'lessons', 'visor.json') })
  const unlisted = inFresh([writeLesson])
  expect('F80: a new content/lessons/visor.json the TDD does not mention → sent back', unlisted, 'block')
  expect('…names the file and the TDD', { result: /content\/lessons\/visor\.json/.test(unlisted.message) && /TDD/.test(unlisted.message) ? 'ok' : 'no', message: unlisted.message }, 'ok')
  // review: an untracked draft from BEFORE this turn (Muzzy still writing it) doesn't send every turn back
  const laterTurn = join(fresh.root, 'later-turn.jsonl')
  writeFileSync(laterTurn, [{ ...prompt, timestamp: new Date(Date.now() + 60_000).toISOString() }, { ...tool('Edit', { file_path: join(r, '.planning', 'ROADMAP.md') }), cwd: r }].map(e => JSON.stringify(e)).join('\n'))
  expect('review: an untracked content/ file made before this turn → allowed', runHook('stop-plan-check.mjs', { hook_event_name: 'Stop', transcript_path: laterTurn, session_id: 'draft' }), 'allow')
  writeFileSync(join(r, 'content', 'tuning', 'speed.json'), '{}\n')
  rmSync(join(r, 'content', 'lessons'), { recursive: true })
  expect('…a new file in a folder the TDD already lists (content/tuning/) → allowed', inFresh([tool('Write', { file_path: join(r, 'content', 'tuning', 'speed.json') })]), 'allow')
  rmSync(join(r, 'content', 'tuning', 'speed.json'))
  // F80: a changed sketch goes out with the planner
  writeFileSync(join(r, '.planning', 'STATE.md'), '## ▶ RESUME HERE\nx\n**Planner (PPP):** https://claude.ai/artifact/fff111\n')
  sh(r, 'add', '-A'); sh(r, 'commit', '-q', '-m', 'state'); sh(r, 'push', '-q')
  // F80: a release this turn (v0.1.1 was tagged above, "this turn") needs a live check on record
  const noLive = inFresh([releaseCmd])
  expect('F80: a release tag made this turn, no .planning/live-pass → sent back to live-check.mjs', noLive, 'block')
  expect('…names live-check.mjs and the tag', { result: /live-check\.mjs/.test(noLive.message) && /v0\.1\.1/.test(noLive.message) ? 'ok' : 'no', message: noLive.message }, 'ok')
  writeFileSync(join(r, '.planning', 'live-pass'), 'abc123\nv0.1.0 https://x.github.io/t/\n2026-10-19T10:00:00Z\n')
  expect('…a live-pass for an OLDER tag → still sent back', inFresh([releaseCmd]), 'block')
  writeFileSync(join(r, '.planning', 'live-pass'), 'abc123\nv0.1.1 skipped — Release: none (library)\n2026-10-19T10:00:00Z\n')
  expect('…a live-pass naming the new tag (a recorded skip counts) → allowed', inFresh([releaseCmd]), 'allow')
  writeFileSync(join(r, '.planning', 'live-pass'), 'abc123\nv0.1.1 https://x.github.io/t/\n2026-10-19T10:00:00Z\nconsole: smoke:live\n')
  expect('…a real live pass for it → allowed', inFresh([releaseCmd]), 'allow')
  const sketch = join(r, '.planning', 'research', 'sketches', 'goo.html')
  const editSketch = tool('Write', { file_path: sketch })
  const sketchUnsent = inFresh([editSketch])
  expect('F80: a sketch written, planner not republished with it → sent back', sketchUnsent, 'block')
  expect('…shows the files entry to send', { result: /"sketches\/goo\.html": "\.planning\/research\/sketches\/goo\.html"/.test(sketchUnsent.message) ? 'ok' : 'no', message: sketchUnsent.message }, 'ok')
  const ppp = (files) => tool('Artifact', { file_path: join(r, '.planning', 'ppp.html'), url: 'https://claude.ai/artifact/fff111', ...(files ? { files } : {}) })
  expect('…republished WITHOUT the sketch in files → still sent back', inFresh([editSketch, ppp()]), 'block')
  expect('…republished with it → allowed', inFresh([editSketch, ppp({ 'sketches/goo.html': '.planning/research/sketches/goo.html' })]), 'allow')
  rmSync(fresh.root, { recursive: true, force: true })
}

// F78: no secret in a commit; ask before checkout / restore throws uncommitted changes away
function testGuardGitSafety() {
  console.log('guard-git — safety guards (F78)')
  const { root, repo } = makeRepo()
  const g = cmd => runHook('guard-git.mjs', bash(repo, cmd))
  sh(repo, 'checkout', '-q', 'dev/open')
  writeFileSync(join(repo, '.env'), 'SECRET=1\n')
  expect('`git add -A && git commit` with an unignored .env → blocked', g('git add -A && git commit -m "wip"'), 'deny')
  expect('`git add .env && git commit` → blocked', g('git add .env && git commit -m "wip"'), 'deny')
  expect('a commit that leaves the .env out (nothing added) → allowed', g('git commit -m "wip"'), 'allow')
  rmSync(join(repo, '.env'))
  writeFileSync(join(repo, '.env.example'), 'SECRET=\n')
  expect('.env.example → allowed', g('git add -A && git commit -m "example"'), 'allow')
  rmSync(join(repo, '.env.example'))
  mkdirSync(join(repo, '.playwright-mcp')); writeFileSync(join(repo, '.playwright-mcp', 'shot.png'), 'x')
  const pw = g('git add -A && git commit -m "wip"')
  expect('.playwright-mcp/ leftovers in the commit → blocked', pw, 'deny')
  expect('…says what and why in plain words', { result: /\.playwright-mcp\/shot\.png/.test(pw.message) && /never go into git/.test(pw.message) ? 'ok' : 'no', message: pw.message }, 'ok')
  expect('`git add .playwright-mcp && git commit` (the folder named) → blocked', g('git add .playwright-mcp && git commit -m "wip"'), 'deny')
  rmSync(join(repo, '.playwright-mcp'), { recursive: true })
  writeFileSync(join(repo, 'server.pem'), 'key')
  expect('a key file (*.pem) → blocked (PowerShell)', runHook('guard-git.mjs', pwsh(repo, 'git add -A; git commit -m "k"')), 'deny')
  rmSync(join(repo, 'server.pem'))
  mkdirSync(join(repo, 'config')); writeFileSync(join(repo, 'config', 'credentials.json'), '{}')
  expect('credentials.json in a subfolder → blocked', g('git add -A && git commit -m "y"'), 'deny')
  rmSync(join(repo, 'config'), { recursive: true })

  // ask before throwing uncommitted changes away
  writeFileSync(join(repo, 'a.txt'), 'edited, never committed\n')
  const co = g('git checkout -- a.txt')
  expect('`git checkout -- a.txt` over an uncommitted edit → asks', co, 'ask')
  expect('…names the file and what is lost', { result: /a\.txt/.test(co.message) && /for good/.test(co.message) ? 'ok' : 'no', message: co.message }, 'ok')
  expect('`git checkout .` → asks', g('git checkout .'), 'ask')
  expect('`git checkout a.txt` (a file, not a branch) → asks', g('git checkout a.txt'), 'ask')
  expect('`git checkout main -- a.txt` → asks', g('git checkout main -- a.txt'), 'ask')
  expect('`git restore a.txt` → asks', g('git restore a.txt'), 'ask')
  expect('`git restore .` (PowerShell) → asks', runHook('guard-git.mjs', pwsh(repo, 'git restore .')), 'ask')
  expect('`git checkout -f main` → asks', g('git checkout -f main'), 'ask')
  expect('bare `git checkout -f` (no branch) → asks (review)', g('git checkout -f'), 'ask')
  expect('bare `git checkout --force` → asks (review)', g('git checkout --force'), 'ask')
  expect('`git restore --staged a.txt` (only unstages) → allowed', g('git restore --staged a.txt'), 'allow')
  expect('a plain branch switch `git checkout main` → allowed', g('git checkout main'), 'allow')
  expect('`git checkout -b dev/new` → allowed', g('git checkout -b dev/new'), 'allow')
  expect('`git checkout -- c.txt` (no uncommitted changes there) → allowed', g('git checkout -- c.txt'), 'allow')
  expect('ask + a force-push later on the same line → the refusal wins', g('git checkout -- a.txt && git push -f'), 'deny')
  sh(repo, 'add', 'a.txt')
  expect('staged edit, `git checkout -- a.txt` (copies the staged version back: nothing lost) → allowed', g('git checkout -- a.txt'), 'allow')
  expect('staged edit, `git checkout HEAD -- a.txt` → asks', g('git checkout HEAD -- a.txt'), 'ask')
  expect('staged edit, `git restore --staged --worktree a.txt` → asks', g('git restore --staged --worktree a.txt'), 'ask')
  rmSync(root, { recursive: true, force: true })
}

// F78: the end-of-turn cleanup deletes .playwright-mcp/ and nothing else
function testStopCleanup() {
  console.log('stop-cleanup — Playwright leftovers go at the end of a turn')
  const { root, repo } = makeRepo()
  const sub = join(repo, 'src')
  mkdirSync(join(repo, '.playwright-mcp')); writeFileSync(join(repo, '.playwright-mcp', 'page.yml'), 'x')
  mkdirSync(join(sub, '.playwright-mcp'), { recursive: true })
  mkdirSync(join(repo, 'playwright-mcp-notes')); mkdirSync(join(repo, '.playwright'))
  const out = runHook('stop-cleanup.mjs', { cwd: sub, hook_event_name: 'Stop', stop_hook_active: true })
  expect('never sends Claude back', out, 'allow')
  expect('.playwright-mcp/ in the project root → deleted (cwd was a subfolder)', { result: existsSync(join(repo, '.playwright-mcp')) ? 'still there' : 'gone', message: '' }, 'gone')
  expect('…and the one in the session folder itself', { result: existsSync(join(sub, '.playwright-mcp')) ? 'still there' : 'gone', message: '' }, 'gone')
  expect('look-alike folders (.playwright, playwright-mcp-notes) and files untouched', { result: existsSync(join(repo, '.playwright')) && existsSync(join(repo, 'playwright-mcp-notes')) && existsSync(join(repo, 'a.txt')) ? 'kept' : 'lost', message: '' }, 'kept')
  writeFileSync(join(repo, '.playwright-mcp'), 'a file, not a folder')
  runHook('stop-cleanup.mjs', { cwd: repo, hook_event_name: 'Stop' })
  expect('a FILE named .playwright-mcp is left alone', { result: existsSync(join(repo, '.playwright-mcp')) ? 'kept' : 'lost', message: '' }, 'kept')
  expect('no folder at all / no cwd → quiet', runHook('stop-cleanup.mjs', { hook_event_name: 'Stop' }), 'allow')
  rmSync(root, { recursive: true, force: true })
}

// F77: the session start names framework pieces that are behind the framework's newest
function testSessionStartUpdates() {
  console.log('session-start — "framework updates available" (F77)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-start-'))
  const fw = join(root, 'framework')
  const game = join(root, 'game')
  const put = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text) }
  put(join(fw, 'ui-kit', 'kit', 'VERSION'), '0.19.2\n')
  put(join(fw, 'devkit', 'kit', 'VERSION'), '0.20.3\n')
  put(join(fw, 'ai', 'kit', 'VERSION'), '0.2.1\n')
  put(join(game, 'package.json'), '{}')
  put(join(game, 'src', 'ui', 'kit', 'VERSION'), '0.19.0\ncommit b3626bf\n')
  put(join(game, 'src', 'devkit', 'VERSION'), '0.20.3\r\ncommit 7e80f0a\r\n')
  put(join(game, 'src', 'ai', 'kit', 'VERSION'), '0.10.0 (framework b3626bf)\n') // ahead of this checkout (0.10 > 0.2)
  execFileSync('git', ['init', '-q', game])
  const start = (framework) => {
    const env = { ...process.env, CLAUDE_PROJECT_DIR: game, BMUZ_NO_PULL: '1' }
    if (framework) env.BMUZ_FRAMEWORK = framework.split('\\').join('/'); else delete env.BMUZ_FRAMEWORK
    const r = spawnSync('bash', [join(HOOKS, '..', 'session-start.sh')], { input: '{"source":"startup"}', encoding: 'utf8', env, timeout: 60_000 })
    const line = (r.stdout || '').split('\n').find(l => l.startsWith('Framework updates available')) || ''
    return { result: line ? 'named' : 'quiet', message: line || r.stdout || r.stderr || '' }
  }
  const behind = start(fw)
  expect('a copy behind the framework → named in one line', behind, 'named')
  expect('…"UI kit 0.19.0 → 0.19.2" and how to update; current Dev Kit and an ahead AI not named', { result: behind.message.includes('UI kit 0.19.0 → 0.19.2') && /install-module/.test(behind.message) && !/Dev Kit|AI/.test(behind.message) ? 'ok' : 'no', message: behind.message }, 'ok')
  put(join(game, 'src', 'ui', 'kit', 'VERSION'), '0.19.2\ncommit x\n')
  expect('every copy current → quiet', start(fw), 'quiet')
  put(join(game, 'src', 'ui', 'kit', 'VERSION'), '0.18.9\n')
  expect('no framework folder on this machine → quiet', start(join(root, 'nope')), 'quiet')
  rmSync(join(game, 'package.json'))
  expect('not a game (no package.json) → quiet', start(fw), 'quiet')
  rmSync(root, { recursive: true, force: true })
}

// F80: Muzzy stopping + unpushed work → the turn can't end until it's saved
function testStopUnsaved() {
  console.log('stop-unsaved — nothing left unpushed when Muzzy walks away')
  const { root, repo } = makeRepo()
  const ctx = join(root, 'ctx'); mkdirSync(ctx)
  let n = 0
  const run = (prompts, { cwd = repo, session = 's1', tools = [] } = {}) => {
    const path = join(root, `t${n++}.jsonl`)
    const entries = [...prompts.map(p => ({ type: 'user', message: { content: p } })), ...tools.map(t => ({ type: 'assistant', cwd, message: { content: [{ type: 'tool_use', ...t }] } }))]
    writeFileSync(path, entries.map(e => JSON.stringify(e)).join('\n'))
    const out = spawnSync('node', [join(HOOKS, 'stop-unsaved.mjs')], { input: JSON.stringify({ hook_event_name: 'Stop', cwd, session_id: session, transcript_path: path }), encoding: 'utf8', env: { ...process.env, BMUZ_CTX_DIR: ctx, CLAUDE_PROJECT_DIR: '' } })
    const text = (out.stdout || '').trim()
    return text ? { result: JSON.parse(text).decision, message: JSON.parse(text).reason } : { result: 'allow', message: out.stderr || '' }
  }
  const stop = (said, opts) => run([said], opts)
  const says = (got, re) => ({ result: re.test(got.message) ? 'ok' : 'no', message: got.message })
  expect('stopping, everything pushed → allowed', stop('ok going to bed, night!'), 'allow')
  writeFileSync(join(repo, 'new.txt'), 'x\n')
  const dirty = stop('switching to the laptop')
  expect('stopping, an uncommitted file → sent back', dirty, 'block')
  expect('…names it and says /save', says(dirty, /1 file\(s\) changed[\s\S]*\/save/), 'ok')
  expect('not stopping ("make the button blue") → allowed', stop('make the button blue'), 'allow')
  expect('"I\'m done with the menu, next the HUD" is not stopping → allowed', stop("I'm done with the menu, next the HUD"), 'allow')
  expect('"I\'m done for tonight" → sent back', stop("I'm done for tonight", { session: 's0' }), 'block')
  sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'new')
  const ahead = stop('done for now', { session: 's2' })
  expect('committed but not pushed → sent back', ahead, 'block')
  expect('…"1 commit(s) on main that GitHub doesn\'t have"', says(ahead, /1 commit\(s\) on main/), 'ok')
  expect('a helper report after "going to bed — finish it" → still guarded', run(['going to bed — finish it', '<task-notification>helper done</task-notification>'], { session: 's3' }), 'block')
  expect('sent back a 2nd time', stop('done for now', { session: 's2' }), 'block')
  expect('…a 3rd time', stop('done for now', { session: 's2' }), 'block')
  expect('…then lets go (a push that can\'t work must not trap the session)', stop('done for now', { session: 's2' }), 'allow')
  sh(repo, 'push', '-q')
  expect('pushed → allowed', stop('done for now', { session: 's2' }), 'allow')
  sh(repo, 'checkout', '-q', '-b', 'dev/new')
  expect('a branch never pushed → sent back', stop('good night', { session: 's4' }), 'block')
  sh(repo, 'push', '-q', '-u', 'origin', 'dev/new')
  // another repo worked in this turn counts too; a repo with no remote only needs committing
  const other = join(root, 'other'); execFileSync('git', ['init', '-q', other]); sh(other, 'config', 'user.email', 't@e.com'); sh(other, 'config', 'user.name', 't')
  writeFileSync(join(other, 'a.txt'), 'a\n'); sh(other, 'add', '.'); sh(other, 'commit', '-q', '-m', 'one')
  expect('no remote, all committed → allowed', stop('signing off', { cwd: other, session: 's5' }), 'allow')
  writeFileSync(join(other, 'b.txt'), 'b\n')
  expect('a repo edited this turn (not the session folder) with uncommitted work → sent back', stop('signing off', { session: 's6', tools: [{ name: 'Write', input: { file_path: join(other, 'b.txt') } }] }), 'block')
  rmSync(root, { recursive: true, force: true })
}

// F80: a new rule line in BMUZ's own instructions says how it happens (① ② ③)
function testRuleKind() {
  console.log('rule-kind — every new rule says how it happens')
  const home = mkdtempSync(join(tmpdir(), 'bmuz-rulekind-'))
  const skill = join(home, '.claude', 'skills', 'save', 'SKILL.md')
  mkdirSync(dirname(skill), { recursive: true })
  const env = { ...process.env, BMUZ_HOME: home }
  const run = (input) => {
    const out = spawnSync('node', [join(HOOKS, 'rule-kind.mjs')], { input: JSON.stringify(input), encoding: 'utf8', env })
    const text = (out.stdout || '').trim()
    return text ? { result: JSON.parse(text).decision, message: JSON.parse(text).reason } : { result: 'allow', message: out.stderr || '' }
  }
  const edit = (file, oldText, newText) => run({ tool_name: 'Edit', tool_input: { file_path: file, old_string: oldText, new_string: newText } })
  writeFileSync(skill, '# /save\n- Always run the tests first.\n')
  const told = edit(skill, 'x', '- Always run the tests first.\n- Never push on Fridays.')
  expect('a new "never…" line without a mark → Claude told', told, 'block')
  expect('…names the line and the three kinds', { result: /Never push on Fridays/.test(told.message) && /①/.test(told.message) && /③/.test(told.message) ? 'ok' : 'no', message: told.message }, 'ok')
  expect('a new rule line marked ① → quiet', edit(skill, 'x', '- Always run the tests ① (save.mjs does it).'), 'allow')
  expect('an unmarked rule line that was already there (in old_string too) → quiet (old lines are the audit\'s)', edit(skill, '- Must stay.\nold', '- Must stay.\nnew words'), 'allow')
  expect('a line with no rule word → quiet', edit(skill, 'x', '- Lists the open bugs.'), 'allow')
  expect('review: a scope tag "— must:alpha" in an example ROADMAP line → quiet', edit(skill, 'x', '- 🔨 F08 🎮 Splayed cards — must:alpha · needs: F07'), 'allow')
  const hooksDoc = join(home, '.claude', 'config', 'bmuz', 'HOOKS.md')
  mkdirSync(dirname(hooksDoc), { recursive: true })
  writeFileSync(hooksDoc, '| 5 ① | When Claude stops | Runs the check. Never "done" on broken code |\n')
  expect('found in use: an edit to the MIDDLE of a line whose mark sits earlier on it ("| 5 ① | …") → quiet', edit(hooksDoc, 'Runs the check', 'Runs the check. Never "done" on broken code'), 'allow')
  expect('a rule word inside a code block → quiet', edit(skill, 'x', '```\nalways run me\n```'), 'allow')
  expect('MultiEdit is checked too', run({ tool_name: 'MultiEdit', tool_input: { file_path: skill, edits: [{ old_string: 'a', new_string: '- Make sure the build is green.' }] } }), 'block')
  expect('a game file (not BMUZ instructions) → quiet', edit(join(home, 'game', 'README.md'), 'x', '- Always wear a hat.'), 'allow')
  expect('a review report (config/bmuz/reviews) → quiet', edit(join(home, '.claude', 'config', 'bmuz', 'reviews', 'a.md'), 'x', '- Always wear a hat.'), 'allow')
  expect('F80: the game-doc skeletons (templates/TDD.md) are not BMUZ rules → quiet', edit(join(home, '.claude', 'config', 'bmuz', 'templates', 'TDD.md'), 'x', '- Secrets never in the repo.'), 'allow')
  expect('…the hand-off template is watched', edit(join(home, '.claude', 'config', 'bmuz', 'templates', 'handoff.md'), 'x', '- Always wear a hat.'), 'block')
  expect('PROJECT-FILES.md is watched', edit(join(home, '.claude', 'config', 'bmuz', 'PROJECT-FILES.md'), 'x', '- Always wear a hat.'), 'block')
  // a Write is compared with the last synced copy (~/.claude-config): only lines new since then count
  const synced = join(home, '.claude-config', 'skills', 'save', 'SKILL.md')
  mkdirSync(dirname(synced), { recursive: true }); writeFileSync(synced, '# /save\n- Always run the tests first.\n')
  expect('Write: an old unmarked line (in the synced copy) → quiet', run({ tool_name: 'Write', tool_input: { file_path: skill, content: '# /save\n- Always run the tests first.\n- Lists bugs.\n' } }), 'allow')
  expect('Write: a new unmarked line → told', run({ tool_name: 'Write', tool_input: { file_path: skill, content: '# /save\n- Always run the tests first.\n- Remember to ping Muzzy.\n' } }), 'block')
  const all = spawnSync('node', [join(HOOKS, 'rule-kind.mjs'), '--all'], { encoding: 'utf8', env })
  expect('--all lists every unmarked rule line with a count', { result: /skills\/save\/SKILL\.md — 1/.test(all.stdout) && /1 rule line\(s\) without/.test(all.stdout) ? 'ok' : 'no', message: all.stdout }, 'ok')
  rmSync(home, { recursive: true, force: true })
}

// F80: a sketch keeps its sketch kit
function testSketchLint() {
  console.log('sketch-lint — a sketch keeps its kit')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-sketch-'))
  const dir = join(root, '.planning', 'research', 'sketches')
  mkdirSync(dir, { recursive: true })
  const starter = readFileSync(join(HOOKS, '..', 'templates', 'sketch', 'sketch-starter.html'), 'utf8')
  const good = starter.replace('S1: Sketch name', 'S2: Goo wobble').replace('One sentence: what this sketch tries, and what to look for when you play it.', 'Tries a softer wobble; watch the corners.')
  const write = (name, html) => { writeFileSync(join(dir, name), html); return runHook('sketch-lint.mjs', { hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: join(dir, name) } }) }
  expect('the starter with a real title + description → quiet', write('goo.html', good), 'allow')
  const placeholder = write('new.html', starter)
  expect('the starter\'s placeholder title / description left in → told', placeholder, 'block')
  expect('…names both', { result: /S1: Sketch name/.test(placeholder.message) && /placeholder sentence/.test(placeholder.message) ? 'ok' : 'no', message: placeholder.message }, 'ok')
  const noCopy = write('nocopy.html', good.split('Copy values for Claude').join('Copy'))
  expect('"Copy values for Claude" button gone → told', noCopy, 'block')
  expect('no presets, no help lines → told', write('bare.html', '<title>S3: x</title><meta name="description" content="y"><button>Copy values for Claude</button>'), 'block')
  expect('a sketch outside .planning/research/sketches → ignored', runHook('sketch-lint.mjs', { tool_name: 'Write', tool_input: { file_path: join(root, 'page.html') } }), 'allow')
  rmSync(root, { recursive: true, force: true })
}

// F80: session start shows this machine's to-do and the open "Ask Muzzy:" questions
function testSessionStartNotices() {
  console.log('session-start — machine to-do + Ask Muzzy (F80)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-start2-'))
  const hub = join(root, 'HUB.md')
  writeFileSync(hub, '# Hub\n## Projects\n- x\n## 📌 Machine to-do (Claude: do the list for THIS machine)\n\n### Laptop (user joebr) — added 2026-09-30\n- [ ] 1. pull the setup\n- [x] 2. done already\n- [ ] 3. clone glyphtender-original\n\n### PC (user Muzzy)\n- [ ] 1. PC thing\n## Next section\n')
  const game = join(root, 'game')
  mkdirSync(join(game, '.planning'), { recursive: true })
  writeFileSync(join(game, '.planning', 'STATE.md'), '## ▶ RESUME HERE\nF08 next\n## Where we are\nx\n')
  writeFileSync(join(game, '.planning', 'SPRINT.md'), '# Sprint 04 — x\n## F08 🎮 Fan\n- [ ] 🤖 1. a\nAsk Muzzy: should cards tilt on hover?\n## F09 🎮 Pile\nAsk Muzzy: —\n')
  execFileSync('git', ['init', '-q', game])
  const start = (user, source = 'startup') => {
    const env = { ...process.env, CLAUDE_PROJECT_DIR: game, BMUZ_NO_PULL: '1', BMUZ_HUB: hub, USERNAME: user, USER: user }
    const r = spawnSync('bash', [join(HOOKS, '..', 'session-start.sh')], { input: `{"source":"${source}"}`, encoding: 'utf8', env, timeout: 60_000 })
    return r.stdout || r.stderr || ''
  }
  const laptop = start('joebr')
  expect('the laptop (joebr) gets its own to-do: the 2 open items, not the ticked one or the PC\'s', { result: /Machine to-do/.test(laptop) && /pull the setup/.test(laptop) && /clone glyphtender-original/.test(laptop) && !/done already/.test(laptop) && !/PC thing/.test(laptop) ? 'ok' : 'no', message: laptop }, 'ok')
  const pc = start('Muzzy')
  expect('the PC (Muzzy) gets the PC\'s item only', { result: /PC thing/.test(pc) && !/pull the setup/.test(pc) ? 'ok' : 'no', message: pc }, 'ok')
  expect('a machine with nothing listed → no to-do line', { result: /Machine to-do/.test(start('someone')) ? 'no' : 'ok', message: '' }, 'ok')
  expect('the open "Ask Muzzy:" question is shown; an empty one ("—") is not', { result: /should cards tilt on hover/.test(laptop) && !/Ask Muzzy: —/.test(laptop) ? 'ok' : 'no', message: laptop }, 'ok')
  expect('after /clear (source clear) the to-do is not repeated', { result: /Machine to-do/.test(start('joebr', 'clear')) ? 'no' : 'ok', message: '' }, 'ok')
  rmSync(root, { recursive: true, force: true })
}

// F81: the producer's eye — the sprint line every session, plus only the lines that need attention
function testSessionStartProducer() {
  console.log('session-start — producer notes: sprint line + attention lines (F81)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-producer-'))
  const put = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text) }
  // a local YYYY-MM-DD n days from today (negative = ago), the way the helper counts days
  const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  const commitAt = (repo, daysAgo, message) => {
    const when = `${day(-daysAgo)}T12:00:00`
    execFileSync('git', ['-C', repo, 'add', '-A'], { stdio: 'ignore' })
    execFileSync('git', ['-C', repo, 'commit', '-q', '--allow-empty', '-m', message], { stdio: 'ignore', env: { ...process.env, GIT_AUTHOR_DATE: when, GIT_COMMITTER_DATE: when } })
  }
  const newRepo = (name) => {
    const repo = join(root, name)
    mkdirSync(repo, { recursive: true })
    execFileSync('git', ['init', '-q', repo]); sh(repo, 'config', 'user.email', 'test@example.com'); sh(repo, 'config', 'user.name', 'test')
    return repo
  }
  // A game 9 days into sprint 07: alpha due in 5 days, F08 untouched for 8 days, F09 worked on 2 days ago
  const game = (name, { target = day(5), f08Ago = 8, archived = true, extraSprint = '' } = {}) => {
    const repo = newRepo(name)
    put(join(repo, '.planning', 'STATE.md'), '## ▶ RESUME HERE\nF08 next\n')
    put(join(repo, '.planning', 'ROADMAP.md'), `# T — Roadmap\nRelease target: alpha\n## v0.2 — Proto  ✅ released 2026-01-01\n- ✅ F01 🧱 Base — must:prototype\n## v0.3 — Card play feels good  ← current  (→ alpha) · target: ${target}\n- ✅ F07 🧱 Hand — must:alpha\n- 🔨 F08 🎮 Splayed — must:alpha · needs: F07 · sprint 7\n- 🔨 F09 🎮 Pile — must:alpha · sprint 7\n- ⏳ F10 ❓ Which deck — must:alpha\n- ⏳ F11 ✨ Sparkle — could\n`)
    commitAt(repo, 60, 'start')
    if (archived) { // sprints 03–06; the last three took 3, 5 and 4 days → ~4; sprint 03 (10 days) is older than the last three
      for (const [nn, startAgo, doneAgo] of [['03', 60, 51], ['04', 40, 38], ['05', 30, 26], ['06', 20, 17]]) {
        put(join(repo, '.planning', 'archive', 'sprints', `sprint-${nn}.md`), `# Sprint ${nn} — x\nStarted ${day(-startAgo)} · Milestone v0.3\n`)
        commitAt(repo, doneAgo, `Sprint ${nn} done`)
      }
    }
    put(join(repo, '.planning', 'SPRINT.md'), `# Sprint 07 — cards feel good\nStarted ${day(-8)} · Milestone v0.3 · Features: F08, F09\n## F08 🎮 Splayed\n- [x] 🤖 1. Arc — src/a.ts\n- [ ] 🤖 2. Tune\n## F09 🎮 Pile\n- [ ] 🤖 1. Pile — src/b.ts\n${extraSprint}Ask Muzzy: —\n`)
    commitAt(repo, 8, 'Sprint 07: cards feel good')
    commitAt(repo, f08Ago, 'F08: arc layout')
    commitAt(repo, 2, 'F09: pile works')
    return repo
  }
  const start = (dir) => {
    const env = { ...process.env, CLAUDE_PROJECT_DIR: dir, BMUZ_NO_PULL: '1', BMUZ_HUB: join(root, 'no-hub.md') }
    const r = spawnSync('bash', [join(HOOKS, '..', 'session-start.sh')], { input: '{"source":"startup"}', encoding: 'utf8', env, timeout: 60_000 })
    const all = r.stdout || r.stderr || ''
    return { all, notes: all.split('\n').filter(l => /^(📅|  ⚠|  → producer)/.test(l)) }
  }
  const same = (name, got, want) => expect(name, { result: JSON.stringify(got.notes) === JSON.stringify(want) ? 'ok' : 'no', message: `${got.notes.join(' | ')}\n${got.all}` }, 'ok')

  same('9-day-old sprint, target in 5 days, F08 untouched 8 days → exactly the sprint line + those two lines', start(game('late')), [
    '📅 Sprint 07 · day 9 (the last 3 took ~4 days)',
    '  ⚠ alpha target: 5 days left · musts 1/3',
    '  ⚠ F08 hasn\'t moved in 8 days — ship it as is, or what\'s in the way?',
    '  → producer notes: bring the ⚠ lines up with Muzzy in plain words before starting work.',
  ])
  same('a healthy game (target a month out, F08 worked on yesterday) → only the sprint line', start(game('healthy', { target: day(30), f08Ago: 1 })), [
    '📅 Sprint 07 · day 9 (the last 3 took ~4 days)',
  ])
  same('no archived sprints yet → the sprint line without brackets', start(game('first', { target: day(30), f08Ago: 1, archived: false })), ['📅 Sprint 07 · day 9'])
  const overdue = start(game('overdue', { target: day(-3), f08Ago: 1 }))
  expect('target passed 3 days ago → "3 days overdue"', { result: overdue.notes.includes('  ⚠ alpha target: 3 days overdue · musts 1/3') ? 'ok' : 'no', message: overdue.notes.join(' | ') }, 'ok')
  // waiting on Muzzy: his open 🙋 task + P0/P1 fixes not yet verified (a fixed P2 and a verified P1 aren't his to check)
  const waitRepo = game('waiting', { target: day(30), f08Ago: 1, extraSprint: '- [ ] 🙋 2. Stand-in card fronts (stand-in)\n- [x] 🙋 3. Done already\n' })
  put(join(waitRepo, '.planning', 'BUGS.md'), '# T — Bugs\n## Open\n### B011 · P2 · open · found x\n## Fixed (newest first)\n### B010 · P0 · fixed 2026-10-01 · fixed in abc\n### B009 · P1 · fixed 2026-10-01 · fixed in abd\n### B008 · P2 · fixed 2026-10-01 · fixed in abe\n### B007 · P1 · verified 2026-10-01 · fixed in abf\n')
  const waiting = start(waitRepo)
  expect('waiting on Muzzy → "1 task (stand-in card fronts) · 2 fixes to check (B010, B009)"', { result: waiting.notes.includes('  ⚠ Waiting on you: 1 task (stand-in card fronts) · 2 fixes to check (B010, B009)') ? 'ok' : 'no', message: waiting.notes.join(' | ') }, 'ok')
  // review: a ❓ decision waits on Muzzy (not "stalled"); a feature added mid-sprint with no commits yet isn't stalled
  const decRepo = game('decision', { target: day(30), f08Ago: 1, extraSprint: '## F10 ❓ Which deck\n- [ ] 🙋 1. Pick one\n## F12 🎮 Late add\n- [ ] 🤖 1. x — src/c.ts\n' })
  put(join(decRepo, '.planning', 'ROADMAP.md'), readFileSync(join(decRepo, '.planning', 'ROADMAP.md'), 'utf8').replace('- ⏳ F10 ❓', '- 🔨 F10 ❓') + '- 🔨 F12 🎮 Late — could · sprint 7\n')
  const dec = start(decRepo)
  expect('review: a 🔨 ❓ decision and a mid-sprint addition with no commits → no "hasn\'t moved" lines', { result: !dec.notes.some(l => /hasn't moved/.test(l)) && dec.notes.some(l => /Waiting on you: 1 task \(pick one\)/i.test(l)) ? 'ok' : 'no', message: dec.notes.join(' | ') }, 'ok')
  const futRepo = game('future', { target: day(30), f08Ago: 1 })
  put(join(futRepo, '.planning', 'SPRINT.md'), readFileSync(join(futRepo, '.planning', 'SPRINT.md'), 'utf8').replace(/Started \S+/, `Started ${day(5)}`))
  expect('review: a start date in the future (a typo) → no "day -4"', { result: start(futRepo).notes[0]?.startsWith('📅 Sprint 07 (') || start(futRepo).notes[0] === '📅 Sprint 07' ? 'ok' : 'no', message: start(futRepo).notes.join(' | ') }, 'ok')
  // a git repo that isn't a BMUZ project → no producer lines at all
  const plain = newRepo('plain'); put(join(plain, 'a.txt'), 'a\n'); commitAt(plain, 1, 'one')
  same('not a BMUZ project → nothing', start(plain), [])
  // a roadmap but no sprint running → no sprint line; a close target still shows
  const noSprint = game('nosprint'); rmSync(join(noSprint, '.planning', 'SPRINT.md'))
  same('no SPRINT.md → no sprint line, the close target still shows', start(noSprint), [
    '  ⚠ alpha target: 5 days left · musts 1/3',
    '  → producer notes: bring the ⚠ lines up with Muzzy in plain words before starting work.',
  ])
  rmSync(root, { recursive: true, force: true })
}

// F80: `checkup.sh --done` closes a checkup — refuses without today's report, then writes the date
function testCheckupDone() {
  console.log('checkup.sh --done — the close steps run by the script')
  const home = mkdtempSync(join(tmpdir(), 'bmuz-checkup-'))
  mkdirSync(join(home, '.claude', 'config', 'bmuz', 'reviews', 'checkups'), { recursive: true })
  writeFileSync(join(home, '.claude', 'config', 'bmuz', 'last-checkup'), '2026-01-01\n')
  const done = () => spawnSync('bash', [join(HOOKS, '..', 'checkup.sh'), '--done'], { encoding: 'utf8', env: { ...process.env, HOME: home }, timeout: 60_000 })
  const today = spawnSync('date', ['+%F'], { encoding: 'utf8' }).stdout.trim()
  const lastCheckup = () => readFileSync(join(home, '.claude', 'config', 'bmuz', 'last-checkup'), 'utf8').trim()
  const refused = done()
  expect('no report for today → refused (exit 1), date not written', { result: refused.status === 1 && /REFUSED/.test(refused.stdout) && lastCheckup() === '2026-01-01' ? 'ok' : 'no', message: refused.stdout + refused.stderr }, 'ok')
  writeFileSync(join(home, '.claude', 'config', 'bmuz', 'reviews', 'checkups', `${today}.md`), '🩺 BMUZ checkup\nHealthy: 12\n')
  const ok = done()
  expect('…report saved → today\'s date written', { result: ok.status === 0 && lastCheckup() === today ? 'ok' : 'no', message: ok.stdout + ok.stderr }, 'ok')
  expect('…and it says how to sync when config-sync.sh is missing', { result: /sync by hand/.test(ok.stdout) ? 'ok' : 'no', message: ok.stdout }, 'ok')
  rmSync(home, { recursive: true, force: true })
}

// F87: the QA routine — every sprint feature has a test plan (Check:), "done" records what was checked (Checked:),
// and a P1 that was open before the sprint started doesn't sit behind a note
function testQaRoutine() {
  console.log('QA routine — Check: / Checked: lines, old P1s (F87)')
  const says = (got, re) => ({ result: re.test(got.message) ? 'ok' : 'no', message: got.message })
  // plan-lint
  const { root, repo } = makeRepo()
  const plan = join(repo, '.planning')
  mkdirSync(plan)
  const roadmap = '# T — Roadmap\n## v0.1 — First ← current\n- ✅ F01 🧱 Base — must\n- 🔨 F02 🎮 Cards — must · needs: F01\n- 🔨 F03 ❓ Which deck?\n- ⏳ F05 ✨ Wiggle — could · needs: F02\n'
  const tasks = '- [ ] 🤖 1. Layout\n- [ ] 🤖 2. Hover\n- [ ] 🙋 3. Look at it\n'
  const sprint = `# Sprint 02 — cards\nStarted 2026-10-10 · Milestone v0.1 · Features: F02\n## F02 🎮 Cards\nDone when: x\n${tasks}- [ ] 🤖 4. Fix B002 (score off by one)\nCheck: e2e plays a hand · Muzzy fans 7 cards on his phone\n`
  const bugs = (extra = '', count = '1 (P0 0 · P1 1') => `# T — Bugs\nOpen: ${count} · P2 0 · P3 0)\n## Open\n### B002 · P1 · open · found 2026-10-01 in F02\nScore off by one\n${extra}## Fixed (newest first)\n`
  const state = '# State\n## ▶ RESUME HERE\nDoing F02.\n## Where we are\nStage: develop\n## Log\n- 2026-10-18 start\n'
  for (const [name, text] of Object.entries({ 'ROADMAP.md': roadmap, 'SPRINT.md': sprint, 'BUGS.md': bugs(), 'STATE.md': state })) writeFileSync(join(plan, name), text)
  writeFileSync(join(repo, '.gitignore'), '.planning/ppp.html\n')
  sh(repo, 'add', '-A'); sh(repo, 'commit', '-q', '-m', 'plan')
  const edit = (text) => { writeFileSync(join(plan, 'SPRINT.md'), text); return runHook('plan-lint.mjs', { cwd: repo, hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: join(plan, 'SPRINT.md') } }) }
  expect('a sprint whose features all have Check: → quiet', edit(sprint), 'allow')
  const noCheck = edit(sprint.replace(/Check: .*\n/, ''))
  expect('a feature without a "Check:" line → told', noCheck, 'block')
  expect('…names the feature and says what a check is', says(noCheck, /F02 has no "Check:" line/), 'ok')
  expect('a placeholder "Check: —" → told', edit(sprint.replace(/Check: .*\n/, 'Check: —\n')), 'block')
  expect('"**Check:** …" (bold) counts', edit(sprint.replace('Check:', '**Check:**')), 'allow')
  expect('review: "- Check: …" (a bullet) counts', edit(sprint.replace('Check:', '- Check:')), 'allow')
  expect('review: "**Check**: …" counts', edit(sprint.replace('Check:', '**Check**:')), 'allow')
  expect('a "## Carried to sprint 03 — … (F05)" section without Check: → quiet', edit(`${sprint}## Carried to sprint 03 — Wiggle (F05): not approved yet\nDone when: x\n`), 'allow')
  expect('a ❓ decision without Check: (its check is Muzzy\'s answer) → quiet', edit(`${sprint}## F03 ❓ Which deck?\n- [ ] 🙋 1. Pick one\n`), 'allow')
  const oldP1 = edit(sprint.replace('- [ ] 🤖 4. Fix B002 (score off by one)\n', '') + 'Notes: B002 waits for the art pass\n')
  expect('an open P1 found before the sprint started, only in a Notes line → told', oldP1, 'block')
  expect('…"B002 (P1) has been open since before this sprint"', says(oldP1, /B002 \(P1\) has been open since before this sprint/), 'ok')
  expect('…as a sprint task → quiet', edit(sprint), 'allow')
  writeFileSync(join(plan, 'BUGS.md'), bugs('### B003 · P1 · open · found 2026-10-12 in F02\nHover flickers\n', '2 (P0 0 · P1 2'))
  const newP1 = edit(`${sprint}Notes: B003 waits for the hover rework\n`)
  expect('a P1 found during the sprint, named in a Notes line → quiet', newP1, 'allow')
  const unnamed = edit(sprint)
  expect('…not named at all → the F80 rule (name it), not "since before this sprint"', { result: unnamed.result === 'block' && /P1 B003/.test(unnamed.message) && !/since before/.test(unnamed.message) ? 'ok' : 'no', message: unnamed.message }, 'ok')
  writeFileSync(join(plan, 'BUGS.md'), bugs().replace('B002 · P1', 'B002 · P2').replace('P1 1', 'P1 0').replace('P2 0', 'P2 1'))
  expect('the old bug lowered to P2 → quiet', edit(sprint.replace('- [ ] 🤖 4. Fix B002 (score off by one)\n', '')), 'allow')
  rmSync(root, { recursive: true, force: true })

  // guard-git: `F08: done` needs "Checked:" in F08's SPRINT section
  const g = makeRepo()
  const d = cmd => runHook('guard-git.mjs', bash(g.repo, cmd))
  sh(g.repo, 'checkout', '-q', 'dev/open')
  mkdirSync(join(g.repo, '.planning')); writeFileSync(join(g.repo, '.planning', 'STATE.md'), 'RESUME HERE: F08 next\n')
  sh(g.repo, 'add', '.'); sh(g.repo, 'commit', '-q', '-m', 'STATE: start')
  writeFileSync(join(g.repo, 'notes.md'), 'one\n'); sh(g.repo, 'add', '.'); sh(g.repo, 'commit', '-q', '-m', 'F08: first task')
  writeFileSync(join(g.repo, '.planning', 'STATE.md'), 'RESUME HERE: F08 done\nReviewed through: abc1234\n')
  const section = '## F08 🎮 Splayed\nDone when: x\n- [x] 🤖 1. a\nCheck: e2e plays a hand\n'
  const sprintFile = join(g.repo, '.planning', 'SPRINT.md')
  expect('review: "F08: done" with no SPRINT.md (never in a sprint — no Check: plan to record) → allowed', d('git add -A && git commit -m "F08: done"'), 'allow')
  writeFileSync(sprintFile, `# Sprint 04 — x\n${section}## F09 🎮 Pile\nChecked: e2e green\n`)
  const noChecked = d('git add -A && git commit -m "F08: done"')
  expect('"F08: done" without a "Checked:" line in its section (F09\'s doesn\'t count) → blocked', noChecked, 'deny')
  expect('…says to write "Checked:" with what was tested, in its own step first', says(noChecked, /"Checked:" line[\s\S]*own step/), 'ok')
  writeFileSync(sprintFile, `# Sprint 04 — x\n${section}Checked: —\n`)
  expect('a placeholder "Checked: —" → blocked', d('git add -A && git commit -m "F08: done"'), 'deny')
  writeFileSync(sprintFile, `# Sprint 04 — x\n${section}Checked: check:fast green · Muzzy fanned 7 cards on his phone\n`)
  expect('"Checked: check:fast green · Muzzy fanned 7 cards…" → allowed', d('git add -A && git commit -m "F08: done"'), 'allow')
  writeFileSync(sprintFile, `# Sprint 04 — x\n${section}Checked: e2e green\n## F09 🎮 Pile\n- [x] 🤖 1. b\nCheck: pile shows\n`)
  expect('"F08 + F09: done" when F09\'s section has no Checked: → blocked, names F09', says(d('git add -A && git commit -m "F08 + F09: done"'), /F09's section/), 'ok')
  expect('"F08: tick task" (not done) → allowed', d('git add -A && git commit -m "F08: tick task"'), 'allow')
  // review fixes
  writeFileSync(sprintFile, `# Sprint 04 — x\n${section}- Checked: e2e green · Muzzy tried it\n`)
  expect('review: "- Checked: …" as a bullet (how check notes were long written) → allowed', d('git add -A && git commit -m "F08: done"'), 'allow')
  writeFileSync(sprintFile, `# Sprint 04 — x\n${section}**Checked**: e2e green\n`)
  expect('review: "**Checked**: …" → allowed', d('git add -A && git commit -m "F08: done"'), 'allow')
  writeFileSync(sprintFile, `# Sprint 04 — x\n${section}`)
  expect('review: lowercase "f08: done" is still checked (it used to crash the hook → no check at all) → blocked', d('git add -A && git commit -m "f08: done"'), 'deny')
  // archived before the done commit: F08's section is in the newest archived sprint
  rmSync(sprintFile)
  mkdirSync(join(g.repo, '.planning', 'archive', 'sprints'), { recursive: true })
  writeFileSync(join(g.repo, '.planning', 'archive', 'sprints', 'sprint-04.md'), `# Sprint 04 — x\n${section}`)
  expect('review: sprint archived first, F08 there without Checked: → blocked', d('git add -A && git commit -m "F08: done"'), 'deny')
  writeFileSync(join(g.repo, '.planning', 'archive', 'sprints', 'sprint-04.md'), `# Sprint 04 — x\n${section}Checked: green\n`)
  expect('review: …with Checked: in the archived sprint → allowed', d('git add -A && git commit -m "F08: done"'), 'allow')
  rmSync(g.root, { recursive: true, force: true })
}

// F82: is the live game up? — a local host stands in for the live site and the room server
function testLivePing() {
  console.log('live-ping — session start says DOWN only when it is (F82)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-live-ping-'))
  const ready = join(root, 'ready')
  // /up 200 · /broken 500 · /slow answers after 10 s · /rooms-up/health 200 · /rooms-old/health the worker's own
  // 404 · /rooms-gone/health Cloudflare's "no such worker" 404 (as JSON, the way it answers Accept: application/json)
  writeFileSync(join(root, 'host.mjs'), [
    "import http from 'node:http'; import { writeFileSync } from 'node:fs'",
    'const server = http.createServer((q, s) => {',
    "  const path = q.url.split('?')[0]",
    "  if (path === '/up/' || path === '/rooms-up/health') { s.writeHead(200); return s.end('ok') }",
    "  if (path === '/broken/') { s.writeHead(500); return s.end('oops') }",
    "  if (path === '/slow/') { setTimeout(() => { s.writeHead(200); s.end('late') }, 10_000); return }",
    "  if (path === '/rooms-old/health') { s.writeHead(404); return s.end('Not found') }",
    "  if (path === '/rooms-gone/health') { s.writeHead(404, { 'content-type': 'application/json' }); return s.end(JSON.stringify({ title: 'Error 1042: Cloudflare Error', status: 404 })) }",
    "  s.writeHead(404); s.end('nope')",
    '})',
    `server.listen(0, '127.0.0.1', () => writeFileSync(${JSON.stringify(ready)}, String(server.address().port)))`,
  ].join('\n'))
  const host = spawn(process.execPath, [join(root, 'host.mjs')], { stdio: 'ignore' })
  for (let i = 0; i < 100 && !existsSync(ready); i++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50)
  const base = `http://127.0.0.1:${readFileSync(ready, 'utf8')}`
  const game = join(root, 'game')
  mkdirSync(join(game, '.planning'), { recursive: true })
  // Runs the hook on a STATE; 'quiet' when it prints nothing, else 'down' + the lines
  const ping = (state, env = {}) => {
    writeFileSync(join(game, '.planning', 'STATE.md'), state)
    const started = Date.now()
    const out = spawnSync('node', [join(HOOKS, 'live-ping.mjs'), game], { encoding: 'utf8', timeout: 20_000, env: { ...process.env, BMUZ_ONLINE_PROBE: 'localhost', ...env } })
    const text = `${out.stdout || ''}${out.stderr || ''}`.trim()
    return { result: out.status !== 0 ? `exit ${out.status}` : text ? 'down' : 'quiet', message: text, ms: Date.now() - started }
  }
  const state = (live, extra = '') => `# State\n## Where we are\nStage: deliver · Live: ${live} (v0.3.0, alpha)\n## Key facts\n**Release:** GitHub Pages\n${extra}`

  expect('live site up → nothing printed', ping(state(`${base}/up/`)), 'quiet')
  expect('review: a bold-wrapped "**Live: <url>**" line → the ** isn\'t read as part of the address', ping(`# State\n**Live: ${base}/up/**\n**Release:** GitHub Pages\n`), 'quiet')
  expect('review: an address ending a sentence ("…/up/.") → still up', ping(`# State\nLive: ${base}/up/.\n**Release:** GitHub Pages\n`), 'quiet')
  const broken = ping(state(`${base}/broken/`))
  expect('live site answers HTTP 500 → one DOWN line', broken, 'down')
  expect('…naming the address and what to do', { result: /The live site is DOWN — .*\/broken\/ \(HTTP 500\).*live-check\.mjs/.test(broken.message) ? 'named' : 'no', message: broken.message }, 'named')
  const slow = ping(state(`${base}/slow/`))
  expect('a site that takes 10 s → nothing printed (slow isn\'t proof it\'s down)', slow, 'quiet')
  expect('…and session start waited ~3 s, not 10', { result: slow.ms < 6000 ? 'fast' : 'held', message: `${slow.ms} ms` }, 'fast')
  expect('no Live URL → nothing printed', ping('# State\n## Where we are\nLive: nothing to host (library)\n'), 'quiet')
  expect('Release: none (library) → nothing asked, even with a dead URL', ping(`# State\nLive: ${base}/broken/\n## Key facts\n- Release: none (library)\n`), 'quiet')
  const bare = join(root, 'not-a-project')
  mkdirSync(bare)
  const noState = spawnSync('node', [join(HOOKS, 'live-ping.mjs'), bare], { encoding: 'utf8' })
  expect('not a BMUZ project (no STATE.md) → nothing printed', { result: noState.status === 0 && !noState.stdout.trim() ? 'quiet' : 'down', message: noState.stdout + noState.stderr }, 'quiet')
  const refused = state('http://127.0.0.1:1/')
  expect('nothing listening + this machine offline (no name resolves) → nothing printed', ping(refused, { BMUZ_ONLINE_PROBE: 'no-such-host.invalid' }), 'quiet')
  expect('nothing listening + online → DOWN', ping(refused), 'down')
  // the room server
  expect('room server /health 200 → nothing printed', ping(state(`${base}/up/`, `Rooms: ${base}/rooms-up\n`)), 'quiet')
  expect('room server from before /health (its own 404) → nothing printed (it answered)', ping(state(`${base}/up/`, `Rooms: ${base}/rooms-old/\n`)), 'quiet')
  const gone = ping(state(`${base}/up/`, `Rooms: ${base}/rooms-gone\n`))
  expect('Cloudflare "no such worker" (error 1042) → room server DOWN', gone, 'down')
  expect('…says the server is gone and to redeploy', { result: /The room server is DOWN — .*no such server \(Cloudflare error 1042\).*party:deploy/.test(gone.message) ? 'named' : 'no', message: gone.message }, 'named')
  expect('both down → two lines', { result: ping(state(`${base}/broken/`, `Rooms: ${base}/rooms-gone\n`)).message.split('\n').length === 2 ? 'two' : 'other', message: '' }, 'two')
  // wired into session start
  const wired = readFileSync(join(HOOKS, '..', 'session-start.sh'), 'utf8').includes('hooks/live-ping.mjs')
  expect('session-start.sh runs live-ping.mjs', { result: wired ? 'wired' : 'missing', message: '' }, 'wired')
  host.kill()
  rmSync(root, { recursive: true, force: true })
}

// F89 (framework): what broke for players since last time? — a local host stands in for the game's crash server
function testCrashNews() {
  console.log('crash-news — session start says "N new errors from players" only when there are (framework F89)')
  const root = mkdtempSync(join(tmpdir(), 'bmuz-crash-news-'))
  const ready = join(root, 'ready')
  const asked = join(root, 'asked')
  // /news: 3 new, 1 came back · /one: 1 new · /quiet: nothing new · /slow: answers after 10 s · no token: 404
  writeFileSync(join(root, 'host.mjs'), [
    "import http from 'node:http'; import { appendFileSync, writeFileSync } from 'node:fs'",
    'const server = http.createServer((q, s) => {',
    `  appendFileSync(${JSON.stringify(asked)}, q.url + '\\n')`,
    "  if (q.headers.authorization !== 'Bearer right') { s.writeHead(404); return s.end('Not found') }",
    "  const answer = (body) => { s.writeHead(200, { 'content-type': 'application/json' }); s.end(JSON.stringify(body)) }",
    "  if (q.url.startsWith('/news/summary')) return answer({ newKinds: 3, cameBack: 1, reports: 40, dropped: 0, kinds: [], now: 1700000000000 })",
    "  if (q.url.startsWith('/one/summary')) return answer({ newKinds: 1, cameBack: 0, reports: 1, dropped: 0, kinds: [], now: 1700000000000 })",
    "  if (q.url.startsWith('/quiet/summary')) return answer({ newKinds: 0, cameBack: 0, reports: 12, dropped: 0, kinds: [], now: 1700000000000 })",
    "  if (q.url.startsWith('/slow/summary')) { setTimeout(() => answer({ newKinds: 5, cameBack: 0, now: 1 }), 10_000); return }",
    "  s.writeHead(404); s.end('nope')",
    '})',
    `server.listen(0, '127.0.0.1', () => writeFileSync(${JSON.stringify(ready)}, String(server.address().port)))`,
  ].join('\n'))
  const host = spawn(process.execPath, [join(root, 'host.mjs')], { stdio: 'ignore' })
  for (let i = 0; i < 100 && !existsSync(ready); i++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50)
  const base = `http://127.0.0.1:${readFileSync(ready, 'utf8')}`
  const game = join(root, 'goops')
  const tokens = join(root, 'tokens')
  mkdirSync(join(game, '.planning'), { recursive: true })
  mkdirSync(tokens)
  const news = (state, env = {}) => {
    writeFileSync(join(game, '.planning', 'STATE.md'), state)
    const started = Date.now()
    const out = spawnSync('node', [join(HOOKS, 'crash-news.mjs'), game], { encoding: 'utf8', timeout: 20_000, env: { ...process.env, CRASHES_TOKEN: '', BMUZ_CRASHES_DIR: tokens, ...env } })
    const text = `${out.stdout || ''}${out.stderr || ''}`.trim()
    return { result: out.status !== 0 ? `exit ${out.status}` : text ? 'said' : 'quiet', message: text, ms: Date.now() - started }
  }
  const state = (path) => `# State\n## Key facts\n- **Crashes:** ${base}/${path}\n`

  expect('no Crashes line → nothing printed', news('# State\nLive: https://example.com/\n'), 'quiet')
  const noToken = news(state('news'))
  expect('a Crashes line but no token on this machine → one line saying where it goes', noToken, 'said')
  expect('…naming the token file', { result: noToken.message.includes(join(tokens, 'goops.token')) ? 'named' : 'no', message: noToken.message }, 'named')
  writeFileSync(join(tokens, 'goops.token'), 'wrong\n')
  const wrong = news(state('news'))
  expect('a wrong token → one line saying the server refused it', { result: /didn't accept this machine's token/.test(wrong.message) ? 'refused' : 'other', message: wrong.message }, 'refused')
  writeFileSync(join(tokens, 'goops.token'), 'right\n')
  const said = news(state('news'))
  expect('3 new + 1 came back → the line', { result: said.message === '🐞 3 new errors from players, 1 came back since last time — `npm run crashes` shows them with real file lines. Tell Muzzy first thing.' ? 'exact' : 'other', message: said.message }, 'exact')
  expect('…and "last time" is now the server\'s clock', { result: readFileSync(join(tokens, 'goops.seen'), 'utf8') === '1700000000000' ? 'kept' : 'not', message: '' }, 'kept')
  news(state('news'))
  const lastAsk = readFileSync(asked, 'utf8').trim().split('\n').pop()
  expect('…the next session asks since that time', { result: lastAsk === '/news/summary?since=1700000000000' ? 'since' : 'other', message: lastAsk }, 'since')
  expect('1 new error → "1 new error" (no s)', { result: news(state('one')).message.startsWith('🐞 1 new error from players since last time') ? 'one' : 'other', message: '' }, 'one')
  expect('nothing new (only repeats of known errors) → nothing printed', news(state('quiet')), 'quiet')
  const slow = news(state('slow'))
  expect('a server that takes 10 s → nothing printed', slow, 'quiet')
  expect('…and session start waited ~3 s, not 10', { result: slow.ms < 6000 ? 'fast' : 'held', message: `${slow.ms} ms` }, 'fast')
  expect('nothing listening → nothing printed', news('# State\nCrashes: http://127.0.0.1:1/\n'), 'quiet')
  expect('the token from CRASHES_TOKEN works too', news(state('news'), { BMUZ_CRASHES_DIR: join(root, 'empty'), CRASHES_TOKEN: 'right' }), 'said')
  expect('the token never travels in the address', { result: readFileSync(asked, 'utf8').includes('right') ? 'leaked' : 'header only', message: '' }, 'header only')
  // the token file is named after package.json "name" like the installer says (F89 review: my-first-baby is "myfirstbaby")
  writeFileSync(join(game, 'package.json'), JSON.stringify({ name: 'goopsgame' }))
  writeFileSync(join(tokens, 'goopsgame.token'), 'right\n')
  rmSync(join(tokens, 'goops.token'))
  expect('the token file is named after package.json "name", not the folder', news(state('news')), 'said')
  const wired = readFileSync(join(HOOKS, '..', 'session-start.sh'), 'utf8').includes('hooks/crash-news.mjs')
  expect('session-start.sh runs crash-news.mjs', { result: wired ? 'wired' : 'missing', message: '' }, 'wired')
  host.kill()
  rmSync(root, { recursive: true, force: true })
}

const only = process.argv[2]
const suites = { 'live-ping': testLivePing, 'crash-news': testCrashNews,'guard-git': testGuardGit, 'guard-git-safety': testGuardGitSafety, 'stop-cleanup': testStopCleanup, 'session-start': testSessionStartUpdates, 'commit-typecheck': testCommitTypecheck, 'live-push': testLivePush, 'stop-check-fast': testStopCheckFast, 'check-ui-edit': testCheckUiEdit, 'lint-edit': testLintEdit, 'handoff-check': testHandoffCheck, 'plan-lint': testPlanLint, 'session-moments': testSessionMoments, 'guard-edits': testGuardEdits, 'stop-plan-check': testStopPlanCheck, 'stop-unsaved': testStopUnsaved, 'rule-kind': testRuleKind, 'sketch-lint': testSketchLint, 'session-start-notices': testSessionStartNotices, 'session-start-producer': testSessionStartProducer, 'checkup-done': testCheckupDone, 'qa-routine': testQaRoutine }
if (only && !suites[only]) { console.log(`✗ no suite "${only}" — the suites: ${Object.keys(suites).join(', ')}`); process.exit(1) } // a typo isn't "0 failed"
for (const [name, run] of Object.entries(suites)) if (!only || only === name) run()
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
