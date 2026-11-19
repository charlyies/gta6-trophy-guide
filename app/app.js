// Leonida Ledger — the tracker itself: rendering, tabs, search, filters,
// detail panel, roadmap, missables, theme. All data comes from the local
// trophies file; nothing is fetched from anywhere else.

import { loadState, saveState, loadTheme, saveTheme, isEarned, toggleEarned, setNote, gradeCounts, stageCounts, nextUp, exportFile, importFile } from './store.js';
import { KIND_LABELS, KIND_ORDER, STAGE_INFO, countByKind, isHiddenFromReader, displayName, displayDescription, applyFilters } from './filters.js';

const state = loadState();
let trophies = [];
let activeKind = 'all';
let selectedName = state.selected || null;

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const detailEl = $('detailPanel');

function gradeLetter(grade) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[grade] || '?';
}

function kindLabel(kind) {
  return KIND_LABELS[kind] || kind;
}

function trophyByName(name) {
  return trophies.find((t) => t.name === name) || null;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  $('themeToggle').textContent = theme === 'dark' ? '☾ Dark theme — tap for light' : '☀ Light theme — tap for dark';
  saveTheme(theme);
}

function renderProgress() {
  const earned = state.earned.length;
  $('earnedCount').textContent = String(earned);
  $('progressFill').style.width = `${Math.round((earned / trophies.length) * 100)}%`;
  $('progressBar').setAttribute('aria-valuenow', String(earned));
  const counts = gradeCounts(trophies, state);
  $('gradeCounts').textContent = `${counts.platinum[0]}/${counts.platinum[1]} platinum · ${counts.gold[0]}/${counts.gold[1]} gold · ${counts.silver[0]}/${counts.silver[1]} silver · ${counts.bronze[0]}/${counts.bronze[1]} bronze`;
  const next = nextUp(trophies, state);
  $('nextUp').textContent = next;
}

function renderChips() {
  const counts = countByKind(trophies);
  const box = $('kindChips');
  box.replaceChildren();
  for (const kind of KIND_ORDER) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (kind === activeKind ? ' active' : '') + (kind === 'missable' ? ' danger' : '');
    chip.textContent = kind === 'all' ? `All ${counts.all}` : `${kindLabel(kind)} ${counts[kind] || 0}`;
    chip.addEventListener('click', () => {
      activeKind = kind;
      renderChips();
      renderList();
    });
    box.append(chip);
  }
}

function currentFilter() {
  return {
    query: $('searchBox').value,
    grade: $('gradeSelect').value,
    show: $('showSelect').value,
    kind: activeKind,
  };
}

