---
name: game-prd
description: Generate a comprehensive 12-section Game PRD from a concept description. Fast-track alternative to the Double Diamond — fills all sections in one pass. Creates the same living document that DD phases build incrementally. Use when you already know what you want to build.
disable-model-invocation: true
context: fork
allowed-tools: Read, Write, Edit, Grep, Glob, WebSearch
---

# Game PRD Generator (Fast Track)

Create a comprehensive PRD for: $ARGUMENTS

This is the fast-track alternative to the Double Diamond. It fills all 12
sections of the PRD in one pass instead of building it incrementally across
4 phases. The output is the same `.planning/PRD.md` living document.

## Required Input (ask for any missing):
1. Game concept (one-paragraph pitch)
2. Target platform (Web / Mobile / Steam / All)
3. Target audience
4. Art style (references or description)
5. Core loop (what does the player DO every 30 seconds?)

## Output

Create `.planning/PRD.md` with all 12 sections filled:

```markdown
# [Game Name] — Product Requirements Document

> Living document. Created via fast-track /game-prd.
> Current phase: **PRD Complete**

---

## 1. Vision & Goals
- Elevator pitch (1 sentence)
- Target feeling/experience
- Platform targets
- Target audience

## 2. Audience & Player Personas
- 2-3 player personas with Bartle types, motivations, play habits
- Competitive landscape (5+ reference games)
- Genre opportunity map
- Inspiration & references

## 3. Design Principles
- Concept statement
- 3-5 design principles
- MDA targets (primary/secondary aesthetics)
- Success criteria
- Scope (v1 vs deferred)

## 4. Core Gameplay
- Core loop diagram (ASCII)
- Session flow (5 min of play)
- Mechanics table with MDA tracing
- Rules (if game has formal rules — turn structure, win conditions, edge cases)
- Progression system

## 5. Game Systems
- Per system: purpose, data, connections, key rules
- Balance data (if /proto has been run)
- Content reference (what content/data/ files define)

## 6. Art & Audio Direction
- Visual style, color palette, character design, UI style
- Music mood, SFX style, key audio cues

## 7. Technical Architecture
- Stack, state management, file structure
- Key technical decisions

## 8. Milestones
- v0.1: Playable prototype
- v0.2+: Feature milestones
- v1.0: Launch ready

## 9. Testing Strategy
- Automated test plan
- Manual playtest plan
- Quality gates

## 10. Known Issues & Bugs
None yet — this section is updated during development.

## 11. Future Ideas
Ideas that came up during PRD creation but are out of scope for v1.

## 12. Glossary
Game-specific terms and their definitions.
```

After completion:
"PRD complete — all 12 sections filled. This is a living document; it'll
get updated as you build and learn.
Next: `/gsd:new-project` to create the roadmap and start building.
Or: `/proto [rulebook]` to validate balance with simulations first."
