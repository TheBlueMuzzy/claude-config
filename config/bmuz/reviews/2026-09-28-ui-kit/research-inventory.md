# Standard Game UI Kit: canonical inventory (research)

Researched 2026-09-28. Read-only; nothing installed. Builds on `../2026-09-28-skill-review/review-ui.md` (that file chose the tech: shadcn + tokens + 8bitcn-style blocks, sinanata for Unity, Kenney for a textured skin). This file answers a different question: **what screens and parts does a "standard" kit need to cover?**

Legend: ✔ = verified first-hand (page fetched, GitHub API, or raw HTML read). ~ = search-result snippet only (page not opened, or it blocked the fetch). ✱ = my own synthesis or general knowledge, not taken from a source.

---

## 0. Kits surveyed (15 sources)

| # | Kit | Where | Type | What it ships (screens / components) | Evidence |
|---|---|---|---|---|---|
| 1 | **LAYERLAB GUI Pro – Casual Game** | Unity/Unreal/Godot, layerlab.io | Sprite kit + demo scenes | **Screens:** title loading bar, lobby, lobby user info, lock screen, character select / list / profile, stage select (2 levels deep), battle versus, play (2 types), pause, continue, result, level up, missions, inbox, battle pass, weekly/monthly reward, daily reward popup, roulette, equipment + detail + add slot, inventory, rune fuse, clan, chat, ranking, shop ×3, subscription popup, reward-get popup, settings, language, rating prompt, name entry/change, tutorial hand, network error, checking/maintenance, update notice, privacy/EULA, ad-removal popup. **Parts:** 240+ prefabs: buttons, frames, title labels, popups, sliders, notifications, input fields, resource bars, switches, toggles; 324 pictograms, 98 item icons. | ✔ layerlab.io product page |
| 2 | **LAYERLAB GUI Pro – Fantasy RPG** | same | Sprite kit | 46 demo screens: title/login, character select/manage, equipment, inventory, stage select, boss battle, continue, shop (gems/gold/chests), ranking, settings + language, daily/weekly rewards, roulette, battle pass, loading, maintenance. Popups: login/signup, naming, network error, system message, update, EULA/privacy, confirm. 300+ prefabs (buttons, frames, labels/titles, sliders). 361 pictograms, flags. Colour is baked into sprites (blue/red buttons); few "white" tintable sprites. | ✔ layerlab.io |
| 3 | **LAYERLAB GUI Pro – Minimal Game Blue / Dark / Light** | same | Sprite kit | 104 demo scenes: title login, tutorial, lobby, play type, matching, perk select, result, sleep mode, world/dungeon, inventory, artifact, companion, gear, character, equipment, skill, talent, trait, mission, collections, mailbox, progression pass, shop, shop package, summon (gacha), chat, friend, guild, ranking, daily login bonus, profile, level up, lucky spin, settings, common popup. Base prefabs: buttons, flags, frames, labels, popups, sliders. **Same layout sold as three colour products.** "Layout reference only (no code or animations)". | ✔ layerlab.io |
| 4 | **LAYERLAB GUI Pro – Survival Clean** (sci-fi) | same | Sprite kit | 52 demo scenes: title, title loading, loading, lobby main, offline reward, power save, news, lobby tutorial (character / focus highlight), user info, play home, play map, play stage, result victory… 429 prefabs (buttons, frames, labels, popups, sliders, toggles). "Sliced elements and white elements for customizable size and color." | ~ snippets (itch/Fab/Unreal forum) |
| 5 | **LAYERLAB catalogue names** (style-family evidence) | layerlab.itch.io | — | Casual Game, Simple Casual, Super Casual, Vertical Casual, Casual Fantasy, Fantasy RPG, Fantasy Hero, Minimal Game Blue/Dark/Light, Survival Clean, Neon, Neon2, SciFi Blue, Dark Geo, The Stone, DarkStone, Wooden, Matt Metal, Mono Round, Simple Round, Cartoon Military, Yellow Kid, BlueSky, Puzzle, Life Game, plus single-part packs: Avatar Frame, Ribbon Pack, Card Frame, Roulette, Kill Streak Text. | ✔ itch page |
| 6 | **Michsky Modern UI Pack** | Unity (UGUI + TMP) | Code components | Button, Charts (pie etc.), Context Menu, Dropdown (+ multi-select), Horizontal Selector (◀ value ▶), Input Field, List View, Modal Window, Movable Window, Notification, Progress Bar, Slider (+ radial), Switch, Toggle, Tooltip, Window Manager (tabbed panels), animated icons, sliced borders. Global **UI Manager** restyles every element at once. | ✔ docs.michsky.com (element list); ~ UI Manager property list not shown |
| 7 | **Michsky Heat – Complete Modern UI** | Unity | Full front-end framework | Handlers: **Achievements, Audio, Chapters (chapter select), Credits, Effects, In-Game (HUD show/hide, pause on hotkey, cursor, timescale)**. Elements: Button, Dropdown, Modal Window, Panel Manager (Settings/Extras pages), Progress Bar, Selectors, Slider, Switch, Widgets. **Controller Manager + presets, hotkey events, UI navigation** (gamepad/KB+M/console demo scenes). Localization system. UI Manager palette: Accent, Accent Match, Primary, Secondary, **Negative**, Background + 3 font weights + custom font. | ✔ docs + michsky.com |
| 8 | **Clean & Minimalist GUI Pack** | Unity | Sprite + helpers | Slider, dropdown, checkbox, toggle, input field, popup opener, scene transition, tooltips, gradient, sprite swapper. **3 skins: Dark, Light, Black; 15 background colour variants**; Xbox/PS/Steam/PC controller glyphs in dark + light. 9-slice. | ~ snippets |
| 9 | **Kenney UI Pack 2.0** (+ RPG, Sci-Fi, Adventure, Pixel expansions) | Engine-agnostic PNG/SVG | Sprite kit | 400+ sprites: buttons, panels/windows, checkboxes, sliders (H/V), progress bars, HUD bits. **Every element in 5 colours** (blue/green/grey/red/yellow ~). CC0. Style expansions = same parts, different material. | ✔ kenney.nl + itch (count, 5 colours, CC0); ~ exact colour names |
| 10 | **Crusenho Complete UI Essential Pack** | itch.io, pixel 32×32 | Sprite kit | Frames, banners, buttons, slots, bars & fill bars, sliders, scrollbars, icons, dropdowns, text fields, cursors, markers, selections, toggles, speech bubbles, direction indicators, loading elements, profiles, gamepad & keyboard glyphs. **13 material themes over the same parts:** Flat, Gradient, Paper, Wood, Stone, Metal, Hologram, Glass, Pumpkin, Mystic Wood, Papernote, Metalworks, Runewood. Custom pixel font. | ✔ itch page |
| 11 | **8bitcn/ui** | Web (shadcn + Tailwind) | Code components + blocks | **Game blocks:** main-menu, pause-menu, audio-settings, difficulty-select, save-slots, dialogue, chapter-intro, character-sheet, quest-log, friend-list, leaderboard, player-profile-card, loading-screen, portal-transition, game-over, victory-screen, game-progress, duel-block, login forms, not-found mini-games. **Game components:** health-bar, mana-bar, xp-bar, enemy-health-display. **Base:** accordion, alert(-dialog), avatar, badge, breadcrumb, button(-group), calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, empty, hover-card, input(-otp), kbd, label, menubar, navigation-menu, pagination, popover, progress, radio-group, scroll-area, select, separator, sheet, skeleton, slider, spinner, switch, table, tabs, textarea, toast, toggle(-group), tooltip. **21 themes** (Default, Sega, Gameboy, Atari, Nintendo, Arcade, NeoGeo, Soft Pop, Pacman, VHS, Rusty Byte, Zelda, Dungeon Torch, Space Station, Pixel Forest, Ice Cavern, Lava Core, Glitch Mode, Dwarven Vault, Dragon Hoard, Ancient Runes). Each theme is **only a CSS-variable colour set** (plus shared radius 0 and Press Start 2P font). | ✔ GitHub API (file lists + `lib/themes.ts`) |
| 12 | **DeviStudio Vibrant Casual Game UI Kit** | Figma source (itch) | Figma | Main menu (title, Play, quick icons), level select grid (locked/unlocked + stars), shop (item cards + currency + buy), settings (music/SFX sliders + toggles), victory (3-star) popup, game-over popup. Buttons with states, progress bars, icons (home, settings, star, coin). Vector, gradients, mobile ratios. | ✔ itch page |
| 13 | **Figma Community kits**: Game UI Wireframe Kit, Game UX Kit, Parchment System Game UI, Quizio, "free game ui kit", Games UI/UX Elements Library (econev) | figma.com | Figma | Wireframe Kit: "dozens of components, icons and templates" for low-fi game UI. Parchment: auto-layout menus, inventories, dialogue screens. Quizio: home, leaderboard, join room, countdown, play, results, language, settings, logout. | ~ Figma returns 403 to fetch; snippets only. **Contents mostly unverified.** |
| 14 | Other itch/Unity packs: Pixel UI Kit (HUD bars: health/energy/XP/mana, S/M/L buttons, rarity item slots, 9-slice panel, example inventory); Fantasy Wooden GUI Free (text/empty buttons + pressed, window frames, title frames); Cyangmou Pixel Menu GUI HUD (bars, hearts, spheres, radial bars) | itch / Asset Store | Sprite kits | As listed | ~ snippets |
| 15 | **Game UI Database 2.0** (taxonomy, not a kit) | gameuidatabase.com | 55k screenshots | Full screen-type list and style tags; see §1 and §4. | ✔ raw HTML read with a browser user-agent (WebFetch still 403s; plain curl with a UA returns 200) |
| (prev) | sinanata unity-ui-toolkit-design-system | GitHub | Unity UI Toolkit | 42 components (see review-ui.md) | ✔ in earlier review |

