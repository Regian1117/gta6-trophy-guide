import {
  loadState, saveState, toggleEarned, adjustCount,
  exportProgressJson, importProgressJson, undoLastImport, serializeSavePreview
} from './storage.js';
import { CATEGORY_CHIPS, GRADE_BTNS, filterAndSortTrophies } from './filters.js';
import { isTrophyMasked, revealTrophy, renderSpoilerProofCards } from './spoiler.js';
import { renderInlineRibbon, renderRoadmapView, renderMissablesTable } from './roadmap.js';
import { renderAuditPills, renderRightRailSources, renderSourcesAndExportView } from './citations.js';

const params = new URLSearchParams(window.location.search);
const isDemo = params.get('demo') === '1';
const initialView = ['tracker', 'roadmap', 'missables', 'sources'].includes(params.get('view'))
  ? params.get('view')
  : 'tracker';
const urlSelectId = params.has('select') ? Number(params.get('select')) : null;

const [trophiesRes, sourcesRes] = await Promise.all([
  fetch('./data/trophies.json'),
  fetch('./data/sources.json')
]);
const doc = await trophiesRes.json();
const sourcesDoc = await sourcesRes.json();

let state = loadState(isDemo, urlSelectId);

const ui = {
  view: initialView,
  query: '',
  grade: 'all',
  category: 'all',
  sort: 'roadmap',
  showAllSteps: false
};

const elEarned = document.getElementById('earned-count');
const elSpoilerBtn = document.getElementById('spoiler-toggle');
const elAuditStrip = document.getElementById('audit-strip');
const elRibbon = document.getElementById('route-inline');
const elWorkspace = document.getElementById('main-workspace');
const elSaveBadge = document.getElementById('save-indicator');

function flashSaved(msg = '✓ Saved') {
  elSaveBadge.textContent = msg;
}

function gradeBadgeClass(grade) {
  return `grade-badge gb-${grade}`;
}

function gradeLabel(grade) {
  if (grade === 'platinum') return 'Platinum';
  if (grade === 'gold') return 'Gold';
  if (grade === 'silver') return 'Silver';
  return 'Bronze';
}

