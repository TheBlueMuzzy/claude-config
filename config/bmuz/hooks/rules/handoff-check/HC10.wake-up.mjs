// A wake-up is anything that will tell this session later on its own: a background command (Bash run_in_background)
// or a Monitor. Started = its tool result in the session; over = its task notice (completed, failed, …) or a TaskStop.
import { readFileSync } from 'node:fs'
import { isProgressLine } from './_shared.mjs'

// tuning-ok: Muzzy's cap on a check-in (2026-11-08) — the longest a session may go without looking at running work
const MAX_SECONDS = 20 * 60

/** How long a running wake-up can last, in seconds (Infinity when nothing caps it). */
function lengthOf(id, entries, said) {
  const monitor = said.match(new RegExp(`Monitor started \\(task ${id}, expires in (\\d+)s`))
  if (monitor) return Number(monitor[1])
  // the tool call that started this background command: its result names the id; the call itself has the command
  const result = entries.flatMap(e => (e.type === 'user' && Array.isArray(e.message?.content) ? e.message.content : []))
    .find(c => c.type === 'tool_result' && JSON.stringify(c.content ?? '').includes(`with ID: ${id}`))
  const call = result && entries.flatMap(e => (e.type === 'assistant' && Array.isArray(e.message?.content) ? e.message.content : []))
    .find(c => c.type === 'tool_use' && c.id === result.tool_use_id)
  const capped = String(call?.input?.command ?? '').match(/(?:^|[;&|(\s])timeout\s+(\d+)([smh]?)(?=\s)/)
  if (!capped) return Infinity
  return Number(capped[1]) * ({ m: 60, h: 3600 }[capped[2]] ?? 1)
}

export default {
  id: 'HC10',
  name: 'card.wake-up-armed',
  what: 'A hand-back that says work goes on by itself (a progress line, or "nothing to type") needs a wake-up still running (a background command or a Monitor), so a helper that goes quiet can never leave Claude waiting with nothing to wake it',
  why: 'Muzzy, 2026-11-04: "is there a way to ensure that doesn\'t happen going forward?" — the F184 helper waited for a "tests finished" notice that never came, the main session waited on the helper with nothing set to wake it, and both sat from ~1 PM until he asked at 10:43 PM',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  check({ message }, ctx) {
    // Any hand-back that says the work goes on by itself — a progress line, or the card's "nothing to type" Next — not
    // only one with the word "waiting" (2026-11-07: "wakes me" / "I keep going" slipped past, the F210 helper hung and
    // main sat 5 h until Muzzy came home: "i thought we had something in place… so you didn't wait for five hours")
    if (!isProgressLine(message) && !/nothing to type/i.test(message)) return
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
    const running = started.filter(id => !over.has(id))
    // 2026-11-08 (Muzzy: "yes" — cap check-ins at 20 minutes): a wake-up counts only if it ends within MAX_SECONDS —
    // a Monitor's "expires in Ns", or a background command wrapped in `timeout N` (s/m/h). A 5-hour sleep isn't a check-in.
    if (running.some(id => lengthOf(id, entries, said) <= MAX_SECONDS)) return
    if (running.length) return `A wake-up is running, but nothing ends it within ${MAX_SECONDS / 60} minutes — a long check (or a helper) can hang for hours with it. Start a check-in that ends within ${MAX_SECONDS / 60} minutes: a background command wrapped in \`timeout ${MAX_SECONDS}\` (e.g. \`timeout ${MAX_SECONDS} bash -c 'until [ "$(git -C <repo> log -1 --format=%h)" != "<now>" ]; do sleep 30; done'\`) or a Monitor that expires within ${MAX_SECONDS} s. When it wakes you, look at the work yourself and start the next one.`
    return 'This progress line says you are waiting, but nothing is set to wake you — if a helper goes quiet, this session sleeps until Muzzy asks (2026-11-04: ~10 hours). Before handing back, start a wake-up: a background command (Bash run_in_background) that exits when the work you wait on changes (a new commit, a results file) or after at most 20 minutes, e.g. `until [ "$(git -C <repo> log -1 --format=%h)" != "<now>" ]; do sleep 30; done` wrapped in `timeout 1200` — or a Monitor. When it wakes you, look at the helper\'s files yourself, nudge it if it has gone quiet, and post the bar again.'
  },
}
