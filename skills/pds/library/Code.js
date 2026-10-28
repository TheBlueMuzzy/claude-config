// PDS Tools — shared library behind the PDS menu in every PDS deck.
// Each deck has a tiny stub script (see ../stub) that calls this library as `PDS`
// in development mode, so saving this library updates every deck the next time it opens.

var VERSION = '1.6.0';
var PREFIX = 'PDS - ';
var GAME_PAGES = ['PDS - Overview', 'PDS - How to Play'];
var ARCHIVE = 'PDS - Archive';
var ADDABLE = ['PDS - Overview', 'PDS - How to Play', 'PDS - Control Drawing', 'PDS - Color & Deco', 'PDS - Texture & Finish', 'PDS - Printed Sheet', 'PDS - Packaging'];
var COMPONENT_SET = ['PDS - Control Drawing', 'PDS - Color & Deco', 'PDS - Texture & Finish'];
// The page-type chip text on each layout, used to recognise a layout if its name was changed
var CHIPS = { 'OVERVIEW': 'PDS - Overview', 'HOW TO PLAY': 'PDS - How to Play', 'CONTROL DRAWING': 'PDS - Control Drawing', 'COLOR & DECO': 'PDS - Color & Deco', 'TEXTURE & FINISH': 'PDS - Texture & Finish', 'PRINTED SHEET': 'PDS - Printed Sheet', 'PACKAGING': 'PDS - Packaging', 'ARCHIVE': 'PDS - Archive' };
var BLANK_DATE = 'DD Mon YYYY';

// ---------- menu ----------

// Menu items point at the stub's slot functions (pdsMenu1…pdsMenu10), so new items here need no stub change.
function onOpen() {
  SlidesApp.getUi().createMenu('PDS')
    .addItem('New PDS…', 'pdsMenu11')
    .addSeparator()
    .addItem('Set up deck…', 'pdsMenu1')
    .addItem('Add page(s)…', 'pdsMenu2')
    .addItem('Mark selected pages revised today', 'pdsMenu3')
    .addSubMenu(SlidesApp.getUi().createMenu('Set status of selected pages')
      .addItem('Draft', 'pdsMenu6')
      .addItem('Revisions Needed', 'pdsMenu7')
      .addItem('Complete', 'pdsMenu8')
      .addSeparator()
      .addItem('Superseded', 'pdsMenu9')
      .addItem('Dropped', 'pdsMenu10'))
    .addSeparator()
    .addItem('Archive selected pages…', 'pdsMenu4')
    .addItem('Unarchive selected pages', 'pdsMenu5')
    .addToUi();
}

// Slots 1–10 are all the stub has; About lives in the Set up panel now
function menu(slot) {
  var actions = { 1: showSetup, 2: showAddPages, 3: markRevisedToday, 4: showArchive, 5: unarchiveSelected,
    6: function () { setStatus_('DRAFT'); }, 7: function () { setStatus_('REVISIONS NEEDED'); }, 8: function () { setStatus_('COMPLETE'); },
    9: function () { setStatus_('SUPERSEDED'); }, 10: function () { setStatus_('DROPPED'); }, 11: showNewPds };
  if (actions[slot]) actions[slot]();
}

// Dialogs call back through the stub's pdsCall(name, payload)
function call(name, payload) {
  var actions = { saveSetup: saveSetup, addPages: addPages, archivePages: archivePages, newPds: newPds };
  if (!actions[name]) throw new Error('Unknown action: ' + name);
  return actions[name](payload);
}

// ---------- helpers ----------

function deck_() { return SlidesApp.getActivePresentation(); }
function today_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy'); }

// Which PDS page type a layout is: by name first, then by its chip text
function layoutKind_(layout) {
  var name = layout.getLayoutName ? layout.getLayoutName() : '';
  if (name && name.indexOf(PREFIX) === 0) return name;
  var shapes = layout.getShapes();
  for (var i = 0; i < shapes.length; i++) {
    var text = shapes[i].getText().asString().trim();
    if (CHIPS[text]) return CHIPS[text];
    if (text.indexOf('ARCHIVE') === 0) return ARCHIVE;
  }
  return null;
}
function slideKind_(slide) { return layoutKind_(slide.getLayout()); }

