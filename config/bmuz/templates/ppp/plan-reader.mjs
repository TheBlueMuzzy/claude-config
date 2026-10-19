// BMUZ plan-file reader — shared by build-ppp.mjs (draws the planner page) and hooks/plan-lint.mjs (checks the files).
// One reader, so the page and the checker always agree on what a line means.

// ---------- states ----------
// New ladder + the older ROADMAP states mapped onto it, so older projects still draw.
export const STATES = {
  '💡': { key: 'idea', label: 'Idea' },
  '🔍': { key: 'discover', label: 'Discover' },
  '📐': { key: 'define', label: 'Define' },
  '🔨': { key: 'develop', label: 'Develop' },
  '🎛️': { key: 'develop', label: 'Develop · tuning' },
  '🎛': { key: 'develop', label: 'Develop · tuning' },
  '🚀': { key: 'deliver', label: 'Deliver' },
  '✅': { key: 'done', label: 'Done' },
  '💤': { key: 'later', label: 'Maybe later' },
  '✖': { key: 'wont', label: "Won't" },
  '⏳': { key: 'define', label: 'Define · waiting' },
  '🟢': { key: 'define', label: 'Ready' },
};
export const TYPES = { '❓': 'Decision', '🧱': 'Foundation', '🎮': 'Player-facing', '✨': 'Polish', '🔧': 'Dev Kit tool', '🐞': 'Bug' };
const stateRe = new RegExp('^(' + Object.keys(STATES).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\uFE0F?\\s+');

// One ROADMAP item line: "- 🔨 F08 🎮 Splayed cards — must:alpha · needs: F07 · sprint 4"
export function parseItem(line) {
  let rest = line.replace(/^- /, '');
  const sm = rest.match(stateRe); if (!sm) return null;
  const state = STATES[sm[1]]; rest = rest.slice(sm[0].length);
  const item = { state, raw: line, steps: [], notes: [], needs: [], scope: '', added: false };
  const idm = rest.match(/^(F\d+[a-z]?)\s+/); if (idm) { item.id = idm[1]; rest = rest.slice(idm[0].length); }
  const tm = rest.match(/^(❓|🧱|🎮|✨|🔧|🐞)️?\s+/); if (tm) { item.type = tm[1]; rest = rest.slice(tm[0].length); }
  // meta after the LAST " — " when it looks like scope/needs ("must:alpha · needs: F01")
  const dash = rest.lastIndexOf(' — ');
  let titleText = rest, meta = '';
  if (dash > 0 && /(must|should|could|won'?t|needs:|sprint|added|^\d{4}-)/i.test(rest.slice(dash + 3))) { titleText = rest.slice(0, dash); meta = rest.slice(dash + 3); }
  // parking-lot ideas start with a date: "2026-10-16 — text"
  const dm = titleText.match(/^(\d{4}-\d{2}-\d{2})\s+—\s+/); if (dm) { item.date = dm[1]; titleText = titleText.slice(dm[0].length); }
  if (!item.date && /^\d{4}-\d{2}-\d{2}$/.test(meta.trim())) { item.date = meta.trim(); meta = ''; }
  item.title = titleText.trim();
  for (const part of meta.split('·').map(p => p.trim()).filter(Boolean)) {
    if (/^(must|should|could|won'?t)/i.test(part)) item.scope = part;
    else if (/^needs:/i.test(part)) item.needs = part.replace(/^needs:\s*/i, '').split(/,\s*/).map(n => n.trim()).filter(Boolean);
    else if (/^added/i.test(part)) item.added = true;
    else item.notes.push(part);
  }
  return item;
}

// ROADMAP.md → milestones (with items + their Mermaid graph) and the parking lot. Items carry `lineNo` (1-based).
export function readRoadmap(roadmapText) {
  const milestones = []; const parking = []; let cur = null; let lastItem = null; let inCode = false; let mermaid = [];
  roadmapText.split('\n').forEach((line, n) => {
    if (/^```/.test(line)) {
      if (!inCode && /mermaid/.test(line)) { inCode = true; mermaid = []; return; }
      if (inCode) { inCode = false; if (cur) cur.mermaid = mermaid.join('\n'); return; }
    }
    if (inCode) { mermaid.push(line); return; }
    const h = line.match(/^## (.+)$/);
    if (h) {
      lastItem = null;
      if (/^(parking lot|later|ideas)\b/i.test(h[1])) { cur = { parking: true, defaultState: /ideas/i.test(h[1]) ? '💡' : '💤' }; return; }
      // "· target: 2026-11-02" — the date the milestone should be done by (F81; session start counts down to it)
      const target = (h[1].match(/·\s*target:\s*(\d{4}-\d{2}-\d{2})/) || [])[1] || '';
      const name = h[1].replace(/\s*·\s*target:\s*\d{4}-\d{2}-\d{2}/, '');
      cur = {
        target,
        name: name.replace(/←\s*current/, '').replace(/✅\s*released[^)]*$/, '').replace(/\(→\s*[^)]*\)/, '').trim(),
        current: /←\s*current/.test(name), released: /✅\s*released/.test(name),
        release: (name.match(/\(→\s*([^)]+)\)/) || [])[1] || '', items: [], goal: '',
      };
      milestones.push(cur); return;
    }
    if (!cur) return;
    if (/^Goal:/.test(line) && !cur.parking) { cur.goal = line.replace(/^Goal:\s*/, ''); return; }
    if (/^- /.test(line)) {
      let it = parseItem(line);
      if (!it && cur.parking) it = parseItem(`- ${cur.defaultState} ${line.slice(2)}`);
      if (!it) return;
      it.lineNo = n + 1;
      (cur.parking ? parking : cur.items).push(it); lastItem = it; return;
    }
    const step = line.match(/^\s+- \[( |x)\]\s*(.+)$/i);
    if (step && lastItem) { lastItem.steps.push({ done: step[1].toLowerCase() === 'x', text: step[2] }); return; }
    const sub = line.match(/^\s+(what|why|note):\s*(.+)$/i);
    if (sub && lastItem) { lastItem[sub[1].toLowerCase()] = sub[2]; return; }
  });
  const allItems = milestones.flatMap(m => m.items);
  const byId = Object.fromEntries(allItems.filter(i => i.id).map(i => [i.id, i]));
  return { milestones, parking, allItems, byId };
}

// SPRINT.md → its title and "## F08 🎮 Title" sections with their "- [x] 🤖 1. step" lines.
export function readSprint(sprintText) {
  const title = (sprintText.match(/^# (.+)$/m) || [])[1] || '';
  const text = sprintText.replace(/\r\n/g, '\n');
  // "Started 2026-10-19 · …" — also "Started: …" / "**Started:** …" (one reading for plan-lint, producer notes, here)
  const started = (text.match(/^\**Started:?\**\s+(\d{4}-\d{2}-\d{2})/m) || [])[1] || '';
  // "Retro:" then "- went well: …" / "- went wrong: …" / "- change: …" (F81 — archive-sprint needs all three). Written
  // the Obsidian way too (review): "## Retro" / "**Retro:**", a blank line before the bullets, "*" bullets, bold
  // labels, "—" instead of ":"
  const retro = {};
  const rm = text.match(/^(?:#+\s*|[-*]\s+)?\**Retro:?\**[^\n]*\n((?:[ \t]*(?:[-*] [^\n]*)?\n?)*)/m);
  if (rm) for (const l of rm[1].split('\n')) {
    const k = l.match(/^\s*[-*]\s*\**(went well|went wrong|change)\**\s*[:—–-]\**\s*(.*)$/i);
    if (k && k[2].trim()) retro[k[1].toLowerCase()] = k[2].trim();
  }
  const features = []; let cur = null;
  sprintText.split('\n').forEach((line, n) => {
    const f = line.match(/^## (F\d+[a-z]?)\b/); if (f) { cur = { id: f[1], lineNo: n + 1, steps: [] }; features.push(cur); return; }
    if (/^## /.test(line)) { cur = null; return; }
    const s = line.match(/^- \[( |x)\]\s*(.+)$/i);
    if (s && cur) cur.steps.push({ done: s[1].toLowerCase() === 'x', text: s[2], lineNo: n + 1 });
  });
  return { title, started, retro, features };
}

// BUGS.md → every "### B014 · P1 · open · …" entry, with the section it sits in ("open" / "fixed").
export function readBugs(bugsText) {
  const bugs = []; let section = '';
  const lines = bugsText.split('\n');
  lines.forEach((line, n) => {
    const h = line.match(/^## (.+)$/); if (h) { section = /^open/i.test(h[1]) ? 'open' : /^fixed/i.test(h[1]) ? 'fixed' : h[1].toLowerCase(); return; }
    const m = line.match(/^### (B\d+) · (P\d) · ([^·\n]+)·?([^\n]*)$/);
    if (m) bugs.push({ id: m[1], priority: m[2], status: m[3].trim(), rest: m[4], section, lineNo: n + 1, next: lines[n + 1] || '' });
  });
  return bugs;
}
// A bug still needs work unless it's fixed, verified or won't-fix (watching / can't reproduce stay open).
export const isOpenBug = (b) => !/fixed|verified|won't/i.test(b.status);
