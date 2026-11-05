import { git } from '../../lib.mjs'
import { rulesOf } from '../../runner.mjs'
import { PLAN_FILES, LISTING, TURN_END, lintProject } from '../plan-lint/_lint.mjs'

export default {
  id: 'PL32',
  name: 'plan.cross-file',
  what: 'When a turn that edited ROADMAP / SPRINT ends: plan-lint\'s rules that compare two plan files or follow a run of ROADMAP edits (PL2 sprint feature 🔨, PL4 sprint feature in ROADMAP, PL5 ready rule, PL6 needs first, PL14 graph) — the problems that are new since the turn began',
  why: 'After each edit they fired before the second file\'s edit landed (SPRINT written a moment before ROADMAP): PL2 ~75 % noise, PL4 mostly (audit 2026-11). Once at the end of the turn keeps every real catch (F185)',
  on: true,
  mode: 'block',
  tests: 'stop-plan-check',
  async check({ root, p, name, turn, input }) {
    if (!p.touchedPlan) return undefined
    const lint = await rulesOf('plan-lint', input)
    const now = (await lintProject(lint, root)).filter(x => TURN_END.includes(x.rule))
    if (!now.length) return undefined
    // problems already there when the turn began (the last commit before it) aren't this turn's — they don't nag
    const base = turn.startedAt && git(root, 'rev-list', '-1', `--before=${turn.startedAt}`, 'HEAD')
    let old = new Set()
    if (base) {
      const texts = { [LISTING]: [] }
      for (const file of PLAN_FILES) texts[file] = git(root, 'show', `${base}:.planning/${file}`)?.replace(/\r\n/g, '\n') ?? null
      old = new Set((await lintProject(lint, root, texts)).map(x => `${x.file} ${x.message}`))
    }
    const fresh = now.filter(x => !old.has(`${x.file} ${x.message}`))
    if (!fresh.length) return undefined
    return `${name}: the plan files disagree after this turn's edits (plan-lint, checked once at the end of the turn):\n${fresh.map(x => `  - ${x.file}${x.line ? `:${x.line}` : ''}  ${x.message}`).join('\n')}`
  },
}
