#!/bin/bash
# ============================================
# Claude Code Config Sync — copy this repo into ~/.claude
# Run from inside the cloned ~/.claude-config repo:  bash setup.sh
# ============================================

set -e
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"

echo "=== Claude Config Sync ==="
echo "Source: $REPO_DIR"
echo "Target: $CLAUDE_DIR"
echo ""

mkdir -p "$CLAUDE_DIR"

# One-time safety copy before the first BMUZ-2 sync on this machine
if [ ! -d "$HOME/.claude-backup-pre-bmuz2" ]; then
  echo "Backing up ~/.claude to ~/.claude-backup-pre-bmuz2 (one time only)..."
  mkdir -p "$HOME/.claude-backup-pre-bmuz2"
  for x in CLAUDE.md PIPELINE.md QUICKSTART.md settings.json agents commands config skills get-shit-done references; do
    [ -e "$CLAUDE_DIR/$x" ] && cp -r "$CLAUDE_DIR/$x" "$HOME/.claude-backup-pre-bmuz2/"
  done
fi

# --- F176: never wipe a file edited on THIS machine since the last sync ---
# (2026-11-03: another session's /sync copied the repo over ~/.claude and lost a hook fix that wasn't pushed yet.)
# .config-applied = the repo commit this machine was last level with. A live file that differs from the incoming copy
# AND from its copy at that commit was changed here → set it aside, copy everything, put it back, and say so.
# Line endings don't count as a change. No marker yet (a new machine) → copy everything, as before.
APPLIED=""
if [ -f "$CLAUDE_DIR/.config-applied" ]; then
  APPLIED=$(cat "$CLAUDE_DIR/.config-applied")
  git -C "$REPO_DIR" cat-file -e "$APPLIED^{commit}" 2>/dev/null || APPLIED=""
fi
KEEP_DIR=$(mktemp -d)
KEPT=()
same_text() { cmp -s <(tr -d '\r' < "$1") <(tr -d '\r' < "$2"); }
was_text() { git -C "$REPO_DIR" show "$APPLIED:$1" 2>/dev/null | tr -d '\r'; }
keep_if_edited() { # $1 = path inside the repo / ~/.claude
  local rel="$1" live="$CLAUDE_DIR/$1" incoming="$REPO_DIR/$1"
  [ -f "$live" ] && [ -f "$incoming" ] && [ -n "$APPLIED" ] || return 0
  # machine-made files that change by themselves on each machine (config-sync.sh's NOISE list): not anyone's edit
  [[ "/$rel" =~ active-project\.json|last-checkup|/skills/synced/|node_modules|\.last-complete-round|obsidian-vault|/evals/results ]] && return 0
  same_text "$live" "$incoming" && return 0
  if git -C "$REPO_DIR" cat-file -e "$APPLIED:$rel" 2>/dev/null; then
    cmp -s <(was_text "$rel") <(tr -d '\r' < "$live") && return 0 # unchanged here → the incoming copy wins
    if cmp -s <(was_text "$rel") <(tr -d '\r' < "$incoming"); then
      KEPT+=("kept yours (changed here, not pushed yet): ~/.claude/$rel")
    else
      KEPT+=("changed on both machines — kept yours: ~/.claude/$rel (theirs: git -C ~/.claude-config show HEAD:$rel)")
    fi
  else
    KEPT+=("changed on both machines — kept yours: ~/.claude/$rel (theirs: git -C ~/.claude-config show HEAD:$rel)")
  fi
  mkdir -p "$KEEP_DIR/$(dirname "$rel")"
  cp "$live" "$KEEP_DIR/$rel"
}
for f in CLAUDE.md QUICKSTART.md settings.json statusline.sh statusline.ps1; do keep_if_edited "$f"; done
for dir in agents config references skills; do
  [ -d "$CLAUDE_DIR/$dir" ] || continue
  while IFS= read -r rel; do keep_if_edited "$rel"; done < <(diff -rq "$CLAUDE_DIR/$dir" "$REPO_DIR/$dir" 2>/dev/null \
    | sed -n "s#^Files $CLAUDE_DIR/\(.*\) and $REPO_DIR/.* differ\$#\1#p")
done

# --- Copy files ---
echo "Copying top-level files..."
cp "$REPO_DIR/CLAUDE.md" "$CLAUDE_DIR/"
cp "$REPO_DIR/QUICKSTART.md" "$CLAUDE_DIR/"
cp "$REPO_DIR/settings.json" "$CLAUDE_DIR/"
cp "$REPO_DIR/statusline.sh" "$CLAUDE_DIR/"
cp "$REPO_DIR/statusline.ps1" "$CLAUDE_DIR/" 2>/dev/null || true

# --- Project hub (the dev/ folder isn't a repo, so its index lives here) ---
if [ -f "$REPO_DIR/HUB.md" ]; then
  mkdir -p "$HOME/Documents/dev"
  cp "$REPO_DIR/HUB.md" "$HOME/Documents/dev/HUB.md"
  echo "Copied HUB.md -> ~/Documents/dev/HUB.md"
fi

# --- Copy directories (merge) ---
echo "Copying directories..."
for dir in agents config references skills; do
  echo "  $dir/"
  cp -r "$REPO_DIR/$dir" "$CLAUDE_DIR/"
done

# --- F176: put back what was changed here, and say so (/save pushes it; a both-machines file → compare first) ---
if [ ${#KEPT[@]} -gt 0 ]; then
  cp -r "$KEEP_DIR/." "$CLAUDE_DIR/"
  echo ""
  echo "Kept ${#KEPT[@]} file(s) changed on this machine since the last sync:"
  for k in "${KEPT[@]}"; do echo "  $k"; done
fi
rm -rf "$KEEP_DIR"

# --- Retire old pieces (BMUZ 1 + GSD). Moved to ~/.claude/archive/, never deleted. ---
# Keep this list in sync with RETIRED.txt
if [ -f "$REPO_DIR/RETIRED.txt" ]; then
  echo "Retiring old pieces..."
  mkdir -p "$CLAUDE_DIR/archive"
  while IFS= read -r item; do
    item="${item%%#*}"; item="$(echo "$item" | xargs)"
    [ -z "$item" ] && continue
    if [ -e "$CLAUDE_DIR/$item" ]; then
      mkdir -p "$CLAUDE_DIR/archive/$(dirname "$item")"
      rm -rf "$CLAUDE_DIR/archive/$item"
      mv "$CLAUDE_DIR/$item" "$CLAUDE_DIR/archive/$item"
      echo "  archived $item"
    fi
  done < "$REPO_DIR/RETIRED.txt"
fi

# --- Remember which repo commit this machine is now level with (config-sync.sh won't push over newer changes) ---
git -C "$REPO_DIR" rev-parse HEAD > "$CLAUDE_DIR/.config-applied" 2>/dev/null || true

# --- Install plugins ---
echo ""
echo "Installing plugins..."
PLUGINS=(
  "frontend-design@claude-plugins-official"
  "claude-md-management@claude-plugins-official"
  "playwright@claude-plugins-official"
  "playground@claude-plugins-official"
  "typescript-lsp@claude-plugins-official"
)
[ -n "$BMUZ_SETUP_NO_PLUGINS" ] && PLUGINS=() # (tests: a fake home never installs plugins)
for plugin in "${PLUGINS[@]}"; do
  echo "  Installing $plugin..."
  claude plugin install "$plugin" 2>/dev/null || echo "    (skipped — may already be installed)"
done

echo ""
echo "=== Done! ==="
echo "Restart Claude Code for changes to take effect."
