import { writesCodeFile } from './_shell.mjs'

export default {
  id: 'GE6',
  name: 'shell.python-newline',
  what: 'Refuses Python writing a code file in text mode without `newline=\'\'`',
  why: 'On Windows text mode turns every LF into CRLF (Glyphtender F71) (F80)',
  on: true,
  mode: 'block',
  tests: 'guard-edits',
  //    The file WRITTEN must be code (review: a script reading src/**/*.ts and writing report.json was refused): the
  //    literal path in open(…, 'w'), else — a path in a variable — a quoted code-file path in the script (no globs).
  check({ command, scripts }, { deny }) {
    const pythonScripts = /\b(python3?|py)\b/.test(command) ? scripts : []
    if (pythonScripts.some(s => writesCodeFile(s) && /(open\([^)]*,\s*(mode\s*=\s*)?r?['"](w|a|w\+|wt|at)['"]|\.write_text\()/.test(s) && !/newline\s*=/.test(s))) {
      deny("Blocked: this Python writes a code file in text mode without `newline=` — on Windows every line ending becomes CRLF (Glyphtender F71). Open it with `open(p, 'w', newline='')` (no translation, and no backslash for the heredoc rule to trip on), or use the Edit / Write tool.")
    }
  },
}
