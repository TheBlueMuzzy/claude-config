# BMUZ skill-library review: Free indie toolkit, art/audio pipeline, release

Researched 2026-09-28. **Verified** = I read the claim on the vendor's or project's own page today. **3rd-party** = only a blog or aggregator confirmed it. **Unverified** = from memory, not re-checked. Nothing was installed or changed.

Verdict key: **ADOPT** (use as is) · **BETTER-THAN-OURS** (beats what BMUZ currently does) · **STEAL-THE-IDEA** (copy the approach into a BMUZ skill or reference) · **SKIP**.

---

## 0. What BMUZ has today (the gap)

I skimmed audio-setup, organize-assets, deliver, multiplayer-setup, save-system, optimize, the deployer agent and `config/bmuz/release/`.

- **No skill names a single asset source.** A grep for Kenney, CC0 and game-icons across skills and config found only BMUZ-PLAN's wish-list line. audio-setup builds a Howler sound manager but never says where sounds come from, and has no procedural SFX (ZzFX or jsfxr).
- **There is no license or credits tracking.** organize-assets renames and compresses files but never records the source, license or attribution. Nothing generates a CREDITS screen or file, so a CC-BY asset could ship uncredited.
- **No release recipes exist yet.** `release/` holds only the README template: no itch, github-pages or netlify recipe, and no store-asset checklist (cover, screenshots, icons, PWA manifest). The deployer agent covers GitHub Pages, Capacitor and Steam, but not itch.io or butler.
- **multiplayer-setup doesn't mention PartyKit**, even though deliver, play and live-playtest assume Muzzy uses it. It recommends Colyseus and Playroom instead.
- **No game-feel or juice skill exists.** mda-analyze points to "Dev Kit Feel/Animation" but no skill teaches shake, hit-stop, tweens or particles.
- **There's no analytics or crash-reporting guidance anywhere.**

---

## 1. Free / CC0 asset sources

