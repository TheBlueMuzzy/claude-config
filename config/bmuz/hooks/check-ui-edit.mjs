// UI rules checked the moment a UI file changes (F68). Hooked on Edit|Write|MultiEdit (PostToolUse).
// In a game with the UI kit (src/ui/kit/check-ui.mjs), after Claude edits a .ts/.tsx/.css file under src/,
// run the game's own `check:ui` and show Claude the problems in THAT file (others' old problems aren't repeated).
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { readInput, tellClaude } from './lib.mjs'

const input = readInput()
const file = input.tool_input?.file_path
if (!file || !/\.(tsx?|css)$/.test(file)) process.exit(0)

const root = findGameRoot(resolve(file))
if (!root) process.exit(0)
const where = relative(root, resolve(file)).split('\\').join('/')
if (!where.startsWith('src/') || where.startsWith('src/ui/kit/')) process.exit(0) // the kit itself is checked in the framework

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const command = pkg.scripts?.['check:ui'] || 'node src/ui/kit/check-ui.mjs src/ui --css src'
let output = ''
try {
  execSync(command, { cwd: root, encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] })
  process.exit(0) // all clear
} catch (error) {
  output = `${error.stdout || ''}${error.stderr || ''}`
}

// Keep the problem blocks for this file: "path:line  message" plus its indented snippet line(s)
const mine = []
let keep = false
for (const line of output.split('\n')) {
  if (/^\S.*:\d+\s/.test(line)) keep = line.split('\\').join('/').startsWith(`${where}:`)
  else if (!/^\s/.test(line)) keep = false
  if (keep) mine.push(line)
}
if (mine.length) {
  tellClaude(`check-ui found problems in ${where} (UI kit rules — fix them now, in this same task):\n${mine.join('\n')}`)
}
process.exit(0)

// The nearest folder above the file that has the UI kit's checker.
function findGameRoot(path) {
  let folder = dirname(path)
  while (true) {
    if (existsSync(join(folder, 'src', 'ui', 'kit', 'check-ui.mjs')) && existsSync(join(folder, 'package.json'))) return folder
    const up = dirname(folder)
    if (up === folder) return null
    folder = up
  }
}