function pdsLayouts_() {
  var map = {};
  deck_().getLayouts().forEach(function (l) { var k = layoutKind_(l); if (k && !map[k]) map[k] = l; });
  return map;
}

// The type-in boxes on a page, matched to the layout box they came from (_ph0 = created, _ph1 = revised, _ph2 = status)
function fields_(slide) {
  var f = { other: [] };
  slide.getPlaceholders().forEach(function (pe) {
    var s = pe.asShape();
    if (s.getPlaceholderType() === SlidesApp.PlaceholderType.TITLE) { f.title = s; return; }
    var parent = s.getParentPlaceholder();
    var m = parent ? parent.getObjectId().match(/_ph(\d+)$/) : null;
    if (!m) { f.other.push(s); return; }
    var k = Number(m[1]);
    if (k === 0) f.created = s; else if (k === 1) f.revised = s; else if (k === 2) f.status = s; else f.other.push(s);
  });
  return f;
}

function text_(shape) { return shape ? shape.getText().asString().replace(/\n$/, '').trim() : ''; }
function setText_(shape, value) { if (shape) shape.getText().setText(value); }

function divider_() {
  var slides = deck_().getSlides();
  for (var i = 0; i < slides.length; i++) if (slideKind_(slides[i]) === ARCHIVE) return { slide: slides[i], index: i };
  return null;
}

function selectedSlides_() {
  var sel = deck_().getSelection();
  var range = sel.getPageRange();
  var pages = range ? range.getPages() : [sel.getCurrentPage()];
  return pages.filter(function (p) { return p; }).map(function (p) { return p.asSlide(); });
}

