---
name: safe-after-push
description: /save commits and pushes through save.mjs and only then says it's safe to switch machines
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/save — I'm switching machines. This session: widened the card spread from 30 to 34.
