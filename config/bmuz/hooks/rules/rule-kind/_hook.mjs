// rule-kind — every rule says how it happens (F80 → rule files F184).
// Also a command: `node rule-kind.mjs --all` lists every unmarked rule line (for /checkup and the milestone look-back).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { LIVE, watched, unmarked } from './_shared.mjs'

export default {
  hook: 'rule-kind',
  event: 'PostToolUse',
  matcher: 'Edit|Write|MultiEdit',
  when: 'After Claude edits a BMUZ skill, a config/bmuz doc or ~/.claude/CLAUDE.md',
  order: ['RK1'],

  cli(args) {
    if (!args.includes('--all')) return
    const files = [join(LIVE, 'CLAUDE.md')]
    const skills = join(LIVE, 'skills')
    for (const name of existsSync(skills) ? readdirSync(skills) : []) files.push(join(skills, name, 'SKILL.md'))
    const walk = (dir) => { for (const name of readdirSync(dir)) { const p = join(dir, name); if (statSync(p).isDirectory()) { if (name !== 'reviews') walk(p) } else if (name.endsWith('.md')) files.push(p) } }
    if (existsSync(join(LIVE, 'config', 'bmuz'))) walk(join(LIVE, 'config', 'bmuz'))
    let total = 0
    for (const file of files.filter(f => existsSync(f) && watched(f))) {
      const lines = unmarked(readFileSync(file, 'utf8'))
      if (!lines.length) continue
      total += lines.length
      console.log(`${relative(LIVE, file).split('\\').join('/')} — ${lines.length}`)
      for (const line of lines) console.log(`    ${line.slice(0, 140)}`)
    }
    console.log(`\n${total} rule line(s) without ①/②/③ — each is either remembered-only (make it ① or ②) or needs its mark.`)
    process.exit(0)
  },
}