// Current item info, read back from the deck
function current_() {
  var info = { game: '', item: '', owner: 'Muzzy', created: today_() };
  var layouts = pdsLayouts_();
  Object.keys(layouts).some(function (k) {
    return layouts[k].getShapes().some(function (s) {
      var t = s.getText().asString();
      var m = t.match(/Item #:\s*(.*?)\s*\|\s*Item Name:\s*(.*?)\s*\|\s*Project Owner:\s*(.*?)\s*$/m);
      if (!m) return false;
      if (m[1] !== 'XXX####') info.item = m[1];
      if (m[2] !== 'GAME') info.game = m[2];
      info.owner = m[3] || info.owner;
      return true;
    });
  });
  deck_().getSlides().some(function (s) {
    if (slideKind_(s) !== 'PDS - Overview') return false;
    var c = text_(fields_(s).created);
    if (c && c !== BLANK_DATE) info.created = c;
    return true;
  });
  return info;
}

// Rewrite "Item #: … | Item Name: … | Project Owner: …", keeping anything before it (the archive layout's footer)
function writeItemLine_(shape, item, game, owner) {
  var tr = shape.getText();
  var old = tr.asString().replace(/\n$/, '');
  var at = old.indexOf('Item #:');
  if (at < 0) return;
  var prefix = old.substring(0, at);
  var color = tr.getRange(at, at + 1).getTextStyle().getForegroundColor();
  var hex = color ? color.asRgbColor().asHexString() : '#1F1F1F';
  var prefixSize = prefix ? tr.getRange(0, 1).getTextStyle().getFontSize() : null;
  var sep = '   |   ';
  var parts = [['Item #: ', item], ['Item Name: ', game], ['Project Owner: ', owner]];
  var full = prefix + parts.map(function (p) { return p[0] + p[1]; }).join(sep);
  tr.setText(full);
  tr.getTextStyle().setFontFamily('Inter').setForegroundColor(hex).setBold(false);
  if (prefix) tr.getRange(0, prefix.length).getTextStyle().setFontSize(prefixSize || 11);
  tr.getRange(prefix.length, full.length).getTextStyle().setFontSize(12);
  var pos = prefix.length;
  parts.forEach(function (p) {
    tr.getRange(pos, pos + p[0].length).getTextStyle().setBold(true);
    pos += p[0].length + p[1].length + sep.length;
  });
}

// ---------- New PDS ----------

// Filled in by pds.mjs when the library is deployed (the repo never holds the id)
var TEMPLATE_ID = 'TEMPLATE_ID_SET_AT_DEPLOY';

// A copy of the template, named as asked, in the same folder as this deck. The template carries the menu,
// so the new file is ready for Set up deck.
function newPds(d) {
  var name = String(d.name || '').trim();
  if (!name) throw new Error('Please give the file a name.');
  var here = DriveApp.getFileById(deck_().getId());
  var parents = here.getParents();
  if (!parents.hasNext()) throw new Error('Could not find the folder this deck is in.');
  var folder = parents.next();
  var copy = DriveApp.getFileById(TEMPLATE_ID).makeCopy(name, folder);
  return { name: copy.getName(), url: copy.getUrl(), folder: folder.getName() };
}

function showNewPds() {
  var html =
    '<style>' + CSS + '</style>' +
    '<p class="hint">Makes a fresh copy of the PDS template in the same folder as this deck. Open it, then use <b>PDS → Set up deck…</b>.</p>' +
    field_('name', 'File name', 'XXX#### - Game Name - PDS') +
    '<button id="go" onclick="make()">Create</button><p id="msg"></p>' +
    '<script>function make(){busy();google.script.run.withSuccessHandler(made).withFailureHandler(fail).pdsCall("newPds",{name:document.getElementById("name").value})}' +
    'function made(r){document.getElementById("go").disabled=false;var e=document.getElementById("msg");e.className="";' +
    'e.innerHTML="Created <b>"+r.name.replace(/</g,"&lt;")+"</b> in "+r.folder.replace(/</g,"&lt;")+".<br><a target=_blank href=\\""+r.url+"\\">Open it</a>"}' + JS + '</script>';
  SlidesApp.getUi().showSidebar(HtmlService.createHtmlOutput(html).setTitle('PDS · New PDS'));
}

// ---------- Set up deck ----------

function saveSetup(d) {
  ['game', 'item', 'owner', 'created'].forEach(function (k) { d[k] = String(d[k] || '').trim(); if (!d[k]) throw new Error('Please fill in every box.'); });
  var before = current_().created;
  var layouts = pdsLayouts_();
  Object.keys(layouts).forEach(function (k) {
    layouts[k].getShapes().forEach(function (s) { if (s.getText().asString().indexOf('Item #:') >= 0) writeItemLine_(s, d.item, d.game, d.owner); });
  });
  var pages = 0;
  deck_().getSlides().forEach(function (s) {
    var kind = slideKind_(s);
    if (!kind || kind === ARCHIVE || s.isSkipped()) return;
    var f = fields_(s);
    if (GAME_PAGES.indexOf(kind) >= 0) setText_(f.title, d.game);
    // Only pages still on the deck's original date (or blank) take the new one; pages added later keep theirs
    var c = text_(f.created);
    if (f.created && (!c || c === BLANK_DATE || c === before)) setText_(f.created, d.created);
    // A page never revised yet shows its creation date as Date Revised
    var r = text_(f.revised);
    if (f.revised && (!r || r === BLANK_DATE)) setText_(f.revised, text_(f.created) || d.created);
    pages++;
  });
  return 'Saved. Item info updated on every page type; ' + pages + ' pages checked.';
}

function showSetup() {
  var c = current_();
  var html =
    '<style>' + CSS + '</style>' +
    '<p class="hint">Fills the frame on every page. Run it again any time something changes.</p>' +
    field_('game', 'Game Name (also used as Item Name)', c.game) +
    field_('item', 'Item #', c.item) +
    field_('owner', 'Project Owner', c.owner) +
    field_('created', 'Date Created (copied to every page)', c.created) +
    '<button id="go" onclick="save()">Save</button><p id="msg"></p>' +
    '<p class="hint" style="margin-top:24px">PDS Tools ' + VERSION + ' — shared library; updates reach every PDS deck automatically.</p>' +
    '<script>function save(){var d={};["game","item","owner","created"].forEach(function(k){d[k]=document.getElementById(k).value});' +
    'busy();google.script.run.withSuccessHandler(done).withFailureHandler(fail).pdsCall("saveSetup",d)}' + JS + '</script>';
  SlidesApp.getUi().showSidebar(HtmlService.createHtmlOutput(html).setTitle('PDS · Set up deck'));
}

// ---------- Add pages ----------

function addPages(d) {
  var types = (d.types || []).filter(function (t) { return ADDABLE.indexOf(t) >= 0; });
  if (!types.length) throw new Error('Tick at least one page type.');
  var name = String(d.name || '').trim();
  if (!name && types.some(function (t) { return SECTION[t] === 3; })) throw new Error('Component pages need the component name — it keeps its pages together.');
  var layouts = pdsLayouts_();
  var deck = deck_();
  var info = current_();
  var today = today_(), first = null;
  // In page order, so a component's new pages line up Control → Color & Deco → Texture
  types.sort(function (a, b) { return ADDABLE.indexOf(a) - ADDABLE.indexOf(b); });
  types.forEach(function (t) {
    if (!layouts[t]) throw new Error('This deck has no "' + t + '" layout.');
    var s = deck.insertSlide(placeFor_(t, name), layouts[t]);
    var f = fields_(s);
    if (GAME_PAGES.indexOf(t) >= 0) setText_(f.title, info.game || 'Game Name');
    else if (name) setText_(f.title, name);
    setText_(f.created, today);
    setText_(f.revised, today);
    setText_(f.status, 'DRAFT');
    if (t === 'PDS - Color & Deco') addCallout_(s);
    if (!first) first = s;
  });
  if (first) first.selectAsCurrentPage();
  return 'Added ' + types.length + ' page' + (types.length > 1 ? 's' : '') + ', dated ' + today + '.';
}

// One ready-made callout: info card (swatch + Pantone + method + artwork) and a real line, dot on the free end,
// attached to the card's left side — drag the dot to the part; the line stays on the card. Select both + Ctrl+D for more.
function addCallout_(slide) {
  var card = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 790, 210, 320, 82);
  card.getFill().setSolidFill('#FFFFFF');
  card.getBorder().setWeight(1.5).getLineFill().setSolidFill('#333333');
  var swatch = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, 802, 231, 40, 40);
  swatch.getFill().setSolidFill('#D9D9D9');
  swatch.getBorder().setWeight(1).getLineFill().setSolidFill('#333333');
  var text = slide.insertTextBox('PMS XXX C' + String.fromCharCode(10) + 'Tampo 1 · 1C · top face' + String.fromCharCode(10) + 'Art: XXX####_part_v1.ai', 850, 214, 256, 74);
  text.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
  var tr = text.getText();
  tr.getTextStyle().setFontFamily('Inter').setFontSize(11).setForegroundColor('#1F1F1F').setBold(false);
  tr.getRange(0, 9).getTextStyle().setFontSize(13).setBold(true);
  var line = slide.insertLine(SlidesApp.LineCategory.STRAIGHT, 640, 251, 790, 251);
  line.setStartArrow(SlidesApp.ArrowStyle.FILL_CIRCLE);
  line.setWeight(1.5);
  line.getLineFill().setSolidFill('#333333');
  line.setEndConnection(card.getConnectionSites()[1]);
  slide.group([card, swatch, text]);
}

