// stop-cleanup — tidy up at the end of every turn: Playwright's leftover folder goes (Stop).
// The rules live in rules/stop-cleanup/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't
// load, fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('stop-cleanup')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('stop-cleanup', error)))
