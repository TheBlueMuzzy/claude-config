// sketch-lint — a sketch keeps its sketch kit (PostToolUse Edit|Write|MultiEdit; `node sketch-lint.mjs <file>` by hand).
// The rules live in rules/sketch-lint/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't
// load, fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('sketch-lint')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('sketch-lint', error)))
