---
name: organize-assets
description: Audit, rename, compress, and catalog all game art and audio assets. Use when your assets folder is messy, you want to optimize file sizes, find unused assets, or generate a visual asset catalog.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Asset Organization & Optimization

Organize assets for: $ARGUMENTS

## What This Does

Takes your game's art, audio, and other assets and:
- Renames everything to a consistent convention
- Compresses images (smaller files, same quality)
- Finds unused assets (wasting space)
- Finds missing assets (referenced in code but don't exist)
- Generates a visual catalog so you can see everything at a glance
- Suggests sprite sheet packing opportunities

## Process

### Step 1: Inventory All Assets
Scan the project for all asset files:
- Images: .png, .jpg, .jpeg, .svg, .gif, .webp
- Audio: .mp3, .ogg, .wav, .m4a
- Fonts: .ttf, .otf, .woff, .woff2
- 3D models: .gltf, .glb, .obj, .fbx
- Video: .mp4, .webm
- Data: .json (that are content, not config)

For each, record: filename, size, dimensions (images), duration (audio), location.

### Step 2: Check Naming Conventions
Flag files that don't follow convention:
- **Correct**: `player-idle-spritesheet-64x64.png`
- **Bad**: `Player Idle.png`, `IMG_4521.png`, `finalFINAL2.png`, `Copy of bg.jpg`

Propose renames:
```
RENAME SUGGESTIONS:
  Player Idle.png → player-idle.png
  IMG_4521.png → [ASK USER — can't determine purpose]
  finalFINAL2.png → [ASK USER — which version is correct?]
  enemy sprite.PNG → enemy-sprite.png
```

Ask user to confirm before renaming. Update all code references after rename.

### Step 3: Find Unused Assets
Cross-reference asset files against code imports/references:
```
UNUSED ASSETS (not referenced in any code):
  assets/sprites/old-player.png (45KB)
  assets/audio/test-beep.wav (120KB)
  assets/backgrounds/bg-draft.png (1.2MB)

  Total wasted space: 1.36MB
  Delete these? (list them for user to confirm)
```

### Step 4: Find Missing References
Check code for asset paths that don't resolve:
```
MISSING ASSETS (referenced in code but file not found):
  src/Player.tsx:15 → assets/sprites/player-jump.png [FILE NOT FOUND]
  src/Audio.ts:8 → assets/audio/victory.mp3 [FILE NOT FOUND]
```

### Step 5: Suggest Compression
For each image, check if it can be smaller:
```
COMPRESSION OPPORTUNITIES:
  background.png    4.2MB → ~400KB (save 90%) — convert to WebP with PNG fallback
  player-sheet.png  800KB → ~200KB (save 75%) — run through pngquant
  ui-icons.png      120KB → ~30KB (save 75%) — already small but compressible

  Total potential savings: ~4.5MB
  Compress? (preserves originals as .bak)
```

Use available tools:
- `sharp` (npm) for image resizing/conversion
- `pngquant` for PNG compression
- `svgo` for SVG optimization
- `ffmpeg` for audio compression

### Step 6: Suggest Sprite Sheet Packing
If there are many small images that could be combined:
```
SPRITE SHEET OPPORTUNITIES:
  16 individual enemy sprites (32x32 each) → 1 sprite sheet (128x128)
  8 UI icons → 1 icon atlas
  12 particle images → 1 particle sheet
```

### Step 7: Generate Asset Catalog
Create `docs/asset-catalog.md`:
```markdown
# Asset Catalog

## Sprites (12 files, 450KB total)
| File | Size | Dimensions | Used In |
|------|------|-----------|---------|
| player-idle.png | 12KB | 64x64 | Player.tsx |
| player-walk-sheet.png | 45KB | 256x64 (4 frames) | Player.tsx |
...

## Backgrounds (3 files, 1.2MB total)
...

## Audio (8 files, 2.1MB total)
| File | Size | Duration | Format | Used In |
...

## Fonts (2 files, 180KB total)
...

TOTAL: 25 files, 3.9MB
```

### Step 8: Report to User
```
ASSET ORGANIZATION COMPLETE

Inventory: X images, X audio, X fonts, X other
Renamed: X files (all code references updated)
Compressed: saved XMB
Unused: X files flagged (XKB reclaimable)
Missing: X broken references found

Catalog: docs/asset-catalog.md

FOLDER STRUCTURE:
  assets/
  ├── sprites/       (character art, animations)
  ├── backgrounds/   (level backgrounds, parallax layers)
  ├── ui/            (buttons, icons, HUD elements)
  ├── audio/
  │   ├── sfx/       (sound effects)
  │   └── music/     (background music)
  ├── fonts/         (game fonts)
  └── data/          (content JSON files)
```