// ---------- Page order (the placement SOP, Muzzy 28 Oct 2026) ----------
// Deck order: 1 Overview · 2 How to Play · 3 Components (one group per component: Control → Color & Deco → Texture) ·
//             4 Printed Sheets · 5 Packaging · then the Archive divider and archived pages.
// A new page goes:
//   - Overview / How to Play / Printed Sheet / Packaging → after the last live page of the same type
//   - component page, component already has pages → inside its group, after its last page of the same or an
//     earlier type (so Control lands first, Texture last); before the group if nothing earlier exists
//   - component page, new component → after the last component page (new group at the end of section 3)
//   - nothing of that kind yet → after the last page of any earlier section; at the very start if none
//   - never inside the Archive. Pages that aren't PDS pages are ignored when working this out.
var SECTION = { 'PDS - Overview': 1, 'PDS - How to Play': 2, 'PDS - Control Drawing': 3, 'PDS - Color & Deco': 3, 'PDS - Texture & Finish': 3, 'PDS - Printed Sheet': 4, 'PDS - Packaging': 5 };
var COMPONENT_ORDER = { 'PDS - Control Drawing': 1, 'PDS - Color & Deco': 2, 'PDS - Texture & Finish': 3 };

function placeFor_(kind, name) {
  var slides = deck_().getSlides();
  var div = divider_();
  var limit = div ? div.index : slides.length;
  var info = [];
  for (var i = 0; i < limit; i++) {
    var k = slides[i].isSkipped() ? null : slideKind_(slides[i]);
    info.push({ kind: k, name: k && SECTION[k] === 3 ? text_(fields_(slides[i]).title) : '' });
  }
  return placeIndex(info, kind, name);
}

