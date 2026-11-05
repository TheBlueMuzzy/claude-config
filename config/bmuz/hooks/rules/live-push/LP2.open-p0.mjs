import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readBugs, isOpenBug } from '../../../templates/ppp/plan-reader.mjs'

export default {
  id: 'LP2',
  name: 'live.no-open-p0',
  what: 'Refuses going live while BUGS.md has an open P0',
  why: 'A P0 (crash / can\'t continue / live broken) blocks every release (F67)',
  on: true,
  mode: 'block',
  tests: 'live-push',
  check({ root, what }, { deny }) {
    const bugsFile = join(root, '.planning', 'BUGS.md')
    const p0 = existsSync(bugsFile) ? readBugs(readFileSync(bugsFile, 'utf8').replace(/\r\n/g, '\n')).filter(b => isOpenBug(b) && b.priority === 'P0') : []
    if (p0.length) {
      deny(`Blocked: ${what} — BUGS.md has an open P0 (${p0.map(b => `${b.id}: ${b.next.trim().slice(0, 60)}`).join('; ')}). A P0 blocks every release: fix it (and get Muzzy's "verified"), or if it isn't really a P0, ask Muzzy to re-rate it.`)
    }
  },
}
