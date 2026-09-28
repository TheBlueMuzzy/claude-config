# BMUZ skill-library review: Look & Feel / UI-UX

Researched 2026-09-28. Read-only; nothing installed or changed.
Legend: ✔ = verified first-hand (page fetched, GitHub API, npm registry or local file); ~ = from search-result snippets only (not opened).

## 0. Why this is a time sink (first-hand evidence)

- `roll-better/src/App.css` is **1,450 lines of hand-written CSS** with only **14 CSS variables**. It has no `@media` rules and dozens of raw px values (8px ×20, 4px ×13, 10px ×9 …). MainMenu.tsx alone is 462 lines. Each screen was styled one-off, so every new row or panel means another round of tweaking.
- `goops` uses Tailwind. `roll-better` and `windchime` use plain CSS. No project shares a UI kit, tokens or components.
- **Root cause:** nothing sits between "the game needs a settings screen" and the raw CSS. A shared kit with tokens and layout primitives would take away most of the decisions made per screen, and that is where the back-and-forth comes from.

## 1. Claude Code skills and plugins

| Candidate | URL | What it does | Free? | Maintained? | Verdict |
|---|---|---|---|---|---|
| **frontend-design** (official plugin, installed but disabled) | github.com/anthropics/claude-plugins-official/tree/main/plugins/frontend-design | Design-lead persona: picks a *distinctive* palette, type and layout, avoids "AI-slop" tells, plans in two passes (token plan, then build) and critiques itself with screenshots. | ✔ Apache-2.0 | ✔ Last upstream commit 2026-09-01. **Local copy is byte-identical to upstream, so it is NOT outdated.** | **STEAL-THE-IDEA** (keep disabled). It pushes Claude toward novelty for every brief, which is the opposite of a *standardized* prototype skin. Take its token-plan-first process, the "remove one accessory" restraint rule and its UI-copy rules into the kit skill. Enable it only for store pages, landing pages and itch pages. |
| **playground** (official plugin, disabled) | …/plugins/playground | One self-contained HTML file with controls on the left, a live preview and a natural-language prompt with a Copy button. Templates: design-playground, data-explorer, concept-map, document-critique, diff-review, code-map. | ✔ Apache-2.0 | ✔ Last commit 2026-02-20 (licence add). Small and stable. | **STEAL-THE-IDEA** (optionally ADOPT). It is exactly the "theme tuner" pattern for the kit: sliders for radius, spacing and hue, with the output as a prompt *or* a `theme.json` diff. Claude already builds these by hand. Adopt the template's rules (single state object, presets, only non-default values in the prompt) into a BMUZ `dev-kit-page` pattern that writes `content/ui/theme.json` directly. Enabling it as-is also works, but its `open file.html` step assumes macOS. |
| **anthropics/skills: theme-factory** | github.com/anthropics/skills/tree/main/skills/theme-factory | Curated font and colour theme presets applied to artifacts. | ✔ (repo) | ✔ Repo active (frontend-design path committed 2026-09-03) | **STEAL-THE-IDEA**: "named presets" is the right idea for kit skins (Cozy, Arcade, Sci-fi, Parchment). The content targets slides and docs, though. |
| **anthropics/skills: web-artifacts-builder** | skills.sh/anthropics/skills/web-artifacts-builder | Scaffolds React+TS+Vite+Tailwind with 40+ shadcn/ui components and bundles to one HTML file. | ✔ | ✔ | **STEAL-THE-IDEA**: it proves "Vite + Tailwind + shadcn preinstalled" is Anthropic's own house stack for quick UIs. Its bundling-to-single-HTML step could power Dev Kit tools. |
| **shadcn skill** (official, from shadcn) | ui.shadcn.com/docs/skills | Teaches Claude the shadcn CLI, project `components.json`, theming, registries and correct composition. Install: `pnpm dlx skills add shadcn/ui`. | ✔ free/OSS | ✔ current docs | **ADOPT**, *if* the kit is built on shadcn (recommended below). It removes wrong-API churn. |
| **interface-design** (Dammyjay93) | github.com/Dammyjay93/interface-design | Picks a design direction once, saves tokens and decisions to `.interface-design/system.md`, reloads them every session, and enforces them (`design-review`, `design-deslop`). | ✔ MIT, 5.7k★ | ✔ pushed 2026-06-20 | **STEAL-THE-IDEA** (the strongest *idea* found). "Decide once, persist, enforce" is the fix for the back-and-forth. BMUZ already has the persistence spot (`content/ui/theme.json` + the kit), so copy its enforcement/review step rather than install it. It is aimed at SaaS dashboards, not games. |
| **ui-ux-pro-max** (nextlevelbuilder) | github.com/nextlevelbuilder/ui-ux-pro-max-skill | Searchable database of 79 styles, 192 palettes and 74 font pairs, plus 119 UX rules. Generates a design system per product type. | ✔ MIT, ~131k★ | ✔ pushed 2026-09-27 | **SKIP**. It needs Python and is web/SaaS-oriented with **no game or pixel styles** (per README). It adds variety when the goal is consistency. At most, mine its palette and font-pair lists once. |
| **game-ui-ux** (gamedev-skills/awesome-gamedev-agent-skills) | github.com/gamedev-skills/awesome-gamedev-agent-skills | Engine-neutral game UI rules: anchor + container flow (no absolute px), reference-resolution scaling, safe areas, keyboard/gamepad focus, a **screen stack**, and an event-driven HUD. | ✔ Apache-2.0, 1.2k★ | ✔ pushed 2026-09-27 (skill updated 2026-07-25) | **STEAL-THE-IDEA**: these six rules belong in the kit's rulebook verbatim. There is no R3F skill; its Unity/Godot parts point to engine skills. Worth a second look in the "standards" review area (74 skills incl. itch/Steam publishing). |
| **Claude-Code-Game-Studios** (Donchitos): `team-ui`, `ux-design`, `ux-review` + templates | github.com/Donchitos/Claude-Code-Game-Studios | Full studio simulation. UI parts: `ux-spec.md`, `hud-design.md`, and an **interaction-pattern-library** that specs every control (Primary/Secondary/Destructive button, toggle, slider, dropdown, modal, confirm dialog, toast, tooltip, progress, tabs, scroll). Each spec has a state table (default/hover/focus/pressed/disabled/loading), timings (80 ms ease-out, 0.97× press), audio hooks, gamepad and a11y. | ✔ MIT, 25.5k★ | ✔ pushed 2026-09-24 | **STEAL-THE-IDEA**: the pattern library is the "spec" half of a Figma-style library. Copy the control state tables into the kit as its behaviour spec (both web and Unity builds follow it). SKIP the multi-agent team pipeline, which is far too heavy for Muzzy's hands-off flow. (The fetch of its `design-system` skill showed it is a GDD skill, not UI.) |
| **awesome-ux-skills** (tommyjepsen) | github.com/tommyjepsen/awesome-ux-skills | UX research and review skills: heuristics, Dieter Rams, cognitive load, `double-diamond`, `design-analysis` (screenshot → tokens). | ✔ 237★, licence not shown | ~ | **SKIP**, except that `design-analysis` (screenshot → token file) could be useful later for "make it look like this reference". |
| mcpmarket "Game HUD Design", "Unity uGUI Game UI Design", "Game UX Design Architect" | mcpmarket.com/tools/skills/… | Marketplace listings for HUD/uGUI skills. | ~ | ~ unverified | **SKIP / unverified**: not opened. uGUI is the older Unity UI, and these are listing pages with unclear authorship. |

