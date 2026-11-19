// Leonida Ledger v2 — boot, rendering and wiring for the tracker, roadmap,
// missables and Sources views. Data comes from data/trophies.json; progress
// lives in localStorage via store.js; filtering and the spoiler rule live
// in filters.js. The page makes no network request except its own files.
import {
  loadProgress, saveProgress, toggleEarned, setCounter, setNote,
  loadTheme, saveTheme, exportFile, parseImportedFile, defaultProgress,
} from './store.js';
import {
  KIND_LABELS, kindCounts, isSpoilerHidden, displayName, displayDescription,
  matchesFilters, nextUpTrophy, gradeTotals,
} from './filters.js';

const ROADMAP_STAGES = [
  { stage: 1, title: 'Play the story — Chapters 1–4 + finale', text: 'Twelve trophies pop as you play. Keep a manual save at the start of every chapter. In Chapter 1, do Lucia\u2019s balcony meditation (see Missables). In Chapter 3, race Yago the moment his race appears. Character switching opens after Breakfast Run in Chapter 2 — learn it early, because the partner trophies need it.' },
  { stage: 2, title: 'Side stories — strangers & friends', text: 'Seven trophies: the final mission for Andy, Kenton, Billy, Randy and Tyrone, Bret\u2019s hunt, and 8 stranger strands. Finales stay open after the story, so nothing here is rushed — except Yago\u2019s race in Stage 1. Andy\u2019s, Billy\u2019s and Tyrone\u2019s questlines do not count toward Strangers & Freaks; check that trophy\u2019s counter after each strand.' },
  { stage: 3, title: 'Crime — robberies, heists & escapes', text: 'Nine trophies. Get the Snap Gun from Yasmani\u2019s Jewelry Jobs (Chapter 3) before Sneakthief. Unlock bank vaults through That\u2019s Where The Money Is (near the end of Chapter 4) and bring your partner — vault escapes also earn Hot Together. Every escape only counts once you have left the red heat zone, not just the flashing search area.' },
  { stage: 4, title: 'Activities & collectibles — the long grind', text: 'Fourteen trophies. Scan everything with WAiNK as you drive (it feeds Whip It Good and You WAiNKer! at once), explore all 52 areas, and work the counters a little every session: 250 stunts (300 for 100%), 42 shooting-range golds, 14 drone-race locations, 50 Challenges (70 for 100%), 3 card sets, 18 meditation spots. Do the Chapter 1 balcony meditation first — it is the only missable.' },
  { stage: 5, title: 'Money & odd moments', text: 'Eleven trophies. Buy the 8 garages in the Vice City Real Estate app (after Daily Driver, Chapter 2) for about $160,000, then register 10 cheap stolen cars to Scooter Bros — each needs a free garage space. Launder $250,000 of Marked Bills through your contacts and spend $100,000 across all shops. The five odd-moment trophies have no confirmed method at launch: play normally, visit Ocean Beach and the showrooms, and let them pop.' },
  { stage: 6, title: 'The platinum & 100% completion', text: 'Two trophies, and the last stage for a reason. The 100% checklist only appears after the story (Progress > Stats > 100% Completion), but earlier work still counts: 300 stunts, 70 of 80 Challenges, 200 of 277 vehicles, all 39 illegal operations, all 8 bank vaults. Close the checklist line by line, cheapest first, and Vice Got a Price! pops with the final trophy. Around 200 hours in total.' },
];

const state = {
  trophies: [],
  progress: loadProgress(),
  theme: loadTheme(),
  view: 'tracker',
  query: '',
  grade: 'all',
  kind: 'all',
  show: 'all',
  spoilerOn: true,
  selectedId: 15,
};

const $ = (id) => document.getElementById(id);

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  const button = $('themeToggle');
  const dark = state.theme === 'dark';
  button.textContent = dark ? '\u263E Dark theme \u2014 tap for light' : '\u2600 Light theme \u2014 tap for dark';
  button.setAttribute('aria-pressed', String(dark));
}

function earned() {
  return new Set(state.progress.earned);
}

