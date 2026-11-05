// stop-unsaved — nothing left unpushed when Muzzy walks away (F80 — a guard, not a reminder → rule file F184).
export default {
  hook: 'stop-unsaved',
  event: 'Stop',
  when: 'When Claude finishes a turn after Muzzy says he\'s stopping',
  order: ['SU1'],

  async run(ctx) {
    // undefined = Muzzy isn't stopping (nothing checked, the send-back count is left as it is); 0 = checked, all saved
    const problems = await ctx.rule('SU1')
    if (problems !== undefined) ctx.stop(problems)
  },
}
