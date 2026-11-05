import { existsSync } from 'node:fs'
import { join } from 'node:path'

const MODULE_COPIES = [ // folder in a game → framework module
  ['src/ui/kit', 'ui-kit'], ['src/devkit', 'devkit'], ['src/ai/kit', 'ai'],
  ['src/audio', 'audio'], ['src/rooms', 'rooms'], ['src/table', 'table'],
]

export default {
  id: 'GE1',
  name: 'edit.no-kit-copy',
  what: 'Refuses editing a game\'s copy of a framework module (src/ui/kit/, src/devkit/, src/audio/… or any src/<x>/ or src/<x>/kit/ holding a VERSION file) — by the edit tools or a shell write',
  why: 'A copy edited in the game is lost at the next install and never reaches the other games — change it in the framework, then reinstall (F67)',
  on: true,
  mode: 'block',
  tests: 'guard-edits',
  check({ path }, { deny }) {
    if (!path) return
    const normal = path.split('\\').join('/')
    for (const [folder, module] of MODULE_COPIES) {
      const at = normal.indexOf(`/${folder}/`)
      if (at < 0) continue
      const game = normal.slice(0, at)
      if (!existsSync(join(game, folder, 'VERSION'))) continue // not an installed copy
      if (/\/framework\/[^/]+\/kit\//.test(normal)) continue // the framework's own source
      const rest = normal.slice(at + folder.length + 2)
      denyKitCopy(folder, rest, module, deny)
    }
    // any other module copy (one born from the extraction queue, F114, or newer than this list): a src/<x>/ or
    // src/<x>/kit/ folder holding a VERSION file — the same rule the Dev Kit's gameCode uses (F112)
    if (/\/framework\/[^/]+\/kit\//.test(normal) || /\/node_modules\//.test(normal)) return
    for (const m of normal.matchAll(/\/src\/([^/]+)\//g)) {
      const game = normal.slice(0, m.index)
      for (const folder of [`src/${m[1]}`, `src/${m[1]}/kit`]) {
        if (!normal.startsWith(`${game}/${folder}/`) || !existsSync(join(game, folder, 'VERSION'))) continue
        denyKitCopy(folder, normal.slice(game.length + folder.length + 2), m[1], deny)
      }
    }
  },
}

function denyKitCopy(folder, rest, module, deny) {
  deny(`Blocked: ${folder}/${rest} is this game's COPY of the framework's ${module} module (it has a VERSION file) — an edit here is lost at the next install and never reaches the other games. Change ~/Documents/dev/framework/${module}/kit/${rest} instead (run its tests + checks there), then reinstall it into the game with install-module.mjs (--dry-run first).`)
}
