import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { readTurn, isFileEdit, isCommit, git, codeFingerprint, runCheckFast, holdCheckLock } from '../../lib.mjs'

const TIME_LIMIT_MS = Number(process.env.BMUZ_STOP_LIMIT_MS) || 300_000 // the hook itself gets 360 s (env = tests only)

export default {
  id: 'SC1',
  name: 'check.fast-green',
  what: 'A turn that did work (edited or committed) in a project whose code changed since the last green `npm run check:fast` runs it (max 5 min; one run at a time per project, sharing /save\'s green record). Red → Claude keeps going to fix it or says plainly what\'s broken. Over 5 minutes → SC2: say so plainly',
  why: 'Never "done" on broken code (F68). Goops 2026-10-19: two runs both building into dist/ broke each other — so one at a time. While a game\'s full check / screenshot run holds e2e-shots/.check-lock it isn\'t started at all (audit 2026-11: ~40 % of its send-backs were timeouts on a PC busy with a screenshot run — F185)',
  on: true,
  mode: 'block',
  tests: 'stop-check-fast',
  // When Claude did work this turn (edited a file or committed) and the project's code changed since the last green
  // check:fast, run it. Green → remember it, so an unchanged project never runs it twice. Docs (.planning/, *.md) don't
  // count as code. A turn that only answered a question never waits on it (F80 review: after a pull or a Dev Kit edit,
  // every question turn ran the check — or was sent back for work-in-progress that was red).
  async check(_, { input, say }) {
    if (input.stop_hook_active) return // already continuing because of this check — never loop
    if (input.transcript_path) {
      const turn = readTurn(input.transcript_path)
      if (!turn.tools.some(tool => isFileEdit(tool) || isCommit(tool))) return // a question, not work
    }
    // The project's own folder, not a helper's worktree the shell was left in (framework sprint 48: a `cd` into a finished
    // helper's .claude/worktrees/<name> to read its screenshots made this run check:fast in that half-installed copy —
    // 20 of 23 red, "vitest is not recognized" — while the branch itself was 24/24)
    const project = process.env.CLAUDE_PROJECT_DIR ? resolve(process.env.CLAUDE_PROJECT_DIR) : null
    const inHelperWorktree = (dir) => project && resolve(dir).toLowerCase().startsWith(join(project, '.claude', 'worktrees').toLowerCase())
    const top = git(inHelperWorktree(input.cwd || '.') ? project : (input.cwd || '.'), 'rev-parse', '--show-toplevel')
    if (!top) return
    const root = resolve(top)
    const pkg = existsSync(join(root, 'package.json')) ? JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) : {}
    if (!pkg.scripts?.['check:fast']) return

    const gitDir = resolve(root, git(root, 'rev-parse', '--git-dir'))
    const recordFile = join(gitDir, 'bmuz-last-green')
    const fingerprint = codeFingerprint(root)
    const isGreen = () => existsSync(recordFile) && readFileSync(recordFile, 'utf8').trim() === fingerprint
    if (isGreen()) return

    // a full check / screenshot run going on here (a game's check:full holds e2e-shots/.check-lock) → don't start a
    // second heavy run beside it: it loads the PC and the fast check times out (audit 2026-11: ~40 % of SC1's send-backs
    // were timeouts under a screenshot run). That run checks the code itself; the next hand-back checks again. (F185)
    if (fullRunGoing(root)) return
    // another check:fast in this project (another session, a save) → wait for it (the hook's 360 s budget allows ~50 s),
    // then reuse its result if it passed this exact code; still busy → leave it, the next hand-back checks (Goops 2026-10-19)
    const release = holdCheckLock(root, 50_000)
    if (!release || isGreen()) { release?.(); return }
    const { code, output, timedOut } = await runCheckFast(root, TIME_LIMIT_MS)
    release()
    if (code === 0) {
      writeFileSync(recordFile, fingerprint + '\n')
      return
    }
    if (fullRunGoing(root)) return // a full run started meanwhile — this red may be the load, not the code (F185)
    const tail = output.trim().split('\n').slice(-40).join('\n')
    const reason = timedOut
      ? `npm run check:fast ran over ${TIME_LIMIT_MS / 60000} minutes, so the code wasn't confirmed. Say so plainly in your report (and why it's slow, if you can tell).`
      : `npm run check:fast is failing on the current code. Fix it before handing back — or, if it can't be fixed now, tell Muzzy plainly what's broken and why. Last lines:\n\n${tail}`
    say({ decision: 'block', reason })
    return reason
  },
}

// A game's check:full / area run holds e2e-shots/.check-lock ("<pid> <time>") while it runs (scripts/check-all.mjs)
function fullRunGoing(root) {
  try {
    const pid = Number(readFileSync(join(root, 'e2e-shots', '.check-lock'), 'utf8').split(' ')[0])
    if (!pid || pid === process.pid) return false
    try { process.kill(pid, 0); return true } catch (error) { return error.code === 'EPERM' }
  } catch {
    return false // no lock file
  }
}
