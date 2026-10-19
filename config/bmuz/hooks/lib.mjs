// Shared helpers for the BMUZ hooks (F68). Each hook script reads the tool call Claude Code sends on stdin,
// decides, and answers with JSON on stdout. Plain Node, no packages — runs the same on the PC and the laptop.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve, isAbsolute, relative } from 'node:path'

// The tool call Claude Code sends: { cwd, tool_name, tool_input: { command | file_path }, ... }
export function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8')) // 0 = stdin
  } catch {
    return {}
  }
}

// --- answers ---------------------------------------------------------------

// Stop a tool call before it runs. Claude sees the reason.
export function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  }))
  process.exit(0)
}

// After a tool ran: show Claude a message next to the result (the tool has already happened).
export function tellClaude(reason) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason }))
  process.exit(0)
}

// --- reading the conversation log (Stop hooks) ----------------------------------

// What Claude did since Muzzy's last message: { startedAt, tools: [{ name, input, cwd }], lastText }.
export function readTurn(path) {
  let entries = []
  try {
    entries = readFileSync(path, 'utf8').split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line) } catch { return null }
    }).filter(Boolean)
  } catch {
    return { startedAt: null, tools: [], lastText: null }
  }
  let start = -1
  entries.forEach((entry, i) => { if (isPrompt(entry)) start = i })
  const tools = []
  let lastText = null
  for (const entry of entries.slice(start + 1)) {
    if (entry.type !== 'assistant' || !Array.isArray(entry.message?.content)) continue
    for (const block of entry.message.content) {
      if (block.type === 'text') lastText = block.text
      if (block.type === 'tool_use') tools.push({ name: block.name, input: block.input || {}, cwd: entry.cwd })
    }
  }
  return { startedAt: start >= 0 ? entries[start].timestamp || null : null, tools, lastText }
}

// A message from Muzzy (or a helper's report) starts a turn; tool results don't.
function isPrompt(entry) {
  if (entry.type !== 'user' || entry.isMeta) return false
  const content = entry.message?.content
  if (typeof content === 'string') return true
  return Array.isArray(content) && content.length > 0 && content.every(block => block.type === 'text')
}

// Did a tool call change files or commit?
export const isCommit = (tool) => (tool.name === 'Bash' || tool.name === 'PowerShell') && /\bgit\b[^\n]*\bcommit\b/.test(tool.input.command || '')
export const isFileEdit = (tool) => ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool.name)

// --- reading a shell command --------------------------------------------------

// Bash heredoc bodies (`<<'EOF'` … `EOF`) are text — usually a commit message — never commands. Drop them.
export function dropHeredocs(text) {
  const lines = text.split('\n')
  const out = []
  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i])
    const tags = [...lines[i].matchAll(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/g)].map(m => m[2])
    for (const tag of tags) {
      while (i + 1 < lines.length && lines[i + 1].trim() !== tag) i++
      if (i + 1 < lines.length) i++ // the closing tag line
    }
  }
  return out.join('\n')
}

// Split a command line into tokens, keeping quoted parts together. Separators (&&, ||, ;, |, &, newline, brackets)
// become their own token so we can tell where one command ends and the next begins.
export function tokenize(raw) {
  const text = dropHeredocs(raw)
  const tokens = []
  let word = ''
  let quote = null
  const push = () => { if (word !== '') tokens.push(word); word = '' }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      if (quote === '"' && ch === '\\' && (text[i + 1] === '"' || text[i + 1] === '\\')) { word += text[++i]; continue }
      if (ch === quote) quote = null
      else word += ch
      continue
    }
    // PowerShell here-string @' … '@ / @" … "@ → one word (a message, not commands)
    if (ch === '@' && (text[i + 1] === "'" || text[i + 1] === '"') && word === '') {
      const close = text.indexOf(`\n${text[i + 1]}@`, i + 2)
      word += text.slice(i + 2, close < 0 ? text.length : close)
      i = close < 0 ? text.length : close + 2
      continue
    }
    if (ch === '\\' && (text[i + 1] === '"' || text[i + 1] === "'")) { word += text[++i]; continue }
    if (ch === '"' || ch === "'") { quote = ch; continue }
    if (ch === ' ' || ch === '\t') { push(); continue }
    const two = text.slice(i, i + 2)
    if (two === '&&' || two === '||') { push(); tokens.push(two); i++; continue }
    if (';|&\n\r(){}'.includes(ch)) { push(); tokens.push(';'); continue } // & = background / PowerShell call operator
    word += ch
  }
  push()
  return tokens
}

const SEPARATORS = new Set(['&&', '||', ';'])
const PREFIXES = new Set(['command', 'sudo', 'exec', 'time', 'nohup', 'env', '$']) // words that just run the next one

// Each simple command in a command line, with the folder it runs in: [{ dir, words }].
// Follows `cd x &&` / `Set-Location x;`, skips `FOO=bar` and `sudo`/`command` in front.
export function commands(command, startDir) {
  const list = []
  let dir = startDir
  let segment = []
  const finish = () => {
    let words = segment
    segment = []
    while (words.length && (PREFIXES.has(words[0]) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0]))) words = words.slice(1)
    if (!words.length) return
    const first = words[0].toLowerCase()
    if (first === 'cd' || first === 'set-location' || first === 'pushd' || first === 'sl') {
      const target = words.slice(1).find(w => !w.startsWith('-'))
      if (target) dir = toDir(target, dir)
      return
    }
    list.push({ dir, words })
  }
  for (const token of tokenize(command)) {
    if (SEPARATORS.has(token)) finish()
    else segment.push(token)
  }
  finish()
  return list
}

