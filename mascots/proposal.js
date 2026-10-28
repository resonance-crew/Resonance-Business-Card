/**
 * The mascot proposal: the card's real faces (drawn by its directions, as the print proof draws them) with the
 * landing page's paper puppets posed on them (js/puppet.js), one spread per option. The team's pick, D 相遇＋融合,
 * is directions/friends.js itself; the first round's options are B 兩面 with puppets laid over it.
 */
import facets from '../directions/facets.js';
import friends from '../directions/friends.js';
import { makeCtx, flatFace, faceParts, fontsSettled } from '../js/ctx.js';
import { PEOPLE } from '../js/people.js';
import { puppetEl, NAMES } from '../js/puppet.js';

const params = new URLSearchParams(location.search);

/** Who wears which puppet (js/people.js, for now; each person may pick another). */
export const PAIRING = Object.fromEntries(PEOPLE.map((p) => [p.id, p.puppet]));
const ORDER = PEOPLE.map((p) => p.id);
const next = (id) => ORDER[(ORDER.indexOf(id) + 1) % ORDER.length];

const TRIM = [54, 90];

/** A spread: the front and the back side by side, trim to trim (the long edge they share in the middle). */
function spread(personId, { dir = facets, blob = true, mmPx = null } = {}) {
  const el = document.createElement('div');
  el.className = 'spread';
  // The page's sizes (proposal.css) fit the window; a screenshot may ask for its own.
  if (mmPx) el.style.setProperty('--mm-px', `${mmPx}px`);
  const cards = {};
  const faces = {};
  for (const side of ['front', 'back']) {
    const fc = document.createElement('div');
    fc.className = 'flat-card';
    fc.style.cssText = `--trim-w: ${TRIM[0]}; --trim-h: ${TRIM[1]}`;
    const face = flatFace(side);
    fc.appendChild(face);
    if (!blob) fc.classList.add('no-blob');
    el.appendChild(fc);
    cards[side] = { fc, face };
  }
  faces.front = faceParts(cards.front.face);
  faces.back = faceParts(cards.back.face);
  const ctx = makeCtx(dir, 'print', { personId });
  dir.mount(faces, ctx);
  // The first round's puppets: a layer over the type, inside the face (where --mm is one millimetre).
  for (const side of ['front', 'back']) {
    const layer = document.createElement('div');
    layer.className = 'pup-layer';
    cards[side].face.appendChild(layer);
    cards[side].layer = layer;
  }
  return { el, cards };
}

/**
 * The top of the face's blob at x (mm): the highest point of its outline within half a millimetre of x.
 * Read from the vector the print view draws, so it follows each person's own shapes.
 */
function blobTop(card, x) {
  const svg = card.face.querySelector('.face__art svg');
  const path = svg?.querySelector('path');
  if (!path) return null;
  if (!card.outline) {
    const vb = svg.viewBox.baseVal;
    const n = 900;
    const L = path.getTotalLength();
    card.outline = [];
    for (let i = 0; i < n; i++) {
      const p = path.getPointAtLength((L * i) / n);
      // The art layer covers the trim plus 2 mm of bleed on every side.
      card.outline.push([-2 + ((p.x - vb.x) / vb.width) * (TRIM[0] + 4), -2 + ((p.y - vb.y) / vb.height) * (TRIM[1] + 4)]);
    }
  }
  let best = null;
  for (const [px, py] of card.outline) if (Math.abs(px - x) < 0.5 && (best == null || py < best)) best = py;
  return best;
}

function place(card, slug, o) {
  card.layer.appendChild(puppetEl(slug, o));
}

/** Three short wavy pencil lines (the mark's three waves) crossing the shared edge at height y. */
function waves(card, side, y, reach = 7.5) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('class', 'res-waves');
  // In mm, the face's own coordinates; the lines run `reach` mm into the face from the shared edge, on into the bleed.
  s.setAttribute('viewBox', '0 0 54 90');
  s.setAttribute('preserveAspectRatio', 'none');
  const [x0, x1] = side === 'front' ? [TRIM[0] - reach, TRIM[0] + 2] : [-2, reach];
  const paths = [-1.7, 0, 1.7].map((dy, i) => {
    const pts = [];
    for (let x = x0; x <= x1 + 0.01; x += 0.25) {
      const yy = y + dy + 0.55 * Math.sin((x / 4.2) * Math.PI * 2 + i * 0.2);
      pts.push(`${x.toFixed(2)},${yy.toFixed(2)}`);
    }
    return `<polyline points="${pts.join(' ')}"/>`;
  });
  s.innerHTML = paths.join('');
  card.layer.appendChild(s);
}

