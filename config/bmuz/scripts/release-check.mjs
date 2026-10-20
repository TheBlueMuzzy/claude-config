// Stage-release checks (F83) — an alpha / beta / 1.0 goes out only after the things a real studio checks were done:
// devices tried, a first-time player, fresh store screenshots, privacy + age rating, and — from beta — no stand-in art.
// The list is `.planning/archive/release-checks/<stage>.md`, made from templates/release-check.md; every line for the
// stage must be filled in and ticked. release.mjs runs these checks for every stage release (gate F83).
//   node ~/.claude/config/bmuz/scripts/release-check.mjs <alpha|beta|1.0>   writes that stage's checklist (never over one)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const TEMPLATE = join(import.meta.dirname, '..', 'templates', 'release-check.md')
export const checkFile = (stage) => `.planning/archive/release-checks/${stage}.md`

// alpha 1 · beta 2 · 1.0 (or rc / gold / launch) 3; any other stage name counts as alpha
export function stageRank(stage) {
  const s = String(stage || '').toLowerCase()
  if (/^(1\.0|1|rc|gold|launch|release)\b/.test(s)) return 3
  if (/^beta\b/.test(s)) return 2
  return 1
}
const TAG_RANK = { 'beta+': 2, '1.0': 3 }

// Checklist lines as { label, tag, ticked, filled, text }. "- [x] [beta+] No stand-in art: <…>" → label "No stand-in art".
export function readChecklist(text) {
  const lines = []
  for (const line of (text || '').replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const m = line.match(/^\s*-\s*\[( |x|X)\]\s*(?:\[(beta\+|1\.0)\]\s*)?([^:]+):(.*)$/)
    if (!m) continue
    const [, box, tag, label, rest] = m
    lines.push({ label: label.trim(), tag: tag || null, ticked: box !== ' ', filled: rest.trim() !== '' && !/<[^>]*>/.test(rest), text: rest.trim() })
  }
  return lines
}

// The template's lines that count for this stage
export function linesFor(stage) {
  const rank = stageRank(stage)
  return readChecklist(readFileSync(TEMPLATE, 'utf8')).filter(l => !l.tag || TAG_RANK[l.tag] <= rank)
}

// Stand-in art still in the game (beta+): credits.json entries marked stand-in, open (stand-in) tasks, files named so
const ART = /\.(png|jpe?g|webp|gif|svg|avif|mp3|ogg|wav|m4a|flac|woff2?|ttf|otf|glb|gltf|fbx|obj)$/i
const STAND_IN = /\bstand-?ins?\b|\bplaceholders?\b|\btemp(?:orary)? art\b/i
export function standIns(root) {
  const found = []
  let credits = []
  try { credits = JSON.parse(readFileSync(join(root, 'content', 'credits.json'), 'utf8')) } catch { /* none or unreadable — the framework check covers that */ }
  for (const entry of Array.isArray(credits) ? credits : []) {
    const said = [entry.source, entry.licence, entry.credit, entry.note].filter(Boolean).join(' ')
    if (entry.standIn === true || STAND_IN.test(said)) found.push(`credits.json: ${(entry.paths || []).join(', ') || entry.source} — "${entry.standIn === true ? 'standIn: true' : said.match(STAND_IN)[0]}"`)
  }
  try {
    for (const line of readFileSync(join(root, '.planning', 'SPRINT.md'), 'utf8').split(/\r?\n/)) {
      if (/^\s*- \[ \].*\(stand-in\)/i.test(line)) found.push(`SPRINT.md: ${line.replace(/^\s*- \[ \]\s*/, '').trim()}`)
    }
  } catch { /* no sprint running */ }
  for (const top of ['public', 'src', 'assets', 'content']) {
    for (const file of walk(join(root, top))) {
      const rel = relative(root, file).split('\\').join('/')
      if (ART.test(rel) && STAND_IN.test(rel.replace(/[_/.]/g, ' '))) found.push(`file: ${rel}`)
    }
  }
  return found
}
function* walk(dir) {
  let entries = []
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    if (e.isDirectory()) yield* walk(join(dir, e.name))
    else yield join(dir, e.name)
  }
}

// Everything missing for a stage release, as [text, fix] — empty when it may go out
export function releaseCheckProblems(root, stage) {
  const problems = []
  const file = checkFile(stage)
  const write = `node ~/.claude/config/bmuz/scripts/release-check.mjs ${stage}   (writes ${file} — fill each line, tick it)`
  const path = join(root, file)
  if (!existsSync(path)) problems.push([`no release checklist for ${stage} (${file}) — a ${stage} goes out after devices, a first-time player, the store page and privacy were checked`, write])
  else {
    const have = readChecklist(readFileSync(path, 'utf8'))
    for (const want of linesFor(stage)) {
      const line = have.find(l => l.label.toLowerCase() === want.label.toLowerCase())
      if (!line) problems.push([`release checklist: the "${want.label}" line is missing`, `put it back from ~/.claude/config/bmuz/templates/release-check.md, fill it, tick it`])
      else if (!line.filled) problems.push([`release checklist: "${want.label}" isn't filled in yet`, `replace the <…> with what was done, e.g. "${want.label}: …"`])
      else if (!line.ticked) problems.push([`release checklist: "${want.label}" isn't ticked`, 'tick it (- [x]) once it\'s true — or do it first'])
    }
  }
  if (stageRank(stage) >= 2) {
    const art = standIns(root)
    if (art.length) problems.push([`stand-in art left in a ${stage} (${art.length}):\n${art.slice(0, 12).map(a => `    ${a}`).join('\n')}${art.length > 12 ? `\n    … and ${art.length - 12} more` : ''}`, 'swap in the real art (or, if it IS final, take "stand-in" out of its credits entry / file name)'])
  }
  return problems
}

// Writes the stage's checklist from the template (never over an existing one). → the path, or null if it was there
export function writeChecklist(root, stage) {
  const path = join(root, checkFile(stage))
  if (existsSync(path)) return null
  mkdirSync(dirname(path), { recursive: true })
  const rank = stageRank(stage)
  const lines = readFileSync(TEMPLATE, 'utf8').replace(/^# Release check — STAGE/m, `# Release check — ${stage}`).split('\n')
    .filter(l => { const tag = (l.match(/^\s*- \[ \] \[(beta\+|1\.0)\]/) || [])[1]; return !tag || TAG_RANK[tag] <= rank })
  writeFileSync(path, lines.join('\n'))
  return path
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const stage = (process.argv[2] || '').toLowerCase()
  if (!stage) { console.log('✗ which stage? release-check.mjs <alpha|beta|1.0>'); process.exit(1) }
  const root = process.cwd()
  const made = writeChecklist(root, stage)
  console.log(made ? `✓ wrote ${checkFile(stage)} — fill each <…> line and tick it; release.mjs checks it` : `${checkFile(stage)} is already there — fill and tick what's left`)
  for (const [text, fix] of releaseCheckProblems(root, stage)) console.log(`  • ${text}${fix ? `\n    → ${fix}` : ''}`)
}
