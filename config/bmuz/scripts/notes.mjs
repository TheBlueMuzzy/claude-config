// Patch notes (F84) — ONE notes file per release, `.planning/archive/releases/vX.Y.Z.md`; everything else is made
// from it: the CHANGELOG.md entry and the itch.io devlog text. release.mjs drafts it (--draft-notes), refuses to
// release while it's missing / a draft / without highlights / full of dev talk, and writes the rest on release.
// Research: framework .planning/research/patch-notes-and-dependencies.md. Voice: neutral, the player's side —
// "Fixed the crash when…", never "We…" (Muzzy, 2026-10-19).
import { join } from 'node:path'

export const GAME_SECTIONS = ['Highlights', 'New', 'Changed', 'Balance', 'Fixed', 'Known issues']
export const LIBRARY_SECTIONS = ['Highlights', 'Breaking', 'New', 'Fixed']
export const notesFile = (version) => `.planning/archive/releases/v${version}.md`
export const itchFile = (version) => `.planning/archive/releases/v${version}-itch.txt`
export const notesPath = (root, version) => join(root, notesFile(version))

// What players don't follow in a game's notes: [pattern, what it is]
const DEV_TALK = [
  [/\b[FB]\d{2,3}[a-z]?\b/, 'a feature or bug number'],
  [/\b(?:src|scripts|content|public|tests?|e2e|party|kit)\/[\w./-]+/, 'a file path'],
  [/\b[\w-]+\.(?:tsx?|jsx?|mjs|cjs|json|css|html)\b/, 'a file name'],
  [/\bdev ?kit\b/i, '"Dev Kit"'],
  [/\bcheck:/i, 'a check name'],
  [/\bcommit(?:s|ted)?\b/i, '"commit"'],
]

// The notes as { draft, sections: [{ name, lines }] }. <!-- hints --> are dropped, so an untouched draft section is empty.
export function parseNotes(text) {
  const lines = (text || '').replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, '').split('\n')
  const draft = lines.some(l => /^\s*DRAFT\b/.test(l))
  const sections = []
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/)
    if (heading) sections.push({ name: heading[1], lines: [] })
    else if (sections.length && !/^\s*DRAFT\b/.test(line)) sections.at(-1).lines.push(line.replace(/\s+$/, ''))
  }
  for (const s of sections) { // drop blank lines at either end
    while (s.lines.length && !s.lines[0].trim()) s.lines.shift()
    while (s.lines.length && !s.lines.at(-1).trim()) s.lines.pop()
  }
  return { draft, sections: sections.filter(s => s.lines.length) }
}

// Why these notes can't go out yet: [[text, fix]] (empty = fine). `file` names the file in the messages.
export function notesProblems(text, { game, file, kind = 'update' }) {
  if (text === null) return [[`no patch notes for this release (${file})`, `node ~/.claude/config/bmuz/scripts/release.mjs ${kind} --draft-notes — writes a draft from the commits; edit it with Muzzy, then release`]]
  const notes = parseNotes(text)
  const problems = []
  if (notes.draft) problems.push([`the patch notes are still a draft (${file} has its DRAFT line)`, 'edit them into player\'s-eye lines with Muzzy, then delete the DRAFT line'])
  if (!notes.sections.some(s => /^highlights$/i.test(s.name))) problems.push([`the patch notes have no Highlights (${file})`, 'write 1–3 sentences under "## Highlights": what this release brings, in the player\'s words'])
  if (game) {
    const found = []
    text.replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' ')).split('\n').forEach((line, n) => {
      if (/^\s*DRAFT\b/.test(line)) return
      const what = DEV_TALK.filter(([re]) => re.test(line)).map(([, w]) => w)
      if (what.length) found.push(`line ${n + 1}: "${line.trim().slice(0, 70)}" (${what.join(', ')})`)
    })
    if (found.length) problems.push([`the patch notes have dev talk players won't follow (${file}):\n    ${found.slice(0, 6).join('\n    ')}${found.length > 6 ? `\n    … and ${found.length - 6} more` : ''}`, 'say what the player notices instead: "Fixed the crash when a save is loaded" — no feature or bug numbers, file names, "Dev Kit", checks or commits'])
  }
  return problems
}