/**
 * The options. `faces(personId, cards)` poses the puppets on that person's spread.
 * Heights are Tuck's body in mm (mmPerUnit scales the others).
 */
export const OPTIONS = [
  {
    id: 'fuse',
    letter: '★',
    name: '相遇＋融合',
    en: 'Paper Friends',
    dir: friends,
    faces() {},
  },
  {
    id: 'one',
    letter: '1',
    name: '陪你',
    en: 'Companion',
    blob: true,
    faces(id, c) {
      const x = 42.5;
      const y = blobTop(c.front, x) ?? 34;
      place(c.front, PAIRING[id], {
        at: [x, y + 0.6],
        heightMm: 15,
        stance: 'sit',
        arms: { r: -45 },
        wave: { arm: 'r', to: -75 },
        face: [-8, 2],
      });
    },
  },
  {
    id: 'hand',
    letter: '2',
    name: '遞卡',
    en: 'Handing over',
    blob: true,
    faces(id, c, { own = false } = {}) {
      // The back alone: one puppet over the QR code. The same 牽牽 on every card, or (own) each person's.
      const slug = own ? PAIRING[id] : 'tag';
      overQr(c.back, slug, own ? { heightMm: 14.5 } : { bodyMm: 16.8 });
    },
  },
  {
    id: 'round',
    letter: '3',
    name: '繞到背面',
    en: 'Round the edge',
    blob: true,
    faces(id, c) {
      const slug = PAIRING[id];
      const H = 15.5;
      // Front: half of it round the shared edge, standing on the blob where the blob crosses that edge.
      const k = (H * Math.sqrt(rigH(slug) / 420)) / rigH(slug);
      const show = 0.62; // how much of the body's width is in view
      const half = halfWidth(slug);
      const x = TRIM[0] + half * (1 - 2 * show) * k;
      const y = blobTop(c.front, 52.5) ?? 33.5;
      place(c.front, slug, {
        at: [x, y + 0.4],
        heightMm: H,
        arms: { l: 215 },
        wave: { arm: 'l', to: 245 },
        face: [-12, 0],
        tilt: -5,
      });
      // Back: all of it, standing over the QR code.
      overQr(c.back, slug, { heightMm: H });
    },
  },
  {
    id: 'meet',
    letter: '4',
    name: '相遇',
    en: 'Meeting',
    blob: false,
    faces(id, c) {
      const H = 20;
      place(c.front, PAIRING[id], {
        at: [37, 68],
        heightMm: H,
        arms: { r: -35 },
        wave: { arm: 'r', to: -65 },
        face: [10, 0],
        tilt: 4,
      });
      place(c.back, PAIRING[next(id)], {
        at: [17, 68],
        heightMm: H,
        arms: { l: 215 },
        wave: { arm: 'l', to: 245 },
        face: [-10, 0],
        tilt: -4,
      });
      waves(c.front, 'front', 53);
      waves(c.back, 'back', 53);
    },
  },
  {
    id: 'crew',
    letter: '5',
    name: '小隊',
    en: 'The Crew',
    blob: true,
    faces(id, c) {
      // All five sit along the blob's top like a row on a hillside, this card's own in the middle, waving.
      const own = PAIRING[id];
      const others = ORDER.filter((p) => p !== id).map((p) => PAIRING[p]);
      const row = [others[0], others[1], own, others[2], others[3]];
      const xs = [29.6, 34.6, 40, 45.2, 50.2];
      const order = [0, 4, 1, 3, 2]; // the own one painted last, in front
      for (const i of order) {
        const x = xs[i];
        const y = blobTop(c.front, x) ?? 36;
        const mine = i === 2;
        place(c.front, row[i], {
          at: [x, y + 0.5],
          heightMm: mine ? 9.5 : 8.5,
          stance: 'sit',
          arms: mine ? { r: -50 } : undefined,
          wave: mine ? { arm: 'r', to: -80 } : undefined,
          face: mine ? [0, 0] : [i < 2 ? 10 : -10, 0],
          });
      }
    },
  },
];

