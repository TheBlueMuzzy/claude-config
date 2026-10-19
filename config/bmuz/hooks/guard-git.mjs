// Muzzy's git "never" rules, enforced before the command runs (F68). Hooked on Bash + PowerShell (PreToolUse).
//   never `git reset --hard`          → undo with `git revert`
//   never force-push                  → push a new commit instead
//   never delete a branch with work that isn't merged yet (a fully merged one is fine — nothing is lost)
//   feature work never lands on main outside /deliver (F67): no `F08: …` commit with code on the default branch,
//   no merging a work branch into it — /develop works on dev/<milestone>, /deliver merges. Plan/doc commits and
//   tiny fixes (no `F08:` in the message) stay fine on main.
//   a feature's `F08: done` commit leaves STATE.md telling the truth (F72): STATE is in that commit, or was changed
//   since the feature's first commit — otherwise a fresh Claude (or the laptop) resumes from a stale RESUME HERE.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
//   no commit includes a secret or Playwright's leftovers (F78): .env, keys, credentials, .playwright-mcp/ —
//   the same list save.mjs refuses (NEVER_COMMIT in lib.mjs).
//   `git checkout -- <file>` / `git checkout .` / `git restore <file>` over uncommitted changes → Muzzy is ASKED
//   first (F78): it throws those changes away for good (Goops F17 lost cracks.ts this way). Branch switches stay free.
//   (F80) `F08: done` needs F08 ✅ (or 🎛️) in ROADMAP — "Approved" → done in the plan, not just in git.
//   (F87) `F08: done` needs a `Checked:` line in F08's SPRINT.md section — what was tested, and the result.
//   (F80) nothing under .claude/worktrees/ is committed — helpers' worktrees became embedded repos (Goops 2026-10-17).
//   (F80) a stage commit (`Sprint 04: <goal>`, `GDD: discover`, `GDD: define|design|build plan`, fast-track) carries
//   STATE.md — the next session starts from RESUME HERE, so it has to say where things now stand.
import { readRoadmap } from '../templates/ppp/plan-reader.mjs'
import { readInput, deny, ask, commands, gitCalls, git, defaultBranch, isMergedInto, commitFiles, commitMessage, NEVER_COMMIT } from './lib.mjs'

const input = readInput()
const command = input.tool_input?.command
if (!command) process.exit(0)

