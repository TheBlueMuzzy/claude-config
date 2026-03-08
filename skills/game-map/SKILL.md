---
name: game-map
description: Generate a visual, plain-English overview of your entire game project — what each file does, how data flows, where to edit things. Use when you feel lost in the codebase or onboarding someone new.
allowed-tools: Read, Grep, Glob, Bash
---

# Game Map — Project Overview

Map the project: $ARGUMENTS

## What This Does

Creates a human-readable map of your entire game. For every file, it explains
what it does in one sentence. Groups files into "areas" like a real map.
Highlights where an artist/designer would make changes vs. "engine code"
they shouldn't touch.

## Process

### Step 1: Scan Project Structure
Get all source files, assets, and config files. Skip node_modules, dist, .git.

### Step 2: Analyze Each File
For each file, determine:
- **What it does** (one sentence, no jargon)
- **Who cares about it**: Artist, Designer, or Engine (don't touch)
- **What you'd change here**: Practical examples
- **Connects to**: Which other files it talks to

### Step 3: Generate the Map

Format as `docs/game-map.md`:
```markdown
# 🗺️ Game Map — [Project Name]

## Quick Reference
Want to change...              | Edit this file
-------------------------------|------------------
Player speed/jump/health       | src/config/game-config.json
Game text and messages         | src/content/strings.json
Colors and visual style        | src/styles/ or config
Enemy behavior                 | src/enemies/ (ask Claude)
Add new art                    | Drop in assets/sprites/
Add new sounds                 | Drop in assets/audio/sfx/

---

## 🎮 Game Logic (the "engine")
These make the game work. Edit with Claude's help.

### src/game.ts — The Game Loop
Runs 60 times per second. First updates everything (positions, physics,
scoring), then draws everything to screen.
→ Connects to: player.ts, enemies.ts, collision.ts

### src/player.ts — Player Character
Everything about how you move, jump, attack. Speed and health values
come from game-config.json.
→ Connects to: game.ts, collision.ts, config

[...etc for each game logic file]

---

## 🎨 Things You Can Edit Directly
These are safe to change without breaking anything.

### src/config/game-config.json — All Tweakable Values
Player speed, enemy damage, spawn rates, colors. Change a number, save,
see the result. This is your control panel.

### src/content/strings.json — All Game Text
Every word the player sees. Button labels, tutorial messages, flavor text.
Edit the text, save, done.

### assets/sprites/ — Character & Object Art
Drop PNG/SVG files here. Name them like: player-idle.png, enemy-slime-walk.png
→ Must be registered in src/assets.ts after adding

### assets/audio/sfx/ — Sound Effects
Drop MP3/OGG files here.
→ Must be registered in src/audio.ts after adding

---

## 📁 Config & Build (don't touch unless asked)
### package.json — Project dependencies
### vite.config.ts — Build configuration
### tsconfig.json — TypeScript settings

---

## 🔗 How Data Flows
```
[Player Input] → [Game Loop] → [Physics/Collision] → [Render]
                      ↑                                   ↓
              [Config Values]                     [What You See]
                      ↑
          [game-config.json] ← YOU EDIT THIS
```
```

### Step 4: Report to User
```
GAME MAP CREATED

Map saved to: docs/game-map.md

Your project has:
  - X game logic files (edit with Claude)
  - X config/content files (you can edit directly)
  - X asset files (images, audio, fonts)

Open docs/game-map.md to see where everything lives and what it does.
```
