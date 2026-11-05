// commit-typecheck — no commit with a type error, no bug fix on a red suite (F68, F80 → rule files F184).
import { gitCalls } from '../../lib.mjs'
import { commandCommit } from '../guard-git/_shared.mjs' // the same commit shape guard-git's commit rules read

export default {
  hook: 'commit-typecheck',
  event: 'PreToolUse',
  matcher: 'Bash|PowerShell',
  when: 'Before `git commit`',
  order: ['CT2', 'CT1'],
  commit: ['CT2', 'CT1'], // git's own commit step runs these too (git-hooks/commit-msg)

  async run(ctx) {
    const command = ctx.input.tool_input?.command
    if (!command) return
    const calls = gitCalls(command, ctx.input.cwd)
    for (const [index, { sub, args }] of calls.entries()) {
      if (sub !== 'commit' || args.includes('--dry-run')) continue
      const commit = commandCommit(calls, index, command)
      await ctx.rule('CT2', { commit })
      await ctx.rule('CT1', { commit })
    }
  },
}
