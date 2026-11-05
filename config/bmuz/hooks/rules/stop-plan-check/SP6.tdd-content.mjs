import { existsSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { git } from '../../lib.mjs'

export default {
  id: 'SP6',
  name: 'plan.tdd-content',
  what: 'A new data file under content/ this turn that TDD.md doesn\'t mention (by its path, folder or name) → add it to the TDD\'s data-files list',
  why: 'The data files Muzzy can edit are listed in the TDD, so the next session knows they\'re there (/develop "A new data file → update TDD §1/§3", F80)',
  on: true,
  rare: true, // a guard: silent because the mistake rarely happens (removal pass skips it — F187)
  mode: 'block',
  tests: 'stop-plan-check',
  check({ root, name, turn }) {
    const unlisted = newContentFiles(root, turn.startedAt).filter(f => !tddMentions(root, f))
    if (unlisted.length) return `${name}: new data file(s) ${unlisted.slice(0, 4).join(', ')} this turn, but .planning/TDD.md doesn't mention ${unlisted.length > 1 ? 'them' : 'it'} (or ${unlisted.length > 1 ? 'their' : 'its'} folder). Add ${unlisted.length > 1 ? 'them' : 'it'} to the TDD's data-files list (§1/§3: what it holds, who edits it — Muzzy in the Dev Kit or Obsidian) so the next session knows it's there.`
  },
}

// Files under content/ that are new this turn: added by a commit since the turn began, or staged-new / untracked AND
// created since the turn began (review: a file Muzzy is still drafting sent every working turn back).
function newContentFiles(root, startedAt) {
  if (!startedAt || !existsSync(join(root, 'content')) || !existsSync(join(root, '.planning', 'TDD.md'))) return []
  const since = Date.parse(startedAt) - 5000
  const lines = (...args) => (git(root, ...args) || '').split('\n').filter(f => f.startsWith('content/'))
  const madeThisTurn = (f) => { try { const s = statSync(join(root, f)); return (s.birthtimeMs || s.mtimeMs) >= since } catch { return false } }
  return [...new Set([
    ...lines('log', '--since', startedAt, '--diff-filter=A', '--name-only', '--format='),
    ...[...lines('diff', '--cached', '--name-only', '--diff-filter=A'), ...lines('ls-files', '--others', '--exclude-standard')].filter(madeThisTurn),
  ])]
}

// Does the TDD name this data file — its path, its folder ("content/lessons/"), or its file name?
function tddMentions(root, file) {
  let tdd = ''
  try { tdd = readFileSync(join(root, '.planning', 'TDD.md'), 'utf8') } catch { return true }
  const folder = file.split('/').slice(0, -1).join('/')
  const name = basename(file)
  return tdd.includes(file) || (folder !== 'content' && (tdd.includes(`${folder}/`) || tdd.includes(`${folder}\``) || tdd.includes(`${folder} `))) || tdd.includes(name)
}
