import { git, defaultBranch, isMergedInto } from '../../lib.mjs'

export default {
  id: 'GG3',
  name: 'git.no-delete-unmerged',
  what: 'Refuses deleting a branch (local `branch -D`, or on GitHub) whose work isn\'t merged yet — a fully merged one may go',
  why: 'Muzzy\'s "never" rules: only fully merged branches get deleted, so no work is lost',
  on: true,
  mode: 'block',
  tests: 'guard-git',
  check({ call }, { deny }) {
    if (call?.sub === 'push') checkRemoteDeletes(call.dir, call.args, deny)
    if (call?.sub === 'branch') checkLocalDeletes(call.dir, call.args, deny)
  },
}

// `git branch -D x` (or -d with --force): only when x is already fully merged.
// Plain `git branch -d x` is left alone — git itself refuses it when x has unmerged work.
function checkLocalDeletes(dir, args, deny) {
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
