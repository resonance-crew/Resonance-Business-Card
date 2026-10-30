/**
 * Direction D 相遇＋融合 / Paper Friends: the team's card.
 *
 * B 兩面's two faces (the Chinese name down a column with its seal; the English name with the QR code: the
 * type is facets.js's own, laid out by facets.css) with the Resonance site's paper puppets on them. The
 * card's own puppet stands on the Chinese face, the next teammate's on the English face (the team's cards
 * pass one to the next, so the five of them make a ring), and the two wave to each other across the long
 * edge the faces share: three wavy pencil lines, the mark's three waves, run round that edge from one face
 * to the other, the same line on both sides of it.
 *
 * The fusion stays, smaller: on the Chinese face two small blobs (peach and lavender) have melted into one,
 * painted as B paints its melt (peach handing over to lavender through a warm blush); and one blob runs round
 * the card's other long edge, its centre on that edge (the same centre, size, seed and moment on both faces,
 * so it crosses the edge at the same place from either side), in a theme ink neither puppet on the card wears.
 *
 * Geometry. The card turns about its vertical axis, so the front's right edge is the back's left and the
 * front's left the back's right. The face in front has the waves on its right edge and the blob on its left;
 * the face behind, the other way round. 「中文面在前」 and 「英文面在前」 are mirror layouts of the same faces
 * (as in B): every x below is for the Chinese face in front, and mirrors when it is behind.
 *
 * Each puppet is placed by what it draws (js/puppet.js reach): its waving mitten stops HAND_GAP short of the
 * waves at both ends of the wave, whichever puppet it is, so a teammate who picks a wider one keeps clear too.
 */
import { zhFace, enFace, typeIn, grainTile } from './facets.js';
import { puppetEl, reach } from '../js/puppet.js';

const TAU = Math.PI * 2;
/** The moment the still card and the print file show (s). */
const STILL_TIME = 7.5;
const W = 54;

/** Tuck's body height (mm); the others keep the series' sizes, closer together (js/puppet.js mmPerUnit). */
const PUPPET_MM = 20;
/** Where both puppets stand (mm from the top). */
const GROUND = 68;
/** The waving arm: the one on the waves' side, swung between two angles (degrees; 0 = pointing right, 90 = down). */
const WAVE_ARM = { r: [-35, -65], l: [215, 245] };
/** The body leans toward the waves (degrees), and the face slides that way (rig units). */
const LEAN = 4;
const LOOK = 10;

/** The waves run this far into each face from the shared edge (mm), and stop this far short of a mitten. */
const WAVE_REACH = 6;
const HAND_GAP = 2.5;
/** Three lines 1.7 mm apart, each a wave 0.55 mm high and 4.2 mm long, drawn 0.3 mm wide in terracotta. */
const WAVE_GAP = 1.7;
const WAVE_AMP = 0.55;
const WAVE_LEN = 4.2;
const WAVE_STROKE = 0.3;
/** Their height: between the two raised mittens, kept inside this band (mm). */
const WAVE_Y = [48, 58];

/** The two small blobs on the Chinese face (0.1 mm, the Chinese face in front), and how far they have melted. */
const PAIR = [
  { x: 320, y: 140, R: 62, seed: 5 },
  { x: 470, y: 260, R: 50, seed: 9 },
];
/** blobs.meeting's k: 0 apart, ½ a neck, 1 one blob. The still card and print show MELT; the screen melts from MELT_FROM. */
const MELT = 0.8;
const MELT_FROM = 0.3;
const PEACH = 'oklch(88% 0.08 55)';
/** B's hand-over: the chroma eased to this in the middle, the hue turning this far behind (facets.js inkSet). */
const MID_CHROMA = 0.85;
const HUE_LAG = 1.4;

/**
 * The blob round the other long edge: one organic blob drawn out into a longish oval and leaning across that edge
 * (in 0.1 mm, `u` across the edge as if the card lay open: + into the English face, − into the Chinese face; `y`
 * down the card). Its upper end leans into the English face, filling the open paper above it, its lower end into
 * the Chinese face, so the Chinese face's part sits low. Slid across the edge by how much open paper each face
 * has beside it (EDGE_SHARE), it is the same shape cut by the same edge on both faces, so the two parts meet.
 */
