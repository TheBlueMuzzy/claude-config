// Run the BMUZ skill tests (F71) — every `~/.claude/skills/<skill>/evals/` suite, or the ones named.
//   node ~/.claude/config/bmuz/scripts/test-skills.mjs --muzzy-said-yes [skill …] [--case <name>] [--max-cost-usd 5]
// --muzzy-said-yes is required: without it the script refuses before spending anything. Pass it ONLY after Muzzy said
// yes in this conversation (/checkup asks). A helper ran the full suite unasked on 2026-10-19 ($1.39); written rules
// weren't enough, so the script enforces it.
// Each case is a real Claude session in a throwaway copy of the practice game (config/bmuz/evals/fixture-game.sh),
// scored by its graders — it costs plan usage (~$0.20 a case). Muzzy's rule (2026-10-19, "A"): run only after skill
// edits or a model update, and only when he says yes (/checkup offers it).
// On Windows the cases run inside WSL2's Ubuntu (Claude may only use the shell in a test there); elsewhere directly.
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { run, say, ok, refuse, args } from './lib.mjs'

const SKILLS = join(homedir(), '.claude', 'skills')
const { words, flags } = args()
if (!flags.has('--muzzy-said-yes')) {
  refuse('skill tests cost plan usage (~$0.20 a case), so they only run when Muzzy has said yes',
    'ask Muzzy first (/checkup offers it, with the cost); after his yes, run again with --muzzy-said-yes')
}
const argv = process.argv.slice(2)
const value = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback }
const caseFilter = value('--case')
const cap = Number(value('--max-cost-usd', '5'))
const wanted = words.filter(w => w !== caseFilter && w !== String(cap))

const suites = readdirSync(SKILLS).filter(s => existsSync(join(SKILLS, s, 'evals')) && (!wanted.length || wanted.includes(s)))
if (!suites.length) refuse(`no skill tests found${wanted.length ? ` for ${wanted.join(', ')}` : ''}`, `cases live in ${join(SKILLS, '<skill>', 'evals', '<case>')}`)

const windows = process.platform === 'win32'
if (windows && run('wsl.exe', ['-d', 'Ubuntu', '--', 'bash', '-lc', 'command -v claude']).code !== 0) {
  refuse("WSL2's Ubuntu has no Claude Code — skill tests need it on Windows", 'see the F71 notes: install Ubuntu (wsl --install -d Ubuntu), Node, Claude Code, then log in once')
}
const toWsl = (p) => p.replace(/^([A-Za-z]):\\/, (_, d) => `/mnt/${d.toLowerCase()}/`).split('\\').join('/')

const outDir = join(tmpdir(), `bmuz-skill-tests-${Date.now()}`)
mkdirSync(outDir, { recursive: true })
const rows = []
let total = 0
for (const skill of suites) {
  const dir = join(SKILLS, skill)
  const json = join(outDir, `${skill}.json`)
  const evalArgs = ['plugin', 'eval', windows ? toWsl(dir) : dir, '--runs', '1', '--ablation', 'none', '--scaffold', '--trust-plugin',
    '--allow-tools', 'Bash', 'Write', 'Edit', '--max-cost-usd', String(Math.max(0.5, cap - total)), '--no-publish', '--json', windows ? toWsl(json) : json,
    ...(caseFilter ? ['--case', caseFilter] : [])]
  say(`… ${skill}`)
  const result = windows
    ? run('wsl.exe', ['-d', 'Ubuntu', '--', 'bash', '-lc', `claude ${evalArgs.map(a => `'${a}'`).join(' ')}`], { timeout: 3_600_000 })
    : run('claude', evalArgs, { timeout: 3_600_000 })
  let report = null
  try { report = JSON.parse(readFileSync(json, 'utf8')) } catch { /* see the output below */ }
  if (!report) { rows.push({ skill, name: '(did not run)', score: 0, cost: 0, notes: result.out.trim().split('\n').slice(-3).join(' / ') }); continue }
  for (const c of report.cases ?? []) {
    const runs = c.arms?.with ?? []
    const cost = runs.reduce((sum, r) => sum + (r.costUsd ?? 0) + (r.judgeCostUsd ?? 0), 0)
    total += cost
    const failedGraders = [...new Set(runs.flatMap(r => (r.graders ?? []).filter(g => g.scored !== false && !g.passed).map(g => g.name)))]
    rows.push({ skill, name: c.name, score: c.score ?? (runs[0]?.score ?? 0), cost, notes: failedGraders.join(' · ') })
  }
}

say('')
for (const r of rows) say(`${r.score >= 1 ? '✓' : '✗'} ${`${r.skill} / ${r.name}`.padEnd(42)} ${r.score.toFixed(2)}  $${r.cost.toFixed(2)}${r.notes ? `  — ${r.notes}` : ''}`)
const failed = rows.filter(r => r.score < 1)
say(`\n${rows.length} case(s) · $${total.toFixed(2)} · reports: each skill's evals/results/ folder`)
// /checkup reads this to know when the tests are out of date (skills changed since, or a new Claude Code version)
if (!wanted.length && !caseFilter) {
  const version = run('claude', ['--version']).out.trim().split(/\s/)[0]
  writeFileSync(join(homedir(), '.claude', 'config', 'bmuz', 'last-skill-tests.json'), `${JSON.stringify({
    date: new Date().toISOString(), claudeCode: version, cases: rows.length, passed: rows.length - failed.length, costUsd: Number(total.toFixed(2)),
    failed: failed.map(r => `${r.skill}/${r.name}`),
  }, null, 2)}\n`)
}
if (failed.length) refuse(`${failed.length} case(s) below 1.00 — read the failed checks above; the skill (or the case) needs a fix`)
ok('every skill test passed')
