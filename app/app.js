// Leonida Ledger — GTA VI trophy guide & tracker.
// Static, offline: the only fetch is the app's own data/trophies.json.
// Progress, counters and notes live in localStorage; export/import move them as JSON.
const STORAGE_KEY = 'leonida-ledger-gta6-v1';
const DATA_URL = 'data/trophies.json';

const KIND_LABELS = {
  story: 'Story', side: 'Side stories', collectible: 'Collectibles', activity: 'Activities',
  crime: 'Crime', money: 'Money', misc: 'Odd moments', completion: '100% & Platinum', platinum: 'Platinum',
};
const KIND_FILTERS = [
  ['all', 'All'], ['story', 'Story'], ['missable', 'Missable & at-risk'], ['collectible', 'Collectibles'],
  ['activity', 'Activities'], ['crime', 'Crime'], ['side', 'Side stories'], ['money', 'Money'], ['online', 'Online'],
];
const ROADMAP_STAGES = [
  { stage: 1, title: 'Play the story — Chapters 1–4 + finale', blurb: 'Twelve trophies pop as you play. Keep a manual save at the start of every chapter. In Chapter 1, do Lucia’s balcony meditation (see Missables). In Chapter 3, race Yago the moment his race appears.' },
  { stage: 2, title: 'Side stories — strangers & friends', blurb: 'Seven trophies: the final mission for Andy, Kenton, Billy, Randy and Tyrone, Bret’s hunt, and 8 stranger strands. Finales stay open after the story, so nothing here is rushed — except Yago’s race in Stage 1.' },
  { stage: 3, title: 'Partner & crime — robberies with your partner', blurb: 'Ten trophies. Bring your partner: vaults, shops and armored trucks all need two pairs of hands, and escaping with your partner pops Hot Together on the way.' },
  { stage: 4, title: 'Activities, collectibles & exploration', blurb: 'Fourteen trophies: stunts, shooting range, drone races, races, fishing, arcade, meditation, cards, WAiNK, challenges, vehicles, all 52 areas, and bowling. Grind these in free roam, a few at a time.' },
  { stage: 5, title: 'Money & odd moments', blurb: 'Ten trophies: spend and launder money, buy the eight garages, register ten cars, and the strange one-offs — the cocktail, the showroom, the gym, the retry, the weird encounter, the melee drive-by.' },
  { stage: 6, title: '100% completion, then the Platinum', blurb: 'Two trophies. Finish the in-game 100% checklist (Progress → Stats → 100% Completion) and the platinum, Vice Got a Price!, pops by itself.' },
];
const DEMO_EARNED = [2, 3, 8, 20, 21, 33, 36, 39, 44, 46, 47, 50, 51];
const DEMO_COUNTERS = { 15: 137, 28: 6, 31: 42, 32: 23, 35: 61, 42: 20 };

let trophies = [];
let state = { earned: [], counters: {}, notes: {}, spoiler: true, kind: 'all', grade: 'all', show: 'all', search: '', selected: 15, view: 'tracker' };

function trophyById(id) { return trophies.find((t) => t.id === id); }
function isEarned(t) { return state.earned.includes(t.id); }
function isSpoiled(t) { return state.spoiler && t.hidden && !isEarned(t); }
function kindCount(kind) {
  if (kind === 'all') return trophies.length;
  if (kind === 'missable') return trophies.filter((t) => t.missable || t.atRisk).length;
  if (kind === 'online') return 0;
  return trophies.filter((t) => t.kind === kind).length;
}

async function loadTrophies() {
  const response = await fetch(DATA_URL);
  const doc = await response.json();
  trophies = doc.trophies;
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    state = { ...state, ...saved };
  } catch { /* a corrupt save starts fresh */ }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    earned: state.earned, counters: state.counters, notes: state.notes, spoiler: state.spoiler,
  }));
}

