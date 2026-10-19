// No commit with a type error (F68). Hooked on Bash + PowerShell (PreToolUse).
// When Claude runs `git commit` and TypeScript files are part of it, run the type check (`tsc -b`) for each project
// those files belong to (nearest tsconfig.json). A failure blocks the commit and shows the errors.
// Why: a quick no-test edit once pushed a broken build (Glyphtender b8758a1).
// (F80) A bug fix (`Fix B014: …`) in a BMUZ project with `check:fast`: the whole suite + build must be green on the
// code being committed (/bug step 4 "verify") — reuses stop-check-fast's green record when nothing changed since,
// else runs `npm run check:fast` and refuses on red. A suite that was ALREADY red for another reason doesn't hold the
// fix hostage: say so in the message — `Fix B014: … (suite already red: B015)` — and that bug must exist in BUGS.md.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { readInput, deny, gitCalls, git, commitFiles, commitMessage, codeFingerprint, runCheckFast } from './lib.mjs'

const TIME_LIMIT_MS = 150_000 // the type check's limit; the hook itself gets 180 s in settings.json
const BUG_CHECK_MS = 100_000 // check:fast for a `Fix Bnn:` commit — leaves room for the type check inside the 180 s

const input = readInput()
const command = input.tool_input?.command
if (!command) process.exit(0)

const calls = gitCalls(command, input.cwd)
for (const [index, { dir, sub, args }] of calls.entries()) {
  if (sub !== 'commit' || args.includes('--dry-run')) continue
  const top = git(dir, 'rev-parse', '--show-toplevel')
  if (!top) continue
  const root = resolve(top) // git says C:/x, Node says C:\x — use one spelling

  await checkBugFix(root, commitMessage(command, calls[index].args))

  const files = commitFiles(calls, index, root)
  const tsFiles = files.filter(f => /\.(ts|tsx|mts|cts)$/.test(f) && !f.includes('node_modules/'))
  if (!tsFiles.length) continue

  for (const project of projectsFor(root, tsFiles)) {
    const result = typecheck(project)
    if (result.ok) continue
    const where = project === root ? 'the project' : project.slice(root.length + 1)
    deny(result.timedOut
      ? `Blocked: the type check in ${where} took over ${TIME_LIMIT_MS / 1000} s, so this commit can't be confirmed safe. Run \`npx tsc -b\` there yourself and look at why it's slow.`
      : `Blocked: the type check failed in ${where}, so this commit would break the build. Fix these first, then commit again:\n\n${result.output}`)
  }
}
process.exit(0)

// `Fix B014: …` → check:fast green on this code, or the commit is refused (F80, /bug "verify").
async function checkBugFix(root, message) {
  const bug = (message.match(/^\s*Fix (B\d+)\b/i) || [])[1]
  if (!bug || !existsSync(join(root, '.planning', 'STATE.md'))) return
  let pkg = {}
  try { pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) } catch { return }
  if (!pkg.scripts?.['check:fast']) return
  // already red for a logged reason → on record in the message, not a refusal
  const redFor = (message.match(/\(suite already red:\s*(B\d+)\)/i) || [])[1]
  if (redFor) {
    let bugs = ''
    try { bugs = readFileSync(join(root, '.planning', 'BUGS.md'), 'utf8') } catch {}
    if (new RegExp(`\\b${redFor}\\b`).test(bugs)) return
    deny(`Blocked: "(suite already red: ${redFor})" but ${redFor} isn't in .planning/BUGS.md — log the failure that was there before your fix as its own bug first (/bug), then commit again.`)
  }
  const record = join(resolve(root, git(root, 'rev-parse', '--git-dir') || '.git'), 'bmuz-last-green')
  const fingerprint = codeFingerprint(root)
  if (existsSync(record) && readFileSync(record, 'utf8').trim() === fingerprint) return // already green on this code
  const { code, output, timedOut } = await runCheckFast(root, BUG_CHECK_MS)
  if (timedOut) return // too slow to confirm here — stop-check-fast still runs it at the end of the turn
  if (code === 0) { try { writeFileSync(record, fingerprint + '\n') } catch {} ; return }
  const tail = output.trim().split('\n').slice(-30).join('\n')
  deny(`Blocked: "Fix ${bug}" but \`npm run check:fast\` (the whole test suite + build) fails on this code — a fix is only done when the new test AND everything else pass (/bug step 4). Fix it — or, if it was ALREADY failing before your change, log that as its own bug and say so in the message: "Fix ${bug}: … (suite already red: B0xx)". Last lines:\n\n${tail}`)
}

// The folders holding the nearest tsconfig.json for each file (one type check per project, not per file).
function projectsFor(root, files) {
  const projects = new Set()
  for (const file of files) {
    let folder = dirname(join(root, file))
    while (folder.length >= root.length) {
      if (existsSync(join(folder, 'tsconfig.json'))) { projects.add(folder); break }
      const up = dirname(folder)
      if (up === folder) break
      folder = up
    }
  }
  return [...projects]
}

// `tsc -b` with the project's own TypeScript (no download: a project without it is skipped).
function typecheck(project) {
  const tsc = findLocalTsc(project)
  if (!tsc) return { ok: true }
  try {
    // --noEmit: check only, never write .js files beside the sources (a tsconfig without noEmit would).
    // `-b` only for a tsconfig that lists other projects (a Vite game's root); a single project gets `-p`, which
    // leaves no tsconfig.tsbuildinfo behind (framework modules — -b wrote one beside each tsconfig).
    const config = readFileSync(join(project, 'tsconfig.json'), 'utf8')
    const mode = /"references"\s*:/.test(config) ? ['-b'] : ['-p', 'tsconfig.json', '--incremental', 'false']
    execFileSync(process.execPath, [tsc, ...mode, '--noEmit', '--pretty', 'false'], { cwd: project, encoding: 'utf8', timeout: TIME_LIMIT_MS, stdio: ['ignore', 'pipe', 'pipe'] })
    return { ok: true }
  } catch (error) {
    if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') return { ok: false, timedOut: true }
    const output = `${error.stdout || ''}${error.stderr || ''}`.trim().split('\n').slice(0, 25).join('\n')
    return { ok: false, output }
  }
}

function findLocalTsc(project) {
  let folder = project
  while (true) {
    const tsc = join(folder, 'node_modules', 'typescript', 'bin', 'tsc')
    if (existsSync(tsc)) return tsc
    const up = dirname(folder)
    if (up === folder) return null
    folder = up
  }
}
