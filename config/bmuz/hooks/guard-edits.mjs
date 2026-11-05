// guard-edits — edit and command habits that bit us, refused before they happen (PreToolUse Bash|PowerShell|Edit|Write…).
// The rules live in rules/guard-edits/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't
// load, fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('guard-edits')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('guard-edits', error)))
