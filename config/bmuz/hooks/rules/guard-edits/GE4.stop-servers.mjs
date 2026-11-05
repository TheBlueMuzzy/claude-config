import { commands } from '../../lib.mjs'

// the kill tool has to BE the command (review: `grep -rn taskkill …` and `Get-Help Stop-Process` were refused for only naming it)
const KILLERS = new Set(['taskkill', 'taskkill.exe', 'stop-process', 'spps', 'kill-port', 'pkill', 'killall'])

export default {
  id: 'GE4',
  name: 'shell.stop-servers-script',
  what: 'Refuses stopping a local server with taskkill / Stop-Process / kill-port / pkill — use `scripts/stop-servers.mjs <port|name>`',
  why: 'Killing only the process on the port lets wrangler start a new one (Glyphtender sprint 25: 4 leftover servers) (F80)',
  on: true,
  mode: 'block',
  tests: 'guard-edits',
  check({ command, cwd, unquoted }, { deny }) {
    const killsByHand = commands(command, cwd).some(({ words }) => {
      const [first = '', second = ''] = words.map(w => w.toLowerCase())
      return KILLERS.has(first) || (first === 'npx' && second === 'kill-port') || (first === 'fuser' && words.includes('-k'))
    }) || /\|\s*(Stop-Process|spps)\b|\bkill\b[^\n;&|]*\$\(\s*lsof\b|\blsof\b[^\n;&]*\|\s*xargs\s+kill\b/i.test(unquoted)
    if (killsByHand) {
      deny('Blocked: stop local servers with `node ~/.claude/config/bmuz/scripts/stop-servers.mjs <port|name>` — it ends the whole process tree and says when the port is free. Killing only the process on the port lets wrangler start a new one (Glyphtender sprint 25: 4 leftover servers), and it never touches Claude, a shell or an editor. A background task you started yourself → stop it with the TaskStop tool.')
    }
  },
}
