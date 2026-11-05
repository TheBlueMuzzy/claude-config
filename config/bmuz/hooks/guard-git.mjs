// guard-git — Muzzy's git "never" rules and the commit checks, before a shell command runs (PreToolUse Bash|PowerShell).
// The rules live in rules/guard-git/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't load,
// fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('guard-git')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('guard-git', error)))
