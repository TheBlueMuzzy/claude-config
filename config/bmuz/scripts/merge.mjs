// Merge a finished work branch into the main branch, the /deliver way, in one go (F80 — /deliver §4, audit D25–D29).
//   node ~/.claude/config/bmuz/scripts/merge.mjs <branch>
// Refuses before changing anything when: there's uncommitted code, the branch doesn't exist or IS the main branch, or
// GitHub's Checks run for the branch's last commit is red (a run still going is waited for — BMUZ_CHECKS_TIMEOUT).
// Then: push the branch (if there's a remote) → GitHub green? → checkout main → pull (if there's a remote) →
// `git merge --no-ff` (never a fast-forward: release.mjs finds the work branch by its merge commit) → delete the merged
// branch here; GitHub's copy once GitHub's main has the merge (live-check.mjs does it after the push). It never pushes
// main: /deliver pushes after the release commit and the smoke pass.
// Conflicts: version.json is settled by itself (main's copy — release.mjs bumps it next). Any other file → it stops,
// lists them, and leaves the repo mid-merge with the two ways out (finish, or abort). Run it again after finishing:
// an already-merged branch just gets deleted.
// guard-git refuses a typed `git merge` into main outside /deliver; this script's own merge isn't seen by that hook,
// so it's /deliver's tool only (the skill says so).
import { git, run, say, ok, refuse, args, projectDir, changedFiles, waitForChecks, pendingRemoteDeletes, deleteMergedRemotes } from './lib.mjs'
import { defaultBranch, isMergedInto } from '../hooks/lib.mjs'

const { words } = args()
const name = words[0]
if (!name) refuse('which branch should be merged?', 'merge.mjs dev/<milestone>')
const root = git(projectDir(), 'rev-parse', '--show-toplevel')
if (!root) refuse("this folder isn't a git repo")
const main = defaultBranch(root)
if (!main) refuse('no main (or master) branch here to merge into')
if (name === main) refuse(`"${name}" is the main branch itself — name the work branch to merge into it`)
if (git(root, 'rev-parse', '--verify', '--quiet', `refs/heads/${name}^{commit}`) === null) refuse(`there's no branch "${name}" here`, '`git branch` lists them')
if (git(root, 'rev-parse', '--verify', '--quiet', 'MERGE_HEAD') !== null) refuse('a merge is already half-done here', 'finish it (fix the files, `git add` them, `git commit --no-edit`) or undo it (`git merge --abort`), then run this again')
const code = changedFiles(root).map(f => f.path).filter(f => !/^\.planning\//.test(f) && !/\.md$/i.test(f))
if (code.length) refuse(`there's uncommitted code:\n${code.slice(0, 8).map(f => `    ${f}`).join('\n')}`, 'commit it on the work branch (/save), then merge')
const remote = !!git(root, 'remote')
const step = (what, result, fix) => { if (result.code !== 0) refuse(`${what} failed:\n${result.out.trim().split('\n').map(l => `    ${l}`).join('\n')}`, fix) }

if (!isMergedInto(root, name, main)) {
  // 1. GitHub has the branch, and its Checks run is green (F70)
  if (remote) step(`pushing ${name}`, run('git', ['push', '-q', '-u', 'origin', name], { cwd: root }), 'GitHub has newer commits on it? `git pull` on the branch, then run this again')
  const commit = git(root, 'rev-parse', name)
  const v = waitForChecks(root, { commit, branch: name })
  if (v.verdict === 'green') ok(v.text)
  else if (v.verdict === 'warn') say(`⚠ ${v.text}\n  → ${v.fix}`)
  else refuse(v.text, `${v.fix} — never merge around a red branch`)
  // 2. main, up to date
  step(`switching to ${main}`, run('git', ['checkout', '-q', main], { cwd: root }), 'commit or set aside what\'s in the way, then run this again')
  if (remote && git(root, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}')) step(`pulling ${main}`, run('git', ['pull', '-q', '--ff-only'], { cwd: root }), `${main} here and on GitHub went different ways — \`git pull\` and sort it out, then run this again`)
  // 3. the merge — always a merge commit
  const merge = run('git', ['merge', '--no-ff', '-q', '-m', `Merge ${name} into ${main}`, name], { cwd: root })
  if (merge.code !== 0) {
    let conflicts = (git(root, 'diff', '--name-only', '--diff-filter=U') || '').split('\n').filter(Boolean)
    if (!conflicts.length) refuse(`the merge failed:\n${merge.out.trim()}`)
    if (conflicts.includes('version.json')) { // the build number moved on both sides: main's copy, release.mjs bumps it next
      run('git', ['checkout', '--ours', '--', 'version.json'], { cwd: root }); run('git', ['add', '--', 'version.json'], { cwd: root })
      conflicts = conflicts.filter(f => f !== 'version.json')
      say('version.json clashed → kept main\'s copy (release.mjs bumps it next)')
    }
    if (conflicts.length) {
      refuse(`${name} and ${main} both changed the same part of ${conflicts.length === 1 ? 'this file' : 'these files'} — the repo is left mid-merge:\n${conflicts.map(f => `    ${f}`).join('\n')}`,
        `obvious? fix each file (keep both changes where they belong), \`git add\` them, \`git commit --no-edit\`, then run merge.mjs ${name} again (it deletes the branch). Not obvious → explain it to Muzzy and ask. To undo the merge instead: \`git merge --abort\``)
    }
    step('finishing the merge', run('git', ['commit', '-q', '--no-edit'], { cwd: root }))
  }
  ok(`${name} merged into ${main} (${git(root, 'rev-parse', '--short', 'HEAD')})`)
} else {
  if (git(root, 'rev-parse', '--abbrev-ref', 'HEAD') !== main) step(`switching to ${main}`, run('git', ['checkout', '-q', main], { cwd: root }))
  ok(`${name} is already in ${main}`)
}

// 4. the merged branch goes — every commit is in main, so nothing is lost
const local = run('git', ['branch', '-d', name], { cwd: root })
if (local.code === 0) ok(`deleted ${name} here`)
else say(`⚠ couldn't delete ${name} here (a helper workspace may still use it — cleanup.sh removes finished ones):\n    ${local.out.trim()}`)
// GitHub's copy goes only once GitHub's main has the merge (main is pushed later, after the smoke pass) — until then
// it's the only copy on GitHub. Noted now; live-check.mjs (or this script, run again) deletes it after the push.
if (remote) {
  pendingRemoteDeletes(root, [name])
  for (const line of deleteMergedRemotes(root, main)) say(line)
}
say(`Next (/deliver §5): patch notes from \`git log ${git(root, 'describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*') || '<last tag>'}..HEAD\`, ROADMAP + STATE, then release.mjs`)
