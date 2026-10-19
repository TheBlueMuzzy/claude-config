// Are the musts for a release stage all done? (F69 — /deliver §1 "done check")
//   node ~/.claude/config/bmuz/scripts/musts-check.mjs [stage]     (default: the stage named in ROADMAP "Release target:")
// Lists every `must:<stage>` feature that isn't ✅, with its state. Exit 0 = all done, 1 = some open (or no musts).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readRoadmap } from '../templates/ppp/plan-reader.mjs'
import { say, ok, refuse, args, projectDir } from './lib.mjs'

let text
try { text = readFileSync(join(projectDir(), '.planning', 'ROADMAP.md'), 'utf8').replace(/\r\n/g, '\n') } catch { refuse('no .planning/ROADMAP.md here', '/define makes one') }
const stage = (args().words[0] || (text.match(/^Release target:\s*([a-z0-9.]+)/im) || [])[1] || '').toLowerCase()
if (!stage) refuse('which stage? (ROADMAP has no "Release target:" line)', 'musts-check.mjs alpha')
const { allItems, parking } = readRoadmap(text)
const musts = [...allItems, ...parking].filter(item => new RegExp(`^must:\\s*${stage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.])`, 'i').test(item.scope))
if (!musts.length) refuse(`no feature says must:${stage}`, '/define sets the musts for each stage')
const open = musts.filter(item => item.state.key !== 'done')
if (!open.length) { ok(`${stage} musts: ${musts.length}/${musts.length} done`); process.exit(0) }
say(`${stage} musts: ${musts.length - open.length}/${musts.length} done — still open:`)
for (const item of open) say(`  ${item.id ?? '—'} ${item.title.slice(0, 70)} — ${item.state.label}`)
process.exit(1)
