// Don't end a turn on broken code (F68; a global Stop hook since F80). When Claude did work this turn (edited a file or
// committed) and the project's code changed since the last green `npm run check:fast`, run it. Red → Claude keeps going
// (fix it, or say plainly what's broken). Green → remember it, so an unchanged project never runs it twice. Docs
// (.planning/, *.md) don't count as code. A turn that only answered a question never waits on it (F80 review: after a
// pull or a Dev Kit edit, every question turn ran the check — or was sent back for work-in-progress that was red).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { readInput, readTurn, isFileEdit, isCommit, git, codeFingerprint, runCheckFast, holdCheckLock } from './lib.mjs'

const TIME_LIMIT_MS = Number(process.env.BMUZ_STOP_LIMIT_MS) || 300_000 // the hook itself gets 360 s (env = tests only)

const input = readInput()
if (input.stop_hook_active) process.exit(0) // already continuing because of this check — never loop
if (input.transcript_path) {
  const turn = readTurn(input.transcript_path)
  if (!turn.tools.some(tool => isFileEdit(tool) || isCommit(tool))) process.exit(0) // a question, not work
}

// The project's own folder, not a helper's worktree the shell was left in (framework sprint 48: a `cd` into a finished
// helper's .claude/worktrees/<name> to read its screenshots made this run check:fast in that half-installed copy —
// 20 of 23 red, "vitest is not recognized" — while the branch itself was 24/24)
const project = process.env.CLAUDE_PROJECT_DIR ? resolve(process.env.CLAUDE_PROJECT_DIR) : null
const inHelperWorktree = (dir) => project && resolve(dir).toLowerCase().startsWith(join(project, '.claude', 'worktrees').toLowerCase())
const top = git(inHelperWorktree(input.cwd || '.') ? project : (input.cwd || '.'), 'rev-parse', '--show-toplevel')
if (!top) process.exit(0)
const root = resolve(top)
const pkg = existsSync(join(root, 'package.json')) ? JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) : {}
if (!pkg.scripts?.['check:fast']) process.exit(0)

const gitDir = resolve(root, git(root, 'rev-parse', '--git-dir'))
const recordFile = join(gitDir, 'bmuz-last-green')
const fingerprint = codeFingerprint(root)
const isGreen = () => existsSync(recordFile) && readFileSync(recordFile, 'utf8').trim() === fingerprint
if (isGreen()) process.exit(0)

// another check:fast in this project (another session, a save) → wait for it (the hook's 360 s budget allows ~50 s),
// then reuse its result if it passed this exact code; still busy → leave it, the next hand-back checks (Goops 2026-10-19)
const release = holdCheckLock(root, 50_000)
if (!release || isGreen()) { release?.(); process.exit(0) }
const { code, output, timedOut } = await runCheckFast(root, TIME_LIMIT_MS)
release()
if (code === 0) {
  writeFileSync(recordFile, fingerprint + '\n')
  process.exit(0)
}
const tail = output.trim().split('\n').slice(-40).join('\n')
process.stdout.write(JSON.stringify({
  decision: 'block',
  reason: timedOut
    ? `npm run check:fast ran over ${TIME_LIMIT_MS / 60000} minutes, so the code wasn't confirmed. Say so plainly in your report (and why it's slow, if you can tell).`
    : `npm run check:fast is failing on the current code. Fix it before handing back — or, if it can't be fixed now, tell Muzzy plainly what's broken and why. Last lines:\n\n${tail}`,
}))
process.exit(0)
