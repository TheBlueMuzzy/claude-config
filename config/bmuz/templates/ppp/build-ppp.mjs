#!/usr/bin/env node
// BMUZ Project Planner Page (PPP) — draws a game's plan as one read-only page.
// It READS the plan files (never a second source of truth):
//   .planning/GDD.md (§1–§4 → "The game"), ROADMAP.md (milestones, items, parking lot),
//   SPRINT.md (steps for features in the sprint), BUGS.md, STATE.md (RESUME HERE, log, live link), version.json
// Usage: node build-ppp.mjs <projectDir> [outFile]   (default out: <projectDir>/.planning/ppp.html, gitignored)
// Rules it shows (agreed with Muzzy 2026-10-16): % only on milestones = done / all items in it;
// items show a state + a scope chip; ⛔ when a need isn't done; parking lot = 💡 ideas + 💤 maybe later.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { STATES, TYPES, readRoadmap, readBugs, isOpenBug } from './plan-reader.mjs';

const projectDir = path.resolve(process.argv[2] || '.');
const outFile = (process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : null) || path.join(projectDir, '.planning', 'ppp.html');
const read = (rel) => { try { return fs.readFileSync(path.join(projectDir, rel), 'utf8').replace(/\r\n/g, '\n'); } catch { return ''; } };

// ---------- states + the plan-file reader (shared with hooks/plan-lint.mjs) ----------