### vs Muzzy's existing skills
- **web-design-guidelines** (Vercel): a *review* pass against Web Interface Guidelines. Keep it. It is complementary: it checks, the kit prevents. None of the candidates replace it.
- **accessibility-check**: keep. The Game Studios control specs and game-ui-ux rules (focus ring, 44/48 px targets, not colour alone) should be *built into* kit components so this audit finds less.
- **tuning-setup**: keep. The kit's `theme.json` is the same idea for UI (tokens instead of magic numbers). Leva is already the slider layer; the theme tuner reuses it.
- **r3f-best-practices / three-best-practices**: keep. Add one rule: "screen UI = DOM overlay kit; in-world UI = drei `<Html>` or uikit".
- **Nothing found is BETTER-THAN-OURS** for these five skills. The gap is a *build* skill with a standard kit, which BMUZ doesn't have at all.

## 2. Game-UI approaches, pattern libraries, kits, layout

| Candidate | URL | What | Free? | Maintained? | Verdict |
|---|---|---|---|---|---|
| **8bitcn/ui** | github.com/TheOrcDev/8bitcn-ui | shadcn-based retro components **plus game blocks**. ✔ Listed in repo: `main-menu`, `pause-menu`, `audio-settings`, `difficulty-select`, `save-slots`, `dialogue`, `game-over`, `victory-screen`, `loading-screen`, `leaderboard`, `quest-log`, `character-sheet`, `friend-list`, `health-bar`, `mana-bar`, `xp-bar`, `enemy-health-display`. | ✔ MIT, 2k★ | ✔ pushed 2026-09-23 | **STEAL-THE-IDEA** (and ADOPT for pixel-styled games). Its block list is almost exactly the "95% of game screens" inventory. Copy the *screen list and structure* into the kit. Its look is pixel-only, so it can't be the default skin. |
| **Game UI Database** (Edd Coates) | gameuidatabase.com | 55k+ screenshots from 1,300+ games, filterable by screen type (title, settings, pause, inventory, HUD elements), genre and colour. | ~ free to browse (site 403s to fetch; details from search + AlternativeTo) | ~ | **STEAL-THE-IDEA**: the reference step in `/discover` and `/define` ("show 3 settings screens from cozy games"). Search results say its screen-type taxonomy is a good checklist for kit coverage. |
| **Kenney UI Pack** (+ RPG expansion, Sci-Fi, Adventure, Pixel Adventure) | kenney.nl/assets/ui-pack | 430 UI sprites (panels, buttons, sliders, checkboxes) + 85 RPG, 130 Sci-Fi, 130 Adventure. | ~ CC0 (search snippets for each page, consistent with Kenney's known licensing) | ~ | **ADOPT** as the optional *textured skin* (9-slice panels/buttons via CSS `border-image` or Unity sprite borders). It is free, CC0 and matches across web and Unity. |
| **@react-three/uikit** (pmndrs) | pmndrs.github.io/uikit | WebGL-rendered UI inside the 3D scene: yoga flexbox, scrolling, theming. Two kits: **default-kit (shadcn-based)** and horizon-kit. | ✔ MIT | ✔ v1.0.76 on npm, 2026-09-01; 3.2k★ | **STEAL-THE-IDEA / use when needed**. It is for *in-world* UI (dice labels, 3D panels, XR). For normal menus and HUD, a DOM overlay is simpler, crisper and accessible. Because its default kit mirrors shadcn, a shadcn-based DOM kit and in-world uikit panels share one visual language. |
| **drei `<Html>`** | @react-three/drei | Pins DOM elements to 3D positions. | ✔ MIT | ✔ v10.7.9, 2026-09-25 | **ADOPT** (already in roll-better). It is the bridge that lets kit components (tooltips, name tags) float over 3D objects. |
| CSS grid/flex conventions (layout primitives) | — | `Stack`, `Row`, `Grid`, `Panel`, `Screen` with gap-based spacing from tokens, no fixed heights, `clamp()` type, `env(safe-area-inset-*)`. | free | — | **STEAL-THE-IDEA**: this is the literal fix for "add a row and it still works". Layout primitives + tokens mean Claude never writes margins by hand. |
| Leva / Tweakpane | npm | Runtime sliders. | ✔ MIT | Leva 0.10.1 (2025-10); Tweakpane 4.0.5 (2024-11, slowing) | Keep Leva (already in tuning-setup). Point it at `theme.json` too. |

## 3. Web component libraries: which makes the standard "prototype skin"?

| Candidate | Free? | Maintained? | Fit for game prototypes | Verdict |
|---|---|---|---|---|
| **shadcn/ui** (Radix primitives + Tailwind, copy-paste code you own) | ✔ MIT | ✔ very active; official Claude skill | The code lives in the repo, so Claude can restyle it freely. The same model is used by 8bitcn (game blocks) and uikit default-kit (3D). CSS-variable theming. **Tweakcn** (github.com/jnsahaj/tweakcn, ✔ Apache-2.0, 10.4k★, pushed 2026-09-03) is a free visual theme editor that outputs shadcn variables. | **ADOPT as the base.** |
| **daisyUI 5** | ✔ MIT | ✔ v5.7.46, 2026-09-24 | Pure CSS classes, 35 themes, zero deps, very fast to write. It lacks behaviour (focus traps, keyboard nav for dropdowns and dialogs) compared with Radix. | **Runner-up.** Fine for jam-speed one-offs. Mixing it with shadcn causes theme clashes, so pick one. |
| **Radix Themes** | ✔ MIT | ✔ v3.3.0, 2026-01 | Pre-styled, polished, but less restyle-friendly and only light/dark. | SKIP (use Radix *primitives* via shadcn instead). |
| **NES.css** | ✔ MIT | ✘ last npm release 2022, repo pushed 2024-01 | Pure-CSS 8-bit look. | SKIP (stale; 8bitcn covers this and is maintained). |
| **RPGUI** | ~ licence NOASSERTION on GitHub | ✘ pushed 2023-10 | Old-school RPG CSS + images. | SKIP (stale, unclear licence). Kenney textures do this better. |
| **snes.css** | ~ | ~ | Retro CSS. | SKIP (not verified; niche). |

**Recommendation:** the prototype skin is **shadcn/ui (Radix + Tailwind) + a BMUZ token file + game blocks modelled on 8bitcn's list**. Skins are just token presets ("clean", "pixel" = 8bitcn styles, "textured" = Kenney 9-slice).

## 4. Figma-to-code

| Candidate | URL | Free? | Fit | Verdict |
|---|---|---|---|---|
| **Figma MCP server** (official, remote `https://mcp.figma.com/mcp`) | help.figma.com/hc/en-us/articles/32132100833559 · developers.figma.com/docs/figma-mcp-server/rate-limits-access | ✔ Remote server works on all plans, **but the free Starter plan gets ~20 tool calls/month** (View/Collab seats on paid plans get 6/month). Dev/Full seats (paid) get 200–600/day. Write-to-canvas and code-to-canvas are free in beta, "will become usage-based paid". | `get_design_context`, `get_variable_defs`, write-to-canvas, Code Connect. | **SKIP for now**: 20 calls/month on free is unusable for iteration, and Muzzy wants no paid tools. Worth revisiting if he ever has a Pro seat. *Code-to-canvas* (push the live kit into Figma for him to mark up) is the interesting direction then. |
| Free Figma community kits: **Game UI Wireframe Kit**, **Game UX Kit**, **Parchment System Game UI** (auto-layout components) | figma.com/community/file/1387093843913812299 · …/1460785931676185568 · …/1288804025168455103 | ~ free to duplicate (search snippets; licences not checked) | Muzzy can sketch screens in them, then screenshot → Claude builds with the kit. | **STEAL-THE-IDEA**: "wireframe in Figma (free), screenshot to Claude" needs no MCP at all. |
| **FigmaToUnity** (TrackMan) | github.com/TrackMan/Unity.Package.FigmaToUnity | ✔ licence "Other" (check before use) | Imports Figma pages into UI Toolkit UXML/USS. 249★, pushed 2026-03. | **SKIP for now** (needs Figma API use; licence unclear). |

## 5. Unity-side equivalents

| Candidate | URL | What | Free? | Maintained? | Verdict |
|---|---|---|---|---|---|
| **unity-ui-toolkit-design-system** (sinanata) | github.com/sinanata/unity-ui-toolkit-design-system | Drop-in UI Toolkit design system: **42 components** (buttons, inputs, tabs, toggles, sliders, progress, cards, modals, dialogs, sheets, drawers, toasts, tooltips, nav, steppers, empty states, skeletons), **120 icons (UI + gaming)**. Tokens are CSS variables baked from a `ThemeData` ScriptableObject, with a Theme Configurator that has live preview. Dark and light themes, mobile-responsive, UPM install, world-space on 6000.5+. Shipped in "Leap of Legends". | ✔ MIT | ✔ 547★, pushed 2026-08-19 | **ADOPT** as the Unity half of the kit. It is almost exactly the proposed module, already built. It needs Unity 6. |
| **Dragon Crashers** (Unity official UI Toolkit sample) | assetstore.unity.com/packages/essentials/tutorial-projects/dragon-crashers-ui-toolkit-sample-project-231178 | Full front-end menu system, data binding, localization, safe area, portrait/landscape, **runtime theme swapping via TSS**. | ~ free (Unity blog + Asset Store listing snippets) | ~ Unity 6 update (Dec 2024 per Unity tweet) | **STEAL-THE-IDEA**: the reference for safe-area and theme swapping. Too big to copy wholesale. |
| **QuizU** (Unity official) | Asset Store | Screen-flow / menu-stack architecture (MVP, state pattern) in UI Toolkit. | ~ free | ~ | **STEAL-THE-IDEA**: the screen-stack pattern (same as game-ui-ux rule 5). |
| UIToolkitUnityRoyaleRuntimeDemo | github.com/Unity-Technologies/UIToolkitUnityRoyaleRuntimeDemo | Small runtime UI Toolkit demo. | ✔ MIT | ✔ pushed 2025-10 | SKIP (the samples above cover it). |
| Unity-SDF-UI-Toolkit (TLabAltoh) | github.com/TLabAltoh/Unity-SDF-UI-Toolkit | SDF rounded shapes, outlines and shadows. | ✔ MIT | ✔ pushed 2026-09 | STEAL-THE-IDEA only if flat panels look too plain. Otherwise SKIP. |
| Kenney UI packs | (above) | Same CC0 sprites in Unity (sprite 9-slice). | ~ CC0 | | ADOPT (shared textured skin). |

## 6. Top 3 recommendations

1. **Build a BMUZ "prototype UI kit" module on shadcn/ui + tokens, with game screens copied from 8bitcn's block list** (web), and **adopt sinanata's UI Toolkit design system** as the Unity twin. Together they cover about 95% of prototype screens with zero art. Install the official **shadcn skill** alongside so Claude uses the kit correctly.
2. **Steal the "decide once, persist, enforce" loop** (interface-design) plus the **control behaviour spec** (Claude-Code-Game-Studios' interaction-pattern-library) and the **six game-ui-ux layout rules**. They go into one BMUZ rule doc that `/develop` loads for any UI task. Screens are *composed* from kit parts, never hand-styled. A UI review step checks for raw px, one-off colours and absolute positioning.
3. **Turn `playground` into the Dev Kit's Theme Tuner** (steal its pattern): sliders for hue, radius, density and font scale, with presets and a live preview of every kit screen. It writes `content/ui/theme.json`, so Muzzy edits the look himself (Dev Kit or Obsidian). Leave `frontend-design` disabled for games. Switch it on only for itch/store/landing pages, where distinctiveness is the point.

## 7. Proposal: "Standard Prototype UI Kit" Game Framework module

**Module card (plain English)**
- *Gives the player:* clean, consistent menus, HUD and dialogs that work on phone and desktop, with keyboard/gamepad and a11y basics.
- *Gives Muzzy:* any screen from a one-line ask ("settings with volume, music, tips, quit"). Adding a row never breaks layout. The look is changed in one file or with the Theme Tuner.
- *Knobs (content/ui/theme.json):* `hue`, `accent`, `radius`, `density` (compact/cozy/roomy → spacing scale), `fontScale`, `fontFamily` (Google Fonts, OFL), `skin` (`clean` | `pixel` | `textured`), `motion` (full/reduced), `sounds` (hover/confirm/back ids → audio-setup).
- *Needs:* nothing (foundation module). Optional: audio-setup (UI sounds), localize (all labels from `content/text/en.json`).
- *Platforms:* Web (React DOM overlay over R3F/canvas) · Unity 6 (UI Toolkit).
- *Proven in:* Roll Better is the obvious first harvest. Rebuild its MainMenu, Settings, HUD and WinnersScreen on the kit and measure the lines of CSS removed (currently 1,450).

**Layers**
1. **Tokens.** `theme.json` becomes CSS variables (web) or a `ThemeData`/USS variables file (Unity). It is the single source of truth: colour roles (bg, surface, text, muted, primary, danger, success), spacing scale (4-based), radius, shadow, type scale (`clamp()`), z-layers (hud < panel < modal < toast), motion durations (80 ms hover, 60 ms press, 0.97× press scale, per the Game Studios spec).
2. **Layout primitives.** `Screen` (safe-area, centred/anchored slots: top-left, top-right, bottom-centre…), `Panel`, `Stack`, `Row`, `Grid`, `ScrollArea`. All spacing is `gap` from tokens. No fixed heights, no absolute px. *This is what makes "add a row and it still works" true.*
3. **Controls.** From shadcn/Radix (web) and sinanata (Unity): Button (primary/secondary/destructive/icon), Toggle, Slider, Select, Tabs, Checkbox, Stepper, Tooltip, Toast, Dialog/Confirm, Progress/Meter, Badge, Card, List item. Each one follows the state table (default/hover/focus/pressed/disabled/loading) with a focus ring and a 44–48 px touch target.
4. **Game blocks (the "Figma-style library").** MainMenu, PauseMenu, Settings (auto-built from a `settings` schema array; add an entry and a row appears), HowToPlay/Tutorial pages, Dialogue box, Confirm-quit, GameOver/Victory/Results table, Leaderboard, Lobby/Room code, Player list/profile chip, Loading screen, Save slots, Toast/notification stack, HUD kit (resource counter, bar: health/mana/xp/timer, turn indicator, score, minimap frame slot), Inventory grid, Card hand slot (links to a card-hand module), Tip banner.
5. **Screen stack.** One `useScreens()` push/pop/replace store (zustand). Back/Escape/B pops. Modals stack. This matches QuizU and game-ui-ux rule 5.
6. **Skins.** `clean` (default shadcn look, tuned by tokens), `pixel` (8bitcn styles + pixel font), `textured` (Kenney CC0 9-slice panels via `border-image` / Unity sprite borders). Real art later = a new skin, not a rewrite.
7. **Dev Kit: Theme Tuner + Gallery.** A playground-style page listing every block with live token sliders and presets ("Cozy", "Arcade", "Sci-fi", "Parchment"), saving to `theme.json`. The gallery doubles as the visual test: a Playwright screenshot of every block at phone and desktop widths, so Claude checks its own work.
8. **Rules for Claude (skill `ui-kit`, loaded by `/develop` for UI tasks).** Compose from kit blocks first. Add a new block to the kit (not the game) if it is missing. No raw colours or px in game code. Run `web-design-guidelines` + `accessibility-check` on new blocks. For in-world 3D UI, use drei `<Html>` with kit components, or @react-three/uikit default-kit (shadcn-matched) when it must render inside WebGL.

**Build order suggestion:** tokens + primitives, then Settings (schema-driven), MainMenu, PauseMenu and Confirm, then HUD kit, then Theme Tuner + gallery screenshots, then the Unity twin via sinanata, then the pixel and textured skins.

## 8. Unverified / flagged
- Kenney pack licences and asset counts: from search snippets (not opened). Kenney is historically CC0, but confirm before bundling.
- Game UI Database: the site returned 403. Its description comes from search results and AlternativeTo.
- Dragon Crashers / QuizU being free: from Unity blog and Asset Store snippets, not opened.
- Figma community kits: licences not checked.
- mcpmarket game-HUD/uGUI skills: listings not opened; authorship unknown.
- ui-ux-pro-max star count differs across sites (101k–131k). GitHub page fetch said 131.2k.
- The Claude-Code-Game-Studios `team-ui` page fetch guessed its licence from the footer. The GitHub API says **MIT** (verified).
- @react-three/uikit licence: npm says "SEE LICENSE". The GitHub LICENSE file is MIT text (verified).
