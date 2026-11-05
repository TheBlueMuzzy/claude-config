import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { git } from '../../lib.mjs'
import { doneCommit } from './_done.mjs'

export default {
  id: 'GG10',
  name: 'commit.done-reviewed-fullcheck',
  what: 'Refuses `F08: done` when STATE\'s `Reviewed through:` line (and `Last full check:` in a project with check:full) wasn\'t written or changed during F08',
  why: 'Every feature gets the same code review and full check before it\'s done, enforced by code instead of memory (F75)',
  on: true,
  mode: 'block',
  tests: 'guard-git-safety',
  check({ commit }, { deny }) {
    const done = doneCommit(commit)
    if (!done) return
    const { root, feature } = done
    const first = done.first()
    // Each line must have been written or changed since the feature started (its value is a commit, sometimes from two
    // repos, so "changed during this feature" is the test). A project without a check:full script has no full check.
    const now = readFileSync(join(root, '.planning', 'STATE.md'), 'utf8')
    const before = (first && git(root, 'show', `${first}^:.planning/STATE.md`)) || ''
    // the real line only — it starts the line ("Reviewed through: …", "**Last full check:** …", "- Reviewed through: …"),
    // never the words inside a sentence ("next: /code-review, then write Reviewed through")
    const line = (text, label) => (text.match(new RegExp(`^[-\\s]*\\*{0,2}${label}:?\\*{0,2}:[^\\n]*|^[-\\s]*\\*{0,2}${label}:[^\\n]*`, 'im')) || [''])[0].trim()
    let hasFull = false
    try { hasFull = !!JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts?.['check:full'] } catch { /* no package.json */ }
    const stale = [['Reviewed through', '/code-review (low) on this feature\'s commits, then `Reviewed through: <commit>`'],
      ...(hasFull ? [['Last full check', '`npm run check:full` once, then `Last full check: <commit> — <date> <result>`']] : [])]
      .filter(([label]) => { const n = line(now, label); return !n || n === line(before, label) })
    if (stale.length) {
      deny(`Blocked: "${feature}: done" but STATE.md's ${stale.map(([l]) => `"${l}"`).join(' and ')} ${stale.length > 1 ? 'weren\'t' : 'wasn\'t'} updated during ${feature}, so ${stale.length > 1 ? 'they describe' : 'it describes'} older work. Every feature gets the same treatment before it's done: ${stale.map(([, how]) => how).join('; ')}. Then write the line${stale.length > 1 ? 's' : ''} into STATE.md and commit again (F75).`)
    }
  },
}
