// Edit and command habits that bit us, refused before they happen (F67).
// Hooked on Edit|Write|MultiEdit|NotebookEdit and Bash|PowerShell (PreToolUse).
//  1. Never edit a game's copy of a framework module (src/ui/kit/, src/devkit/, src/ai/kit/, src/audio/, src/rooms/,
//     src/table/ — the folder has a VERSION file): change it in the framework, then reinstall. A copy edited in the game
//     is lost at the next install and never reaches the other games.
//  2. Read a check's OWN exit code: `npm test | tail` reports tail's exit code (0), so a failed check looks green
//     (Goops 2026-10-17 shipped a kit change that broke the kit's own rules that way).
//  3. Code with a backslash is never written through a heredoc or `python -c`: `'\\'` became `'\'`, `split('\n')` became
//     a real line break, `PALMER\'s` lost its backslash (framework audio 2026-10-09, Glyphtender sprint 25 + F71).
//  4. (F80) Local servers stop with scripts/stop-servers.mjs, never taskkill / Stop-Process / kill-port: killing the
//     process on the port lets wrangler start a new one (Glyphtender sprint 25: 4 leftover servers).
//  5. (F80) Throwaway copies and proof shots go in ~/Documents/dev/.scratch/, never a new folder or loose file in the
//     home folder (1 GB piled up in ~/spike and ~/ppp-proof, 2026-10-19) — cleanup.sh clears .scratch, nothing clears ~.
//  6. (F80) Python writing a code file opens it with newline='' (no translation): on Windows text mode turns every LF
//     into CRLF (Glyphtender F71).
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, relative, isAbsolute } from 'node:path'
import { readInput, deny, toDir, dropHeredocs, commands } from './lib.mjs'

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
  if (file && tool === 'Write') refuseHomeClutter(toDir(file, cwd), 'a new file')
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
//       (the file WRITTEN is code — a script writing STATE.md whose text merely names a .mjs file is fine; review)
const scriptWritesCode = (s) => s.includes('\\') && writesCodeFile(s) && /(open\([^)]*,\s*r?['"][wa]|write_text|writeFileSync|writeFile\()/.test(s)
//    c) `sed -i` / `perl -i` putting a backslash into a code file (2026-10-18: `\d` came out as `d` in a hook)
// the FILE is code, not words in the edit: read the command with quoted text taken out (a ";" inside a quoted sed
// script would otherwise cut it short — found in use), and the backslash check on the original
const sedOnCode = [...unquoted.matchAll(/\b(?:sed|perl)\s+(?:[^\n;&|]*?\s)?-[a-zA-Z]*i\S*\s[^\n;&|]*/g)].some(m => CODE_FILE.test(m[0]))
const sedWithBackslash = sedOnCode && /\b(?:sed|perl)\b[^\n]*\\/.test(shell)
if ((shellWritesCode && heredocWithBackslash) || scripts.some(scriptWritesCode) || sedWithBackslash) {
  deny('Blocked: this writes a code file through a heredoc / `python -c` / `node -e` / `sed -i`, and the text has a backslash — the shell or Python can silently change it (a doubled backslash became one, a backslash-n became a real line break, a backslash-b became an invisible character; 8 times so far). Use the Edit tool (or Write for a new file) for any text with a backslash or a quote inside quotes. A script that only needs a newline can use chr(10) / String.fromCharCode(10) instead of a backslash.')
}

// 4. stopping a server by hand — the kill tool has to BE the command (review: `grep -rn taskkill …` and
//    `Get-Help Stop-Process` were refused for only naming it)
const KILLERS = new Set(['taskkill', 'taskkill.exe', 'stop-process', 'spps', 'kill-port', 'pkill', 'killall'])
const killsByHand = commands(command, cwd).some(({ words }) => {
  const [first = '', second = ''] = words.map(w => w.toLowerCase())
  return KILLERS.has(first) || (first === 'npx' && second === 'kill-port') || (first === 'fuser' && words.includes('-k'))
}) || /\|\s*(Stop-Process|spps)\b|\bkill\b[^\n;&|]*\$\(\s*lsof\b|\blsof\b[^\n;&]*\|\s*xargs\s+kill\b/i.test(unquoted)
if (killsByHand) {
  deny('Blocked: stop local servers with `node ~/.claude/config/bmuz/scripts/stop-servers.mjs <port|name>` — it ends the whole process tree and says when the port is free. Killing only the process on the port lets wrangler start a new one (Glyphtender sprint 25: 4 leftover servers), and it never touches Claude, a shell or an editor. A background task you started yourself → stop it with the TaskStop tool.')
}

// 5. new folders / files straight in the home folder (mkdir, cp, mv, New-Item, git clone, git worktree add)
for (const { dir, words } of commands(command, cwd)) {
  const first = words[0].toLowerCase()
  const args = words.slice(1).filter(w => !w.startsWith('-'))
  let targets = []
  if (first === 'mkdir' || first === 'md') targets = args
  else if (first === 'cp' || first === 'mv' || first === 'copy-item' || first === 'move-item') targets = args.slice(-1)
  else if (first === 'new-item' || first === 'ni') targets = args.filter(a => !/^(directory|file)$/i.test(a))
  else if (/^git(\.exe)?$/.test(first) && args[0] === 'clone' && args.length >= 3) targets = [args[2]]
  else if (/^git(\.exe)?$/.test(first) && args[0] === 'worktree' && args[1] === 'add' && args[2]) targets = [args[2]]
  for (const t of targets) if (!t.startsWith('$')) refuseHomeClutter(toDir(t, dir), first === 'mkdir' || first === 'md' ? 'a new folder' : 'a copy')
}

// 6. Python writing a code file in text mode without newline=
//    The file WRITTEN must be code (review: a script reading src/**/*.ts and writing report.json was refused): the
//    literal path in open(…, 'w'), else — a path in a variable — a quoted code-file path in the script (no globs).
const pythonScripts = /\b(python3?|py)\b/.test(command) ? scripts : []
if (pythonScripts.some(s => writesCodeFile(s) && /(open\([^)]*,\s*(mode\s*=\s*)?r?['"](w|a|w\+|wt|at)['"]|\.write_text\()/.test(s) && !/newline\s*=/.test(s))) {
  deny("Blocked: this Python writes a code file in text mode without `newline=` — on Windows every line ending becomes CRLF (Glyphtender F71). Open it with `open(p, 'w', newline='')` (no translation, and no backslash for the heredoc rule to trip on), or use the Edit / Write tool.")
}
process.exit(0)

// A new folder or loose file straight in the home folder (not a dot-folder like ~/.claude) → refused, pointing to
// ~/Documents/dev/.scratch/. Folders that already exist (Documents, Desktop, AppData…) are fine.
function refuseHomeClutter(path, what) {
  const home = process.env.BMUZ_HOME || homedir() // (tests use their own folder)
  const rel = relative(home, path)
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return
  const top = rel.split(/[\\/]/)[0]
  if (top.startsWith('.') || existsSync(join(home, top))) return
  deny(`Blocked: this makes ${what} straight in the home folder (~/${top}). Throwaway copies and proof shots go in \`~/Documents/dev/.scratch/<project>-<what>/\` — cleanup.sh (run by every /save) clears entries there after 24 h; nothing ever clears the home folder (1 GB piled up in ~/spike and ~/ppp-proof, 2026-10-19). Real projects go under ~/Documents/dev/.`)
}

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

// Does this python / node script write a code file? The literal path in open(…, 'w') / writeFileSync('…') when there
// is one; else (the path is in a variable) a quoted code-file path anywhere in the script — globs ('src/**/*.ts') aren't.
function writesCodeFile(s) {
  const literal = writeTargets(s)
  if (literal.length) return literal.some(t => CODE_FILE.test(t))
  return [...s.matchAll(/(['"])([^'"\n*?]+)\1/g)].some(m => /\.(m?[jt]sx?|c[jt]s|css|py|ps1|sh)$/.test(m[2]))
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
