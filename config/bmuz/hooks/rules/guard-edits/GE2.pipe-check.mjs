// the command BEFORE the pipe must itself be a check (`grep -rn vitest src | head` is just a search)
const CHECK = /^\s*(\w+=\S*\s+)*(npm\s+(run\s+)?(test|check[\w:-]*|lint|typecheck|build|e2e[\w:-]*|smoke)\b|npx\s+(tsc|eslint|vitest|playwright)\b|(tsc|eslint|vitest)\b|node\s+\S*(e2e|check|test)\S*)/
const HIDES = /^\s*(tail|head|grep|Select-Object|Select-String|findstr|sort|wc|tee|more|less|Out-String)\b/i

export default {
  id: 'GE2',
  name: 'shell.pipefail',
  what: 'A bash line piping a check (npm test, check:*, tsc, eslint, vitest…) into tail / grep / head… gets `set -o pipefail;` added in front, so a failed check still fails the line — nothing is refused. PowerShell is left alone (it already keeps the check\'s failure)',
  why: '`npm test | tail` reports tail\'s exit code (0), so a failed check looks green (Goops 2026-10-17 shipped a kit change that broke the kit\'s own rules that way). Refusing it cost 215 retries in 17 days, 96 % of them harmless (audit 2026-11, F185) — so the hook now fixes the line itself (Claude Code 2.1.318 lets a hook rewrite a command: proved live 2026-11-04). PowerShell 7 already exits with the check\'s code and stops `&&` when a piped check fails (tried 2026-11-04)',
  on: true,
  mode: 'action',
  tests: 'guard-edits',
  // returns the rewritten command (guard-edits passes it to Claude Code as updatedInput), or nothing
  check({ tool, command, unquoted }) {
    if (tool !== 'Bash' || /pipefail|PIPESTATUS/.test(command)) return undefined
    for (const segment of unquoted.split(/&&|\|\||;|\n/)) { // "a | tail" stays one segment
      const [first, ...piped] = segment.split(/\|(?!\|)/)
      if (piped.length && CHECK.test(first) && HIDES.test(piped[0])) return `set -o pipefail; ${command}`
    }
    return undefined
  },
}
