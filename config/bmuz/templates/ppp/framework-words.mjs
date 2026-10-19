// The planner's Framework row in plain words (F66): does anything need doing, and who does it?
// Muzzy 2026-10-19: "I don't know what I'm looking at … I can't make any decisions based on what is present."
// So: healthy = one green line; otherwise one sentence per problem saying what it means for the game + who fixes it.
// Version numbers, check names and commands only go in the "details" fold (build-ppp.mjs draws that).
// Used by build-ppp.mjs; tested by scripts/test-scripts.mjs (suite "ppp-framework").

// Plain names for each framework piece (the folder name in the game's src/ → words).
export const PIECE_NAMES = {
  devkit: 'Dev Kit', ui: 'UI kit', ai: 'computer-player kit', audio: 'sound kit', table: 'turn-rules kit', rooms: 'online-play kit',
}

// Every check the framework pack can fail → one sentence a designer can act on, and who fixes it ('claude' or 'you').
// Keys = the check names exactly as each module's conformance.mjs (and check-framework.mjs) report them.
// {piece} = the plain name of the piece the check belongs to. A check missing here gets UNKNOWN_CHECK below.
const PAUSE_SNAPSHOT_HOTKEYS = ['⏸ full pause stops everything', '◐ half pause stops the rules, not the looks', 'a snapshot restores exactly', 'the game\'s hotkeys skip text boxes']
export const CHECK_WORDS = {
  // check-framework.mjs itself (any piece)
  'has its own checks': ['The {piece} in this game is an old copy that can\'t check itself yet.', 'Claude updates it in the next /develop.'],
  'its checks ran': ['The {piece}\'s checks crashed partway, so we can\'t tell yet whether it works here.', 'Claude fixes it.'],
  // Dev Kit
  'a game adapter is registered': ['The Dev Kit isn\'t plugged into the game, so snapshots, bug capture and pause can\'t reach it.', 'Claude fixes it.'],
  'every tuning file is read by the game': ['Some Dev Kit tuning sliders change nothing, because the game never reads them.', 'Claude fixes it.'],
  'no tuning value is copied at load': ['Some Dev Kit tuning sliders only take effect after a reload, not live while you play.', 'Claude fixes it.'],
  'the Dev Kit starts in the game': ['The Dev Kit doesn\'t open in the game at all.', 'Claude fixes it.'],
  'the Dev Kit starts and the game is plugged in': ['The Dev Kit opens, but it isn\'t connected to the game, so its tools can\'t reach play.', 'Claude fixes it.'],
  'every tuning file is live in the running game': ['Moving a Dev Kit tuning slider doesn\'t change the running game.', 'Claude fixes it.'],
  [PAUSE_SNAPSHOT_HOTKEYS[0]]: ['The Dev Kit\'s full pause doesn\'t freeze everything: something keeps moving.', 'Claude fixes it.'],
  [PAUSE_SNAPSHOT_HOTKEYS[1]]: ['The Dev Kit\'s half pause (rules frozen, animations still running) doesn\'t work right.', 'Claude fixes it.'],
  [PAUSE_SNAPSHOT_HOTKEYS[2]]: ['Loading a Dev Kit snapshot doesn\'t bring back exactly the same moment of play.', 'Claude fixes it.'],
  [PAUSE_SNAPSHOT_HOTKEYS[3]]: ['Typing in a text box also sets off the game\'s keyboard shortcuts.', 'Claude fixes it.'],
  [PAUSE_SNAPSHOT_HOTKEYS.join(' · ')]: ['The checks couldn\'t get from the menu into play, so pause, snapshots and shortcuts weren\'t tested.', 'Claude fixes it.'],
  'no errors in the console': ['The game hits hidden errors while it runs. Players don\'t see them, but something is broken underneath.', 'Claude fixes it.'],
  // UI kit
  'every asset is credited': ['Some art, sound or font files aren\'t on the credits list, so we can\'t be sure we\'re allowed to use them.', 'Claude lists them, and asks you only if it can\'t tell where a file came from.'],
  'nothing 🔴 ships': ['The game uses an art, sound or font file we\'re not allowed to release.', 'Needs you: pick a replacement (Claude can drop in a stand-in until then).', 'you'],
  'every 🟡 credit is shown': ['Some art, sound or fonts need their creator named on the Credits screen, and they aren\'t there yet.', 'Claude fixes it.'],
  'the game\'s UI code keeps the kit\'s rules (check-ui)': ['Some screens use one-off colours or sizes instead of the game\'s chosen style, so they may not match.', 'Claude fixes it.'],
  'check-ui runs in check:fast': ['The style rules aren\'t checked automatically after each change yet.', 'Claude fixes it.'],
  'nothing overlaps': ['On some screen sizes, parts of the screen sit on top of each other.', 'Claude fixes it.'],
  'nothing is clipped or wider than the screen': ['On some screen sizes, something is cut off or runs off the edge.', 'Claude fixes it.'],
  'every tap target is at least 44 px': ['Some buttons are too small to tap easily on a phone.', 'Claude fixes it.'],
  'no focus ring without the keyboard': ['Some buttons show a highlight outline even when nobody used the keyboard.', 'Claude fixes it.'],
  'the game at every size — in play': ['The checks couldn\'t get from the menu into play, so the in-game screens weren\'t tested on every screen size.', 'Claude fixes it.'],
  // sound kit
  'sounds are named in code, described in content/audio.json': ['Some sounds are wired straight into the code, so you can\'t swap or tune them in the Dev Kit\'s Sound tab.', 'Claude fixes it.'],
  'the Dev Kit\'s full pause silences the sound': ['Sound keeps playing when the Dev Kit pauses the game.', 'Claude updates the sound kit in the next /develop.'],
  // computer-player kit
  'personalities live in content/ai/': ['The computer players\' personalities aren\'t in editable files, so you can\'t tune them in the Dev Kit.', 'Claude fixes it.'],
  'bots wait on the rules clock (half pause stops a bot mid-think)': ['Computer players keep thinking while the game is paused.', 'Claude fixes it.'],
  // online-play kit
  'the Dev Kit can\'t change an online game (canRestore / canPause false online)': ['In an online game the Dev Kit could change one player\'s game and put the players out of step.', 'Claude fixes it.'],
  // turn-rules kit
  'the rules keep the Table\'s promises and the move record replays (selfTest)': ['The game rules\' self-test fails or is missing, so a recorded game might not replay the same way.', 'Claude fixes it.'],
}
export const UNKNOWN_CHECK = ['One of the {piece}\'s checks didn\'t pass.', 'Claude looks into it in the next /develop.']

