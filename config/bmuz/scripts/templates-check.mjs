// TEMPLATE COPIES BEHIND? (framework F203) — a game's copies of the BMUZ templates (check-all.mjs, ports.mjs, …) against
// the templates, by the version line each copy keeps (`// template: ports.mjs 2 (2026-11-03)`). The list of templates,
// where a game keeps each copy and what each version added: ~/.claude/config/bmuz/templates/TEMPLATES.md.
//   node templates-check.mjs [game folder]             every copy: behind (what's new) · no version line (an old copy) · current
//   node templates-check.mjs [game folder] --session   only the copies to bring current, one line each, and NOTHING when
//                                                      all are current — session-start.sh runs this; it never fails (exit 0)
// BMUZ_TEMPLATES = another templates folder (the tests). Reads only; changes nothing.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates')
const TEMPLATES = process.env.BMUZ_TEMPLATES || DEFAULT

// `// template: ports.mjs 2 (2026-11-03) …` (or `#` in YAML), anywhere in the file → { name, n }
export function versionLine(text) {
  const m = text.match(/^\s*(?:\/\/|#)\s*template:\s*(\S+)\s+(\d+)\b/m)
  return m ? { name: m[1], n: Number(m[2]) } : null
}

// TEMPLATES.md → [{ name, copy, how: 'copy' | 'merge', keep, versions: [{ n, text }], newest }]
export function templateList(dir = TEMPLATES) {
  const file = join(dir, 'TEMPLATES.md')
  if (!existsSync(file)) return []
  const list = []
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const head = line.match(/^## (\S+) → (\S+)\s*·\s*(copy|merge)(?:\s*\(keep:\s*([^)]*)\))?/)
    if (head) { list.push({ name: head[1], copy: head[2], how: head[3], keep: head[4]?.trim() || '', versions: [] }); continue }
    const version = line.match(/^- (\d+) \([^)]*\):\s*(.*)$/)
    if (version && list.length) list.at(-1).versions.push({ n: Number(version[1]), text: version[2].trim() })
  }
  for (const t of list) t.newest = Math.max(0, ...t.versions.map(v => v.n))
  return list.filter(t => t.newest > 0)
}

// The copy's path is hand-written in TEMPLATES.md — re-checked before it is read: relative, and inside the game
function insideGame(game, path) {
  if (isAbsolute(path) || /^[a-z]:/i.test(path)) return null
  const full = resolve(game, path)
  const rel = relative(game, full)
  return rel && !rel.startsWith('..') && !isAbsolute(rel) ? full : null
}

const lf = (text) => text.replace(/\r\n/g, '\n')

// Each template → its copy in the game: { ...template, status: 'behind' | 'unversioned' | 'current' | 'own' | 'none' |
// 'bad-path', have, whatsNew }
export function checkCopies(game, dir = TEMPLATES) {
  game = resolve(game)
  return templateList(dir).map(t => {
    const full = insideGame(game, t.copy)
    if (!full) return { ...t, status: 'bad-path' }
    if (!existsSync(full)) return { ...t, status: 'none' }
    let text = ''
    try { text = lf(readFileSync(full, 'utf8')) } catch { return { ...t, status: 'none' } }
    const line = versionLine(text)
    if (!line || line.name !== t.name) {
      // No version line: an old copy only if it holds the template's title (the start of the line after its version
      // line) — the framework's own .github/workflows/checks.yml is not a copy. Word for word the template → current.
      let template = ''
      try { template = lf(readFileSync(join(dir, t.name), 'utf8')) } catch { return { ...t, status: 'own' } }
      const body = template.slice(template.indexOf('\n') + 1)
      const title = body.split('\n')[0].slice(0, 30).trim()
      if (text === body) return { ...t, status: 'current', have: t.newest }
      return { ...t, status: title && text.includes(title) ? 'unversioned' : 'own' }
    }
    if (line.n >= t.newest) return { ...t, status: 'current', have: line.n } // a copy ahead of these templates says nothing
    const whatsNew = t.versions.filter(v => v.n > line.n).sort((a, b) => a.n - b.n).map(v => v.text).join('; ')
    return { ...t, status: 'behind', have: line.n, whatsNew }
  })
}

const shown = (dir) => (resolve(dir) === resolve(DEFAULT) ? '~/.claude/config/bmuz/templates' : dir.split('\\').join('/'))
const short = (text, most = 180) => (text.length > most ? `${text.slice(0, most - 1)}…` : text)
const fix = (t, dir) => t.how === 'copy'
  ? `copy ${shown(dir)}/${t.name} over it`
  : `merge in ${shown(dir)}/${t.name}${t.keep ? ` (keep its ${t.keep})` : ''}`

// One line for a copy to bring current
export function staleLine(t, dir = TEMPLATES) {
  if (t.status === 'behind') return `${t.name} ${t.have} → ${t.newest} (${t.copy}): ${short(t.whatsNew)} — ${fix(t, dir)}`
  return `${t.name} (${t.copy}) has no version line — an old copy; the template is at ${t.newest} — ${fix(t, dir)}${t.how === 'merge' ? ', its first line too' : ''}`
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2)
  const session = argv.includes('--session')
  const game = argv.find(a => !a.startsWith('--')) || '.'
  let copies = []
  try { copies = checkCopies(game) } catch (e) { if (!session) console.log(`✗ couldn't read the templates: ${e.message}`) }
  const stale = copies.filter(t => t.status === 'behind' || t.status === 'unversioned')
  if (session) {
    if (stale.length) {
      console.log('Test scripts behind the BMUZ templates — bring each current on the work branch (a small commit), tell Muzzy in one line:')
      for (const t of stale) console.log(`  ${staleLine(t)}`)
    }
  } else {
    console.log(`Template copies in ${resolve(game)} (templates: ${shown(TEMPLATES)}):`)
    if (!copies.length) console.log('  (no templates listed — is TEMPLATES.md there?)')
    for (const t of copies) {
      if (t.status === 'current') console.log(`  ✓ ${t.name} ${t.have} (${t.copy}) — current`)
      else if (t.status === 'none') console.log(`  · ${t.name} — not copied here (${t.copy})`)
      else if (t.status === 'own') console.log(`  · ${t.name} — ${t.copy} is this project's own file, not a copy (it lacks the template's title)`)
      else if (t.status === 'bad-path') console.log(`  ✗ ${t.name} — TEMPLATES.md says "${t.copy}", outside the game: not read (fix the heading in TEMPLATES.md)`)
      else console.log(`  ! ${staleLine(t)}`)
    }
  }
  process.exit(0)
}
