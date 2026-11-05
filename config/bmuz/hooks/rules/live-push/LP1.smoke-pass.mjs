import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { git } from '../../lib.mjs'

const SMOKE_FILE = '.planning/smoke-pass'
export const HOW_TO = 'Run the smoke test first: `node ~/.claude/config/bmuz/hooks/smoke-pass.mjs` in the project (it runs the project\'s `smoke` script — the game loads and one turn/round plays, console clean — and records the pass in .planning/smoke-pass; commit that file). Then try again.'

export default {
  id: 'LP1',
  name: 'live.smoke-pass',
  what: 'Refuses going live (a push to a branch a deploy workflow publishes, or npm run deploy / gh-pages / party:deploy / wrangler deploy / butler push) unless `.planning/smoke-pass` names a commit and only docs changed since (.planning/, *.md, crash maps)',
  why: 'Nothing untested reaches players (F68). It finds by itself which branch publishes each project',
  on: true,
  rare: true, // a guard for something that should almost never happen: silence means it works (F187 removal pass)
  mode: 'block',
  tests: 'live-push',
  check({ root, commit, what, checkUncommitted }, { deny }) {
    const file = join(root, SMOKE_FILE)
    if (!existsSync(file)) deny(`Blocked: ${what} puts code live, and there's no smoke pass yet. ${HOW_TO}`)
    const passed = readFileSync(file, 'utf8').split('\n')[0].trim()
    if (git(root, 'rev-parse', '--verify', '--quiet', `${passed}^{commit}`) === null) {
      deny(`Blocked: ${what} — the smoke pass names a commit this repo doesn't have (${passed || 'empty'}). ${HOW_TO}`)
    }
    const changed = (git(root, 'diff', '--name-only', passed, commit) || '').split('\n').filter(Boolean)
    if (checkUncommitted) {
      for (const f of (git(root, 'diff', '--name-only', 'HEAD') || '').split('\n').filter(Boolean)) changed.push(f)
      for (const f of (git(root, 'ls-files', '--others', '--exclude-standard') || '').split('\n').filter(Boolean)) changed.push(f)
    }
    const code = changed.filter(f => !isDocs(f))
    if (code.length) {
      const list = code.slice(0, 8).join(', ') + (code.length > 8 ? ` and ${code.length - 8} more` : '')
      deny(`Blocked: ${what} — code changed since the last smoke pass (${passed.slice(0, 7)}): ${list}. ${HOW_TO}`)
    }
  },
}

// Crash maps (releases/<version>/maps/) are build output kept for reading crash reports, never shipped — committing
// them after the release build (Glyphtender v0.12.0) shouldn't need a second smoke pass
function isDocs(file) {
  return file.startsWith('.planning/') || file.endsWith('.md') || /^releases\/[^/]+\/maps\//.test(file)
}
