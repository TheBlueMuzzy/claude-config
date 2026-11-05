// A wake-up is anything that will tell this session later on its own: a background command (Bash run_in_background)
// or a Monitor. Started = its tool result in the session; over = its task notice (completed, failed, …) or a TaskStop.
import { readFileSync } from 'node:fs'
import { isProgressLine } from './_shared.mjs'

export default {
  id: 'HC10',
  name: 'card.wake-up-armed',
  what: 'A progress line that says it is waiting needs a wake-up still running (a background command or a Monitor), so a helper that goes quiet can never leave Claude waiting with nothing to wake it',
  why: 'Muzzy, 2026-11-04: "is there a way to ensure that doesn\'t happen going forward?" — the F184 helper waited for a "tests finished" notice that never came, the main session waited on the helper with nothing set to wake it, and both sat from ~1 PM until he asked at 10:43 PM',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  check({ message }, ctx) {
    if (!isProgressLine(message) || !/waiting/i.test(message)) return
    let entries = []
    try {
      entries = readFileSync(ctx.input.transcript_path, 'utf8').split('\n').filter(Boolean).map(line => {
        try { return JSON.parse(line) } catch { return null }
      }).filter(Boolean)
    } catch { return }
    // only what the tools and notices said (user-side entries), never Claude's own words
    const said = entries.filter(e => e.type === 'user').map(e => JSON.stringify(e.message?.content ?? '')).join('\n')
    const started = [...said.matchAll(/(?:running in background with ID: |Monitor started \(task )(\w+)/g)].map(m => m[1])
    const over = new Set([
      ...[...said.matchAll(/<task-id>(\w+)<\/task-id>[\s\S]{0,600}?<status>(?:completed|failed|killed|stopped|expired|timed_out|timeout)/g)].map(m => m[1]),
      ...[...said.matchAll(/Successfully stopped task: (\w+)/g)].map(m => m[1]),
    ])
    if (started.some(id => !over.has(id))) return
    return 'This progress line says you are waiting, but nothing is set to wake you — if a helper goes quiet, this session sleeps until Muzzy asks (2026-11-04: ~10 hours). Before handing back, start a wake-up: a background command (Bash run_in_background) that exits when the work you wait on changes (a new commit, a results file) or after at most 20 minutes, e.g. `until [ "$(git -C <repo> log -1 --format=%h)" != "<now>" ]; do sleep 30; done` wrapped in `timeout 1200` — or a Monitor. When it wakes you, look at the helper\'s files yourself, nudge it if it has gone quiet, and post the bar again.'
  },
}
