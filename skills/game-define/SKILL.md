---
name: game-define
description: Run the Define phase of the Double Diamond. Reads the PRD from Discover, narrows to a focused concept, adds design principles, MDA targets, and scope. Use after /game-discover or when you have a rough concept to refine.
disable-model-invocation: true
context: fork
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Define Phase - Double Diamond Game Design

You are guiding the DEFINE phase. The goal is CONVERGENT narrowing to a clear
concept. This phase UPDATES the PRD with design principles, MDA targets, and scope.

## Process

1. **Read PRD**: Load `.planning/PRD.md` — review sections 1-2 from Discover
2. **Insight Synthesis**: What patterns emerged? What's the core opportunity?
3. **Refine Vision**: Tighten the elevator pitch from rough to sharp
4. **Concept Statement**: "Players need [X] because [Y]"
5. **Design Principles**: 3-5 rules that guide ALL decisions
6. **MDA Targets**: Which aesthetics are primary?
   (Sensation, Fantasy, Narrative, Challenge, Fellowship, Discovery, Expression, Submission)
7. **Success Criteria**: How do we know this works?
8. **Scope Definition**: What's in v1? What's deferred?

## Output

### Update `.planning/PRD.md`

**Refine existing sections:**
- Tighten section 1 (Vision) — elevator pitch should be sharp now
- Refine audience/personas if needed based on narrowed concept

**Fill in section 3:**
```markdown
## 3. Design Principles

**Concept statement**: Players need [X] because [Y].
**What makes this different**: [1-2 sentences]

### Principles
1. **[Principle]**: [Why it matters] — [example of how it guides a decision]
2. **[Principle]**: [Why it matters] — [example]
3. **[Principle]**: [Why it matters] — [example]

### MDA Targets
- **Primary aesthetic**: [e.g., Challenge] — this is the core feeling
- **Secondary**: [e.g., Discovery] — supports the primary
- **Avoid**: [e.g., Submission] — this would undermine the design

### Success Criteria
- [ ] [Testable criterion — something you can observe in a playtest]
- [ ] [Testable criterion]
- [ ] [Testable criterion]

### Scope
| In v1 (must have) | Deferred (nice to have) |
|--------------------|------------------------|
| [feature] | [feature] |
```

**Update the phase marker:**
```
> Current phase: **Define**
```

## Gate Criteria

Before moving to /game-design:
- [ ] PRD sections 1-3 filled and coherent
- [ ] Elevator pitch is sharp (1 sentence, anyone can understand it)
- [ ] Design principles defined (3-5)
- [ ] MDA aesthetic targets chosen
- [ ] Scope agreed (v1 vs deferred)
- [ ] User has approved the concept direction

Tell the user:
"Concept defined! The PRD now has your design principles, MDA targets, and scope.
Next: `/game-design` to design mechanics, art direction, and systems."
