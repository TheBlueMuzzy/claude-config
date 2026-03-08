---
name: ai-opponent
description: Design and build an AI opponent using the Goal-Selection Personality Model — multiple strategic goals, trait-driven decision making, fuzzy perception, and dynamic difficulty. Inspired by Glyphtender's AI system. Use when adding AI opponents, NPCs, or bots.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, WebSearch
---

# AI Opponent — Goal-Selection Personality Model

Design AI for: $ARGUMENTS

## What This Does

Builds an AI opponent that feels human — not a perfect calculator, not
a random idiot. Uses multiple strategic goals, personality traits that
shift based on game state, and imperfect perception so the AI can be
wrong, adapt, and surprise players.

This model comes from Glyphtender's proven AI system (7 goals, 7
personalities, 3 difficulty tiers, dynamic subtraits).

## Architecture Overview

```
[Game State] → [Perception Layer] → [Trait Roll] → [Goal Selection]
                 (fuzzy, imperfect)    (per turn)     (what to optimize for)
                                                            ↓
                                                    [Move Evaluation]
                                                    (score all legal moves
                                                     for selected goal)
                                                            ↓
                                                    [Move Selection]
                                                    (weighted random from
                                                     top candidates)
```

## Process

### Step 1: Define Goals (ask the user)
What can the AI try to do? Map these to your game's mechanics.

**Example goals for different game types:**

| Game Type | Possible Goals |
|-----------|---------------|
| Board game | Score, Block, Trap, Setup, Steal, Escape, Dump |
| Action game | Attack, Defend, Flank, Retreat, Heal, Ambush |
| Strategy game | Expand, Fortify, Rush, Eco, Harass, Tech |
| Card game | Aggro, Control, Combo, Draw, Counter, Tempo |

Each goal needs:
- **Name**: What the AI is trying to do
- **Evaluator function**: How to score a move for this goal
- **When it's relevant**: Game state conditions

### Step 2: Define Personality Traits
Traits are 0-100 values that determine goal selection probability.

**Core trait template:**
```
Trait: [Name] (0-100)
  Low (0-30): [behavior]
  Mid (30-70): [behavior]
  High (70-100): [behavior]
  Drives goals: [which goals this trait activates]
```

**Example (from Glyphtender):**
| Trait | Low | High | Drives |
|-------|-----|------|--------|
| Aggression | Defensive, reactive | Attacks constantly | Attack, Trap |
| Greed | Ignores scoring | Maximizes points every turn | Score |
| Spite | Ignores opponent | Actively sabotages | Block, Deny |
| Caution | Reckless | Over-protective | Defend, Escape |
| Patience | Impulsive, short-term | Long-term setup | Setup, Build |
| Opportunism | Sticks to plan | Exploits any opening | Steal, Counter |
| Pragmatism | Idealistic plays | Does what works | Dump, Retreat |

### Step 3: Define Personalities (Preset Trait Ranges)
Each personality is a named set of trait RANGES (not fixed values).

**Why ranges, not fixed values?**
Every turn, the AI rolls within its trait range. Same personality, different
decisions. This creates human-like variation — a "Bully" usually attacks
but sometimes retreats.

**Example:**
```
"Bully": {
  Aggression: [70, 100],   // Almost always aggressive
  Greed: [20, 50],          // Moderate scoring interest
  Spite: [50, 80],          // Often blocks opponent
  Caution: [10, 40],        // Rarely careful
  Patience: [10, 30],       // Very impatient
  Opportunism: [40, 70],    // Moderate opportunism
  Pragmatism: [30, 60]      // Somewhat practical
}
```

### Step 4: Add Fuzzy Perception
**The AI should NOT have perfect information.** It should:
- Estimate scores (with noise that grows over time)
- Track momentum (recent scoring trends)
- Assess pressure (how restricted is each player)
- Have confidence that decays (older assessments less reliable)

```typescript
interface AIPerception {
  perceivedLead: number;     // Can be wrong about who's winning
  momentum: number;          // Recent scoring trend (-1 to 1)
  pressure: number;          // How trapped the AI feels (0-1)
  opponentPressure: number;  // How trapped opponent seems (0-1)
  confidence: number;        // Decays each turn (1.0 to 0.0)
}
```

**Update perception each turn:**
- Confidence decays by 10-15% per turn
- Score estimates drift based on uncertainty
- Add noise inversely proportional to confidence

### Step 5: Add Dynamic Subtraits
Trait ranges shift based on game state. This creates realistic adaptation.

| Subtrait | Trigger | Effect |
|----------|---------|--------|
| Endgame Sensitivity | Game > 60% complete | Shifts aggression/caution |
| Desperation Sensitivity | Behind by a lot | Greed/opportunism surge |
| Pressure Sensitivity | AI is cornered | Caution increases |
| Momentum Sensitivity | On a scoring streak | Confidence boost |
| Retaliation Sensitivity | After opponent scores big | Spite increases |

### Step 6: Define Difficulty Tiers
Difficulty should affect:
- **Trait ranges**: Easy = wider ranges (more random). Hard = tighter (more consistent)
- **Perception noise**: Easy = more noise (makes mistakes). Hard = less noise
- **Vocabulary/Knowledge**: Easy = limited options. Hard = sees everything
- **Look-ahead depth**: Easy = 1 turn. Hard = 2-3 turns

### Step 7: Implement

Create these files:
```
src/ai/
├── AIBrain.ts           # Main decision loop
├── Personality.ts        # Trait definitions, personalities, difficulty
├── AIPerception.ts       # Fuzzy game state assessment
├── goals/
│   ├── GoalEvaluator.ts  # Base interface
│   ├── AttackGoal.ts     # Score moves for attacking
│   ├── DefendGoal.ts     # Score moves for defending
│   └── [etc.]            # One file per goal
└── personalities/
    ├── bully.json        # Preset: aggressive attacker
    ├── scholar.json      # Preset: score optimizer
    ├── strategist.json   # Preset: balanced blocker
    └── [etc.]            # One file per personality
```

### Step 8: Report to User
```
AI OPPONENT SYSTEM READY

Goals: [list them]
Traits: [list them]
Personalities: [list presets]
Difficulty tiers: Easy / Medium / Hard

HOW TO TWEAK:
  - Adjust personality files in src/ai/personalities/
  - Each trait is a range [min, max] — narrow = more predictable
  - Add new goals by creating a GoalEvaluator in src/ai/goals/

HOW TO ADD A NEW PERSONALITY:
  1. Create a new JSON in src/ai/personalities/
  2. Set trait ranges for your desired behavior
  3. Give it a name and description
  4. It's available immediately

THE AI WILL:
  - Make different decisions each turn (trait rolls)
  - Adapt to game state (dynamic subtraits)
  - Sometimes make mistakes (fuzzy perception)
  - Feel challenging but fair (difficulty tiers)
```
