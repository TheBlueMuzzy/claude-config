import { defaultBranch } from '../../lib.mjs'
import { branchAt, deliverRan } from './_shared.mjs'

export default {
  id: 'GG5',
  name: 'git.main-via-deliver',
  what: 'Refuses merging a work branch into main, and running merge.mjs / rollback.mjs, unless /deliver (or /release, F226) is running',
  why: 'Main only changes through /deliver (or /release), after its smoke test and checks (F67, F80, F226)',
  on: true,
  rare: true, // a guard for something that should almost never happen: silence means it works (F187 removal pass)
  mode: 'block',
  tests: 'guard-git-safety',
  check({ calls, index, call, words }, { deny, input }) {
    if (call?.sub === 'merge') checkMergeIntoMain(calls, index, input, deny)
    if (words) checkScripts(words, input, deny)
  },
}

function checkMergeIntoMain(calls, index, input, deny) {
  const { dir, args } = calls[index]
  if (args.some(a => ['--abort', '--continue', '--quit'].includes(a))) return
  const target = defaultBranch(dir)
  if (!target || branchAt(calls, index) !== target) return
  // the branches being merged in (skipping option values like -m "message"); main's own copy on GitHub is fine
  const WITH_VALUE = new Set(['-m', '-F', '-s', '-X', '--strategy', '--strategy-option', '--file'])
  const work = args.filter((a, i) => !a.startsWith('-') && !WITH_VALUE.has(args[i - 1]))
    .filter(a => a !== target && a !== `origin/${target}` && a !== `upstream/${target}` && a !== 'FETCH_HEAD')
  if (!work.length || deliverRan(input)) return
  deny(`Blocked: merging ${work.join(', ')} into ${target}. Only /deliver merges work into ${target} (after its smoke test and checks). Run /deliver — or, if Muzzy asked for this merge, have him type /deliver.`)
}

// (F80) merge.mjs merges into main and rollback.mjs commits on main inside their own process, where this hook can't
// see the git calls — so the scripts themselves count as a merge into main: /deliver only.
function checkScripts(words, input, deny) {
  if (!/^node(\.exe)?$/i.test(words[0])) return
  // BMUZ's own scripts only — a game's tools/merge.mjs (sprites…) or `node --check` on one is something else (review)
  if (words.includes('--check')) return
  const script = words.slice(1).find(w => /config[\\/]bmuz[\\/]scripts[\\/](merge|rollback)\.mjs$/.test(w))
  if (!script || deliverRan(input)) return
  const name = script.split(/[\\/]/).pop()
  deny(`Blocked: ${name} ${name === 'merge.mjs' ? 'merges work into main' : 'puts a released version back on main'}, and only /deliver changes main (after its smoke test and checks). Run /deliver — or, if Muzzy asked for this, have him type /deliver.`)
}