function renderList() {
  const visible = applyFilters(trophies, state, currentFilter());
  const earnedHere = visible.filter((t) => isEarned(state, t.name)).length;
  $('showingLine').textContent = `Showing ${visible.length} of ${trophies.length} trophies · ${earnedHere} earned in this view`;
  listEl.replaceChildren();
  for (const trophy of visible) {
    const row = document.createElement('div');
    row.className = 'trophy-row' + (isEarned(state, trophy.name) ? ' earned' : '') + (trophy.name === selectedName ? ' selected' : '');
    row.setAttribute('role', 'listitem');

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(state, trophy.name);
    box.setAttribute('aria-label', `Earned: ${displayName(trophy, state)}`);
    box.addEventListener('change', () => {
      toggleEarned(state, trophy.name);
      renderAll();
    });

    const dot = document.createElement('span');
    dot.className = `grade-dot ${trophy.grade}`;
    dot.textContent = gradeLetter(trophy.grade);

    const body = document.createElement('button');
    body.type = 'button';
    body.className = 'row-body';
    body.style.cssText = 'background:none;border:none;padding:0;text-align:left;flex:1;min-width:0;';
    const name = document.createElement('span');
    name.className = 'trophy-name';
    name.textContent = displayName(trophy, state);
    const desc = document.createElement('span');
    desc.className = 'trophy-desc';
    desc.style.display = 'block';
    desc.textContent = displayDescription(trophy, state);
    const tags = document.createElement('span');
    tags.className = 'tag-row';
    tags.style.display = 'flex';
    const tagKind = document.createElement('span');
    tagKind.className = 'tag';
    tagKind.textContent = kindLabel(trophy.kind).toUpperCase();
    const tagGrade = document.createElement('span');
    tagGrade.className = 'tag';
    tagGrade.textContent = trophy.grade.toUpperCase();
    // Platinum's kind and grade are the same word; show it once.
    if (kindLabel(trophy.kind).toLowerCase() !== trophy.grade) tags.append(tagKind);
    tags.append(tagGrade);
    if (trophy.hidden) {
      const tagHidden = document.createElement('span');
      tagHidden.className = 'tag';
      tagHidden.textContent = 'HIDDEN';
      tags.append(tagHidden);
    }
    if (trophy.missable) {
      const tagMiss = document.createElement('span');
      tagMiss.className = 'tag warn';
      tagMiss.textContent = '⚠ MISSABLE';
      tags.append(tagMiss);
    }
    if (trophy.atRisk) {
      const tagRisk = document.createElement('span');
      tagRisk.className = 'tag warn';
      tagRisk.textContent = '⚠ AT-RISK';
      tags.append(tagRisk);
    }
    if (isHiddenFromReader(trophy, state)) {
      const note = document.createElement('span');
      note.className = 'tag spoiler-note';
      note.textContent = '(story — earn it to reveal)';
      tags.append(note);
    }
    body.append(name, desc, tags);
    body.addEventListener('click', () => {
      selectedName = trophy.name;
      state.selected = trophy.name;
      saveState(state);
      renderList();
      renderDetail();
    });

    row.append(box, dot, body);
    listEl.append(row);
  }
  if (visible.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-detail';
    empty.textContent = 'No trophies match these filters. Clear the search or pick another kind.';
    listEl.append(empty);
  }
}

function renderDetail() {
  const trophy = selectedName ? trophyByName(selectedName) : null;
  detailEl.replaceChildren();
  if (!trophy) {
    detailEl.classList.remove('missable-detail');
    const empty = document.createElement('p');
    empty.className = 'empty-detail';
    empty.textContent = 'Pick a trophy on the left to read its full guide, its sources and its progress target. Tick the box when you earn it.';
    detailEl.append(empty);
    return;
  }
  detailEl.classList.toggle('missable-detail', Boolean(trophy.missable || trophy.atRisk));
  const hidden = isHiddenFromReader(trophy, state);
  const title = document.createElement('h3');
  title.textContent = hidden ? 'Hidden trophy' : trophy.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden ? 'Official: hidden until earned.' : `Official: “${trophy.description}”`;
  const meta = document.createElement('p');
  meta.className = 'meta-line';
  meta.textContent = hidden
    ? 'Hidden on PlayStation until earned · Story'
    : `— ${trophy.grade} · ${trophy.hidden ? 'hidden on PlayStation until earned' : 'visible'} · ${kindLabel(trophy.kind)}`;
  const label = document.createElement('p');
  label.className = 'guide-label';
  label.textContent = 'GUIDE';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = hidden ? 'This is a hidden story trophy. Earn it in the game and tick it off here to reveal its guide.' : trophy.guide;
  const sources = document.createElement('p');
  sources.className = 'sources';
  const sourcesStrong = document.createElement('strong');
  sourcesStrong.textContent = 'Sources: ';
  sources.append(sourcesStrong, document.createTextNode(hidden ? 'Official description: Exophase / PSNProfiles.' : trophy.sources));
  detailEl.append(title, official, meta, label, guide, sources);
  if (!hidden && trophy.targetLabel) {
    const target = document.createElement('p');
    target.className = 'target-line';
    const targetStrong = document.createElement('strong');
    targetStrong.textContent = 'PlayStation tracks: ';
    target.append(targetStrong, document.createTextNode(trophy.targetLabel));
    detailEl.append(target);
  }
  if (!hidden) {
    const noteLabel = document.createElement('label');
    noteLabel.className = 'note-label';
    noteLabel.textContent = 'Your note';
    const noteBox = document.createElement('textarea');
    noteBox.className = 'note-box';
    noteBox.placeholder = 'Where you found it, what worked, what to retry…';
    noteBox.value = state.notes[trophy.name] || '';
    noteBox.addEventListener('input', () => setNote(state, trophy.name, noteBox.value));
    noteLabel.htmlFor = '';
    detailEl.append(noteLabel, noteBox);
  }
}

