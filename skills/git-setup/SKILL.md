---
name: git-setup
description: Walk through complete Git and GitHub setup for a non-coder — install, configure, authenticate, create repos, understand basic concepts. Use when someone needs help with version control for the first time.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Bash, Glob
---

# Git & GitHub Setup Guide

## What This Does

Gets you set up with Git (version control — like "save points" for your
project) and GitHub (online backup where you can share your work). After
this, your code is safe and shareable.

## Concepts (in plain English)

| Git Term | What It Really Means |
|----------|---------------------|
| **Repository (repo)** | A project folder that Git watches |
| **Commit** | A save point — snapshot of your project at a moment in time |
| **Branch** | A parallel version of your project (for experiments) |
| **Push** | Upload your save points to GitHub (online backup) |
| **Pull** | Download changes from GitHub to your computer |
| **Clone** | Download someone else's project to your computer |
| **Merge** | Combine two branches back together |
| **Conflict** | Two people changed the same thing — needs manual fix |

## Step 1: Check if Git is Installed

```bash
git --version
```

If not installed:
- **Windows**: Download from https://git-scm.com/download/win
  - During install: choose "Git from the command line and also from 3rd-party software"
  - Choose VS Code or your editor as default
  - Accept all other defaults
- **macOS**: `xcode-select --install` or `brew install git`
- **Linux**: `sudo apt install git` (Ubuntu/Debian) or `sudo dnf install git` (Fedora)

## Step 2: Configure Your Identity

Git stamps every save point with your name and email:

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

Recommended settings for non-coders:
```bash
# Use the simpler merge strategy
git config --global pull.rebase false
# Use main as default branch name
git config --global init.defaultBranch main
# Store credentials so you don't have to re-enter
git config --global credential.helper store
```

## Step 3: Install GitHub CLI

GitHub CLI (`gh`) lets you create repos, manage PRs, and deploy from the terminal.

- **Windows**: `winget install --id GitHub.cli`
- **macOS**: `brew install gh`
- **Linux**: See https://github.com/cli/cli/blob/trunk/docs/install_linux.md

Then authenticate:
```bash
gh auth login
```
- Choose: GitHub.com
- Choose: HTTPS
- Choose: Login with a web browser
- Copy the code shown, open the browser link, paste the code
- Done!

Verify:
```bash
gh auth status
```

## Step 4: Create Your First Repository

In your game project folder:
```bash
git init
git add -A
git commit -m "Initial commit — project setup"
```

Push to GitHub:
```bash
gh repo create my-game-name --public --source=. --push
```

This creates a repo on GitHub and pushes your code there. You can now
see it at `https://github.com/your-username/my-game-name`.

## Step 5: Daily Workflow (simplified)

After making changes:
```bash
git add -A                           # Stage all changes
git commit -m "Added power-up system" # Create save point
git push                              # Upload to GitHub
```

Or just tell Claude `<save>` and it handles all of this for you.

## Step 6: Understanding Branches

Branches let you experiment without risking your working code:
```bash
git checkout -b experiment-new-feature  # Create and switch to new branch
# ... make changes ...
git add -A && git commit -m "trying new feature"

# If it worked:
git checkout main && git merge experiment-new-feature

# If it didn't:
git checkout main  # Just go back, experiment stays on its branch
```

Or just tell Claude "create a branch for [feature]" and it handles it.

## Common "Oh No" Moments

**"I broke something and want to go back"**
```bash
git stash          # Temporarily shelve your changes
# Test if the old code works
git stash pop      # Bring your changes back
# OR
git stash drop     # Throw away your changes
```

**"I committed something I shouldn't have"**
Tell Claude: "Undo my last commit but keep the files"
```bash
git reset --soft HEAD~1  # Undo commit, keep changes staged
```

**"I need to see what changed"**
```bash
git log --oneline -10    # Last 10 save points
git diff                  # What's changed since last save
```

## Report
```
GIT SETUP COMPLETE

User: [name]
Email: [email]
GitHub: [authenticated/not]
Default branch: main

You're ready! Your daily workflow is:
  1. Make changes to your game
  2. Tell Claude "<save>" to commit and push
  3. That's it — your work is safe on GitHub

If you ever feel lost, just ask Claude:
  "What's the git status?"
  "Show me recent commits"
  "Create a branch for [feature]"
```
