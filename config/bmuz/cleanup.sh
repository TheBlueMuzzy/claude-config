#!/usr/bin/env bash
# BMUZ cleanup — Claude cleans up after itself (Muzzy, 2026-10-04: "clean up after yourself… make that clean up standard").
# Runs at /save and /deliver (and after merging a helper's work in /develop). Safe by design:
#   • NEVER touches a file git tracks.
#   • Helper workspaces (.claude/worktrees/*) go only when every commit is already on the main branch or the current
#     work branch (merged into dev/<milestone>) AND nothing is
#     uncommitted or untracked in them — otherwise they're kept and named, so the work is never lost.
#   • Check output (screenshots, reports) goes only from folders git IGNORES — every check makes it fresh again — and
#     never while it's fresh (changed in the last 15 min): a check may be running, or its results pages are being looked at.
#   • Temporary files: untracked, ignored `*.tmp.*` and Claude's scratch checks (`e2e/_*.mjs`).
# Usage: bash ~/.claude/config/bmuz/cleanup.sh [project-folder] [--dry-run]
# Prints one line ("🧹 cleaned 3.9 GB — …") or nothing when there was nothing to clean.

DIR="${1:-$PWD}"; [ "$1" = "--dry-run" ] && DIR="$PWD"
DRY=""; for a in "$@"; do [ "$a" = "--dry-run" ] && DRY=1; done
cd "$DIR" 2>/dev/null || exit 0
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT" || exit 0

OUTPUT_DIRS="e2e-shots test-results playwright-report screenshots"
size() { du -sk "$@" 2>/dev/null | awk '{s+=$1} END {print s+0}'; }
BEFORE=$(size "$ROOT")
DONE=(); KEPT=()

# 1. Helper workspaces whose work is all on the main branch
MAIN=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')
[ -z "$MAIN" ] && MAIN=$(git rev-parse --verify -q main >/dev/null && echo main || echo master)
CURRENT=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
N=0
while read -r WT; do
  [ -z "$WT" ] && continue
  B=$(git -C "$WT" rev-parse --abbrev-ref HEAD 2>/dev/null)
  # (done = every commit is on main OR on the branch the project folder is on — e.g. merged into dev/<milestone>)
  AHEAD=$(git rev-list --count "$B" --not "$MAIN" "$CURRENT" 2>/dev/null || echo 1)
  CHANGES=$(git -C "$WT" status --porcelain 2>/dev/null | wc -l)
  if [ "$AHEAD" = "0" ] && [ "$CHANGES" = "0" ]; then
    if [ -z "$DRY" ]; then git worktree remove --force "$WT" >/dev/null 2>&1 && git branch -D "$B" >/dev/null 2>&1; fi
    N=$((N + 1))
  else
    KEPT+=("helper workspace $(basename "$WT") — $AHEAD commit(s) not merged yet, $CHANGES uncommitted file(s) (has work — check it before removing)")
  fi
done < <(git worktree list --porcelain | awk '/^worktree /{print $2}' | grep '/\.claude/worktrees/')
[ -z "$DRY" ] && git worktree prune >/dev/null 2>&1
# …and helper branches whose workspace is already gone, once fully merged (git branch -d refuses anything unmerged)
for HB in $(git branch --format='%(refname:short)' | grep '^worktree-agent-'); do
  git worktree list --porcelain | grep -q "branch refs/heads/$HB$" && continue
  if [ -z "$(git rev-list "$HB" --not "$MAIN" "$CURRENT" 2>/dev/null | head -1)" ]; then
    [ -z "$DRY" ] && git branch -d "$HB" >/dev/null 2>&1; N=$((N + 1))
  fi
done
[ "$N" -gt 0 ] && DONE+=("$N helper workspace(s)")

# 2. Check output in git-ignored folders (any depth, outside node_modules)
N=0
for name in $OUTPUT_DIRS; do
  while read -r D; do
    [ -z "$D" ] && continue
    git check-ignore -q "$D" || continue
    [ -n "$(git ls-files "$D" | head -1)" ] && continue
    # A check may still be running, or just made the results pages Muzzy is about to open: leave a folder alone if
    # anything in it changed in the last 15 minutes (it's cleaned next time).
    if [ -n "$(find "$D" -type f -mmin -15 2>/dev/null | head -1)" ]; then KEPT+=("check output in $D — fresh (< 15 min old)"); continue; fi
    if [ -n "$(ls -A "$D" 2>/dev/null)" ]; then
      [ -z "$DRY" ] && rm -rf "${D:?}"/* "${D:?}"/.[!.]* 2>/dev/null
      N=$((N + 1))
    fi
  done < <(find . -type d -name "$name" -not -path '*/node_modules/*' -not -path './.git/*' -not -path './.claude/worktrees/*' 2>/dev/null)
done
[ "$N" -gt 0 ] && DONE+=("check output in $N folder(s)")

# 3. Temporary files — untracked or ignored only
N=0
while read -r F; do
  [ -z "$F" ] && continue
  [ -n "$(git ls-files "$F")" ] && continue
  [ -z "$DRY" ] && rm -f "$F"
  N=$((N + 1))
done < <( { find . -name '*.tmp.*' -type f -not -path '*/node_modules/*' -not -path './.git/*' -not -path './.claude/worktrees/*'; find ./e2e -maxdepth 1 -name '_*.mjs' -type f 2>/dev/null; } 2>/dev/null)
[ "$N" -gt 0 ] && DONE+=("$N temporary file(s)")

AFTER=$(size "$ROOT")
FREED=$(( BEFORE - AFTER ))
human() { awk -v k="$1" 'BEGIN { if (k >= 1048576) printf "%.1f GB", k/1048576; else if (k >= 1024) printf "%.0f MB", k/1024; else printf "%d KB", k }'; }
if [ ${#DONE[@]} -gt 0 ]; then
  LIST=$(IFS=,; echo "${DONE[*]}" | sed 's/,/, /g')
  if [ -n "$DRY" ]; then echo "🧹 would clean: $LIST"; else echo "🧹 cleaned $(human $FREED) — $LIST"; fi
fi
for k in "${KEPT[@]}"; do echo "🧹 kept $k"; done
exit 0
