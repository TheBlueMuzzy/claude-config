---
name: task-then-card
description: "/develop does the next task (hover lift reads the tuning file), ticks it, commits an F02 commit on the work branch, and hands back with the hand-off card"
runs: 1
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

/develop:develop — just do task 2 (hover lifts the card), nothing else. No dev server or screenshots needed for this one: there's no UI yet, a unit-level change is enough. Then hand it back.