// Pure placement maths (no Slides calls) so tests can run it: info = the pages before the Archive, in order,
// each { kind: 'PDS - …' or null, name: component name }. Returns the index the new page goes at.
function placeIndex(pages, kind, name) {
  var info = pages.map(function (p) { return { sec: p.kind ? SECTION[p.kind] || null : null, kind: p.kind, name: String(p.name || '').trim().toLowerCase() }; });
  var limit = info.length;
  var sec = SECTION[kind];
  var last = function (test) { for (var j = info.length - 1; j >= 0; j--) if (test(info[j])) return j; return -1; };
  var at;
  var key = String(name || '').trim().toLowerCase();
  if (sec === 3 && key) {
    var inGroup = function (x) { return x.sec === 3 && x.name === key; };
    var groupLast = last(inGroup);
    if (groupLast >= 0) {
      var before = last(function (x) { return inGroup(x) && COMPONENT_ORDER[x.kind] <= COMPONENT_ORDER[kind]; });
      if (before >= 0) return before + 1;
      for (var g = 0; g < info.length; g++) if (inGroup(info[g])) return g;
    }
  }
  at = last(function (x) { return x.sec === sec; });
  if (at < 0) at = last(function (x) { return x.sec !== null && x.sec < sec; });
  return Math.min(at + 1, limit);
}

function showAddPages() {
  var boxes = ADDABLE.map(function (t) {
    var on = COMPONENT_SET.indexOf(t) >= 0 ? ' checked' : '';
    return '<label class="row"><input type="checkbox" value="' + t + '"' + on + '> ' + t.replace(PREFIX, '') + '</label>';
  }).join('');
  var html =
    '<style>' + CSS + '</style>' +
    '<p class="hint">New pages are dated today and placed in deck order: Overview · How to Play · Components (Control → Color &amp; Deco → Texture, grouped by name) · Printed Sheets · Packaging. Same name as an existing component = joins its group.</p>' +
    field_('name', 'Name (required for component pages; e.g. "Spoon", "Instruction Sheet", "Retail Box")', '') +
    '<div class="label">Page types</div>' + boxes +
    '<button id="go" onclick="add()">Add pages</button><p id="msg"></p>' +
    '<script>function add(){var t=[].slice.call(document.querySelectorAll("input[type=checkbox]:checked")).map(function(b){return b.value});' +
    'busy();google.script.run.withSuccessHandler(done).withFailureHandler(fail).pdsCall("addPages",{name:document.getElementById("name").value,types:t})}' + JS + '</script>';
  SlidesApp.getUi().showSidebar(HtmlService.createHtmlOutput(html).setTitle('PDS · Add pages'));
}

// ---------- Revised today ----------

