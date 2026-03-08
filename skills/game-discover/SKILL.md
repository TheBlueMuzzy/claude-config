---
name: game-discover
description: Run the Discover phase of the Double Diamond for game design. Use when starting a new game concept, researching a genre, or exploring the problem space. Creates the PRD as a living document and fills in vision and audience.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, WebSearch, WebFetch
---

# Discover Phase - Double Diamond Game Design

You are guiding the DISCOVER phase. The goal is DIVERGENT exploration of the
problem space. This phase CREATES the PRD and fills in the first sections.

## Process

1. **Gather Context**: Ask the user about their game idea, genre interests,
   and target audience
2. **Competitor Analysis**: Research 5-10 reference games in the genre
   - For each: core loop, art style, monetization, player reviews, what works/fails
3. **Player Research**: Create 2-3 player personas based on the target genre
   - Demographics, motivations (use Bartle types), play habits, platform preferences
4. **Genre Analysis**: Map the genre landscape
   - Market saturation, underserved niches, emerging trends
5. **Inspiration Gallery**: Compile visual/mechanical references
   - Art style references, mechanic references, narrative references

## Output

### Create `.planning/PRD.md` (the living document)

This is the START of the PRD. It will grow through each phase.

```markdown
# [Game Name] — Product Requirements Document

> Living document. Updated each design phase.
> Current phase: **Discover**

---

## 1. Vision & Goals
- **Elevator pitch**: [1 sentence — rough, will be refined in Define]
- **Target feeling**: [What emotion/experience should players have?]
- **Platform**: [Web / Mobile / Steam / etc.]
- **Target audience**: [Who is this for? Rough description]

## 2. Audience & Player Personas

### Persona: [Name]
- Age/background: [description]
- Motivation (Bartle type): [Achiever/Explorer/Socializer/Killer]
- Play habits: [When, how long, on what device]
- What they want: [core need]

### Persona: [Name]
[repeat]

### Competitive Landscape

| Game | Core Loop | Art Style | What Works | What's Missing |
|------|-----------|-----------|------------|----------------|
[5-10 entries]

### Genre Opportunity Map
- **Saturated**: [areas to avoid]
- **Underserved**: [niches to target]
- **Emerging**: [trends to leverage]

### Inspiration & References
- **Mechanical references**: [games to learn from]
- **Aesthetic references**: [art/music/narrative style]
- **Anti-references**: [what to avoid and why]

---

*Sections below will be filled in during Define, Design, and Deliver phases.*

## 3. Design Principles
[Coming in Define phase]

## 4. Core Gameplay
[Coming in Design phase]

## 5. Game Systems
[Coming in Design phase]

## 6. Art & Audio Direction
[Coming in Design phase]

## 7. Technical Architecture
[Coming in Deliver phase]

## 8. Milestones
[Coming in Deliver phase]

## 9. Testing Strategy
[Coming in Deliver phase]

## 10. Known Issues & Bugs
None yet.

## 11. Future Ideas
[Parking lot for ideas that come up during design]

## 12. Glossary
[Game-specific terms and their definitions]
```

### Save research detail to `.planning/research/competitors.md`

Put the full competitor deep-dives here. The PRD gets the summary.

### Save reference links to `.planning/research/references.md`

Inspiration images, videos, articles, GDC talks, etc. Keep the receipts.

## Gate Criteria

Before moving to /game-define, ensure:
- [ ] `.planning/PRD.md` exists with sections 1-2 filled
- [ ] At least 5 competitor games analyzed
- [ ] At least 2 player personas created
- [ ] Core opportunity/niche identified
- [ ] Inspiration references compiled
- [ ] Research saved to `.planning/research/`

Tell the user:
"Discovery done! The PRD has your vision, audience, and competitive landscape.
Next: `/game-define` to narrow the concept and set design principles."
