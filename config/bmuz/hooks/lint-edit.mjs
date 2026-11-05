// lint-edit — the project's own ESLint on the one code file Claude just edited (PostToolUse Edit|Write|MultiEdit).
// The rules live in rules/lint-edit/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't load,
// fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('lint-edit')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('lint-edit', error)))
