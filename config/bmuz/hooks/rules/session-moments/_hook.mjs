// session-moments — reminders Claude used to have to remember, given at the right moment instead (F67 → rule files F184).
// Hooked on UserPromptSubmit (every message from Muzzy) and PostToolUse Bash|PowerShell (after commits — autonomous runs
// send no messages, but they commit after every task).
export default {
  hook: 'session-moments',
  event: ['UserPromptSubmit', 'PostToolUse'],
  matcher: 'Bash|PowerShell (PostToolUse)',
  when: 'When Muzzy sends a message, and after each commit',
  order: ['SM1', 'SM3', 'SM2'],

  async run(ctx) {
    const event = ctx.input.hook_event_name
    const notes = []
    for (const id of ['SM1', 'SM3', 'SM2']) {
      const note = await ctx.rule(id, { event })
      if (note) notes.push(note)
    }
    if (!notes.length) return
    const text = notes.join('\n\n')
    if (event === 'UserPromptSubmit') ctx.say({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: text } })
    else ctx.say({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text } })
  },
}
