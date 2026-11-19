// Leonida Ledger — Fourth Edition. Renders the tracker, the platinum roadmap,
// the missables page and the sources page from app/data/trophies.json. All state
// lives in store.js (localStorage); nothing here fetches anything but the local
// trophy file, and the app makes no network request at run time.

import {
  blankState,
  exportText,
  getCount,
  gradeCounts,
  isEarned,
  loadState,
  parseImport,
  saveState,
  setCount,
  setNote,
  toggleEarned,
} from './store.js';
import {
  KIND_LABELS,
  KIND_ORDER,
  displayDescription,
  displayName,
  gradeLabel,
  isSpoilerHidden,
  kindCount,
  nextUp,
  stageProgress,
  visibleTrophies,
} from './filters.js';

// The order to play the list in: story, side stories, crime, activities,
// collectibles and money, then 100% completion and the platinum.
const PLAY_ORDER = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
  22, 23, 24, 25, 26, 27, 29,
  33, 34, 36, 37, 38, 39, 40, 41, 43,
  15, 16, 17, 18, 19, 20, 21, 28, 32, 46,
  30, 31, 35, 42, 44, 45, 47, 48, 49, 50, 51, 52, 53, 54, 55,
  14, 1,
];

const STAGES = [
  {
    title: 'Stage 1 — Play the story — Chapters 1–4 + finale',
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    text: 'Twelve trophies pop as you play. Keep a manual save at the start of every chapter. In Chapter 1, do Lucia\u2019s balcony meditation (see Missables). In Chapter 3, race Yago the moment his race appears. Character switching opens after Breakfast Run in Chapter 2 — learn it early, because the partner trophies need it.',
  },
  {
    title: 'Stage 2 — Side stories — strangers & friends',
    ids: [22, 23, 24, 25, 26, 27, 29],
    text: 'Seven trophies: the final mission for Andy, Kenton, Billy, Randy and Tyrone, Bret\u2019s hunt, and eight stranger strands. Finales stay open after the story, so nothing here is rushed — but do Yago\u2019s race in Chapter 3, because that strand is time-sensitive. Andy\u2019s strand is Lucia-only; Tyrone\u2019s and Bret\u2019s are Jason-only.',
  },
  {
    title: 'Stage 3 — Crime & partner — robberies with your partner',
    ids: [33, 34, 36, 37, 38, 39, 40, 41, 43],
    text: 'Nine trophies, and most of them need your partner beside you. Bank vaults open through That\u2019s Where The Money Is near the end of Chapter 4; jewelry stores open with the Snap Gun in Chapter 3. Escape the red heat zone, not just the flashing search area, or the trophy will not pop.',
  },
  {
    title: 'Stage 4 — Activities & skills — races, ranges, stunts',
    ids: [15, 16, 17, 18, 19, 20, 21, 28, 32, 46],
    text: 'Ten trophies: 250 stunts (300 for 100%), gold in all 42 Shooting Range challenges, a win at all 14 Top Fun drone locations, 20 different races, 18 meditation spots, 50 Challenges, and the rest of the nine activity types. None of it is missable — grind it at your own pace after the story.',
  },
  {
    title: 'Stage 5 — Collectibles, money & odd moments',
    ids: [30, 31, 35, 42, 44, 45, 47, 48, 49, 50, 51, 52, 53, 54, 55],
    text: 'Fifteen trophies: three card sets, 100 WAiNK locations, 100 vehicles, all 52 areas, eight garages, ten Scooter Bros registrations, $250,000 laundered, $100,000 spent, 500 profile actions, and five odd moments whose methods are still unconfirmed at launch. Explore as you go and these fall into place.',
  },
  {
    title: 'Stage 6 — 100% completion & the platinum',
    ids: [14, 1],
    text: 'Two trophies to finish. The 100% checklist appears after the story under Progress, Stats, 100% Completion: 300 stunts, 70 of the 80 Challenges, 200 of the 277 vehicle models, all eight vaults and all 39 illegal operations. When A Long Road pops, the platinum follows at once.',
  },
];

