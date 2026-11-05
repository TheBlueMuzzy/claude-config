import { git } from '../../lib.mjs'
import { doneCommit } from './_done.mjs'

export default {
  id: 'GG9',
  name: 'commit.done-state',
  what: 'Refuses `F08: done` when STATE.md isn\'t in the commit and hasn\'t changed since F08\'s first commit',
  why: 'A fresh session (or the other machine) resumes from RESUME HERE, so it has to be current (F72)',
  on: true,
  mode: 'block',
  tests: 'guard-git-safety',
  check({ commit }, { deny }) {
    const done = doneCommit(commit)
    if (!done) return
    const { root, feature } = done
    const first = done.first()
    if (commit.files(root).includes('.planning/STATE.md')) return
    const lastState = (git(root, 'log', '-1', '--format=%H', '--', '.planning/STATE.md') || '')
    if (!(first && lastState && git(root, 'merge-base', '--is-ancestor', first, lastState) !== null)) {
      deny(`Blocked: "${feature}: done" but .planning/STATE.md hasn't changed since ${feature} started, so RESUME HERE still describes the old work. A fresh session, or the other machine, would pick up from there. Replace RESUME HERE + "Doing" (what's done, what's next), add STATE.md to this commit, then /save (F72). (The whole command line is checked before any of it runs, so write STATE in its own step first, then commit.)`)
    }
  },
}
