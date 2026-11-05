import { toDir, commands } from '../../lib.mjs'
import { processes, shortCommand } from '../../../templates/ports.mjs'

export default {
  id: 'GE9',
  name: 'shell.npm-install-busy',
  what: 'Refuses `npm ci` / `npm install` in a folder whose node_modules a running process (a dev server) uses — names it and `stop-servers.mjs`. Other folders, `-g`, a stopped server pass',
  why: 'On Windows the install can\'t replace files a server holds: it stopped half-way and left ui-kit with NO packages, twice in one night (framework sprint 41)',
  on: true,
  mode: 'block',
  tests: 'guard-edits',
  check({ command, cwd }, { deny }) {
    const installs = commands(command, cwd).filter(({ words }) => {
      const [first = '', second = ''] = words.map(w => w.toLowerCase())
      return first === 'npm' && /^(ci|install|i|clean-install|install-clean)$/.test(second) && !words.some(w => /^(-g|--global)$/.test(w))
    })
    if (!installs.length) return
    const norm = (p) => toDir(p, cwd).replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
    let running = []
    try { running = processes({ tries: 1 }) } catch { running = [] } // can't list them → don't block the install
    for (const { dir } of installs) {
      const packages = `${norm(dir)}/node_modules/`
      const user = running.find(p => p.pid !== process.pid && p.cmd.replace(/\\/g, '/').toLowerCase().includes(packages))
      if (user) deny(`Blocked: a running process uses this folder's packages (${user.pid}: ${shortCommand(user.cmd)}) — on Windows \`npm ${installs[0].words[1]}\` can't replace files it holds, stops half-way and leaves NO packages there (every check then fails). Stop it first with \`node ~/.claude/config/bmuz/scripts/stop-servers.mjs <its port or name>\` (TaskStop can leave a server started through npx running), install, then start it again.`)
    }
  },
}