const state = loadState();
let trophies = [];
const byId = new Map();

const $ = (id) => document.getElementById(id);

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeBadge(grade) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[grade] ?? '?';
}

function trophyChips(t) {
  const chips = [];
  const kindLabel = KIND_LABELS[t.kind] ?? t.kind;
  if (kindLabel.toLowerCase() !== t.grade) chips.push(el('span', 'chip', kindLabel));
  chips.push(el('span', 'chip', gradeLabel(t.grade)));
  if (t.hidden) chips.push(el('span', 'chip chip-dim', 'Hidden'));
  if (t.missable) chips.push(el('span', 'chip chip-warn', 'Missable'));
  if (t.atRisk) chips.push(el('span', 'chip chip-warn', 'At-risk'));
  if (t.target) chips.push(el('span', 'chip', `PSN ${getCount(state, t.name)} / ${t.target} ${t.targetUnit ?? ''}`.trim()));
  return chips;
}

function renderHeader() {
  const counts = gradeCounts(trophies, state);
  $('progress-count').textContent = `${state.earned.length} / ${trophies.length}`;
  $('progress-bar').style.width = `${Math.round((state.earned.length / trophies.length) * 100)}%`;
  $('grade-line').textContent =
    `${counts.platinum[0]}/${counts.platinum[1]} platinum · ${counts.gold[0]}/${counts.gold[1]} gold · ` +
    `${counts.silver[0]}/${counts.silver[1]} silver · ${counts.bronze[0]}/${counts.bronze[1]} bronze`;
  const next = nextUp(PLAY_ORDER.map((id) => byId.get(id)).filter(Boolean), state);
  $('next-up').textContent = next ? next.label : 'Every trophy earned — the platinum is yours.';
  const themeBtn = $('theme-toggle');
  themeBtn.textContent = state.theme === 'dark' ? '◐ Dark theme — tap for light' : '◑ Light theme — tap for dark';
  document.documentElement.dataset.theme = state.theme;
}

function renderTabs() {
  for (const btn of document.querySelectorAll('.tab')) {
    btn.classList.toggle('active', btn.dataset.tab === state.tab);
    btn.setAttribute('aria-selected', btn.dataset.tab === state.tab ? 'true' : 'false');
  }
  for (const panel of document.querySelectorAll('.panel')) {
    panel.hidden = panel.id !== `panel-${state.tab}`;
  }
}

function renderChips() {
  const wrap = $('kind-chips');
  wrap.replaceChildren();
  for (const kind of KIND_ORDER) {
    const btn = el('button', 'chip-btn', `${KIND_LABELS[kind]} ${kindCount(trophies, kind)}`);
    btn.type = 'button';
    btn.classList.toggle('active', state.kind === kind);
    btn.addEventListener('click', () => {
      state.kind = kind;
      saveState(state);
      renderChips();
      renderList();
    });
    wrap.append(btn);
  }
}

function renderList() {
  const list = visibleTrophies(trophies, state);
  $('summary-line').textContent =
    `Showing ${list.length} of ${trophies.length} trophies · ${list.filter((t) => isEarned(state, t.name)).length} earned in this view`;
  const wrap = $('trophy-list');
  wrap.replaceChildren();
  for (const t of list) {
    const card = el('article', 'trophy-card');
    if (state.selected === t.name) card.classList.add('selected');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(state, t.name);
    box.setAttribute('aria-label', `Mark ${displayName(t, state)} as earned`);
    box.addEventListener('change', () => {
      toggleEarned(state, t.name);
      renderHeader();
      renderList();
      renderDetail();
      if (state.tab === 'roadmap') renderRoadmap();
      if (state.tab === 'missables') renderMissables();
    });
    const badge = el('span', `grade-badge grade-${t.grade}`, gradeBadge(t.grade));
    const body = el('div', 'trophy-body');
    body.append(el('h3', 'trophy-name', displayName(t, state)), el('p', 'trophy-desc', displayDescription(t, state)));
    const chips = el('div', 'chips');
    for (const c of trophyChips(t)) chips.append(c);
    body.append(chips);
    card.append(box, badge, body);
    card.addEventListener('click', (event) => {
      if (event.target === box) return;
      state.selected = t.name;
      saveState(state);
      renderList();
      renderDetail();
    });
    wrap.append(card);
  }
}

