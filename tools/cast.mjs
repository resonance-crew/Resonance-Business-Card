#!/usr/bin/env node
/**
 * The paper puppets for the card: the Resonance site's five landing-page mascots (摺摺 Tuck, 牽牽 Twine,
 * 聆聆 Nod, 點點 Pip, 悄悄 Hush). Reads each one's parts from the Resonance repo (designs/mascots/cast/<slug>/parts:
 * one trimmed PNG per part, at 0.8 px per rig unit, and manifest.json), re-encodes them as WebP at full size in
 * assets/mascots/<slug>/, and writes js/cast.js: every rig's numbers, plus the outline (convex hull) of each arm,
 * so a direction can place a puppet where its waving mitten keeps clear of something without loading a picture.
 *
 *   node tools/cast.mjs [--from=../Resonance/designs/mascots/cast] [--quality=0.92]
 *
 * Needs Chrome (it encodes and measures in a blank page), not the local server.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './cdp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const FROM = path.resolve(ROOT, flag('from') ?? '../Resonance/designs/mascots/cast');
const QUALITY = Number(flag('quality') ?? 0.92);
const SLUGS = ['tuck', 'tag', 'card', 'dot', 'night'];
/** The parts a card shows (the landing's sleepy eyes, torso variants and the night-only glow stay behind). */
const SKIP = /^(eye-[lr]-(sleepy|nap)|torso-alt|stars-glow|mouth-open|mouth-o)$/;

const chrome = await launch();
const cast = {};
try {
  for (const slug of SLUGS) {
    const dir = path.join(FROM, slug, 'parts');
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    const parts = m.parts.filter((p) => !SKIP.test(p.name));
    const pngs = Object.fromEntries(parts.map((p) => [p.name, fs.readFileSync(path.join(dir, p.img)).toString('base64')]));
    // In the page: decode each PNG, encode it as WebP, and for the arms trace the outline of what is drawn.
    const out = await chrome.evaluate(`(async () => {
      const pngs = ${JSON.stringify(pngs)};
      const result = {};
      for (const [name, b64] of Object.entries(pngs)) {
        const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
        const c = new OffscreenCanvas(bmp.width, bmp.height);
        const g = c.getContext('2d');
        g.drawImage(bmp, 0, 0);
        const webp = await c.convertToBlob({ type: 'image/webp', quality: ${QUALITY} });
        const bytes = new Uint8Array(await webp.arrayBuffer());
        let bin = '';
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        let hull = null;
        if (name === 'arm-l' || name === 'arm-r') {
          const { data, width, height } = g.getImageData(0, 0, bmp.width, bmp.height);
          const pts = [];
          for (let y = 0; y < height; y++)
            for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > 96) pts.push([x + 0.5, y + 0.5]);
          // Monotone chain.
          pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
          const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
          const lower = [];
          for (const p of pts) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
            lower.push(p);
          }
          const upper = [];
          for (let i = pts.length - 1; i >= 0; i--) {
            const p = pts[i];
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
            upper.push(p);
          }
          hull = lower.slice(0, -1).concat(upper.slice(0, -1));
        }
        result[name] = { webp: btoa(bin), w: bmp.width, h: bmp.height, hull };
      }
      return result;
    })()`);
    if (!out) throw new Error(`${slug}: the page returned nothing`);
    const outDir = path.join(ROOT, 'assets', 'mascots', slug);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
    let bytes = 0;
    const r = (n) => Math.round(n * 10) / 10;
    cast[slug] = {
      name: m.name,
      ground: m.ground,
      faceCenter: m.faceCenter,
      height: m.height,
      viewBox: m.viewBox,
      parts: parts.map((p) => {
        const o = out[p.name];
        const file = `${p.name}.webp`;
        const buf = Buffer.from(o.webp, 'base64');
        fs.writeFileSync(path.join(outDir, file), buf);
        bytes += buf.length;
        const part = {
          name: p.name,
          parent: p.parent,
          pivot: p.pivot,
          z: p.z,
          x: p.x,
          y: p.y,
          w: p.w,
          h: p.h,
          img: file,
        };
        if (p.angle != null) part.angle = p.angle;
        if (p.variantOf) part.variantOf = p.variantOf;
        if (p.only) part.only = p.only;
        // The arm's outline in rig units (image px are 1 / m.scale rig units).
        if (o.hull) part.hull = o.hull.map(([x, y]) => [r(p.x + x / m.scale), r(p.y + y / m.scale)]);
        return part;
      }),
    };
    console.log(`${slug.padEnd(6)} ${parts.length} parts, ${(bytes / 1024).toFixed(0)} KB`);
  }
} finally {
  await chrome.close();
}

fs.writeFileSync(
  path.join(ROOT, 'js', 'cast.js'),
  `/**
 * The paper puppets' rigs (GENERATED by tools/cast.mjs from the Resonance repo's designs/mascots/cast; don't edit).
 * Units are rig units: a 700 × 760 box, the ground at y = 700, \`height\` from the ground to the top of the body.
 * Each part's picture is assets/mascots/<slug>/<img>, drawn at (x, y, w, h); arms turn about \`pivot\` from
 * \`angle\` (degrees, 0 = pointing right, 90 = down), and \`hull\` is the outline of what an arm draws.
 */
export const CAST = ${JSON.stringify(cast)};
`,
);
console.log('wrote js/cast.js');
