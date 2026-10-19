// Version + release commit + tag, in one go (F69) — /deliver §5. Rules: ~/.claude/references/versioning.md
//   node ~/.claude/config/bmuz/scripts/release.mjs <update|milestone|major> "<one-line summary>" [--dry-run]
//     update    → Z (0.9.2 → 0.9.3)      milestone → Y (0.9.3 → 0.10.0; a release stage too)      major → X (only when Muzzy says 1.0)
// Refuses before changing anything when: the project has no version.json, there's uncommitted work, it isn't on the
// default branch (/deliver merges first), or the tag already exists. Then: bump (build → 0), add the history entry,
// sync package.json + package-lock.json, commit "Release vX.Y.Z: <summary>", tag vX.Y.Z (annotated, so
// `git push --follow-tags` carries it). It never pushes: /deliver pushes after the smoke pass.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { git, run, say, ok, refuse, readJson, writeJson, args, projectDir, exists, changedFiles } from './lib.mjs'
import { defaultBranch } from '../hooks/lib.mjs'

const KINDS = { update: 2, milestone: 1, stage: 1, major: 0 } // which part of X.Y.Z goes up
const { words, flags } = args()
const [kind, summary] = words
if (!(kind in KINDS)) refuse(`what kind of release? (got "${kind ?? ''}")`, 'release.mjs <update|milestone|major> "<summary>"')
if (!summary?.trim()) refuse('a one-line summary is needed (it goes in version.json history and the commit)', 'release.mjs update "Cards fan out in your hand"')
const dir = projectDir()
const root = git(dir, 'rev-parse', '--show-toplevel')
if (!root) refuse(`${dir} isn't a git repo`)
const versionFile = join(root, 'version.json')
const version = readJson(versionFile)
if (!version?.version) refuse('no version.json with a "version" here', 'new projects start with {"name": "…", "version": "0.0.0", "build": 0, "history": []}')
// ROADMAP / STATE updates for the release ride along in the release commit (/deliver §5); code never does
const dirty = changedFiles(root).map(f => f.path)
const code = dirty.filter(f => !/^\.planning\//.test(f) && !/\.md$/i.test(f))
if (code.length) refuse(`there's uncommitted code — a release commit holds only the version change and plan notes:\n${code.slice(0, 8).map(l => `    ${l}`).join('\n')}`, 'commit it on the work branch (or /save) first')
const branch = git(root, 'rev-parse', '--abbrev-ref', 'HEAD')
const main = defaultBranch(root)
if (main && branch !== main) refuse(`on "${branch}", not ${main} — /deliver merges the work branch into ${main} first (§4)`)

if (!/^\d+\.\d+\.\d+$/.test(version.version)) refuse(`version.json "version" isn't X.Y.Z: "${version.version}"`)
const parts = version.version.split('.').map(Number)
if (parts.length !== 3) refuse(`version.json "version" isn't X.Y.Z: "${version.version}"`)
const at = KINDS[kind]
parts[at] += 1
for (let i = at + 1; i < 3; i++) parts[i] = 0
const next = parts.join('.')
const tag = `v${next}`
if (git(root, 'rev-parse', '--verify', '--quiet', `refs/tags/${tag}`) !== null) refuse(`tag ${tag} already exists`, 'look at `git tag` — was this release already made?')

const date = new Date().toISOString().slice(0, 10)
say(`${version.version}.${version.build ?? 0} → ${next}.0 (${kind}) — "${summary}"`)
if (flags.has('--dry-run')) { say('Dry run — nothing changed.'); process.exit(0) }

// what will change, and a dry-run `git add` of it — an ignored or unreadable file refuses BEFORE anything is written
const pkg = readJson(join(root, 'package.json'))
const lock = readJson(join(root, 'package-lock.json'))
const changed = ['version.json', ...(pkg && 'version' in pkg ? ['package.json'] : []), ...(lock && 'version' in lock && git(root, 'check-ignore', '-q', 'package-lock.json') === null ? ['package-lock.json'] : [])]
const trial = run('git', ['add', '-n', '--', ...changed, ...dirty], { cwd: root })
if (trial.code !== 0) refuse(`git can't stage these files, so nothing was changed:\n${trial.out.trim()}`)
const before = new Map(changed.map(f => [f, readFileSync(join(root, f), 'utf8')]))

version.version = next
version.build = 0
version.history = [...(version.history ?? []), { version: next, date, summary }]
writeJson(versionFile, version)
if (changed.includes('package.json')) { pkg.version = next; writeJson(join(root, 'package.json'), pkg) }
if (changed.includes('package-lock.json')) {
  lock.version = next
  if (lock.packages?.['']) lock.packages[''].version = next
  writeJson(join(root, 'package-lock.json'), lock)
}
const add = run('git', ['add', '--', ...changed, ...dirty], { cwd: root })
const commit = add.code === 0 && run('git', ['commit', '-q', '-m', `Release ${tag}: ${summary}`], { cwd: root })
if (!commit || commit.code !== 0) {
  for (const [f, text] of before) writeFileSync(join(root, f), text) // put the version files back
  run('git', ['reset', '-q', '--', ...changed], { cwd: root })
  refuse(`the release commit failed — the version files are put back:\n${(commit || add).out}`)
}
const tagged = run('git', ['tag', '-a', tag, '-m', `${tag}: ${summary}`], { cwd: root })
if (tagged.code !== 0) refuse(`committed, but the tag failed:\n${tagged.out}`, `\`git tag -a ${tag} -m "${summary}"\``)
ok(`Release ${tag} committed and tagged (${changed.join(', ')})`)
say(`Next (/deliver): smoke pass → \`git push --follow-tags\`${exists(root, '.github', 'workflows') ? ' (a deploy workflow may start)' : ''}${at < 2 ? ' · milestone → write the look-back (§7c)' : ''}`)
