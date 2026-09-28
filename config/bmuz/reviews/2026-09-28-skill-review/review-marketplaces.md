# Skill-library review — external marketplaces & libraries (broad survey)

Date: 2026-09-28 · Scope: skills/plugins outside BMUZ, compared to Muzzy's current set. UI look-and-feel and free-asset sources are excluded (other agents cover them).
Method: GitHub API (stars, last push, licence) + the actual SKILL.md files downloaded and read. Anything I did **not** open myself is marked *(unverified)*.

Legend: **ADOPT** = install as-is · **BETTER-THAN-OURS** = replaces/upgrades one of his · **STEAL-THE-IDEA** = copy a technique into a BMUZ skill · **SKIP**

---

## 1. The landscape in one paragraph
- Directories: **skills.sh** (Vercel, install-count leaderboard, `npx skills add <repo>`), **SkillsMP** (auto-indexes every SKILL.md on GitHub, millions of entries, mostly noise), mcpmarket.com / claudemarketplaces.com / claudeskills.info (aggregators, many AI-written summaries, low signal). Curated lists: **hesreallyhim/awesome-claude-code** (54.7k★, pushed today), **ComposioHQ/awesome-claude-skills** (75.8k★), **VoltAgent/awesome-agent-skills** (35k★, best list of *official vendor* skills), travisvn/awesome-claude-skills (15k★, stale since April). None of the general lists have a game-dev section worth mining; the game-dev value is concentrated in 3–4 repos below.
- Pattern that matters for BMUZ: the best libraries are **vendor-official** (Unity, GreenSock, Anthropic) or **tightly scoped engine-neutral discipline skills** (gamedev-skills). Giant "AI studio" frameworks exist (Claude-Code-Game-Studios, 25k★) but are exactly the bloat Muzzy retired GSD for.

## 2. Candidate table

### Game feel / juice / animation
| Candidate | URL | What it does | Free | Maintained | Verdict |
|---|---|---|---|---|---|
| **game-feel** (gamedev-skills) | github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/main/skills/disciplines/game-feel | Juice as engine-neutral recipes: trauma-based screen shake (trauma², decays), hit-stop with real-time wait, squash & stretch + BACK/ELASTIC overshoot, **importance tiers (small/medium/large feedback presets)**, "juice must return to rest", reduce-shake a11y option, verify-by-playing checklist. Read in full — genuinely good. | Yes, Apache-2.0 | 1.2k★, pushed 2026-09-27 | **ADOPT** (or fork into a BMUZ `game-feel` skill with presets in `content/tuning/feel.json`). He has **nothing** covering this today — grep across all his skills finds no shake/hit-stop/easing guidance. Examples are Godot/Unity; Claude can translate to R3F (`useFrame` + refs). |
| **physics-tuning** (gamedev-skills) | …/disciplines/physics-tuning | Fixed timestep vs render interpolation, CCD against tunnelling, mass/drag/solver iterations, stress-test verification. | Yes | same | **ADOPT** — directly relevant to Roll Better's physics-dice bugs. |
| **EnzeD/r3f-skills** (r3f-physics, r3f-animation, …11 skills) | github.com/EnzeD/r3f-skills | Current (Fiber 9 / Rapier 2 / React 19) task recipes: Rapier bodies, colliders, joints, animation. | Yes (licence not checked) | 120★, pushed 2026-08-31 | **STEAL-THE-IDEA** — his `r3f-best-practices` is rules/perf; this is "how to build X". Pull r3f-physics + r3f-animation only if he hits them; don't install all 11. |
| **GSAP official skills** (greensock/gsap-skills) | github.com/greensock/gsap-skills | 8 skills: core, timeline, React (`useGSAP` cleanup), plugins (Flip, Draggable, SplitText), performance. | Yes, MIT (GSAP itself now free) | 15.7k★, pushed 2026-07-29 | **ADOPT only if/when a project uses GSAP** for UI/menu tweening. Official, high quality *(SKILL bodies not opened — verified via repo metadata + listing)*. |
| Motion (motion.dev) skill, `npx motion-ai` | motion.dev | Doc-search skill for Motion/Framer Motion. | Yes | *(unverified)* | SKIP for now — only if a project adopts Motion. |
| iart-ai/motion-skills | github.com/iart-ai/motion-skills | ~50 motion-graphics/video skills (kinetic type, explainers, Reels). | MIT | 524★, recent | SKIP for gameplay; possible later for **trailers/store video** (release assets). |
| Spine / procedural animation skills | — | Searched; nothing credible found. | — | — | Gap: nothing exists. |