function renderRoadmap() {
  const box = $('roadmapStages');
  box.replaceChildren();
  for (const info of STAGE_INFO) {
    const [done, total] = stageCounts(trophies, state, info.stage);
    const card = document.createElement('article');
    card.className = 'stage';
    const title = document.createElement('h3');
    title.textContent = `Stage ${info.stage} — ${info.title} `;
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = `${done}/${total} earned`;
    title.append(count);
    const text = document.createElement('p');
    text.textContent = info.text;
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('span');
    fill.style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
    bar.append(fill);
    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    for (const trophy of trophies.filter((t) => t.stage === info.stage)) {
      const chip = document.createElement('span');
      chip.className = isEarned(state, trophy.name) ? 'done' : '';
      chip.textContent = isHiddenFromReader(trophy, state) ? `Hidden story trophy (${trophy.grade})` : `${trophy.name} (${trophy.grade})`;
      chips.append(chip);
    }
    card.append(title, text, bar, chips);
    box.append(card);
  }
}

function renderMissables() {
  const box = $('missablesList');
  box.replaceChildren();
  const flagged = trophies.filter((t) => t.missable || t.atRisk);
  for (const trophy of flagged) {
    const card = document.createElement('article');
    card.className = 'missable-card';
    const title = document.createElement('h3');
    title.textContent = `${trophy.missable ? '⚠ The one missable trophy: ' : '⚠ Time-sensitive (not missable outright): '}${trophy.name} `;
    const earned = document.createElement('span');
    earned.className = 'stage-count';
    earned.textContent = isEarned(state, trophy.name) ? 'earned' : 'not yet earned';
    title.append(earned);
    const official = document.createElement('p');
    official.className = 'official';
    official.textContent = `Official: “${trophy.description}” — ${trophy.grade} · ${trophy.targetLabel || ''}`;
    const guide = document.createElement('p');
    guide.textContent = trophy.guide;
    const sources = document.createElement('p');
    sources.className = 'sources';
    const sourcesStrong = document.createElement('strong');
    sourcesStrong.textContent = 'Sources: ';
    sources.append(sourcesStrong, document.createTextNode(trophy.sources));
    card.append(title, official, guide, sources);
    box.append(card);
  }
  const safe = document.createElement('p');
  safe.className = 'lede';
  safe.textContent = 'The other 53 trophies stay available after the credits. Keep a manual save at the start of every chapter and one untouched save from just before the final mission, and the list is safe.';
  box.append(safe);
}

function renderAll() {
  renderProgress();
  renderChips();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function wireEvents() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
      tab.classList.add('active');
      $(`view-${tab.dataset.tab}`).classList.add('active');
    });
  });
  $('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
  $('spoilerToggle').addEventListener('change', (event) => {
    state.spoiler = event.target.checked;
    saveState(state);
    renderAll();
  });
  $('searchBox').addEventListener('input', renderList);
  $('gradeSelect').addEventListener('change', renderList);
  $('showSelect').addEventListener('change', renderList);
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && document.activeElement !== $('searchBox')) {
      event.preventDefault();
      $('searchBox').focus();
    }
  });
  $('exportBtn').addEventListener('click', () => exportFile(state));
  $('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      await importFile(state, file);
      selectedName = state.selected || null;
      renderAll();
    } catch {
      alert('That file could not be imported. It needs an earned list, as exported by this guide.');
    }
    event.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned ticks and notes? This cannot be undone.')) return;
    state.earned = [];
    state.notes = {};
    selectedName = null;
    state.selected = null;
    saveState(state);
    renderAll();
  });
}

async function init() {
  applyTheme(loadTheme());
  $('spoilerToggle').checked = state.spoiler;
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  trophies = doc.trophies;
  if (!selectedName || !trophyByName(selectedName)) {
    selectedName = 'Cunning Stunts';
  }
  wireEvents();
  renderAll();
}

init();
