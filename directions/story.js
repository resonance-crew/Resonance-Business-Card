/**
 * Direction C · 故事卡 / Story Card
 *
 * The business card IS one of Resonance's own story cards, and it is two of
 * them glued back to back. The front is the card written for this person: a
 * square cover where two blobs meet and melt into one (the card's image),
 * the person's name as its title and the crew's byline under it, nothing
 * else. The back is the card that answers it: the site's line about answers,
 * the e-mail, a QR code as its cover (on the paper right behind the front's
 * cover), and the brand's three waves running in from the drawn card's left
 * line, the edge the front turned over from. Where the two sheets meet, the
 * card's edge shows a seam in the person's colour.
 *
 * Everything is laid out in design units of 0.1 mm on the 90 × 54 mm trim
 * (0…900 × 0…540); type and spacing in the CSS are written in --pt / --mm,
 * and the column positions come from here as --mm multiples.
 */

const TAU = Math.PI * 2;

// ── geometry (design units, 0.1 mm) ──────────────────────────────────────

/**
 * The drawn card's outline: 7 mm in from the trim, its wobble at most
 * ±0.8 mm (scanned: never nearer the trim than 6.2 mm), so a cut that drifts
 * half a millimetre is lost in the hand's own unevenness.
 */
const OUT = { x: 70, y: 70, w: 760, h: 400, R: 36 };
const OUTLINE_OPTS = { segmentsH: [3, 4], segmentsV: [2, 3], curve: 0.75, cornerJitter: 0.7, cornerOffset: 8 };
const OUTLINE_MAG = 11;
/** The content box inside the outline (3.2 mm of padding): 69.6 × 33.6 mm. */
const PAD = 32;
const IN = { x: OUT.x + PAD, y: OUT.y + PAD, w: OUT.w - 2 * PAD, h: OUT.h - 2 * PAD };
/** The front's cover: a square, the full height of the content box (33.6 mm). */
const COVER = { x: IN.x, y: IN.y, w: IN.h, h: IN.h };
/** The gap between a cover and its text (4.4 mm). */
const GAP = 44;
/** The front's text column: 31.6 mm, beside the cover. */
const COL_FRONT = { x: COVER.x + COVER.w + GAP, w: IN.x + IN.w - (COVER.x + COVER.w + GAP) };
/** The back's cover holds only the QR: 26 mm wide, on the paper behind the front's cover. */
const PANEL = { x: IN.x + IN.w - 260, y: IN.y, w: 260, h: IN.h };
/** The back's text column: 39.2 mm, so an address of 28 characters stays on one line. */
const COL_BACK = { x: IN.x, w: PANEL.x - GAP - IN.x };
/** The ripple: where its middle line runs, and its shape (the wave mark's proportions, drawn long). */
const RIPPLE = { y: 142, halves: 6, half: 26, amp: 6.6, gap: 13.5 };

// Pen weights live in story.css and on the paths: the app's one pen at print size, 0.28 / 0.3 mm.

// ── the app's hand (ported from the Resonance repo: prng.ts, wobRect.ts) ──

function makePrng(seed) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const fx = (n) => +n.toFixed(2);

/**
 * A wobbly rounded rectangle (src/lib/design/wobRect.ts), drawn at (ox, oy).
 * Corners are bezier quarter circles with a jittered radius; edges are cubics
 * through seeded wobble anchors. Same PRNG order as the app, so a seed draws
 * the same hand.
 */