### Testing / QA / verification
| Candidate | URL | What it does | Free | Maintained | Verdict |
|---|---|---|---|---|---|
| **superpowers: verification-before-completion** | github.com/obra/superpowers/tree/main/skills/verification-before-completion | "Evidence before claims" gate: identify the command that proves the claim → run it fresh → read output → only then claim. Table of claim→required evidence (incl. "agent reported success → check the diff"). | MIT | 292k★, pushed 2026-09-27 | **ADOPT** (small, 120 lines). Directly enforces his CLAUDE.md "Verify your work" rule. His `systematic-debugging` already *references* this skill but he doesn't have it — a dangling link. |
| superpowers: test-driven-development | …/skills/test-driven-development | Red-green-refactor discipline. | MIT | same | **STEAL-THE-IDEA** — his `/bug` already does "failing test first"; lift the red-green check into `/develop` rather than add another skill. |
| **testdino-hq/playwright-skill** (esp. `core/canvas-and-webgl.md`, `core/visual-regression.md`) | github.com/testdino-hq/playwright-skill | Deep Playwright guide set (~60 reference files). The canvas/WebGL file covers `toHaveScreenshot` on a canvas with `maxDiffPixelRatio`, masking dynamic regions, clicking canvas coordinates, reading pixels via `page.evaluate`. | MIT | 378★, pushed 2026-09-06 | **STEAL-THE-IDEA** — copy the canvas + visual-regression patterns into `/develop`/`/bug` (e.g. "screenshot baseline per screen, 1% tolerance, wait for a `window.__gameReady` flag"). Whole skill is too big to install. |
| anthropics/skills: webapp-testing | github.com/anthropics/skills/tree/main/skills/webapp-testing | Python Playwright scripts + `with_server.py` to start dev server then test. | Yes | 179k★ repo | SKIP — he already has the Playwright MCP plugin + `/play`; this adds a Python path he doesn't need. |
| SawyerHood/dev-browser | github.com/SawyerHood/dev-browser | Browser skill for Claude to verify its own work, pixel/DOM level. | MIT | 6.6k★ | SKIP — overlaps Playwright MCP. |
| **Unity official `unity-cli`** (Unity-Technologies/skills) | github.com/Unity-Technologies/skills/tree/main/skills/unity-cli | Official Unity CLI: install editors, create projects, **`unity test` (EditMode/PlayMode, exit code 8 = tests failed)**, `unity build`, drive a live Editor (create GameObjects, run C#), configure Unity's MCP server. | Free; Unity Companion Licence | 996★, pushed **today** | **ADOPT when he's back in Unity.** This is the Unity testing + automation route; it supersedes community test-runner skills. |
| Dev-GOM unity-test-runner | github.com/Dev-GOM/claude-code-marketplace | Detect editor, run tests in batch mode, parse NUnit XML. | Apache-2.0 | 98★, last push Jan 2026 | SKIP — superseded by official `unity test`. |
| Unity AI Playtest (mcpmarket) | mcpmarket.com/tools/skills/unity-ai-playtest | Claims agents drive Play Mode and report. | ? | *(unverified — page summary only)* | SKIP until verified. |

### Engineering standards / code review / security
| Candidate | URL | What it does | Free | Maintained | Verdict |
|---|---|---|---|---|---|
| Built-in `/code-review`, `/simplify`, `/security-review` | (already in his Claude Code) | Correctness review, cleanup, security review of branch. | Yes | Anthropic | **Already have — wire into `/deliver`** (run `/code-review` + `/security-review` before merge). No install needed. |
| security-guidance (claude-plugins-official) | github.com/anthropics/claude-plugins-official/tree/main/plugins/security-guidance | Regex warnings on edits (innerHTML, secrets…) + LLM diff review **every turn** + agentic review on each commit. | Yes (costs tokens each turn) | 37k★ repo, pushed today | SKIP for now — per-turn LLM review is heavy for prototype games. Reconsider for anything with accounts/payments (Supabase, multiplayer). |
| pr-review-toolkit (official) | …/plugins/pr-review-toolkit | 6 review agents (comments, tests, error handling, types…). | Yes | same | SKIP — built-in `/code-review` covers it; he doesn't do PRs. |
| csharp-lsp (official) | …/plugins/csharp-lsp | C# language server for Claude (go-to-definition, errors). | Yes | same | **ADOPT when doing Unity work** (he already has typescript-lsp on). |
| superpowers: requesting-code-review | obra/superpowers | Dispatch a fresh reviewer subagent with crafted context after each task. | MIT | same | STEAL-THE-IDEA — `/develop` could spawn one reviewer subagent at feature end instead of a new skill. |
| feature-dev, ralph-loop (official) | claude-plugins-official | 7-phase feature workflow; Stop-hook "keep looping until DONE". | Yes | same | SKIP — duplicates `/develop`; ralph is the opposite of "wait for approved". |

### GDD / design docs / production / playtesting
| Candidate | URL | What it does | Free | Maintained | Verdict |
|---|---|---|---|---|---|
| **Claude-Code-Game-Studios** (Donchitos) | github.com/Donchitos/Claude-Code-Game-Studios | 49 agents, ~80 skills mirroring a studio (brainstorm, design-system, sprint-plan, qa-plan, smoke-check, balance-check, playtest-report, release-checklist, patch-notes, team-* orchestration). Skills depend on shared hooks/yaml config/"director gates". | MIT | 25.5k★, pushed 2026-09-24 | **SKIP as a whole** (GSD-scale bloat, AAA-studio metaphor). **STEAL-THE-IDEA ×3:** (a) balance-check's **"NOT ASSESSED — NO DATA" rule** — a check with no inputs must say "could not run", never a green pass (they note it prevented fake "COMPLIANT" and ">99% headroom" reports) → put into `/optimize`, `accessibility-check`, `/bug` sweep, `/deliver`. (b) **playtest-report** template (first-5-minutes: understood goal/controls, emotional response; pain/confusion/delight points) → merge into `mda-analyze`'s playtest comparison or `live-playtest`. (c) **patch-notes/changelog** from commits at `/deliver`. |
| GDD Architect / Game Planner / Game Design Principles (mcpmarket) | mcpmarket.com/tools/skills/game-design-document-gdd-architect (source: github.com/lysimachoschertouras/setupwizard) | GDD facilitation, pillars, conflict detection, epics. | ? | *(unverified — aggregator summaries only)* | SKIP — his `/discover`+`/define`+`/gdd` + MDA already exceed these; the "conflict detection when a mechanic changes" idea is worth one line in `/gdd what if…` (check the change against pillars + dependent features). |
| gamedev-skills **prototype-fast** | …/workflows/prototype-fast | 1-hour greybox with a hard timebox and explicit **keep/kill criteria** answering "is it fun?". | Apache-2.0 | active | STEAL-THE-IDEA — add keep/kill criteria to `/discover`'s quick-prototype step. |
| gamedev-skills **game-jam** | …/workflows/game-jam | Scope-to-clock planning, cut list, submit on time. | Apache-2.0 | active | SKIP unless he does jams. |
| superpowers brainstorming / writing-plans / executing-plans | obra/superpowers | Generic design→plan→execute workflow. | MIT | active | SKIP — BMUZ is a game-specific version of this. |
| Playtest analytics skills | searched (agent-analytics, aitmpl "game-analytics-integration") | Funnels/heatmaps via hosted analytics. | mixed | *(unverified)* | SKIP — nothing game-specific and free worth adopting. **Gap**: a tiny "event log → content/ JSON → Dev Kit chart" module is a Game Framework candidate, not a skill to download. |

### Genre / systems skills (Game Framework relevance)
| Candidate | URL | What it does | Free | Maintained | Verdict |
|---|---|---|---|---|---|
| gamedev-skills **card-game, puzzle, roguelike, tower-defense…** (9 genre skills) | …/skills/genres/* | "Must-have systems" list + design-knob table per genre (card-game: zones, draw/reshuffle, turn state machine, effect resolution as data). | Apache-2.0 | active | **STEAL-THE-IDEA for the Game Framework** — these "must-have systems" lists are a ready-made checklist for `/define` to *infer modules from the GDD*. Don't install; use as reference when building the module catalog. |
| gamedev-skills **save-systems** | …/disciplines/save-systems | Engine-neutral: atomic writes, slots, schema migration, autosave. | Apache-2.0 | active | SKIP — his `save-system` is equivalent (versioning, migration, 3-backup corruption recovery) and web-specific. |
| gamedev-skills game-ai / ai-behavior-trees-utility-ai | …/disciplines/* | FSMs, BTs, steering, utility AI. | Apache-2.0 | active | SKIP — his `ai-opponent` (goal-selection personality model, proven in Glyphtender) is more opinionated and his own. |
| gamedev-skills threejs-* (3) / CloudAI-X/threejs-skills (10, 3.4k★) | … | Three.js scene/loaders/materials fundamentals. | yes | active | SKIP — covered by his three/r3f best-practices. |
| Godot skills (Randroids, gamedev-skills godot-*, godogen) | … | Godot-specific. | yes | active | SKIP — not his stack. godogen's idea "judge the running game from a recorded clip, not a clean compile" is already in his CLAUDE.md. godogen uses **paid** asset APIs. |

### Audio
| Candidate | URL | What it does | Free | Maintained | Verdict |
|---|---|---|---|---|---|
| **gamedev-skills audio-design** | …/disciplines/audio-design | Bus/mixer architecture in dB, **ducking**, adaptive music (layering/re-sequencing), **SFX variation** (pitch/volume randomisation, round-robin), beat sync. | Apache-2.0 | active | **BETTER-THAN-OURS (upgrade to `audio-setup`)** — his skill is plumbing (manager, formats, sprites, spatial) with zero mixing/ducking/variation guidance (grep confirms). Merge the design half into `audio-setup` or keep both (setup vs design). |
| Unity audio-setup-mixers / optimize-audio (official) | Unity-Technologies/skills | Route AudioSources to mixer groups via live editor; import-setting optimisation. | Unity Companion | active | ADOPT with the Unity pack when he's in Unity. |

### Performance
| Candidate | URL | What it does | Free | Maintained | Verdict |
|---|---|---|---|---|---|
| **gamedev-skills performance-optimization** | …/disciplines/performance-optimization | **Profile first**, frame-time budget, CPU vs GPU bottleneck, then pooling/batching/GC fixes. | Apache-2.0 | active | **BETTER-THAN-OURS (method upgrade to `optimize`)** — his `optimize` is a static checklist (bundle, compression, "draw calls under 100") with no measure-first step or budget. Add: set a frame budget, capture a baseline (r3f-perf / Chrome trace), fix, re-measure. Keep his plain-English reporting. |
| Unity **optimize-web** (official) | Unity-Technologies/skills/tree/main/skills/optimize-web | Unity WebGL/WebGPU: build size, compression, shader stripping, KTX. | Unity Companion | pushed today | **ADOPT if he ever ships Unity to web/itch.** |
| Unity **project-auditor-fixes** (official) | …/project-auditor-fixes | Runs Project Auditor via CLI, fixes CSV issues one commit at a time, test case before/after; never reports an empty "clean" scan. | Unity Companion | active | ADOPT with the Unity pack. |

### Release / platforms
| Candidate | URL | What it does | Free | Maintained | Verdict |
|---|---|---|---|---|---|
| **gamedev-skills itch-publish** | …/workflows/itch-publish | butler CLI push to named channels (html5/win/mac), versioned uploads, page setup. | Apache-2.0 | active | **STEAL-THE-IDEA** → becomes the itch.io recipe inside `/deliver`'s per-platform release recipes. |
| gamedev-skills steam-publish | …/workflows/steam-publish | Steamworks onboarding, depots. | Apache-2.0 | active | Keep as reference; not needed yet. |
| Unity new-unity-project / build-live-game / setup-multiplayer-services (official) | Unity-Technologies/skills | Guided new Unity project; UGS live-ops (cloud save, leaderboards, remote config, analytics). | Unity Companion | active | new-unity-project: ADOPT with the Unity pack (fits `/discover` "starts a new project"). build-live-game: SKIP until needed. |

### Other useful for a solo dev
| Candidate | URL | Verdict |
|---|---|---|
| **Unity-Technologies/skills (whole pack, 33 skills)** — official, pushed today, `npx skills add Unity-Technologies/skills` | github.com/Unity-Technologies/skills | **ADOPT selectively when Unity work resumes**: unity-cli, new-unity-project, project-auditor-fixes, optimize-web, ui-uitk/ugui (UI → other agent), localization (overlaps his `localize` for Unity). Not before — 33 skills idle = bloat. |
| CoplayDev/unity-mcp (14.6k★, MIT, pushed yesterday) | github.com/CoplayDev/unity-mcp | Community Unity Editor MCP. Now that Unity's own CLI configures an official MCP server, **prefer the official route**; unity-mcp is the fallback. |
| Nice-Wolf-Studio/unity-claude-skills (36★), JulianKerignard/Unity-Skills (7★), mindrally/unity *(unverified)* | … | SKIP — low adoption, doc dumps; official pack wins. |
| anthropics/skills: skill-creator | (he already has it) | Use it for the BMUZ clean-up — it can run evals on trigger descriptions. |
| playground (official, parked) | claude-plugins-official/plugins/playground | Out of my scope (UI) but note: its templates (controls + live preview + copy-prompt) fit **Dev Kit tuning pages** — worth re-enabling for one trial. |
| Flue (in awesome-claude-code) | github.com/SFKislev/Flue | Lets Claude script desktop apps incl. Blender, Photoshop, Unity *(unverified beyond list entry)* — interesting for his art pipeline; hand to the art/pipeline reviewer. |

---

## 3. His skills that look weaker than what's out there
1. **No game-feel skill at all** — the biggest gap given "look & feel is the biggest time sink". gamedev-skills `game-feel` fills it.
2. **`audio-setup`** — plumbing only; no mixing, ducking, SFX variation or adaptive music. Upgrade from `audio-design`.
3. **`optimize`** — checklist without "measure first / frame budget / re-measure"; can report success with no data. Upgrade from `performance-optimization` + the "NOT ASSESSED" rule.
4. **`systematic-debugging`** — it's an **older copy of obra/superpowers'** (diff: missing one step line, same body) and links to `superpowers:test-driven-development` and `superpowers:verification-before-completion`, which he does not have. Either add verification-before-completion or strip the dead links.
5. **`vite` / `vitest`** — vendored from antfu/skills at versions 2026.1.28 / 2026.1.31; upstream is **2026.9.25**. Refresh them (8 months stale).
6. **`r3f-best-practices` / `three-best-practices`** — match upstream (emalorenzo/three-agent-skills, v1.1.0 / v2.1.0, last push Jan 2026); fine but the upstream is quiet — nothing better found, keep.
7. **`/deliver`** — no itch.io recipe and no automatic code/security review before merge; both available cheaply (itch-publish idea; built-in `/code-review` + `/security-review`).
8. Solid / nothing better found: `save-system`, `ai-opponent`, `proto`, `mda-analyze`, `game-economy`, `live-playtest`, the BMUZ workflow skills (external workflow frameworks — Game Studios, superpowers, feature-dev — are either bloated or generic).

## 4. Top 5 recommendations
1. **ADOPT gamedev-skills `game-feel` (+ `physics-tuning`)** as BMUZ specialists, adapted to R3F with feel presets in `content/tuning/`. Fills the one clear gap and hits his #1 pain (feel/polish loops). Apache-2.0, active.
2. **ADOPT superpowers `verification-before-completion`** (tiny) — fixes the dangling link in `systematic-debugging` and hard-wires "prove it works" into `/develop`/`/bug`/`/deliver`.
3. **Upgrade `audio-setup` and `optimize`** with the engine-neutral method from gamedev-skills `audio-design` and `performance-optimization`, plus Game Studios' **"NOT ASSESSED — NO DATA"** rule so audits can never return a fake green.
4. **Upgrade `/deliver`**: itch.io butler recipe (from `itch-publish`), run built-in `/code-review` + `/security-review` before merge, and patch-notes from commits. Also refresh `vite`/`vitest` from antfu/skills (8 months stale).
5. **When Unity resumes: install a *selected* slice of the official Unity-Technologies/skills** (unity-cli for `unity test`/build/Editor control, new-unity-project, project-auditor-fixes, optimize-web) + the official `csharp-lsp` plugin. Meanwhile use gamedev-skills' **genre "must-have systems" lists** as the seed checklist for the Game Framework module catalog.

## Sources
- https://github.com/gamedev-skills/awesome-gamedev-agent-skills (SKILL.md files read: game-feel, physics-tuning, card-game, audio-design, performance-optimization, save-systems, prototype-fast, itch-publish, game-jam)
- https://github.com/Unity-Technologies/skills (read: unity-cli, project-auditor-fixes, optimize-web, optimize-audio, audio-setup-mixers, new-unity-project, build-live-game, localization, LICENSE)
- https://github.com/Donchitos/Claude-Code-Game-Studios (read: playtest-report, balance-check, smoke-check; skill list)
- https://github.com/obra/superpowers (read: verification-before-completion, systematic-debugging, requesting-code-review, TDD)
- https://github.com/anthropics/skills (webapp-testing) · https://github.com/anthropics/claude-plugins-official (security-guidance, pr-review-toolkit, playground, ralph-loop, feature-dev READMEs; plugin list)
- https://github.com/testdino-hq/playwright-skill (core/canvas-and-webgl.md)
- https://github.com/greensock/gsap-skills · https://github.com/EnzeD/r3f-skills · https://github.com/emalorenzo/three-agent-skills · https://github.com/antfu/skills · https://github.com/CloudAI-X/threejs-skills
- https://github.com/CoplayDev/unity-mcp · https://github.com/Dev-GOM/claude-code-marketplace · https://github.com/htdt/godogen
- Lists: https://github.com/hesreallyhim/awesome-claude-code · https://github.com/ComposioHQ/awesome-claude-skills · https://github.com/VoltAgent/awesome-agent-skills · https://github.com/travisvn/awesome-claude-skills · https://skills.sh · https://skillsmp.com
- Unverified aggregator pages: mcpmarket.com (GDD Architect, Unity AI Playtest), motion.dev skill
