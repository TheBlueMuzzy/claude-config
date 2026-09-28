---
name: prioritize
description: Prioritize a list of features or tasks using Kano + MoSCoW + Action Priority Matrix. Use when deciding what to build next or scoping a milestone.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Feature Prioritization

Prioritize: $ARGUMENTS

If no feature list provided, check `.planning/VISION.md`, `.planning/GDD.md` (Future Ideas section), and ask Muzzy what's on his mind.

## Step 1: Gather Candidates

List all candidate features/tasks. For each, write a one-line description of what the player would see.

## Step 2: Kano Classification

Categorize each feature:

| Feature | Kano Type | Why |
|---------|-----------|-----|
| | **Basic** — Expected. Players upset if missing, neutral if present. | |
| | **Performance** — More = better. Linear satisfaction. | |
| | **Excitement** — Unexpected delight. Not missed if absent, loved if present. | |
| | **Indifferent** — Players don't care either way. | |

**Key insight:** Don't spend weeks perfecting a Basic feature — ship it and move to Excitement features that differentiate your game.

## Step 3: MoSCoW for This Release

Draw the line. For the scope being discussed (milestone, sprint, whatever):

### Must Have (ship-blocking)
- ...

### Should Have (important, not fatal)
- ...

### Could Have (nice-to-have)
- ...

### Won't Have (explicitly out of scope — note for later)
- ...

## Step 4: Action Priority Matrix

For features that made Must/Should, plot effort vs impact:

```
         HIGH IMPACT
              |
  Quick Wins  |  Major Projects
  (do first)  |  (plan carefully)
              |
 -------------|---------------
              |
  Fill-Ins    |  Thankless Tasks
  (when idle) |  (kill or redesign)
              |
         LOW IMPACT
```

| Feature | Impact | Effort | Quadrant |
|---------|--------|--------|----------|
| | H/L | H/L | |

## Output: Recommended Order

Based on all three lenses, produce a ranked list:

1. **[Feature]** — [Kano type], [MoSCoW tier], [quadrant]. Do this first because...
2. **[Feature]** — ...
3. ...

### Feeds Into
- `/roadmap` — puts the ranked features into milestones; `/sprint` pulls the top ready ones
- `.planning/VISION.md` — park Won't Have items here
