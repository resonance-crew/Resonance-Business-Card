/**
 * Direction A 相遇 / Meeting.
 *
 * Front: two blobs caught as a neck forms between them, their two colours
 * melting into each other across it (the landing hero's fusion), the
 * wordmark small in the corner, one brand line. Back: the person, and the
 * two arrive, meet, and become one warm blob that settles beside the name.
 *
 * Every member brings their own pair: peach (shared by the whole team) and
 * one of the site's other pastels (lavender, sage, sky, yellow), so the four
 * cards are four meetings. What each meeting becomes is the same warm
 * peach-rose, which is also the colour of the card's edge.
 *
 * Screen, still card and print file draw the same thing: the union's
 * outline (the metaball field, js/blobs.js) filled with one linear gradient
 * along the line between the two centres, its colour the hero's blend
 * (each ink weighted by how near its blob is), interpolated round the hue
 * circle the warm way. On a canvas live; as a vector SVG for still and print.
 *
 * Design units are 0.1 mm (the trim box is 0…900 × 0…540). Type is set in
 * meet.css in true points (var(--pt)) and millimetres (var(--mm)).
 */
import { INK } from '../js/people.js';
import { parseOklch, oklabToRgb, rgbHex } from '../js/blobs.js';

// ── inks ───────────────────────────────────────────────────────────────

const TAU = Math.PI * 2;
const PAPER = parseOklch(INK.paper);
/** An ink as it lies on the paper: `density` of the way from paper to the pure pastel. */
const laid = (css, density) => {
  const c = parseOklch(css);
  return PAPER.map((v, i) => v + (c[i] - v) * density);
};
/** The team's shared ink. */
const PEACH = laid(INK.terracottaLight, 0.84);
/**
 * Each member's own ink, laid so the four read with the same weight beside
 * the peach. `arc` is the way round the hue circle the melt takes from
 * peach to it: −1 through rose (lavender is that way anyway; sky is sent
 * that way rather than through mint), +1 through butter, 0 the short way.
 * `dip` softens the middle of the melt by that share of the straight mix
 * (which loses a little chroma, as two real inks do): the further apart the
 * two hues, the more it needs it, so the neck is a blush, not a candy band.
 * `toFused` is the way round the circle it turns into the fused colour on
 * the back (sky again through rose and lilac, never through mint).
 */
const SECONDS = {
  lavender: { lab: laid(INK.lavender, 0.8), arc: -1, dip: 0.5 },
  sage: { lab: laid(INK.sage, 0.74), arc: 1, dip: 0.15 },
  sky: { lab: laid(INK.sky, 0.78), arc: -1, dip: 0.5, toFused: 1 },
  yellow: { lab: laid(INK.yellow, 0.9), arc: 0, dip: 0 },
};
const WHO = { chen: 'lavender', hsiao: 'sage', fang: 'sky', cheng: 'yellow', hsueh: 'sage' };
const ORDER = ['lavender', 'sage', 'sky', 'yellow'];
/**
 * What every meeting becomes: one warm peach-rose, between the brand's peach
 * (oklch 88% 0.08 55) and its terracotta (62% 0.14 45), a little rosier.
 */
const FUSED_CSS = 'oklch(84% 0.065 40)';
const FUSED = parseOklch(FUSED_CSS);

const toLch = ([L, a, b]) => [L, Math.hypot(a, b), Math.atan2(b, a)];
/** p → q at t in L, C and hue (the way `arc` says: 0 the short way, ±1 forced). */
function mixLch(p, q, t, arc = 0) {
  const [L1, C1, h1] = toLch(p);
  const [L2, C2, h2] = toLch(q);
  let dh = (((h2 - h1 + Math.PI) % TAU) + TAU) % TAU - Math.PI;
  if (arc > 0 && dh < 0) dh += TAU;
  if (arc < 0 && dh > 0) dh -= TAU;
  const L = L1 + (L2 - L1) * t;
  const C = C1 + (C2 - C1) * t;
  const h = h1 + dh * t;
  return [L, C * Math.cos(h), C * Math.sin(h)];
}
/** The same, softened in the middle by `dip`: that share of the straight Oklab mix (which loses a little chroma, as real inks do). */
function mixInk(p, q, t, arc = 0, dip = 0) {
  const round = mixLch(p, q, t, arc);
  if (!dip) return round;
  return round.map((v, i) => v + (p[i] + (q[i] - p[i]) * t - v) * dip);
}
const hex = (lab) => rgbHex(oklabToRgb(lab));