| Name | URL | What it gives | License / cost | Verified | Verdict |
|---|---|---|---|---|---|
| **Kenney** | kenney.nl · kenney.itch.io/kenney-game-assets | 60k+ assets: 2D sprites, 3D kits, UI packs, **audio packs** (interface, impact, RPG, jingles), **fonts**, input prompts. One consistent friendly style | **CC0**, commercial OK, no attribution. Don't use the Kenney logo. The All-in-1 bundle is pay-what-you-want (individual packs are free) | Verified (support page) | **ADOPT**. This is the #1 default for prototypes: basic shapes that still look consistent |
| **Quaternius** | quaternius.com | Low-poly 3D packs (characters with animations, nature, props), glTF/FBX | Custom license: free, commercial OK, **no attribution**. Assets can't be resold or redistributed as asset packs | Verified (license page) | **ADOPT** for 3D |
| **Poly Pizza** | poly.pizza | 10k+ low-poly models, many from Quaternius/Google Poly. **API** (free key) | Mixed **CC0 + CC-BY 4.0** per model. CC-BY needs a credit: "Title" by Author (poly.pizza) CC-BY 4.0 | 3rd-party (site returned 403; API docs and search results agree) | **ADOPT**, but filter to CC0 or log credits |
| **Poly Haven** | polyhaven.com | HDRIs, PBR textures, some models. Public API | **CC0**, no attribution. The API has separate terms | Verified | **ADOPT** for 3D lighting and environment maps (drei `<Environment>` HDRIs) |
| **ambientCG** | ambientcg.com | PBR materials, HDRIs, some models | **CC0** | Verified | **ADOPT** (alternative to Poly Haven) |
| **OpenGameArt** | opengameart.org | Huge mixed library: sprites, tiles, music, SFX | Mixed: CC0, CC-BY, **CC-BY-SA** (share-alike), **GPL**, OGA-BY. License is per item | Verified (FAQ) | **ADOPT with a CC0/CC-BY-only filter**. SKIP GPL and SA items unless deliberate |
| **game-icons.net** | game-icons.net | ~4,100 game-specific SVG icons (swords, potions, dice…), recolorable. Also bundled in `react-icons` (`gi` set, ~4,040) and Iconify | **CC-BY 3.0**. Attribution **required**: "Icons made by {author}. Available on https://game-icons.net" | Verified | **ADOPT**. It's the best free game-icon set, but it must be credited |
| **Lucide / Tabler / Phosphor** | lucide.dev etc. | UI glyphs (settings, close, volume) | Lucide **ISC**: keep the notice, no visible credit needed. Tabler and Phosphor are MIT | Lucide verified; Tabler and Phosphor unverified | **ADOPT** for UI glyphs (the UI-kit agent may overlap) |
| **Fluent Emoji (Microsoft)** | github.com/microsoft/fluentui-emoji | Emoji as flat SVG, color and 3D-style PNG. Great instant placeholder "art" | **MIT** (repo license) | Partial (formats not confirmed on page) | **ADOPT** for emoji placeholders (no attribution) |
| **OpenMoji** | openmoji.org | Consistent flat emoji + extra icons | **CC-BY-SA 4.0**: attribution + share-alike | Verified | SKIP (share-alike). Prefer Fluent |
| **Twemoji** | github.com/twitter/twemoji (maintained fork: jdecked/twemoji, unverified) | Emoji graphics | Graphics **CC-BY 4.0**, code MIT | Verified | SKIP-ish (needs a credit; Fluent doesn't) |
| **Google Fonts / Fontsource** | fonts.google.com · fontsource.org | 1,700+ fonts. Fontsource = `npm i @fontsource/<font>`, self-hosted, no Google calls (privacy, offline) | Mostly **SIL OFL** (free commercial; don't sell the font alone) | Fontsource verified; OFL licensing unverified per font | **ADOPT Fontsource** as the default route (works offline and in PWAs) |
| **Kenney Fonts** | kenney.nl/assets/kenney-fonts | Game-style display fonts | CC0 | Unverified (part of the Kenney catalog) | **ADOPT** |
| **Freesound** | freesound.org | Huge SFX library, license filter, API | Per sound: **CC0**, **CC-BY**, **CC-BY-NC (no commercial!)**. Sampling+ is being retired | Verified (FAQ) | **ADOPT with a CC0 filter**. Never use NC in a game that might be sold |
| **Sonniss #GameAudioGDC bundles** | gdc.sonniss.com | ~7.5 GB of pro SFX each year (2015–2026 bundles) | Royalty-free, commercial OK, **no attribution**, lifetime. **No AI/ML training** use; can't be redistributed raw | 3rd-party (license page listed; summaries agree) | **ADOPT**. Download once into a local library on Muzzy's PC, not into repos |
| **Pixabay Music/SFX** | pixabay.com/music | Music + SFX | Pixabay Content License: no attribution, commercial OK, no standalone redistribution. Some tracks trigger YouTube Content ID (unverified) | Verified (summary page) | **ADOPT** for music |
| **Kevin MacLeod / incompetech** | incompetech.com | 2,000+ music tracks | **CC-BY** (free with a credit) or a paid license without one | Verified | ADOPT (credit needed; very recognizable) |
| **FreePD** | freepd.com | *Was* public-domain music | **Closed in 2025** | Verified | **SKIP** (dead; remove it if any doc mentions it) |

Rule for BMUZ: **prefer sources that need no attribution** (Kenney, Quaternius, Poly Haven, ambientCG, Fluent Emoji, Sonniss, Pixabay). Anything CC-BY gets an entry in `content/credits.json`. **Never** use NC or share-alike or GPL media without asking Muzzy.

---

## 2. Procedural / code-made prototype art & audio (all free)

### Audio
| Name | URL | What | License | Verified | Verdict |
|---|---|---|---|---|---|
| **ZzFX** (+ ZzFXM music) | github.com/KilledByAPixel/ZzFX | <1 KB SFX generator: `zzfx(...params)`. Web designer tool, exports .wav. `npm i zzfx` | **MIT** | Verified | **BETTER-THAN-OURS**. Instant placeholder SFX in code with no files; params can live in `content/sfx.json` so Muzzy can tweak them in the Dev Kit |
| **jsfxr / sfxr.me** | github.com/chr15m/jsfxr · sfxr.me | sfxr port with presets (pickupCoin, laserShoot…). `npm i jsfxr`. Sounds serialize to JSON/URL | **Unlicense** (public domain) | Verified | **ADOPT** (alternative to ZzFX; preset names are friendlier) |
| **ChipTone** | sfbgames.itch.io/chiptone | Free web/desktop SFX designer | Output **CC0** | Verified | ADOPT (a tool Muzzy can play with himself) |
| **BeepBox** (+ JummBox/UltraBox forks) | beepbox.co · github.com/johnnesky/beepbox | Browser chiptune music maker; the song lives in the URL; exports MP3 (and WAV, unverified) | **MIT** tool | Verified (tool license; song ownership not stated, presumably yours) | **ADOPT** for placeholder music Muzzy can make himself |
| Tone.js | tonejs.github.io | Generative/procedural music in code | MIT (unverified) | Already in audio-setup | keep |

### Visuals / shaders
| Name | URL | What | License | Verified | Verdict |
|---|---|---|---|---|---|
| **three.js examples + drei** | threejs.org/examples · drei | Tons of ready effects (Sparkles, Stars, Cloud, MeshDistortMaterial, Environment, Trail, Float) | MIT | Unverified (well known) | **ADOPT**. Reach for drei helpers before custom shaders |
| **LYGIA** | github.com/patriciogonzalezvivo/lygia | Big shader function library (noise, SDF, color, lighting) for GLSL/WGSL/HLSL, with three.js and Unity examples | **Prosperity License = non-commercial only.** Commercial use needs sponsorship, contribution or a paid per-version license | Verified | **SKIP for shipping** (fine for learning or throwaway protos). Use it for ideas only; write shaders from scratch or use MIT code |
| **Shadertoy** | shadertoy.com | Shader inspiration | Default **CC BY-NC-SA 3.0** (no commercial, share-alike) unless the code header says otherwise | 3rd-party (terms page 403; multiple sources agree) | **SKIP copying**. Learn from it only; check each shader's header |
| **SVG / emoji / CSS placeholders** | n/a | Coloured shapes, emoji, game-icons SVGs recoloured with CSS | n/a | n/a | **STEAL-THE-IDEA**. Make a "placeholder art ladder" rule (below) |

**Placeholder art ladder** (proposed rule for /develop): (1) basic shapes + palette tokens → (2) emoji (Fluent) or game-icons SVG → (3) Kenney/Quaternius kit in a matching style → (4) Muzzy's real art. Never AI-generate unless Muzzy asks. Every non-CC0 asset → credits.json.

### MCP servers / Claude skills that pull from these sources
| Name | URL | What | Cost | Verified | Verdict |
|---|---|---|---|---|---|
| **Blender MCP** (ahujasid; now "MCP for Blender") | github.com/ahujasid/blender-mcp | Claude drives Blender: builds and edits scenes; imports **Poly Haven (free, no key)**, Poly Pizza (free key), Sketchfab (free key). Hyper3D Rodin is paid, Hunyuan3D freemium | Free, MIT. ~29.5k stars | Verified | **STEAL-THE-IDEA / optional ADOPT**. Only worth it once Muzzy wants custom low-poly scenes and has Blender installed. Warning: `execute_blender_code` runs arbitrary Python, so save first. Its Poly Haven integration had bugs recently (issues #361, #367) |
| **ASSETMCP** (emreyvz) | github.com/emreyvz/ASSETMCP | Searches and downloads from Kenney, OGA, Quaternius, Poly Haven, ambientCG, Openverse, itch… Python, Windows installer | Free, MIT | Verified, but **0 stars, 8 commits** | **SKIP** (too immature). **STEAL-THE-IDEA**: the source list = our reference card |
| **poly-pizza-mcp** (HaD0Yun) | github.com/had0yun/poly-pizza-mcp | Poly Pizza → Unity import with prefab + **credit tracking** | Free (needs a free Poly Pizza key), MIT, 3 stars | Verified | SKIP the tool, **STEAL the credit-tracking idea** |
| polyhaven-mcp (RN0000) | glama.ai/mcp/servers/RN0000/polyhaven-mcp | Poly Haven search/download | Free | Unverified (listing only) | SKIP. Poly Haven's API is simple enough to curl from a skill |
| Ludo MCP · game-asset-mcp (HF) · eachlabs game-asset-generation skill | ludo.ai etc. | AI generation of sprites, 3D and audio | Ludo is **paid**; HF Spaces is free but quota-limited | Search-level only | **SKIP**. Muzzy said no paid generators, and prototypes use shapes |
| **awesome-gamedev-agent-skills** | github.com/gamedev-skills/awesome-gamedev-agent-skills | 74 SKILL.md skills (Apache-2.0, ~1.2k stars). Relevant ones: `game-feel`, `create-game-assets` (with `provenance.md` + asset-manifest.json), `audio-design`, `itch-publish`, `steam-publish`, threejs-*, unity-* | Free | Verified (read game-feel, provenance, itch-publish, steam-publish) | **STEAL-THE-IDEA** (high value). The game-feel skill is excellent (trauma-based shake, hit-stop, feedback tiers, "5–8 responses within ~100 ms"). itch-publish is a ready-made butler recipe. provenance.md is the license-tracking checklist BMUZ lacks. Don't install wholesale: its Godot-first examples and non-BMUZ routing would clash |

---

## 3. Animation & game-feel libraries (free)

| Name | URL | What | License / cost | Verified | Verdict |
|---|---|---|---|---|---|
| **GSAP (all plugins)** | gsap.com | Best-in-class timeline tweening for DOM, SVG and canvas values. SplitText, MorphSVG etc. are **now free** (Webflow-funded) | Free "Standard License": commercial OK. **Only restriction:** you can't build a no-code visual animation *builder* that competes with Webflow. Games are fine | Verified | **ADOPT** for UI/menu juice (DOM/SVG) and sequenced effects |
| **GSAP official AI skills** | github.com/greensock/gsap-skills (`/plugin marketplace add greensock/gsap-skills`) | Teaches Claude correct GSAP usage | Free | 3rd-party (search results + repo title) | **ADOPT** if GSAP is adopted |
| **Motion** (ex-Framer Motion) | motion.dev · `npm i motion`, import `motion/react` | React animation, layout animations (great for self-adapting menus), springs, gestures | Core free/MIT. **Motion+** is a paid lifetime add-on for extra examples and APIs (not needed). Free `/motion` docs skill via `npx motion-ai` (MIT) | Verified | **ADOPT** for React UI (layout animations suit Muzzy's "add a row and it still works" wish) |
| **maath** (pmndrs) | github.com/pmndrs/maath | `easing.damp`/springs for R3F `useFrame`, allocation-free | MIT | Partially verified (page described it as "math"; the easing/spring API was confirmed) | **ADOPT** for 3D camera and object feel (fits the "refs in useFrame, not state" rule) |
| **three.quarks** (+ `quarks.r3f`, editor quarks.art) | github.com/Alchemist0823/three.quarks | Full particle/VFX system with a **visual editor exporting JSON** (drops into `content/`!) | MIT, ~1k stars, active | Verified | **BETTER-THAN-OURS** (we have nothing). Default particle lib for 3D |
| **wawa-vfx** | github.com/wass08/wawa-vfx | Simpler R3F particle library with Leva controls | MIT, 146 stars | Verified | ADOPT for quick bursts. three.quarks for anything bigger |
| **PrimeTween** (Unity) | github.com/KyryloKuzyk/PrimeTween | One-line tweens/sequences, **zero GC allocations** | Free / open source. PRO (inspector authoring) is paid and optional | Verified | **ADOPT** as the Unity default |
| **DOTween** (Unity) | dotween.demigiant.com | The classic tween library (v1.3.030, June 2026) | Free; Pro is paid on the Asset Store | Verified (download page) | Fine alternative. PrimeTween preferred (no GC) |
| LeanTween | n/a | Older Unity tweener | Free | Unverified (believed stale) | **SKIP** |
| Feel (MoreMountains) | Asset Store | Unity juice toolkit | **Paid** | Unverified | SKIP (paid) |
| **Juice references** | "Juice it or lose it" (Jonasson & Purho, 2012, youtube.com/watch?v=Fy0aCDmgnxg) · "The Art of Screenshake" (Jan Willem Nijman, Vlambeer) · Swink's *Game Feel* | The canonical talks: ~30 feel tricks | Free videos | Verified (search) | **STEAL-THE-IDEA**: build a `game-feel` skill that cites them, using the gamedev-skills structure (event hooks → channels → tiers → verify), with values in `content/feel.json` |

---

## 4. Free hosting / backend / services (limits checked 2026-09-28)

| Service | Free tier (verified 2026-09-28 unless noted) | Gotchas | Verdict |
|---|---|---|---|
| **GitHub Pages** | 1 GB site, **soft 100 GB/month** bandwidth, soft 10 builds/hour (unlimited via Actions), 10-min deploy timeout | "Not for commercial hosting". Static only. Needs Vite `base: '/<repo>/'` | **ADOPT**: current default for free web games |
| **Cloudflare Pages** | 500 builds/month, 1 concurrent, 20k files/site, **25 MiB max file**, 100 projects. Bandwidth unlimited (not on the limits page; unverified) | 25 MiB/file is a problem for big GLBs and audio | **ADOPT**. Best free static host for commercial-OK and fast delivery; pairs with Workers/DO |
| **Cloudflare Workers + Durable Objects** | Workers ~100k req/day (unverified here). **DOs on the free plan (SQLite backend only):** 100k requests/day (WebSocket messages count), 13,000 GB-s/day, 5M rows read/day, 100k rows written/day, 5 GB stored. Over the limit → errors until 00:00 UTC | WebSocket messages count as requests, so a busy real-time game could hit 100k/day | **ADOPT** as the multiplayer backend (it's what PartyKit runs on) |
| **PartyKit** | Now part of Cloudflare. **Deploying to your own Cloudflare account: no platform fee** (`CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… npx partykit deploy`). Managed partykit.dev hosting still documented; its current price wasn't stated | Long-term the Cloudflare route (`partyserver`) is the safe path | **ADOPT** (already used). **multiplayer-setup should list it first for web**, not Colyseus |
| **Colyseus Cloud** | **No free hosted tier**: self-host free (MIT); Cloud from **$15/mo** | Needs an always-on server | SKIP for Muzzy (paid). Keep as a self-host option only |
| **Playroom Kit** | Free tier (unverified today) | Vendor lock-in | Keep (already in multiplayer-setup) |
| **Netlify Free** | Credit-based: **300 credits/month hard cap**. Roughly 15 GB bandwidth *or* ~20 production deploys (20 credits/GB, 15/deploy) | **When credits run out, ALL sites on the team pause until the month resets** | **SKIP as a default** (a viral day pauses everything) |
| **Vercel Hobby** | 100 GB transfer, 1M function invocations, 1M edge requests | **"Personal, non-commercial use" only** | ADOPT for personal prototypes only. **Not for anything sold/ads/itch-paid** |
| **Firebase Spark** | Hosting 10 GB storage, **360 MB/day** transfer. Firestore 1 GiB, 50k reads / 20k writes / 20k deletes per day. RTDB 100 connections, 1 GB, 10 GB/month. Auth 50k MAU. Analytics + Crashlytics free | 360 MB/day hosting is tiny for 3D games. Spark Cloud Storage is on "legacy buckets" only | ADOPT for Auth/Firestore/leaderboards if needed; host elsewhere |
| **Supabase Free** | 2 active projects, 500 MB DB, 50k MAU, 5 GB egress, 1 GB storage, Realtime 200 concurrent / 2M messages/month | **Pauses after 1 week of inactivity** (prototypes go to sleep) | ADOPT for cloud saves/leaderboards (save-system already names it). Warn about the pause |
| **itch.io hosting** | Free HTML5 hosting: ZIP ≤1,000 files, ≤500 MB extracted, ≤200 MB per file, `index.html` entry, case-sensitive UTF-8 names | Embedded in an iframe on itch's page | **ADOPT** as the second web platform (and audience) |

### Analytics & crash reporting (free, privacy-friendly)
| Name | Free tier | Notes | Verdict |
|---|---|---|---|
| **Cloudflare Web Analytics** | Free, no cookies or localStorage, a JS beacon works on any host (GitHub Pages, itch) | Page views only; custom events not advertised | **ADOPT** as the zero-effort "is anyone playing?" |
| **GoatCounter** | Free for "reasonable public usage", no cookies, open source, no GDPR banner needed | Donation-funded, simple | ADOPT (alternative) |
| **Umami Cloud Hobby** | 100k events/month, 1–3 websites (sources conflict), 6-month retention. Self-host MIT | Has custom events (e.g. `level_complete`) | **ADOPT** if Muzzy wants gameplay events |
| **GameAnalytics** | Free, **no MAU cap**: funnels, retention, custom events. SDKs for Unity and HTML5 (SDK list unverified) | Not cookie-less; collects device data → needs a privacy policy | ADOPT for Unity or store releases |
| **Sentry Developer** | 5k errors/month, 1 user, 50 replays, unlimited projects | Needs a consent note for replays | **ADOPT** for beta/1.0 crash reporting (JS + Unity SDKs) |
| Firebase Crashlytics | Free | Mobile-oriented | Use only for Capacitor/Unity mobile |

---

## 5. Release / store assets

| Item | Facts (verified) | Verdict |
|---|---|---|
| **butler** (itch CLI) | Free, MIT. `butler login` → `butler push <dir> <user>/<game>:<channel> --userversion X.Y.Z`. Channel names auto-tag the platform (`html`/`html5`, `windows`, `osx`, `linux`, `android`). Diff-uploads. `butler status`, `butler push-preview`. CI uses `BUTLER_API_KEY` | **ADOPT**. Write `release/itch.md` from the gamedev-skills `itch-publish` skill |
| **itch page** | Cover **630×500** (min 315×250, 315:250 ratio), 3–5 screenshots of any size (a GIF helps). Kind = **HTML** for web builds. Embed-in-page (set viewport) or click-to-launch fullscreen; "mobile friendly" flag forces fullscreen on phones. Visibility Draft → Restricted → Public. Up to 10 tags. Pricing: free / PWYW / paid | **ADOPT** as an itch page checklist in the recipe |
| **butler-publish-itchio-action** | github.com/manleydev/butler-publish-itchio-action. GitHub Action: `BUTLER_CREDENTIALS`, `CHANNEL`, `ITCH_GAME`, `ITCH_USER`, `PACKAGE`, `VERSION`. GPL-3.0 (fine: it's a CI tool, not shipped), 145 stars | ADOPT when a project wants auto-publish on tag |
| **GameCI** (Unity) | game.ci, free and open source. `unity-builder` + `unity-test-runner` on GitHub Actions, **WebGL builds**, works with a **Unity Personal** license | **ADOPT** for Unity → itch/WebGL CI |
| **PWA** | Chrome install criteria: `name`/`short_name`, icons **192 + 512**, `start_url`, `display` standalone/fullscreen/minimal-ui, `prefer_related_applications` absent or false, HTTPS, engagement heuristic. **vite-plugin-pwa** (MIT, `npm i -D vite-plugin-pwa`) generates the manifest + service worker; **@vite-pwa/assets-generator** makes all icon sizes from one SVG | **ADOPT** (a phone "Add to home screen" suits Muzzy's phone testing) |
| **Google Play** (3rd-party sources, consistent) | Icon 512×512 32-bit PNG ≤1 MB. **Feature graphic 1024×500** (JPEG or 24-bit PNG, no alpha), required. 2–8 phone screenshots, 320–3840 px, ≤2:1 (1080×1920 safe) | Put in the store-asset checklist |
| **Steam** (verified) | Header 920×430, Small 462×174, **Main 1232×706**, **Vertical 748×896**, ≥5 screenshots at ≥1920×1080, optional page background 1438×810. Library assets on a separate page (hero 3840×1240, 3rd-party). $100 app fee, 21-day wait, 2 weeks "Coming Soon", ~3–5 business-day review (from the steam-publish skill; unverified) | Later. **STEAL** the gamedev-skills `steam-publish` skill into `release/steam.md` when needed |
| **Asset-generation automation** | No free, trustworthy "make my store assets" tool found. Best route: a **Playwright script** that screenshots the game at each required size and composes cover/capsule images from an HTML template (Claude can already do this) | **STEAL-THE-IDEA**: a "store-kit" step in /deliver at beta/1.0 |

---

## 6. Proposed reference card: `~/.claude/references/indie-toolkit.md`

One file (~150 lines) that every BMUZ skill consults instead of each skill re-inventing sources. Outline:

1. **Rules of thumb (top of file)**
   - Placeholder ladder: shapes → emoji/game-icons → Kenney/Quaternius kit → real art. No paid generators; AI generation only if Muzzy asks.
   - License traffic light: 🟢 CC0 / no-attribution (use freely) · 🟡 CC-BY / OFL (use + add to `content/credits.json`) · 🔴 NC, SA, GPL media, Shadertoy default, LYGIA commercial (ask Muzzy first).
   - Every imported asset → `content/credits.json` row (id, path, source URL, author, license, attribution text, date). Game shows a Credits screen generated from it.
2. **Asset sources by need**: 2D/UI · 3D models · textures/HDRI · icons · emoji · fonts · SFX · music. 2–3 picks each, license + attribution line.
3. **Make-it-in-code**: ZzFX / jsfxr (SFX params in `content/sfx.json`), BeepBox/ChipTone (Muzzy's own tools), drei helpers, three.quarks editor → JSON in `content/`.
4. **Game feel**: libs per stack (Web UI: Motion/GSAP · R3F: maath + three.quarks · Unity: PrimeTween) + the juice checklist (event hooks, 5–8 channels in ~100 ms, trauma² shake, hit-stop, small/medium/large tiers in `content/feel.json`) + links to the two talks.
5. **Hosting & backend decision table**: static web → GitHub Pages (hobby) / Cloudflare Pages (commercial OK); multiplayer → PartyKit/Cloudflare DO; saves/leaderboards → Supabase (pauses after 7 days) or Firebase; avoid Netlify Free (pauses all sites), Vercel Hobby (non-commercial). Each row: free limits + **"verified <date>"**, and a rule to re-verify if older than 6 months.
6. **Analytics & crashes**: Cloudflare Web Analytics (default) → Umami (events) → GameAnalytics (Unity/mobile). Sentry at beta. Privacy-policy trigger list.
7. **Release platforms**: links to `config/bmuz/release/*.md` recipes + store-asset size table (itch, PWA, Google Play, Steam) + tools (butler, butler Action, GameCI, vite-plugin-pwa + assets-generator).
8. **Changelog**: date + what was re-verified.

Skills that should point at it: audio-setup (sources + ZzFX), organize-assets (credits.json + license audit), deliver (store-asset table, credits check before release), multiplayer-setup (PartyKit row), optimize (Cloudflare 25 MiB/file, itch 1,000-file limit), define/tdd (hosting choice), develop (placeholder ladder).

---

## 7. Top 5 recommendations

1. **Write `references/indie-toolkit.md` + a `content/credits.json` convention.** This is the single biggest "what he doesn't know he needs": vetted CC0-first sources and a license traffic light, so nothing CC-BY ships uncredited and nothing NC/SA sneaks in. Wire organize-assets and deliver to check it (release blocks if an asset has no license row).
2. **Kenney + Quaternius + Poly Haven + Fluent Emoji + game-icons as the default placeholder kit**, with the placeholder ladder written into /develop. Consistent, free, no-attribution art replaces hand-tweaking basic shapes.
3. **Add procedural SFX (ZzFX, or jsfxr presets) to audio-setup**, with params in `content/sfx.json` and editable in the Dev Kit. Every prototype gets sound on day one with zero files. Pair with BeepBox for placeholder music.
4. **Create a `game-feel` skill** by stealing the structure of gamedev-skills' `game-feel` (event hooks → channels → tiers → verify), mapped to BMUZ stacks: Motion/GSAP for UI, maath + three.quarks for R3F, PrimeTween for Unity. Tier values go in `content/feel.json`. It fills the gap mda-analyze already points at.
5. **Write the itch.io release recipe (`release/itch.md`) now**, from the verified butler facts + gamedev-skills' `itch-publish`: page checklist (630×500 cover, 3–5 screenshots, HTML kind, mobile-friendly flag), butler channel `html`, 1,000-file limit. Also fix **multiplayer-setup to put PartyKit/Cloudflare first** (free, already used) and demote Colyseus Cloud (no free tier). Note in the hosting table: avoid Netlify Free (all sites pause) and Vercel Hobby (non-commercial).

Honourable mentions: Cloudflare Web Analytics (free "is anyone playing" on GitHub Pages/itch); vite-plugin-pwa + assets-generator for phone install; Blender MCP only once Muzzy wants custom low-poly scenes.

## Flags / not verified
- Poly Pizza site returned 403: licensing is from its API docs + search results. The Shadertoy terms page returned 403: its default license is from multiple secondary sources.
- The Netlify credit maths (20 credits/GB, 15/deploy, sites pause) is from 3rd-party 2026 blogs; the official page confirms only the "300 credit" limit.
- Unverified today: the Cloudflare Pages/Workers bandwidth and request numbers (Pages limits page doesn't mention bandwidth), the Umami site count (1 vs 3), the Google Play and Steam library sizes, the Playroom free tier, the Tabler/Phosphor licenses, the jdecked Twemoji fork, and whether LeanTween is stale.
