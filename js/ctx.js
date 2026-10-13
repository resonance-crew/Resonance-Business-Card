/**
 * What a direction gets to draw with (the `ctx` of the contract in app.js),
 * shared by the proposal page (app.js) and the recipient's page (share.js).
 *
 *   mode      'live' (on screen, moving) | 'still' (on screen, one frame) | 'print' (for the press)
 *   person    one of PEOPLE;  brand, ink: the shared copy and palette
 *   lang      the language option picked (one of the direction's langs ids)
 *   grain     0–1, sand on the blobs (always 0 in print)
 *   pose      the still/print frame picked, when the direction offers poses ([{ id, label }]; the first is the default)
 *   trim      [w, h] in mm;  bleed: 2 (mm);  box: the art layer in design units (0.1 mm), bleed included
 *   blobs     js/blobs.js;  qrSvg(text, opts);  waveMark(color, width)
 *   url       what the QR code opens (the person's digital card, card.html#<id>)
 *   loop(fn)  live: fn(t) every frame (30 fps, paused off-screen); still/print: fn(stillTime) once
 *   onSide(fn) live: fn('front' | 'back') as the card turns; else never
 *   side      the side showing now
 *   paintEdge(name, css)  paint one edge of the 3D card (l / r / t / b); no-op elsewhere
 *   typeReady  null, or a promise from the page that sets the faces' type as images (share.js): a moment
 *             that waits for the card's type waits for it, and the direction asks for no fonts of its own
 */
import { PEOPLE, BRAND, INK, waveMark, cardUrl } from './people.js';
import * as blobs from './blobs.js';
import { qrSvg } from './qr.js';

export const BLEED = 2;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function trimOf(dir) {
  return dir.orientation === 'portrait' ? [54, 90] : [90, 54];
}

export function faceParts(root) {
  return { root, art: root.querySelector('.face__art'), content: root.querySelector('.face__content') };
}

/** A face outside the 3D card: the proof sheets and the print view. */
export function flatFace(side) {
  const root = document.createElement('div');
  root.className = `face face--${side}`;
  root.dataset.face = side;
  root.innerHTML = '<div class="face__art"></div><div class="face__content"></div>';
  return root;
}

/**
 * @param dir    a direction module
 * @param mode   'live' | 'still' | 'print'
 * @param opts   { personId, lang, grain (bool), pose, url, card, host, typeReady }
 */
export function makeCtx(dir, mode, { personId, lang, grain = true, pose = null, url = null, card = null, host = null, typeReady = null } = {}) {
  const trim = trimOf(dir);
  const person = PEOPLE.find((x) => x.id === personId) ?? PEOPLE[0];
  const stops = [];
  const ctx = {
    mode,
    live: mode === 'live' && !reduced(),
    person,
    people: PEOPLE,
    brand: BRAND,
    ink: INK,
    lang: lang && dir.langs.some((l) => l.id === lang) ? lang : dir.langs[0].id,
    grain: mode === 'print' ? 0 : grain ? 1 : 0,
    // The frame still and print show, when the direction offers more than one (dir.poses); the first is its default.
    pose: dir.poses?.length ? (dir.poses.some((p) => p.id === pose) ? pose : dir.poses[0].id) : null,
    trim,
    bleed: BLEED,
    box: { x: -BLEED * 10, y: -BLEED * 10, w: (trim[0] + 2 * BLEED) * 10, h: (trim[1] + 2 * BLEED) * 10 },
    blobs,
    qrSvg,
    waveMark,
    // What the QR code opens: this person's own digital card.
    url: url ?? cardUrl(person),
    typeReady,
    get side() {
      return card ? card.side : 'front';
    },
    /** Paint one of the 3D card's edges ('l' | 'r' | 't' | 'b') with a colour or gradient; a no-op off the 3D card. */
    paintEdge(name, css) {
      card?.paintEdge(name, css);
    },
    onSide(fn) {
      if (!card) return () => {};
      const off = card.onSide(fn);
      stops.push(off);
      return off;
    },
    loop(fn) {
      const t0 = dir.stillTime ?? 0;
      if (!ctx.live) {
        fn(t0);
        return () => {};
      }
      let raf = 0;
      let last = 0;
      let t = t0;
      let visible = true;
      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        if (now - last < 1000 / 30 - 2) return;
        // Real time, so a dropped frame doesn't slow the motion; a long gap (a tab coming back) counts as 0.75 s.
        const dt = last ? Math.min(0.75, (now - last) / 1000) : 0;
        last = now;
        t += dt;
        fn(t);
      };
      const run = () => {
        if (raf || !visible || document.hidden) return;
        last = 0;
        raf = requestAnimationFrame(frame);
      };
      const halt = () => {
        cancelAnimationFrame(raf);
        raf = 0;
      };
      const io = host
        ? new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            visible ? run() : halt();
          })
        : null;
      io?.observe(host);
      const vis = () => (document.hidden ? halt() : run());
      document.addEventListener('visibilitychange', vis);
      fn(t0);
      run();
      const stop = () => {
        halt();
        io?.disconnect();
        document.removeEventListener('visibilitychange', vis);
      };
      stops.push(stop);
      return stop;
    },
    dispose() {
      for (const s of stops.splice(0)) s();
    },
  };
  return ctx;
}

/**
 * Resolves once every face font the given roots use has loaded: each element's
 * own family, weight and style is asked for with its own text (so the right
 * unicode-range slices of the Chinese faces load), then document.fonts.ready.
 * A plain fonts.ready right after mount can resolve before layout has asked
 * for anything, and a print export then embeds a system fallback.
 */
export async function fontsSettled(...roots) {
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const asks = new Set();
  const loads = [];
  for (const root of roots) {
    if (!root) continue;
    for (const el of root.querySelectorAll('*')) {
      const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (!text) continue;
      const cs = getComputedStyle(el);
      const font = `${cs.fontStyle} ${cs.fontWeight} 16px ${cs.fontFamily}`;
      const key = font + '|' + text;
      if (asks.has(key)) continue;
      asks.add(key);
      loads.push(document.fonts.load(font, text).catch(() => []));
    }
  }
  await Promise.all(loads);
  await document.fonts.ready;
}

/** Loads a direction's module and stylesheet once. */
const loaded = new Map();
export function loadDirection(id) {
  if (loaded.has(id)) return loaded.get(id);
  const p = (async () => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = new URL(`../directions/${id}.css`, import.meta.url).href;
    const ready = new Promise((r) => {
      css.addEventListener('load', r, { once: true });
      css.addEventListener('error', r, { once: true });
      setTimeout(r, 2000);
    });
    document.head.appendChild(css);
    const mod = (await import(`../directions/${id}.js`)).default;
    await ready;
    return mod;
  })();
  loaded.set(id, p);
  return p;
}
