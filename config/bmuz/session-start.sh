#!/usr/bin/env bash
# BMUZ-2 — runs at every session start (global hook in ~/.claude/settings.json).
# Pulls the latest from GitHub and shows where the project left off.
# Never blocks the session: every failure just prints a note for Claude to explain.

INPUT=$(cat 2>/dev/null)
SOURCE=$(echo "$INPUT" | grep -o '"source" *: *"[a-z]*"' | grep -o '[a-z]*"$' | tr -d '"')

# Monthly BMUZ checkup reminder (startup only; any folder)
LAST=$(cat "$HOME/.claude/config/bmuz/last-checkup" 2>/dev/null)
if [ "$SOURCE" = "startup" ] || [ -z "$SOURCE" ]; then
  if [ -z "$LAST" ] || [ $(( ( $(date +%s) - $(date -d "$LAST" +%s 2>/dev/null || echo 0) ) / 86400 )) -ge 30 ]; then
    echo "🩺 BMUZ checkup due (last: ${LAST:-never}) — offer Muzzy /checkup in one line."
  fi
fi

# The global setup (CLAUDE.md, skills, BMUZ config) behind the other machine's? (startup only; any folder)
# Muzzy, 2026-10-13: "I'm not going to remember to type that exactly" — so it's a nudge to say /sync, never a git command
if { [ "$SOURCE" = "startup" ] || [ -z "$SOURCE" ]; } && [ -z "$BMUZ_NO_PULL" ] && [ -d "$HOME/.claude-config/.git" ]; then
  GIT_TERMINAL_PROMPT=0 timeout 20 git -C "$HOME/.claude-config" fetch --quiet 2>/dev/null
  BEHIND=$(git -C "$HOME/.claude-config" rev-list --count 'HEAD..@{u}' 2>/dev/null)
  [ -n "$BEHIND" ] && [ "$BEHIND" -gt 0 ] && echo "⚙️ Global setup: $BEHIND update(s) from the other machine — tell Muzzy in one line and offer /sync (or just run it if he's about to work)."
fi

