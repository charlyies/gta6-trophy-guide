// Saved progress for Leonida Ledger v2: earned ticks, PSN counters, per-trophy
// notes and the dark/light theme, all in localStorage. Nothing leaves the browser.
export const PROGRESS_KEY = 'leonida-ledger-v2-progress';
export const THEME_KEY = 'leonida-ledger-v2-theme';

export function defaultProgress() {
  return { version: 2, earned: [], counts: {}, notes: {} };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaultProgress();
    return {
      version: 2,
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter((n) => typeof n === 'string') : [],
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
    };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function earnedSet(progress) {
  return new Set(progress.earned);
}

export function toggleEarned(progress, trophyName) {
  const set = earnedSet(progress);
  if (set.has(trophyName)) set.delete(trophyName);
  else set.add(trophyName);
  progress.earned = [...set];
  saveProgress(progress);
  return progress;
}

export function setCounter(progress, trophyName, value, target) {
  const clamped = Math.max(0, Math.min(target, Math.floor(value) || 0));
  progress.counts[trophyName] = clamped;
  saveProgress(progress);
  return clamped;
}

export function setNote(progress, trophyName, text) {
  if (text.trim()) progress.notes[trophyName] = text;
  else delete progress.notes[trophyName];
  saveProgress(progress);
}

export function loadTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function exportFile(progress) {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-ledger-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

export function parseImportedFile(text) {
  const parsed = JSON.parse(text);
  const source = parsed && typeof parsed === 'object' ? parsed : {};
  const earned = Array.isArray(source.earned) ? source.earned : [];
  return {
    version: 2,
    earned: earned.filter((n) => typeof n === 'string'),
    counts: source.counts && typeof source.counts === 'object' ? source.counts : {},
    notes: source.notes && typeof source.notes === 'object' ? source.notes : {},
  };
}