**Pattern across sources:** kits split into two kinds.
- **Art kits** (LAYERLAB, Kenney, Crusenho, Wooden): lots of *screens* as mock-ups, no behaviour. They define *what screens exist*, especially for mobile/F2P meta.
- **Behaviour kits** (Michsky, 8bitcn, sinanata): fewer screens, but real *controls* with states, navigation, theming. They define *what parts must work*.

A BMUZ kit needs the behaviour kit's parts and the art kit's screen list.

---

## 1. Merged inventory

**CORE** = in most kits *and* most games (a prototype almost always needs it). **COMMON** = in several kits or many genres. **NICHE** = genre-specific (build only when a GDD asks). "Seen in" names kit numbers from §0; GUDB = Game UI Database has a screen type for it.

### 1a. Front-end screens

| Item | Tier | Seen in | Notes |
|---|---|---|---|
| Title / splash (logo, "press to start") | CORE | 1,2,3,4,12, GUDB | Often merged with main menu on web |
| Main menu (Play / Continue / Settings / Quit) | CORE | 1,3,4,7,11,12, GUDB | Lobby hub on mobile |
| Settings (menu of sub-pages) | CORE | all | See §2 |
| How to play / tutorial pages | CORE | 3,4, GUDB "Info & Tutorial", "Tutorials & Guides" | Pages or carousel |
| Credits | COMMON | 7, GUDB | Scrolling list |
| Mode select | COMMON | 1,3, GUDB "Mode & Screen Select" | Solo / online / local |
| Difficulty select | COMMON | 11, GUDB "Game Difficulty" | GAG: offer difficulty choice |
| Level / stage select (grid, locks, stars) | COMMON | 1,2,12, GUDB | Casual/puzzle staple |
| Chapter / world map select | COMMON | 3,7, GUDB "World Map", "Area Map" | |
| Save slots / load game | COMMON | 11, GUDB "Load/Save" | |
| Character / player select | COMMON | 1,2,3, GUDB "Character Select", "Choose Players" | Party games: colour/avatar pick |
| Name entry | COMMON | 1,2, GUDB | Also "name change" |
| Login / sign-up / account | COMMON | 2,3,11,13 | Only with online accounts |
| Lobby / room: create, join by code, player list, ready | COMMON | 1,3,13 (Quizio), GUDB "Matchmaking Lobby", "Session/Party Player List" | CORE for Muzzy's online games |
| Matchmaking search / "finding players" | COMMON | 3, GUDB | |
| Server / room browser | NICHE | GUDB | |
| Custom game rules | NICHE | GUDB | Host options |
| Map voting | NICHE | GUDB | |
| Character creator / customisation | NICHE | GUDB (6 types) | |
| Language select (first-run) | COMMON | 1,2,13, GUDB | |
| Privacy / EULA / age gate / consent | COMMON (mobile) | 1,2 | Store compliance |
| Update required / maintenance / news | COMMON (live games) | 1,2,4, GUDB "Updates, News & Notifications" | |

