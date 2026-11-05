// sketch-lint — a sketch keeps its sketch kit (F80 — /sketch step 3 was "keep it as is" from memory → rule files F184).
// Also a command: `node sketch-lint.mjs <sketch.html>` prints the problems (exit 1 if any).
// Whether every knob visibly moves something needs a browser — that stays Claude's own check (/sketch step 4).
import { readFileSync } from 'node:fs'

export default {
  hook: 'sketch-lint',
  event: 'PostToolUse',
  matcher: 'Edit|Write|MultiEdit',
  when: 'After Claude writes or edits a sketch (.planning/research/sketches/*.html)',
  order: ['SL1'],

  async cli([file], ctx) {
    const problems = (await ctx.rule('SL1', { html: readFileSync(file, 'utf8') })) || []
    for (const p of problems) console.log(`- ${p}`)
    console.log(problems.length ? `${problems.length} problem(s)` : 'sketch kit OK')
    for (const line of ctx.crashLines()) console.log(line)
    process.exit(problems.length || ctx.crashLines().length ? 1 : 0)
  },
}
