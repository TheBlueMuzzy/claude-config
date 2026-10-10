---
name: audio-setup
description: Set up a game audio system — sound manager, code-made placeholder SFX (ZzFX), mixing (buses, ducking, variation, voice limits), format conversion, volume normalization, audio sprites, and spatial audio. Use when adding sound effects or music to your game, or when sounds are missing, repetitive, too loud, or clash.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Game Audio Setup

Set up audio for: $ARGUMENTS

## What This Does

Creates a complete audio system for your game. You drop sound files in a folder
and call `playSound('coin')`. Handles browser compatibility, volume balancing,
format conversion, and mobile audio quirks automatically.

## Process

### Step 1: Assess Current State
- Does the project already have audio? What library (if any)?
- What audio files exist? Formats? Sizes?
- React or vanilla JS?

### Step 2: Choose Audio Library
**Web games (React + Vite): use the framework Audio module — not a library, not a hand-rolled manager.**
Install: `node ../../framework/audio/scripts/install-audio.mjs . --dry-run` then without `--dry-run` (→ `src/audio/` +
a starter `content/audio.json`). Hook-up, API and where sounds go: `dev/framework/audio/README.md`. Worked example:
Glyphtender (`src/game/sound.ts` — engine at start, Settings → Audio, kit buttons via the UI kit's `setControlSound`,
`e2e/audio-log.mjs` reads `window.__audioLog`). Pass the engine its own `rng` (`seededRandom`) if the game seeds
`Math.random` anywhere (screenshots, replays). The options below are for other stacks only.

Other stacks, based on project:
- **Howler.js** (recommended for most games): Best browser compatibility, audio sprites, spatial audio
- **Tone.js**: If procedural/generative audio is needed
- **Web Audio API directly**: Only if minimal needs
- **@react-three/drei Audio**: If R3F project with 3D spatial audio

Install:
```bash
npm install howler
# or for TypeScript:
npm install howler @types/howler
```

### Step 3: Set Up Folder Structure
```
assets/audio/
├── sfx/          (sound effects — short, triggered by events)
│   ├── coin.mp3
│   ├── jump.mp3
│   ├── hit.mp3
│   └── menu-click.mp3
├── music/        (background music — long, looped)
│   ├── main-theme.mp3
│   └── boss-battle.mp3
└── ambient/      (ambient loops — background atmosphere)
    └── forest.mp3
```

**Where sounds come from:** free sources with licence notes (Kenney, Sonniss, Pixabay,
Freesound CC0 only…) are in `~/.claude/references/indie-toolkit.md`. Record each sound's licence.

### Step 3b: Placeholder SFX made in code (no files needed)
> **Lesson (Roll Better 2026, Glyphtender 2026-10-09):** Muzzy called code-made sounds "horrible". For anything he'll hear in play, use **real recorded** CC0 sounds (Kenney Impact/Casino/RPG/UI Audio, OpenGameArt CC0 field recordings). Even some "free packs" are synth tones: Kenney *Interface Sounds* and OGA *Cozy Farm SFX* have spectral flatness ≈ 0. Check with ffmpeg `aspectralstats` before picking. Keep ZzFX for throwaway sketches only. Web games: use the framework Audio module (`dev/framework/audio`, design `framework/.planning/design/audio.md`), not a hand-rolled SoundManager.
> **Lesson (Glyphtender B026, 2026-10-10):** trim every tap/UI/impact sound to its onset (loudness reaches 10% of peak within ~5 ms; a 3 ms fade-in). Free-pack files often start with 40–90 ms of near-silence, which on top of drag thresholds and device latency feels "really delayed". Swells (whooshes, flourishes) may ramp in on purpose.
> **Lesson (Glyphtender, Muzzy 2026-10-10):** menu / UI-control sounds (button tap, back, tab change, toggle) NEVER vary — one file, no random pitch or volume: "I like variance for other things, but not really for expected menu function". Variation is for gameplay. A switch has two sounds: on = rising (positive), off = falling (negative) — the UI kit says `toggle.on` / `toggle.off`.
Every prototype can have sound on day one. Use **ZzFX** (MIT, under 1 KB, `npm i zzfx`) and keep
the presets in `content/sfx.json`, so Muzzy can tweak or swap them in the Dev Kit or Obsidian:
```json
{
  "tick":  { "zzfx": [1, 0.05, 1200, 0, 0.01, 0.05, 1], "volume": 0.6 },
  "coin":  { "zzfx": [1, 0.05, 925, 0.04, 0.3, 0.6, 1, 0.3, 0, 6.27, -184, 0.09, 0.17], "volume": 0.8 }
}
```
- Build each sound once at load with `ZZFX.buildSamples(...params)` and play it with
  `ZZFX.playSamples([samples], volume, rate)`. `rate` gives free pitch variation.
