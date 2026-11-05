// live-push — nothing goes live without a smoke pass, and never with an open P0 (PreToolUse Bash|PowerShell).
// The rules live in rules/live-push/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't load,
// fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('live-push')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('live-push', error)))
