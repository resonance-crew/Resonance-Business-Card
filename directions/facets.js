/**
 * Direction B 兩面 / Two Sides.
 *
 * 人，生而立體: the same person, two faces. One face is Chinese only (the
 * name set vertically, like the spine of a book, its seal beneath it), the
 * other English only. One peach blob passes THROUGH the card: it is cut by
 * the front's right edge and continues on the back, cut by the back's left
 * edge, and once the card is turned over those are the same physical edge,
 * so the shape runs round it. That whole long edge is painted peach (one
 * finish, the same for every name), so as the card turns the edge is the
 * shape going round.
 *
 * Geometry. The card turns about its vertical axis, which keeps y and
 * sends the front's right edge to the back's left. Whichever face is in
 * front, the peach crosses that edge: in front, a face carries the peach on
 * its right; behind, on its left. So 「中文面在前」 and 「英文面在前」 are
 * mirror layouts of the same two faces, and laid flat side by side
 * (front | back) the two halves always meet at the seam as one shape. A
 * face's x runs 0…540 (0.1 mm); the peach's centre sits on the shared edge
 * (x = 540 on the front, x = 0 on the back), at the same y, size, seed and
 * clock on both faces, so its chord on that edge is the same from either
 * side. Nothing else reaches that edge.
 *
 * Each face also has a blob of its own in the one second ink (lavender, on
 * both faces) that meets the peach with a neck. Whenever a face comes into
 * view (the card arriving once its type is in, or a turn) that blob starts
 * GAP (7 mm) of bare paper away from the peach, measured for each person's
 * shapes at that moment, and closes the gap in MEET_TIME: the two touch,
 * the neck grows and melts (see MELT: the waist fills out into round
 * fillets, no crease), and the neck is then held.
 * Every frame the field along the line between the two centres is kept
 * above NECK_HOLD by easing the blob toward the peach just as far as it
 * needs, so the two never part while the lobes turn.
 *
 * Colour is two inks: the peach turns into the lavender across the waist,
 * through a warm blush (never the grey their overprint would make), over
 * about 15 mm once they have melted, and not at all while they are apart
 * (each ink flat). Screen and print use the same paint; print stays
 * vector, and `?plate=` renders one ink's separation for the spot / riso route.
 */

const TAU = Math.PI * 2;

/** The moment the still card and the print file show (s). */
const STILL_TIME = 7.5;

/** The wrapped blob's ink, and how much of it is laid on the paper. */
const PEACH = 'oklch(88% 0.08 55)';
const PEACH_ALPHA = 0.95;
/** The one second ink, the same on both faces, and its density. */
const PARTNER = 'lavender';
const PARTNER_ALPHA = 0.78;

/**
 * The shared long edge (the front's right, `.c3-edge-r`), painted in the peach:
 * a step deeper than the face's peach, as the bare edge is a step deeper than the paper (an edge in its own shade).
 */
const EDGE_PEACH = 'oklch(83.5% 0.088 52)';

/** Sand on screen (the viewer's toggle scales it); print never has it. */
const GRAIN = 0.18;

/**
 * The meeting, whenever a face comes into view: it starts this long after the
 * card appears (its arrival settles first) or after a turn passes edge-on,
 * and the gap closes in MEET_TIME (s).
 */
const ARRIVE_DELAY = 0.9;
const TURN_DELAY = 0.3;
const MEET_TIME = 2.6;
/**
 * Nor before the card's own type is in (a font swapping in mid-meeting would
 * jolt the text), waiting at most FONT_WAIT ms for it, and then not for SETTLE_DELAY s.
 */
const FONT_WAIT = 8000;
const SETTLE_DELAY = 0.3;
/**
 * The bare paper between the two outlines when a meeting starts (0.1 mm): the
 * own blob starts as far out along the line from the peach's centre as that
 * takes (measured for each person's shapes at that moment), and TRAVEL is
 * the fallback where it can't be measured.
 */
const GAP = 70;
const TRAVEL = 92;
/** The hold comes in over the meeting's second half, as the two touch. */
const HOLD_FROM = 0.5;

/** The slow tide in the neck (0.1 mm, period s): toward the peach and back. Still frames sit at its near end. */
const TIDE = 9;
const TIDE_PERIOD = 13;

/**
 * Holding the neck: the two blobs' own field on the line between the centres
 * never drops below NECK_HOLD (the outline is at 0.25; at 0.5 the waist is
 * a full, joined body, never a pinch). When it would, the own blob comes
 * toward the peach in steps of PULL_STEP, up to PULL_MAX, eased by PULL_EASE
 * a frame and never faster than PULL_RATE (0.15 mm a frame, at 30 fps).
 */
const NECK_HOLD = 0.5;
const PULL_STEP = 3;
const PULL_MAX = 70;
const PULL_EASE = 0.08;
const PULL_RATE = 1.5;
/** On screen the melt comes in over MELT_TIME (s) once they touch. */
const MELT_TIME = 1;

/**
 * The melt. A blob's own field reaches only about 2 mm past its outline, so
 * two shapes that merely overlap meet in a crease: a V or a near-square
 * corner each side of the waist. So once the two touch, each blob's own
 * shape is also blurred (a Gaussian of MELT_BLUR: about ½ on its outline,
 * 1 well inside, 0 a few mm out, as smooth as the blur), and MELT × the two
 * blurred shapes is added to the field. That product is only there where
 * both are near: it fills the corners each side of the waist with one
 * broad, round fillet and leaves the rest of either outline as it was. It
 * is faded out within 6 mm of the shared edge, so the peach's chord there
 * is the blob's own on both faces and the seam still matches.
 * It comes in with the neck: `melt` 0 → 1 as the field on the line between
 * the centres rises from the outline (they touch) to NECK_HOLD (on screen
 * no faster than MELT_TIME, so the waist softens over about a second).
 * MELT_CELL is the coarse grid the blur runs on (the product is smooth at
 * that scale, and read off it bilinearly).
 */
