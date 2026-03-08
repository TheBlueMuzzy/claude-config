---
name: optimize
description: Run a full optimization audit on your game — bundle size, asset compression, render performance, memory leaks, unused code, and load times. Reports findings in plain English with one-click fixes.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Game Optimization Pass

Optimize: $ARGUMENTS

## What This Does

Runs a series of performance checks on your game and reports findings in
plain English. Each finding comes with a severity level and a fix you can
approve. No jargon — just "this is slow, here's why, want me to fix it?"

## Checks to Run

### 1. Bundle Size Analysis
```bash
# For Vite projects:
npx vite-bundle-visualizer
# Or:
npm run build && du -sh dist/
```

Report:
```
YOUR GAME'S DOWNLOAD SIZE: 2.4MB

Breakdown:
  Game code:     180KB (fine)
  Three.js:      650KB (expected for 3D)
  Images:        1.2MB (HIGH — see compression suggestions)
  Audio:         350KB (fine)
  Fonts:         45KB (fine)

RECOMMENDATION: Compress images to save ~900KB (37% smaller download)
```

### 2. Asset Optimization
Check for:
- Uncompressed PNGs (should use pngquant or WebP)
- Oversized images (4K texture when 512px would do)
- Uncompressed audio (WAV files that should be OGG/MP3)
- Unused assets (bundled but never loaded)
- Missing lazy loading (all assets load upfront vs. on-demand)

### 3. Render Performance
For React/R3F projects:
- Components re-rendering every frame unnecessarily
- React state used for per-frame updates (should be refs)
- Missing `React.memo()` on static components
- Large lists without virtualization
- Canvas/WebGL draw calls (aim for under 100)

For vanilla JS:
- requestAnimationFrame usage
- Object allocation in game loop (causes GC stutters)
- DOM manipulation in hot paths

### 4. Memory Leaks
Check for:
- Event listeners not cleaned up on unmount
- Intervals/timeouts not cleared
- Growing arrays (particle pools, entity lists) without cleanup
- Three.js geometries/materials not disposed
- Audio elements created but never released

### 5. Load Time
Check for:
- Assets loaded synchronously blocking first render
- No loading screen / progress bar
- Large assets not lazy-loaded
- No caching headers configured
- Missing preload hints for critical assets

### 6. Mobile Performance
Check for:
- Touch event handling (passive listeners?)
- Viewport meta tag configured
- No hover-dependent interactions
- Reduced motion preference respected
- Frame rate appropriate for mobile (~30-40fps target)
- Battery drain patterns (constant GPU usage)

### 7. Unused Code (Tree-Shaking)
Check for:
- Imported but unused functions
- Dead code paths (unreachable conditions)
- Unused npm dependencies
- Development-only code in production build

## Report Format

Present ALL findings in plain English:
```
OPTIMIZATION REPORT
===================

CRITICAL (fix these):
  1. Your background image is 4.2MB — players on mobile will wait 8 seconds
     to download it. I can compress it to 400KB with no visible quality loss.
     Fix? [describe the fix]

  2. You have a memory leak in the particle system — it creates new particles
     every frame but never removes old ones. After 5 minutes of play, the game
     will slow down. Fix: add particle recycling.

WARNING (should fix):
  3. Three.js is 650KB of your 2.4MB bundle. If you're only using basic
     features, we could switch to a lighter setup and save 400KB.

  4. Sound effects are WAV format (lossless). Converting to OGG saves 60%
     with no audible difference.

FINE (no action needed):
  5. Bundle code-splitting is working correctly
  6. No unused npm dependencies found
  7. Mobile viewport configured correctly

TOTAL POTENTIAL SAVINGS:
  Download size: -1.3MB (54% smaller)
  Memory usage: -40% after 5 min of play
  Mobile load time: -3 seconds
```

## After Fixes
Re-run checks to confirm improvements. Show before/after comparison.
