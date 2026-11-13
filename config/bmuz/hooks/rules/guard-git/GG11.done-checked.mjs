import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { rootOf, doneIds, featureIds } from './_shared.mjs'

export default {
  id: 'GG11',
  name: 'commit.done-checked-line',
  what: 'Refuses `F08: done` when F08\'s SPRINT.md section has no `Checked:` line saying what was tested and how it went',
  why: 'The record that the feature\'s `Check:` plan was really carried out (F87)',
  on: true,
  mode: 'block',
  tests: 'guard-git-safety',
  check({ commit }, { deny }) {
    if (!commit) return
    const ids = doneIds(commit.message)
    if (!ids) return
    const root = rootOf(commit)
    if (!root) return
    if (!existsSync(join(root, '.planning', 'STATE.md'))) return // not a BMUZ project
    const readLines = (...p) => { try { return readFileSync(join(root, '.planning', ...p), 'utf8').replace(/\r\n/g, '\n').split('\n') } catch { return [] } }
    const heading = (id) => new RegExp(`^#{2,3} ${id}\\b`)
    // the feature's section: in SPRINT.md, else in the newest archived sprint (archived before the done commit — review);
    // a feature that was never in a sprint has no Check: plan to record against → not this rule's business
    const sprintLines = readLines('SPRINT.md')
    const archiveDir = join(root, '.planning', 'archive', 'sprints')
    let newest = []
    try { const f = readdirSync(archiveDir).filter(n => /^sprint-\d+\.md$/.test(n)).sort((a, b) => parseInt(b.slice(7)) - parseInt(a.slice(7)))[0]; if (f) newest = readLines('archive', 'sprints', f) } catch { /* none */ }
    const missing = featureIds(ids).filter(id => {
      const lines = sprintLines.some(l => heading(id).test(l)) ? sprintLines : newest
      const start = lines.findIndex(l => heading(id).test(l))
      if (start < 0) return false
      for (let i = start + 1; i < lines.length && !/^#{2,3} /.test(lines[i]); i++) {
        // "Checked: …", "**Checked:** …", "**Checked**: …", "- Checked: …", indented — check notes were long written as bullets;
        // "Checked (F230 — Release pipeline, main chat …): …" too — sprint 67 wrote every Checked line that way (F226, 2026-11-12)
        const m = lines[i].match(/^[-*\s]*\*{0,2}Checked(?: \([^)]*\))?\*{0,2}:\*{0,2}(.*)$/i)
        if (m) return /^(—|-|<[^>]*>)?$/.test(m[1].trim()) // an empty or placeholder line records nothing
      }
      return true
    })
    if (!missing.length) return
    deny(`Blocked: "${ids}: done" but ${missing.map(id => `${id}'s section in .planning/SPRINT.md`).join(' and ')} has no "Checked:" line — the record of what was actually tested and how it went (F87). Under its "Check:" line, write e.g. "Checked: check:fast green · e2e:hand 4/4 · Muzzy fanned 7 cards on his phone" (what you ran or looked at + the result; a failed check gets fixed first). (The whole command line is checked before any of it runs, so write SPRINT.md in its own step first, then commit.)`)
  },
}
