# F80 "Everything triggers" — audit of every BMUZ skill (2026-10-19)

Muzzy's rule: *"'only runs when it remembers' is a bad thing. 'always runs because it triggers' is much more solid."*

Every instruction that tells Claude to DO (or never do) something, sorted into one of four kinds. Each kind was checked against
the real hook/script code, not against what the skill text says.

| Kind | Means |
|---|---|
| **①** automatic | A script or hook really does it. (file:line given) |
| **②** judgement, but checked | Claude decides, but a hook or script refuses, sends the turn back, or reminds at the right moment until it's on record. "(nudge)" = a reminder at the right moment, not a refusal. |
| **③** judgement only | No check is possible or worth it (one-line reason). |
| **✗** remembered-only | Claude just has to remember it, but it COULD be ① or ②. A trigger is proposed for each, with a size: **S** (under an hour, one file) · **M** (a new script or several files) · **L** (a new system). |

Evidence paths are short. `hooks/` = `~/.claude/config/bmuz/hooks/`, `scripts/` = `~/.claude/config/bmuz/scripts/`. Registered
hooks were checked in `~/.claude/settings.json`: SessionStart = session-start.sh · PreToolUse = guard-git, commit-typecheck,
live-push, guard-edits · PostToolUse = check-ui-edit, lint-edit, plan-lint, session-moments · UserPromptSubmit =
session-moments · Stop = handoff-check, stop-plan-check, stop-cleanup · PreCompact = STATE.md.bak. `stop-check-fast.mjs` is
registered only in /develop's frontmatter.

---

## 1. Summary

### Counts per kind

| Skill / file | ① | ② | ③ | ✗ | rows |
|---|---|---|---|---|---|
| **save** | 10 | 6 | 5 | 11 | 32 |
| **deliver** | 3 | 10 | 18 | 25 | 56 |
| develop | 4 | 22 | 31 | 15 | 72 |
| sprint | 0 | 3 | 9 | 5 | 17 |
| discover | 0 | 1 | 5 | 1 | 7 |
| define | 0 | 2 | 6 | 2 | 10 |
| bug | 0 | 4 | 9 | 3 | 16 |
| ppp | 1 | 1 | 2 | 1 | 5 |
| play | 0 | 0 | 2 | 7 | 9 |
| sketch | 0 | 2 | 5 | 3 | 10 |
| checkup | 1 | 1 | 4 | 3 | 9 |
| bmuz | 0 | 0 | 3 | 0 | 3 |
| roadmap | 0 | 3 | 5 | 3 | 11 |
| gdd | 0 | 0 | 4 | 0 | 4 |
| tdd | 0 | 0 | 5 | 1 | 6 |
| sync | 1 | 0 | 3 | 2 | 6 |
| PROJECT-FILES.md | 0 | 13 | 4 | 7 | 24 |
| CLAUDE.md (always/never rules) | 2 | 12 | 18 | 8 | 40 |
| **Total** | **22** | **80** | **138** | **97** | **337** |

(Counts are rows, and a row can group a few closely related lines. A row with mixed kinds is counted under its weakest:
any ✗ part → ✗, else any ② part → ②. A "② broken" row (D47, D56) counts as ②, but see §3.) Most ③ rows are taste, design talk or how to write code. That's the right home for
them. The ✗ rows are concentrated in **/deliver**, **/save**, /develop's hand-off and /play.

### Top 10 conversions by value (forgotten most often, or worst damage when forgotten)