function gradeDot(trophy) {
  const letter = trophy.grade === 'platinum' ? 'P' : trophy.grade[0].toUpperCase();
  return `<span class="gradeDot ${trophy.grade}" aria-hidden="true">${letter}</span>`;
}

function rowTags(trophy) {
  const tags = [`<span class="tag">${KIND_LABELS[trophy.kind] || trophy.kind}</span>`, `<span class="tag">${trophy.grade}</span>`];
  if (trophy.hidden) tags.push('<span class="tag">Hidden</span>');
  if (trophy.missable) tags.push('<span class="tag warn">Missable</span>');
  else if (trophy.atRisk) tags.push('<span class="tag warn">At-risk</span>');
  if (trophy.target) tags.push(`<span class="tag countTag">PSN 0/${trophy.target.toLocaleString('en-US')}</span>`);
  return tags.join('');
}

function renderProgress() {
  const set = earned();
  const { totals, got } = gradeTotals(state.trophies, set);
  $('earnedCount').textContent = String(set.size);
  $('progressFill').style.width = `${Math.round((set.size / 55) * 100)}%`;
  $('progressBarWrap').setAttribute('aria-valuenow', String(set.size));
  $('gradeCounts').textContent = `${got.platinum}/${totals.platinum} platinum \u00B7 ${got.gold}/${totals.gold} gold \u00B7 ${got.silver}/${totals.silver} silver \u00B7 ${got.bronze}/${totals.bronze} bronze`;
  const next = nextUpTrophy(state.trophies, set, state.spoilerOn);
  $('nextUp').innerHTML = next.trophy
    ? `Next up: <strong>${next.trophy.name}</strong> \u2014 ${next.trophy.description}`
    : next.hidden
      ? 'Next up: <strong>a hidden story trophy</strong> \u2014 keep playing the story (spoilers hidden).'
      : set.size >= 55
        ? '<strong>Platinum earned!</strong> You are a Leonida Legend.'
        : 'Next up: start the story.';
}

function renderKindChips() {
  const counts = kindCounts(state.trophies);
  const chips = [{ key: 'all', label: 'All', count: state.trophies.length }];
  for (const [key, label] of Object.entries(KIND_LABELS)) {
    if (counts[key]) chips.push({ key, label, count: counts[key] });
  }
  chips.push({ key: 'missable', label: 'Missable & at-risk', count: state.trophies.filter((t) => t.missable || t.atRisk).length, special: true });
  $('kindChips').innerHTML = chips.map((chip) => {
    const active = chip.special ? state.show === 'missable' : state.kind === chip.key;
    return `<button type="button" class="chipBtn${active ? ' active' : ''}" data-kind="${chip.key}" data-special="${chip.special ? '1' : ''}">${chip.label} <span class="n">${chip.count}</span></button>`;
  }).join('');
  $('kindChips').querySelectorAll('.chipBtn').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.special === '1') { state.show = 'missable'; state.kind = 'all'; $('showFilter').value = 'missable'; }
      else { state.kind = button.dataset.kind; state.show = 'all'; $('showFilter').value = 'all'; }
      renderAll();
    });
  });
}

