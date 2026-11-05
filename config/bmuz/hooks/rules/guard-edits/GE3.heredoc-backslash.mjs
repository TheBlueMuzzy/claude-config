import { CODE_FILE, writeTargets, heredocBodies, writesCodeFile } from './_shell.mjs'

export default {
  id: 'GE3',
  name: 'shell.no-backslash-code',
  what: 'Refuses writing a code file through a heredoc / `python -c` / `node -e` / `sed -i` when the text has a backslash — use the Edit / Write tool',
  why: '`\'\\\\\'` became `\'\\\'`, `split(\'\\n\')` became a real line break, `PALMER\\\'s` lost its backslash (framework audio 2026-10-09, Glyphtender sprint 25 + F71)',
  on: true,
  mode: 'block',
  tests: 'guard-edits',
  check({ command, shell, scripts, unquoted }, { deny }) {
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
  },
}
