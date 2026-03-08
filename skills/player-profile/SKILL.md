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
