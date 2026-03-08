---
name: save-system
description: Set up a game save system — localStorage for simple saves, IndexedDB for complex ones, with optional cloud sync via Supabase. Handles versioned save schemas so old saves don't break when you update the game.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Game Save System

Set up saves for: $ARGUMENTS

## What This Does

Creates a save system for your game so players don't lose progress.
Starts simple (browser storage) and can grow to cloud saves. Handles
the tricky parts: save versioning, migration, corruption recovery.

## Process

### Step 1: Determine What Needs Saving
Ask the user (or scan the codebase for):
- **Player progress**: Level, XP, rank, unlocks, achievements
- **Settings**: Volume, controls, accessibility options, language
- **Game state**: Current level, inventory, position, active quests
- **Statistics**: Playtime, scores, completion percentage
- **Meta**: Tutorial completion, first-run flags, consent choices

### Step 2: Design Save Schema
```typescript
interface GameSave {
  _version: number;          // Schema version (for migration)
  _timestamp: string;        // When saved (ISO date)
  _checksum?: string;        // Integrity check

  player: {
    rank: number;
    xp: number;
    upgrades: string[];      // IDs of purchased upgrades
    achievements: string[];  // IDs of earned achievements
  };

  settings: {
    sfxVolume: number;       // 0-1
    musicVolume: number;     // 0-1
    language: string;        // "en", "es", etc.
    reducedMotion: boolean;
    colorBlindMode: string;  // "none", "protanopia", "deuteranopia"
  };

  stats: {
    totalPlaytime: number;   // seconds
    gamesPlayed: number;
    highScore: number;
  };
}
```

### Step 3: Choose Storage Backend

**Tier 1 — localStorage (simplest, recommended to start)**
- Capacity: ~5-10MB
- Good for: Settings, simple progress, small saves
- Limitation: Same device only, can be cleared by user

**Tier 2 — IndexedDB (for complex saves)**
- Capacity: ~50MB+
- Good for: Large saves, binary data, multiple save slots
- Use when: Save data exceeds 1MB or needs save slots

**Tier 3 — Cloud Sync (cross-device)**
- Supabase (free tier: 500MB database, built-in auth)
- Good for: Cross-device play, leaderboards, social features
- Use when: Players want to play on multiple devices

### Step 4: Implement Save Manager
Create `src/save/SaveManager.ts`:
```typescript
// Simple API:
SaveManager.save()                    // Save current state
SaveManager.load()                    // Load saved state (returns GameSave or null)
SaveManager.exists()                  // Check if save exists
SaveManager.delete()                  // Delete save (with confirmation)
SaveManager.export()                  // Export as downloadable JSON file
SaveManager.import(file)              // Import from JSON file

// Auto-save:
SaveManager.enableAutoSave(interval)  // Save every N seconds
SaveManager.saveOnExit()              // Save when tab/app closes
```

### Step 5: Add Save Versioning & Migration
This is the part most tutorials skip. When you update your game and
add new features, old saves need to work with new code.

```typescript
const MIGRATIONS = {
  // Version 1 → 2: Added achievements
  2: (save) => {
    save.player.achievements = [];
    return save;
  },
  // Version 2 → 3: Split volume into sfx/music
  3: (save) => {
    const oldVolume = save.settings.volume ?? 0.8;
    save.settings.sfxVolume = oldVolume;
    save.settings.musicVolume = oldVolume * 0.6;
    delete save.settings.volume;
    return save;
  }
};

// On load: run all migrations between saved version and current version
```

### Step 6: Add Corruption Recovery
```typescript
// On save: create a checksum
// On load: verify checksum
// If corrupted:
//   1. Try loading backup (SaveManager keeps last 3 saves)
//   2. If no backup: offer to start fresh with a clear explanation
//   3. Never silently lose progress
```

### Step 7: Add Save UI (Optional)
Ask user: "Want a save/load screen, or auto-save only?"

If manual saves:
- Save slot selection (3-5 slots)
- Each slot shows: date, playtime, progress summary
- "New Game" with confirmation if overwriting
- Export/Import for backup

If auto-save only:
- Save indicator icon (floppy disk / cloud) when saving
- "Your progress is saved automatically" message
- Still offer Export for manual backup

### Step 8: Report to User
```
SAVE SYSTEM READY

Save Manager: src/save/SaveManager.ts
Save Schema: src/save/types.ts

HOW IT WORKS:
  - Game auto-saves every [interval] and when you close the tab
  - Players see a small save icon when saving
  - Old saves automatically upgrade when you update the game
  - If something goes wrong, the last 3 saves are kept as backup

HOW TO ADD NEW SAVE DATA:
  1. Add the new field to GameSave interface in src/save/types.ts
  2. Bump SAVE_VERSION number
  3. Add a migration function for the new version
  4. Claude will help — just say "I want to save [new thing]"

STORAGE:
  Using: [localStorage / IndexedDB / Supabase]
  Capacity: [amount]
  Cloud sync: [yes/no]
```
