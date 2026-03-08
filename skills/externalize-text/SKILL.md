---
name: externalize-text
description: Extract all player-facing text from code into content/text/en.json. Edit game text without touching code, prepare for localization. Use when you want all game copy in one editable file.
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Text Externalization

Extract player-facing text for: $ARGUMENTS

## What This Does

Finds every piece of text that a player sees in your game — button labels,
tooltips, tutorial messages, flavor text, error messages, menu items — and
moves them into `content/text/en.json`. You edit the JSON, not the code.

## Process

### Step 1: Scan for Player-Facing Strings
Search the codebase for:
- String literals in JSX/HTML (button text, labels, headings)
- Template literals with user-visible text
- Alert/toast/notification messages
- Tutorial and onboarding text
- Flavor text, descriptions, lore
- Error messages shown to players
- Placeholder text in inputs
- Accessibility labels (aria-label, alt text)

**Skip:** Console.log messages, CSS class names, file paths, variable names,
internal identifiers, test strings.

### Step 2: Categorize with Traits
Organize extracted text into a structured format:
```json
{
  "_meta": {
    "language": "en",
    "version": "1.0",
    "lastUpdated": "2026-02-08"
  },
  "ui": {
    "buttons": {
      "start_game": {
        "text": "Start Game",
        "context": "Main menu start button",
        "maxLength": 20
      },
      "settings": {
        "text": "Settings",
        "context": "Main menu settings button",
        "maxLength": 15
      }
    },
    "labels": { ... },
    "tooltips": { ... }
  },
  "gameplay": {
    "tutorial": {
      "step_1": {
        "text": "Tap the goop to clear it!",
        "context": "First tutorial step, shown with arrow pointing at goop",
        "maxLength": 50
      }
    },
    "notifications": { ... },
    "achievements": { ... }
  },
  "flavor": {
    "upgrade_descriptions": { ... },
    "loading_tips": { ... }
  },
  "errors": {
    "connection_lost": {
      "text": "Connection lost. Your progress is saved.",
      "context": "Shown when network drops during gameplay",
      "tone": "reassuring"
    }
  }
}
```

Each entry has:
- `text`: The actual string
- `context`: Where/when it appears (helps translators)
- `maxLength` (optional): Character limit for UI space
- `tone` (optional): How it should feel (casual, formal, urgent, reassuring)

### Step 3: Create Content File
- Write to `content/text/en.json`
- Create a helper: `src/content/t.ts` (translation function)
  ```typescript
  import strings from '../../content/text/en.json';
  export function t(key: string): string { ... }
  // Usage: t('ui.buttons.start_game')
  ```

### Step 4: Replace In Code
Replace every hardcoded string with `t('key.path')`:
```
// BEFORE: <button>Start Game</button>
// AFTER:  <button>{t('ui.buttons.start_game')}</button>
```

### Step 5: Report to User
```
TEXT EXTERNALIZATION COMPLETE

Extracted X strings into content/text/en.json:
  - UI: X buttons, X labels, X tooltips
  - Gameplay: X tutorial steps, X notifications
  - Flavor: X descriptions, X tips
  - Errors: X messages

Content file: content/text/en.json
Helper: src/content/t.ts

HOW TO EDIT TEXT:
  1. Open content/text/en.json
  2. Find the text you want to change
  3. Edit the "text" field
  4. Save → game updates automatically

READY FOR LOCALIZATION:
  Run /localize to add language support.
```
