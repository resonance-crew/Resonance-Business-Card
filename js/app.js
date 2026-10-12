/**
 * The proposal page: pick a direction and a person, turn the card over,
 * and see the print proof of the same two faces underneath.
 *
 * A direction is a module in directions/<id>.js (with directions/<id>.css)
 * whose default export is:
 *
 *   {
 *     id, letter: 'A', name: '相遇', enName: 'Meeting',
 *     orientation: 'landscape' | 'portrait',
 *     edgeColor?, edgePaint?: { l, r, t, b }, turnDir?: ±1, radiusMm?, thicknessMm?,
 *     proofSpread?: true,     // the proof also lays the faces side by side, trim to trim
 *     pitch: '一句話說它是什麼',
 *     notes: [{ k: '概念', v: '…' }, …],
 *     langs: [{ id: 'both', label: '中英並列' }, …]   // the first is the default
 *     stillTime: 7.5,          // the moment the still card and the print file show
 *     mount(faces, ctx) → { destroy() }
 *   }
 *
 * faces = { front: { root, art, content }, back: { root, art, content } }
 * ctx   = see js/ctx.js.
 *
 * Query parameters (for local tools; the published page ignores them):
 *   ?d=meet&p=chen&lang=both&grain=0&motion=still
 *   &view=card   — only the 3D card      &side=back — start turned over
 *   &view=print&side=front — one face alone at its printed size, bleed included (PDF/PNG export)
 *   &view=flat   — both faces flat, side by side, at true proportions
 */
import { PEOPLE, waveMark } from './people.js';
import { createCard3D } from './card3d.js';
import { BLEED, makeCtx, trimOf, faceParts, flatFace, loadDirection, fontsSettled } from './ctx.js';

