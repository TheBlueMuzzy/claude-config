import { git } from '../../lib.mjs'
import { rootOf } from './_shared.mjs'

// A hook rule file (config/bmuz/hooks/rules/<hook>/<ID>.<name>.mjs — not a `_` helper), wherever the repo keeps it
const RULE_FILE = /(^|\/)config\/bmuz\/hooks\/rules\/[^/]+\/[^_/][^/]*\.mjs$/
// A framework module folder: top level, holding kit/ or a VERSION file
const MODULE_PART = /^([^/.][^/]*)\/(kit\/|VERSION$)/

export default {
  id: 'GG15',
  name: 'commit.says-what-it-replaces',
  what: 'Refuses a commit that ADDS a new hook rule file (config/bmuz/hooks/rules/…) or a new top-level module folder (with kit/ or VERSION) without a `Replaces: …` line in its message (`Replaces: nothing — <why>` is fine). Every other commit is untouched',
  why: 'The bloat test both ways (Muzzy, 2026-11-04: "sometimes we add things that facilitate removing other things") — an addition says what it replaces, at the moment it lands (F187)',
  on: true,
  rare: true, // a guard for something that should almost never happen: silence means it works (F187 removal pass)
  mode: 'block',
  tests: 'guard-git-replaces',
  check({ commit }, { deny }) {
    if (!commit) return
    if (/\bReplaces:\s*\S/i.test(commit.text || '')) return
    const root = rootOf(commit)
    if (!root) return
    const files = commit.files(root)
    // new = not in the last commit (no last commit yet: everything is new)
    const isNew = (path) => !git(root, 'ls-tree', '--name-only', 'HEAD', '--', path)
    const added = files.filter(f => RULE_FILE.test(f) && isNew(f))
    const modules = [...new Set(files.map(f => (f.match(MODULE_PART) || [])[1]).filter(Boolean))].filter(isNew)
    const named = [...added, ...modules.map(m => `${m}/ (a new module)`)]
    if (!named.length) return
    deny(`Blocked: this commit adds ${named.slice(0, 4).join(', ')}${named.length > 4 ? ', …' : ''} — the bloat test both ways (BMUZ-PLAN): an addition says what it replaces. Add a line to the commit message: \`Replaces: <the rule / step / module it makes unnecessary>\`, or \`Replaces: nothing — <why it's needed anyway>\` (e.g. \`git commit -m "…" -m "Replaces: nothing — a new guard for X"\`), then commit again.`)
  },
}