function applyScreenshotSeed() {
  // ?shot=cover|roadmap|missables|spoiler seeds the same demo progress (13 of 55)
  // so screenshots show a real, half-played tracker. Normal visits are untouched.
  const shot = new URLSearchParams(location.search).get('shot');
  if (!shot) return;
  state.earned = [...DEMO_EARNED];
  state.counters = { ...DEMO_COUNTERS };
  state.spoiler = true;
  if (shot === 'cover') { state.view = 'tracker'; state.kind = 'all'; state.selected = 15; }
  if (shot === 'roadmap') { state.view = 'roadmap'; state.spoiler = false; }
  if (shot === 'missables') { state.view = 'missables'; state.selected = 28; }
  if (shot === 'spoiler') { state.view = 'tracker'; state.kind = 'story'; state.selected = 2; }
  saveState();
}

function filteredTrophies() {
  const q = state.search.trim().toLowerCase();
  return trophies.filter((t) => {
    if (state.kind === 'missable' && !(t.missable || t.atRisk)) return false;
    if (state.kind === 'online') return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.show === 'earned' && !isEarned(t)) return false;
    if (state.show === 'todo' && isEarned(t)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function nextUpTrophy() {
  const ordered = [...trophies].sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  return ordered.find((t) => !isEarned(t)) || null;
}

function renderProgress() {
  const earned = trophies.filter(isEarned);
  document.getElementById('bigCount').textContent = `${earned.length} / ${trophies.length}`;
  document.getElementById('barFill').style.width = `${(earned.length / trophies.length) * 100}%`;
  const byGrade = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = earned.filter((t) => t.grade === g).length;
    return `${got}/${total} ${g}`;
  }).join(' · ');
  document.getElementById('gradeCounts').textContent = byGrade;
  const next = nextUpTrophy();
  document.getElementById('nextUp').innerHTML = !next
    ? 'Platinum earned — every trophy is ticked. Leonida Legend.'
    : isSpoiled(next)
      ? 'Next up: <strong>a hidden story trophy</strong> — keep playing the story (spoilers hidden).'
      : `Next up: <strong>${escapeHtml(next.name)}</strong> — ${escapeHtml(next.description)}`;
}

function renderKindChips() {
  const wrap = document.getElementById('kindChips');
  wrap.replaceChildren();
  for (const [kind, label] of KIND_FILTERS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (state.kind === kind ? ' active' : '');
    b.innerHTML = `${escapeHtml(label)} <span class="n">${kindCount(kind)}</span>`;
    b.addEventListener('click', () => { state.kind = kind; renderAll(); });
    wrap.append(b);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function medalLetter(grade) { return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[grade] || '?'; }

function renderTrophyList() {
  const list = document.getElementById('trophyList');
  const shown = filteredTrophies();
  const earnedShown = shown.filter(isEarned).length;
  document.getElementById('listMeta').textContent = state.kind === 'online'
    ? 'No online trophies — every one of the 55 is single-player. Nothing to filter here.'
    : `Showing ${shown.length} of ${trophies.length} trophies · ${earnedShown} earned in this view`;
  list.replaceChildren();
  if (shown.length === 0) {
    const li = document.createElement('li');
    li.textContent = state.kind === 'online'
      ? 'No online trophies exist for GTA VI. Every trophy is earned in single-player.'
      : 'No trophies match these filters. Clear the search or pick another kind.';
    list.append(li);
    return;
  }
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = (isEarned(t) ? 'earned' : '') + (state.selected === t.id ? ' selected' : '');
    li.addEventListener('click', () => { state.selected = t.id; renderAll(); });
    const row = document.createElement('div');
    row.className = 'trophy-row';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) state.earned.push(t.id); else state.earned = state.earned.filter((id) => id !== t.id);
      saveState(); renderAll();
    });
    const medal = document.createElement('span');
    medal.className = `medal ${t.grade}`;
    medal.textContent = medalLetter(t.grade);
    const main = document.createElement('div');
    main.className = 'trophy-main';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.innerHTML = isSpoiled(t)
      ? `Hidden trophy <span class="hidden-tag">(story — earn it to reveal)</span>`
      : escapeHtml(t.name);
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = isSpoiled(t) ? 'Hidden until earned — tick it off to reveal its name and description.' : t.description;
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    tags.innerHTML = `<span class="tag">${escapeHtml(KIND_LABELS[t.kind] || t.kind)}</span>`
      + `<span class="tag grade-${t.grade}">${escapeHtml(t.grade)}</span>`
      + (t.missable ? '<span class="tag missable">⚠ Missable</span>' : '')
      + (t.atRisk ? '<span class="tag atrisk">⚠ Time-sensitive</span>' : '')
      + (t.hidden && !isEarned(t) ? '<span class="tag">Hidden</span>' : '');
    main.append(name, desc, tags);
    if (t.target) main.append(counterControl(t));
    row.append(box, medal, main);
    li.append(row);
    list.append(li);
  }
}

