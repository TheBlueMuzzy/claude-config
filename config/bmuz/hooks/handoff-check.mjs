// handoff-check — every piece of work is handed to Muzzy the same way: the hand-off card (Stop).
// The rules live in rules/handoff-check/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't
// load, fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('handoff-check')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('handoff-check', error)))
