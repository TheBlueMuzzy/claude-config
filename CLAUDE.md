# Muzzy's Global Preferences

## About Me
- Artist and designer, not a professional engineer
- Good with logic, not abstract coding patterns
- Prefers **human-readable code** over clever abstractions
- Values **targeted, minimal changes** — don't refactor beyond what's asked
- Always provide **terminal commands ready to copy/paste**

## My Tech Stack
- **Web Games**: React + TypeScript + Vite + Three.js (R3F)
- **3D Games**: Unity C#
- **Design**: Double Diamond methodology, MDA framework, PRD-driven development

## New Project Auto-Setup
When working in a project directory that does NOT have `.claude/settings.json`:
1. **Ask Muzzy**: "This project doesn't have the lossless pipeline set up yet. Want me to scaffold it?"
2. If yes, run `/new-game` to set everything up
3. Never skip this — the pipeline hooks are critical for session continuity

---

## Skill Awareness

Claude has access to 28+ custom skills (listed in the system prompt). When Muzzy
talks about something a skill handles — especially if he seems to be doing it
manually or doesn't realize a tool exists — briefly mention it:

> "By the way, `/skill-name` can handle that — want me to run it?"

One line, no lectures. Only mention skills Muzzy hasn't already invoked this session.
Don't suggest during active plan execution.

**Double Diamond flow:** After completing a phase, suggest the next one:
`/game-discover` → `/game-define` → `/game-design` → `/game-deliver` → `/gsd:create-roadmap`

---

## Working Style
- Use GSD plugin for project management when available
- Delegate exploration/research to subagents (keep main context clean)
- Save early, save often — context can compact at any time
- Feature branches for all work, merge only when deploying

## Phone Testing (Vite Projects)

**Primary — Local HTTPS:** `npx vite --host` exposes on LAN. Phone connects via `https://<PC-IP>:<port>/`.

**Backup — Cloudflare Tunnel:** Use when phone won't accept the self-signed cert (common). Gives a real HTTPS URL that works everywhere — required for DeviceMotion/accelerometer.
```bash
"/c/Program Files (x86)/cloudflared/cloudflared.exe" tunnel --url https://localhost:<port> --no-tls-verify
```
Prints a `https://random-words.trycloudflare.com` URL. Open on phone. URL changes each restart. Run AFTER Vite is up — match the port Vite is using.

## Key Files
- **Quick-start guide**: `~/.claude/QUICKSTART.md` — "how do I use all this?"
- **Full pipeline reference**: `~/.claude/PIPELINE.md` — deep reference (1257 lines)
- Game projects: `~/Documents/UnityProjects/`

## Automatic Versioning

Projects with `version.json` get automatic version management: **X.Y.Z.B**
- **B** (build): increment on every commit
- **Z** (patch): bug fix or value tweak — reset B
- **Y** (minor): milestone completed — reset Z, B — `git tag vX.Y.Z`
- **X** (major): deploy/ship — reset Y, Z, B — `git tag vX.Y.Z`

On bump: read `version.json`, update fields, append to `history` array
(`{"version", "date", "summary"}`), write back. If unsure, just bump B.

## Plain English Errors

When errors occur, ALWAYS: (1) translate to plain English, (2) explain why
in non-technical terms, (3) offer to fix it. Never show raw stack traces
without translation. Never assume Muzzy knows what error codes mean.

---

## BMUZ + GSD Integration

- **BMUZ 4D** = "What are we building?" → outputs `.planning/PRD.md`
- **GSD** = "How do we build it?" → reads PRD, manages execution via PROJECT.md + ROADMAP
- PRD is the shared source of truth — don't duplicate its content in PROJECT.md

## Lossless Pipeline (MANDATORY)

Three always-on protections that prevent context loss and maintain project continuity.

### GSD Context Persistence
When a GSD plan is active (`.planning/STATE.md` shows a phase in progress):
- **Show current context** in responses: "Phase X, Plan Y, Task Z"
- **Don't go freeform** — always know where you are in the workflow
- If user asks something off-topic, handle it, then return to plan context
- After EVERY code change, update STATE.md (what changed, current status, next steps)
- If you don't know the current GSD state, read STATE.md before responding

### Vision Capture
When the user mentions ideas **not part of the current task**:
- Future features, design direction, "wouldn't it be cool if...", aesthetic preferences
- Changes they wish to make but aren't making yet
- Silently append to `.planning/VISION.md` (create if needed) with date and context
- Format: `### [Date] — [Topic]\n[Idea in user's words]\nContext: [what prompted it]`
- Mention "Noted in VISION.md" briefly at end of response
- Don't interrupt the flow — capture and move on

### Auto Documentation
After every git commit during a session:
- Update STATE.md: what changed, current status, decisions made, next steps
- This is NOT optional — the Stop hook catches missing updates
- Don't wait until `<save>` — update incrementally after each commit

## Project Folder Structure

```
.planning/          → Claude's workspace (STATE.md, PRD.md, research/)
content/            → Editable game data (data/, text/, tuning/)
proto/              → Python simulation workspace
src/                → Game code
```

## R3F Golden Rule
NEVER use React state for per-frame updates. Mutate refs in useFrame.
