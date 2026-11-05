import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { git } from '../../lib.mjs'
import { PLAN_FILES, LISTING } from './_lint.mjs'

// What may sit in .planning/ (PROJECT-FILES "Layout"): the plan files, the optional folders, and what the tools write
const ALLOWED = new Set([...PLAN_FILES, 'GDD.md', 'TDD.md', 'design', 'research', 'bugs', 'archive', 'ppp.html', 'smoke-pass', 'live-pass', 'STATE.md.bak', 'extractions.md']) // extractions.md: the framework's extraction queue (F114)

export default {
  id: 'PL19',
  name: 'plan.no-stray-files',
  what: 'Nothing else in .planning/ besides GDD, TDD, ROADMAP, SPRINT, BUGS, STATE + design/ research/ bugs/ archive/ and the tools\' own files (gitignored ones pass) — only in a BMUZ project',
  why: 'The plan folder stays the same in every game, so every tool finds what it reads (PROJECT-FILES "Layout", F80)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ dir, texts, add }) {
    let names = texts ? texts[LISTING] || [] : []
    if (!texts) try { names = readdirSync(join(dir, '.planning')) } catch {}
    for (const name of names.filter(n => !ALLOWED.has(n) && !n.startsWith('.'))) {
      if (!texts && git(dir, 'check-ignore', '-q', `.planning/${name}`) !== null) continue // gitignored: the tools' own
      add(LISTING, null, `.planning/${name} doesn't belong in .planning/ — only GDD, TDD, ROADMAP, SPRINT, BUGS, STATE + design/ research/ bugs/ archive/ (PROJECT-FILES "Layout"). Move it into research/ or design/ (or archive/ once its rules are in Key facts)`)
    }
  },
}
