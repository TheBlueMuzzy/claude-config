import { existsSync } from 'node:fs'
import { join } from 'node:path'

export default {
  id: 'PL26',
  name: 'plan.guard-file-real',
  what: 'The test a bug is "Guarded by:" really exists',
  why: 'A name that points nowhere guards nothing (F80)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ bugs, dir, add }) {
    for (const bug of bugs) {
      // "Guarded by: e2e/a.mjs (what it checks) + src/b.test.ts — …": the first word of each part, when it's a file
      let guard = ((bug.rest.match(/Guarded by:\s*(.*?)(?:\s+—\s|\s+·\s|$)/i) || [])[1] || '')
      for (let i = 0; i < 5; i++) guard = guard.replace(/\([^()]*\)/g, '')
      for (const part of guard.split(/,|\s\+\s|\sand\s/)) {
        const path = (part.trim().split(/\s+/)[0] || '').replace(/^`|`$/g, '')
        if (!/^[\w.~-][\w./~-]*\.[a-z]{1,4}$/i.test(path)) continue // words, npm scripts ("e2e"), folders
        if (!existsSync(join(dir, path))) add('BUGS.md', bug.lineNo, `${bug.id} is "Guarded by: ${path}", but that file doesn't exist — name the real test file`)
      }
    }
  },
}
