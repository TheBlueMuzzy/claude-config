# Reliability review — making BMUZ behave like an editable EXE (2026-10-18)

Muzzy: "I feel like I've had this consistency conversation with you before… I need to believe you'll do the right things at
the right times. I want you to work like an EXE in some regards — except editable and malleable. Are we approaching this correctly?"
Yes, he had: `../2026-10-03-standards-and-process/REVIEW.md` (top problem: "Muzzy repeated UI rules he'd already given") —
its fix was mostly more checklist lines, which kept growing. Today's repeat: the Dev Kit installed in Goops with none of its
hooks although DEVKIT.md said how.

## What the research says (sources in the two reports summarised here)
- Anthropic: "CLAUDE.md and skills are context Claude weighs; hooks and permission rules are enforced by the harness" ·
  "Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and guarantee the action happens" ·
  "Bloated CLAUDE.md files cause Claude to ignore your actual instructions" · fragile steps = "low freedom" exact scripts ·
  /clear after two failed corrections; spec → fresh session. (code.claude.com/docs/en/{hooks,best-practices,memory,skills,workflows,plugin-evals};
  platform.claude.com …/agent-skills/best-practices)
- OpenAI Codex "harness engineering": a rule the agent doesn't follow gets promoted into code — custom lints / structural
  tests whose error message contains the fix.
- Evidence: instruction-following falls as instructions pile up (IFScale, arXiv 2507.11538: ~68% at 500); compliance falls
  ~5.6% per extra function within one session (arXiv 2605.10039); context rot (trychroma.com/research/context-rot);
  AGENTS.md files barely move success but add cost (arXiv 2602.11988). → long skills AND long sessions both hurt.
- BMUZ today: 2 hooks (SessionStart sync, PreCompact backup), neither can block anything; ~40 lesson lines in /develop;
  no module contract checks; skills never tested; releases interpreted, not scripted; very long autonomous sessions.

## Verdict
Direction right (framework modules, content/ JSON, planning files as truth, code-first lessons), mechanism wrong: almost
every "must" is prose. An EXE = the ORDER of steps and the GATES are code; the creative work (design calls, code itself)
stays flexible. Hooks + scripts + checks + evals are editable text, so it stays malleable.

## Plan (order = value per effort)
1. **Hooks + permission rules (BMUZ, ~1 day).** Muzzy's "never" rules become deny rules / PreToolUse blocks (reset --hard,
   force-push, branch delete, touching his Chrome, Gmail). /develop's skill registers a Stop gate (check:fast when code
   changed since the last green run; fast, with a timeout; `stop_hook_active` guard). PreToolUse on `git commit` = typecheck
   must pass. PreToolUse on push/deploy to the live branch = blocked unless /deliver's smoke pass file exists. PostToolUse
   on edits in src/ui = check-ui on that file.
2. **Module contract checks with fix-it messages** (framework v0.9 F61): each module asserts its own wiring; the installer
   and check:fast run them; the failure says exactly what to wire and where.
3. **Scripts for fragile procedures**: install/update a module, version bump, /save, /deliver → scripts (or saved
   Workflows for multi-agent steps). Skill text shrinks to "run it; if it fails, read the message".
4. **Lesson audit** (framework v0.9 F67): each checklist line → automatic (delete) · a check · a script step · stays (judgement
   only). Budgets: CLAUDE.md < 200 lines, each SKILL.md shorter than today, detail in reference files.
5. **Session hygiene**: one feature per session (or per helper), STATE written between; a fresh session at every feature
   boundary in autonomous runs instead of the 80% checkpoint.
6. **CI backstop**: GitHub Actions run check:fast + the conformance pack on push (in case a hook is skipped).
7. **Evals for the skills** (BMUZ packaged as a plugin; `claude plugin eval`): a few cases per key skill (e.g. "install the
   Dev Kit into a fixture game" → graded on the contract check running and main.tsx wired). Run after skill edits and model
   updates. Caveats: costs usage per run; Bash cases need WSL2 on Windows.
