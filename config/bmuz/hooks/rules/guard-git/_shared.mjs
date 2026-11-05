// Helpers several guard-git rules share (F184 — moved out of guard-git.mjs unchanged).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { git, commitFiles, commitMessage } from '../../lib.mjs'

// The commit a rule checks, the same shape from both places it's checked:
//   - a `git commit` Claude typed (PreToolUse — read before the command line runs): commandCommit
//   - git's own commit-msg step, with the real staged files and message (git-hooks/commit-msg, F184): stagedCommit
// { dir, message (first line), files(root) → paths relative to the repo root, branch() → the branch it lands on }
export function commandCommit(calls, index, raw) {
  return {
    dir: calls[index].dir,
    message: commitMessage(raw, calls[index].args),
    files: (root) => commitFiles(calls, index, root),
    branch: () => branchAt(calls, index),
  }
}
export function stagedCommit(root, message) {
  return {
    dir: root,
    message: String(message || '').split(/\r?\n/)[0],
    files: () => (git(root, 'diff', '--cached', '--name-only', '--diff-filter=ACMR') || '').split('\n').filter(Boolean),
    branch: () => git(root, 'rev-parse', '--abbrev-ref', 'HEAD'),
  }
}

// The repo root a commit is in (git says C:/x, Node says C:\x — one spelling), or null outside a repo.
export function rootOf(commit) {
  const top = git(commit.dir, 'rev-parse', '--show-toplevel')
  return top ? resolve(top) : null
}

// "F08 + F09: done" → 'F08 + F09' (the ids part), else null.
export function doneIds(message) {
  return (message.match(/^\s*(F\d+[a-z]?(?:\s*\+\s*F\d+[a-z]?)*)\s*:\s*done\b/i) || [])[1] || null
}

// The feature ids in "F08 + f09b: done" → ['F08', 'F09b'] (a lowercase "f08: done" made the old match return null and
// the whole hook crash — so every done check was skipped; review)
export function featureIds(ids) {
  return (ids.match(/F\d+[a-z]?/gi) || []).map(id => 'F' + id.slice(1))
}

// The branch a call runs on: the current one, or the one an earlier `git checkout x` / `git switch x` on the line moves to.
export function branchAt(calls, index) {
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

// Did /deliver run in this session? (Muzzy typed it, or Claude called the deliver skill.)
export function deliverRan(input) {
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
