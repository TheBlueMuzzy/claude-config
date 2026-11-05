import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { readTurn, git, gitCalls, STOPPING } from '../../lib.mjs'

export default {
  id: 'SU1',
  name: 'save.before-leaving',
  what: 'Muzzy\'s latest message says he\'s stopping ("going to bed", "switching to the laptop", "done for now"…) and the project — the session\'s folder, or any repo this turn worked in — has uncommitted files, commits GitHub doesn\'t have, or a branch never pushed → sent back to /save (up to 3 times, then it lets go: an offline push mustn\'t trap the session). A repo with no remote only needs committing',
  why: 'It was only a reminder; now walking away with unsaved work can\'t happen quietly (F80)',
  on: true,
  mode: 'block',
  tests: 'stop-unsaved',
  // returns the send-back text, or nothing
  check(_, { input }) {
    if (!input.transcript_path || !existsSync(input.transcript_path)) return
    const turn = readTurn(input.transcript_path)
    if (!STOPPING.test(turn.muzzySaid)) return

    // The repos to check: the session's folder, plus every repo this turn edited a file in or ran git in.
    const roots = new Set()
    const add = (dir) => {
      const top = dir && git(dir, 'rev-parse', '--show-toplevel')
      if (top) roots.add(resolve(top))
    }
    add(input.cwd); add(process.env.CLAUDE_PROJECT_DIR)
    for (const tool of turn.tools) {
      if (tool.input.file_path) add(resolve(tool.input.file_path, '..'))
      if (tool.name === 'Bash' || tool.name === 'PowerShell') for (const call of gitCalls(tool.input.command || '', tool.cwd)) add(call.dir)
    }

    const problems = []
    for (const root of roots) {
      if (/[\\/]\.claude[\\/]worktrees[\\/]/.test(root)) continue // a helper's workspace — its work reaches the project by merge
      const name = root.split(/[\\/]/).pop()
      const changed = (git(root, 'status', '--porcelain') || '').split('\n').filter(Boolean).length
      if (changed) problems.push(`${name}: ${changed} file(s) changed but not committed`)
      if (!git(root, 'remote')) continue // no GitHub backup: committed is as safe as it gets
      const branch = git(root, 'rev-parse', '--abbrev-ref', 'HEAD')
      if (!branch || branch === 'HEAD') continue // detached (mid-rebase etc.) — not a /save moment
      const upstream = git(root, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}')
      if (!upstream) { problems.push(`${name}: branch ${branch} has never been pushed`); continue }
      const ahead = parseInt(git(root, 'rev-list', '--count', `${upstream}..HEAD`) || '0', 10)
      if (ahead) problems.push(`${name}: ${ahead} commit(s) on ${branch} that GitHub doesn't have yet`)
    }

    return problems.length && `Muzzy said they're stopping or switching machines, but work isn't saved:\n- ${problems.join('\n- ')}\nRun /save now (node ~/.claude/config/bmuz/scripts/save.mjs "<summary>" after updating STATE) and confirm "pushed — safe to switch machines." If the push can't work (offline, GitHub down), say so plainly: it's NOT safe to switch machines.`
  },
}
