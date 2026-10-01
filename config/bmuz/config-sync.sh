#!/bin/bash
# CONFIG SYNC CHECK — used by /save (and /checkup).
# Compares this machine's live setup (~/.claude + ~/Documents/dev/HUB.md) with the claude-config repo
# (~/.claude-config), which is how the PC and the laptop share it.
#   bash config-sync.sh status   → pulls the repo, then lists what differs (nothing printed = in sync)
#   bash config-sync.sh push "message"  → copies this machine's changed files into the repo, commits, pushes
# The other machine then runs:  cd ~/.claude-config && git pull && bash setup.sh
set -e
REPO="$HOME/.claude-config"
LIVE="$HOME/.claude"
HUB="$HOME/Documents/dev/HUB.md"
[ -d "$REPO/.git" ] || { echo "NO-REPO: ~/.claude-config is missing — clone TheBlueMuzzy/claude-config there"; exit 0; }

FILES="CLAUDE.md QUICKSTART.md settings.json statusline.sh statusline.ps1"
DIRS="agents config references skills"
# Machine-specific or auto-made files that must never sync
NOISE='active-project\.json|last-checkup|/skills/synced/|node_modules|\.last-complete-round'

list_changes() {
  for f in $FILES; do
    if [ -f "$LIVE/$f" ] && ! cmp -s "$LIVE/$f" "$REPO/$f"; then echo "$f"; fi
  done
  for d in $DIRS; do
    diff -rq "$LIVE/$d" "$REPO/$d" 2>/dev/null | grep -Ev "$NOISE" \
      | sed -E "s#^Files $LIVE/([^ ]+) and .*#\1#; s#^Only in $LIVE/(.*): (.*)#\1/\2 (only here)#; s#^Only in $REPO/(.*): (.*)#\1/\2 (only in repo — the other machine added it, or it was deleted here)#" || true
  done
  if [ -f "$HUB" ] && ! cmp -s "$HUB" "$REPO/HUB.md"; then echo "HUB.md (~/Documents/dev/HUB.md)"; fi
}

case "${1:-status}" in
  status)
    before=$(git -C "$REPO" rev-parse HEAD)
    git -C "$REPO" pull -q --ff-only 2>/dev/null || echo "PULL-FAILED: ~/.claude-config couldn't fast-forward — sort it out by hand"
    after=$(git -C "$REPO" rev-parse HEAD)
    if [ "$before" != "$after" ]; then
      echo "INCOMING: the other machine pushed config changes:"
      git -C "$REPO" log --format="  %h %s" "$before..$after"
      echo "  → apply them here with: cd ~/.claude-config && bash setup.sh (BEFORE pushing anything from this machine)"
    fi
    list_changes | sed 's/^/CHANGED: /'
    ;;
  push)
    msg="${2:-Sync config}"
    for f in $FILES; do [ -f "$LIVE/$f" ] && cp "$LIVE/$f" "$REPO/$f"; done
    for d in $DIRS; do
      # copy this machine's files over the repo's (deletions are NOT pushed — retire things via RETIRED.txt)
      (cd "$LIVE" && find "$d" -type f | grep -Ev "$NOISE" | while read -r p; do mkdir -p "$REPO/$(dirname "$p")"; cp "$p" "$REPO/$p"; done)
    done
    [ -f "$HUB" ] && cp "$HUB" "$REPO/HUB.md"
    git -C "$REPO" add -A
    if git -C "$REPO" diff --cached --quiet; then echo "NOTHING-TO-PUSH"; exit 0; fi
    git -C "$REPO" commit -qm "$msg"
    git -C "$REPO" push -q && echo "PUSHED: $(git -C "$REPO" log --format='%h %s' -1)"
    ;;
esac
