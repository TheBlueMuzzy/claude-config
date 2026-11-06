// handoff-check — every piece of work is handed to Muzzy the same way (F73, F80 → rule files F184). Global Stop hook.
// If Claude did work this turn (edited a file or committed), its last message must be the hand-off card from
// templates/handoff.md — or, while work is still running, the standard progress line. Turns that only answer
// questions are left alone. The card's labels are read from the template, so editing the template changes the check.
// Two kinds of problem (Muzzy, 2026-11-06: "why do I get double messages like this?" — a send-back shows him the
// same message twice):
//   substance (a dead link, no screenshot, no feel question, no weighing, no wake-up, an idea or lesson not landed)
//     → sent back until it's there (up to 3 times in a row — lib.stopVerdict, F80); wording slips found with it go too
//   wording only (the card's labels, feature names, the sprint header, the clock, "your game", numbered questions)
//     → not sent back: logged, and handed to Claude with Muzzy's next message (session-moments SM5)
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { readTurn, didWork, git, wordingNoteFile } from '../../lib.mjs'
import { isProgressLine } from './_shared.mjs'

const WORDING = new Set(['HC1', 'HC2', 'HC3', 'HC4', 'HC8', 'HC12'])

export default {
  hook: 'handoff-check',
  event: 'Stop',
  when: 'When Claude finishes a turn',
  order: ['HC1', 'HC5', 'HC6', 'HC7', 'HC3', 'HC9', 'HC8', 'HC2', 'HC4', 'HC10', 'HC11', 'HC12', 'HC13', 'HC14'],

  async run(ctx) {
    const { input } = ctx
    if (!input.transcript_path || !existsSync(input.transcript_path)) ctx.exit()
    const turn = readTurn(input.transcript_path)
    const message = (input.last_assistant_message ?? turn.lastText ?? '').trim()
    const worked = didWork(turn) // a real edit (not the scratchpad / .scratch / memory) or a real commit (F185)
    const args = { turn, message }
    const problems = [] // { id, text }
    const check = async (id, extra = args) => {
      const found = await ctx.rule(id, extra)
      for (const text of [found].flat()) if (text) problems.push({ id, text })
      return found
    }
    if (worked && !isProgressLine(message)) {
      // the card is there — now what it promises (F80)
      if (!(await check('HC1'))) for (const id of ['HC5', 'HC6', 'HC7', 'HC3']) await check(id)
    }
    await check('HC9')
    // only in a game project (PC help like "open your game library in Steam" isn't about Muzzy's game)
    const top = input.cwd && git(input.cwd, 'rev-parse', '--show-toplevel')
    const inProject = top && existsSync(join(top, '.planning'))
    if (inProject) {
      await check('HC8')
      await check('HC2', { ...args, top })
    }
    await check('HC4')
    await check('HC10') // a waiting progress line has a wake-up running (2026-11-04)
    // judgement rules that became hooks (F185): an idea / a lesson really landed, questions numbered everywhere,
    // and long paragraphs — that one only logged while it's measured
    for (const id of ['HC11', 'HC12', 'HC13', 'HC14']) await check(id)

    const noteFile = wordingNoteFile(input.session_id)
    if (problems.some(p => !WORDING.has(p.id))) {
      try { unlinkSync(noteFile) } catch {} // everything is in this send-back
      ctx.stop(problems.map(p => p.text).join('\n\n'))
      return
    }
    if (problems.length) {
      for (const p of problems) ctx.log(p.text, p.id)
      const text = 'Your last hand-off slipped on wording (not sent back, so Muzzy saw it once — 2026-11-06). Get it right in this turn\'s hand-off:\n\n' + problems.map(p => p.text).join('\n\n')
      try { mkdirSync(dirname(noteFile), { recursive: true }); writeFileSync(noteFile, text) } catch {}
    }
    ctx.stop('') // nothing sent back (and the send-back count starts over — lib.stopVerdict)
  },
}
