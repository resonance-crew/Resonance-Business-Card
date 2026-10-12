#!/usr/bin/env node
/**
 * The static cards, for print and for sharing: one PDF per person per
 * direction (page 1 front, page 2 back, each 2 mm bleed round the trim,
 * vector blobs and live text), and a 300 dpi PNG of each face.
 *
 *   node tools/export.mjs                     # every direction, every person
 *   node tools/export.mjs meet facets         # some directions
 *   node tools/export.mjs meet --people=chen  # one person
 *   node tools/export.mjs meet --lang=zh      # a language option other than the direction's default
 *   node tools/export.mjs facets --pose=met   # a still pose other than the direction's default (print/facets-met/)
 *
 * Writes print/<direction>/<person>.pdf and print/<direction>/<person>-front.png / -back.png.
 * Needs the folder served at http://127.0.0.1:4317.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const ALL = ['meet', 'facets', 'story'];
const PEOPLE = ['chen', 'hsiao', 'fang', 'cheng'];
const dirs = args.filter((a) => !a.startsWith('--'));
const directions = dirs.length ? dirs : ALL;
const people = flag('people')?.split(',') ?? PEOPLE;
const lang = flag('lang');
const pose = flag('pose');

/** Trim + bleed in mm, read from the direction module (portrait or landscape). */
function sizeOf(id) {
  const src = fs.readFileSync(path.join(ROOT, 'directions', `${id}.js`), 'utf8');
  const portrait = /orientation:\s*['"]portrait['"]/.test(src);
  return portrait ? [58, 94] : [94, 58];
}

const DPI = 300;
const chrome = await launch();

try {
for (const id of directions) {
  const [W, H] = sizeOf(id);
  const outDir = path.join(ROOT, 'print', id + (lang ? `-${lang}` : '') + (pose ? `-${pose}` : ''));
  fs.mkdirSync(outDir, { recursive: true });
  for (const p of people) {
    const q = `d=${id}&p=${p}${lang ? `&lang=${lang}` : ''}${pose ? `&pose=${pose}` : ''}`;
    const file = path.join(outDir, `${p}.pdf`);
    await chrome.pdf(`/?${q}&view=print&side=both`, file, { widthMm: W, heightMm: H });
    console.log('pdf ', path.relative(ROOT, file));
    for (const side of ['front', 'back']) {
      const png = path.join(outDir, `${p}-${side}.png`);
      await chrome.png(`/?${q}&view=print&side=${side}`, png, { widthMm: W, heightMm: H, dpi: DPI });
      console.log('png ', path.relative(ROOT, png));
    }
  }
}
} finally {
  await chrome.close();
}