const EDGE_OVAL = { y: 552, R: 84, seed: 13, stretch: [0.78, 1.42], tilt: 26 };
/** The English face's share of the oval's width goes as (its open paper)^EDGE_SHARE over both; each face keeps EDGE_MIN mm. */
const EDGE_SHARE = 1.5;
const EDGE_MIN = 4.5;

/**
 * How strongly the blobs are laid on the paper (each ink mixed with the paper by this much). The puppets and the
 * waves carry the card; the blobs are its ground, and the blob round the edge (one colour over a larger area)
 * is the quietest. `soft` is the card; `original` (as B laid them, when the blob was the card's subject) and
 * `softer` are for the proof sheet (tools/tint-proof.html), to choose on the real paper. Even `softer` keeps
 * every ink well above the faintest tint a digital press holds evenly.
 */
export const TINTS = {
  original: { label: '原本', peach: 0.95, lavender: 0.78, edge: 0.9 },
  soft: { label: '建議', peach: 0.66, lavender: 0.55, edge: 0.48 },
  softer: { label: '更淡', peach: 0.5, lavender: 0.42, edge: 0.36 },
};

/** Sand on the screen's blobs, as B lays it (the viewer's toggle scales it); print never has it. */
const GRAIN = 0.18;
/** The edge blob's ink: the first of these that neither puppet on the card wears. */
const EDGE_INKS = ['sky', 'sage', 'yellow'];
const WEARS = { tuck: 'sage', tag: 'sky', card: 'lavender', dot: 'yellow', night: 'sky' };

/** On screen: the melt and the hello start this long after a face comes into view (s), and the melt takes MEET_TIME. */
const ARRIVE_DELAY = 0.9;
const TURN_DELAY = 0.3;
const MEET_TIME = 2.6;
const FONT_WAIT = 8000;

const direction = {
  id: 'friends',
  letter: 'D',
  name: '相遇＋融合',
  enName: 'Paper Friends',
  orientation: 'portrait',
  radiusMm: 0,
  thicknessMm: 0.8,
  turnDir: -1,
  proofSpread: true,
  pitch: '兩面的版面，加上官網的紙偶：中文面是自己的那一隻、英文面是下一位隊友的，牠們隔著共用的長邊揮手，三條波浪線繞過那條邊；融合留在小地方：中文面右上兩團小泡泡融成一團，另一條長邊有一團泡泡穿過去',
  notes: [
    {
      k: '概念',
      v: '每張名片有兩隻紙偶：中文面是自己的，英文面是團隊名單上下一位的，五張名片接成一圈。牠們隔著共用的長邊打招呼，中間三條波浪線就是標誌的三道波，從一面繞過那條邊接到另一面。B 的融合縮小留下：中文面右上一對小泡泡融成一團；另一條長邊有一團斜躺的橢圓泡泡穿過，上端伸進英文面、下端落在中文面，哪一面紙偶旁邊的空白多，那一面就露出多一點',
    },
    {
      k: '位置',
      v: '兩隻都站在離頂端 68 mm 的地方；揮手那隻手套離波浪線 2.5 mm，依每隻實際畫到的範圍擺放，換成比較寬或比較瘦的紙偶也不會碰到。波浪線從長邊往兩面各伸 6 mm，高度在兩隻舉起的手套之間',
    },
    {
      k: '顏色',
      v: '右上的一對是桃色和薰衣草，像 B 一樣經過暖粉過渡；穿過另一條長邊的泡泡，用這張名片兩隻紙偶都沒穿的那個主題色（天空藍、鼠尾草綠、奶油黃依序挑）。泡泡現在是背景，所以比 B 淡：右上一對約七成，長邊那團（一大塊同一色）再淡一些',
    },
    {
      k: '印刷',
      v: '螢幕上的泡泡有 B 的沙沙顆粒，印刷不做。泡泡和波浪線是向量，紙偶是全尺寸的點陣圖（約 360 dpi 以上），只能走數位 CMYK。米色手套在米色紙上偏淡，正式印之前請在實際的紙上打樣：tools/tint-proof.mjs 印出一張 A4，三種濃淡並排，挑一排再印',
    },
    {
      k: '動態',
      v: '一面轉到眼前，右上兩團從分開慢慢融成一團（約 2.6 秒），那一面的紙偶揮三下手，波浪線一明一滅兩次；之後只偶爾眨眼',
    },
  ],
  langs: [
    { id: 'zh-first', label: '中文面在前' },
    { id: 'en-first', label: '英文面在前' },
  ],
  stillTime: STILL_TIME,

  mount(faces, ctx) {
    return mountCard(faces, ctx, TINTS.soft);
  },
};
export default direction;

