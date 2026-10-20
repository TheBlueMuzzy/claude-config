// Dependency + licence check (F85) — the packages players actually get, checked before every release.
//   node ~/.claude/config/bmuz/scripts/deps-check.mjs <project-folder> [--json] [--notices]
// Production packages only (dev tools never ship). Refuses, naming the package and who pulls it in:
//   · a licence that would force the game's code open (GPL / AGPL / LGPL) or gives no right to use it (none, UNLICENSED)
//   · a high or critical security problem npm knows about (`npm audit --omit=dev --audit-level=high`)
// Can't reach npm (offline) → a warning, never a refusal. A licence that's neither allowed nor banned → a warning.
// --notices writes public/third-party-notices.txt: every shipped package's licence text (+ NOTICE), which MIT, BSD,
// ISC and Apache ask to travel with the game — minified code strips it, so the Credits screen links to this file.
// release.mjs runs the same check as a gate (and writes the notices for games) — research: framework
// .planning/research/patch-notes-and-dependencies.md. BMUZ_NPM_AUDIT = tests' stand-in for `npm audit` (a .mjs file).
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { run, say, ok, readJson, args, projectDir, tail } from './lib.mjs'

// Licences fine to ship in a closed game (keep the licence text — the notices file does that).
export const ALLOWED = ['MIT', 'MIT-0', 'ISC', 'BSD-2-CLAUSE', 'BSD-3-CLAUSE', 'APACHE-2.0', '0BSD', 'MPL-2.0', 'CC0-1.0', 'UNLICENSE']
// Old or loose spellings packages use for the same licences
const ALIASES = { 'APACHE 2.0': 'APACHE-2.0', 'APACHE2': 'APACHE-2.0', 'APACHE-2': 'APACHE-2.0', 'APACHE LICENSE 2.0': 'APACHE-2.0', 'APACHE LICENSE, VERSION 2.0': 'APACHE-2.0',
  'BSD-2': 'BSD-2-CLAUSE', 'BSD-3': 'BSD-3-CLAUSE', 'NEW BSD': 'BSD-3-CLAUSE', 'SIMPLIFIED BSD': 'BSD-2-CLAUSE', 'MIT LICENSE': 'MIT', 'THE MIT LICENSE': 'MIT', 'X11': 'MIT', 'MPL 2.0': 'MPL-2.0', 'CC0': 'CC0-1.0' }

// The licence a package says it has: "MIT", "(MIT OR Apache-2.0)", { type: "MIT" }, or an old licenses: [{ type }] list.
export function licenceOf(pkg) {
  const one = (l) => (typeof l === 'string' ? l : l?.type || '')
  if (pkg?.license) return one(pkg.license).trim()
  if (Array.isArray(pkg?.licenses) && pkg.licenses.length) return pkg.licenses.map(one).filter(Boolean).join(' OR ')
  return ''
}

// Is this licence fine to ship? SPDX expressions: "A OR B" is fine when either side is, "A AND B" only when both are.
// Returns { verdict: 'ok' | 'refuse' | 'warn', why } — why in plain words.
export function licenceVerdict(licence) {
  const text = (licence || '').trim()
  if (!text) return { verdict: 'refuse', why: 'has no licence at all — that means "all rights reserved", so the game may not ship it' }
  if (/^UNLICEN[CS]ED$/i.test(text)) return { verdict: 'refuse', why: 'is marked UNLICENSED (private, all rights reserved) — the game may not ship it' }
  if (allowed(text)) return { verdict: 'ok', why: '' }
  if (/\b(A|L)?GPL\b|\b(A|L)?GPL-|GNU (AFFERO |LESSER )?GENERAL PUBLIC/i.test(text)) return { verdict: 'refuse', why: `is ${text} — a "copyleft" licence that would force the whole game's code to be given away (or, for LGPL, be swappable), so a closed game can't bundle it` }
  if (/^SEE LICEN[CS]E IN/i.test(text)) return { verdict: 'warn', why: `has its own licence ("${text}") — read it before shipping` }
  return { verdict: 'warn', why: `is ${text}, which isn't on the known-good list — read it before shipping (allowed: MIT, ISC, BSD, Apache-2.0, 0BSD, MPL-2.0, CC0, Unlicense)` }
}
function allowed(text) {
  const alias = ALIASES[text.toUpperCase()]
  if (alias) return ALLOWED.includes(alias)
  const tokens = text.replace(/[()]/g, (m) => ` ${m} `).trim().split(/\s+/)
  let i = 0
  const atom = () => {
    const t = tokens[i++] || ''
    if (t === '(') { const v = either(); i++; return v } // skip the ")"
    if (/^with$/i.test(tokens[i] || '')) i += 2 // "GPL-2.0 WITH Classpath-exception-2.0" is judged by its licence
    const id = t.replace(/\+$/, '').toUpperCase()
    return ALLOWED.includes(ALIASES[id] || id)
  }
  const both = () => { let v = atom(); while (/^and$/i.test(tokens[i] || '')) { i++; const r = atom(); v = v && r } return v }
  const either = () => { let v = both(); while (/^or$/i.test(tokens[i] || '')) { i++; const r = both(); v = v || r } return v }
  return either()
}

