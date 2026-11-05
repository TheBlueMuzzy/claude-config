// When the BMUZ hooks can't even start (F184): runner.mjs or lib.mjs has a syntax error, a missing import, or the
// runner itself broke. Before F184 that crash meant Claude Code quietly allowed everything — 2026-11-04 one typo in
// lib.mjs turned every guard off for ~20 minutes and nobody saw. Now it's said loudly, every time, until it's fixed.
// Node built-ins only (no lib.mjs), so nothing that broke the hooks can break this too.
//
// What each moment does:
//   before a tool call (PreToolUse) → REFUSED, with the reason. A guard that can't run must not wave things through
//     (force-push, reset --hard, a secret in a commit…). The way out stays open: anything touching ~/.claude/config/bmuz
//     or ~/.claude-config (an edit to the broken file, `node --check`, putting a backup back) is let through, loudly.
//   after a tool call (PostToolUse) → a message beside the result (the tool already ran).
//   when Claude finishes (Stop) → sent back once to fix it; on the next stop it only shows the message (no loop).
//   when Muzzy sends a message (UserPromptSubmit) → a note to Claude + a message on screen; his message still goes in.
import { spawnSync } from 'node:child_process'
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// which moment each starter answers (an input from a test or a script may not say)
const EVENTS = {
  'guard-git': 'PreToolUse', 'guard-edits': 'PreToolUse', 'commit-typecheck': 'PreToolUse', 'live-push': 'PreToolUse',
  'lint-edit': 'PostToolUse', 'check-ui-edit': 'PostToolUse', 'rule-kind': 'PostToolUse', 'sketch-lint': 'PostToolUse', 'plan-lint': 'PostToolUse',
  'handoff-check': 'Stop', 'stop-plan-check': 'Stop', 'stop-check-fast': 'Stop', 'stop-unsaved': 'Stop', 'stop-cleanup': 'Stop',
  'session-moments': 'UserPromptSubmit',
}
const REPAIR = /config[\\/]bmuz|\.claude-config/i

export function broken(hook, error) {
  // command mode (`node plan-lint.mjs <dir>`): a person is reading — say it and fail
  if (process.argv.length > 2 && !process.argv[2].startsWith('{')) {
    process.stderr.write(`BMUZ hooks are broken: ${why(error, hook)}\n`)
    process.exitCode = 1
    return
  }
  let input = error?.bmuzInput || {}
  if (!error?.bmuzInput) { try { input = JSON.parse(readFileSync(0, 'utf8')) } catch { input = {} } }
  const event = input.hook_event_name || EVENTS[hook] || ''
  const text = `BMUZ hooks are broken: ${why(error, hook)} — every BMUZ hook (the git guards, the edit guards, the hand-off check, plan-lint…) is off until it's fixed. Fix it in ~/.claude/config/bmuz/hooks/ (anything touching ~/.claude/config/bmuz is still let through), then run node ~/.claude/config/bmuz/hooks/test-hooks.mjs. (A backup of the last good hooks may be in ~/.claude-config/config/bmuz/hooks/.)`
  let answer
  if (event === 'PreToolUse') {
    const tool = input.tool_input || {}
    const repair = [tool.file_path, tool.notebook_path, tool.command, input.cwd].some(t => REPAIR.test(String(t || '')))
    answer = repair
      ? { systemMessage: text, hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: text } }
      : { systemMessage: text, hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: `${text}\nThis call is refused until then — a guard that can't run must not wave things through.` } }
  } else if (event === 'PostToolUse') {
    answer = { decision: 'block', reason: text, systemMessage: text }
  } else if (event === 'Stop' || event === 'SubagentStop') {
    answer = input.stop_hook_active ? { systemMessage: text } : { decision: 'block', reason: text, systemMessage: text }
  } else {
    answer = { systemMessage: text, hookSpecificOutput: { hookEventName: event || 'UserPromptSubmit', additionalContext: text } }
  }
  process.stdout.write(JSON.stringify(answer))
  log(hook, event, input, text)
}

// The error in one line, with the file and line it points at. A syntax error in an imported file doesn't say which file
// (Node 2026-11), so the shared files are checked one by one with `node --check` — only here, when things are broken.
function why(error, hook) {
  const message = String(error?.message || error).split('\n')[0]
  const where = (String(error?.stack || '').match(/file:\/\/\/?((?:[A-Za-z]:)?[^\s):]+\.mjs):(\d+)/) || []) // (C:/… on Windows)
  if (where[1]) return `${message} (${where[1].split('/').slice(-2).join('/')}:${where[2]})`
  const hooks = join(dirname(fileURLToPath(import.meta.url)), '..')
  for (const file of ['lib.mjs', 'runner.mjs', join('rules', hook || '', '_hook.mjs')]) {
    const check = spawnSync(process.execPath, ['--check', join(hooks, file)], { encoding: 'utf8', timeout: 10_000 })
    const at = (check.stderr || '').match(/([^\s\\/]+\.mjs):(\d+)/)
    if (check.status) return `${message} (${file.split('\\').join('/')}${at ? `:${at[2]}` : ''})`
  }
  return message
}

// The firing log line (the same shape as lib.logFiring), kind "crash". Never fails the answer.
function log(hook, event, input, text) {
  try {
    const file = process.env.BMUZ_FIRE_LOG || join(homedir(), '.claude', 'logs', 'bmuz-hooks.jsonl')
    mkdirSync(dirname(file), { recursive: true })
    const line = { t: new Date().toISOString(), hook, rule: '(hooks broken)', event, kind: 'crash', project: basename(input.cwd || process.cwd()), text: text.slice(0, 300), src: 'live' }
    appendFileSync(file, JSON.stringify(line) + '\n')
  } catch {}
}
