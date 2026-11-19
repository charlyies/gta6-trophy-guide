// Leonida Ledger filters: kind chips, search, grade and earned filters, and the
// spoiler rule that hides un-earned story trophies until they are earned.

export const KIND_ORDER = [
  'all',
  'story',
  'side',
  'activities',
  'crime',
  'collectibles',
  'money',
  'odd',
  'completion',
  'platinum',
  'missable',
];

export const KIND_LABELS = {
  all: 'All',
  story: 'Story',
  side: 'Side stories',
  activities: 'Activities',
  crime: 'Crime',
  collectibles: 'Collectibles',
  money: 'Money',
  odd: 'Odd moments',
  completion: '100% completion',
  platinum: 'Platinum',
  missable: 'Missable & at-risk',
};

export function kindCount(trophies, kind) {
  if (kind === 'all') return trophies.length;
  if (kind === 'missable') return trophies.filter((t) => t.missable || t.atRisk).length;
  return trophies.filter((t) => t.kind === kind).length;
}

export function inKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return Boolean(trophy.missable || trophy.atRisk);
  return trophy.kind === kind;
}

// A trophy is spoiler-hidden when the reader asked to hide story spoilers,
// the trophy is part of the story, and it has not been earned yet.
export function isSpoilerHidden(trophy, state) {
  return Boolean(state.spoiler && trophy.kind === 'story' && !state.earned.includes(trophy.name));
}

export function displayName(trophy, state) {
  return isSpoilerHidden(trophy, state) ? 'Hidden story trophy' : trophy.name;
}

export function displayDescription(trophy, state) {
  return isSpoilerHidden(trophy, state)
    ? 'Hidden until earned — complete the story to reveal this trophy.'
    : trophy.description;
}

export function matchesSearch(trophy, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [trophy.name, trophy.description, trophy.guide, trophy.kind, trophy.grade, trophy.sources]
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((word) => hay.includes(word));
}

export function visibleTrophies(trophies, state) {
  return trophies.filter((t) => {
    if (!inKind(t, state.kind)) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.show === 'earned' && !state.earned.includes(t.name)) return false;
    if (state.show === 'unearned' && state.earned.includes(t.name)) return false;
    return matchesSearch(t, state.query);
  });
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

// The next trophy the reader should chase: the first un-earned trophy in the
// guide's play order. Spoiler-hidden when the spoiler setting hides it.
export function nextUp(trophies, state) {
  const next = trophies.find((t) => !state.earned.includes(t.name));
  if (!next) return null;
  if (isSpoilerHidden(next, state)) return { label: 'a hidden story trophy', hidden: true };
  return { label: next.name, hidden: false };
}

export function stageProgress(stageTrophies, state) {
  const earned = stageTrophies.filter((t) => state.earned.includes(t.name)).length;
  return { earned, total: stageTrophies.length };
}