### 1b. In-game overlays

| Item | Tier | Seen in | Notes |
|---|---|---|---|
| HUD layer (anchored slots) | CORE | all, GUDB "HUDs" | See §3 |
| Pause menu (Resume / Settings / Restart / Quit) | CORE | 1,7,11, GUDB | Opens settings as a sub-screen |
| In-game settings (subset) | CORE | 7 | Same Settings component |
| Dialogue box (speaker, portrait, text, next) | COMMON | 11,10 (speech bubbles), GUDB "Dialogue & Speech" | |
| Dialogue choice | COMMON | GUDB | |
| Tutorial overlay: coach mark / focus highlight / tutorial hand | COMMON | 1 (hand), 4 (focus), GUDB "Guided Tutorial" | Dims screen, cuts out target |
| Button prompts / controls reference | COMMON | 8,10 (glyphs), GUDB | Glyph set per input device |
| Mobile on-screen controls | COMMON (mobile action) | GUDB "Mobile Controls" | |
| Inventory grid + item slot + item detail | COMMON | 1,2,3,14,13, GUDB | |
| Quest / mission log | COMMON | 1,3,11, GUDB | |
| Character sheet / stats | COMMON | 3,11, GUDB "Overview & Stats" | |
| Map (full screen) | COMMON | 4, GUDB "Maps" | |
| Loadout / equipment | NICHE | 1,2,3, GUDB | |
| Skill tree / talents | NICHE | 3, GUDB | |
| Crafting / upgrade / fuse | NICHE | 1 (rune fuse), GUDB | |
| Radial / weapon wheel | NICHE | GUDB | |
| Codex / journal / collectables | NICHE | GUDB | |
| Photo mode | NICHE | GUDB | |
| Hacking / lockpick / minigame frame | NICHE | GUDB | |