function renderTrackerCenter(selected) {
  const earned = state.earned.includes(selected.id);
  const masked = isTrophyMasked(selected, state);
  const titleText = masked ? `Hidden Story Trophy (#${selected.id})` : selected.name;
  const descText = masked ? 'Complete this campaign milestone (details shielded by Spoiler Shield).' : selected.description;

  const isMiss = selected.missableStatus === 'missable';
  const isRisk = selected.missableStatus === 'at-risk';
  const missLabel = isMiss ? 'MISSABLE' : isRisk ? 'AT-RISK' : 'SAFE';
  const missClass = isMiss ? 'risk-missable' : isRisk ? 'risk-risk' : 'risk-safe';

  const windowBox = `
    <div class="info-box ${isMiss ? 'is-missable' : ''}">
      <div class="info-box-hdr ${isMiss ? '' : 'is-safe'}">${isMiss ? 'MISSABLE WINDOW · FROM OFFICIAL WORDING' : isRisk ? 'CONDITIONAL WINDOW' : 'PROGRESSION SAFETY'}</div>
      <div class="info-box-body">${selected.missableWindow || 'Completable anytime during campaign or post-credits free-roam with zero lockouts.'}</div>
    </div>
  `;

  const hasCounter = typeof selected.targetCount === 'number' && selected.targetCount > 1;
  const curVal = hasCounter ? Number(state.counts[selected.id] || 0) : (earned ? 1 : 0);
  const maxVal = hasCounter ? selected.targetCount : 1;
  const leftVal = Math.max(0, maxVal - curVal);
  const pct = Math.min(100, Math.round((curVal / maxVal) * 100));

  const countBox = `
    <div class="info-box">
      <div class="info-box-hdr is-safe">YOUR COUNT</div>
      <div class="counter-controls">
        <button class="step-btn" type="button" data-count-delta="-1">−</button>
        <span class="counter-val">${curVal} / ${maxVal}</span>
        <button class="step-btn" type="button" data-count-delta="1">+</button>
      </div>
      <div class="counter-sub">${hasCounter ? `${selected.countUnit} · ${leftVal} left` : (earned ? 'Completed' : '1 objective')}</div>
      <div class="mini-bar"><div class="mini-bar-fill" style="width:${pct}%"></div></div>
    </div>
  `;

  const disputeHtml = selected.dispute ? `
    <div class="dispute-box">
      <div class="dispute-hdr">SOURCES DIFFER · BOTH SIDES</div>
      <div class="dispute-cols">
        <div class="dispute-side">
          <div class="dispute-side-title">${selected.dispute.sideATitle}</div>
          <div class="dispute-side-text">${selected.dispute.sideAText} (${selected.dispute.sideASources.join(', ')})</div>
        </div>
        <div class="dispute-side">
          <div class="dispute-side-title">${selected.dispute.sideBTitle}</div>
          <div class="dispute-side-text">${selected.dispute.sideBText} (${selected.dispute.sideBSources.join(', ')})</div>
        </div>
      </div>
      <div class="our-call-bar"><strong>Our Call:</strong> ${selected.dispute.ourCall}</div>
    </div>
  ` : '';

  const totalSteps = selected.steps.length;
  const backedCount = selected.steps.filter((s) => s.backed2Plus).length;
  const visibleSteps = ui.showAllSteps ? selected.steps : selected.steps.slice(0, 3);

  const stepsHtml = visibleSteps.map((st) => `
    <div class="step-card">
      <div class="step-text">${masked ? 'Step hidden while Spoiler Shield protects this unearned story trophy.' : st.text}</div>
      <div class="step-pills">
        <span class="claim-pill">Claim ${st.claimId}</span>
        ${st.sources.slice(0, 3).map((s) => `<a class="src-link-pill" href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a>`).join('')}
        <span class="backed-pill">2+ sites</span>
        <span class="date-pill">${st.verifiedDate}</span>
      </div>
    </div>
  `).join('');

  return `
    <div class="detail-header">
      <h1 class="detail-title">${titleText}</h1>
      <button class="earn-toggle-btn ${earned ? 'is-earned' : ''}" type="button" data-action="toggle-selected-earned">
        ${earned ? '✓ Earned' : 'Mark Earned'}
      </button>
    </div>

    <div class="badge-strip">
      <span class="${gradeBadgeClass(selected.grade)}">${gradeLabel(selected.grade)}</span>
      <span class="meta-pill">#${selected.id}/55</span>
      <span class="meta-pill">Stage ${selected.stage}</span>
      <span class="risk-tag ${missClass}">${missLabel}</span>
      ${selected.dispute ? '<span class="dispute-pill">DISPUTED</span>' : ''}
      ${selected.hidden ? '<span class="meta-pill">PSN Hidden</span>' : ''}
    </div>

    <div class="official-quote">
      <div class="quote-label"><span>OFFICIAL PS5</span><span>Exophase · PSNProfiles</span></div>
      <div class="quote-text">${descText}</div>
    </div>

    <div class="split-info-row">${windowBox}${countBox}</div>

    ${disputeHtml}

    <div class="steps-section">
      <div class="steps-hdr-row">
        <div class="steps-hdr">HOW TO EARN IN OUR OWN WORDS · ${totalSteps} STEPS · ${backedCount}/${totalSteps} ON 2+ SITES</div>
        <button class="toggle-steps-btn" type="button" data-action="toggle-steps">
          ${ui.showAllSteps ? `Collapse to 3` : `Show all ${totalSteps}`}
        </button>
      </div>
      <div id="steps-list" class="steps-list">${stepsHtml}</div>
    </div>
  `;
}