/**
 * How soft the melt is: each ink weighs (R² / d²)^SOFT at a point. The hero
 * uses 3 (on a screen-wide canvas); 1.2 spreads the change from one ink to
 * the other (10 % → 90 %) over 43 % of the way between the two centres,
 * about 12 mm at the front's still frame, so at card size it reads as a melt.
 */
const SOFT = 1.2;
const STOPS = 28;

/**
 * The paint of a pair: stops along the line from a's centre to b's, and that
 * line; or one flat colour once they are the same colour or the same place
 * (a gradient of no length paints nothing on a canvas). Both blobs carry
 * `lab` (their colour now); `ink` is the member's (its arc and dip).
 */
function gradientOf(pair, { arc, dip }) {
  const [a, b] = pair;
  const same = Math.hypot(...a.lab.map((v, i) => v - b.lab[i])) < 1e-4;
  if (same || Math.hypot(b.x - a.x, b.y - a.y) < 1) {
    const ma = a.R * a.R;
    const mb = b.R * b.R;
    return { flat: hex(same ? a.lab : mixInk(a.lab, b.lab, mb / (ma + mb), arc, dip)) };
  }
  const stops = [];
  for (let k = 0; k <= STOPS; k++) {
    const s = k / STOPS;
    // (R² / d²) for each, d a share of the distance between the centres (it cancels).
    const wa = ((a.R * a.R) / (s * s + 1e-4)) ** SOFT;
    const wb = ((b.R * b.R) / ((1 - s) * (1 - s) + 1e-4)) ** SOFT;
    stops.push([s, hex(mixInk(a.lab, b.lab, wb / (wa + wb), arc, dip))]);
  }
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stops };
}

// ── where things are ───────────────────────────────────────────────────

/**
 * The front's pair, where they rest before they reach for each other: nearly
 * the same size, as equals. B is then moved, per person, so that at the still
 * frame (its lowest, leftmost moment) its outline runs BLEED_B past the top
 * and right trim: a clear bleed, never a hair of paper at the cut.
 */
const PAIR = {
  A: { x: 545, y: 335, R: 150 },
  B: { x: 810, y: 140, R: 140 },
};
const BLEED_B = { top: 25, right: 45 };
/**
 * Then the cut corner B runs over, (900, 0). A guillotine drifts by a
 * millimetre or so, so an outline that passes near the corner turns into a
 * paper sliver of a different size on every card. When the still frame's
 * outline comes within CORNER_NEAR of it, B takes the smaller of two moves:
 * in (to the left, so the top keeps its bleed) until CORNER_CLEAR of paper
 * shows at the corner, as long as the right keeps BLEED_KEEP of bleed; or out
 * along the outline's normal until the corner lies CORNER_COVER inside the
 * ink. Each target carries CORNER_SLACK for the traced outline. "Smaller" is
 * how far the still frame's shapes move: B's rest moves further, as the neck
 * is solved again and A follows. All four members' outlines passed 1 to
 * 2.7 mm from the corner; 陳念誠's now moves in (4 mm of paper at the corner,
 * 3 mm of bleed left at the top, 2 mm at the right), the other three move out
 * (the corner 2 mm inside the ink): moving in would cost them the right bleed.
 */
const CORNER = { x: 900, y: 0 };
const CORNER_NEAR = 30;
const CORNER_COVER = 20;
const CORNER_CLEAR = 40;
const CORNER_SLACK = 2;
const BLEED_KEEP = 15;
/**
 * The back: the two arrive in the empty right-hand column, the member's ink
 * from the top edge and peach from the bottom-right, and meet 10 mm in from
 * the right edge, two thirds of the way down. The one they become grows by
 * GROW as it rises a little into REST: centred on the card's height beside
 * the name, bleeding off the right edge only, about three quarters of it on
 * the paper (76 to 78 %). In the still and print frame it keeps 6.1 mm from
 * the nearest word (the longest e-mail, 陳念誠's). On screen its lobes keep
 * drifting, and a meeting minutes in can come to 1.5 mm of that e-mail
 * (4.8 mm for the other three).
 */
const BACK = {
  A: { x: 846, y: 592, R: 130 },
  B: { x: 752, y: 48, R: 118 },
  REST: { x: 826, y: 276 },
};
const GROW = 0.15;