const MELT = 5;
const MELT_BLUR = 30;
const MELT_CELL = 8;

/**
 * The colour hand-over, along the line from the peach's centre to the own
 * blob's: the own ink's share rises as a logistic in the odds of the way
 * along, centred on the waist (where the two blobs' own fields are equal),
 * HANDOVER steep once melted: at the still frame that is 15 to 16 mm from
 * 5 % to 95 % (12 mm from 10 % to 90 %, 20 mm from 1 % to 99 %) of the 24
 * to 25 mm between the centres, so the colour runs well into both lobes. Before
 * they touch it is a step in the bare paper between them (each ink flat),
 * and it widens with the melt. STOPS stops, evenly spaced in the curve.
 */
const HANDOVER = 1.8;
const STOPS = 29;
/** Where the stops end, in the curve's own units (σ(4.6) = 99 %); the end stops are the pure inks. */
const HANDOVER_SPAN = 4.6;
/**
 * How the inks mix across it (see inkSet): lightness and chroma straight
 * across, the chroma eased to MID_CHROMA of that in the middle, the hue
 * turning the short way, through rose, HUE_LAG behind (the peach's warmth
 * holds a little longer, so the middle is a warm blush, never grey or cold).
 */
const MID_CHROMA = 0.85;
const HUE_LAG = 1.4;

/** Each face's own blob: where it rests once met, for the peach on that face's right or left. */
const OWN = {
  zh: { R: 96, seed: 5, tidePhase: 0, right: [290, 586], left: [250, 586] },
  en: { R: 92, seed: 9, tidePhase: 2, left: [248, 486], right: [292, 486] },
};

// ── the scene (pure: also what tools measure) ───────────────────────────

/** The wrapped peach at t, cut by this face's `edge` ('right' | 'left'). */
function wrapped(seed, t, edge) {
  return {
    x: edge === 'right' ? 540 : 0,
    y: 520,
    R: 185 * (1 + 0.035 * Math.sin((TAU * t) / 10)),
    seed,
    pace: 0.9,
  };
}

/** The unit vector from the peach's centre toward where a face's own blob rests. */
function outward(face, edge) {
  const [nx, ny] = OWN[face][edge];
  const dx = nx - (edge === 'right' ? 540 : 0);
  const dy = ny - 520;
  const L = Math.hypot(dx, dy);
  return [dx / L, dy / L];
}

/**
 * A face's own blob, `m` of the way through its meeting (0: `travel` further
 * out than its rest, a little smaller; 1: at rest), shifted `tide` toward the peach.
 */
function ownBlob(B, seed, face, edge, m, tide, travel = TRAVEL) {
  const o = OWN[face];
  const [nx, ny] = o[edge];
  const [ux, uy] = outward(face, edge);
  const k = B.smoothstep(m);
  const out = travel * (1 - k) - tide;
  return {
    x: nx + ux * out,
    y: ny + uy * out,
    R: o.R * B.lerp(0.9, 1, k),
    seed: seed + o.seed,
    pace: 1,
  };
}

/** A blob's own outline at t, as points [x0, y0, x1, y1, …] (every loop), traced on a `cell` grid. */
function outlinePoints(B, blob, t, cell = 5) {
  const g = B.makeGrid({ x: blob.x - 2 * blob.R, y: blob.y - 2 * blob.R, w: 4 * blob.R, h: 4 * blob.R }, cell);
  B.sampleField([blob], t, g);
  return B.traceContours(g).flat();
}

/**
 * How far out the own blob has to start for `gap` of bare paper between the
 * two outlines at t (the nearest points, wherever they are). Its shape at the
 * start doesn't change as it moves out, so its outline is traced once and slid.
 */
function travelFor(B, seed, face, edge, t, gap = GAP) {
  const W = wrapped(seed, t, edge);
  const O = ownBlob(B, seed, face, edge, 0, 0, 0);
  const a = outlinePoints(B, W, t);
  const b = outlinePoints(B, O, t);
  if (!a.length || !b.length) return TRAVEL;
  const [ux, uy] = outward(face, edge);
  const paper = (d) => {
    let min = Infinity;
    for (let j = 0; j < b.length; j += 2) {
      const bx = b[j] + ux * d;
      const by = b[j + 1] + uy * d;
      for (let i = 0; i < a.length; i += 2) {
        const dx = a[i] - bx;
        const dy = a[i + 1] - by;
        const q = dx * dx + dy * dy;
        if (q < min) min = q;
      }
    }
    return Math.sqrt(min);
  };
  let lo = 0;
  let hi = 300;
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2;
    if (paper(mid) < gap) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** `O` moved `d` toward `W`. */
function toward(O, W, d) {
  const dx = W.x - O.x;
  const dy = W.y - O.y;
  const L = Math.hypot(dx, dy) || 1;
  return { ...O, x: O.x + (dx / L) * d, y: O.y + (dy / L) * d };
}

/** The thinnest the field gets on the line between the two centres. */
function neckOf(B, W, O, t) {
  let min = Infinity;
  for (let i = 2; i <= 14; i++) {
    const s = i / 16;
    min = Math.min(min, B.fieldAt([W, O], t, W.x + (O.x - W.x) * s, W.y + (O.y - W.y) * s));
  }
  return min;
}

/** How far the own blob has to come toward the peach for the neck to hold. */
function needOf(B, W, O, t) {
  if (neckOf(B, W, O, t) >= NECK_HOLD) return 0;
  for (let d = PULL_STEP; d < PULL_MAX; d += PULL_STEP) {
    if (neckOf(B, W, toward(O, W, d), t) >= NECK_HOLD) return d;
  }
  return PULL_MAX;
}

/** How much of what the neck needs the hold gives, `m` of the way through the meeting. */
function holdOf(B, m) {
  return B.smoothstep((m - HOLD_FROM) / (1 - HOLD_FROM));
}

/** How far the melt has come for a neck this full: 0 until they touch, 1 once it is held. */
function meltOf(B, neck) {
  return B.smoothstep((neck - B.ISO) / (NECK_HOLD - B.ISO));
}

/**
 * One blob's shape on a coarse grid, blurred: its own field made a soft
 * mask (0 → 1 across its outline), then a separable Gaussian of MELT_BLUR.
 * Outside the grid counts as bare paper; the caller reads it only where the
 * whole kernel lies inside.
 */
function blurredShape(B, blob, t, box) {
  const gr = B.makeGrid(box, MELT_CELL);
  B.sampleField([blob], t, gr);
  const { v, nx, ny } = gr;
  for (let i = 0; i < v.length; i++) v[i] = B.smoothstep((v[i] - 0.15) / 0.2);
  const s = MELT_BLUR / MELT_CELL;
  const R = Math.ceil(3 * s);
  const ker = new Float32Array(2 * R + 1);
  let sum = 0;
  for (let k = -R; k <= R; k++) sum += ker[k + R] = Math.exp(-(k * k) / (2 * s * s));
  for (let k = 0; k < ker.length; k++) ker[k] /= sum;
  const tmp = new Float32Array(v.length);
  for (let j = 0; j < ny; j++) {
    const row = j * nx;
    for (let i = 0; i < nx; i++) {
      let acc = 0;
      for (let k = Math.max(-R, -i); k <= Math.min(R, nx - 1 - i); k++) acc += ker[k + R] * v[row + i + k];
      tmp[row + i] = acc;
    }
  }
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      let acc = 0;
      for (let k = Math.max(-R, -j); k <= Math.min(R, ny - 1 - j); k++) acc += ker[k + R] * tmp[(j + k) * nx + i];
      v[j * nx + i] = acc;
    }
  }
  return gr;
}