// ---------- tiny markdown → html (enough for GDD/STATE text) ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
}
function md(text) {
  const out = []; const lines = text.split('\n'); let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (/^```/.test(l)) { i++; while (i < lines.length && !/^```/.test(lines[i])) i++; i++; continue; }
    if (/^\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const body = rows.filter(r => !/^\|[\s:|-]+\|$/.test(r));
      out.push('<div class="tbl"><table>' + body.map((r, n) => '<tr>' + cells(r).map(c => n === 0 ? `<th>${inline(c)}</th>` : `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</table></div>');
      continue;
    }
    if (/^\s*[-*] /.test(l)) {
      const items = []; while (i < lines.length && /^\s*[-*] /.test(lines[i])) { const lvl = lines[i].match(/^\s*/)[0].length >= 2 ? ' class="sub"' : ''; items.push(`<li${lvl}>${inline(lines[i].replace(/^\s*[-*] /, ''))}</li>`); i++; }
      out.push('<ul>' + items.join('') + '</ul>'); continue;
    }
    if (/^\s*\d+\. /.test(l)) {
      const items = []; while (i < lines.length && /^\s*\d+\. /.test(lines[i])) { items.push(`<li>${inline(lines[i].replace(/^\s*\d+\. /, ''))}</li>`); i++; }
      out.push('<ol>' + items.join('') + '</ol>'); continue;
    }
    if (/^#{1,4} /.test(l)) { out.push(`<h4>${inline(l.replace(/^#+ /, ''))}</h4>`); i++; continue; }
    if (/^> /.test(l)) { out.push(`<p class="note">${inline(l.slice(2))}</p>`); i++; continue; }
    // a line starting with **Label** starts its own paragraph
    const para = [lines[i]]; i++; while (i < lines.length && lines[i].trim() && !/^(\||\s*[-*] |\s*\d+\. |#|```|> |\*\*)/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}
// A "## Heading" section of a markdown file, without its heading line.
function section(text, headingRe) {
  const lines = text.split('\n'); const start = lines.findIndex(l => headingRe.test(l));
  if (start < 0) return '';
  let end = lines.findIndex((l, n) => n > start && /^## /.test(l)); if (end < 0) end = lines.length;
  return lines.slice(start + 1, end).join('\n').trim();
}

// ---------- ROADMAP ----------
const roadmapText = read('.planning/ROADMAP.md');
const title = (roadmapText.match(/^# (.+?)(?: — Roadmap)?\s*$/m) || [, path.basename(projectDir)])[1];
const releaseLine = (roadmapText.match(/^Release target:\s*(.+)$/m) || [, 'not set'])[1];

const { milestones, parking, allItems, byId } = readRoadmap(roadmapText);

// SPRINT.md: "## F08 🎮 Title" sections with "- [x] 🤖 1. step" lines → steps for that feature
const sprintText = read('.planning/SPRINT.md');
const sprintTitle = (sprintText.match(/^# (.+)$/m) || [])[1] || '';
let sprintFeature = null;
for (const line of sprintText.split('\n')) {
  const f = line.match(/^## (F\d+[a-z]?)\b/); if (f) { sprintFeature = byId[f[1]] || null; if (sprintFeature) sprintFeature.steps = []; continue; }
  const s = line.match(/^- \[( |x)\]\s*(.+)$/i);
  if (s && sprintFeature) sprintFeature.steps.push({ done: s[1].toLowerCase() === 'x', text: s[2] });
}

// ---------- other files ----------
const gdd = read('.planning/GDD.md');
const state = read('.planning/STATE.md');
const bugs = read('.planning/BUGS.md');
let version = ''; try { const v = JSON.parse(read('version.json')); version = `${v.version}${v.build ? '.' + v.build : ''}`; } catch {}
const resume = section(state, /^## ▶ RESUME HERE/);
const whereWeAre = section(state, /^## Where we are/);
const live = (whereWeAre.match(/https?:\/\/\S+/) || [])[0] || '';
const log = section(state, /^## Log/);
// "The game": read the GDD's shape and draw it (pitch hero, feeling cards, pillar cards, loop chain, story timeline).
// Anything that doesn't match the expected shape falls back to plain text, so any game's GDD still draws.
const gddSection = (n) => { const lines = gdd.split('\n'); const s = lines.findIndex(l => new RegExp(`^## ${n}\\. `).test(l)); if (s < 0) return null; let e = lines.findIndex((l, k) => k > s && /^## /.test(l)); if (e < 0) e = lines.length; return { title: lines[s].replace(/^## \d+\.\s*/, '').replace(/\s*\(.*$/, ''), body: lines.slice(s + 1, e).join('\n') }; };
const tableRows = (text) => text.split('\n').filter(l => /^\|/.test(l) && !/^\|[\s:|-]+\|$/.test(l)).map(r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
const strip = (s) => s.replace(/\*\*/g, '').replace(/^["“]|["”]$/g, '').trim();
const HUES = ['--done', '--develop', '--define', '--discover', '--idea', '--deliver'];
function gamePitch(sec) {
  if (!sec) return '';
  const bullets = sec.body.split('\n').filter(l => /^- /.test(l));
  const one = bullets.find(b => /^- \*\*One line/i.test(b));
  const quote = bullets.find(b => /^- \*\*[^*]*story[^*]*:\*\*\s*["“]/i.test(b));
  const facts = bullets.filter(b => b !== one && b !== quote).map(b => b.replace(/^- /, ''));
  return `<div class="g-pitch">${one ? `<p class="g-hero">${inline(one.replace(/^- \*\*[^*]+\*\*\s*/, ''))}</p>` : ''}
    ${quote ? `<blockquote class="g-quote">${inline(quote.replace(/^- \*\*[^*]+\*\*\s*/, ''))}</blockquote>` : ''}
    ${facts.length ? `<ul class="g-facts">${facts.map(f => `<li>${inline(f)}</li>`).join('')}</ul>` : ''}</div>`;
}
function gameFeelings(sec) {
  if (!sec) return '';
  const rows = tableRows(sec.body); const rest = sec.body.split('\n').filter(l => !/^\|/.test(l)).join('\n');
  if (rows.length < 2) return `<h3 class="g-h">${inline(sec.title)}</h3>${md(sec.body)}`;
  const cards = rows.slice(1).filter(r => !/^not this game$/i.test(strip(r[0])) && r[1]);
  const not = rows.slice(1).find(r => /^not this game$/i.test(strip(r[0])));
  return `<h3 class="g-h">${inline(sec.title)}</h3><div class="g-cards">${cards.map((r, i) => `<article style="--c: var(${HUES[i % HUES.length]})"><span class="g-eye">${inline(strip(r[0]))}</span><h4>${inline(strip(r[1]))}</h4>${r[2] && r[2] !== '—' ? `<q>${inline(strip(r[2]))}</q>` : ''}${r[3] && r[3] !== '—' ? `<p class="g-small">We'll know when ${inline(r[3])}</p>` : ''}</article>`).join('')}</div>
    ${not && not[1] ? `<p class="g-small">Not this game: ${inline(strip(not[1]))}</p>` : ''}<div class="g-rest">${md(rest)}</div>`;
}
function gamePillars(sec) {
  if (!sec) return '';
  const items = sec.body.split('\n').map(l => l.match(/^- \*\*(.+?)\*\*\s*[—:-]?\s*(.*)$/)).filter(Boolean);
  if (!items.length) return `<h3 class="g-h">${inline(sec.title)}</h3>${md(sec.body)}`;
  return `<h3 class="g-h">${inline(sec.title)}</h3><div class="g-pillars">${items.map(m => `<div><h4>${inline(m[1].replace(/[.:]$/, ''))}</h4><p>${inline(m[2])}</p></div>`).join('')}</div>`;
}
function gameLoop(sec) {
  if (!sec) return '';
  const lines = sec.body.split('\n'); const loopLine = lines.find(l => /core loop/i.test(l) && /→/.test(l));
  if (!loopLine) return `<h3 class="g-h">${inline(sec.title)}</h3>${md(sec.body)}`;
  const steps = loopLine.replace(/^.*?core loop[^:]*:\*?\*?\s*/i, '').replace(/\.$/, '').split('→').map(s => s.trim()).filter(Boolean);
  const rest = lines.filter(l => l !== loopLine).join('\n');
  return `<h3 class="g-h">${inline(sec.title)}</h3><div class="g-loop">${steps.map((s, i) => `<span class="g-step" style="--c: var(${HUES[Math.floor(i * HUES.length / steps.length)]})">${inline(s)}</span>`).join('<span class="g-arrow">→</span>')}</div><div class="g-rest">${md(rest)}</div>`;
}
function gameStory() {
  const story = read('.planning/design/story.md'); if (!story) return '';
  // the arc = the longest table in the story doc (others, like a cast list, stay in the doc)
  const tables = story.split(/\n(?!\|)/).join('\n').split(/\n\s*\n|\n(?=[^|])/).filter(b => /^\|/.test(b.trim()));
  const rows = tables.map(tableRows).sort((a, b) => b.length - a.length)[0] || []; if (rows.length < 3) return '';
  return `<h3 class="g-h">Story arc</h3><div class="g-arc">${rows.slice(1).map((r, i) => `<div class="g-beat" style="--c: var(${HUES[Math.floor(i * HUES.length / (rows.length - 1))]})"><span class="g-r">${inline(strip(r[0]))}</span><p>${inline(r[1] || '')}${r[2] ? ` <span class="g-tone">${inline(r[2])}</span>` : ''}</p></div>`).join('')}</div>`;
}
const gameParts = gdd ? [gamePitch(gddSection(1)), gameFeelings(gddSection(2)), gamePillars(gddSection(3)), gameLoop(gddSection(4)), gameStory()].join('') : '';
// Sketches: every .html in .planning/research/sketches/ becomes a tab (title from <title>, blurb from <meta name="description">).
// /ppp publishes them next to the page as sketches/<file> so the tabs can load them.
const sketchDir = path.join(projectDir, '.planning', 'research', 'sketches');
// Optional: --only=a.html,b.html lists just those (e.g. while other sketches are still being built).
const onlyArg = process.argv.find(a => a.startsWith('--only='));
const only = onlyArg ? onlyArg.slice(7).split(',').map(s => s.trim()) : null;
const sketches = (fs.existsSync(sketchDir) ? fs.readdirSync(sketchDir).filter(f => f.endsWith('.html') && (!only || only.includes(f))).sort() : []).map(file => {
  const src = fs.readFileSync(path.join(sketchDir, file), 'utf8');
  const t = (src.match(/<title>([^<]*)<\/title>/i) || [])[1] || file.replace(/\.html$/, '');
  const dsc = (src.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1] || '';
  const unent = (x) => x.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  return { file, title: unent(t.trim()), desc: unent(dsc.trim()) };
});
const openBugs = readBugs(bugs).filter(isOpenBug).map(b => [null, b.id, b.priority, b.status, b.next]);
const bugCounts = ['P0', 'P1', 'P2', 'P3'].map(p => `${p} ${openBugs.filter(b => b[2] === p).length}`).join(' · ');

// ---------- Framework health (F66): each installed module's version vs the framework's newest + the last check:framework ----------
// A module copy = src/<x>/VERSION or src/<x>/kit/VERSION (like check-framework.mjs finds them). Results: e2e-shots/framework.json.
const FRAMEWORK_DIR = process.env.BMUZ_FRAMEWORK || path.join(os.homedir(), 'Documents', 'dev', 'framework');
const MODULE_INFO = { devkit: ['Dev Kit', 'devkit'], ui: ['UI kit', 'ui-kit'], ai: ['AI', 'ai'], audio: ['Audio', 'audio'], table: ['Table', 'table'], rooms: ['Rooms', 'rooms'] };
const firstWord = (file) => { try { return fs.readFileSync(file, 'utf8').trim().split(/\s/)[0]; } catch { return ''; } };
const newer = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
const health = (() => { try { return JSON.parse(read('e2e-shots/framework.json')); } catch { return {}; } })();
const lastRun = health.full || health.static || null;
const frameworkModules = Object.entries(MODULE_INFO).map(([id, [name, folder]]) => {
  const version = firstWord(path.join(projectDir, 'src', id, 'VERSION')) || firstWord(path.join(projectDir, 'src', id, 'kit', 'VERSION'));
  if (!version) return null;
  const latest = firstWord(path.join(FRAMEWORK_DIR, folder, 'kit', 'VERSION'));
  const run = lastRun?.modules?.find(m => m.id === id);
  return { id, name, version, latest, update: latest && newer(latest, version), run };
}).filter(Boolean);
const ago = (iso) => { const days = Math.floor((Date.now() - Date.parse(iso)) / 86400000); return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`; };
const updates = frameworkModules.filter(m => m.update).length;
const failing = frameworkModules.filter(m => m.run?.failed.length).length;
const frameworkHint = [
  updates ? `${updates} update${updates > 1 ? 's' : ''} available` : 'all current',
  lastRun ? `${failing ? `${failing} failing` : 'checks pass'} · ${ago(lastRun.date)}${health.full ? '' : ' (code checks only)'}` : 'not checked yet',
].join(' · ');

// ---------- render ----------
const pct = (m) => { const counted = m.items.filter(i => !['later', 'wont'].includes(i.state.key)); const done = counted.filter(i => i.state.key === 'done').length; return { done, total: counted.length, p: counted.length ? Math.round(100 * done / counted.length) : 0 }; };
const scopeChip = (s) => { if (!s) return ''; const k = s.toLowerCase().startsWith('must') ? 'must' : s.toLowerCase().startsWith('should') ? 'should' : s.toLowerCase().startsWith('could') ? 'could' : 'wont'; return `<span class="scope s-${k}">${esc(s.replace(/^must:/i, 'MUST · ').replace(/^(should|could)/i, x => x.toUpperCase()).replace(/^won'?t/i, "WON'T"))}</span>`; };
const stateChip = (st) => `<span class="state st-${st.key}">${esc(st.label)}</span>`;
function blockers(it) {
  if (it.state.key === 'done') return [];
  return it.needs.map(n => n.replace(/^~/, '')).filter(n => byId[n] && byId[n].state.key !== 'done').map(n => byId[n]);
}
function itemHtml(it) {
  const waits = blockers(it);
  const head = `${stateChip(it.state)}<span class="it-title">${it.id ? `<span class="id">${it.id}</span>` : ''}${it.type ? `<span class="type" title="${TYPES[it.type]}">${it.type}</span>` : ''}${inline(it.title)}</span>
    <span class="it-meta">${it.added ? '<span class="added">+ added</span>' : ''}${waits.length ? `<span class="wait">⛔ waiting on ${waits.map(w => w.id).join(', ')}</span>` : ''}${it.steps.length ? `<span class="count">${it.steps.filter(s => s.done).length}/${it.steps.length}</span>` : ''}${scopeChip(it.scope)}${it.date ? `<span class="date">${it.date}</span>` : ''}</span>`;
  const body = [
    it.what ? `<p>${inline(it.what)}</p>` : '',
    it.why ? `<p class="why">Why: ${inline(it.why)}</p>` : '',
    it.note ? `<p class="why">${inline(it.note)}</p>` : '',
    waits.length ? `<p class="why">Waiting on: ${waits.map(w => `${w.id} ${inline(w.title)}`).join(' · ')}</p>` : '',
    it.needs.length && !waits.length && it.state.key !== 'done' ? `<p class="why">Needs (done): ${it.needs.join(', ')}</p>` : '',
    it.steps.length ? `<ul class="steps">${it.steps.map(s => `<li class="${s.done ? 'done' : ''}"><span class="box" aria-hidden="true">${s.done ? '✓' : ''}</span>${inline(s.text)}${/🙋/.test(s.text) && !s.done ? ' <span class="you">you</span>' : ''}</li>`).join('')}</ul>` : '',
  ].join('');
  const cls = `item st-row-${it.state.key}`;
  return body ? `<details class="${cls}" data-key="${esc(it.id || it.title)}"><summary>${head}</summary><div class="it-body">${body}</div></details>` : `<div class="${cls} flat"><div class="sumrow">${head}</div></div>`;
}
const msHtml = milestones.map((m, n) => {
  const { done, total, p } = pct(m); const added = m.items.filter(i => i.added).length;
  const status = m.released ? 'released' : m.current ? 'current' : p === 100 ? 'done' : 'upcoming';
  return `<details class="ms ms-${status}" data-key="ms-${n}" ${m.current ? 'open' : ''}>
  <summary><span class="ms-name">${inline(m.name)}</span>${m.release ? `<span class="rel">→ ${esc(m.release)}</span>` : ''}${m.current ? '<span class="now-tag">current</span>' : ''}${m.released ? '<span class="now-tag done">released</span>' : ''}
    <span class="ms-prog"><span class="bar"><i style="width:${p}%"></i></span><b>${p}%</b><span class="frac">${done}/${total}${added ? ` · +${added} added` : ''}</span></span></summary>
  <div class="ms-body">${m.goal ? `<p class="goal">${inline(m.goal)}</p>` : ''}${m.items.map(itemHtml).join('')}
  ${m.mermaid ? `<details class="map" data-key="map-${n}"><summary>What needs what</summary><pre class="mermaid">${esc(m.mermaid)}</pre></details>` : ''}</div></details>`;
}).join('\n');
const ideas = parking.filter(i => i.state.key === 'idea'); const later = parking.filter(i => i.state.key !== 'idea');
// each RESUME HERE line is its own row; "Muzzy:" lines are his to-dos
const resumeHtml = md(resume.split('\n').filter(l => l.trim()).map(l => /^Muzzy:/.test(l) ? `- 🙋 ${l.replace(/^Muzzy:\s*/, '')}` : /^\s*[-*] /.test(l) ? l : `- ${l}`).join('\n'));
const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const html = `<title>${esc(title)} Planner</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Atkinson+Hyperlegible:wght@400;700&family=JetBrains+Mono:wght@500&display=swap">
<style>
/* Layout: one reading column of collapsible bands (game · now · milestones · parking lot · bugs · log); colour = state. */
:root {
  --bg: #f4f5f8; --card: #ffffff; --card-2: #eceef4; --line: #d9dce6; --fg: #1b1f2a; --muted: #5d6476; --accent: #3b5bdb;
  --idea: #b7791f; --discover: #2b6cb0; --define: #6b46c1; --develop: #c05621; --deliver: #0f766e; --done: #2f855a; --later: #718096;
  --must: #c53030; --should: #2b6cb0; --could: #718096;
  --display: "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif; --body: "Atkinson Hyperlegible", "Segoe UI", system-ui, sans-serif; --mono: "JetBrains Mono", ui-monospace, Consolas, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #12141b; --card: #1a1d27; --card-2: #232735; --line: #2f3445; --fg: #e8eaf2; --muted: #9aa1b5; --accent: #7c95ff;
  --idea: #f6c453; --discover: #63a4ff; --define: #b394ff; --develop: #ff9a55; --deliver: #3cc9b7; --done: #5fd38d; --later: #8f98ab;
  --must: #ff7b7b; --should: #63a4ff; --could: #8f98ab; color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #12141b; --card: #1a1d27; --card-2: #232735; --line: #2f3445; --fg: #e8eaf2; --muted: #9aa1b5; --accent: #7c95ff;
  --idea: #f6c453; --discover: #63a4ff; --define: #b394ff; --develop: #ff9a55; --deliver: #3cc9b7; --done: #5fd38d; --later: #8f98ab;
  --must: #ff7b7b; --should: #63a4ff; --could: #8f98ab; color-scheme: dark }
body { background: var(--bg); color: var(--fg); font-family: var(--body); font-size: 15px; line-height: 1.5; }
.wrap { max-width: 980px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 28px 56px; display: grid; gap: 14px; }
header { display: grid; gap: 8px; padding-bottom: 6px; }
h1 { font-family: var(--display); font-weight: 800; font-size: clamp(1.9rem, 6vw, 2.6rem); line-height: 1.05; margin: 0; text-wrap: balance; }
h1 small { display: block; font-size: .8rem; font-family: var(--mono); font-weight: 500; letter-spacing: .12em; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
.facts { display: flex; flex-wrap: wrap; gap: 6px; }
.fact { font-family: var(--mono); font-size: .74rem; padding: 3px 9px; border-radius: 999px; background: var(--card-2); color: var(--muted); }
.fact a { color: var(--accent); }
details > summary { list-style: none; cursor: pointer; }
details > summary::-webkit-details-marker { display: none; }
.band, .ms { background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
.band > summary, .ms > summary { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 14px 16px; }
.band > summary::before, .ms > summary::before, .item > summary::before, .map > summary::before { content: "▸"; color: var(--muted); font-size: .85em; transition: transform .15s; }
details[open] > summary::before { transform: rotate(90deg); }
.band > summary h2, .ms-name { font-family: var(--display); font-weight: 600; font-size: 1.15rem; margin: 0; }
.band .hint { color: var(--muted); font-size: .85rem; margin-left: auto; }
.band-body, .ms-body { padding: 0 16px 16px; display: grid; gap: 8px; min-width: 0; overflow-wrap: anywhere; }
.band-body p, .ms-body p { margin: 0; }
.ms-current { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.rel, .now-tag { font-family: var(--mono); font-size: .72rem; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
.now-tag { background: var(--accent); color: var(--card); border-color: var(--accent); }
.now-tag.done { background: var(--done); border-color: var(--done); }
.ms-prog { margin-left: auto; display: flex; align-items: center; gap: 8px; font-variant-numeric: tabular-nums; }
.bar { width: 120px; height: 8px; border-radius: 99px; background: var(--card-2); overflow: hidden; display: block; }
.bar i { display: block; height: 100%; background: var(--done); border-radius: 99px; }
.frac { color: var(--muted); font-size: .8rem; font-family: var(--mono); }
.goal { color: var(--muted); }
.item { border: 1px solid var(--line); border-radius: 10px; background: var(--card); }
.item > summary, .item .sumrow { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; padding: 9px 12px; }
.item.flat .sumrow::before { content: "▸"; visibility: hidden; font-size: .85em; }
.it-title { flex: 1 1 260px; min-width: 0; }
.it-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.id { font-family: var(--mono); font-size: .78rem; color: var(--muted); margin-right: 6px; }
.type { margin-right: 6px; }
.state { font-family: var(--mono); font-size: .7rem; padding: 2px 8px; border-radius: 6px; color: var(--card); white-space: nowrap; min-width: 74px; text-align: center; }
.st-idea { background: var(--idea); } .st-discover { background: var(--discover); } .st-define { background: var(--define); } .st-develop { background: var(--develop); }
.st-deliver { background: var(--deliver); } .st-done { background: var(--done); } .st-later, .st-wont { background: var(--later); }
.st-row-done .it-title { color: var(--muted); }
.st-row-wont .it-title { text-decoration: line-through; }
.scope { font-family: var(--mono); font-size: .68rem; padding: 1px 7px; border-radius: 999px; border: 1.5px solid currentColor; white-space: nowrap; }
.s-must { color: var(--must); } .s-should { color: var(--should); } .s-could, .s-wont { color: var(--could); }
.wait { font-size: .78rem; color: var(--must); }
.added { font-size: .75rem; font-family: var(--mono); color: var(--develop); }
.count, .date { font-family: var(--mono); font-size: .75rem; color: var(--muted); }
.it-body { padding: 0 12px 12px 30px; display: grid; gap: 6px; }
.why { color: var(--muted); font-size: .9rem; }
.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.steps li { display: flex; gap: 8px; align-items: baseline; }
.steps li.done { color: var(--muted); }
.box { flex: none; width: 15px; height: 15px; border: 1.5px solid var(--muted); border-radius: 4px; display: inline-grid; place-items: center; font-size: .7rem; position: relative; top: 2px; }
.steps li.done .box { background: var(--done); border-color: var(--done); color: var(--card); }
.you, .scope, .state, .wait, .id { overflow-wrap: normal; white-space: nowrap; }
.you { flex: none; font-family: var(--mono); font-size: .68rem; background: var(--idea); color: var(--card); padding: 0 6px; border-radius: 6px; }
.map > summary { display: flex; gap: 8px; color: var(--muted); font-size: .85rem; padding: 6px 2px; }
.map pre { overflow-x: auto; background: var(--card-2); border-radius: 10px; padding: 12px; margin: 0; }
.g-pitch { display: grid; gap: 12px; }
.g-hero { font-family: var(--display); font-weight: 600; font-size: clamp(1.1rem, 3.2vw, 1.4rem); line-height: 1.3; text-wrap: balance; }
.g-quote { margin: 0; padding: 14px 16px; background: var(--card-2); border-radius: 12px; font-size: .98rem; }
.g-facts { color: var(--muted); font-size: .88rem; }
.g-h { font-family: var(--display); font-weight: 600; font-size: 1rem; margin: 14px 0 2px; }
.g-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
.g-cards article { background: var(--card-2); border-radius: 12px; padding: 14px; display: grid; gap: 6px; align-content: start; border-top: 4px solid var(--c); }
.g-cards h4, .g-pillars h4 { margin: 0; font-size: .98rem; }
.g-eye { font-family: var(--mono); font-size: .7rem; letter-spacing: .08em; text-transform: uppercase; color: var(--c); }
.g-cards q { color: var(--muted); }
.g-small { color: var(--muted); font-size: .82rem; }
.g-rest { color: var(--muted); font-size: .9rem; display: grid; gap: 4px; }
.g-pillars { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
.g-pillars div { border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; display: grid; gap: 4px; align-content: start; }
.g-pillars p { color: var(--muted); font-size: .9rem; }
.g-loop { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.g-step { padding: 7px 12px; border-radius: 18px 14px 20px 12px; font-weight: 700; font-size: .88rem; color: var(--card); background: var(--c); }
.g-arrow { color: var(--muted); }
.g-arc { display: grid; border-left: 3px solid var(--line); margin-left: 6px; }
.g-beat { display: grid; grid-template-columns: 80px 1fr; gap: 10px; padding: 8px 0 8px 16px; position: relative; }
.g-beat::before { content: ""; position: absolute; left: -9px; top: 13px; width: 15px; height: 15px; border-radius: 50%; background: var(--c); }
.g-r { font-family: var(--mono); font-size: .8rem; color: var(--c); padding-top: 2px; }
.g-beat p { font-size: .92rem; }
.g-tone { color: var(--muted); font-size: .8rem; font-style: italic; }
@media (max-width: 560px) { .g-beat { grid-template-columns: 1fr; gap: 0; } }
.gdd { display: grid; gap: 6px; padding-top: 6px; border-top: 1px dashed var(--line); }
.gdd h3 { font-family: var(--display); font-weight: 600; font-size: 1rem; margin: 0; }
.gdd h4 { margin: 4px 0 0; font-size: .95rem; }
.tbl { overflow-x: auto; }
table { border-collapse: collapse; font-size: .88rem; min-width: 100%; }
th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--muted); font-weight: 700; }
ul, ol { margin: 0; padding-left: 20px; display: grid; gap: 3px; }
li.sub { margin-left: 18px; list-style: circle; }
code { font-family: var(--mono); font-size: .85em; background: var(--card-2); padding: 0 4px; border-radius: 4px; }
a { color: var(--accent); }
.note { color: var(--muted); font-size: .88rem; }
.legend { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; color: var(--muted); font-size: .8rem; }
.empty { color: var(--muted); font-style: italic; }
footer { color: var(--muted); font-size: .8rem; text-align: center; padding-top: 8px; }
@media (max-width: 560px) { .ms-prog { margin-left: 0; width: 100%; } .bar { flex: 1; } .state { min-width: 0; } .it-body { padding-left: 12px; } }
.tabs { display: flex; flex-wrap: wrap; gap: 6px; }
.tab { font: inherit; font-size: .88rem; padding: 7px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--card-2); color: var(--fg); cursor: pointer; }
.tab[aria-selected="true"] { background: var(--accent); border-color: var(--accent); color: var(--card); }
.tab:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.sk { display: grid; gap: 6px; }
.frame { width: min(100%, 430px); height: min(80vh, 820px); margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid var(--line); background: #000; }
@media (min-width: 800px) { .frame { width: min(100%, 740px); } }  /* room for a sketch's knobs panel beside a full phone-size board */
.frame iframe { width: 100%; height: 100%; border: 0; display: block; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
<main class="wrap">
<header>
  <h1><small>Project planner</small>${esc(title)}</h1>
  <div class="facts">
    <span class="fact">Release target: ${esc(releaseLine)}</span>
    ${version ? `<span class="fact">v${esc(version)}</span>` : ''}
    ${live ? `<span class="fact"><a href="${esc(live)}" target="_blank" rel="noopener">live game</a></span>` : ''}
    <span class="fact">updated ${today}</span>
  </div>
  <div class="legend">${['💡', '🔍', '📐', '🔨', '🚀', '✅', '💤'].map(k => stateChip(STATES[k])).join('')}</div>
</header>

<details class="band" data-key="game"><summary><h2>The game</h2><span class="hint">pitch · feelings · pillars · how it plays</span></summary>
  <div class="band-body">${gameParts || '<p class="empty">No GDD yet: /discover starts it.</p>'}</div></details>

<details class="band" data-key="now" open><summary><h2>Now</h2><span class="hint">${sprintTitle ? esc(sprintTitle) : 'what\'s in hand'}</span></summary>
  <div class="band-body">${resumeHtml || '<p class="empty">Nothing in hand.</p>'}</div></details>

${msHtml || '<p class="empty">No milestones yet: /define lays them out.</p>'}

${sketches.length ? `<details class="band" data-key="sketches"><summary><h2>Sketches</h2><span class="hint">${sketches.length} to play with</span></summary>
  <div class="band-body">
    <div class="tabs" role="tablist">${sketches.map((s, i) => `<button class="tab" role="tab" type="button" id="tab-${i}" aria-selected="false" data-i="${i}">${esc(s.title)}</button>`).join('')}</div>
    ${sketches.map((s, i) => `<div class="sk" id="sk-${i}" role="tabpanel" aria-labelledby="tab-${i}" data-src="sketches/${encodeURIComponent(s.file)}" hidden>${s.desc ? `<p class="why">${inline(s.desc)}</p>` : ''}<p class="why"><a href="sketches/${encodeURIComponent(s.file)}" target="_blank" rel="noopener">Open full screen ↗</a></p><div class="frame"></div></div>`).join('')}
    <p class="empty" id="sk-hint">Pick a tab to load a sketch. Only one runs at a time.</p>
  </div></details>` : ''}

<details class="band" data-key="parking"><summary><h2>Parking lot</h2><span class="hint">💡 ${ideas.length} new · 💤 ${later.length} maybe later</span></summary>
  <div class="band-body">${parking.length ? parking.map(itemHtml).join('') : '<p class="empty">Empty. New ideas with no milestone land here.</p>'}</div></details>

<details class="band" data-key="bugs"><summary><h2>Bugs</h2><span class="hint">${openBugs.length ? bugCounts : 'none open'}</span></summary>
  <div class="band-body">${openBugs.length ? '<ul>' + openBugs.map(b => `<li><span class="id">${b[1]} · ${b[2]}</span>${inline(b[4])}</li>`).join('') + '</ul>' : '<p class="empty">No open bugs logged.</p>'}</div></details>

${frameworkModules.length ? `<details class="band" data-key="framework"><summary><h2>Framework</h2><span class="hint">${esc(frameworkHint)}</span></summary>
  <div class="band-body"><ul>${frameworkModules.map(m => `<li><span class="id">${esc(m.name)}</span>${esc(m.version)}${m.update ? ` → <strong>${esc(m.latest)} available</strong>` : m.latest ? ' · current' : ''}${m.run ? ` · ${m.run.failed.length ? `✗ ${m.run.failed.length} not kept: ${esc(m.run.failed.join(' · '))}` : `✓ ${m.run.passed} checks`}` : ''}</li>`).join('')}</ul>
  <p class="why">${lastRun ? `Last <code>npm run check:framework</code>: ${esc(ago(lastRun.date))}${lastRun.commit ? ` at ${esc(lastRun.commit)}` : ''}${health.full ? '' : ' — code checks only; the full run also plays the game at every size'}.` : 'Run <code>npm run check:framework</code> to see which promises each module keeps here.'}${updates ? ' Updates: <code>install-module.mjs &lt;module&gt; .</code>' : ''}</p></div></details>` : ''}

<details class="band" data-key="log"><summary><h2>Log</h2><span class="hint">latest saves</span></summary>
  <div class="band-body">${md(log) || '<p class="empty">No saves yet.</p>'}</div></details>

<footer>Drawn from the project's GDD, ROADMAP, SPRINT, BUGS and STATE · read-only · BMUZ</footer>
</main>
<script>
// Remember which sections each viewer opened (this browser only; safe to lose).
(function () {
  var KEY = 'ppp-open:' + ${JSON.stringify(title)};
  var saved = null; try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  var all = document.querySelectorAll('details[data-key]');
  if (saved) all.forEach(function (d) { if (d.dataset.key in saved) d.open = saved[d.dataset.key]; });
  all.forEach(function (d) { d.addEventListener('toggle', function () {
    var s = {}; all.forEach(function (x) { s[x.dataset.key] = x.open; });
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }); });
})();
// Sketch tabs: load a sketch only when its tab is picked, and unload the previous one (one GPU-heavy sketch at a time).
(function () {
  var tabs = document.querySelectorAll('.tab'); if (!tabs.length) return;
  function show(i) {
    tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.dataset.i === String(i))); });
    document.querySelectorAll('.sk').forEach(function (p) {
      var on = p.id === 'sk-' + i; p.hidden = !on;
      var f = p.querySelector('.frame');
      if (on && !f.firstChild) { var fr = document.createElement('iframe'); fr.src = p.dataset.src; fr.title = 'sketch'; fr.allow = 'fullscreen; clipboard-write'; f.appendChild(fr); }
      if (!on) f.innerHTML = '';
    });
    var h = document.getElementById('sk-hint'); if (h) h.hidden = true;
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.dataset.i); }); });
})();
</script>
`;
fs.writeFileSync(outFile, html);
console.log(`PPP written: ${outFile}  (${milestones.length} milestones, ${allItems.length} items, ${parking.length} parked)`);
