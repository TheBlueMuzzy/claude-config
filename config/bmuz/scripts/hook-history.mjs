// Hook firing history (F181) — what the BMUZ hooks said in past sessions, read back from Claude Code's own transcripts.
//   node ~/.claude/config/bmuz/scripts/hook-history.mjs [projectsDir]   (default ~/.claude/projects)
// Reads every session transcript (<projectsDir>/*/*.jsonl, and helpers' <session>/subagents/*.jsonl), writes each time a
// hook spoke to ~/.claude/logs/bmuz-hooks-history.jsonl (BMUZ_HISTORY_OUT = tests) — rewritten every run, so it can be
// run again — in the live log's shape (hooks/lib.mjs logFiring) with src "history" and the session file. Then prints,
// per hook: how often by kind, how many sessions it fired in, and its 5 most frequent texts.
// How the answers show up in a transcript (2026-11-04, Claude Code 2.1.3xx):
//   - a Stop / PostToolUse send-back → an attachment "hook_blocking_error" with the hook's command → kind block
//   - a PreToolUse refusal → the tool's result "PreToolUse:Bash hook error: <reason>" (no command, so the hook is
//     told apart by its words — DENY_SIGNS) → kind deny
//   - additionalContext → an attachment "hook_additional_context" / "hook_system_message" with only the event name;
//     one hook speaks that way per event (CONTEXT_BY_EVENT) → kind context
//   - a hook that crashed → "hook_non_blocking_error" with the command and its stderr → kind stderr
//   - the session-start notes (crash-news 🐞, live-ping "⚠ … is DOWN", producer-notes 📅, templates-check) → lines inside the
//     SessionStart "hook_success" text (a long one is only a 2 KB preview, so a note past it is missed)
// Not counted: "ask" answers (the transcript shows only Muzzy's choice, if anything), the stop_hook_summary and "Stop hook
// feedback" copies of a send-back, and Claude Code's own "PostToolUse hook modified <file>" note.
import { createReadStream, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { homedir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { projectName } from '../hooks/lib.mjs'

// A refusal's words → the PreToolUse hook that says them (anything else from Bash / PowerShell is guard-git's)
const DENY_SIGNS = [
  ['guard-edits', /^Blocked: (this (writes a code file|pipes a check|Python writes a code file|`node -e|makes .* straight in the home folder)|stop local servers|\S+ is this game's COPY|a running process uses this folder)/],
  ['commit-typecheck', /^Blocked: (the type check failed|"\(suite already red|"Fix )/],
  ['live-push', /^Blocked: .*(deploys the live site|puts code live|smoke pass|has an open P0)/],
  ['spike', /^SPIKE-BLOCKED/], // the F68 spike (2026-10-18), before the real hooks
]
const CONTEXT_BY_EVENT = [
  [/^UserPromptSubmit|^PostToolUse:(Bash|PowerShell)/, 'session-moments'],
  [/^PostToolUse:/, 'plan-lint'],
  [/^PreToolUse:/, 'guard-edits'],
]

const hookOf = (command = '') => (command.match(/hooks[\\/]([\w-]+)\.mjs/) || command.match(/([\w-]+)\.(mjs|sh)/) || [])[1] || 'unknown'
const textOf = (content) => typeof content === 'string' ? content : Array.isArray(content) ? content.map(c => typeof c === 'string' ? c : c?.text || '').join('\n') : ''

// Every time a hook spoke in one transcript entry: [{ t, hook, event, kind, cwd, text, key }] (key = for dropping copies)
export function firingsIn(entry) {
  const found = []
  const add = (hook, event, kind, text, key, fullKey) => found.push({ t: entry.timestamp || '', hook, event, kind, cwd: entry.cwd || '', text: String(text || '').trim(), key: fullKey || `${entry.uuid || ''}|${key}` })
  const a = entry.attachment
  if (entry.type === 'attachment' && a) {
    const event = a.hookEvent || (a.hookName || '').split(':')[0]
    if (a.type === 'hook_blocking_error') add(hookOf(a.blockingError?.command), event, event === 'PreToolUse' ? 'deny' : 'block', a.blockingError?.blockingError, 'b')
    if (a.type === 'hook_non_blocking_error') add(hookOf(a.command), event, 'stderr', String(a.stderr || '').replace(/^Failed with non-blocking status code: /, ''), 'e')
    if (a.type === 'hook_additional_context' || a.type === 'hook_system_message') {
      const text = textOf(a.content)
      const hook = (CONTEXT_BY_EVENT.find(([re]) => re.test(a.hookName || '')) || [])[1] || 'unknown'
      // guard-edits sends the same warning as both — counted once per tool call
      if (!/^PostToolUse hook modified /.test(text)) add(hook, event, 'context', text, '', `${a.toolUseID || entry.uuid}|${hook}|context`)
    }
    if (a.type === 'hook_success' && event === 'SessionStart') {
      const lines = String(a.content || a.stdout || '').split('\n')
      const producer = lines.filter(l => /^📅 |^ {2}⚠ |^ {2}→ producer notes/.test(l))
      for (const l of lines) {
        if (/^🐞 /.test(l)) add('crash-news', event, 'context', l, `c${l}`)
        if (/^⚠ .* is DOWN — /.test(l)) add('live-ping', event, 'context', l, `l${l}`)
        if (/^Test scripts behind the BMUZ templates/.test(l)) add('templates-check', event, 'context', l, 't')
      }
      if (producer.length) add('producer-notes', event, 'context', producer.join('\n'), 'p')
    }
  }
  if (entry.type === 'user' && Array.isArray(entry.message?.content)) {
    entry.message.content.forEach((part, i) => {
      if (part?.type !== 'tool_result') return
      const m = textOf(part.content).match(/^PreToolUse:(\w+) hook error: ([\s\S]*)/)
      if (!m) return
      const [, tool, reason] = m
      const hook = (DENY_SIGNS.find(([, re]) => re.test(reason)) || [])[0] || (/^(Bash|PowerShell)$/.test(tool) ? 'guard-git' : 'guard-edits')
      add(hook, 'PreToolUse', 'deny', reason, `d${i}`)
    })
  }
  return found
}

// The transcripts under a projects folder: <project>/<session>.jsonl and <project>/<session>/subagents/*.jsonl
export function transcripts(projectsDir) {
  const files = []
  const list = (dir) => { try { return readdirSync(dir, { withFileTypes: true }) } catch { return [] } }
  for (const project of list(projectsDir).filter(d => d.isDirectory())) {
    const dir = join(projectsDir, project.name)
    for (const item of list(dir)) {
      if (item.isFile() && item.name.endsWith('.jsonl')) files.push(join(dir, item.name))
      if (item.isDirectory()) for (const sub of list(join(dir, item.name, 'subagents'))) if (sub.isFile() && sub.name.endsWith('.jsonl')) files.push(join(dir, item.name, 'subagents', sub.name))
    }
  }
  return files
}

// Read them all → the history lines (oldest first), each hook answer once
export async function readHistory(projectsDir) {
  const seen = new Set()
  const out = []
  for (const file of transcripts(projectsDir)) {
    const lines = createInterface({ input: createReadStream(file, 'utf8'), crlfDelay: Infinity })
    for await (const line of lines) {
      if (!line.includes('hook')) continue // most lines never mention one — skip parsing them
      let entry
      try { entry = JSON.parse(line) } catch { continue }
      for (const f of firingsIn(entry)) {
        if (seen.has(f.key)) continue // a resumed or copied session repeats its entries
        seen.add(f.key)
        out.push({ t: f.t, hook: f.hook, event: f.event, kind: f.kind, project: f.cwd ? projectName(f.cwd) : '', text: f.text.slice(0, 300), src: 'history', session: basename(file), sessionId: entry.sessionId || basename(file, '.jsonl') })
      }
    }
  }
  return out.sort((x, y) => String(x.t).localeCompare(String(y.t)))
}

// The summary table: hook → total, count by kind, sessions it fired in, then its 5 most frequent texts
export function summary(history) {
  const KINDS = ['deny', 'ask', 'block', 'context', 'stderr']
  const hooks = {}
  for (const h of history) {
    const s = hooks[h.hook] ||= { total: 0, kinds: {}, sessions: new Set(), texts: {} }
    s.total++
    s.kinds[h.kind] = (s.kinds[h.kind] || 0) + 1
    s.sessions.add(h.sessionId)
    const short = h.text.replace(/\s+/g, ' ').slice(0, 80)
    s.texts[short] = (s.texts[short] || 0) + 1
  }
  const rows = Object.entries(hooks).sort((a, b) => b[1].total - a[1].total)
  const lines = [`${'hook'.padEnd(18)} ${'total'.padStart(6)} ${KINDS.map(k => k.padStart(7)).join(' ')} ${'sessions'.padStart(8)}`]
  for (const [hook, s] of rows) lines.push(`${hook.padEnd(18)} ${String(s.total).padStart(6)} ${KINDS.map(k => String(s.kinds[k] || 0).padStart(7)).join(' ')} ${String(s.sessions.size).padStart(8)}`)
  for (const [hook, s] of rows) {
    lines.push('', `${hook} — most frequent:`)
    for (const [text, n] of Object.entries(s.texts).sort((a, b) => b[1] - a[1]).slice(0, 5)) lines.push(`  ${String(n).padStart(5)}  ${text}`)
  }
  return lines.join('\n')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const projectsDir = process.argv[2] || join(homedir(), '.claude', 'projects')
  const outFile = process.env.BMUZ_HISTORY_OUT || join(homedir(), '.claude', 'logs', 'bmuz-hooks-history.jsonl')
  const history = await readHistory(projectsDir)
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, history.map(({ sessionId, ...line }) => JSON.stringify(line)).join('\n') + (history.length ? '\n' : ''))
  const sessions = new Set(history.map(h => h.sessionId)).size
  console.log(`${history.length} hook answers in ${sessions} sessions (${transcripts(projectsDir).length} transcripts) → ${outFile}\n`)
  console.log(summary(history))
}