/** A coarse grid's value at (x, y), bilinear (0 off it). */
function readGrid(gr, x, y) {
  const fx = (x - gr.x0) / gr.cell;
  const fy = (y - gr.y0) / gr.cell;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  if (i < 0 || j < 0 || i >= gr.nx - 1 || j >= gr.ny - 1) return 0;
  const u = fx - i;
  const w = fy - j;
  const o = j * gr.nx + i;
  const v = gr.v;
  return (v[o] * (1 - u) + v[o + 1] * u) * (1 - w) + (v[o + gr.nx] * (1 - u) + v[o + gr.nx + 1] * u) * w;
}

/**
 * A frame's field on a grid: the two blobs' own (blobs.sampleField), plus
 * the melt round the own blob (the smaller: nowhere else are both near).
 * The grid's outer ring stays 0, so outlines close.
 */
function sampleFrame(B, fr, t, g) {
  B.sampleField(fr.list, t, g);
  const k = MELT * fr.melt;
  if (k <= 0) return;
  // Where the own blob's field reaches (a lobe's reaches √2 × its radius), then three blurs further:
  // the product is 0 beyond that; the shapes are read three blurs further again.
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const l of B.lobesAt(fr.O, t)) {
    const r = l.r * Math.SQRT2;
    x0 = Math.min(x0, l.x - r);
    x1 = Math.max(x1, l.x + r);
    y0 = Math.min(y0, l.y - r);
    y1 = Math.max(y1, l.y + r);
  }
  const m = 3 * MELT_BLUR;
  const read = { x: x0 - 2 * m, y: y0 - 2 * m, w: x1 - x0 + 4 * m, h: y1 - y0 + 4 * m };
  const a = blurredShape(B, fr.W, t, read);
  const b = blurredShape(B, fr.O, t, read);
  const { v, nx, ny, cell } = g;
  const i0 = Math.max(1, Math.ceil((x0 - m - g.x0) / cell));
  const i1 = Math.min(nx - 2, Math.floor((x1 + m - g.x0) / cell));
  const j0 = Math.max(1, Math.ceil((y0 - m - g.y0) / cell));
  const j1 = Math.min(ny - 2, Math.floor((y1 + m - g.y0) / cell));
  for (let j = j0; j <= j1; j++) {
    const y = g.y0 + j * cell;
    for (let i = i0; i <= i1; i++) {
      const x = g.x0 + i * cell;
      // Nothing within 2 mm of the shared edge (x = the peach's centre), all of it from 6 mm in.
      const edge = B.smoothstep((Math.abs(x - fr.W.x) - 20) / 40);
      if (edge <= 0) continue;
      const rb = readGrid(b, x, y);
      if (rb <= 1e-4) continue;
      v[j * nx + i] += k * edge * rb * readGrid(a, x, y);
    }
  }
}

/**
 * Where the inks hand over, as a share of the way from the peach's centre
 * to the own blob's: where each blob's own field is equal (while they are
 * apart, the middle of the bare paper between their fields).
 */
function waistOf(B, W, O, t) {
  const diff = (s) => {
    const x = W.x + (O.x - W.x) * s;
    const y = W.y + (O.y - W.y) * s;
    return B.fieldAt([W], t, x, y) - B.fieldAt([O], t, x, y);
  };
  /** The last s from the peach's side where `holds` is still true. */
  const last = (holds) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (holds(diff(mid))) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  return (last((d) => d > 0) + last((d) => d >= 0)) / 2;
}

/**
 * The paint: a linear gradient along the line between the two centres,
 * as stops [s, v] (v = the own ink's share, 0 peach … 1 the partner),
 * centred on the waist and as wide as the melt has come (see HANDOVER).
 */
