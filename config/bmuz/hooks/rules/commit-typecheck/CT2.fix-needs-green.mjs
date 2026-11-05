import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { git, codeFingerprint, runCheckFast, holdCheckLock } from '../../lib.mjs'
import { rootOf } from '../guard-git/_shared.mjs'

const BUG_CHECK_MS = 100_000 // check:fast for a `Fix Bnn:` commit — leaves room for the type check inside the 180 s

export default {
  id: 'CT2',
  name: 'commit.fix-needs-green',
  what: 'A `Fix B014: …` commit in a BMUZ project with check:fast: the whole suite + build must be green on this code (reuses the green record; one run at a time per project). A suite already red for a logged bug: `(suite already red: B015)` in the message',
  why: '/bug step 4 "verify: the whole suite + build" was only remembered (F80)',
  on: true,
  mode: 'block',
  tests: 'commit-typecheck',
  async check({ commit }, { deny }) {
    if (!commit) return
    const root = rootOf(commit)
    if (!root) return
    const message = commit.message
    const bug = (message.match(/^\s*Fix (B\d+)\b/i) || [])[1]
    if (!bug || !existsSync(join(root, '.planning', 'STATE.md'))) return
    let pkg = {}
    try { pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) } catch { return }
    if (!pkg.scripts?.['check:fast']) return
    // already red for a logged reason → on record in the message, not a refusal
    const redFor = (message.match(/\(suite already red:\s*(B\d+)\)/i) || [])[1]
    if (redFor) {
      let bugs = ''
      try { bugs = readFileSync(join(root, '.planning', 'BUGS.md'), 'utf8') } catch {}
      if (new RegExp(`\\b${redFor}\\b`).test(bugs)) return
      deny(`Blocked: "(suite already red: ${redFor})" but ${redFor} isn't in .planning/BUGS.md — log the failure that was there before your fix as its own bug first (/bug), then commit again.`)
    }
    const record = join(resolve(root, git(root, 'rev-parse', '--git-dir') || '.git'), 'bmuz-last-green')
    const fingerprint = codeFingerprint(root)
    const isGreen = () => existsSync(record) && readFileSync(record, 'utf8').trim() === fingerprint
    if (isGreen()) return // already green on this code
    // one check:fast at a time per project (lib.holdCheckLock): wait ≤ 30 s, reuse the other run's pass; still busy →
    // let the commit through like a timeout (stop-check-fast checks at the end of the turn)
    const release = holdCheckLock(root, 30_000)
    if (!release || isGreen()) { release?.(); return }
    const { code, output, timedOut } = await runCheckFast(root, BUG_CHECK_MS)
    release()
    if (timedOut) return // too slow to confirm here — stop-check-fast still runs it at the end of the turn
    if (code === 0) { try { writeFileSync(record, fingerprint + '\n') } catch {} ; return }
    const tail = output.trim().split('\n').slice(-30).join('\n')
    deny(`Blocked: "Fix ${bug}" but \`npm run check:fast\` (the whole test suite + build) fails on this code — a fix is only done when the new test AND everything else pass (/bug step 4). Fix it — or, if it was ALREADY failing before your change, log that as its own bug and say so in the message: "Fix ${bug}: … (suite already red: B0xx)". Last lines:\n\n${tail}`)
  },
}
