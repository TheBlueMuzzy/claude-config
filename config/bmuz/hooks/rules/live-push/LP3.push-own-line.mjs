export default {
  id: 'LP3',
  name: 'live.push-own-line',
  what: 'Refuses a push to a branch that deploys on the same line as a merge / pull / rebase / checkout / reset… — push on its own line',
  why: 'The hook runs before the whole line, so after a merge or pull on that line the smoke-pass check can\'t see what will be pushed (F68)',
  on: true,
  mode: 'block',
  tests: 'live-push',
  check({ branch, before }, { deny }) {
    const pullsInFirst = before.some(s => ['merge', 'pull', 'rebase', 'cherry-pick', 'revert', 'am', 'checkout', 'switch', 'reset'].includes(s))
    if (pullsInFirst) deny(`Blocked: pushing \`${branch}\` (it deploys the live site) on the same line as a ${before.join('/')} — the smoke-pass check can't see what will be pushed. Run that first, then push on its own line.`)
  },
}
