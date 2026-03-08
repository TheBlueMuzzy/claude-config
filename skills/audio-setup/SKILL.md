---
name: audio-setup
description: Set up a game audio system — sound manager, format conversion, volume normalization, audio sprites, and spatial audio. Use when adding sound effects or music to your game.
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
Based on project:
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
Create `src/audio/audio-config.json`:
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

### Step 8: Report to User
```
AUDIO SYSTEM READY

Sound Manager: src/audio/SoundManager.ts
Audio Config: src/audio/audio-config.json
Sound files: assets/audio/sfx/, assets/audio/music/

HOW TO ADD A NEW SOUND:
  1. Drop your audio file in assets/audio/sfx/ (MP3 or OGG)
  2. Add it to src/audio/audio-config.json
  3. Use it: SoundManager.play('your-sound-name')

HOW TO ADJUST VOLUME:
  Edit src/audio/audio-config.json — change the "volume" number (0.0 to 1.0)

PLAYER CONTROLS:
  Volume sliders for SFX/Music will appear in the Settings menu.
```