function counterControl(t) {
  const wrap = document.createElement('span');
  wrap.className = 'counter';
  const value = state.counters[t.id] || 0;
  wrap.innerHTML = `<button type="button" data-d="-1" aria-label="Decrease counter">−</button>`
    + `<span>${value} / ${t.target}</span>`
    + `<button type="button" data-d="1" aria-label="Increase counter">+</button>`;
  wrap.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      setCounter(t.id, value + Number(b.dataset.d));
    });
  });
  return wrap;
}

function setCounter(id, value) {
  const t = trophyById(id);
  state.counters[id] = Math.max(0, Math.min(t.target, value));
  saveState(); renderAll();
}

function renderDetailPane() {
  const pane = document.getElementById('detailPane');
  const t = trophyById(state.selected) || trophies[0];
  if (!t) { pane.textContent = 'Loading…'; return; }
  pane.replaceChildren();
  if (isSpoiled(t)) {
    const h = document.createElement('h2');
    h.textContent = 'Hidden trophy';
    const p = document.createElement('p');
    p.className = 'official';
    p.textContent = 'This is a story trophy and the spoiler setting is on. Earn it in-game (or switch “Hide story spoilers” off) to read its name, description and guide.';
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Mark as earned to reveal';
    b.addEventListener('click', () => { state.earned.push(t.id); saveState(); renderAll(); });
    const row = document.createElement('div');
    row.className = 'earn-row';
    row.append(b);
    pane.append(h, p, row);
    return;
  }
  const h = document.createElement('h2');
  h.textContent = t.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `Official: “${t.description}” — ${t.grade}${t.target ? ` · PlayStation tracks 0/${t.target}` : ''}${t.hidden ? ' · hidden on PlayStation until earned' : ''}`;
  const guideHead = document.createElement('h3');
  guideHead.textContent = 'Guide';
  const guide = document.createElement('div');
  guide.className = 'guide-text';
  const gp = document.createElement('p');
  gp.textContent = t.guide;
  guide.append(gp);
  pane.append(h, official, guideHead, guide);
  if (t.missable || t.atRisk) {
    const note = document.createElement('div');
    note.className = 'missable-note';
    note.textContent = t.missable
      ? '⚠ MISSABLE — this is the one trophy in the list that can be missed. Read the guide above before the chapter it belongs to ends, and keep a manual save from before it.'
      : '⚠ TIME-SENSITIVE — part of this trophy can pass you by. Read the guide above and act the moment the race or strand appears.';
    pane.append(note);
  }
  if (t.target) {
    const ch = document.createElement('h3');
    ch.textContent = 'Your count (PlayStation target)';
    pane.append(ch, counterControl(t));
  }
  const earnRow = document.createElement('div');
  earnRow.className = 'earn-row';
  const earnBtn = document.createElement('button');
  earnBtn.type = 'button';
  earnBtn.textContent = isEarned(t) ? '✓ Earned — tick off to undo' : 'Mark as earned';
  earnBtn.addEventListener('click', () => {
    if (isEarned(t)) state.earned = state.earned.filter((id) => id !== t.id);
    else state.earned.push(t.id);
    saveState(); renderAll();
  });
  earnRow.append(earnBtn);
  pane.append(earnRow);
  const srcHead = document.createElement('h3');
  srcHead.textContent = 'Sources';
  const src = document.createElement('p');
  src.className = 'sources-text';
  src.textContent = t.sources;
  pane.append(srcHead, src);
  const noteHead = document.createElement('h3');
  noteHead.textContent = 'Your notes';
  const note = document.createElement('textarea');
  note.value = state.notes[t.id] || '';
  note.placeholder = 'e.g. “Meditation spot 7 done — behind the lighthouse.” Notes are saved on this device only.';
  note.addEventListener('change', () => { state.notes[t.id] = note.value; saveState(); });
  pane.append(noteHead, note);
}

