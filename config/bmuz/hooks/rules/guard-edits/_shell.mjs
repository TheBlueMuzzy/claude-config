// Reading a shell command for the guard-edits rules (F184 — moved out of guard-edits.mjs unchanged): what it writes
// to, the heredocs and `python -c` / `node -e` scripts inside it.

export const CODE_FILE = /\.(m?[jt]sx?|c[jt]s|css|py|ps1|sh)\b/

// Does this python / node script write a code file? The literal path in open(…, 'w') / writeFileSync('…') when there
// is one; else the path in a variable — `open(p, 'w')` / `Path(p).write_text` / `writeFileSync(p` — is looked up where
// it's set (`p = 'src/a.ts'`, `p='SPRINT.md'`). Not "any quoted text ending in .mjs": a quoted span inside a long
// note that happened to end in ".mjs" blocked a script writing SPRINT.md (found in use, 2026-10-19).
export function writesCodeFile(s) {
  return codeFilesWritten(s).length > 0
}

// The code files a script (or a shell line) writes — the paths, so GE3 can tell a throwaway folder from the game.
export function codeFilesWritten(s) {
  const literal = [...writeTargets(s), ...[...s.matchAll(/Path\(\s*r?(['"])([^'"]+)\1\s*\)\s*\.\s*write_text/g)].map(m => m[2])]
  // (no early "false" on other literals: a `=>` or `<Tag />` in the script's text reads as a shell `> word` target and
  // hid `open(p, 'w')` with p = '….test.mjs' — a test's backslash-n became real line breaks, framework F102 2026-10-20)
  const vars = [...s.matchAll(/(?:open|Path|writeFileSync|writeFile)\(\s*([A-Za-z_$][\w$]*)\s*[,)]/g)].map(m => m[1])
  const held = vars.flatMap(v => [...s.matchAll(new RegExp(`(?:^|[\\s;(])${v}\\s*=\\s*(['"])([^'"\\n]+)\\1`, 'gm'))].map(m => m[2]).filter(p => !/[*?]/.test(p)))
  return [...literal, ...held].filter(t => CODE_FILE.test(t))
}

// A throwaway place: the dev .scratch folder, Claude's session scratchpad (…\Temp\claude\…\scratchpad), /tmp (F185 —
// audit 2026-11: 155 GE3 refusals were scripts writing throwaway files there; nothing is lost if one goes wrong).
// Not the whole Temp folder: the hook tests build their throwaway games there, and must still see real refusals.
export const THROWAWAY = /[\\/]\.scratch([\\/]|$)|[\\/]scratchpad([\\/]|$)|^\/tmp(\/|$)/i

// The replacement halves of the `s/old/new/` edits in a sed / perl line (any delimiter, quoted or not)
export function sedReplacements(text) {
  const out = []
  for (const m of text.matchAll(/(?:^|[\s'";])s([^\w\s\\])((?:\\.|(?!\1)[^\n])*)\1((?:\\.|(?!\1)[^\n])*)\1/g)) out.push(m[3])
  return out
}

// Paths a shell command writes to.
export function writeTargets(text) {
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
export function heredocBodies(text) {
  return heredocs(text).map(h => h.body)
}

// Each heredoc: its body, whether its tag was quoted (`<<'EOF'` / `<<"EOF"` — bash then keeps every byte: no `\`, `$`
// or backtick is touched), and the line that opens it (`cat > a.ts <<'EOF'`).
export function heredocs(text) {
  const lines = text.split('\n')
  const found = []
  for (let i = 0; i < lines.length; i++) {
    const opener = lines[i]
    for (const m of opener.matchAll(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/g)) {
      const body = []
      while (i + 1 < lines.length && lines[i + 1].trim() !== m[2]) body.push(lines[++i])
      found.push({ body: body.join('\n'), quoted: Boolean(m[1]), opener })
    }
  }
  return found
}

// The script in `python -c "…"` / `node -e '…'`
// (GE8) each `node -e "…"` / `python -c "…"` body in double quotes, up to its closing unescaped quote
export function doubleQuotedScripts(text) {
  return [...text.matchAll(/\b(?:python3?|py|node)\s+(?:--?[\w=-]+\s+)*-(?:c|e)\s+"((?:\\[\s\S]|[^"\\])*)"/g)].map(m => m[1])
}

export function inlineScripts(text) {
  // to the end of the line: an escaped quote inside the script would end a tighter match too early
  return [...text.matchAll(/\b(?:python3?|py|node)\s+(?:--?[\w=-]+\s+)*-(?:c|e)\s+(['"])([\s\S]*)$/g)].map(m => m[2])
}
