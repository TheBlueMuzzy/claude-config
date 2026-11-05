// The /checkup removal pass (F187) — the bloat test's other half: which hook rules could go, from what they did.
//   node ~/.claude/config/bmuz/scripts/removal-pass.mjs [--days 60] [--now <ISO date>]
// Reads the firing log (~/.claude/logs/bmuz-hooks.jsonl + .1.jsonl; BMUZ_FIRE_LOG = tests) and its history from past
// transcripts (bmuz-hooks-history.jsonl, made by hook-history.mjs; BMUZ_HISTORY_OUT = tests), and PROPOSES — it
// changes nothing; Muzzy decides (BMUZ-PLAN: a removal happens for a reason, never just to shrink):
//   - never fired: a rule with no firing in the window. Rules marked `rare: true` (guards meant to almost never fire —
//     reset --hard, force-push, secrets…) and `mode: 'action'` rules (they do their job without speaking) are left
//     out: silence is them working. The log names rules only since the
//     rule runner (F184), so until it covers the whole window the list is "so far", not a proposal. The history knows
//     hooks (not rules), so a whole hook silent for the window IS a proposal.
//   - cried wolf: a rule whose refusals were mostly "waved" — the same tool call went through within 2 minutes
//     (lib.noteRefusal). Either the fix was made elsewhere (a gate doing its job) or nothing changed (noise) — the
//     proposal says to look. At least 3 refusals, more than half waved.
//   - switched off: a rule with `on: false` — cut it, or switch it back on.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadHook, RULES_DIR } from '../hooks/runner.mjs'

const DAY = 86_400_000
const LOGS = join(homedir(), '.claude', 'logs')
const NOT_A_FIRING = new Set(['crash', 'waved']) // a crash is a bug, not the rule speaking; waved is the measure below

function readLines(file) {
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap(l => { try { return [JSON.parse(l)] } catch { return [] } })
}

export async function removalPass({ days = 60, now = Date.now() } = {}) {
  const logFile = process.env.BMUZ_FIRE_LOG || join(LOGS, 'bmuz-hooks.jsonl')
  const live = [...readLines(logFile.replace(/\.jsonl$/, '.1.jsonl')), ...readLines(logFile)]
  const history = readLines(process.env.BMUZ_HISTORY_OUT || join(LOGS, 'bmuz-hooks-history.jsonl'))
  const from = now - days * DAY
  const inWindow = (e) => { const t = Date.parse(e.t); return t >= from && t <= now }
  const ruleIds = (e) => String(e.rule || '').split(',').filter(Boolean)

  // every rule, from the rule folders
  const rules = []
  for (const hook of readdirSync(RULES_DIR).filter(d => existsSync(join(RULES_DIR, d, '_hook.mjs'))).sort()) {
    const { rules: found } = await loadHook(hook)
    for (const r of found.values()) rules.push({ hook, id: r.id, name: r.name, on: r.on !== false, rare: !!r.rare || r.mode === 'action' })
  }

  // when the log first names rules: before that, "never fired" can't be told for a rule
  const named = live.filter(e => e.rule).map(e => Date.parse(e.t)).filter(Boolean)
  const ruleLogStart = named.length ? Math.min(...named) : now
  const ruleLogDays = Math.floor((now - ruleLogStart) / DAY)
  const fullWindow = ruleLogStart <= from

  const fired = new Map() // rule id → firings in the window
  const refused = new Map()
  const waved = new Map()
  for (const e of live.filter(inWindow)) {
    for (const id of ruleIds(e)) {
      if (e.kind === 'waved') waved.set(id, (waved.get(id) || 0) + 1)
      if (NOT_A_FIRING.has(e.kind)) continue
      fired.set(id, (fired.get(id) || 0) + 1)
      if (e.kind === 'deny') refused.set(id, (refused.get(id) || 0) + 1)
    }
  }
  const hookFired = new Map()
  for (const e of [...live, ...history].filter(inWindow)) if (!NOT_A_FIRING.has(e.kind)) hookFired.set(e.hook, (hookFired.get(e.hook) || 0) + 1)

  const hooks = [...new Set(rules.map(r => r.hook))]
  const silentHooks = hooks.filter(h => !hookFired.get(h) && rules.some(r => r.hook === h && r.on && !r.rare))
  const silent = rules.filter(r => r.on && !r.rare && !fired.get(r.id) && !silentHooks.includes(r.hook))
  const wolves = rules.filter(r => (refused.get(r.id) || 0) >= 3 && (waved.get(r.id) || 0) / refused.get(r.id) > 0.5)
    .map(r => ({ ...r, refused: refused.get(r.id), waved: waved.get(r.id) }))
  const off = rules.filter(r => !r.on)
  return { days, rules: rules.length, rare: rules.filter(r => r.rare).map(r => r.id), fullWindow, ruleLogDays, readyOn: new Date(ruleLogStart + days * DAY).toISOString().slice(0, 10), silentHooks, silent, wolves, off, liveLines: live.length, historyLines: history.length }
}

export function report(p) {
  const out = [`## Removal pass — proposals only (last ${p.days} days; ${p.rules} rules, ${p.liveLines} log lines + ${p.historyLines} history lines)`]
  out.push(`A cut happens for a reason (BMUZ-PLAN bloat test) — each line is a question for Muzzy, nothing is changed.`)
  out.push('', `**Whole hooks that never fired in ${p.days} days** (log + transcript history):`)
  out.push(...(p.silentHooks.length ? p.silentHooks.map(h => `- ${h} — cut it, or fold its rules into another hook?`) : ['- none']))
  if (p.fullWindow) {
    out.push('', `**Rules that never fired in ${p.days} days** (rare guards left out: ${p.rare.join(', ') || 'none'}):`)
    out.push(...(p.silent.length ? p.silent.map(r => `- ${r.id} ${r.name} (${r.hook}) — still needed? does another rule cover it?`) : ['- none']))
  } else {
    out.push('', `**Rules silent so far** — the log names rules only for ${p.ruleLogDays} day(s), so not a proposal yet (a real list from ${p.readyOn}); rare guards left out (${p.rare.join(', ') || 'none'}):`)
    out.push(p.silent.length ? `- ${p.silent.length} rules: ${p.silent.map(r => r.id).join(', ')}` : '- none')
  }
  out.push('', `**Rules that mostly cried wolf** (≥3 refusals, most of them "waved": the same call went through within 2 min — was the fix made elsewhere, or did nothing change?):`)
  out.push(...(p.wolves.length ? p.wolves.map(r => `- ${r.id} ${r.name} — ${r.waved} of ${r.refused} refusals waved through`) : ['- none']))
  out.push('', '**Rules switched off** (`on: false`) — cut, or switch back on:')
  out.push(...(p.off.length ? p.off.map(r => `- ${r.id} ${r.name} (${r.hook})`) : ['- none']))
  return out.join('\n')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined }
  const p = await removalPass({ days: Number(arg('--days') || 60), now: arg('--now') ? Date.parse(arg('--now')) : Date.now() })
  console.log(report(p))
}
