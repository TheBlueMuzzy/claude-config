---
name: proto
description: Prototype and balance-test a game using Python simulations. Dump your rulebook, Claude learns the game through clarifying questions, builds a Python sim with AI archetypes, runs Monte Carlo tests (10k+ games), and reports balance data with charts. Use when you have game rules to validate before building.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Proto — Simulation & Balance Testing

Prototype and validate game rules for: $ARGUMENTS

## What This Does

Two jobs in one:
1. **Forces Claude to truly learn your game** — the Q&A process catches every
   ambiguity, edge case, and missing rule. By the time the sim runs, Claude
   understands the game as well as you do.
2. **Generates empirical balance data** — win rates, game length distributions,
   dominant strategies, degenerate loops. Real numbers from 10,000+ simulated games.

Bonus: It battle-tests AI archetypes against your systems, so when you build
`/ai-opponent` later, you already know which decision patterns produce good play.

## Process

### Step 1: Intake — Learn the Game

Accept game rules in any format:
- Rulebook dump (paste, PDF, doc)
- Verbal description ("here's how it works...")
- Existing PRD section 4 (Core Gameplay / Rules)
- Reference to a known game with modifications

Read everything. Don't start coding yet.

### Step 2: Clarify — Ask Until Airtight

Ask targeted questions one at a time. Focus on:
- **Turn structure**: What happens each turn, in what order?
- **Win/loss conditions**: How does the game end? Ties?
- **Edge cases**: What happens when [resource] hits zero? Can [action] be done twice?
- **Hidden information**: What does each player know? What's secret?
- **Randomness**: Dice? Card draws? Shuffling? Probability distributions?
- **Player count**: How many? Asymmetric roles?
- **Resource flows**: What's gained, spent, converted? Sources and drains?
- **Timing**: Simultaneous or sequential? Real-time or turn-based?

**Keep asking until you could explain the game to a stranger with zero ambiguity.**
Tell the user when you feel confident: "I think I've got the full picture. Here's
my understanding:" — then summarize. Get their sign-off before coding.

### Step 3: Formalize — Write the Rules

Write the formalized rules into the PRD:
- If `.planning/PRD.md` exists, update section 4 (Core Gameplay → Rules subsection)
- If no PRD exists, create one with at least sections 1 and 4

### Step 4: Content — Build Game Data Files

If the game has structured content (cards, abilities, items, characters), create
content definition files:

Write to `content/data/`:
```
content/data/
├── cards.json           # card definitions: name, cost, effect, rarity
├── characters.json      # characters, factions, asymmetric powers
├── abilities.json       # special abilities, cooldowns, effects
├── progression.json     # unlock trees, XP curves, level requirements
└── [whatever the game needs].json
```

Format: JSON with human-readable structure. Each entry should have a `name`
and `description` field so non-coders can read and edit them.

Example:
```json
{
  "_meta": {
    "type": "cards",
    "version": "1.0",
    "count": 52
  },
  "cards": [
    {
      "id": "fireball",
      "name": "Fireball",
      "description": "Deal 6 damage to target",
      "cost": 4,
      "type": "spell",
      "rarity": "common",
      "effects": [
        {"type": "damage", "target": "single", "amount": 6}
      ]
    }
  ]
}
```

### Step 5: Build Sim — Python Simulation

Create the simulation in `proto/`:

```
proto/
├── sim.py              # main simulation — game loop, rules engine
├── archetypes.py       # AI player archetypes (decision strategies)
├── content_loader.py   # reads from content/data/ (same data the real game uses)
├── run.py              # CLI runner: `python run.py --games 10000 --matchup aggressive,cautious`
└── results/            # output directory for charts and reports
```

**The sim MUST read from `content/data/`** — same files the real game will use.
No duplicating game data in Python code.

#### AI Archetypes (archetypes.py)

Create 3-5 bot personalities that make decisions differently:

