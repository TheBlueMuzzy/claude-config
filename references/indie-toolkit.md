# Indie toolkit — free stuff BMUZ reaches for

One card every skill checks instead of guessing: where free assets come from, which licences are safe,
what to use for placeholders, feel, hosting and analytics. Source: `config/bmuz/reviews/2026-09-28-skill-review/review-toolkit.md`.
**Checked 2026-09-28.** Limits and licences change. Re-check anything here that's older than 6 months before relying on it.
"(unverified)" = the research couldn't confirm it first-hand.

## Rules of thumb
- **Licence traffic light:**
  - 🟢 **free, no credit.** CC0 and similar. Use freely, still log it in `content/credits.json`.
  - 🟡 **free, credit required.** CC-BY, OFL. Use it, log it with its exact credit line, and show the credit in-game.
  - 🔴 **avoid.** Non-commercial (NC), share-alike (SA), GPL media, unclear licences. Ask Muzzy before using one, and never ship it.
- Prefer 🟢 sources. The licence is per item on mixed sites, so check each download.
- Every imported asset gets an entry in `content/credits.json` (format in `config/bmuz/PROJECT-FILES.md`).
- No paid generators. AI-generated art only if Muzzy asks.

## Placeholder ladder (climb only as far as the task needs)
1. **Shapes.** Coloured boxes, circles, capsules, using the palette tokens. Fastest, and nothing to credit.
2. **Emoji / icons.** Fluent Emoji 🟢 or game-icons.net 🟡, recoloured with CSS.
3. **Matching kit.** Kenney (2D/UI/audio) or Quaternius (3D) in one consistent style 🟢.
4. **Real art.** Muzzy's own. A `(stand-in)` task hands it over.

Sound follows the same idea: ZzFX/jsfxr in code → Kenney audio packs → Sonniss/Pixabay → Muzzy's picks.

## Asset sources by type
| Need | Source | Light | Credit line / note |
|---|---|---|---|
| 2D sprites, UI packs | **Kenney** — kenney.nl | 🟢 CC0 | None. Don't use the Kenney logo. Individual packs are free (the All-in-1 bundle is pay-what-you-want). **Confirm CC0 in the LICENSE file shipped in each pack** (licence checked from snippets only) |
| 2D, tiles, mixed | **OpenGameArt** — opengameart.org | 🟢/🟡/🔴 per item | Filter to CC0 / CC-BY only. Skip CC-BY-SA, GPL and OGA-BY unless Muzzy decides |
| 3D models | **Quaternius** — quaternius.com | 🟢 | No credit. Can't resell them as an asset pack |
| 3D models | **Poly Pizza** — poly.pizza | 🟢 CC0 / 🟡 CC-BY per model | CC-BY: `"<Title>" by <Author> (poly.pizza), CC-BY 4.0` (licence page unverified) |
| Textures, HDRIs | **Poly Haven** — polyhaven.com | 🟢 CC0 | None. Good for drei `<Environment>` |
| Textures, HDRIs | **ambientCG** — ambientcg.com | 🟢 CC0 | None |
| UI glyphs | **Lucide** — lucide.dev | 🟢 ISC | Keep the licence notice in the code; no visible credit. Tabler / Phosphor are MIT (unverified) |
| Game icons | **game-icons.net** (also `react-icons/gi`) | 🟡 CC-BY 3.0 | `Icons made by <author>. Available on https://game-icons.net` |
| Emoji | **Fluent Emoji** — github.com/microsoft/fluentui-emoji | 🟢 MIT | None |
| Emoji | OpenMoji | 🔴 | CC-BY-SA (share-alike). Use Fluent instead |
| Emoji | Twemoji | 🟡 CC-BY 4.0 | `Twemoji by Twitter, CC-BY 4.0`. Fluent needs no credit, so prefer it |
| Fonts | **Fontsource** (Google Fonts, self-hosted) — `npm i @fontsource/<font>` | 🟡 mostly SIL OFL | OFL needs no visible credit, just keep the licence. Don't sell the font by itself. Check each font's licence (unverified per font) |
| Fonts | **Kenney Fonts** | 🟢 CC0 (unverified) | None |
| SFX | **Kenney audio packs** (interface, impact, RPG, jingles) | 🟢 CC0 | None |
| SFX | **Sonniss #GameAudioGDC** — gdc.sonniss.com | 🟢 | No credit. Keep the downloads in a library on the PC, not in repos (no raw redistribution, no AI training) |
| SFX | **Freesound** — freesound.org | 🟢/🟡/🔴 per sound | Filter to CC0. CC-BY: `"<Sound>" by <user> (freesound.org), CC-BY 4.0`. **CC-BY-NC = 🔴** |
| Music | **Pixabay Music** — pixabay.com/music | 🟢 | No credit. Some tracks may trigger YouTube Content ID (unverified) |
| Music | **Kevin MacLeod** — incompetech.com | 🟡 CC-BY | `"<Title>" Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/` |
| Shaders | **LYGIA** | 🔴 | Non-commercial licence. Fine for learning, not for shipping |
| Shaders | **Shadertoy** | 🔴 | Default is CC BY-NC-SA unless the shader's header says otherwise (unverified). Learn from it, don't copy |
| Music | FreePD | 🔴 | Shut down in 2025 |

