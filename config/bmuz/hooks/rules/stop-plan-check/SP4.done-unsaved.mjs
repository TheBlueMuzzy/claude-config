import { git } from '../../lib.mjs'

export default {
  id: 'SP4',
  name: 'plan.done-saved',
  what: 'An `Fnn: done` commit this turn but the project isn\'t saved + pushed → /save now, in this turn',
  why: '/develop §4: "save + keep going" — nothing approved sits unsaved (F80)',
  on: true,
  mode: 'block',
  tests: 'stop-plan-check',
  check({ root, p, name }) {
    if (!p.done) return
    const unsaved = unsavedWork(root)
    if (unsaved) return `${name}: a feature was approved (\`Fnn: done\` commit) but ${unsaved} — /save now, in this turn (/develop §4: "save + keep going").`
  },
}

// Why the project isn't saved, or '' — uncommitted files, commits GitHub doesn't have, a branch never pushed.
function unsavedWork(root) {
  if ((git(root, 'status', '--porcelain') || '').trim()) return 'there are uncommitted changes'
  if (!git(root, 'remote')) return ''
  const upstream = git(root, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}')
  if (!upstream) return 'the branch was never pushed'
  const ahead = parseInt(git(root, 'rev-list', '--count', `${upstream}..HEAD`) || '0', 10)
  return ahead ? `${ahead} commit(s) aren't on GitHub yet` : ''
}
