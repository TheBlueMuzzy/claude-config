// Edit and command habits that bit us, refused before they happen (F67).
// Hooked on Edit|Write|MultiEdit|NotebookEdit and Bash|PowerShell (PreToolUse).
//  1. Never edit a game's copy of a framework module (src/ui/kit/, src/devkit/, src/ai/kit/, src/audio/, src/rooms/,
//     src/table/ — the folder has a VERSION file): change it in the framework, then reinstall. A copy edited in the game
//     is lost at the next install and never reaches the other games.
//  2. Read a check's OWN exit code: `npm test | tail` reports tail's exit code (0), so a failed check looks green
//     (Goops 2026-10-17 shipped a kit change that broke the kit's own rules that way).
//  3. Code with a backslash is never written through a heredoc or `python -c`: `'\\'` became `'\'`, `split('\n')` became
//     a real line break, `PALMER\'s` lost its backslash (framework audio 2026-10-09, Glyphtender sprint 25 + F71).
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { readInput, deny, toDir, dropHeredocs } from './lib.mjs'

const MODULE_COPIES = [ // folder in a game → framework module
  ['src/ui/kit', 'ui-kit'], ['src/devkit', 'devkit'], ['src/ai/kit', 'ai'],
  ['src/audio', 'audio'], ['src/rooms', 'rooms'], ['src/table', 'table'],
]
const CODE_FILE = /\.(m?[jt]sx?|c[jt]s|css|py|ps1|sh)\b/

const input = readInput()
const tool = input.tool_name
const cwd = input.cwd || process.cwd()

if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
  const file = input.tool_input?.file_path || input.tool_input?.notebook_path
  if (file) refuseKitCopy(toDir(file, cwd))
  process.exit(0)
}

const command = input.tool_input?.command
if (!command || !['Bash', 'PowerShell'].includes(tool)) process.exit(0)

// The command itself (heredoc text left out — usually a commit message) and the scripts it runs:
// heredocs fed to python/node, and `python -c` / `node -e` strings.
const shell = dropHeredocs(command)
const scripts = [...(/\b(python3?|py|node)\b[^\n]*<</.test(command) ? heredocBodies(command) : []), ...inlineScripts(command)]

// 1. writes into a kit copy from the shell (sed -i, >, tee, Set-Content, open(…, 'w'), writeFileSync)
for (const target of [shell, ...scripts].flatMap(writeTargets)) refuseKitCopy(toDir(target, cwd))

// 2. a check piped into something that hides its exit code
// the command BEFORE the pipe must itself be a check (`grep -rn vitest src | head` is just a search)
const CHECK = /^\s*(\w+=\S*\s+)*(npm\s+(run\s+)?(test|check[\w:-]*|lint|typecheck|build|e2e[\w:-]*|smoke)\b|npx\s+(tsc|eslint|vitest|playwright)\b|(tsc|eslint|vitest)\b|node\s+\S*(e2e|check|test)\S*)/
const HIDES = /^\s*(tail|head|grep|Select-Object|Select-String|findstr|sort|wc|tee|more|less|Out-String)\b/i
const unquoted = shell.replace(/"(?:\\.|[^"\\])*"|'[^']*'/g, '""') // words inside quotes (a commit message) aren't commands
for (const segment of unquoted.split(/&&|\|\||;|\n/)) { // "a | tail" stays one segment
  const [first, ...piped] = segment.split(/\|(?!\|)/)
  if (piped.length && CHECK.test(first) && HIDES.test(piped[0]) && !/pipefail|PIPESTATUS/.test(command)) {
    deny(tool === 'PowerShell'
      ? 'Blocked: this pipes a check into another command, so $LASTEXITCODE reads the last command, not the check — a failed check can look green. Send the output to a file and read the check\'s own code: `npm test *> out.txt; $code = $LASTEXITCODE; Get-Content out.txt -Tail 30; "exit $code"`.'
      : 'Blocked: this pipes a check into another command, so the exit code is the last command\'s, not the check\'s — a failed check can look green. Start the line with `set -o pipefail;` (then a failure still shows), or run it to a file: `npm test > out.txt 2>&1; echo "exit $?"; tail -30 out.txt`.')
  }
}

