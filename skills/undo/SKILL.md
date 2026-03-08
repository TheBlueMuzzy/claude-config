---
name: undo
description: Safely undo recent code changes. Shows what happened in plain English, lets you pick what to revert. Use when something broke, you made a mistake, or you want to go back.
argument-hint: [optional: number of commits to show]
---

# Undo — Safe Revert

You are helping a non-technical user undo recent changes safely. Speak in plain English. Never show raw git output without translation.

## Step 1: Show What Happened Recently

Run `git log --oneline --relative-date -n 10` and translate each commit into plain English.

Format like this (adjust to actual commits):

```
Recent changes (newest first):

1. [2 min ago]  Added shake animation when tapping wrong color goop
2. [15 min ago] Fixed the pressure gauge not showing yellow highlight
3. [1 hour ago] Updated tutorial step 3 message text
4. [2 hours ago] Reorganized how pieces spawn in training mode
5. [yesterday]  Docs: saved session progress
```

If `$ARGUMENTS[0]` is provided, show that many commits instead of 10.

Also check for uncommitted changes:
- Run `git status` (short form)
- If there ARE uncommitted changes, warn: "You also have unsaved changes that haven't been committed yet. These would NOT be affected by undoing a commit."

## Step 2: Ask What to Undo

Ask: **"Which change do you want to undo? Pick a number, or describe what went wrong and I'll figure out which change caused it."**

If the user describes a problem (e.g., "the button disappeared") instead of picking a number:
1. Look at the files changed in recent commits (`git diff --name-only HEAD~5..HEAD`)
2. Identify which commit likely caused the issue
3. Confirm with the user before acting

## Step 3: Confirm Before Acting

Show exactly what will happen:

```
I'll undo: "[commit message in plain English]"

Files that will change:
- src/components/GameBoard.tsx (the game display)
- src/hooks/useInputHandlers.ts (how touch/click works)

This is safe — it creates a NEW save point that reverses the change.
Nothing is permanently lost. You can even undo the undo later.

Go ahead?
```

Wait for confirmation. NEVER revert without asking first.

## Step 4: Execute the Revert

```bash
git revert [commit-hash] --no-edit
```

After reverting:
1. Run `npm run test:run` to verify nothing else broke
2. If tests pass: "Done! The change has been undone. Your game should be back to how it was before."
3. If tests fail: "The undo worked, but some tests are now failing. This might mean other changes depended on the one we undid. Want me to look into it?"

## Step 5: Offer Next Steps

- "Want to test the game to make sure it looks right?"
- "Want to undo another change?"
- "Everything good? Let's keep going."

## Safety Rules — NEVER Do These

- **NEVER** `git reset --hard` (destroys history permanently)
- **NEVER** `git checkout .` (discards all uncommitted work)
- **NEVER** `git clean -f` (deletes untracked files permanently)
- **NEVER** `git push --force` (destroys remote history)
- **NEVER** revert without user confirmation
- **NEVER** revert more than one commit at a time without explaining each one

## If the User Wants to Undo UNCOMMITTED Changes

These are changes that haven't been saved/committed yet.

Ask: **"You have changes that haven't been saved yet. What do you want to do?"**

Options:
1. **"Save them first, then undo"** → commit, then offer to revert
2. **"Throw them away"** → `git stash` (saves them hidden, recoverable)
3. **"Just show me what's changed"** → `git diff` translated to plain English

Always prefer `git stash` over `git checkout .` — stash is recoverable, checkout is not.

## If the User Wants to Undo MULTIPLE Commits

Walk through them one at a time, newest first. After each:
- Run tests
- Ask if they want to continue undoing more

Never batch-revert without the user understanding each change being undone.
