export function isTrophyMasked(trophy, state) {
  if (!state.spoilerShield) return false;
  if (!trophy.storySpoiler) return false;
  if (state.earned.includes(trophy.id)) return false;
  if (state.revealedIds.includes(trophy.id)) return false;
  return true;
}

export function revealTrophy(state, id) {
  if (!state.revealedIds.includes(id)) {
    state.revealedIds = [...state.revealedIds, id];
  }
  return state;
}

export function renderSpoilerProofCards(trophies, state) {
  const t2 = trophies.find((t) => t.id === 2);
  const t4 = trophies.find((t) => t.id === 4);
  const t28 = trophies.find((t) => t.id === 28);
  const hiddenCount = trophies.filter((t) => t.hidden).length;
  const storyCount = trophies.filter((t) => t.storySpoiler).length;
  const t4Masked = isTrophyMasked(t4, state);

  return `
    <div class="panel-card">
      <div class="panel-title-row">
        <div class="panel-title">SPOILER SHIELD PROOF · ${state.spoilerShield ? 'ON' : 'OFF'} (${hiddenCount} HIDDEN · ${storyCount} STORY TROPHIES PROTECTED)</div>
        <button class="hdr-btn ${state.spoilerShield ? 'hdr-btn-shield is-on' : 'hdr-btn-shield is-off'}" type="button" data-action="toggle-shield">
          ${state.spoilerShield ? 'Shield Active — Click to Reveal All' : 'Shield Off — Click to Re-Arm'}
        </button>
      </div>
      <div class="spoiler-proof-grid">
        <div class="proof-card">
          <div class="proof-state">1 · EARNED STORY (AUTO-REVEALED)</div>
          <div class="tc-name">#${t2.id} ${t2.name}</div>
          <div class="tc-desc">${t2.description}</div>
          <div class="tc-pills"><span class="earned-pill">Earned -> Visible</span><span class="meta-pill">PSN Hidden</span></div>
        </div>
        <div class="proof-card">
          <div class="proof-state">2 · UNEARNED STORY (${t4Masked ? 'MASKED' : 'REVEALED'})</div>
          <div class="tc-name">${t4Masked ? `#${t4.id} Hidden Story Trophy` : `#${t4.id} ${t4.name}`}</div>
          <div class="tc-desc">${t4Masked ? 'Story milestone masked while Spoiler Shield is ON.' : t4.description}</div>
          <div class="tc-pills">
            <span class="meta-pill">Stage 1 · Story</span>
            ${t4Masked ? `<button class="reveal-btn" type="button" data-reveal-id="${t4.id}">Reveal</button>` : `<span class="earned-pill">Manually Revealed</span>`}
          </div>
        </div>
        <div class="proof-card">
          <div class="proof-state">3 · NON-STORY MISSABLE (NEVER MASKED)</div>
          <div class="tc-name">#${t28.id} ${t28.name}</div>
          <div class="tc-desc">${t28.description}</div>
          <div class="tc-pills"><span class="risk-tag risk-missable">MISSABLE</span><span class="meta-pill">Safety Warnings Always Clear</span></div>
        </div>
      </div>
    </div>
  `;
}
