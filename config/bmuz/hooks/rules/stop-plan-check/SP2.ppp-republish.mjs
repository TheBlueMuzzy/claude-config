import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { git } from '../../lib.mjs'
import { plannerLink } from './_shared.mjs'

export default {
  id: 'SP2',
  name: 'plan.ppp-published',
  what: 'The plan files changed (plan-lint rebuilt .planning/ppp.html) in a project with a published planner page (STATE "Planner (PPP):" link), but it wasn\'t republished → republish it. Any publish counts whose page has the same bytes as the project\'s ppp.html (a scratchpad copy, or publish_version content — F172)',
  why: 'Every request shows up in the planner Muzzy looks at (F67)',
  on: true,
  mode: 'block',
  tests: 'stop-plan-check',
  check({ root, p, name, sentPages }) {
    const gitDir = git(root, 'rev-parse', '--absolute-git-dir')
    const rebuilt = gitDir && join(gitDir, 'bmuz-ppp-rebuilt')
    const link = plannerLink(root)
    if (!rebuilt || !link || !existsSync(rebuilt)) return
    const published = join(gitDir, 'bmuz-ppp-published')
    const copy = !p.published && sentSamePage(join(root, '.planning', 'ppp.html'), sentPages)
    if (copy) { p.published = true; p.sentFiles.push(...copy.files.flatMap(f => [f.as, f.path]).filter(Boolean)) }
    if (p.published) { writeFileSync(published, new Date().toISOString()); return }
    if (!existsSync(published) || statSync(published).mtimeMs < statSync(rebuilt).mtimeMs) {
      return `${name}: the plan files changed, so the planner page was rebuilt (.planning/ppp.html) — republish it to ${link} with the Artifact tool (url = that link), or claude-artifacts publish_files with files: [{ as: 'index.html', path: '<project>/.planning/ppp.html' }] (get_artifact on the link gives slug + base_version).`
    }
  },
}

// F172: a page sent from elsewhere (a scratchpad copy, or publish_version content) whose bytes are this project's
// ppp.html as it is now — a copy made before the last rebuild doesn't match, so a stale page is still sent back
function sentSamePage(pppFile, sentPages) {
  let mine
  try { mine = readFileSync(pppFile, 'utf8') } catch { return null }
  return sentPages.find((sent) => {
    if (sent.content !== undefined) return sent.content === mine
    try { return readFileSync(sent.path, 'utf8') === mine } catch { return false }
  }) ?? null
}