function renderRoadmap() {
  const wrap = document.getElementById('roadmapStages');
  wrap.replaceChildren();
  for (const s of ROADMAP_STAGES) {
    const members = trophies.filter((t) => t.stage === s.stage);
    const earned = members.filter(isEarned).length;
    const card = document.createElement('div');
    card.className = 'stage-card';
    const h = document.createElement('h3');
    h.innerHTML = `Stage ${s.stage} — ${escapeHtml(s.title)} <span class="stage-count">${earned}/${members.length} earned</span>`;
    const p = document.createElement('p');
    p.textContent = s.blurb;
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.width = `${(earned / members.length) * 100}%`;
    bar.append(fill);
    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    for (const t of members) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'stage-trophy' + (isEarned(t) ? ' earned' : '') + (t.missable ? ' missable-flag' : '');
      chip.textContent = (t.missable ? '⚠ ' : '') + (isSpoiled(t) ? 'Hidden trophy' : t.name) + ` (${t.grade})`;
      chip.addEventListener('click', () => { state.selected = t.id; setView('tracker'); });
      chips.append(chip);
    }
    card.append(h, p, bar, chips);
    wrap.append(card);
  }
}

function renderMissables() {
  const wrap = document.getElementById('missableCards');
  wrap.replaceChildren();
  const missable = trophies.find((t) => t.missable);
  const atRisk = trophies.find((t) => t.atRisk);
  const warn = document.createElement('div');
  warn.className = 'warn-card';
  warn.innerHTML = `<h3>⚠ The one missable trophy: ${escapeHtml(missable.name)}</h3>`
    + `<p><strong>Official:</strong> “${escapeHtml(missable.description)}” — bronze · PlayStation tracks 0/18.</p>`
    + `<p>${escapeHtml(missable.guide)}</p>`
    + `<p><strong>Sources:</strong> ${escapeHtml(missable.sources)}</p>`;
  const risk = document.createElement('div');
  risk.className = 'warn-card';
  risk.innerHTML = `<h3>⚠ Time-sensitive (not missable outright): ${escapeHtml(atRisk.name)}</h3>`
    + `<p><strong>Official:</strong> “${escapeHtml(atRisk.description)}” — silver · PlayStation tracks 0/8.</p>`
    + `<p>${escapeHtml(atRisk.guide)}</p>`
    + `<p><strong>Sources:</strong> ${escapeHtml(atRisk.sources)}</p>`;
  const safe = document.createElement('div');
  safe.className = 'warn-card safe';
  safe.innerHTML = `<h3>✓ Everything else is safe after the credits</h3>`
    + `<p>Every other trophy stays available in free roam after the story, including the side-story finales and the 100% checklist. The four save rules below are the whole defence:</p>`
    + `<ol><li><strong>Save at the start of every chapter.</strong> The game has 15 manual save slots plus one autosave — keep one per chapter and rotate the rest.</li>`
    + `<li><strong>Save before the final mission</strong> and keep it untouched.</li>`
    + `<li><strong>Do Lucia’s balcony meditation in Chapter 1</strong> (above) before Chapter 1 ends.</li>`
    + `<li><strong>Never use cheats on your trophy save</strong> — cheats should switch off both trophies and saving.</li></ol>`
    + `<p>Sources: the no-mission-replay, save-slot and cheat rules are from OutputLag’s GTA 6 trophy list, 19 Nov 2026; the missable call itself is built from the official descriptions.</p>`;
  wrap.append(warn, risk, safe);
}