/** How strongly the front's two are joined: the field's low point between them (0.25 = just touching). */
const NECK_LOOSE = 0.27;
const NECK_FULL = 0.4;
/** How strongly they are joined when the card comes back to the front (then they part). */
const NECK_PARTING = 0.62;
/** Seconds for one breath of the front, in and out. */
const BREATH = 11;
/**
 * The back, in seconds: the two close in (APPROACH) until they touch, the
 * neck grows slowly (NECK) while their colours melt into the fused one, they
 * become one (MERGE), and the one grows and settles into REST (SETTLE, which
 * starts half a second before the merge ends). FUSE_DELAY is the pause first.
 */
const APPROACH = 0.9;
const NECK = 1.3;
const MERGE = 1.0;
const FUSE = APPROACH + NECK + MERGE;
const SETTLE = 1.2;
const FUSE_DELAY = 0.2;
/** The neck's field levels the NECK phase runs between: touching, and well joined. */
const TOUCH = 0.25;
const JOINED = 0.8;
/** Seconds the front's pair takes to part again. */
const PART = 3.2;
/** A turn has to hold this long (seconds) before the faces answer it: a drag that hovers edge-on doesn't restart them. */
const SETTLE_SIDE = 0.15;

/** The still card and the print file: the fullest neck, every member's shapes at their roundest. */
const STILL = 2;

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
const clamp01 = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const easeOut = (x) => 1 - (1 - clamp01(x)) ** 3;

