// CRASH MAPS FOR A RELEASE (F174 — Crash maps by the release script). Shared by release.mjs and live-check.mjs.
// A game with the framework's crashes module turns a live player's error back into its source lines with the maps
// under releases/<version>/maps/. Those only fit the live code when they come from a build made with the SAME
// settings GitHub's deploy uses (VITE_PARTY_HOST… — Glyphtender v0.11.2: a plain local build's main-*.js had another
// name). So after the release commit, release.mjs builds once with the deploy workflow's public env plus
// CRASHES_MAPS=release (crashes 0.3.0+: only that build files maps under releases/), and commits them; live-check.mjs
// then checks the live page's main-*.js has its map.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Does this game build crash maps? (its vite config uses crashesMaps()) */
export function usesCrashMaps(root) {
  for (const name of ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs']) {
    try { if (/\bcrashesMaps\s*\(/.test(readFileSync(join(root, name), 'utf8'))) return true } catch { /* not this one */ }
  }
  return false
}

/** The public build settings in .github/workflows/deploy.yml: every `VITE_…: value` line (a `${{ … }}` secret is
 *  skipped — it never reaches a build on this PC, and it isn't public). → { NAME: value } */
export function deployEnv(root) {
  let text = ''
  try { text = readFileSync(join(root, '.github', 'workflows', 'deploy.yml'), 'utf8') } catch { return {} }
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s+(VITE_[A-Z0-9_]+)\s*:\s*(.+?)\s*$/.exec(line)
    if (!m || m[2].includes('${{')) continue
    env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
  return env
}

/** The script a page loads first: the `assets/main-….js` (or index-….js) its HTML names. → 'assets/main-AbC.js' | null */
export function mainScriptOf(html) {
  const m = /<script[^>]+src="[^"]*?(assets\/(?:main|index)-[^"/]+\.js)"/.exec(html || '')
  return m ? m[1] : null
}

/** The .map files filed for a version (paths under releases/<label>/maps/). */
export function releaseMaps(root, label) {
  const dir = join(root, 'releases', label, 'maps')
  const found = []
  const walk = (d, rel) => {
    let entries = []
    try { entries = readdirSync(d, { withFileTypes: true }) } catch { return }
    for (const e of entries) e.isDirectory() ? walk(join(d, e.name), `${rel}${e.name}/`) : found.push(`${rel}${e.name}`)
  }
  if (existsSync(dir)) walk(dir, '')
  return found
}
