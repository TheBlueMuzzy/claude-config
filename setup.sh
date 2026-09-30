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
for plugin in "${PLUGINS[@]}"; do
  echo "  Installing $plugin..."
  claude plugin install "$plugin" 2>/dev/null || echo "    (skipped — may already be installed)"
done

echo ""
echo "=== Done! ==="
echo "Restart Claude Code for changes to take effect."
