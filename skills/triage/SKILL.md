---
name: triage
description: Quick pre-analysis before any non-trivial task. ICE score + complexity classification + pre-mortem. Use before unplanned work or when deciding whether something is worth doing.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Quick Triage

Analyze before doing: $ARGUMENTS

Run all three assessments, then give a clear recommendation. Keep it tight — this should take under 2 minutes.

## Step 1: ICE Score

Rate each 1-10 based on what you know about the codebase and the task:

| Factor | Score | Reasoning |
|--------|-------|-----------|
| **Impact** — How much does this improve the player experience or codebase? | /10 | |
| **Confidence** — How sure are you about the scope and approach? | /10 | |
| **Ease** — How simple is the implementation? | /10 | |
| **ICE Score** | = I x C x E | |

**Benchmarks:** 500+ = no-brainer, 200-500 = worth doing, 100-200 = think twice, <100 = probably skip

## Step 2: Cynefin Classification

Classify the task into one domain:

| Domain | Description | Approach |
|--------|-------------|----------|
| **Simple** | Clear cause-effect, known solution | Just do it. No planning needed. |
| **Complicated** | Discoverable solution, needs analysis | Analyze first, then execute. Add it as a feature via `/roadmap` and plan it in a `/sprint`. |
| **Complex** | Unknown unknowns, emergent behavior | Prototype first. Expect iteration. |
| **Chaotic** | Broken/urgent, no time to analyze | Stabilize immediately, assess after. |

State the domain and WHY. One sentence.

## Step 3: Pre-Mortem

Assume this task has been completed and something went wrong. List the 2-4 most likely failure modes:

| What could go wrong | Likelihood | Severity | Mitigation |
|---------------------|------------|----------|------------|
| | Low/Med/High | Low/Med/High | |

Only flag real risks — don't invent unlikely scenarios.

## Recommendation

Based on the three assessments, give ONE of these verdicts:

- **GO** — Do it now. [simple/high-ICE tasks]
- **GO WITH PLAN** — Worth doing, but plan first. Suggest `/roadmap` to add it, then `/sprint`. [complicated tasks]
- **PROTOTYPE FIRST** — Too many unknowns. Build a spike. [complex tasks]
- **DEFER** — Not worth it right now. Note in VISION.md if the idea has merit. [low-ICE tasks]
- **STOP AND STABILIZE** — Something's broken, fix it before anything else. [chaotic]

### If GO or GO WITH PLAN:

Estimate scope:
- **Files touched:** ~N
- **Complexity:** trivial / small / medium / large
- **Suggested approach:** [1-2 sentences]
