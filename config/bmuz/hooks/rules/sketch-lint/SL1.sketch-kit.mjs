import { existsSync, readFileSync } from 'node:fs'

const SKETCH = /[\\/]\.planning[\\/]research[\\/]sketches[\\/][^\\/]+\.html$/

export default {
  id: 'SL1',
  name: 'sketch.kit-parts',
  what: 'After a sketch is written or edited: tells Claude what\'s missing from the sketch kit — a real <title> and description (not the starter\'s), "Copy values for Claude", presets, a help line per knob, a typeable number box beside each slider',
  why: 'The planner\'s Sketches tab and Muzzy\'s tuning loop depend on them (F80); Muzzy types the value he wants (2026-10-24)',
  on: true,
  rare: true, // a guard: silent because the mistake rarely happens (removal pass skips it — F187)
  mode: 'block',
  tests: 'sketch-lint',
  // a hook call (the edited file), or the command's { html } → returns the problems
  check({ html }, ctx) {
    if (html !== undefined) return sketchProblems(html)
    const file = ctx.input.tool_input?.file_path
    if (!file || !SKETCH.test(file) || !existsSync(file)) return
    const problems = sketchProblems(readFileSync(file, 'utf8'))
    if (problems.length) ctx.tell(`This sketch is missing parts of the sketch kit (~/.claude/config/bmuz/templates/sketch/sketch-starter.html — /sketch step 3). Put them back now:\n${problems.map(p => `- ${p}`).join('\n')}`)
  },
}

function sketchProblems(html) {
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
  if (/type=["']range["']/.test(html) && !/<input\b[^>]*\btype=["']number["']/.test(html)) out.push('a typeable number box beside each slider (the starter\'s <input class="num" type="number"> + showKnob) — Muzzy types the value he wants, even past the slider\'s ends')
  return out
}
