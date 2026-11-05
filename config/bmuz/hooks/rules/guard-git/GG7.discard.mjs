import { git } from '../../lib.mjs'

export default {
  id: 'GG7',
  name: 'git.no-discard-uncommitted',
  what: 'Refuses `git checkout -- <file>`, `git checkout .`, `git checkout <branch> -- <file>`, `checkout -f`, `switch -f`, `git restore <file>` over uncommitted changes — names the files and the `git stash push` that keeps a copy. Branch switches, `checkout -b`, `restore --staged` pass',
  why: 'Uncommitted work thrown away can\'t come back (Goops F17 lost cracks.ts this way). A refusal, not a question, so an unattended run never stops on a prompt (Muzzy, 2026-10-27: "i want you to be in full auto mode, but these kinds of messages are still showing up")',
  on: true,
  mode: 'block',
  tests: 'guard-git-safety',
  // returns the reason (the hook refuses once every call on the line is checked, naming every lost file at once)
  check({ call }) {
    if (call?.sub === 'checkout' || call?.sub === 'restore' || call?.sub === 'switch') return discardsChanges(call)
  },
}

// Would this checkout / restore / switch throw away uncommitted changes? Returns the plain-words reason, or null.
//   git checkout -- a.ts · git checkout . · git checkout main -- a.ts · git checkout a.ts (a file, not a branch)
//   git restore a.ts (not `--staged` alone: that only unstages) · git checkout -f <branch> · git switch -f <branch>
// The lost changes: with no source, the working copy's unsaved edits (git diff); with a source (a branch / commit, or
// restore --staged --worktree), everything uncommitted in those files (git diff HEAD). New untracked files are never touched.
function discardsChanges({ dir, sub, args }) {
  const top = git(dir, 'rev-parse', '--show-toplevel')
  if (!top) return null
  const dash = args.indexOf('--')
  const before = dash >= 0 ? args.slice(0, dash) : args
  const after = dash >= 0 ? args.slice(dash + 1) : []
  const short = before.filter(a => /^-[a-zA-Z]+$/.test(a)).join('')
  const force = short.includes('f') || before.includes('--force') || before.includes('--discard-changes')
  if (before.includes('-p') || before.includes('--patch')) return null // asks hunk by hunk itself
  let paths = []
  let source = false
  if (sub === 'switch') {
    if (!force) return null
    paths = ['.']; source = true
  } else if (sub === 'restore') {
    const WITH_VALUE = new Set(['-s', '--source', '--pathspec-from-file'])
    const staged = short.includes('S') || before.includes('--staged')
    const worktree = short.includes('W') || before.includes('--worktree')
    if (staged && !worktree) return null // only unstages — the edits stay in the file
    paths = [...before.filter((a, i) => !a.startsWith('-') && !WITH_VALUE.has(before[i - 1])), ...after]
    source = staged || before.some(a => a === '-s' || a === '--source' || a.startsWith('--source='))
  } else {
    if (['-b', '-B', '--orphan'].some(o => before.includes(o))) return null // makes a new branch: nothing is overwritten
    const WITH_VALUE = new Set(['--conflict', '--pathspec-from-file'])
    const words = before.filter((a, i) => !a.startsWith('-') && !WITH_VALUE.has(before[i - 1]))
    const isRef = (w) => git(dir, 'rev-parse', '--verify', '--quiet', `${w}^{commit}`) !== null
    if (dash >= 0) { paths = after; source = words.length > 0 } // git checkout [<branch>] -- <files>
    else if (words.length && isRef(words[0])) {
      if (words.length > 1) { paths = words.slice(1); source = true } // git checkout main a.ts
      else if (force) { paths = ['.']; source = true } // git checkout -f main: drops every uncommitted change
      else return null // a plain branch switch — git itself refuses if it would overwrite changes
    } else if (!words.length && force) { paths = ['.']; source = true } // bare `git checkout -f`: drops every uncommitted change (review)
    else paths = words // git checkout . / git checkout a.ts
  }
  if (!paths.length) return null
  const lost = (git(dir, 'diff', ...(source ? ['HEAD'] : []), '--name-only', '--', ...paths) || '').split('\n').filter(Boolean)
  if (!lost.length) return null
  const command = `git ${sub} ${args.join(' ')}`.trim()
  const named = lost.map(f => (/\s/.test(f) ? `"${f}"` : f)).join(' ')
  return `Blocked: \`${command}\` would throw away the uncommitted changes in ${lost.slice(0, 5).join(', ')}${lost.length > 5 ? ` and ${lost.length - 5} more` : ''} — for good: they were never committed, so git can't bring them back (Goops F17 lost cracks.ts this way). Do this instead — it takes the same changes out but keeps a copy (\`git stash list\` shows it; \`git stash apply <its id>\` brings it back — not \`pop\`: helpers' worktrees share one stash list):\n  git stash push -m "<why>" -- ${named}\nIf Muzzy really wants the work gone for good, he can run it himself with \`! ${command}\`.`
}