// The draft, from the commits since the last tag: [{ subject }]. Commits naming a feature (F12: …) are grouped into one
// line per feature; "fix" / bug-number commits go under Fixed; the rest under New. Each line is still dev talk on
// purpose — the release refuses it until it's rewritten in the player's words.
export function draftNotes({ version, commits, game }) {
  const groups = new Map()
  const fixed = []
  const other = []
  for (const { subject } of commits) {
    const id = (subject.match(/^\s*(F\d+[a-z]?)\b/) || [])[1]
    if (id) { if (!groups.has(id)) groups.set(id, []); groups.get(id).push(subject.replace(/^\s*F\d+[a-z]?(\s*\+\s*F\d+[a-z]?)*\s*:?\s*/, '')) }
    else if (/^fix|\bB\d{3}\b|\bbug\b/i.test(subject)) fixed.push(subject)
    else other.push(subject)
  }
  const featureLines = [...groups].map(([id, subjects]) => `- ${id}: ${subjects.slice(0, 4).join(' · ')}${subjects.length > 4 ? ` · (+${subjects.length - 4} more)` : ''}`)
  const fill = { New: [...featureLines, ...other.map(s => `- ${s}`)], Fixed: fixed.map(s => `- ${s}`) }
  const hints = {
    Highlights: '<!-- 1–3 sentences: what this release brings, in the player\'s words -->',
    Balance: '<!-- old → new numbers: "Bombs per round: 3 → 2" -->',
    'Known issues': '<!-- each with a status: "fix coming" or "workaround: …" -->',
    Breaking: '<!-- each change a game must make to upgrade, as steps ("rename X to Y in …") — or delete this section -->',
  }
  const sections = (game ? GAME_SECTIONS : LIBRARY_SECTIONS).map(name => [`## ${name}`, ...(hints[name] ? [hints[name]] : []), ...(fill[name] || []), ''].join('\n'))
  return ['DRAFT — edit, then delete this line', `# v${version}`,
    `<!-- Neutral voice, the player's side: "Fixed the crash when…", never "We…". ${game ? 'No feature or bug numbers, file names, "Dev Kit", checks or commits. ' : 'For the games that use it: what changed and what they must do. '}Empty sections are left out. -->`, '',
    ...sections].join('\n')
}

// One CHANGELOG.md entry (Keep a Changelog style): "## vX.Y.Z — date", the highlights, then each section.
export function changelogEntry(text, version, date) {
  const { sections } = parseNotes(text)
  const out = [`## v${version} — ${date}`, '']
  for (const s of sections) {
    if (!/^highlights$/i.test(s.name)) out.push(`### ${s.name}`)
    out.push(...s.lines, '')
  }
  return out.join('\n')
}

// CHANGELOG.md with the new entry on top (made with a one-line header the first time).
export function addToChangelog(old, entry) {
  if (!old || !old.trim()) return `# Changelog\n\n${entry}`
  const lines = old.replace(/\r\n/g, '\n').split('\n')
  const first = lines.findIndex(l => /^## /.test(l))
  if (first < 0) return `${old.replace(/\s+$/, '')}\n\n${entry}`
  return [...lines.slice(0, first), ...entry.split('\n'), ...lines.slice(first)].join('\n')
}

// Plain formatted text for itch.io's devlog editor (rich text — Markdown isn't confirmed, so no # or **).
export function itchText(text, version, date) {
  const { sections } = parseNotes(text)
  const plain = (l) => l.replace(/^\s*[-*]\s+/, '• ').replace(/\*\*|__|`/g, '')
  const out = [`v${version} — ${date}`, '']
  for (const s of sections) {
    if (!/^highlights$/i.test(s.name)) out.push(s.name.toUpperCase())
    out.push(...s.lines.map(plain), '')
  }
  return out.join('\n')
}
