# Muzzy's Game Dev Pipeline Framework

> Cross-project framework for AI-assisted game development with Claude Code.
> Created: 2026-02-08 | Research-backed from 50+ sources.

---

## Table of Contents

1. [The Lossless Pipeline (Hooks)](#1-the-lossless-pipeline)
2. [Plugins to Install](#2-plugins-to-install)
3. [Custom Skills to Build](#3-custom-skills-to-build)
4. [Custom Agents to Build](#4-custom-agents-to-build)
5. [Tech Stack Reference](#5-tech-stack-reference)
6. [Deployment Pipeline](#6-deployment-pipeline)
7. [File Organization Template](#7-file-organization-template)
8. [Daily Workflow](#8-daily-workflow)
9. [Design Methodologies](#9-design-methodologies)
10. [CLAUDE.md Best Practices](#10-claudemd-best-practices)
11. [Context Management](#11-context-management)
12. [Key Sources](#12-key-sources)

---

## 1. The Lossless Pipeline

### How It Works

```
Work happens -> context fills up
        |
[PreCompact hook] -> backup STATE.md before summarization
        |
Compaction happens -> context gets summarized
        |
[SessionStart "compact"] -> re-injects STATE.md into fresh context
        |
Claude continues with full awareness
        |
[Stop hook] -> blocks Claude from stopping until STATE.md is updated
        |
Session ends or new cycle begins
```

### settings.json Template

Copy this to `<project>/.claude/settings.json` for any new project:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "echo '=== SESSION CONTEXT ===' && cat \"$CLAUDE_PROJECT_DIR/.planning/STATE.md\" 2>/dev/null && echo '' && echo '=== GIT STATUS ===' && git -C \"$CLAUDE_PROJECT_DIR\" status --short && echo '' && echo '=== BRANCH ===' && git -C \"$CLAUDE_PROJECT_DIR\" branch --show-current && echo '' && echo '=== RECENT COMMITS ===' && git -C \"$CLAUDE_PROJECT_DIR\" log --oneline -5"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "auto",
        "hooks": [
          {
            "type": "command",
            "command": "cp \"$CLAUDE_PROJECT_DIR/.planning/STATE.md\" \"$CLAUDE_PROJECT_DIR/.planning/STATE.md.bak\" 2>/dev/null; echo 'STATE.md backed up before auto-compaction'"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Review this conversation: $ARGUMENTS\n\nCheck TWO things:\n1. Did Claude make code changes (Edit/Write tool calls) in this turn?\n2. If yes, did Claude update .planning/STATE.md with what changed?\n\nIMPORTANT: If stop_hook_active is true, respond {\"ok\": true} to prevent loops.\n\nIf code changes were made WITHOUT updating STATE.md, respond:\n{\"ok\": false, \"reason\": \"Code changes detected but STATE.md not updated. Update .planning/STATE.md with: what changed, current status, any decisions made, and next steps. Then provide the Handoff Block.\"}\n\nOtherwise respond {\"ok\": true}",
            "timeout": 30
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$CLAUDE_PROJECT_DIR\" && npm run test:run 2>&1 | tail -20"
          }
        ]
      }
    ]
  }
}
```

### Key Hook Details

| Hook | When | What | Can Block? |
|------|------|------|-----------|
| SessionStart | Session start, resume, clear, **compact** | Injects STATE.md + git info | No |
| PreCompact | Before auto-compaction | Backs up STATE.md | No |
| Stop | Claude finishes responding | Checks if STATE.md was updated | Yes (exit 2 or decision:block) |
| PostToolUse | After Edit/Write | Runs tests | No |

### SessionStart Matchers

| Matcher | When |
|---------|------|
| `startup` | New session |
| `resume` | --resume, --continue, /resume |
| `clear` | /clear |
| `compact` | After auto or manual compaction |

### PreCompact Matchers

| Matcher | When |
|---------|------|
| `auto` | Context window full (~75% capacity) |
| `manual` | User types /compact |

### Stop Hook Gotcha

The `stop_hook_active` field is `true` when Claude is already continuing from a Stop hook. MUST check this to prevent infinite loops.

### Advanced PreCompact Options

- **mvara-ai/precompact-hook** (https://github.com/mvara-ai/precompact-hook): Reads last 50 exchanges from transcript, sends to fresh Claude, generates recovery brief.
- **Continuous-Claude-v3** (https://github.com/parcadei/Continuous-Claude-v3): "Compound, don't compact." Auto-generates handoff doc at PreCompact with decisions, file changes, next steps.
- **Manual compact with instructions**: `/compact Preserve all file modifications with exact paths and architectural decisions`

---

## 2. Plugins to Install

### Essential (All Projects)

| Plugin | What | Install |
|--------|------|---------|
| **GSD** | Meta-prompting, phases, milestones, fresh 200k subagent contexts | `npx get-shit-done-cc --claude --global` |

### For React / Three.js Projects

| Plugin/Skill | What | Install |
|-------------|------|---------|
| **three-agent-skills** | 100+ Three.js rules + 60+ R3F rules | `npx add-skill three-agent-skills --skill three-best-practices` and `npx add-skill three-agent-skills --skill r3f-best-practices` |
| **claude-skills-threejs-ecs-ts** | Mobile-optimized Three.js + ECS + R3F | Clone https://github.com/Nice-Wolf-Studio/claude-skills-threejs-ecs-ts |
| **r3f-skills (EnzeD)** | Granular R3F skills (animation, physics, drei, etc.) | Clone https://github.com/EnzeD/r3f-skills to .claude/skills/ |
| **hyper-forge threejs-scene-builder** | Scene setup, PBR, GLTF, Rapier, NPC AI, postprocessing | Download from https://claude-plugins.dev/skills/@Dexploarer/hyper-forge/threejs-scene-builder |

### For Unity C# Projects

| Plugin | What | Install |
|--------|------|---------|
| **unity-mcp (CoplayDev)** | MCP bridge to Unity Editor - manage assets, scenes, scripts | https://github.com/CoplayDev/unity-mcp |
| **mcp-unity (CoderGamester)** | Alternative Unity MCP with Cursor/Codex support | https://github.com/CoderGamester/mcp-unity |

### For Design Methodology

| Plugin | What | Install |
|--------|------|---------|
| **BMAD Skills** | 9 specialized design agents (BA, PM, Architect, UX, etc.) | Clone https://github.com/aj-geddes/claude-code-bmad-skills |
| **BMAD-AT-CLAUDE** | Alternate BMAD port | https://github.com/24601/BMAD-AT-CLAUDE |

### For Reference/Learning

| Resource | What | URL |
|----------|------|-----|
| **everything-claude-code** | 12+ agents, 24+ commands, 20+ skills (cherry-pick, don't install all) | https://github.com/affaan-m/everything-claude-code |
| **awesome-claude-code** | Curated list of plugins, skills, hooks | https://github.com/hesreallyhim/awesome-claude-code |
| **VoltAgent agent-skills** | 200+ skills from Anthropic, Vercel, Stripe, etc. | https://github.com/VoltAgent/awesome-agent-skills |
| **Anthropic Official Skills** | Official examples + skill-creator meta-skill | https://github.com/anthropics/skills |

### WARNING

Do NOT enable all MCP servers at once. Context window shrinks from 200K to ~70K with too many tool definitions loaded.

### GSD Commands (Full List)

**Core Workflow:**
| Command | Purpose |
|---------|---------|
| `/gsd:new-project` | Initialize new project (interview + research + requirements + roadmap) |
| `/gsd:new-milestone` | Start next version for existing codebase |
| `/gsd:discuss-phase [N]` | Gather context before planning |
| `/gsd:plan-phase [N]` | Create atomic execution plans (XML, max 3 tasks each) |
| `/gsd:execute-phase [N]` | Execute plans with wave-based parallel subagents |
| `/gsd:verify-work [N]` | Manual UAT validation |
| `/gsd:complete-milestone` | Archive milestone + tag release |
| `/gsd:progress` | Check status, route to next action |

**Phase Management:**
| Command | Purpose |
|---------|---------|
| `/gsd:add-phase` | Append phase to roadmap |
| `/gsd:insert-phase [N]` | Insert urgent work between phases (e.g., 7.1) |
| `/gsd:remove-phase [N]` | Remove future phase and renumber |
| `/gsd:list-phase-assumptions [N]` | Preview Claude's intended approach before planning |

**Utilities:**
| Command | Purpose |
|---------|---------|
| `/gsd:quick` | Ad-hoc tasks with GSD quality, no full planning |
| `/gsd:debug [desc]` | Systematic debugging with persistent state |
| `/gsd:map-codebase` | Analyze existing codebase (brownfield) |
| `/gsd:pause-work` | Create handoff when stopping mid-phase |
| `/gsd:resume-work` | Restore from last session |
| `/gsd:audit-milestone` | Verify milestone achieved its definition |
| `/gsd:plan-milestone-gaps` | Create phases to close audit gaps |
| `/gsd:settings` | Configure model profile (quality/balanced/budget) |
| `/gsd:add-todo [desc]` | Capture ideas for later |
| `/gsd:check-todos` | List pending todos |

---

## 3. Custom Skills to Build

All skills go in `~/.claude/skills/` for cross-project availability.

### Skill 1: /game-discover (Double Diamond Phase 1)

```yaml
---
name: game-discover
description: Run the Discover phase of the Double Diamond for game design. Use when starting a new game concept, researching a genre, or exploring the problem space. Generates competitor analysis, player personas, and mood board specifications.
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
---

# Discover Phase - Double Diamond Game Design

You are guiding the DISCOVER phase. The goal is DIVERGENT exploration of the problem space.

## Process

1. **Gather Context**: Ask the user about their game idea, genre interests, and target audience
2. **Competitor Analysis**: Research 5-10 reference games in the genre
   - For each: core loop, art style, monetization, player reviews, what works/fails
3. **Player Research**: Create 2-3 player personas based on the target genre
   - Demographics, motivations (use Bartle types), play habits, platform preferences
4. **Genre Analysis**: Map the genre landscape
   - Market saturation, underserved niches, emerging trends
5. **Inspiration Gallery**: Compile visual/mechanical references
   - Art style references, mechanic references, narrative references

## Output

Create `docs/discover-phase.md` with:

### Competitor Landscape
| Game | Core Loop | Art Style | What Works | What's Missing |

### Player Personas
For each: Name, Age, Motivation (Bartle Type), Play Habits, Pain Points

### Genre Opportunity Map
- Saturated areas to avoid
- Underserved niches to target
- Emerging trends to leverage

### Inspiration References
- Mechanical references (games to learn from)
- Aesthetic references (art/music/narrative)
- Anti-references (what to avoid)

## Gate Criteria
Before moving to /game-define, ensure:
- [ ] At least 5 competitor games analyzed
- [ ] At least 2 player personas created
- [ ] Core opportunity/niche identified
- [ ] Inspiration references compiled
```

### Skill 2: /game-define (Double Diamond Phase 2)

```yaml
---
name: game-define
description: Run the Define phase of the Double Diamond. Synthesizes discovery research into a focused game concept brief with design principles and MDA targets. Use after completing /game-discover.
disable-model-invocation: true
---

# Define Phase - Double Diamond Game Design

You are guiding the DEFINE phase. The goal is CONVERGENT narrowing to a clear problem statement.

## Process

1. **Read Discovery Output**: Load `docs/discover-phase.md`
2. **Insight Synthesis**: What patterns emerged? What's the core opportunity?
3. **Concept Statement**: "Players need [X] because [Y]"
4. **Design Principles**: 3-5 rules that guide ALL decisions
5. **MDA Targets**: Which aesthetics (Sensation, Fantasy, Narrative, Challenge, Fellowship, Discovery, Expression, Submission) are primary?
6. **Success Criteria**: How do we know this works?
7. **Scope Definition**: What's in v1? What's deferred?

## Output

Create `docs/define-phase.md` with:

### Game Concept Brief (1-2 pages max)
- Elevator pitch (1 sentence)
- Core player need
- Target aesthetics (MDA)
- What makes this different

### Design Principles
1. [Principle]: [Why it matters]
2. [Principle]: [Why it matters]
3. [Principle]: [Why it matters]

### Success Criteria
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]

### Scope
| In v1 | Deferred |
|-------|----------|

## Gate Criteria
Before moving to /game-develop:
- [ ] Concept brief approved by designer
- [ ] Design principles defined (3-5)
- [ ] MDA aesthetic targets chosen
- [ ] Scope agreed (v1 vs deferred)
```

### Skill 3: /game-develop (Double Diamond Phase 3)

```yaml
---
name: game-develop
description: Run the Develop phase of the Double Diamond. Generates multiple solution approaches, prototyping plans, mechanics design, and art direction from the defined concept. Use after completing /game-define.
disable-model-invocation: true
---

# Develop Phase - Double Diamond Game Design

You are guiding the DEVELOP phase. The goal is DIVERGENT exploration of solutions.

## Process

1. **Read Define Output**: Load `docs/define-phase.md`
2. **Ideation**: Generate 3-5 different approaches to the core loop
3. **Mechanics Design**: For each approach, define the concrete mechanics
4. **MDA Validation**: Trace each mechanic -> dynamic -> aesthetic
5. **Prototype Plan**: Which approach to build first? What's the simplest testable version?
6. **Art Direction**: Style references, color palette, character proportions
7. **System Design**: Data models, state management, key algorithms

## Output

Create `docs/develop-phase.md` with:

### Approach Comparison
| Approach | Core Mechanic | Pros | Cons | Effort |

### Chosen Approach
- Why this one
- Core loop diagram (ASCII)
- Session flow (what happens in 5 min of play)

### Mechanics Specification
| Mechanic | Input | Behavior | Visual Feedback | Audio Feedback | Target Aesthetic |

### Art Direction
- Style: [description + references]
- Color palette: [hex codes]
- Character design: [proportions, style]

### Prototype Scope
- What to build first
- What to fake/stub
- Success criteria for prototype

## Gate Criteria
Before moving to /game-deliver:
- [ ] Approach chosen and justified
- [ ] Mechanics specified with MDA tracing
- [ ] Art direction defined
- [ ] Prototype scope agreed
```

### Skill 4: /game-deliver (Double Diamond Phase 4)

```yaml
---
name: game-deliver
description: Run the Deliver phase of the Double Diamond. Generates PRD, creates GSD-compatible phases, and prepares for execution. Use after completing /game-develop.
disable-model-invocation: true
---

# Deliver Phase - Double Diamond Game Design

You are guiding the DELIVER phase. The goal is CONVERGENT execution and refinement.

## Process

1. **Read Develop Output**: Load `docs/develop-phase.md`
2. **PRD Generation**: Create full PRD from chosen approach
3. **Milestone Planning**: Break into GSD-compatible milestones
4. **Phase Breakdown**: Each milestone into 3-8 phases
5. **Technical Architecture**: Stack decisions, state management, deployment targets
6. **Testing Strategy**: Automated tests + manual playtest plan

## Output

Create `.planning/PRD.md` with full game PRD:

### 1. Vision & Goals
### 2. Core Gameplay (loop diagram, session flow, progression)
### 3. Game Systems (per system: purpose, mechanics, data model)
### 4. Content Requirements (levels, entities, items, audio, art)
### 5. Technical Architecture (stack, state, save system, multiplayer if needed)
### 6. Milestone Breakdown
- v0.1: Playable prototype (core loop only)
- v0.2: Full single-player
- v0.3: Polish + juice
- v1.0: Launch-ready

## Transition to GSD

After PRD is approved, tell the user:
"PRD is ready. Run `/gsd:new-project` to create the roadmap and phases from this PRD."
```

### Skill 5: /mda-analyze

```yaml
---
name: mda-analyze
description: Analyze or design a game using the MDA framework (Mechanics, Dynamics, Aesthetics). Use when evaluating game feel, balancing systems, or designing new features.
---

# MDA Framework Analysis

Analyze using the MDA Framework for: $ARGUMENTS

## The 8 Aesthetics
1. Sensation (sensory pleasure) - Flower, Tetris Effect
2. Fantasy (make-believe) - Skyrim, Animal Crossing
3. Narrative (drama) - The Last of Us, Disco Elysium
4. Challenge (obstacle course) - Dark Souls, Celeste
5. Fellowship (social framework) - Among Us, It Takes Two
6. Discovery (uncharted territory) - Outer Wilds, Subnautica
7. Expression (self-discovery) - Minecraft, The Sims
8. Submission (pastime) - Cookie Clicker, Stardew Valley

## Process

1. **Identify Target Aesthetics**: Which 1-3 are primary goals?
2. **Inventory Mechanics**: List every player-facing mechanic
3. **Map Mechanics -> Dynamics**: What emergent behavior does each create?
4. **Map Dynamics -> Aesthetics**: Which aesthetic does each serve?
5. **Gap Analysis**: Mechanics without aesthetic purpose = cut candidates
6. **Conflict Analysis**: Mechanics undermining target aesthetics = redesign candidates

## Output

### Target Aesthetics (ranked)
1. Primary: [aesthetic] - the dominant emotional experience
2. Secondary: [aesthetic] - supporting experience
3. Tertiary: [aesthetic] - background texture

### Mechanics Inventory
| Mechanic | Description | Target Dynamic | Target Aesthetic |

### Dynamics Emergence Map
| Dynamic | Emergent From | Player Behavior | Supports Aesthetic |

### Alignment Check
For each mechanic, trace: Mechanic -> Dynamic -> Aesthetic
- Flag mechanics with no aesthetic trace (cut candidates)
- Flag target aesthetics with no supporting mechanics (design gaps)

### Validation Questions
1. "If a player described your game in one word, what would it be?"
2. "What mechanic are you most proud of?" (should serve primary aesthetic)
3. "What mechanic feels 'off'?" (likely misaligned)
```

### Skill 6: /player-profile

```yaml
---
name: player-profile
description: Analyze a game through player psychology frameworks including Bartle types, Flow theory, and PENS needs satisfaction. Use when designing for specific player types, validating difficulty curves, or ensuring psychological need satisfaction.
---

# Player Psychology Analysis

Analyze for: $ARGUMENTS

## 1. Bartle Type Mapping
Rate support for each (1-5):
- **Achievers** (Acting on World): Points, levels, completion. Score: ?
- **Explorers** (Interacting with World): Discovery, secrets. Score: ?
- **Socializers** (Interacting with Players): Relationships. Score: ?
- **Killers** (Acting on Players): Competition, dominance. Score: ?

Primary target: [highest]
Design gaps: [lowest - intentional?]

## 2. Flow Analysis (Csikszentmihalyi)
Map the difficulty curve:
- Opening 10 min: [anxiety vs boredom level]
- Core loop: [where does challenge ramp?]
- Late game: [does challenge outpace skill growth?]
- Recovery points: [breathing room]

Flow checklist:
- [ ] Clear goals at every moment?
- [ ] Immediate feedback on actions?
- [ ] Challenge matches skill?
- [ ] Sense of control/agency?
- [ ] Time distortion ("one more turn")?

## 3. PENS Satisfaction (Self-Determination Theory)
Rate each need (1-5):
- **Competence**: Does the player feel skilled? Clear feedback?
- **Autonomy**: Does the player feel choice? Multiple valid paths?
- **Relatedness**: Does the player feel connected? To NPCs? Other players?
- **Presence**: Does the world feel immersive?
- **Controls**: Are inputs intuitive and learnable?

## Output
Generate `docs/player-psychology.md` with ratings, gaps, and recommendations.
```

### Skill 7: /playtest-plan

```yaml
---
name: playtest-plan
description: Create a structured playtesting plan with objectives, observation guides, questionnaires, and synthesis templates. Use when preparing for playtesting sessions.
disable-model-invocation: true
---

# Playtesting Plan Generator

## Gather Info
Ask the designer:
1. What build/version is being tested?
2. What is the single most important question this playtest should answer?
3. What mechanics or systems are being tested?
4. Who is the target player? (casual/core/hardcore)
5. How many testers?
6. Test environment? (in-person, remote)

## Output: docs/playtest-plan.md

### Test Objectives
- Primary question: [from input]
- Secondary questions: [derived]

### Session Structure (45-60 min)
1. Welcome and consent (5 min)
2. Pre-play questionnaire (5 min)
3. Free play observation (20-30 min)
4. Directed tasks (10 min)
5. Post-play questionnaire (5 min)
6. Debrief interview (10 min)

### Observation Checklist
Per mechanic:
- [ ] Discovered without guidance?
- [ ] Time to first successful use?
- [ ] Used as intended?
- [ ] Signs of frustration?
- [ ] Unexpected creative uses?

### Post-Play Questions
Mix of Likert (1-5) and open-ended, aligned to objectives.

### Synthesis Template
| Finding | Severity | Frequency | Recommendation | Priority |
```

### Skill: /live-playtest

See `~/.claude/skills/live-playtest/SKILL.md`. Watch a live multiplayer game session via Playwright console monitoring. Use during playtesting or as part of `/gsd:verify-work` for multiplayer phases.

### Skill 8: /style-guide

```yaml
---
name: style-guide
description: Generate an art style guide for a game project. Covers visual identity, color palette, character design rules, animation standards, and UI style. Use when establishing art direction for a new game.
disable-model-invocation: true
---

# Art Style Guide Generator

## Gather Info
Ask the designer:
1. Art style? (pixel art, low-poly, hand-drawn, realistic, etc.)
2. Perspective? (top-down, isometric, side-scroll, 3rd person)
3. Target resolution?
4. Reference games/art?
5. Mood/tone? (whimsical, dark, minimalist, vibrant)

## Output: docs/style-guide.md

### Visual Identity
- Art style: [description]
- Perspective: [type]
- Resolution: [target]

### Color Palette
| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | | #XXXXXX | Player, UI highlights |
| Secondary | | #XXXXXX | Environment |
| Accent | | #XXXXXX | Collectibles, interactive |
| Danger | | #XXXXXX | Enemies, hazards |
| Neutral | | #XXXXXX | Non-interactive |

### Character Design Rules
- Head-to-body ratio
- Line weight
- Silhouette test requirement
- Max colors per sprite

### Animation Standards
- Frame rate (e.g., 12fps for pixel art)
- Idle: [min frames]
- Walk cycle: [frame count]
- Attack: [anticipation, action, recovery]

### UI Style
- Font family
- Button style
- Menu transitions
- HUD elements

### Asset Naming Convention
- `entity_state_type_dimensions.png` (e.g., player_idle_spritesheet_64x64.png)
- `entity_variant_action_framecount.png` (e.g., enemy_slime_walk_4frames.png)
- `type_variant_subtype_dimensions.png` (e.g., tile_grass_base_32x32.png)

### DO and DON'T
| DO | DON'T |
|----|-------|
| Use defined palette | Introduce new colors without approval |
| Maintain consistent line weight | Mix weights in single asset |
| Test at 1x and 2x scale | Create for one scale only |
```

### Skill 9: /game-prd

```yaml
---
name: game-prd
description: Generate a comprehensive Game PRD from design docs and concept briefs. Use when transitioning from design to development. Can be used standalone or after the Double Diamond phases.
disable-model-invocation: true
context: fork
agent: general-purpose
---

# Game PRD Generator

Create a comprehensive PRD for: $ARGUMENTS

## Required Input (ask for any missing):
1. Game concept (one-paragraph pitch)
2. Target platform (Web / Mobile / Steam / All)
3. Target audience
4. Art style (references or description)
5. Core loop (what does the player DO every 30 seconds?)

## PRD Structure

### 1. Vision & Goals
- Elevator pitch (1 sentence)
- Target aesthetics (MDA)
- Success metrics
- Platform targets

### 2. Core Gameplay
- Core loop diagram (ASCII)
- Session flow (5 min of play)
- Progression system
- Win/lose conditions

### 3. Game Systems
Per system: Purpose, Mechanics, Player-facing description, Technical requirements, Data model

### 4. Content Requirements
- Levels/stages/maps
- Characters/entities
- Items/upgrades
- Audio/music
- Art asset list

### 5. Technical Architecture
- Stack (React/R3F/Unity based on requirements)
- State management
- Save system design
- Multiplayer architecture (if applicable)
- Deployment targets

### 6. Milestone Breakdown
- v0.1: Playable prototype (core loop only)
- v0.2: Full single-player
- v0.3: Polish + juice
- v1.0: Launch-ready

Output as `.planning/PRD.md`

After completion: "PRD ready. Run `/gsd:new-project` to create roadmap and phases."
```

### Skill 10: /game-economy

```yaml
---
name: game-economy
description: Design and analyze game economy systems using Machinations-style resource flow modeling. Use when designing progression, currency, crafting, or any resource-based game system.
---

# Game Economy Design

Analyze/design economy for: $ARGUMENTS

## Concepts (Machinations Framework)
- **Pools**: Where resources gather (player inventory, bank, etc.)
- **Sources**: Generate resources (enemy drops, daily rewards, etc.)
- **Drains**: Consume resources (purchases, upgrades, decay, etc.)
- **Gates**: Conditional routing (if level >= 5, unlock shop)
- **Connections**: Flow paths between nodes

## Process

1. **Identify Resources**: What does the player collect/spend?
2. **Map Sources**: Where does each resource come from? At what rate?
3. **Map Drains**: Where does each resource go? At what cost?
4. **Balance Check**: Are sources > drains (inflation) or drains > sources (scarcity)?
5. **Progression Curve**: How does resource flow change over time?
6. **Edge Cases**: What happens if player hoards? Spends everything? Exploits?

## Output

### Resource Inventory
| Resource | Source(s) | Drain(s) | Equilibrium Target |

### Flow Diagram (ASCII)
```
[Source: Enemy Drops] ---> [Pool: Gold] ---> [Drain: Shop]
                                    |
                                    +---> [Drain: Upgrades]
```

### Balance Analysis
- Early game: [resource abundance/scarcity]
- Mid game: [inflection points]
- Late game: [endgame economy]

### Recommendations
- Sinks needed to prevent inflation
- Faucets needed to prevent frustration
- Gates for pacing
```

---

## 4. Custom Agents to Build

All agents go in `~/.claude/agents/` for cross-project availability.

### Agent 1: game-designer.md

```yaml
---
name: game-designer
description: Game design lead that orchestrates the Double Diamond process and knows all design skills. Use proactively when discussing game mechanics, balance, player experience, or starting new game concepts.
tools: Read, Grep, Glob, WebSearch, WebFetch
model: sonnet
skills:
  - game-discover
  - game-define
  - mda-analyze
  - player-profile
memory: user
---

You are a senior game designer with expertise in:
- MDA framework (Mechanics, Dynamics, Aesthetics)
- Double Diamond methodology (Discover, Define, Develop, Deliver)
- Player psychology (Bartle types, Flow theory, PENS)
- Economy design and balance
- Level design principles
- Indie game development constraints

You have access to specialized skills:
- /game-discover, /game-define, /game-develop, /game-deliver (Double Diamond)
- /mda-analyze (Mechanics-Dynamics-Aesthetics analysis)
- /player-profile (Bartle + Flow + PENS)
- /playtest-plan (structured playtesting)
- /style-guide (art direction)
- /game-economy (economy and resource flow)
- /game-prd (PRD generation)

The user is an artist and designer, not an engineer. Explain technical
tradeoffs in terms of player experience impact, not code complexity.

When analyzing a feature:
1. Frame it through MDA -- what aesthetic does it serve?
2. Consider moment-to-moment player experience
3. Think about edge cases and degenerate strategies
4. Suggest the simplest mechanic that achieves the goal
5. Reference existing games that solve similar problems

Update your agent memory with game design patterns, balance insights,
and player psychology principles you discover across projects.
```

### Agent 2: deployer.md

```yaml
---
name: deployer
description: Cross-platform deployment specialist. Use when deploying to GitHub Pages, wrapping for mobile stores (Google Play, App Store), or building for Steam. Handles Capacitor, Electron, Steamworks, and CI/CD.
tools: Read, Bash, Write, Edit, Glob, Grep, WebSearch
model: sonnet
---

You are a deployment engineer specializing in cross-platform game distribution.

## Supported Targets

### Web (GitHub Pages)
- Vite build with base path config
- gh-pages npm package or GitHub Actions
- HashRouter for client-side routing

### Android (Google Play Store)
- **Capacitor** (recommended): npm install @capacitor/core @capacitor/cli
- npx cap init -> npx cap add android -> npx cap sync
- Open in Android Studio, sign APK, upload to Play Console
- Alternative: PWA with Trusted Web Activity via Bubblewrap

### iOS (App Store)
- **Capacitor**: npx cap add ios -> npx cap sync
- Open in Xcode, configure code signing
- Requires macOS + $99/year Apple Developer account
- Alternative: Appflow for cloud builds

### Steam
- **Electron** wrapper: npm install electron electron-builder
- **steamworks.js** (NOT greenworks, it's deprecated): https://github.com/ceifa/steamworks.js
- Set contextIsolation: false, nodeIntegration: true
- steam_appid.txt with app ID (480 for dev)
- **GameCI steam-deploy** GitHub Action for CI/CD: https://github.com/game-ci/steam-deploy

### PWA
- Service Worker + manifest.json
- Add offline support to existing web app

## CI/CD Template (GitHub Actions)
Provide multi-target workflow:
- build-web (GitHub Pages)
- build-android (Capacitor -> Play Store)
- build-steam (Electron -> Steam via game-ci/steam-deploy)

For each deployment, check prerequisites, configure build, test locally, then submit.
```

---

## 5. Tech Stack Reference

### Web Games (React + Three.js)

| Layer | Library | Why |
|-------|---------|-----|
| **Rendering** | React Three Fiber + drei | Declarative Three.js in React |
| **Physics** | @react-three/rapier | WASM, deterministic, great R3F integration |
| **State** | Zustand | Lightweight, same team as R3F |
| **ECS** | Miniplex (React-friendly) or bitECS (performance) | Decouples game logic from rendering |
| **Multiplayer** | Colyseus (authoritative) or Playroom Kit (P2P/quick) | Colyseus: Schema-based incremental sync at 20fps |
| **Server Hosting** | Hathora (production) or PartyKit (simple) | Managed game servers |
| **NPC AI** | Yuka.js | Steering behaviors, state machines, pathfinding |
| **Build** | Vite | Fast HMR, great for game iteration |
| **Runtime Tweaking** | Leva | Runtime parameter panel |
| **Animation Editor** | Theatre.js | Timeline keyframe editor, R3F extension |
| **Perf Monitor** | r3f-perf | Draw calls, FPS, memory overlay |

### R3F Golden Rule (put in every R3F project's CLAUDE.md)

```
NEVER use React state for per-frame updates. Mutate refs in useFrame:
- BAD:  const [pos, setPos] = useState(); useFrame(() => setPos(...))
- GOOD: const ref = useRef(); useFrame(() => { ref.current.position.x += 0.01 })
```

### Save State Architecture

```
Recommended: Local-first with cloud sync
  localStorage / IndexedDB (instant, offline)
      |  async sync
  Supabase (free tier, PostgreSQL + auth + real-time)
```

- **localStorage**: Simple saves, settings (~5-10MB)
- **IndexedDB**: Complex saves, assets (~50MB+)
- **Supabase**: Cloud saves, cross-device sync, auth built in

### Unity C# Stack

| Need | Tool |
|------|------|
| **AI Bridge** | unity-mcp (CoplayDev) - Claude talks directly to Unity Editor |
| **Multiplayer** | Netcode for GameObjects (small, 2-10 players) or Mirror/FishNet (indie, free) or Photon (large scale, per CCU cost) |
| **Save System** | PlayerPrefs (simple) or JSON serialization to Application.persistentDataPath |

---

## 6. Deployment Pipeline

| Target | Tool | Flow |
|--------|------|------|
| **Web** | GitHub Pages | `npm run build` -> `gh-pages -d dist` |
| **Android** | Capacitor | Wrap web -> Android Studio -> Google Play |
| **iOS** | Capacitor | Wrap web -> Xcode -> App Store (macOS required) |
| **Steam** | Electron + steamworks.js | Wrap in Electron -> Steamworks SDK -> Steam |
| **PWA** | Service Worker | Add offline support to web app |

### GitHub Actions Multi-Platform

```yaml
name: Build & Deploy
on:
  push:
    branches: [main]

jobs:
  build-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist

  build-steam:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build:electron
      - uses: game-ci/steam-deploy@v3
        with:
          username: ${{ secrets.STEAM_USERNAME }}
          configVdf: ${{ secrets.STEAM_CONFIG_VDF }}
          appId: YOUR_APP_ID
```

---

## 7. File Organization Template

### User-Level (all projects)

```
~/.claude/
├── CLAUDE.md                   # Personal preferences
├── settings.json               # Global hooks (if any)
├── agents/
│   ├── game-designer.md       # MDA-aware design orchestrator
│   └── deployer.md            # Cross-platform deployment
└── skills/
    ├── game-discover/SKILL.md # DD Phase 1
    ├── game-define/SKILL.md   # DD Phase 2
    ├── game-develop/SKILL.md  # DD Phase 3
    ├── game-deliver/SKILL.md  # DD Phase 4
    ├── mda-analyze/SKILL.md   # MDA framework
    ├── player-profile/SKILL.md# Bartle + Flow + PENS
    ├── playtest-plan/SKILL.md # Playtesting plans
    ├── style-guide/SKILL.md   # Art direction
    ├── game-economy/SKILL.md  # Economy modeling
    └── game-prd/SKILL.md      # PRD generator
```

### Project-Level (per game)

```
<project>/
├── .claude/
│   ├── settings.json          # Lossless pipeline hooks
│   ├── settings.local.json    # Local permissions
│   ├── rules/                 # Path-specific rules
│   │   ├── r3f-patterns.md   # R3F-specific (paths: "components/**/*.tsx")
│   │   └── testing.md        # Test conventions
│   ├── skills/               # Game-specific skills
│   └── agents/               # Game-specific agents
├── .planning/                 # GSD managed
│   ├── STATE.md              # Session continuity (injected by hooks)
│   ├── PROJECT.md            # Vision
│   ├── REQUIREMENTS.md       # Features
│   ├── ROADMAP.md            # Phases
│   ├── PRD.md                # Full game requirements
│   ├── DESIGN_VISION.md      # Art/design direction
│   └── config.json           # GSD settings
├── CLAUDE.md                  # Project instructions
├── docs/
│   ├── discover-phase.md     # DD Phase 1 output
│   ├── define-phase.md       # DD Phase 2 output
│   ├── develop-phase.md      # DD Phase 3 output
│   ├── mda-analysis.md       # MDA analysis
│   ├── player-psychology.md  # Player profile
│   ├── style-guide.md        # Art direction
│   └── playtest-plan.md      # Testing plans
└── src/                       # Game code
```

---

## 8. Daily Workflow

```
START SESSION
  SessionStart hook auto-injects STATE.md + git status
  Claude greets with context summary
  |
NEW GAME?
  /game-discover [concept]  -> Discover phase
  /game-define              -> Define phase
  /game-develop             -> Develop phase
  /game-deliver             -> Deliver phase (generates PRD)
  /gsd:new-project          -> Creates roadmap from PRD
  |
EXISTING GAME?
  /gsd:progress             -> Routes to next action
  /gsd:plan-phase           -> Plan next phase
  /gsd:execute-plan         -> Build (fresh subagent contexts)
  /gsd:verify-work          -> Manual UAT
  |
DESIGN QUESTION?
  /mda-analyze [feature]    -> Trace mechanics to aesthetics
  /player-profile [concept] -> Bartle + Flow + PENS analysis
  /game-economy [system]    -> Resource flow modeling
  |
DEPLOY?
  <deploy>                  -> GitHub Pages (web)
  Use deployer agent        -> Mobile stores / Steam
  |
AUTOMATIC SAFETY NET (runs without user action):
  Code change    -> PostToolUse runs tests
  Context full   -> PreCompact backs up STATE.md
  Compaction     -> SessionStart re-injects context
  Claude stops   -> Stop hook ensures STATE.md updated
  |
END SESSION
  <save> -> tests + docs + commit + push
```

---

## 9. Design Methodologies

### Double Diamond (Discover, Define, Develop, Deliver)

- Diamond 1 (Problem Space): Discover (diverge) -> Define (converge)
- Diamond 2 (Solution Space): Develop (diverge) -> Deliver (converge)
- Each phase gates the next with explicit criteria
- Skills: /game-discover, /game-define, /game-develop, /game-deliver
- Reference: https://www.designcouncil.org.uk/our-resources/the-double-diamond/

### MDA Framework (Mechanics, Dynamics, Aesthetics)

- Designer works forward: Mechanics -> Dynamics -> Aesthetics
- Player experiences backward: Aesthetics -> Dynamics -> Mechanics
- 8 Aesthetics: Sensation, Fantasy, Narrative, Challenge, Fellowship, Discovery, Expression, Submission
- Skill: /mda-analyze
- Original paper: https://users.cs.northwestern.edu/~hunicke/MDA.pdf

### Bartle's Player Types

- Achievers (Acting on World), Explorers (Interacting with World)
- Socializers (Interacting with Players), Killers (Acting on Players)
- Skill: /player-profile

### Flow Theory (Csikszentmihalyi)

- Flow = challenge matches skill (between anxiety and boredom)
- Clear goals + immediate feedback + sense of control
- Skill: /player-profile

### PENS (Player Experience of Need Satisfaction)

- Competence (feeling effective), Autonomy (feeling choice), Relatedness (feeling connected)
- Plus: Presence (immersion) and Intuitive Controls
- Skill: /player-profile

### BMAD Method (Breakthrough Method for Agile AI-Driven Development)

- 9 specialized agents mapping to design phases
- Closest community equivalent to Double Diamond
- Install: https://github.com/aj-geddes/claude-code-bmad-skills

---

## 10. CLAUDE.md Best Practices

### Three-Tier Structure

```
~/.claude/CLAUDE.md          # Global (personal preferences, always loaded)
<project>/CLAUDE.md          # Project (team-shared, committed to git)
<project>/CLAUDE.local.md    # Local (personal overrides, auto-gitignored)
```

### What to Include

- Stack overview (1-2 lines)
- Key commands (test, lint, build, deploy)
- Project structure overview
- Code conventions your linter does NOT enforce
- Links to external docs (don't dump full docs)

### What NOT to Include

- Personality instructions ("Be a senior engineer") - wastes tokens
- Formatting rules a linter handles
- Full documentation dumps - link instead
- Overly generic instructions ("write clean code")

### Size

- Under 300 lines total, ideally 50-100 in root file
- Use `@path/to/file` imports for details (max depth 5)
- Auto-memory MEMORY.md: first 200 lines loaded (hard limit)

### Path-Specific Rules

`.claude/rules/` files support YAML frontmatter with paths:
```yaml
---
paths:
  - "components/**/*.tsx"
---
# R3F rules only loaded when touching these files
```

### Useful Tricks

- `/init` auto-generates a starter CLAUDE.md
- `/compact <instructions>` preserves specific context
- `/context` shows what's loaded and warns about excluded skills
- Add `@.planning/STATE.md` to import state into CLAUDE.md

---

## 11. Context Management

### Key Facts

- Context window: 200K tokens
- Auto-compact triggers at ~75% capacity (not 90%)
- Mixing topics in one chat = 39% performance degradation
- Each MCP server shrinks available context (200K -> ~70K with many MCPs)
- GSD spawns fresh 200K subagent contexts per task (fights context rot)

### Context Preservation Hooks

| Hook | additionalContext? | Plain stdout as context? |
|------|-------------------|-------------------------|
| SessionStart | Yes | Yes |
| UserPromptSubmit | Yes | Yes |
| PreToolUse | Yes | No |
| PostToolUse | Yes | No |
| SubagentStart | Yes (into subagent) | No |
| Async hooks | Yes (next turn) | No |

### Subagent Delegation

Offload to subagents:
- Codebase exploration (Explore agent)
- Verbose test suites
- Security scanning, linting, code review
- Any task with verbose output

Keep in main context:
- Architectural decisions and reasoning
- Active task state
- Error context being debugged
- Multi-file refactoring coordination

### Session Continuity Tools

| Tool | What | URL |
|------|------|-----|
| `claude --continue` | Resume last session | Built-in |
| `claude --resume` | Choose from recent sessions | Built-in |
| `/rename` | Name sessions for easy resume | Built-in |
| Continuous-Claude-v3 | Auto-handoff at compaction | https://github.com/parcadei/Continuous-Claude-v3 |
| claude-mem | AI-compressed session memory | https://github.com/thedotmack/claude-mem |
| Flashbacker | Session state + AI personas | https://github.com/agentsea/flashbacker |

---

## 12. Key Sources

### Official Documentation
- Hooks: https://code.claude.com/docs/en/hooks
- Skills: https://code.claude.com/docs/en/skills
- Subagents: https://code.claude.com/docs/en/sub-agents
- Memory: https://code.claude.com/docs/en/memory
- Settings: https://code.claude.com/docs/en/settings
- Best Practices: https://code.claude.com/docs/en/best-practices

### Plugin/Skill Registries
- Official Plugins: https://github.com/anthropics/claude-plugins-official
- Official Skills: https://github.com/anthropics/skills
- claude-plugins.dev: https://claude-plugins.dev/
- awesome-claude-code: https://github.com/hesreallyhim/awesome-claude-code
- VoltAgent skills: https://github.com/VoltAgent/awesome-agent-skills
- VoltAgent subagents: https://github.com/VoltAgent/awesome-claude-code-subagents
- everything-claude-code: https://github.com/affaan-m/everything-claude-code

### GSD
- GSD repo: https://github.com/glittercowboy/get-shit-done
- Context rot article: https://thenewstack.io/beating-the-rot-and-getting-stuff-done/

### Game Dev
- R3F docs: https://r3f.docs.pmnd.rs/
- Three.js agent skills: https://github.com/emalorenzo/three-agent-skills
- R3F ECS skills: https://github.com/Nice-Wolf-Studio/claude-skills-threejs-ecs-ts
- R3F skills (EnzeD): https://github.com/EnzeD/r3f-skills
- Three.js scene builder: https://claude-plugins.dev/skills/@Dexploarer/hyper-forge/threejs-scene-builder
- Unity MCP: https://github.com/CoplayDev/unity-mcp
- Colyseus: https://colyseus.io/
- Playroom Kit R3F: https://docs.joinplayroom.com/usage/r3f
- Capacitor: https://capacitorjs.com/
- steamworks.js: https://github.com/ceifa/steamworks.js
- GameCI steam-deploy: https://github.com/game-ci/steam-deploy

### Design Methodology
- Double Diamond: https://www.designcouncil.org.uk/our-resources/the-double-diamond/
- MDA Paper: https://users.cs.northwestern.edu/~hunicke/MDA.pdf
- BMAD Method: https://github.com/bmad-code-org/BMAD-METHOD
- BMAD Claude Code: https://github.com/aj-geddes/claude-code-bmad-skills

### Context Management
- Continuous-Claude-v3: https://github.com/parcadei/Continuous-Claude-v3
- PreCompact hook: https://github.com/mvara-ai/precompact-hook
- hooks-mastery: https://github.com/disler/claude-code-hooks-mastery
- CLAUDE.md guide: https://www.builder.io/blog/claude-md-guide

### Community Guides
- Claude Code mastery (240K+ views): https://github.com/TheDecipherist/claude-code-mastery
- How I use every feature: https://blog.sshh.io/p/how-i-use-every-claude-code-feature
- builder.io tips: https://www.builder.io/blog/claude-code
- Anthropic best practices: https://www.anthropic.com/engineering/claude-code-best-practices
