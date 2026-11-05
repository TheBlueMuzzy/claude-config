// The BMUZ rule runner (F184). Every hook file Claude Code starts (guard-git.mjs, handoff-check.mjs, …) is a starter
// that calls main('<hook>'). The runner loads that hook's rules from rules/<hook>/ — one small file per rule — runs
// them the way rules/<hook>/_hook.mjs says (its `order`, or its own `run` steps), and gives Claude Code ONE answer.
//
// A rule file:  export default { id, name, what, why, on, mode, tests, check(args, ctx) }
//   id    — the short id the audit and the firing log use (GG2, HC1…) · name — a readable one ("git.no-force-push")
//   what  — what it does, one line · why — the reason, with Muzzy's words + date where there are some
//   on    — false switches the rule off · mode — block | warn | action | log (what kind of answer it gives; log = the
//           firing log only, nothing said — ctx.log, F185)
//   tests — the test-hooks.mjs suite that proves it
//   check — returns what it found (a message, a list, …) for the hook's steps to use, or answers itself:
//           ctx.deny(text) / ctx.ask(text) / ctx.tell(text) stop the hook right there, like the old deny() did
//
// Fail loudly (2026-11-04: one typo in lib.mjs silently turned every hook off for ~20 minutes):
//   - a rule that crashes, or a rule file that won't load, is skipped — the other rules still run — and Claude is told
//     which rule broke (logged as kind "crash" with the rule's id);
//   - if this file or lib.mjs can't load at all, the starter hands over to fallback/broken.mjs, which says so loudly
//     (and, before a tool call, refuses it — a guard that can't run must not wave things through).
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readInput, say, stopVerdict, logFiring, setFiringRule } from './lib.mjs'

export const RULES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'rules')

// An answer ends the hook where it stands (the old hooks called process.exit right after deny()). Thrown, caught below.
class Answer {
  constructor(kind, text, rule) { this.kind = kind; this.text = text; this.rule = rule }
}

// A hook's description (_hook.mjs) and its rules. A rule file that won't load is kept as `broken` (reported, skipped).
export async function loadHook(hook) {
  const dir = join(RULES_DIR, hook)
  const spec = (await import(pathToFileURL(join(dir, '_hook.mjs')).href)).default
  const rules = new Map()
  const broken = new Map()
  for (const file of readdirSync(dir).filter(f => f.endsWith('.mjs') && !f.startsWith('_')).sort()) {
    const id = file.split('.')[0]
    try {
      const rule = (await import(pathToFileURL(join(dir, file)).href)).default
      if (!rule || rule.id !== id) throw new Error(`${file} must export default { id: '${id}', … }`)
      rules.set(id, { ...rule, file })
    } catch (error) {
      broken.set(id, { file, error })
    }
  }
  return { spec, rules, broken }
}

export async function main(hook) {
  const loaded = await loadHook(hook)
  const { spec } = loaded
  const { ctx, crashes, crashed, spoke, pending: deferred } = makeRun(hook, loaded)

  // command mode (`node plan-lint.mjs <dir>`, `rule-kind.mjs --all`, `sketch-lint.mjs <file>`): a report for a person
  if (spec.cli && process.argv.length > 2) return spec.cli(process.argv.slice(2), ctx)

  ctx.input = readInput()
  const event = ctx.input.hook_event_name || [spec.event].flat()[0]
  let answer = null
  try {
    if (spec.run) await spec.run(ctx)
    else for (const id of spec.order) await ctx.rule(id)
  } catch (error) {
    if (error instanceof Answer) answer = error
    else crashed(hook, error) // the hook's own steps (_hook.mjs run) broke — the rules after it didn't run
  }
  // a hook can add a line to every refusal (guard-git: "this line edits files before the commit…")
  if (answer?.kind === 'deny' && spec.reword) {
    try { answer.text = spec.reword(answer.text, ctx) } catch (error) { crashed(hook, error) }
  }

  const pending = deferred()
  try {
    for (const c of crashes) {
      setFiringRule(c.id)
      logFiring('crash', `${c.id}: ${firstLine(c.error)}`, event)
    }
    setFiringRule(answer?.rule || (!answer && pending?.rule) || spoke.join(','))
    answerOnce({ hook, event, input: ctx.input, answer, pending, note: crashNote(hook, crashes) })
  } catch (error) {
    error.bmuzInput = ctx.input // stdin is already read: the fallback answers from this
    throw error
  }
  process.exit(0)
}