function markRevisedToday() {
  var today = today_(), n = 0;
  selectedSlides_().forEach(function (s) { var f = fields_(s); if (f.revised) { setText_(f.revised, today); n++; } });
  SlidesApp.getUi().alert(n ? 'Date Revised set to ' + today + ' on ' + n + ' page' + (n > 1 ? 's' : '') + '.' : 'Select one or more PDS pages in the left strip first.');
}

// ---------- Status ----------

// The status pill: wording + colour. Draft keeps the layout's own pill colour (box stays see-through).
var STATUS_LOOK = { 'DRAFT': null, 'REVISIONS NEEDED': ['#FFD6D2', '#8A1C13'], 'COMPLETE': ['#D3F1DC', '#1E6B34'],
  'SUPERSEDED': ['#0A1460', '#FFFFFF'], 'DROPPED': ['#4A4A4A', '#FFFFFF'] };

function setStatus_(status) {
  var n = 0;
  selectedSlides_().forEach(function (s) { var f = fields_(s); if (paintStatus_(f.status, status, f.created)) n++; });
  if (!n) SlidesApp.getUi().alert('Select one or more PDS pages in the left strip first.');
}

// inkFrom: a box on the same bar (Date Created), whose text colour is the bar's normal text colour
function paintStatus_(box, status, inkFrom) {
  if (!box) return false;
  box.getText().setText(status);
  var look = STATUS_LOOK[status];
  if (look) { box.getFill().setSolidFill(look[0]); box.getText().getTextStyle().setForegroundColor(look[1]); return true; }
  box.getFill().setTransparent();
  var ink = inkFrom && inkFrom.getText().getLength() > 1 ? inkFrom.getText().getRange(0, 1).getTextStyle().getForegroundColor() : null;
  if (ink) box.getText().getTextStyle().setForegroundColor(ink.asRgbColor().asHexString());
  return true;
}

// ---------- Archive ----------

// Two ways to archive (Muzzy, 28 Oct 2026):
//   replace — the page changed: an exact copy goes to the Archive marked SUPERSEDED; the live page stays as it is, Date Revised = today
//   drop    — the component is gone: the page itself goes to the Archive marked DROPPED
// Either way the archived page is skipped and goes AFTER the Archive divider.
function archivePages(d) {
  var reason = String(d.reason || '').trim();
  if (!reason) throw new Error('Please give a reason.');
  if (d.mode !== 'replace' && d.mode !== 'drop') throw new Error('Choose Replace or Drop.');
  var deck = deck_(), today = today_(), done = 0;
  var div = divider_() || makeDivider_();
  // Use what is selected NOW (the panel stays open between archives); fall back to what was selected when it opened
  var now = [];
  try { now = selectedSlides_().map(function (s) { return s.getObjectId(); }); } catch (e) {}
  var ids = now.length ? now : (d.ids || []);
  ids.forEach(function (id) {
    var live = deck.getSlideById(id);
    if (!live || live.isSkipped() || slideKind_(live) === ARCHIVE) return;
    // Always band a fresh copy: the editor doesn't redraw a page that's open on screen when a script changes it.
    // Drop then removes the original, so the result is the page itself moved — but visibly banded.
    var archived = live.duplicate();
    toEnd_(archived);
    archived.setSkipped(true);
    stampBand_(archived, div.slide, d.mode, today, reason);
    var af = fields_(archived);
    paintStatus_(af.status, d.mode === 'drop' ? 'DROPPED' : 'SUPERSEDED', af.created);
    if (d.mode === 'replace') setText_(fields_(live).revised, today);
    else live.remove();
    done++;
  });
  return done ? 'Archived ' + done + ' page' + (done > 1 ? 's' : '') + ' after the Archive divider.' : 'Nothing archived — select live PDS pages (not ones already in the Archive).';
}