### 1c. Flow screens

| Item | Tier | Seen in | Notes |
|---|---|---|---|
| Loading screen (progress, tip, art) | CORE | 1,2,4,11, GUDB | |
| Screen transition (fade/wipe) | CORE | 8,11 (portal-transition) | Motion token |
| Round / stage intro ("Round 3", level name) | COMMON | 11 (chapter-intro), GUDB "Stage Intro", "Area/Level Name" | |
| Countdown (3-2-1-Go) | COMMON | 13 (Quizio) | |
| Victory / level complete (stars, score) | CORE | 1,4,11,12, GUDB | |
| Game over / failure (retry, quit) | CORE | 11,12, GUDB | |
| Results / scoreboard (per player table) | CORE | 1,3, GUDB "Results Screen" | Multiplayer end |
| Continue? (revive offer) | COMMON (mobile) | 1,2 | |
| Rewards & XP tally / level up | COMMON | 1,3, GUDB "Rewards and Experience" | Animated count-up |
| Post-game menu (rematch / lobby / quit) | COMMON | GUDB | |
| Offline / idle reward | NICHE (idle) | 4 | |
| Cutscene / story slides | NICHE | GUDB | |

### 1d. Social / meta

| Item | Tier | Seen in | Notes |
|---|---|---|---|
| Leaderboard / ranking | COMMON | 1,2,3,11,13, GUDB | |
| Profile / player card (avatar, name, stats) | COMMON | 1,3,11, GUDB | |
| Achievements / challenges | COMMON | 7, GUDB | |
| Friends list + invite | COMMON (online) | 3,11, GUDB | |
| Chat (panel + quick chat / emotes) | NICHE→COMMON (online) | 1,3, GUDB | Quick-chat safer than free text for kids |
| Report / block player | NICHE (online) | GUDB | Store/legal need if free chat |
| Shop / store (item cards, currency, buy) | COMMON | 1,2,3,12, GUDB (6 types) | |
| Confirm purchase | COMMON | GUDB | |
| Daily reward / login calendar | COMMON (mobile) | 1,2,3 | |
| Battle / season pass (reward ladder) | NICHE (F2P) | 1,2,3, GUDB | |
| Gacha / summon / crate reveal | NICHE (F2P) | 3, GUDB | Legal disclosure needs |
| Offers / bundles / subscription / ad removal | NICHE (F2P) | 1,3, GUDB | |
| Inbox / mail | NICHE (live) | 1,3, GUDB | |
| Clan / guild | NICHE | 1,3 | |
| Roulette / lucky spin | NICHE | 1,2,3 | |
| Collection / gallery / extras | NICHE | 3, GUDB | |

### 1e. Dialogs and feedback

| Item | Tier | Seen in | Notes |
|---|---|---|---|
| Modal dialog (title, body, 1–2 buttons) | CORE | 1,2,3,6,7,11, GUDB "Modals & Popups" | Base for all below |
| Confirm (esp. destructive: quit, delete save) | CORE | 2,11 | XAG "error messages and destructive actions" |
| Toast / notification (auto-dismiss) | CORE | 1,6,11, GUDB "Info and Notifications" | Stack, top or bottom |
| Tooltip | CORE | 6,8,11, GUDB | Hover (desktop) / long-press (touch) |
| Reward / item-get popup ("You got X!") | COMMON | 1,2, GUDB "Item Get", "Unlocks & Achievements" | Burst + icon + count |
| Feature unlocked | COMMON | GUDB "Progress/Feature Unlocked" | |
| Error / network lost / reconnecting | COMMON | 1,2 | CORE for online |
| Rating prompt | NICHE (mobile) | 1 | |
| Context menu | COMMON (desktop) | 6,11 | |
| Empty state ("no friends yet") | COMMON | 11 (empty), sinanata | |
| Loading spinner / skeleton | COMMON | 11 | |
| Badge / red dot (new!) | COMMON | 1,3, 11 (badge) | Mobile meta leans on it hard |

### 1f. Primitive controls

