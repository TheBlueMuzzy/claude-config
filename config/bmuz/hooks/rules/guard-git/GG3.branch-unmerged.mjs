import { git, defaultBranch, isMergedInto } from '../../lib.mjs'

export default {
  id: 'GG3',
  name: 'git.no-delete-unmerged',
  what: 'Refuses deleting a branch (local `branch -D`, or on GitHub) whose work isn\'t merged yet — a fully merged one may go',
  why: 'Muzzy\'s "never" rules: only fully merged branches get deleted, so no work is lost',
  on: true,
  rare: true, // a guard for something that should almost never happen: silence means it works (F187 removal pass)
  mode: 'block',
  tests: 'guard-git',
  check({ call }, { deny }) {
    if (call?.sub === 'push') checkRemoteDeletes(call.dir, branchArgs(call.args), deny)
    if (call?.sub === 'branch') checkLocalDeletes(call.dir, branchArgs(call.args, true), deny)
  },
}

// The words that can be branch names: everything before a redirect (`2>&1`, `> /dev/null` — `2>` was read as a
// branch, 2026-10-27 + 2026-11-01), and no shell variable (`origin/$b` in a `for b in …` loop that checked merge-base
// itself, 2026-10-26 — its value isn't known before the line runs). (F185) A local force-delete of a variable keeps
// it, so checkLocalDeletes can point at `-d` (git refuses unmerged work there itself).
function branchArgs(args, keepVariables = false) {
  const end = args.findIndex(a => /^\d*>/.test(a) || /^&>/.test(a))
  return (end < 0 ? args : args.slice(0, end)).filter(a => keepVariables || !VARIABLE.test(a))
}
const VARIABLE = /[$%`]/

// `git branch -D x` (or -d with --force): only when x is already fully merged.
// Plain `git branch -d x` is left alone — git itself refuses it when x has unmerged work.
function checkLocalDeletes(dir, args, deny) {
  const short = args.filter(a => /^-[a-zA-Z]+$/.test(a)).join('') // -D, -d -f, -Df, -df
  const forceDelete = short.includes('D') ||
    ((short.includes('d') || args.includes('--delete')) && (short.includes('f') || args.includes('--force')))
  if (!forceDelete) return
  const target = defaultBranch(dir)
  for (const name of args.filter(a => !a.startsWith('-'))) {
    if (VARIABLE.test(name)) deny(`Blocked: \`git branch -D ${name}\` force-deletes a branch named by a shell variable, so whether its work is merged can't be checked before the line runs. Use \`git branch -d\` (git itself refuses a branch with unmerged work), or name the branches.`)
    if (target && (isMergedInto(dir, name, target) || isMergedInto(dir, name, `origin/${target}`))) continue
    deny(`Blocked: branch \`${name}\` has work that isn't merged into ${target || 'main'} yet, so deleting it would lose that work. Muzzy's rule: only fully merged branches get deleted. Merge it first (that's /deliver's job), or ask Muzzy.`)
  }
}

// `git push origin --delete x` / `git push origin :x`: only when origin/x is already merged into origin's default branch.
function checkRemoteDeletes(dir, args, deny) {
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
