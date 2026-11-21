export const STORAGE_KEY = 'palm_coast_casebook_v1';
export const UNDO_KEY = 'palm_coast_casebook_undo_v1';

export const DEMO_STATE = {
  v: 1,
  earned: [2, 3, 8, 16, 20, 21, 33, 35, 44, 51, 53],
  counts: { 28: 6, 17: 18, 15: 84, 31: 38, 42: 29, 14: 34 },
  spoilerShield: true,
  revealedIds: [],
  selectedId: 28,
  lastRestoredAt: '2026-11-21 09:20 UTC',
  sourceName: 'demo-restored-save.json'
};

export const DEMO_UNDO_BACKUP = {
  v: 1,
  earned: [2, 3, 8, 16, 20, 21, 33, 35],
  counts: { 28: 4, 17: 12, 15: 60, 31: 24, 42: 19, 14: 26 },
  spoilerShield: true,
  revealedIds: [],
  selectedId: 28,
  lastRestoredAt: '2026-11-20 21:40 UTC',
  sourceName: 'pre-import-checkpoint.json'
};

function sanitizeState(raw, fallback) {
  const src = raw && typeof raw === 'object' ? raw : fallback;
  const earned = Array.isArray(src.earned)
    ? [...new Set(src.earned.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 55))]
    : [...fallback.earned];
  const counts = {};
  if (src.counts && typeof src.counts === 'object') {
    for (const [k, v] of Object.entries(src.counts)) {
      const id = Number(k);
      const num = Number(v);
      if (Number.isInteger(id) && Number.isFinite(num) && num >= 0) counts[id] = Math.floor(num);
    }
  }
  const revealedIds = Array.isArray(src.revealedIds)
    ? [...new Set(src.revealedIds.map(Number).filter((n) => Number.isInteger(n)))]
    : [];
  const selectedId = Number.isInteger(Number(src.selectedId)) ? Number(src.selectedId) : fallback.selectedId;
  return {
    v: 1,
    earned,
    counts,
    spoilerShield: typeof src.spoilerShield === 'boolean' ? src.spoilerShield : true,
    revealedIds,
    selectedId,
    lastRestoredAt: typeof src.lastRestoredAt === 'string' ? src.lastRestoredAt : '2026-11-21 09:20 UTC',
    sourceName: typeof src.sourceName === 'string' ? src.sourceName : 'local-browser-save'
  };
}

export function loadState(isDemo, urlSelectId) {
  let state;
  if (isDemo) {
    state = sanitizeState(DEMO_STATE, DEMO_STATE);
    if (!localStorage.getItem(UNDO_KEY)) {
      localStorage.setItem(UNDO_KEY, JSON.stringify(DEMO_UNDO_BACKUP));
    }
  } else {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      state = saved ? sanitizeState(JSON.parse(saved), {
        v: 1,
        earned: [],
        counts: {},
        spoilerShield: true,
        revealedIds: [],
        selectedId: 28,
        lastRestoredAt: '2026-11-21 09:20 UTC',
        sourceName: 'local-browser-save'
      }) : sanitizeState(null, {
        v: 1,
        earned: [],
        counts: {},
        spoilerShield: true,
        revealedIds: [],
        selectedId: 28,
        lastRestoredAt: '2026-11-21 09:20 UTC',
        sourceName: 'local-browser-save'
      });
    } catch {
      state = sanitizeState(null, DEMO_STATE);
    }
  }
  if (urlSelectId && Number.isInteger(urlSelectId) && urlSelectId >= 1 && urlSelectId <= 55) {
    state.selectedId = urlSelectId;
  }
  return state;
}

export function saveState(state, isDemo = false) {
  if (isDemo) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function hasUndoSnapshot() {
  return Boolean(localStorage.getItem(UNDO_KEY));
}

export function toggleEarned(state, id) {
  const set = new Set(state.earned);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  state.earned = [...set].sort((a, b) => a - b);
  return state;
}

export function adjustCount(state, id, delta, maxTarget) {
  const cur = Number(state.counts[id] || 0);
  const next = Math.max(0, maxTarget ? Math.min(maxTarget, cur + delta) : cur + delta);
  state.counts[id] = next;
  return state;
}

export function exportProgressJson(state) {
  const payload = {
    app: 'palm-coast-casebook',
    v: 1,
    exportedAt: '2026-11-21T09:20:00Z',
    earned: state.earned,
    counts: state.counts,
    spoilerShield: state.spoilerShield,
    revealedIds: state.revealedIds
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'palm-coast-gta6-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

export function importProgressJson(currentState, rawText, mode = 'replace') {
  const parsed = JSON.parse(rawText);
  localStorage.setItem(UNDO_KEY, JSON.stringify(currentState));
  const incoming = sanitizeState(parsed, currentState);
  if (mode === 'merge') {
    const mergedEarned = [...new Set([...currentState.earned, ...incoming.earned])].sort((a, b) => a - b);
    const mergedCounts = { ...currentState.counts, ...incoming.counts };
    incoming.earned = mergedEarned;
    incoming.counts = mergedCounts;
  }
  incoming.lastRestoredAt = '2026-11-21 09:25 UTC';
  incoming.sourceName = 'imported-save.json';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(incoming));
  return incoming;
}

export function undoLastImport(currentState) {
  const prevRaw = localStorage.getItem(UNDO_KEY);
  if (!prevRaw) return currentState;
  const restored = sanitizeState(JSON.parse(prevRaw), currentState);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
  localStorage.removeItem(UNDO_KEY);
  return restored;
}

export function serializeSavePreview(state) {
  const countsEntries = Object.entries(state.counts).slice(0, 6).map(([k, v]) => `"${k}":${v}`).join(', ');
  return [
    '{',
    `  "v": ${state.v},`,
    `  "earnedCount": ${state.earned.length},`,
    `  "earned": [${state.earned.slice(0, 6).join(', ')}, ...],`,
    `  "counts": { ${countsEntries} },`,
    `  "spoilerShield": ${state.spoilerShield},`,
    `  "restored": "${state.lastRestoredAt}"`,
    '}'
  ].join('\n');
}