| Control | Tier | Seen in | Notes |
|---|---|---|---|
| Button: primary / secondary / destructive / icon / disabled / loading | CORE | all | Michsky Heat and 8bitcn both have a "negative" colour role |
| Toggle / switch | CORE | 1,6,7,8,10,11 | |
| Checkbox | COMMON | 8,9,11 | Games prefer switches |
| Slider (horizontal) | CORE | all | Volume, sensitivity |
| **Horizontal selector (◀ Option ▶)** | CORE (games) | 6,7 | The game-specific control: gamepad-friendly replacement for dropdowns. Web kits lack it. |
| Dropdown / select | COMMON | 6,7,8,10,11 | Awkward with gamepad; prefer the selector |
| Tabs / segmented control | CORE | 6 (window manager), 11, GUDB element "Tabs" | Settings categories |
| Progress / fill bar | CORE | all | Also the HUD bar base |
| Text input (+ room-code / OTP input) | COMMON | 1,8,10,11 (input-otp) | Room codes |
| Radio group | COMMON | 11 | |
| Stepper (− value +) | COMMON | sinanata | Counts, player number |
| Scroll area / scrollbar | CORE | 10,11 | |
| List / list item (icon, label, value) | CORE | 6,11 | Settings rows, leaderboard rows |
| Grid / slot (item cell with rarity frame) | COMMON | 1,2,10,14 | |
| Card (image, title, body, action) | CORE | 11, sinanata | Shop, level tiles |
| Panel / window frame (9-slice) | CORE | all art kits | "Frame" in art kits |
| Title label / banner / ribbon | COMMON | 1,2,5,10 | Popup headers |
| Avatar + avatar frame | COMMON | 1,5,11 | |
| Badge / pill / counter | CORE | 1,11 | |
| Keyboard / gamepad glyph (kbd) | COMMON | 8,10,11 | |
| Icon set (UI + game pictograms) | CORE | 1,2,3,4,9,12 | Every art kit ships 300+ |
| Cursor | NICHE | 10 | |
| Radial slider / radial progress | NICHE | 6,14 | Cooldowns |
| Charts | NICHE | 6,11 | Stats screens |

---

## 2. Settings screen: standard sub-pages

Game UI Database's own split (✔): **Settings Menu → Gameplay, Display, Audio, UI & Accessibility, Language, Button Layouts** (+ Load/Save as a separate type). Kits mostly ship only Audio + toggles + Language (LAYERLAB, DeviStudio, 8bitcn `audio-settings`). Michsky Heat ships a Panel Manager for multi-page settings plus controller presets.

✱ Recommended BMUZ Settings schema (each row = one entry in a settings array; add an entry, a row appears). Tier as in §1.

| Tab | Rows | Tier | Source for the rule |
|---|---|---|---|
| **Audio** | Master, Music, SFX, Voice/Speech (sliders 0–100) + Mute all; optional "mute when app in background" | CORE | GAG Basic: "separate volume controls or mutes for effects, speech and background/music" ✔ |
| **Display / Graphics** | Fullscreen/windowed, resolution (desktop), quality preset (Low/Med/High/Auto), frame-rate cap, brightness; optional shadows, anti-aliasing, render scale, FOV (3D) | COMMON (desktop), minimal on web/phone | GAG Basic: sensible default FOV (3D) ✔ |
| **Controls** | Rebind keys/buttons, reset to default, sensitivity (camera/pointer), invert Y, vibration/haptics toggle, hold vs toggle, button-layout picture | COMMON | GAG Basic: remap controls; sensitivity; haptics toggle ✔. GUDB "Button Layouts" ✔ |
| **Gameplay** | Difficulty, game speed, tips/hints on/off, auto-advance text, camera shake, confirm-before-end-turn | COMMON | GAG Basic: game speed, difficulty choice, text at own pace ✔ |
| **Accessibility / UI** | Text size (to 200%), subtitles on/off + size + background plate opacity, colour-blind mode / custom colours, high-contrast mode, reduce motion / screen shake / flashing, UI scale, dyslexia-friendly (sans) font option, hold-to-press alternatives, narration (if any) | CORE (at least text size, reduce motion, colour-blind safe) | XAG 101, 102, 103, 117/118 ✔ (101/102 fetched); GAG ✔ |
| **Language** | Language picker (names in their own language) | COMMON | GUDB ✔; LAYERLAB ✔ |
| **Account / Privacy** | Profile name, sign in/out, delete account + data, privacy policy, cloud save, analytics consent, restore purchases | COMMON (online / stores) | LAYERLAB ✔ (privacy/EULA). Store deletion requirement ✱ (unverified here) |
| **About / Other** | Version number, credits, support/feedback link, reset progress (destructive → confirm) | COMMON | GAG Basic: "solicit accessibility feedback" ✔ |

**Settings behaviour rules** (✔ GAG/XAG unless marked):
- All settings saved and remembered (GAG Basic).
- Reachable from pause as well as main menu, with the same component (Heat ✔, ✱ convention).
- Preview where possible (text size, colour-blind swatch; Battlefield 2042 example in XAG 102 ✔).
- Read platform settings on first launch (`prefers-reduced-motion`, `prefers-contrast`, OS high contrast), per XAG 102 ✔ and web media queries ✱.
- "Reset to defaults" per tab ✱ (common in games, not in any kit fetched).
- Destructive rows (reset progress, delete account) use Confirm (XAG 116-ish "destructive actions" ~ number not verified).

