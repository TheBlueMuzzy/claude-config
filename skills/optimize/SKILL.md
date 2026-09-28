---
name: optimize
description: Run a full optimization audit on your game — bundle size, asset compression, render performance, memory leaks, unused code, and load times. Measures first against a frame budget (desktop + phone), fixes the biggest cost, re-measures. Reports findings in plain English with one-click fixes.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Game Optimization Pass

Optimize: $ARGUMENTS

## What This Does

Runs a series of performance checks on your game and reports findings in
plain English. Each finding comes with a severity level and a fix you can
approve. No jargon — just "this is slow, here's why, want me to fix it?"

## Measure First (before touching any code)
Guessing at performance usually fixes the wrong thing. Follow this loop:
1. **Set the budget.** Desktop target is 60 fps, which gives **16.6 ms per frame**. Phone target
   is at least 30 fps (**33 ms**), or 60 fps if the game feels sluggish at 30. Write the targets
   in TDD Key facts so every pass uses the same numbers.
2. **Reproduce the worst moment.** Pick a repeatable scene, such as 10 dice landing at once or
   the busiest round. "Sometimes slow" can't be fixed; a moment you can repeat can.
3. **Measure a baseline.** Use a production build (`npm run build && npm run preview`), because dev
   mode gives misleading numbers. In R3F use `r3f-perf` (`<Perf />`: fps, ms, draw calls,
   triangles). Otherwise use the Chrome DevTools Performance panel, or a Playwright script that
   records frame times. For the phone, use Chrome remote debugging (`chrome://inspect`) on a real device.
4. **Find the single biggest cost.** First decide whether the CPU (game logic, physics, React
   re-renders) or the GPU (draw calls, overdraw, shaders, resolution) is slower. Fixing the other
   side does nothing. For stutters, look for garbage-collection spikes from creating objects every frame.
5. **Fix that one thing,** then **re-measure the same scene on the same device.** Keep the fix only
   if the number moved. Then look for the next biggest cost.
6. **Report real numbers:** "Busiest round: 24 ms → 14 ms on Pixel 6 (budget 16.6 ms). Cause:
   140 separate dice materials → shared material." Never say "should be faster".

The checks below are the usual suspects. Use them to explain what the measurements show and to
catch download size and memory problems that don't appear as slow frames.

**NOT ASSESSED — NO DATA.** If a check couldn't actually be measured or run (no phone attached,
the build failed, the profiler wasn't available, no production build), report it as
`NOT ASSESSED — NO DATA (reason)`. Never report it as fine or as a pass, and never estimate a
number and present it as measured. A blank is honest; a fake green hides the problem until players find it.

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
- Frame rate within the phone budget set above (measured on a real phone)
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

FRAME TIME (production build, busiest round):
  Desktop: 11 ms (budget 16.6 ms) ✅    Phone (Pixel 6): 24 ms → 14 ms after fix 1 (budget 33 ms) ✅

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

NOT ASSESSED — NO DATA:
  8. Memory after 5 min on phone — no device connected. Run again with the phone plugged in.

TOTAL POTENTIAL SAVINGS:
  Download size: -1.3MB (54% smaller)
  Memory usage: -40% after 5 min of play
  Mobile load time: -3 seconds
```

## After Fixes
Re-run checks to confirm improvements. Show before/after comparison with the measured numbers
(same scene, same device) and log them in SPRINT Notes.

*Measure-first method borrowed from gamedev-skills `performance-optimization` (github.com/gamedev-skills/awesome-gamedev-agent-skills, Apache-2.0).*
