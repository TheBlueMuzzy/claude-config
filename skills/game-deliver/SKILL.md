---
name: game-deliver
description: Run the Deliver phase of the Double Diamond. Finalizes the PRD with technical architecture, milestones, and testing strategy. After this, the PRD is ready for GSD to create a roadmap. Use after /game-design.
disable-model-invocation: true
context: fork
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Deliver Phase - Double Diamond Game Design

You are guiding the DELIVER phase. The goal is CONVERGENT finalization.
This phase COMPLETES the PRD with architecture, milestones, and testing strategy.

After this phase, the PRD is ready for `/gsd:create-roadmap` to plan and build.

## Process

1. **Read PRD**: Load `.planning/PRD.md` — review all sections 1-6
2. **Technical Architecture**: Stack decisions, state management, file structure
3. **Milestone Planning**: Break into buildable milestones (vertical slices)
4. **Testing Strategy**: Automated tests + manual playtest plan
5. **Content Requirements**: What assets/content are needed?
6. **Final Review**: Walk through full PRD with user, confirm everything

## Output

### Update `.planning/PRD.md`

**Fill in section 7 (Technical Architecture):**
```markdown
## 7. Technical Architecture

### Stack
- **Framework**: [React/Vite, Unity, etc.]
- **Language**: [TypeScript, C#, etc.]
- **Rendering**: [R3F, Three.js, Unity URP, etc.]
- **State Management**: [Zustand, ECS, etc.]
- **Deployment**: [Vercel, GitHub Pages, Steam, etc.]

### File Structure
[Proposed directory layout]

### Key Technical Decisions
| Decision | Choice | Why |
|----------|--------|-----|
[important architecture calls]
```

**Fill in section 8 (Milestones):**
```markdown
## 8. Milestones

### v0.1 — Playable Prototype
Core loop playable. Minimal art. No polish.
- [Feature list]

### v0.2 — [Name]
[Description]
- [Feature list]

### v0.3 — [Name]
[Description]
- [Feature list]

### v1.0 — Launch Ready
Full game, polished, tested, deployable.
- [Feature list]
```

**Fill in section 9 (Testing Strategy):**
```markdown
## 9. Testing Strategy

### Automated Tests
- [ ] Core game logic (rules, scoring, state)
- [ ] System integration (do systems talk correctly?)
- [ ] Edge cases (empty state, max values, rapid input)

### Manual Playtesting
- [ ] First 30 seconds — is it immediately understandable?
- [ ] 5-minute session — is the core loop fun?
- [ ] 15-minute session — does progression feel right?
- [ ] Target audience test — do the right people enjoy it?

### Quality Gates
Before each milestone ships:
- [ ] All automated tests pass
- [ ] Manual playtest completed
- [ ] No known critical bugs
- [ ] Performance acceptable on target devices
```

**Update the phase marker:**
```
> Current phase: **Deliver (PRD complete)**
```

## Gate Criteria

Before moving to building:
- [ ] All 9 core PRD sections filled (1-9)
- [ ] Technical architecture reviewed
- [ ] Milestones are vertical slices (not horizontal layers)
- [ ] Testing strategy defined
- [ ] User has approved the full PRD

Tell the user:
"PRD complete! All core sections filled. This is your source of truth — it'll
keep getting updated as you build.
Next: `/gsd:create-roadmap` to create the roadmap and start building."
