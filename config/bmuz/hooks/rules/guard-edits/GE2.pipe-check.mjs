// the command BEFORE the pipe must itself be a check (`grep -rn vitest src | head` is just a search)
const CHECK = /^\s*(\w+=\S*\s+)*(npm\s+(run\s+)?(test|check[\w:-]*|lint|typecheck|build|e2e[\w:-]*|smoke)\b|npx\s+(tsc|eslint|vitest|playwright)\b|(tsc|eslint|vitest)\b|node\s+\S*(e2e|check|test)\S*)/
const HIDES = /^\s*(tail|head|grep|Select-Object|Select-String|findstr|sort|wc|tee|more|less|Out-String)\b/i

export default {
  id: 'GE2',
  name: 'shell.pipefail',
  what: 'Refuses piping a check (npm test, check:*, tsc, eslint, vitest…) into tail / grep / Select-Object… unless the line sets pipefail',
  why: '`npm test | tail` reports tail\'s exit code (0), so a failed check looks green (Goops 2026-10-17 shipped a kit change that broke the kit\'s own rules that way)',
  on: true,
  mode: 'block',
  tests: 'guard-edits',
  check({ tool, command, unquoted }, { deny }) {
    for (const segment of unquoted.split(/&&|\|\||;|\n/)) { // "a | tail" stays one segment
      const [first, ...piped] = segment.split(/\|(?!\|)/)
      if (piped.length && CHECK.test(first) && HIDES.test(piped[0]) && !/pipefail|PIPESTATUS/.test(command)) {
        deny(tool === 'PowerShell'
          ? 'Blocked: this pipes a check into another command, so $LASTEXITCODE reads the last command, not the check — a failed check can look green. Send the output to a file and read the check\'s own code: `npm test *> out.txt; $code = $LASTEXITCODE; Get-Content out.txt -Tail 30; "exit $code"`.'
          : 'Blocked: this pipes a check into another command, so the exit code is the last command\'s, not the check\'s — a failed check can look green. Start the line with `set -o pipefail;` (then a failure still shows), or run it to a file: `npm test > out.txt 2>&1; echo "exit $?"; tail -30 out.txt`.')
      }
    }
  },
}
