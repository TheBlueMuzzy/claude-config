# Hand-off card — how every finished piece of work is handed to Muzzy (F73)
Muzzy, 2026-10-18: "I never want to see it any other way going forward! BMUZ standardizes the experience of designing as
a non-technical person." A Stop hook (`hooks/handoff-check.mjs`) checks it: a turn where Claude did work (edited files or
committed) must end with this card — or, while work is still running, with a progress line (below). Edit the labels
here and the check follows (it reads every `**Label:**` in the card).

## The card
```
## <Feature ID + name, or what was done> — ready for you to check
**Done:** what was built (new code / content / tests) vs what was only measured or researched
**You'll see:** what changed from your side — and what stays the same
**Try it:** PC link · phone link · live link · planner (PPP) link — or "nothing to try: <why>"
**Proof:** the checks that ran (with results) + what the screenshots showed
**Questions:** what Claude needs from Muzzy — or "none"
**Next:** `/command` — what it will cover
```
Plain words, short lines, jargon explained the first time. Links in full (http…) so they're clickable. A wrapped label
may hold bullets under it.

## Progress line (work still running — helpers, long checks)
```
████████░░ 80% · 4/5 steps · ~2 min left (waiting on helper) · posted 10:44 PM
```
Ten blocks, percent = steps done / total, an honest time guess, what it's waiting on, and the clock time (`date` first).
