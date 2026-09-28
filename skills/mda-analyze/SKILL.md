---
name: mda-analyze
description: Claude's design-thinking framework (MDA — Mechanics → Dynamics → Aesthetics, Hunicke/LeBlanc/Zubek 2004). Sets a game's experience targets, traces a feature from rule to player behaviour to feeling, diagnoses why something "feels off" down to specific tuning knobs, and compares playtests against targets. The BMUZ stages call it automatically; also use when Muzzy asks why something is (or isn't) fun, what a change will do to how the game feels, or says something feels off, boring, too hard, too easy, unfair, slow.
---

# MDA — from rules to feelings

**The core idea (from the 2004 paper):** we build **mechanics** — rules, numbers, content. Play turns them into **dynamics** — what players actually end up *doing* over time. Dynamics create **aesthetics** — the *feelings* players have. We only control mechanics directly; dynamics and feelings we predict, then check in play.
- Designer's direction: mechanics → dynamics → feelings. Player's direction: feelings first, then behaviour, rules last. Design from the player's side ("what do they feel?") and build from ours.
- In BMUZ docs, MDA's "aesthetics" are called **experience targets** (feelings). Art is **look & sound** — never mix them.

## Words for feelings — a starting list, not a checklist
Sensation (sense-pleasure) · Fantasy (make-believe) · Narrative (drama) · Challenge (obstacle course) · Fellowship (social) · Discovery (uncharted territory) · Expression (self-expression) · Submission (pastime). The paper says the list is incomplete — use other words when they fit better: Competition, Tension, Mastery, Humour, Surprise… Never score a game on all eight; a small game has 1–2 primary targets.

## Human motivation — why the dynamics matter
Feelings come from what players *want*: to win, to master, to belong, to express themselves, to be surprised, to relax. Useful known dynamic models (from the paper and practice):
- **Competition** needs clear feedback on who's winning **and** every player believing they can still win.
- **Challenge** comes from pressure (time, opponents) that's beatable with skill — "I almost had it."
- **Fellowship** comes from shared information, shared goals, or reasons to talk during others' turns.
- **Tension** needs rise, release, and a finish — not flat pressure.
- **Feedback loops:** positive loops snowball the leader (kills tension); negative loops pull everyone together (can kill agency if too strong).
- **Probability shapes pacing:** how random outcomes are distributed decides how long games last and how fair they feel.

## Modes — pick by what's asked, or what the calling stage says
**targets** — Start from players: "what would they say afterwards?" Fill the GDD **Experience targets** table: 1–2 primaries, a secondary, "not this game", each in players' words, each with a **watchable** "we'll know when…" (behaviour you can see, not a feeling someone reports), 2–4 key moments, and watch-outs (dynamics that would kill the targets). Rough in /discover, locked in /define.

**trace <feature or mechanic>** — One line: `why: <mechanic> → <what players end up doing> → <target>`. The middle part must be a *behaviour*. Say it's a prediction until play shows it. Check it against the known traps: snowballing leader, stalemate, one best strategy, waiting around, too random, too solved. Enablers (UI, saving, foundations) don't need a trace — never suggest cutting them for lacking one. A target that nothing serves = a design gap; say so.

**diagnose "<what feels off>"** — the tuning loop, where MDA pays off most. Never meander through numbers:
1. **Name it** in Muzzy's words, and which target it hurts.
2. **Look at what's actually happening** — Dev Kit Snapshots/Time, bug capture, bot-vs-bot runs, or **proto** sims. Describe *behaviour* ("the leader is untouchable by round 3"), not the feeling.
3. **Sort the cause:** (a) **feel** — controls/response/juice (floaty, laggy, weak hits) → Dev Kit Feel/Animation/Tuning; (b) **readability** — the player can't see the state or the odds; (c) **dynamic** — a loop or pacing problem (table below); (d) **the rule can't do it** — stop tuning, it's a redesign → `/gdd what if`.
4. **Offer 2–3 knobs** — real values in `content/tuning/` (or ones we should expose), each with a direction and a prediction: "lower `leadBonus` 3→2: the leader's lead should stay under 10 points." One knob at a time. Muzzy judges the feel.
5. **Record** `Tuning: knob old→new — why — result` in SPRINT Notes; lasting rules → GDD Balance section.

| Dynamic you see | Usual knobs |
|---|---|
| Runaway leader | catch-up bonus, caps/diminishing returns, leader tax, hidden score |
| Stalemate / everyone tied | weaker catch-up, bigger late payouts, time limit |
| One strategy always wins | its cost / reward / cooldown; buff alternatives |
| Analysis paralysis | fewer options per turn, turn timer, less information |
| Waiting around | simultaneous play, shorter turns, something to do off-turn |
| Feels too random | rerolls/mulligans, show the odds, narrower spread |
| Solved / flat | more variance, hidden information, spaced-out events |
| Rushed / scrambling | longer or visible timers, warnings before deadlines, forgiving edge cases |

**playtest** — for each target: intended vs what was seen (behaviour first, then what players said). Update the GDD `Seen?` column with date + ✅/⚠️/❌. Anything ⚠️/❌ → one diagnose suggestion.

**reference <game>** — break a reference game into target → dynamics → mechanics, briefly, for /discover research.

## Rules
- **Short.** No standalone reports — write into the GDD (targets, mechanics, balance), ROADMAP `why:` lines, or SPRINT Notes, and say where.
- Mark predictions as predictions until play shows them.
- MDA doesn't cover whether controls *feel* good or whether it looks/sounds good — that's feel (Dev Kit Feel/Animation, response times, juice) and look & sound. Say so instead of forcing MDA onto it.
- Don't use MDA to generate ideas from scratch — it's for understanding and steering designs.