// No licence in package.json, but a LICENSE file → which well-known licence its text is (Roll Better's webgl-constants
// has only the file). Returns '' when the text isn't one it knows.
const KNOWN_TEXTS = [
  [/GNU (AFFERO |LESSER )?GENERAL PUBLIC LICENSE/i, (m) => (m[1] ? (/AFFERO/i.test(m[1]) ? 'AGPL' : 'LGPL') : 'GPL')],
  [/Apache License,?\s+Version 2\.0/i, () => 'Apache-2.0'],
  [/Mozilla Public License,?\s+(version\s+)?2\.0/i, () => 'MPL-2.0'],
  [/Permission is hereby granted, free of charge/i, () => 'MIT'],
  [/Permission to use, copy, modify, and\/or distribute this software for any purpose/i, () => 'ISC'],
  [/Redistribution and use in source and binary forms[\s\S]*Neither the name/i, () => 'BSD-3-Clause'],
  [/Redistribution and use in source and binary forms/i, () => 'BSD-2-Clause'],
  [/This is free and unencumbered software released into the public domain/i, () => 'Unlicense'],
]
function licenceFromFile(dir) {
  const text = licenceFiles(dir).filter(([name]) => !/^notice/i.test(name)).map(([, t]) => t).join('\n')
  for (const [re, name] of KNOWN_TEXTS) { const m = text.match(re); if (m) return name(m) }
  return ''
}

// The licence + NOTICE files a package carries (LICENSE, LICENSE.md, LICENCE-MIT, COPYING, NOTICE…), as [name, text].
function licenceFiles(dir) {
  let names = []
  try { names = readdirSync(dir).filter(f => /^(licen[cs]e|copying|notice)([.\-_]|$)/i.test(f)).sort() } catch { return [] }
  return names.filter(f => { try { return statSync(join(dir, f)).isFile() } catch { return false } })
    .map(f => [f, readFileSync(join(dir, f), 'utf8').replace(/\r\n/g, '\n').trim()])
}

