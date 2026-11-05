// What the `F08: done` rules (GG8–GG10) all start from: the done commit's ids, its project, and the feature's first
// commit. null = not a done commit, outside a repo, or not a BMUZ project (no .planning/STATE.md).
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { git } from '../../lib.mjs'
import { rootOf, doneIds, featureIds } from './_shared.mjs'

export function doneCommit(commit) {
  if (!commit) return null
  const ids = doneIds(commit.message)
  if (!ids) return null
  const root = rootOf(commit)
  if (!root) return null
  if (!existsSync(join(root, '.planning', 'STATE.md'))) return null // not a BMUZ project
  const feature = featureIds(ids)[0]
  const first = () => (git(root, 'log', '--format=%H', '--reverse', `--grep=^${feature}:`) || '').split('\n')[0]
  return { ids, root, feature, first }
}