| Archetype | Strategy | Purpose |
|-----------|----------|---------|
| **Aggressive** | Maximize damage/pressure, take risks | Test if aggro is dominant |
| **Cautious** | Minimize risk, build advantage slowly | Test if turtle is dominant |
| **Balanced** | Adapt based on game state | Baseline comparison |
| **Random** | Random legal moves | Detect if skill matters vs luck |
| **Greedy** | Always pick highest immediate value | Test if greedy is exploitable |

Each archetype uses a goal-selection model:
1. Evaluate available actions
2. Score each action against personality-weighted goals
3. Pick highest-scored action (with slight randomness for variety)

This directly feeds into `/ai-opponent` later — same architecture, refined.

### Step 6: Run — Monte Carlo Simulation

Run 10,000+ games across different matchups:
```bash
python proto/run.py --games 10000 --matchups all
```

Collect data:
- Win rate per archetype (overall + per matchup)
- Average game length (turns and time estimate)
- Resource curve over game (do players gain/spend at expected rates?)
- First-player advantage (if applicable)
- Dominant strategy detection (does one archetype always win?)
- Degenerate state detection (infinite loops, stalemates, runaway leaders)
- Score/point distribution (normal curve? skewed?)

### Step 7: Report — Charts & Findings

Generate a plain-English report. Save to `.planning/research/simulations/`:

```
SIMULATION REPORT — [Game Name]
═══════════════════════════════

Ran 10,000 games across X archetype matchups.

HEADLINE FINDINGS:
  ✓ No dominant strategy — all archetypes win between 40-60%
  ⚠ Aggressive wins 65% against Cautious — consider buffing defensive options
  ✗ First player wins 58% — consider a catch-up mechanic
  ✓ Average game length: 12 turns (estimated 15 min) — on target

WIN RATES BY MATCHUP:
  [table or chart]

GAME LENGTH DISTRIBUTION:
  [histogram — are games clustering around target length?]

RESOURCE CURVES:
  [line chart — resources over time by archetype]

BALANCE RECOMMENDATIONS:
  1. [specific tweak with reasoning]
  2. [specific tweak with reasoning]
  3. [specific tweak with reasoning]

DEGENERATE STATES:
  [any infinite loops, stalemates, or runaway scenarios found]
```

Use matplotlib/seaborn for charts if available. Save PNGs to `proto/results/`.
If matplotlib isn't available, use ASCII charts or just tables.

### Step 8: Iterate — Fast Feedback Loop

After the report, ask the user:
"Want to tweak anything and re-run? I can change values and have new results
in about 30 seconds."

Common adjustments:
- Change a value in `content/data/` → re-run
- Add/remove a card/ability → re-run
- Adjust archetype weights → re-run
- Change win condition → update sim → re-run

Each re-run saves a new report so you can compare before/after.

### Step 9: Lock — Finalize and Feed Forward

When the user is satisfied with balance:
1. Update PRD section 5 (Game Systems → Balance Data) with key findings
2. Mark content files as "validated via simulation"
3. Save final simulation report to `.planning/research/simulations/final.md`

Tell the user:
```
PROTO COMPLETE

Rules formalized in PRD § Core Gameplay.
Content files created in content/data/.
Balance validated across 10,000 simulated games.
AI archetypes tested and documented.

The content/data/ files are the SAME files your real game will read from.
No re-entry needed — what's balanced here stays balanced.

What's next?
  /game-deliver  → Finalize architecture and milestones (if in DD flow)
  /gsd:new-project → Create a roadmap and start building
  /ai-opponent   → Build on the archetypes we tested here
```

## Tips

- Start with fewer games (1000) during iteration, go to 10k for final validation
- If Python isn't installed, guide the user through installing it
- Keep the sim simple — it doesn't need to be pretty, just correct
- When comparing runs, always note what changed between them
- Content files use the same format the real game will use — JSON, human-readable
- The simulation code in `proto/` is disposable — the content files are not
