import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { unknownFeature } from './_lint.mjs'

export default {
  id: 'PL22',
  name: 'plan.task-paths-real',
  what: 'The file paths a task names after its last " — " exist (or their folder does — a file the task will create)',
  why: '"Look at the code first" — a task that names files that aren\'t there was planned from memory (F80)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ sprint, roadmap, dir, add }) {
    for (const feature of sprint.features) {
      if (unknownFeature(feature, roadmap)) continue
      for (const step of feature.steps) {
        for (const path of taskPaths(step.text)) {
          // the project's own files; the framework's sprints also name BMUZ's files (~/.claude/config/bmuz/…, then "templates/x.md")
          const bases = path.startsWith('~') ? [homedir()] : [dir, join(homedir(), '.claude', 'config', 'bmuz'), join(homedir(), '.claude')]
          const real = bases.some(base => { const full = join(base, path.replace(/^~[\\/]?/, '')).replace(/[\\/]+$/, ''); return existsSync(full) || existsSync(dirname(full)) })
          if (!real) add('SPRINT.md', step.lineNo, `${feature.id} task names ${path}, but neither it nor its folder exists — look at the code and name the real files`)
        }
      }
    }
  },
}

// The file paths a task names after its last " — " ("… — src/a.ts, content/x/"): words with a slash or a file
// extension, no spaces. "(tuning)", "answered 2026-10-19 (…)" and plain words aren't paths.
function taskPaths(text) {
  const dash = text.lastIndexOf(' — ')
  if (dash < 0) return []
  return text.slice(dash + 3).split(/,\s*|\s+\+\s+/).map(w => w.trim().replace(/^`|`$/g, '').replace(/\s*\((stand-in|tuning)\)$/, ''))
    .filter(w => w && !/\s/.test(w) && /^[\w.~@-]/.test(w) && (/\//.test(w) || /\.[a-z]{1,5}$/i.test(w)) && !/^https?:/.test(w) && !/^\d/.test(w))
}
