// stop-plan-check — the plan keeps up with the work (F67, F80 → rule files F184). Global Stop hook. Sends Claude back
// (until fixed, up to 3 times in a row — lib.stopVerdict, F80) for each project this turn worked in.
import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { readTurn, isCommit, gitCalls, git, commitMessage } from '../../lib.mjs'
import { MILESTONE_TAG } from './_shared.mjs'

const ORDER = ['SP1', 'SP3', 'SP8', 'SP4', 'SP5', 'SP6', 'SP7', 'SP2']

export default {
  hook: 'stop-plan-check',
  event: 'Stop',
  when: 'When Claude finishes a turn',
  order: ORDER,

  async run(ctx) {
    const { input } = ctx
    if (!input.transcript_path || !existsSync(input.transcript_path)) ctx.exit()
    const turn = readTurn(input.transcript_path)
    const { projects, sentPages } = scanTurn(turn)
    const lastSaid = input.last_assistant_message ?? turn.lastText ?? ''
    const problems = []
    for (const [root, p] of projects) {
      const name = root.split(/[\\/]/).pop()
      for (const id of ORDER) {
        const found = await ctx.rule(id, { root, p, name, turn, input, lastSaid, sentPages })
        if (Array.isArray(found)) problems.push(...found)
        else if (found) problems.push(found)
      }
    }
    ctx.stop(problems.length && `Before handing back:\n- ${problems.join('\n- ')}`)
  },
}

// The projects this turn worked in: where it committed, and where it edited plan files.
// → { projects: Map(root → { committed, touchedSprint, published, milestone, done, lookbacks, sketches, sentFiles }),
//     sentPages: planner pages sent from anywhere else (a scratchpad copy, or as content) — F172 }
function scanTurn(turn) {
  const projects = new Map()
  const sentPages = []
  const project = (dir) => {
    const top = dir && git(dir, 'rev-parse', '--show-toplevel')
    if (!top) return null
    const root = resolve(top)
    if (!projects.has(root)) projects.set(root, { committed: false, touchedSprint: false, published: false, milestone: false, done: false, lookbacks: new Set(), sketches: new Set(), sentFiles: [] })
    return projects.get(root)
  }
  for (const tool of turn.tools) {
    const file = tool.input.file_path || ''
    if (isCommit(tool)) {
      for (const call of gitCalls(tool.input.command, tool.cwd)) {
        if (call.sub !== 'commit') continue
        const p = project(call.dir)
        if (!p) continue
        p.committed = true
        if (/^F\d+[a-z]?: done\b/.test(commitMessage(tool.input.command, call.args))) p.done = true
      }
    }
    // the release scripts commit + tag inside their own process (git calls the shell never shows): note the project,
    // the tags made this turn are looked up by SP3 / SP8
    if ((tool.name === 'Bash' || tool.name === 'PowerShell') && /\b(release|save|merge|archive-sprint)\.mjs\b/.test(tool.input.command || '')) project(tool.cwd)
    // a milestone / release stage went out: tag vX.Y.0, or a "Release vX.Y.0" commit
    if (tool.name === 'Bash' || tool.name === 'PowerShell') {
      for (const call of gitCalls(tool.input.command || '', tool.cwd)) {
        const tagged = call.sub === 'tag' && !call.args.some(a => a === '-d' || a === '--delete') && call.args.some(a => MILESTONE_TAG.test(a))
        const released = call.sub === 'commit' && /^Release v\d+\.\d+\.0\b/.test(commitMessage(tool.input.command, call.args))
        if (tagged || released) { const p = project(call.dir); if (p) p.milestone = true }
      }
    }
    if (/[\\/]\.planning[\\/]archive[\\/]lookbacks[\\/][^\\/]+\.md$/.test(file)) { const p = project(resolve(file, '..')); if (p) p.lookbacks.add(file) }
    if (/[\\/]\.planning[\\/][^\\/]+\.md$/.test(file)) project(resolve(file, '..')) // any plan edit: the planner may need republishing
    if (/[\\/]\.planning[\\/]SPRINT\.md$/.test(file)) { const p = project(resolve(file, '..')); if (p) p.touchedSprint = true }
    if ((tool.name === 'Bash' || tool.name === 'PowerShell') && /SPRINT\.md/.test(tool.input.command || '')) { const p = project(tool.cwd); if (p) p.touchedSprint = true }
    if (tool.name === 'Artifact' && /ppp\.html$/.test(file)) {
      const p = project(resolve(file, '..', '..'))
      if (p) { p.published = true; p.sentFiles.push(...sentFiles(tool.input.files)) }
    }
    // The claude-artifacts server's publish_files counts too: its index.html entry is the project's .planning/ppp.html
    // (Goops 2026-10-29 + Glyphtender 2026-10-30: a publish through it wasn't seen, so the hook kept asking — Muzzy OK'd the fix)
    if (/claude-artifacts__publish_files$/.test(tool.name) && Array.isArray(tool.input.files)) {
      const page = tool.input.files.find(f => f?.as === 'index.html' && /[\\/]\.planning[\\/]ppp\.html$/.test(f.path || ''))
      const p = page && project(resolve(page.path, '..', '..'))
      if (p) { p.published = true; p.sentFiles.push(...tool.input.files.flatMap(f => [f.as, f.path]).filter(Boolean)) }
      // F172: a chat working in another project can only attach a scratchpad copy — kept here, matched by its bytes (SP2)
      const copy = tool.input.files.find(f => f?.as === 'index.html' && f.path && !page)
      if (copy) sentPages.push({ path: copy.path, files: tool.input.files })
    }
    if (/claude-artifacts__publish_version$/.test(tool.name) && typeof tool.input.content === 'string') sentPages.push({ content: tool.input.content, files: [] })
    if (/[\\/]\.planning[\\/]research[\\/]sketches[\\/][^\\/]+\.html$/.test(file) && tool.name !== 'Artifact') { const p = project(existingDir(file)); if (p) p.sketches.add(basename(file)) }
    if (['Write', 'Edit', 'MultiEdit'].includes(tool.name) && /[\\/]content[\\/]/.test(file)) project(existingDir(file)) // a data file: checked against the TDD (SP6)
  }
  return { projects, sentPages }
}

// The nearest folder above a file that exists (a file may have been moved or deleted since).
function existingDir(file) {
  let dir = resolve(file, '..')
  while (!existsSync(dir) && resolve(dir, '..') !== dir) dir = resolve(dir, '..')
  return dir
}

// The published paths and sources an Artifact call sent as `files` (a map or a list).
function sentFiles(files) {
  if (!files) return []
  if (Array.isArray(files)) return files.map(f => (typeof f === 'string' ? f : f?.path || '')).filter(Boolean)
  return Object.entries(files).flatMap(([key, v]) => [key, typeof v === 'string' ? v : v?.from || v?.path || ''])
}
