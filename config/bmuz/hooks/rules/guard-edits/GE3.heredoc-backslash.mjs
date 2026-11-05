import { toDir } from '../../lib.mjs'
import { CODE_FILE, THROWAWAY, writeTargets, heredocs, codeFilesWritten, sedReplacements } from './_shell.mjs'

export default {
  id: 'GE3',
  name: 'shell.no-backslash-code',
  what: 'Refuses writing a code file through an unquoted heredoc / `python -c` / `node -e` / a python or node heredoc, or a `sed -i` whose replacement has a backslash — use the Edit / Write tool. Passes: a quoted `cat <<\'EOF\'` (bash keeps every byte), sed escapes in the pattern, and anything written into .scratch / Temp / the scratchpad',
  why: '`\'\\\\\'` became `\'\\\'`, `split(\'\\n\')` became a real line break, `PALMER\\\'s` lost its backslash (framework audio 2026-10-09, Glyphtender sprint 25 + F71). Narrowed in F185 (audit 2026-11: ~75 % of 369 refusals were quoted heredocs, sed pattern escapes or throwaway files — nothing could be mangled there)',
  on: true,
  mode: 'block',
  tests: 'guard-edits',
  check({ command, shell, scripts, unquoted, cwd }, { deny }) {
    const kept = (path) => !THROWAWAY.test(toDir(path, cwd).split('\\').join('/')) // a real file, not a throwaway one
    //    a) `cat > a.ts <<EOF` (tag NOT quoted — bash eats a backslash before \ $ `) with a backslash in the text
    const heredocCode = heredocs(command).some(h => !h.quoted && h.body.includes('\\') && !/\b(python3?|py|node)\b/.test(h.opener) &&
      writeTargets(h.opener).some(t => CODE_FILE.test(t) && kept(t)))
    //    b) a python/node script with a backslash that writes a code file (`open(p, 'w')` with p = 'x.mjs' counts) —
    //       the language reads `\n` in a string literal as a line break whatever the shell did
    //       (the file WRITTEN is code — a script writing STATE.md whose text merely names a .mjs file is fine; review)
    const scriptWritesCode = (s) => s.includes('\\') && /(open\([^)]*,\s*r?['"][wa]|write_text|writeFileSync|writeFile\()/.test(s) &&
      codeFilesWritten(s).some(kept)
    //    c) `sed -i` / `perl -i` putting a backslash into a code file (2026-10-18: `\d` came out as `d` in a hook). Only
    //       the REPLACEMENT counts: `\[` or `\.` in the pattern is a meant regex escape; `\/` and `\&` in the
    //       replacement are the delimiter / a literal & — fine. The FILE is code: read with quoted text taken out
    //       (a ";" inside a quoted sed script would otherwise cut it short — found in use).
    const sedLines = [...unquoted.matchAll(/\b(?:sed|perl)\s+(?:[^\n;&|]*?\s)?-[a-zA-Z]*i\S*\s[^\n;&|]*/g)]
    const sedOnCode = sedLines.some(m => m[0].split(/\s+/).slice(1).some(w => !w.startsWith('-') && CODE_FILE.test(w) && kept(w.replace(/^['"]|['"]$/g, ''))))
    const sedWithBackslash = sedOnCode && [...shell.matchAll(/\b(?:sed|perl)\b[^\n]*/g)].some(m =>
      sedReplacements(m[0]).some(r => /\\(?![/|#,:@!&])/.test(r)))
    if (heredocCode || scripts.some(scriptWritesCode) || sedWithBackslash) {
      deny('Blocked: this writes a code file through a heredoc (tag not quoted) / `python -c` / `node -e` / `sed -i`, and the text has a backslash — the shell or Python can silently change it (a doubled backslash became one, a backslash-n became a real line break, a backslash-b became an invisible character; 8 times so far). Use the Edit tool (or Write for a new file) for any text with a backslash or a quote inside quotes. A `cat > file <<\'EOF\'` with the tag quoted is fine (bash keeps every byte), and so is anything written into ~/Documents/dev/.scratch or the scratchpad. A script that only needs a newline can use chr(10) / String.fromCharCode(10) instead of a backslash.')
    }
  },
}
