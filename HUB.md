# Muzzy's Project Hub
> Synced between machines via the claude-config repo (`HUB.md` there → `setup.sh` copies it to `~/Documents/dev/HUB.md`). Edit it on either machine, then copy it back into `~/.claude-config/` and push.

All code projects live here: `C:\Users\Muzzy\Documents\dev\`
**One project = one folder = one GitHub repo.** Everything for a project (code, art, design docs) is inside its folder.

## Games — `dev\games\`

| Game | GitHub | Play |
|---|---|---|
| doomdial-original | [doomdial-original](https://github.com/TheBlueMuzzy/doomdial-original) (private) | — |
| escape-pod-scramble | [EscapePodScramble](https://github.com/thebluemuzzy/EscapePodScramble) | — |
| glyphtender | [glyphtender](https://github.com/TheBlueMuzzy/glyphtender) (web remake, alpha 2026-09-30) | [play](https://thebluemuzzy.github.io/glyphtender/) |
| glyphtender-original | [glyphtender-original](https://github.com/TheBlueMuzzy/glyphtender-original) (Unity, read-only reference) | — |
| goops | [GOOPS](https://github.com/TheBlueMuzzy/GOOPS) | [play](https://thebluemuzzy.github.io/GOOPS/) |
| roll-better | [roll-better](https://github.com/TheBlueMuzzy/roll-better) | [play](https://thebluemuzzy.github.io/roll-better/) |
| windchime | [WindChime](https://github.com/TheBlueMuzzy/WindChime) | [play](https://thebluemuzzy.github.io/WindChime/) |

## Framework — `dev\framework\`

| Framework | GitHub | What |
|---|---|---|
| framework | [framework](https://github.com/TheBlueMuzzy/framework) (private) | Reusable game modules — first: game UI kit |

## Apps — `dev\apps\`

| App | GitHub | Open |
|---|---|---|
| mi-slides | [MI-Slides](https://github.com/TheBlueMuzzy/MI-Slides) | [open](https://thebluemuzzy.github.io/MI-Slides/) |
| my-first-baby | [my-first-baby](https://github.com/TheBlueMuzzy/my-first-baby) | [open](https://thebluemuzzy.github.io/my-first-baby/) |

## Research — `dev\research\`
| mahjong | [mahjong-research](https://github.com/TheBlueMuzzy/mahjong-research) (private) |
|---|---|

## Collabs — `dev\collabs\` (other people's repos)
| joust-because | [JoustBecause](https://github.com/ShermanMeredith/JoustBecause) — with Sherman Meredith, Unreal 5.3 |
|---|---|

## How it works

- **Laptop ↔ desktop:** each machine has its own `dev\` folder. **Pull** when you sit down, **commit + push** when you get up. (Claude does this automatically.)
- **Backups:** GitHub (everything pushed) + Veeam nightly on the desktop.
- **Finished builds** (apk, exe) go in the repo's **GitHub Releases**, not in the code.
- **Very big art files** use Git LFS (already installed) — switched on per project when needed.
- **Google Docs/Sheets** can't leave Google — they stay in Drive, and the project notes where they are.
- **Board games are separate.** They stay in Google Drive `Boardgames\` (not code, no git). A digital version of a board game is its own project here.
- **Never put code projects in Google Drive** — sync corrupts git (it happened to an old DoomDial copy).
- Repos are **public** by default (free GitHub Pages needs it).

## New project checklist
1. Create `dev\games\<name>` (lowercase-with-dashes) + git + GitHub repo
2. Add a row to this file

## 📌 Machine to-do (Claude: do the list for THIS machine, tick each item, then delete the section once it's all ticked — and sync HUB.md back via /save)

### Laptop (user joebr) — added 2026-09-30 from the PC
- [ ] 1. `cd ~/.claude-config && git pull && bash setup.sh` — brings this HUB.md, the /save config-sync check, and the PC's latest global setup (you've done this if you're reading this file on the laptop).
- [ ] 2. `~/Documents/dev/games/glyphtender`: `git fetch --prune && git checkout main && git pull`, then delete the local `dev/alpha` branch (merged into main and deleted on GitHub; alpha v0.1.0 is released from main — live at https://thebluemuzzy.github.io/glyphtender/).
- [ ] 3. Clone `TheBlueMuzzy/glyphtender-original` into `~/Documents/dev/games/glyphtender-original` (read-only Unity reference; the AI source is on branch `festive-booth`).
- [ ] 4. Obsidian: follow `~/.claude/config/bmuz/OBSIDIAN.md` "Fast way (second machine)" — close Obsidian, copy `~/.claude-config/config/bmuz/obsidian-vault/` into `~/Documents/dev/.obsidian/`, reopen, Open folder as vault → `~/Documents/dev`.
- [ ] 5. Ask Muzzy about `C:\Users\joebr\dev` (mmb-clip-voting, truth-or-chairs-buzzer): are they on GitHub, and should they move into `~/Documents/dev` and get rows in this file?