/** The directions, in tab order (their letters), and where the review placed each. */
const DIRECTIONS = ['meet', 'facets', 'story'];
const DEFAULT_DIRECTION = 'facets';
const RANK = { facets: '首選', meet: '次選', story: '備選' };
const store = {
  get(k) {
    try {
      return localStorage.getItem('rbc:' + k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('rbc:' + k, v);
    } catch {
      /* private window: fine */
    }
  },
};

const params = new URLSearchParams(location.search);
const hash = location.hash.replace(/^#/, '');
const state = {
  d: pick(params.get('d') ?? (DIRECTIONS.includes(hash) ? hash : store.get('d')), DIRECTIONS, DEFAULT_DIRECTION),
  p: pick(params.get('p') ?? (PEOPLE.some((x) => x.id === hash) ? hash : store.get('p')), PEOPLE.map((x) => x.id), PEOPLE[0].id),
  lang: params.get('lang'),
  grain: params.has('grain') ? params.get('grain') !== '0' : store.get('grain') !== '0',
  motion: params.get('motion') === 'still' ? 'still' : 'live',
  view: params.get('view') ?? 'page',
  side: params.get('side') === 'back' ? 'back' : 'front',
};

function pick(v, list, fallback) {
  return list.includes(v) ? v : fallback;
}

const load = loadDirection;
/** The ctx options the page's state gives. */
const ctxOpts = (extra = {}) => ({ personId: state.p, lang: state.lang, grain: state.grain, ...extra });

// ── the page ────────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
let current = null; // { card, ctx, instance, proofs: [...] }

function teardown() {
  if (!current) return;
  current.instance?.destroy?.();
  current.ctx?.dispose();
  for (const p of current.proofs) {
    p.instance?.destroy?.();
    p.ctx.dispose();
  }
  current.card?.destroy();
  current = null;
}

async function render() {
  const dir = await load(state.d);
  teardown();
  const trim = trimOf(dir);
  const person = PEOPLE.find((x) => x.id === state.p);
  document.documentElement.dataset.direction = dir.id;

  if (state.view === 'print' || state.view === 'flat') return renderFlatOnly(dir, trim);

  // The card.
  const stageHost = $('#stage');
  stageHost.textContent = '';
  const card = createCard3D(stageHost, {
    orientation: dir.orientation,
    edgeColor: dir.edgeColor,
    edgePaint: dir.edgePaint,
    turnDir: dir.turnDir,
    radiusMm: dir.radiusMm ?? 0,
    thicknessMm: dir.thicknessMm ?? 0.7,
    label: `${person.zh} ${person.en}・${dir.name}`,
    roleLabel: '名片',
    noHint: state.view === 'card',
  });
  const mode = state.motion === 'still' ? 'still' : 'live';
  const ctx = makeCtx(dir, mode, ctxOpts({ card, host: card.stage }));
  const instance = dir.mount({ front: faceParts(card.front), back: faceParts(card.back) }, ctx);
  if (state.side === 'back') card.show('back');
  current = { card, ctx, instance, proofs: [] };

  if (state.view === 'card') {
    document.body.classList.add('card-only');
    fontsSettled(card.stage).then(() => (document.documentElement.dataset.ready = '1'));
    return;
  }

  // The panel.
  $('#dir-title').innerHTML = `<span class="zh">${dir.name}</span>${dir.enName}`;
  $('#dir-pitch').textContent = dir.pitch;
  $('#notes').innerHTML = dir.notes.map((n) => `<div><dt>${n.k}</dt><dd>${n.v}</dd></div>`).join('');
  renderChips('#people', PEOPLE.map((x) => ({ id: x.id, label: x.zh })), state.p, (id) => {
    state.p = id;
    store.set('p', id);
    render();
  });
  renderChips('#langs', dir.langs, ctx.lang, (id) => {
    state.lang = id;
    render();
  });
  renderChips(
    '#motion',
    [
      { id: 'live', label: '動態' },
      { id: 'still', label: '靜態' },
    ],
    state.motion,
    (id) => {
      state.motion = id;
      render();
    },
  );
  renderChips(
    '#grain',
    [
      { id: 'on', label: '有' },
      { id: 'off', label: '無' },
    ],
    state.grain ? 'on' : 'off',
    (id) => {
      state.grain = id === 'on';
      store.set('grain', state.grain ? '1' : '0');
      render();
    },
  );
  for (const b of document.querySelectorAll('.direction-tab')) b.setAttribute('aria-pressed', String(b.dataset.d === dir.id));

  // The proof: both faces flat, as they go to print.
  const sheets = $('#proof-sheets');
  sheets.textContent = '';
  $('#proof-spec').textContent = `成品 ${trim[0]} × ${trim[1]} mm ・ 出血各 ${BLEED} mm（檔案 ${trim[0] + 2 * BLEED} × ${trim[1] + 2 * BLEED} mm）・ 虛線為裁切線`;
  const avail = sheets.getBoundingClientRect().width || 600;
  const twoUp = avail > 2 * (trim[0] + 16) * 2.6 + 40;
  const per = twoUp ? (avail - 40) / 2 : avail;
  const mmPx = Math.max(2.4, Math.min(dir.orientation === 'portrait' ? 5.6 : 4.6, per / (trim[0] + 12)));
  for (const side of ['front', 'back']) {
    const { sheet, face } = buildSheet(trim, mmPx, side === 'front' ? '正面' : '背面');
    sheets.appendChild(sheet);
    const pctx = makeCtx(dir, 'print', ctxOpts());
    const other = flatFace(side === 'front' ? 'back' : 'front');
    const faces = side === 'front' ? { front: faceParts(face), back: faceParts(other) } : { front: faceParts(other), back: faceParts(face) };
    const pinst = dir.mount(faces, pctx);
    current.proofs.push({ ctx: pctx, instance: pinst });
  }
  if (dir.proofSpread) renderSpread(dir, trim, mmPx);
  fontsSettled(document.querySelector('.page')).then(() => (document.documentElement.dataset.ready = '1'));
}

/**
 * A direction whose shape runs round the card's edge (proofSpread) also gets
 * the two faces laid side by side, trim to trim, the way they meet at that
 * edge once the card is turned over about its vertical axis.
 */
function renderSpread(dir, trim, mmPx) {
  const fig = document.createElement('figure');
  fig.className = 'sheet sheet--spread';
  fig.style.margin = '0';
  const row = document.createElement('div');
  row.className = 'spread';
  row.style.setProperty('--mm-px', `${mmPx}px`);
  row.style.setProperty('--trim-w', trim[0]);
  row.style.setProperty('--trim-h', trim[1]);
  const faces = {};
  for (const side of ['front', 'back']) {
    const fc = document.createElement('div');
    fc.className = 'flat-card';
    const face = flatFace(side);
    fc.appendChild(face);
    row.appendChild(fc);
    faces[side] = faceParts(face);
  }
  fig.appendChild(row);
  const cap = document.createElement('figcaption');
  cap.className = 'sheet-label';
  cap.textContent = '翻面接起來：正面的右緣就是背面的左緣';
  fig.appendChild(cap);
  $('#proof-sheets').appendChild(fig);
  const ctx = makeCtx(dir, 'print', ctxOpts());
  current.proofs.push({ ctx, instance: dir.mount(faces, ctx) });
}

function buildSheet(trim, mmPx, label) {
  const sheet = document.createElement('figure');
  sheet.className = 'sheet';
  sheet.style.margin = '0';
  const flat = document.createElement('div');
  flat.className = 'flat';
  flat.style.setProperty('--mm-px', `${mmPx}px`);
  flat.style.setProperty('--trim-w', trim[0]);
  flat.style.setProperty('--trim-h', trim[1]);
  const fc = document.createElement('div');
  fc.className = 'flat-card';
  const face = flatFace('x');
  face.className = 'face';
  fc.appendChild(face);
  fc.insertAdjacentHTML('beforeend', '<div class="flat-veil"></div><div class="flat-trim"></div>');
  // Crop marks at each corner, 3 mm out from the bleed.
  const W = trim[0] * mmPx;
  const H = trim[1] * mmPx;
  const off = (BLEED + 0.8) * mmPx;
  const len = 3.2 * mmPx;
  const marks = [];
  for (const [x, y] of [
    [0, 0],
    [W, 0],
    [0, H],
    [W, H],
  ]) {
    const sx = x === 0 ? -1 : 1;
    const sy = y === 0 ? -1 : 1;
    marks.push(`<i class="crop h" style="left:${sx < 0 ? x - off - len : x + off}px;top:${y}px"></i>`);
    marks.push(`<i class="crop v" style="left:${x}px;top:${sy < 0 ? y - off - len : y + off}px"></i>`);
  }
  fc.insertAdjacentHTML('beforeend', marks.join(''));
  flat.appendChild(fc);
  sheet.appendChild(flat);
  const cap = document.createElement('figcaption');
  cap.className = 'sheet-label';
  cap.textContent = label;
  sheet.appendChild(cap);
  return { sheet, face };
}

function renderChips(sel, items, active, onPick) {
  const host = $(sel);
  host.textContent = '';
  for (const it of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = it.label;
    b.setAttribute('aria-pressed', String(it.id === active));
    b.addEventListener('click', () => onPick(it.id));
    host.appendChild(b);
  }
}

/** view=print: one face, alone, at its printed size with bleed; view=flat: both, for a quick look. */
function renderFlatOnly(dir, trim) {
  document.body.className = 'print-only';
  document.body.innerHTML = '';
  const W = trim[0] + 2 * BLEED;
  const H = trim[1] + 2 * BLEED;
  // view=print&side=both: a two-page PDF, front then back (what a print shop asks for).
  const sides = state.view === 'flat' || params.get('side') === 'both' ? ['front', 'back'] : [state.side];
  const style = document.createElement('style');
  style.textContent =
    state.view === 'print'
      ? `@page { size: ${W}mm ${H}mm; margin: 0 } html, body { margin: 0; background: var(--card-paper); width: ${W}mm } * { print-color-adjust: exact; -webkit-print-color-adjust: exact } body > div { break-after: page } @media print { html, body, body > div { background: none !important } } body > div:last-child { break-after: auto }`
      : `body { margin: 0; padding: 24px; display: flex; gap: 24px; flex-wrap: wrap; background: var(--page) }`;
  document.head.appendChild(style);
  const proofs = [];
  for (const side of sides) {
    const page = document.createElement('div');
    page.style.cssText = `position: relative; width: ${W}mm; height: ${H}mm; overflow: hidden; background: var(--card-paper)`;
    const fc = document.createElement('div');
    fc.className = 'flat-card';
    fc.style.cssText = `position: absolute; left: ${BLEED}mm; top: ${BLEED}mm; width: ${trim[0]}mm; height: ${trim[1]}mm; container-type: inline-size; --trim-w: ${trim[0]}; --trim-h: ${trim[1]}`;
    const face = flatFace(side);
    fc.appendChild(face);
    page.appendChild(fc);
    document.body.appendChild(page);
    const ctx = makeCtx(dir, state.motion === 'live' && state.view === 'flat' ? 'still' : 'print', ctxOpts());
    const other = flatFace(side === 'front' ? 'back' : 'front');
    const faces = side === 'front' ? { front: faceParts(face), back: faceParts(other) } : { front: faceParts(other), back: faceParts(face) };
    proofs.push({ ctx, instance: dir.mount(faces, ctx) });
  }
  current = { card: null, ctx: null, instance: null, proofs };
  fontsSettled(document.body).then(() => (document.documentElement.dataset.ready = '1'));
}

// ── wiring ──────────────────────────────────────────────────────────────

async function init() {
  if (state.view === 'page') {
    $('#brand-mark').innerHTML = waveMark('currentColor', 1.8);
    const tabs = $('#directions');
    for (const id of DIRECTIONS) {
      const mod = await load(id).catch(() => null);
      if (!mod) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'direction-tab';
      b.dataset.d = id;
      b.innerHTML = `<span class="letter">${mod.letter}</span><span class="label"><b>${mod.name}${RANK[id] ? `<em class="rank">${RANK[id]}</em>` : ''}</b><span>${mod.enName}</span></span>`;
      b.addEventListener('click', () => {
        state.d = id;
        state.lang = null;
        store.set('d', id);
        render();
      });
      tabs.appendChild(b);
    }
    $('#flip').addEventListener('click', () => current?.card?.flip());
    let w = window.innerWidth;
    window.addEventListener('resize', () => {
      if (Math.abs(window.innerWidth - w) < 40) return;
      w = window.innerWidth;
      render();
    });
  }
  await render();
}

init();
