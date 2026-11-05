import { existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { LIVE, SYNCED, MARK, watched, unmarked } from './_shared.mjs'

export default {
  id: 'RK1',
  name: 'rules.kind-marked',
  what: 'A NEW rule line ("always / never / must / make sure / remember to…") in a BMUZ skill, config/bmuz doc or CLAUDE.md without its kind — ① a script or hook does it · ② judgement, refused until on record · ③ judgement only — is shown to Claude to mark, or to turn into a hook / script step. Old lines are left alone (a Write is compared with the last synced copy)',
  why: '"\'only runs when it remembers\' is a bad thing. \'always runs because it triggers\' is much more solid" (Muzzy, 2026-10-19)',
  on: true,
  mode: 'block',
  tests: 'rule-kind',
  check(args, { input, tell }) {
    const file = input.tool_input?.file_path
    if (!file || !watched(resolve(file))) return
    let added = []
    if (input.tool_name === 'Write') {
      const synced = join(SYNCED, relative(LIVE, resolve(file)))
      const before = new Set(existsSync(synced) ? unmarked(readFileSync(synced, 'utf8')) : [])
      added = unmarked(input.tool_input.content || '').filter(line => !before.has(line))
    } else {
      const edits = input.tool_input?.edits || [{ old_string: input.tool_input?.old_string, new_string: input.tool_input?.new_string }]
      for (const edit of edits) {
        const before = new Set(unmarked(edit.old_string || ''))
        added.push(...unmarked(edit.new_string || '').filter(line => !before.has(line)))
      }
      // an edit can replace PART of a line: judge the whole line as it is now in the file — its mark may sit before the
      // edited part (found in use: a HOOKS.md row "| 5 ① | …" edited mid-line was flagged)
      let now = []
      try { now = readFileSync(resolve(file), 'utf8').replace(/\r\n/g, '\n').split('\n') } catch {}
      added = added.filter(part => { const whole = now.find(l => l.includes(part)); return !whole || !MARK.test(whole) })
    }
    if (!added.length) return
    tell(`New rule line(s) in ${file} don't say how they happen (F80):\n${added.slice(0, 8).map(l => `- ${l.slice(0, 160)}`).join('\n')}\nMark each: ① a script or hook does it (name it) · ② judgement, but a hook/script refuses until it's on record (name it) · ③ judgement only (say why it can't be checked). If it's really "Claude must remember", make it ① or ② instead — a hook or a script step — and mark it then.`)
  },
}
