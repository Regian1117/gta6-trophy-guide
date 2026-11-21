export const CATEGORY_CHIPS = [
  { id: 'all', label: 'All 55' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'activities', label: 'Activities' },
  { id: 'online', label: 'Online' },
  { id: 'hidden', label: 'PSN Hidden' },
  { id: 'disputed', label: 'Disputed' },
  { id: 'unearned', label: 'Not Earned' }
];

export const GRADE_BTNS = [
  { id: 'all', label: 'All' },
  { id: 'platinum', label: 'Plat' },
  { id: 'gold', label: 'Gold' },
  { id: 'silver', label: 'Silv' },
  { id: 'bronze', label: 'Brz' }
];

const DEFAULT_TOP_ORDER = new Map([
  [2, 0],
  [28, 1],
  [17, 2],
  [4, 3],
  [48, 4],
  [3, 5]
]);

export function filterAndSortTrophies(trophies, state, ui, isMaskedFn) {
  const q = ui.query.trim().toLowerCase();
  const earnedSet = new Set(state.earned);

  const filtered = trophies.filter((t) => {
    if (ui.grade !== 'all' && t.grade !== ui.grade) return false;
    if (ui.category === 'story' && t.kind !== 'story') return false;
    if (ui.category === 'missable' && t.missableStatus === 'safe') return false;
    if (ui.category === 'collectibles' && !t.tags.includes('collectibles')) return false;
    if (ui.category === 'activities' && t.kind !== 'activities') return false;
    if (ui.category === 'online') return false; // 0 Online trophies in GTA VI PS5
    if (ui.category === 'hidden' && !t.hidden) return false;
    if (ui.category === 'disputed' && !t.dispute) return false;
    if (ui.category === 'unearned' && earnedSet.has(t.id)) return false;

    if (q) {
      const masked = isMaskedFn(t, state);
      const hay = masked
        ? `#${t.id} hidden story trophy ${t.grade}`
        : `#${t.id} ${t.name} ${t.description} ${t.guide} ${t.tags.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  if (ui.sort === 'strangers') {
    sorted.sort((a, b) => {
      const as = a.kind === 'strangers' ? 0 : 1;
      const bs = b.kind === 'strangers' ? 0 : 1;
      if (as !== bs) return as - bs;
      return a.id - b.id;
    });
  } else if (ui.sort === 'logged') {
    sorted.sort((a, b) => {
      const ac = (state.counts[a.id] || 0) > 0 || earnedSet.has(a.id) ? 0 : 1;
      const bc = (state.counts[b.id] || 0) > 0 || earnedSet.has(b.id) ? 0 : 1;
      if (ac !== bc) return ac - bc;
      return a.id - b.id;
    });
  } else {
    // Default roadmap order: surfaces 4 key showcase rows cleanly at top when unfiltered
    const pristine = !q && ui.grade === 'all' && ui.category === 'all';
    sorted.sort((a, b) => {
      if (pristine) {
        const pa = DEFAULT_TOP_ORDER.has(a.id) ? DEFAULT_TOP_ORDER.get(a.id) : 100 + a.stage * 100 + a.id;
        const pb = DEFAULT_TOP_ORDER.has(b.id) ? DEFAULT_TOP_ORDER.get(b.id) : 100 + b.stage * 100 + b.id;
        return pa - pb;
      }
      if (a.stage !== b.stage) return a.stage - b.stage;
      return a.id - b.id;
    });
  }
  return sorted;
}
