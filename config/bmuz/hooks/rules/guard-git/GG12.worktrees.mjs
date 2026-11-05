import { rootOf } from './_shared.mjs'

export default {
  id: 'GG12',
  name: 'commit.no-worktrees',
  what: 'Refuses a commit that would include `.claude/worktrees/` (a helper\'s workspace) — add the ignore line first',
  why: 'Helpers\' worktrees became broken embedded repos (Goops 2026-10-17); save.mjs adds the ignore line, but helpers can start before the first save (F80)',
  on: true,
  rare: true, // a guard for something that should almost never happen: silence means it works (F187 removal pass)
  mode: 'block',
  tests: 'guard-git-safety',
  check({ commit }, { deny }) {
    if (!commit) return
    const root = rootOf(commit)
    if (!root) return
    const bad = commit.files(root).filter(f => /^\.claude\/worktrees(\/|$)/.test(f))
    if (!bad.length) return
    deny(`Blocked: this commit would include ${bad.slice(0, 3).join(', ')} — a helper's workspace (a whole copy of the repo), which git would store as a broken embedded repo. Add the line \`.claude/worktrees/\` to .gitignore (and \`git rm -r --cached .claude/worktrees\` if it's already staged), then commit again.`)
  },
}
