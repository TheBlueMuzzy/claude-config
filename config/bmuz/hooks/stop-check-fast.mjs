// stop-check-fast — don't end a turn on broken code: check:fast when the code changed since it last passed (Stop).
// The rules live in rules/stop-check-fast/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't
// load, fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('stop-check-fast')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('stop-check-fast', error)))
