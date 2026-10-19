// No commit with a type error (F68). Hooked on Bash + PowerShell (PreToolUse).
// When Claude runs `git commit` and TypeScript files are part of it, run the type check (`tsc -b`) for each project
// those files belong to (nearest tsconfig.json). A failure blocks the commit and shows the errors.
// Why: a quick no-test edit once pushed a broken build (Glyphtender b8758a1).
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { readInput, deny, gitCalls, git } from './lib.mjs'

const TIME_LIMIT_MS = 150_000 // the hook itself gets 180 s in settings.json

const input = readInput()
const command = input.tool_input?.command
if (!command) process.exit(0)

const calls = gitCalls(command, input.cwd)
for (const [index, { dir, sub, args }] of calls.entries()) {
  if (sub !== 'commit' || args.includes('--dry-run')) continue
  const top = git(dir, 'rev-parse', '--show-toplevel')
  if (!top) continue
  const root = resolve(top) // git says C:/x, Node says C:\x — use one spelling

  // What will be in the commit: staged files, plus changed tracked files with -a / --all.
  // This hook runs before the WHOLE command line, so in `git add -A && git commit` nothing is staged yet:
  // a `git add` earlier on the line counts every changed and new file too.
  const all = args.includes('-a') || args.includes('--all') || args.some(a => /^-[a-zA-Z]*a[a-zA-Z]*$/.test(a) && !a.startsWith('--'))
  const addFirst = calls.slice(0, index).some(call => call.sub === 'add' || call.sub === 'stage')
  const files = new Set((git(root, 'diff', '--cached', '--name-only', '--diff-filter=ACMR') || '').split('\n'))
  const paths = commitPaths(args) // `git commit -m x src/a.ts` commits that file as it is now
  if (paths.length) for (const f of (git(dir, 'diff', 'HEAD', '--name-only', '--', ...paths) || '').split('\n')) files.add(f)
  if (all || addFirst) for (const f of (git(root, 'diff', '--name-only', '--diff-filter=ACMR') || '').split('\n')) files.add(f)
  if (addFirst) for (const f of (git(root, 'ls-files', '--others', '--exclude-standard') || '').split('\n')) files.add(f)
  const tsFiles = [...files].filter(f => /\.(ts|tsx|mts|cts)$/.test(f) && !f.includes('node_modules/'))
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

// File paths named on `git commit` (everything that isn't an option or an option's value).
function commitPaths(args) {
  const WITH_VALUE = new Set(['-m', '-F', '-C', '-c', '-t', '--author', '--date', '--file', '--message', '--template',
    '--reuse-message', '--reedit-message', '--fixup', '--squash', '--trailer', '--cleanup', '--pathspec-from-file'])
  const paths = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--') { paths.push(...args.slice(i + 1)); break }
    if (WITH_VALUE.has(a)) { i++; continue }
    if (a.startsWith('-')) {
      if (/^-[a-zA-Z]+$/.test(a) && /[mFCct]$/.test(a)) i++ // -am "message"
      continue
    }
    paths.push(a)
  }
  return paths
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