/** The direction laid at another strength (TINTS), for the proof sheet. */
export function withTint(id) {
  return { ...direction, mount: (faces, ctx) => mountCard(faces, ctx, TINTS[id]) };
}

function mountCard(faces, ctx, tint) {
  const B = ctx.blobs;
  const { box, ink, person, people } = ctx;
  const zhFirst = ctx.lang !== 'en-first';
  const face = { zh: zhFirst ? faces.front : faces.back, en: zhFirst ? faces.back : faces.front };
  const zhSide = zhFirst ? 'front' : 'back';
  /** The face in front has the waves on its right edge; the one behind, on its left. */
  const wavesRight = { zh: zhFirst, en: !zhFirst };

  for (const k of ['zh', 'en']) {
    const root = face[k].root;
    root.classList.add('fct', `fct--${k}`, `fct--edge-${wavesRight[k] ? 'r' : 'l'}`, 'frd');
    if (ctx.mode === 'print') root.classList.add('fct--print');
    if (ctx.live) root.classList.add('frd--live');
  }
  face.zh.content.innerHTML = zhFace(ctx);
  face.en.content.innerHTML = enFace(ctx);
  const typeLoaded = ctx.typeReady ?? typeIn(ctx);

  // This card's puppet on the Chinese face, the next teammate's on the English face (unless they picked their own).
  const i = people.findIndex((p) => p.id === person.id);
  const slug = { zh: person.puppet ?? 'tuck', en: person.backPuppet ?? people[(i + 1) % people.length].puppet ?? 'tag' };

  // Each waves the arm on the waves' side, placed so that mitten stops HAND_GAP short of them.
  const poseOf = (k) => {
    const right = wavesRight[k];
    const arm = right ? 'r' : 'l';
    const o = {
      at: [W / 2, GROUND],
      heightMm: PUPPET_MM,
      arms: { [arm]: WAVE_ARM[arm][0] },
      wave: { arm, to: WAVE_ARM[arm][1] },
      tilt: right ? LEAN : -LEAN,
      face: [right ? LOOK : -LOOK, 0],
      blinkDelay: k === 'zh' ? 0 : 2.3,
    };
    const r = reach(slug[k], o);
    const dx = right ? W - WAVE_REACH - HAND_GAP - r.right : WAVE_REACH + HAND_GAP - r.left;
    o.at = [o.at[0] + dx, GROUND];
    o.hand = [r.hand[0] + dx, r.hand[1]];
    o.span = [r.left + dx, r.right + dx];
    return o;
  };
  const pose = { zh: poseOf('zh'), en: poseOf('en') };
  const waveY = Math.min(WAVE_Y[1], Math.max(WAVE_Y[0], (pose.zh.hand[1] + pose.en.hand[1]) / 2));

  const worn = [WEARS[slug.zh], WEARS[slug.en]];
  const edgeInk = ink[EDGE_INKS.find((c) => !worn.includes(c)) ?? EDGE_INKS[0]];
  const handTo = handover(B, ink.paper, { color: PEACH, alpha: tint.peach }, { color: ink.lavender, alpha: tint.lavender });
  const handStops = Array.from({ length: 17 }, (_, i) => [i / 16, handTo(i / 16)]);

  // The blob round the other long edge. Each face's open paper beside it: from that edge to its puppet.
  const room = {};
  for (const k of ['zh', 'en']) room[k] = wavesRight[k] ? pose[k].span[0] : W - pose[k].span[1];
  const oval = edgeOval(B, room);
  const edgeShape = (k) => {
    // A point `u` across the edge lands `into` inside face k, measured from that face's edge (0.1 mm).
    const d = oval.place((u, y) => {
      const into = k === 'en' ? u : -u;
      return [wavesRight[k] ? into : W * 10 - into, y];
    });
    return { d, fill: onPaper(B, ink.paper, edgeInk, tint.edge) };
  };
  const edge = { zh: edgeShape('zh'), en: edgeShape('en') };
  // The melted pair on the Chinese face (mirrored when that face is behind), handed over across its length.
  const pairAt = PAIR.map((b) => (wavesRight.zh ? b : { ...b, x: W * 10 - b.x }));
  const pairShape = (k, t, cell) => {
    const [A, C] = B.meeting(pairAt[0], pairAt[1], k);
    const d = Math.hypot(C.x - A.x, C.y - A.y) || 1;
    const [ux, uy] = [(C.x - A.x) / d, (C.y - A.y) / d];
    return {
      d: B.outlinePath([A, C], t, box, cell),
      fill: { x1: A.x - ux * A.R * 0.6, y1: A.y - uy * A.R * 0.6, x2: C.x + ux * C.R * 0.6, y2: C.y + uy * C.R * 0.6, stops: handStops },
    };
  };

  // Each face's art, back to front: its blobs (vector for the press; on screen a canvas with B's sand), the
  // waves, the puppet.
  const art = {};
  for (const k of ['zh', 'en']) {
    const host = face[k].art;
    host.textContent = '';
    art[k] = ctx.mode === 'print' ? svgLayer(host, box) : canvasLayer(B, host, box, GRAIN * ctx.grain);
    host.insertAdjacentHTML('beforeend', wavesSvg(wavesRight[k], waveY, ink.terracotta));
    const layer = document.createElement('div');
    layer.className = 'frd-pups';
    layer.appendChild(puppetEl(slug[k], pose[k]));
    host.appendChild(layer);
  }
  art.en.draw([edge.en]);
  const drawZh = (k, t, cell = 3) => art.zh.draw([edge.zh, pairShape(k, t, cell)]);
  const done = () => {
    art.zh.destroy();
    art.en.destroy();
    clear(face);
  };

  if (!ctx.live) {
    drawZh(MELT, STILL_TIME);
    return { destroy: done };
  }

  // ── screen: the face in view melts its pair (the Chinese face) and says hello ──
  let showing = ctx.side === zhSide ? 'zh' : 'en';
  let clock = null;
  let meltAt = Infinity;
  let gone = false;
  const hello = (k) => {
    const root = face[k].root;
    root.classList.remove('frd--hello');
    void root.offsetWidth;
    root.classList.add('frd--hello');
  };
  const cue = (k, delay) => {
    if (k === 'zh') meltAt = (clock ?? 0) + delay;
    setTimeout(() => !gone && showing === k && hello(k), delay * 1000);
  };
  let settled = false;
  Promise.race([typeLoaded, new Promise((r) => setTimeout(r, FONT_WAIT))]).then(() => {
    if (gone) return;
    settled = true;
    cue(showing, ARRIVE_DELAY);
  });
  const stop = ctx.loop((t) => {
    clock = t;
    if (showing !== 'zh') return;
    const m = Math.max(0, Math.min(1, (t - meltAt) / MEET_TIME));
    drawZh(MELT_FROM + (MELT - MELT_FROM) * B.smoothstep(m), t, 4);
  });
  drawZh(MELT_FROM, STILL_TIME);
  const offSide = ctx.onSide((side) => {
    const k = side === zhSide ? 'zh' : 'en';
    if (k === showing) return;
    showing = k;
    face.zh.root.classList.remove('frd--hello');
    face.en.root.classList.remove('frd--hello');
    if (k === 'zh') meltAt = Infinity;
    if (settled) cue(k, TURN_DELAY);
  });

  return {
    destroy() {
      gone = true;
      stop();
      offSide();
      done();
    },
  };
}

