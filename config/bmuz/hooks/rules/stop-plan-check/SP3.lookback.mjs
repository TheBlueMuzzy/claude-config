import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { tagsSince, MILESTONE_TAG } from './_shared.mjs'

export default {
  id: 'SP3',
  name: 'plan.lookback',
  what: 'A milestone went out this turn (a vX.Y.0 tag — by hand or release.mjs — or a "Release vX.Y.0" commit) → a look-back in .planning/archive/lookbacks/; every look-back item names a home that exists ("→ hook|check|script|module|checklist|game: <path>" or "→ nothing (why)")',
  why: 'The self-improving loop (F74, templates/lookback.md): lessons land where they can\'t be forgotten',
  on: true,
  mode: 'block',
  tests: 'stop-plan-check',
  // returns a list
  check({ root, p, name, turn }) {
    const out = []
    // (one written in an earlier turn of the release, or through the shell, counts: changed in the last 7 days)
    if (tagsSince(root, turn.startedAt, MILESTONE_TAG).length > 0) p.milestone = true
    if (p.milestone && !p.lookbacks.size && !recentLookback(root)) {
      out.push(`${name}: a milestone / release stage went out this turn, but there's no look-back. Write .planning/archive/lookbacks/<milestone>.md and land each lesson in its home (~/.claude/config/bmuz/templates/lookback.md).`)
    }
    for (const file of p.lookbacks) out.push(...lookbackProblems(file, root).map(problem => `${name}: look-back ${problem}`))
    return out
  },
}

function recentLookback(root) {
  const dir = join(root, '.planning', 'archive', 'lookbacks')
  try {
    return readdirSync(dir).some(f => f.endsWith('.md') && statSync(join(dir, f)).mtimeMs > Date.now() - 7 * 24 * 3600 * 1000)
  } catch {
    return false
  }
}

// Every item ("- … → hook: <path> (…)") names a home that exists; "→ nothing (why)" needs its reason.
function lookbackProblems(file, root) {
  let text
  try { text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n') } catch { return [`${file} can't be read`] }
  const problems = []
  let inSection = false
  for (const line of text.split('\n')) {
    if (/^## /.test(line)) { inSection = true; continue }
    if (!inSection || !/^- /.test(line)) continue
    const item = line.slice(2, 62)
    const home = line.match(/→\s*(hook|check|script|module|checklist|game|nothing)\b\s*(.*)$/)
    if (!home) { problems.push(`item "${item}…" has no home — end it with "→ hook|check|script|module|checklist|game: <path>" or "→ nothing (why)"`); continue }
    if (home[1] === 'nothing') { if (!/^\(.+\)/.test(home[2])) problems.push(`item "${item}…" → nothing needs a reason in brackets`); continue }
    // a checklist line is the last resort (F80): it says its kind — ② what refuses until it's on record, ③ why nothing can
    if (home[1] === 'checklist' && !/[②③]/.test(home[2])) problems.push(`item "${item}…" → checklist needs its kind in the brackets: "(② <what refuses until it's on record>)" or "(③ <why nothing can check it>)" — or a stronger home (hook / check / script)`)
    const path = (home[2].match(/^:\s*`?([^\s`(]+)/) || [])[1]
    if (!path) { problems.push(`item "${item}…" → ${home[1]} needs the file it landed in ("→ ${home[1]}: <path>")`); continue }
    const full = path.startsWith('~') ? join(homedir(), path.slice(1)) : resolve(root, path)
    if (!existsSync(full.replace(/[.,;:]+$/, ''))) problems.push(`item "${item}…" → ${path} doesn't exist — land the lesson there first`)
  }
  return problems
}