function renderList() {
  const set = earned();
  const visible = state.trophies.filter((t) => matchesFilters(t, state, set));
  const earnedInView = visible.filter((t) => set.has(t.name)).length;
  $('showingLine').textContent = `Showing ${visible.length} of ${state.trophies.length} trophies \u00B7 ${earnedInView} earned in this view`;
  const list = $('trophyList');
  if (!visible.length) {
    list.innerHTML = '<p class="emptyNote">No trophies match these filters. Clear the search or pick another kind.</p>';
    return;
  }
  list.innerHTML = visible.map((trophy) => {
    const isEarned = set.has(trophy.name);
    const hidden = isSpoilerHidden(trophy, state, set);
    return `<button type="button" role="listitem" class="trophyRow${isEarned ? ' earnedRow' : ''}${state.selectedId === trophy.id ? ' selected' : ''}" data-id="${trophy.id}">
      <input type="checkbox" ${isEarned ? 'checked' : ''} tabindex="-1" aria-label="Earned: ${hidden ? 'hidden trophy' : trophy.name}">
      ${gradeDot(trophy)}
      <span><span class="rowName">${displayName(trophy, state, set)}${hidden ? ' <span class="hiddenTag">(story \u2014 earn it to reveal)</span>' : ''}</span><br>
      <span class="rowDesc">${displayDescription(trophy, state, set)}</span><br>
      <span class="rowTags">${rowTags(trophy)}</span></span>
    </button>`;
  }).join('');
  list.querySelectorAll('.trophyRow').forEach((row) => {
    row.addEventListener('click', (event) => {
      const id = Number(row.dataset.id);
      if (event.target.tagName === 'INPUT') {
        const trophy = state.trophies.find((t) => t.id === id);
        state.progress = toggleEarned(state.progress, trophy.name);
        renderAll();
        return;
      }
      state.selectedId = id;
      renderAll();
    });
  });
}

function renderDetail() {
  const panel = $('detailPanel');
  const trophy = state.trophies.find((t) => t.id === state.selectedId) || state.trophies[0];
  if (!trophy) { panel.innerHTML = '<p>Loading trophies…</p>'; return; }
  const set = earned();
  const isEarned = set.has(trophy.name);
  const hidden = isSpoilerHidden(trophy, state, set);
  if (hidden) {
    panel.innerHTML = `<h2>Hidden trophy</h2>
      <p class="officialLine">Story trophy \u00B7 ${trophy.grade} \u00B7 hidden on PlayStation until earned</p>
      <p class="spoilerNote">Spoilers are on, so this story trophy\u2019s name and description stay hidden until you earn it. Tick it off in the list to reveal it — or turn spoilers off in the controls above.</p>
      <button type="button" class="markBtn" data-mark="${trophy.id}">Mark as earned</button>
      <h4>Sources</h4><p class="sourcesLine">Official description: Exophase / PSNProfiles. This trophy is one of the 28 hidden on PlayStation until earned.</p>`;
  } else {
    const count = state.progress.counts[trophy.name] || 0;
    const note = state.progress.notes[trophy.name] || '';
    const counter = trophy.target ? `<h4>Your count (PlayStation target)</h4>
      <div class="counterRow"><button type="button" data-step="-1" aria-label="Decrease count">\u2212</button>
      <span class="countVal">${count.toLocaleString('en-US')} / ${trophy.target.toLocaleString('en-US')}${trophy.targetUnit ? ` ${trophy.targetUnit}` : ''}</span>
      <button type="button" data-step="1" aria-label="Increase count">+</button></div>
      ${count >= trophy.target ? '<p class="sourcesLine">Target reached — mark it earned below.</p>' : ''}` : '';
    panel.innerHTML = `<h2>${trophy.name}</h2>
      <p class="officialLine">Official: \u201C${trophy.description}\u201D \u2014 ${trophy.grade} \u00B7 ${trophy.hidden ? 'hidden on PlayStation until earned' : 'visible'} \u00B7 ${KIND_LABELS[trophy.kind] || trophy.kind}${trophy.missable ? ' \u00B7 \u26A0 Missable' : trophy.atRisk ? ' \u00B7 \u26A0 At-risk' : ''}</p>
      <h4>Guide</h4><div class="guideText">${trophy.guide.split('\n\n').map((para) => `<p>${para}</p>`).join('')}</div>
      ${counter}
      <button type="button" class="markBtn${isEarned ? ' earned' : ''}" data-mark="${trophy.id}">${isEarned ? '\u2713 Earned \u2014 tick off to undo' : 'Mark as earned'}</button>
      <h4>Sources</h4><p class="sourcesLine">${trophy.sources}</p>
      <h4>Your notes</h4><textarea class="notesArea" data-note="${trophy.id}" placeholder="Your own note for this trophy — a place, a loadout, a reminder…">${note}</textarea>`;
  }
  panel.querySelector('[data-mark]')?.addEventListener('click', () => {
    state.progress = toggleEarned(state.progress, trophy.name);
    renderAll();
  });
  panel.querySelectorAll('[data-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const current = state.progress.counts[trophy.name] || 0;
      setCounter(state.progress, trophy.name, current + Number(button.dataset.step), trophy.target);
      renderAll();
    });
  });
  const noteArea = panel.querySelector('[data-note]');
  noteArea?.addEventListener('input', () => setNote(state.progress, trophy.name, noteArea.value));
}