/**
 * One puppet standing over the back's QR code (top at 70.3 mm, right side at 48.3 mm): its feet 2.8 mm
 * above the code, so the code's quiet zone (two modules, about 1.1 mm) stays bare; its body's right side
 * on the line the code and the wave mark keep. One mitten up to say hello, the other down at the code.
 */
function overQr(card, slug, size) {
  const R = { tuck: 420, tag: 567, card: 309, dot: 231, night: 400 }[slug];
  const k = size.bodyMm ? size.bodyMm / R : (size.heightMm * Math.sqrt(R / 420)) / R;
  const x = 48.3 - halfWidth(slug) * k - 0.6;
  place(card, slug, {
    at: [x, 67.5],
    ...size,
    arms: { l: 215, r: 78 },
    wave: { arm: 'l', to: 240 },
    face: [-3, 5],
  });
}

function rigH(slug) {
  return { tuck: 420, tag: 567, card: 309, dot: 231, night: 400 }[slug];
}
/** Half the torso's width in rig units, about the rig's centre line. */
function halfWidth(slug) {
  return { tuck: 163, tag: 106, card: 199, dot: 108, night: 188 }[slug];
}

/** Every image loaded; one that failed (the local server drops a request now and then) is asked for again. */
async function imagesIn() {
  await Promise.all(
    [...document.images].map(async (im) => {
      // Listen first, then look: a picture that came in before this asked has no load event left to fire.
      for (let i = 0; i < 4; i++) {
        await new Promise((r) => {
          im.addEventListener('load', r, { once: true });
          im.addEventListener('error', r, { once: true });
          if (im.complete) r();
        });
        if (im.naturalWidth) return;
        im.src = `${im.src.replace(/[?#].*$/, '')}?r=${i}`;
      }
    }),
  );
}

async function build() {
  const person = params.get('p') ?? 'chen';
  const only = params.get('only');
  const mmPx = params.has('mm') ? +params.get('mm') : null;

  // ?only=<option id | now>: that one spread alone (for screenshots).
  if (only) {
    document.body.innerHTML = '';
    document.body.style.cssText = 'padding: 24px; background: var(--page)';
    const opt = OPTIONS.find((o) => o.id === only);
    const s = spread(person, { dir: opt?.dir, blob: only === 'now' || opt.blob !== false, mmPx });
    if (only !== 'now') OPTIONS.find((o) => o.id === only).faces(person, s.cards);
    s.el.style.display = 'inline-flex';
    document.body.appendChild(s.el);
    await imagesIn();
    await fontsSettled(document.body);
    document.documentElement.dataset.ready = '1';
    return;
  }

  // The card as it is.
  const now = document.querySelector('[data-slot="now"]');
  if (now) now.appendChild(spread(person, { mmPx }).el);

  for (const opt of OPTIONS) {
    const slot = document.querySelector(`[data-slot="${opt.id}"]`);
    if (!slot || (only && only !== opt.id)) continue;
    const s = spread(person, { dir: opt.dir, blob: opt.blob !== false, mmPx });
    opt.faces(person, s.cards);
    slot.appendChild(s.el);
  }

  // One person each: an option's front and back on all five cards, each with their own puppet, smaller.
  for (const team of document.querySelectorAll('[data-slot="team"]')) {
    const opt = OPTIONS.find((o) => o.id === (team.dataset.option ?? 'round'));
    for (const id of ORDER) {
      const fig = document.createElement('figure');
      fig.className = 'team-card';
      const s = spread(id, { dir: opt.dir, blob: opt.blob !== false });
      opt.faces(id, s.cards, { own: true });
      fig.appendChild(s.el);
      const cap = document.createElement('figcaption');
      const p = PEOPLE.find((x) => x.id === id);
      const n = NAMES[PAIRING[id]];
      // 相遇＋融合 has two on each card: this person's in front, the next teammate's behind.
      cap.textContent =
        opt.id === 'fuse' ? `${p.zh}　正面 ${n.zh}・背面 ${NAMES[PAIRING[next(id)]].zh}` : `${p.zh} × ${n.zh} ${n.en}`;
      fig.appendChild(cap);
      team.appendChild(fig);
    }
  }

  await imagesIn();
  await fontsSettled(document.body);
  document.documentElement.dataset.ready = '1';
}

build();