const calls = gitCalls(command, input.cwd)
const asks = [] // asked only after every call on the line was checked — a refusal later on the line still wins
for (const [index, call] of calls.entries()) {
  const { dir, sub, args } = call

  if (sub === 'commit' && !args.includes('--dry-run')) checkNoSecrets(calls, index)
  if (sub === 'checkout' || sub === 'restore' || sub === 'switch') { const why = discardsChanges(call); if (why) asks.push(why) }
  if (sub === 'commit' && !args.includes('--dry-run')) checkFeatureCommitOnMain(calls, index, command)
  if (sub === 'commit' && !args.includes('--dry-run')) checkDoneSavesState(calls, index, command)
  if (sub === 'commit' && !args.includes('--dry-run')) checkDoneWasChecked(calls, index, command)
  if (sub === 'commit' && !args.includes('--dry-run')) checkNoWorktrees(calls, index)
  if (sub === 'commit' && !args.includes('--dry-run')) checkStageCommitSavesState(calls, index, command)
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
// (F80) merge.mjs merges into main and rollback.mjs commits on main inside their own process, where this hook can't
// see the git calls — so the scripts themselves count as a merge into main: /deliver only.
for (const { words } of commands(command, input.cwd)) {
  if (!/^node(\.exe)?$/i.test(words[0])) continue
  // BMUZ's own scripts only — a game's tools/merge.mjs (sprites…) or `node --check` on one is something else (review)
  if (words.includes('--check')) continue
  const script = words.slice(1).find(w => /config[\\/]bmuz[\\/]scripts[\\/](merge|rollback)\.mjs$/.test(w))
  if (!script || deliverRan()) continue
  const name = script.split(/[\\/]/).pop()
  deny(`Blocked: ${name} ${name === 'merge.mjs' ? 'merges work into main' : 'puts a released version back on main'}, and only /deliver changes main (after its smoke test and checks). Run /deliver — or, if Muzzy asked for this, have him type /deliver.`)
}
if (asks.length) ask(asks.join('\n\n'))
process.exit(0)

// A commit never includes .env, keys, credentials or .playwright-mcp/ (F78).
function checkNoSecrets(calls, index) {
  const top = git(calls[index].dir, 'rev-parse', '--show-toplevel')
  if (!top) return
  const bad = commitFiles(calls, index, resolve(top)).filter(f => NEVER_COMMIT.test(f))
  if (!bad.length) return
  deny(`Blocked: this commit would include ${bad.slice(0, 5).join(', ')}${bad.length > 5 ? ', …' : ''} — secrets (passwords, keys) or Playwright's leftover screenshots must never go into git: once pushed, they're on GitHub for good. Add ${bad.length > 1 ? 'them' : 'it'} to .gitignore (or delete .playwright-mcp/), \`git reset -q -- <file>\` if already staged, then commit again.`)
}

// Would this checkout / restore / switch throw away uncommitted changes? Returns the plain-words reason, or null.
//   git checkout -- a.ts · git checkout . · git checkout main -- a.ts · git checkout a.ts (a file, not a branch)
//   git restore a.ts (not `--staged` alone: that only unstages) · git checkout -f <branch> · git switch -f <branch>
// The lost changes: with no source, the working copy's unsaved edits (git diff); with a source (a branch / commit, or
// restore --staged --worktree), everything uncommitted in those files (git diff HEAD). New untracked files are never touched.
function discardsChanges({ dir, sub, args }) {
  const top = git(dir, 'rev-parse', '--show-toplevel')
  if (!top) return null
  const dash = args.indexOf('--')
  const before = dash >= 0 ? args.slice(0, dash) : args
  const after = dash >= 0 ? args.slice(dash + 1) : []
  const short = before.filter(a => /^-[a-zA-Z]+$/.test(a)).join('')
  const force = short.includes('f') || before.includes('--force') || before.includes('--discard-changes')
  if (before.includes('-p') || before.includes('--patch')) return null // asks hunk by hunk itself
  let paths = []
  let source = false
  if (sub === 'switch') {
    if (!force) return null
    paths = ['.']; source = true
  } else if (sub === 'restore') {
    const WITH_VALUE = new Set(['-s', '--source', '--pathspec-from-file'])
    const staged = short.includes('S') || before.includes('--staged')
    const worktree = short.includes('W') || before.includes('--worktree')
    if (staged && !worktree) return null // only unstages — the edits stay in the file
    paths = [...before.filter((a, i) => !a.startsWith('-') && !WITH_VALUE.has(before[i - 1])), ...after]
    source = staged || before.some(a => a === '-s' || a === '--source' || a.startsWith('--source='))
  } else {
    if (['-b', '-B', '--orphan'].some(o => before.includes(o))) return null // makes a new branch: nothing is overwritten
    const WITH_VALUE = new Set(['--conflict', '--pathspec-from-file'])
    const words = before.filter((a, i) => !a.startsWith('-') && !WITH_VALUE.has(before[i - 1]))
    const isRef = (w) => git(dir, 'rev-parse', '--verify', '--quiet', `${w}^{commit}`) !== null
    if (dash >= 0) { paths = after; source = words.length > 0 } // git checkout [<branch>] -- <files>
    else if (words.length && isRef(words[0])) {
      if (words.length > 1) { paths = words.slice(1); source = true } // git checkout main a.ts
      else if (force) { paths = ['.']; source = true } // git checkout -f main: drops every uncommitted change
      else return null // a plain branch switch — git itself refuses if it would overwrite changes
    } else if (!words.length && force) { paths = ['.']; source = true } // bare `git checkout -f`: drops every uncommitted change (review)
    else paths = words // git checkout . / git checkout a.ts
  }
  if (!paths.length) return null
  const lost = (git(dir, 'diff', ...(source ? ['HEAD'] : []), '--name-only', '--', ...paths) || '').split('\n').filter(Boolean)
  if (!lost.length) return null
  const command = `git ${sub} ${args.join(' ')}`.trim()
  return `\`${command}\` would throw away the uncommitted changes in ${lost.slice(0, 5).join(', ')}${lost.length > 5 ? ` and ${lost.length - 5} more` : ''} — for good: they were never committed, so git can't bring them back (Goops F17 lost cracks.ts this way). Only allow it if Muzzy really means to drop that work; to keep a copy first: \`git stash\`, or commit it.`
}

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
  // `git add .planning` names the folder itself; version.json is /save's build number, not code (F80: save commits go
  // through this hook now, and a plan-only "F80: …" save on main was refused for it)
  const code = commitFiles(calls, index, resolve(top)).filter(f => !/^\.planning(\/|$)/.test(f) && !/\.md$/i.test(f) && f !== 'version.json')
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
  // F80: approved → ✅ in ROADMAP first (🎛️ when tuning goes on), so the planner, the ready states and /sprint agree
  let roadmap = null
  try { roadmap = readRoadmap(readFileSync(join(root, '.planning', 'ROADMAP.md'), 'utf8').replace(/\r\n/g, '\n')) } catch { /* no roadmap */ }
  const notDone = roadmap ? featureIds(ids).filter(id => roadmap.byId[id] && roadmap.byId[id].state.key !== 'done' && !/^- 🎛/.test(roadmap.byId[id].raw)) : []
  if (notDone.length) {
    deny(`Blocked: "${ids}: done" but ROADMAP.md still shows ${notDone.map(id => `${id} as ${roadmap.byId[id].state.label}`).join(', ')}. Approved means done in the plan too: set ${notDone.join(', ')} ✅ in .planning/ROADMAP.md (🎛️ if tuning goes on), refresh which features became 🟢 ready (plan-lint names them), then commit again.`)
  }
  const feature = featureIds(ids)[0]
  const first = (git(root, 'log', '--format=%H', '--reverse', `--grep=^${feature}:`) || '').split('\n')[0]
  if (!commitFiles(calls, index, root).includes('.planning/STATE.md')) {
    const lastState = (git(root, 'log', '-1', '--format=%H', '--', '.planning/STATE.md') || '')
    if (!(first && lastState && git(root, 'merge-base', '--is-ancestor', first, lastState) !== null)) {
      deny(`Blocked: "${feature}: done" but .planning/STATE.md hasn't changed since ${feature} started, so RESUME HERE still describes the old work. A fresh session, or the other machine, would pick up from there. Replace RESUME HERE + "Doing" (what's done, what's next), add STATE.md to this commit, then /save (F72). (The whole command line is checked before any of it runs, so write STATE in its own step first, then commit.)`)
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

// The feature ids in "F08 + f09b: done" → ['F08', 'F09b'] (a lowercase "f08: done" made the old match return null and
// the whole hook crash — so every done check was skipped; review)
function featureIds(ids) {
  return (ids.match(/F\d+[a-z]?/gi) || []).map(id => 'F' + id.slice(1))
}

// (F87) `F08: done` needs a `Checked:` line in F08's SPRINT.md section: what was actually tested and how it went
// ("Checked: check:fast green · Muzzy fanned 7 cards on his phone") — the record that the `Check:` plan was carried out.
function checkDoneWasChecked(calls, index, raw) {
  const { dir, args } = calls[index]
  const ids = (commitMessage(raw, args).match(/^\s*(F\d+[a-z]?(?:\s*\+\s*F\d+[a-z]?)*)\s*:\s*done\b/i) || [])[1]
  if (!ids) return
  const top = git(dir, 'rev-parse', '--show-toplevel')
  if (!top) return
  const root = resolve(top)
  if (!existsSync(join(root, '.planning', 'STATE.md'))) return // not a BMUZ project
  const readLines = (...p) => { try { return readFileSync(join(root, '.planning', ...p), 'utf8').replace(/\r\n/g, '\n').split('\n') } catch { return [] } }
  const heading = (id) => new RegExp(`^#{2,3} ${id}\\b`)
  // the feature's section: in SPRINT.md, else in the newest archived sprint (archived before the done commit — review);
  // a feature that was never in a sprint has no Check: plan to record against → not this rule's business
  const sprintLines = readLines('SPRINT.md')
  const archiveDir = join(root, '.planning', 'archive', 'sprints')
  let newest = []
  try { const f = readdirSync(archiveDir).filter(n => /^sprint-\d+\.md$/.test(n)).sort((a, b) => parseInt(b.slice(7)) - parseInt(a.slice(7)))[0]; if (f) newest = readLines('archive', 'sprints', f) } catch { /* none */ }
  const missing = featureIds(ids).filter(id => {
    const lines = sprintLines.some(l => heading(id).test(l)) ? sprintLines : newest
    const start = lines.findIndex(l => heading(id).test(l))
    if (start < 0) return false
    for (let i = start + 1; i < lines.length && !/^#{2,3} /.test(lines[i]); i++) {
      // "Checked: …", "**Checked:** …", "**Checked**: …", "- Checked: …", indented — check notes were long written as bullets
      const m = lines[i].match(/^[-*\s]*\*{0,2}Checked\*{0,2}:\*{0,2}(.*)$/i)
      if (m) return /^(—|-|<[^>]*>)?$/.test(m[1].trim()) // an empty or placeholder line records nothing
    }
    return true
  })
  if (!missing.length) return
  deny(`Blocked: "${ids}: done" but ${missing.map(id => `${id}'s section in .planning/SPRINT.md`).join(' and ')} has no "Checked:" line — the record of what was actually tested and how it went (F87). Under its "Check:" line, write e.g. "Checked: check:fast green · e2e:hand 4/4 · Muzzy fanned 7 cards on his phone" (what you ran or looked at + the result; a failed check gets fixed first). (The whole command line is checked before any of it runs, so write SPRINT.md in its own step first, then commit.)`)
}

// Nothing under .claude/worktrees/ (helpers' workspaces) goes into a commit — `git add -A` would add each one as an
// embedded repo (Goops 2026-10-17). save.mjs adds the ignore line, but helpers can start before the first save.
function checkNoWorktrees(calls, index) {
  const top = git(calls[index].dir, 'rev-parse', '--show-toplevel')
  if (!top) return
  const bad = commitFiles(calls, index, resolve(top)).filter(f => /^\.claude\/worktrees(\/|$)/.test(f))
  if (!bad.length) return
  deny(`Blocked: this commit would include ${bad.slice(0, 3).join(', ')} — a helper's workspace (a whole copy of the repo), which git would store as a broken embedded repo. Add the line \`.claude/worktrees/\` to .gitignore (and \`git rm -r --cached .claude/worktrees\` if it's already staged), then commit again.`)
}

// A stage commit carries STATE.md (F80): `Sprint 04: <goal>` (/sprint), `GDD: discover`, `GDD: define|design|build
// plan`, `GDD + roadmap: fast-track` (/discover, /define). Other `GDD: <change>` commits (a /gdd what-if) don't.
function checkStageCommitSavesState(calls, index, raw) {
  const { dir, args } = calls[index]
  const message = commitMessage(raw, args)
  // the stage word alone (or followed by " — <detail>"): "GDD: define the lobby flow better" is a /gdd change, not a stage
  const stage = /^\s*Sprint \d+\s*:/i.test(message) || /^\s*GDD(\s*\+\s*roadmap)?\s*:\s*(discover|define|design|build plan|fast-track)\s*([—–-].*)?$/i.test(message.split('\n')[0])
  if (!stage) return
  const top = git(dir, 'rev-parse', '--show-toplevel')
  if (!top) return
  const root = resolve(top)
  if (!existsSync(join(root, '.planning', 'STATE.md'))) return // not a BMUZ project
  if (commitFiles(calls, index, root).includes('.planning/STATE.md')) return
  deny(`Blocked: "${message.slice(0, 60)}" is a stage commit, but .planning/STATE.md isn't in it — the next session (or the laptop) starts from RESUME HERE. Update STATE first (Stage · Sprint · Doing in "Where we are"; RESUME HERE replaced with the next step — for a gap walk, the next gap), add it, then commit again.`)
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
