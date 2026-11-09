# Hand-off card — how every finished piece of work is handed to Muzzy (F73)
① Muzzy, 2026-10-18: "I never want to see it any other way going forward! BMUZ standardizes the experience of designing as
a non-technical person." A Stop hook (`hooks/handoff-check.mjs`) checks it: a turn where Claude did work (edited files or
committed) must end with this card ② — or, while work is still running, with a progress line (below). A wording slip
(a label, a feature name, the clock, the sprint header) isn't sent back — that showed Muzzy the same message twice
(2026-11-06) — it reaches Claude with his next message, to fix from then on; substance (a dead link, no screenshot, no
weighing, no wake-up, a lesson or idea not landed) is still sent back until it's there. Edit the labels
here and the check follows (it reads every `**Label:**` in the card).

## The card
```
## <Feature ID + name, or what was done> — ready for you to check
**Done:** what was built (new code / content / tests) vs what was only measured or researched
**You'll see:** what changed from your side — and what stays the same
**Try it:** PC link · phone link · live link · planner (PPP) link — or "nothing to try: <why>"
**Proof:** the checks that ran (with results) + what the screenshots showed
**Your to-dos:** things only Muzzy can do (say yes in another window, try it on the phone, play a round) — or "none"
**Questions:** only decisions Muzzy answers, numbered 1. 2. 3. so he can answer by number, each one a question ending in "?" (options indented under it, Claude's pick first) — or "none"
**Next:** `/command` — what it will cover · or, while work keeps going on its own: "nothing to type — I keep going: <what's next>"
```
A `/command` under **Next** means "type this when you're ready". Never put one there while helpers are still working — Muzzy reads it as his cue and types it again and again (2026-10-30: five `/develop`s during F168).

Questions are only ones a designer can answer from what he sees, plays or wants — never an engineering choice
(how it's built, where a check runs, which verdict on a code audit): Claude decides those, says so in Done, and logs
why (Muzzy, 2026-11-04: "remember, i don't really understand this level of technical decisions") ③.
A question he hasn't answered after it's been asked twice moves to where it's decided (ROADMAP Ideas with the feature that needs it, or STATE Ask Muzzy) and leaves the card; don't re-ask it beside unrelated steps (Muzzy, 2026-11-09: "you keep asking me the same question, but having me do a try it that doesn't seem to have to do with the question… feels confusing") ③.
The card is the last thing on screen: what Muzzy must do or answer sits at the bottom, with nothing after it — no notes about hooks, timers or checks below the card (Muzzy, 2026-11-09: "the things you want me to do should be closer to the bottom of the latest message… it's possible I miss the thing I'm supposed to do or know"). In a BMUZ engine project (bmuz.json) handoff-check stands aside, since the engine writes the card ①.
The latest card stands alone: everything Muzzy needs to answer or review is IN it — the link to what he's reviewing (a page, not a buried file path: long material gets published as a page and linked under **Try it**) and every open question repeated in full, never "see above" (Muzzy, 2026-11-09: "you're asking me to review, but you didn't provide me a link… it's way up above. that's messy and easy to miss… put the questions/materials I need to reference to move forward in the current card") ③.
Questions holds questions only (Muzzy, 2026-10-23: "this didn't seem like a question. it felt like information. this
section is called Questions: i'm confused by that") — information goes in Done / You'll see, actions in Your to-dos; the
check sends back a Questions item with no "?". A question about something on screen names it as a player would (the
pop-ups, not "toasts"/"feedback") and gives its screenshot path or a link that opens it (framework sprint 39: Muzzy
looked for "notifications" in the gallery, found nothing — "still no visual here") ③. Plain words, short lines, jargon explained the first time. Links in full (http…) so they're clickable. A wrapped label
may hold bullets under it.

## Progress line (work still running — helpers, long checks)
```
████████░░ 80% · 4/5 steps · ~2 min left (waiting on helper) · posted 10:44 PM
```
Ten blocks, percent = steps done / total, an honest time guess, what it's waiting on, and the clock time (`date` first).
