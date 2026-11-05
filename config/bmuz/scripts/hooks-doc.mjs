// HOOKS.md's rule table, made from the rule files (F184) — so the doc can't drift from the code again (audit 2026-11:
// the hand-kept table already lagged it). Each rule file says id · name · what · why; each rules/<hook>/_hook.mjs says
// when it runs. The table goes between the two marker lines in HOOKS.md; everything else there stays hand-written.
//   node ~/.claude/config/bmuz/scripts/hooks-doc.mjs           rewrite the table
//   node ~/.claude/config/bmuz/scripts/hooks-doc.mjs --check   exit 1 if HOOKS.md isn't up to date (tests, /checkup)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadHook, RULES_DIR } from '../hooks/runner.mjs'

const DOC = join(import.meta.dirname, '..', 'HOOKS.md')
export const START = '<!-- rule table: made by scripts/hooks-doc.mjs from hooks/rules/ — edit the rule files, not this table -->'
export const END = '<!-- end of rule table -->'
const MODE = { block: '', warn: ' (warns, never refuses)', action: ' (does it itself)', log: ' (only logged — says nothing yet)' }
const cell = (text) => String(text || '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ')

export async function ruleTable() {
  const rows = ['| Rule | When | What it does | Why |', '|---|---|---|---|']
  for (const hook of readdirSync(RULES_DIR).sort()) {
    const { spec, rules, broken } = await loadHook(hook)
    for (const id of spec.order) {
      const rule = rules.get(id)
      if (!rule) { rows.push(`| ${id} ① | ${cell(spec.when)} (${hook}) | ⚠ its file doesn't load: ${cell(broken.get(id)?.error?.message)} | |`); continue }
      const off = rule.on === false ? ' **(off)**' : ''
      rows.push(`| ${id} ① \`${rule.name}\`${off} | ${cell(spec.when)} (${hook}) | ${cell(rule.what)}${MODE[rule.mode] ?? ''} | ${cell(rule.why)} |`)
    }
  }
  return rows.join('\n')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const text = readFileSync(DOC, 'utf8')
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const start = text.indexOf(START)
  const end = text.indexOf(END)
  if (start < 0 || end < start) { console.log(`HOOKS.md has no rule-table markers — put these two lines where the table goes:\n${START}\n${END}`); process.exit(1) }
  const table = (await ruleTable()).split('\n').join(eol)
  const next = `${text.slice(0, start)}${START}${eol}${table}${eol}${text.slice(end)}`
  if (process.argv.includes('--check')) {
    if (next !== text) { console.log('HOOKS.md\'s rule table is out of date — run node ~/.claude/config/bmuz/scripts/hooks-doc.mjs'); process.exit(1) }
    console.log('HOOKS.md rule table up to date')
  } else {
    if (next !== text) writeFileSync(DOC, next)
    console.log(next !== text ? 'HOOKS.md rule table rewritten' : 'HOOKS.md rule table already up to date')
  }
}