function paintOf(B, W, O, t, melt) {
  const sw = Math.min(0.999, Math.max(0.001, waistOf(B, W, O, t)));
  const centre = Math.log(sw / (1 - sw));
  const width = Math.max(0.02, melt) / HANDOVER;
  const sig = (u) => 1 / (1 + Math.exp(-u));
  const lo = sig(-HANDOVER_SPAN);
  const hi = sig(HANDOVER_SPAN);
  const stops = [];
  for (let k = 0; k < STOPS; k++) {
    const u = -HANDOVER_SPAN + (2 * HANDOVER_SPAN * k) / (STOPS - 1);
    stops.push([sig(centre + u * width), (sig(u) - lo) / (hi - lo)]);
  }
  return { x1: W.x, y1: W.y, x2: O.x, y2: O.y, cx: W.x + (O.x - W.x) * sw, cy: W.y + (O.y - W.y) * sw, stops };
}

/** The hold, one frame on: eased toward what the neck needs, at a calm rate. */
function easePull(pull, target) {
  const d = (target - pull) * PULL_EASE;
  return pull + Math.max(-PULL_RATE, Math.min(PULL_RATE, d));
}

/** The melt, `dt` seconds on: it follows the neck down at once, and up no faster than all of it in MELT_TIME. */
function easeMelt(melt, target, dt) {
  return Math.min(target, melt + dt / MELT_TIME);
}

/**
 * One face's frame. `pull` is how far the own blob has come toward the
 * peach to hold the neck, and `melt` how far the melt has come (live: both
 * eased by the caller; otherwise all of each). `meltTo` is what the neck
 * allows the melt now.
 */
function frameOf(B, { seed, face, edge, t, m, tide, pull, melt, travel }) {
  const W = wrapped(seed, t, edge);
  const base = ownBlob(B, seed, face, edge, m, tide, travel);
  const need = needOf(B, W, base, t);
  const p = pull ?? need;
  const O = p > 0 ? toward(base, W, p) : base;
  const neck = neckOf(B, W, O, t);
  const meltTo = meltOf(B, neck);
  const k = Math.min(meltTo, melt ?? meltTo);
  return { W, O, need, neck, meltTo, melt: k, list: [W, O], paint: paintOf(B, W, O, t, k) };
}

/** What tools (and nothing else) read: the same functions the card draws with. */
export const geometry = {
  OWN, GAP, TRAVEL, MEET_TIME, NECK_HOLD, PULL_MAX, MELT, MELT_BLUR, MELT_TIME, HANDOVER, HOLD_FROM, TIDE,
  easePull, easeMelt, wrapped, ownBlob, outward, outlinePoints, travelFor, toward, neckOf, needOf, holdOf,
  meltOf, blurredShape, readGrid, sampleFrame, waistOf, paintOf, frameOf, inkSet, outlineOf,
};

// ── the direction ───────────────────────────────────────────────────────

