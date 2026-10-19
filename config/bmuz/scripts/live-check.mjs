// Is the release really live? (F80 — /deliver §7, audit D43–D45, D49–D50). Run after `git push --follow-tags`.
//   node ~/.claude/config/bmuz/scripts/live-check.mjs [--url=<new live url>]
// Reads STATE: `Release:` in Key facts and the `Live:` URL. Then, in order:
//   0. `Release: none (library)` / `not set up …` / `… blocked: …` → nothing hosted: says so, records it, exit 0
//   1. a deploy workflow in .github/workflows → waits for its run on this commit (gh; BMUZ_DEPLOY_TIMEOUT, default
//      15 min) — red refuses. No gh → a warning, the page check below still decides
//   2. fetches the page with a cache-buster (?v=<time>), retrying while the host catches up (BMUZ_LIVE_TRIES, default
//      8, every BMUZ_POLL_MS, default 20 s): HTTP 200, no login redirect (= public), and the new version is in the
//      page or one of its scripts (version.json's X.Y.Z)
//   3. `npm run e2e:update` when the project has it (returning players get the new version — offline cache)
//   4. the console: `npm run smoke:live` (LIVE_URL=<url>) when the project has it; otherwise it's Claude's check in
//      Playwright, and this says so
//   5. writes .planning/live-pass (commit · tag · url · time · how the console was checked) — commit it with the
//      STATE update. A new --url replaces STATE's Live: URL (D50).
//   6. merged work branches noted by merge.mjs are deleted on GitHub now that main is there.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { git, run, say, ok, refuse, tail, readJson, args, projectDir, gh, sleep, stateValue, lastTag, deleteMergedRemotes } from './lib.mjs'
import { defaultBranch } from '../hooks/lib.mjs'

const { flags } = args()
const root = git(projectDir(), 'rev-parse', '--show-toplevel')
if (!root) refuse("this folder isn't a git repo")
const stateFile = join(root, '.planning', 'STATE.md')
if (!existsSync(stateFile)) refuse('no .planning/STATE.md here — live-check reads the Live URL and the Release line from it')
let state = readFileSync(stateFile, 'utf8')
const head = git(root, 'rev-parse', 'HEAD')
const tag = lastTag(root) || '(no tag)'
const main = defaultBranch(root)
const record = (lines) => {
  mkdirSync(join(root, '.planning'), { recursive: true })
  writeFileSync(join(root, '.planning', 'live-pass'), `${head}\n${lines.join('\n')}\n`)
}
const tidyBranches = () => { if (git(root, 'remote') && main) for (const line of deleteMergedRemotes(root, main)) say(line) }

// 0. nothing hosted
const release = stateValue(state, 'Release')
if (!release) refuse('STATE Key facts has no `Release:` line, so where this goes isn\'t on record', 'add `Release: <platform> (recipe …)` · `Release: none (library)` · `Release: not set up (declined <date>)` · `Release: <platform> — blocked: <why>`')
if (/^(none|not set up)\b/i.test(release) || /blocked\s*:/i.test(release)) {
  record([`${tag} skipped — Release: ${release}`, new Date().toISOString()])
  tidyBranches()
  ok(`nothing to check live — Release: ${release}. Say plainly it's ${/blocked/i.test(release) ? 'NOT live (blocked)' : /^none/i.test(release) ? 'not hosted (a library — give the repo link)' : 'NOT live anywhere yet'}. (.planning/live-pass records the skip)`)
  process.exit(0)
}

