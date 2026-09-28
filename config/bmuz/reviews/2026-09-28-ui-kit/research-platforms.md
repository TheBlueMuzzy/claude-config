# Game UI kit: how platforms do "structure + style", and what BMUZ should copy

Researched 2026-09-28. Read-only; nothing installed.
Builds on `../2026-09-28-skill-review/review-ui.md` (candidates, verdicts and the module proposal are there, not repeated here).
Legend: ✔ = page fetched first-hand this session · ~ = search-result snippets only · ⚠ = my inference / unverified.

---

## 1. The one-sentence finding

Every engine and web library that makes "easy UI" does the same three things:
**(a)** controls that know their *behaviour and states* but not their *look*, **(b)** one named style object that paints every control at once via lookups/variables, **(c)** swapping that one object (or one attribute) re-skins everything.
They differ only in where the style lives. BMUZ should copy the pattern, not any one engine.

---

## 2. Survey

### Engines / platforms

| Platform | Structure layer | Style layer | How you swap the whole look | Copy for BMUZ |
|---|---|---|---|---|
| **Godot Theme** ✔ | Control nodes + Containers (VBox/HBox/Grid/Margin) | One `Theme` resource with 6 item kinds: **colors, constants, fonts, font sizes, icons, StyleBoxes** (StyleBox = panel look, flat or 9-slice texture). Looked up by (item name, type). | Assign a Theme to any node → it and all children restyle. Lookup order: local override → nearest ancestor theme → project theme → engine default. **Type variations**: `HeaderLabel` is a named variant of `Label` inside the same theme. | ★ The cleanest model. Copy: the 6 item kinds as our token groups; "variants" (Button `primary`/`ghost`/`danger`) as named variants, not new components; "set once at the root". |
| **Unity UI Toolkit** ✔/~ | **UXML** = structure (like HTML). Flexbox layout. | **USS** = style (CSS subset, supports `var(--x)` custom properties, `:hover/:focus/:checked/:disabled` pseudo-states). **TSS** = a USS file marked as a *theme* that `@import`s others (incl. `unity-theme://default`). 9-slice via `-unity-slice-left/right/top/bottom`, `-unity-slice-scale`, `-unity-slice-type: sliced|tiled` ✔. | ~ Assign a different TSS to `PanelSettings.themeStyleSheet` at runtime (Unity discussions + manual say TSS "can be switched at runtime"; the exact code isn't in the manual). Must import the default runtime theme or default controls break ✔(snippet from manual). | Copy: one TSS per BMUZ style, generated from our preset file. |
| **sinanata design system** (Unity 6) ✔ | 42 UXML+C# components, `.ds-` class prefix, a behaviour base class that injects parts (toggle knob, spinner, skeleton shimmer). | `ThemeData` ScriptableObject holds every token → **bakes a real USS of variables**. All components read `var(--color-primary)` etc. Dark + Light assets. Editor Theme Configurator + Google Fonts importer. | `ThemeApplier` adds one stylesheet to the panel root, or add class `.theme-light` to `.ds-root`; the var() cascade repaints everything incl. hover/disabled states (240 ms animated swap in demo). MIT, Unity 6000.x+. | ★ It *is* the Unity half. Only change: bake from our `content/ui/style.json` instead of (or into) its ScriptableObject, so web and Unity share one preset file. |
| **Roblox UI styling** ✔ | GuiObjects + `UIListLayout` (direction, `Wraps`, padding, `HorizontalFlex/VerticalFlex`) + `UIFlexItem` (Fill/Grow/Shrink) ✔. (AutomaticSize/UIPadding exist but I didn't open those pages ⚠.) | **StyleSheet** holds **tokens** (as attributes) + **StyleRules** with CSS-like selectors: class (`TextButton`), **tag**, name, modifier (`UICorner`, `UIStroke`) and **state** (`Hover`…). `StyleLink` attaches a sheet to a ScreenGui; `StyleDerive` inherits tokens between sheets. | **Themes** = alternative token sets with *the same token names* ("related themes must have the same set of tokens"). | Copy the rule: **every style preset must define the same token names**. Validate it with a test. Page shows no beta label; release date not checked ⚠. |
| **Unreal UMG + Common UI** ✔/~ | UMG widgets. Common UI adds **Activatable Widgets** and `UCommonActivatableWidgetStack` ("display stack of ActivatableWidget elements") + **input routing** (only the top active widget gets input) + gamepad cardinal navigation + platform button icons ✔. | **Style data assets**: `CommonButtonStyle`, `CommonTextStyle`, `CommonBorderStyle` ~ — one asset styles hundreds of widgets; button styles reuse the text style asset. | Point widgets at a different style asset. | Copy: **the screen stack owns input** (Back/Esc/B pops the top screen; screens underneath don't get clicks/keys) and **button style reuses text style** (tokens reference tokens). Skip everything else (too heavy). |
| **Defold (Druid)** ~ | Druid component framework, "stack-based input handling". | Druid "styles" table per component ~. | ~ | Nothing new; confirms "stack-based input" is universal. |
| **GameMaker** ~ | 2024-25 **UI Layers** made of **Flex Panels** (Yoga flexbox) ~. | No theme system found ⚠. | — | Confirms: even GameMaker moved to flexbox containers. Nothing to copy. |
| **Construct** | Not researched (no notable theme system known) ⚠. | | | Skip. |

### Web

| Thing | What it does | Copy for BMUZ |
|---|---|---|
| **shadcn/ui theming** ✔ | Semantic CSS variables in **pairs**: `background/foreground`, `card/-foreground`, `popover`, `primary/-foreground`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `radius` (+ sm…4xl), `chart-1..5`. Dark = the same vars redefined under `.dark`. Tailwind v4 `@theme inline` exposes them as `bg-primary` etc. Components are copied into your repo (you own the code). | ★ Copy the **pair naming** (every surface colour has a matching text colour — no contrast guessing) and "redefine the same vars under a selector". |
| **Headless primitives: Radix / React Aria / Base UI** ✔/~ | Unstyled. Expose state as **data attributes**: Radix `data-state="open"` ~; React Aria `data-hovered`, `data-pressed`, `data-focus-visible`, `data-disabled`, `data-selected`, `data-entering/exiting` ✔ (pressed/hovered "work consistently between mouse, touch and keyboard"). Handle focus traps, keyboard nav, ARIA. | ★ The structure layer = headless behaviour + data-attribute states; the style layer only writes CSS against those attributes. **News:** shadcn switched its default primitive library to **Base UI in July 2026** (Radix still supported) ~ (changelog URL in search; not opened). ⚠ For a lean game kit, only ~4 components truly need a headless lib (Dialog, Select/Dropdown, Tooltip, Tabs). Buttons, toggles, sliders are fine as plain `<button>`/`<input type=range>`. |
| **daisyUI 5** ✔ | 35 themes; `data-theme="name"` on any element themes everything inside; nestable. Vars: `--color-primary/-content`, `--color-base-100..`, `--radius-box/-field/-selector`, `--size-field/-selector`, **`--border`, `--depth`, `--noise`**. | ★ Copy **one attribute switches the whole theme** (`<div data-style="cozy">`) and the idea of **"character" knobs** (`depth` = 0/1 shadows, `noise` = 0/1 grain) — tiny tokens that change the feel a lot. |
| **CSS `@layer`** ✔ | Declared order sets priority; later layer wins; unlayered beats layered. Baseline since March 2022. | ★ `@layer kit-base, kit-style, game;` → the kit's structure CSS can never beat the style, and a game's one-off tweak always beats both, with no specificity fights or `!important`. |
| **W3C Design Tokens format** ✔ | `$value`, `$type`, `$description`; aliases `{group.token}`; groups inherit `$type`; types: color, dimension, fontFamily, fontWeight, duration, cubicBezier, number, shadow, border, transition, gradient, typography. **First stable version 2025.10** (announced 2025-10-28) ~; the draft page fetched is a newer draft dated 2026-09-08 ✔. Tools: Style Dictionary, Tokens Studio, Terrazzo. | Borrow the **names** (`$value`/`$type`, `{alias}` syntax, type list) so the file is familiar and Figma/Tokens Studio can read it later. **Don't** adopt the strict spec (colours as `{colorSpace, components}` objects) — unreadable for Muzzy. Plain hex strings + `{alias}` is enough. ⚠ my call. |
| **Material 3** ✔ | States: enabled, disabled, hover, focus, pressed, dragged; **state layer** overlay opacities hover 8%, focus 12%, pressed 12%, dragged 16%. | Copy the **state list** and the **state-layer trick**: one overlay rule gives every control hover/press feedback in any style, no per-style work. |
| **Apple HIG** ⚠ (not fetched) | Component inventory + 44 pt min touch target (well known). | Use as the checklist for touch target size only. |

### Claude skills

| Skill | How it works | Copy |
|---|---|---|
| **frontend-design** ✔ (SKILL.md fetched) | Description: *"Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one."* That wording is why it triggers passively: any "build/reshape UI" task matches. Process: ground in subject (product, audience, job) → **pass 1: a compact token plan** (4–6 named hex colours, 1–2 type families + roles, one-sentence layout concept + ASCII wireframe) → check the plan against the brief and against known "AI-slop" looks, revise → build → **screenshot and critique**. Restraint: *"Spend your boldness in one place… cut any decoration that does not serve the brief."* A11y/reduced motion done silently. | ★ Copy: the **description-as-trigger** style, **plan before code (ASCII wireframe)**, screenshot self-critique, "boldness in one place". **Flip** one thing: frontend-design invents a new look each time; ours must *reuse* the game's chosen style and only invent when there is none. |
| **interface-design** ✔ | **Decide once → persist → enforce.** Writes `.interface-design/system.md` (direction, tokens, component patterns). If it exists, loads it and applies it every session. `design-review` (strict, with approval bar) and `design-deslop` (diff-scoped cleanup). | ★ Our persisted decision = `content/ui/style.json` + a 5-line "UI decisions" note. Our enforce step = a lint + screenshot pass, diff-scoped. |
| **theme-factory** ✔ | 10 named presets (Ocean Depths, Midnight Galaxy…), each = palette + heading/body fonts + character. Flow: show a showcase → user picks → confirm → apply. Custom: name it, pick colours/fonts, show, apply. | ★ Copy: **named presets + a visual showcase to pick from**. Our showcase = the kit Gallery page screenshotted in every preset. |

---

## 3. What the survey says, boiled down (the rules to copy)

1. **Structure never contains a colour, size or font.** Only token names. (Godot, USS, shadcn, daisyUI.)
2. **Semantic token pairs** (`surface` + `on-surface`). (shadcn, daisyUI `-content`, Material.)
3. **Variants, not new components** (`<Button variant="danger">`). (Godot type variations.)
4. **States are attributes the structure sets; styles only read them** (`data-pressed`, `:hover`). (React Aria, Radix, USS pseudo-states, Material.)
5. **One switch at the root restyles all** (`data-style="cozy"`, TSS swap, `.theme-light`). (daisyUI, Unity, sinanata, Godot.)
6. **All presets have the same token names**, checked by a test. (Roblox.)
7. **A screen stack owns input and Back.** (Unreal Common UI, Druid, QuizU, game-ui-ux rule 5.)
8. **Layout = flex containers with gap**, never absolute px. (Every engine, even GameMaker now.)
9. **Textures are optional extras on top of tokens** (StyleBoxTexture / USS slices / CSS `border-image`). The flat token look must always work alone.
10. **Decide once, persist, enforce; plan before code; screenshot to check.** (interface-design, frontend-design.)

---

## 4. Proposed BMUZ architecture

### 4.1 Structure layer ("the bones", super basic, never changes per game)

**Web (React + TS, DOM overlay on top of the R3F canvas):**
- **Layout primitives (5):** `Screen` (full-screen, safe-area padding, named slots: `top-left`, `top`, `top-right`, `center`, `bottom`… for HUD), `Panel` (the "box"), `Stack` (vertical, gap), `Row` (horizontal, gap, wrap), `Grid` (auto-fit columns). Spacing is only ever `gap="s|m|l"`.
- **Controls (~10):** `Button` (variants: primary, secondary, ghost, danger, icon), `Toggle`, `Slider`, `Select`, `Tabs`, `Dialog`, `Tooltip`, `Toast`, `Bar` (health/xp/timer), `Text` (roles: title, heading, body, label, number). Plain HTML where possible; a headless lib (Base UI or Radix, whichever shadcn ships) only for Dialog/Select/Tooltip/Tabs. Every control sets `data-state`/`data-variant` and nothing visual.
- **Screen stack:** one tiny zustand store `useScreens()` with `push / pop / replace`. Only the top screen is interactive (`inert` on the ones below). Esc / gamepad B / phone back = `pop`. Modals are just screens pushed on top.
- **Game blocks** (from the earlier review, 8bitcn list): MainMenu, Pause, Settings (built from a list in `content/`), Confirm, Results, HowToPlay, Lobby, Loading, HUD pieces. Blocks are made only from primitives + controls, so they restyle for free.
- Files: `kit/web/primitives.tsx`, `controls.tsx`, `screens.ts`, `blocks/*.tsx`, `kit.css` (`@layer kit-base` — layout only, zero colours).

**Unity (UI Toolkit, Unity 6):**
- Use **sinanata's components as the controls** (don't rewrite).
- Add the same 5 primitives as USS classes (`.screen`, `.panel`, `.stack`, `.row`, `.grid`, `.gap-s/m/l`) + a `ScreenStack.cs` (push/pop, only top `VisualElement` has `pickingMode = Position`/focus; Back input pops).
- Same block names as web, as UXML templates.

### 4.2 Style layer ("the skin")

One file per game: **`content/ui/style.json`** (Muzzy-editable in Dev Kit / Obsidian). Shape — W3C-flavoured names, but readable:

```json
{
  "preset": "cozy",
  "tweaks": {
    "color.accent": "#e07a5f",
    "radius": "{radius.round}",
    "density": "roomy"
  }
}
```

The presets live in the kit: `kit/styles/<name>/style.json`, all with **the same token names**:

```json
{
  "name": "Cozy",
  "color":  { "bg": "#fdf6ec", "on-bg": "#3d2c1e", "surface": "#fffaf2", "on-surface": "#3d2c1e",
              "primary": "#6a994e", "on-primary": "#ffffff", "accent": "#e07a5f",
              "danger": "#c1121f", "muted": "#a89880", "border": "#e6d8c3", "focus": "#3a86ff" },
  "font":   { "display": "Fredoka", "body": "Nunito", "scale": 1.0 },
  "radius": { "control": 14, "panel": 22 },
  "space":  { "density": "cozy" },
  "depth":  1,
  "border": 2,
  "motion": { "fast": 90, "normal": 180, "press-scale": 0.96, "ease": "back-out" },
  "extras": {
    "panel-texture": null,
    "button-texture": null,
    "sounds": { "hover": "tick", "press": "pop", "back": "whoosh" },
    "cursor": null
  }
}
```

- **Tokens** (required, every preset): colour pairs, 2 fonts + scale, 2 radii, density (→ 4-based spacing scale), `depth` 0/1/2 (shadow), `border` width, motion (durations, press scale, easing).
- **Extras** (optional, per style): 9-slice textures (web: CSS `border-image`; Unity: `-unity-slice-*`), a pixel/bitmap font, UI sound ids (→ `audio-setup`), motion flavour (→ `game-feel` tiers), noise/grain. If an extra is missing, the flat token look is used — **nothing may depend on an extra**.
- **Starter presets (4, not 35):** `clean` (neutral default, shadcn-like), `cozy` (round, warm, soft shadow), `arcade` (bold, high contrast, chunky borders, snappy motion), `pixel` (square, bitmap font, 8bitcn-like, no easing), plus `textured` as an *extras-only* variant of any preset using Kenney CC0 9-slices. ⚠ Names/looks are my proposal — a taste call for Muzzy.
- **Build step (tiny script, ~60 lines):** `style.json` (preset + tweaks merged) → `styles.generated.css` (`@layer kit-style { :root { --color-bg: …; } }`) for web; → `Style.generated.uss/.tss` for Unity (or fills sinanata's ThemeData). One source, two outputs. On web it can also be done at runtime (read JSON, set CSS vars on `<html>`) — simpler, and allows live Dev Kit tuning. ⚠ Recommend runtime for web, baked for Unity.
- CSS order: `@layer kit-base, kit-style, game;` — a game's own CSS goes in `game` and always wins cleanly.

### 4.3 How a game picks and tweaks a style

1. In `/define` (or the first time a screen is needed), Claude shows the **Gallery** (every block, every preset, phone + desktop screenshots side by side — theme-factory's showcase idea) and suggests one preset with a one-line MDA reason ("cozy: warm, slow, forgiving — matches the relaxed pillar").
2. Muzzy picks → Claude writes `content/ui/style.json` with `"preset"` and logs it in the TDD Decisions log. **Decided once.**
3. Tweaks: Muzzy says "rounder, more orange" or edits `tweaks` in Obsidian, or drags sliders in the Dev Kit Theme Tuner (earlier review §7.7). Only tweaks are stored; the preset stays pristine so kit updates flow through.
4. Real art later = add `extras` textures/fonts, or make a new preset folder. No component code changes.

### 4.4 What the passive skill (`game-ui`) does, step by step

Trigger description (frontend-design style, broad but game-specific), e.g.:
*"Builds and restyles game UI — menus, HUD, settings, dialogs, results, lobby screens — from the BMUZ UI kit and the game's chosen style. Use whenever a game needs a screen, a panel, a button, a HUD element, or when UI looks off, inconsistent, or breaks on phone."*

When a game needs a screen:
1. **Load the decision.** Read `content/ui/style.json`. None? → run §4.3 steps 1–2 first (the only time it asks anything).
2. **Kit present?** If `src/ui/kit/` is missing or older than `~/.claude/skills/game-ui/kit/VERSION`, copy/update it (show what changes).
3. **Plan before code** (frontend-design pass 1): list which block/primitives the screen uses + an ASCII wireframe; note the "one bold thing" if any. No new colours or sizes in the plan — only token names.
4. **Compose** the screen from blocks → primitives → controls. Labels from `content/text/en.json`; settings rows from a `content/` list.
5. **Missing piece?** Add it to the *kit* (generic, token-only), not the game, and note it for upstreaming to `~/.claude/skills/game-ui/kit/`.
6. **Register** the screen with the screen stack (Back works, input goes to top only).
7. **Enforce** (interface-design): lint the diff — no hex colours, px values, `position:absolute` (except in `Screen` slots), inline styles, or fonts outside tokens in game UI code. Fail = fix before showing.
8. **Verify** (below), then hand off with the next command.

### 4.5 How Claude verifies

- **Playwright (bundled Chromium, never Muzzy's Chrome)** screenshots the new screen at **390×844 (phone portrait)**, **844×390 (phone landscape)** and **1440×900 (desktop)**; Claude opens and looks at each.
- Checks: nothing overflows or clips; no horizontal scroll; touch targets ≥ 44 px; text contrast ≥ 4.5:1 from token pairs (a unit test can check every preset's pairs once); focus ring visible when tabbing; Esc/back pops.
- **Preset test:** a vitest that every preset has the same token keys (Roblox rule) and all colour pairs pass contrast.
- **Gallery snapshot:** the kit Gallery rendered in the game's style at phone + desktop = the regression check after any style tweak.
- Unity: Game view screenshots at the same 3 resolutions via Unity MCP / editor script ⚠ (tooling not verified here).

### 4.6 Where the kit lives

- **Source of truth:** `~/.claude/skills/game-ui/` — `SKILL.md` (the passive rules above, short) + `kit/web/`, `kit/unity/`, `kit/styles/<preset>/`, `kit/VERSION`. `skills/` is already in the synced list of the claude-config repo (✔ `references/config-sync.md`), so both machines get it via the normal copy → push → `setup.sh` flow.
- **Per game:** a *copy* in `src/ui/kit/` (web) or `Assets/UIKit/` (Unity) — shadcn's "you own the code" model, so each game can hack freely and the repo builds on its own (GitHub Pages, other machines, collaborators) without `~/.claude`.
- **Upstreaming:** improvements found in a game are copied back to `~/.claude/skills/game-ui/kit/` deliberately (step 5), bump `VERSION`. ⚠ Alternative considered: a separate `dev/framework/ui-kit` git repo (fits the Game Framework vision better long-term, versioned properly, shareable with Sherman). Recommend starting in the skill folder (zero setup) and graduating to its own repo once a second game uses it.
- **Lean budget** ⚠ (my targets): web kit ≤ ~800 lines total incl. CSS; 5 primitives, ~10 controls, ~8 blocks, 4 presets. Every file readable top-to-bottom, comments in plain English, no generics gymnastics.

---

## 5. Unverified / flagged

- Unity runtime TSS swap via `PanelSettings.themeStyleSheet`: from forum/search snippets; the manual page fetched says TSS can be switched but gives no code.
- Unreal `CommonButtonStyle/TextStyle/BorderStyle` names: search snippets (Unreal Garden, X157); the Epic overview page only describes "style data assets" generally.
- shadcn "Base UI is the default since July 2026": changelog URL seen in search results, not opened. Radix still supported per same.
- W3C tokens "stable 2025.10": community group announcement via search snippet; the fetched draft is dated 2026-09-08 and says "do not implement this version" (it's the next draft).
- Roblox styling release status/date: the fetched page shows no beta label; not confirmed further. AutomaticSize/UIPadding not opened.
- Defold Druid, GameMaker flex panels: search snippets only. Construct not researched.
- Apple HIG 44 pt target: general knowledge, not fetched.
- Preset names/values, the ~800-line budget, runtime-vs-baked choice, and the skill-folder-vs-repo recommendation are my design calls, not research findings.

## Sources
- frontend-design SKILL.md — github.com/anthropics/claude-plugins-official/…/plugins/frontend-design
- Godot GUI skinning — docs.godotengine.org/en/stable/tutorials/ui/gui_skinning.html
- Unity TSS — docs.unity3d.com/Manual/UIE-tss.html · 9-slice — docs.unity3d.com/Manual/UIB-styling-ui-backgrounds.html · discussions.unity.com (changing theme style sheet at runtime)
- sinanata — github.com/sinanata/unity-ui-toolkit-design-system
- Roblox — create.roblox.com/docs/ui/styling · create.roblox.com/docs/ui/list-flex-layouts
- Unreal Common UI — dev.epicgames.com (Common UI plugin; UCommonActivatableWidgetStack) · unreal-garden.com/tutorials/common-ui-button
- shadcn theming — ui.shadcn.com/docs/theming · changelog ui.shadcn.com/docs/changelog/2026-07-base-ui-default
- React Aria styling — react-aria.adobe.com/styling · Radix styling — radix-ui.com/primitives/docs/guides/styling
- daisyUI — daisyui.com/docs/themes
- MDN @layer — developer.mozilla.org/en-US/docs/Web/CSS/@layer
- Design Tokens — designtokens.org/tr/drafts/format · w3.org/community/design-tokens/2025/10/28/…
- Material 3 states — m3.material.io/foundations/interaction/states/overview
- interface-design — github.com/Dammyjay93/interface-design · theme-factory — github.com/anthropics/skills/…/theme-factory
- Druid — github.com/Insality/druid · GameMaker UI Layers — manual.gamemaker.io