// Every git call in a command line, with the folder it will run in:
// [{ dir, sub: 'push', args: ['origin', 'main'] }]. Also follows `git -C x`.
export function gitCalls(command, startDir) {
  const calls = []
  for (const { dir, words } of commands(command, startDir)) {
    const first = words[0].toLowerCase()
    if (!/^git(\.exe)?$/.test(first) && !/[\\/]git(\.exe)?$/.test(first)) continue
    let gitDir = dir
    let i = 1
    while (i < words.length && words[i].startsWith('-')) {
      if (words[i] === '-C' && words[i + 1]) { gitDir = toDir(words[i + 1], gitDir); i += 2; continue }
      if (words[i] === '-c' && words[i + 1]) { i += 2; continue }
      i++
    }
    if (i < words.length) calls.push({ dir: gitDir, sub: words[i], args: words.slice(i + 1) })
  }
  return calls
}

// The files a `git commit` (calls[index]) will include: staged files, plus changed tracked files with -a / --all.
// A hook runs before the WHOLE command line, so in `git add -A && git commit` nothing is staged yet:
// a `git add` earlier on the line counts every changed and new file too. Paths are relative to the repo root.
export function commitFiles(calls, index, root) {
  const { dir, args } = calls[index]
  const all = args.includes('-a') || args.includes('--all') || args.some(a => /^-[a-zA-Z]*a[a-zA-Z]*$/.test(a) && !a.startsWith('--'))
  const addFirst = calls.slice(0, index).some(call => call.sub === 'add' || call.sub === 'stage')
  const files = new Set((git(root, 'diff', '--cached', '--name-only', '--diff-filter=ACMR') || '').split('\n'))
  const paths = commitPaths(args) // `git commit -m x src/a.ts` commits that file as it is now
  if (paths.length) for (const f of (git(dir, 'diff', 'HEAD', '--name-only', '--', ...paths) || '').split('\n')) files.add(f)
  if (all || addFirst) for (const f of (git(root, 'diff', '--name-only', '--diff-filter=ACMR') || '').split('\n')) files.add(f)
  if (addFirst) for (const f of (git(root, 'ls-files', '--others', '--exclude-standard') || '').split('\n')) files.add(f)
  // `printf … > src/a.ts && git add src/a.ts && git commit`: the file doesn't exist yet when the hook looks — the
  // paths named on that `git add` count too (found in a real try, 2026-10-18)
  for (const call of calls.slice(0, index)) {
    if (call.sub !== 'add' && call.sub !== 'stage') continue
    for (const a of call.args) if (!a.startsWith('-') && a !== '.' && a !== '*') files.add(relative(root, resolve(call.dir, a)).split('\\').join('/'))
  }
  files.delete('')
  return [...files]
}

// File paths named on `git commit` (everything that isn't an option or an option's value).
function commitPaths(args) {
  const WITH_VALUE = new Set(['-m', '-F', '-C', '-c', '-t', '--author', '--date', '--file', '--message', '--template',
    '--reuse-message', '--reedit-message', '--fixup', '--squash', '--trailer', '--cleanup', '--pathspec-from-file'])
  const paths = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--') { paths.push(...args.slice(i + 1)); break }
    if (WITH_VALUE.has(a)) { i++; continue }
    if (a.startsWith('-')) {
      if (/^-[a-zA-Z]+$/.test(a) && /[mFCct]$/.test(a)) i++ // -am "message"
      continue
    }
    paths.push(a)
  }
  return paths
}

// The first line of a commit's message: from -m / -am / --message, or a heredoc / here-string body in the raw command.
export function commitMessage(rawCommand, args) {
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if ((a === '-m' || a === '--message' || (/^-[a-zA-Z]+$/.test(a) && a.endsWith('m'))) && args[i + 1] && !args[i + 1].startsWith('$')) return args[i + 1].replace(/^\s+/, '').split(/\r?\n/)[0] // a here-string starts with a line break
    if (a.startsWith('--message=')) return a.slice(10).split('\n')[0]
  }
  const body = rawCommand.match(/<<-?\s*['"]?[A-Za-z_]\w*['"]?[^\n]*\n([^\n]*)/) || rawCommand.match(/@['"]\r?\n([^\n]*)/)
  return body ? body[1] : ''
}

export function toDir(target, from) {
  let t = target.replace(/^~(?=$|[\\/])/, process.env.HOME || process.env.USERPROFILE || '~')
  t = t.replace(/^\$HOME(?=$|[\\/])/, process.env.HOME || process.env.USERPROFILE || '')
  t = t.replace(/^\$env:USERPROFILE(?=$|[\\/])/i, process.env.USERPROFILE || '')
  t = t.replace(/^\/([a-zA-Z])\//, '$1:/') // Git Bash /c/Users → c:/Users
  return isAbsolute(t) ? t : resolve(from || '.', t)
}

// --- git ---------------------------------------------------------------------

// Run git in a folder; returns its output, or null if it failed.
export function git(dir, ...args) {
  try {
    return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

// The branch that holds finished work: origin's default, else main, else master.
export function defaultBranch(dir) {
  const head = git(dir, 'symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD')
  if (head) return head.replace(/^origin\//, '')
  for (const name of ['main', 'master']) {
    if (git(dir, 'rev-parse', '--verify', '--quiet', `refs/heads/${name}`) !== null) return name
  }
  return null
}

// Is every commit of `ref` already inside `target`? (Then deleting `ref` loses nothing.)
export function isMergedInto(dir, ref, target) {
  try {
    execFileSync('git', ['-C', dir, 'merge-base', '--is-ancestor', ref, target], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}
