---
name: gsd:create-roadmap
description: Create roadmap with phases for the project
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
  - Glob
---

<objective>
Create project roadmap with phase breakdown.

Roadmaps define what work happens in what order. Can run after /gsd:new-project OR directly after the BMUZ Double Diamond (/game-deliver). If a PRD exists without PROJECT.md, this command auto-bridges the gap.
</objective>

<execution_context>
@~/.claude/get-shit-done/lib/resolve-project.md
@~/.claude/get-shit-done/lib/prd-to-project.md
@~/.claude/get-shit-done/workflows/create-roadmap.md
@~/.claude/get-shit-done/templates/roadmap.md
@~/.claude/get-shit-done/templates/state.md
@~/.claude/get-shit-done/templates/project.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/config.json
</context>

<process>

<step name="resolve_project">
**Resolve project directory** — follow `~/.claude/get-shit-done/lib/resolve-project.md`.
After resolution, re-read `.planning/PROJECT.md` and `.planning/config.json` if they weren't loaded from `<context>`.
</step>

<step name="validate_or_bridge">
Check what exists:

```bash
echo "PROJECT_MD=$([ -f .planning/PROJECT.md ] && echo 'yes' || echo 'no')"
echo "PRD_MD=$([ -f .planning/PRD.md ] && echo 'yes' || echo 'no')"
echo "CONFIG_JSON=$([ -f .planning/config.json ] && echo 'yes' || echo 'no')"
```

**Case 1: PROJECT.md exists** → Continue normally (skip to check_existing step).

**Case 2: No PROJECT.md, but PRD.md exists** → BMUZ Double Diamond completed, bridge needed.
Follow `~/.claude/get-shit-done/lib/prd-to-project.md`:
1. Read `.planning/PRD.md`
2. Auto-generate `.planning/PROJECT.md` from PRD sections (NO questions about what to build)
3. Show: `Generated PROJECT.md from PRD.md (Double Diamond → GSD bridge)`
4. If no `config.json`: ask mode (Interactive/YOLO) and depth (Quick/Standard/Comprehensive), write config.json
5. Continue to check_existing step.

**Case 3: Neither exists** → No project context at all.
```
No PROJECT.md or PRD.md found.

Start with one of:
- `/game-discover` — explore the game concept (Double Diamond)
- `/gsd:new-project` — quick project setup (skip design process)
```
Exit.
</step>

<step name="check_existing">
Check if roadmap already exists:

```bash
[ -f .planning/ROADMAP.md ] && echo "ROADMAP_EXISTS" || echo "NO_ROADMAP"
```

**If ROADMAP_EXISTS:**
Use AskUserQuestion:
- header: "Roadmap exists"
- question: "A roadmap already exists. What would you like to do?"
- options:
  - "View existing" - Show current roadmap
  - "Replace" - Create new roadmap (will overwrite)
  - "Cancel" - Keep existing roadmap

If "View existing": `cat .planning/ROADMAP.md` and exit
If "Cancel": Exit
If "Replace": Continue with workflow
</step>

<step name="create_roadmap">
Follow the create-roadmap.md workflow starting from detect_domain step.

The workflow handles:
- Domain expertise detection
- Phase identification
- Research flags for each phase
- Confirmation gates (respecting config mode)
- ROADMAP.md creation
- STATE.md initialization
- Phase directory creation
- Git commit
</step>

<step name="done">
```
Roadmap created:
- Roadmap: .planning/ROADMAP.md
- State: .planning/STATE.md
- [N] phases defined

---

## ▶ Next Up

**Phase 1: [Name]** — [Goal from ROADMAP.md]

`/gsd:plan-phase 1`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/gsd:discuss-phase 1` — gather context first
- `/gsd:research-phase 1` — investigate unknowns
- Review roadmap

---
```
</step>

</process>

<output>
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/XX-name/` directories
</output>

<success_criteria>
- [ ] PROJECT.md validated
- [ ] ROADMAP.md created with phases
- [ ] STATE.md initialized
- [ ] Phase directories created
- [ ] Changes committed
</success_criteria>
