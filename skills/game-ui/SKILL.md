---
name: game-ui
description: Build any game's UI from Muzzy's Game UI kit — one structure, five styles (Clean, Cozy, Cartoon, Pixel, Neon) picked per game in content/ui/style.json. Gets the kit from dev/framework, gets a style picked, installs or updates the kit in the game, builds screens only from catalog parts, checks the rules and screenshots phone + desktop. Use whenever a game needs a screen, menu, main menu, settings, pause, HUD, dialog, popup, toast, results, scoreboard, game over, lobby, loading screen, button or panel, or when game UI looks off, is inconsistent, is hard to read, or breaks on a phone. Web games (React) for now. Not for store or landing pages (frontend-design does those).
---

# game-ui — every game's UI, from the kit

The kit is **one structure, many skins**: parts and screens know *what* they are, one style file
decides *how everything looks*. Swap the style → the whole game restyles, layouts never change.
Design: `dev/framework/.planning/design/ui-kit.md`. Say "Using game-ui for this." in one line.

## Rules
- **If it isn't a button, it must not look like one** (Muzzy's rule). Instructions, status, round labels and other info are plain text (kit `HudText`, 0.1.9+) — no card, outline or drop shadow. Cards/outlines/shadows mean "you can press this".
- **Never hand-style game UI.** No raw colours, px sizes, font names, absolute positioning or inline
  styles in game UI code — only kit parts and style names. The checker enforces it.
- **Nothing one-off in the game.** A missing part or screen goes into the framework kit (generic), then
  into the game with the installer. The game's `src/ui/kit/` is a copy: never edit it there.
- **Web only for now** (React + plain CSS variables). Unity games: later, via the free sinanata UI Toolkit
  design system with the same catalog names and style.json (design §6) — say so and stop.
- **frontend-design stays off for games.** It's only for a game's store or landing page.
- Words come from `content/text/en.json`, settings rows from `content/ui/settings.json`, the look from
  `content/ui/style.json` — all editable by Muzzy in Obsidian or the Dev Kit.

## Where the kit lives
`~/Documents/dev/framework/ui-kit` (same path on both machines). Missing? Clone it:
`git clone https://github.com/TheBlueMuzzy/framework ~/Documents/dev/framework` then `npm install` in `ui-kit/`.
Catalog of every screen: `ui-kit/CATALOG.md`. Live gallery: `npm run dev` in `ui-kit/` → `localhost:5180/?screen=<id>`.

## Steps
1. **Style chosen?** If the game has no `content/ui/style.json`, make the pick sheet:
   `cd ~/Documents/dev/framework/ui-kit && npm run pick-sheet` (or `npm run pick-sheet -- menu`; default settings)
   → `screenshots/pick-sheet.png`. Look at it, show Muzzy the path, and suggest ONE style with an MDA
   reason from the GDD's experience targets ("Cozy — warm and forgiving, fits the relaxed pillar").
   **This is the only question this skill asks.** Log the pick in the game's TDD Decisions.
2. **Kit in the game and current?** From `ui-kit/`: `node scripts/install-kit.mjs <game-folder> <style>`
   (`--dry-run` first on an update: it lists changed / added / removed kit files). It copies the kit to
   `src/ui/kit/` with a VERSION stamp, creates style.json + settings.json only if missing (never
   overwrites) and adds the kit's font credits to `content/credits.json`. Follow its printed next steps.
   **A game that already has UI** (most of them): screenshot its other screens first; wrap its
   page-wide CSS (index.css `button {}`, `* { margin:0; padding:0 }`) in `@layer game-base { … }` or it
   overrides every kit part; mount `<ScreenStack overlay screens={…} />` next to the game (not around
   it) and set `--kit-overlay-z` in its CSS. Re-shoot the other screens: they must be unchanged.
   **Moving an existing screen onto the kit:** diff its behaviour from the OLD CODE (not the docs) and note "kept / changed" per screen.
