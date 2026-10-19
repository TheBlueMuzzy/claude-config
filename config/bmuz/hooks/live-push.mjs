// Nothing goes live without a smoke pass (F68). Hooked on Bash + PowerShell (PreToolUse).
// "Going live" = pushing to a branch a deploy workflow publishes from (e.g. Glyphtender: push to main → GitHub Pages),
// or running a deploy command (npm run deploy, gh-pages, party:deploy, wrangler deploy, butler push for itch).
// Allowed when `.planning/smoke-pass` names a commit and only docs changed since it (.planning/, *.md).
// The pass file is written by smoke-pass.mjs after the project's `smoke` script passes (/deliver runs it).
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { readInput, deny, gitCalls, commands, git } from './lib.mjs'

const SMOKE_FILE = '.planning/smoke-pass'
// Matched against the command with its flags, `npx`, and @versions taken out: `npx --yes wrangler@3 deploy` → `wrangler deploy`
const DEPLOY_COMMANDS = [
  /^npm run (deploy|party:deploy)\b/, /^gh-pages\b/, /^wrangler deploy\b/, /^partykit deploy\b/, /^butler push\b/,
]

const input = readInput()
const command = input.tool_input?.command
if (!command) process.exit(0)

// 1. Deploy commands publish whatever is checked out now
for (const { dir, words } of commands(command, input.cwd)) {
  const plain = words.filter(w => !w.startsWith('-')).map(w => w.replace(/(?<=.)@[^/]*$/, ''))
  if (plain[0] === 'npx' || plain[0] === 'pnpx') plain.shift()
  const line = plain.join(' ')
  if (!DEPLOY_COMMANDS.some(pattern => pattern.test(line))) continue
  const root = repoRoot(dir)
  if (root) requireSmokePass(root, 'HEAD', `\`${line}\``, true)
}

// 2. Pushes to a branch that deploys
// This hook runs before the WHOLE command line: in `git commit … && git push` the new commit doesn't exist yet,
// so uncommitted files count as pushed; after a merge/pull/rebase on the same line we can't know what's pushed.
const calls = gitCalls(command, input.cwd)
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
  const pullsInFirst = before.some(s => ['merge', 'pull', 'rebase', 'cherry-pick', 'revert', 'am', 'checkout', 'switch', 'reset'].includes(s))
  for (const { branch, commit } of pushedBranches(root, args)) {
    if (!isLive(live, branch)) continue
    if (pullsInFirst) deny(`Blocked: pushing \`${branch}\` (it deploys the live site) on the same line as a ${before.join('/')} — the smoke-pass check can't see what will be pushed. Run that first, then push on its own line.`)
    requireSmokePass(root, commit, `pushing \`${branch}\` (it deploys the live site)`, commitsFirst)
  }
}
process.exit(0)

function repoRoot(dir) {
  const top = git(dir, 'rev-parse', '--show-toplevel')
  return top ? resolve(top) : null
}

// Branches named under `on: push: branches:` in workflows that deploy (Pages, gh-pages, wrangler, a deploy job).
export function liveBranches(root) {
  const folder = join(root, '.github', 'workflows')
  const live = new Set()
  if (!existsSync(folder)) return live
  for (const file of readdirSync(folder).filter(f => /\.ya?ml$/.test(f))) {
    const text = readFileSync(join(folder, file), 'utf8')
    if (!/deploy-pages|gh-pages|wrangler|deploy/i.test(text)) continue
    // `on: push` / `on: [push, …]` → every branch deploys
    if (/^on:\s*(push|\[[^\]]*\bpush\b[^\]]*\])\s*$/m.test(text)) { live.add('*'); continue }
    const push = text.match(/^\s*push:\s*\n((?:\s{4,}.*\n?)*)/m)
    if (!push) continue
    const inline = push[1].match(/branches:\s*\[([^\]]*)\]/)
    if (inline) inline[1].split(',').forEach(b => live.add(b.trim().replace(/['"]/g, '')))
    const list = push[1].match(/branches:\s*\n((?:\s+-\s*.*\n?)*)/)
    if (list) for (const item of list[1].matchAll(/-\s*['"]?([^'"\s#]+)/g)) live.add(item[1])
    if (!inline && !list) live.add('*') // `push:` with no branch list → every branch
  }
  return live
}

function isLive(live, branch) {
  return live.has(branch) || live.has('*')
}

// [{ branch, commit }] for `git push`, `git push origin main`, `git push origin dev:main`, `git push --all`.
function pushedBranches(root, args) {
  const current = git(root, 'rev-parse', '--abbrev-ref', 'HEAD')
  const words = args.filter(a => !a.startsWith('-'))
  if (args.includes('--all')) {
    return (git(root, 'for-each-ref', '--format=%(refname:short)', 'refs/heads') || '').split('\n').filter(Boolean)
      .map(branch => ({ branch, commit: branch }))
  }
  const refspecs = words.slice(1)
  if (!refspecs.length) return [{ branch: current, commit: 'HEAD' }]
  return refspecs.map(spec => {
    const [source, target] = spec.replace(/^\+/, '').split(':')
    const isHead = source === 'HEAD' || source === '@' || source === ''
    const from = isHead ? 'HEAD' : source
    const to = (target || (isHead ? current : source)).replace(/^refs\/heads\//, '')
    return { branch: to, commit: from }
  })
}

function requireSmokePass(root, commit, what, checkUncommitted) {
  const howTo = 'Run the smoke test first: `node ~/.claude/config/bmuz/hooks/smoke-pass.mjs` in the project (it runs the project\'s `smoke` script — the game loads and one turn/round plays, console clean — and records the pass in .planning/smoke-pass; commit that file). Then try again.'
  const file = join(root, SMOKE_FILE)
  if (!existsSync(file)) deny(`Blocked: ${what} puts code live, and there's no smoke pass yet. ${howTo}`)
  const passed = readFileSync(file, 'utf8').split('\n')[0].trim()
  if (git(root, 'rev-parse', '--verify', '--quiet', `${passed}^{commit}`) === null) {
    deny(`Blocked: ${what} — the smoke pass names a commit this repo doesn't have (${passed || 'empty'}). ${howTo}`)
  }
  const changed = (git(root, 'diff', '--name-only', passed, commit) || '').split('\n').filter(Boolean)
  if (checkUncommitted) {
    for (const f of (git(root, 'diff', '--name-only', 'HEAD') || '').split('\n').filter(Boolean)) changed.push(f)
    for (const f of (git(root, 'ls-files', '--others', '--exclude-standard') || '').split('\n').filter(Boolean)) changed.push(f)
  }
  const code = changed.filter(f => !isDocs(f))
  if (code.length) {
    const list = code.slice(0, 8).join(', ') + (code.length > 8 ? ` and ${code.length - 8} more` : '')
    deny(`Blocked: ${what} — code changed since the last smoke pass (${passed.slice(0, 7)}): ${list}. ${howTo}`)
  }
}

function isDocs(file) {
  return file.startsWith('.planning/') || file.endsWith('.md')
}
