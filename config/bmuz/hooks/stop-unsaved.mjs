// stop-unsaved — nothing left unpushed when Muzzy walks away (Stop).
// The rules live in rules/stop-unsaved/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't
// load, fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('stop-unsaved')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('stop-unsaved', error)))
