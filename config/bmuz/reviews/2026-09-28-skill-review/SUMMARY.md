# Skill library review — 2026-09-28

Research: look & feel/UI (`review-ui.md`), marketplaces (`review-marketplaces.md`), indie toolkit (`review-toolkit.md`), MCPs (`review-mcps.md`).
**Done 2026-09-28 (Muzzy said go on 1–3):** C5–C8, B4, D9–D13 built + wired into BMUZ steps; MCP card at `references/mcp-card.md`. **Still to do:** A1–A3 UI kit (own sprint, first Framework module), E14 (Unity, later). Open for Muzzy: context7 → plugin; move my-first-baby Supabase MCP into its `.mcp.json`.
Spot-checked first-hand: systematic-debugging has 2 dead links to superpowers skills; no skill covers game feel; multiplayer-setup never mentions PartyKit (deliver/play/live-playtest assume it); `release/` has only a README.

## Proposed changes (grouped, in suggested order)

### A. Look & feel — the #1 time sink
1. **Standard prototype UI kit** (first Game Framework module): tokens in `content/ui/theme.json` (hue, radius, density, font scale, skin, motion) → layout pieces that use `gap` (add a row, still works) → standard controls → ~20 game screens (pause, settings-from-a-list, game over, save slots, dialogue, HUD bars…) → screen stack for back/escape → 3 skins (clean / pixel / textured-Kenney).
   - Web: shadcn/ui base (+ 8bitcn for pixel, @react-three/uikit for in-3D panels — same look). Unity: `sinanata/unity-ui-toolkit-design-system` (MIT, Unity 6).
   - Prove it by rebuilding Roll Better's menus/settings/HUD/results.
2. **`ui-kit` rule skill** loaded by /develop for any UI: build from kit parts only, no raw px/colours.
3. **Dev Kit Theme Tuner + screen gallery** (idea from the `playground` plugin), gallery screenshotted at phone + desktop.
- Keep `frontend-design` off (it pushes unique looks); use only for store/landing pages. Skip Figma MCP (free plan ≈ 20 calls/month).

### B. Game feel — biggest missing skill
4. **New `game-feel` skill** (from gamedev-skills `game-feel`, Apache-2.0): screen shake, hit-stop, squash/stretch, easing; small/medium/big presets in `content/feel.json`; "reduce shake" accessibility. Libraries: Motion / GSAP (now free), maath + three.quarks (R3F), PrimeTween (Unity). Add `physics-tuning` ideas for dice.

### C. Free indie toolkit + legal
5. **`~/.claude/references/indie-toolkit.md`**: vetted free sources with a licence traffic light (green no-credit: Kenney, Quaternius, Poly Haven, ambientCG, Fluent Emoji, Sonniss, Pixabay · yellow credit-needed: game-icons.net, Kevin MacLeod · red: LYGIA, Shadertoy default, share-alike/GPL/non-commercial), hosting free-tier limits, analytics.
6. **`content/credits.json` rule** — organize-assets records licences, /deliver refuses to ship uncredited assets.
7. **Placeholder ladder** in /develop: shapes → emoji/icons → Kenney/Quaternius → real art.
8. **audio-setup upgrade**: code-made SFX (ZzFX/jsfxr, `content/sfx.json`) + mixing/ducking/variation from gamedev-skills `audio-design`.

### D. Quality + release
9. **Adopt superpowers `verification-before-completion`** (enforces "prove it works", fixes the dead links); add the "NOT ASSESSED — NO DATA" rule to audits.
10. **optimize upgrade**: measure → frame budget → re-measure.
11. **/deliver**: `release/itch.md` (butler, 630×500 cover, HTML5 zip limits, GitHub Action), /code-review + /security-review before merge, patch notes from commits.
12. **multiplayer-setup**: add PartyKit/Cloudflare Durable Objects (free tier) as the web default.
13. Refresh `vite` / `vitest` from antfu/skills.

### E. Later (Unity work resumes)
14. Selected official Unity skills (`unity-cli`, `new-unity-project`, `project-auditor-fixes`, `optimize-web`) + `csharp-lsp` plugin; GameCI for WebGL builds.

## Studio-discipline check
Design ✅ (MDA) · Production ✅ · Engineering standards → D9–11 · Tech art/tools → A3 · QA → D9 · Art/audio → C5–8 · UX/UI → A1–2 · Game feel → B4 · Performance → D10 · Legal/licences → C5–6 (was a real gap) · Security → D11 · Localization ✅ · Release → D11 · Analytics → toolkit card (Cloudflare Web Analytics / GameAnalytics) · Crash reports → Sentry free tier (in toolkit card).

## Skipped on purpose
Claude-Code-Game-Studios as a whole (GSD-sized bloat; ideas borrowed), superpowers workflow skills, ui-ux-pro-max, NES.css/RPGUI/Radix Themes, Figma MCP, Godot + community Unity packs, security-guidance plugin (token-heavy), aggregator GDD skills, Netlify Free / Vercel Hobby for sold games, Colyseus Cloud (no free tier), asset-search MCPs (immature).

## Unverified (flagged by researchers)
Kenney licence (search snippets only), Poly Pizza + Shadertoy licence pages (403), Netlify credit costs, some small free-tier limits, Game UI Database.
