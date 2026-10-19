# BMUZ skill tests (F71)

Each key skill has cases in `~/.claude/skills/<skill>/evals/<case>/` (prompt.md · case.yaml · setup.sh · graders/*.md).
Every case starts from the practice game in `fixture-game.sh`. Run them with
`node ~/.claude/config/bmuz/scripts/test-skills.mjs --muzzy-said-yes [skill] [--case <name>]` (refuses without the flag) (~$0.20 a case, only when Muzzy says yes in /checkup).
On Windows they run inside WSL2's Ubuntu.

## Writing a case — what bit us (2026-10-19)
- **Call the skill by its full name in prompt.md: `/deliver:deliver`, not `/deliver`.** The test loads the skill as a plugin, so
  its name gets the plugin's name in front. A bare `/deliver` isn't found, and Claude improvises: in our test it read the
  ROADMAP by hand and skipped musts-check.mjs. `/bug` is worse, because it's reserved for a built-in that's switched off here
  (0 turns, $0). Plain words work too ("found a bug: …") and also test that the skill gets picked up.
- **The test sees no CLAUDE.md, hooks or memory, only the skill plus the config copy.** The skill (or PROJECT-FILES.md) has to
  spell out every format it writes.
- **Shell from Windows → WSL:** use a script file and `MSYS_NO_PATHCONV=1 wsl.exe -d Ubuntu -- bash -l <file>`. A `$var`
  inside `bash -lc "…"` gets eaten on the way, and then the eval ran the whole skills folder.

## Proving a case can fail — break a COPY, never the live skill
Copy the skill to `/tmp/brk/skills/<skill>`, symlink `/tmp/brk/config` → `/mnt/c/Users/Muzzy/.claude/config` (setup.sh
finds the practice game through `../../../../config`), break the copy, then run `claude plugin eval /tmp/brk/skills/<skill> …`.
Pick a break whose effect is **certain**:
- ✅ /deliver without the musts-check.mjs line → `ran-musts-check` red (0.67). The live skill is 1.00.
- ❌ /bug's format line removed → still green, because PROJECT-FILES.md holds the same format (a backup copy, which is fine).
- ❌ /bug told to "always fix now" → still green, because Claude's own judgment didn't fix a cosmetic bug anyway. A grader for
  a rule Claude follows by default won't catch that rule being lost.
