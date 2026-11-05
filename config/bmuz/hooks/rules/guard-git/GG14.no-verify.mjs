// What the option values are (`-m "-n…"` is a message, not -n)
const WITH_VALUE = new Set(['-m', '-F', '-C', '-c', '-t', '--author', '--date', '--file', '--message', '--template',
  '--reuse-message', '--reedit-message', '--fixup', '--squash', '--trailer', '--cleanup', '--pathspec-from-file', '-s', '-X', '--strategy', '--strategy-option'])

export default {
  id: 'GG14',
  name: 'git.no-verify-refused',
  what: 'Refuses `git commit --no-verify` / `-n`, `git merge --no-verify`, and `git -c core.hooksPath=…` on a commit or merge — they skip git\'s own commit step, where the BMUZ commit checks run',
  why: 'The commit checks moved into git\'s own commit step (F184, Muzzy 2026-11-04: "yes", per project) — skipping that step would skip every one of them. Muzzy can still run it himself with `! git commit --no-verify …`',
  on: true,
  rare: true, // a guard for something that should almost never happen: silence means it works (F187 removal pass)
  mode: 'block',
  tests: 'runner',
  check({ call, command }, { deny }) {
    if (call?.sub !== 'commit' && call?.sub !== 'merge') return
    const skips = call.args.some((a, i) => !WITH_VALUE.has(call.args[i - 1]) &&
      (a === '--no-verify' || (call.sub === 'commit' && /^-[a-zA-Z]*n[a-zA-Z]*$/.test(a)))) // -n, -an, -nm …
    const swapsHooks = /\bgit(\.exe)?\s+(?:-\S+\s+)*-c\s+["']?core\.hooksPath=/i.test(command || '')
    if (!skips && !swapsHooks) return
    deny(`Blocked: \`git ${call.sub}\` ${skips ? 'with --no-verify (-n) skips' : 'with `-c core.hooksPath=…` swaps out'} git's own commit step, where the BMUZ commit checks run (type check, secrets, the \`F08: done\` gates…). Commit without it — if a check refuses, fix what it names. If Muzzy really wants to skip them, he can run it himself with \`! git ${call.sub} …\`.`)
  },
}
