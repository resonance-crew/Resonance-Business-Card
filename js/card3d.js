/**
 * A two-sided card in 3D: it leans toward the pointer, catches the light,
 * and turns over with a spring (Motion, motion.dev) when it is tapped,
 * dragged sideways, or given Enter / Space / ← →.
 *
 *   const card = createCard3D(host, { orientation: 'landscape' });
 *   card.front, card.back   // the two faces to draw on
 *   card.onSide((side) => …) // 'front' | 'back', as the turn passes edge-on
 *   card.flip(), card.show('back')
 *   card.paintEdge('r', css)  // paint one edge (l / r / t / b): a colour or a gradient
 *
 * Options: orientation, thicknessMm, radiusMm, edgeColor (all four edges),
 * edgePaint { l, r, t, b } (one edge each), turnDir (+1 / −1: the way the
 * 翻面 button, Enter and a tap turn it; −1 brings the RIGHT edge toward you,
 * so a design whose right edge is painted shows it), label, noHint.
 *
 * The card has a thickness: its four edges are real planes, so a painted
 * edge shows as the card turns. The faces are containers (cqw units), and
 * every face sets --mm to one millimetre of the printed card, so a design
 * can be written in true print sizes and the screen simply scales it.
 */

const M = window.Motion;
const DEG = Math.PI / 180;

/** Spring for a turn: about three quarters of a second, a little overshoot. */
const TURN = { type: 'spring', visualDuration: 0.72, bounce: 0.2 };
/** Spring for the lean toward the pointer: quick, settled. */
const LEAN = { type: 'spring', stiffness: 170, damping: 20, mass: 0.6 };
/** Largest lean, degrees. */
const MAX_LEAN = 9;

