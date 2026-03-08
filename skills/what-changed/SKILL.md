---
name: what-changed
description: Generate a plain-English summary of what changed in the game since last save point. Explains changes in terms of what the PLAYER sees, not what code was modified. Use after a coding session or before testing.
allowed-tools: Read, Grep, Glob, Bash
---

# What Changed (Plain English)

Summarize changes for: $ARGUMENTS

## What This Does

Looks at everything that changed since the last git commit (or specified point)
and explains it in terms a non-coder can understand. Not "modified 3 files" —
instead: "Enemies now move faster at rank 10+."

## Process

### Step 1: Get the Diff
```bash
# Changes since last commit:
git diff HEAD
# Or since a specific point:
git diff [commit-hash]
# Include new files:
git diff HEAD --stat && git status --short
```

### Step 2: Categorize Changes
For each changed file, determine what category it falls into:
- **Gameplay**: Player mechanics, enemy behavior, scoring, physics
- **Visual**: Colors, animations, layouts, UI elements, art assets
- **Audio**: Sound effects, music, volume
- **Content**: Text, strings, tutorial messages, flavor text
- **Balance**: Numbers that affect difficulty (speeds, damage, spawn rates, etc.)
- **Bug Fix**: Something that was broken now works correctly
- **Technical**: Internal changes that don't affect what the player sees

### Step 3: Write Plain English Summary
Format:
```
WHAT CHANGED
============

What Players Will Notice:
  1. [Most visible change first — in terms of player experience]
  2. [Next change]
  3. [etc.]

Balance Changes:
  - [Value] changed from [old] to [new] — this means [effect on gameplay]

Bug Fixes:
  - [What was broken] now works correctly

Behind the Scenes (technical — players won't notice):
  - [Internal improvements, refactoring, etc.]

Files touched: [list]
```

### Step 4: Suggest Testing
Based on what changed, suggest what to manually test:
```
YOU SHOULD TEST:
  1. [Specific thing to try] — should [expected behavior]
  2. [Another thing] — should [expected behavior]
```

## Example Output
```
WHAT CHANGED
============

What Players Will Notice:
  1. Power-ups now glow when you're near them (within 50 pixels)
  2. The score counter animates when you earn points (bouncy effect)
  3. Enemy spawning starts slower and ramps up faster after wave 5

Balance Changes:
  - Enemy base speed: 2 → 3 (enemies are slightly faster overall)
  - Power-up spawn rate: every 30s → every 20s (more power-ups to compensate)
  - Score per enemy: 100 → 150

Bug Fixes:
  - Enemies no longer freeze at the right edge of the screen
  - Score display no longer overlaps the health bar on narrow phones

Behind the Scenes:
  - Reorganized the enemy code into smaller pieces (no gameplay effect)

YOU SHOULD TEST:
  1. Walk near a power-up — should see a glow effect
  2. Kill an enemy — score should bounce/animate when it increases
  3. Play past wave 5 — enemies should get noticeably faster
  4. Check on a phone-sized screen — score and health bar shouldn't overlap
```
