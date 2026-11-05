import { readQueue, frozenEntry } from '../../../scripts/lib.mjs'

export default {
  id: 'GE7',
  name: 'edit.frozen-warn',
  what: 'A file listed in an OPEN extraction-queue entry for its game → allowed, with a warning: bug fixes only, each logged with `extract.mjs fix <id> "<what>"`',
  why: 'A piece being turned into a module must not drift away from it — every fix reaches the module (F114)',
  on: true,
  mode: 'warn',
  tests: 'guard-edits-frozen',
  // returns the warning (one per queue entry); no queue, or one it can't read → nothing
  check({ path, warnings }) {
    let entry = null
    try { entry = frozenEntry(readQueue().entries, path) } catch { return }
    if (!entry || warnings.some(w => w.includes(`as ${entry.id} `))) return
    const normal = path.split('\\').join('/').toLowerCase()
    const file = entry.files.find(f => normal.endsWith(`/${f.toLowerCase()}`)) || path
    return `⚠ ${file} is being extracted as ${entry.id} (${entry.name} · ${entry.status}) — bug fixes only; log each one: node ~/.claude/config/bmuz/scripts/extract.mjs fix ${entry.id} "<what>". A new feature here waits for the swap (or goes into the framework's module).`
  },
}
