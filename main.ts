// Leonida Ledger, Rebuilt Edition — the entry program for
// gta6-trophy-guide-01 (Node 22, standard library only). The guide itself is
// plain static files under app/: app/index.html opens in a browser, works
// with the network off, and keeps its trophy list in app/data/trophies.json.
// This program hands the guide in: it copies app/ and screenshots/ from
// beside this file into the output directory and writes dossier.json there
// with the vendored make.fun library, byte for byte the scorer's own copy,
// so leave vendor/makefun-frontend.ts exactly as the kit shipped it.
//
// Serve the guide locally first with `node serve.ts`, then open the address
// it prints. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the dossier bytes; the
// other limits refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in
// app/ or 48 MiB of app files, beside /output's own 1000-entry cap).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