// git's own commit step (git-hooks/commit-msg, F184): the commit rules of guard-git and commit-typecheck — each
// _hook.mjs lists them as `commit` — on the commit as git really makes it (staged files, the real message).
// Returns { refusal: text or '', rule, crashes: [lines] }. Nothing is written to stdout here (git-hooks/ says it).
export async function checkCommit(commit) {
  const crashLines = []
  for (const hook of ['guard-git', 'commit-typecheck']) {
    const loaded = await loadHook(hook)
    const { ctx, crashes } = makeRun(hook, loaded)
    ctx.input = { cwd: commit.dir, hook_event_name: 'git commit-msg' }
    try {
      for (const id of loaded.spec.commit || []) await ctx.rule(id, { commit })
    } catch (error) {
      if (!(error instanceof Answer)) throw error
      if (error.kind === 'deny') {
        setFiringRule(error.rule)
        logFiring('deny', error.text, 'git commit-msg', commit.dir)
        return { refusal: error.text, rule: error.rule, crashes: [...crashLines, ...crashes.map(c => crashLine(hook, c))] }
      }
    } finally {
      for (const c of crashes) { setFiringRule(c.id); logFiring('crash', `${c.id}: ${firstLine(c.error)}`, 'git commit-msg', commit.dir) }
    }
    crashLines.push(...crashes.map(c => crashLine(hook, c)))
  }
  return { refusal: '', rule: '', crashes: crashLines }
}

// Another hook's rules, run from inside a rule (F185: stop-plan-check's PL32 runs plan-lint's two-file rules at turn
// end). Returns that hook's ctx — a crash in one of its rules is caught and skipped like any other.
export async function rulesOf(hook, input = {}) {
  const { ctx } = makeRun(hook, await loadHook(hook))
  ctx.input = input
  return ctx
}

// One hook's run: the ctx its steps and rules get, and what they found. (main and checkCommit share it.)
function makeRun(hook, { spec, rules, broken }) {
  const crashes = [] // { id, file, error }
  const crashed = (id, error) => { if (!crashes.some(c => c.id === id)) crashes.push({ id, file: rules.get(id)?.file || broken.get(id)?.file || '_hook.mjs', error }) }
  // the hook's list and its folder agree — a rule file nobody runs, or a listed rule with no file, is a mistake to hear about
  for (const id of rules.keys()) if (!spec.order.includes(id)) crashed(id, new Error(`${rules.get(id).file} isn't in rules/${hook}/_hook.mjs's order, so it never runs`))
  for (const id of spec.order) if (!rules.has(id) && !broken.has(id)) crashed(id, new Error(`rules/${hook}/_hook.mjs lists ${id}, but there's no ${id}.*.mjs file`))

  const spoke = [] // rules whose check found something — the firing log names them
  let current = null
  let pending = null // a deferred answer: { kind: 'say', answer } | { kind: 'stop', problems }
  const ctx = {
    hook,
    input: {},
    // Run one rule's check. A crash is caught here (reported, the hook goes on); an answer goes up and ends the hook.
    async rule(id, args = {}) {
      const rule = rules.get(id)
      if (!rule) { crashed(id, broken.get(id)?.error || new Error(`no rule ${id}`)); return undefined }
      if (rule.on === false) return undefined
      const before = current
      current = id
      try {
        const found = await rule.check(args, ctx)
        if (found && (!Array.isArray(found) || found.length) && !spoke.includes(id)) spoke.push(id)
        return found
      } catch (error) {
        if (error instanceof Answer) { error.rule = error.rule || id; throw error }
        crashed(id, error)
        return undefined
      } finally {
        current = before
      }
    },
    deny(text, rule) { throw new Answer('deny', text, rule || current) },
    ask(text, rule) { throw new Answer('ask', text, rule || current) },
    tell(text, rule) { throw new Answer('tell', text, rule || current) }, // after a tool ran: a message beside its result
    exit() { throw new Answer('none') }, // nothing to say — the hook is done
    say(answer, rule) { pending = { kind: 'say', answer, rule } }, // any other answer (a context note, a warning); the hook goes on
    stop(problems, rule) { pending = { kind: 'stop', problems, rule } }, // a Stop hook's send-back, counted (lib.stopVerdict)
    // mode "log" (F185): written to the firing log only — Claude and Muzzy see nothing; for measuring a rule before it speaks
    log(text, rule) { setFiringRule(rule || current); logFiring('log', text, ctx.input.hook_event_name, ctx.input.cwd); setFiringRule('') },
    // the crashes so far, as report lines (command mode prints them — there's no hook answer to carry them)
    crashLines: () => crashes.map(c => crashLine(hook, c)),
  }
  return { ctx, crashes, crashed, spoke, pending: () => pending }
}

