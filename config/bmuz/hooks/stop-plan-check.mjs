// stop-plan-check — the plan keeps up with the work: sprint lines, planner republished, look-backs, saves (Stop).
// The rules live in rules/stop-plan-check/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't
// load, fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('stop-plan-check')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('stop-plan-check', error)))
