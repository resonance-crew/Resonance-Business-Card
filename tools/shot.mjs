#!/usr/bin/env node
/**
 * Screenshot a page of this folder in headless Chrome, in real time.
 *
 *   node tools/shot.mjs "<path?query>" out.png [width=1280] [height=860] [scale=1] [--dark] [--wait=1500]
 *
 *   node tools/shot.mjs "/?d=facets&view=card&motion=still" shots/front.png 1000 700 2
 *   node tools/shot.mjs "/?d=facets&view=card&motion=still&side=back" shots/back.png 1000 700 2
 *   node tools/shot.mjs "/?d=facets&view=flat" shots/flat.png 1100 460 2
 *   node tools/shot.mjs "/?d=facets" shots/mobile.png 390 1800 2 --dark
 *   node tools/shot.mjs "/card.html#fang" shots/share.png 390 844 2
 *
 * The page is opened at exactly width × height CSS px (any width: no window minimum), the shot is
 * taken --wait ms (real time) after the page reports ready (fonts loaded), so a live card has
 * really moved for that long. Needs the folder served at http://127.0.0.1:4317 (BASE overrides).
 */
import { launch } from './cdp.mjs';
import { urlOf } from './chrome.mjs';

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const [target, out, width = '1280', height = '860', scale = '1'] = args.filter((a) => !a.startsWith('--'));
if (!target || !out) {
  console.error('usage: node tools/shot.mjs "<path?query>" out.png [width] [height] [scale] [--dark] [--wait=ms]');
  process.exit(1);
}
const waitMs = Number(flags.find((f) => f.startsWith('--wait='))?.split('=')[1] ?? 1500);
const dark = flags.includes('--dark');
const chrome = await launch();
try {
  await chrome.shot(target, out, { width: Number(width), height: Number(height), scale: Number(scale), dark, waitMs });
} finally {
  await chrome.close();
}
console.log(`${out}  ←  ${urlOf(target)}  (${width}×${height} @${scale}x${dark ? ', dark' : ''}, +${waitMs} ms)`);
