
# Discover Phase - Double Diamond Game Design

You are guiding the DISCOVER phase. The goal is DIVERGENT exploration of the
problem space. This phase CREATES the GDD and fills in the first sections.

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

### Create `.planning/GDD.md` (the living document)

This is the START of the GDD. It will grow through each phase.

```markdown
# [Game Name] — Game Design Document

> Living document. Updated each design phase.
> Current phase: **Discover**


## 1. Vision & Goals
- **Elevator pitch**: [1 sentence — rough, will be refined in Define]
- **Target feeling** (rough experience targets, in players' words): [e.g. "one more try" — Challenge · "we were yelling" — Fellowship]
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


*Sections below will be filled in by /define (define, design, build plan).*

## 3. Design Principles
[Coming in /define]

## 4. Core Gameplay
[Coming in /define — design]

## 5. Game Systems
[Coming in /define — design]

## 6. Art & Audio Direction
[Coming in /define — design]

## 7. Technical Design
See TDD.md (written by /define's build plan).

## 8. Product
- **Platforms & release path:** <web first, then app stores / Steam?>
- **Audience:** general (not made for kids) · <who>
- **Business:** <free / paid / cosmetics / none yet>
- **Success looks like:** <e.g. friends ask to play again>
- **Milestones:** see ROADMAP.md
See ROADMAP.md (written by /define).

## 9. Testing Strategy
[Coming in /define — build plan]

## 10. Known Issues & Bugs
See .planning/ROADMAP.md (Later / Watch lines).

## 11. Future Ideas
See .planning/VISION.md (the parking lot).

## 12. Glossary
[Game-specific terms and their definitions]
```

### Save research detail to `.planning/research/competitors.md`

Put the full competitor deep-dives here. The GDD gets the summary.

### Save reference links to `.planning/research/references.md`

Inspiration images, videos, articles, GDC talks, etc. Keep the receipts.

## Gate Criteria

Before moving to the Define stage, ensure:
- [ ] `.planning/GDD.md` exists with sections 1-2 filled
- [ ] At least 5 competitor games analyzed
- [ ] At least 2 player personas created
- [ ] Core opportunity/niche identified
- [ ] Inspiration references compiled
- [ ] Research saved to `.planning/research/`

Tell the user:
"Discovery done! The GDD has your vision, audience, and competitive landscape.
Next: `/define` to narrow the concept, set principles and scope, and map out the build."
