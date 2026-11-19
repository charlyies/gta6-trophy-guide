// Leonida Ledger state: earned ticks, per-trophy notes, PSN counters, theme,
// spoiler setting and filters, all saved in localStorage. Nothing here touches
// the network; export and import are plain JSON files the reader controls.

export const STORAGE_KEY = 'leonida-ledger-v4';

const DEFAULT_STATE = {
  earned: [],
  notes: {},
  counts: {},
  theme: 'dark',
  spoiler: true,
  kind: 'all',
  grade: 'all',
  show: 'all',
  query: '',
  tab: 'tracker',
  selected: null,
};

export function blankState() {
  return {
    earned: [],
    notes: {},
    counts: {},
    theme: 'dark',
    spoiler: true,
    kind: 'all',
    grade: 'all',
    show: 'all',
    query: '',
    tab: 'tracker',
    selected: null,
  };
}

function cleanState(raw) {
  const base = blankState();
  if (!raw || typeof raw !== 'object') return base;
  if (Array.isArray(raw.earned)) base.earned = raw.earned.filter((n) => typeof n === 'string');
  if (raw.notes && typeof raw.notes === 'object') {
    for (const [k, v] of Object.entries(raw.notes)) if (typeof v === 'string') base.notes[k] = v;
  }
  if (raw.counts && typeof raw.counts === 'object') {
    for (const [k, v] of Object.entries(raw.counts)) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) base.counts[k] = Math.floor(n);
    }
  }
  if (raw.theme === 'light' || raw.theme === 'dark') base.theme = raw.theme;
  if (typeof raw.spoiler === 'boolean') base.spoiler = raw.spoiler;
  for (const key of ['kind', 'grade', 'show', 'tab']) {
    if (typeof raw[key] === 'string') base[key] = raw[key];
  }
  if (typeof raw.query === 'string') base.query = raw.query;
  if (typeof raw.selected === 'string' || raw.selected === null) base.selected = raw.selected;
  return base;
}

export function loadState() {
  try {
    return cleanState(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return blankState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function earnedSet(state) {
  return new Set(state.earned);
}

export function isEarned(state, name) {
  return state.earned.includes(name);
}

export function toggleEarned(state, name) {
  const i = state.earned.indexOf(name);
  if (i === -1) state.earned.push(name);
  else state.earned.splice(i, 1);
  saveState(state);
  return state;
}

export function setNote(state, name, text) {
  if (text) state.notes[name] = text;
  else delete state.notes[name];
  saveState(state);
}

export function setCount(state, name, value, target) {
  const n = Math.max(0, Math.min(target ?? 999999, Math.floor(Number(value) || 0)));
  if (n === 0) delete state.counts[name];
  else state.counts[name] = n;
  saveState(state);
}

export function getCount(state, name) {
  return state.counts[name] ?? 0;
}

export function gradeCounts(trophies, state) {
  const out = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const t of trophies) {
    out[t.grade][1] += 1;
    if (isEarned(state, t.name)) out[t.grade][0] += 1;
  }
  return out;
}

export function exportText(state) {
  return JSON.stringify(
    { app: 'leonida-ledger-v4', exportedAt: new Date().toISOString(), earned: state.earned, notes: state.notes, counts: state.counts },
    null,
    2,
  );
}

export function parseImport(text) {
  const raw = JSON.parse(text);
  if (!raw || typeof raw !== 'object') throw new Error('not an object');
  const next = blankState();
  if (Array.isArray(raw.earned)) next.earned = raw.earned.filter((n) => typeof n === 'string');
  if (raw.notes && typeof raw.notes === 'object') next.notes = raw.notes;
  if (raw.counts && typeof raw.counts === 'object') next.counts = raw.counts;
  return cleanState(next);
}

export { DEFAULT_STATE };
