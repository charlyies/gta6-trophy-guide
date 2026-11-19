// Leonida Ledger — Fourth Edition. Entry program (Node 22, standard library
// only). It hands the guide in: it copies this repository's app/ and
// screenshots/ into the output directory and writes dossier.json there, the
// summary the judge reads, using the vendored make.fun library. The library
// file itself is the kit's copy and is left untouched.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

if (!existsSync(join(appDir, 'index.html'))) {
  throw new Error('app/index.html is missing; nothing to hand in');
}

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// The scorer's own caps, from the kit: at most 4 screenshots, each at most
// 256 KiB; app/ at most 993 files and directories and 48 MiB in all. The
// dossier text is capped at 160 KiB by the library call below.
const shotNames = existsSync(shotsDir) ? readdirSync(shotsDir).filter((n) => !n.startsWith('.')) : [];
for (const name of shotNames) {
  const bytes = statSync(join(shotsDir, name)).size;
  if (bytes > 262144) throw new Error(`screenshot ${name} is over 256 KiB (${bytes} bytes)`);
}
if (shotNames.length > 4) throw new Error(`too many screenshots: ${shotNames.length}`);

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

console.log(`Leonida Ledger handed in: ${shotNames.length} screenshots, dossier written to ${join(outDir, 'dossier.json')}`);
