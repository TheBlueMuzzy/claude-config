// live-push — nothing goes live without a smoke pass, and never with an open P0 (F68, F67 → rule files F184).
// "Going live" = pushing to a branch a deploy workflow publishes from (e.g. Glyphtender: push to main → GitHub Pages),
// or running a deploy command (npm run deploy, gh-pages, party:deploy, wrangler deploy, butler push for itch).
import { gitCalls, commands } from '../../lib.mjs'
import { repoRoot, liveBranches, isLive, pushedBranches } from './_shared.mjs'

// Matched against the command with its flags, `npx`, and @versions taken out: `npx --yes wrangler@3 deploy` → `wrangler deploy`
const DEPLOY_COMMANDS = [
  /^npm run (deploy|party:deploy)\b/, /^gh-pages\b/, /^wrangler deploy\b/, /^partykit deploy\b/, /^butler push\b/,
]

export default {
  hook: 'live-push',
  event: 'PreToolUse',
  matcher: 'Bash|PowerShell',
  when: 'Before anything goes live (a push to a branch that deploys, or a deploy command) — in every project',
  order: ['LP3', 'LP2', 'LP1'],

  async run(ctx) {
    const command = ctx.input.tool_input?.command
    if (!command) return
    // a release is checked: an open P0 first, then the smoke pass
    const release = async (args) => { await ctx.rule('LP2', args); await ctx.rule('LP1', args) }

    // 1. Deploy commands publish whatever is checked out now
    for (const { dir, words } of commands(command, ctx.input.cwd)) {
      const plain = words.filter(w => !w.startsWith('-')).map(w => w.replace(/(?<=.)@[^/]*$/, ''))
      if (plain[0] === 'npx' || plain[0] === 'pnpx') plain.shift()
      const line = plain.join(' ')
      if (!DEPLOY_COMMANDS.some(pattern => pattern.test(line))) continue
      const root = repoRoot(dir)
      if (root) await release({ root, commit: 'HEAD', what: `\`${line}\``, checkUncommitted: true })
    }

    // 2. Pushes to a branch that deploys
    // This hook runs before the WHOLE command line: in `git commit … && git push` the new commit doesn't exist yet,
    // so uncommitted files count as pushed; after a merge/pull/rebase on the same line we can't know what's pushed.
    const calls = gitCalls(command, ctx.input.cwd)
    for (const [index, { dir, sub, args }] of calls.entries()) {
      if (sub !== 'push' || args.includes('--dry-run') || args.includes('-n')) continue
      if (args.includes('--delete') || args.includes('-d')) continue
      const refspecs = args.filter(a => !a.startsWith('-')).slice(1)
      if (args.includes('--tags') && !refspecs.length) continue // tags only — `git push origin main --tags` is still checked
      const root = repoRoot(dir)
      if (!root) continue
      const live = liveBranches(root)
      if (!live.size) continue
      const before = calls.slice(0, index).map(call => call.sub)
      const commitsFirst = before.some(s => s === 'commit' || s === 'add')
      for (const { branch, commit } of pushedBranches(root, args)) {
        if (!isLive(live, branch)) continue
        await ctx.rule('LP3', { branch, before })
        await release({ root, commit, what: `pushing \`${branch}\` (it deploys the live site)`, checkUncommitted: commitsFirst })
      }
    }
  },
}
