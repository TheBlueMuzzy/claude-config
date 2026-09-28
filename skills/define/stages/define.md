
# Define Phase - Double Diamond Game Design

You are guiding the DEFINE phase. The goal is CONVERGENT narrowing to a clear
concept. This phase UPDATES the GDD with design principles, MDA targets, and scope.

## Process

1. **Read GDD**: Load `.planning/GDD.md` — review sections 1-2 from Discover
2. **Insight Synthesis**: What patterns emerged? What's the core opportunity?
3. **Refine Vision**: Tighten the elevator pitch from rough to sharp
4. **Concept Statement**: "Players need [X] because [Y]"
5. **Design Principles**: 3-5 rules that guide ALL decisions
6. **MDA Targets**: Which aesthetics are primary?
   (Sensation, Fantasy, Narrative, Challenge, Fellowship, Discovery, Expression, Submission)
7. **Success Criteria**: How do we know this works?
8. **Scope Definition**: Must (per release stage: alpha / beta / 1.0) · Should · Could · Won't

## Output

### Update `.planning/GDD.md`

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
Sort every feature idea into one bucket. "Must" is per release — what's a must for alpha is different from 1.0.

| Must — alpha | Must — beta | Must — 1.0 | Should | Could | Won't (this game) |
|---|---|---|---|---|---|
| [feature] | [feature] | [feature] | [feature] | [feature] | [feature — and why not] |

Releases for this game: prototype → alpha → beta → 1.0 (rename or drop stages if Muzzy wants).
**Done** for a release = every Must for it is done.
```

**Update the phase marker:**
```
> Current phase: **Define**
```

## Gate Criteria

Before moving to the Design stage:
- [ ] GDD sections 1-3 filled and coherent
- [ ] Elevator pitch is sharp (1 sentence, anyone can understand it)
- [ ] Design principles defined (3-5)
- [ ] MDA aesthetic targets chosen
- [ ] Scope agreed (musts per release, should, could, won't)
- [ ] User has approved the concept direction

Tell the user:
"Concept defined! The GDD now has your design principles, MDA targets, and scope.
Next: the Design part of /define — mechanics, art direction, and systems."
