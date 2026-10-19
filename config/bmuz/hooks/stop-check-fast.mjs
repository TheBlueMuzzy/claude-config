// Don't end a /develop turn on broken code (F68). Registered by the /develop skill as a Stop hook.
// When Claude is about to stop and the project's code changed since the last green `npm run check:fast`,
// run it. Red → Claude keeps going (fix it, or say plainly what's broken). Green → remember it, so an unchanged
// project never runs it twice. Docs (.planning/, *.md) don't count as code.
import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { readInput, git } from './lib.mjs'

const TIME_LIMIT_MS = Number(process.env.BMUZ_STOP_LIMIT_MS) || 300_000 // the hook itself gets 360 s in the skill (env = tests only)

const input = readInput()
if (input.stop_hook_active) process.exit(0) // already continuing because of this check — never loop

const top = git(input.cwd || '.', 'rev-parse', '--show-toplevel')
if (!top) process.exit(0)
const root = resolve(top)
const pkg = existsSync(join(root, 'package.json')) ? JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) : {}
if (!pkg.scripts?.['check:fast']) process.exit(0)

const gitDir = resolve(root, git(root, 'rev-parse', '--git-dir'))
const recordFile = join(gitDir, 'bmuz-last-green')
const fingerprint = codeFingerprint(root)
if (existsSync(recordFile) && readFileSync(recordFile, 'utf8').trim() === fingerprint) process.exit(0)

const { code, output, timedOut } = await runCheck(root)
if (code === 0) {
  writeFileSync(recordFile, fingerprint + '\n')
  process.exit(0)
}
const tail = output.trim().split('\n').slice(-40).join('\n')
process.stdout.write(JSON.stringify({
  decision: 'block',
  reason: timedOut
    ? `npm run check:fast ran over ${TIME_LIMIT_MS / 60000} minutes, so the code wasn't confirmed. Say so plainly in your report (and why it's slow, if you can tell).`
    : `npm run check:fast is failing on the current code. Fix it before handing back — or, if it can't be fixed now, tell Muzzy plainly what's broken and why. Last lines:\n\n${tail}`,
}))
process.exit(0)

// One hash for "the code as it is now": committed code files + uncommitted changes + new files. Docs left out.
function codeFingerprint(dir) {
  const isDocs = f => f.startsWith('.planning/') || f.endsWith('.md')
  const hash = createHash('sha256')
  const tree = (git(dir, 'ls-tree', '-r', 'HEAD') || '').split('\n').filter(line => !isDocs(line.split('\t')[1] || ''))
  hash.update(tree.join('\n'))
  const changed = (git(dir, 'diff', 'HEAD', '--name-only') || '').split('\n').filter(f => f && !isDocs(f))
  if (changed.length) hash.update(git(dir, 'diff', 'HEAD', '--', ...changed) || '')
  const added = (git(dir, 'ls-files', '--others', '--exclude-standard') || '').split('\n').filter(f => f && !isDocs(f))
  for (const f of added) hash.update(f + (git(dir, 'hash-object', '--', f) || ''))
  return hash.digest('hex')
}

// npm run check:fast with a time limit; on Windows the whole process tree is ended (vitest, vite…), not just npm.
function runCheck(dir) {
  return new Promise(done => {
    const child = spawn('npm run check:fast', { cwd: dir, shell: true })
    let output = ''
    child.stdout.on('data', d => { output += d })
    child.stderr.on('data', d => { output += d })
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      try {
        if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
        else child.kill('SIGKILL')
      } catch { /* already gone */ }
    }, TIME_LIMIT_MS)
    child.on('close', code => { clearTimeout(timer); done({ code: timedOut ? -1 : code, output, timedOut }) })
  })
}
