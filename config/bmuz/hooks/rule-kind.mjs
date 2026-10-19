// Every rule says how it happens (F80 — Muzzy, 2026-10-19: "'only runs when it remembers' is a bad thing. 'always runs
// because it triggers' is much more solid"). A rule line in BMUZ's own instructions ("always…", "never…", "must…",
// "make sure…", "remember to…") is marked with its kind:
//   ① a script or hook does it · ② Claude's judgement, refused until it's on record · ③ judgement only (say why)
// Two ways to run it:
//   - PostToolUse hook on Edit|Write|MultiEdit: after Claude edits a skill (~/.claude/skills/*/SKILL.md), a BMUZ doc
//     (~/.claude/config/bmuz/**/*.md) or ~/.claude/CLAUDE.md, NEW rule lines without a mark are shown to Claude to mark
//     — and, if it's really "remembered", to make it ① or ② instead. Old lines are left alone (the F80 audit sorted them).
//     A Write is compared with the last synced copy in ~/.claude-config, so only lines new since then count.
//   - `node rule-kind.mjs --all` lists every unmarked rule line (for /checkup and the milestone look-back).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { readInput, tellClaude } from './lib.mjs'

const HOME = process.env.BMUZ_HOME || homedir() // (tests use their own folder)
const LIVE = join(HOME, '.claude')
const SYNCED = join(HOME, '.claude-config')
const RULE = /\b(always|never|every time|each time|must(?!:)|make sure|remember to|don'?t forget|do not forget)\b/i // (not "must:alpha" — a scope tag)
const MARK = /[①②③]/

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
function watched(path) {
  const rel = relative(LIVE, path).split('\\').join('/')
  if (rel.startsWith('..')) return false
  // (templates/GDD.md and TDD.md are skeletons copied into a game — their "must" / "never" are the game's own rules)
  return /^skills\/[^/]+\/SKILL\.md$/.test(rel) || /^config\/bmuz\/.+\.md$/.test(rel) && !/^config\/bmuz\/reviews\//.test(rel) && !/^config\/bmuz\/templates\/(GDD|TDD)\.md$/.test(rel) || rel === 'CLAUDE.md'
}

if (process.argv.includes('--all')) {
  const files = [join(LIVE, 'CLAUDE.md')]
  const skills = join(LIVE, 'skills')
  for (const name of existsSync(skills) ? readdirSync(skills) : []) files.push(join(skills, name, 'SKILL.md'))
  const walk = (dir) => { for (const name of readdirSync(dir)) { const p = join(dir, name); if (statSync(p).isDirectory()) { if (name !== 'reviews') walk(p) } else if (name.endsWith('.md')) files.push(p) } }
  if (existsSync(join(LIVE, 'config', 'bmuz'))) walk(join(LIVE, 'config', 'bmuz'))
  let total = 0
  for (const file of files.filter(f => existsSync(f) && watched(f))) {
    const lines = unmarked(readFileSync(file, 'utf8'))
    if (!lines.length) continue
    total += lines.length
    console.log(`${relative(LIVE, file).split('\\').join('/')} — ${lines.length}`)
    for (const line of lines) console.log(`    ${line.slice(0, 140)}`)
  }
  console.log(`\n${total} rule line(s) without ①/②/③ — each is either remembered-only (make it ① or ②) or needs its mark.`)
  process.exit(0)
}

const input = readInput()
const file = input.tool_input?.file_path
if (!file || !watched(resolve(file))) process.exit(0)

let added = []
if (input.tool_name === 'Write') {
  const synced = join(SYNCED, relative(LIVE, resolve(file)))
  const before = new Set(existsSync(synced) ? unmarked(readFileSync(synced, 'utf8')) : [])
  added = unmarked(input.tool_input.content || '').filter(line => !before.has(line))
} else {
  const edits = input.tool_input?.edits || [{ old_string: input.tool_input?.old_string, new_string: input.tool_input?.new_string }]
  for (const edit of edits) {
    const before = new Set(unmarked(edit.old_string || ''))
    added.push(...unmarked(edit.new_string || '').filter(line => !before.has(line)))
  }
  // an edit can replace PART of a line: judge the whole line as it is now in the file — its mark may sit before the
  // edited part (found in use: a HOOKS.md row "| 5 ① | …" edited mid-line was flagged)
  let now = []
  try { now = readFileSync(resolve(file), 'utf8').replace(/\r\n/g, '\n').split('\n') } catch {}
  added = added.filter(part => { const whole = now.find(l => l.includes(part)); return !whole || !MARK.test(whole) })
}
if (!added.length) process.exit(0)
tellClaude(`New rule line(s) in ${file} don't say how they happen (F80):\n${added.slice(0, 8).map(l => `- ${l.slice(0, 160)}`).join('\n')}\nMark each: ① a script or hook does it (name it) · ② judgement, but a hook/script refuses until it's on record (name it) · ③ judgement only (say why it can't be checked). If it's really "Claude must remember", make it ① or ② instead — a hook or a script step — and mark it then.`)