export default {
  id: 'meet',
  letter: 'A',
  name: '相遇',
  enName: 'Meeting',
  orientation: 'landscape',
  edgeColor: FUSED_CSS,
  radiusMm: 0,
  thicknessMm: 0.8,
  pitch: '正面停在兩個生命剛碰到的那一刻，兩種顏色在頸部慢慢融開；翻過來它們已經合成一個暖桃玫瑰，安靜地陪著這個人的名字',
  notes: [
    {
      k: '概念',
      v: '正面一顆桃色、一顆屬於這個人的顏色，幾乎一樣大，停在剛長出頸部的那一刻。兩色不是疊出一條邊，而是像官網首頁那樣在頸部慢慢融開，從一色到另一色約 12 mm。桃色全隊共用，另一色每人不同：陳念誠薰衣草、蕭力文鼠尾草綠、方昱晴天空藍、鄭義信奶油黃，一套四張是四次不同的相遇。翻到背面，兩顆在右側相遇、融成一個，四個人的結果都是同一個暖桃玫瑰 oklch(84% 0.065 40)，介於品牌的桃色（88% 0.08 55）與赭紅（62% 0.14 45）之間、略偏玫瑰；卡片四邊也是這個顏色。',
    },
    {
      k: '語言',
      v: '預設中英並列在同一面，名字排成一行；中文版、English 版只拿掉另一種語言，位置不動。卡上只放使命宣言的最後一句「讓生命影響生命」，整段使命留在數位名片頁。',
    },
    {
      k: '字級',
      v: '名字排同一行：Noto Serif TC 500 11 pt（字距 0.16em）配 Playfair Display 12.5 pt，中文約為英文的 0.88 倍，看起來一樣大。字標 7.2／8.2 pt、團隊名 7／7.6 pt、聯絡 DM Sans 7.2 pt、標語 7.8 pt（字距 0.16em，「讓」「響」的筆畫間留得住墨）配 8.6 pt 義大利體；QR 碼 14.4 mm 寬。字的墨離裁切線（300 dpi 輸出實量）：左緣 6.3 mm、上緣至少 6.5 mm；離下緣最近的是英文標語 influence 的 f 下伸 5.8 mm，背面 QR 碼 6.1 mm、網址 6.6 mm，都超過 4 mm 的安全距離。背面的色塊在印刷稿上離文字至少 6.1 mm（陳念誠最長的 e-mail）；螢幕上它一直慢慢漂動，幾分鐘後的某次合一會靠近那行 e-mail 到 1.5 mm，其他三人至少 4.8 mm。',
    },
    {
      k: '印刷',
      v: '預設走數位印刷（CMYK）：形狀是向量路徑，融色是一條 29 階的向量漸層，數位機印漸層很順；紙用 350 g 以上的暖白棉紙或細紋美術紙，質感交給紙，不加假顆粒。粉彩在 CMYK 會偏，薰衣草與天空藍最容易偏灰，印前一定先打樣。四邊可刷桃玫瑰色。正面右上角是第二色跑出上緣與右緣的地方，輪廓若擦過裁切角，裁刀偏一點就留下大小不一的紙色細角，所以角上要嘛留足紙色、要嘛整個蓋住：陳念誠的色塊往內移，角上留 4 mm 紙色（上緣仍出血 3 mm、右緣 2 mm）；蕭力文、方昱晴、鄭義信的往外移，裁切角埋進墨裡 2 mm。進階選項是兩個特別色疊印（平版或孔版 riso）：兩色各自用網點漸淡、在頸部交疊，融合真的發生在紙上；但疊出來的第三色會比螢幕上的漸層更深、更灰，每批也略有不同，背面要維持桃玫瑰就得再加一個特別色，四個人的第二色也各要一個。',
    },
    {
      k: '動態',
      v: '正面兩個形狀以 11 秒一次的呼吸靠近又鬆開，頸部細到一條線又飽滿起來，從不斷開也從不合一。翻到背面，停 0.2 秒，這個人的顏色從上緣、桃色從右下角進來，0.9 秒碰到；接著 1.3 秒頸部慢慢變粗，兩色一起融成桃玫瑰；再 1 秒合成一個。它從合一前 0.5 秒開始長大 15% 並稍微往上，合一後 1.2 秒停在名字右邊，整段 4.6 秒。會合點離右緣約 10 mm、在三分之二高的地方，停好時約四分之三在紙上。翻回正面時它們才又分開。靜態與印刷稿取正面頸部最飽滿、背面合一停好的那一格。',
    },
  ],
  langs: [
    { id: 'both', label: '中英並列' },
    { id: 'zh', label: '中文' },
    { id: 'en', label: 'English' },
  ],
  stillTime: STILL,

  mount(faces, ctx) {
    const { blobs, box, ink, person, people, brand, lang } = ctx;
    const zh = lang !== 'en';
    const en = lang !== 'zh';
    const print = ctx.mode === 'print';
    const seed = person.seed ?? 11;
    const classes = ['meet-face', `meet-lang-${lang}`, ...(print ? ['meet-print'] : [])];
    const own = SECONDS[WHO[person.id] ?? ORDER[Math.max(0, people.indexOf(person)) % ORDER.length]];

    // ── the shapes ──
    const A = { ...PAIR.A, seed };
    const B = { ...PAIR.B, seed: seed + 5 };
    const A1 = { ...BACK.A, seed: seed + 2 };
    const B1 = { ...BACK.B, seed: seed + 9 };
    const mA = A1.R * A1.R;
    const mB = B1.R * B1.R;
    const meetAt = { x: (A1.x * mA + B1.x * mB) / (mA + mB), y: (A1.y * mA + B1.y * mB) / (mA + mB) };

    /** The field's low point on the line between a pair (below 0.25 they are apart). */
    const saddle = (pair, t) => {
      const [p, q] = pair;
      let m = Infinity;
      for (let i = 8; i <= 32; i++) {
        const s = i / 40;
        const f = blobs.fieldAt(pair, t, p.x + (q.x - p.x) * s, p.y + (q.y - p.y) * s);
        if (f < m) m = f;
      }
      return m;
    };
    /** The front's pair, as far into their meeting as it takes for the neck to hold `join`. */
    const frontPair = (t, join) => {
      let lo = 0;
      let hi = 0.62;
      for (let i = 0; i < 14; i++) {
        const k = (lo + hi) / 2;
        if (saddle(blobs.meeting(A, B, k), t) < join) lo = k;
        else hi = k;
      }
      return blobs.meeting(A, B, (lo + hi) / 2);
    };
    /** The outline's top and right extremes of one blob at time t. */
    const reach = (b, t) => {
      let top = Infinity;
      let right = -Infinity;
      const one = [b];
      for (let x = b.x - 1.4 * b.R; x <= b.x + 1.4 * b.R; x += 6) {
        for (let y = b.y - 1.6 * b.R; y < b.y; y += 3) {
          if (blobs.fieldAt(one, t, x, y) >= blobs.ISO) {
            top = Math.min(top, y);
            break;
          }
        }
      }
      for (let y = b.y - 1.4 * b.R; y <= b.y + 1.4 * b.R; y += 6) {
        for (let x = b.x + 1.6 * b.R; x > b.x; x -= 3) {
          if (blobs.fieldAt(one, t, x, y) >= blobs.ISO) {
            right = Math.max(right, x);
            break;
          }
        }
      }
      return { top, right };
    };
    for (let i = 0; i < 3; i++) {
      const at = frontPair(STILL, NECK_FULL)[1];
      const r = reach(at, STILL);
      B.y += -BLEED_B.top - r.top;
      B.x += 900 + BLEED_B.right - r.right;
    }
    /**
     * How far the still frame's outline passes from the corner: + when the
     * corner is under the ink, − on the paper; (ux, uy) points from the corner
     * to the nearest place where that changes.
     */
    const cornerGap = () => {
      const pair = frontPair(STILL, NECK_FULL);
      const inside = (x, y) => blobs.fieldAt(pair, STILL, x, y) >= blobs.ISO;
      const at = inside(CORNER.x, CORNER.y);
      for (let r = 1; r <= 60; r++) {
        for (let i = 0; i < 120; i++) {
          const ux = Math.cos((i / 120) * TAU);
          const uy = Math.sin((i / 120) * TAU);
          if (inside(CORNER.x + r * ux, CORNER.y + r * uy) !== at) return { d: at ? r : -r, ux, uy };
        }
      }
      return { d: at ? Infinity : -Infinity, ux: 0, uy: 0 };
    };
    const near = cornerGap().d;
    if (near > -CORNER_NEAR && near < CORNER_COVER) {
      const placed = { x: B.x, y: B.y };
      const was = frontPair(STILL, NECK_FULL);
      /**
       * Moves B until the corner is `target` from the outline, sideways (along
       * x) or along the outline's normal there. Returns how far the still
       * frame's shapes moved (the further of the two), or Infinity when the
       * move doesn't get there or costs the top or right its bleed.
       */
      const tryMove = (target, sideways) => {
        Object.assign(B, placed);
        for (let i = 0; i < 12; i++) {
          const g = cornerGap();
          const miss = target - g.d;
          if (Math.abs(miss) <= 1.5) {
            const now = frontPair(STILL, NECK_FULL);
            const r = reach(now[1], STILL);
            if (r.top > -BLEED_KEEP || r.right < 900 + BLEED_KEEP) return Infinity;
            return Math.max(...now.map((b, k) => Math.hypot(b.x - was[k].x, b.y - was[k].y)));
          }
          // The outline's outward normal: toward the corner while it is on the paper, away from it once under the ink.
          const nx = (g.d < 0 ? -1 : 1) * g.ux;
          const ny = (g.d < 0 ? -1 : 1) * g.uy;
          if (!sideways) {
            B.x += nx * miss;
            B.y += ny * miss;
          } else if (Math.abs(nx) > 0.2) {
            B.x += miss / nx;
          } else return Infinity;
        }
        return Infinity;
      };
      const moves = [];
      for (const [target, sideways] of [[-CORNER_CLEAR - CORNER_SLACK, true], [CORNER_COVER + CORNER_SLACK, false]]) {
        moves.push({ cost: tryMove(target, sideways), x: B.x, y: B.y });
      }
      const best = moves.reduce((a, b) => (b.cost < a.cost ? b : a));
      Object.assign(B, best.cost < Infinity ? { x: best.x, y: best.y } : placed);
    }

    /** The breath: fullest at stillTime (and every BREATH seconds after). */
    const breath = (t) => NECK_LOOSE + (NECK_FULL - NECK_LOOSE) * (0.5 + 0.5 * Math.cos((2 * Math.PI * (t - STILL)) / BREATH));

    const frontState = (t, join) => {
      const [a, b] = frontPair(t, join);
      return [
        { ...a, lab: PEACH },
        { ...b, lab: own.lab },
      ];
    };
    /** How far into blobs.meeting() the back's pair must be for its neck to hold `join` (at the still frame's shapes). */
    const kFor = (join) => {
      let lo = 0.3;
      let hi = 0.8;
      for (let i = 0; i < 16; i++) {
        const k = (lo + hi) / 2;
        if (saddle(blobs.meeting(A1, B1, k), STILL) < join) lo = k;
        else hi = k;
      }
      return (lo + hi) / 2;
    };
    const kTouch = kFor(TOUCH);
    const kJoined = kFor(JOINED);
    /**
     * Progress p (seconds) → k: eased keyframes (Hermite) through the touch and
     * the joined neck, slow between them, so the meeting itself is what lingers.
     */
    const neckPace = (kJoined - kTouch) / NECK;
    const KEYS = [
      [0, 0, 0],
      [APPROACH, kTouch, neckPace],
      [APPROACH + NECK, kJoined, neckPace],
      [FUSE, 1, 0],
    ];
    const kAt = (p) => {
      if (p <= 0) return 0;
      if (p >= FUSE) return 1;
      let i = 0;
      while (p > KEYS[i + 1][0]) i++;
      const [p0, k0, v0] = KEYS[i];
      const [p1, k1, v1] = KEYS[i + 1];
      const h = p1 - p0;
      const x = (p - p0) / h;
      const x2 = x * x;
      const x3 = x2 * x;
      return (2 * x3 - 3 * x2 + 1) * k0 + (x3 - 2 * x2 + x) * h * v0 + (-2 * x3 + 3 * x2) * k1 + (x3 - x2) * h * v1;
    };
    /**
     * The back at progress p (seconds into the fusion): from just before they
     * touch until the neck is full, both colours turn into the fused one; the
     * one they become grows by GROW as it settles into REST, then breathes.
     */
    const backState = (t, p) => {
      const k = kAt(p);
      const u = blobs.smoothstep((p - (FUSE - 0.5)) / (SETTLE + 0.5));
      const sx = (BACK.REST.x - meetAt.x) * u;
      const sy = (BACK.REST.y - meetAt.y) * u;
      const after = p - FUSE - SETTLE;
      const breathe = after > 0 ? 1 + 0.025 * Math.sin((2 * Math.PI * after) / 9) : 1;
      const grow = (1 + GROW * u) * breathe;
      const melt = blobs.smoothstep((p - APPROACH + 0.1) / (NECK + 0.6));
      const [a, b] = blobs.meeting(A1, B1, k);
      return [
        { ...a, x: a.x + sx, y: a.y + sy, R: a.R * grow, lab: mixLch(PEACH, FUSED, melt) },
        { ...b, x: b.x + sx, y: b.y + sy, R: b.R * grow, lab: mixInk(own.lab, FUSED, melt, own.toFused ?? 0, own.dip) },
      ];
    };

    // ── words ──
    const markColour = print ? ink.text : ink.terracotta;
    faces.front.content.innerHTML = frontHtml({ brand, zh, en, mark: ctx.waveMark(markColour, 1.7) });
    faces.back.content.innerHTML = backHtml({ person, brand, zh, en, qr: ctx.qrSvg(ctx.url, { color: ink.text }) });
    for (const f of [faces.front, faces.back]) f.root.classList.add(...classes);
    const clear = () => {
      for (const f of [faces.front, faces.back]) {
        f.art.textContent = '';
        f.content.textContent = '';
        f.root.classList.remove(...classes);
      }
    };

    // ── still and print: vector ──
    if (!ctx.live) {
      const tracer = makeTracer(blobs, box, 2.5);
      const grain = print ? 0 : 0.1 * ctx.grain;
      const uid = `meet${Math.random().toString(36).slice(2, 8)}`;
      ctx.loop((t) => {
        const front = frontState(t, NECK_FULL);
        const back = backState(t, FUSE + SETTLE);
        faces.front.art.innerHTML = meltSvg(tracer(front, t), gradientOf(front, own), { box, grain, id: `${uid}f` });
        faces.back.art.innerHTML = meltSvg(tracer(back, t), gradientOf(back, own), { box, grain, id: `${uid}b` });
      });
      return { destroy: clear };
    }

    // ── live ──
    const grainStrength = 0.16 * ctx.grain;
    const tile = grainStrength > 0 ? grainTile(blobs.makePrng) : null;
    const front = meltCanvas(faces.front.art, { box, grain: grainStrength, tile });
    const back = meltCanvas(faces.back.art, { box, grain: grainStrength, tile });
    const tracer = makeTracer(blobs, box, 5);

    // Our own clock: real seconds, so the meeting keeps its pace when frames come slowly;
    // a gap of more than a quarter second (the tab was hidden, the card scrolled away) is a pause.
    let clock = STILL;
    let wall = 0;
    // The side the faces are answering (a turn counts once it has held SETTLE_SIDE).
    let side = ctx.side;
    let pending = null;
    // The meeting waits for the type (at most 4 s): a card that opens on its back doesn't play it while the fonts come in.
    let typeReady = !document.fonts;
    document.fonts?.ready.then(() => (typeReady = true));
    const typeLate = setTimeout(() => (typeReady = true), 4000);
    // The back's fusion: when it started and from what progress; when it was left and how far it had got.
    let fuseStart = 0;
    let fuseFrom = 0;
    let fuseDelay = FUSE_DELAY;
    let leftAt = -Infinity;
    let leftAtP = 0;
    // The front's parting: when it started and from which join.
    let partFrom = null;
    let partJoin = NECK_PARTING;

    /** How far the back's fusion is at time t; while the front shows, it unwinds as the pair parts. */
    const backP = (t) => {
      if (side === 'back') return fuseFrom + Math.max(0, t - fuseStart - fuseDelay);
      return leftAtP * (1 - easeOut((t - leftAt) / PART));
    };
    /** How strongly the front's pair is joined at time t: a parting (after the back) eases into the breath. */
    const frontJoin = (t) => {
      const b = breath(t);
      if (side === 'back') return blobs.lerp(b, NECK_PARTING, clamp01(backP(t) / FUSE));
      if (partFrom === null) return b;
      const u = easeOut((t - partFrom) / PART);
      if (u >= 1) partFrom = null;
      return partJoin + (b - partJoin) * u;
    };
    const commit = (next) => {
      if (next === side) return;
      if (next === 'back') {
        fuseFrom = backP(clock);
        fuseDelay = fuseFrom > 0.05 ? 0 : FUSE_DELAY;
        fuseStart = clock;
        partFrom = null;
      } else {
        leftAtP = Math.min(backP(clock), FUSE + SETTLE);
        leftAt = clock;
        partJoin = blobs.lerp(breath(clock), NECK_PARTING, clamp01(leftAtP / FUSE));
        partFrom = clock;
      }
      side = next;
    };

    const drawFront = (t) => {
      const s = frontState(t, frontJoin(t));
      front.draw(tracer(s, t), gradientOf(s, own));
    };
    const drawBack = (t) => {
      const s = backState(t, backP(t));
      back.draw(tracer(s, t), gradientOf(s, own));
    };

    const stopLoop = ctx.loop(() => {
      const ms = performance.now();
      if (wall) {
        const gap = (ms - wall) / 1000;
        clock += gap > 0.25 ? 1 / 30 : gap;
      }
      wall = ms;
      if (pending && typeReady && ms - pending.ms >= SETTLE_SIDE * 1000) {
        commit(pending.side);
        pending = null;
      }
      if (ctx.side === 'back') drawBack(clock);
      else drawFront(clock);
    });
    drawFront(clock);
    drawBack(clock);
    const offSide = ctx.onSide((next) => {
      pending = { side: next, ms: performance.now() };
    });

    return {
      destroy() {
        clearTimeout(typeLate);
        stopLoop();
        offSide();
        front.destroy();
        back.destroy();
        clear();
      },
    };
  },
};

