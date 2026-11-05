// Helpers the handoff-check rules share (F184 — moved out of handoff-check.mjs unchanged).
import { readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { git, gitCalls, isCommit, isFileEdit } from '../../lib.mjs'

const TEMPLATE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'templates', 'handoff.md')
export const LOCAL_LINK = /https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?[^\s)<>`'"]*/g

export function templateLabels() {
  try {
    const card = readFileSync(TEMPLATE, 'utf8').split('## The card')[1]?.split('```')[1] ?? ''
    const labels = [...card.matchAll(/\*\*([^*:]+):\*\*/g)].map(m => m[1].trim())
    if (labels.length) return labels
  } catch { /* template missing — fall back */ }
  return ['Done', "You'll see", 'Try it', 'Proof', 'Your to-dos', 'Questions', 'Next']
}

// The text after **Label:** up to the next **Label:** (or the end); null when the label isn't there.
export function section(text, label) {
  const match = text.match(new RegExp(`\\*\\*${escape(label)}:?\\*\\*:?([\\s\\S]*?)(?=\\n\\s*\\*\\*[^*\\n]+:?\\*\\*|$)`, 'i'))
  return match ? match[1] : null
}

export function isProgressLine(text) {
  return /[█░]{10}\s+\d{1,3}%\s+·\s+\d+\/\d+[^\n]*·[^\n]*left[^\n]*·\s*posted\s+\d{1,2}:\d{2}\s*(AM|PM)/i.test(text)
}

export function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// The projects this turn worked in: where it edited files and where it committed.
export function projectRoots(turn) {
  const roots = new Set()
  const add = (dir) => { const top = dir && git(dir, 'rev-parse', '--show-toplevel'); if (top) roots.add(resolve(top)) }
  for (const t of turn.tools) {
    if (isFileEdit(t) && t.input.file_path) add(dirname(resolve(t.cwd || '.', t.input.file_path)))
    if (isCommit(t)) for (const c of gitCalls(t.input.command, t.cwd)) if (c.sub === 'commit') add(c.dir)
  }
  return roots
}

export function readPlan(root, name) {
  try { return readFileSync(join(root, '.planning', name), 'utf8').replace(/\r\n/g, '\n') } catch { return null }
}
