// rule-kind — every new rule line says how it happens, ①②③ (PostToolUse Edit|Write|MultiEdit; `--all` lists them).
// The rules live in rules/rule-kind/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't load,
// fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('rule-kind')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('rule-kind', error)))
