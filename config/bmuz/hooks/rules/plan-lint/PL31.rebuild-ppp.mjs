import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { git } from '../../lib.mjs'

const BUILD_PPP = join(homedir(), '.claude', 'config', 'bmuz', 'templates', 'ppp', 'build-ppp.mjs')

export default {
  id: 'PL31',
  name: 'plan.rebuild-ppp',
  what: 'After a plan edit, rebuilds the planner page (.planning/ppp.html, gitignored) when the project has one, and notes the rebuild for stop-plan-check (SP2: republish it)',
  why: 'The planner page always shows the plan as it is now (F67)',
  on: true,
  mode: 'action',
  tests: 'plan-lint',
  // returns a note for Claude only when the rebuild failed
  check({ project }) {
    const page = join(project, '.planning', 'ppp.html')
    if (!existsSync(page) && git(project, 'check-ignore', '-q', '.planning/ppp.html') === null) return ''
    try {
      execFileSync(process.execPath, [BUILD_PPP, project], { encoding: 'utf8', timeout: 20_000, stdio: 'pipe' })
    } catch (error) {
      return `\n(the planner page didn't rebuild: ${String(error.stderr || error.message).split('\n')[0]})`
    }
    const gitDir = git(project, 'rev-parse', '--absolute-git-dir')
    if (gitDir) writeFileSync(join(gitDir, 'bmuz-ppp-rebuilt'), new Date().toISOString())
    return ''
  },
}