function renderDetail() {
  const panel = $('detail');
  panel.replaceChildren();
  const t = trophies.find((x) => x.name === state.selected) ?? visibleTrophies(trophies, state)[0];
  if (!t) {
    panel.append(el('p', 'detail-empty', 'No trophy matches the current filters.'));
    return;
  }
  if (isSpoilerHidden(t, state)) {
    panel.append(
      el('h2', 'detail-name', 'Hidden story trophy'),
      el('p', 'detail-official', 'This story trophy is hidden until you earn it. Turn off “Hide story spoilers” to reveal it, or earn it in the game first.'),
    );
    return;
  }
  const kindLabel = KIND_LABELS[t.kind] ?? t.kind;
  const metaParts = [gradeLabel(t.grade), t.hidden ? 'hidden on PlayStation until earned' : 'visible'];
  if (kindLabel.toLowerCase() !== t.grade) metaParts.push(kindLabel);
  panel.append(
    el('h2', 'detail-name', t.name),
    el('p', 'detail-official', `Official: “${t.description}”`),
    el('p', 'detail-meta', `— ${metaParts.join(' · ')}`),
  );
  const guideHead = el('p', 'detail-label', 'Guide');
  panel.append(guideHead);
  for (const para of t.guide.split(/\n+/)) {
    if (para.trim()) panel.append(el('p', 'detail-guide', para.trim()));
  }
  if (t.target) {
    const counter = el('div', 'counter');
    counter.append(el('span', 'counter-label', `Your progress: ${getCount(state, t.name)} / ${t.target} ${t.targetUnit ?? ''}`.trim()));
    const minus = el('button', 'counter-btn', '−');
    minus.type = 'button';
    minus.addEventListener('click', () => {
      setCount(state, t.name, getCount(state, t.name) - 1, t.target);
      renderDetail();
      renderList();
    });
    const plus = el('button', 'counter-btn', '+');
    plus.type = 'button';
    plus.addEventListener('click', () => {
      setCount(state, t.name, getCount(state, t.name) + 1, t.target);
      renderDetail();
      renderList();
    });
    const reset = el('button', 'counter-btn', 'Reset');
    reset.type = 'button';
    reset.addEventListener('click', () => {
      setCount(state, t.name, 0, t.target);
      renderDetail();
      renderList();
    });
    counter.append(minus, plus, reset);
    panel.append(counter);
  }
  panel.append(el('p', 'detail-sources', `Sources: ${t.sources}`));
  panel.append(el('p', 'detail-label', 'Your notes'));
  const notes = document.createElement('textarea');
  notes.className = 'notes';
  notes.placeholder = 'Your own notes for this trophy — saved in this browser only.';
  notes.value = state.notes[t.name] ?? '';
  notes.addEventListener('input', () => setNote(state, t.name, notes.value));
  panel.append(notes);
}

function renderRoadmap() {
  const wrap = $('roadmap-stages');
  wrap.replaceChildren();
  for (const stage of STAGES) {
    const members = stage.ids.map((id) => byId.get(id)).filter(Boolean);
    const prog = stageProgress(members, state);
    const card = el('section', 'stage');
    const head = el('div', 'stage-head');
    head.append(el('h3', 'stage-title', stage.title), el('span', 'stage-count', `${prog.earned}/${prog.total} earned`));
    card.append(head, el('p', 'stage-text', stage.text));
    const bar = el('div', 'bar');
    bar.append(el('span', 'bar-fill'));
    bar.firstChild.style.width = `${Math.round((prog.earned / prog.total) * 100)}%`;
    card.append(bar);
    const chips = el('div', 'chips');
    for (const t of members) {
      const earned = isEarned(state, t.name);
      const chip = el('button', `stage-chip${earned ? ' earned' : ''}`, `${displayName(t, state)} (${t.grade})`);
      chip.type = 'button';
      chip.addEventListener('click', () => {
        state.tab = 'tracker';
        state.selected = t.name;
        state.kind = 'all';
        state.query = '';
        saveState(state);
        renderAll();
      });
      chips.append(chip);
    }
    card.append(chips);
    wrap.append(card);
  }
}

