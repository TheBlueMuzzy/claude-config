---
name: new-game
description: Scaffold a new game project with the lossless pipeline hooks, planning directory, content directory, versioning, and STATE.md. Run this when starting any new game project to get the full pipeline set up automatically.
disable-model-invocation: true
allowed-tools: Bash, Write, Read, Glob
---

# New Game Project Setup

Scaffold BMUZ's lossless pipeline into the current project directory.

## Steps

### 1. Ask the Project Name

Ask the user: "What's the name of this game?" Use the answer as `PROJECT_NAME`.

### 2. Create `version.json`

Write `version.json` to the project root:

```json
{
  "name": "[PROJECT_NAME]",
  "version": "0.1.0",
  "build": 0,
  "history": [
    {
      "version": "0.1.0",
      "date": "[today ISO]",
      "summary": "Project created"
    }
  ]
}
```

**Version format: `X.Y.Z` (display as `X.Y.Z.B` where B = build)**
- **X (Major)**: Public releases / shared with people (0 = pre-release)
- **Y (Minor)**: Milestone completed
- **Z (Patch)**: Bug fixes, polish, tweaks
- **B (Build)**: Auto-increments every commit

### 3. Create `.claude/settings.json` with lossless pipeline hooks

Write this file to `.claude/settings.json` in the current project.
The SessionStart hook includes BMUZ banner AND game version display:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "BMUZ_V=$(cat \"$HOME/.claude/config/bmuz/version\" 2>/dev/null); GAME_V=$(cd \"$CLAUDE_PROJECT_DIR\" && node -e \"const v=require('./version.json'); console.log('v'+v.version+'.'+v.build)\" 2>/dev/null); if [ -n \"$BMUZ_V\" ]; then echo '══════════════════════════════════════'; echo \"  BMUZ v${BMUZ_V} — Game Dev Toolkit\"; if [ -n \"$GAME_V\" ]; then GAME_NAME=$(cd \"$CLAUDE_PROJECT_DIR\" && node -e \"console.log(require('./version.json').name)\" 2>/dev/null); echo \"  ${GAME_NAME} ${GAME_V}\"; fi; echo '══════════════════════════════════════'; fi && bash \"$HOME/.claude/config/bmuz/templates/check-permissions.sh\" 2>/dev/null && echo '' && echo '=== SESSION CONTEXT ===' && cat \"$CLAUDE_PROJECT_DIR/.planning/STATE.md\" 2>/dev/null && echo '' && echo '=== GIT STATUS ===' && git -C \"$CLAUDE_PROJECT_DIR\" status --short && echo '' && echo '=== BRANCH ===' && git -C \"$CLAUDE_PROJECT_DIR\" branch --show-current && echo '' && echo '=== RECENT COMMITS ===' && git -C \"$CLAUDE_PROJECT_DIR\" log --oneline -5 && bash \"$HOME/.claude/config/bmuz/templates/check-plugins.sh\" 2>/dev/null"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "auto",
        "hooks": [
          {
            "type": "command",
            "command": "cp \"$CLAUDE_PROJECT_DIR/.planning/STATE.md\" \"$CLAUDE_PROJECT_DIR/.planning/STATE.md.bak\" 2>/dev/null; echo 'STATE.md backed up before auto-compaction'"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Review this conversation: $ARGUMENTS\n\nCheck TWO things:\n1. Did Claude make code changes (Edit/Write tool calls) in this turn?\n2. If yes, did Claude update .planning/STATE.md with what changed?\n\nIMPORTANT: If stop_hook_active is true, respond {\"ok\": true} to prevent loops.\n\nIf code changes were made WITHOUT updating STATE.md, respond:\n{\"ok\": false, \"reason\": \"Code changes detected but STATE.md not updated. Update .planning/STATE.md with: what changed, current status, any decisions made, and next steps. Then provide the Handoff Block.\"}\n\nOtherwise respond {\"ok\": true}",
            "timeout": 30
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$CLAUDE_PROJECT_DIR\" && npm run test:run 2>&1 | tail -20"
          }
        ]
      }
    ]
  }
}
```

### 4. Create directory structure

```
.planning/
├── STATE.md
└── research/          (empty — filled by /game-discover, /proto)

content/
├── data/              (empty — filled by /proto, manual game data)
├── text/              (empty — filled by /externalize-text, /localize)
└── tuning/            (empty — filled by /tuning-setup)

proto/                 (empty — filled by /proto simulations)
```

Create all directories. Create placeholder `.gitkeep` files in empty dirs
so git tracks them.

### 5. Create `.planning/STATE.md`

```markdown
# Project State

## Current Status
New project — not yet initialized.

## Version
0.1.0.0

## Last Session
N/A

## Known Issues
None yet.

## Next Steps
- Run `/game-discover [idea]` to start the Double Diamond process
- OR run `/game-prd [concept]` to jump straight to PRD
- OR run `/proto [rulebook]` to test and balance game rules
- OR run `/gsd:new-project` if you already have a PRD
```

### 6. Initialize git if not already a repo

Check if `.git` exists. If not:
```bash
git init
```

### 7. Create `.gitignore` entries

Ensure these are in `.gitignore`:
- `.claude/settings.local.json`
- `.planning/STATE.md.bak`
- `node_modules/`
- `proto/results/`

### 8. Update active project breadcrumb

Write the breadcrumb so GSD commands can find this project from any directory:

```bash
mkdir -p ~/.claude/config/bmuz
PROJ_NAME=$(basename "$(pwd)")
cat > ~/.claude/config/bmuz/active-project.json << BEOF
{
  "path": "$(pwd)",
  "name": "$PROJ_NAME",
  "updated": "$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)"
}
BEOF
```

### 9. Initial commit

```bash
git add -A
git commit -m "Initialize project with BMUZ pipeline (v0.1.0)"
git tag v0.1.0
```

### 10. Confirm setup

Tell the user:
```
[PROJECT_NAME] v0.1.0 scaffolded!

You now have:
  - Lossless hooks (SessionStart, PreCompact, Stop, PostToolUse)
  - Automatic versioning (X.Y.Z.B — managed for you)
  - .planning/ with STATE.md and research/
  - content/ for editable game data, text, and tuning values
  - proto/ for simulation and balance testing
  - Git initialized with v0.1.0 tag

Project structure:
  .planning/     → Claude's workspace (state, research, PRD)
  content/       → YOUR data (game definitions, text, tuning values)
  proto/         → Test kitchen (Python simulations)
  src/           → Game code (Claude handles this)

What's next?
  /game-discover [your idea]  → Start designing (full process)
  /game-prd [concept]         → Jump straight to PRD
  /proto [rulebook]           → Test & balance game rules
  /gsd:new-project            → If you already have a PRD
```