## Make it in code (free placeholders, no files)
- **ZzFX** (`npm i zzfx`, MIT). Tiny SFX generator. Keep the sound params in `content/sfx.json` so Muzzy can tweak them.
- **jsfxr** / sfxr.me (`npm i jsfxr`, public domain). Same idea, with friendly presets (pickupCoin, laserShoot…).
- **ChipTone** (sfbgames.itch.io/chiptone). A web SFX designer Muzzy can play with; its output is CC0.
- **BeepBox** (beepbox.co, MIT). A browser chiptune maker for placeholder music; the song lives in the URL.
- **drei helpers** (Sparkles, Stars, Cloud, Float, Trail, Environment). Reach for these before writing custom shaders.

## Feel / animation libraries
| Stack | Library | Note |
|---|---|---|
| React UI | **Motion** — `npm i motion`, `motion/react` | Free core (MIT). Layout animations let menus adapt when a row is added. Motion+ is paid and not needed |
| DOM / SVG / sequences | **GSAP** | Now fully free, all plugins included. Games are fine |
| R3F movement | **maath** — `easing.damp` | MIT. Allocation-free, runs in `useFrame` on refs |
| R3F particles | **three.quarks** (+ quarks.r3f) | MIT. Its visual editor exports JSON → put it in `content/`. wawa-vfx for quick bursts |
| Unity | **PrimeTween** | Free, no GC allocations. DOTween is a fine fallback |

Juice references: "Juice it or lose it" (Jonasson & Purho, 2012) · "The Art of Screenshake" (Jan Willem Nijman).

## Hosting & backends (free tiers, checked 2026-09-28)
| Need | Pick | Free limits | Watch out |
|---|---|---|---|
| Static web game (hobby) | **GitHub Pages** — current default | 1 GB site, soft 100 GB/month bandwidth | "Not for commercial hosting". Vite `base: '/<repo>/'` |
| Static web game (commercial OK) | **Cloudflare Pages** | 500 builds/month, 20k files, **25 MiB per file** max. Bandwidth unlimited (unverified) | Big GLBs and audio can hit 25 MiB |
| Second web platform + audience | **itch.io** | ZIP ≤1,000 files, ≤500 MB extracted, ≤200 MB per file | Recipe: `config/bmuz/release/itch.md` |
| Multiplayer | **PartyKit** on Cloudflare Durable Objects | ~100k requests/day (WebSocket messages count), 5 GB stored. Over the limit → errors until 00:00 UTC | A busy real-time game can hit 100k/day. See the **multiplayer-setup** skill |
| Cloud saves / leaderboards | **Supabase** | 2 projects, 500 MB DB, 50k MAU, 5 GB egress | **Pauses after 1 week without activity.** Prototypes fall asleep |
| Auth / Firestore | **Firebase Spark** | Firestore 50k reads / 20k writes per day. Hosting only 360 MB/day | Host the game elsewhere |
| ⚠ Avoid | **Netlify Free** | 300 credits/month hard cap | When the credits run out, **every site on the account pauses** until the month resets (credit maths unverified) |
| ⚠ Avoid for anything sold | **Vercel Hobby** | 100 GB transfer | **Personal, non-commercial use only.** Nothing paid, with ads, or sold on itch |
| — | Colyseus Cloud | **No free tier** (from $15/month) | Self-host only |

## Analytics & crash reporting
- **Cloudflare Web Analytics.** The default "is anyone playing?". Free, no cookies, works on GitHub Pages and itch. Page views only.
- **GoatCounter.** A free, cookie-less alternative.
- **Umami Cloud Hobby.** For gameplay events (`level_complete`…). ~100k events/month (the site count is unverified).
- **GameAnalytics.** Unity and store releases: funnels and retention, no player cap. It collects device data, so it **needs a privacy policy**.
- **Sentry Developer.** Crash reporting from beta onward: 5k errors/month. Session replays need a consent note.
- Firebase Crashlytics. Only for mobile (Capacitor/Unity).
- Anything that collects device data or uses cookies → a privacy policy (TDD §7 Compliance).

## Release platforms
Recipes live in `config/bmuz/release/<platform>.md`. Tools: butler + its GitHub Action (itch), GameCI (Unity WebGL),
`vite-plugin-pwa` + `@vite-pwa/assets-generator` (phone install: icons 192 + 512).

## Changelog
- 2026-09-28 — first version, from the skill-library review.
