import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { rootOf } from '../guard-git/_shared.mjs'

const TIME_LIMIT_MS = 150_000 // the type check's limit; the hook itself gets 180 s in settings.json

export default {
  id: 'CT1',
  name: 'commit.typecheck',
  what: 'Runs the type check (`tsc`) for each project the commit\'s TypeScript files belong to (nearest tsconfig.json, its own TypeScript — never downloads); a type error refuses the commit and shows it',
  why: 'A quick no-test edit once pushed a broken build (Glyphtender b8758a1)',
  on: true,
  mode: 'block',
  tests: 'commit-typecheck',
  check({ commit }, { deny }) {
    if (!commit) return
    const root = rootOf(commit)
    if (!root) return
    const tsFiles = commit.files(root).filter(f => /\.(ts|tsx|mts|cts)$/.test(f) && !f.includes('node_modules/'))
    if (!tsFiles.length) return
    for (const project of projectsFor(root, tsFiles)) {
      const result = typecheck(project)
      if (result.ok) continue
      const where = project === root ? 'the project' : project.slice(root.length + 1)
      deny(result.timedOut
        ? `Blocked: the type check in ${where} took over ${TIME_LIMIT_MS / 1000} s, so this commit can't be confirmed safe. Run \`npx tsc -b\` there yourself and look at why it's slow.`
        : `Blocked: the type check failed in ${where}, so this commit would break the build. Fix these first, then commit again:\n\n${result.output}`)
    }
  },
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