function wobRect(W, H, R, seed, mag, opts = {}, ox = 0, oy = 0) {
  const rnd = makePrng(seed);
  const m = mag != null ? mag : Math.min(W, H) * 0.025;
  const K = 0.552;
  const curve = opts.curve ?? 1;
  const cornerJitter = opts.cornerJitter ?? 1;
  const cornerOffset = opts.cornerOffset ?? 0;
  const segs = (v, fb) => (v == null ? fb : Array.isArray(v) ? v[0] + Math.floor(rnd() * (v[1] - v[0] + 1)) : v | 0);
  const segH = segs(opts.segmentsH, 3);
  const segV = segs(opts.segmentsV, 3);
  const corner = (r) => r + (rnd() - 0.5) * 2 * (Math.min(r * 0.07, Math.max(0, Math.min(W, H) / 2 - r) * 0.4) * cornerJitter);
  const Rtl = corner(R);
  const Rtr = corner(R);
  const Rbr = corner(R);
  const Rbl = corner(R);
  const oCap = Math.max(0, Math.min(W, H) * 0.5 - Math.max(Rtl, Rtr, Rbr, Rbl)) * 0.6;
  const oMag = Math.min(cornerOffset, oCap);
  const o = () => (rnd() - 0.5) * 2 * oMag;
  const tlX = o(), tlY = o(), trX = o(), trY = o(), brX = o(), brY = o(), blX = o(), blY = o();
  const perpAmp = Math.min(m * 0.95 * curve, Math.min(W, H) * 0.032 * Math.max(1, curve));
  const P = (x, y) => `${fx(x + ox)},${fx(y + oy)}`;
  const C = (x1, y1, x2, y2, x, y) => `C${P(x1, y1)} ${P(x2, y2)} ${P(x, y)}`;
  const cubicH = (a, b) => {
    const h = Math.abs(b[0] - a[0]) / 3;
    const dir = b[0] >= a[0] ? 1 : -1;
    return C(a[0] + dir * h, a[1], b[0] - dir * h, b[1], b[0], b[1]);
  };
  const cubicV = (a, b) => {
    const h = Math.abs(b[1] - a[1]) / 3;
    const dir = b[1] >= a[1] ? 1 : -1;
    return C(a[0], a[1] + dir * h, b[0], b[1] - dir * h, b[0], b[1]);
  };
  const edge = (a, b, axis, n) => {
    const emit = axis === 'x' ? cubicH : cubicV;
    const len = axis === 'x' ? Math.abs(b[0] - a[0]) : Math.abs(b[1] - a[1]);
    if (n < 2 || len < perpAmp * 4) return [emit(a, b)];
    const anchors = [];
    const jit = Math.min(0.08, 0.4 / n);
    for (let i = 1; i < n; i++) {
      const t = i / n + (rnd() - 0.5) * jit;
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      anchors.push(axis === 'x' ? [x, y + (rnd() - 0.5) * 2 * perpAmp] : [x + (rnd() - 0.5) * 2 * perpAmp, y]);
    }
    const out = [];
    let prev = a;
    for (const p of anchors) {
      out.push(emit(prev, p));
      prev = p;
    }
    out.push(emit(prev, b));
    return out;
  };
  const TLa = [0, Rtl + tlY];
  const TLb = [Rtl + tlX, 0];
  const TRa = [W - Rtr + trX, 0];
  const TRb = [W, Rtr + trY];
  const BRa = [W, H - Rbr + brY];
  const BRb = [W - Rbr + brX, H];
  const BLa = [Rbl + blX, H];
  const BLb = [0, H - Rbl + blY];
  const parts = [`M${P(TLa[0], TLa[1])}`];
  parts.push(C(0, TLa[1] * (1 - K) + TLb[1] * K, TLb[0] * (1 - K) + TLa[0] * K, 0, TLb[0], TLb[1]));
  parts.push(...edge(TLb, TRa, 'x', segH));
  parts.push(C(TRa[0] + (W - TRa[0]) * K, 0, W, TRb[1] * (1 - K), TRb[0], TRb[1]));
  parts.push(...edge(TRb, BRa, 'y', segV));
  parts.push(C(W, BRa[1] + (H - BRa[1]) * K, BRb[0] + (W - BRb[0]) * K, H, BRb[0], BRb[1]));
  parts.push(...edge(BRb, BLa, 'x', segH));
  parts.push(C(BLa[0] * (1 - K), H, 0, BLb[1] + (H - BLb[1]) * K, BLb[0], BLb[1]));
  parts.push(...edge(BLb, TLa, 'y', segV));
  parts.push('Z');
  return parts.join('');
}

/** Points along a path of M and C commands (what wobRect writes), `steps` per curve. */
function pathPoints(d, steps = 20) {
  const pts = [];
  let cur = [0, 0];
  for (const [, cmd, args] of d.matchAll(/([MC])([^MCZ]*)/g)) {
    const n = (args.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (cmd === 'M') {
      cur = [n[0], n[1]];
      pts.push(cur);
      continue;
    }
    for (let i = 0; i + 5 < n.length; i += 6) {
      const [x1, y1, x2, y2, x, y] = n.slice(i, i + 6);
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const u = 1 - t;
        const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, e = t * t * t;
        pts.push([a * cur[0] + b * x1 + c * x2 + e * x, a * cur[1] + b * y1 + c * y2 + e * y]);
      }
      cur = [x, y];
    }
  }
  return pts;
}

/** Where the outline's left side crosses the height y. */
function leftEdgeAt(pts, y) {
  let best = OUT.x;
  let found = false;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    if (ay === by || (ay - y) * (by - y) > 0 || Math.min(ax, bx) > OUT.x + OUT.w / 2) continue;
    const x = ax + ((bx - ax) * (y - ay)) / (by - ay);
    if (!found || x < best) best = x;
    found = true;
  }
  return best;
}

/**
 * The brand's three ripples drawn long, in the wave mark's own rhythm
 * (people.js WAVE_PATHS: each half wave one cubic with level handles at a
 * third and two thirds, the three lines in step, rising first). Each line
 * starts where it meets the outline's left side (starts[i]) and runs `halves`
 * half waves of `half` units, `gap` apart round yc; `amp` is the crest's
 * height (a cubic with level handles peaks at ¾ of them). The lines end a
 * hair apart, as the mark's do.
 */
