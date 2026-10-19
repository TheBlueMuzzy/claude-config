---
type: tool_used
tool: Bash
input_match: 'release\.mjs (update|milestone|stage|major)(?!.*--dry-run)|git.*\bmerge\b|git.*\btag\b.*v\d'
min: 0
max: 0
---
With a must still open it asks first (finish it, or release anyway?) — no merge, no release commit, no tag.