// The whole check. Returns { name, skipped, packages: [{ name, version, licence, verdict, why, by, dir }], refusals: [[text, fix]],
// warnings: [text], audit: { checked, counts, why } } — nothing is printed or written here (release.mjs uses it too).
export function checkDeps(dir) {
  const pkg = readJson(join(dir, 'package.json'))
  const result = { name: pkg?.name || 'this project', skipped: '', packages: [], refusals: [], warnings: [], audit: { checked: false, counts: {}, why: '' } }
  if (!pkg) { result.skipped = 'no package.json here'; return result }
  const wanted = Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies })
  if (!wanted.length) { result.skipped = 'no production packages (only dev tools, which never ship)'; return result }
  if (!existsSync(join(dir, 'node_modules'))) {
    result.refusals.push([`${result.name}'s packages aren't installed here (no node_modules), so their licences can't be read`, '`npm ci` in the project, then run this again'])
    return result
  }

  // 1. every package players get, with who pulls it in (`npm ls` reads node_modules — no network)
  const listed = run('npm', ['ls', '--omit=dev', '--all', '--long', '--json'], { cwd: dir, timeout: 120_000 })
  let tree = null
  try { tree = JSON.parse(listed.stdout) } catch { /* not JSON = npm failed */ }
  if (!tree) {
    result.refusals.push([`couldn't list the packages (npm ls failed):\n${tail(listed.out, 5)}`, '`npm ci` in the project, then run this again'])
    return result
  }
  const seen = new Map()
  const lockPackages = readJson(join(dir, 'package-lock.json'))?.packages || {} // tells which installed packages are dev tools
  const walk = (node, chain) => {
    for (const [name, dep] of Object.entries(node.dependencies || {})) {
      if (dep.missing) { if (!dep.optional && !dep.peerMissing) result.warnings.push(`${name} is wanted but not installed — run \`npm ci\``); continue }
      if (!dep.path || dep.deduped) continue // the same package listed again further down
      // "extraneous": installed, but nothing in package.json needs it. A dev tool's optional part (Glyphtender's
      // sharp-wasm32 showed up at the top level this way) is skipped quietly; anything else may be an
      // `npm install --no-save` package the game imports, which would ship unchecked → a warning (review fix)
      if (dep.extraneous) {
        const locked = lockPackages[relative(dir, dep.path).split('\\').join('/')]
        if (!locked?.dev && !locked?.devOptional) result.warnings.push(`${name}@${dep.version} is installed but package.json doesn't list it (an \`npm install --no-save\`?) — if the game uses it, it ships unchecked: add it to package.json, or \`npm ci\` to clear it`)
        continue
      }
      const key = `${name}@${dep.version}`
      if (!seen.has(key)) {
        const own = readJson(join(dep.path, 'package.json')) || dep
        const said = licenceOf(own)
        const fromFile = said ? '' : licenceFromFile(dep.path)
        const licence = said || fromFile
        const verdict = licenceVerdict(licence)
        if (fromFile) verdict.why = verdict.why && `${verdict.why} (read from its LICENSE file — package.json names none)`
        // a package the game asks for itself is "added directly", even when npm lists it first under another one
        seen.set(key, { name, version: dep.version, licence: fromFile ? `${fromFile} (LICENSE file)` : licence, ...verdict, by: wanted.includes(name) ? [] : chain, dir: dep.path, homepage: own.homepage || '' })
      }
      walk(dep, [...chain, name])
    }
  }
  walk(tree, [])
  result.packages = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
  const who = (p) => (p.by.length ? `pulled in by ${p.by.join(' → ')}` : 'added directly in package.json')
  for (const p of result.packages) {
    if (p.verdict === 'refuse') result.refusals.push([`${p.name}@${p.version} ${p.why} (${who(p)})`, p.by.length ? `replace ${p.by[0]} with a package that doesn't need it, or ask Muzzy (release override --deps-risk-ok)` : `swap ${p.name} for an MIT / BSD / Apache alternative, or ask Muzzy (release override --deps-risk-ok)`])
    else if (p.verdict === 'warn') result.warnings.push(`${p.name}@${p.version} ${p.why} (${who(p)})`)
  }

  // 2. known security problems in those packages (npm's advisory list — needs the network)
  const audit = process.env.BMUZ_NPM_AUDIT
    ? run(process.execPath, [process.env.BMUZ_NPM_AUDIT], { cwd: dir })
    : run('npm', ['audit', '--omit=dev', '--audit-level=high', '--json'], { cwd: dir, timeout: 120_000 })
  let report = null
  try { report = JSON.parse(audit.stdout) } catch { /* not JSON */ }
  if (!report || report.error) {
    const why = report?.error?.summary || report?.error?.code || tail(audit.out, 2).trim() || 'no answer'
    result.audit.why = `couldn't reach npm's security list (offline? ${why.split('\n')[0].slice(0, 120)}) — not checked this time`
    result.warnings.push(`security: ${result.audit.why}`)
  } else {
    result.audit.checked = true
    result.audit.counts = report.metadata?.vulnerabilities || {}
    for (const v of Object.values(report.vulnerabilities || {})) {
      if (!['high', 'critical'].includes(v.severity)) continue
      const advisories = (v.via || []).filter(x => typeof x === 'object').map(x => x.title).filter(Boolean)
      const through = (v.via || []).filter(x => typeof x === 'string')
      const what = advisories.length ? advisories.slice(0, 2).join('; ') : `through ${through.join(', ')}`
      const fix = v.fixAvailable === false ? `no fixed version yet — swap ${v.name} out, or ask Muzzy (release override --deps-risk-ok)`
        : typeof v.fixAvailable === 'object' ? `update ${v.fixAvailable.name} to ${v.fixAvailable.version}${v.fixAvailable.isSemVerMajor ? ' (a big version jump — test the game after)' : ''}, then npm ci + the checks`
        : '`npm audit fix --omit=dev`, then the checks'
      result.refusals.push([`${v.name} has a ${v.severity} security problem: ${what}`, fix])
    }
  }
  return result
}