function rippleLines(starts, yc, { halves, half, amp, gap }, ends = [0, 2.5, -2]) {
  const lift = amp / 0.75;
  return [-1, 0, 1].map((row, i) => {
    const y = yc + row * gap;
    const x0 = starts[i];
    let d = `M${fx(x0)},${fx(y)}`;
    for (let k = 0; k < halves; k++) {
      const a = x0 + k * half;
      const w = k === halves - 1 ? half + ends[i] : half;
      const s = k % 2 === 0 ? -1 : 1;
      d += `C${fx(a + w / 3)},${fx(y + s * lift)} ${fx(a + (2 * w) / 3)},${fx(y + s * lift)} ${fx(a + w)},${fx(y)}`;
    }
    return d;
  });
}

// ── colour: each person's card wears a family of the app's card palette ──

/**
 * The story cards' families: the pens are StoryCard's CARD_BORDERS (a touch
 * less chroma, for CMYK), the blobs the hero's inks (tokens.css).
 */
const FAMILIES = {
  terracotta: { hue: 55, pen: 'oklch(52% 0.12 52)', blob: 'terracottaLight' },
  lavender: { hue: 290, pen: 'oklch(53% 0.10 290)', blob: 'lavender' },
  sage: { hue: 140, pen: 'oklch(50% 0.11 140)', blob: 'sage' },
  // An amber pen: the family's own yellow hue goes khaki once it is CMYK.
  yellow: { hue: 85, pen: 'oklch(56% 0.11 72)', blob: 'yellow' },
  sky: { hue: 215, pen: 'oklch(50% 0.10 215)', blob: 'sky' },
};
/**
 * Whose card is which family, and whose blob it melts with (the colour the
 * answer comes in). The first colours are the ones the site already gives
 * them: 念 peach, 蕭 lavender, 方 sage; 鄭 sky; 薛 butter. A third entry 'warm' turns the
 * melt the warm way round the hue circle (see WARM_WAY).
 */
const PAIRS = {
  chen: ['terracotta', 'lavender'],
  hsiao: ['lavender', 'yellow'],
  fang: ['sage', 'terracotta'],
  cheng: ['sky', 'terracotta', 'warm'],
  hsueh: ['yellow', 'terracotta'],
};
const FALLBACK = [
  ['terracotta', 'lavender'],
  ['lavender', 'yellow'],
  ['sage', 'terracotta'],
  ['sky', 'terracotta', 'warm'],
];

/**
 * Both covers' ground: one warm sand for everyone (about an 8 % screen; lighter mottles on
 * cotton), so every card stays warm and each person's colour lives in their pen and their blob.
 */
const COVER_GROUND = 'oklch(93.5% 0.026 66)';

// Oklab, for mixing the palette's own colours.
function toLab(css) {
  const m = /oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)/.exec(css);
  const h = (Number(m[3]) * Math.PI) / 180;
  return [Number(m[1]) / 100, Number(m[2]) * Math.cos(h), Number(m[2]) * Math.sin(h)];
}
function toCss([L, a, b]) {
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return `oklch(${(L * 100).toFixed(2)}% ${C.toFixed(4)} ${h.toFixed(1)})`;
}
/**
 * a → b by t, keeping chroma and turning the hue (so lavender and peach pass through rose, not grey).
 * The hue turns the short way round, or with `warm` the way that passes through rose (hue 0).
 */
function mixHue(a, b, t, warm = false) {
  const [L1, a1, b1] = toLab(a);
  const [L2, a2, b2] = toLab(b);
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const h1 = Math.atan2(b1, a1);
  // The turn from a to b, short way first: (−π, π].
  let turn = Math.atan2(b2, a2) - h1;
  while (turn > Math.PI) turn -= TAU;
  while (turn <= -Math.PI) turn += TAU;
  if (warm) {
    // Does the short turn pass hue 0? If not, go the other way round.
    const from = ((h1 % TAU) + TAU) % TAU;
    const passesRose = turn > 0 ? from + turn >= TAU : from + turn <= 0;
    if (!passesRose) turn += turn > 0 ? -TAU : TAU;
  }
  const h = h1 + turn * t;
  const C = C1 + (C2 - C1) * t;
  return toCss([L1 + (L2 - L1) * t, C * Math.cos(h), C * Math.sin(h)]);
}
/** A solid tint: the colour laid at `f` on the paper (what a screened ink would look like, as one colour). */
const tintOf = (css, paper, f) => {
  const p = toLab(paper);
  const c = toLab(css);
  return toCss(p.map((v, i) => v + (c[i] - v) * f));
};