function renderTrackerRightRail(selected) {
  const earnedSet = new Set(state.earned);
  // Strictly exclude selected.id from Next Up to prevent duplicate cards
  const nextCandidates = doc.trophies
    .filter((t) => t.id !== selected.id && !earnedSet.has(t.id))
    .sort((a, b) => {
      const pa = a.missableStatus === 'missable' ? 0 : a.stage * 100 + a.id;
      const pb = b.missableStatus === 'missable' ? 0 : b.stage * 100 + b.id;
      return pa - pb;
    })
    .slice(0, 3);

  const nextHtml = nextCandidates.map((t) => {
    const masked = isTrophyMasked(t, state);
    const label = masked ? `#${t.id} Hidden Story Trophy` : `#${t.id} ${t.name}`;
    const countTxt = t.targetCount ? `${state.counts[t.id] || 0}/${t.targetCount} ${t.countUnit}` : `Stage ${t.stage} · ${gradeLabel(t.grade)}`;
    return `
      <div class="next-item" data-select-id="${t.id}">
        <div class="next-row">
          <span class="next-name">${label}</span>
          <span class="${t.missableStatus === 'missable' ? 'risk-tag risk-missable' : 'meta-pill'}">${t.missableStatus === 'missable' ? 'MISSABLE' : `S${t.stage}`}</span>
        </div>
        <div class="next-sub">${countTxt}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="rail-card">
      <div class="rail-hdr">NEXT UP · ROADMAP ORDER</div>
      ${nextHtml}
    </div>
    ${renderRightRailSources(selected, sourcesDoc)}
    <div class="rail-card" style="flex:1; min-height:0; justify-content:space-between;">
      <div style="display:flex; flex-direction:column; gap:4px;">
        <div class="rail-hdr">SAVE SCHEMA &amp; VERIFICATION</div>
        <pre class="schema-preview">${serializeSavePreview(state)}</pre>
      </div>
      <div class="tc-pills"><span class="earned-pill">✓ LocalStorage Verified</span><span class="au-item au-sky"><strong>0 KB</strong> net</span></div>
    </div>
  `;
}

function renderTrackerView() {
  const filtered = filterAndSortTrophies(doc.trophies, state, ui, isTrophyMasked);
  const selected = doc.trophies.find((t) => t.id === state.selectedId) || filtered[0] || doc.trophies[0];
  const earnedSet = new Set(state.earned);

  const listHtml = filtered.length === 0
    ? `<div class="empty-state"><strong>0 trophies match "${ui.category === 'online' ? 'Online' : ui.query || ui.category}".</strong><br>GTA VI (PS5) launches with 0 Online trophies — all 55 are offline single-player.</div>`
    : filtered.map((t) => {
      const masked = isTrophyMasked(t, state);
      const isSel = t.id === selected.id;
      const isEarned = earnedSet.has(t.id);
      const countVal = t.targetCount ? `${state.counts[t.id] || 0}/${t.targetCount}` : null;
      return `
        <article class="trophy-card ${isSel ? 'is-selected' : ''} ${isEarned ? 'is-earned' : ''}" data-select-id="${t.id}">
          <div class="tc-top">
            <div class="tc-title-row">
              <span class="tc-num">#${t.id}</span>
              <span class="tc-name">${masked ? 'Hidden Story Trophy' : t.name}</span>
            </div>
            <span class="${gradeBadgeClass(t.grade)}">${gradeLabel(t.grade)}</span>
          </div>
          <div class="tc-desc">${masked ? 'Complete a story milestone (masked by Spoiler Shield).' : t.description}</div>
          <div class="tc-meta">
            <div class="tc-pills">
              <span class="meta-pill">S${t.stage}</span>
              ${isEarned ? '<span class="earned-pill">✓ Earned</span>' : ''}
              ${t.missableStatus === 'missable' ? '<span class="risk-tag risk-missable">MISSABLE</span>' : ''}
              ${t.missableStatus === 'at-risk' ? '<span class="risk-tag risk-risk">AT-RISK</span>' : ''}
              ${t.dispute ? '<span class="dispute-pill">Split</span>' : ''}
            </div>
            <div>
              ${countVal && !isEarned ? `<span class="count-chip">${countVal}</span>` : ''}
              ${masked ? `<button class="reveal-btn" type="button" data-reveal-id="${t.id}">Reveal</button>` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');

  return `
    <div class="tracker-grid">
      <section class="col-panel" aria-label="Trophy list and filters">
        <div class="left-controls">
          <div class="search-grade-row">
            <input id="search-box" class="search-input" type="search" placeholder="Search 55 trophies…" value="${ui.query}">
            <div class="grade-btns">
              ${GRADE_BTNS.map((g) => `<button class="grade-btn ${ui.grade === g.id ? 'is-active' : ''}" type="button" data-grade="${g.id}">${g.label}</button>`).join('')}
            </div>
          </div>
          <div class="chip-row">
            ${CATEGORY_CHIPS.map((c) => `<button class="cat-chip ${ui.category === c.id ? 'is-active' : ''}" type="button" data-cat="${c.id}">${c.label}</button>`).join('')}
          </div>
          <div class="sort-subbar">
            <span>Showing ${filtered.length}/55</span>
            <div class="sort-links">
              <span>Order:</span>
              <button class="sort-btn ${ui.sort === 'roadmap' ? 'is-active' : ''}" type="button" data-sort="roadmap">Roadmap</button>
              <button class="sort-btn ${ui.sort === 'strangers' ? 'is-active' : ''}" type="button" data-sort="strangers">Strangers</button>
              <button class="sort-btn ${ui.sort === 'logged' ? 'is-active' : ''}" type="button" data-sort="logged">Logged</button>
            </div>
          </div>
        </div>
        <div class="trophy-list">${listHtml}</div>
      </section>

      <section class="col-panel center-panel" aria-label="Selected trophy guide">
        ${renderTrackerCenter(selected)}
      </section>

      <aside class="right-rail" aria-label="Next up and citations">
        ${renderTrackerRightRail(selected)}
      </aside>
    </div>
  `;
}

function render() {
  const storyCount = doc.trophies.filter((t) => t.storySpoiler).length;
  elEarned.textContent = `${state.earned.length} / ${doc.trophies.length} earned`;
  elSpoilerBtn.textContent = `Spoiler Shield: ${state.spoilerShield ? `ON (${storyCount} story hidden)` : 'OFF (all shown)'}`;
  elSpoilerBtn.className = `hdr-btn hdr-btn-shield ${state.spoilerShield ? 'is-on' : 'is-off'}`;

  elAuditStrip.innerHTML = renderAuditPills(sourcesDoc, doc.trophies);

  document.querySelectorAll('.nav-tab').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.view === ui.view);
  });

  if (ui.view === 'tracker') {
    elRibbon.classList.remove('is-hidden');
    elRibbon.innerHTML = renderInlineRibbon(doc, state);
    elWorkspace.innerHTML = renderTrackerView();
    const searchEl = document.getElementById('search-box');
    if (searchEl && ui.focusSearch) {
      searchEl.focus();
      searchEl.setSelectionRange(searchEl.value.length, searchEl.value.length);
      ui.focusSearch = false;
    }
  } else {
    elRibbon.classList.add('is-hidden');
    if (ui.view === 'roadmap') {
      elWorkspace.innerHTML = renderRoadmapView(doc, state, isTrophyMasked);
    } else if (ui.view === 'missables') {
      elWorkspace.innerHTML = `<div class="missables-view">${renderMissablesTable(doc.trophies, state)}${renderSpoilerProofCards(doc.trophies, state)}</div>`;
    } else if (ui.view === 'sources') {
      elWorkspace.innerHTML = renderSourcesAndExportView(doc, sourcesDoc, state);
    }
  }
}

// Event delegation
document.addEventListener('click', (e) => {
  const tab = e.target.closest('.nav-tab');
  if (tab) {
    ui.view = tab.dataset.view;
    ui.showAllSteps = false;
    render();
    return;
  }

  const jumpStage = e.target.closest('[data-jump-stage]');
  if (jumpStage) {
    ui.view = 'roadmap';
    render();
    return;
  }

  const jumpTrackerStage = e.target.closest('[data-jump-tracker-stage]');
  if (jumpTrackerStage) {
    e.preventDefault();
    const stId = Number(jumpTrackerStage.dataset.jumpTrackerStage);
    const stageObj = doc.stages.find((s) => s.id === stId);
    if (stageObj && stageObj.trophyIds.length) {
      state.selectedId = stageObj.trophyIds[0];
    }
    ui.view = 'tracker';
    ui.category = 'all';
    ui.grade = 'all';
    render();
    return;
  }

  const revealBtn = e.target.closest('[data-reveal-id]');
  if (revealBtn) {
    e.stopPropagation();
    const id = Number(revealBtn.dataset.revealId);
    state = revealTrophy(state, id);
    saveState(state, isDemo);
    flashSaved('✓ Revealed');
    render();
    return;
  }

  const selectEl = e.target.closest('[data-select-id]');
  if (selectEl) {
    state.selectedId = Number(selectEl.dataset.selectId);
    ui.view = 'tracker';
    ui.showAllSteps = false;
    saveState(state, isDemo);
    render();
    return;
  }

  const gradeBtn = e.target.closest('[data-grade]');
  if (gradeBtn) {
    ui.grade = gradeBtn.dataset.grade;
    render();
    return;
  }

  const catBtn = e.target.closest('[data-cat]');
  if (catBtn) {
    ui.category = catBtn.dataset.cat;
    render();
    return;
  }

  const sortBtn = e.target.closest('[data-sort]');
  if (sortBtn) {
    ui.sort = sortBtn.dataset.sort;
    render();
    return;
  }

  const deltaBtn = e.target.closest('[data-count-delta]');
  if (deltaBtn) {
    const sel = doc.trophies.find((t) => t.id === state.selectedId) || doc.trophies[0];
    const delta = Number(deltaBtn.dataset.countDelta);
    if (typeof sel.targetCount === 'number') {
      state = adjustCount(state, sel.id, delta, sel.targetCount);
    } else {
      state = toggleEarned(state, sel.id);
    }
    saveState(state, isDemo);
    flashSaved('✓ Saved');
    render();
    return;
  }

  const actionBtn = e.target.closest('[data-action]');
  if (actionBtn) {
    const act = actionBtn.dataset.action;
    if (act === 'toggle-selected-earned') {
      state = toggleEarned(state, state.selectedId);
      saveState(state, isDemo);
      flashSaved('✓ Saved');
      render();
    } else if (act === 'toggle-steps') {
      ui.showAllSteps = !ui.showAllSteps;
      render();
    } else if (act === 'toggle-shield') {
      state.spoilerShield = !state.spoilerShield;
      saveState(state, isDemo);
      render();
    } else if (act === 'export') {
      exportProgressJson(state);
      flashSaved('✓ Exported');
    } else if (act === 'undo-import') {
      state = undoLastImport(state);
      flashSaved('✓ Undone');
      render();
    }
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'search-box') {
    ui.query = e.target.value;
    ui.focusSearch = true;
    render();
  }
});

document.getElementById('spoiler-toggle').addEventListener('click', () => {
  state.spoilerShield = !state.spoilerShield;
  saveState(state, isDemo);
  render();
});

document.getElementById('export-btn').addEventListener('click', () => {
  exportProgressJson(state);
  flashSaved('✓ Exported');
});

document.addEventListener('change', async (e) => {
  if (e.target.id === 'import-input' || e.target.id === 'import-view-input') {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      state = importProgressJson(state, txt, 'replace');
      flashSaved('✓ Imported');
      render();
    } catch {
      flashSaved('! Invalid JSON');
    }
  }
});

render();