// public/third-party-notices.txt: every shipped package's licence text. No date in it, so it only changes when the
// packages do.
export function noticesText(result) {
  const line = '-'.repeat(72)
  const head = [`Third-party software in ${result.name}`, '',
    `${result.name} includes the open-source packages below. Their licences ask for these notices to travel with it.`,
    'Written by deps-check.mjs at each release — not edited by hand.', '']
  if (!result.packages.length) return [...head, '(no third-party packages)', ''].join('\n')
  const blocks = result.packages.map(p => {
    const files = licenceFiles(p.dir)
    return [line, `${p.name}@${p.version} — ${p.licence || 'no licence given'}`, ...(p.homepage ? [p.homepage] : []), '',
      ...(files.length ? files.map(([name, text]) => `${files.length > 1 ? `[${name}]\n` : ''}${text}\n`) : [`(the package carries no licence file — its licence is ${p.licence || 'not given'})\n`])].join('\n')
  })
  return [...head, ...blocks, ''].join('\n')
}

// How the check reads in plain words (the CLI and release.mjs both print this).
export function summaryLines(result) {
  if (result.skipped) return [`dependencies: nothing to check — ${result.skipped}`]
  const lines = []
  const counts = {}
  for (const p of result.packages) if (p.verdict === 'ok') counts[p.licence] = (counts[p.licence] || 0) + 1
  const mix = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([l, n]) => `${l} ${n}`).join(', ')
  const fine = result.packages.filter(p => p.verdict === 'ok').length
  if (result.packages.length) lines.push(`${fine === result.packages.length ? '✓' : '⚠'} licences: ${fine} of ${result.packages.length} packages players get are fine to ship${mix ? ` (${mix})` : ''}`)
  if (result.audit.checked) {
    const c = result.audit.counts
    const high = (c.high || 0) + (c.critical || 0)
    const minor = (c.moderate || 0) + (c.low || 0)
    lines.push(`${high ? '✗' : '✓'} security: ${high ? `${high} high or critical problem${high > 1 ? 's' : ''}` : 'no high or critical problems'} in them (npm's list)${minor ? ` · ${minor} moderate/low — not blocking` : ''}`)
  }
  return lines
}

// --- the command line ----------------------------------------------------------------------------------------------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { words, flags } = args()
  const dir = projectDir(words[0])
  const result = checkDeps(dir)
  if (flags.has('--json')) {
    console.log(JSON.stringify({ ...result, packages: result.packages.map(({ dir: _d, ...p }) => p) }, null, 2))
    process.exit(result.refusals.length ? 1 : 0)
  }
  say(`Dependencies of ${result.name} — the packages players get (production only): ${result.packages.length}`)
  for (const l of summaryLines(result)) say(l)
  for (const w of result.warnings) say(`⚠ ${w}`)
  for (const [text, fix] of result.refusals) say(`✗ ${text}${fix ? `\n  → ${fix}` : ''}`)
  if (flags.has('--notices') && !result.skipped && !result.refusals.some(([t]) => /aren't installed|couldn't list/.test(t))) {
    mkdirSync(join(dir, 'public'), { recursive: true })
    writeFileSync(join(dir, 'public', 'third-party-notices.txt'), noticesText(result))
    ok(`wrote public/third-party-notices.txt (${result.packages.length} packages) — the Credits screen links to it`)
  }
  process.exit(result.refusals.length ? 1 : 0)
}