**Numbers worth baking into tokens (✔ XAG 101/102):**
- Minimum default body text: **PC 18 px at 1080p**, **console 26 px at 1080p**, **mobile 18 px at 100 DPI, scaling linearly** (≈ 72 px at 400 DPI device pixels, which is ~18 CSS px on phones ✱).
- Text scaling up to **200%** without loss; scroll in one direction only.
- Contrast: **4.5:1** normal text/important visuals, **3:1** large text (PC ≥ 36 px) and inactive text, **7:1** in high-contrast mode. Measure against the lightest patch of busy backgrounds.
- Provide a sans-serif option if the display font is stylised; sentence case for text lines; no text baked into images.
- Glyphs/icons scale with text.

---

## 3. HUD element families

Built from GUDB's HUD screen types (✔ list: Player Vitals, Equipped Items & Abilities, Item & Ability Buttons, Collection Counters, Scoring & Combos, Clock & Timer, Rank & Position, Enemy Health & Damage, Minimap, Compass, Waypoints & Markers, Objective / Pinned Mission, Game State, Info & Notifications, Tutorials & Hints, Unlocks & Achievements, Skill Use, Game/Combat Log, Loot & Exp Log, Area/Level Name, Button Prompts, Controls Reference, Mobile Controls, Weapon Reticles, Lock-On, Throwing Arc, Weapon Wheel, Object/NPC Information, QTE) and the kits' bar/counter parts (8bitcn, Pixel UI Kit, Crusenho, Kenney).

| Family | Members | Tier | Kit parts |
|---|---|---|---|
| **Bars / meters** | health, mana/energy, XP, stamina, charge, boss bar, segmented (pips/hearts), radial | CORE | 8bitcn health/mana/xp/enemy-health ✔; Pixel UI Kit ✔; Crusenho fill bars ✔ |
| **Counters / resources** | icon + number (coins, gems, lives, ammo, dice left), "+5" float-up delta | CORE | LAYERLAB resource bars ✔ |
| **Score & combo** | score, multiplier, streak, combo pop | CORE (arcade/party) | GUDB ✔ |
| **Timers** | countdown clock, turn timer ring, round timer, cooldown overlay | CORE | GUDB "Clock & Timer" ✔ |
| **Turn / player indicators** | whose turn banner, player list with active highlight, rank/position (1st/2nd), ready ticks | CORE (turn-based / multiplayer) | GUDB "Rank & Position", "Session Player List" ✔; ✱ turn banner not a GUDB type |
| **Objective & game state** | current goal, pinned mission, round X/Y, phase label | COMMON | GUDB ✔ |
| **Ability / action buttons** | ability button with icon, cooldown, charges, key glyph; hotbar | COMMON | GUDB "Item & Ability Buttons", "Equipped Items" ✔ |
| **Notifications & logs** | toast feed, kill/event feed, loot log, achievement pop, "Level 2!" banner | CORE | GUDB ✔ |
| **Prompts & hints** | contextual button prompt ("[E] Open"), tutorial hint, controls reference | COMMON | GUDB ✔ |
| **Navigation** | minimap frame, compass strip, off-screen arrow, waypoint marker | NICHE (open-world/action) | GUDB ✔ |
| **World-space labels** | name tag, floating damage number, NPC info plate, speech bubble | COMMON (3D/R3F: drei `<Html>`) | GUDB "Object/NPC Information" ✔; Crusenho bubbles ✔ |
| **Targeting** | reticle, lock-on, throw arc | NICHE (shooter/action) | GUDB ✔ |
| **Mobile controls** | virtual joystick, action buttons, pause button corner | COMMON (mobile action) | GUDB ✔ |
| **HUD chrome** | pause button, settings cog, menu button, connection/ping dot | CORE | LAYERLAB play screens ✔ |

✱ HUD layout convention seen across the LAYERLAB play screens and GUDB: **top-left = player vitals/identity, top-right = pause + currency, top-centre = timer/score/turn, bottom = actions/hand, centre = transient banners.** Keep safe-area insets on phones.

---

## 4. Structure vs style: how kits separate them

### 4a. What the kits actually do (evidence)

| Kit | How style varies | What stays fixed |
|---|---|---|
| LAYERLAB Minimal Game **Blue / Dark / Light** ✔ | Same 104 layouts sold as three colour products | Layout, component set, icon set |
| LAYERLAB Fantasy RPG ✔ | Colour baked into sprites; few tintable "white" sprites (reviewer note) | — (hard to reskin) |
| LAYERLAB Survival Clean ~ | "White elements for customizable colour" | Layout |
| Kenney UI Pack ✔ | **Every element × 5 colours**; separate packs per *material* (RPG, Sci-Fi, Adventure, Pixel) with the same part list | Part list (button, panel, slider, check, bar) |
| Crusenho ✔ | **13 material themes over one part list** (Flat, Gradient, Paper, Wood, Stone, Metal, Hologram, Glass…) | Parts, 32×32 grid, 9-slice |
| Clean & Minimalist ~ | 3 skins (Dark/Light/Black) + 15 background colours | Layout |
| Michsky Modern UI / Heat ✔ | **UI Manager**: one asset sets palette (Accent, Accent Match, Primary, Secondary, Negative, Background) + fonts for *every* element at once | Components, animation, navigation |
| 8bitcn ✔ | **21 themes = CSS colour variables only**; radius (0) and pixel font are shared "retro" rules | All components and blocks |
| sinanata (prev review) ✔ | ThemeData ScriptableObject → USS variables; dark/light | Components |