const crashLine = (hook, c) => `⚠ rule ${c.id} crashed (rules/${hook}/${c.file}): ${firstLine(c.error)}`

// What Claude Code gets: the hook's answer, with the crash note (if any) added so a broken rule is never silent.
function answerOnce({ hook, event, input, answer, pending, note }) {
  const withNote = (text) => (note ? (text ? `${text}\n\n${note}` : note) : text)
  if (answer && (answer.kind === 'deny' || answer.kind === 'ask')) {
    return say({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: answer.kind, permissionDecisionReason: withNote(answer.text) }, ...(note ? { systemMessage: note } : {}) })
  }
  if (answer?.kind === 'tell') return say({ decision: 'block', reason: withNote(answer.text), ...(note ? { systemMessage: note } : {}) })
  if (pending?.kind === 'stop' || (note && event === 'Stop' && !pending)) {
    const problems = pending?.problems || ''
    return stopVerdict(hook, input, withNote(problems) || problems)
  }
  if (pending?.kind === 'say') {
    if (!note) return say(pending.answer)
    const out = structuredClone(pending.answer)
    if (out.decision === 'block') out.reason = withNote(out.reason)
    else { out.hookSpecificOutput = { hookEventName: event, ...out.hookSpecificOutput }; out.hookSpecificOutput.additionalContext = withNote(out.hookSpecificOutput.additionalContext) }
    out.systemMessage = out.systemMessage ? `${out.systemMessage}\n\n${note}` : note
    return say(out)
  }
  if (!note) return
  // nothing else to say, but a rule broke: tell Claude (and show Muzzy) — never let it pass in silence
  if (event === 'PostToolUse') return say({ decision: 'block', reason: note, systemMessage: note })
  return say({ systemMessage: note, hookSpecificOutput: { hookEventName: event, additionalContext: note } })
}

function crashNote(hook, crashes) {
  if (!crashes.length) return ''
  const list = crashes.map(c => `${c.id} (rules/${hook}/${c.file}): ${firstLine(c.error)}`).join('\n- ')
  return `⚠ BMUZ hook rule${crashes.length > 1 ? 's' : ''} crashed in ${hook} — skipped, the other rules still ran:\n- ${list}\nFix it in ~/.claude/config/bmuz/hooks/rules/${hook}/, then run node ~/.claude/config/bmuz/hooks/test-hooks.mjs.`
}

function firstLine(error) {
  const text = String(error?.message || error).split('\n')[0]
  const at = (String(error?.stack || '').match(/\((file:[^)]+)\)|at (file:\S+)/) || []).slice(1).find(Boolean)
  return at ? `${text} (at ${at.replace(/^file:\/+/, '').split('/').slice(-3).join('/')})` : text
}
