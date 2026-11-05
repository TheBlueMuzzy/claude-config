import { NEVER_COMMIT } from '../../lib.mjs'
import { rootOf } from './_shared.mjs'

export default {
  id: 'GG6',
  name: 'commit.no-secrets',
  what: 'Refuses a commit holding a `.env` (not .env.example), a key (*.pem, *.key), credentials.json, client_secret*.json, secrets.json, .dev.vars or .playwright-mcp/ — also when added on the same line. The same list /save refuses (lib NEVER_COMMIT)',
  why: 'Once pushed, a secret is on GitHub for good (F78)',
  on: true,
  mode: 'block',
  tests: 'guard-git-safety',
  check({ commit }, { deny }) {
    if (!commit) return
    const root = rootOf(commit)
    if (!root) return
    const bad = commit.files(root).filter(f => NEVER_COMMIT.test(f))
    if (!bad.length) return
    deny(`Blocked: this commit would include ${bad.slice(0, 5).join(', ')}${bad.length > 5 ? ', …' : ''} — secrets (passwords, keys) or Playwright's leftover screenshots must never go into git: once pushed, they're on GitHub for good. Add ${bad.length > 1 ? 'them' : 'it'} to .gitignore (or delete .playwright-mcp/), \`git reset -q -- <file>\` if already staged, then commit again.`)
  },
}
