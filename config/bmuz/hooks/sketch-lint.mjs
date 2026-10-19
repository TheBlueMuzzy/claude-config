// A sketch keeps its sketch kit (F80 — /sketch step 3 was "keep it as is" from memory). Hooked on Edit|Write|MultiEdit
// (PostToolUse). After Claude writes or edits a sketch (.planning/research/sketches/*.html), check the parts Muzzy
// relies on are still there, and tell Claude what's missing:
//   - a real <title> (the planner's tab name) and <meta name="description"> (its blurb) — not the starter's placeholders
//   - the "Copy values for Claude" button (how his tuned values come back)
//   - presets (+ Preset / Default) and a help line per knob (KNOB_HELP or .help lines)
// Also a command: `node sketch-lint.mjs <sketch.html>` prints the problems (exit 1 if any).
// Whether every knob visibly moves something needs a browser — that stays Claude's own check (/sketch step 4).
import { existsSync, readFileSync } from 'node:fs'
import { readInput, tellClaude } from './lib.mjs'

const SKETCH = /[\\/]\.planning[\\/]research[\\/]sketches[\\/][^\\/]+\.html$/

if (process.argv[2]) {
  const problems = sketchProblems(readFileSync(process.argv[2], 'utf8'))
  for (const p of problems) console.log(`- ${p}`)
  console.log(problems.length ? `${problems.length} problem(s)` : 'sketch kit OK')
  process.exit(problems.length ? 1 : 0)
}

const input = readInput()
const file = input.tool_input?.file_path
if (!file || !SKETCH.test(file) || !existsSync(file)) process.exit(0)
const problems = sketchProblems(readFileSync(file, 'utf8'))
if (problems.length) tellClaude(`This sketch is missing parts of the sketch kit (~/.claude/config/bmuz/templates/sketch/sketch-starter.html — /sketch step 3). Put them back now:\n${problems.map(p => `- ${p}`).join('\n')}`)
process.exit(0)

export function sketchProblems(html) {
  const out = []
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1]?.trim()
  if (!title) out.push('a <title> — the planner\'s Sketches tab uses it as the tab name')
  else if (/^S1: Sketch name$/.test(title)) out.push('a real <title> (still the starter\'s "S1: Sketch name")')
  const description = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || [])[1]?.trim()
  if (!description) out.push('<meta name="description" content="…"> — one sentence: what it tries, what to look for (the tab\'s blurb)')
  else if (/^One sentence: what this sketch tries/.test(description)) out.push('a real description (still the starter\'s placeholder sentence)')
  if (!/Copy values for Claude/.test(html)) out.push('the "Copy values for Claude" button — how Muzzy\'s tuned values come back')
  if (!/\+ Preset|id=["']presets["']/.test(html)) out.push('the presets row (Default, + Preset, up to 3) — Muzzy saves and compares his settings with it')
  if (!/KNOB_HELP|class=["']help["']|\.help\b/.test(html)) out.push('a help line per knob (KNOB_HELP) — what it does in this sketch and when you\'d notice it')
  return out
}