- `SoundManager.play('coin')` checks for a real file first and falls back to the ZzFX preset.
  When real audio arrives, it takes over with no code change.
- **Tools Muzzy can play with:** the ZzFX designer (killedbyapixel.github.io/ZzFX) and
  **jsfxr** (sfxr.me, public domain). jsfxr has presets such as pickupCoin, laserShoot, explosion,
  hitHurt, jump and blipSelect. Tweak a sound, copy its code or export a .wav, and paste it into
  `content/sfx.json` or drop the file in `sfx/`.

### Step 4: Create Sound Manager
Create `src/audio/SoundManager.ts`:
```typescript
// Simple API:
SoundManager.play('coin')           // play a sound effect
SoundManager.playMusic('main-theme') // start background music (loops)
SoundManager.stopMusic()             // stop background music
SoundManager.setVolume('sfx', 0.8)  // adjust category volume
SoundManager.setVolume('music', 0.5)
SoundManager.mute()                  // mute everything
SoundManager.unmute()
```

Features to include:
- **Category volumes**: Separate sliders for SFX, Music, Ambient
- **Auto-format selection**: Serve OGG to browsers that support it, MP3 as fallback
- **Mobile unlock**: Handle the "user must interact before audio plays" browser requirement
- **Preloading**: Load critical sounds upfront, lazy-load others
- **Sound pooling**: Multiple copies of frequently-played sounds (prevents cutoff)

### Step 4b: Mixing (so it sounds good, not just plays)
- **Buses, not per-sound volumes:** Master ← Music, SFX, UI (+ Ambient). The Settings sliders
  control buses. In Howler use a Howl per bus, or with Web Audio use one GainNode per bus.
- **Sliders feel right in decibels:** map a 0–1 slider to a curve (e.g. `gain = slider ** 2`) or
  to dB (-40 dB to 0 dB). A plain linear slider seems to do nothing until the very bottom.
- **Ducking:** when an important sound plays (win, voice, big hit), fade Music down about
  -8 to -12 dB over ~0.1 s, then back up over ~0.4 s. If the release is too fast, the music
  audibly "pumps".
- **Variation:** repeated sounds get ±5% pitch and ±10% volume at random, and pick from 2–3 takes
  when available. Otherwise the tenth dice clack sounds like a machine gun.
- **Voice limit:** allow at most 3–4 copies of the same sound at once (the oldest stops) and at
  least ~50 ms between repeats. Ten dice landing together should sound full, not distorted.
- **Headroom:** keep Master below clipping, and put a compressor/limiter on Master as a safety net.
- The ducking amounts, variation ranges and voice limits go in the audio config next to volumes.
  Listen on the phone speaker and on headphones before calling it done.
- **Game feel pairing:** the game-feel skill plays a sound for each feedback tier. It must land
  in the same frame as the visual.

### Step 5: Format Conversion (if needed)
If user has WAV files (lossless but huge):
```bash
# Convert WAV to OGG + MP3 (need both for browser compatibility)
# Using ffmpeg if available:
ffmpeg -i sound.wav -c:a libvorbis -q:a 4 sound.ogg
ffmpeg -i sound.wav -c:a libmp3lame -q:a 4 sound.mp3
```

If ffmpeg not available, suggest online converters or npm packages.

### Step 6: Volume Normalization
Check all audio files for consistent volume levels:
- SFX should be normalized to similar perceived loudness
- Music should be quieter than SFX (typically -6dB)
- Ambient should be quieter than music

### Step 7: Create Audio Config
Create `content/audio.json`:
```json
{
  "sfx": {
    "coin": { "file": "coin", "volume": 0.8 },
    "jump": { "file": "jump", "volume": 0.6 },
    "hit": { "file": "hit", "volume": 1.0 }
  },
  "music": {
    "main-theme": { "file": "main-theme", "volume": 0.4, "loop": true },
    "boss-battle": { "file": "boss-battle", "volume": 0.5, "loop": true }
  }
}
```

User edits this file to adjust volumes — no code changes needed.

*Mixing ideas borrowed from gamedev-skills `audio-design` (github.com/gamedev-skills/awesome-gamedev-agent-skills, Apache-2.0).*

### Step 8: Report to User
```
AUDIO SYSTEM READY

Sound Manager: src/audio/SoundManager.ts
Audio Config: content/audio.json
Sound files: assets/audio/sfx/, assets/audio/music/

HOW TO ADD A NEW SOUND:
  1. Drop your audio file in assets/audio/sfx/ (MP3 or OGG)
  2. Add it to content/audio.json
  3. Use it: SoundManager.play('your-sound-name')

HOW TO ADJUST VOLUME:
  Edit content/audio.json — change the "volume" number (0.0 to 1.0)

PLAYER CONTROLS:
  Volume sliders for SFX/Music will appear in the Settings menu.
```
