# MCP servers vs CLIs: what BMUZ should have ready (2026-09-28)

This is a research pass only. Nothing was installed or changed.
Stars and last-push dates come from the GitHub API today (`gh api repos/...`). Anything not confirmed on a real page is marked *(unverified)*.

## 1. The big picture: MCP vs skills vs CLI in late 2026

- **Anthropic's own framing** ([Skills explained](https://claude.com/blog/skills-explained), [Extending Claude with skills + MCP](https://claude.com/blog/extending-claude-capabilities-with-skills-mcp-servers)):
  - "MCP is connection, Skills is instruction."
  - Use MCP when Claude has to reach a system it otherwise can't. Use a skill to teach it how.
  - The Claude Code MCP docs ([code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp)) put it as: "Connect a server when you find yourself copying data into chat from another tool."
- **Anthropic engineering, [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) (Nov 2025):**
  - Tool definitions and big tool results bloat the context.
  - Calling tools through code or scripts cut one example from 150k tokens to 2k.
  - In other words: the leaner the interface, the better.
- **Vendors are shipping "CLI + skill" alongside their MCPs:**
  - **Playwright**'s README now says "CLI invocations are more token-efficient: they avoid loading large tool schemas and verbose accessibility trees". It points coding agents to [`microsoft/playwright-cli`](https://github.com/microsoft/playwright-cli) (13.6k★) plus skills, and keeps MCP for long, stateful browser sessions.
  - **Context7**'s own setup (`npx ctx7 setup`) offers "CLI + Skills (no MCP required)" or MCP.
  - **Chrome DevTools MCP** ships a CLI as well.
  - **Firebase** recommends its agent skills alongside its MCP.
  - **Unity**'s official `unity-cli` skill is its automation route.
  - **Obsidian** has had an official CLI since v1.12.4 (Feb 2026).
