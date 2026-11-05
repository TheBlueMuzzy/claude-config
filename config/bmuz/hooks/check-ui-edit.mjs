// check-ui-edit — UI kit rules checked the moment a UI file changes (PostToolUse Edit|Write|MultiEdit).
// The rules live in rules/check-ui-edit/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't
// load, fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('check-ui-edit')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('check-ui-edit', error)))
