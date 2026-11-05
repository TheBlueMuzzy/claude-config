import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, relative, isAbsolute } from 'node:path'
import { toDir, commands } from '../../lib.mjs'

export default {
  id: 'GE5',
  name: 'shell.no-home-clutter',
  what: 'Refuses a new folder or loose file straight in the home folder (mkdir, cp, mv, New-Item, git clone, git worktree add, Write) — throwaway copies go in ~/Documents/dev/.scratch/',
  why: '1 GB piled up in ~/spike and ~/ppp-proof (2026-10-19) — cleanup.sh clears .scratch, nothing clears the home folder (F80)',
  on: true,
  rare: true, // a guard: silent because the mistake rarely happens (removal pass skips it — F187)
  mode: 'block',
  tests: 'guard-edits',
  // an edit tool's file ({ path, what }), or a shell line's commands ({ command, cwd })
  check({ path, what, command, cwd }, { deny }) {
    if (path) return refuseHomeClutter(path, what, deny)
    for (const { dir, words } of commands(command, cwd)) {
      const first = words[0].toLowerCase()
      const args = words.slice(1).filter(w => !w.startsWith('-'))
      let targets = []
      if (first === 'mkdir' || first === 'md') targets = args
      else if (first === 'cp' || first === 'mv' || first === 'copy-item' || first === 'move-item') targets = args.slice(-1)
      else if (first === 'new-item' || first === 'ni') targets = args.filter(a => !/^(directory|file)$/i.test(a))
      else if (/^git(\.exe)?$/.test(first) && args[0] === 'clone' && args.length >= 3) targets = [args[2]]
      else if (/^git(\.exe)?$/.test(first) && args[0] === 'worktree' && args[1] === 'add' && args[2]) targets = [args[2]]
      for (const t of targets) if (!t.startsWith('$')) refuseHomeClutter(toDir(t, dir), first === 'mkdir' || first === 'md' ? 'a new folder' : 'a copy', deny)
    }
  },
}

// A new folder or loose file straight in the home folder (not a dot-folder like ~/.claude) → refused, pointing to
// ~/Documents/dev/.scratch/. Folders that already exist (Documents, Desktop, AppData…) are fine.
function refuseHomeClutter(path, what, deny) {
  const home = process.env.BMUZ_HOME || homedir() // (tests use their own folder)
  const rel = relative(home, path)
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) return
  const top = rel.split(/[\\/]/)[0]
  if (top.startsWith('.') || existsSync(join(home, top))) return
  deny(`Blocked: this makes ${what} straight in the home folder (~/${top}). Throwaway copies and proof shots go in \`~/Documents/dev/.scratch/<project>-<what>/\` — cleanup.sh (run by every /save) clears entries there after 24 h; nothing ever clears the home folder (1 GB piled up in ~/spike and ~/ppp-proof, 2026-10-19). Real projects go under ~/Documents/dev/.`)
}
