---
name: tdd
description: Show the game's engineering plan (the TDD) in plain English — architecture diagram, systems, data files Muzzy can edit, Dev Kit tools, recent decisions, risks, compliance status — or one section, or evaluate Muzzy's idea for a better/simpler way to build something. Use when Muzzy types /tdd, or asks "how is this built?", "how does X work under the hood?", "what if we built it this way?", "is this the right approach?", or about standards, performance, security, legal/compliance.
---

# /tdd — the engineering plan, at a glance

Read `.planning/TDD.md`. None yet? → offer to write it now from the code + GDD using the template `~/.claude/config/bmuz/templates/TDD.md` (survey an existing codebase with an Explore agent; explain the architecture in plain English — what each part does and why, before how). Commit `TDD: first draft`.

## `/tdd` (no words) → the digest, one screen
```
EXAMPLE GAME — how it's built      (example only — every line comes from the real TDD + code)
Stack: <framework + language + rendering + server>
Systems: <system → system · …>
Golden rules: <2–4 rules>
Dev Kit: Tuning ✅ · Time ✅ · Bug capture ⏳ · Animation (planned, F52)
Recent decisions: D12 <title> (<date>) · D11 Muzzy: <title>
Risks: <top 1–3>
Compliance: 4/6 ✅ — missing: <items>
Full doc: .planning/TDD.md (open in Obsidian — diagram renders there)
```
Everything from the doc and the code — never invent. If the doc and the code disagree, say so and fix the doc.

## `/tdd <section or system>` → that part
Plain English. Explain *what* it does and *why it's built that way* before *how*. Include the Mermaid diagram if it helps.

## `/tdd what if … / could we … / I think it'd be simpler to …` → evaluate an approach
Muzzy often sees simpler or outside-the-box approaches. Take them seriously:
1. Restate the idea in engineering terms.
2. Compare honestly with the current approach: effort, risk, performance, what it breaks or unlocks. If his is better, say so plainly. If it's better *with a tweak*, show the tweak.
3. **Muzzy decides.** Give your recommendation, then wait for his OK. Adopted → add a Decisions-log entry (`Proposed by: Muzzy`), update the affected TDD sections, and add features/tasks to ROADMAP/SPRINT if work follows. Commit `TDD: D<N> <decision>`.
4. Not adopted (his call) → still log it briefly with why (so it isn't re-argued), unless Muzzy says don't bother. If the idea answers an open ❓ feature, it closes only on his OK.

## Keeping it true (every verb follows this)
- /define writes the first TDD (build plan part). /develop updates it when a sprint changes architecture, adds a data file, or adds a Dev Kit tool. /deliver ticks compliance items.
- Any real "how should we build this" choice made during /develop → Decisions log.
