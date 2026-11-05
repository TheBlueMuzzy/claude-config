export default {
  id: 'GG2',
  name: 'git.no-force-push',
  what: 'Refuses any force-push (--force, -f, --force-with-lease, --mirror, +branch)',
  why: 'Muzzy\'s "never" rules: a force-push rewrites history on GitHub — push a new commit instead',
  on: true,
  rare: true, // a guard for something that should almost never happen: silence means it works (F187 removal pass)
  mode: 'block',
  tests: 'guard-git',
  check({ call }, { deny }) {
    if (call?.sub !== 'push') return
    const forced = call.args.some(a =>
      a === '--force' || a.startsWith('--force-with-lease') || a === '--mirror' ||
      /^-[a-zA-Z]*f[a-zA-Z]*$/.test(a) || // -f, -uf
      (a.startsWith('+') && a.length > 1)) // +main
    if (forced) {
      deny('Blocked: force-pushing rewrites history on GitHub, and Muzzy\'s rule is never to do it. Make the fix as a new commit (or `git revert`) and push normally. If the push is refused because GitHub has newer commits, `git pull` first.')
    }
  },
}
