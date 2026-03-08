# Project Resolver

**Purpose:** Silently find and cd into the correct project directory before any GSD command runs. This replaces per-command validate steps with a single, robust resolution chain.

**Design:** Silent when inside a project (Steps 1-2). When NOT inside any project, uses breadcrumb trust level to decide: explicit recent selection → trust with notice, otherwise → ask. CWD does NOT persist between Bash calls, so the breadcrumb is the primary cross-`/clear` persistence mechanism.

---

## Resolution Chain

Run these steps IN ORDER. Stop at the first success.

### Step 1: CWD has .planning/

```bash
[ -d .planning ] && echo "RESOLVED_CWD" || echo "NOT_IN_CWD"
```

**If RESOLVED_CWD:** Project root is CWD. Update breadcrumb (Step 6, source: "cwd"). Continue **silently** — no output to user.

---

### Step 2: Walk up parent directories

```bash
DIR="$(pwd)"
FOUND=""
while [ "$DIR" != "/" ] && [ "$DIR" != "" ] && [ ${#DIR} -gt 3 ]; do
  if [ -d "$DIR/.planning" ]; then
    FOUND="$DIR"
    break
  fi
  DIR="$(dirname "$DIR")"
done
[ -n "$FOUND" ] && echo "RESOLVED_PARENT $FOUND" || echo "NOT_IN_PARENTS"
```

**If RESOLVED_PARENT:** User is in a subdirectory of a project. Update breadcrumb (Step 6, source: "cwd"). Continue **silently**.

---

### Step 3: Check breadcrumb trust level

When Steps 1-2 fail, the user is NOT inside any project. Read the breadcrumb:

```bash
cat ~/.claude/config/bmuz/active-project.json 2>/dev/null || echo "NO_BREADCRUMB"
```

**If breadcrumb exists**, check TWO things:

1. **Is the path still valid?**
```bash
PROJ_PATH="[extracted path from JSON]"
[ -d "$PROJ_PATH/.planning" ] && echo "BREADCRUMB_VALID" || echo "BREADCRUMB_STALE"
```

2. **Was it an explicit user selection?** Check the `source` field:
   - `"source": "explicit"` = user picked this project via AskUserQuestion
   - `"source": "cwd"` = auto-resolved from CWD/parent (might be stale if user moved)

**If BREADCRUMB_VALID AND source is "explicit":**
- Trust it — user explicitly chose this project recently
- Use that project path for all file operations
- Show one-line notice: `Working in [name] ([path])`
- Update breadcrumb timestamp (Step 6, keep source: "explicit")
- Continue.

**If BREADCRUMB_VALID BUT source is "cwd" (or missing):**
- Don't trust silently — user may have switched projects
- Proceed to Step 4 (scan and ask)

**If BREADCRUMB_STALE or NO_BREADCRUMB:** Proceed to Step 4.

---

### Step 4: Scan for projects

```bash
find ~/Documents -maxdepth 4 -name "PROJECT.md" -path "*/.planning/*" 2>/dev/null
```

**Count results:**

**If exactly 1 found:**
- Extract project root (two directories up from PROJECT.md)
- Use that project path for all file operations
- Update breadcrumb (Step 6, source: "explicit" — only option, implicitly chosen)
- Show one-line notice: `Found project at [path]`
- Continue.

**If multiple found:**
- Read breadcrumb for ordering hint (if it exists and is valid, list that project first)
- **Always ask the user** — use AskUserQuestion:
  - header: "Project"
  - question: "Which project are you working on?"
  - options: List each project as `[folder-name] — [path]` (max 4, breadcrumb project first with "(last used)" suffix, then remaining sorted by most recently modified)
- Use selected project path for all file operations
- Update breadcrumb (Step 6, source: "explicit")
- Continue.

**If none found:**
- Show error: `No project found. Run /gsd:new-project in your project directory to initialize one.`
- **Stop. Do not continue with the command.**

---

### Step 5: Use absolute paths (CRITICAL)

**CWD does NOT persist between Bash tool calls.** After resolution, you MUST:

1. Store the resolved project path in a variable: `PROJECT_DIR="[resolved path]"`
2. Use absolute paths for ALL subsequent file operations:
   - `cat $PROJECT_DIR/.planning/STATE.md` (not `cat .planning/STATE.md`)
   - `git -C $PROJECT_DIR status` (not `git status`)
   - Read tool: full absolute path (not relative)
3. Re-read any context files the command needs using absolute paths:

```bash
PROJECT_DIR="[resolved path]"
cat "$PROJECT_DIR/.planning/STATE.md" 2>/dev/null
cat "$PROJECT_DIR/.planning/ROADMAP.md" 2>/dev/null
cat "$PROJECT_DIR/.planning/PROJECT.md" 2>/dev/null
cat "$PROJECT_DIR/.planning/config.json" 2>/dev/null
```

Only read files that the calling command needs. Check what the command's `<context>` section references.

**Never assume CWD is the project directory.** Always use absolute paths.

---

### Step 6: Update breadcrumb

After ANY successful resolution, write the breadcrumb with source tracking:

```bash
mkdir -p ~/.claude/config/bmuz
cat > ~/.claude/config/bmuz/active-project.json << BEOF
{
  "path": "[resolved absolute path]",
  "name": "[project folder name]",
  "source": "[explicit or cwd]",
  "updated": "$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)"
}
BEOF
```

**Source values:**
- `"explicit"` — user chose this project (via AskUserQuestion, or only project found), OR was already explicitly set. **Trusted across /clear.**
- `"cwd"` — auto-resolved because user was inside the project directory (Steps 1-2). **Not trusted after /clear** because user may have moved.

---

## Rules

1. **NEVER ask the user which project if only one exists.** Single-project resolution is always silent or one-line notice.
2. **Trust explicit breadcrumbs across /clear.** When the user explicitly picked a project, don't re-ask on the next command. Show a one-line notice instead.
3. **Don't trust CWD-source breadcrumbs across /clear.** Auto-resolved breadcrumbs might be stale — scan and ask if multiple projects exist.
4. **NEVER skip resolution.** Every GSD command (except `/gsd:help`) runs this first.
5. **Use absolute paths after resolution.** CWD does not persist between Bash calls. Every file read, git command, and path reference must use the full absolute project path.
6. **Always update the breadcrumb.** Even if CWD was correct (Step 1), refresh the timestamp so the breadcrumb stays current.
7. **CWD always wins.** If the user IS inside a project (Steps 1-2), that project is used regardless of breadcrumb.