- **Context cost is lower than it used to be.** Claude Code's **tool search is on by default**, so idle MCP tools are loaded on demand and only their names sit in context. I confirmed this first-hand: in this session every MCP tool is listed as "deferred".
  - The cost comes back when a tool is used. For example, Playwright MCP sends a full accessibility-tree snapshot after every action.
  - Rough schema sizes (Nov 2025 benchmark, [mcp.directory](https://mcp.directory/blog/chrome-devtools-mcp-vs-playwright-mcp-2026), secondary source): Playwright MCP about 13.7k tokens, Chrome DevTools MCP about 18k.

**Rule for BMUZ:**
1. **CLI first** when a good CLI exists and Muzzy is already signed in to it (`gh`, `gws`, `butler`, `wrangler`, `supabase`, `firebase`). Claude runs it through Bash, it costs almost nothing, and it's easy to show Muzzy the exact command.
2. **MCP** when Claude needs a live, stateful connection into a running app that has no CLI: the Unity Editor, Blender, a browser session, ComfyUI.
3. **A skill on top** of either one to hold the "how we do it" knowledge.

## 2. What he has now (found first-hand in `~/.claude.json` and `settings.json`)

| Server | Where it's configured | Syncs to the laptop? |
|---|---|---|
| context7 | `~/.claude.json` → user scope | **No.** `~/.claude.json` isn't in the sync repo, so it's desktop-only unless someone added it on the laptop by hand. |
| Playwright | plugin `playwright@claude-plugins-official` (enabled in `settings.json`) | Yes, `settings.json` syncs. *(Unverified: whether the laptop auto-installs an enabled plugin it doesn't have yet.)* |
| supabase | `~/.claude.json` → local scope under `B:/MyApps/MyFirstBaby` | **No.** It's also tied to an old path, so it won't follow the project to `dev/apps/my-first-baby`. |
| claude.ai connectors (Drive, Calendar, Slack, Claude Docs, monday) | claude.ai account | Yes, they follow the login. |
| Claude in Chrome | extension | Leave it out of testing (Muzzy's rule). |

## 3. Candidates

Key: ★ = GitHub stars · "pushed" = last commit · Win = Windows support

### Browsers and testing

| Candidate | What it lets Claude do | Free | Maintained | Win | Tokens | Security | Verdict |
|---|---|---|---|---|---|---|---|
| **Playwright MCP**. [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | Drive its own browser: click, type, screenshot, console | Yes, Apache-2.0 | 37.7k★, pushed 2026-09-25 | Yes | ~13.7k schema (deferred); snapshot after every action is heavy | Uses its own browser profile by default (`~/.cache/ms-playwright/mcp-*`), not his Chrome. `--isolated` runs in memory. | **HAVE-READY (already installed).** It powers `/play` and `live-playtest`, and his "never touch my Chrome" rule is already met. |
| **Playwright CLI + skill**. [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli) | Same actions as short shell commands; screenshots saved to files | Yes | 13.6k★, pushed 2026-09-18 | Yes *(Win not checked)* | Much lighter (per Playwright's README) | Same as above | **WHEN-NEEDED / trial.** Try it for scripted screenshot checks in `/develop` if Playwright MCP snapshots start eating context. Keep the MCP for watching live playtests. |
| **Chrome DevTools MCP**. [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | Performance traces, CPU/network throttling, Lighthouse, memory, deep console and network inspection | Yes, Apache-2.0 | 52.7k★, pushed today | Yes (Chrome) | ~18k schema; `--slim` = 3 tools; tool categories can be switched off | Default profile is its own (`~/.cache/chrome-devtools-mcp/chrome-profile`). **Never use `--autoConnect` or `--browserUrl`**, because those attach to his real Chrome. Use `--isolated`. | **WHEN-NEEDED.** Trigger: `/optimize` on a web game (frame drops, load time, memory leaks on a phone profile). Playwright can't profile; this can. |
| **Claude in Chrome** | Acts inside his real Chrome with his logins | Yes | n/a | Yes | n/a | Touches his real browser and accounts | **SKIP for tests** (his rule). Keep it only for tasks he asks for explicitly. |

### Code, docs and hosting

| Candidate | What it lets Claude do | Free | Maintained | Win | Tokens | Security | Verdict |
|---|---|---|---|---|---|---|---|
| **context7**. [upstash/context7](https://github.com/upstash/context7) | Current library docs (R3F, Vite, Unity…) | Free tier (API key optional) | 62.5k★, pushed today | Yes (remote HTTP) | 2 tools; deferred | Low. It sends library queries out. | **HAVE-READY, but move it** from `~/.claude.json` to the **`context7@claude-plugins-official` plugin** (it exists in his marketplace cache) so it syncs. The `ctx7` CLI + skill mode is an equally good lighter option. |
| **GitHub MCP**. [github/github-mcp-server](https://github.com/github/github-mcp-server) | Issues, PRs, Actions, code search through the API | Yes, MIT | 33.3k★, pushed today | Yes (remote) | Default toolsets are large; can be trimmed with `--toolsets` / `--read-only` | Needs a PAT or OAuth. Broad write access to every repo. | **CLI-INSTEAD.** `gh` already does all of this, is already logged in, and costs no context. |
| **Supabase MCP**. [supabase/mcp](https://github.com/supabase/mcp), [docs](https://supabase.com/docs/guides/getting-started/mcp) | SQL, migrations, logs, edge functions, types | Works on the free plan (branching is paid) | 2.9k★, pushed today | Yes (remote `https://mcp.supabase.com/mcp`) | Feature groups can be trimmed | Supabase itself warns about **prompt injection** and says not to point it at production. Use `project_ref=` plus `read_only=true`. | **WHEN-NEEDED.** Trigger: a game/app actually uses Supabase (my-first-baby, `save-system` cloud sync). Put it in that project's `.mcp.json`, read-only by default. Use the `supabase` CLI for migrations. |
| **Firebase MCP** (`npx firebase-tools mcp`), [docs](https://firebase.google.com/docs/ai-assistance/mcp-server) | Firestore, Auth, Functions, Crashlytics, hosting | Yes (Spark limits not stated) | firebase-tools 4.5k★, pushed today | Yes | Many tools | Full project access through his login | **WHEN-NEEDED.** Trigger: a project picks Firebase. Prefer the official `firebase` plugin (MCP + skills) in his marketplace. The `firebase` CLI covers deploys. |
| **Cloudflare MCPs**. [cloudflare/mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare) (14 remote servers), [cloudflare/mcp](https://github.com/cloudflare/mcp) (single "Code Mode" API server) | Docs, Workers bindings, observability/logs, builds | Yes (free account) | 4.3k★ / 892★, both pushed this week | Yes (remote) | Code Mode is designed to stay small | API token scopes | **WHEN-NEEDED.** Trigger: debugging a live PartyKit/Workers deploy (logs). Otherwise use **CLI-INSTEAD** (`wrangler` / `npx partykit deploy`). The docs server (`docs.mcp.cloudflare.com`) is a cheap add while building multiplayer. |
| **Sentry MCP**. [getsentry/sentry-mcp](https://github.com/getsentry/sentry-mcp) | Read crash reports, triage issues | Sentry has a free Developer plan; MCP availability on it *(unverified)* | 867★, pushed today | Yes (remote `https://mcp.sentry.dev/mcp`, OAuth) | Small, scoped by org/project in the URL | OAuth, read-mostly | **WHEN-NEEDED.** Trigger: a game is live with real players and Sentry is added. It's the textbook "stop pasting errors into chat" case. |
| **itch.io butler**. [itchio/butler](https://github.com/itchio/butler), [docs](https://itch.io/docs/butler/) | Upload builds, channels, patching | Yes, MIT | 988★, pushed 2026-09-26 | Yes | n/a (CLI) | API key via `butler login` / `BUTLER_API_KEY` (per machine) | **CLI-INSTEAD.** It belongs in `release/itch.md`. The only itch MCP found ([z27fang/itch-io-mcp-ts](https://github.com/z27fang/itch-io-mcp-ts), 1★, last push 2025-06) is a toy, so **SKIP** it. |
| **Figma MCP** (official remote) | Read designs and variables, write to canvas | Starter plan gets **"up to 20/month" tool calls** (confirmed on [developers.figma.com rate limits](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/)). Dev/Full seats get 200/day. | Official | Yes | n/a | OAuth | **SKIP (confirmed).** 20 calls a month can't support iteration. Screenshotting a free Figma wireframe to Claude works without any MCP. |

### Game engines and content tools

| Candidate | What it lets Claude do | Free | Maintained | Win | Tokens | Security | Verdict |
|---|---|---|---|---|---|---|---|
| **Unity official MCP** (in `com.unity.ai.assistant`, Unity 6+), [blog](https://unity.com/blog/unity-ai-mcp-how-to-get-started) (2026-05-11), [docs](https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.0/manual/unity-mcp-get-started.html) | Scene hierarchy, GameObjects, components, scripts, console, build settings | MCP "requires no credits". Included in Pro. **Personal: "available … on a free trial"** (14 days). Whether Personal keeps access after the trial is **unverified**. Unity AI after the trial is $10/month. It also needs Unity Cloud. | Official (open beta May 2026) | Yes (`relay_win.exe`) | *(unknown)* | Editor-level control | **WHEN-NEEDED, check the licence first.** When Unity work resumes, test whether a Personal account keeps MCP access after the trial. If it does, use it together with the official `unity-cli` skill. If not, use CoplayDev. |
| **CoplayDev unity-mcp** ("MCP for Unity"), [github](https://github.com/CoplayDev/unity-mcp) | 47 tools: scenes, scripts, assets, tests, profiling, builds | Yes, MIT (maintained by Aura, which also sells a paid assistant) | 14.6k★, pushed 2026-09-27 | Yes (uv/Python 3.10+, Unity 2021.3 → 6.x) | 47 tools (deferred) | Edits scripts and assets. Commit before sessions. | **WHEN-NEEDED (default Unity fallback).** Trigger: a Unity project in `/develop`. Put it in that project's `.mcp.json`. |
| **IvanMurzak Unity-MCP**. [github](https://github.com/IvanMurzak/Unity-MCP) | 70+ tools plus **auto-generated skills / CLI mode** (billed as token-efficient); also runs **inside a built game** | Yes, Apache-2.0 | 4.3k★, pushed 2026-09-27 | Yes (x64/x86/arm64). **Project path must have no spaces.** | Claims efficient token use *(unverified)* | Roslyn **runs arbitrary C#, including private methods** | **WHEN-NEEDED (alternative).** Pick it over CoplayDev only if runtime/in-game AI debugging is needed or CoplayDev's context cost hurts. |
| **Blender MCP** ("MCP for Blender"), [ahujasid/mcp-for-blender](https://github.com/ahujasid/blender-mcp) | Build and edit Blender scenes. Import **Poly Haven (no key)** and Sketchfab (free key). Hyper3D/Hunyuan generation is paid or freemium. | Yes, MIT | 29.5k★, pushed 2026-09-27 | Yes (`cmd /c uvx mcp-for-blender`) | ~20 tools *(approx.)* | `execute_blender_code` runs **arbitrary Python** ("ALWAYS save your work"). **Telemetry is on by default** (anonymous). Turn it off with `DISABLE_TELEMETRY=true`. | **WHEN-NEEDED.** Trigger: a 3D game needs custom low-poly props or scenes beyond Kenney/Quaternius, and Blender is installed. |
| **Aseprite MCP**. [diivi/aseprite-mcp](https://github.com/diivi/aseprite-mcp) | 104 tools: draw, layers, animation, palettes, tilemaps, export, Lua escape hatch | MCP is free (MIT). **Aseprite is paid** (~$20 on Steam; you can compile it from source for free) | 606★, pushed 2026-07-29 | Yes (uv, Python 3.13+) | 104 tools is a lot even when deferred | Lua escape hatch = runs arbitrary scripts | **WHEN-NEEDED.** Trigger: a pixel-art game where Claude should make placeholder sprites or animations. Otherwise SKIP, since prototypes use shapes and Kenney. ([willibrandon/pixel-mcp](https://github.com/willibrandon/pixel-mcp), 145★, stale since 2025-10: SKIP.) |
| **LDtk / Tiled MCPs**. [gazure/ldtk-mcp](https://github.com/gazure/ldtk-mcp) (4★), [chrisgliddon/tiled-mcp](https://github.com/chrisgliddon/tiled-mcp) (5★), PengLx/TiledMCP (3★) | Read and write level files | Yes | Tiny hobby repos | ? | ? | ? | **SKIP.** LDtk (`.ldtk`) and Tiled (`.tmj`) files are plain JSON, so Claude can read and write them directly. A skill that notes the schema is better. |
| **ComfyUI MCP (official)**. [Comfy-Org/comfy-mcp](https://github.com/Comfy-Org/comfy-mcp), [comfy.org/mcp](https://comfy.org/mcp) | Run local ComfyUI workflows: images, audio, 3D | **Local runs are free** (his GPU). Cloud needs a paid subscription. Partner models cost credits. | 239★, pushed 2026-09-20 (official, new) | Yes | *(unknown)* | Local server with no auth by default. Downloads custom nodes (run code). | **WHEN-NEEDED.** Trigger: Muzzy wants generated placeholder art and has ComfyUI plus a decent GPU set up. [artokun/comfyui-mcp](https://github.com/artokun/comfyui-mcp) (769★) is **being archived on 2026-10-09**, so SKIP it. |
| Other image MCPs (Stable Diffusion, ImageMagick wrappers) | Generate or edit images | Mixed | All ≤5★ | ? | ? | ? | **CLI-INSTEAD / SKIP.** For resizing, cropping, atlases and conversion, use `magick` / `sharp` / `squoosh` via Bash. Nothing mature exists. |
| **Audio MCPs**: [strudel-mcp-bridge](https://github.com/phildougherty/strudel-mcp-bridge) (20★, 2025-10), sonic-pi-mcp (18★), [freesound-mcp-server](https://github.com/johnkimdw/freesound-mcp-server) (8★, 2025-06), ElevenLabs MCP (**archived**, paid) | Music live-coding, SFX search | Mostly free | Immature or archived | ? | ? | Freesound licences vary per sound (some are NC/BY) | **SKIP.** Code-made SFX (ZzFX/jsfxr into `content/sfx.json`, from the toolkit review) plus the Sonniss/Kenney/Pixabay packs cover prototypes. |
| **Asset-source MCPs**: [RN0000/polyhaven-mcp](https://github.com/RN0000/polyhaven-mcp) (0★), [gregkop/sketchfab-mcp-server](https://github.com/gregkop/sketchfab-mcp-server) (40★, stale since 2025-03), none for Kenney | Search and download CC0 assets | Yes | Immature | ? | ? | Licence tracking is missing | **CLI-INSTEAD.** The Poly Haven API is public with no key (I confirmed that `curl https://api.polyhaven.com/assets?t=models` returns JSON). Kenney is plain zip downloads. A skill with `curl` plus a `credits.json` entry beats an MCP. Blender MCP already wraps Poly Haven and Sketchfab if Blender is used. |
| Godot MCPs (Coding-Solo 5.9k★), GameMaker, Rive MCPs | Engine or tool control | — | — | — | — | — | **SKIP.** Not his stack. (Rive MCPs are ≤16★.) |

### Knowledge and notes

| Candidate | What it lets Claude do | Free | Maintained | Win | Tokens | Security | Verdict |
|---|---|---|---|---|---|---|---|
| **Obsidian MCPs**: [MarkusPfundstein/mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) (4.4k★, 2026-08-31; needs the Local REST API plugin plus a key), [cyanheads/obsidian-mcp-server](https://github.com/cyanheads/obsidian-mcp-server) (687★), [aaronsb/obsidian-mcp-plugin](https://github.com/aaronsb/obsidian-mcp-plugin) (463★) | Search, read and patch notes through the running Obsidian app | Yes | Active | Yes | 7+ tools | Local HTTP API with a key | **SKIP / CLI-INSTEAD.** The vault is `Documents/dev`, which is plain markdown Claude already reads and edits with Read/Grep/Edit. If Obsidian-only features are ever needed (backlink-safe renames, Bases, tasks), use the **official Obsidian CLI** ([obsidian.md/help/cli](https://obsidian.md/help/cli), GA since v1.12.4). It needs Obsidian running. |
| **Memory / knowledge-graph MCP**: [@modelcontextprotocol/server-memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) | Entities, relations and observations stored in a local `memory.jsonl` | Yes | Reference server (servers repo: 90.6k★) | Yes | 9 tools | Local file | **SKIP.** Its data lives on one machine and **won't sync**, which is exactly what his rule "anything a project needs goes in STATE.md" avoids. STATE.md, the GDD, the TDD and ROADMAP already are the memory, and they're in git. |

## 4. How to set MCPs up so they sync across his two machines

Where each kind of config lives (from the [Claude Code MCP docs](https://code.claude.com/docs/en/mcp)):

| Scope | Stored in | Syncs? | Use for |
|---|---|---|---|
| **Local** (the default for `claude mcp add`) | `~/.claude.json` → `projects["<path>"].mcpServers` | **No** | Nothing in BMUZ. It's how the MyFirstBaby supabase entry ended up stuck on one machine. |
| **User** (`--scope user`) | `~/.claude.json` top-level `mcpServers` | **No** (never sync `~/.claude.json`; it's full of machine state) | Avoid. Use a plugin instead. |
| **Project** (`--scope project`) | `<repo>/.mcp.json`, committed | **Yes**, through the game's own git repo | Engine and backend servers that belong to one game (Unity MCP, Supabase, Sentry). |
| **Plugin** | plugin's `.mcp.json`; switched on by `enabledPlugins` in `settings.json` | **Yes**, through the claude-config repo | Always-on servers (Playwright, context7). |

Recommendations:
1. **Always-on servers = plugins only.**
   - Replace the user-scope context7 with `context7@claude-plugins-official`, so both machines get it from `settings.json`.
   - Playwright is already a plugin.
   - *(Unverified: whether the laptop auto-installs a newly enabled plugin on its first run.)* To be safe, have `setup.sh` run `claude plugin install <name>@claude-plugins-official` for each enabled plugin. That's idempotent.
2. **Per-game servers = the project's `.mcp.json`**, committed to the game repo. Pull on the laptop and it's there.
   - Claude Code asks once per machine to approve project servers. `enableAllProjectMcpServers` / `enabledMcpjsonServers` in settings can pre-approve them *(setting names from memory, check against the docs before use)*.
3. **Secrets never go in the file.** Use `${VAR}` expansion (`"Authorization": "Bearer ${SUPABASE_TOKEN}"`), which Claude Code supports in `command`, `args`, `env`, `url` and `headers`.
   - Set each key once per machine as a Windows user env var (`setx SUPABASE_TOKEN "…"`), just like `gws` credentials.
   - OAuth servers (Supabase remote, Sentry, Cloudflare) need a one-time `/mcp` login on each machine.
4. **Windows stdio servers:** use the `cmd /c uvx …` or `cmd /c npx …` form when a server doesn't start (Blender MCP's README does this). `uv` has to be installed on both machines for Unity (CoplayDev), Blender and Aseprite.
5. **Keep a reference card** at `~/.claude/references/mcp-card.md` (it syncs through `references/`) with the ready-to-paste `.mcp.json` block for each WHEN-NEEDED server. That way a skill can offer and add it in one step when a project hits the trigger.
6. **Housekeeping:** remove the stale local-scope `supabase` entry for `B:/MyApps/MyFirstBaby` from `~/.claude.json`. If my-first-baby still needs it, re-add it as project-scoped in `dev/apps/my-first-baby/.mcp.json` with `read_only=true&project_ref=…`.

## 5. Recommended setup

**Install now:**
- **Playwright MCP.** Already installed, keep it.
- **context7.** Switch it to the plugin form so it syncs.

That's all. Everything else is either a CLI Muzzy already has or only matters once a project needs it.

**CLI instead of MCP:**
- `gh` (GitHub)
- `gws` (Google Workspace)
- `butler` (itch.io)
- `wrangler` / `partykit` (Cloudflare deploys)
- `supabase` / `firebase` CLIs (deploys and migrations)
- `magick` / `sharp` (image processing)
- `curl` against the Poly Haven API
- direct file edits for the Obsidian vault and for LDtk/Tiled JSON
- the Obsidian CLI if ever needed

**Reference card (offer when the trigger happens):**

| Server | Trigger |
|---|---|
| Unity: official MCP (if still free on Personal after the trial) → else CoplayDev unity-mcp; IvanMurzak for in-game use | Unity project enters `/develop` |
| Chrome DevTools MCP (`--isolated`) | `/optimize` on a web game / performance hunt |
| Supabase MCP (read-only, one project) | project uses Supabase |
| Firebase plugin | project picks Firebase |
| Cloudflare observability/docs MCP | debugging a live PartyKit/Workers deploy |
| Sentry MCP | a game is live with Sentry crash reporting |
| Blender MCP (telemetry off) | custom 3D props/scenes needed and Blender installed |
| Aseprite MCP | pixel-art game and Aseprite owned |
| Comfy MCP (local) | Muzzy wants generated placeholder art and has ComfyUI running locally |
| Playwright CLI + skill | Playwright MCP context cost becomes a problem in long `/develop` runs |

**Skip:**
- GitHub MCP
- Figma MCP (20 calls/month on free)
- itch/asset/audio/LDtk/Tiled/image-gen community MCPs (immature)
- Obsidian MCPs
- memory MCP
- artokun comfyui-mcp (being archived)
- ElevenLabs MCP (archived, paid)
- Godot/GameMaker/Rive MCPs

## Unverified / flagged
- Whether Unity Personal keeps official MCP access after the 14-day trial (Unity's blog only says "available to Personal users on a free trial").
- Whether Sentry MCP works on the free Developer plan.
- Whether the Firebase MCP has limits on the Spark plan.
- IvanMurzak's token-efficiency claims.
- Blender MCP tool count.
- Comfy MCP token size.
- Playwright CLI on Windows.
- The pre-approval setting names (`enableAllProjectMcpServers` / `enabledMcpjsonServers`).
- Whether plugins auto-install on the laptop from a synced `enabledPlugins`.
- Schema token counts for Playwright and Chrome DevTools MCPs come from a third-party benchmark (Nov 2025).

## Sources
- https://code.claude.com/docs/en/mcp
- https://claude.com/blog/skills-explained · https://claude.com/blog/extending-claude-capabilities-with-skills-mcp-servers
- https://www.anthropic.com/engineering/code-execution-with-mcp
- https://github.com/microsoft/playwright-mcp · https://github.com/microsoft/playwright-cli
- https://github.com/ChromeDevTools/chrome-devtools-mcp (+ docs/configuration.md)
- https://mcp.directory/blog/chrome-devtools-mcp-vs-playwright-mcp-2026
- https://github.com/upstash/context7
- https://github.com/github/github-mcp-server
- https://unity.com/blog/unity-ai-mcp-how-to-get-started · https://unity.com/blog/unity-ai-how-to-get-started · https://docs.unity3d.com/Packages/com.unity.ai.assistant@2.0/manual/unity-mcp-get-started.html
- https://github.com/CoplayDev/unity-mcp · https://github.com/IvanMurzak/Unity-MCP
- https://github.com/ahujasid/blender-mcp
- https://github.com/diivi/aseprite-mcp
- https://comfy.org/mcp · https://github.com/Comfy-Org/comfy-mcp · https://github.com/artokun/comfyui-mcp
- https://supabase.com/docs/guides/getting-started/mcp
- https://firebase.google.com/docs/ai-assistance/mcp-server
- https://github.com/cloudflare/mcp-server-cloudflare · https://github.com/cloudflare/mcp
- https://mcp.sentry.dev/
- https://itch.io/docs/butler/
- https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/
- https://github.com/MarkusPfundstein/mcp-obsidian · https://obsidian.md/help/cli
- https://github.com/modelcontextprotocol/servers/tree/main/src/memory
