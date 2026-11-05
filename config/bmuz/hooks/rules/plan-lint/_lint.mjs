// Linting a project's plan files (F67 → rule files F184): reads ROADMAP, SPRINT, BUGS and STATE with the same reader as
// the planner page (templates/ppp/plan-reader.mjs), so both agree, and runs each plan rule on them. Shared by the hook
// (after an edit) and the command (`node plan-lint.mjs <projectDir>`).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { readRoadmap, readSprint, readBugs } from '../../../templates/ppp/plan-reader.mjs'

export const PLAN_FILES = ['ROADMAP.md', 'SPRINT.md', 'BUGS.md', 'STATE.md']
export const LISTING = '.planning/' // texts[LISTING] = the folder's entries (the last commit's, for "new since HEAD")

// The rules per plan file, in the order their problems are listed
const ROADMAP_RULES = ['PL11', 'PL18', 'PL17', 'PL15', 'PL6', 'PL5', 'PL20', 'PL14']
const SPRINT_RULES = ['PL16', 'PL4', 'PL3', 'PL12', 'PL2', 'PL22', 'PL9', 'PL23']
const BUG_RULES = ['PL11', 'PL24', 'PL25', 'PL26', 'PL27', 'PL10']
const STATE_RULES = ['PL28', 'PL8', 'PL29', 'PL30', 'PL7']
export const LINT_RULES = [...new Set([...ROADMAP_RULES, ...SPRINT_RULES, ...BUG_RULES, ...STATE_RULES, 'PL19'])]

// Every problem in a project's plan files: { file, line, message, rule }.
// `texts` replaces files' contents (name → text, or null = no such file) — used for the last commit's version.
export async function lintProject(ctx, dir, texts = null) {
  const read = (name) => { if (texts) return texts[name] ?? null; try { return readFileSync(join(dir, '.planning', name), 'utf8').replace(/\r\n/g, '\n') } catch { return null } }
  const problems = []
  const run = (id, args) => ctx.rule(id, { ...args, add: (file, line, message) => problems.push({ file, line, message, rule: id }) })
  const roadmapText = read('ROADMAP.md')
  const roadmap = roadmapText === null ? null : readRoadmap(roadmapText)
  if (roadmap) {
    // every item by id, the first one winning (PL11 names the second as a duplicate)
    const byId = {}
    for (const item of [...roadmap.allItems, ...roadmap.parking].filter(i => i.id)) if (!byId[item.id]) byId[item.id] = item
    for (const id of ROADMAP_RULES) await run(id, { roadmap, byId })
  }
  const sprintText = read('SPRINT.md')
  const bugsText = read('BUGS.md')
  if (sprintText !== null) {
    const sprint = readSprint(sprintText)
    for (const id of SPRINT_RULES) await run(id, { sprint, roadmap, text: sprintText, dir, bugsText })
  }
  if (bugsText !== null) {
    const bugs = readBugs(bugsText)
    for (const id of BUG_RULES) await run(id, { bugs, text: bugsText, dir })
  }
  const stateText = read('STATE.md')
  if (stateText !== null) for (const id of STATE_RULES) await run(id, { text: stateText })
  // nothing else in .planning/ (F80) — only in a BMUZ project (an old GSD one has its own files until converted)
  if (stateText !== null && /RESUME HERE/.test(stateText)) await run('PL19', { dir, texts })
  return problems
}

// Is a need met? ✅ done — or, for a soft "~F07" need, 🎛️ tuning is enough (it only has to work). Unknown → no.
export function met(need, byId) {
  const other = byId[need.replace(/^~/, '')]
  if (!other) return false
  return other.state.key === 'done' || (need.startsWith('~') && /^- 🎛/.test(other.raw))
}

// The text of a `<label>: …` line in the section starting at `headingLineNo` (up to the next "## "), or '' when there's
// none or it's still a placeholder ("Check: —", "Check: <…>"). "**Check:**", "**Check**:", "- Check:" and an indented
// line count too (review: check notes have long been written as bullets)
export function sectionLine(lines, headingLineNo, label) {
  for (let i = headingLineNo; i < lines.length && !/^## /.test(lines[i]); i++) {
    const m = lines[i].match(new RegExp(`^[-*\\s]*\\*{0,2}${label}\\*{0,2}:\\*{0,2}(.*)$`, 'i'))
    if (m) { const value = m[1].trim(); return /^(—|-|<[^>]*>)?$/.test(value) ? '' : value }
  }
  return ''
}

// A sprint feature's ROADMAP line is missing (PL4 names it) — the other sprint rules skip that feature
export const unknownFeature = (feature, roadmap) => roadmap && !roadmap.byId[feature.id]
