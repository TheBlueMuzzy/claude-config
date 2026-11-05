import { isOpenBug } from '../../../templates/ppp/plan-reader.mjs'

export default {
  id: 'PL10',
  name: 'plan.bug-count',
  what: 'BUGS.md\'s "Open: N (P0 · P1 · P2 · P3)" line matches the open bugs (watching ones may be counted apart)',
  why: 'The count is what every view shows at a glance (F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ bugs, text, add }) {
    const header = text.match(/^Open:\s*(\d+)(?:\s*\(([^)]*)\))?/m)
    const count = (list) => `${list.length} (${['P0', 'P1', 'P2', 'P3'].map(p => `${p} ${list.filter(b => b.priority === p).length}`).join(' · ')})`
    const open = bugs.filter(isOpenBug)
    const want = count(open)
    const wantNoWatching = count(open.filter(b => !/watching/i.test(b.status))) // "Open: 0 (…) · watching: 2" counts them apart
    const line = text.split('\n').findIndex(l => /^Open:/.test(l)) + 1
    const says = header && `${header[1]} (${(header[2] || '').trim()})`
    if (!header) add('BUGS.md', null, `no "Open: N (P0 · P1 · P2 · P3)" line under the title — should be "Open: ${want}"`)
    else if (says !== want && says !== wantNoWatching) add('BUGS.md', line, `"Open:" line says ${says} — the open bugs are ${want}`)
  },
}
