# PRD → PROJECT.md Bridge

**Purpose:** When `.planning/PRD.md` exists but `.planning/PROJECT.md` doesn't, auto-generate PROJECT.md from the PRD. This bridges BMUZ's Double Diamond output into GSD's working document.

**When to use:** Called by `/gsd:create-roadmap` or `/gsd:new-project` when they detect a PRD without a PROJECT.md.

---

## Detection

```bash
PRD_EXISTS=$([ -f .planning/PRD.md ] && echo "yes" || echo "no")
PROJECT_EXISTS=$([ -f .planning/PROJECT.md ] && echo "yes" || echo "no")
```

**If PRD exists and PROJECT does not:** Run this bridge.
**If both exist:** Skip — PROJECT.md is already there.
**If neither exists:** Skip — no BMUZ work to bridge from.

---

## Extraction Mapping

Read `.planning/PRD.md` and extract these fields:

| PROJECT.md Section | Extract From PRD |
|---|---|
| **What This Is** | Section 1 (Vision & Goals) — first 2-3 sentences describing the game |
| **Core Value** | Section 1 (Vision & Goals) — the core experience, feeling, or "one thing that matters" |
| **Requirements — Active** | Section 4 (Core Gameplay) + Section 5 (Game Systems) — key features as checklist |
| **Requirements — Out of Scope** | Any "not in v1" / "out of scope" / "future" items mentioned anywhere |
| **Context** | Section 2 (Audience & Personas) + Section 3 (Design Principles) — summarize briefly |
| **Constraints** | Section 7 (Technical Architecture) — stack, platform, deployment targets |
| **Key Decisions** | Section 7 (Key Technical Decisions table) — copy directly if present |

---

## Generation Steps

1. **Read the full PRD.md**

2. **Extract each field** using the mapping above. If a PRD section is missing or empty, use a sensible placeholder:
   - Missing Vision: Use the PRD title/header
   - Missing Core Value: "To be refined during development"
   - Missing Requirements: Extract from milestones section if available

3. **Write `.planning/PROJECT.md`** using the standard template:

```markdown
# [Project Name from PRD]

## What This Is

[Extracted from PRD Section 1 — 2-3 sentences]

## Core Value

[Extracted from PRD Section 1 — the ONE thing that matters]

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] [Feature/requirement from PRD sections 4-5]
- [ ] [Feature/requirement from PRD sections 4-5]
- [ ] [Feature/requirement from PRD sections 4-5]
[... all key features]

### Out of Scope

- [Exclusion] — [reason from PRD]
[... any out-of-scope items mentioned in PRD]

## Context

[Summarized from PRD sections 2-3: target audience, design principles, key insights from discovery/define phases]

**Source:** Auto-generated from `.planning/PRD.md` (Double Diamond complete)

## Constraints

- **Tech Stack**: [From PRD Section 7]
- **Platform**: [From PRD Section 7]
[... other constraints from PRD]

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
[Copy from PRD Section 7 Key Technical Decisions if present]

---
*Last updated: [today's date] after PRD bridge (auto-generated from Double Diamond)*
```

4. **Show one-line notice** (not a question):
   ```
   Generated PROJECT.md from PRD.md (Double Diamond → GSD bridge)
   ```

5. **Do NOT ask the user to review.** The PRD was already reviewed during `/game-deliver`. Trust the source.

---

## Mode & Depth

After generating PROJECT.md, the calling command still needs to ask about **mode** and **depth** — these are GSD-specific settings not captured in the PRD:

Use AskUserQuestion:
- Mode: Interactive vs YOLO
- Depth: Quick / Standard / Comprehensive

Write to `.planning/config.json`.

---

## Rules

1. **Never re-ask questions the PRD already answers.** The whole point is to skip redundant questioning.
2. **Active requirements should be comprehensive.** Extract ALL features from PRD sections 4-5, not just the first 3.
3. **Preserve PRD as source of truth.** PROJECT.md is a working distillation — PRD.md remains the full design document.
4. **Add the "Source" note in Context section.** This tells future sessions that PROJECT.md was auto-generated and PRD.md has more detail.