// the Live URL — a new one given replaces STATE's (D50)
const urlFlag = [...flags].find(f => f.startsWith('--url='))
const stateUrl = (state.match(/\bLive:\*{0,2}[ \t]*(https?:\/\/[^\s)>,]+)/) || [])[1]
const url = urlFlag ? urlFlag.slice(6) : stateUrl
if (!url) refuse('STATE has no `Live: https://…` URL', 'add it under "Where we are" (Live: <url> (vX.Y.Z, <stage>)), or run with --url=<url>')
if (stateUrl && url !== stateUrl) {
  state = state.replace(stateUrl, url); writeFileSync(stateFile, state)
  say(`STATE's Live URL updated: ${stateUrl} → ${url} (commit it)`)
} else if (!stateUrl) {
  state = state.replace(/^(## Where we are[^\n]*\n)/m, `$1Live: ${url}\n`); writeFileSync(stateFile, state)
  say(`STATE's Live URL written: ${url} (commit it)`)
}
const version = readJson(join(root, 'version.json'))?.version
if (!version) refuse('no version.json "version" — nothing to look for on the live page')

// 1. the deploy run for this commit
const workflows = join(root, '.github', 'workflows')
const deployFiles = existsSync(workflows) ? (git(root, 'ls-files', '.github/workflows') || '').split('\n').filter(f => /\.ya?ml$/.test(f) && /deploy-pages|gh-pages|wrangler|deploy/i.test(readFileSync(join(root, f), 'utf8'))) : []
if (deployFiles.length) {
  if (git(root, 'remote') && !(git(root, 'branch', '-r', '--contains', head) || '').trim()) refuse(`${head.slice(0, 7)} isn't on GitHub yet, so no deploy started`, 'smoke pass → `git push --follow-tags`, then run this again')
  for (const file of deployFiles) {
    const name = file.split('/').pop()
    const until = Date.now() + Number(process.env.BMUZ_DEPLOY_TIMEOUT || 15 * 60_000)
    let said = false
    while (true) {
      const asked = gh(['run', 'list', '--workflow', name, '--commit', head, '--limit', '1', '--json', 'status,conclusion,url'], { cwd: root })
      let runs = null
      try { runs = JSON.parse(asked.out) } catch { /* gh failed */ }
      if (asked.code !== 0 || !Array.isArray(runs)) { say(`⚠ couldn't ask GitHub about the ${name} run (is gh installed and logged in?) — the page check decides\n${tail(asked.out, 2)}`); break }
      const latest = runs[0]
      if (latest?.status === 'completed') {
        if (latest.conclusion !== 'success') refuse(`the deploy run (${name}) is red (${latest.conclusion}) — the new version didn't go out: ${latest.url}`, 'open the run, fix it, push, then run this again')
        ok(`deploy run ${name} finished green: ${latest.url}`)
        break
      }
      if (Date.now() > until) refuse(`the deploy run (${name}) ${latest ? `is still going after the wait: ${latest.url}` : 'never started for this commit'}`, latest ? 'wait for it (`gh run watch`), then run this again' : 'does this workflow deploy on a push to this branch? Check its `on:` lines')
      if (!said) { say(`… waiting for the deploy run (${name})`); said = true }
      sleep(Number(process.env.BMUZ_POLL_MS || 20_000))
    }
  }
}

// 2. the page: public, and the new version is there
const escaped = version.replace(/\./g, '\\.')
const hasVersion = (text) => new RegExp(`(?<![\\d.])v?${escaped}(?!\\d)`).test(text)
async function look() {
  const busted = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`
  let res
  try { res = await fetch(busted, { redirect: 'follow', headers: { 'cache-control': 'no-cache' } }) } catch (e) { return { problem: `the page didn't answer (${e.cause?.code || e.message})` } }
  if (res.status === 401 || res.status === 403) return { problem: `the page asks for a login (HTTP ${res.status}) — it isn't public`, fatal: true }
  if (res.redirected && /login|signin|sign_in|sign-in|auth|sso|accounts\./i.test(res.url)) return { problem: `the page sends visitors to a login (${res.url}) — it isn't public`, fatal: true }
  if (res.status !== 200) return { problem: `the page answers HTTP ${res.status}` }
  const html = await res.text()
  if (hasVersion(html)) return { found: 'the page' }
  // a Vite game shows its version from the JS bundle, not the HTML (glyphtender recipe gotcha, 2026-10-04)
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => new URL(m[1], res.url).href).filter(s => new URL(s).host === new URL(res.url).host).slice(0, 6)
  for (const src of scripts) {
    try { const js = await fetch(src, { headers: { 'cache-control': 'no-cache' } }); if (js.ok && hasVersion(await js.text())) return { found: src.split('/').pop() } } catch { /* next one */ }
  }
  return { problem: `the page loads, but ${version} isn't in it or its scripts yet (still the old version?)` }
}
const tries = Number(process.env.BMUZ_LIVE_TRIES || 8)
let seen
for (let n = 1; n <= tries; n++) {
  seen = await look()
  if (seen.found || seen.fatal) break
  if (n < tries) { say(`… ${seen.problem} — trying again (${n}/${tries})`); sleep(Number(process.env.BMUZ_POLL_MS || 20_000)) }
}
if (!seen.found) refuse(`${url}: ${seen.problem}`, seen.fatal ? 'make the site public (GitHub Pages needs a public repo; check the host\'s visibility settings), then run this again' : 'is the deploy finished? Hard-refresh / check the host, then run this again')
ok(`${url} is public and shows ${version} (found in ${seen.found})`)

// 3. returning players get the new version
const scripts = readJson(join(root, 'package.json'))?.scripts || {}
if (scripts['e2e:update']) {
  const update = run('npm', ['run', 'e2e:update'], { cwd: root, timeout: 600_000 })
  if (update.code !== 0) refuse(`e2e:update fails — a returning player may still get the old version:\n${tail(update.out, 8)}`, 'fix the offline-cache update (github-pages recipe, setup step 5), release again')
  ok('e2e:update green — returning players get the new version')
}

// 4. the console
let consoleCheck
const liveSmoke = ['smoke:live', 'e2e:live'].find(s => scripts[s])
if (liveSmoke) {
  const smoke = spawnLive(liveSmoke)
  if (smoke.code !== 0) refuse(`npm run ${liveSmoke} fails on the live site:\n${tail(smoke.out, 8)}`, 'fix it (a live-only error?), release again')
  ok(`npm run ${liveSmoke} green on the live site`)
  consoleCheck = `console: npm run ${liveSmoke} passed`
} else {
  consoleCheck = 'console: Claude\'s check (Playwright)'
  say(`Console: this project has no smoke:live script, so the console check is Claude's — open ${url} in Playwright: 0 console errors, no failed requests (list them by URL), the new version showing. (Add a \`smoke:live\` script reading LIVE_URL to make it automatic.)`)
}
function spawnLive(name) {
  process.env.LIVE_URL = url
  return run('npm', ['run', name], { cwd: root, timeout: 600_000 })
}

// 5. on record
record([`${tag} ${url}`, new Date().toISOString(), consoleCheck])
ok(`live pass recorded for ${head.slice(0, 7)} in .planning/live-pass — commit it with STATE`)
tidyBranches()
