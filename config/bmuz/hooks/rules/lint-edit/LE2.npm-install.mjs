import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export default {
  id: 'LE2',
  name: 'lint.install-once',
  what: 'A project with an ESLint setup but no ESLint installed → tells Claude once per session to run `npm install` there (never downloads anything itself)',
  why: '"The framework needs `npm install` once" was only remembered — without it nothing there was linted, silently (F80)',
  on: true,
  mode: 'warn',
  tests: 'lint-edit',
  check({ root }, { input, tell }) {
    const dir = process.env.BMUZ_CTX_DIR || join(homedir(), '.claude', 'ctx') // (tests use their own folder)
    const flag = join(dir, `${input.session_id || 'session'}.lint-${createHash('sha1').update(root).digest('hex').slice(0, 10)}`)
    if (existsSync(flag)) return
    try { mkdirSync(dir, { recursive: true }); writeFileSync(flag, root) } catch {}
    tell(`${root} has an ESLint setup but ESLint isn't installed there (no node_modules), so nothing you edit there is being linted. Run \`npm install\` in that folder once (said once per session).`)
  },
}
