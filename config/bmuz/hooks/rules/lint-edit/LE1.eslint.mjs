import { eslintErrors, errorLines } from './_lint.mjs'

// What can't wait for the end of the turn: the file doesn't parse, or a name in it doesn't exist
const NOW = (m) => m.fatal || !m.ruleId || m.ruleId === 'no-undef'

export default {
  id: 'LE1',
  name: 'lint.syntax-now',
  what: 'Runs the project\'s own ESLint on just the edited file (~1–2 s) and tells Claude at once only what can\'t wait: a parse error or an undefined name. Every other lint error (unused, prefer-const…) is said once at the end of the turn (LE3). In the framework nothing is skipped; a game keeps skipping its kit copies',
  why: 'Framework code was never linted: games skip their kit copies, so Dev Kit 0.8.0\'s errors only showed up inside Glyphtender (F70). Narrowed in F185: 326 of its 724 firings (audit 2026-11) were an import added before its use — "unused" until the very next edit',
  on: true,
  mode: 'block',
  tests: 'lint-edit',
  check({ root, path, where, eslint }, { tell }) {
    const errors = eslintErrors(root, eslint, [path]).filter(NOW).map(m => ({ ...m, where }))
    if (!errors.length) return
    tell(`ESLint found ${errors.length} error${errors.length === 1 ? '' : 's'} in ${where} that can't wait (it doesn't parse, or uses a name that doesn't exist) — fix now; the other lint rules are checked once when the turn ends:\n${errorLines(errors)}`)
  },
}
