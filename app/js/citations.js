import { hasUndoSnapshot, serializeSavePreview } from './storage.js';

export function renderAuditPills(sourcesDoc, trophies) {
  const a = sourcesDoc.auditSummary;
  const citedCount = trophies.filter((t) => Array.isArray(t.steps) && t.steps.length > 0 && t.sourceIds.length >= 2).length;
  const totalClaims = trophies.reduce((sum, t) => sum + t.steps.length, 0);
  const backed2Plus = trophies.reduce((sum, t) => sum + t.steps.filter((s) => s.backed2Plus).length, 0);
  const splitCount = trophies.filter((t) => Boolean(t.dispute)).length;

  return `
    <span class="au-item au-green"><strong>${citedCount}/${trophies.length}</strong> guides cited</span>
    <span class="au-item au-teal"><strong>${totalClaims}</strong> claims · <strong>${backed2Plus}</strong> on 2+ sites</span>
    <span class="au-item au-paper"><strong>${a.pagesRead}p / ${a.siteCount}</strong> sites · ${a.readDateDisplay}</span>
    <span class="au-item au-amber"><strong>${splitCount}</strong> guides split</span>
    <span class="au-item au-sky"><strong>0 KB</strong> net</span>
  `;
}

export function renderRightRailSources(trophy, sourcesDoc) {
  const byId = new Map(sourcesDoc.sources.map((s) => [s.id, s]));
  const matched = trophy.sourceIds.map((id) => byId.get(id)).filter(Boolean);
  const top4 = matched.slice(0, 4);

  const rows = top4.map((s) => `
    <div class="rail-source-row">
      <a class="rail-source-name" href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a>
      <span class="rail-source-meta">${s.pagesRead}p · ${s.claimsBacked}c · ${s.verifiedDate}</span>
    </div>
  `).join('');

  return `
    <div class="rail-card">
      <div class="rail-hdr">SOURCES (#${trophy.id} · ${matched.length} SITES · NOV 21)</div>
      ${rows}
    </div>
  `;
}

export function renderSourcesAndExportView(doc, sourcesDoc, state) {
  const cols = ['powerpyx', 'psnprofiles', 'exophase', 'pushsquare', 'eurogamer', 'ign'];
  const colNames = { powerpyx: 'PowerPyx', psnprofiles: 'PSNProfiles', exophase: 'Exophase', pushsquare: 'Push Square', eurogamer: 'Eurogamer', ign: 'IGN Wiki' };

  const matrixRows = sourcesDoc.agreementMatrix.map((row) => {
    const cells = cols.map((c) => {
      const v = row.statuses[c];
      return `<td><span class="${v === 'agree' ? 'mx-agree' : 'mx-split'}">${v === 'agree' ? '✓ Agree' : '⚡ Split'}</span></td>`;
    }).join('');
    return `<tr><td>${row.claim}</td>${cells}</tr>`;
  }).join('');

  const topOrder = ['powerpyx', 'exophase', 'pushsquare', 'eurogamer', 'gamesradar', 'psnprofiles'];
  const byId = new Map(sourcesDoc.sources.map((s) => [s.id, s]));
  const ledgerRows = topOrder.map((id) => {
    const s = byId.get(id);
    return `
      <tr>
        <td><a href="${s.url}" target="_blank" rel="noopener noreferrer"><strong>${s.name}</strong></a></td>
        <td>${s.role}</td>
        <td><strong>${s.pagesRead}p</strong></td>
        <td><strong>${s.claimsBacked}c</strong></td>
        <td>${s.verifiedDate}</td>
      </tr>
    `;
  }).join('');

  const trackedTargets = [28, 17, 15, 31, 42, 14].map((id) => {
    const t = doc.trophies.find((x) => x.id === id);
    const val = state.counts[id] || 0;
    const pct = Math.min(100, Math.round((val / t.targetCount) * 100));
    return `
      <div class="tracked-item">
        <div class="tracked-item-top"><span>#${t.id} ${t.name}</span><span>${val}/${t.targetCount}</span></div>
        <div class="mini-bar"><div class="mini-bar-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('');

  const undoEnabled = hasUndoSnapshot();

  return `
    <div class="sources-view">
      <div class="sources-col">
        <div class="panel-card">
          <div class="panel-title-row">
            <div class="panel-title">SOURCE AGREEMENT MATRIX (TIER-1 CROSS-CHECK)</div>
            <span class="au-item au-teal"><strong>2+ sites</strong> per claim</span>
          </div>
          <table class="matrix-table">
            <thead>
              <tr><th>Verified Claim</th>${cols.map((c) => `<th>${colNames[c]}</th>`).join('')}</tr>
            </thead>
            <tbody>${matrixRows}</tbody>
          </table>
        </div>

        <div class="panel-card" style="flex:1">
          <div class="panel-title-row">
            <div class="panel-title">TIER-1 SOURCE LEDGER (TOP 6 OF ${sourcesDoc.auditSummary.siteCount} SITES · ${sourcesDoc.auditSummary.pagesRead} PAGES READ)</div>
            <span class="meta-pill">Offline Snapshot: 2026-11-21</span>
          </div>
          <table class="ledger-table">
            <thead><tr><th>Outlet</th><th>Verified Scope</th><th>Pages</th><th>Claims</th><th>Checked</th></tr></thead>
            <tbody>${ledgerRows}</tbody>
          </table>
        </div>
      </div>

      <div class="sources-col">
        <div class="panel-card">
          <div class="panel-title-row">
            <div class="panel-title">RESTORED SAVE &amp; EXPORT SNAPSHOT</div>
            <span class="earned-pill">✓ Restored &amp; Verified · ${state.lastRestoredAt}</span>
          </div>
          <div class="snapshot-actions">
            <button class="action-btn" type="button" data-action="export">Export JSON</button>
            <label class="action-btn is-secondary import-label" for="import-view-input">Import JSON
              <input id="import-view-input" type="file" accept="application/json">
            </label>
            <button class="action-btn is-warn" type="button" data-action="undo-import" ${undoEnabled ? '' : 'disabled'}>Undo Last Import</button>
          </div>
          <pre class="schema-preview">${serializeSavePreview(state)}</pre>
        </div>

        <div class="panel-card" style="flex:1">
          <div class="panel-title-row">
            <div class="panel-title">TRACKED COUNTS (LIVE LOCALSTORAGE STATE)</div>
            <span class="meta-pill">${state.earned.length} / 55 Earned</span>
          </div>
          <div class="tracked-bars">${trackedTargets}</div>
        </div>
      </div>
    </div>
  `;
}
