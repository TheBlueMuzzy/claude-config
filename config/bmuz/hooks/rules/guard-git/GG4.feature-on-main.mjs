import { defaultBranch } from '../../lib.mjs'
import { rootOf } from './_shared.mjs'

export default {
  id: 'GG4',
  name: 'commit.no-feature-code-on-main',
  what: 'Refuses a `F08: …` commit with code on main — feature work goes on the work branch and reaches main through /deliver. Plan/doc commits and tiny fixes (no `F08:`) are fine',
  why: 'Main only changes through /deliver (F67)',
  on: true,
  mode: 'block',
  tests: 'guard-git-safety',
  check({ commit }, { deny }) {
    if (!commit) return
    const target = defaultBranch(commit.dir)
    if (!target || commit.branch() !== target) return
    const feature = (commit.message.match(/^\s*(F\d+[a-z]?):/) || [])[1]
    if (!feature) return // a tiny fix or a plan/doc commit
    const root = rootOf(commit)
    if (!root) return
    // `git add .planning` names the folder itself; version.json is /save's build number, not code (F80: save commits go
    // through this hook now, and a plan-only "F80: …" save on main was refused for it)
    const code = commit.files(root).filter(f => !/^\.planning(\/|$)/.test(f) && !/\.md$/i.test(f) && f !== 'version.json')
    if (!code.length) return
    deny(`Blocked: a ${feature} commit with code (${code.slice(0, 3).join(', ')}${code.length > 3 ? ', …' : ''}) on ${target}. Feature work goes on the work branch (\`dev/<milestone>\`, /develop makes it) and reaches ${target} only through /deliver. Switch to the work branch and commit there — or, if this is really a tiny fix, commit it without the "${feature}:" prefix.`)
  },
}