// Unarchive: band off, back to its proper place in the deck (page-order rule), not skipped, Revised today, COMPLETE.
// Works on a fresh copy and removes the archived page, so the editor shows the result straight away.
function unarchiveSelected() {
  var div = divider_(), today = today_(), n = 0;
  selectedSlides_().forEach(function (old) {
    var kind = slideKind_(old);
    if (!kind || kind === ARCHIVE || !old.isSkipped()) return;
    var page = old.duplicate();
    old.remove();
    page.getShapes().forEach(function (s) { if (/^(SUPERSEDED|DROPPED)/.test(s.getText().asString())) s.remove(); });
    page.setSkipped(false);
    var f = fields_(page);
    page.move(placeFor_(kind, SECTION[kind] === 3 ? text_(f.title) : ''));
    setText_(f.revised, today);
    paintStatus_(f.status, 'COMPLETE', f.created);
    if (n === 0) page.selectAsCurrentPage();
    n++;
  });
  SlidesApp.getUi().alert(n ? 'Unarchived ' + n + ' page' + (n > 1 ? 's' : '') + ' — back in place, Revised ' + today + ', status Complete.' : 'Select archived page(s) (after the Archive divider) in the left strip first.');
}

// Slide.move() counts positions before the move, so "after the last page" is the page count; checked afterwards
function toEnd_(slide) {
  var deck = deck_();
  var n = deck.getSlides().length;
  try { slide.move(n); } catch (e) { slide.move(n - 1); }
  var slides = deck.getSlides();
  if (slides[slides.length - 1].getObjectId() !== slide.getObjectId()) slides[slides.length - 1].move(slides.length - 2);
}

// Copy the divider's band (same centred spot and look) and write this archive's wording into it; draw one if the divider has none
function stampBand_(slide, dividerSlide, mode, date, reason) {
  var template = null;
  dividerSlide.getShapes().forEach(function (s) { if (!template && s.getText().asString().indexOf('SUPERSEDED') === 0) template = s; });
  var band = template ? slide.insertShape(template) : drawBand_(slide);
  band.bringToFront();
  var runs = mode === 'drop'
    ? [['DROPPED     ', 24, 'Poppins', true], ['Archived: ', 15, 'Inter', true], [date + '   |   ', 15, 'Inter', false], ['Reason: ', 15, 'Inter', true], [reason, 15, 'Inter', false]]
    : [['SUPERSEDED     ', 24, 'Poppins', true], ['Archived: ', 15, 'Inter', true], [date + '   |   ', 15, 'Inter', false], ['Reason: ', 15, 'Inter', true], [reason, 15, 'Inter', false]];
  writeRuns_(band, runs);
}

function writeRuns_(shape, runs) {
  var tr = shape.getText();
  tr.setText(runs.map(function (r) { return r[0]; }).join(''));
  tr.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
  var at = 0;
  runs.forEach(function (r) { tr.getRange(at, at + r[0].length).getTextStyle().setFontSize(r[1]).setFontFamily(r[2]).setBold(r[3]).setForegroundColor('#FFFFFF'); at += r[0].length; });
}

// The blank band (for the divider, if a deck lost it)
function drawBand_(slide) {
  var deck = deck_(), W = deck.getPageWidth(), H = deck.getPageHeight(), h = 84;
  var band = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, -6, (H - h) / 2, W + 12, h);
  band.getFill().setSolidFill('#0A1460');
  band.getBorder().setWeight(4).getLineFill().setSolidFill('#FFFFFF');
  band.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
  writeRuns_(band, [['SUPERSEDED     ', 24, 'Poppins', true], ['Archived: ', 15, 'Inter', true], [BLANK_DATE + '   |   ', 15, 'Inter', false], ['Reason: ', 15, 'Inter', true], ['________________', 15, 'Inter', false]]);
  return band;
}

function makeDivider_() {
  var layouts = pdsLayouts_();
  if (!layouts[ARCHIVE]) throw new Error('This deck has no "' + ARCHIVE + '" layout.');
  var deck = deck_();
  var s = deck.insertSlide(deck.getSlides().length, layouts[ARCHIVE]);
  s.setSkipped(true);
  drawBand_(s);
  return { slide: s, index: deck.getSlides().length - 1 };
}