| # | Conversion | Rows | Size |
|---|---|---|---|
| 1 | **The look-back check is blind to release.mjs.** stop-plan-check only looks for `git tag vX.Y.0` / `git commit -m "Release vX.Y.0"` typed in the shell. release.mjs makes both inside its own process, so the documented release path never triggers the look-back send-back. Fix: stop-plan-check also treats `node …release.mjs milestone|stage|major` as a milestone. Better still, check for tags created since the turn started. | D46 | S |
| 2 | **Setup sync inside save.mjs.** Run `config-sync.sh status` at the end of every save. CHANGED with nothing INCOMING → push it automatically (Muzzy said "always sync to the laptop") and print what went. INCOMING → stop and say "apply setup.sh first". A file changed on both machines → the only question left for Claude. | S13–S15 | M |
| 3 | **release.mjs pre-flight gates.** Run `check:fast` (skipped when stop-check-fast's green fingerprint matches HEAD) and `check:framework` when it exists. Refuse when code changed since STATE's `Last full check:`. Refuse on an open P0 (today only live-push checks that, and only for deploying projects). | D7, D10, D11, D12 | S each (M together) |
| 4 | **release.mjs review gates.** Refuse when code commits exist after STATE's `Reviewed through:`, or when there's no `Security reviewed: <commit>` line covering the merged branch. Today both reviews at /deliver are remembered-only. | D19, D20 | S + M |
| 5 | **save.mjs skips the type check and every test.** Its commit runs in a child process, so commit-typecheck never sees it. And "run tests/build" (/save §1) is remembered-only. Fix: save.mjs runs `check:fast` (or `tsc -b` at minimum) and prints a plain "heads up: X fails". It never blocks, matching the skill. | S1–S3 | S |
| 6 | **STATE freshness enforced by the scripts.** save.mjs fills in Branch + Version in "Where we are" itself. It refuses when the newest Log line isn't dated today, or when RESUME HERE is byte-identical to the last commit's while code/plan changed. release.mjs writes the new version into STATE and refuses unless RESUME HERE names the new tag. | S5, S6, S8b, D6, D32 | S |
| 7 | **`/save` right after `F08: done`, and archiving a finished sprint.** stop-plan-check sends the turn back when (a) an `Fnn: done` commit this turn isn't on GitHub yet, or (b) every SPRINT feature is ✅ in ROADMAP but SPRINT.md wasn't archived. | V65, V67, P4, D18 | S |
| 8 | **A `live-check.mjs` for the last mile.** It waits for the deploy run (`gh run watch`), fetches the live URL with a cache-buster, confirms the new version is there and the link opens without a login, and checks the console is clean in Playwright. It runs `e2e:update` when the site has a service worker, then writes `.planning/live-pass`. stop-plan-check sends a release turn back without a fresh live-pass. Today "is it really live?" is all memory. | D42–D44, D48, D49 | M |
| 9 | **A `merge.mjs` for /deliver §4.** It runs checks-gate → `git pull` → `git merge --no-ff` → deletes the branch locally and on the remote. It also closes a real hole: release.mjs only re-checks GitHub when HEAD is a merge commit. A fast-forward merge, or any commit after the merge, skips the check silently. | D25–D29 | M |
| 10 | **release.mjs runs cleanup.sh and musts-check.** Cleanup is automatic for /save only. /deliver §7b still relies on memory, though HOOKS.md implies it's handled. A milestone/stage release should run musts-check itself and refuse unless `--musts-open-ok` is passed (then list them for the release notes). | D45, D4 | S |

Close runners-up: the machine to-do printed at session start (CM16/Y5, S). The `.claude/worktrees/` ignore line written
*before* the first helper starts, not at the next save (V17, S). A ROADMAP ✅ required for `Fnn: done` (V64, S).

---

## 2. Skill by skill

### save — `~/.claude/skills/save/SKILL.md` (exhaustive)

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| S1 | L11 "If the project has tests, run them. If code changed, run the build." | ✗ | save.mjs runs no test or build. **Trigger:** save.mjs step 0b runs `npm run check:fast` (fallback `npm test` + `npm run build`). It skips the run when `.git/bmuz-last-green` (stop-check-fast's fingerprint) matches. | S |
| S2 | L12 "Failing? Say so… Saving anyway… Never hide it." | ✗ | Comes with S1: save.mjs prints `⚠ Saving anyway, but heads up: <check> fails` with the last lines, and still saves. | S (in S1) |
| S3 | (hidden) the save commit skips the type-check hook | ✗ | commit-typecheck.mjs only sees `git commit` typed in the shell (gitCalls). save.mjs:104 commits in a child process. **Trigger:** save.mjs calls commit-typecheck's tsc logic (export it from lib) and warns. | S |
| S4 | L16 old GSD layout → one dated line, say the conversion line | ③ | Rare and shrinking. session-start.sh:99-102 already flags an old STATE. | — |
| S5 | L18 RESUME HERE rewritten for a fresh Claude | ✗ | Only its length is checked (plan-lint.mjs:176-178, over 12 lines). **Trigger:** save.mjs refuses in a BMUZ project when RESUME HERE is identical to `HEAD:.planning/STATE.md`'s and code or plan files changed since the last save. The words stay Claude's. | S |
| S6 | L19 Where we are: stage, milestone, sprint, doing, branch, version | ✗ | **Trigger:** save.mjs writes `Branch:` and `Version:` itself (it already knows both: :107, :67). Stage/sprint/doing stay judgement, nudged by S5. | S |
| S7 | L20 Key facts: add what must survive, remove what's untrue | ③ | What's worth keeping is judgement. Size is ② (plan-lint.mjs:180-181, over 50 lines), and the 80/90% context nudge (session-moments.mjs:213-217) asks for it. | — |
| S8a | L21 Log trimmed to 10, older lines to archive/log.md | ① | save.mjs:70-97. | — |
| S8b | L21 Log gets one new dated entry, player's-eye | ✗ | Nothing checks a new line was added. **Trigger:** save.mjs refuses when the newest `- ` line under `## Log` doesn't contain today's date (BMUZ projects only). | S |
| S9 | L22 Ideas that came up → ROADMAP → Ideas | ③ | Spotting an idea in the chat is judgement. | — |
| S10a | L25 build +1 in version.json | ① | save.mjs:59-68. | — |
| S10b | L25 refuses `.env` / secrets / `.playwright-mcp/` | ① | save.mjs:32-34 (NEVER_COMMIT). guard-git.mjs:54-60 does the same for hand commits. | — |
| S10c | L25 commits, pushes, sets the upstream the first time | ① | save.mjs:99-115. | — |
| S10d | L25 "safe to switch machines" only after GitHub has the commit | ① | save.mjs:117-120. | — |
| S10e | (script only) a BMUZ project's .gitignore gets `.claude/worktrees/` + `.planning/ppp.html` | ① | save.mjs:44-57. | — |
| S11 | L26 no remote → check Key facts `Remote: none`, offer `gh repo create` once, record a decline | ✗ | save.mjs:109-111 just says "saved locally". **Trigger:** save.mjs reads Key facts. Without `Remote: none` it prints the exact offer line, so Claude can't skip it. Recording the answer stays Claude's. | S |
| S12 | L29 planner rebuilt and republished to the PPP link | ② | plan-lint.mjs:187-198 rebuilds after plan edits. stop-plan-check.mjs:62-71 sends the turn back if it isn't republished. Gap: save.mjs's own Log trim (a script write) doesn't trigger a rebuild. | — |
| S13 | L32 run `config-sync.sh status` | ✗ | save.mjs never calls it. **Trigger:** save.mjs runs it after the push (see Top 10 #2). | M |
| S14 | L33 INCOMING → `setup.sh` first, then status again | ✗ | Same trigger: save.mjs prints INCOMING and refuses to push the setup until it's applied. | (M) |
| S15 | L34 CHANGED → push without asking, name what synced; changed on both → ask | ✗ | Same trigger: save.mjs calls `config-sync.sh push "<summary>"` and prints "Setup synced: …". A file changed on both machines → it stops, and Claude asks. | (M) |
| S16 | L35 "only in repo" → mention once, never delete | ③ | Never deleting is already ①: config-sync.sh:152 never pushes deletions. Mentioning it is a one-liner. | — |
| S17 | L39 cleanup runs by itself | ① | save.mjs:27-30 → cleanup.sh. | — |
| S18 | L42-47 tell him: 2–3 lines, version, branch, sync, 🧹 | ② | handoff-check.mjs forces the card. save.mjs:120 prints the version/branch line. | — |
| S19 | L48 push failed → NOT safe, explain, fix | ① | save.mjs:115 refuses with plain words and the fix. The explaining is Claude's. | — |
| S20 | L49 no remote → "NOT safe to switch machines" | ① | save.mjs:110. | — |
| S21 | description: "going to bed", "switching machines" → /save | ② (nudge) | session-moments.mjs:208-210. Note: `stop-unsaved.mjs` (F80, refuses up to 3×) appeared mid-audit but is **not registered** in settings.json yet. | — |
| S22 | CLAUDE.md: confirm "pushed — safe to switch machines" | ① | save.mjs:120. | — |
| S23 | L44 "on the other machine I'll switch to it automatically" | ② (nudge) | session-start.sh:62-65 only *tells* Claude to switch. Claude does it. | — |
| S24 | Context 80/90% → write things down, /save | ② (nudge) | session-moments.mjs:213-217. Gap: it never fires on save.mjs/release.mjs commits (it matches `git … commit` in the command). | — |
| S25 | "fix that, run it again" after a refusal | ③ | Fixing is the judgement. The refusal itself is ①. | — |
| S26 | (save.mjs commits a message starting `F08: done`) | ✗ | The F72/F75 gates (guard-git.mjs:169-201) only see shell `git commit`. `save.mjs "F08: done"` slips past STATE/review/full-check. **Trigger:** save.mjs refuses a summary matching `^F\d+.*: done`, or runs the same check (move checkDoneSavesState into lib). | S |
| S27 | Work branch saved on another machine → pick it up | ② (nudge) | session-start.sh:59-65. | — |

### deliver — `~/.claude/skills/deliver/SKILL.md` (exhaustive)

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| D1 | L8 read PROJECT-FILES.md this session | ③ | Reading can't be observed. Better to put what /deliver needs into the scripts. | — |
| D2 | L9 old GSD layout → don't restructure, dated line | ③ | Rare. | — |
| D3 | L12-14 pick the kind (update / milestone / stage) | ③ | Judgement. release.mjs:137 forces a kind (①). | — |
| D4 | L15 release stage → musts-check first; missing → ask | ✗ | The script exists (musts-check.mjs) but nothing calls it. **Trigger:** release.mjs milestone/stage runs it and refuses unless `--musts-open-ok`, then prints the open list for the notes. | S |
| D5 | L15 1.0 → ask about X (public release) | ③ | Muzzy's call. release.mjs `major` already needs it named. | — |
| D6 | L18 do /save's STATE + Log step first, always | ✗ | **Trigger:** release.mjs refuses unless STATE.md has a Log line dated today (shared code with S8b). | S |
| D7 | L19 Fast tier, fresh, quote the result | ✗ | Nothing at deliver. stop-check-fast only runs as /develop's Stop hook. **Trigger:** release.mjs runs `check:fast` (skipped when the green fingerprint matches HEAD) and refuses on red. | S |
| D8 | L19 smoke test via smoke-pass.mjs right before push/deploy; commit `.planning/smoke-pass` | ② | live-push.mjs:336-360 refuses a push to a deploying branch, or a deploy command, without a fresh pass. smoke-pass.mjs:340-345 refuses uncommitted code. Gap: deploys started by tag, workflow_dispatch or a host's own git hook (Vercel) aren't seen. | — |
| D9 | L19 no `smoke` script → add one | ② | smoke-pass.mjs:333-337 refuses and says how. | — |
| D10 | L19 `npm run check:framework` always; none → add it | ✗ | **Trigger:** release.mjs runs it when the script exists. When `src/*/VERSION` exists but the script doesn't, it refuses with the checkup §7 fix line. | S |
| D11 | L19 Full only if code changed since `Last full check:` | ✗ | (Per feature it's ② via F75.) **Trigger:** release.mjs diffs `Last full check:` commit..HEAD for code files and refuses with "run check:full". | S |
| D12 | L19 open P0 blocks the release | ② | live-push.mjs:338-343. Only when going live: a project with no deploy workflow (or the framework) isn't checked. **Trigger to close it:** the same readBugs check in release.mjs. | S |
| D13 | L19 open P1s → list and ask; several → offer a sweep | ✗ | **Trigger:** release.mjs prints the open P1s (①). The ask stays Claude's. | S |
| D14 | L20 release stage → tick TDD §7 Compliance; unticked platform needs → ask | ③ | Ticking is judgement. An optional print of the unticked §7 lines could go in release.mjs. | — |
| D15 | L21 features not yet approved → ask once | ✗ | **Trigger:** release.mjs lists every `Fnn:` commit since the last tag whose feature isn't ✅ in ROADMAP. | S |
| D16 | L22 stage checks: alpha quick look · beta/1.0 optimize + accessibility + web-design + phone test | ✗ | **Trigger:** release.mjs `stage beta|1.0` refuses unless `.planning/archive/release-checks/<stage>.md` exists (written after running them). What to fix stays judgement. | M |
| D17 | L23 credits part of check:framework, blocks | ② | Via check:framework, *if* it runs (D10). | — |
| D18 | L24 a finished SPRINT.md → archive-sprint.mjs | ✗ | Remembered. **Trigger:** release.mjs refuses while SPRINT.md exists with every feature ✅ (says "archive it"). stop-plan-check could do the same (V67). | S |
| D19 | L25 `/security-review` once on the work branch | ✗ | No record, no check. **Trigger:** STATE line `Security reviewed: <commit>`. release.mjs refuses when it's missing or isn't the merged branch's tip. | M |
| D20 | L25 `/code-review` only after `Reviewed through:` | ✗ | Per feature it's ② (F75), but commits after the last `F08: done` (fixes, tiny changes) are never forced. **Trigger:** release.mjs refuses when code commits exist after `Reviewed through:`. | S |
| D21 | L25 not inside the repo → a subagent does the review | ③ | Orchestration. | — |
| D22 | L25 fix real bugs, list the rest, ask | ③ | Judgement. | — |
| D23 | L28 first release to a platform → one-time setup on the work branch | ③ | Depends on the platform. | — |
| D24 | L31 main branch = main or master | ① | `defaultBranch()` in hooks/lib.mjs. | — |
| D25 | L32 push the branch, checks-gate before merging; red → fix, never merge around it | ② | Claude has to run checks-gate.mjs (✗), but release.mjs:164-165 re-checks the merged commit, so a red branch is caught at release time… | — |
| D26 | (gap in D25) | ✗ | …**only when HEAD is a merge commit** (`HEAD^2`). A fast-forward merge, or a separate commit after the merge, skips the check silently. **Trigger:** merge.mjs (D27), and release.mjs finds the last merge in `git log <last-tag>..HEAD --merges`. | S |
| D27 | L33 checkout main, `git pull`, `git merge --no-ff` | ② / ✗ | Merging into main outside /deliver is refused (guard-git.mjs:203-214). The pull and `--no-ff` are remembered. **Trigger:** `merge.mjs <branch>` = checks-gate + pull + merge --no-ff. | M |
| D28 | L33 conflicts → resolve if obvious (version.json → main's), else ask | ③ | Judgement. | — |
| D29 | L34 delete the merged branch locally + remotely | ✗ | guard-git only refuses deleting *unmerged* branches (②). Deleting at all is remembered. **Trigger:** merge.mjs does it. | (M) |
| D30 | L37 patch notes from `git log <last-tag>..HEAD`, 3–8 player bullets | ③ | Writing is judgement. release.mjs could print the log for Claude. | — |
| D31 | L38 ROADMAP: milestone ✅ + date, release line, `Release target:` → next stage | ✗ | **Trigger:** release.mjs `milestone|stage` refuses unless the `← current` milestone heading has ✅ and today's date. A stage release also needs `Release target:` changed. | S |
| D32 | L39 STATE: version, Live line, Stage = deliver, RESUME → "Released vX.Y.Z — next …" | ✗ | **Trigger:** release.mjs writes `Version:` itself (it knows `next`) and refuses unless RESUME HERE contains the new tag. This also makes the `--dry-run` step unnecessary. | S |
| D33 | L40 release.mjs: bump, history, package.json + lock, commit, tag | ① | release.mjs:167-198. | — |
| D34 | L40 refuses uncommitted code, a work branch, an existing tag, red/unchecked merged branch | ① | release.mjs:146-151, :161, :164-165 (see D26 for the hole). | — |
| D35 | L40 `--dry-run` first for the number | ③ | Becomes unnecessary with D32. | — |
| D36 | L40 push with tags after the smoke pass | ② | live-push.mjs (deploying branches). | — |
| D37 | L44 recipe exists → follow it; fix it afterwards if anything differed | ③ | Following a recipe is judgement. The look-back catches recipe drift. | — |
| D38 | L45 no recipe → ask, set up, write the recipe, record the platform in Key facts; deployer for stores | ✗ | Recording is remembered. **Trigger:** release.mjs refuses when Key facts has no `Release:` line (covers D38–D40). Writing the recipe stays ③. | S |
| D39 | L46 nothing to host (a library) → skip §3/§6/§7 | ③ | Judgement. `Release: none (library)` in Key facts satisfies D38's check. | — |
| D40 | L47 not yet → record `Release: not set up (declined …)`, say "not live" | ✗ | D38's check. | (S) |
| D41 | L48 blocked → local setup, ⚠ recipe, Key facts line, `Muzzy:` line, "not live" | ③ | Mostly judgement. The Key facts line is D38's check. | — |
| D42 | L49 companion servers only when their code changed | ✗ | **Trigger:** release.mjs prints "server code changed since <last tag>: yes/no" (party/, worker/, wrangler.toml). | S |
| D43 | L50 CI deploy → `gh run watch` until done | ✗ | **Trigger:** live-check.mjs (Top 10 #8) waits for the run. | M |
| D44 | L53 open the live URL: loads, new version, console clean; retry | ✗ | **Trigger:** live-check.mjs + `.planning/live-pass` + a stop-plan-check send-back. | (M) |
| D45 | L54 service worker → `e2e:update`; cache-busting fetch | ✗ | live-check.mjs runs `e2e:update` when the script exists. | (M) |
| D46 | L57 cleanup.sh in the game AND dev/framework | ✗ | Only save.mjs runs it. **Trigger:** release.mjs runs cleanup.sh, plus the framework's when a framework tag was made today. | S |
| D47 | L60-63 look-back written, each lesson landed in a real home | ② **broken** | stop-plan-check.mjs:33-39, 58-61, 88-106 checks it, but only for `git tag`/`git commit` typed in the shell. release.mjs:190,196 commits and tags inside node, so **the documented path never triggers it.** **Trigger fix:** stop-plan-check counts `release.mjs (milestone|stage|major)` commands, or any `vX.Y.0` tag created since the turn began. | S |
| D48 | L64 summarise the look-back in §8 in one line | ③ | Reporting. | — |
| D49 | L67 confirm the link is public, own line, 2–5 lines on how to test | ✗ / ② | The card requires links under **Try it** (handoff-check.mjs:160-161). "Public, no login" is unchecked → live-check.mjs. | (M) |
| D50 | L74 Live URL changed → update STATE, commit | ✗ | live-check.mjs compares the URL with STATE's Live line. | (M) |
| D51 | L75 milestone → ask "keep doing / stop doing?" → look-back item | ③ | Muzzy's answer. Could become a required `## Muzzy` line in the look-back (template already has it). | — |
| D52 | L75 end with "Next: /sprint or /roadmap" | ② | handoff-check.mjs:158-159. | — |
| D53 | L19 "verification-before-completion: quote the result" | ③ | Quoting is reporting. The **Proof** section is required (②). | — |
| D54 | L22 "fix quick wins; list the rest as 🐞/✨ features" | ③ | Judgement. | — |
| D55 | L32 no Checks workflow / no gh → say so in §8, offer checks.yml | ② | lib.mjs checksVerdict prints the warning + fix every time. Offering it is Claude's. | — |
| D56 | CLAUDE.md "each milestone's /deliver ends with a look-back" | ② **broken** | Same as D47. | — |

### develop — `~/.claude/skills/develop/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| V0 | frontmatter: check:fast before handing back | ② | stop-check-fast.mjs. Caveat: it's only active once the /develop skill is invoked. Work routed from "go" without loading the skill has no check. | — |
| V1 | L14 read PROJECT-FILES; old GSD → offer conversion | ③ | Reading. session-start flags old STATE (②). | — |
| V2 | L17 no SPRINT → /sprint B first | ③ | Routing. | — |
| V3 | L18 tiny request → just do it, commit | ② | stop-plan-check.mjs:51-55 asks for a task line or a one-line "tiny fix". | — |
| V4 | L19 open `Ask Muzzy:` on the next task → ask now | ✗ | **Trigger:** when /develop starts, a UserPromptSubmit note lists SPRINT's open `Ask Muzzy:` lines. | S |
| V5 | L20 on main → create `dev/<milestone>` | ② | guard-git.mjs:153-165 refuses `Fnn:` code commits on main. | — |
| V6 | L20 auto-deploy note once | ③ | One line of talk. | — |
| V7 | L21 UI task → compare kit/Dev Kit VERSIONs, offer update; install-module | ① | session-start.sh:75-91 prints updates every session. install-module.mjs does the install. | — |
| V8 | L22 STATE Stage = develop, Doing = "F08 — building" | ✗ | **Trigger:** plan-lint warns when SPRINT has a 🔨 feature that STATE's Doing doesn't name. (Low value.) | S |
| V9 | L23 one-line kickoff | ③ | Talk. | — |
| V10 | L26 one feature at a time; offer to park | ③ | Conversation. | — |
| V11 | L27 mid-feature reports sorted out loud | ③ | Triage judgement. | — |
| V12 | L28 every mid-sprint request → SPRINT task line | ② | stop-plan-check.mjs:51-55. | — |
| V13 | L29 endless noodling → point it out | ③ | Could be a "days in 🎛️" print in /sprint. Low value. | — |
| V14 | L32 tasks in order; skip 🙋; remind at hand-off | ③ | Order is judgement. The card's **Questions** section is required. | — |
| V15 | L33 unattended: one fresh helper per feature | ③ | Orchestration. The 80% nudge backs it up. | — |
| V16 | L34 small yourself / big to a helper; parallel when files differ | ③ | Judgement. | — |
| V17 | L35 `.gitignore` has `.claude/worktrees/` before the first helper | ✗ (partly ①) | save.mjs:44-57 adds it, but only at the next save, after helpers may already exist. **Trigger:** guard-git refuses a commit that would stage anything under `.claude/worktrees/` and says to add the line. | S |
| V18 | L36 after a helper merge → cleanup.sh | ① (late) | Runs at the next /save (save.mjs:27-30). Good enough. | — |
| V19 | L37 throwaway copies/proof shots only in `~/Documents/dev/.scratch/` | ✗ | Clearing it is ① (cleanup.sh). Where things go is remembered. **Trigger:** guard-edits refuses Write/`cp -r`/`mkdir` into a new top-level folder of the home folder (e.g. `~/spike`), pointing to `.scratch/`. | S |
| V20 | L38 helpers `merge --ff-only` the work branch first; own ports/storage | ③ | Brief content. | — |
| V21 | L39 helpers run Area, not Full | ③ | Brief content. | — |
| V22 | L40 layout briefs list every size; look at a desktop shot yourself | ③ / ② | check:framework checks "UI at every size" when it runs. Writing the brief stays judgement. | — |
| V23 | L41 helper pattern; Monitor on SPRINT ticks for the bar | ③ | Orchestration. | — |
| V24 | L42 design open → 2–3 variants | ③ | Taste. | — |
| V25 | L43 feels off → mda-analyze; log `Tuning:` lines | ③ | Design thinking. | — |
| V26 | L44-46 specialists; never hand-style game UI | ② (part) | check-ui-edit.mjs catches kit-rule breaks in src/ edits. The rest is judgement. | — |
| V27 | L47 placeholder ladder; log every asset in credits.json | ② | check:framework credits check (when it runs). | — |
| V28 | L48 MCP card | ③ | Rare. | — |
| V29 | L49 rules/logic get unit tests; key flows a smoke check | ③ | What counts as "rules" is judgement. Bugs: plan-lint forces "Guarded by" (P0/P1). | — |
| V30 | L50 tweakables in `content/`; TDD §1/§3 + Decisions updated | ✗ | **Trigger (TDD part):** stop-plan-check sends back a turn that added a file under `content/` with no TDD.md change during the feature. (Hardcoding: see CM11.) | S |
| V31 | L51 `data-knobs` + select.json; unlisted settings | ② | The game's own select / unlistedSettings tests (Dev Kit 0.14+/0.16+). Not checked in this audit. | — |
| V32 | L52 tools read content/, never restate; grep for old copies | ③ | Code craft. | — |
| V33 | L53 changing a saved default → version the save | ③ | Code craft. | — |
| V34 | L54 random start choice → fixed mode for checks | ③ | Code craft. | — |
| V35 | L55 remake → list every old on-screen cue | ③ | Content audit. | — |
| V36 | L56 commit before breaking code on purpose | ② | guard-git.mjs:62-106 asks Muzzy before a checkout/restore that would drop uncommitted work. | — |
| V37 | L57 slow test → find why before raising the timeout | ③ | Debugging judgement. | — |
| V38 | L58 hook-enforced list (type check, backslash heredocs, pipe-hides-exit, kit copies, `F08:` on main) | ② | commit-typecheck.mjs, guard-edits.mjs:240-267 + :270-281, guard-git.mjs:153-165. All registered. | — |
| V39 | L58 Python on Windows: write with `newline='\n'` | ✗ | **Trigger:** guard-edits refuses `python … open(…,'w')` writing a code file without `newline=`. (Low.) | S |
| V40 | L59-63 framework lint automatic; `npm install` once at the framework root | ① / ✗ | lint-edit.mjs lints each edit. But with no eslint installed it stays silent (lint-edit.mjs:4), so the `npm install` is remembered. **Trigger:** lint-edit tells Claude once per session "the framework has no eslint installed — run npm install". | S |
| V41 | L64 after each task: tick, Notes, commit `F08: <task>` | ② | stop-plan-check.mjs:51-55 (SPRINT untouched while committing). | — |
| V42 | L64 no STATE/version edits per task | ③ | A "don't". Harmless if broken. | — |
| V43 | L65 build done + tuning left → 🎛️ in ROADMAP | ③ | Judgement on "works". | — |
| V44 | L66 stuck 3× → stop; big bug → 🐞 feature | ③ | Judgement. | — |
| V45 | L68 module contracts: live hooks, rules clock, adapter | ② | check:framework (live tuning, pauses) when it runs. | — |
| V46 | L69 installing a module = prove the main promise end to end | ② (part) | install-module.mjs runs the module's checks in the game. The end-to-end "slider moves the game" proof is Claude's. | — |
| V47 | L70 hotkeys skip text inputs | ③ | Code craft (Dev Kit 0.17.1 guards its own keys). | — |
| V48 | L73 really complete: audit content first-hand | ③ | That's the judgement itself. | — |
| V49 | L74 Fast after every task/merge | ② | stop-check-fast at hand-back (not per task). | — |
| V50 | L74 Full once per feature; record `Last full check:` | ② | guard-git.mjs:185-200 (F75). | — |
| V51 | L74 no check:full → add from template; no checks.yml → copy it | ② (nudge) | checkup.sh §7 lists both (monthly). checks-gate warns at deliver. | — |
| V52 | L75 player action changed → change it for AI seats/rivals too | ③ | Design rule. | — |
| V53 | L76 stop servers with stop-servers.mjs | ✗ | **Trigger:** guard-edits refuses `taskkill /PID`, or `kill` aimed at a dev-server port, and names stop-servers.mjs. | S |
| V54 | L77 one check run at a time | ① | check-all.mjs template lock (HOOKS scripts table). Old copies are flagged by checkup §7. | — |
| V55 | L78-84 e2e/test craft lessons (drop flag, own tag, ports, touch emulation, elementFromPoint, centre test, 350 ms) | ③ | Code craft; too varied to lint. | — |
| V56 | L85 visual change → dev server, Playwright screenshot, look yourself | ✗ | **Trigger:** a Stop hook (in /develop's frontmatter) sends back a turn that edited `src/**/*.{tsx,css}` with no browser screenshot tool call. | M |
| V57 | L86 logic → play it via Playwright/script; console clean | ③ | Covered in part by check:fast + e2e. | — |
| V58 | L87 check the feature's `Check:` line | ③ | Judgement. | — |
| V59 | L88 `/code-review` per feature; record `Reviewed through:` | ② | guard-git.mjs:185-200 (F75). | — |
| V60 | L89 screenshots: things clipped inside boxes | ② (part) | ui-kit uiProblems via check:framework. | — |
| V61 | L92 always the hand-off card | ② | handoff-check.mjs. | — |
| V62 | L93 player-side bullets; describe the screenshots | ② | Card sections **You'll see** / **Proof** required. | — |
| V63 | L94 delete `.playwright-mcp/` | ① | stop-cleanup.mjs (every turn). The skill line is now stale. | — |
| V64 | L95 `why:` line → end with its feel question; answer → Notes | ✗ | **Trigger:** handoff-check requires a "Did … feel like …?" line when the `Fnn: done` feature's ROADMAP item has `why:`. | S |
| V65 | L97 links in the hand-off: start servers, curl them, PC + phone + checks page | ② / ✗ | The card requires http links under **Try it** (handoff-check.mjs:160-161). Nothing checks they answer. **Trigger:** handoff-check curls the localhost/LAN links and sends back if they're dead. | S |
| V66 | L98 "Approved" → ROADMAP ✅, refresh ready states | ✗ | **Trigger:** guard-git refuses `Fnn: done` unless ROADMAP marks Fnn ✅ (or 🎛️). | S |
| V67 | L98 replace RESUME HERE + Doing, commit `F08: done` | ② | guard-git.mjs:169-184 (F72). | — |
| V68 | L98 then `/save` in the same turn | ✗ | **Trigger:** stop-plan-check sends back a turn with an `Fnn: done` commit whose HEAD isn't on origin. | S |
| V69 | L99 sprint done → offer a bug sweep if P0/P1 or several P2 | ✗ | **Trigger:** archive-sprint.mjs prints the open counts + the offer line. | S |
| V70 | L99 archive SPRINT.md (`Sprint NN done`) | ✗ | Script exists, calling it is remembered. **Trigger:** stop-plan-check sends back when every SPRINT feature is ✅ in ROADMAP but SPRINT.md still exists. | S |
| V71 | L101 never merge to main here | ② | guard-git.mjs:203-214. | — |

### sprint — `~/.claude/skills/sprint/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| P1 | L109 read PROJECT-FILES; GSD offer; no ROADMAP → message | ③ | Reading/routing. | — |
| P2 | L111-120 show the sprint in the short format | ③ | Display. | — |
| P3 | L121 ready feature fits → offer to pull it in | ③ | Judgement. | — |
| P4 | L124 finished SPRINT → archive-sprint.mjs | ✗ | Same trigger as V70. | S |
| P5 | L125 refresh ROADMAP states (ready rule) | ✗ | plan-lint only checks *started* items. **Trigger:** plan-lint flags ⏳ items whose needs are all ✅ ("should be 🟢"), and 🟢 items with unmet needs. | S |
| P6 | L125-126 candidates, pick 1–4, priority order, promote Later | ③ | Planning judgement. | — |
| P7 | L127 "show something" → list its contents first | ③ | Design judgement. | — |
| P8 | L128 3–8 tasks | ② | plan-lint.mjs:130-133. | — |
| P9 | L128 look at the code first; tasks name real files | ✗ | **Trigger:** plan-lint checks the path after a task's last ` — ` exists (when it looks like a path). | S |
| P10 | L128 scaffold / Dev Kit install / stand-in art / tuning last / framework-first | ③ | Planning judgement. | — |
| P11 | L129 feature changes GDD → "update GDD §X" task | ③ | Judgement. | — |
| P12 | L129 open P0/P1 bugs always go in as tasks | ✗ | **Trigger:** plan-lint warns when an open P0/P1 in BUGS.md isn't named in SPRINT.md. | S |
| P13 | L130 unknowns → a spike first | ③ | Judgement. | — |
| P14 | L131 show goal + what stays the same; tech choices decided and logged | ③ | Talk. | — |
| P15 | L131 task line format `- [ ] 🤖 1. …` | ② | plan-lint.mjs:135. | — |
| P16 | L131 sprint features 🔨 in ROADMAP | ② | plan-lint.mjs:138. | — |
| P17 | L131 update STATE (Sprint, Doing, RESUME), commit `Sprint NN: goal` | ✗ | **Trigger:** extend the F72 rule in guard-git: a `Sprint NN:` / `GDD:` / `Roadmap:` commit in a BMUZ project must include STATE.md (or STATE changed since its last such commit). | S |

(Section C "quick question" and the closing line are ③ display, folded into P2/P14.)

### discover — `~/.claude/skills/discover/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| R1 | L8 read PROJECT-FILES; no STATE → quick setup | ③ | Setup is a guided conversation. | — |
| R2 | L9 design partner, a few questions at a time | ③ | Manner. | — |
| R3 | L12-14 route: whole game / feature (research/<feature>.md + GDD summary) / itch | ③ | Judgement. | — |
| R4 | L18-21 references, rough experience targets, proto for hunches | ③ | Design work. | — |
| R5 | L14 not for now → ROADMAP Ideas with the date | ③ | Spotting it is judgement. | — |
| R6 | L24 commit `GDD: discover`; STATE Stage + RESUME | ✗ | Same trigger as P17 (stage commits carry STATE). | S |
| R7 | L25 hand-off line → /define | ② | handoff-check (card + Next). | — |

### define — `~/.claude/skills/define/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| F1 | L8 read PROJECT-FILES; setup; GSD | ③ | Reading. | — |
| F2 | L13-15 route: no GDD / from discover / complete | ③ | Judgement. | — |
| F3 | L18-21 gap walk: analyze, one gap map, one gap at a time, write + commit each, sketch/proto detours | ③ | It's a conversation. "Never a bulk list" is manner. | — |
| F4 | L21 STATE RESUME HERE names the next gap | ✗ | Same trigger as P17. | S |
| F5 | L24-26 three parts via stages/*.md; show the dependency tree before writing | ③ | Design work. | — |
| F6 | L26 every feature typed, scoped, `needs:` | ② / ✗ | Needs exist + graph agree: plan-lint.mjs:72-99 (②). Type emoji and scope present: unchecked. **Trigger:** plan-lint flags items with no type emoji or no `must:/should/could`. | S |
| F7 | L28 update `Current phase:`, commit `GDD: <part>`, ask "keep going?" | ③ | Low risk. | — |
| F8 | L31 big feature → new IDs in the right milestone | ② | plan-lint.mjs:66 (unique IDs). | — |
| F9 | L34-35 STATE + hand-off to /sprint | ② | handoff-check (card). STATE part = P17. | — |
| F10 | L36 ideas → Ideas | ③ | Judgement. | — |

### bug — `~/.claude/skills/bug/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| B1 | L8 create BUGS.md if missing | ③ | Trivial. | — |
| B2 | L17-24 report in the standard header format | ✗ | A malformed `### B…` header is silently not read (plan-reader readBugs), so the bug vanishes from counts and P0 gates. **Trigger:** plan-lint flags `### B` lines that don't parse. | S |
| B3 | L25 read the capture first; captures in .planning/bugs/ | ③ | Judgement. | — |
| B4 | L26-29 triage out loud; design change → /gdd | ③ | Focus judgement. | — |
| B5 | L30 commit `Bug B014: …` | ③ | Naming. | — |
| B6 | L33 P0 live → hotfix branch from main, /deliver as hotfix | ③ | Rare. guard-git allows `Fix B…` on main. | — |
| B7 | L34 reproduce first as a failing test in tests/ or e2e/ | ② (part) | plan-lint.mjs:152-154 refuses a fixed P0/P1 without `Guarded by:`. | — |
| B8 | (gap in B7) the `Guarded by:` file exists | ✗ | **Trigger:** plan-lint checks the named test file exists. | S |
| B9 | L35-37 root cause, check archive for returns, research physics bugs | ③ | Debugging judgement. | — |
| B10 | L38 verify: new test + whole suite + build; P0/P1 → Muzzy confirms | ✗ | **Trigger:** guard-git: a `Fix B\d+:` commit needs the green fingerprint (`.git/bmuz-last-green`) to match the code being committed, or it runs check:fast. Muzzy's confirmation stays ③. | S |
| B11 | L38 already broken before → log separately | ③ | Judgement. | — |
| B12 | L39 status `fixed` + commit + Guarded by; `verified` on his OK; Don't re-break line | ② | plan-lint status/section + Guarded-by checks. The Don't-re-break line is ③. | — |
| B13 | (format) Open: count line right | ② | plan-lint.mjs:156-164. Not counted separately. | — |
| B14 | L43-50 the list format | ③ | Display. | — |
| B15 | L53 sweep order P0 → P1 → P2, group by cause | ③ | Judgement. | — |
| B16 | (P-levels L11) P0 blocks /deliver | ② | live-push.mjs:338-343 (see D12 gap). | — |

### ppp — `~/.claude/skills/ppp/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| Q1 | L10 build ppp.html; make sure it's gitignored | ① | plan-lint.mjs:187-198 rebuilds after plan edits. save.mjs:44-57 adds the ignore line. | — |
| Q2 | L11 publish to the STATE link; first time → write the link into Key facts | ② | stop-plan-check.mjs:62-71 sends back an unpublished rebuild. | — |
| Q3 | L11 pass every sketch as `files` | ✗ | stop-plan-check counts any ppp.html publish as done. New/changed sketch files don't mark the planner stale. **Trigger:** plan-lint (or a PostToolUse on `.planning/research/sketches/*.html`) touches `bmuz-ppp-rebuilt`, and stop-plan-check checks the publish's `files` list against the sketch folder. | S |
| Q4 | L12 open it in his browser (`action: open`) | ③ | The hook can't see the browser; one call. | — |
| Q5 | L13 one line about what changed | ③ | Talk. | — |

### play — `~/.claude/skills/play/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| Y1 | L9 find the run command; first time → write command + port into Key facts | ✗ | **Trigger:** `play.mjs` (new) reads Key facts. Missing → it falls back to package.json and prints the line to add. | (M) |
| Y2 | L10 already running? curl, never a second copy | ✗ | play.mjs. | M |
| Y3 | L11 start in the background with `--host`; companion servers; wrangler with its own `--persist-to` + port | ✗ | play.mjs (these are exactly the fragile multi-step bits scripts are for). | (M) |
| Y4 | L12 wait until it answers; quick console check | ✗ | play.mjs. | (M) |
| Y5 | L15-21 both link kinds, labelled; friends only get LIVE | ✗ | play.mjs prints the block. A /play turn often edits nothing, so handoff-check doesn't fire. | (M) |
| Y6 | L22 LAN IP from ipconfig; tunnel when needed | ✗ | play.mjs. | (M) |
| Y7 | L25-26 offer to watch the console | ③ | Offer. | — |
| Y8 | L29 stop with stop-servers.mjs | ✗ | Same trigger as V53. | S |
| Y9 | L32-34 what he sees → /bug, tweak, game-feel, mda playtest | ③ | Routing. | — |

### sketch — `~/.claude/skills/sketch/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| K1 | L15 the question in one line; his two endpoints | ③ | Talk. | — |
| K2 | L16 lab → shared LAB-BRIEF first | ③ | Judgement. | — |
| K3 | L17-23 start from the starter; keep `<title>`, meta description, 5–8 knobs with help lines, 3 presets, Copy values | ✗ | **Trigger:** a PostToolUse sketch-lint on `.planning/research/sketches/*.html` checks the title, the meta description and the "Copy values for Claude" button exist, and the presets block is there. | S |
| K4 | L24 check it yourself: 2 sizes, every knob visibly moves something, presets, console, fps | ✗ | **Trigger:** `sketch-check.mjs` (Playwright): loads at 1280×800 + 390×844, console clean. It moves each knob min/mid/max and compares canvas pixels (also covers lesson L31). | M |
| K5 | L25 commit, then /ppp with the sketch as a `files` entry | ✗ | Same trigger as Q3. | (S) |
| K6 | L26 hand-off: what to try, ask for Copy values | ② | handoff-check card. | — |
| K7 | L27 his answer → picks.json, defaults, ROADMAP + GDD decision, tick, /ppp | ③ | Mostly judgement. The republish is ② once plan files change. | — |
| K8 | L28 fix the cause, not a new knob | ③ | Judgement. | — |
| K9 | L31-35 lessons (measure knob range, shared knob names, fix cause, shader hash) | ③ | Craft. Range measuring → K4. | — |
| K10 | L24 Playwright's Chromium, never Muzzy's Chrome | ② | settings.json `ask: mcp__claude-in-chrome` (permission prompt). Counted with K6's ②. | — |

### checkup — `~/.claude/skills/checkup/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| C1 | L8 session start says due → offer in one line; not mid-game | ① | session-start.sh:9-15 prints it. The offer is Claude's. | — |
| C2 | L11 run checkup.sh | ③ | It *is* the skill. | — |
| C3 | L14-28 judge each section (upstream, cards, use, wiring, plugins, UI kit, sync, safety kit, news) | ③ | Judgement by design. | — |
| C4 | L27 skill tests only after Muzzy's yes | ② | test-skills.mjs:17-20 refuses without `--muzzy-said-yes`. Weak: Claude can pass the flag itself. | — |
| C5 | L41 nothing installed/retired without his OK | ③ | Consent. | — |
| C6 | L44 write today's date to `last-checkup` | ✗ | If forgotten, the "due" nag repeats daily. **Trigger:** `checkup.sh --done` writes the date (and does C8/C9). | S |
| C7 | L45 update `checked` dates in sources.json | ③ | Per item. | — |
| C8 | L46 save the report to reviews/checkups/<date>.md | ✗ | `checkup.sh --done` refuses until the report file exists. | (S) |
| C9 | L47 sync to ~/.claude-config, commit, push | ✗ | `checkup.sh --done` runs `config-sync.sh push`. | (S) |

### bmuz — `~/.claude/skills/bmuz/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| M1 | L8 print the menu + one suggestion from RESUME HERE | ③ | Display. | — |
| M2 | L37-45 specialists grouped; unlisted → Other | ③ | Display. | — |
| M3 | L48 Dev Kit table | ③ | Display. | — |

### roadmap — `~/.claude/skills/roadmap/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| O1 | L8 read; GSD offer; no ROADMAP → message | ③ | Routing. | — |
| O2 | L11 refresh states with the ready rule | ✗ | Same as P5. | S |
| O3 | L11-21 compact display, % per milestone | ③ | Display (build-ppp computes the same). | — |
| O4 | L23 1–3 lines of insight | ③ | Judgement. | — |
| O5 | L26 add a feature: next ID, type, scope, needs | ② / ✗ | Unique ID + needs exist: plan-lint (②). Type/scope: F6 trigger. | — |
| O6 | L27 never place a feature before what it needs | ② | plan-lint.mjs:79-82. | — |
| O7 | L28 cut → Won't in GDD; show what depended on it | ② (part) | Dangling needs are flagged (plan-lint.mjs:76). The GDD reason is ③. | — |
| O8 | L29 scope creep past ~1.5× | ✗ | **Trigger:** record each milestone's item count when it becomes `← current`. plan-lint warns past 1.5×. | M |
| O9 | L30-31 ranking; three questions before adding | ③ | Judgement. | — |
| O10 | L32 keep each Mermaid graph in sync | ② | plan-lint.mjs:87-99. | — |
| O11 | L32 commit `Roadmap: …` | ③ | Naming. | — |

### gdd — `~/.claude/skills/gdd/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| G1 | L8 read GDD; PRD → conversion | ③ | Reading. | — |
| G2 | L21 every line from the docs, never invent; flag stale sections | ③ | Honesty, not checkable. | — |
| G3 | L23 whole-game map as an artifact, republished to the same URL | ③ | Occasional. | — |
| G4 | L29-33 what-if: changes, MDA trace, honest take, edit + ROADMAP + commit, big → /define, not now → Ideas | ③ | Design conversation. ROADMAP edits are plan-linted. | — |

### tdd — `~/.claude/skills/tdd/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| T1 | L8 no TDD → offer a draft from the template, commit | ③ | Offer. | — |
| T2 | L22 doc vs code disagree → say so, fix the doc | ③ | Judgement. | — |
| T3 | L29-32 weigh his idea; he decides; Decisions log `Proposed by: Muzzy`; not adopted still logged | ③ | Conversation. | — |
| T4 | L35 /develop updates TDD for a new data file / Dev Kit tool | ✗ | Same trigger as V30. | S |
| T5 | L35 /deliver ticks compliance | ③ | = D14. | — |
| T6 | L36 real build choices → Decisions log | ③ | Judgement. | — |

### sync — `~/.claude/skills/sync/SKILL.md`

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| Y1 | L11 config-sync.sh status (pulls first) | ① | config-sync.sh:137-147. | — |
| Y2 | L12 INCOMING → setup.sh, status again | ✗ | **Trigger:** config-sync.sh status runs setup.sh itself when INCOMING arrives and nothing local changed. | S |
| Y3 | L13 CHANGED → ask, then push; both changed → ask which | ③ | ⚠ This contradicts /save §3b ("push without asking"). One rule should win (Muzzy said "always sync"). | — |
| Y4 | L14 script missing → by hand | ③ | Rare. | — |
| Y5 | L15 this machine's to-do from HUB.md, one at a time | ✗ | Nothing surfaces it. **Trigger:** session-start.sh prints this machine's "📌 Machine to-do" section (PC = Muzzy, laptop = joebr). | S |
| Y6 | L16 one-line summary | ③ | Talk. | — |

### PROJECT-FILES.md

| # | Line | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| PF1 | L17 nothing else in `.planning/` | ✗ | **Trigger:** plan-lint lists unexpected top-level files in `.planning/`. | S |
| PF2 | L27-29 types / states / ready rule | ② / ✗ | Started-before-needs: plan-lint (②). Ready refresh: P5 (✗). | S |
| PF3 | L30 sprint rule | ② | plan-lint.mjs:80-82. | — |
| PF4 | L31 ❓ 1–2 tasks | ② | plan-lint.mjs:130-133. | — |
| PF5 | L31 ❓ ✅ only when Muzzy answers | ③ | His answer. | — |
| PF6 | L32 every feature has a scope | ✗ | = F6. | (S) |
| PF7 | L33 owners 🤖/🙋 | ② | plan-lint.mjs:135. | — |
| PF8 | L36 PPP drawn, gitignored, republished | ① / ② | build-ppp + save.mjs:44-57 (①), stop-plan-check (②). Note: text says "/save republishes". Really it's the Stop hook after any plan edit. | — |
| PF9 | L37 PPP wording for a non-engineer | ③ | Writing quality. Muzzy reviews. | — |
| PF10 | L38 unapproved feature at sprint end → `## Carried to sprint NN` | ② | archive-sprint.mjs:354-361 refuses while a `## Fnn` feature isn't done. Its message could also name the carry-over option (S tweak). | — |
| PF11 | L62 IDs permanent + unique; Mermaid in sync | ② | plan-lint.mjs:66, :87-99. | — |
| PF12 | L76 3–8 tasks | ② | plan-lint. | — |
| PF13 | L76 tasks name real files | ✗ | = P9. | (S) |
| PF14 | L76 finished → archive | ✗ | = V70. | (S) |
| PF15 | L89-90 bug statuses in the right section; Guarded by for P0/P1 | ② | plan-lint.mjs:150-154. | — |
| PF16 | L90 old fixed bugs → archive/bugs.md after each release | ✗ | **Trigger:** release.mjs moves `## Fixed` entries older than the previous tag into archive/bugs.md. | S |
| PF17 | L102 credits: all listed, no 🔴, 🟡 shown | ② | check:framework (when it runs). | — |
| PF18 | L112 Fast before every commit | ② (part) | Type check per commit (commit-typecheck). Full check:fast only at /develop hand-back. | — |
| PF19 | L113, 117-118 Area for helpers; after a merge Fast vs Area | ③ | Orchestration. | — |
| PF20 | L114, 119 Full once per feature; record it | ② | guard-git F75. At /deliver: D11 (✗). | — |
| PF21 | L116 GitHub re-checks; /deliver refuses red | ② | checks-gate.mjs + release.mjs:164 (hole: D26). | — |
| PF22 | L120 code-review per feature + security-review at deliver | ② / ✗ | Per feature ② (F75). Security review = D19 (✗). | — |
| PF23 | L121 never hand Muzzy a command — run it, link results | ③ | Manner. | — |
| PF24 | L123-133 STATE ≤120 lines, RESUME 2–5 lines, Key facts ~40, Log 10 | ② | plan-lint.mjs:167-185 + save.mjs Log trim (①). "Replace, never append" is ③ (length catches the worst). | — |

### CLAUDE.md — only the always / never / every rules

| # | Rule | Kind | Evidence or proposed trigger | Size |
|---|---|---|---|---|
| CM1 | Explain jargon in plain words the first time | ③ | Writing. | — |
| CM2 | Targeted, minimal changes | ③ | Judgement. | — |
| CM3 | Terminal commands ready to copy/paste | ③ | Writing. | — |
| CM4 | New tool walkthroughs: ONE step at a time | ③ | Conversation. | — |
| CM5 | Never put code projects in Google Drive | ③ | Rare. | — |
| CM6 | End every hand-off with the next command | ② | handoff-check.mjs:158-159. | — |
| CM7 | Never build a feature before what it `needs:` | ② | plan-lint.mjs:79-82. | — |
| CM8 | Same intention → same motion | ③ | Design taste. | — |
| CM9 | Breathing room in every card; fixed-size cards during a sequence | ✗ | **Trigger:** a ui-kit uiProblems check in check:framework: a child within N px of its card's edge, and a card whose size changes between a sequence's first and last frame. | M |
| CM10 | Mid-feature bugs logged unless P0/blocking/2-minute | ③ | Focus judgement. | — |
| CM11 | Tweakable values in `content/`, never hardcoded | ② (part) / ✗ | check-ui-edit catches UI literals (colours etc.). Gameplay numbers: **Trigger:** a lint rule in the games' ESLint config (no numeric literals in `src/game/**` beyond 0/1/-1 outside content readers), surfaced by lint-edit. | M |
| CM12 | Ideas → ROADMAP Ideas, say "Noted" | ③ | Spotting. | — |
| CM13 | Small tweaks: just do them | ③ | Judgement. | — |
| CM14 | Old GSD projects converted the first time | ② (nudge) | session-start.sh:99-102. | — |
| CM15 | Undo: never `reset --hard`, never force-push, only merged branches deleted | ② | guard-git.mjs:33-48, :108-138 (refused). | — |
| CM16 | Machine to-do first | ✗ | = Y5 (session-start prints it). | S |
| CM17 | SYNC FAILED → explain and stop | ① / ② | session-start.sh:41-58 pulls and prints the instruction. | — |
| CM18 | Session end → /save | ② (nudge) | session-moments.mjs:208-210. stop-unsaved.mjs (refusal) exists but isn't registered yet. | — |
| CM19 | Project missing on this machine → clone | ③ | Rare. | — |
| CM20 | Anything a project needs goes in STATE, not memory | ② (nudge) | session-moments.mjs:213-217 at 80/90%. | — |
| CM21 | One work branch per delivery; merged only by /deliver | ② | guard-git.mjs:153-165, :203-214. | — |
| CM22 | A value Muzzy saved is a decision | ③ | Judgement. | — |
| CM23 | Say "the game you played on <date>", never "your game" | ✗ | **Trigger:** handoff-check flags the phrase "your game". | S |
| CM24 | Every hand-off = the card | ② | handoff-check.mjs. | — |
| CM25 | Sprint reports open with a header (sprint + goal, each feature's intent, built vs measured) | ✗ / ② | "Built vs measured" is in **Done:** (②). The header isn't. **Trigger:** handoff-check requires a `Sprint NN —` line when the turn ran archive-sprint, or committed `Sprint NN done`. | S |
| CM26 | Progress updates: bar + steps + time left + posted clock time | ② | handoff-check.mjs:179-181 accepts only that exact form for unfinished work. | — |
| CM27 | Re-post the bar on every completed step | ③ | Can't be counted reliably mid-turn. | — |
| CM28 | Verify your work; visual work → Playwright screenshot | ② / ✗ | check:fast at hand-back (②). Screenshot = V56 (✗). | M |
| CM29 | Finish tasks for real; audit content | ③ | Judgement. | — |
| CM30 | Fix root causes, not symptoms | ③ | Judgement. | — |
| CM31 | Check logic already exists before writing | ③ | Judgement. | — |
| CM32 | R3F: never React state for per-frame updates | ✗ | **Trigger:** an ESLint rule (no `set*` calls inside `useFrame`) in the game template, surfaced by lint-edit. | M |
| CM33 | Plain-English errors | ③ | Writing. | — |
| CM34 | Autonomous: commit after every task, /save after every feature | ② / ✗ | Task commits: stop-plan-check (②). Save after a feature: V68 (✗). | S |
| CM35 | Autonomous: stuck 3× → `BLOCKED:` in STATE | ③ | Judgement. | — |
| CM36 | Stop before anything public or hard to undo | ② | guard-git (merge to main) + live-push (going live). | — |
| CM37 | Lessons land the same session; look-back at each milestone | ② **broken** / ③ | Look-back = D47 (broken path). Per-session lessons are judgement. | S |
| CM38 | X.Y.Z.B versioning | ① | save.mjs (B), release.mjs (X/Y/Z). | — |
| CM39 | Never use Gmail tools | ① | settings.json `deny: mcp__claude_ai_Gmail`. | — |
| CM40 | gws: pick the right Google account | ③ | Judgement per file. | — |

---

## 3. Already broken: the text says it's automatic, the code doesn't do it

1. **The look-back check never fires on the real release path.** /deliver §7c, CLAUDE.md and stop-plan-check's own header
   say a milestone without a look-back gets sent back. But the hook only spots `git tag v…0` or `git commit -m "Release
   v…0"` typed in the shell (stop-plan-check.mjs:33-39). /deliver §5 tells Claude to use release.mjs, which does both
   inside its own process (release.mjs:190, :196). Result: no send-back. The unit test (test-hooks.mjs:592-597) only tries
   the hand-typed form.
2. **Commits made by save.mjs skip every commit hook.** HOOKS.md #3 ("before `git commit` with TypeScript → type check"),
   #11, #14 (F72/F75 `F08: done` gates) and #16 only see `git commit` typed in the shell. save.mjs:104 (and release.mjs,
   archive-sprint) commit in a child process. So `/save` can push a type error. And `save.mjs "F08: done"` would get past
   the STATE / review / full-check gate entirely. save.mjs repeats only the secrets check.
3. **release.mjs's "green on GitHub" check can be skipped silently.** It only checks when HEAD is a merge commit
   (release.mjs:164, `HEAD^2`). A fast-forward merge (forgetting `--no-ff`), or any commit on main after the merge,
   means no check at all, not even a warning.
4. **"Hooks refuse going live with an open P0" covers only deploying projects.** /deliver §2 and HOOKS #12 read as
   universal. live-push.mjs only runs the P0 check when a push goes to a branch a deploy workflow publishes from, or a
   listed deploy command runs. The framework, a no-host release, or a deploy started by tag/manual workflow aren't covered.
5. **The /develop check:fast Stop hook only exists while the /develop skill is loaded** (frontmatter, not settings.json).
   When "go" / "keep going" is handled without invoking the skill (after a compaction, say), the check isn't active. HOOKS
   #5 is accurate in its wording, but the routing makes it easy to fall outside it.
6. **/save §4's example says the other machine "switches automatically."** session-start.sh:62-65 only tells Claude to
   switch branches. Claude still does it (a nudge, not automatic).
7. **PROJECT-FILES L36 "/save republishes" the planner.** save.mjs never touches the planner. The Stop hook does, after
   Edit-tool plan edits. Also, save.mjs's own Log trim isn't an Edit, so the page isn't rebuilt and shows the old Log.
8. **The context checkpoint "after each commit" (HOOKS #9)** matches only `git … commit` in the shell, so saves and
   releases (the commits autonomous runs make most) don't trigger it.
9. **checkup.sh §4 thinks ppp, sketch and sync are specialist skills.** Its BMUZ list (checkup.sh:199) predates them, so
   they're judged on "who calls it" like specialists.
10. **Stop-hook checks only ask once.** handoff-check and stop-plan-check exit early on `stop_hook_active`, so a second
    miss ends the turn anyway. The table calls them ②, but they're "sent back once", not "refused until done".
    (stop-unsaved's "up to 3 times" is a better pattern.)
11. **Two rules disagree.** /sync asks before pushing the setup (L13). /save pushes it without asking (L34, Muzzy's
    2026-10-14 rule). Pick one.
12. **Stale skill text:** /develop L94 asks Claude to delete `.playwright-mcp/`. stop-cleanup.mjs does it every turn now
    (harmless, but it's remembered text for a solved thing).
13. **In flight, not wired:** `hooks/stop-unsaved.mjs` appeared during this audit (12:01, F80 work). It isn't in
    settings.json, so it doesn't run yet.

---

## 4. What a real indie studio does that BMUZ doesn't (yet)

A small (≈5-person) indie studio, with each role's standard routines (SOPs). Marks: **✓** covered and automatic (named) ·
**~** covered, but remembered-only or partial · **✗** missing. For every ~ and ✗ there's the smallest automatic version,
with a size.

### Producer / project manager

| SOP | Mark | Evidence / smallest automatic version | Size |
|---|---|---|---|
| Plan work in milestones with dependencies | ✓ | ROADMAP + plan-lint (needs, graph). | — |
| Sprint planning (1–4 features, task owners) | ✓ | plan-lint task counts/owners. | — |
| Every request shows up in the plan | ✓ | stop-plan-check (SPRINT task line). | — |
| **Schedule: dates, and noticing slips** | ✗ | Nothing is dated, so nothing can slip. **Smallest:** SPRINT.md `Started <date>` exists → session-start prints "Sprint 07 is 9 days old (last 3 averaged 4)". A milestone `target: <date>` → "alpha target in 5 days, musts 6/9". | S |
| Scope-creep watch | ~ | /roadmap 1.5× rule, remembered (O8). **Smallest:** plan-lint records a milestone's size when it becomes current, and warns past 1.5×. | M |
| Ready-state upkeep | ~ | Remembered (P5). **Smallest:** plan-lint flags ⏳ items that are ready. | S |
| Stalled-feature watch ("in tuning for weeks") | ~ | /develop L29, remembered. **Smallest:** session-start prints any 🎛️/🔨 feature untouched by commits for 7+ days. | S |
| Retro after every sprint (not only milestones) | ~ | Look-back only at milestones (and its trigger is broken, §3 #1). **Smallest:** archive-sprint asks for a 3-line "went well / went wrong / change" block in SPRINT Notes and refuses without it. | S |
| Status report for the boss/team | ✓ | /ppp planner page (rebuilt by plan-lint, republish enforced). | — |
| Decision log | ~ | TDD Decisions, remembered. **Smallest:** a ❓ feature turning ✅ requires a `decided:` line (plan-lint). | S |
| Risk register | ~ | TDD "Risks", rarely refreshed. **Smallest:** /sprint B prints the TDD Risks list when planning (a script line in a sprint-plan helper). | S |
| Muzzy's own to-dos visible | ~ | 🙋 tasks and `Muzzy:` lines exist, but only when asked. **Smallest:** session-start prints open 🙋 tasks + `Ask Muzzy:` count. | S |

### QA lead

| SOP | Mark | Evidence / smallest automatic version | Size |
|---|---|---|---|
| Automated test suite on every change | ✓ | commit-typecheck, stop-check-fast, GitHub Checks workflow. | — |
| Regression guard per fixed bug | ✓ | plan-lint "Guarded by" for P0/P1. ~ for P2/P3 and "the test file exists" (B8). | S |
| Smoke test before release | ✓ | smoke-pass.mjs + live-push. | — |
| **Test plan per feature** | ~ | `Check:` line in SPRINT, unchecked. **Smallest:** plan-lint requires `Check:` under every `## Fnn` heading. guard-git's `Fnn: done` gate asks for a `Checked:` line in Notes. | S |
| **Device coverage (real phone, sizes)** | ~ | Sizes: check:framework. A real-device pass is a 🙋 task by memory. **Smallest:** release.mjs (stage releases) refuses without a `.planning/archive/release-checks/<stage>.md` that names devices tried. | S |
| Bug triage with time limits (P0 now, P1 this sprint) | ~ | P0 blocks going live (✓). "P1 this sprint" is unchecked. **Smallest:** plan-lint warns when an open P1 is older than the current sprint's start and isn't a SPRINT task (P12). | S |
| Full regression pass before release | ~ | Full check by feature (F75), at deliver remembered (D11). **Smallest:** release.mjs refuses when code changed since `Last full check:`. | S |
| Exploratory/playtest sessions logged | ✗ | **Smallest:** `/play` watch mode writes `.planning/research/playtests/<date>.md`. stop-plan-check asks for one before a stage release. | M |
| Fix verification by the reporter | ~ | `verified` status for P0/P1 is Muzzy's. Nothing chases it. **Smallest:** session-start prints "3 fixes waiting for your check: B009, B010…". | S |

### Release / build engineer

| SOP | Mark | Evidence / smallest automatic version | Size |
|---|---|---|---|
| Versioning | ✓ | save.mjs (build), release.mjs (X.Y.Z). | — |
| Tagging, release commit | ✓ | release.mjs. | — |
| CI green before merge/release | ✓ / ~ | checks-gate + release.mjs, with the fast-forward hole (§3 #3). **Smallest:** release.mjs finds the merged branch via `--merges`. | S |
| **Release checklist run in order** | ~ | The /deliver skill text. Many steps remembered (§2 deliver). **Smallest:** release.mjs grows the gates in Top 10 #3, #4, #6, #10. | M |
| **Changelog / patch notes kept** | ~ | One `history` line in version.json + bullets in chat. **Smallest:** release.mjs appends the bullets to `CHANGELOG.md` (it needs a `--notes` file) and refuses without them. | S |
| **Rollback plan** | ✗ | No recipe says how to go back. **Smallest:** a `rollback.mjs <tag>` (revert-merge to the last good tag, then the normal smoke → push path) + one "Rollback" section in each release recipe. | M |
| Live verification after deploy | ✗ | All remembered (D43–D50). **Smallest:** live-check.mjs + `.planning/live-pass` + Stop send-back. | M |
| Reproducible builds / lockfile | ~ | package-lock synced by release.mjs. CI uses `npm ci`? Not verified. **Smallest:** checkup §7 checks `npm ci` in checks.yml. | S |
| Hotfix path | ~ | /bug B6, remembered. **Smallest:** release.mjs accepts `hotfix/*` merged branches explicitly and labels them. | S |
| Cleanup of branches/workspaces | ~ | save.mjs runs cleanup ✓. Deliver ✗ (D46). Merged-branch delete ✗ (D29). | S |

### Tech lead / code reviewer

| SOP | Mark | Evidence / smallest automatic version | Size |
|---|---|---|---|
| Code review per feature | ✓ | guard-git F75 (`Reviewed through:`). | — |
| Review of everything before release | ~ | D20. **Smallest:** release.mjs refuses code after `Reviewed through:`. | S |
| Security review before release | ✗ (remembered) | D19. **Smallest:** `Security reviewed:` line + release.mjs gate. | M |
| Lint + type check on every change | ✓ | lint-edit, commit-typecheck (save.mjs bypass, §3 #2). | S |
| Architecture docs kept true | ~ | TDD by memory (V30/T4). **Smallest:** new `content/` file or new top-level `src/` folder without a TDD change during the feature → send back once. | S |
| Dependency updates / vulnerability audit | ✗ | **Smallest:** checkup.sh runs `npm audit --omit=dev` + `npm outdated` per game, monthly, and prints highs. | S |
| Performance budget | ~ | `optimize` skill at beta/1.0, remembered. **Smallest:** a `perf` line in check:full (bundle size vs a budget in content/ or Key facts) that fails past the budget. | M |
| Coding standards (R3F refs, no hardcoding) | ~ | Written in CLAUDE.md only (CM11, CM32). **Smallest:** two ESLint rules in the game template, surfaced by lint-edit. | M |
| Framework kept shared, not forked | ✓ | guard-edits (kit copies), session-start update notice. | — |

### Art director

| SOP | Mark | Evidence / smallest automatic version | Size |
|---|---|---|---|
| One visual style per game | ✓ | game-ui style.json + check-ui-edit. | — |
| UI consistency / spacing rules | ~ | check:framework (overlap, cut-off, 44 px). Breathing room / fixed card size = CLAUDE.md only (CM9). **Smallest:** uiProblems edge-padding + size-stable checks. | M |
| Asset naming, sizes, catalogue | ~ | organize-assets skill, remembered. **Smallest:** check:fast step "every file in public/ is in credits.json and under N KB (images)" (partly in check:framework credits). | S |
| Placeholder → final art tracking | ~ | `(stand-in)` tasks exist. Nothing lists what's still a stand-in at release. **Smallest:** release.mjs stage releases print open `(stand-in)` items; beta+ refuses. | S |
| Visual review of every UI change | ~ | Screenshots by memory (V56). **Smallest:** the screenshot Stop hook. | M |

### Audio

| SOP | Mark | Evidence / smallest automatic version | Size |
|---|---|---|---|
| Sound for every key action (feel tiers) | ~ | audio-setup / game-feel skills, by memory. **Smallest:** a Dev Kit/check:framework report: actions in feel.json with no paired sound. | M |
| Loudness normalised, voice limits | ~ | audio module does it when installed. Nothing checks new files. **Smallest:** a check:fast step measuring peak/LUFS of `public/audio/*` vs a target. | M |
| Mute/volume settings present | ~ | game-ui settings screen by memory. **Smallest:** check:framework asserts a volume setting exists when the audio module is installed. | S |
| Licences for music/SFX | ✓ | credits.json via check:framework. | — |

### UX / accessibility

| SOP | Mark | Evidence / smallest automatic version | Size |
|---|---|---|---|
| Touch targets, text cut-off, every screen size | ✓ | check:framework (UI kit). | — |
| Colour-blind safe, reduce motion, contrast | ~ | accessibility-check skill at beta/1.0, by memory. reduce-motion is in game-feel. **Smallest:** check:framework adds a contrast check on kit text + "a reduce-motion setting exists". | M |
| First-time player test (onboarding) | ✗ | **Smallest:** a stage-release checklist line in `release-checks/<stage>.md`: "someone new played without help", refused if missing (same gate as device coverage). | S |
| Readability on a phone | ✓ / ~ | check:framework sizes ✓. Real-phone look is a 🙋 task. | — |

### Community / marketing

| SOP | Mark | Evidence / smallest automatic version | Size |
|---|---|---|---|
| Patch notes players can read | ~ | /deliver writes bullets in chat ("ready to paste into itch"). **Smallest:** release.mjs writes them to CHANGELOG.md + `.planning/archive/releases/vX.Y.Z.md`, ready to post. | S |
| Store page / itch page kept current (screens, description) | ✗ | **Smallest:** for a stage release, release.mjs refuses unless `store/` has screenshots newer than the last stage tag (or Key facts says `Store page: none`). | S |
| Devlog / social cadence | ✗ | **Smallest:** session-start prints "last devlog: 23 days ago" from a `Devlog:` date in Key facts (an opt-in reminder only). | S |
| Playtest recruiting / feedback form | ✗ | **Smallest:** a template feedback link in the release hand-off for stage releases (handoff-check requires it when a stage tag was made). | S |
| Press kit | ✗ | 1.0 only. **Smallest:** a 1.0 release-checks line. | S |

### Legal / compliance

| SOP | Mark | Evidence / smallest automatic version | Size |
|---|---|---|---|
| Asset licences | ✓ | credits.json + check:framework. | — |
| Secrets never committed | ✓ | guard-git + save.mjs. | — |
| Privacy policy / data use when online, ads, accounts | ~ | TDD §7 checklist, ticked by memory (D14). **Smallest:** release.mjs stage releases refuse while §7 has unticked lines marked required for the Key-facts platform. | S |
| Game name / trademark check | ✗ | **Smallest:** a /define build-plan checklist line + a 1.0 release-checks line. | S |
| Store age rating / content questionnaire | ✗ | **Smallest:** 1.0/app-store release-checks line (refused if missing). | S |
| Open-source licences of code dependencies | ✗ | **Smallest:** checkup.sh runs a licence summary (`npx license-checker --summary`, if present) per game and flags GPL in a shipping game. | S |

### Localization

| SOP | Mark | Evidence / smallest automatic version | Size |
|---|---|---|---|
| All player text in one file (externalized) | ~ | externalize-text skill, by memory. **Smallest:** a lint-edit rule: string literals in JSX text in `src/` → "move to content/text/en.json" (games that opted in). | M |
| Text fits when translated (long strings) | ✗ | **Smallest:** check:framework renders with a +40% "pseudo-locale" and reuses the cut-off check. | M |
| Language choice in settings | ~ | localize skill. Only relevant once there's a second language: ③ until then. | — |

### Analytics / live-ops

| SOP | Mark | Evidence / smallest automatic version | Size |
|---|---|---|---|
| Know if the live game is up | ✗ | **Smallest:** session-start does a 3-second `curl` of STATE's Live URL and prints "live site is DOWN" only on failure. | S |
| Know if players crash (error reports) | ✗ | **Smallest:** a framework module piece: window.onerror → a free endpoint (Cloudflare worker already used) writes counts. session-start prints new errors since the last session. | L |
| Basic play counts / where players quit | ✗ | Opt-in, privacy-sensitive (ties to §7). **Smallest:** the same worker counts "session start / round end". The planner shows the trend. | L |
| Online server health (rooms) | ✗ | **Smallest:** live-check.mjs also pings the party server's health URL when Key facts lists one. | S |
| Old saves keep working after an update | ~ | /develop L53, by memory. **Smallest:** a check:fast test template that loads saved fixtures from every past release (`tests/saves/*.json`). | M |

### Ranked: what would hurt a solo designer most if it stayed missing

Ranked by how bad it is when it goes wrong for a non-engineer who won't know to look.

| Rank | Gap | Why it hurts | Smallest automatic version | Size |
|---|---|---|---|---|
| 1 | **Live verification + "is the live site up"** | A broken live build is invisible to Muzzy until a friend tells him. | live-check.mjs after deploy + a session-start curl of the Live URL. | M + S |
| 2 | **Rollback** | When a release breaks, he has no way back and doesn't know the git to do it. | rollback.mjs `<tag>` + a recipe section. | M |
| 3 | **The full release checklist enforced (release.mjs gates)** | /deliver is the longest remembered list; a skipped review or check reaches players. | Top 10 #3, #4, #6, #10 in release.mjs. | M |
| 4 | **Look-back trigger fixed + a mini retro per sprint** | Without it, mistakes repeat (Muzzy's #1 complaint about cost). | Fix stop-plan-check (S) + archive-sprint asks for 3 lines (S). | S |
| 5 | **Schedule visibility (sprint age, milestone target)** | Solo projects drift without anyone noticing. | session-start prints sprint age + days to target. | S |
| 6 | **Crash reports from players** | Phone-only crashes never reach Claude. | error-report worker module. | L |
| 7 | **Device / first-player / store checks at stage releases** | "Works on my PC" ships to an alpha. | `release-checks/<stage>.md` gate in release.mjs. | S |
| 8 | **Dependency + security audit** | Vulnerable or abandoned packages go unseen for months. | checkup.sh `npm audit` / `npm outdated` per game. | S |
| 9 | **Patch notes / changelog kept as a file** | Players and itch followers never hear what changed. | release.mjs writes CHANGELOG.md. | S |
| 10 | **Old saves keep working** | An update that wipes progress loses players for good. | saved-fixture test template. | M |
| 11 | **Fixes waiting for his check, 🙋 tasks surfaced at session start** | Things sit unverified because nobody reminds him. | session-start prints them. | S |
| 12 | **Accessibility + contrast in check:framework** | Colour-blind/motion-sensitive players are lost quietly. | contrast + reduce-motion checks. | M |
| 13 | **Privacy / compliance gate for online or store releases** | A store rejection or legal exposure he can't foresee. | release.mjs §7 gate per platform. | S |
| 14 | **Coding standards as lint rules** (no hardcoding, R3F refs) | Tuning breaks and slow frames creep in. | Two ESLint rules via lint-edit. | M |
| 15 | **Localization readiness** | Only matters at translation time, but costly to retrofit. | text lint + pseudo-locale check. | M |
| 16 | **Store page / devlog / press kit reminders** | Visibility, not correctness: lowest harm. | release-checks lines + an opt-in devlog nudge. | S |