function renderSources() {
  const body = document.getElementById('sourcesBody');
  body.innerHTML = `
    <p class="view-intro"><strong>Verified live on 19 Nov 2026.</strong> The starter list was checked name by name against Exophase and PSNProfiles: all 55 names, descriptions and grades agree, in the same order, and the PlayStation progress targets (0/N) are PSNProfiles’ own. No name, description or grade was changed.</p>
    <table class="sources-table">
      <tr><th>Source</th><th>What it supplied</th><th>Where to find it</th></tr>
      <tr><td>Exophase — Grand Theft Auto VI Trophies (PS5)</td><td>Official names, descriptions, earn rates</td><td>exophase.com/game/grand-theft-auto-vi-psn/trophies</td></tr>
      <tr><td>PSNProfiles — Grand Theft Auto VI Trophies</td><td>Official names, descriptions, grades, progress targets 0/N</td><td>psnprofiles.com/trophies/43531-grand-theft-auto-vi</td></tr>
      <tr><td>OutputLag — GTA 6 Trophy List (19 Nov 2026)</td><td>Launch-day methods: meditation, vaults, jewelry, plane, tank, garages, races</td><td>outputlag.com/guides/gta-6-trophy-list</td></tr>
      <tr><td>KeenGamer — GTA 6 Trophy Guide &amp; Platinum Roadmap</td><td>Cross-check: 55 trophies, 1 missable (Positive Mental Attitude)</td><td>keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies</td></tr>
    </table>
    <h3>Honesty note</h3>
    <p class="view-intro">GTA VI launched on 19 Nov 2026 — the day this guide was written. No guide this entry checked has had time to confirm every method in-game, so where a place or method is not pinned down by a source, the trophy’s guide says so plainly instead of inventing one. Methods taken from the launch-day guide name it in the trophy’s Sources line, and the ones it marks unconfirmed are marked unconfirmed here too. The roadmap and the missable flags are built from the official descriptions themselves, not from any walkthrough.</p>
    <h3>The list at a glance</h3>
    <p class="view-intro">55 trophies: 1 platinum (Vice Got a Price!), 2 gold (A Long Road, You Gotta Know When to Get Off), 6 silver, 46 bronze. 28 are hidden on PlayStation until earned. 0 are online — every trophy is single-player. 20 trophies carry a PlayStation progress target (from 0/3 card sets to 0/250,000 laundered dollars).</p>`;
}

function setView(view) {
  state.view = view;
  for (const v of ['tracker', 'roadmap', 'missables', 'sources']) {
    document.getElementById('view' + v[0].toUpperCase() + v.slice(1)).hidden = v !== view;
    document.getElementById('tab' + v[0].toUpperCase() + v.slice(1)).classList.toggle('active', v === view);
  }
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
  if (view === 'sources') renderSources();
}

function renderAll() {
  renderProgress();
  renderKindChips();
  renderTrophyList();
  renderDetailPane();
  if (state.view === 'roadmap') renderRoadmap();
  if (state.view === 'missables') renderMissables();
}

function exportProgress() {
  const data = { app: 'leonida-ledger-gta6', exportedAt: new Date().toISOString(), earned: state.earned, counters: state.counters, notes: state.notes };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  const data = JSON.parse(await file.text());
  const ids = (data.earned || []).map((e) => (typeof e === 'number' ? e : (trophies.find((t) => t.name === e) || {}).id)).filter((id) => trophyById(id));
  state.earned = [...new Set(ids)];
  if (data.counters) state.counters = data.counters;
  if (data.notes) state.notes = data.notes;
  saveState(); renderAll();
}

function bindControls() {
  document.getElementById('search').addEventListener('input', (e) => { state.search = e.target.value; renderTrophyList(); });
  document.getElementById('gradeFilter').addEventListener('change', (e) => { state.grade = e.target.value; renderAll(); });
  document.getElementById('earnedFilter').addEventListener('change', (e) => { state.show = e.target.value; renderAll(); });
  document.getElementById('spoilerToggle').addEventListener('change', (e) => { state.spoiler = e.target.checked; saveState(); renderAll(); });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try { await importProgress(file); } catch { alert('That file is not a Leonida Ledger progress export.'); }
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned ticks, counters and notes on this device?')) return;
    state.earned = []; state.counters = {}; state.notes = {};
    saveState(); renderAll();
  });
  for (const v of ['tracker', 'roadmap', 'missables', 'sources']) {
    document.getElementById('tab' + v[0].toUpperCase() + v.slice(1)).addEventListener('click', () => setView(v));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault(); document.getElementById('search').focus();
    }
  });
}

await loadTrophies();
loadSavedState();
applyScreenshotSeed();
document.getElementById('spoilerToggle').checked = state.spoiler;
const hashView = (location.hash || '').replace('#/', '');
if (['tracker', 'roadmap', 'missables', 'sources'].includes(hashView) && !new URLSearchParams(location.search).get('shot')) state.view = hashView;
bindControls();
setView(state.view);
renderAll();