function paletteOf(person, ink) {
  const [a, b, way] = PAIRS[person.id] ?? FALLBACK[Math.abs(person.seed ?? 0) % FALLBACK.length];
  const fam = (k) => {
    const f = FAMILIES[k];
    return { ...f, ink: ink[f.blob] };
  };
  const own = fam(a);
  const other = fam(b);
  return {
    own,
    other,
    /** Whether the two melt the warm way round (WARM_WAY). */
    warm: way === 'warm',
    /** Front: the card's pen, and the cover's warm ground. */
    pen: own.pen,
    ground: COVER_GROUND,
    /** Back: the answer card is drawn by the other hand; its cover (the QR's) is the same ground. */
    penBack: other.pen,
    groundBack: COVER_GROUND,
    /** The ripple comes from the front's side: its pen, then two solid tints of it (never an opacity). */
    ripple: [own.pen, tintOf(own.pen, ink.paper, 0.74), tintOf(own.pen, ink.paper, 0.5)],
    /** The seam between the two sheets, as the card's edge shows it. */
    seam: tintOf(own.pen, ink.paper, 0.8),
  };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// ── the blobs on the cover ───────────────────────────────────────────────

/** The frame the still card and the print file show, seconds. */
const STILL_T = 7.5;
/** How long the two take to meet, seconds (each arrival of the front). */
const MEET_S = 2.8;
/** The arrival's settle: the card lands before the two start toward each other. */
const FIRST_MEET_DELAY = 1.3;
/** Once met, how far each colour has run into the other (the hero's melt: both drift toward the shared colour). */
const MELT = 0.14;
/**
 * The warm way (鄭's sky and peach). Two colours that face each other across the hue circle meet,
 * in the blobs' blend, along the shorter arc between them, and sky to peach that is yellow-green
 * (khaki on paper). So a 'warm' pair is always turned a little toward each other through lavender
 * and rose, apart too (`floor`: 6 % of the 195° arc, 11.7° each, leaving 172°), and a little more
 * once met (`melt`: 8 %, 15.6° each, leaving 164°). Under 180° apart, every blend of the two, on the
 * screen and in the print file alike, passes through lilac and rose and never through green.
 */
const WARM_WAY = { floor: 0.06, melt: 0.08 };

/** A slow breath (19 s) with a smaller one inside it: how close the two are, once they have met. */
const breathOf = (t) => 0.4 + 0.045 * Math.sin((TAU * t) / 19 + 0.6) + 0.018 * Math.sin((TAU * t) / 7.9 + 2.1);

/**
 * The two blobs in their own corners of the square cover, apart (k = 0), sized
 * so that they never reach its drawn edge (scanned over 120 s for all four
 * people: met and breathing ≥ 2.6 mm inside it, ≥ 2.3 mm while they come
 * together, two shapes with a gap between them when apart). `meet` (0–1) is
 * how far they have come toward each other; at 1 they breathe round a wide,
 * soft neck (k ≈ 0.34–0.46), 14 % of each colour has run into the other (a
 * warm pair: 6 % apart, 8 % met, the warm way round; WARM_WAY), and
 * the drift is under a millimetre.
 */
function coverBlobs(blobs, pal, seed, t, meet = 1) {
  const k = breathOf(t) * meet;
  const dx = 6 * Math.sin((TAU * t) / 23) * meet;
  const dy = 5 * Math.sin((TAU * t) / 29 + 1.1) * meet;
  const melt = pal.warm ? blobs.lerp(WARM_WAY.floor, WARM_WAY.melt, blobs.smoothstep(meet)) : MELT * blobs.smoothstep(meet);
  // They swell a little as they come together (apart they must fit in their corners with a gap).
  const grow = 0.85 + 0.19 * blobs.smoothstep(meet);
  const A = { x: COVER.x + 110 + dx, y: COVER.y + 113 + dy, R: 78 * grow, seed, color: mixHue(pal.own.ink, pal.other.ink, melt, pal.warm), alpha: 0.92, pace: 1 };
  const B = { x: COVER.x + 236 - dx * 0.7, y: COVER.y + 235 - dy, R: 69 * grow, seed: seed + 5, color: mixHue(pal.other.ink, pal.own.ink, melt, pal.warm), alpha: 0.92, pace: 1 };
  return blobs.meeting(A, B, k);
}

/** How softly the two colours meet in the still and print cover: the paint's weights are (R² / d²) to this power. */
const SOFT = 1.4;
/**
 * The warm way's paint, still and print. Two colours 164° apart turn through lilac and rose over a
 * millimetre or so: drawn at full chroma that is a stripe, where the screen (its colours smoothed
 * across a 4 mm grid) shows a pale rose haze. So where neither colour leads, the paint gives up some
 * chroma: × coherence^DIP, coherence being the length of the weighted mean of the two hue directions
 * (1 inside either blob, about 0.14 halfway): the middle of the neck a pale mauve, never green.
 */
const DIP = 0.5;

/** blobs.blend (lightness and chroma averaged, hue as a direction), its chroma × coherence^dip. */
function blendDip(blobs, cs, ws, dip) {
  const out = blobs.blend(cs, ws);
  if (!dip) return out;
  let sw = 0, a = 0, b = 0;
  for (let i = 0; i < cs.length; i++) {
    const c = Math.hypot(cs[i][1], cs[i][2]);
    sw += ws[i];
    if (c > 1e-6) {
      a += (ws[i] * cs[i][1]) / c;
      b += (ws[i] * cs[i][2]) / c;
    }
  }
  const k = sw > 0 ? Math.min(1, Math.hypot(a, b) / sw) ** dip : 1;
  return [out[0], out[1] * k, out[2] * k];
}

/**
 * The cover's blobs for the still card and the press. The outline is vector
 * (blobs.outlinePath); the paint inside it is the screen's soft melt, laid down
 * as an image at 317 dpi (0.08 mm a pixel) over the cover only and clipped by
 * that outline, so the two colours run into each other along the shape, as the
 * hero's do, instead of in a straight band (blobSvg's two-stop gradient).
 */
function stillCover(blobs, list, t, ground, grain, id, dip = 0) {
  const pad = 12;
  const region = { x: COVER.x - pad, y: COVER.y - pad, w: COVER.w + 2 * pad, h: COVER.h + 2 * pad };
  const d = blobs.outlinePath(list, t, region, 2.5);
  if (!d) return '';
  const res = 0.8;
  const W = Math.round(COVER.w / res);
  const H = Math.round(COVER.h / res);
  const paper = toLab(ground);
  const cs = list.map((b) => {
    const k = toLab(b.color);
    const a = Math.min(1, b.alpha ?? 1);
    return paper.map((v, i) => v + (k[i] - v) * a);
  });
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  const img = g.createImageData(W, H);
  const ws = cs.map(() => 0);
  for (let j = 0; j < H; j++) {
    const y = COVER.y + (j + 0.5) * res;
    for (let i = 0; i < W; i++) {
      const x = COVER.x + (i + 0.5) * res;
      for (let n = 0; n < list.length; n++) {
        const b = list[n];
        const R2 = b.R * b.R;
        ws[n] = (R2 / ((x - b.x) ** 2 + (y - b.y) ** 2 + 1e-3 * R2)) ** SOFT;
      }
      const [r, gg, bb] = blobs.oklabToRgb(blendDip(blobs, cs, ws, dip));
      const o = (j * W + i) * 4;
      img.data[o] = r;
      img.data[o + 1] = gg;
      img.data[o + 2] = bb;
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  let out =
    `<clipPath id="${id}b"><path d="${d}" clip-rule="evenodd"/></clipPath>` +
    `<image href="${canvas.toDataURL('image/png')}" x="${COVER.x}" y="${COVER.y}" width="${COVER.w}" height="${COVER.h}" ` +
    `preserveAspectRatio="none" clip-path="url(#${id}b)"/>`;
  if (grain) {
    // Screen only (print has none): the hero's sand, as an SVG noise over the paint.
    out +=
      `<filter id="${id}n" x="0" y="0" width="100%" height="100%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" seed="3"/>` +
      `<feColorMatrix type="saturate" values="0"/>` +
      `<feComponentTransfer><feFuncA type="linear" slope="${grain}"/></feComponentTransfer>` +
      `<feComposite in2="SourceGraphic" operator="in"/></filter>` +
      `<path d="${d}" fill="#000" fill-rule="evenodd" filter="url(#${id}n)"/>`;
  }
  return out;
}

// ── the direction ────────────────────────────────────────────────────────

/** A position in mm for the CSS, from design units. */
const mm = (v) => fx(v / 10);

export default {
  id: 'story',
  letter: 'C',
  name: '故事卡',
  enName: 'Story Card',
  orientation: 'landscape',
  // Two sheets glued back to back: a little thicker than one card, and the taps turn it so the
  // right edge comes toward you, the edge the back's waves run in from.
  thicknessMm: 0.9,
  turnDir: -1,
  pitch: '名片本身就是兩張故事卡背對背黏在一起：正面寫的是這個人，封面是兩個色塊融成一體；翻過來，是回應它的那一張',
  notes: [
    { k: '概念', v: '照產品的故事卡排，但正面只留三樣：33.6 mm 見方的封面裡兩個色塊相遇、融成一體，是整張名片的圖像；旁邊是名字（標題）和「共振小隊」作者欄，中間留白，不放標籤、頭像和分隔線。背面是回應它的那張卡，由和他融在一起的那個顏色畫框：品牌的三道波紋從框的左邊線長出來，下面是官網那句「回應一個故事的，是另一個故事」和 Email；QR 碼是它的封面，在紙上正好疊在正面封面的背後。兩個封面都是同一種暖沙色底，每個人的顏色只出現在外框、波紋和色塊上：念蜜桃、蕭薰衣草、方鼠尾草，和官網上三人頭像同色，鄭用天空藍；筆色取自產品故事卡的邊框色。天空藍和蜜桃在色相環上幾乎正對，照短邊融會經過黃綠、印出來像卡其，所以鄭的兩個顏色從暖的那一側（薰衣草、玫瑰）融過去，頸部是一層淡淡的玫瑰色。' },
    { k: '語言', v: '預設中英並列：中文名在上、英文名在下；背面中文句斷成兩行，英文句在同一處斷成兩行跟著。也可整張只用中文或只用英文，位置不變；只用英文時名字拆成名與姓兩行，12.5 pt。' },
    { k: '字級', v: '中英並排時中文比英文小一級（約 0.85 到 0.9 倍）：中文字面填滿字身，小一級才和英文看起來一樣大。中文名 9 pt Noto Serif TC 600、字距 0.22em，英文名 10.5 pt Playfair 700（0.86 倍）；作者欄中文 7 pt Noto Sans TC 400、字距 0.16em（已是中文的最小字級），英文 7.5 pt；背面中文句 8 pt Noto Serif TC 500、字距 0.08em，英文句 9 pt Playfair 斜體（0.89 倍），同色、只靠斜體分層。Email 7 pt（太長先縮到 6.5 pt，再不行才在 @ 前斷行），QR 下的網址 6.5 pt。只用中文時中文名 12 pt、背面句 10 pt；只用英文時背面句 10 pt 粗體。所有字離裁切線約 10 mm。' },
    { k: '印刷', v: '手繪外框是 0.28 mm 單線，離裁切線 7 mm、起伏 ±0.8 mm，四個人掃過最近 6.2 mm，裁切偏 0.5 mm 也混在手的起伏裡。建議兩張 300 gsm 棉紙對裱（約 0.9 mm），中間夾一層和正面外框同色的色紙，四邊就是一道色線，正是兩張卡黏在一起的地方；做不到就單張 400 gsm。封面底是約 8% 網點的暖沙色；色塊外形是向量，裡面的融色嵌成 317 dpi 影像、以外形裁切；三道波紋是筆色的 100%、74%、50% 實色，不用透明度；印刷稿的淺色小字壓深到 L 38%。QR 16 mm 寬、每格 0.64 mm，四周至少 4.6 mm 淺底（7 格以上），目前開 resonance.channel，people.js 填上個人頁後就改開本人的頁面。粉彩在 CMYK 會略灰，薰衣草與天空藍要先打樣。' },
    { k: '動態', v: '卡片落定 1.3 秒後，封面兩個色塊從各自的角落（先是 85% 大小）在 2.8 秒內靠近、長大，長出寬而軟的頸部，顏色互相滲進 14%（鄭的一對走暖的那一側，分開時已先互轉 6%，相遇後 8%），接上 19 秒一輪的呼吸，漂移不到 1 mm，整段離封面的手繪邊 2.3 mm 以上；每次翻回正面都再相遇一次。點一下時右緣朝你翻過來，翻轉中看得到四邊那道色線，背面的三道波紋就從那一側的框線依序畫進來，約 2.8 秒，每翻一次只畫一次。螢幕上的色塊帶一點沙粒（可關），印刷稿沒有；降低動態時直接畫靜止畫面，也就是印刷稿的第 7.5 秒。' },
  ],
  langs: [
    { id: 'both', label: '中英並列' },
    { id: 'zh', label: '中文' },
    { id: 'en', label: 'English' },
  ],
  stillTime: STILL_T,

  mount(faces, ctx) {
    const { person, brand, ink, blobs, box, lang } = ctx;
    const pal = paletteOf(person, ink);
    const seed = person.seed ?? 11;
    const uid = 'sc' + Math.random().toString(36).slice(2, 9);
    const showZh = lang !== 'en';
    const showEn = lang !== 'zh';
    const cleanups = [];

    // ── shapes (fixed for the person, so they are the same on screen and in print) ──
    const outlineFront = wobRect(OUT.w, OUT.h, OUT.R, seed * 7 + 13, OUTLINE_MAG, OUTLINE_OPTS, OUT.x, OUT.y);
    const outlineBack = wobRect(OUT.w, OUT.h, OUT.R, seed * 7 + 41, OUTLINE_MAG, OUTLINE_OPTS, OUT.x, OUT.y);
    const coverOpts = { segmentsH: [2, 3], segmentsV: [2, 3], curve: 0.42, cornerJitter: 1.1, cornerOffset: 6 };
    const coverFront = wobRect(COVER.w, COVER.h, 24, seed + 5, 14, coverOpts, COVER.x, COVER.y);
    const coverBack = wobRect(PANEL.w, PANEL.h, 22, seed + 29, 14, coverOpts, PANEL.x, PANEL.y);
    // The ripple starts on the back outline's left line (where it runs straight, under the corner),
    // each wave exactly where it meets the line, and runs 15.6 mm into the card.
    const backPts = pathPoints(outlineBack);
    const starts = [-1, 0, 1].map((r) => leftEdgeAt(backPts, RIPPLE.y + r * RIPPLE.gap));
    const ripple = rippleLines(starts, RIPPLE.y, RIPPLE);
    const rippleBottom = RIPPLE.y + RIPPLE.gap + RIPPLE.amp + 1.5;
    const line = (d, stroke, w) =>
      `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const chromeSvg = (inner) =>
      `<svg class="sc-chrome" viewBox="0 0 900 540" aria-hidden="true" ` +
      `style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none">${inner}</svg>`;

    // ── the front: the card written for this person ──
    const nameZh = showZh ? `<span class="sc-name-zh" lang="zh-Hant">${esc(person.zh)}</span>` : '';
    const nameEn = !showEn
      ? ''
      : showZh
        ? `<span class="sc-name-en" lang="en">${esc(person.en)}</span>`
        : `<span class="sc-name-en" lang="en">${esc(person.given ?? person.en)}${person.family ? `<br>${esc(person.family)}` : ''}</span>`;
    const byZh = showZh ? `<span class="sc-by-zh" lang="zh-Hant">${esc(brand.team.zh)}</span>` : '';
    const byEn = showEn ? `<span class="sc-by-en" lang="en">${esc(brand.team.en)}</span>` : '';

    faces.front.content.innerHTML = `
      <div class="sc sc-front" data-lang="${lang}" data-mode="${ctx.mode}"
        style="position:absolute;inset:0;--col-x:${mm(COL_FRONT.x)};--col-w:${mm(COL_FRONT.w)};--col-y:${mm(IN.y)};--col-h:${mm(IN.h)}">
        ${chromeSvg(line(outlineFront, pal.pen, 2.8))}
        <div class="sc-col">
          <h2 class="sc-name">${nameZh}${nameEn}</h2>
          <p class="sc-by">${byZh}${byEn}</p>
        </div>
      </div>`;

    // ── the back: the answer card ──
    const lineZh = showZh
      ? `<span class="sc-line-zh" lang="zh-Hant">${esc(brand.answer.zh).replace('，', '，<br>')}</span>`
      : '';
    const lineEn = showEn ? `<span class="sc-line-en" lang="en">${esc(brand.answer.en)}</span>` : '';
    const animate = ctx.live;
    // A long address, if it must wrap, breaks before its @.
    const at = person.email.lastIndexOf('@');
    const emailHtml = at > 0 ? `<span>${esc(person.email.slice(0, at))}</span><span>${esc(person.email.slice(at))}</span>` : esc(person.email);
    // What the QR opens: the shell's url (resonance.channel for now). Once people.js gives someone a
    // handle, it opens their own page instead.
    const qrUrl = person.handle && ctx.url === brand.url ? `${brand.url}/u/${encodeURIComponent(person.handle)}` : ctx.url;

    faces.back.content.innerHTML = `
      <div class="sc sc-back" data-lang="${lang}" data-mode="${ctx.mode}"
        style="position:absolute;inset:0;--col-x:${mm(COL_BACK.x)};--col-w:${mm(COL_BACK.w)};--col-y:${mm(IN.y)};--col-h:${mm(IN.h)};--line-y:${mm(rippleBottom - IN.y)};--panel-x:${mm(PANEL.x)};--panel-w:${mm(PANEL.w)}">
        ${chromeSvg(
          line(outlineBack, pal.penBack, 2.8) +
            `<g class="sc-ripple"${animate ? ' data-anim="off"' : ''}>` +
            ripple.map((d, i) => `<path d="${d}" pathLength="1" fill="none" stroke="${pal.ripple[i]}" stroke-width="3" stroke-linecap="round"/>`).join('') +
            `</g>`,
        )}
        <div class="sc-col">
          <p class="sc-line">${lineZh}${lineEn}</p>
          <p class="sc-contact" lang="en"><span class="sc-mail">${emailHtml}</span></p>
        </div>
        <div class="sc-door">
          <div class="sc-qr">${ctx.qrSvg(qrUrl, { color: ink.text })}</div>
          <p class="sc-site" lang="en">${esc(brand.site)}</p>
        </div>
      </div>`;

    // ── the covers' grounds, and the blobs clipped to the front cover ──
    const vb = `${box.x} ${box.y} ${box.w} ${box.h}`;
    const artSvg = (inner) => `<svg class="sc-art" viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true">${inner}</svg>`;
    faces.back.art.innerHTML = artSvg(`<path d="${coverBack}" fill="${pal.groundBack}"/>`);

    let layer = null;
    let host = null;
    if (ctx.live) {
      faces.front.art.innerHTML = artSvg(`<path d="${coverFront}" fill="${pal.ground}"/>`);
      host = document.createElement('div');
      host.className = 'sc-cover-live';
      const mask = `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="none"><path d="${coverFront}" fill="#000"/></svg>`,
      )}")`;
      Object.assign(host.style, {
        position: 'absolute',
        inset: '0',
        webkitMaskImage: mask,
        maskImage: mask,
        webkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        webkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      });
      faces.front.art.appendChild(host);
      layer = blobs.canvasLayer(host, { box, paper: pal.ground, grain: 0.22 * ctx.grain, cell: 4, colourCell: 40 });
    }

    const drawStill = (t) => {
      const list = coverBlobs(blobs, pal, seed, t);
      faces.front.art.innerHTML = artSvg(
        `<defs><clipPath id="${uid}c"><path d="${coverFront}"/></clipPath></defs>` +
          `<path d="${coverFront}" fill="${pal.ground}"/>` +
          `<g clip-path="url(#${uid}c)">${stillCover(blobs, list, t, pal.ground, ctx.grain ? 0.22 : 0, uid, pal.warm ? DIP : 0)}</g>`,
      );
    };

    // ── the meeting: on screen the two come together each time the front arrives ──
    // As the card lands, and on every turn back to the front, they start apart and close in over
    // 2.8 s (easing out), grow a neck, melt and settle into the breath; turned away, they part unseen.
    let clock = STILL_T;
    let meetAt = null;
    const meetOf = (t) => {
      if (meetAt === null) meetAt = t + FIRST_MEET_DELAY;
      const p = Math.min(1, Math.max(0, (t - meetAt) / MEET_S));
      return 1 - (1 - p) ** 3;
    };

    const stop = ctx.loop((t) => {
      clock = t;
      if (layer) {
        // The front's blobs only live while the front can be seen.
        if (ctx.side === 'back') return;
        layer.draw(coverBlobs(blobs, pal, seed, t, meetOf(t)), t);
      } else {
        drawStill(t);
      }
    });

    if (layer) {
      cleanups.push(
        ctx.onSide((side) => {
          if (side === 'front') {
            meetAt = clock;
          } else {
            // The front has just turned away: part them now, so it comes back with the two apart.
            meetAt = Infinity;
            layer.draw(coverBlobs(blobs, pal, seed, clock, 0), clock);
          }
        }),
      );
    }

    // ── the seam: two sheets glued back to back show a line of colour round the edge ──
    const across = (deg) => `linear-gradient(${deg}deg, var(--edge) 0 33%, ${pal.seam} 33% 67%, var(--edge) 67%)`;
    for (const e of ['l', 'r']) ctx.paintEdge(e, across(90));
    for (const e of ['t', 'b']) ctx.paintEdge(e, across(180));
    cleanups.push(() => {
      for (const e of ['l', 'r', 't', 'b']) ctx.paintEdge(e, '');
    });

    // ── the turn: the ripple draws itself in from the outline, once per arrival on the back ──
    if (animate) {
      const g = faces.back.content.querySelector('.sc-ripple');
      const set = (side) => {
        if (side === 'back') {
          g.dataset.anim = 'off';
          void g.getBoundingClientRect();
          g.dataset.anim = 'on';
        } else {
          g.dataset.anim = 'off';
        }
      };
      cleanups.push(ctx.onSide(set));
      if (ctx.side === 'back') set('back');
    }

    // ── contact: a long address steps down to 6.5 pt, and wraps before its @ only if even that is too wide ──
    let dead = false;
    const fitContact = () => {
      if (dead) return;
      const c = faces.back.content.querySelector('.sc-contact');
      if (!c || !c.offsetWidth) return;
      const room = c.getBoundingClientRect().width + 0.5;
      const over = () => c.firstElementChild.getBoundingClientRect().width > room;
      c.dataset.fit = '';
      if (over()) {
        c.dataset.fit = 'small';
        if (over()) c.dataset.fit = 'wrap';
      }
    };
    fitContact();
    document.fonts?.ready.then(fitContact);
    // The address is watched on its own: a font that arrives late changes the line, not the face.
    // The refit waits a frame, so it never resizes what is being observed.
    let queued = 0;
    const ro = new ResizeObserver(() => {
      if (!queued) queued = requestAnimationFrame(() => ((queued = 0), fitContact()));
    });
    cleanups.push(() => cancelAnimationFrame(queued));
    ro.observe(faces.back.content);
    const mail = faces.back.content.querySelector('.sc-mail');
    if (mail) ro.observe(mail);
    cleanups.push(() => ro.disconnect());

    return {
      destroy() {
        dead = true;
        stop();
        for (const c of cleanups) c?.();
        layer?.destroy();
        host?.remove();
        faces.front.art.textContent = '';
        faces.back.art.textContent = '';
        faces.front.content.textContent = '';
        faces.back.content.textContent = '';
      },
    };
  },
};
