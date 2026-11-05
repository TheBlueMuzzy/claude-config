import { commands, gitCalls, commitMessage } from '../../lib.mjs'

export default {
  id: 'HC3',
  name: 'card.sprint-header',
  what: 'A sprint archived this turn (archive-sprint.mjs run, or a `Sprint NN done` commit) → the report opens with "Sprint NN — <goal>", then each feature, then built vs only measured',
  why: 'Muzzy, 2026-10-07: "idk really what these sprints were meant to do… idk if you even wrote any new code"',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  check({ turn, message }) {
    // archive-sprint really RUN (`node …archive-sprint.mjs`) — not just named in text written to a file (found in use: a
    // SPRINT Notes line mentioning it set this off)
    const runsArchive = (t) => commands(t.input.command || '', t.cwd).some(({ words }) => /^node(\.exe)?$/i.test(words[0] || '') && words.some(w => /archive-sprint\.mjs$/.test(w)))
    const archived = turn.tools.some(t => (t.name === 'Bash' || t.name === 'PowerShell') && (runsArchive(t) || gitCalls(t.input.command || '', t.cwd).some(c => c.sub === 'commit' && /^Sprint \d+ done\b/i.test(commitMessage(t.input.command, c.args)))))
    // (F185) a "Sprint NN … — <words>" / "Sprint NN: <goal>" line anywhere in the first 15 lines: the heading may lead
    // with the turn's other news ("## Sprint 13 approved, archived — …", "**Sprint 26: computer players…**" were sent
    // back for not being exactly "Sprint NN — goal" as the first line — audit 2026-11, ~60 % of HC3's send-backs)
    const top = message.split('\n').slice(0, 15).join('\n')
    if (archived && !/Sprint \d+\b[^\n]*?[—–:-]\s*\S/i.test(top)) return 'A sprint was archived this turn, so the report opens with its header (CLAUDE.md, 2026-10-07): "Sprint NN — <its goal in plain words>", then each feature as ID + what it was meant to do, then what was built (new code / content / tests) vs only measured or researched — before the results.'
  },
}
