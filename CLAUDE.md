# Muzzy's Global Preferences

## About Me
- Artist and designer, not a professional engineer
- Good with logic, not abstract coding patterns
- Prefers **human-readable code** over clever abstractions
- Values **targeted, minimal changes** — don't refactor beyond what's asked
- Always provide **terminal commands ready to copy/paste**

## My Tech Stack
- **Web Games**: React + TypeScript + Vite + Three.js (R3F)
- **3D Games**: Unity C#
- **Design**: Double Diamond methodology, MDA framework, PRD-driven development

## New Project Auto-Setup
When working in a project directory that does NOT have `.claude/settings.json`:
1. **Ask Muzzy**: "This project doesn't have the lossless pipeline set up yet. Want me to scaffold it?"
2. If yes, run `/new-game` to set everything up

## Skill Awareness
Claude has 28+ custom skills. When Muzzy talks about something a skill handles — especially if he seems to be doing it manually — briefly mention it:
> "By the way, `/skill-name` can handle that — want me to run it?"
One line, no lectures. Don't suggest during active plan execution.
**Double Diamond flow:** `/game-discover` → `/game-define` → `/game-design` → `/game-deliver` → `/gsd:create-roadmap`

## Working Style
- Use GSD plugin for project management when available
- Delegate exploration/research to subagents (keep main context clean)
- Save early, save often — context can compact at any time
- Feature branches for all work, merge only when deploying

## Code Quality
- **Verify your work** — run tests, check output, confirm behavior. Never assume code works without checking.
- **Fix root causes, not symptoms** — no band-aids, no workarounds that add complexity
- **Check if logic already exists** before writing new code — avoid duplication
- **R3F**: NEVER use React state for per-frame updates. Mutate refs in useFrame.

## Plain English Errors
When errors occur, ALWAYS: (1) translate to plain English, (2) explain why in non-technical terms, (3) offer to fix it. Never show raw stack traces without translation.

## BMUZ + GSD Integration
- **BMUZ 4D** = "What are we building?" → outputs `.planning/PRD.md`
- **GSD** = "How do we build it?" → reads PRD, manages execution via PROJECT.md + ROADMAP
- PRD is the shared source of truth — don't duplicate its content in PROJECT.md

## Lossless Pipeline (MANDATORY)

### GSD Context Persistence
When a GSD plan is active (`.planning/STATE.md` shows a phase in progress):
- **Show current context** in responses: "Phase X, Plan Y, Task Z"
- **Don't go freeform** — always know where you are in the workflow
- After EVERY code change, update STATE.md (what changed, current status, next steps)
- If you don't know the current GSD state, read STATE.md before responding

### Vision Capture
When the user mentions ideas **not part of the current task**:
- Silently append to `.planning/VISION.md` with date and context
- Mention "Noted in VISION.md" briefly — don't interrupt the flow

### Auto Documentation
After every git commit: update STATE.md with what changed, current status, decisions, next steps. This is NOT optional.

## Problem-Solving Discipline
**3-Strike Rule:** After 3 failed attempts at the same approach, STOP.
- State: "This approach isn't working. Reassessing."
- Consider: simpler path? Let the environment solve it?
- Watch for: adding complexity to fix complexity, each fix creating a new problem

**Reflection on mistakes:** When a bug or mistake reveals a pattern Claude should avoid, Muzzy may say "remember this." Abstract the learning into a general rule and add it to this file or the project's CLAUDE.md.

## Versioning
Projects with `version.json` use X.Y.Z.B versioning — see `~/.claude/references/versioning.md`

## References
- **Phone testing**: `~/.claude/references/phone-testing.md`
- **Config sync**: `~/.claude/references/config-sync.md`
- **Quick-start guide**: `~/.claude/QUICKSTART.md`
- **Full pipeline reference**: `~/.claude/PIPELINE.md`