function showArchive() {
  var slides = selectedSlides_().filter(function (s) { return !s.isSkipped() && slideKind_(s) !== ARCHIVE; });
  if (!slides.length) { SlidesApp.getUi().alert('Select the page(s) to archive in the left strip first.'); return; }
  var names = slides.map(function (s) { var f = fields_(s); return (slideKind_(s) || 'Page').replace(PREFIX, '') + ': ' + (text_(f.title) || 'untitled'); });
  var ids = JSON.stringify(slides.map(function (s) { return s.getObjectId(); }));
  var choice = function (mode, title, line, on) {
    return '<label class="choice' + (on ? ' on' : '') + '" id="c_' + mode + '"><input type="radio" name="mode" value="' + mode + '"' + (on ? ' checked' : '') + ' onchange="pick()">' +
      '<b>' + title + '</b><span>' + line + '</span></label>';
  };
  var html =
    '<style>' + CSS + '.choice{display:block;border:1.5px solid #ccc;border-radius:6px;padding:10px;margin:8px 0;cursor:pointer}.choice.on{border-color:#002ee7;background:#eef1fe}' +
    '.choice input{margin-right:6px}.choice span{display:block;color:#555;font-size:12px;margin-top:4px;line-height:1.4}</style>' +
    '<p class="hint">Archives the page(s) selected in the left strip <b>when you click Archive</b> — any page type. This panel can stay open for the next one.<br>Selected when opened: ' + names.map(esc_).join(', ') + '</p>' +
    choice('replace', 'Replace — the page changed', 'An exact copy goes to the Archive marked SUPERSEDED. This page stays as it is, with Date Revised set to today — then update it.', true) +
    choice('drop', 'Drop — the component is gone', 'This page itself moves to the Archive marked DROPPED. Nothing is left behind.', false) +
    field_('reason', 'Reason (required)', '') +
    '<button id="go" onclick="arch()">Archive</button><p id="msg"></p>' +
    '<script>function mode(){return document.querySelector("input[name=mode]:checked").value}' +
    'function pick(){["replace","drop"].forEach(function(m){document.getElementById("c_"+m).className="choice"+(mode()===m?" on":"")})}' +
    'function arch(){busy();google.script.run.withSuccessHandler(done).withFailureHandler(fail).pdsCall("archivePages",{ids:' + ids + ',mode:mode(),reason:document.getElementById("reason").value})}' + JS + '</script>';
  SlidesApp.getUi().showSidebar(HtmlService.createHtmlOutput(html).setTitle('PDS · Archive pages'));
}

function showAbout() {
  SlidesApp.getUi().alert('PDS Tools ' + VERSION + '\n\nShared library: updates reach every PDS deck automatically.\nDates use the format ' + today_() + '.');
}

// ---------- little HTML helpers ----------

function esc_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
function field_(id, label, value) { return '<div class="label">' + esc_(label) + '</div><input id="' + id + '" value="' + esc_(value) + '">'; }
var CSS = 'body{font-family:Arial,sans-serif;font-size:13px;color:#1f1f1f;margin:12px}.label{font-weight:bold;font-size:11px;margin:12px 0 4px;color:#444}' +
  'input:not([type]){width:100%;box-sizing:border-box;padding:7px;border:1px solid #bbb;border-radius:4px;font-size:13px}.row{display:block;margin:6px 0}' +
  'button{margin-top:16px;padding:9px 16px;background:#002ee7;color:#fff;border:0;border-radius:4px;font-size:13px;cursor:pointer}button:disabled{background:#999}' +
  '.hint{color:#555;font-size:12px;line-height:1.4}#msg{margin-top:10px;font-size:12px}.err{color:#b00020}';
var JS = 'function busy(){document.getElementById("go").disabled=true;document.getElementById("msg").textContent="Working…"}' +
  'function done(m){document.getElementById("go").disabled=false;var e=document.getElementById("msg");e.className="";e.textContent=m}' +
  'function fail(err){document.getElementById("go").disabled=false;var e=document.getElementById("msg");e.className="err";e.textContent=err.message||err}';
