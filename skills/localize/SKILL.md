---
name: localize
description: Set up a full localization (i18n) system for your game. Generates translation files in content/text/, adds a language switcher, handles plurals and variables. Use after /externalize-text or when adding multi-language support.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Localization Setup

Set up localization for: $ARGUMENTS

## What This Does

Turns your single-language game into a multi-language game. Players can
switch languages, and all game text updates instantly. You (or translators)
edit simple JSON files in `content/text/` — no code knowledge needed.

## Prerequisites
Check if text has been externalized (look for `content/text/en.json`).
If not, suggest running `/externalize-text` first.

## Process

### Step 1: Choose i18n Approach
Based on the project:
- **React project**: Use `react-i18next` (most popular, great React integration)
- **Vanilla JS**: Use `i18next` (standalone)
- **Simple/small game**: Use a lightweight custom solution (just JSON + helper function)

Ask user: "Which languages do you want to support?" Default: English + Spanish.

### Step 2: Set Up i18n Library
For React (most common):
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

Create `src/i18n/index.ts`:
- Configure i18next with language detection
- Load translation files from `content/text/`
- Set fallback language to English

### Step 3: Create Translation Files
All translation files live in `content/text/`:
```
content/text/
├── en.json       # English (base — created by /externalize-text)
├── es.json       # Spanish
├── fr.json       # French
└── [lang].json   # Additional languages
```

Each file mirrors the same key structure. Only the `text` values change.

For the non-English files, provide:
- Machine-translated initial values (clearly marked as "NEEDS HUMAN REVIEW")
- Comments noting cultural adaptation needs (humor, idioms, reading direction)

### Step 4: Create Language Switcher Component
A simple dropdown or flag-icon row that:
- Shows available languages
- Switches instantly (no page reload)
- Saves preference to localStorage
- Auto-detects browser language on first visit

### Step 5: Handle Special Cases
- **Plurals**: "1 coin" vs "5 coins" — use i18next plural syntax
- **Variables**: "Player {{name}} scored {{score}}" — use interpolation
- **Numbers**: Format with locale (1,000 vs 1.000)
- **Dates**: Format with locale
- **RTL languages**: Add `dir="rtl"` support if Arabic/Hebrew needed
- **Text overflow**: Translated text is often 30% longer than English — flag strings near maxLength

### Step 6: Report to User
```
LOCALIZATION READY

Languages: English, Spanish [+ others]
Translation files: content/text/

HOW TO ADD A LANGUAGE:
  1. Copy en.json → [language-code].json (e.g., fr.json for French)
  2. Translate the "text" values (keep the keys the same!)
  3. Add the language code to src/i18n/index.ts languages array
  4. That's it — the language switcher picks it up automatically

HOW TO EDIT TRANSLATIONS:
  1. Open content/text/[language].json
  2. Find the key you want
  3. Change the "text" value
  4. Save → game updates

NOTES:
  - Spanish translations are machine-generated — have a native speaker review them
  - Strings marked [LONG] may overflow their UI containers in some languages
```