**Conclusion (✱ from the above):** the industry pattern is **one structure, many skins**, done at three depths:
1. **Palette swap** (cheapest): Minimal Blue/Dark/Light, Kenney 5 colours, 8bitcn 21 themes, Michsky UI Manager. Only colour roles change.
2. **Token swap**: palette + font + radius + border + shadow + motion. Michsky (fonts) and shadcn-style kits reach this level.
3. **Material swap**: same parts redrawn as wood/stone/metal/glass/paper (Crusenho, Kenney expansions, LAYERLAB "Wooden/Stone/Matt Metal"). On the web this is `border-image` 9-slice + background textures. In Unity it is sprite borders.

The screen *layouts* never change between skins in any kit surveyed.

### 4b. Named style families

Game UI Database's own **UI Style** tags (✔): Flat, Flat 2.0, Flat-Minimalist, Flat-Textured, Skeuomorphic, Hand-Painted, Pixel, Art & Vector. **Materials & Textures** (✔): Book & Folio, Brush Stroke, Distress, Glowing Edges, Grain/Noise, Grunge Brush, Linen & Textile, Metal Border, Paper, Pen & Pencil, Scanline/Grid, Splat, Stone, Wood. **Patterns & Shapes** (✔): Art Deco, Barcode & Tag, Blueprint/Chart, Border Pattern, Circles, Gothic, Halftone, Memphis, Nature, Nordic/Celtic, Ornate, Runes, Skew & Wonk, Stripes, Tiled Backdrop, Tilted, Tribal, Wavy Freehand. **Themes** (✔) include Cartoon, Fantasy, Futuristic, Horror, Medieval, Steampunk, Wholesome, Western, etc.

Merging GUDB tags with kit naming (LAYERLAB: Casual / Super Casual / Fantasy / Minimal / Sci-Fi / Neon / Stone / Wooden / Metal; Crusenho materials; 8bitcn console themes), the recurring families are:

| Family | Kit examples | Shape | Borders | Fonts | Texture / fill | Shadow / depth | Motion |
|---|---|---|---|---|---|---|---|
| **Casual / cartoon** | LAYERLAB Casual, Super Casual; DeviStudio; Kenney default | Big radius, pill buttons, chunky | Thick dark outline, inner highlight | Rounded heavy display (e.g. Fredoka-like ✱) | Glossy gradients, candy colours | Hard drop shadow under button (pressed = moves down) | Bouncy: overshoot, squash, pop-in |
| **Minimal / flat** | LAYERLAB Minimal; Clean & Minimalist; Michsky | Small/medium radius | Hairline or none | Clean sans | Solid fills | Soft or none | Quick fades/slides, 150–250 ms ✱ |
| **Dark / modern (console AAA)** | Michsky Heat; Minimal Dark | Sharp or slight radius, skewed tabs | Thin accent lines | Condensed sans (Heat uses Roboto Condensed ✔) | Dark translucent panels, blur | Glow on focus | Sliding panels, focus scale |
| **Sci-fi / hologram / neon** | LAYERLAB Survival Clean, SciFi Blue, Neon; Kenney Sci-Fi; Crusenho Hologram | Chamfered corners, brackets | Thin glowing lines, corner ticks | Wide/techno sans, mono numbers | Scanlines, grid, transparency | Outer glow | Flicker-in, type-on text, scan sweep |
| **Fantasy / medieval (skeuomorphic)** | LAYERLAB Fantasy RPG, Wooden, Stone; Fantasy Wooden GUI; Crusenho Wood/Stone/Runewood; Parchment (Figma) | Ornate frames, ribbons, banners | Metal/wood trims, rivets | Serif / blackletter titles + readable body | Wood, stone, parchment, leather | Baked shading | Slower, weighty; page-turn, unfurl |
| **Pixel / retro** | 8bitcn; Crusenho; Kenney Pixel; Pixel UI Kit | Square, stepped corners, radius 0 | 2–4 px hard pixel borders | Pixel font (Press Start 2P ✔ in 8bitcn) | Flat palette-limited, dithering | Hard 1-step offset shadow | Frame-stepped (no easing), blink |
| **Paper / hand-drawn / cozy** | Crusenho Paper, Papernote; GUDB Paper, Pen & Pencil, Hand-Painted, Wholesome | Wobbly or torn edges | Sketchy strokes | Handwritten titles | Paper grain, tape, stickers | Soft cast shadow | Gentle wobble, float |

