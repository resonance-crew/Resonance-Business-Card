/**
 * The card as the person you gave it to sees it: card.html#<person>.
 * One card on a desk, turned over with a tap; under it, their links, the
 * e-mail (a tap copies it), and what Resonance is. The page speaks the visitor's
 * language (Chinese or English), and so does the card where it can.
 *
 *   card.html#chen            陳念誠's card, in the chosen direction
 *   card.html?d=facets#chen   another direction (local review)
 */
import { PEOPLE, waveMark } from './people.js';
import { createCard3D } from './card3d.js';
import { makeCtx, faceParts, loadDirection, fontsSettled } from './ctx.js';
import { organicBare, organicDivider, organicLink, organicToast, globeIcon, INK_STRONG } from './organic.js';

/** The direction the team picked. */
export const DIRECTION = 'friends';

const MISSION = {
  zh:
    '我們相信故事的力量：每個人生而立體而獨特，都帶著自己珍貴的人生經驗；而故事，是串聯人與人、發揮影響力最好的途徑，這是我們打造「共振」的原因。' +
    '使用者把一段人生寫成一張故事卡片；讀到觸動自己的故事時，回應不是按讚，而是寫下自己的卡片去「共振」它，讓生命影響生命。',
  en:
    'We believe in the power of stories. Every person is born whole, many-sided and unique, carrying life experience no one else has, ' +
    'and stories are the best way to connect people and make a difference. That is why we built Resonance. People write a stretch of ' +
    'their life as a story card. When a story moves them, they don’t answer with a like: they write a card of their own to resonate ' +
    'with it. Let lives influence lives.',
};

/**
 * A person's links (people.js `links`), each in a 24 × 24 box, stroked: the Resonance waves,
 * and Instagram, Facebook and GitHub as their own site draws them (ncchen99.github.io's outline icons; GitHub
 * from the same set). Not redrawn by hand: a brand's mark is read by its shape, and these outlines are a pen's
 * line already, round-capped like the waves beside them.
 */
const LINK_ICONS = {
  resonance: () => waveMark('currentColor', INK_STRONG),
  instagram: () =>
    stroked(
      '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>' +
        '<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
    ),
  facebook: () => stroked('<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'),
  github: () =>
    stroked(
      '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 ' +
        '20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 ' +
        '5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
    ),
};

/** Copy: two sheets, the one behind peeking out (the e-mail's hint that a tap copies it). */
const COPY_ICON =
  '<rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/>';

function stroked(inner) {
  return (
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${INK_STRONG}" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`
  );
}

const T = {
  zh: {
    hint: '點一下翻面',
    copied: 'Email 已複製',
    aboutTitle: '關於共振',
    other: 'English',
    links: '在其他地方找到我',
    copyEmail: (email) => `複製 Email ${email}`,
    cantCopy: (email) => `無法自動複製：${email}`,
  },
  en: {
    hint: 'Tap to turn over',
    copied: 'E-mail copied',
    aboutTitle: 'About Resonance',
    other: '中文',
    links: 'Find me elsewhere',
    copyEmail: (email) => `Copy e-mail ${email}`,
    cantCopy: (email) => `Couldn’t copy: ${email}`,
  },
};