export default {
  id: 'facets',
  letter: 'B',
  name: '兩面',
  enName: 'Two Sides',
  orientation: 'portrait',
  radiusMm: 0,
  thicknessMm: 0.8,
  // The whole shared long edge is painted; a plain turn brings that edge toward the viewer.
  edgePaint: { r: EDGE_PEACH },
  turnDir: -1,
  proofSpread: true,
  pitch: '人，生而立體：同一個人，一面直排中文、一面英文；一團桃色穿過名片刷了色的長邊，翻過來接到另一面，再和那一面的薰衣草融成一團',
  notes: [
    {
      k: '概念',
      v: '桃色從正面的右緣穿出、接到背面的左緣：名片翻過來，這兩條是同一條邊、同一個高度，所以是同一個形狀穿過紙的厚度。那條長邊整條刷成桃色，翻面時它朝你轉過來；攤開時正背並排，兩半在中縫拼回一整團。每面另有一團薰衣草，每次翻到一面，它都先隔著 7 mm 的白紙，再靠過來和桃色融成一個形狀：腰身兩側是圓潤的弧，沒有折角，顏色經過暖玫瑰色，在約 15 mm 間慢慢轉成薰衣草。',
    },
    {
      k: '語言',
      v: '中文面只有中文、英文面只有英文；email 兩面都有，網址與 QR 碼在英文面。換成「英文面在前」時兩面左右鏡像，桃色仍從正面右緣繞到背面左緣。數位名片頁依訪客的語言決定先看到哪一面。',
    },
    {
      k: '字級',
      v: '中文名 Noto Serif TC 13.5 pt、字重 500、直排字距 0.72 em：中文字塞滿字身，13.5 pt 看起來和英文面 15 pt 的 Playfair Display 名字一樣大，放寬的字距讓直行幾乎維持原來的長度（約 21 mm），下接 5.6 mm 赤陶落款印。英文名 Playfair Display 15 pt（名斜體 400、姓 600）。共振小隊 Noto Serif TC 7.5 pt、400；email、網址與 The Resonance Crew 是 DM Sans 7 pt、400。量過的距離：直排名字的字框離左裁切線 6.1 mm，所有墨色（字、落款印、波紋、QR 碼）離裁切線至少 5.5 mm。',
    },
    {
      k: '印刷',
      v: '印刷檔只有油墨，紙色不印：QR 碼後面沒有紙色底，落款印裡的邊線與波紋是鏤空。四個顏色：桃、薰衣草、赤陶（落款印與波紋）、暖黑（字與 QR 碼）；印刷檔裡的小字一律實色暖黑，不用灰網。基本報價走數位 CMYK：兩張 300 gsm 棉紙印好對裱成約 0.8 mm，整疊夾齊後只刷共用的那條長邊，用調成桃色的色漆，每個名字同一道工序，不用遮罩。融色是一條 29 階的向量漸層，中段是暖玫瑰色（約 oklch 86% 0.055 8.5°）；粉彩轉 CMYK 會略灰，薰衣草最明顯，要先打樣。進階選項是專色或 Riso：桃色與薰衣草各一版（各出一張灰階分色稿），腰身約 15 mm 的漸層由兩色疊印，中段會比螢幕上的玫瑰色灰一些；Riso 套印約有 0.5 到 1 mm 的偏移，交接帶手工感；落款印改赤陶專色或凹印。QR 碼 14 mm。',
    },
    {
      k: '動態',
      v: '每次一面轉到眼前（包括名片剛出現、字型載入之後），那一面的薰衣草都先隔著 7 mm 的白紙，2.6 秒內靠過來：約 1.2 到 1.9 秒碰到桃色、長出頸部，再用約 1 秒融開，腰身長出圓弧，顏色從交界向兩邊暈開；碰到之前兩色都是平塗。之後頸部一直相連。桃色以 10 秒的週期呼吸，兩面共用一個時鐘；薰衣草隨 13 秒的潮汐微微進退，腰身時寬時窄但不會斷。靜態與印刷固定在融開之後的那一刻。',
    },
  ],
  langs: [
    { id: 'zh-first', label: '中文面在前' },
    { id: 'en-first', label: '英文面在前' },
  ],
  stillTime: STILL_TIME,

  mount(faces, ctx) {
    const B = ctx.blobs;
    const { box, ink, person } = ctx;
    const zhFirst = ctx.lang !== 'en-first';
    const zh = zhFirst ? faces.front : faces.back;
    const en = zhFirst ? faces.back : faces.front;
    const zhSide = zhFirst ? 'front' : 'back';
    /** The side of each face the peach crosses: the front's right edge is the back's left. */
    const edge = { zh: zhFirst ? 'right' : 'left', en: zhFirst ? 'left' : 'right' };
    const face = { zh, en };

    // A separation for the press: ?plate=peach | lavender | terracotta | text (print only).
    const plate = ctx.mode === 'print' ? plateParam() : null;

    for (const k of ['zh', 'en']) {
      face[k].root.classList.add('fct', `fct--${k}`, `fct--edge-${edge[k] === 'right' ? 'r' : 'l'}`);
      if (ctx.mode === 'print') face[k].root.classList.add('fct--print');
      if (plate) face[k].root.classList.add('fct--plate', `fct--plate-${plate}`);
    }
    zh.content.innerHTML = zhFace(ctx);
    en.content.innerHTML = enFace(ctx);
    // Ask for the faces' own type now, so the page's fonts.ready (what the shots and the print files
    // wait for) waits for it too, instead of resolving before layout has asked for any font.
    const typeLoaded = typeIn(ctx);

    const inks = inkSet(B, B.parseOklch(ink.paper), ink[PARTNER]);

    const animated = ctx.live;
    const seed = person.seed;
    const tideOf = (k, t) => (animated ? TIDE * Math.sin((TAU * t) / TIDE_PERIOD + OWN[k].tidePhase) : TIDE);

    // ── print: vector, two inks (or one plate), met ──
    if (ctx.mode === 'print') {
      const t = STILL_TIME;
      for (const k of ['zh', 'en']) {
        const fr = frameOf(B, { seed, face: k, edge: edge[k], t, m: 1, tide: tideOf(k, t) });
        face[k].art.innerHTML = svgArt(B, fr, t, { box, inks, plate, id: uid() });
      }
      return { destroy: () => clear(face) };
    }

    // ── screen: one canvas per face, the same renderer moving or still ──
    const canvases = {
      zh: canvasArt(B, zh.art, box, { grain: GRAIN * ctx.grain, cell: animated ? 5 : 3 }),
      en: canvasArt(B, en.art, box, { grain: GRAIN * ctx.grain, cell: animated ? 5 : 3 }),
    };

    // The tide comes in with the meeting, so a face always turns in with its blob well short of the peach.
    const travel = { zh: TRAVEL, en: TRAVEL };
    const draw = (k, t, m, pull, melt) => {
      const fr = frameOf(B, { seed, face: k, edge: edge[k], t, m, tide: tideOf(k, t) * B.smoothstep(m), pull, melt, travel: travel[k] });
      canvases[k].draw(fr, t, inks);
      return fr;
    };

    if (!animated) {
      // Still (or reduced motion): both faces met.
      ctx.loop((t) => {
        for (const k of ['zh', 'en']) draw(k, t, 1);
      });
      return { destroy: () => destroyAll(canvases, face) };
    }

    // Which face shows, when its meeting starts (on the loop's clock, which only runs on screen),
    // and how far its own blob has come toward the peach to hold the neck. No meeting starts
    // before the card's type has loaded (`settled`): the moment is played once the card is whole.
    let showing = ctx.side === zhSide ? 'zh' : 'en';
    const start = { zh: Infinity, en: Infinity };
    const pull = { zh: 0, en: 0 };
    const melt = { zh: 0, en: 0 };
    let clock = null;
    let settled = Infinity;
    let gone = false;
    const meetOf = (k, t) => Math.max(0, Math.min(1, (t - Math.max(start[k], settled + SETTLE_DELAY)) / MEET_TIME));
    Promise.race([typeLoaded, new Promise((r) => setTimeout(r, FONT_WAIT))]).then(() => {
      if (!gone) settled = clock ?? 0;
    });

    const stop = ctx.loop((t) => {
      if (clock === null) {
        // The card arrives apart on the face it shows; the other is drawn apart too, for its first turn.
        start[showing] = t + ARRIVE_DELAY;
        for (const k of ['zh', 'en']) {
          travel[k] = travelFor(B, seed, k, edge[k], t);
          draw(k, t, 0, 0, 0);
        }
      } else {
        const k = showing;
        const m = meetOf(k, t);
        const fr = draw(k, t, m, pull[k], melt[k]);
        pull[k] = easePull(pull[k], fr.need * holdOf(B, m));
        melt[k] = easeMelt(fr.melt, fr.meltTo, t - clock);
      }
      clock = t;
    });

    // A face turning into view (edge-on, so it isn't seen yet) starts apart, and meets again.
    const offSide = ctx.onSide((side) => {
      const k = side === zhSide ? 'zh' : 'en';
      if (k === showing || clock === null) return;
      showing = k;
      start[k] = clock + TURN_DELAY;
      travel[k] = travelFor(B, seed, k, edge[k], clock);
      pull[k] = 0;
      melt[k] = 0;
      draw(k, clock, 0, 0, 0);
    });

    return {
      destroy() {
        gone = true;
        stop();
        offSide();
        destroyAll(canvases, face);
      },
    };
  },
};