function missableCard(t) {
  const card = el('article', 'missable-card');
  const tag = t.missable ? 'Truly missable' : 'Time-sensitive (not missable outright)';
  card.append(
    el('h3', 'missable-title', `⚠ ${tag}: ${t.name}`),
    el('p', 'missable-official', `Official: “${t.description}” — ${gradeLabel(t.grade)} · PSN tracks ${getCount(state, t.name)} / ${t.target ?? '—'} ${t.targetUnit ?? ''}`.trim()),
  );
  for (const para of t.guide.split(/\n+/)) {
    if (para.trim()) card.append(el('p', 'missable-guide', para.trim()));
  }
  card.append(el('p', 'detail-sources', `Sources: ${t.sources}`));
  return card;
}

function renderMissables() {
  const wrap = $('missable-list');
  wrap.replaceChildren();
  const pma = byId.get(28);
  const saf = byId.get(25);
  if (pma) wrap.append(missableCard(pma));
  if (saf) wrap.append(missableCard(saf));
}

function wireControls() {
  $('search').value = state.query;
  $('search').addEventListener('input', (event) => {
    state.query = event.target.value;
    saveState(state);
    renderList();
    renderDetail();
  });
  $('grade').value = state.grade;
  $('grade').addEventListener('change', (event) => {
    state.grade = event.target.value;
    saveState(state);
    renderList();
  });
  $('show').value = state.show;
  $('show').addEventListener('change', (event) => {
    state.show = event.target.value;
    saveState(state);
    renderList();
  });
  $('spoiler').checked = state.spoiler;
  $('spoiler').addEventListener('change', (event) => {
    state.spoiler = event.target.checked;
    saveState(state);
    renderHeader();
    renderList();
    renderDetail();
    renderRoadmap();
  });
  $('theme-toggle').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    saveState(state);
    renderHeader();
  });
  for (const btn of document.querySelectorAll('.tab')) {
    btn.addEventListener('click', () => {
      state.tab = btn.dataset.tab;
      saveState(state);
      renderTabs();
      if (state.tab === 'roadmap') renderRoadmap();
      if (state.tab === 'missables') renderMissables();
    });
  }
  $('export').addEventListener('click', () => {
    const blob = new Blob([exportText(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-ledger-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('import').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const next = parseImport(await file.text());
      Object.assign(state, next);
      saveState(state);
      syncControls();
      renderAll();
    } catch {
      alert('That file is not a Leonida Ledger progress export.');
    }
    event.target.value = '';
  });
  $('reset').addEventListener('click', () => {
    if (!confirm('Clear all earned ticks, notes and counters?')) return;
    Object.assign(state, blankState());
    saveState(state);
    syncControls();
    renderAll();
  });
}

function syncControls() {
  $('search').value = state.query;
  $('grade').value = state.grade;
  $('show').value = state.show;
  $('spoiler').checked = state.spoiler;
}

function renderAll() {
  renderHeader();
  renderTabs();
  renderChips();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

async function init() {
  const doc = await (await fetch('data/trophies.json')).json();
  trophies = doc.trophies;
  for (const t of trophies) byId.set(t.id, t);
  if (!state.selected || !trophies.some((t) => t.name === state.selected)) {
    state.selected = trophies.find((t) => t.name === 'Cunning Stunts')?.name ?? trophies[0]?.name ?? null;
  }
  wireControls();
  renderAll();
}

init();
