import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { rootOf } from './_shared.mjs'

export default {
  id: 'GG13',
  name: 'commit.stage-has-state',
  what: 'Refuses a stage commit (`Sprint 04: <goal>`, `GDD: discover`, `GDD: define|design|build plan`, `GDD + roadmap: fast-track`) without STATE.md in it',
  why: 'The next session starts from RESUME HERE — a stage change that STATE doesn\'t say is lost to it (F80)',
  on: true,
  mode: 'block',
  tests: 'guard-git-safety',
  check({ commit }, { deny }) {
    if (!commit) return
    const message = commit.message
    // the stage word alone (or followed by " — <detail>"): "GDD: define the lobby flow better" is a /gdd change, not a stage
    const stage = /^\s*Sprint \d+\s*:/i.test(message) || /^\s*GDD(\s*\+\s*roadmap)?\s*:\s*(discover|define|design|build plan|fast-track)\s*([—–-].*)?$/i.test(message.split('\n')[0])
    if (!stage) return
    const root = rootOf(commit)
    if (!root) return
    if (!existsSync(join(root, '.planning', 'STATE.md'))) return // not a BMUZ project
    if (commit.files(root).includes('.planning/STATE.md')) return
    deny(`Blocked: "${message.slice(0, 60)}" is a stage commit, but .planning/STATE.md isn't in it — the next session (or the laptop) starts from RESUME HERE. Update STATE first (Stage · Sprint · Doing in "Where we are"; RESUME HERE replaced with the next step — for a gap walk, the next gap), add it, then commit again.`)
  },
}