**What a skin changes** (✱ synthesis, consistent with all kits above): colour roles; corner shape (radius, chamfer, pixel-step); border (width, style, 9-slice image); font pair (display + body) and letter case; fill (flat, gradient, texture); depth (shadow type, glow, bevel); motion (easing curve, duration, overshoot, stepped); sound (click/hover set; Heat has an Audio handler ✔). **What a skin never changes:** screen list, layout slots, component anatomy, states, navigation, accessibility minimums.

For BMUZ ✱: this maps directly to `theme.json` groups: `color`, `shape` (radius | chamfer | pixel), `border` (width | image), `font`, `surface` (flat | gradient | texture), `depth`, `motion`, `sound`. The families above become presets. Accessibility rules (§2 numbers) sit outside the skin so no preset can break them.

---

## 5. Gaps and cross-checks

- **Web kits lack the horizontal selector (◀ ▶)**, gamepad focus navigation and a HUD kit beyond bars. Michsky Heat has all three for Unity. BMUZ will have to build these on the web side.
- **Mobile/F2P meta dominates art-kit screen lists** (battle pass, gacha, roulette, subscriptions). Marked NICHE; Muzzy's party/board games need Lobby, Results, Turn indicator and Leaderboard much more.
- **Turn-based/board-game parts are under-served in every kit** (turn banner, player seats around a table, hand of cards, dice tray, score track). Treat them as a BMUZ-specific "tabletop" block set (✱).
- **No kit surveyed ships a complete accessibility settings page.** GUDB has a type for it; XAG/GAG supply the contents.

## 6. Unverified / flagged

- Figma Community kits (Game UI Wireframe Kit, Game UX Kit, Parchment, Quizio, Mobile game ui-kit): Figma returns 403 to fetch. Contents come from search snippets; component lists are **not verified**.
- LAYERLAB Survival Clean scene list, Clean & Minimalist GUI Pack skins, Fantasy Wooden GUI, Pixel UI Kit, Cyangmou pack: search snippets only.
- Kenney colour names (blue/green/grey/red/yellow): "5 colours" is verified; exact names ~.
- Michsky UI Manager: palette + fonts verified on the Heat page; the full list of properties it controls was not shown on the docs pages.
- Game UI Database: the screen-type list and style tags came from the raw HTML of `index.php?scrn=1` (✔). The *grouping* of types under parent headings (Main Menus / HUDs / Maps / Settings / Items & Unlocks / Tutorials / Modals / Buttons & Controls) is inferred from IDs and earlier snippets, not read as a tree.
- XAG numbers other than 101/102 (e.g. which number covers destructive actions or photosensitivity) were not opened. The topic list comes from a search snippet.
- The "most-duplicated" ranking of Figma kits could not be checked (duplicate counts are not visible without the page).
- All tier labels (CORE/COMMON/NICHE) are my judgement from how many sources include an item; they are not measured frequencies.

## Sources
- LAYERLAB: https://layerlab.io/products/casual-game-gui-kit · https://layerlab.io/products/gui-pro-fantasy-rpg · https://layerlab.io/products/gui-pro-minimal-game-blue · https://layerlab.itch.io/ · https://layerlab.itch.io/gui-pro-survival
- Michsky: https://docs.michsky.com/docs/modern-ui-pack/ui-elements/ · https://docs.michsky.com/docs/heat-ui/ · https://michsky.com/portfolio/heat-complete-modern-ui/
- Clean & Minimalist GUI Pack: https://assetstore.unity.com/packages/2d/gui/clean-minimalist-gui-pack-75123
- Kenney: https://kenney.nl/assets/ui-pack · https://kenney-assets.itch.io/ui-pack
- Crusenho: https://crusenho.itch.io/complete-ui-essential-pack
- 8bitcn: https://github.com/TheOrcDev/8bitcn-ui (components/ui/8bit, blocks, lib/themes.ts)
- DeviStudio: https://devistudio.itch.io/vibrant-casual-game-ui-kit-professional-figma-source
- Figma: https://www.figma.com/community/file/1387093843913812299 · …/1460785931676185568 · …/1288804025168455103 · …/1519638331609996419
- Pixel UI Kit: https://itch.io/t/6301398/pixel-ui-kit-hud-bars-buttons-icons-inventory-slots · Fantasy Wooden GUI: https://assetstore.unity.com/packages/2d/gui/fantasy-wooden-gui-free-103811
- Game UI Database: https://www.gameuidatabase.com/index.php?scrn=1
- Game Accessibility Guidelines: https://gameaccessibilityguidelines.com/full-list/
- Xbox Accessibility Guidelines: https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/101 · …/102