// ── drawing ────────────────────────────────────────────────────────────

/** The outline of a pair at time t (its union, the hero's metaball field) as traced loops. */
function makeTracer(blobs, box, cell) {
  const grid = blobs.makeGrid(box, cell);
  return (pair, t) => {
    blobs.sampleField(pair, t, grid);
    return blobs.traceContours(grid, blobs.ISO);
  };
}

/** Loops as SVG path data: quadratic curves through each polygon's midpoints (the hero's smoothing). */
function pathOf(loops) {
  const f = (x) => Math.round(x * 10) / 10;
  let d = '';
  for (const l of loops) {
    const n = l.length / 2;
    const mx = (i) => (l[2 * i] + l[2 * ((i + 1) % n)]) / 2;
    const my = (i) => (l[2 * i + 1] + l[2 * ((i + 1) % n) + 1]) / 2;
    d += `M${f(mx(n - 1))} ${f(my(n - 1))}`;
    for (let i = 0; i < n; i++) d += `Q${f(l[2 * i])} ${f(l[2 * i + 1])} ${f(mx(i))} ${f(my(i))}`;
    d += 'Z';
  }
  return d;
}

/**
 * The pair as an SVG (still card and print file): one vector path, filled
 * with one vector gradient along the line between the two centres. A press
 * file a digital press prints as it is.
 */
