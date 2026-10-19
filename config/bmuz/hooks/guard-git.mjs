// Muzzy's git "never" rules, enforced before the command runs (F68). Hooked on Bash + PowerShell (PreToolUse).
//   never `git reset --hard`          → undo with `git revert`
//   never force-push                  → push a new commit instead
//   never delete a branch with work that isn't merged yet (a fully merged one is fine — nothing is lost)
//   feature work never lands on main outside /deliver (F67): no `F08: …` commit with code on the default branch,
//   no merging a work branch into it — /develop works on dev/<milestone>, /deliver merges. Plan/doc commits and
//   tiny fixes (no `F08:` in the message) stay fine on main.
//   a feature's `F08: done` commit leaves STATE.md telling the truth (F72): STATE is in that commit, or was changed
//   since the feature's first commit — otherwise a fresh Claude (or the laptop) resumes from a stale RESUME HERE.
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { readInput, deny, gitCalls, git, defaultBranch, isMergedInto, commitFiles, commitMessage } from './lib.mjs'

const input = readInput()
const command = input.tool_input?.command
if (!command) process.exit(0)

const calls = gitCalls(command, input.cwd)
for (const [index, call] of calls.entries()) {
  const { dir, sub, args } = call

  if (sub === 'commit' && !args.includes('--dry-run')) checkFeatureCommitOnMain(calls, index, command)
  if (sub === 'commit' && !args.includes('--dry-run')) checkDoneSavesState(calls, index, command)
  if (sub === 'merge') checkMergeIntoMain(calls, index)

  if (sub === 'reset' && args.includes('--hard')) {
    deny('Blocked: `git reset --hard` throws work away, and Muzzy\'s rule is never to use it. To undo something committed, use `git revert <commit>` (show Muzzy what will be undone first). For an uncommitted file, ask Muzzy before discarding it.')
  }

  if (sub === 'push') {
    const forced = args.some(a =>
      a === '--force' || a.startsWith('--force-with-lease') || a === '--mirror' ||
      /^-[a-zA-Z]*f[a-zA-Z]*$/.test(a) || // -f, -uf
      (a.startsWith('+') && a.length > 1)) // +main
    if (forced) {
      deny('Blocked: force-pushing rewrites history on GitHub, and Muzzy\'s rule is never to do it. Make the fix as a new commit (or `git revert`) and push normally. If the push is refused because GitHub has newer commits, `git pull` first.')
    }
    checkRemoteDeletes(dir, args)
  }

  if (sub === 'branch') checkLocalDeletes(dir, args)
}
process.exit(0)

// `git branch -D x` (or -d with --force): only when x is already fully merged.
// Plain `git branch -d x` is left alone — git itself refuses it when x has unmerged work.
function checkLocalDeletes(dir, args) {
  const short = args.filter(a => /^-[a-zA-Z]+$/.test(a)).join('') // -D, -d -f, -Df, -df
  const forceDelete = short.includes('D') ||
    ((short.includes('d') || args.includes('--delete')) && (short.includes('f') || args.includes('--force')))
  if (!forceDelete) return
  const target = defaultBranch(dir)
  for (const name of args.filter(a => !a.startsWith('-'))) {
    if (target && (isMergedInto(dir, name, target) || isMergedInto(dir, name, `origin/${target}`))) continue
    deny(`Blocked: branch \`${name}\` has work that isn't merged into ${target || 'main'} yet, so deleting it would lose that work. Muzzy's rule: only fully merged branches get deleted. Merge it first (that's /deliver's job), or ask Muzzy.`)
  }
}

