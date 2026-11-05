import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { asksReportOnly, fromMuzzy, reportOnlyFlag } from '../../lib.mjs'

export default {
  id: 'SM4',
  name: 'mode.report-only-flag',
  what: 'Muzzy asks to assess / analyze / "tell me what\'s going on" / "what do you think" (and doesn\'t also say to fix or go ahead) → this turn is report-only: Claude is told, and guard-edits (GE10) refuses edits outside the scratch folders, commits, pushes and deploys until his next message',
  why: 'Muzzy, 2026-11-01: "assess / analyze / tell me what\'s going on" = report only — read, reproduce, report in bullets with options; no edits, no bug logged, no plan-file lines, no commits or publishing until he picks (he had to correct it). A rule only Claude remembered → a hook (audit 2026-11 §5 #1, F185)',
  on: true,
  mode: 'warn',
  tests: 'session-moments',
  check({ event }, { input }) {
    if (event !== 'UserPromptSubmit' || !fromMuzzy(input.prompt)) return undefined // a helper's report doesn't change it
    const flag = reportOnlyFlag(input.session_id)
    if (!asksReportOnly(input.prompt)) { try { unlinkSync(flag) } catch {} ; return undefined }
    try { mkdirSync(dirname(flag), { recursive: true }); writeFileSync(flag, new Date().toISOString()) } catch {}
    return 'Report-only turn (Muzzy asked to assess / analyze / say what\'s going on — his rule, 2026-11-01): read, reproduce, and report in short bullets with options, your pick first. No edits outside the scratchpad / .scratch, no bug logged, no plan-file lines, no commits or publishing until he picks — the hooks refuse them this turn.'
  },
}
