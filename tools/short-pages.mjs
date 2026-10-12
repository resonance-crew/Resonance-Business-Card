#!/usr/bin/env node
/**
 * Each person's own page at a short address: <short>.html (ncc.html, ted.html,
 * nunu.html, liball.html), made from card.html. GitHub Pages serves /ncc as
 * ncc.html, so the address people type and the QR code encodes is
 * <CARD_BASE>ncc. Each page names its person (meta card-person) and carries
 * its own title and link preview (Open Graph), so a shared link shows whose
 * card it is.
 *
 *   node tools/short-pages.mjs        # after any change to card.html or js/people.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PEOPLE, BRAND, CARD_BASE, cardUrl } from '../js/people.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = fs.readFileSync(path.join(ROOT, 'card.html'), 'utf8');
const direction = /export const DIRECTION = '([a-z-]+)'/.exec(fs.readFileSync(path.join(ROOT, 'js/share.js'), 'utf8'))?.[1] ?? 'facets';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

for (const p of PEOPLE) {
  const title = `${p.zh} ${p.en}｜共振 Resonance`;
  const description = `${BRAND.headline.zh} · ${BRAND.headline.en}`;
  const image = `${CARD_BASE}print/${direction}/${p.id}-front.png`;
  const head = [
    `<meta name="card-person" content="${p.id}">`,
    `<link rel="canonical" href="${cardUrl(p)}">`,
    `<meta property="og:type" content="profile">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${cardUrl(p)}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ].join('\n');
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">`)
    .replace(/<meta charset="utf-8">/, `<meta charset="utf-8">\n<!-- Made from card.html by tools/short-pages.mjs: edit card.html, then run it again. -->`)
    .replace(/(<meta name="viewport"[^>]*>)/, `$1\n${head}`);
  if (!html.includes('card-person')) throw new Error('card.html no longer has a viewport meta to anchor on');
  fs.writeFileSync(path.join(ROOT, `${p.short}.html`), html);
  console.log(`${p.short}.html  ←  ${p.zh}  (${cardUrl(p)})`);
}