// `git push origin --delete x` / `git push origin :x`: only when origin/x is already merged into origin's default branch.
function checkRemoteDeletes(dir, args) {
  const words = args.filter(a => !a.startsWith('-'))
  const remote = words[0] || 'origin'
  const deleting = args.includes('--delete') || args.includes('-d')
  const names = deleting ? words.slice(1) : words.slice(1).filter(w => w.startsWith(':')).map(w => w.slice(1))
  if (!names.length) return
  const target = defaultBranch(dir)
  for (const name of names) {
    const branch = name.replace(/^refs\/heads\//, '')
    const known = git(dir, 'rev-parse', '--verify', '--quiet', `refs/remotes/${remote}/${branch}`) !== null
    if (known && target && isMergedInto(dir, `${remote}/${branch}`, `${remote}/${target}`)) continue
    deny(known
      ? `Blocked: \`${remote}/${branch}\` has work that isn't merged into ${remote}/${target || 'main'}, so deleting it would lose that work. Muzzy's rule: only fully merged branches get deleted.`
      : `Blocked: can't confirm \`${remote}/${branch}\` is merged (it isn't in the local copy — run \`git fetch\` first, then try again). Muzzy's rule: only fully merged branches get deleted.`)
  }
}

// The branch a call runs on: the current one, or the one an earlier `git checkout x` / `git switch x` on the line moves to.
function branchAt(calls, index) {
  for (let i = index - 1; i >= 0; i--) {
    const { sub, args } = calls[i]
    if (sub !== 'checkout' && sub !== 'switch') continue
    const create = args.findIndex(a => ['-b', '-B', '-c', '-C', '--orphan'].includes(a)) // checkout -b hotfix main → on hotfix
    if (create >= 0 && args[create + 1]) return args[create + 1]
    const name = args.filter(a => !a.startsWith('-')).pop()
    if (name && !args.includes('--') && git(calls[i].dir, 'rev-parse', '--verify', '--quiet', `refs/heads/${name}`) !== null) return name
  }
  return git(calls[index].dir, 'rev-parse', '--abbrev-ref', 'HEAD')
}

function checkFeatureCommitOnMain(calls, index, raw) {
  const { dir, args } = calls[index]
  const target = defaultBranch(dir)
  if (!target || branchAt(calls, index) !== target) return
  const message = commitMessage(raw, args)
  const feature = (message.match(/^\s*(F\d+[a-z]?):/) || [])[1]
  if (!feature) return // a tiny fix or a plan/doc commit
  const top = git(dir, 'rev-parse', '--show-toplevel')
  if (!top) return
  const code = commitFiles(calls, index, resolve(top)).filter(f => !/^\.planning(\/|$)/.test(f) && !/\.md$/i.test(f)) // `git add .planning` names the folder itself
  if (!code.length) return
  deny(`Blocked: a ${feature} commit with code (${code.slice(0, 3).join(', ')}${code.length > 3 ? ', …' : ''}) on ${target}. Feature work goes on the work branch (\`dev/<milestone>\`, /develop makes it) and reaches ${target} only through /deliver. Switch to the work branch and commit there — or, if this is really a tiny fix, commit it without the "${feature}:" prefix.`)
}

// `F08: done` (or `F08 + F09: done`) in a BMUZ project: STATE.md is part of the commit, or a commit since the
// feature's first one changed it.
function checkDoneSavesState(calls, index, raw) {
  const { dir, args } = calls[index]
  const ids = (commitMessage(raw, args).match(/^\s*(F\d+[a-z]?(?:\s*\+\s*F\d+[a-z]?)*)\s*:\s*done\b/i) || [])[1]
  if (!ids) return
  const top = git(dir, 'rev-parse', '--show-toplevel')
  if (!top) return
  const root = resolve(top)
  if (!existsSync(join(root, '.planning', 'STATE.md'))) return // not a BMUZ project
  const feature = ids.match(/F\d+[a-z]?/)[0]
  const first = (git(root, 'log', '--format=%H', '--reverse', `--grep=^${feature}:`) || '').split('\n')[0]
  if (!commitFiles(calls, index, root).includes('.planning/STATE.md')) {
    const lastState = (git(root, 'log', '-1', '--format=%H', '--', '.planning/STATE.md') || '')
    if (!(first && lastState && git(root, 'merge-base', '--is-ancestor', first, lastState) !== null)) {
      deny(`Blocked: "${feature}: done" but .planning/STATE.md hasn't changed since ${feature} started, so RESUME HERE still describes the old work. A fresh session, or the other machine, would pick up from there. Replace RESUME HERE + "Doing" (what's done, what's next), add STATE.md to this commit, then /save (F72).`)
    }
  }
  // F75: the feature's code review and full check really happened. Each line must have been written or changed
  // since the feature started (its value is a commit, sometimes from two repos, so "changed during this feature" is
  // the test). A project without a check:full script has no full check to record.
  const now = readFileSync(join(root, '.planning', 'STATE.md'), 'utf8')
  const before = (first && git(root, 'show', `${first}^:.planning/STATE.md`)) || ''
  // the real line only — it starts the line ("Reviewed through: …", "**Last full check:** …", "- Reviewed through: …"),
  // never the words inside a sentence ("next: /code-review, then write Reviewed through")
  const line = (text, label) => (text.match(new RegExp(`^[-\\s]*\\*{0,2}${label}:?\\*{0,2}:[^\\n]*|^[-\\s]*\\*{0,2}${label}:[^\\n]*`, 'im')) || [''])[0].trim()
  let hasFull = false
  try { hasFull = !!JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts?.['check:full'] } catch { /* no package.json */ }
  const stale = [['Reviewed through', '/code-review (low) on this feature\'s commits, then `Reviewed through: <commit>`'],
    ...(hasFull ? [['Last full check', '`npm run check:full` once, then `Last full check: <commit> — <date> <result>`']] : [])]
    .filter(([label]) => { const n = line(now, label); return !n || n === line(before, label) })
  if (stale.length) {
    deny(`Blocked: "${feature}: done" but STATE.md's ${stale.map(([l]) => `"${l}"`).join(' and ')} ${stale.length > 1 ? 'weren\'t' : 'wasn\'t'} updated during ${feature}, so ${stale.length > 1 ? 'they describe' : 'it describes'} older work. Every feature gets the same treatment before it's done: ${stale.map(([, how]) => how).join('; ')}. Then write the line${stale.length > 1 ? 's' : ''} into STATE.md and commit again (F75).`)
  }
}

function checkMergeIntoMain(calls, index) {
  const { dir, args } = calls[index]
  if (args.some(a => ['--abort', '--continue', '--quit'].includes(a))) return
  const target = defaultBranch(dir)
  if (!target || branchAt(calls, index) !== target) return
  // the branches being merged in (skipping option values like -m "message"); main's own copy on GitHub is fine
  const WITH_VALUE = new Set(['-m', '-F', '-s', '-X', '--strategy', '--strategy-option', '--file'])
  const work = args.filter((a, i) => !a.startsWith('-') && !WITH_VALUE.has(args[i - 1]))
    .filter(a => a !== target && a !== `origin/${target}` && a !== `upstream/${target}` && a !== 'FETCH_HEAD')
  if (!work.length || deliverRan()) return
  deny(`Blocked: merging ${work.join(', ')} into ${target}. Only /deliver merges work into ${target} (after its smoke test and checks). Run /deliver — or, if Muzzy asked for this merge, have him type /deliver.`)
}

// Did /deliver run in this session? (Muzzy typed it, or Claude called the deliver skill.)
function deliverRan() {
  try {
    // only Muzzy typing it, or Claude calling the skill — not a file or message that merely mentions it
    for (const line of readFileSync(input.transcript_path, 'utf8').split('\n')) {
      if (!line.includes('deliver')) continue
      let entry
      try { entry = JSON.parse(line) } catch { continue }
      const content = entry.message?.content
      if (entry.type === 'user' && typeof content === 'string' && content.includes('<command-name>/deliver</command-name>')) return true
      if (entry.type === 'assistant' && Array.isArray(content) && content.some(b => b.type === 'tool_use' && b.name === 'Skill' && b.input?.skill === 'deliver')) return true
    }
    return false
  } catch {
    return false
  }
}
