---
name: report-format
description: /bug turns a plain-words report into a BUGS.md entry (ID · P-rating · status, steps/expected/actual) with the Open count right, and doesn't drop the current feature to fix a minor bug
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/bug on my phone, with 7 cards the two at the ends overlap the screen edge a little. it still works, just looks a bit off.
