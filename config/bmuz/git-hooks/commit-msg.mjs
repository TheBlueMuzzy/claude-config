// git's commit-msg step in a BMUZ project (F184): the commit rules (guard-git's GG4, GG6, GG8–GG13 and
// commit-typecheck's CT1, CT2) run on the commit as git really makes it — the staged files and the real message — so an
// edit and a commit on one command line, or a commit made inside a script, are checked at the real moment.
// A refusal: the reason on stderr, exit 1 → git stops the commit. A rule that crashes: said, the commit goes on.
// The shared hook files broken: the commit is refused, saying so (a check that can't run must not wave things through).
import { readFileSync } from 'node:fs'

const root = process.cwd() // git runs the hook at the top of the working tree
const say = (text) => process.stderr.write(`${text}\n`)

let checkCommit, stagedCommit
try {
  ({ checkCommit } = await import('../hooks/runner.mjs'));
  ({ stagedCommit } = await import('../hooks/rules/guard-git/_shared.mjs'))
} catch (error) {
  say(`BMUZ hooks are broken: ${String(error?.message || error).split('\n')[0]} — so the commit checks can't run and this commit is refused. Fix it in ~/.claude/config/bmuz/hooks/, then run node ~/.claude/config/bmuz/hooks/test-hooks.mjs. (Muzzy can still commit himself with \`! git commit --no-verify …\`.)`)
  process.exit(1)
}

// the message as written, without git's "#" comment lines
let message = ''
try { message = readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(l => !l.startsWith('#')).join('\n').trim() } catch {}

const result = await checkCommit(stagedCommit(root, message))
for (const line of result.crashes) say(line)
if (result.refusal) {
  say(`BMUZ commit check ${result.rule} (git's commit step) — ${result.refusal}`)
  process.exit(1)
}
