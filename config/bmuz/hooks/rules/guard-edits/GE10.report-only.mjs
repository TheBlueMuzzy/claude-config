import { existsSync } from 'node:fs'
import { gitCalls, commands, reportOnlyFlag, toDir } from '../../lib.mjs'
import { THROWAWAY } from './_shell.mjs'

const MEMORY = /[\\/]\.claude[\\/]projects[\\/][^\\/]+[\\/]memory([\\/]|$)/i
// publishing / making it permanent from the shell: commits, pushes, merges, tags, the BMUZ scripts that commit, deploys
const PUBLISHES = /^(npm|pnpm|yarn)$/
const BMUZ_COMMITS = /(^|[\\/])(save|release|merge|archive-sprint|rollback)\.mjs$/

export default {
  id: 'GE10',
  name: 'mode.report-only',
  what: 'While a turn is report-only (SM4: Muzzy asked to assess / analyze / "what\'s going on"), refuses Edit / Write outside the scratchpad, ~/Documents/dev/.scratch and Claude\'s memory, `sed -i` on such files, git commit / push / merge / tag, the BMUZ scripts that commit (save, release, merge…), and deploys — until Muzzy\'s next message',
  why: 'Muzzy, 2026-11-01: "assess / analyze / tell me what\'s going on" = report only — no edits, no bug logged, no plan-file lines, no commits or publishing until he picks (audit 2026-11 §5 #1, F185). Publishing through the claude-artifacts tools isn\'t seen here: guard-edits only runs on shell commands and file edits',
  on: true,
  mode: 'block',
  tests: 'guard-edits',
  check({ tool, path, command, cwd }, { deny, input }) {
    if (!existsSync(reportOnlyFlag(input.session_id))) return
    const refuse = (what) => deny(`Report-only turn: Muzzy asked to assess / analyze / say what's going on (his rule, 2026-11-01), so ${what} waits until he picks. Report what you found in short bullets with options, your pick first. (Notes in the scratchpad or ~/Documents/dev/.scratch are fine.)`)
    const kept = (p) => !THROWAWAY.test(String(p).split('\\').join('/')) && !MEMORY.test(p)
    if (path) { if (kept(path)) refuse(`editing ${String(path).split(/[\\/]/).pop()}`); return }
    if (!command) return
    for (const call of gitCalls(command, cwd)) {
      if (['commit', 'push', 'merge', 'tag', 'rebase', 'cherry-pick', 'revert'].includes(call.sub)) refuse(`\`git ${call.sub}\``)
    }
    for (const { words } of commands(command, cwd)) {
      const [first = '', ...rest] = words
      if (/^node(\.exe)?$/i.test(first) && rest.some(w => BMUZ_COMMITS.test(w))) refuse('a save / release / merge')
      if (PUBLISHES.test(first) && rest[0] === 'run' && /deploy|publish|release/i.test(rest[1] || '')) refuse(`\`${first} run ${rest[1]}\``)
      if (/^(npx\s+)?wrangler$/i.test(first) && rest.includes('deploy')) refuse('a deploy')
      if (first === 'npx' && rest[0] === 'wrangler' && rest.includes('deploy')) refuse('a deploy')
      if (first === 'gh' && ((rest[0] === 'pr' && ['create', 'merge'].includes(rest[1])) || (rest[0] === 'release' && rest[1] === 'create'))) refuse(`\`gh ${rest[0]} ${rest[1]}\``)
      if (/^(sed|perl)$/.test(first) && rest.some(w => /^-[a-zA-Z]*i/.test(w))) {
        const files = rest.filter(w => !w.startsWith('-') && /[\\/.]/.test(w) && !/^s(.).*\1/.test(w))
        if (files.some(f => kept(toDir(f, cwd)))) refuse('editing files')
      }
    }
  },
}
