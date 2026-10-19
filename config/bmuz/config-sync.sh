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
# obsidian-vault lives only in the repo on purpose (OBSIDIAN.md copies it into dev/.obsidian on a new machine)
NOISE='active-project\.json|last-checkup|/skills/synced/|node_modules|\.last-complete-round|obsidian-vault|/evals/results|/evals: results'

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

# Which repo commit this machine's ~/.claude was last brought level with (setup.sh writes it after applying; a push
# writes its own commit). Until it equals the repo's HEAD, the other machine's changes aren't applied here, and a push
# would copy this machine's older files over them (F80 review 2026-10-19: the second /save after an INCOMING listed the
# laptop's newer files as plain CHANGED and pushed over them). Not synced itself: it lives outside the synced folders.
APPLIED="$LIVE/.config-applied"
# Prints something when GitHub's copy holds commits this machine hasn't applied. Only commits on GitHub count — this
# machine's own commit from a push that failed halfway isn't "incoming". An unknown marker (history rewritten) counts.
unapplied() {
  [ -f "$APPLIED" ] || return 0
  local applied; applied=$(cat "$APPLIED")
  git -C "$REPO" cat-file -e "$applied^{commit}" 2>/dev/null || { echo unknown; return 0; }
  git -C "$REPO" rev-list "$applied..@{u}" 2>/dev/null | head -1
}

case "${1:-status}" in
  status)
    before=$(git -C "$REPO" rev-parse HEAD)
    [ -f "$APPLIED" ] || echo "$before" > "$APPLIED" # first run with this check: the machine counts as level with what it had
    git -C "$REPO" pull -q --ff-only 2>/dev/null || echo "PULL-FAILED: ~/.claude-config couldn't fast-forward — sort it out by hand"
    after=$(git -C "$REPO" rev-parse HEAD)
    applied=$(cat "$APPLIED")
    if [ -n "$(unapplied)" ]; then
      echo "INCOMING: the other machine pushed config changes that aren't applied here yet:"
      git -C "$REPO" log --format="  %h %s" "$applied..@{u}" 2>/dev/null || echo "  (since $applied)"
      echo "  → apply them here with: cd ~/.claude-config && bash setup.sh (BEFORE pushing anything from this machine)"
    fi
    list_changes | sed 's/^/CHANGED: /'
    ;;
  push)
    msg="${2:-Sync config}"
    if [ -n "$(unapplied)" ]; then
      echo "NOT-APPLIED: the other machine's config changes aren't applied here yet — pushing would overwrite them. Run: cd ~/.claude-config && bash setup.sh (a file changed on both machines → keep a copy of this machine's first), then push again"
      exit 0
    fi
    for f in $FILES; do [ -f "$LIVE/$f" ] && cp "$LIVE/$f" "$REPO/$f"; done
    for d in $DIRS; do
      # copy this machine's files over the repo's (deletions are NOT pushed — retire things via RETIRED.txt)
      (cd "$LIVE" && find "$d" -type f | grep -Ev "$NOISE" | while read -r p; do mkdir -p "$REPO/$(dirname "$p")"; cp "$p" "$REPO/$p"; done)
    done
    [ -f "$HUB" ] && cp "$HUB" "$REPO/HUB.md"
    git -C "$REPO" add -A
    if git -C "$REPO" diff --cached --quiet; then echo "NOTHING-TO-PUSH"; exit 0; fi
    git -C "$REPO" commit -qm "$msg"
    git -C "$REPO" push -q && git -C "$REPO" rev-parse HEAD > "$APPLIED" && echo "PUSHED: $(git -C "$REPO" log --format='%h %s' -1)"
    ;;
esac