3. **Plan first:** name the catalog entries the task needs and draw a quick ASCII sketch. Only style
   names (primary, gap m, title text), never raw values.
   Flag dense per-row UI on phone landscape (rows ~39 px apart) as a readability risk — use PlayerChip `size="xs"` (one line) there. Decide HUD/toast zones up front (instructions vs tips vs toasts) so they never fight for a spot — `ToastStack place="top|center|bottom"`.
   Kit UI pinned over a 3D scene = kit `PinnedBox` (engine-free, scales with the world) + the small game-side R3F adapter from CATALOG.md → Pinned; the kit never imports three/R3F.
   Main menu buttons in the game's own order → `MainMenu items={[{ label, onClick, primary? }]}`. Results over the game → `Results dim`.
4. **Build from Built blocks.** A **Recipe** → build it from its listed parts in the framework kit
   (`kit/blocks/`), add it to the gallery (`gallery/menu.ts` + `Screens.tsx`), move it to Built in
   CATALOG.md, bump `kit/VERSION`, then re-run the installer in the game.
5. **Missing a part?** Same path: add it to the framework kit, generic and tested, never in the game.
6. **Enforce:** `node src/ui/kit/check-ui.mjs src/ui --css src` (point it at the game's UI folders, not all of
   `src/` — 3D code has raw colours on purpose; `--css src` warns about game CSS restyling kit parts —
   a warning = a kit gap to fix in the framework). Wire it as the game's `check:ui` script. Must pass before showing Muzzy anything.
7. **Verify:** screenshots at phone 390×844, phone landscape 844×390 and desktop 1440×900 with
   Playwright's own Chromium (never Muzzy's Chrome; don't touch his dev server). Look at every one:
   no sideways overflow, nothing clipped, targets ≥ 44px, Back / Esc / phone Back close the top screen.
   Then the game's tests + build.
8. **Improvements flow back:** anything learned (a fix, a new part, a better default) goes into the
   framework kit with a VERSION bump and its checks (`npm test`, `npm run build`, `npm run check-ui`,
   `npm run shoot`), so the next game starts better. Commit in the framework repo too.

## How a game uses it
Start-up (`src/main.tsx`):
```tsx
import { applyStyle, applyAccessibility, loadSettings } from './ui/kit'
import style from '../content/ui/style.json'
import settings from '../content/ui/settings.json'
applyStyle(style)                              // style.json → CSS variables; call again to restyle live
applyAccessibility(loadSettings(settings))     // text size + reduce motion before any screen opens
```
Screens go through one stack (Esc / Back close the top one; `kitScreens` adds Confirm):
```tsx
<ScreenStack screens={{ ...kitScreens, settings: SettingsScreen, pause: PauseScreen }}>
  <Game />            {/* the always-there bottom layer, e.g. the HUD */}
</ScreenStack>
<ToastStack />
// anywhere: screens.push('settings') · screens.pop() · askConfirm({ title, danger, onConfirm }) · toast('Saved')
```
Words from `content/text/en.json` (only the words passed change; the rest stay English):
```tsx
const PauseScreen = () => <Pause words={text.pause} onQuit={quit} onSettings={() => screens.push('settings')} />
```
Settings rows come from the list — switch rows off with `"on": false`, add your own; never hand-build it:
```tsx
const SettingsScreen = () => <Settings schema={settings} onChange={(values) => audio.setVolume(values.musicVolume)} />
```
Saved settings get a browser slot per game automatically (`kit-settings:<first folder of the URL>`);
to pick one by hand, pass the same key to both: `<Settings storageKey="my-game" />` +
`loadSettings(settings, 'my-game')`. Saved values that no longer fit their row fall back to the default.
Settings values in a game's own store (and its own save): pass `load` / `save`; rows that only make
sense in some places (quit in-game only): `hide={inGame ? [] : ['quit']}`. A kit-only game adds
`class="kit-page"` to `<body>` so the kit paints the page; otherwise the kit styles only its own screens.
Change the look: edit `content/ui/style.json` → `{ "preset": "cozy", "tweaks": { "accent": "#e07a5f" } }`.
Muzzy can also just say "rounder, more orange" — make it a tweak, not code.

## Hand-off
Say what was built from which catalog entries, show the screenshots, and end with the next command
(usually back to `/develop`).
