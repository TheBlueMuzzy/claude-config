import { doubleQuotedScripts } from './_shell.mjs'

export default {
  id: 'GE8',
  name: 'shell.no-backtick-dq',
  what: 'Refuses (Bash) a `node -e "…"` / `python -c "…"` with an unescaped backtick inside the double quotes — single quotes, or a script file',
  why: 'Bash runs backticked text as a command first: a ROADMAP line silently lost its code + mermaid block, and empty files named after the code got committed (framework sprint 33)',
  on: true,
  mode: 'block',
  tests: 'guard-edits',
  check({ tool, command }, { deny }) {
    if (tool === 'Bash' && doubleQuotedScripts(command).some(s => /(^|[^\\])`/.test(s))) {
      deny('Blocked: this `node -e "…"` / `python -c "…"` has a backtick inside double quotes — bash runs the backticked text as a command before the script sees it, so the text silently goes missing (and a `>` inside makes a file). Put the script in single quotes (`node -e \'…\'`), or Write it to a .mjs file in the scratchpad and run that.')
    }
  },
}
