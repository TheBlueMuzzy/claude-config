// handoff-check — every piece of work is handed to Muzzy the same way (F73, F80 → rule files F184). Global Stop hook.
// If Claude did work this turn (edited a file or committed), its last message must be the hand-off card from
// templates/handoff.md — or, while work is still running, the standard progress line. Missing → sent back until it's
// there (up to 3 times in a row — lib.stopVerdict, F80). Turns that only answer questions are left alone. The card's
// labels are read from the template, so editing the template changes the check.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { readTurn, isCommit, isFileEdit, git } from '../../lib.mjs'
import { isProgressLine } from './_shared.mjs'

export default {
  hook: 'handoff-check',
  event: 'Stop',
  when: 'When Claude finishes a turn',
  order: ['HC1', 'HC5', 'HC6', 'HC7', 'HC3', 'HC9', 'HC8', 'HC2', 'HC4'],

  async run(ctx) {
    const { input } = ctx
    if (!input.transcript_path || !existsSync(input.transcript_path)) ctx.exit()
    const turn = readTurn(input.transcript_path)
    const message = (input.last_assistant_message ?? turn.lastText ?? '').trim()
    const worked = turn.tools.some(tool => isFileEdit(tool) || isCommit(tool))
    const args = { turn, message }
    const problems = []
    const add = (found) => { if (Array.isArray(found)) problems.push(...found); else if (found) problems.push(found) }
    if (worked && !isProgressLine(message)) {
      const card = await ctx.rule('HC1', args)
      // the card is there — now what it promises (F80)
      if (card) problems.push(card)
      else for (const id of ['HC5', 'HC6', 'HC7', 'HC3']) add(await ctx.rule(id, args))
    }
    add(await ctx.rule('HC9', args))
    // only in a game project (PC help like "open your game library in Steam" isn't about Muzzy's game)
    const top = input.cwd && git(input.cwd, 'rev-parse', '--show-toplevel')
    const inProject = top && existsSync(join(top, '.planning'))
    if (inProject) {
      add(await ctx.rule('HC8', args))
      add(await ctx.rule('HC2', { ...args, top }))
    }
    add(await ctx.rule('HC4', args))
    ctx.stop(problems.length && problems.join('\n\n'))
  },
}
