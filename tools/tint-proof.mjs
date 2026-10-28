#!/usr/bin/env node
/**
 * The density proof for direction D: tools/tint-proof.html (the blobs at the three strengths of directions/friends.js
 * TINTS, on real faces at true size) as one A4 PDF, print/friends/tint-proof.pdf, with a 300 dpi preview beside it.
 * Print it on the card's own stock before the run and pick a row.
 *
 *   node tools/tint-proof.mjs        (the folder served at BASE, as for the other tools)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(ROOT, 'print', 'friends', 'tint-proof.pdf');
const chrome = await launch();
try {
  await chrome.pdf('/tools/tint-proof.html', out, { widthMm: 210, heightMm: 297 });
  console.log('pdf ', path.relative(ROOT, out));
  const png = out.replace(/\.pdf$/, '.png');
  await chrome.png('/tools/tint-proof.html', png, { widthMm: 210, heightMm: 297, dpi: 300 });
  console.log('png ', path.relative(ROOT, png));
} finally {
  await chrome.close();
}
