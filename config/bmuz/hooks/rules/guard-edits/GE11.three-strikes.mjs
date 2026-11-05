import { closeSync, mkdirSync, openSync, readFileSync, readSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const TAIL_BYTES = 600_000 // the end of the conversation is enough (a long session's log is 40+ MB)

export default {
  id: 'GE11',
  name: 'moments.three-strikes',
  what: 'The last 3 tool calls all failed the same way (the same hook refusal, or the same command failing) → a note beside the next call: "This approach isn\'t working. Reassessing." — a simpler path, or let the environment solve it. A note only, never a refusal; said once per kind of failure',
  why: 'CLAUDE.md\'s 3-strike rule: after 3 failed attempts at the same approach, stop and reassess — watch for adding complexity to fix complexity. A rule only Claude remembered → a hook (audit 2026-11 §5 #6, F185). It runs before a tool call (a refused call never reaches the after-tool hooks)',
  on: true,
  mode: 'warn',
  tests: 'guard-edits',
  check(_, { input }) {
    if (!input.transcript_path) return undefined
    const last = lastResults(input.transcript_path, 3)
    if (last.length < 3 || !last.every(r => r.failed)) return undefined
    const [sig] = last.map(r => r.signature)
    if (!sig || !last.every(r => r.signature === sig)) return undefined
    const dir = process.env.BMUZ_CTX_DIR || join(homedir(), '.claude', 'ctx') // (tests use their own folder)
    const said = join(dir, `${input.session_id || 'session'}.strikes`)
    try { if (readFileSync(said, 'utf8') === sig) return undefined } catch {}
    try { mkdirSync(dirname(said), { recursive: true }); writeFileSync(said, sig) } catch {}
    return `This approach isn't working. Reassessing. (The last 3 tries failed the same way: ${sig.slice(0, 140)}.) Before a 4th: is there a simpler path, or can the environment solve it (the Edit tool instead of a script, a file instead of a pipe)? Watch for adding complexity to fix complexity — and if it's still stuck, say so plainly (autonomous: BLOCKED: <reason> in STATE.md) and move on.`
  },
}

// The last `count` tool results, newest first: { failed, signature } — a hook refusal is signed by its reason, a failed
// command by the command itself
function lastResults(path, count) {
  let text = ''
  let cut = false // read from the middle of the file: its first line is a piece of one
  try {
    const size = statSync(path).size
    const fd = openSync(path, 'r')
    const buffer = Buffer.alloc(Math.min(size, TAIL_BYTES))
    readSync(fd, buffer, 0, buffer.length, size - buffer.length)
    closeSync(fd)
    text = buffer.toString('utf8')
    cut = size > buffer.length
  } catch { return [] }
  const entries = text.split('\n').slice(cut ? 1 : 0).map(line => { try { return JSON.parse(line) } catch { return null } }).filter(Boolean)
  const calls = new Map()
  const results = []
  for (const entry of entries) {
    const content = Array.isArray(entry.message?.content) ? entry.message.content : []
    for (const block of content) {
      if (block.type === 'tool_use') calls.set(block.id, block)
      if (block.type === 'tool_result') results.push(block)
    }
  }
  return results.slice(-count).reverse().map(result => {
    const said = (Array.isArray(result.content) ? result.content.map(c => c.text || '').join('\n') : String(result.content || '')).trim()
    const call = calls.get(result.tool_use_id)
    const refusal = /hook error:\s*([\s\S]*)/i.exec(said)
    const signature = refusal ? `refused: ${refusal[1].split('\n')[0].slice(0, 160)}`
      : call?.input?.command ? `failed: ${call.input.command.split('\n')[0].slice(0, 160)}`
      : `failed: ${call?.name || ''} ${said.split('\n')[0].slice(0, 120)}`
    return { failed: result.is_error === true, signature }
  })
}
