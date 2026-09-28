# MCP card — which "hands" Claude can have, and when

Checked 2026-09-28. Full research: `~/.claude/config/bmuz/reviews/2026-09-28-skill-review/review-mcps.md`.
Rule: **skill = know-how, MCP = hands into another program.** If a good CLI exists, use the CLI (leaner). Offer an MCP only when its trigger hits, and say so in one line.

## Always on
| MCP | What for | Notes |
|---|---|---|
| Playwright | screenshots, smoke tests, live-playtest | own browser profile — never Muzzy's Chrome |
| context7 | current library docs | best as the `context7@claude-plugins-official` plugin so it syncs |

## CLI instead of an MCP
`gh` (GitHub) · `gws` (Google) · `butler` (itch) · `wrangler` / `partykit` (Cloudflare) · `supabase` · `firebase` · `magick` / `sharp` (images) · `curl` Poly Haven API (no key). Obsidian vault, LDtk, Tiled → edit the markdown/JSON files directly.

## Install when a project needs it
| Trigger | MCP | Watch out |
|---|---|---|
| Unity project in /develop | CoplayDev `unity-mcp` (MIT); Unity's official MCP if Personal keeps access (unverified) | IvanMurzak Unity-MCP runs arbitrary C# — only if in-game AI debugging needed |
| /optimize performance work | Chrome DevTools MCP with `--isolated` | NEVER auto-connect (would attach to Muzzy's real Chrome) |
| Project uses Supabase | Supabase MCP, read-only, scoped to one project | prompt-injection risk (Supabase's own warning) |
| Project uses Firebase | Firebase plugin | |
| Debugging a live PartyKit/Cloudflare deploy | Cloudflare docs/logs MCP | |
| Live game with crash reporting | Sentry MCP | free-plan access unverified |
| Pixel-art game + Aseprite owned | Aseprite MCP | Aseprite ≈ $20 |
| Wants generated placeholder art + runs ComfyUI | official local Comfy MCP | prototypes only |

**Skip:** Figma (free plan ≈ 20 calls/month), memory/knowledge-graph MCPs (STATE.md does this and syncs), Obsidian MCPs, audio/asset/LDtk/Tiled/image-gen MCPs (tiny or stale).

## Setting one up so it works on both machines
- `claude mcp add` saves to `~/.claude.json` — that file never syncs. Avoid for anything he needs on both PCs.
- Always-on → a **plugin** (`enabledPlugins` in `settings.json` syncs).
- Per-game → the game repo's committed **`.mcp.json`**; secrets as `${VAR}`, set once per machine with `setx VAR value`.