const params = new URLSearchParams(location.search);
const hash = location.hash.replace(/^#/, '');
const page = location.pathname.split('/').pop().replace(/\.html$/, '');
const named = document.querySelector('meta[name="card-person"]')?.content;
/** A short page names its person; else /ncc, #ncc or #chen; else the first. */
const person =
  PEOPLE.find((p) => p.id === named) ??
  PEOPLE.find((p) => p.short === page) ??
  PEOPLE.find((p) => p.id === hash || p.short === hash) ??
  PEOPLE[0];
const personId = person.id;
const directionId = params.get('d') || DIRECTION;
/** Their links under the card (none until they've said yes). */
const links = person.links ?? [];
let ui = (params.get('ui') || navigator.language || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en';

const $ = (s) => document.querySelector(s);
let current = null;

/** The card's own language option for this visitor: Chinese-first or English-first where the direction offers it. */
function cardLang(dir) {
  const ids = dir.langs.map((l) => l.id);
  const wanted = ui === 'zh' ? ['zh-first', 'both', 'zh'] : ['en-first', 'both', 'en'];
  return wanted.find((w) => ids.includes(w)) ?? ids[0];
}

async function render() {
  const dir = await loadDirection(directionId);
  current?.instance?.destroy?.();
  current?.ctx?.dispose();
  current?.card?.destroy();
  document.documentElement.lang = ui === 'zh' ? 'zh-Hant' : 'en';
  document.documentElement.dataset.direction = dir.id;
  document.title = ui === 'zh' ? `${person.zh}｜共振 Resonance` : `${person.en} | Resonance`;
  const t = T[ui];

  const card = createCard3D($('#stage'), {
    orientation: dir.orientation,
    edgeColor: dir.edgeColor,
    edgePaint: dir.edgePaint,
    turnDir: dir.turnDir,
    radiusMm: dir.radiusMm ?? 0,
    thicknessMm: dir.thicknessMm ?? 0.7,
    label: ui === 'zh' ? `${person.zh} 的名片` : `${person.en}’s card`,
    roleLabel: ui === 'zh' ? '名片' : 'card',
  });
  $('#stage').dataset.orientation = dir.orientation;
  const lang = cardLang(dir);
  // The type as images where they're made (the team's direction): see typeLayers.
  const typeset = dir.id === DIRECTION ? typeLayers(card, lang) : null;
  const ctx = makeCtx(dir, 'live', { personId, lang, card, host: card.stage, typeReady: typeset?.ready ?? null });
  const instance = dir.mount({ front: faceParts(card.front), back: faceParts(card.back) }, ctx);
  typeset?.describe();
  current = { card, ctx, instance };

  $('#hint').textContent = t.hint;
  $('#about-title').textContent = t.aboutTitle;
  $('#mission').textContent = MISSION[ui];
  $('#email .email-text').textContent = person.email;
  $('#email').setAttribute('aria-label', t.copyEmail(person.email));
  $('#links').setAttribute('aria-label', t.links);
  for (const a of $('#links').querySelectorAll('a')) {
    const link = links[+a.dataset.index];
    const label = typeof link.label === 'string' ? link.label : link.label[ui];
    a.href = typeof link.href === 'string' ? link.href : link.href[ui];
    a.setAttribute('aria-label', label);
    a.title = label;
  }
  $('#lang .lang-label').textContent = t.other;
  $('#lang').lang = ui === 'zh' ? 'en' : 'zh-Hant';
  (typeset ? typeset.ready : fontsSettled(card.stage)).then(() => (document.documentElement.dataset.ready = '1'));
}

/**
 * The card's type as images (assets/type/, made by tools/type-images.mjs): each face's words, seal and QR
 * code, laid over its live blobs in place of the face's own text. In-app browsers (LINE, Facebook) scale
 * text with the phone's font size, so set as text the name ran into its seal and the e-mail off the card;
 * an image keeps every line where it was drawn, needs none of the card's fonts, and is ~15–30 KB a face.
 * The face's text stays in the page, hidden, as the image's alt. If an image can't load, the faces set
 * their own type as before.
 */
function typeLayers(card, lang) {
  const sides = { front: card.front, back: card.back };
  const images = Object.entries(sides).map(([side, face]) => {
    const img = document.createElement('img');
    img.className = 'face__type';
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    face.querySelector('.face__content').after(img);
    face.classList.add('is-typeset');
    const loaded = new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });
    img.src = new URL(`../assets/type/${DIRECTION}/${personId}/${lang}-${side}.webp`, import.meta.url).href;
    return { face, img, loaded };
  });
  const ready = Promise.all(images.map((x) => x.loaded)).then(
    () => true,
    () => {
      for (const { face, img } of images) {
        img.remove();
        face.classList.remove('is-typeset');
      }
      return false;
    },
  );
  return {
    ready,
    /** After the direction has set the faces' text: each image's alt is its face's words, in their language. */
    describe() {
      for (const { face, img } of images) {
        const content = face.querySelector('.face__content');
        // Each element's own words, a space between (the family name is a span of its own beside the given).
        img.alt = [...content.querySelectorAll('*')]
          .map((el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim())
          .filter(Boolean)
          .join(' ');
        const lang = content.querySelector('[lang]')?.lang;
        if (lang) img.lang = lang;
      }
    },
  };
}

/**
 * Under the card: their links (each a 48 px target with the site's hover brush), and the e-mail itself a
 * button that copies it, said by the toast. The words are set by render().
 */
function initContact() {
  const list = $('#links');
  links.forEach((link, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.dataset.index = i;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.innerHTML = `<span class="link-icon" aria-hidden="true">${LINK_ICONS[link.kind]()}</span>`;
    li.append(a);
    list.append(li);
    organicBare(a, { seed: 71 + i * 12 });
  });
  list.hidden = links.length === 0;

  const email = $('#email');
  email.querySelector('.copy-icon').innerHTML = stroked(COPY_ICON);
  organicBare(email, { seed: 29 });
  const toast = organicToast();
  email.addEventListener('click', async () => {
    toast((await copyText(person.email)) ? T[ui].copied : T[ui].cantCopy(person.email));
  });
}

/** The clipboard, else the older copy command (in-app browsers that refuse the clipboard often still take it). */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    Object.assign(area.style, { position: 'fixed', top: '0', left: '0', opacity: '0' });
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {}
    area.remove();
    return ok;
  }
}

function init() {
  $('#brand-mark').innerHTML = waveMark('currentColor', 1.8);
  initContact();
  // The Resonance site's hand-drawn controls (js/organic.js): the frameless globe, a wavy rule, a pen's
  // wavy underline. Seeds are the site's own, one per element.
  $('#lang').insertAdjacentHTML('afterbegin', globeIcon());
  organicBare($('#lang'), { seed: 53 });
  organicDivider($('#about-rule'), { seed: 17 });
  organicLink($('#foot-link'));
  $('#lang').addEventListener('click', () => {
    ui = ui === 'zh' ? 'en' : 'zh';
    render();
  });
  window.addEventListener('hashchange', () => location.reload());
  render();
}

init();
