// stop-check-fast — don't end a turn on broken code (F68; a global Stop hook since F80 → rule file F184).
// F185: first the turn's edited files get the lint rules that used to run after every edit (LE3); errors there send
// Claude back before the (slower) check:fast runs.
export default {
  hook: 'stop-check-fast',
  event: 'Stop',
  when: 'When Claude finishes a turn in which it did work',
  order: ['LE3', 'SC1'],

  async run(ctx) {
    // (sent back again while still red, at most 3 times in a row — lib.stopVerdict — so it never loops forever)
    const lint = await ctx.rule('LE3')
    if (lint) { ctx.stop(lint, 'LE3'); return }
    await ctx.rule('SC1')
  },
}
