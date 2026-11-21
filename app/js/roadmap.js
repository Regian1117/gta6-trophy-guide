function riskClass(risk) {
  if (risk === 'MISSABLE') return 'risk-missable';
  if (risk === 'RISK') return 'risk-risk';
  return 'risk-safe';
}

export function renderInlineRibbon(doc, state) {
  const earnedSet = new Set(state.earned);
  const meta = doc.roadmapMeta;
  const pills = doc.stages.map((st) => {
    const done = st.trophyIds.filter((id) => earnedSet.has(id)).length;
    return `
      <button class="stage-pill" type="button" data-jump-stage="${st.id}">
        <span class="st-code">${st.code}</span>
        <span class="st-frac">${done}/${st.trophyIds.length}</span>
        <span class="risk-tag ${riskClass(st.risk)}">${st.risk}</span>
      </button>
    `;
  }).join('');

  return `
    <div class="route-summary">ROADMAP <span>[${meta.citations.join(' · ')}]</span> · ${meta.hours} · ${meta.difficulty} · ${meta.online}</div>
    <div class="stage-ribbon">${pills}</div>
  `;
}

export function renderRoadmapView(doc, state, isMaskedFn) {
  const earnedSet = new Set(state.earned);
  const byId = new Map(doc.trophies.map((t) => [t.id, t]));
  const meta = doc.roadmapMeta;

  const cards = doc.stages.map((st, i) => {
    const done = st.trophyIds.filter((id) => earnedSet.has(id)).length;
    const spanClass = i < 3 ? 'span-2' : 'span-3';
    const chips = st.trophyIds.slice(0, i < 3 ? 6 : 8).map((id) => {
      const t = byId.get(id);
      const isDone = earnedSet.has(id);
      const label = isMaskedFn(t, state) ? `#${t.id} Story` : `#${t.id} ${t.name}`;
      return `<button class="mini-trophy-btn ${isDone ? 'is-done' : ''}" type="button" data-select-id="${t.id}">${label}</button>`;
    }).join('');
    const extra = st.trophyIds.length > (i < 3 ? 6 : 8) ? `<span class="meta-pill">+${st.trophyIds.length - (i < 3 ? 6 : 8)} more</span>` : '';

    return `
      <article class="stage-card ${spanClass}">
        <div class="sc-top">
          <div>
            <div class="sc-code">${st.code} · <span class="risk-tag ${riskClass(st.risk)}">${st.risk}</span></div>
            <h2 class="sc-title">${st.title}</h2>
          </div>
          <div>
            <div class="sc-frac">${done}/${st.trophyIds.length}</div>
            <div class="sc-hours">${st.hours}</div>
          </div>
        </div>
        <p class="sc-summary">${st.summary}</p>
        <div class="sc-gate ${st.risk === 'MISSABLE' ? 'is-missable' : ''}">${st.gate}</div>
        <div class="sc-trophies">${chips}${extra}</div>
        <div class="sc-foot">
          <span>Cited: ${st.sources.join(' · ')}</span>
          <a href="#" data-jump-tracker-stage="${st.id}">Filter in Tracker →</a>
        </div>
      </article>
    `;
  }).join('');

  return `
    <div class="roadmap-view">
      <div class="roadmap-banner">
        <div>
          <h1 class="rb-title">5-STAGE PLATINUM ROADMAP · GRAND THEFT AUTO VI (PS5)</h1>
          <div class="rb-sub">100% single-player Platinum · Cross-verified across ${meta.citations.join(', ')}, Push Square, PSNProfiles &amp; IGN Wiki</div>
        </div>
        <div class="rb-facts">
          <span class="rb-pill">${meta.hours} Estimate</span>
          <span class="rb-pill">${meta.difficulty} Difficulty</span>
          <span class="rb-pill">${meta.playthroughs}</span>
          <span class="rb-pill">${meta.online}</span>
          <span class="rb-pill">${meta.replay}</span>
        </div>
      </div>
      <div class="stages-grid">${cards}</div>
    </div>
  `;
}

export function renderMissablesTable(trophies, state) {
  const earnedSet = new Set(state.earned);
  const flagged = trophies
    .filter((t) => t.missableStatus !== 'safe')
    .sort((a, b) => (a.missableStatus === b.missableStatus ? a.id - b.id : a.missableStatus === 'missable' ? -1 : 1));
  const safeCount = trophies.filter((t) => t.missableStatus === 'safe').length;
  const missCount = flagged.filter((t) => t.missableStatus === 'missable').length;
  const riskCount = flagged.filter((t) => t.missableStatus === 'at-risk').length;

  const rows = flagged.map((t) => {
    const isMiss = t.missableStatus === 'missable';
    const done = earnedSet.has(t.id);
    return `
      <tr>
        <td><strong>#${t.id} ${t.name}</strong></td>
        <td><span class="risk-tag ${isMiss ? 'risk-missable' : 'risk-risk'}">${isMiss ? 'MISSABLE' : 'AT-RISK'}</span></td>
        <td>Stage ${t.stage}</td>
        <td>${t.missableWindow || ''}</td>
        <td>${t.lastChance || ''}</td>
        <td>${done ? '<span class="earned-pill">Earned</span>' : `<button class="mini-trophy-btn" type="button" data-select-id="${t.id}">Inspect</button>`}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="panel-card">
      <div class="panel-title-row">
        <div class="panel-title">MISSABLES &amp; POINTS OF NO RETURN (${missCount} MISSABLE · ${riskCount} AT-RISK · ${safeCount} SAFE)</div>
        <span class="meta-pill">Manual Saves Recommended: Start &amp; End of Each Chapter (15 Slots)</span>
      </div>
      <table class="risk-table">
        <thead>
          <tr><th>Trophy</th><th>Flag</th><th>Stage</th><th>Point of No Return / Timing Gate</th><th>Safeguard / Recovery</th><th>Action</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
