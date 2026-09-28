---
name: concept-eval
description: Evaluate a game concept or major feature using SOAR + Gap Analysis + Impact Mapping. Use during Double Diamond Discover/Define or when scoping a new direction.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebSearch
  - WebFetch
---

# Concept Evaluation

Evaluate: $ARGUMENTS

## Step 1: SOAR Analysis

Focus on what's strong and where the opportunity lives. No weakness-dwelling.

### Strengths
What do you (Muzzy) and this project already do well? Consider:
- Technical strengths (what's already built, what stack enables)
- Design strengths (what players already love, what the game does uniquely)
- Personal strengths (art, design sense, 3D, rapid prototyping)

### Opportunities
What external factors make this a good idea right now?
- Market gaps, trending mechanics, platform advantages
- Existing codebase that can be leveraged
- Community interest or player feedback

### Aspirations
What does success look like? Be specific.
- Player experience target ("I want players to feel ___")
- Scope target ("This is a ___ sized addition")
- Quality target ("This should be as polished as ___")

### Results
What measurable outcomes would confirm this worked?
- Player behavior (retention, session length, sharing)
- Project health (code quality, maintainability)
- Personal satisfaction (are you excited to build this?)

## Step 2: Gap Analysis

| Area | Current State | Desired State | Gap | Action to Close |
|------|--------------|---------------|-----|-----------------|
| | Where things are now | Where this concept takes them | What's missing | What to build/learn/change |

Be honest about gaps in skill, tech, and time — not just features.

## Step 3: Impact Mapping

Work backwards from the goal:

```
GOAL: [What player experience or outcome are you targeting?]
  |
  WHO: [Who is affected? Players, you, community?]
    |
    IMPACT: [What behavior change do you need from them?]
      |
      DELIVERABLE: [What feature/system drives that change?]
```

Map each deliverable back up the chain. If a deliverable can't trace to a behavior change that traces to the goal, question whether it belongs.

## Output: Concept Verdict

### Viability: Strong / Promising / Risky / Not Ready

### Summary
2-3 sentences on whether to pursue this and why.

### If pursuing:
- **Core deliverables** (the Impact Mapping leaf nodes that matter most)
- **Biggest gap to close** (the highest-risk item from Gap Analysis)
- **Suggested next step**: `/discover` (to explore it more) or `/define` (to scope it and map the features)

### If not ready:
- What would need to change
- Park in `.planning/VISION.md` with context
