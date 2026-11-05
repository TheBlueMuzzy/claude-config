// guard-git — Muzzy's git "never" rules and the commit checks, before a shell command runs (F68 → rule files F184).
import { gitCalls, commands } from '../../lib.mjs'
import { commandCommit } from './_shared.mjs'

// The rules checked on each git call, in this order (the first refusal wins — as in the old guard-git.mjs)
const EACH_CALL = ['GG14', 'GG6', 'GG7', 'GG4', 'GG8', 'GG9', 'GG10', 'GG11', 'GG12', 'GG13', 'GG5', 'GG1', 'GG2', 'GG3']

export default {
  hook: 'guard-git',
  event: 'PreToolUse',
  matcher: 'Bash|PowerShell',
  when: 'Before a shell command',
  order: EACH_CALL,
  // the commit rules git's own commit step runs too (git-hooks/commit-msg) — with the real staged files and message
  commit: ['GG6', 'GG4', 'GG8', 'GG9', 'GG10', 'GG11', 'GG12', 'GG13'],

  // These checks read the files BEFORE the command runs, so a plan edit earlier on the same line as the commit isn't
  // seen yet — say so in every refusal on such a line (Claude hit it 3 times on 2026-10-19: done, done, Sprint NN)
  reword(text, { input }) {
    const editsBeforeCommit = /(sed\s+-i|python|node\s+-e|Set-Content|Out-File|>>?\s*\S)[\s\S]*git\s+(-C\s+\S+\s+)?commit/.test(input.tool_input?.command || '')
    return editsBeforeCommit ? `${text}\n(This line also edits files before the commit, and this check runs before the line does — make the edit in its own command first, then commit.)` : text
  },

  async run(ctx) {
    const command = ctx.input.tool_input?.command
    if (!command) return
    const calls = gitCalls(command, ctx.input.cwd)
    const discards = [] // GG7 is refused after every call on the line was checked — so every lost file is named at once
    for (const [index, call] of calls.entries()) {
      const commit = call.sub === 'commit' && !call.args.includes('--dry-run') ? commandCommit(calls, index, command) : null
      for (const id of EACH_CALL) {
        const found = await ctx.rule(id, { calls, index, call, commit, command })
        if (id === 'GG7' && found) discards.push(found)
      }
    }
    // (F80) merge.mjs / rollback.mjs change main inside their own process, where the git calls can't be seen
    for (const { words } of commands(command, ctx.input.cwd)) await ctx.rule('GG5', { words })
    if (discards.length) ctx.deny(discards.join('\n\n'), 'GG7')
  },
}
