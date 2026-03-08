---
name: game-architecture
description: Design game architecture for non-coders — how systems connect, where code lives, data flow, state management. Translates professional patterns into plain English. Use when planning how to build a game or understanding an existing codebase's structure.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, WebSearch
---

# Game Architecture Design

Design architecture for: $ARGUMENTS

## What This Does

Answers "how should all the pieces of my game fit together?" in plain English.
Professional game studios spend weeks on architecture. This skill gives you
the same patterns, explained for non-coders, in minutes.

## Process

### Step 1: Understand the Game
Ask about (or read from PRD):
1. Game type? (puzzle, action, strategy, RPG, board game)
2. Platform? (web, mobile, Steam, all)
3. Single-player, local multiplayer, or online?
4. How complex is the game state? (simple scores vs. full world state)
5. Does it need AI opponents?
6. Does it need save/load?

### Step 2: Choose the Right Patterns

**Game Loop Pattern**
Every game has an update-render cycle. Explain it simply:
```
Every frame (60 times per second):
  1. READ INPUT    → What did the player do? (tap, click, key)
  2. UPDATE STATE  → Move things, check collisions, run AI, apply rules
  3. RENDER        → Draw everything to screen based on new state

For turn-based games, the loop is simpler:
  1. WAIT FOR INPUT → Player makes a choice
  2. VALIDATE       → Is this move legal?
  3. APPLY          → Update the game state
  4. CHECK          → Did anyone win? Any triggers?
  5. NEXT TURN      → Pass to next player (or AI)
```

**State Management Pattern**
Where does the game "remember" things?

| Pattern | When to Use | Example |
|---------|-------------|---------|
| **Single State Object** | Simple games, turn-based | One big object holds everything |
| **Zustand Store** | React games | Lightweight, same team as R3F |
| **ECS (Entity Component System)** | Complex games, many entities | Entities = IDs, Components = data, Systems = logic |
| **Redux/Context** | Web apps with game features | When UI state > game state |

**Separation Pattern (from Glyphtender)**
The most important pattern for maintainability:
```
CORE (Pure game logic — no rendering, no input, no engine)
  ├── GameState.ts      → What the game "knows" (data)
  ├── GameRules.ts      → What's allowed (validation)
  └── GameActions.ts    → What happens (state changes)

ENGINE (Rendering, input, audio — talks to Core)
  ├── Renderer.ts       → Draws the game state
  ├── InputHandler.ts   → Captures player actions
  └── AudioManager.ts   → Plays sounds

WHY: Core can be tested without a screen. Core can run on
a server for multiplayer. AI can simulate without rendering.
```

### Step 3: Map Systems

For the user's specific game, identify each system and how they connect:

```markdown
## System Map

### [System Name]
- **Purpose**: What it does in one sentence
- **Owns**: What data it manages
- **Talks to**: Which other systems it communicates with
- **Triggered by**: What events cause it to act
- **Non-coder summary**: "This is like [real-world analogy]"
```

**Common game systems:**

| System | Purpose | Analogy |
|--------|---------|---------|
| Game Loop | Runs everything each frame | The heartbeat |
| State Manager | Remembers everything | The brain |
| Input Handler | Captures player actions | The ears |
| Renderer | Draws to screen | The hands |
| Physics | Movement, collision | The laws of physics |
| AI | Computer opponents | The other players |
| Audio | Sound effects, music | The speakers |
| Network | Online communication | The phone line |
| Save System | Persistence | The diary |
| UI Manager | Menus, HUD, overlays | The dashboard |
| Event Bus | Communication between systems | The postal service |

### Step 4: Design Data Flow

Show how data moves through the game:
```
[Player taps screen]
    ↓
[Input Handler] → "player wants to move right"
    ↓
[Game Rules] → "is this move valid?" → YES
    ↓
[State Manager] → updates player position
    ↓ (triggers events)
[Physics] → checks collision → found enemy!
    ↓
[Game Rules] → applies damage
    ↓
[State Manager] → updates health
    ↓
[Renderer] → draws new positions + damage effect
[Audio] → plays hit sound
[UI] → updates health bar
    ↓
[Network] → sends update to other players (if multiplayer)
[Save System] → auto-saves checkpoint
```

### Step 5: Define File Structure

Propose a file organization that matches the architecture:
```
src/
├── core/                 (Pure game logic — THE RULES)
│   ├── state.ts          (What the game remembers)
│   ├── rules.ts          (What's legal)
│   ├── actions.ts        (What happens when)
│   └── types.ts          (Data shapes)
├── systems/              (Individual systems)
│   ├── physics.ts
│   ├── ai/               (If applicable)
│   ├── audio.ts
│   └── save.ts
├── rendering/            (Drawing things)
│   ├── GameRenderer.tsx
│   ├── UIOverlay.tsx
│   └── effects/
├── input/                (Capturing actions)
│   └── InputHandler.ts
├── network/              (Online play)
│   └── NetworkManager.ts
├── config/               (Tweakable values)
│   └── game-config.json
└── content/              (Text, translations)
    └── strings.json
```

### Step 6: Output

Create `docs/architecture.md` with:
1. **System Map**: Every system, one sentence each
2. **Data Flow Diagram**: ASCII showing how data moves
3. **File Structure**: Where each system lives
4. **Key Decisions**: Why this architecture (in non-coder terms)
5. **"Don't Touch" Zones**: Files the designer shouldn't edit directly
6. **"Safe to Edit" Zones**: Files the designer CAN edit (config, content, assets)

Explain every technical decision in terms of:
- What the **player** experiences
- What the **designer** can change
- What **could break** if done wrong