/**
 * Two blobs melted into one shape, painted as B paints its melt: one ink handing over to the other through a
 * warm blush, never the grey their overprint would make (lightness and chroma straight across, the chroma
 * eased to MID_CHROMA in the middle, the hue the short way round, HUE_LAG behind). Returns the colour at a share.
 */
function handover(B, paperCss, a, b) {
  const paper = B.parseOklch(paperCss);
  const onPaper = ({ color, alpha }) => B.parseOklch(color).map((c, i) => paper[i] + (c - paper[i]) * alpha);
  const lch = ([L, x, y]) => [L, Math.hypot(x, y), Math.atan2(y, x)];
  const [L1, C1, h1] = lch(onPaper(a));
  const [L2, C2, h2] = lch(onPaper(b));
  const dh = ((((h2 - h1 + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  return (v) => {
    const L = L1 + (L2 - L1) * v;
    const C = (C1 + (C2 - C1) * v) * (1 - (1 - MID_CHROMA) * 4 * v * (1 - v));
    const h = h1 + dh * v ** HUE_LAG;
    return B.rgbHex(B.oklabToRgb([L, C * Math.cos(h), C * Math.sin(h)]));
  };
}

/**
 * The edge oval laid open across the edge (u = 0): its outline, turned by its tilt and slid along u so the
 * English face holds its share of the width (EDGE_SHARE), each face at least EDGE_MIN mm. `place(map)` writes
 * the path data with every point passed through map(u, y) (0.1 mm).
 */
function edgeOval(B, room) {
  const { R, seed, stretch, tilt } = EDGE_OVAL;
  const d = B.outlinePath([{ x: 0, y: 0, R, seed, stretch }], STILL_TIME, { x: -400, y: -400, w: 800, h: 800 }, 3);
  // Turned clockwise by the tilt (y runs down), so its upper end leans toward +u.
  const a = (tilt * Math.PI) / 180;
  const turn = (x, y) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const pair = /(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g;
  const us = [...d.matchAll(pair)].map(([, x, y]) => turn(+x, +y)[0]);
  const [lo, hi] = [Math.min(...us) / 10, Math.max(...us) / 10];
  const en = room.en ** EDGE_SHARE;
  const zh = room.zh ** EDGE_SHARE;
  const width = hi - lo;
  const enWidth = Math.min(width - EDGE_MIN, Math.max(EDGE_MIN, (width * en) / (en + zh || 1)));
  const uc = (enWidth - hi) * 10;
  return {
    place(map) {
      return d.replace(pair, (_, x, y) => {
        const [u, v] = turn(+x, +y);
        return map(u + uc, v + EDGE_OVAL.y)
          .map((n) => n.toFixed(1))
          .join(' ');
      });
    },
  };
}

/** A colour laid on the paper at `alpha` (as the blob engine mixes an ink with the paper), as hex. */
function onPaper(B, paperCss, colour, alpha) {
  const paper = B.parseOklch(paperCss);
  return B.rgbHex(B.oklabToRgb(B.parseOklch(colour).map((c, i) => paper[i] + (c - paper[i]) * alpha)));
}

/*
 * A face's blobs, drawn from shapes: { d (path data in 0.1 mm), fill: a colour, or a linear hand-over
 * { x1, y1, x2, y2, stops: [[share, colour]] } }. For the press, vector (svgLayer); on screen, a canvas with
 * B's sand laid inside each shape (canvasLayer, facets.js canvasArt's recipe: one grain per CSS pixel).
 */
let ids = 0;
function svgLayer(host, box) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('class', 'frd-art');
  el.setAttribute('viewBox', `${box.x} ${box.y} ${box.w} ${box.h}`);
  el.setAttribute('preserveAspectRatio', 'none');
  el.setAttribute('aria-hidden', 'true');
  host.appendChild(el);
  const f = (n) => n.toFixed(1);
  return {
    draw(shapes) {
      el.innerHTML = shapes
        .map(({ d, fill }) => {
          if (typeof fill === 'string') return `<path d="${d}" fill="${fill}" fill-rule="evenodd"/>`;
          const id = `frd-hand-${++ids}`;
          const stops = fill.stops.map(([s, c]) => `<stop offset="${s.toFixed(4)}" stop-color="${c}"/>`).join('');
          return (
            `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(fill.x1)}" y1="${f(fill.y1)}" x2="${f(fill.x2)}" y2="${f(fill.y2)}">${stops}</linearGradient></defs>` +
            `<path d="${d}" fill="url(#${id})" fill-rule="evenodd"/>`
          );
        })
        .join('');
    },
    destroy() {},
  };
}

function canvasLayer(B, host, box, grain) {
  const canvas = document.createElement('canvas');
  canvas.className = 'frd-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const g = canvas.getContext('2d');
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
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.clearRect(0, 0, canvas.width, canvas.height);
    const sx = canvas.width / box.w;
    const sy = canvas.height / box.h;
    for (const { d, fill } of last) {
      g.save();
      g.setTransform(sx, 0, 0, sy, -box.x * sx, -box.y * sy);
      g.clip(new Path2D(d), 'evenodd');
      if (typeof fill === 'string') g.fillStyle = fill;
      else {
        const grad = g.createLinearGradient(fill.x1, fill.y1, fill.x2, fill.y2);
        for (const [s, c] of fill.stops) grad.addColorStop(s, c);
        g.fillStyle = grad;
      }
      g.fillRect(box.x, box.y, box.w, box.h);
      if (grain > 0) {
        pattern = pattern || g.createPattern(grainTile(B), 'repeat');
        const px = Math.max(1, Math.round(dpr));
        g.setTransform(px, 0, 0, px, 0, 0);
        g.imageSmoothingEnabled = false;
        g.globalAlpha = grain;
        g.fillStyle = pattern;
        g.fillRect(0, 0, canvas.width / px, canvas.height / px);
      }
      g.restore();
    }
  };
  // A still frame is drawn once: draw it again when the card changes size (or had none yet).
  const ro = new ResizeObserver(() => paint());
  ro.observe(host);
  return {
    draw(shapes) {
      last = shapes;
      paint();
    },
    destroy() {
      ro.disconnect();
      canvas.remove();
    },
  };
}

/**
 * The three waves crossing the shared edge, in the face's own millimetres (bleed included). Each line is one
 * curve along the card as if laid open (x on the face in front, W + x on the face behind), so the line leaves
 * one face and goes on on the other exactly where it left.
 */
function wavesSvg(right, y0, colour) {
  const [x0, x1] = right ? [W - WAVE_REACH, W + 2] : [-2, WAVE_REACH];
  const lines = [-WAVE_GAP, 0, WAVE_GAP].map((dy, i) => {
    const pts = [];
    for (let x = x0; x <= x1 + 1e-6; x += 0.2) {
      const X = right ? x : W + x;
      const y = y0 + dy + WAVE_AMP * Math.sin((TAU * X) / WAVE_LEN + i * 0.2);
      pts.push(`${x.toFixed(2)},${y.toFixed(3)}`);
    }
    return `<polyline points="${pts.join(' ')}"/>`;
  });
  return (
    `<svg class="frd-art frd-waves" viewBox="-2 -2 ${W + 4} 94" preserveAspectRatio="none" aria-hidden="true">` +
    `<g fill="none" stroke="${colour}" stroke-width="${WAVE_STROKE}" stroke-linecap="round" stroke-linejoin="round">${lines.join('')}</g></svg>`
  );
}

function clear(face) {
  for (const f of [face.zh, face.en]) {
    f.root.classList.remove(...[...f.root.classList].filter((c) => c === 'fct' || c === 'frd' || c.startsWith('fct--') || c.startsWith('frd--')));
    f.content.textContent = '';
    f.art.textContent = '';
  }
}
