// Muzzy's git "never" rules, enforced before the command runs (F68). Hooked on Bash + PowerShell (PreToolUse).
//   never `git reset --hard`          → undo with `git revert`
//   never force-push                  → push a new commit instead
//   never delete a branch with work that isn't merged yet (a fully merged one is fine — nothing is lost)
import { readInput, deny, gitCalls, git, defaultBranch, isMergedInto } from './lib.mjs'

const input = readInput()
const command = input.tool_input?.command
if (!command) process.exit(0)

for (const call of gitCalls(command, input.cwd)) {
  const { dir, sub, args } = call

  if (sub === 'reset' && args.includes('--hard')) {
    deny('Blocked: `git reset --hard` throws work away, and Muzzy\'s rule is never to use it. To undo something committed, use `git revert <commit>` (show Muzzy what will be undone first). For an uncommitted file, ask Muzzy before discarding it.')
  }

  if (sub === 'push') {
    const forced = args.some(a =>
      a === '--force' || a.startsWith('--force-with-lease') || a === '--mirror' ||
      /^-[a-zA-Z]*f[a-zA-Z]*$/.test(a) || // -f, -uf
      (a.startsWith('+') && a.length > 1)) // +main
    if (forced) {
      deny('Blocked: force-pushing rewrites history on GitHub, and Muzzy\'s rule is never to do it. Make the fix as a new commit (or `git revert`) and push normally. If the push is refused because GitHub has newer commits, `git pull` first.')
    }
    checkRemoteDeletes(dir, args)
  }

  if (sub === 'branch') checkLocalDeletes(dir, args)
}
process.exit(0)

// `git branch -D x` (or -d with --force): only when x is already fully merged.
// Plain `git branch -d x` is left alone — git itself refuses it when x has unmerged work.
function checkLocalDeletes(dir, args) {
  const short = args.filter(a => /^-[a-zA-Z]+$/.test(a)).join('') // -D, -d -f, -Df, -df
  const forceDelete = short.includes('D') ||
    ((short.includes('d') || args.includes('--delete')) && (short.includes('f') || args.includes('--force')))
  if (!forceDelete) return
  const target = defaultBranch(dir)
  for (const name of args.filter(a => !a.startsWith('-'))) {
    if (target && (isMergedInto(dir, name, target) || isMergedInto(dir, name, `origin/${target}`))) continue
    deny(`Blocked: branch \`${name}\` has work that isn't merged into ${target || 'main'} yet, so deleting it would lose that work. Muzzy's rule: only fully merged branches get deleted. Merge it first (that's /deliver's job), or ask Muzzy.`)
  }
}

// `git push origin --delete x` / `git push origin :x`: only when origin/x is already merged into origin's default branch.
function checkRemoteDeletes(dir, args) {
  const words = args.filter(a => !a.startsWith('-'))
  const remote = words[0] || 'origin'
  const deleting = args.includes('--delete') || args.includes('-d')
  const names = deleting ? words.slice(1) : words.slice(1).filter(w => w.startsWith(':')).map(w => w.slice(1))
  if (!names.length) return
  const target = defaultBranch(dir)
  for (const name of names) {
    const branch = name.replace(/^refs\/heads\//, '')
    const known = git(dir, 'rev-parse', '--verify', '--quiet', `refs/remotes/${remote}/${branch}`) !== null
    if (known && target && isMergedInto(dir, `${remote}/${branch}`, `${remote}/${target}`)) continue
    deny(known
      ? `Blocked: \`${remote}/${branch}\` has work that isn't merged into ${remote}/${target || 'main'}, so deleting it would lose that work. Muzzy's rule: only fully merged branches get deleted.`
      : `Blocked: can't confirm \`${remote}/${branch}\` is merged (it isn't in the local copy — run \`git fetch\` first, then try again). Muzzy's rule: only fully merged branches get deleted.`)
  }
}
