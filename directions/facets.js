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
 * both faces). Whenever a face comes into view (the card arriving once its
 * type is in, or a turn) that blob starts GAP (7 mm) of bare paper away from
 * the peach, measured for each person's shapes at that moment, and closes
 * the gap in MEET_TIME: the two touch, the neck grows and melts (see MELT),
 * and the lavender sinks into the peach and grows (see FUSE_IN, FUSE_GROW)
 * and the form fills out to its soft hull (see FILL_SOFT): ONE rounded,
 * convex form, the lavender at its narrower end, with no dent anywhere, so
 * nothing is left of a waist (a pinched join read as a duck, a bird's head
 * or a pacifier). Every frame the field along the line between the two
 * centres is kept above NECK_HOLD by easing the blob toward the peach just
 * as far as it needs, so the two never part while the lobes turn.
 *
 * Colour is two inks. While they are apart, the sides that face each other
 * already glow with the other ink (see GLOW: the peach blushes toward
 * lavender, the lavender warms toward peach, strongest at the nearest edges,
 * the far sides pure), more as the gap closes. Once they have melted the
 * lavender is a rounded cap melting back into the peach through a warm
 * blush (never the grey their overprint would make), about 15 mm wide along
 * the form, its shades curving round the lavender's end (see
 * HANDOVER_NEAR). Screen and print use the same paint (one two-circle radial
 * gradient); print stays vector, and `?plate=` renders one ink's
 * separation for the spot / riso route.
 *
 * The still card and the print file show one of two poses (`poses`):
 * 'met' (已融合, the default: the rounded form the meeting rests in) or
 * 'apart' (將相遇: the arrival's first frame, the glow across the gap).
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
 * The colour hand-over: a melt, not a band. Each shade lies on a circle
 * round the lavender's end (a two-circle radial gradient, see paintOf), so
 * the lavender is a rounded cap melting back into the peach, its shades
 * bowing toward the peach the way the form's narrow end does, instead of a
 * stripe straight across it. Along the line from the peach's centre to the
 * own blob's the circles cross from HANDOVER_NEAR[0] (on the peach's
 * centre, so the shared edge is pure peach) to HANDOVER_NEAR[1] past the
 * own blob's centre, and on the far side HANDOVER_FAR beyond it (0.1 mm);
 * the own ink's share eases in across them as a smoothstep, flat at both
 * ends (no ring where a pure ink begins), its middle on the waist (where the
 * two blobs' own fields are equal): in the met pose about 15 mm from 5 % to
 * 95 % along the line, so it runs from the peach's middle well into the
 * lavender. It narrows toward a step at the waist while the melt comes in;
 * until the melt is whole the glow (see GLOW) is handed over to it. STOPS
 * stops, evenly spaced.
 */
const HANDOVER_NEAR = [20, 55];
const HANDOVER_FAR = [300, 800];
const STOPS = 33;
/**
 * How the inks mix across it (see inkSet): lightness and chroma straight
 * across, the chroma eased to MID_CHROMA of that in the middle, the hue
 * turning the short way, through rose, HUE_LAG behind (the peach's warmth
 * holds a little longer, so the middle is a warm blush, never grey or cold).
 */
const MID_CHROMA = 0.85;
const HUE_LAG = 1.4;

/**
 * The fusion. Once met, the own blob rests FUSE_IN of the way from its spot
 * in OWN toward the peach's centre and FUSE_GROW times its size (it starts
 * the meeting at 0.9), growing from GROW_FROM of the way through the meeting
 * on: it sinks in as it grows, so the one form keeps both areas (about 1.1 ×
 * the two apart) and its outline stays clear of the shared edge.
 */
const FUSE_IN = 0.25;
const FUSE_GROW = 1.2;
const GROW_FROM = 0.45;

/**
 * The fill. Even melted, the outline still dips in each side of the waist,
 * and a big round shape on a small one with a dip between reads as a head
 * on a neck (a duck, a bird's head, a pacifier). So once they have melted
 * the form becomes its own soft hull: one rounded form, the lavender at its
 * narrower end, with no hollow anywhere. The soft hull is the convex hull
 * made round: in every direction it reaches as far as the outline does,
 * softened over FILL_SOFT (a log-sum of the outline's reach, by length), so
 * where the hull would run straight across a dip, or from one blob to the
 * other, it bows gently outward instead, and where a single lobe stands out
 * it is a little rounder than the lobe. It is convex and smooth everywhere,
 * and it moves smoothly with the shapes (nothing in it is picked from one
 * frame to the next), so the tide never makes it twitch. The field is
 * replaced by the form's own, the outline's level on its edge rising
 * FILL_SLOPE per 0.1 mm in from it (about the blobs' own slope at their
 * outline). The peach is taken in whole (both halves, as it runs round the
 * shared edge), and in the still and print poses the other face's lavender
 * too, carried across that edge as the spread lays it (see hullsOf): the
 * two faces are then halves of one form, which meets itself on the edge
 * exactly and stays convex across it. It comes in with the melt (on screen
 * over the melt's second).
 * FILL_ROUND is how round a stretch of outline is that keeps its place
 * (rounder grows a little, tighter shrinks a little); FILL_DIRS how many
 * directions the outline is found in.
 */
const FILL_SOFT = 30;
const FILL_ROUND = 120;
const FILL_DIRS = 240;
const FILL_SLOPE = 0.012;
/** How far past the peach's own outline the face's takes over from it, in field (see hullsOf). */
const FILL_MARGIN = 0.05;

/**
 * The glow across the gap, while the two are apart: each blob's side toward
 * the other takes the other's ink, GLOW_PEAK of the hand-over (½ = halfway)
 * at the middle of the gap, falling off as (1 − (d / GLOW_REACH)²)² with the
 * distance d from there, GLOW_WIDE times as far across the gap as along it
 * (so it covers the side that faces, not a spot): with the 7 mm gap about
 * 42 % at the nearest edges, 13 % 5 mm in, nothing 8 mm in, and halfway as
 * they touch, where the melt's own hand-over takes over (over MELT_TIME).
 */
const GLOW_PEAK = 0.5;
const GLOW_REACH = 120;
const GLOW_WIDE = 1.4;
const GLOW_STOPS = 13;

/** Each face's own blob: where it would rest before it sinks in, for the peach on that face's right or left. */
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
 * out than its spot in OWN, at 0.9 of its size; 1: at rest, sunk FUSE_IN of
 * the way toward the peach's centre and FUSE_GROW its size), shifted `tide`
 * toward the peach.
 */
function ownBlob(B, seed, face, edge, m, tide, travel = TRAVEL) {
  const o = OWN[face];
  const [nx, ny] = o[edge];
  const [ux, uy] = outward(face, edge);
  const k = B.smoothstep(m);
  const sink = Math.hypot(nx - (edge === 'right' ? 540 : 0), ny - 520) * FUSE_IN;
  const out = B.lerp(travel, -sink, k) - tide;
  return {
    x: nx + ux * out,
    y: ny + uy * out,
    R: o.R * B.lerp(0.9, FUSE_GROW, B.smoothstep((m - GROW_FROM) / (1 - GROW_FROM))),
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
 * the melt round the own blob (the smaller: nowhere else are both near),
 * then the fill over the join (see FILL_SLOPE). The grid's outer ring
 * stays 0, so outlines close.
 */
function sampleFrame(B, fr, t, g) {
  B.sampleField(fr.list, t, g);
  sampleMelt(B, fr, t, g);
  fillWaist(B, fr, t, g, fr.fill);
}

/** The melt (see MELT), added to the field on the grid. */
function sampleMelt(B, fr, t, g) {
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

// ── the fill over the join ──────────────────────────────────────────────

/** The blobs' lobes at t as [x, y, 1 / reach², weight], for fieldOf. */
function lobeList(B, blobs, t) {
  const out = [];
  for (const b of blobs) {
    for (const p of B.lobesAt(b, t)) {
      const rho = p.r * Math.SQRT2;
      out.push([p.x, p.y, 1 / (rho * rho), p.w]);
    }
  }
  return out;
}

/** The field of a lobe list at (x, y): what blobs.fieldAt gives, without recomputing the lobes. */
function fieldOf(L, x, y) {
  let f = 0;
  for (const [lx, ly, inv, w] of L) {
    const u = ((x - lx) ** 2 + (y - ly) ** 2) * inv;
    if (u < 1) f += w * (1 - u) * (1 - u);
  }
  return f;
}

/**
 * Points [x, y, ds, …] of traced loops, each with its share of the loop's
 * length, times `weight(x, y)` (0 … 1) when given.
 */
function weighted(loops, weight = null) {
  const out = [];
  for (const l of loops) {
    const n = l.length / 2;
    if (n < 3) continue;
    for (let i = 0; i < n; i++) {
      const x = l[2 * i];
      const y = l[2 * i + 1];
      const k = weight ? weight(x, y) : 1;
      if (k <= 0) continue;
      const a = 2 * ((i + n - 1) % n);
      const b = 2 * ((i + 1) % n);
      const ds = (Math.hypot(x - l[a], y - l[a + 1]) + Math.hypot(l[b] - x, l[b + 1] - y)) / 2;
      out.push(x, y, ds * k);
    }
  }
  return out;
}

/**
 * The soft hull of weighted points (see FILL_SOFT), as its outline
 * [x0, y0, …] counter-clockwise at FILL_DIRS directions: its support in
 * each direction is the log of the sum of e^(reach / FILL_SOFT) over the
 * outline, by length, so it takes in the whole shape, runs along it where
 * it is round, and where the hull would cross a dip (or meet the other
 * blob) it bows outward, more the wider the dip. The outline is the
 * envelope of those supporting lines (x = h n + h′ n′), smooth and convex.
 */
function softHull(pts) {
  const n = pts.length / 3;
  const out = [];
  if (n < 3) return out;
  const tau = FILL_SOFT;
  // Normalised so a stretch of outline as round as FILL_ROUND keeps its place.
  const norm = tau * Math.log(Math.sqrt(2 * Math.PI * tau * FILL_ROUND));
  for (let k = 0; k < FILL_DIRS; k++) {
    const a = (TAU * k) / FILL_DIRS;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    let m = -Infinity;
    for (let i = 0; i < 3 * n; i += 3) {
      const r = pts[i] * cx + pts[i + 1] * cy;
      if (r > m) m = r;
    }
    let sw = 0;
    let st = 0;
    for (let i = 0; i < 3 * n; i += 3) {
      const r = pts[i] * cx + pts[i + 1] * cy;
      if (r < m - 12 * tau) continue;
      const w = pts[i + 2] * Math.exp((r - m) / tau);
      sw += w;
      st += w * (-pts[i] * cy + pts[i + 1] * cx);
    }
    const h = m + tau * Math.log(sw) - norm;
    const ht = st / sw;
    out.push(h * cx - ht * cy, h * cy + ht * cx);
  }
  return out;
}

/**
 * The form the fill is made of (see FILL_SOFT), read off the field on the
 * grid `g` (the blobs and the melt): the soft hull of the peach's own
 * outline (its whole shape, both halves, as it runs round the shared edge)
 * and of the face's own outline where it runs outside the peach's. With
 * `fr.partner` (the other face's frame, in the still and print poses) that
 * face's outline is taken in too, carried across the shared edge as the
 * spread lays it: both faces then show halves of one form, which meets
 * itself on the edge exactly and stays convex across it.
 */
function hullsOf(B, fr, t, g) {
  const { W } = fr;
  const gp = B.makeGrid({ x: W.x - 2 * W.R, y: W.y - 2 * W.R, w: 4 * W.R, h: 4 * W.R }, g.cell);
  B.sampleField([W], t, gp);
  const LW = lobeList(B, [W], t);
  // Each face: its grid, which side of the shared edge it lies on, and how far it is carried into this face's place.
  const faces = [{ g, side: Math.sign(fr.O.x - W.x) || 1, dx: 0 }];
  const P = fr.partner;
  if (P) {
    const gq = { cell: g.cell, x0: g.x0, y0: g.y0, nx: g.nx, ny: g.ny, v: new Float32Array(g.v.length) };
    B.sampleField(P.list, t, gq);
    sampleMelt(B, P, t, gq);
    faces.push({ g: gq, side: Math.sign(P.O.x - P.W.x) || 1, dx: W.x - P.W.x });
  }
  const pts = [];
  for (const { g: gf, side, dx } of faces) {
    // The face's outline where it runs outside the peach's own: and the peach's own where the face's hasn't
    // swallowed it (each fading over the same margin, so where the two run together they count once).
    const rest = weighted(B.traceContours(gf), (x, y) => ((x - W.x + dx) * side > 0 ? B.smoothstep((B.ISO - fieldOf(LW, x + dx, y)) / FILL_MARGIN) : 0));
    for (let i = 0; i < rest.length; i += 3) pts.push(rest[i] + dx, rest[i + 1], rest[i + 2]);
  }
  const kept = weighted(B.traceContours(gp), (x, y) => {
    for (const { g: gf, side, dx } of faces) if ((x - W.x) * side > 0) return 1 - B.smoothstep((readGrid(gf, x - dx, y) - B.ISO) / FILL_MARGIN);
    return 1;
  });
  return { form: softHull(kept.concat(pts)) };
}

/**
 * The field of a convex polygon (counter-clockwise): the outline's level
 * on its edge, rising FILL_SLOPE per 0.1 mm in from it and falling as much
 * out (to `band` out, then held), at (x, y). `E` is the polygon as edges
 * (see edgesOf).
 */
function polyField(B, E, x, y, band) {
  let d = Infinity;
  for (let k = 0; k < E.length; k += 3) {
    const s = E[k] * x + E[k + 1] * y - E[k + 2];
    if (s < d) {
      d = s;
      if (d < -band) return B.ISO - FILL_SLOPE * band;
    }
  }
  return B.ISO + FILL_SLOPE * d;
}

/** A convex polygon (counter-clockwise) as its edges' inward unit normals and offsets: inside, every n·p − c ≥ 0. */
function edgesOf(poly) {
  const n = poly.length / 2;
  const E = new Float64Array(3 * n);
  for (let i = 0; i < n; i++) {
    const ax = poly[2 * i];
    const ay = poly[2 * i + 1];
    const bx = poly[2 * ((i + 1) % n)];
    const by = poly[2 * ((i + 1) % n) + 1];
    const L = Math.hypot(bx - ax, by - ay) || 1;
    const qx = -(by - ay) / L;
    const qy = (bx - ax) / L;
    E[3 * i] = qx;
    E[3 * i + 1] = qy;
    E[3 * i + 2] = qx * ax + qy * ay;
  }
  return E;
}

/**
 * The join, filled (see FILL_SOFT), `w` of the way: the field becomes the
 * form's own (the soft hull's).
 */
function fillWaist(B, fr, t, g, w) {
  if (w <= 0) return;
  const { form } = hullsOf(B, fr, t, g);
  if (form.length < 6) return;
  const E = edgesOf(form);
  const { v, nx, ny, cell } = g;
  const band = 3 * cell;
  const top = B.ISO + FILL_SLOPE * band;
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < form.length; i += 2) {
    x0 = Math.min(x0, form[i]);
    x1 = Math.max(x1, form[i]);
    y0 = Math.min(y0, form[i + 1]);
    y1 = Math.max(y1, form[i + 1]);
  }
  // Everything the raw shape covers is in the box too: a lobe standing out of the form is taken back in.
  for (let j = 1; j < ny - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      if (v[j * nx + i] < B.ISO - FILL_SLOPE * band) continue;
      const x = g.x0 + i * cell;
      const y = g.y0 + j * cell;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const i0 = Math.max(1, Math.floor((x0 - band - g.x0) / cell));
  const i1 = Math.min(nx - 2, Math.ceil((x1 + band - g.x0) / cell));
  const j0 = Math.max(1, Math.floor((y0 - band - g.y0) / cell));
  const j1 = Math.min(ny - 2, Math.ceil((y1 + band - g.y0) / cell));
  for (let j = j0; j <= j1; j++) {
    const y = g.y0 + j * cell;
    for (let i = i0; i <= i1; i++) {
      const o = j * nx + i;
      const s = polyField(B, E, g.x0 + i * cell, y, band);
      // Deep inside, nothing to change (the raw field is above the outline there too).
      if (v[o] >= top && s >= top) continue;
      v[o] += (s - v[o]) * w;
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
 * The paint: a two-circle radial gradient from `focal` (the partner's
 * end) to `end` (the peach's), as stops [offset, v] (v = the own ink's
 * share, 0 peach … 1 the partner), its middle on the waist and as wide as
 * the melt has come (see HANDOVER_NEAR).
 */
function paintOf(B, W, O, t, melt) {
  const sw = Math.min(0.999, Math.max(0.001, waistOf(B, W, O, t)));
  const D = Math.hypot(O.x - W.x, O.y - W.y) || 1;
  const ux = (O.x - W.x) / D;
  const uy = (O.y - W.y) / D;
  const waist = D * sw;
  // Where the circles cross the line on the near side (from the peach's centre), drawn in toward the
  // waist while the melt comes in; on the far side, HANDOVER_FAR beyond the own blob's centre.
  const k = Math.max(0.02, melt);
  const near0 = waist + (HANDOVER_NEAR[0] - waist) * k;
  const near1 = waist + (D + HANDOVER_NEAR[1] - waist) * k;
  const circle = (near, far) => ({ x: W.x + ux * ((near + far) / 2), y: W.y + uy * ((near + far) / 2), r: (far - near) / 2 });
  const focal = circle(near1, D + HANDOVER_FAR[0]);
  const end = circle(near0, D + HANDOVER_FAR[1]);
  // Offsets run from the focal circle (the partner, 1) to the end circle (the peach, 0); the share is a
  // smoothstep in them, bent so its middle falls on the waist.
  const mid = Math.min(0.95, Math.max(0.05, (near1 - waist) / (near1 - near0 || 1)));
  const bend = Math.log(0.5) / Math.log(mid);
  const stops = [];
  for (let i = 0; i < STOPS; i++) {
    const o = i / (STOPS - 1);
    const q = o ** bend;
    stops.push([o, 1 - q * q * (3 - 2 * q)]);
  }
  return { focal, end, stops, cx: W.x + ux * waist, cy: W.y + uy * waist };
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
  // The fill comes in with the melt.
  return { W, O, need, neck, meltTo, melt: k, fill: k, list: [W, O], paint: paintOf(B, W, O, t, k) };
}

// ── the glow across the gap ─────────────────────────────────────────────

/** Whether (x, y) lies inside a traced loop [x0, y0, x1, y1, …]. */
function inLoop(l, x, y) {
  let inside = false;
  const n = l.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = l[2 * i];
    const yi = l[2 * i + 1];
    const xj = l[2 * j];
    const yj = l[2 * j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * While the two are apart (their outlines two loops): which loops are the
 * peach's and which the own blob's, and the glow's centre, the middle of
 * the bare paper between the two outlines' nearest points (`gap` across).
 * Null once they touch.
 */
function glowOf(fr, loops) {
  if (loops.length < 2) return null;
  const own = loops.findIndex((l) => inLoop(l, fr.O.x, fr.O.y));
  if (own < 0 || inLoop(loops[own], fr.W.x, fr.W.y)) return null;
  // Every other loop is the peach's (a stray one beside the own blob goes with it).
  const sideOf = loops.map((l, i) => {
    if (i === own) return 1;
    const dW = Math.hypot(l[0] - fr.W.x, l[1] - fr.W.y) / fr.W.R;
    const dO = Math.hypot(l[0] - fr.O.x, l[1] - fr.O.y) / fr.O.R;
    return dO < dW ? 1 : 0;
  });
  const a = loops.filter((_, i) => sideOf[i] === 0).flat();
  const b = loops[own];
  if (!a.length) return null;
  let best = Infinity;
  let pa = 0;
  let pb = 0;
  for (let j = 0; j < b.length; j += 2) {
    for (let i = 0; i < a.length; i += 2) {
      const q = (a[i] - b[j]) ** 2 + (a[i + 1] - b[j + 1]) ** 2;
      if (q < best) {
        best = q;
        pa = i;
        pb = j;
      }
    }
  }
  const gap = Math.sqrt(best);
  // Across the gap: from the peach's nearest point to the own blob's (or the centres' line, should they meet).
  let ux = b[pb] - a[pa];
  let uy = b[pb + 1] - a[pa + 1];
  if (gap < 1) {
    ux = fr.O.x - fr.W.x;
    uy = fr.O.y - fr.W.y;
  }
  const ul = Math.hypot(ux, uy) || 1;
  return { x: (a[pa] + b[pb]) / 2, y: (a[pa + 1] + b[pb + 1]) / 2, gap, ux: ux / ul, uy: uy / ul, sideOf };
}

/** How far toward the other ink the point (x, y) is, by the glow about `glow`'s centre (see GLOW). */
function glowAt(glow, x, y) {
  const dx = x - glow.x;
  const dy = y - glow.y;
  const along = dx * glow.ux + dy * glow.uy;
  const across = (dy * glow.ux - dx * glow.uy) / GLOW_WIDE;
  const q = (along * along + across * across) / (GLOW_REACH * GLOW_REACH);
  if (q >= 1) return 0;
  return GLOW_PEAK * (1 - q) * (1 - q);
}

/** The glow's ellipse as a transform of a circle GLOW_REACH round the origin: [a, b, c, d, e, f]. */
function glowMatrix(glow) {
  const { x, y, ux, uy } = glow;
  return [ux, uy, -uy * GLOW_WIDE, ux * GLOW_WIDE, x, y];
}

/** The glow as stops [offset, share] of a radial gradient GLOW_REACH wide, for the peach (`own` false) or the own blob. */
function glowStops(own) {
  const stops = [];
  for (let k = 0; k < GLOW_STOPS; k++) {
    const u = k / (GLOW_STOPS - 1);
    const g = GLOW_PEAK * (1 - u * u) ** 2;
    stops.push([u, own ? 1 - g : g]);
  }
  return stops;
}

/** The hand-over's share at (x, y): the linear gradient of `paint`, read off its stops. */
function shareAt(paint, x, y) {
  const { focal: F, end: E, stops } = paint;
  // The largest s whose circle (F → E, centre and radius straight between) passes through (x, y), as a
  // radial gradient paints it.
  const dcx = E.x - F.x;
  const dcy = E.y - F.y;
  const dr = E.r - F.r;
  const px = x - F.x;
  const py = y - F.y;
  const a = dcx * dcx + dcy * dcy - dr * dr;
  const b = px * dcx + py * dcy + F.r * dr;
  const c = px * px + py * py - F.r * F.r;
  let s = 0;
  if (Math.abs(a) < 1e-9) s = c / (2 * b || 1);
  else {
    const q = Math.sqrt(Math.max(0, b * b - a * c));
    const r1 = (b + q) / a;
    const r2 = (b - q) / a;
    s = -Infinity;
    for (const r of [r1, r2]) if (F.r + r * dr >= 0 && r > s) s = r;
    if (s === -Infinity) s = 0;
  }
  if (s <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (s <= stops[i][0]) {
      const [s0, v0] = stops[i - 1];
      const [s1, v1] = stops[i];
      return v0 + ((v1 - v0) * (s - s0)) / (s1 - s0 || 1);
    }
  }
  return stops[stops.length - 1][1];
}

/**
 * The frame the still card and the print file show for a pose: 'apart'
 * (the arrival's first frame: the gap measured, nothing pulled, nothing
 * melted) or anything else, 'met' (the rounded form the meeting rests in).
 */
function stillFrame(B, { seed, face, edge, pose }) {
  const t = STILL_TIME;
  if (pose === 'apart') return frameOf(B, { seed, face, edge, t, m: 0, tide: 0, pull: 0, melt: 0, travel: travelFor(B, seed, face, edge, t) });
  // Met: one form across the spread, so the other face is part of it too (see hullsOf).
  const fr = frameOf(B, { seed, face, edge, t, m: 1, tide: TIDE });
  fr.partner = frameOf(B, { seed, face: face === 'zh' ? 'en' : 'zh', edge: edge === 'right' ? 'left' : 'right', t, m: 1, tide: TIDE });
  return fr;
}

/** What tools (and nothing else) read: the same functions the card draws with. */
export const geometry = {
  OWN, GAP, TRAVEL, MEET_TIME, NECK_HOLD, PULL_MAX, MELT, MELT_BLUR, MELT_TIME, HANDOVER_NEAR, HANDOVER_FAR, HOLD_FROM, TIDE,
  easePull, easeMelt, wrapped, ownBlob, outward, outlinePoints, travelFor, toward, neckOf, needOf, holdOf,
  meltOf, blurredShape, readGrid, sampleFrame, waistOf, paintOf, shareAt, frameOf, inkSet, outlineOf,
  FUSE_IN, FUSE_GROW, GLOW_PEAK, GLOW_REACH, hullsOf, fillWaist, glowOf, glowAt, stillFrame,
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
  pitch: '人，生而立體：同一個人，一面直排中文、一面英文；一團桃色穿過名片刷了色的長邊，翻過來接到另一面，那一面的薰衣草隔著白紙先泛起彼此的顏色，再和它融成一個圓潤的形狀',
  notes: [
    {
      k: '概念',
      v: '桃色從正面的右緣穿出、接到背面的左緣：名片翻過來，這是同一條邊，所以是同一個形狀穿過紙的厚度。那條長邊整條刷成桃色，翻面時朝你轉過來；攤開時正背兩半在中縫拼回一整團。每面另有一團薰衣草，靠過來和桃色融成一個圓潤的整體，顏色順著形狀的弧度，經過暖玫瑰色在約 15 mm 間融回桃色。',
    },
    {
      k: '靜態版',
      v: '靜態與印刷有兩個畫面可選。預設「已融合」：兩團融成一個圓潤的整體，整圈輪廓外凸，接合處沒有凹口，正背兩面在中縫完全接上。「將相遇」：兩團還隔著 7 mm 的白紙，面對面的邊緣先泛起對方的顏色，像什麼正要發生。數位名片則每次播完整段相遇，最後停在「已融合」。',
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
      v: '只印油墨，紙色交給紙張。四個顏色：桃、薰衣草、赤陶（落款印與波紋）、暖黑（字與 QR 碼），小字一律用實色。基本作法是數位 CMYK：兩張 300 gsm 棉紙對裱成約 0.8 mm，裁好後只刷共用的那條長邊，每個名字同一道工序。融色是向量漸層，沒有點陣圖；粉彩轉 CMYK 會略灰，薰衣草最明顯，請先打樣。進階可以用專色或 Riso 兩色疊印出融色，中段會比螢幕上灰一些。QR 碼 14 mm。',
    },
    {
      k: '動態',
      v: '每次一面轉到眼前，那一面的薰衣草先隔著 7 mm 的白紙、邊緣泛著彼此的顏色，在 2.6 秒內靠過來，約 1 秒時碰到，再約 1 秒長成一個圓潤的整體。之後桃色以 10 秒的週期呼吸，薰衣草隨 13 秒的潮汐微微進退，輪廓輕輕起伏，不會再收出腰身。',
    },
  ],
  langs: [
    { id: 'zh-first', label: '中文面在前' },
    { id: 'en-first', label: '英文面在前' },
  ],
  // The frame the still card and the print file show (the first is the default).
  poses: [
    { id: 'met', label: '已融合' },
    { id: 'apart', label: '將相遇' },
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
    // wait for) waits for it too, instead of resolving before layout has asked for any font. When the
    // page sets the type as images (ctx.typeReady), wait for those and load no fonts for the card.
    const typeLoaded = ctx.typeReady ?? typeIn(ctx);

    const inks = inkSet(B, B.parseOklch(ink.paper), ink[PARTNER]);

    const animated = ctx.live;
    const seed = person.seed;
    const tideOf = (k, t) => TIDE * Math.sin((TAU * t) / TIDE_PERIOD + OWN[k].tidePhase);

    // The still card and the print file show one pose: 'apart', or (anything else) 'met'.
    const pose = ctx.pose === 'apart' ? 'apart' : 'met';
    const still = (k) => stillFrame(B, { seed, face: k, edge: edge[k], pose });

    // ── print: vector, two inks (or one plate), in the pose picked ──
    if (ctx.mode === 'print') {
      for (const k of ['zh', 'en']) face[k].art.innerHTML = svgArt(B, still(k), STILL_TIME, { box, inks, plate, id: uid() });
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
      // Still (or reduced motion): both faces in the pose picked.
      ctx.loop(() => {
        for (const k of ['zh', 'en']) canvases[k].draw(still(k), STILL_TIME, inks);
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
  const rgb = (v) => {
    const L = L1 + (L2 - L1) * v;
    const C = (C1 + (C2 - C1) * v) * (1 - (1 - MID_CHROMA) * 4 * v * (1 - v));
    const h = h1 + dh * v ** HUE_LAG;
    return B.oklabToRgb([L, C * Math.cos(h), C * Math.sin(h)]);
  };
  return {
    rgb,
    colour: (v) => B.rgbHex(rgb(v)),
    plates: {
      peach: (v) => B.rgbHex(grey(1 - peach.density * (1 - v))),
      [PARTNER]: (v) => B.rgbHex(grey(1 - partner.density * v)),
    },
  };
}

// ── screen: a canvas per face ───────────────────────────────────────────

/**
 * Draws a frame's two blobs over `box` and fills its host: one outline
 * (with the melt and the fill), painted three ways. Apart, each blob
 * glows toward the other (a radial gradient each, see GLOW); melted, the
 * lavender's cap melts into the peach (a two-circle radial gradient, see
 * paintOf and inkSet);
 * in between (touching, melting) the one hands over to the other on a
 * coarse colour grid (see mixGrid). Then a little sand.
 * Sized from the host's layout box, so the card's turn and lean never resize it.
 */
function canvasArt(B, host, box, { grain, cell }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'fct-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const g = canvas.getContext('2d');
  const grid = B.makeGrid(box, cell);
  const mix = mixGrid(B, box);
  let w = 0;
  let h = 0;
  let dpr = 1;
  let pattern = null;
  let last = null;
  /** The glow's centre the last time the two were apart: the melt hands over from it. */
  let lastGlow = null;

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

  const pathOf = (loops) => {
    const p = new Path2D();
    smoothLoops(
      loops,
      (x, y) => p.moveTo(x, y),
      (cx, cy, x, y) => p.quadraticCurveTo(cx, cy, x, y),
      () => p.closePath(),
    );
    return p;
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
    g.save();
    g.clip(pathOf(loops), 'evenodd');
    const glow = glowOf(fr, loops);
    if (glow) {
      lastGlow = glow;
      // The gradient is a circle round the origin, drawn through the glow's ellipse; the outline is
      // taken back through the inverse, so it lands where it is.
      const [ma, mb, mc, md, me, mf] = glowMatrix(glow);
      const to = new DOMMatrix([ma, mb, mc, md, me, mf]);
      const back = to.inverse();
      for (const own of [0, 1]) {
        const mine = loops.filter((_, i) => glow.sideOf[i] === own);
        if (!mine.length) continue;
        const grad = g.createRadialGradient(0, 0, 0, 0, 0, GLOW_REACH);
        for (const [u, v] of glowStops(own === 1)) grad.addColorStop(u, inks.colour(v));
        const shape = new Path2D();
        shape.addPath(pathOf(mine), back);
        g.save();
        g.transform(ma, mb, mc, md, me, mf);
        g.fillStyle = grad;
        g.fill(shape, 'evenodd');
        g.restore();
      }
    } else if (fr.melt < 1 && lastGlow) {
      mix.paint(g, fr, t, inks, lastGlow);
    } else {
      const { focal: F, end: E, stops } = fr.paint;
      const grad = g.createRadialGradient(F.x, F.y, F.r, E.x, E.y, E.r);
      for (const [s, v] of stops) grad.addColorStop(s, inks.colour(v));
      g.fillStyle = grad;
      g.fillRect(box.x, box.y, box.w, box.h);
    }
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

/** The colour grid's cell (0.1 mm): 1 mm, drawn smoothed, under the outline. */
const MIX_CELL = 10;

/**
 * The paint while the two touch and melt, on a coarse grid: the glow (each
 * point on the side of the blob whose own field is the stronger, smoothly
 * across the neck) handed over to the melt's hand-over as the melt comes in.
 */
function mixGrid(B, box) {
  let gr = null;
  let cv = null;
  let cx = null;
  let img = null;
  return {
    paint(g, fr, t, inks, glow) {
      if (!gr) {
        gr = B.makeGrid(box, MIX_CELL);
        cv = document.createElement('canvas');
        cv.width = gr.nx;
        cv.height = gr.ny;
        cx = cv.getContext('2d');
        img = cx.createImageData(gr.nx, gr.ny);
      }
      const LW = lobeList(B, [fr.W], t);
      const LO = lobeList(B, [fr.O], t);
      const mu = fr.melt;
      const d = img.data;
      for (let j = 0; j < gr.ny; j++) {
        const y = gr.y0 + j * MIX_CELL;
        for (let i = 0; i < gr.nx; i++) {
          const x = gr.x0 + i * MIX_CELL;
          const fW = fieldOf(LW, x, y);
          const fO = fieldOf(LO, x, y);
          const side =
            fW + fO > 0.02
              ? B.smoothstep(0.5 + (2 * (fO - fW)) / (fW + fO))
              : Math.hypot(x - fr.O.x, y - fr.O.y) / fr.O.R < Math.hypot(x - fr.W.x, y - fr.W.y) / fr.W.R
                ? 1
                : 0;
          const tg = glowAt(glow, x, y);
          const vg = side + (1 - 2 * side) * tg;
          const v = vg + (shareAt(fr.paint, x, y) - vg) * mu;
          const [r, gg, b] = inks.rgb(v);
          const o = (j * gr.nx + i) * 4;
          d[o] = r;
          d[o + 1] = gg;
          d[o + 2] = b;
          d[o + 3] = 255;
        }
      }
      cx.putImageData(img, 0, 0);
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      g.drawImage(cv, gr.x0 - MIX_CELL / 2, gr.y0 - MIX_CELL / 2, gr.nx * MIX_CELL, gr.ny * MIX_CELL);
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

/** Traced loops as SVG path data (the hero's smoothing). */
function loopsPath(loops) {
  const f = (n) => Math.round(n * 10) / 10;
  let d = '';
  smoothLoops(
    loops,
    (x, y) => (d += `M${f(x)} ${f(y)}`),
    (cx, cy, x, y) => (d += `Q${f(cx)} ${f(cy)} ${f(x)} ${f(y)}`),
    () => (d += 'Z'),
  );
  return d;
}

/** A frame's traced loops (with the melt and the fill), on a `cell` grid over `box`. */
function loopsOf(B, fr, t, box, cell = 3) {
  const g = B.makeGrid(box, cell);
  sampleFrame(B, fr, t, g);
  return B.traceContours(g);
}

/** A frame's outline (with the melt and the fill) as SVG path data, traced on a `cell` grid over `box`. */
function outlineOf(B, fr, t, box, cell = 3) {
  return loopsPath(loopsOf(B, fr, t, box, cell));
}

/**
 * The frame as SVG: vector outlines filled with opaque gradients, so the
 * PDF keeps them vector (nothing else: the paper is the stock). Met, one
 * outline and the hand-over; apart, each blob its own outline and its glow
 * toward the other (a radial gradient each). With `plate`, that ink's
 * density as grey on white instead: the separation a spot plate (or a riso
 * master) is made from.
 */
function svgArt(B, fr, t, { box, inks, plate, id }) {
  const loops = loopsOf(B, fr, t, box, 3);
  const vb = `${box.x} ${box.y} ${box.w} ${box.h}`;
  const open = `<svg class="fct-svg" viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">`;
  const f = (n) => n.toFixed(1);
  const stopsOf = (stops, colour) => stops.map(([s, v]) => `<stop offset="${s.toFixed(4)}" stop-color="${colour(v)}"/>`).join('');
  const white = plate ? `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="#fff"/>` : '';
  const colour = plate ? inks.plates[plate] : inks.colour;
  if (plate && !colour) return open + white + '</svg>';
  const ink = plate ? `spot-${plate}` : 'peach-lavender';
  const glow = glowOf(fr, loops);
  if (glow) {
    let defs = '';
    let body = '';
    for (const own of [0, 1]) {
      const mine = loops.filter((_, i) => glow.sideOf[i] === own);
      if (!mine.length) continue;
      defs +=
        `<radialGradient id="${id}${own}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${GLOW_REACH}" gradientTransform="matrix(${glowMatrix(glow).map((n) => +n.toFixed(4)).join(' ')})">` +
        stopsOf(glowStops(own === 1), colour) +
        `</radialGradient>`;
      body += `<path data-ink="${ink}" d="${loopsPath(mine)}" fill="url(#${id}${own})" fill-rule="evenodd"/>`;
    }
    return open + `<defs>${defs}</defs>` + white + body + '</svg>';
  }
  // The hand-over as one two-circle radial gradient (see paintOf), the same one the canvas draws.
  const { focal: F, end: E, stops } = fr.paint;
  const grad =
    `<defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" fx="${f(F.x)}" fy="${f(F.y)}" fr="${f(F.r)}" cx="${f(E.x)}" cy="${f(E.y)}" r="${f(E.r)}">` +
    stopsOf(stops, colour) +
    `</radialGradient></defs>`;
  return open + grad + white + `<path data-ink="${ink}" d="${loopsPath(loops)}" fill="url(#${id})" fill-rule="evenodd"/></svg>`;
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

// The faces' type, for the direction that keeps this layout (directions/friends.js).
export { zhFace, enFace, typeIn };