function meltSvg(loops, grad, { box, grain = 0, id }) {
  const vb = `${box.x} ${box.y} ${box.w} ${box.h}`;
  const open = `<svg class="meet-blobs" viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">`;
  if (!loops.length) return open + '</svg>';
  const d = pathOf(loops);
  const f = (x) => Math.round(x * 10) / 10;
  let body;
  if (grad.flat) {
    body = `<path d="${d}" fill="${grad.flat}" fill-rule="evenodd"/>`;
  } else {
    const stops = grad.stops.map(([s, c]) => `<stop offset="${s.toFixed(3)}" stop-color="${c}"/>`).join('');
    body =
      `<defs><linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="${f(grad.x1)}" y1="${f(grad.y1)}" x2="${f(grad.x2)}" y2="${f(grad.y2)}">${stops}</linearGradient></defs>` +
      `<path d="${d}" fill="url(#${id}g)" fill-rule="evenodd"/>`;
  }
  if (grain > 0) {
    body +=
      `<filter id="${id}n" x="0" y="0" width="100%" height="100%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" seed="3"/>` +
      `<feColorMatrix type="saturate" values="0"/>` +
      `<feComponentTransfer><feFuncA type="linear" slope="${grain}"/></feComponentTransfer>` +
      `<feComposite in2="SourceGraphic" operator="in"/></filter>` +
      `<path d="${d}" fill="#000" fill-rule="evenodd" filter="url(#${id}n)"/>`;
  }
  return open + body + '</svg>';
}

