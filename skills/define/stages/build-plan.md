
# Build Plan — the last part of /define

Converge on HOW it gets built: architecture, milestones, and the feature map with
dependencies. A strong map here means fewer loops in /develop.

## Process

1. **Read GDD**: Load `.planning/GDD.md` — review all sections 1-6
2. **Technical Design**: stack, systems, data files, standards, compliance, Dev Kit tools → `.planning/TDD.md`
3. **Milestone Planning**: Break into buildable milestones (vertical slices), each tagged with the release it moves toward
3b. **Feature Map**: Break milestones into features with types, scope and dependencies → `.planning/ROADMAP.md` (see below)
4. **Testing Strategy**: Automated tests + manual playtest plan
5. **Content Requirements**: What assets/content are needed?
6. **Final Review**: Walk through full GDD with user, confirm everything

## Output

### Update `.planning/GDD.md`

**Write `.planning/TDD.md`** from the template `~/.claude/config/bmuz/templates/TDD.md` — stack (and why), how the systems fit (Mermaid diagram), golden rules, the data files Muzzy will edit in `content/`, standards, budgets, security, the compliance checklist (general audience, app-store basics), third-party licenses, risks. Pick the **Dev Kit** tools this game needs from `~/.claude/config/bmuz/DEVKIT.md` (Tier 1 always) — Tier 1 becomes a 🔧 foundation feature in the first milestone. Use the **game-architecture** method; explain every choice in plain English. In the GDD, section 7 becomes one line: `See TDD.md.`

**Fill in section 8 (Milestones):** one line — `See ROADMAP.md.` Milestones and features live only in the roadmap.

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
> Current phase: **Complete**
```

### Write `.planning/ROADMAP.md` — the feature map
Follow the ROADMAP format in `~/.claude/config/bmuz/PROJECT-FILES.md`.
1. List every Must/Should/Could feature from the Scope table. Split any that are really two things (a building block + what's built on it).
2. Type each: ❓ decision · 🧱 foundation · 🎮 player-facing · ✨ polish. Design questions that block building become ❓ features owned by Muzzy.
3. **Dependencies — the important part.** For each feature ask: what must exist (or be decided) first? Keep chains short: let foundations own the data other features need (the hand system owns deck + discard data), so features depend on the foundation, not on each other. Concrete ("splayed cards needs the card hand system") and abstract ("discard pile needs the discard-rule decision") both count. Use `~F07` when it only needs F07 to *work*, not be finished/tuned.
4. Group into milestones: the first milestone is the smallest playable loop. Foundations early, polish late. Each milestone moves toward a release (→ alpha).
5. Mark states: a feature whose needs are all ✅ (or has none) is 🟢 ready, the rest ⏳ waiting. ❓ decisions Muzzy can answer right now → ask, write the answer into the GDD, mark ✅.
6. **Show Muzzy the dependency picture** before writing — a short text tree of what unlocks what, plus "these N features are ready to start". Adjust with him.

## Gate Criteria

Before moving to building:
- [ ] All 9 core GDD sections filled (1-9)
- [ ] Technical architecture reviewed
- [ ] Milestones are vertical slices (not horizontal layers)
- [ ] ROADMAP.md written: every Must feature typed, scoped and linked to its needs
- [ ] Testing strategy defined
- [ ] User has approved the full GDD

Then do the hand-off in /define.
