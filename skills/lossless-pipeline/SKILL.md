---
name: execute-with-team
description: Execute a GSD plan using an Agent Team (Lead + Scribe + Builder + Researcher). Opt-in power mode for larger plans. Reads a PLAN.md and orchestrates parallel execution with continuous documentation.
argument-hint: [plan-path]
---

# Execute with Agent Team

You are setting up and orchestrating an Agent Team to execute a GSD plan. The user is a non-coder — speak in plain English, never show raw errors, and handle all coordination invisibly.

## Arguments

- **Plan path**: `$ARGUMENTS[0]` — Path to a GSD PLAN.md file (e.g., `.planning/phases/01-foundation/01-01-PLAN.md`)

## Step 1: Read and Understand the Plan

Read the plan at `$ARGUMENTS[0]`. Identify:

1. **Tasks**: How many? What do they do?
2. **Files involved**: Which source files, which doc files?
3. **Dependencies**: Do tasks depend on each other?
4. **Checkpoints**: Are there human-verify or decision checkpoints?
5. **Context files**: What `@` references does the plan include?

## Step 2: Cost Check

Show the user a quick summary:

```
Plan: [plan name]
Tasks: [N] tasks
Estimated agents: Lead + Scribe + Builder + Researcher (4 agents)

This will use more API tokens than a single-agent build.
A single agent costs ~$1-3. A team costs ~$5-10.

The benefit: your documentation stays perfectly up to date,
nothing gets lost if context runs low, and research happens
in parallel with building.

Use the team, or run single-agent?
```

If the user chooses single-agent, tell them to use `/gsd:execute-plan $ARGUMENTS[0]` instead.

## Step 3: Prepare Role Assignments

### File Ownership Map

Split files from the plan into ownership:

| Owner | Files |
|-------|-------|
| **Builder** | All `src/`, `content/`, config files mentioned in plan tasks |
| **Scribe** | `.planning/`, `version.json`, `CLAUDE.md`, memory files |
| **Researcher** | `.planning/research/` (write), everything else (read-only) |
| **Lead** | Nothing — coordination only |

### Task Assignment

All implementation tasks go to the Builder. Assign them in plan order (they're sequential).

### Checkpoint Handling

- `type="checkpoint:human-verify"` → Lead handles (presents to user)
- `type="checkpoint:decision"` → Lead handles (asks user, forwards decision)
- `type="auto"` → Builder executes

## Step 4: Create the Team

```
TeamCreate: "plan-execution"
```

## Step 5: Spawn Agents (in this order)

### 5a. Spawn Scribe First

The Scribe needs to be ready before the Builder starts (to capture Task 1's completion).

Read the Scribe role template from `~/.claude/skills/lossless-pipeline/roles/scribe.md` and customize:

**Spawn prompt must include:**
- The Scribe role template content
- Current STATE.md content
- Paths to all doc files this project uses
- The plan name and phase for commit messages

**Scribe's first action:** Read STATE.md and confirm ready.

### 5b. Spawn Researcher

Read the Researcher role template from `~/.claude/skills/lossless-pipeline/roles/researcher.md` and customize:

**Spawn prompt must include:**
- The Researcher role template content
- Project CLAUDE.md content (for codebase context)
- The plan's `<context>` file references
- Instructions to pre-research any complex tasks

**Researcher's first action:** If any tasks look complex, proactively explore the relevant codebase areas and report findings.

### 5c. Spawn Builder

Read the Builder role template from `~/.claude/skills/lossless-pipeline/roles/builder.md` and customize:

**Spawn prompt must include:**
- The Builder role template content
- The full plan tasks (from PLAN.md)
- The plan's `<context>` file references
- Any pre-research from the Researcher (if available)
- File ownership rules

**Builder's first action:** Start Task 1.

### 5d. Lead Enters Delegate Mode

After all agents are spawned, the Lead (you) enters Delegate Mode:
- Press Shift+Tab (or equivalent)
- You are now coordination-only
- Do NOT write code or documentation

## Step 6: Orchestrate Execution

### Normal Task Flow

```
Builder completes task → messages you with summary
You forward summary to Scribe: "Task N complete: [details]. Update docs."
Scribe updates STATE.md → messages you confirmation
You report to user: "Task N of M done: [plain English summary]"
```

### When Builder Has Questions

```
Builder asks question → messages you
You translate to plain English → ask user via AskUserQuestion
User answers → you forward answer to Builder
You also forward to Scribe: "Decision: [what was decided]"
```

### When Builder Needs Research

```
Builder asks "how does X work?" → messages you (or Researcher directly)
You forward to Researcher (or Researcher responds directly)
Researcher investigates → reports findings to Builder + you
Builder continues task
```

### At Checkpoints

```
Plan has checkpoint:human-verify → Builder pauses
You present to user: what was built, how to test, what to look for
User tests → reports results to you
If approved: tell Builder to continue
If issues: create fix task for Builder, tell Scribe to log issue
```

### Vision Capture (continuous)

During ANY conversation with the user, if they mention:
- Future ideas, design direction, things they want eventually
- Preferences, aesthetic choices, "wouldn't it be cool if"

Forward to Scribe immediately: "Vision capture: [the user's words]. Context: [what we were discussing]."

## Step 7: Plan Completion

When all tasks are done:

1. **Verify with Builder**: "All tasks complete? Tests passing?"
2. **Tell Scribe**: "Plan complete. Create SUMMARY.md. Update ROADMAP.md progress."
3. **Wait for Scribe confirmation**: SUMMARY.md created, all docs current
4. **Report to user**:

```
Plan complete!

What was built:
- [bullet list of accomplishments]

Documentation updated:
- STATE.md (current status)
- ROADMAP.md (progress tracked)
- SUMMARY.md (execution record)
- version.json (build bumped)

Next: want to test, continue to next plan, or take a break?
```

5. **If user wants to test**: Present the plan's `<verification>` section as a testing checklist
6. **If issues found during testing**: Create fix tasks, have Builder fix them
7. **When fully approved**: Shutdown teammates gracefully

## Step 8: Cleanup

When everything is verified and approved:

1. Send shutdown_request to Builder
2. Send shutdown_request to Researcher
3. Send shutdown_request to Scribe (last, so it captures final state)
4. Clean up the team: TeamDelete
5. Confirm to user: "Team shut down. All work saved. Ready for next session."

## Error Handling

### If a teammate goes unresponsive
- Check task list for their status
- Send them a message asking for status
- If still unresponsive after 2 attempts, tell the user and offer to continue without them

### If tests fail after a task
- Tell the Builder to fix the failures before moving on
- Don't forward to Scribe until tests pass (STATE.md should reflect working state only)

### If the user wants to stop mid-plan
- Tell Builder to commit current work
- Tell Scribe to update STATE.md with: what's done, what's remaining, current blockers
- Shutdown team gracefully
- The next session can resume from STATE.md

## Rules

- NEVER implement code yourself — always delegate to Builder
- NEVER update docs yourself — always delegate to Scribe
- NEVER research yourself — always delegate to Researcher
- ALWAYS translate between technical (agents) and plain English (user)
- ALWAYS forward vision comments to Scribe
- ALWAYS ask the user before making architectural decisions
- Keep your context lean — delegate and summarize, don't accumulate
