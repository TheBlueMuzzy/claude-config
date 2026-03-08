---
name: game-design
description: Run the Design phase of the Double Diamond. Reads the PRD, explores multiple solution approaches, designs mechanics, art direction, and systems. Updates the PRD with core gameplay, systems, and art. Use after /game-define.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob, WebSearch
---

# Design Phase - Double Diamond Game Design

You are guiding the DESIGN phase. The goal is DIVERGENT exploration of solutions.
This phase UPDATES the PRD with core gameplay, systems, and art direction.

## Process

1. **Read PRD**: Load `.planning/PRD.md` — review sections 1-3 from Discover/Define
2. **Ideation**: Generate 3-5 different approaches to the core loop
3. **Mechanics Design**: For each approach, define the concrete mechanics
4. **MDA Validation**: Trace each mechanic → dynamic → aesthetic (check against section 3 targets)
5. **Choose Approach**: Pick the best one with user input
6. **Art Direction**: Style references, color palette, character proportions, audio direction
7. **System Design**: Data models, state management, key algorithms
8. **Prototype Scope**: What's the simplest testable version?

## Output

### Update `.planning/PRD.md`

**Fill in section 4 (Core Gameplay):**
```markdown
## 4. Core Gameplay

### Core Loop
[ASCII diagram of the core loop]

### Session Flow
What happens in 5 minutes of play:
1. [Player does X]
2. [System responds with Y]
3. [Player decides Z]
...

### Mechanics
| Mechanic | Input | Behavior | Feedback | Target Aesthetic |
|----------|-------|----------|----------|-----------------|
[one row per mechanic]

### Rules
[Formalized game rules — turn structure, win conditions,
edge cases, tie-breakers. Written here or during /proto]

### Progression
- How does the game get harder / deeper over time?
- What keeps the player coming back?
```

**Fill in section 5 (Game Systems):**
```markdown
## 5. Game Systems

### [System Name]
- **Purpose**: [one sentence]
- **Data it owns**: [what state it manages]
- **Talks to**: [other systems]
- **Key rules**: [important logic]

[Repeat for each system]

### Balance Data
[Key findings from /proto simulation if available.
Full reports in .planning/research/simulations/]

### Content Reference
[What content files exist in content/data/ and what they define.
E.g., cards.json — all card definitions; characters.json — faction abilities]
```

**Fill in section 6 (Art & Audio Direction):**
```markdown
## 6. Art & Audio Direction

### Visual Style
- **Style**: [description + references]
- **Color palette**: [hex codes or descriptions]
- **Character design**: [proportions, style]
- **UI style**: [minimal, ornate, etc.]

### Audio Direction
- **Music mood**: [genre, tempo, feel]
- **SFX style**: [realistic, stylized, retro, etc.]
- **Key sounds**: [list the most important audio cues]
```

**Update the phase marker:**
```
> Current phase: **Design**
```

### Save exploration detail to `.planning/research/explorations.md`

Put the approach comparison, rejected ideas, MDA tracing work, and
art reference links here. The PRD gets the chosen approach; this file
keeps the alternatives for future reference.

## Gate Criteria

Before moving to /game-deliver:
- [ ] PRD sections 1-6 filled and coherent
- [ ] Approach chosen and justified
- [ ] Mechanics specified with MDA tracing
- [ ] Art and audio direction defined
- [ ] Systems identified
- [ ] User has approved the direction

Tell the user:
"Design complete! The PRD now has your core gameplay, systems, and art direction.
Next: `/game-deliver` to finalize architecture, milestones, and prep for building."