/** Sand for the screen (the hero's recipe): one-pixel grains, half darker, half lighter, mostly faint. */
function grainTile(makePrng) {
  const size = 160;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const d = img.data;
  const rand = makePrng(4242);
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

/**
 * A canvas over the art layer that draws the pair the way meltSvg does. It
 * sizes itself from the layer's layout box (offsetWidth/Height), which a 3D
 * turn doesn't change, so the buffer isn't reallocated as the card turns.
 */
function meltCanvas(host, { box, grain = 0, tile = null }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'meet-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const g = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let dpr = 1;
  let pattern = null;
  const fit = () => {
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    if (!w || !h) return false;
    const d = Math.min(2.5, window.devicePixelRatio || 1);
    if (w === W && h === H && d === dpr) return true;
    W = w;
    H = h;
    dpr = d;
    canvas.width = Math.round(w * d);
    canvas.height = Math.round(h * d);
    pattern = null;
    return true;
  };
  return {
    canvas,
    draw(loops, grad) {
      if (!fit()) return;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, canvas.width, canvas.height);
      if (!loops.length) return;
      const sx = canvas.width / box.w;
      const sy = canvas.height / box.h;
      g.setTransform(sx, 0, 0, sy, -box.x * sx, -box.y * sy);
      if (grad.flat) {
        g.fillStyle = grad.flat;
      } else {
        const fill = g.createLinearGradient(grad.x1, grad.y1, grad.x2, grad.y2);
        for (const [s, c] of grad.stops) fill.addColorStop(s, c);
        g.fillStyle = fill;
      }
      g.fill(new Path2D(pathOf(loops)), 'evenodd');
      if (grain > 0 && tile) {
        // One grain per CSS pixel, unsmoothed, only where there is ink.
        pattern = pattern || g.createPattern(tile, 'repeat');
        const px = Math.max(1, Math.round(dpr));
        g.setTransform(px, 0, 0, px, 0, 0);
        g.imageSmoothingEnabled = false;
        g.globalAlpha = grain;
        g.globalCompositeOperation = 'source-atop';
        g.fillStyle = pattern;
        g.fillRect(0, 0, canvas.width / px, canvas.height / px);
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    },
    destroy() {
      canvas.remove();
    },
  };
}

// ── words ──────────────────────────────────────────────────────────────

function frontHtml({ brand, zh, en, mark }) {
  const word =
    (zh ? `<span class="meet-word-zh" lang="zh-Hant">${esc(brand.name.zh)}</span>` : '') +
    (en ? `<span class="meet-word-en" lang="en">${esc(brand.name.en)}</span>` : '');
  const line =
    (zh ? `<span class="meet-line-zh" lang="zh-Hant">${esc(brand.headline.zh)}</span>` : '') +
    (en ? `<span class="meet-line-en" lang="en">${esc(brand.headline.en)}</span>` : '');
  return (
    `<div class="meet-mark"><span class="meet-wave">${mark}</span>${word}</div>` +
    `<p class="meet-line">${line}</p>`
  );
}

function backHtml({ person, brand, zh, en, qr }) {
  const name =
    (zh ? `<span class="meet-name-zh" lang="zh-Hant">${esc(person.zh)}</span>` : '') +
    (en ? `<span class="meet-name-en" lang="en">${esc(person.en)}</span>` : '');
  const team =
    (zh ? `<span class="meet-team-zh" lang="zh-Hant">${esc(brand.team.zh)}</span>` : '') +
    (en ? `<span class="meet-team-en" lang="en">${esc(brand.team.en)}</span>` : '');
  return (
    `<div class="meet-who"><h3 class="meet-name">${name}</h3><p class="meet-team">${team}</p></div>` +
    `<div class="meet-reach">` +
    `<div class="meet-qr">${qr}</div>` +
    `<p class="meet-contact"><span>${esc(person.email)}</span><span>${esc(brand.site)}</span></p>` +
    `</div>`
  );
}
