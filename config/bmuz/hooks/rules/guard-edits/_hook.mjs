// guard-edits — edit and command habits that bit us, refused before they happen (F67 → rule files F184).
import { toDir, dropHeredocs } from '../../lib.mjs'
import { writeTargets, heredocBodies, inlineScripts } from './_shell.mjs'

export default {
  hook: 'guard-edits',
  event: 'PreToolUse',
  matcher: 'Bash|PowerShell|Edit|Write|MultiEdit|NotebookEdit',
  when: 'Before an edit or a shell command',
  order: ['GE11', 'GE10', 'GE1', 'GE5', 'GE7', 'GE2', 'GE3', 'GE8', 'GE9', 'GE4', 'GE6'],

  // (GE11) a refusal of this call carries the "three strikes" note too — it's the moment it matters most
  reword(text, ctx) {
    return ctx.strike ? `${text}\n\n${ctx.strike}` : text
  },

  async run(ctx) {
    const { input } = ctx
    const warnings = [] // (GE7) frozen files: said, never refused
    let rewritten = null // (GE2) the command with `set -o pipefail;` in front — passed on, never refused
    const tool = input.tool_name
    const cwd = input.cwd || process.cwd()
    const warn = async (path) => { const text = await ctx.rule('GE7', { path, warnings }); if (text) warnings.push(text) }
    // Allowed — with the frozen-file warnings, if any, shown to Claude (and Muzzy) next to the call. Never a refusal.
    // (GE2) A rewritten command goes back as updatedInput with no permissionDecision, so Claude Code's own permission
    // rules still decide whether it runs (proved live on Claude Code 2.1.318, 2026-11-04).
    const notes = [] // said to Claude only (GE11)
    const finish = () => {
      notes.unshift(...warnings)
      if (rewritten) notes.push('BMUZ added `set -o pipefail;` in front of this command, so a failed check fails the line even through the pipe (GE2).')
      if (notes.length) {
        const out = { hookEventName: 'PreToolUse', additionalContext: notes.join('\n') }
        if (rewritten) out.updatedInput = { ...input.tool_input, command: rewritten }
        const rules = [...(warnings.length ? ['GE7'] : []), ...(rewritten ? ['GE2'] : []), ...(ctx.strike ? ['GE11'] : [])]
        ctx.say({ ...(warnings.length ? { systemMessage: warnings.join('\n') } : {}), hookSpecificOutput: out }, rules.join(','))
      }
      ctx.exit()
    }

    // (GE11) the same refusal or failure 3 times in a row → a note to step back (F185), said beside whatever happens next
    ctx.strike = (await ctx.rule('GE11', {})) || ''
    if (ctx.strike) notes.push(ctx.strike)

    if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
      const file = input.tool_input?.file_path || input.tool_input?.notebook_path
      if (file) await ctx.rule('GE10', { tool, path: toDir(file, cwd) }) // a report-only turn (F185)
      if (file) await ctx.rule('GE1', { path: toDir(file, cwd) })
      if (file && tool === 'Write') await ctx.rule('GE5', { path: toDir(file, cwd), what: 'a new file' })
      if (file) await warn(toDir(file, cwd))
      finish()
    }

    const command = input.tool_input?.command
    if (!command || !['Bash', 'PowerShell'].includes(tool)) finish()

    // The command itself (heredoc text left out — usually a commit message) and the scripts it runs:
    // heredocs fed to python/node, and `python -c` / `node -e` strings.
    const shell = dropHeredocs(command)
    const scripts = [...(/\b(python3?|py|node)\b[^\n]*<</.test(command) ? heredocBodies(command) : []), ...inlineScripts(command)]
    const unquoted = shell.replace(/"(?:\\.|[^"\\])*"|'[^']*'/g, '""') // words inside quotes (a commit message) aren't commands
    const line = { tool, cwd, command, shell, scripts, unquoted }
    await ctx.rule('GE10', line) // a report-only turn: no commits, pushes, deploys, sed -i (F185)

    // writes into a kit copy from the shell (sed -i, >, tee, Set-Content, open(…, 'w'), writeFileSync)
    for (const target of [shell, ...scripts].flatMap(writeTargets)) await ctx.rule('GE1', { path: toDir(target, cwd) })
    // the same writes into a frozen file only warn (said at the end, once every rule has let the command through)
    for (const target of [shell, ...scripts].flatMap(writeTargets)) await warn(toDir(target, cwd))
    rewritten = (await ctx.rule('GE2', line)) || null
    for (const id of ['GE3', 'GE8', 'GE9', 'GE4']) await ctx.rule(id, line)
    await ctx.rule('GE5', line) // new folders / files straight in the home folder
    await ctx.rule('GE6', line)
    finish()
  },
}