function renderRoadmap() {
  const set = earned();
  $('roadmapStages').innerHTML = ROADMAP_STAGES.map((stage) => {
    const members = state.trophies.filter((t) => t.stage === stage.stage);
    const done = members.filter((t) => set.has(t.name)).length;
    const pct = members.length ? Math.round((done / members.length) * 100) : 0;
    return `<article class="stageCard"><h3>Stage ${stage.stage} \u2014 ${stage.title} <span class="stageCount">${done}/${members.length} earned</span></h3>
      <p>${stage.text}</p>
      <div class="stageBar"><div style="width:${pct}%"></div></div>
      <div class="stageTrophies">${members.map((t) => `<span class="pill${set.has(t.name) ? ' done' : ''}">${isSpoilerHidden(t, state, set) ? 'Hidden story trophy' : t.name} (${t.grade})</span>`).join('')}</div>
    </article>`;
  }).join('');
}

function renderMissables() {
  const set = earned();
  const cards = state.trophies.filter((t) => t.missable || t.atRisk).map((trophy) => {
    const isEarned = set.has(trophy.name);
    return `<article class="missCard ${trophy.missable ? 'danger' : ''}"><h3>\u26A0 ${trophy.missable ? 'The one missable trophy: ' : 'Time-sensitive (not missable outright): '}${trophy.name} <span class="stageCount">${isEarned ? '\u2713 earned' : 'not yet earned'}</span></h3>
      <p><strong>Official:</strong> \u201C${trophy.description}\u201D \u2014 ${trophy.grade} \u00B7 PlayStation tracks ${trophy.target ? `0/${trophy.target}` : 'no count'}.</p>
      <div class="guideText">${trophy.guide.split('\n\n').map((para) => `<p>${para}</p>`).join('')}</div>
      <p class="sourcesLine"><strong>Sources:</strong> ${trophy.sources}</p></article>`;
  }).join('');
  const safe = `<article class="missCard safe"><h3>Everything else stays available</h3>
    <p>All other 53 trophies stay available after the credits — including the side-story finales and the 100% checklist. There is no mission replay and no New Game Plus at launch, which is why the save plan above matters, but the post-story world is open: do the story first, then clean up at your own pace.</p></article>`;
  $('missableCards').innerHTML = cards + safe;
}

function renderAll() {
  renderProgress();
  renderKindChips();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view));
  document.querySelectorAll('.view').forEach((section) => section.classList.toggle('active', section.id === `view-${view}`));
}

async function boot() {
  applyTheme();
  $('themeToggle').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    saveTheme(state.theme);
    applyTheme();
  });
  document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => switchView(tab.dataset.view)));
  $('search').addEventListener('input', (event) => { state.query = event.target.value.trim(); renderList(); });
  $('gradeFilter').addEventListener('change', (event) => { state.grade = event.target.value; renderAll(); });
  $('showFilter').addEventListener('change', (event) => { state.show = event.target.value; state.kind = 'all'; renderAll(); });
  $('spoilerToggle').addEventListener('change', (event) => { state.spoilerOn = event.target.checked; renderAll(); });
  $('exportBtn').addEventListener('click', () => exportFile(state.progress));
  $('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      state.progress = parseImportedFile(await file.text());
      saveProgress(state.progress);
      renderAll();
    } catch { alert('That file is not a Leonida Ledger progress export.'); }
    event.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (confirm('Reset all earned ticks, counters and notes?')) {
      state.progress = defaultProgress();
      saveProgress(state.progress);
      renderAll();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      event.preventDefault();
      $('search').focus();
    }
  });
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  state.trophies = doc.trophies;
  renderAll();
}

boot();