/**
 * Starts loading the faces' own type and resolves once it has loaded (or
 * failed to): each family and weight the card sets, for its own text only
 * (the Chinese fonts come in slices by unicode range).
 */
function typeIn(ctx) {
  const fonts = document.fonts;
  if (!fonts?.load) return Promise.resolve();
  const { person, brand } = ctx;
  const latin = person.email + person.en + brand.team.en + brand.site;
  return Promise.all(
    [
      ['500 12px "Noto Serif TC"', person.zh],
      ['400 12px "Noto Serif TC"', brand.team.zh],
      ['400 12px "DM Sans"', latin],
      ['italic 400 12px "Playfair Display"', person.given],
      ['600 12px "Playfair Display"', person.family],
    ].map(([font, text]) => fonts.load(font, text).catch(() => null)),
  );
}

function destroyAll(canvases, face) {
  canvases.zh.destroy();
  canvases.en.destroy();
  clear(face);
}

function clear(face) {
  for (const f of [face.zh, face.en]) {
    f.root.classList.remove(...[...f.root.classList].filter((c) => c === 'fct' || c.startsWith('fct--')));
    f.content.textContent = '';
    f.art.textContent = '';
  }
}

function plateParam() {
  try {
    const p = new URLSearchParams(location.search).get('plate');
    return ['peach', PARTNER, 'terracotta', 'text'].includes(p) ? p : null;
  } catch {
    return null;
  }
}

function uid() {
  return 'fct' + Math.random().toString(36).slice(2, 8);
}

// ── colour ──────────────────────────────────────────────────────────────

/** An ink as laid on this paper at full density: its colour mixed toward the paper by (1 − alpha), in Oklab. */
function inkOf(B, paperLab, colour, alpha) {
  const c = B.parseOklch(colour);
  return { lab: [0, 1, 2].map((i) => paperLab[i] + (c[i] - paperLab[i]) * alpha), density: alpha };
}

const grey = (v) => {
  const n = Math.round(255 * Math.min(1, Math.max(0, v)));
  return [n, n, n];
};

/**
 * The colour at each share `v` of the hand-over (0 peach … 1 the partner),
 * and each ink's plate. Lightness and chroma run straight across, the
 * chroma eased to MID_CHROMA in the middle; the hue turns the short way
 * round (peach 55° → lavender 291°, through rose), HUE_LAG behind, so the
 * middle is a warm blush (about oklch 86 % 0.055 8.5°): overprinting the two
 * would pass through grey (their hues are 124° apart), the seam a melt
 * can't have. Digital CMYK prints this gradient as it is. A plate is one
 * ink's density at the same share, as grey on white, for the spot / riso
 * route, where the middle prints a little dustier than this.
 */
