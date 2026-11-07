import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readRoadmap } from '../../../templates/ppp/plan-reader.mjs'

export default {
  id: 'HC2',
  name: 'text.feature-names',
  what: 'Every F## of the project\'s ROADMAP (the project the turn edited, committed or `cd`\'d into, else the session folder — F210) said in an answer comes with its name ("F151 — Turn-based starter", or "F151 🧱 Turn-based starter"); `inline code` and ids not in the roadmap are left alone; the message suggests each name',
  why: 'Muzzy, 2026-10-26: "if you bring up F##, it should instead be F## - High Level Name"',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  check({ message, top }) {
    const bare = bareFeatureIds(message, featureNames(top))
    if (bare.length) return `A feature number always comes with its name (Muzzy, 2026-10-26: "if you bring up F##, it should instead be F## - High Level Name") — rewrite ${bare.map(([id, name]) => `${id} → "${id} — ${name}"`).join(', ')}. Every mention, ranges too ("F148–F150" → name each one).`
  },
}

// The project's features: id → its high-level name (the ROADMAP title up to " — ", or ":" on older lines)
function featureNames(dir) {
  const path = join(dir, '.planning', 'ROADMAP.md')
  if (!existsSync(path)) return new Map()
  const { byId } = readRoadmap(readFileSync(path, 'utf8'))
  const names = new Map()
  for (const [id, item] of Object.entries(byId)) {
    const words = (item.title ?? '').split(' — ')[0].split(': ')[0].trim().split(/\s+/)
    names.set(id, words.length > 8 ? words.slice(0, 8).join(' ') + '…' : words.join(' '))
  }
  return names
}

// Feature numbers said without their name. Named = "F151 — Turn-based starter" (any dash) or "F151 🧱 Turn-based
// starter" (its type mark, the roadmap's own way). Only the project's real ids count ("press F12" is a key), and
// `inline code` is skipped (a commit prefix like `F08: done`).
function bareFeatureIds(text, names) {
  if (!names.size) return []
  const plain = text.replace(/`[^`\n]*`/g, '')
  const bare = new Map()
  for (const m of plain.matchAll(/\bF\d+[a-z]?\b/g)) {
    if (!names.has(m[0])) continue
    const after = plain.slice(m.index + m[0].length, m.index + m[0].length + 40)
    // (a name may start with a digit: "F57 — 3D picker")
    if (/^(\s*(❓|🧱|🎮|✨|🔧|🐞)️?)?\s+[—–-]\s+[\p{L}\p{N}]/u.test(after) || /^\s*(❓|🧱|🎮|✨|🔧|🐞)️?\s+[\p{L}\p{N}]/u.test(after)) continue
    // (a quoted example of the bare form — "never a bare "F151"" — is talking about the rule, like "your game")
    if (/["“]$/.test(plain.slice(0, m.index)) && /^["”]/.test(after)) continue
    bare.set(m[0], names.get(m[0]))
  }
  return [...bare]
}
