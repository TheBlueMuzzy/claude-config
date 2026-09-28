# BMUZ-2 — where it's going (read this at the start of any BMUZ-improvement session)

## The vision
BMUZ is Muzzy's way to build games fast as a designer/artist who's only somewhat technical: he designs, Claude builds, and the process stays mostly invisible.
The long-term heart of it is a **Game Framework** (like the one at PlayTable/TapTop, where Muzzy was creative director): a library of easily modified **modules**. Starting a new game, Claude reads the GDD, **infers the modules it needs** (AI opponents, multiplayer, card hand…) and the project gets its bones automatically. Muzzy is only asked about genuine choices.
His games so far are deliberately varied to prove out which modules are needed. Roll Better ≈ beta, a testbed — not a game to keep polishing.

## Order of work
1. **Next: skill library review** — survey external Claude skill libraries/marketplaces and compare against this vision. What's already solved, what's a better version of something BMUZ has, what idea can be adapted? Areas: look-dev / art pipeline, animation, UI/UX, game feel, audio, standards, GDD/doc making, testing, release/store assets, anything else. Then clean up the BMUZ-connected skills.
2. **Then: the Game Framework**
   - Inventory all projects for candidate modules (read-only).
   - Muzzy picks the first 3–5 to harvest (Roll Better's online rooms, drag-to-zone, physics dice are strong candidates).
   - Framework repo `dev/framework/` + a catalog. Each module has: a plain-English card (what it gives the player, knobs in content/, needs, platforms, "proven in") · a platform-neutral spec with scenario tests · a reference build.
   - Modules are **copied** into games with a version stamp (a framework change never breaks a finished game); improvements get **harvested** back.
   - `/define`'s build plan picks modules automatically; missing ones become new-module features.
   - Converting platforms (e.g. web → Unity) = rebuild from the spec + scenario tests; feel always needs re-tuning.
   - Only make something a module once it's proven in a real game (no speculative abstractions).

## Open threads
- Roll Better: record as beta; park the physics-bug sprint; `/deliver` the finished F47 + F49 work sometime (no more bug-chasing).
- Laptop still needs BMUZ-2 installed (Google Task).
- Obsidian setup (vault = Documents/dev).
