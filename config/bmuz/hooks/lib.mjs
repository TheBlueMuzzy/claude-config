// Shared helpers for the BMUZ hooks (F68). Each hook script reads the tool call Claude Code sends on stdin,
// decides, and answers with JSON on stdout. Plain Node, no packages — runs the same on the PC and the laptop.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve, isAbsolute } from 'node:path'

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

// --- reading a shell command --------------------------------------------------

// Bash heredoc bodies (`<<'EOF'` … `EOF`) are text — usually a commit message — never commands. Drop them.
function dropHeredocs(text) {
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

function toDir(target, from) {
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
