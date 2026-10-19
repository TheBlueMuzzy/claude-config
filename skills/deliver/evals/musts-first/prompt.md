---
name: musts-first
description: /deliver for the alpha release runs the musts check first, names the open must (F02), and stops to ask instead of merging or releasing
runs: 1
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/deliver:deliver — let's release the alpha.
