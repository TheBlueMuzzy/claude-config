// plan-lint — plan files stay well-formed (PostToolUse Edit|Write|MultiEdit; `node plan-lint.mjs <projectDir>` by hand).
// The rules live in rules/plan-lint/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't load,
// fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('plan-lint')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('plan-lint', error)))
