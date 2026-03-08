---
name: first-time-setup
description: Adaptive onboarding for new BMUZ users. Asks a few questions, builds a personalized setup plan, then only installs what's relevant. Run once after installing BMUZ.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# BMUZ First-Time Setup

Welcome to BMUZ! Before we install anything, let's figure out what YOU need.
This takes about 5 minutes and you only do it once.

---

## Phase 1: Discovery (Ask These Questions)

Ask these 5 questions one at a time. Keep it conversational, not like a form.
Explain each question in plain English if the user seems unsure.

### Q1: "What kind of games do you want to make?"
- **Web games** (plays in a browser — React, Three.js, HTML5)
- **Unity games** (C#, 3D/2D, downloadable or mobile)
- **Both**
- **Not sure yet**

*Save as: `platform`*

### Q2: "Have you coded before?"
- **Nope, brand new** — never written code
- **A little** — done some tutorials, tinkered
- **I know my way around** — comfortable with code but not a pro
- **I'm a developer** — just here for the game design tools

*Save as: `experience`*

### Q3: "What excites you more right now?"
- **Designing** — I want to explore ideas, flesh out concepts, figure out what to build
- **Building** — I already know what I want, let's go
- **Both** — I want the full pipeline from idea to shipped game

*Save as: `focus`*

### Q4: "Will you be working alone or with others?"
- **Solo** — just me and Claude
- **With a team** — other people will touch the code/repo
- **Not sure yet**

*Save as: `team`*

### Q5: "Do you already have Git and GitHub set up?"
- **Yes** — I use Git regularly
- **I have it installed but barely use it**
- **No / I don't know what that is**

*Save as: `git_status`*

---

## Phase 2: Auto-Detect What's Already Installed

Run these checks silently. Don't show raw output — just build an internal
status report.

```bash
# Check each tool
git --version 2>/dev/null
git config --global user.name 2>/dev/null
git config --global user.email 2>/dev/null
node --version 2>/dev/null
npm --version 2>/dev/null
python --version 2>/dev/null || python3 --version 2>/dev/null
gh --version 2>/dev/null
gh auth status 2>/dev/null
```

Check for installed plugins:
- GSD: look for gsd commands in skills list
- BMAD: check `~/.claude/skills/bmad/` exists
- Three.js: check `~/.claude/skills/three-best-practices/` exists
- R3F: check `~/.claude/skills/r3f-best-practices/` exists

Check for MCP servers:
```bash
claude mcp list 2>/dev/null
```

---

## Phase 3: Build the Setup Plan

Based on answers + auto-detect, build a personalized checklist.
**Show the user the plan before doing anything.** Format it like:

```
YOUR BMUZ SETUP PLAN
Based on what you told me, here's what I'll set up:

  ✓ Already done:
    - Git installed (v2.43)
    - Node.js installed (v22.1)

  → Will set up:
    - Auto-approval permissions (so Claude stops asking "approve?" constantly)
    - GitHub CLI (for pushing your code online)
    - GSD plugin (project management)

  ⊘ Skipping (not needed for you):
    - Unity MCP server (you're making web games)
    - BMAD plugin (you want to jump straight to building)
    - Three.js/R3F rules (you're making 2D games)

Sound good? I'll walk you through each "→" item one at a time.
```

### Decision Matrix

**Permissions** — ALWAYS set up (everyone needs this)
| Experience | Recommendation |
|-----------|---------------|
| Brand new | Accept Edits mode (safe defaults) |
| A little | Accept Edits mode |
| Comfortable | Offer Accept Edits or Full Bypass |
| Developer | Offer Full Bypass |

**Git** — set up IF `git_status` is "No" or auto-detect shows missing
| Need | Action |
|------|--------|
| Git not installed | Full `/git-setup` walkthrough |
| Git installed, not configured | Just name/email/defaults |
| Git installed and configured | Skip — mark as ✓ |

**GitHub CLI** — set up IF `team` is not "Solo" OR user wants to push code online
| Need | Action |
|------|--------|
| Not installed | Install + `gh auth login` |
| Installed, not authenticated | Just `gh auth login` |
| Installed and authenticated | Skip — mark as ✓ |

**Node.js** — set up IF `platform` is "Web" or "Both" or "Not sure"
| Need | Action |
|------|--------|
| Not installed | nvm recommended, direct install as fallback |
| Installed but old (< 18) | Upgrade via nvm or direct |
| Installed and current | Skip — mark as ✓ |
| Platform is Unity only | Skip entirely — not needed |

**GSD Plugin** — ALWAYS recommend (everyone benefits from project management)
| Need | Action |
|------|--------|
| Not installed | `npx get-shit-done-cc --claude --global` |
| Installed | Skip — mark as ✓ |

**BMAD Plugin** — recommend IF `focus` is "Designing" or "Both"
| Need | Action |
|------|--------|
| Not installed + wants design | Install BMAD |
| Not installed + just building | Skip — mention it exists for later |
| Installed | Skip — mark as ✓ |

**Python** — ALWAYS recommend (needed for `/proto` simulation and balance testing)
| Need | Action |
|------|--------|
| Not installed | Install Python 3.10+ (python.org or package manager) |
| Installed but old (< 3.8) | Upgrade |
| Installed and current | Skip — mark as ✓ |

**Three.js / R3F rules** — recommend IF `platform` is "Web" or "Both"
| Need | Action |
|------|--------|
| Not installed + web platform | Install both |
| Not installed + Unity only | Skip entirely |
| Installed | Skip — mark as ✓ |

**MCP Servers** — recommend ONLY IF specific need detected
| Server | When to suggest |
|--------|----------------|
| GitHub MCP | `team` is "With a team" AND they do code review |
| Playwright | `experience` is "Comfortable" or "Developer" AND they want visual testing |
| Unity MCP | `platform` is "Unity" or "Both" |
| None | Default — most users don't need MCP servers |

---

## Phase 4: Execute the Plan

Walk through each "→" item one at a time. For each:
1. Explain what it is in one sentence (plain English)
2. Do it (or guide them through it)
3. Confirm it worked
4. Move to next

### Permissions Setup

**Accept Edits Mode:**
Create or update `~/.claude/settings.json`:
```json
{
  "permissions": {
    "allow": [
      "Edit", "Read", "Write", "WebSearch", "WebFetch",
      "Bash(npm run *)", "Bash(npx *)",
      "Bash(git status *)", "Bash(git diff *)", "Bash(git log *)",
      "Bash(git add *)", "Bash(git commit *)", "Bash(git branch *)",
      "Bash(git checkout *)", "Bash(git push *)", "Bash(git pull *)",
      "Bash(mkdir *)", "Bash(ls *)", "Bash(cat *)", "Bash(echo *)", "Bash(cp *)"
    ],
    "deny": [
      "Bash(rm -rf *)", "Bash(git push --force *)", "Bash(git reset --hard *)"
    ]
  }
}
```

**Full Bypass Mode:**
Create `.claude/settings.local.json` in the user's project:
```json
{
  "permissions": {
    "defaultMode": "bypassPermissions"
  }
}
```

Also tell the user: "You can always press **Shift+Tab** mid-session to
toggle between permission modes."

### Git Setup
If needed, run the full `/git-setup` skill inline.

### Node.js Setup
If needed:
- Explain: "Node.js is what lets your computer run the game while building it.
  Like installing an engine before you can drive."
- **nvm** (recommended): install nvm, then `nvm install 22 && nvm use 22`
- **Direct**: download from https://nodejs.org (LTS button)
- Verify: `node --version` and `npm --version`

### Plugin Installs
For each plugin in the plan, install it and confirm.

### MCP Server Setup
Only if the plan includes it. Explain what it does first.
```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ --scope user
```

---

## Phase 5: Save Profile & Report

Save the user's profile so BMUZ remembers their preferences.
Write to `~/.claude/config/bmuz/profile.json`:

```json
{
  "platform": "[web/unity/both]",
  "experience": "[new/little/comfortable/developer]",
  "focus": "[designing/building/both]",
  "team": "[solo/team]",
  "setupDate": "[ISO date]",
  "installed": {
    "git": true,
    "node": true,
    "gh": false,
    "gsd": true,
    "bmad": false,
    "threejs": true,
    "r3f": true,
    "mcp": []
  }
}
```

Then show the final report — **personalized based on their focus**:

### If focus = "Designing"
```
SETUP COMPLETE!

You're set up to design games. Here's your flow:

  /game-discover [your idea]    → Explore the space
  /game-define                  → Narrow to a concept
  /game-design                  → Design mechanics, art, systems
  /game-deliver                 → Create a buildable plan

Or jump straight to:
  /game-prd [describe your game]

Quick tools you'll love:
  /mda-analyze    → "Is this mechanic creating the right feeling?"
  /player-profile → "Who is this game for?"
  /style-guide    → "What should it look like?"

Full guide: ~/.claude/QUICKSTART.md
```

### If focus = "Building"
```
SETUP COMPLETE!

You're set up to build. Here's your flow:

  /game-prd [describe your game]   → Generate requirements
  /gsd:new-project                  → Create a roadmap
  /gsd:progress                     → "What should I work on next?"

Quick tools you'll love:
  /tuning-setup   → Make values tweakable without touching code
  /optimize       → "Why is it slow?"
  /what-changed   → "What did you just do to my game?"

Full guide: ~/.claude/QUICKSTART.md
```

### If focus = "Both"
```
SETUP COMPLETE!

You're set up for the full pipeline — design to deployment.

  START HERE:
  /game-discover [your idea]    → Explore the space
  ...then Claude coaches you through each next step.

  OR JUMP TO BUILDING:
  /game-prd [describe your game]
  /gsd:new-project

  DAILY:
  /gsd:progress  → "What's next?"

  Claude will suggest the right tool as you work.
  Say "just do it" anytime to skip suggestions.

Full guide: ~/.claude/QUICKSTART.md
```
