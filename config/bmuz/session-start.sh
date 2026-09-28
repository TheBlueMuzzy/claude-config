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

cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

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
exit 0
