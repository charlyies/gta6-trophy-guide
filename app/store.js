// Leonida Ledger — saved progress, theme and notes. One localStorage key,
// one plain JSON shape, so export and import are the same object the app
// reads on load. Nothing here touches the network.

export const STORAGE_KEY = 'leonida-ledger-v3-progress';
export const THEME_KEY = 'leonida-ledger-v3-theme';

export function blankState() {
  return { earned: [], notes: {}, spoiler: true, theme: 'dark', selected: null };
}

export function loadState() {
  const state = blankState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return state;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.earned)) state.earned = parsed.earned.filter((n) => typeof n === 'string');
    if (parsed.notes && typeof parsed.notes === 'object') state.notes = parsed.notes;
    if (typeof parsed.spoiler === 'boolean') state.spoiler = parsed.spoiler;
    if (typeof parsed.selected === 'string') state.selected = parsed.selected;
  } catch {
    return blankState();
  }
  return state;
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    earned: state.earned,
    notes: state.notes,
    spoiler: state.spoiler,
    selected: state.selected,
  }));
}

export function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function isEarned(state, name) {
  return state.earned.includes(name);
}

export function toggleEarned(state, name) {
  if (isEarned(state, name)) {
    state.earned = state.earned.filter((n) => n !== name);
  } else {
    state.earned = [...state.earned, name];
  }
  saveState(state);
}

export function setNote(state, name, text) {
  if (text.trim() === '') delete state.notes[name];
  else state.notes[name] = text;
  saveState(state);
}

export function gradeCounts(trophies, state) {
  const counts = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const trophy of trophies) {
    counts[trophy.grade][1] += 1;
    if (isEarned(state, trophy.name)) counts[trophy.grade][0] += 1;
  }
  return counts;
}

export function stageCounts(trophies, state, stage) {
  const inStage = trophies.filter((t) => t.stage === stage);
  return [inStage.filter((t) => isEarned(state, t.name)).length, inStage.length];
}

export function nextUp(trophies, state) {
  const remaining = trophies.filter((t) => !isEarned(state, t.name));
  if (remaining.length === 0) return 'Every trophy earned — Leonida Legend!';
  const storyLeft = remaining.find((t) => t.kind === 'story');
  if (storyLeft) {
    if (state.spoiler && storyLeft.hidden) return 'a hidden story trophy';
    return storyLeft.name;
  }
  return remaining[0].name;
}

export function exportFile(state) {
  const blob = new Blob([JSON.stringify({ app: 'leonida-ledger', version: 3, earned: state.earned, notes: state.notes }, null, 2)], { type: 'application/json' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'leonida-ledger-progress.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

export async function importFile(state, file) {
  const parsed = JSON.parse(await file.text());
  const incoming = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(incoming)) throw new Error('Import file has no earned list.');
  state.earned = incoming.filter((n) => typeof n === 'string');
  if (parsed && typeof parsed === 'object' && parsed.notes && typeof parsed.notes === 'object') state.notes = parsed.notes;
  saveState(state);
}
