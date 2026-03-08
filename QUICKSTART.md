# Muzzy's Game Dev Pipeline — Quick Start Guide

> This is your "now what?" guide. For deep reference, see `~/.claude/PIPELINE.md`.

---

## What You Have (and what it does automatically)

### Things that happen WITHOUT you doing anything:
| What | When | How |
|------|------|-----|
| STATE.md injected into context | Every session start, resume, clear, **and compaction** | SessionStart hook |
| STATE.md backed up | Before auto-compaction | PreCompact hook |
| Tests run | After every code edit | PostToolUse hook |
| Claude blocked from stopping without saving state | After code changes | Stop hook |
| R3F/Three.js best practices enforced | When touching 3D code | Skills auto-activate |
| React best practices enforced | When touching React code | Vercel skill auto-activates |
| Versioning auto-managed | Every commit, fix, milestone, deploy | CLAUDE.md rules |

**You literally don't need to do anything for these.** They just work.

---

## Starting a Brand New Game

This is the full Double Diamond → GSD pipeline. Use as much or as little as you want.

### Phase 1: Discover (What game should I make?)
```
/game-discover [your rough idea]
```
- Claude researches competitors, creates player personas, maps the genre
- Output: PRD sections 1-2 + research in `.planning/research/`
- **Skip this if** you already know exactly what you're building

### Phase 2: Define (What's the core concept?)
```
/game-define
```
- Reads PRD, narrows to a focused concept brief
- Sets MDA targets (what emotions should the game create?)
- Output: PRD section 3
- **Skip this if** you have a clear concept already

### Phase 3: Design (How does it play?)
```
/game-design
```
- Generates multiple approaches, picks the best one
- Defines mechanics, art direction, game systems
- Output: PRD sections 4-6

### Phase 4: Deliver (Turn it into a buildable plan)
```
/game-deliver
```
- Finalizes architecture, milestones, testing strategy
- Output: PRD sections 7-9
- **Then run:** `/gsd:new-project` to turn the PRD into a roadmap with phases

### The Fast Track (skip Double Diamond)
If you already know what you want to build:
```
/game-prd [describe your game]     → generates full 12-section PRD
/gsd:new-project                   → creates roadmap from PRD
```

### The Rulebook Path (already have a designed game)
If you have a board game, card game, or existing ruleset:
```
/proto [paste or describe your rules]
```
- Claude learns your game through clarifying questions
- Builds a Python simulation with AI archetypes
- Runs 10,000+ games, reports balance data
- Creates content files in `content/data/`
- Then: `/game-deliver` or `/gsd:new-project`

---

## Daily Development Workflow

### Start of Session
Just open Claude in your project folder. The hooks auto-inject your STATE.md.
Claude will greet you with context from last session.

### Working on Your Game
```
/gsd:progress          → "What should I do next?"
/gsd:plan-phase        → Plan the next piece of work
/gsd:execute-plan      → Claude builds it (spawns fresh subagents)
/gsd:verify-work       → Guided manual testing checklist
```

### When You Need Design Help
```
/mda-analyze [feature]         → "Does this mechanic serve the right emotion?"
/player-profile [your game]    → "What player types does this attract?"
/game-economy [system]         → "Is my resource flow balanced?"
/proto [rules]                 → "Run 10k games and show me the data"
/playtest-plan                 → "How do I test this with real people?"
/style-guide                   → "What should the art look like?"
```

### End of Session
```
<save>      → Tests + update docs + commit + push
```

---

## Your Game's Editable Files

Everything you can change without touching code lives in `content/`:

| Folder | What's In It | Created By |
|--------|-------------|------------|
| `content/data/` | Game definitions — cards, characters, abilities, levels | `/proto` or manual |
| `content/text/` | All player-facing strings + translations | `/externalize-text`, `/localize` |
| `content/tuning/` | Tweakable game values — speeds, damage, spawn rates | `/tuning-setup` |

Edit the JSON files directly, or use dev sliders for tuning values.

---

## Deploying Your Game

### Web (what you do now with Goops)
```
<deploy>
```

### Mobile / Steam (when ready)
Ask Claude to use the **deployer** agent:
```
"Use the deployer agent to set up Android deployment"
"Use the deployer agent to wrap this for Steam"
```

---

## BMAD Commands (Bonus)

