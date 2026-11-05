// commit-typecheck — no commit with a type error; a `Fix Bnn:` commit needs a green suite (PreToolUse Bash|PowerShell).
// The rules live in rules/commit-typecheck/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't
// load, fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('commit-typecheck')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('commit-typecheck', error)))