# This machine's to-do from HUB.md (F80 — CLAUDE.md "Machine to-do: do it first"; nothing surfaced it before).
# PC = user Muzzy, laptop = user joebr: the "### <Machine> (user <name>)" part for this user, open items only.
HUB="${BMUZ_HUB:-$HOME/Documents/dev/HUB.md}"
ME="${USERNAME:-$USER}"
if { [ "$SOURCE" = "startup" ] || [ -z "$SOURCE" ]; } && [ -f "$HUB" ] && [ -n "$ME" ]; then
  TODO=$(awk -v me="$ME" '
    /^## / { inTodo = ($0 ~ /Machine to-do/); mine = 0; next }
    inTodo && /^### / { mine = (index($0, "(user " me ")") > 0); next }
    inTodo && mine && /^- \[ \]/ { print "  " substr($0, 1, 160) }' "$HUB")
  if [ -n "$TODO" ]; then
    echo "📌 Machine to-do for this machine ($ME) in ~/Documents/dev/HUB.md — do these first, one at a time, tick each, then /save (CLAUDE.md):"
    echo "$TODO"
  fi
fi

cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null || exit 0
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  # Started in a folder that holds projects (e.g. dev/games) — reviews, RESUME HERE and sync only work inside one
  REPOS=$(for d in */; do [ -d "$d.git" ] && [ -f "$d.planning/STATE.md" ] && printf '%s ' "${d%/}"; done)
  [ -n "$REPOS" ] && echo "Not inside a project — tell Muzzy in one line: start Claude in the project folder (e.g. \`cd <project>\` then \`claude\`) so RESUME HERE, sync and /security-review work. Projects here: $REPOS"
  exit 0
fi

# Title line: game name + version, if it has version.json
TITLE=$(basename "$PWD")
if [ -f version.json ]; then
  V=$(node -e "const v=require('./version.json'); console.log(v.name+' v'+v.version+'.'+v.build)" 2>/dev/null)
  [ -n "$V" ] && TITLE="$V"
fi
echo "=== BMUZ-2 — $TITLE ==="

# Pull only on a fresh start or resume (not after /clear or compaction)
if [ "$SOURCE" = "startup" ] || [ "$SOURCE" = "resume" ] || [ -z "$SOURCE" ]; then
  if [ -n "$BMUZ_NO_PULL" ]; then
    echo "Sync: skipped (test mode)"
  elif git remote | grep -q .; then
    CUR=$(git branch --show-current 2>/dev/null)
    GIT_TERMINAL_PROMPT=0 timeout 30 git fetch --quiet 2>/dev/null
    if ! git rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
      echo "Sync: branch $CUR is only on this PC (not on GitHub yet) — /save will push it"
    else
      PULL=$(GIT_TERMINAL_PROMPT=0 timeout 30 git pull --ff-only 2>&1)
      if [ $? -eq 0 ]; then
        echo "$PULL" | grep -q "Already up to date" && echo "Sync: already up to date" || echo "Sync: pulled latest from GitHub"
      else
        echo "SYNC FAILED — explain this to Muzzy in plain English before doing anything else:"
        echo "$PULL" | tail -5
      fi
    fi
    # Newer work saved on a different branch (e.g. /save on a sprint branch from the other machine)?
    NEWEST=$(git for-each-ref --sort=-committerdate refs/remotes/origin --format='%(refname:short)' 2>/dev/null | grep -v '/HEAD$' | grep -v '^origin$' | head -1)
    NEWEST_BRANCH=${NEWEST#origin/}
    if [ -n "$NEWEST_BRANCH" ] && [ "$NEWEST_BRANCH" != "$CUR" ] && \
       [ "$(git log -1 --format=%ct "$NEWEST" 2>/dev/null || echo 0)" -gt "$(git log -1 --format=%ct HEAD 2>/dev/null || echo 0)" ]; then
      echo "NEWER WORK on branch '$NEWEST_BRANCH' ($(git log -1 --format=%cr "$NEWEST")) — tell Muzzy, then switch to it (git switch $NEWEST_BRANCH) before doing anything else."
    fi
  else
    echo "Sync: no GitHub remote (not backed up online)"
  fi
fi

BRANCH=$(git branch --show-current 2>/dev/null)
DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
echo "Branch: $BRANCH   Uncommitted files: $DIRTY"

# Framework pieces behind the newest? (F77) In a game: each copy's src/.../VERSION vs the framework checkout's
# <module>/kit/VERSION (BMUZ_FRAMEWORK overrides where it is). No framework folder, or all current → quiet. No network.
FW="${BMUZ_FRAMEWORK:-$HOME/Documents/dev/framework}"
if [ -f package.json ] && [ -d "$FW" ]; then
  UPDATES=""
  # game copy : framework module : name Muzzy knows
  for PIECE in "ui/kit:ui-kit:UI kit" "devkit:devkit:Dev Kit" "audio:audio:Audio" "table:table:Table" "ai/kit:ai:AI" "rooms:rooms:Rooms"; do
    COPY=${PIECE%%:*}; REST=${PIECE#*:}; MODULE=${REST%%:*}; NAME=${REST#*:}
    [ -f "src/$COPY/VERSION" ] && [ -f "$FW/$MODULE/kit/VERSION" ] || continue
    HAVE=$(head -1 "src/$COPY/VERSION" | tr -d '\r' | awk '{print $1}')
    NEWEST=$(head -1 "$FW/$MODULE/kit/VERSION" | tr -d '\r' | awk '{print $1}')
    [ -n "$HAVE" ] && [ -n "$NEWEST" ] && [ "$HAVE" != "$NEWEST" ] || continue
    # behind only when the framework's is the higher version (a game ahead of this checkout says nothing)
    [ "$(printf '%s\n%s\n' "$HAVE" "$NEWEST" | sort -V | tail -1)" = "$NEWEST" ] && UPDATES="$UPDATES${UPDATES:+, }$NAME $HAVE → $NEWEST"
  done
  [ -n "$UPDATES" ] && echo "Framework updates available: $UPDATES — say 'update the framework pieces' and Claude installs them with install-module."
fi

STATE=.planning/STATE.md
if [ -f "$STATE" ]; then
  if grep -q "RESUME HERE" "$STATE"; then
    echo ""
    # Print the RESUME HERE section and the "Where we are" section
    awk '/^## .*RESUME HERE/{p=1} /^## /&&!/RESUME HERE|Where we are/{p=0} p' "$STATE"
  else
    echo ""
    echo "(Old GSD-style STATE.md — offer to convert this project to BMUZ-2 when Muzzy starts work.)"
    head -25 "$STATE"
  fi
fi

# The producer's eye (F81): the sprint line every time + only the lines that need attention (target date, stalled
# features, what's waiting on Muzzy). Quiet outside a BMUZ project. Local only — no network.
[ -d .planning ] && node "$(dirname "$0")/hooks/producer-notes.mjs" . 2>/dev/null

# Is the live game up? (F82): STATE's Live page + room server, ≤ 3 s, a line only when one is DOWN
# (`timeout 5`: a stuck name lookup can outlive the script's own 3 s limit — review F82; Git Bash has timeout)
if [ -d .planning ]; then
  if command -v timeout >/dev/null 2>&1; then timeout 5 node "$(dirname "$0")/hooks/live-ping.mjs" . 2>/dev/null
  else node "$(dirname "$0")/hooks/live-ping.mjs" . 2>/dev/null; fi
fi

# Open questions for Muzzy in the sprint (F80 — /develop "ask now" was remembered): every non-empty "Ask Muzzy:" line
if [ -f .planning/SPRINT.md ]; then
  ASKS=$(grep -E "Ask Muzzy:" .planning/SPRINT.md | sed -E 's/^.*Ask Muzzy:[[:space:]]*//' | grep -Evi '^(—|-|none|n/a)?[[:space:]]*$' | cut -c1-160 | sed 's/^/  ? /')
  if [ -n "$ASKS" ]; then
    echo ""
    echo "Open questions for Muzzy (SPRINT.md \"Ask Muzzy:\") — ask before the task they block (2–3 options + your pick), answers into Notes:"
    echo "$ASKS"
  fi
fi
exit 0
