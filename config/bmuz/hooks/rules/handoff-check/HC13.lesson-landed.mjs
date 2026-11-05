import { statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, resolve } from 'node:path'

const FILE = /[~\w./\\-]*[\w-]+\.(?:md|mjs|cjs|js|ts|tsx|json|sh|ps1)\b/g

export default {
  id: 'HC13',
  name: 'lesson.landed',
  what: 'A message with "Lesson → <file or hook>" needs that file (or that hook\'s files) changed this turn — edited, written, or named in a command that ran — else sent back to put the lesson there first',
  why: 'CLAUDE.md "Reflection on mistakes": a lesson that isn\'t specific to one game goes, the same session, where it can\'t be forgotten — and the report says so in one line ("Lesson → guard-edits hook: …"). Muzzy, 2026-10-07: "intricacies that you\'ve run into and solved, they should remain solved". A line claiming a lesson landed when the file didn\'t change is the lesson lost (audit 2026-11 §5 #7, F185)',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  check({ turn, message }) {
    const since = turn.startedAt ? Date.parse(turn.startedAt) - 5_000 : 0
    const touched = turn.tools.map(t => `${t.input.file_path || ''}\n${t.input.command || ''}`.split('\\').join('/')).join('\n')
    const missing = []
    for (const [, target] of message.matchAll(/Lesson\s*(?:→|->)\s*([^\n]*)/gi)) {
      const head = target.split(/:\s/)[0] // "guard-edits hook: why" → "guard-edits hook"
      const files = (head.match(FILE) || []).map(f => f.replace(/[`*]/g, ''))
      const hooks = [...head.matchAll(/`?([\w-]+)`?\s+hook\b/gi)].map(m => m[1])
      if (!files.length && !hooks.length) continue // names no file: nothing to check
      const landed = files.some(f => touched.includes(basename(f)) || changedSince(f, since)) ||
        hooks.some(h => new RegExp(`hooks/(rules/)?${h}\\b`, 'i').test(touched))
      if (!landed) missing.push(head.trim().slice(0, 80))
    }
    if (!missing.length) return undefined
    return `You wrote "Lesson → ${missing.join('", "Lesson → ')}", but that file didn't change this turn. Put the lesson there now (a hook or check if it can be enforced, else one line where the rule lives), then report it — or drop the line.`
  },
}

// A path that resolves on this machine (~/… or absolute) and changed since the turn began
function changedSince(file, since) {
  const path = file.replace(/^~(?=[\\/])/, homedir())
  if (!/^([a-zA-Z]:)?[\\/]/.test(path)) return false
  try { return statSync(resolve(path)).mtimeMs >= since } catch { return false }
}
