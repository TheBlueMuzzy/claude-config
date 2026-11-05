// What rule-kind reads (F184 — moved out of rule-kind.mjs unchanged): which files are BMUZ's own instructions, and
// which of their lines are rules without a ①②③ mark.
import { homedir } from 'node:os'
import { join, relative } from 'node:path'

export const HOME = process.env.BMUZ_HOME || homedir() // (tests use their own folder)
export const LIVE = join(HOME, '.claude')
export const SYNCED = join(HOME, '.claude-config')
const RULE = /\b(always|never|every time|each time|must(?!:)|make sure|remember to|don'?t forget|do not forget)\b/i // (not "must:alpha" — a scope tag)
export const MARK = /[①②③]/

// Rule lines that don't say how they happen. Code blocks and headings are skipped.
export function unmarked(text) {
  const out = []
  let inCode = false
  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    if (/^\s*```/.test(line)) { inCode = !inCode; continue }
    if (inCode || /^#/.test(line) || /^---$/.test(line.trim()) || /^(name|description):/.test(line)) continue
    if (RULE.test(line) && !MARK.test(line)) out.push(line.trim())
  }
  return out
}

// Is this one of BMUZ's own instruction files?
export function watched(path) {
  const rel = relative(LIVE, path).split('\\').join('/')
  if (rel.startsWith('..')) return false
  // (templates/GDD.md and TDD.md are skeletons copied into a game — their "must" / "never" are the game's own rules)
  return /^skills\/[^/]+\/SKILL\.md$/.test(rel) || /^config\/bmuz\/.+\.md$/.test(rel) && !/^config\/bmuz\/reviews\//.test(rel) && !/^config\/bmuz\/templates\/(GDD|TDD)\.md$/.test(rel) || rel === 'CLAUDE.md'
}
