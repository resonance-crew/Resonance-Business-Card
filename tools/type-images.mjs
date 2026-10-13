#!/usr/bin/env node
/**
 * The type on the recipient's card as images: each face's words, seal, mark
 * and QR code (no blobs, no paper), on a transparent ground, for every person
 * and both language orders of the direction the recipient's page shows
 * (js/share.js DIRECTION). That page lays them over the live blobs instead of
 * setting the type itself, so the card reads exactly as designed wherever it
 * is opened: in-app browsers (LINE, Facebook, Instagram) scale text with the
 * phone's font size (150 % on a big-text phone) and the card's lines would
 * run into each other; an older browser without container units would lose
 * the layout altogether; a slow font would show a fallback.
 *
 *   node tools/type-images.mjs                  # after any change to a face, the people or the URLs
 *   node tools/type-images.mjs --people=chen
 *
 * Writes assets/type/<direction>/<person>/<lang>-<side>.webp (lossless WebP,
 * 20 px per mm: 1080 × 1800 for a 54 × 90 mm card, crisp at 3× on the
 * largest card the page shows). Needs the folder served at
 * http://127.0.0.1:4317 and cwebp (brew install webp).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launch } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const direction = /export const DIRECTION = '([a-z-]+)'/.exec(fs.readFileSync(path.join(ROOT, 'js/share.js'), 'utf8'))?.[1] ?? 'facets';
const src = fs.readFileSync(path.join(ROOT, 'directions', `${direction}.js`), 'utf8');
const portrait = /orientation:\s*['"]portrait['"]/.test(src);
const langs = [...(/langs:\s*\[([\s\S]*?)\]/.exec(src)?.[1] ?? '').matchAll(/id:\s*'([a-z-]+)'/g)].map((m) => m[1]);
const people = flag('people')?.split(',') ?? ['chen', 'hsiao', 'fang', 'cheng'];

/** Device px per printed mm. */
const PX_PER_MM = 20;
const [w, h] = portrait ? [54, 90] : [90, 54];
const width = w * PX_PER_MM;
const height = h * PX_PER_MM;

if (spawnSync('cwebp', ['-version']).status !== 0) {
  console.error('cwebp not found: brew install webp');
  process.exit(1);
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rbc-type-'));
const chrome = await launch();
try {
  for (const p of people) {
    for (const lang of langs) {
      for (const side of ['front', 'back']) {
        const png = path.join(tmp, `${p}-${lang}-${side}.png`);
        const out = path.join(ROOT, 'assets/type', direction, p, `${lang}-${side}.webp`);
        await chrome.layer(`/?d=${direction}&p=${p}&lang=${lang}&side=${side}&view=type&grain=0`, png, { width, height, scale: 4 });
        fs.mkdirSync(path.dirname(out), { recursive: true });
        const r = spawnSync('cwebp', ['-quiet', '-lossless', '-z', '9', '-exact', png, '-o', out]);
        if (r.status !== 0) throw new Error(`cwebp failed on ${png}: ${r.stderr}`);
        console.log(`${path.relative(ROOT, out)}  ${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
      }
    }
  }
} finally {
  await chrome.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
