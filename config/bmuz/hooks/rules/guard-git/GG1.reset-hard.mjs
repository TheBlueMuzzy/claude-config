export default {
  id: 'GG1',
  name: 'git.no-reset-hard',
  what: 'Refuses `git reset --hard` — undo with `git revert`',
  why: 'Muzzy\'s "never" rules for undo: reset --hard throws work away for good',
  on: true,
  mode: 'block',
  tests: 'guard-git',
  check({ call }, { deny }) {
    if (call?.sub !== 'reset' || !call.args.includes('--hard')) return
    deny('Blocked: `git reset --hard` throws work away, and Muzzy\'s rule is never to use it. To undo something committed, use `git revert <commit>` (show Muzzy what will be undone first). For an uncommitted file, ask Muzzy before discarding it.')
  },
}
