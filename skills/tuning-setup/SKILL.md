---
name: tuning-setup
description: Extract hardcoded game values into a live-editable config file with optional runtime sliders (Leva/tweakpane). Use when you want to make game values tweakable without touching code — speeds, damage, spawn rates, colors, timings, etc.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Live Tuning Setup

Make game values tweakable for: $ARGUMENTS

## What This Does

Finds hardcoded "magic numbers" in your game code and moves them into an editable
file in `content/tuning/`. You (or testers) can change values by editing the file
OR by using runtime sliders in the browser. Both paths hit the same file.

## Process

### Step 1: Scan for Tweakable Values
Search the codebase for:
- Numeric literals in game logic (speeds, forces, timings, spawn rates, probabilities)
- Color values (hex codes, rgb)
- String constants that affect gameplay (difficulty labels, tier names)
- Duration/timing values
- Size/dimension values

**Skip:** Array indices, loop counters, mathematical constants (PI, etc.), port numbers.

### Step 2: Categorize and Name
Group found values into categories:
```json
{
  "player": {
    "moveSpeed": 5,
    "jumpForce": 12,
    "maxHealth": 100
  },
  "enemies": {
    "spawnRate": 2.5,
    "baseDamage": 10
  },
  "visuals": {
    "backgroundColor": "#1a1a2e",
    "particleCount": 50
  }
}
```

Give every value a human-readable name. Add a comment for what it affects.

### Step 3: Create Config File
- Write to `content/tuning/values.json`
- Include comments/descriptions for each value
- Group by system (player, enemies, UI, audio, etc.)

**Important:** This is the single source of truth. Code reads from here.
Dev sliders write back to here. Editing the JSON directly also works.

### Step 4: Replace Hardcoded Values
Replace every extracted value in the source code with a reference to the config:
```
// BEFORE: const speed = 5;
// AFTER:  const speed = config.player.moveSpeed;
```

### Step 5: Add Runtime Panel (Optional)
Ask the user: "Want a slider panel for live tweaking? (adds Leva or tweakpane)"

If yes:
- For React: Add `leva` (`npm install leva`)
- For vanilla JS: Add `tweakpane` (`npm install tweakpane`)
- Create a `<TuningPanel>` component that reads from config
- Wire sliders to config values with min/max/step based on value type
- Panel only shows in development mode (`import.meta.env.DEV`)
- When slider values change, write back to `content/tuning/values.json`

### Step 6: Report to User
```
TUNING SETUP COMPLETE

Extracted X values into content/tuning/values.json:
  - Player: moveSpeed, jumpForce, maxHealth, ...
  - Enemies: spawnRate, baseDamage, ...
  - Visuals: backgroundColor, particleCount, ...

Config file: content/tuning/values.json

HOW TO CHANGE VALUES:
  Option A: Open content/tuning/values.json → edit the numbers → save
  Option B: Open game → slider panel appears in top-right → drag sliders
  Both do the same thing — pick whichever you prefer.
```

## Tips
- Keep the config file flat-ish (2 levels deep max)
- Add min/max/step hints as comments so the slider panel has good ranges
- For colors, use hex strings — the panel will show a color picker
- If the project already has a constants file, migrate values FROM it into content/tuning/
