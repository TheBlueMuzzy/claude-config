// Put the game's code back to a released version — the studio "rollback plan" (F80). Never rewrites history (Muzzy's
// rule: no reset --hard, no force-push): it ADDS one commit on the main branch whose code is the tag's code.
//   node ~/.claude/config/bmuz/scripts/rollback.mjs <tag> ["why"]        e.g. rollback.mjs v0.9.2 "v0.9.3 crashes on phones"
// Kept as they are now: .planning/ (the plan, STATE, BUGS — they describe what happened) and version.json (the version
// only goes forward; the next release.mjs update gives the rollback its own new number).
// Refuses before changing anything when: uncommitted code, not on the main branch, the tag doesn't exist, or the code
// already IS the tag's. It never pushes or deploys — it prints what still needs doing (smoke pass, release, push,
// a server redeploy when server code differs).
import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { git, run, say, ok, refuse, args, projectDir, changedFiles, isCode } from './lib.mjs'
import { defaultBranch } from '../hooks/lib.mjs'

const { words } = args()
const [tag, why = ''] = words
if (!tag) refuse('which released version should the code go back to?', 'rollback.mjs v0.9.2 "v0.9.3 crashes on phones"')
const root = git(projectDir(), 'rev-parse', '--show-toplevel')
if (!root) refuse("this folder isn't a git repo")
if (git(root, 'rev-parse', '--verify', '--quiet', `refs/tags/${tag}`) === null) refuse(`there's no tag ${tag}`, '`git tag` lists the released versions')
const main = defaultBranch(root)
const branch = git(root, 'rev-parse', '--abbrev-ref', 'HEAD')
if (main && branch !== main) refuse(`on "${branch}", not ${main} — a rollback goes on ${main}, where releases are made`, `\`git checkout ${main}\``)
const code = changedFiles(root).map(f => f.path).filter(f => !/^\.planning\//.test(f) && !/\.md$/i.test(f))
if (code.length) refuse(`there's uncommitted code:\n${code.slice(0, 8).map(f => `    ${f}`).join('\n')}`, 'commit it or set it aside (`git stash`) first')
const undone = (git(root, 'diff', '--name-only', tag, 'HEAD') || '').split('\n').filter(isCode)
if (!undone.length) refuse(`the code already matches ${tag} — nothing to roll back`)

// The new commit's files: the tag's, except .planning/ and version.json, which stay as they are now. Built in a
// separate index so nothing is touched until the commit exists; then main moves forward onto it (a fast-forward).
const index = join(resolve(root, git(root, 'rev-parse', '--git-dir')), 'bmuz-rollback-index')
const withIndex = (args, input) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', input, env: { ...process.env, GIT_INDEX_FILE: index } })
const keepNow = git(root, 'ls-tree', '-r', 'HEAD', '--', '.planning', 'version.json') || '' // "mode type sha<TAB>path" lines
const steps = [
  () => withIndex(['read-tree', tag]),
  () => withIndex(['rm', '-r', '-q', '-f', '--cached', '--ignore-unmatch', '--', '.planning', 'version.json']), // -f: only the side index changes
  ...(keepNow ? [() => withIndex(['update-index', '--index-info'], keepNow + '\n')] : []),
]
for (const step of steps) { const r = step(); if (r.status !== 0) { rmSync(index, { force: true }); refuse(`building the rollback failed, nothing changed:\n${r.stdout}${r.stderr}`) } }
const tree = withIndex(['write-tree']).stdout.trim()
rmSync(index, { force: true })
const current = git(root, 'describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*', 'HEAD') || 'the current code'
const message = `Rollback to ${tag}: undo ${current}${why ? ` — ${why}` : ''}\n\nThe code is ${tag}'s again; .planning/ and version.json stay as they were (rollback.mjs).`
const commit = spawnSync('git', ['-C', root, 'commit-tree', tree, '-p', 'HEAD', '-F', '-'], { encoding: 'utf8', input: message })
if (commit.status !== 0 || !commit.stdout.trim()) refuse(`making the rollback commit failed, nothing changed:\n${commit.stderr}`)
const moved = run('git', ['merge', '--ff-only', '-q', commit.stdout.trim()], { cwd: root })
if (moved.code !== 0) refuse(`the rollback commit was made but ${main} couldn't move onto it:\n${moved.out}`, `\`git merge --ff-only ${commit.stdout.trim().slice(0, 7)}\``)
ok(`rolled back: the code is ${tag}'s again (${undone.length} file${undone.length > 1 ? 's' : ''} put back, commit ${git(root, 'rev-parse', '--short', 'HEAD')}) — history kept, nothing pushed`)

// What still needs doing — the live site still runs the bad version until it's redeployed
const server = undone.filter(f => /^(party|worker|workers|server)\/|^wrangler\.(toml|jsonc?)$/.test(f))
say([
  'Still to do (the live site runs the bad version until then):',
  '  1. BUGS.md: log what went wrong (P0 if live is broken) — the rollback buys time, the bug still needs fixing',
  `  2. release it: release.mjs update "Rolled back to ${tag}" (STATE Log + RESUME HERE first, as for any release)`,
  '  3. smoke pass (hooks/smoke-pass.mjs) → commit .planning/smoke-pass → `git push --follow-tags` (starts the deploy)',
  server.length ? `  4. server code differs too (${server.slice(0, 3).join(', ')}${server.length > 3 ? ', …' : ''}) → redeploy the server FIRST (the recipe's server step)` : '  4. server code is the same → no server redeploy',
  '  5. live-check.mjs — the old version is live again',
].join('\n'))
