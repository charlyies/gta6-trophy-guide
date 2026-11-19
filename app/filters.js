// Filtering, kind labels and the spoiler rule for Leonida Ledger v2.
// A trophy is spoiler-hidden only when it is a story trophy, spoilers are on,
// and it has not been earned yet — earned story trophies always show their name.
export const KIND_LABELS = {
  story: 'Story',
  side: 'Side stories',
  activities: 'Activities',
  crime: 'Crime',
  collectibles: 'Collectibles',
  money: 'Money',
  moments: 'Odd moments',
  completion: '100% completion',
  platinum: 'Platinum',
};

export function kindCounts(trophies) {
  const counts = {};
  for (const trophy of trophies) counts[trophy.kind] = (counts[trophy.kind] || 0) + 1;
  return counts;
}

export function isSpoilerHidden(trophy, state, earned) {
  return state.spoilerOn && trophy.kind === 'story' && !earned.has(trophy.name);
}

export function displayName(trophy, state, earned) {
  return isSpoilerHidden(trophy, state, earned) ? 'Hidden trophy' : trophy.name;
}

export function displayDescription(trophy, state, earned) {
  return isSpoilerHidden(trophy, state, earned)
    ? 'Hidden until earned — tick it off to reveal its name and description.'
    : trophy.description;
}

export function matchesFilters(trophy, state, earned) {
  if (state.kind !== 'all' && trophy.kind !== state.kind) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.show === 'earned' && !earned.has(trophy.name)) return false;
  if (state.show === 'unearned' && earned.has(trophy.name)) return false;
  if (state.show === 'missable' && !trophy.missable && !trophy.atRisk) return false;
  if (state.query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
    if (!haystack.includes(state.query.toLowerCase())) return false;
  }
  return true;
}

export function nextUpTrophy(trophies, earned, spoilerOn) {
  for (const trophy of trophies) {
    if (trophy.grade === 'platinum') continue;
    if (earned.has(trophy.name)) continue;
    if (spoilerOn && trophy.kind === 'story') return { hidden: true, trophy: null };
    return { hidden: false, trophy };
  }
  return { hidden: false, trophy: null };
}

export function gradeTotals(trophies, earned) {
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const got = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) {
    totals[trophy.grade] += 1;
    if (earned.has(trophy.name)) got[trophy.grade] += 1;
  }
  return { totals, got };
}
