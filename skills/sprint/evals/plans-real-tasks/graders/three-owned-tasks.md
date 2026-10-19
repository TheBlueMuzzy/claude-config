---
type: regex
target: { source: file, path: .planning/SPRINT.md }
pattern: '^- \[ \] (🤖|🙋) ?\d+[a-z]?\. .*\r?\n- \[ \] (🤖|🙋) ?\d+[a-z]?\. .*\r?\n- \[ \] (🤖|🙋) ?\d+[a-z]?\. '
flags: mu
---
At least three task lines in a row, each "- [ ] 🤖 1. …" or "- [ ] 🙋 2. …" (owner + number). Windows line endings allowed.