BMAD gives you 9 specialized AI agents and 15 commands. These overlap with your
Double Diamond skills but come from a different angle (Agile/Scrum-oriented):

```
/workflow-init          → Set up BMAD in your project
/workflow-status        → Check progress and get recommendations
/product-brief          → Business analyst creates product brief
/prd                    → Product manager creates PRD
/tech-spec              → Technical specification
/architecture           → System architecture design
/sprint-planning        → Break work into sprints
/create-story           → Create user stories
/dev-story              → Developer picks up and builds a story
/brainstorm             → Creative brainstorming session
/research               → Deep research on a topic
```

**When to use BMAD vs Double Diamond:**
- **Double Diamond** (`/game-discover` etc.): When starting from scratch, exploring ideas
- **BMAD** (`/workflow-init` etc.): When you have a concept and need structured Agile execution
- **GSD** (`/gsd:progress` etc.): For day-to-day phase tracking and execution
- **Mix and match freely** — they all output to `.planning/`

---

## Your Full Skill Inventory

### Game Design (custom-built for you)
| Skill | What It Does |
|-------|-------------|
| `/game-discover` | DD Phase 1 — explore the problem space |
| `/game-define` | DD Phase 2 — narrow to a concept |
| `/game-design` | DD Phase 3 — design mechanics, art, systems |
| `/game-deliver` | DD Phase 4 — finalize architecture + milestones |
| `/mda-analyze` | Trace mechanics → dynamics → aesthetics |
| `/player-profile` | Bartle types + Flow + PENS analysis |
| `/playtest-plan` | Structured playtesting plans |
| `/style-guide` | Art direction generator |
| `/game-prd` | Full 12-section PRD from scratch (skip DD) |
| `/game-economy` | Resource flow modeling |
| `/proto` | Python simulation — 10k games, balance data, AI archetypes |
| `/ai-opponent` | Goal-selection AI with personality traits and fuzzy perception |
| `/multiplayer-setup` | Online multiplayer (Colyseus, Unity Netcode, Playroom Kit) |
| `/game-architecture` | Plain-English system design for non-coders |

### Production & Polish
| Skill | What It Does |
|-------|-------------|
| `/tuning-setup` | Extract values into `content/tuning/` + optional dev sliders |
| `/externalize-text` | Pull all game text into `content/text/en.json` |
| `/localize` | Add languages to `content/text/` |
| `/icon-text` | Inline icons in game text |
| `/organize-assets` | Audit, rename, compress all art/audio |
| `/optimize` | Full performance audit in plain English |
| `/what-changed` | What the player sees differently |
| `/game-map` | Visual project overview for non-coders |
| `/audio-setup` | Complete sound system |
| `/accessibility-check` | Color blind, motor, visual, audio audit |
| `/save-system` | Save/load with versioning and migration |

### Code Quality (auto-activate when relevant)
| Skill | Triggers When |
|-------|--------------|
| `r3f-best-practices` | Touching R3F/Three.js code |
| `three-best-practices` | Touching Three.js code |
| `vercel-react-best-practices` | Touching React code |
| `web-design-guidelines` | UI review requests |

### Project Management
| Skill | What It Does |
|-------|-------------|
| `/gsd:progress` | Check status, get next action |
| `/gsd:plan-phase` | Plan next phase |
| `/gsd:execute-plan` | Build the plan |
| `/gsd:verify-work` | Manual testing checklist |
| Full list: `/gsd:help` | |

### BMAD Method (15 commands)
| Skill | What It Does |
|-------|-------------|
| `/workflow-init` | Initialize BMAD in project |
| `/workflow-status` | Check progress |
| Full list: see BMAD section above | |

### Agents (use via "Use the X agent")
| Agent | What It Does |
|-------|-------------|
| `game-designer` | MDA-aware design lead (remembers across projects) |
| `deployer` | Cross-platform deployment specialist |

---

### Onboarding & Setup
| Skill | What It Does |
|-------|-------------|
| `/first-time-setup` | Complete first-time setup — permissions, git, Python, plugins, MCP |
| `/git-setup` | Git & GitHub walkthrough for non-coders |

---

## Setting Up a New Project

```
/new-game
```

That's it. It scaffolds everything:
- `.planning/` with STATE.md and research/
- `content/` with data/, text/, tuning/
- `proto/` for simulations
- Lossless pipeline hooks
- version.json
- Git initialized with v0.1.0 tag

Then start designing or building.