// 3. heredoc / python -c / node -e writing code that contains a backslash
//    a) `cat > a.ts <<'EOF'` with a backslash in the heredoc
const shellWritesCode = writeTargets(shell).some(t => CODE_FILE.test(t))
const heredocWithBackslash = heredocBodies(command).some(body => body.includes('\\'))
//    b) a python/node script with a backslash that writes a code file (`open(p, 'w')` with p = 'x.mjs' counts)
const scriptWritesCode = (s) => s.includes('\\') && CODE_FILE.test(s) && /(open\([^)]*,\s*r?['"][wa]|write_text|writeFileSync|writeFile\()/.test(s)
//    c) `sed -i` / `perl -i` putting a backslash into a code file (2026-10-18: `\d` came out as `d` in a hook)
// the FILE is code, not words in the edit: read the command with quoted text taken out (a ";" inside a quoted sed
// script would otherwise cut it short — found in use), and the backslash check on the original
const sedOnCode = [...unquoted.matchAll(/\b(?:sed|perl)\s+(?:[^\n;&|]*?\s)?-[a-zA-Z]*i\S*\s[^\n;&|]*/g)].some(m => CODE_FILE.test(m[0]))
const sedWithBackslash = sedOnCode && /\b(?:sed|perl)\b[^\n]*\\/.test(shell)
if ((shellWritesCode && heredocWithBackslash) || scripts.some(scriptWritesCode) || sedWithBackslash) {
  deny('Blocked: this writes a code file through a heredoc / `python -c` / `node -e` / `sed -i`, and the text has a backslash — the shell or Python can silently change it (a doubled backslash became one, a backslash-n became a real line break, a backslash-b became an invisible character; 8 times so far). Use the Edit tool (or Write for a new file) for any text with a backslash or a quote inside quotes. A script that only needs a newline can use chr(10) / String.fromCharCode(10) instead of a backslash.')
}
process.exit(0)

function refuseKitCopy(path) {
  const normal = path.split('\\').join('/')
  for (const [folder, module] of MODULE_COPIES) {
    const at = normal.indexOf(`/${folder}/`)
    if (at < 0) continue
    const game = normal.slice(0, at)
    if (!existsSync(join(game, folder, 'VERSION'))) continue // not an installed copy
    if (/\/framework\/[^/]+\/kit\//.test(normal)) continue // the framework's own source
    const rest = normal.slice(at + folder.length + 2)
    deny(`Blocked: ${folder}/${rest} is this game's COPY of the framework's ${module} module (it has a VERSION file) — an edit here is lost at the next install and never reaches the other games. Change ~/Documents/dev/framework/${module}/kit/${rest} instead (run its tests + checks there), then reinstall it into the game with the module's install script (framework/${module}/scripts/install-*.mjs, --dry-run first).`)
  }
}

// Paths a shell command writes to.
function writeTargets(text) {
  const targets = []
  const add = (re, group) => { for (const m of text.matchAll(re)) targets.push(m[group]) }
  // a path: "with spaces" · 'with spaces' · plain
  const PATH = `(?:"([^"]+)"|'([^']+)'|([^\\s'"<>|;&()]+))`
  const addPath = (prefix) => { for (const m of text.matchAll(new RegExp(prefix + PATH, 'gi'))) targets.push(m[1] || m[2] || m[3]) }
  addPath('(?:^|[^<>&0-9])>>?\\s*') // > file, >> file (not 2>&1)
  addPath('\\btee\\s+(?:-a\\s+)?')
  addPath('\\b(?:Set-Content|Out-File|Add-Content)\\s+(?:-(?:Path|FilePath|LiteralPath)\\s+)?')
  add(/open\(\s*r?(['"])([^'"]+)\1\s*,\s*['"][wa]/g, 2)
  add(/writeFileSync\(\s*(['"`])([^'"`]+)\1/g, 2)
  for (const m of text.matchAll(/\b(?:sed|perl)\s+(?:[^\n;&|]*?\s)?-[a-zA-Z]*i\S*(\s[^\n;&|]*)/g)) { // -i as its own word
    targets.push(...m[1].split(/\s+/).filter(w => /[\\/]/.test(w) && !w.startsWith('-')).map(w => w.replace(/^['"]|['"]$/g, '')))
  }
  return targets.filter(t => t && t !== '/dev/null' && !t.startsWith('$'))
}

// Text inside heredocs: `<<'EOF'` … `EOF`
function heredocBodies(text) {
  const lines = text.split('\n')
  const bodies = []
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/g)) {
      const body = []
      while (i + 1 < lines.length && lines[i + 1].trim() !== m[2]) body.push(lines[++i])
      bodies.push(body.join('\n'))
    }
  }
  return bodies
}

// The script in `python -c "…"` / `node -e '…'`
function inlineScripts(text) {
  // to the end of the line: an escaped quote inside the script would end a tighter match too early
  return [...text.matchAll(/\b(?:python3?|py|node)\s+(?:--?[\w=-]+\s+)*-(?:c|e)\s+(['"])([\s\S]*)$/g)].map(m => m[2])
}
