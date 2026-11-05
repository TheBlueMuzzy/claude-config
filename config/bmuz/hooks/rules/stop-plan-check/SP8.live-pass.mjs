import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { git } from '../../lib.mjs'
import { tagsSince } from './_shared.mjs'

export default {
  id: 'SP8',
  name: 'release.live-pass',
  what: 'A release tag (any vX.Y.Z) made this turn in a BMUZ project → .planning/live-pass names it (scripts/live-check.mjs writes it); a tag not on GitHub yet whose hand-back names a deploy Muzzy runs may wait',
  why: '"Is it really live?" is checked, not assumed (F80); Glyphtender v0.13.0 looped 6 turns waiting on Muzzy\'s deploy (F173)',
  on: true,
  rare: true, // a guard for something that should almost never happen: silence means it works (F187 removal pass)
  mode: 'block',
  tests: 'stop-plan-check',
  check({ root, name, turn, lastSaid }) {
    const released = tagsSince(root, turn.startedAt, /^v\d+\.\d+\.\d+$/).pop()
    if (!released || !existsSync(join(root, '.planning', 'STATE.md'))) return
    let pass = ''
    try { pass = readFileSync(join(root, '.planning', 'live-pass'), 'utf8').split(/\r?\n/)[1] || '' } catch {}
    // F173: not on GitHub yet (no remote branch holds the tag's commit) and the hand-back names a deploy Muzzy runs →
    // the live check can't happen until he does: let the turn end (Glyphtender v0.13.0 looped 6 turns on this)
    const pushed = !!git(root, 'for-each-ref', '--contains', released, 'refs/remotes')
    if (pass.split(/\s+/)[0] === released || (!pushed && /\bdeploy/i.test(lastSaid))) return // recorded, or waiting on Muzzy
    if (!pushed) return `${name}: ${released} is tagged but not on GitHub yet — after the smoke pass, git push --follow-tags, then node ~/.claude/config/bmuz/scripts/live-check.mjs (then commit live-pass with STATE). If it waits on Muzzy (a server deploy only he can run), say so in the hand-off's Your to-dos and the turn may end.`
    return `${name}: ${released} was released this turn, but .planning/live-pass doesn't record a live check for it — after the push run node ~/.claude/config/bmuz/scripts/live-check.mjs (it waits for the deploy, checks the page has ${released}, and records it; a project with nothing hosted records the skip), then commit live-pass with STATE.`
  },
}
