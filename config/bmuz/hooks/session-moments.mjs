// session-moments — reminders at the right moment: stopping, a decision question, the context checkpoint
// (UserPromptSubmit, and PostToolUse Bash|PowerShell after commits).
// The rules live in rules/session-moments/ (one file each); runner.mjs runs them (F184). If the runner or lib.mjs can't
// load, fallback/broken.mjs says so loudly instead of letting everything through.
import('./runner.mjs').then(runner => runner.main('session-moments')).catch(error => import('./fallback/broken.mjs').then(fallback => fallback.broken('session-moments', error)))
