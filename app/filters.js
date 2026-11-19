// Leonida Ledger — filtering and the spoiler rule. Pure functions over the
// trophy list and the saved state, so the tracker, the roadmap and the
// missables page all agree about what is shown and what is hidden.

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

export const KIND_ORDER = ['all', 'story', 'side', 'activities', 'crime', 'collectibles', 'money', 'odd', 'completion', 'platinum', 'missable'];

export const STAGE_INFO = [
  { stage: 1, title: 'Play the story — Chapters 1–4 + finale', text: 'Twelve trophies pop as you play. Keep a manual save at the start of every chapter. In Chapter 1, do Lucia\u2019s balcony meditation (see Missables). In Chapter 3, race Yago the moment his race appears. Character switching opens after Breakfast Run in Chapter 2 — learn it early, because the partner trophies need it.' },
  { stage: 2, title: 'Side stories — strangers & friends', text: 'Seven trophies: the final mission for Andy, Kenton, Billy, Randy and Tyrone, Bret\u2019s hunt, and 8 stranger strands. Finales stay open after the story, so nothing here is rushed — except Yago\u2019s race in Stage 1. Andy\u2019s, Billy\u2019s and Tyrone\u2019s questlines do not count toward Strangers & Freaks; check that trophy\u2019s counter after each strand.' },
  { stage: 3, title: 'Crime — robberies, heists & escapes', text: 'Nine trophies. Get the Snap Gun from Yasmani\u2019s Jewelry Jobs (Chapter 3) before Sneakthief. Unlock bank vaults through That\u2019s Where The Money Is (near the end of Chapter 4) and bring your partner — vault escapes also earn Hot Together. Every escape only counts once you have left the red heat zone, not just the flashing search area.' },
  { stage: 4, title: 'Activities — races, ranges, stunts & the gym', text: 'Ten trophies. Gold all 42 Shooting Range challenges, win a Top Fun drone race at all 14 locations, win 20 different races, try each of the 9 activity types, and keep the stunt counter climbing — 250 for the trophy, 300 for 100%. Train Jason and Lucia to maximum Strength together for Personal Best.' },
  { stage: 5, title: 'Collectibles & money — the long tail', text: 'Eight trophies. WAiNK It at 100 locations, discover 100 vehicles, meditate at all 18 spots, complete 3 card sets, launder $250,000 of Marked Bills, spend $100,000 in shops, buy all 8 garages and register 10 vehicles. Buy garages before registering cars — each car needs a free garage space.' },
  { stage: 6, title: 'Odd moments, 100% & the platinum', text: 'Nine trophies. The seven odd moments, most of which pop while you play normally — six of them have no confirmed method at launch, and this guide says so honestly. Then A Long Road: the 100% checklist (300 stunts, 70 of 80 Challenges, 200 of 277 vehicles, all 8 vaults, all 39 illegal operations). Finish it and the platinum is yours.' },
];

export function countByKind(trophies) {
  const counts = {};
  for (const trophy of trophies) counts[trophy.kind] = (counts[trophy.kind] || 0) + 1;
  counts.missable = trophies.filter((t) => t.missable || t.atRisk).length;
  counts.all = trophies.length;
  return counts;
}

// The spoiler rule: a hidden story trophy stays hidden until it is earned.
export function isHiddenFromReader(trophy, state) {
  return Boolean(state.spoiler && trophy.hidden && trophy.kind === 'story' && !isEarnedName(state, trophy.name));
}

function isEarnedName(state, name) {
  return state.earned.includes(name);
}

export function displayName(trophy, state) {
  if (isHiddenFromReader(trophy, state)) return 'Hidden trophy';
  return trophy.name;
}

export function displayDescription(trophy, state) {
  if (isHiddenFromReader(trophy, state)) return 'Hidden until earned — tick it off to reveal its name and description.';
  return trophy.description;
}

export function applyFilters(trophies, state, { query, grade, show, kind }) {
  const needle = query.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (grade !== 'all' && trophy.grade !== grade) return false;
    if (show === 'earned' && !isEarnedName(state, trophy.name)) return false;
    if (show === 'remaining' && isEarnedName(state, trophy.name)) return false;
    if (kind === 'missable') {
      if (!trophy.missable && !trophy.atRisk) return false;
    } else if (kind !== 'all' && trophy.kind !== kind) {
      return false;
    }
    if (needle) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}
