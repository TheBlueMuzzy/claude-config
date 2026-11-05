// plan-lint — plan files stay well-formed (F67 → rule files F184).
// After Claude edits .planning/ROADMAP.md, SPRINT.md, BUGS.md or STATE.md: check the rules from PROJECT-FILES.md,
// tell Claude about any problem in the file it just edited, and rebuild the planner page (.planning/ppp.html).
// After an edit of STATE.md, a Log over 10 entries is trimmed here: the oldest move to archive/log.md (PL1, F117).
// Also a command: `node plan-lint.mjs <projectDir>` prints every problem (exit 1 if any) — it only reports, never
// rewrites a file (a check that edits would change the files it's checking).
import { basename, dirname, resolve } from 'node:path'
import { git } from '../../lib.mjs'
import { PLAN_FILES, LISTING, LINT_RULES, lintProject } from './_lint.mjs'

export default {
  hook: 'plan-lint',
  event: 'PostToolUse',
  matcher: 'Edit|Write|MultiEdit',
  when: 'After Claude edits ROADMAP, SPRINT, BUGS or STATE',
  order: ['PL1', ...LINT_RULES, 'PL31'],

  async cli([dir], ctx) {
    const problems = await lintProject(ctx, resolve(dir))
    for (const p of problems) console.log(`${p.file}:${p.line || ''}  ${p.message}`)
    console.log(problems.length ? `${problems.length} problem(s)` : 'plan files OK')
    for (const line of ctx.crashLines()) console.log(line)
    process.exit(problems.length || ctx.crashLines().length ? 1 : 0)
  },

  async run(ctx) {
    const file = ctx.input.tool_input?.file_path
    if (!file) return
    const full = resolve(file)
    if (basename(dirname(full)) !== '.planning' || !PLAN_FILES.includes(basename(full))) return
    const project = dirname(dirname(full))
    const trimNote = (await ctx.rule('PL1', { full, project })) || ''

    // Only problems that are new since the last commit: old ones (history, another session's files) don't nag every edit.
    const before = {}
    for (const name of PLAN_FILES) before[name] = git(project, 'show', `HEAD:.planning/${name}`)
    before[LISTING] = (git(project, 'ls-tree', '--name-only', 'HEAD', '.planning/') || '').split('\n').filter(Boolean).map(p => basename(p))
    const old = new Set((await lintProject(ctx, project, before)).map(p => `${p.file} ${p.message}`))
    // problems with the .planning folder itself show on any plan edit
    const mine = (await lintProject(ctx, project)).filter(p => (p.file === basename(full) || p.file === '.planning/') && !old.has(`${p.file} ${p.message}`))
    const pppNote = (await ctx.rule('PL31', { project })) || ''
    if (mine.length) {
      const lines = mine.map(p => `- ${p.file}${p.line ? `:${p.line}` : ''}  ${p.message}`)
      ctx.tell(`plan-lint found problems in .planning/${basename(full)} (rules: ~/.claude/config/bmuz/PROJECT-FILES.md) — fix them now:\n${lines.join('\n')}${pppNote}${trimNote ? `\n${trimNote}` : ''}`,
        [...new Set([...mine.map(p => p.rule), ...(trimNote ? ['PL1'] : [])])].join(','))
    }
    if (trimNote) ctx.say({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: trimNote } }, 'PL1')
  },
}