function inkSet(B, paperLab, partnerCss) {
  const peach = inkOf(B, paperLab, PEACH, PEACH_ALPHA);
  const partner = inkOf(B, paperLab, partnerCss, PARTNER_ALPHA);
  const lch = ([L, a, b]) => [L, Math.hypot(a, b), Math.atan2(b, a)];
  const [L1, C1, h1] = lch(peach.lab);
  const [L2, C2, h2] = lch(partner.lab);
  const dh = ((((h2 - h1 + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  return {
    colour(v) {
      const L = L1 + (L2 - L1) * v;
      const C = (C1 + (C2 - C1) * v) * (1 - (1 - MID_CHROMA) * 4 * v * (1 - v));
      const h = h1 + dh * v ** HUE_LAG;
      return B.rgbHex(B.oklabToRgb([L, C * Math.cos(h), C * Math.sin(h)]));
    },
    plates: {
      peach: (v) => B.rgbHex(grey(1 - peach.density * (1 - v))),
      [PARTNER]: (v) => B.rgbHex(grey(1 - partner.density * v)),
    },
  };
}

// ── screen: a canvas per face ───────────────────────────────────────────

/**
 * Draws a frame's two blobs over `box` and fills its host: one outline
 * (with the melt), peach into lavender across the waist (see paintOf and
 * inkSet), then a little sand.
 * Sized from the host's layout box, so the card's turn and lean never resize it.
 */
function canvasArt(B, host, box, { grain, cell }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'fct-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const g = canvas.getContext('2d');
  const grid = B.makeGrid(box, cell);
  let w = 0;
  let h = 0;
  let dpr = 1;
  let pattern = null;
  let last = null;

  const fit = () => {
    const cw = host.offsetWidth;
    const ch = host.offsetHeight;
    if (!cw || !ch) return false;
    const d = Math.min(2.5, window.devicePixelRatio || 1);
    if (cw === w && ch === h && d === dpr) return true;
    w = cw;
    h = ch;
    dpr = d;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    return true;
  };

  const paint = () => {
    if (!last || !fit()) return;
    const [fr, t, inks] = last;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.clearRect(0, 0, canvas.width, canvas.height);
    sampleFrame(B, fr, t, grid);
    const loops = B.traceContours(grid);
    if (!loops.length) return;
    const sx = canvas.width / box.w;
    const sy = canvas.height / box.h;
    g.setTransform(sx, 0, 0, sy, -box.x * sx, -box.y * sy);
    const outline = new Path2D();
    smoothLoops(
      loops,
      (x, y) => outline.moveTo(x, y),
      (cx, cy, x, y) => outline.quadraticCurveTo(cx, cy, x, y),
      () => outline.closePath(),
    );
    g.save();
    g.clip(outline, 'evenodd');
    const { x1, y1, x2, y2, stops } = fr.paint;
    const grad = g.createLinearGradient(x1, y1, x2, y2);
    for (const [s, v] of stops) grad.addColorStop(s, inks.colour(v));
    g.fillStyle = grad;
    g.fillRect(box.x, box.y, box.w, box.h);
    if (grain > 0) {
      // One grain per CSS pixel, unsmoothed: sharp specks, not blotches (the hero's recipe).
      pattern = pattern || g.createPattern(grainTile(B), 'repeat');
      const px = Math.max(1, Math.round(dpr));
      g.setTransform(px, 0, 0, px, 0, 0);
      g.imageSmoothingEnabled = false;
      g.globalAlpha = grain;
      g.fillStyle = pattern;
      g.fillRect(0, 0, canvas.width / px, canvas.height / px);
      g.globalAlpha = 1;
    }
    g.restore();
  };

  // A still frame is drawn once: draw it again if the card changes size (or had none yet).
  const ro = new ResizeObserver(() => paint());
  ro.observe(host);

  return {
    draw(fr, t, inks) {
      last = [fr, t, inks];
      paint();
    },
    destroy() {
      ro.disconnect();
      canvas.remove();
    },
  };
}

/** Sand: crisp grains, half lighter and half darker than what they sit on, mostly faint (the hero's recipe). */
function grainTile(B) {
  const size = 160;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const d = img.data;
  const rand = B.makePrng(4242);
  for (let i = 0; i < d.length; i += 4) {
    const light = rand() < 0.5;
    d[i] = light ? 255 : 84;
    d[i + 1] = light ? 252 : 58;
    d[i + 2] = light ? 244 : 38;
    d[i + 3] = 255 * rand() ** 3 * (light ? 1 : 0.3);
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Quadratic curves through the midpoints of each traced polygon (the hero's smoothing). */
function smoothLoops(loops, moveTo, quadTo, close) {
  for (const l of loops) {
    const n = l.length / 2;
    const mx = (i) => (l[2 * i] + l[2 * ((i + 1) % n)]) / 2;
    const my = (i) => (l[2 * i + 1] + l[2 * ((i + 1) % n) + 1]) / 2;
    moveTo(mx(n - 1), my(n - 1));
    for (let i = 0; i < n; i++) quadTo(l[2 * i], l[2 * i + 1], mx(i), my(i));
    close();
  }
}

// ── print: vector ───────────────────────────────────────────────────────

/** A frame's outline (with the melt) as SVG path data, traced on a `cell` grid over `box`. */
function outlineOf(B, fr, t, box, cell = 3) {
  const g = B.makeGrid(box, cell);
  sampleFrame(B, fr, t, g);
  const f = (n) => Math.round(n * 10) / 10;
  let d = '';
  smoothLoops(
    B.traceContours(g),
    (x, y) => (d += `M${f(x)} ${f(y)}`),
    (cx, cy, x, y) => (d += `Q${f(cx)} ${f(cy)} ${f(x)} ${f(y)}`),
    () => (d += 'Z'),
  );
  return d;
}

/**
 * The frame as SVG: one vector outline filled with the hand-over (an opaque
 * gradient, so the PDF keeps it vector; nothing else, the paper is the
 * stock). With `plate`, that ink's density as grey on white instead: the
 * separation a spot plate (or a riso master) is made from.
 */
function svgArt(B, fr, t, { box, inks, plate, id }) {
  const d = outlineOf(B, fr, t, box, 3);
  const vb = `${box.x} ${box.y} ${box.w} ${box.h}`;
  const open = `<svg class="fct-svg" viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">`;
  const { x1, y1, x2, y2, stops } = fr.paint;
  const f = (n) => n.toFixed(1);
  const grad = (colour) =>
    `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">` +
    stops.map(([s, v]) => `<stop offset="${s.toFixed(4)}" stop-color="${colour(v)}"/>`).join('') +
    `</linearGradient></defs>`;
  if (plate) {
    const white = `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="#fff"/>`;
    const density = inks.plates[plate];
    if (!density) return open + white + '</svg>';
    return open + grad(density) + white + `<path data-ink="spot-${plate}" d="${d}" fill="url(#${id})" fill-rule="evenodd"/></svg>`;
  }
  return open + grad(inks.colour) + `<path data-ink="peach-lavender" d="${d}" fill="url(#${id})" fill-rule="evenodd"/></svg>`;
}

// ── the faces ───────────────────────────────────────────────────────────

/** The Chinese face: the name down a column, the team beside it (read first), the seal under it; the e-mail at the foot. */
function zhFace(ctx) {
  const { person, brand } = ctx;
  return `
    <div class="fct-zh" lang="zh-Hant">
      <p class="fct-zh-team">${brand.team.zh}</p>
      <h3 class="fct-zh-name">${person.zh}</h3>
      <span class="fct-seal" aria-hidden="true">${seal(ctx)}</span>
      <p class="fct-foot" lang="en">${person.email}</p>
    </div>`;
}

/**
 * The seal under the name (落款印): a small hand-cut square of terracotta
 * with the wave mark knocked out of it and a fine border cut just inside
 * its rim, the outline wobbling a little, per person, set down a couple of
 * degrees off square as a hand would stamp it.
 */
function seal(ctx) {
  const rnd = ctx.blobs.makePrng(ctx.person.seed * 7 + 3);
  const j = (a) => (rnd() - 0.5) * 2 * a;
  const f = (n) => n.toFixed(2);
  // A 24-unit box like the mark's (one unit ≈ 0.23 mm at 5.6 mm).
  const corners = [
    [0.5 + j(0.6), 0.5 + j(0.6)],
    [23.5 + j(0.6), 0.5 + j(0.6)],
    [23.5 + j(0.6), 23.5 + j(0.6)],
    [0.5 + j(0.6), 23.5 + j(0.6)],
  ];
  const bows = [j(1.2), j(1.2), j(1.2), j(1.2)];
  const turn = -2 + j(0.8);
  /** The outline, `inset` units inside the cut edge. */
  const outline = (inset, r) => {
    const [a, b, d, e] = [
      [corners[0][0] + inset, corners[0][1] + inset],
      [corners[1][0] - inset, corners[1][1] + inset],
      [corners[2][0] - inset, corners[2][1] - inset],
      [corners[3][0] + inset, corners[3][1] - inset],
    ];
    const k = 1 - inset / 12;
    return (
      `M${f(a[0] + r)} ${f(a[1])}` +
      `Q12 ${f(a[1] + bows[0] * k)} ${f(b[0] - r)} ${f(b[1])}` +
      `Q${f(b[0])} ${f(b[1])} ${f(b[0])} ${f(b[1] + r)}` +
      `Q${f(b[0] + bows[1] * k)} 12 ${f(d[0])} ${f(d[1] - r)}` +
      `Q${f(d[0])} ${f(d[1])} ${f(d[0] - r)} ${f(d[1])}` +
      `Q12 ${f(d[1] + bows[2] * k)} ${f(e[0] + r)} ${f(e[1])}` +
      `Q${f(e[0])} ${f(e[1])} ${f(e[0])} ${f(e[1] - r)}` +
      `Q${f(e[0] + bows[3] * k)} 12 ${f(a[0])} ${f(a[1] + r)}` +
      `Q${f(a[0])} ${f(a[1])} ${f(a[0] + r)} ${f(a[1])}Z`
    );
  };
  // The cuts are holes in the ink, not paper-coloured paint (the paper is the stock): one even-odd path of
  // the seal's rim, the border's two edges (0.15 mm wide, its centre 0.37 mm inside the rim) and the
  // waves' outlines (the mark's strokes, 2 units wide, set at 0.7 in the middle).
  const waves = [...ctx.waveMark('#000', 2).matchAll(/ d="([^"]+)"/g)]
    .map(([, d]) => strokeOutline(d, 1, (x, y) => [(x - 12) * 0.7 + 12, (y - 12) * 0.7 + 12.3]))
    .join('');
  const ink = outline(0, 1.2) + outline(1.6 - 0.32, 0.6 + 0.32) + outline(1.6 + 0.32, 0.6 - 0.32) + waves;
  return (
    `<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(${f(turn)} 12 12)">` +
    `<path class="fct-seal-ink" d="${ink}" fill="${ctx.ink.terracotta}" fill-rule="evenodd"/>` +
    `</g></svg>`
  );
}

/**
 * A stroked path's outline as a closed polygon (path data): the curve
 * `d` (one M, then cubic C segments, as the mark's waves are) offset
 * `half` either side, with round caps, each point passed through `map`.
 */
function strokeOutline(d, half, map) {
  const n = d.match(/-?\d*\.?\d+/g).map(Number);
  /** Samples along the curve: [x, y, tx, ty] (point and tangent). */
  const at = [];
  let x0 = n[0];
  let y0 = n[1];
  const STEPS = 24;
  for (let i = 2; i + 5 < n.length; i += 6) {
    const [ax, ay, bx, by, ex, ey] = n.slice(i, i + 6);
    for (let k = i === 2 ? 0 : 1; k <= STEPS; k++) {
      const u = k / STEPS;
      const v = 1 - u;
      const x = v * v * v * x0 + 3 * v * v * u * ax + 3 * v * u * u * bx + u * u * u * ex;
      const y = v * v * v * y0 + 3 * v * v * u * ay + 3 * v * u * u * by + u * u * u * ey;
      const tx = 3 * v * v * (ax - x0) + 6 * v * u * (bx - ax) + 3 * u * u * (ex - bx);
      const ty = 3 * v * v * (ay - y0) + 6 * v * u * (by - ay) + 3 * u * u * (ey - by);
      const L = Math.hypot(tx, ty) || 1;
      at.push([x, y, tx / L, ty / L]);
    }
    x0 = ex;
    y0 = ey;
  }
  const pts = [];
  // One side forward, the round cap at the end, the other side back, the round cap at the start.
  for (const [x, y, tx, ty] of at) pts.push([x - ty * half, y + tx * half]);
  const cap = ([x, y, tx, ty], dir) => {
    for (let k = 1; k < 8; k++) {
      const a = (Math.PI * k) / 8;
      const c = Math.cos(a) * dir;
      const s = Math.sin(a) * dir;
      pts.push([x + half * (-ty * c + tx * s), y + half * (tx * c + ty * s)]);
    }
  };
  cap(at[at.length - 1], 1);
  for (let i = at.length - 1; i >= 0; i--) {
    const [x, y, tx, ty] = at[i];
    pts.push([x + ty * half, y - tx * half]);
  }
  cap(at[0], -1);
  const f = (v) => v.toFixed(3);
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(map(x, y)[0])} ${f(map(x, y)[1])}`).join('') + 'Z';
}

/** The English face: the given name in italic over the family name, the mark level with it, the e-mail; the QR and the colophon at the foot. */
function enFace(ctx) {
  const { person, brand, ink } = ctx;
  return `
    <div class="fct-en" lang="en">
      <h3 class="fct-en-name"><span class="fct-given">${person.given}</span><span class="fct-family">${person.family}</span></h3>
      <p class="fct-en-mail">${person.email}</p>
      <span class="fct-mark" aria-hidden="true">${ctx.waveMark(ink.terracotta, 2)}</span>
      <div class="fct-qr">${ctx.qrSvg(ctx.url, { color: ink.text })}</div>
      <p class="fct-colophon"><span>${brand.team.en}</span><span class="fct-site">${brand.site}</span></p>
    </div>`;
}
