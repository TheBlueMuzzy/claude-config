#!/bin/bash
# ============================================
# Claude Code Config Sync — Laptop Setup
# Run from inside the cloned ~/.claude-config repo
# ============================================

set -e
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"

echo "=== Claude Config Sync ==="
echo "Source: $REPO_DIR"
echo "Target: $CLAUDE_DIR"
echo ""

# Create ~/.claude if it doesn't exist
mkdir -p "$CLAUDE_DIR"

# --- Copy files ---
echo "Copying top-level files..."
cp "$REPO_DIR/CLAUDE.md" "$CLAUDE_DIR/"
cp "$REPO_DIR/PIPELINE.md" "$CLAUDE_DIR/"
cp "$REPO_DIR/QUICKSTART.md" "$CLAUDE_DIR/"
cp "$REPO_DIR/settings.json" "$CLAUDE_DIR/"
cp "$REPO_DIR/statusline.sh" "$CLAUDE_DIR/"

# --- Copy directories (merge, don't delete existing) ---
echo "Copying directories..."
for dir in agents commands config skills get-shit-done; do
  echo "  $dir/"
  cp -r "$REPO_DIR/$dir" "$CLAUDE_DIR/"
done

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
