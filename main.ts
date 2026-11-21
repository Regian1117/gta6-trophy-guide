// Palm & Coast Casebook entrypoint (Node 22 stdlib only).
// Validates dataset & offline screenshots, copies app/ and screenshots/ into MAKEFUN_OUTPUT_DIR (or /output),
// and builds canonical dossier.json using untouched ./vendor/makefun-frontend.ts.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Validate offline trophy dataset before packaging
const trophiesPath = join(here, 'app', 'data', 'trophies.json');
const doc = JSON.parse(readFileSync(trophiesPath, 'utf8'));
if (!Array.isArray(doc.trophies) || doc.trophies.length !== 55) {
  throw new Error(`Invalid trophies.json: expected 55 trophies, got ${doc.trophies?.length}`);
}
for (const t of doc.trophies) {
  if (!t.guide || typeof t.guide !== 'string' || !Array.isArray(t.steps) || t.steps.length === 0) {
    throw new Error(`Trophy #${t.id} missing guide or cited steps`);
  }
}

// Validate screenshots (3-4 files, each <= 262,144 B)
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) {
  throw new Error('Missing screenshots/ directory');
}
const shotFiles = readdirSync(shotsDir).filter((n) => !n.startsWith('.')).sort();
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`Expected 3-4 screenshots, found ${shotFiles.length}`);
}
for (const f of shotFiles) {
  const bytes = statSync(join(shotsDir, f)).size;
  if (bytes > 262144) {
    throw new Error(`Screenshot ${f} exceeds 262,144 B (${bytes} B)`);
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
