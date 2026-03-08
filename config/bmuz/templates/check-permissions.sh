#!/bin/bash
# BMUZ — Check if Claude Code auto-approve is configured
# Called from SessionStart hook. Prints a notice if tools require manual approval.

PROJ_DIR="${CLAUDE_PROJECT_DIR:-.}"
HAS_APPROVED=""

# Check project settings (permissions or allowedTools)
grep -qE '"permissions"|"allowedTools"' "$PROJ_DIR/.claude/settings.json" 2>/dev/null && HAS_APPROVED="yes"

# Check project local settings (gitignored)
grep -qE '"permissions"|"allowedTools"' "$PROJ_DIR/.claude/settings.local.json" 2>/dev/null && HAS_APPROVED="yes"

# Check global settings
grep -qE '"permissions"|"allowedTools"' "$HOME/.claude/settings.json" 2>/dev/null && HAS_APPROVED="yes"

if [ -z "$HAS_APPROVED" ]; then
  echo ""
  echo "⚠ Tools require manual approval. Run /first-time-setup to enable auto-approve."
fi
