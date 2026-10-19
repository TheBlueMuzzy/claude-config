// Run the project's smoke test and, only if it passes, record the pass (F68).
// Usage: node ~/.claude/config/bmuz/hooks/smoke-pass.mjs   (from inside the project)
// The smoke test is the project's `smoke` npm script (or `e2e:smoke`): the game loads, one turn/round plays, console clean.
// The pass goes in .planning/smoke-pass (first line = the commit tested). live-push.mjs reads it before anything goes live.
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const say = text => console.log(text)
const root = run('git rev-parse --show-toplevel', process.cwd())
if (!root) { say('Not inside a git repo — run this from the project folder.'); process.exit(1) }

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const script = ['smoke', 'e2e:smoke'].find(name => pkg.scripts?.[name])
if (!script) {
  say('No smoke script yet. Add a `smoke` npm script to package.json that loads the game and plays one turn/round in Playwright with a clean console (often an existing e2e script — point `smoke` at it), commit it, then run this again.')
  process.exit(1)
}

// The pass must describe committed code — otherwise it would vouch for files that aren't in the commit.
const uncommitted = (run('git status --porcelain') || '').split('\n').filter(Boolean)
  .map(line => line.slice(3)).filter(f => !f.startsWith('.planning/') && !f.endsWith('.md'))
if (uncommitted.length) {
  say(`Commit (or set aside) these first — the smoke pass must test what's committed: ${uncommitted.slice(0, 8).join(', ')}`)
  process.exit(1)
}

const commit = run('git rev-parse HEAD')
say(`Smoke test: npm run ${script}  (commit ${commit.slice(0, 7)})`)
const result = spawnSync(`npm run ${script}`, { cwd: root, stdio: 'inherit', shell: true })
if (result.status !== 0) {
  say(`\nSmoke test FAILED (exit ${result.status}) — nothing recorded. Fix it, commit, and run this again.`)
  process.exit(1)
}

mkdirSync(join(root, '.planning'), { recursive: true })
writeFileSync(join(root, '.planning', 'smoke-pass'), `${commit}\n${new Date().toISOString()} npm run ${script} passed\n`)
say(`\nSmoke pass recorded for ${commit.slice(0, 7)} in .planning/smoke-pass — commit that file, then push/deploy.`)

function run(cmd, cwd = root) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}
