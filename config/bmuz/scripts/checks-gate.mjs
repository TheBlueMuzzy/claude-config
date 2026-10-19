// Is the work branch green on GitHub? (F70) — /deliver §4 runs this right before `git merge`.
//   node ~/.claude/config/bmuz/scripts/checks-gate.mjs [branch]      (default: the branch you're on)
// Looks up the "Checks" workflow run (templates/checks.yml) for the branch's latest commit:
//   green → ✓ carry on · red, still running, or that commit never pushed/checked → refuses with the run link (exit 1)
//   no Checks workflow in the repo, or gh missing / not logged in → ⚠ a warning that says how to fix it (exit 0)
// release.mjs asks the same question about the merged commit, so a red branch can't slip through after the merge.
import { git, refuse, args, projectDir, requireGreenChecks } from './lib.mjs'

const { words } = args()
const dir = projectDir()
const root = git(dir, 'rev-parse', '--show-toplevel')
if (!root) refuse(`${dir} isn't a git repo`)
const branch = words[0] || git(root, 'rev-parse', '--abbrev-ref', 'HEAD')
const commit = git(root, 'rev-parse', '--verify', '--quiet', `${branch}^{commit}`)
if (!commit) refuse(`there's no branch "${branch}" here`)
requireGreenChecks(root, { commit, branch })
