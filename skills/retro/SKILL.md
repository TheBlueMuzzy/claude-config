---
name: retro
description: Post-milestone retrospective using NOISE + Five Whys + Assumption Mapping. Use after completing a milestone to harvest lessons before moving on.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Retrospective

Retrospective for: $ARGUMENTS

If no milestone specified, read `.planning/STATE.md` and `.planning/ROADMAP.md` to identify the most recently completed milestone.

## Step 1: Gather Evidence

Before analyzing, read the actual record:
- Finished sprints for that milestone in `.planning/archive/sprints/` (older milestones: GSD SUMMARY files in `.planning/archive/gsd/`)
- Plan Notes and ROADMAP Watch lines (what went wrong during the build)
- STATE.md Key facts and Log (plus `.planning/archive/log.md`)
- Git log for the milestone period (`git log --oneline --since="[milestone start]"`)
- VISION.md entries captured during the milestone

## Step 2: NOISE Analysis

Solution-focused — build on what worked.

### Needs
What must change for the next milestone? Non-negotiable improvements.

### Opportunities
What could be leveraged or expanded? Things that showed promise.

### Improvements
What's already getting better? Trends in the right direction across this milestone.

### Strengths
What worked really well? Processes, patterns, tools, decisions to keep.

### Exceptions
When did problems NOT happen? What was different about those times?
- "Chunk X went smoothly — why? What was different from Chunk Y that struggled?"
- These exceptions often reveal the real best practices.

## Step 3: Five Whys (on the biggest pain point)

Pick the single biggest friction point from the milestone and drill down:

1. **What happened?** [the symptom]
2. **Why?** [first cause]
3. **Why?** [deeper cause]
4. **Why?** [deeper still]
5. **Why?** [root cause]

**Root cause:** [one sentence]
**Preventive action:** [what to change going forward]

If there were multiple significant pain points, run Five Whys on up to 3.

## Step 4: Assumption Check

What assumptions were made at the start of the milestone? Were they right?

| Assumption | Was it true? | Impact of being wrong | Lesson |
|------------|-------------|----------------------|--------|
| | Yes/No/Partially | Low/Med/High | |

Flag any assumptions that were wrong AND high-impact — these are the expensive lessons.

## Output

### Milestone Report Card

| Area | Rating | Note |
|------|--------|------|
| Scope accuracy (did we build what we planned?) | /5 | |
| Effort estimation (did it take as long as expected?) | /5 | |
| Quality (how many issues found when Muzzy reviewed?) | /5 | |
| Process (did the /sprint → /develop → /deliver loop work smoothly?) | /5 | |

### Keep Doing
- ...

### Start Doing
- ...

### Stop Doing
- ...

### Actions
Concrete changes to make. For each:
- What to change
- Where (CLAUDE.md rule? Skill update? Process change?)
- Who owns it (Muzzy decision vs Claude can just do it)

### Feeds Into
- CLAUDE.md updates — if process changes are identified
- Skill updates — if a skill needs improvement based on lessons learned