export function createCard3D(host, opts = {}) {
  const orientation = opts.orientation === 'portrait' ? 'portrait' : 'landscape';
  /** Trim size in mm. */
  const trim = orientation === 'portrait' ? [54, 90] : [90, 54];
  const thicknessMm = opts.thicknessMm ?? 0.7;
  const radiusMm = opts.radiusMm ?? 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = document.createElement('div');
  stage.className = `c3-stage is-${orientation}`;
  stage.innerHTML = `
    <div class="c3-shadow" aria-hidden="true"></div>
    <div class="c3-card" tabindex="0" role="group" aria-roledescription="${opts.roleLabel ?? 'card'}">
      <div class="c3-face c3-front face face--front" data-face="front"><div class="face__art"></div><div class="face__content"></div><div class="c3-glare" aria-hidden="true"></div></div>
      <div class="c3-face c3-back face face--back" data-face="back"><div class="face__art"></div><div class="face__content"></div><div class="c3-glare" aria-hidden="true"></div></div>
      <div class="c3-edge c3-edge-l" aria-hidden="true"></div>
      <div class="c3-edge c3-edge-r" aria-hidden="true"></div>
      <div class="c3-edge c3-edge-t" aria-hidden="true"></div>
      <div class="c3-edge c3-edge-b" aria-hidden="true"></div>
    </div>`;
  host.appendChild(stage);
  const card = stage.querySelector('.c3-card');
  const shadow = stage.querySelector('.c3-shadow');
  const front = stage.querySelector('.c3-front');
  const back = stage.querySelector('.c3-back');
  card.style.setProperty('--trim-w', trim[0]);
  card.style.setProperty('--trim-h', trim[1]);
  card.style.setProperty('--radius-mm', radiusMm);
  if (opts.edgeColor) card.style.setProperty('--edge', opts.edgeColor);
  const edgeEls = { l: card.querySelector('.c3-edge-l'), r: card.querySelector('.c3-edge-r'), t: card.querySelector('.c3-edge-t'), b: card.querySelector('.c3-edge-b') };
  const paintEdge = (name, css) => {
    const el = edgeEls[name];
    if (el) el.style.background = css || '';
  };
  for (const [name, css] of Object.entries(opts.edgePaint ?? {})) paintEdge(name, css);
  /** The way a plain turn goes: rotateY decreasing (−1) brings the right edge toward the viewer. */
  const turnDir = opts.turnDir === -1 ? -1 : opts.turnDir === 1 ? 1 : null;
  if (opts.label) card.setAttribute('aria-label', opts.label);

  // ── motion values ──
  const rx = M.motionValue(reduced ? 0 : 10);
  const ry = M.motionValue(0);
  const flip = M.motionValue(reduced ? 0 : -16);
  const lift = M.motionValue(reduced ? 0 : 26);
  const glare = { x: 30, y: 20, a: 0 };
  let widthPx = 0;

  let queued = false;
  const render = () => {
    queued = false;
    const f = flip.get();
    const y = ry.get();
    const x = rx.get();
    const l = lift.get();
    card.style.transform = `translate3d(0, ${(-l * 0.35).toFixed(2)}px, ${l.toFixed(2)}px) rotateX(${x.toFixed(3)}deg) rotateY(${(f + y).toFixed(3)}deg)`;
    const across = Math.abs(Math.cos((f + y) * DEG));
    shadow.style.transform =
      `translate3d(${(y * 1.4).toFixed(1)}px, ${(8 + l * 0.5 - x * 0.8).toFixed(1)}px, 0) ` +
      `scale(${(0.18 + 0.78 * across).toFixed(3)}, ${(0.9 - l * 0.004).toFixed(3)})`;
    shadow.style.opacity = (0.55 - l * 0.006).toFixed(3);
    card.style.setProperty('--gx', `${glare.x.toFixed(1)}%`);
    card.style.setProperty('--gy', `${glare.y.toFixed(1)}%`);
    card.style.setProperty('--ga', glare.a.toFixed(3));
    const side = Math.cos(f * DEG) >= 0 ? 'front' : 'back';
    if (side !== shown) setShown(side);
  };
  const schedule = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(render);
    }
  };
  for (const v of [rx, ry, flip, lift]) v.on('change', schedule);

  // ── which face is showing ──
  let shown = 'front';
  const listeners = new Set();
  const setShown = (side) => {
    shown = side;
    stage.dataset.side = side;
    front.setAttribute('aria-hidden', side === 'front' ? 'false' : 'true');
    back.setAttribute('aria-hidden', side === 'back' ? 'false' : 'true');
    front.inert = side !== 'front';
    back.inert = side !== 'back';
    for (const fn of listeners) fn(side);
  };
  setShown('front');

  // ── size: one mm of the printed card in px, and the card's thickness ──
  const ro = new ResizeObserver(([entry]) => {
    widthPx = entry.contentRect.width;
    const mm = widthPx / trim[0];
    card.style.setProperty('--mm-px', `${mm}px`);
    card.style.setProperty('--t', `${Math.max(1.5, thicknessMm * mm)}px`);
  });
  ro.observe(card);

  // ── turning ──
  let turnAnim = null;
  let liftAnim = null;
  const settleTo = (target, velocity = 0) => {
    turnAnim?.stop();
    if (reduced) {
      flip.jump(target);
      stage.classList.remove('c3-fade');
      void stage.offsetWidth;
      stage.classList.add('c3-fade');
      return;
    }
    turnAnim = M.animate(flip, target, { ...TURN, velocity });
    liftAnim?.stop();
    liftAnim = M.animate(lift, [lift.get(), 34, 0], { duration: 0.78, ease: [0.22, 0.8, 0.25, 1], times: [0, 0.38, 1] });
  };
  /** Turn the card over; dir +1 sends the right edge away (the left comes toward you), −1 the other way. */
  /**
   * A plain turn (button, Enter, tap) for a design with its own way goes that way from the front and back the
   * way it came from the back, so the same edge comes toward the viewer on every turn.
   */
  const plainDir = () => (turnDir ? (shown === 'back' ? -turnDir : turnDir) : 1);
  const flipBy = (dir = plainDir()) => {
    const base = Math.round(flip.get() / 180) * 180;
    settleTo(base + 180 * (dir < 0 ? -1 : 1));
    hinted = true;
  };
  const show = (side) => {
    hinted = true;
    if (side !== shown || Math.abs(flip.get() % 180) > 1) {
      const base = Math.round(flip.get() / 180) * 180;
      const isFront = Math.round(base / 180) % 2 === 0;
      settleTo(isFront === (side === 'front') ? base : base + 180);
    }
  };

  // ── pointer: lean, drag, tap ──
  let drag = null;
  const leanTo = (x, y) => {
    if (reduced) return;
    M.animate(rx, x, LEAN);
    M.animate(ry, y, LEAN);
  };
  const lightAt = (px, py) => {
    // The face that shows mirrors x on the back (it is turned over).
    const backward = shown === 'back';
    glare.x = (backward ? 1 - px : px) * 100;
    glare.y = py * 100;
  };
  const rel = (e) => {
    const r = card.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };

  stage.addEventListener('pointermove', (e) => {
    if (drag) {
      const dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (!drag.moved && Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy)) {
        drag.moved = true;
        turnAnim?.stop();
        hinted = true;
      }
      if (drag.moved) {
        flip.jump(drag.flip0 + (dx / Math.max(160, widthPx)) * 190);
        if (!reduced) rx.jump(Math.max(-8, Math.min(8, -dy * 0.05)));
        glare.a = Math.min(0.5, Math.abs(Math.sin(flip.get() * DEG)) * 0.6);
        schedule();
      }
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const [px, py] = rel(e);
    if (px < -0.15 || px > 1.15 || py < -0.25 || py > 1.25) return;
    leanTo(-(py - 0.5) * 2 * MAX_LEAN, (px - 0.5) * 2 * MAX_LEAN);
    lightAt(Math.min(1, Math.max(0, px)), Math.min(1, Math.max(0, py)));
    glare.a = 0.55;
    schedule();
  });
  stage.addEventListener('pointerleave', (e) => {
    if (drag || e.pointerType !== 'mouse') return;
    leanTo(0, 0);
    glare.a = 0;
    schedule();
  });
  card.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { x0: e.clientX, y0: e.clientY, flip0: flip.get(), moved: false, id: e.pointerId };
    card.setPointerCapture(e.pointerId);
  });
  const endDrag = (e, cancelled) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (d.moved) {
      const v = flip.getVelocity();
      const projected = flip.get() + v * 0.12;
      settleTo(Math.round(projected / 180) * 180, v);
      if (!reduced) M.animate(rx, 0, LEAN);
      glare.a = 0;
    } else if (!cancelled) {
      // A tap: the design's own way, else away from where it was tapped (a tap on the right half pushes the right edge back).
      const [px] = rel(e);
      flipBy(turnDir ? plainDir() : px < 0.5 ? -1 : 1);
    }
  };
  card.addEventListener('pointerup', (e) => endDrag(e, false));
  card.addEventListener('pointercancel', (e) => endDrag(e, true));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flipBy();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      flipBy(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      flipBy(-1);
    }
  });

  // ── arrival: it settles onto the table, then (once) shows it can turn ──
  let hinted = !!opts.noHint;
  if (!reduced) {
    M.animate(rx, 0, { type: 'spring', visualDuration: 1.1, bounce: 0.18, delay: 0.08 });
    M.animate(lift, 0, { type: 'spring', visualDuration: 1.1, bounce: 0.1, delay: 0.08 });
    M.animate(flip, 0, { type: 'spring', visualDuration: 1.2, bounce: 0.22, delay: 0.08 });
    setTimeout(() => {
      if (hinted || drag) return;
      hinted = true;
      // A small lean the way it would turn, and back: from whichever side is up.
      const base = Math.round(flip.get() / 180) * 180;
      const lean = 22 * (turnDir ?? -1);
      M.animate(flip, [flip.get(), base + lean, base], { duration: 1.1, ease: [0.4, 0, 0.2, 1], times: [0, 0.4, 1] });
    }, 2600);
  }
  render();

  return {
    stage,
    card,
    front,
    back,
    get side() {
      return shown;
    },
    get widthPx() {
      return widthPx;
    },
    onSide(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    flip: flipBy,
    show,
    paintEdge,
    destroy() {
      ro.disconnect();
      turnAnim?.stop();
      liftAnim?.stop();
      listeners.clear();
      stage.remove();
    },
  };
}