/** One failed check → { text, who }. Never shows the raw check name. */
export function checkSentence(name, pieceId) {
  const [means, fix, who = 'claude'] = CHECK_WORDS[name] ?? UNKNOWN_CHECK
  const piece = PIECE_NAMES[pieceId] ?? 'framework piece'
  return { text: `${means} ${fix}`.replaceAll('{piece}', piece).replace(/^the /, 'The '), who }
}

const STALE_DAYS = 7
const daysSince = (iso, now) => Math.floor((now - Date.parse(iso)) / 86400000)
const agoWords = (days) => days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
const parts = (v) => String(v).split('.').map(Number)
/** true when a is newer than b ("0.20.0" vs "0.18.1"). */
export function newer(a, b) { const x = parts(a), y = parts(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false }
const updateKind = (from, to) => { const x = parts(from), y = parts(to); return x[0] === y[0] && x[1] === y[1] ? 'small fixes' : 'new features and fixes' }
const listWords = (xs) => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`

/**
 * modules: [{ id, version, latest }] — each piece installed in the game ('' latest = framework folder not found).
 * health: the game's e2e-shots/framework.json ({ full?, static? }), {} when never checked.
 * → { healthy, lines: [{ text, who }], hint, run, ago }
 */
export function frameworkStatus(modules, health = {}, now = Date.now()) {
  const run = health.full || health.static || null
  const lines = []
  // 1. newer versions out — one sentence for all of them
  const behind = modules.filter((m) => m.latest && newer(m.latest, m.version))
  if (behind.length === 1) {
    const m = behind[0]
    lines.push({ text: `A newer ${PIECE_NAMES[m.id] ?? m.id} is out (${updateKind(m.version, m.latest)}). Claude updates it in the next /develop.`, who: 'claude' })
  } else if (behind.length > 1) {
    lines.push({ text: `Newer versions of ${behind.length} framework pieces are out: ${listWords(behind.map((m) => `${PIECE_NAMES[m.id] ?? m.id} (${updateKind(m.version, m.latest)})`))}. Claude updates them in the next /develop.`, who: 'claude' })
  }
  // 2. checks: never run / old / quick only / pieces not covered / failures
  let ago = ''
  if (!run) {
    lines.push({ text: 'The framework pieces haven\'t been checked in this game yet, so we don\'t know if they all work. Claude runs the checks in the next /develop.', who: 'claude' })
  } else {
    const days = daysSince(run.date, now)
    ago = agoWords(days)
    if (days > STALE_DAYS) lines.push({ text: `Last checked ${ago}, so this may be out of date. Claude runs the checks again in the next /develop.`, who: 'claude' })
    if (!health.full) lines.push({ text: 'Only the quick check has run (it reads the code but doesn\'t play the game). Claude runs the full check in the next /develop.', who: 'claude' })
    const unchecked = modules.filter((m) => !run.modules?.some((r) => r.id === m.id))
    if (unchecked.length) lines.push({ text: `The ${listWords(unchecked.map((m) => PIECE_NAMES[m.id] ?? m.id))} ${unchecked.length === 1 ? 'wasn\'t' : 'weren\'t'} part of the last check. Claude checks ${unchecked.length === 1 ? 'it' : 'them'} in the next /develop.`, who: 'claude' })
    const seen = new Set()
    for (const r of run.modules ?? []) {
      for (const name of r.failed ?? []) {
        const s = checkSentence(name, r.id)
        if (seen.has(s.text)) continue // the same problem reported by two pieces (e.g. console errors) → once
        seen.add(s.text)
        lines.push(s)
      }
      // a known gap the game has now closed → take it off its list
      if ((r.gapsToRemove ?? []).length) lines.push({ text: 'Something that was planned for later works now. Claude takes it off the game\'s to-build list.', who: 'claude' })
    }
  }
  // known gaps (Dev Kit 0.20.1+): promises the game doesn't keep YET, already planned on its roadmap — not a problem to sort
  const planned = (run?.modules ?? []).flatMap((r) => (r.knownGaps ?? []).map((g) => ({ text: `Planned for later${g.roadmap ? ` (${g.roadmap} on the roadmap)` : ''}: ${String(g.why ?? '').replace(/\.$/, '')}.`, who: 'planned' })))
  const healthy = lines.length === 0
  const you = lines.filter((l) => l.who === 'you').length
  const n = lines.length
  const hint = healthy ? `all good${planned.length ? ` · ${planned.length} planned for later` : ''}`
    : `${n} thing${n === 1 ? '' : 's'} to sort — ${you ? `${you === n ? (n === 1 ? 'it needs' : 'all need') : you + ' need' + (you === 1 ? 's' : '')} you` : n === 1 ? 'Claude handles it' : n === 2 ? 'Claude handles both' : `Claude handles all ${n}`}`
  return { healthy, lines, planned, hint, run, ago, green: healthy ? `✅ Framework pieces are up to date and working (checked ${ago}).` : '' }
}
