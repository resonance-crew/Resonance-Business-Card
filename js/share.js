/**
 * The card as the person you gave it to sees it: card.html#<person>.
 * One card on a desk, turned over with a tap; under it, save the contact,
 * copy the e-mail, and what Resonance is. The page speaks the visitor's
 * language (Chinese or English), and so does the card where it can.
 *
 *   card.html#chen            陳念誠's card, in the chosen direction
 *   card.html?d=facets#chen   another direction (local review)
 */
import { PEOPLE, BRAND, waveMark, cardUrl } from './people.js';
import { createCard3D } from './card3d.js';
import { makeCtx, faceParts, loadDirection, fontsSettled } from './ctx.js';
import { organicButton, organicBare, organicDivider, organicLink, globeIcon } from './organic.js';

/** The direction the team picked. */
export const DIRECTION = 'facets';

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

const T = {
  zh: {
    hint: '點一下翻面',
    save: '存到聯絡人',
    copy: '複製 Email',
    copied: 'Email 已複製',
    copyFailed: '無法自動複製，請長按選取 Email',
    about: '認識共振',
    aboutTitle: '關於共振',
    other: 'English',
    saved: '已下載聯絡人檔案',
  },
  en: {
    hint: 'Tap to turn over',
    save: 'Save contact',
    copy: 'Copy e-mail',
    copied: 'E-mail copied',
    copyFailed: 'Couldn’t copy. Press and hold the e-mail to select it',
    about: 'About Resonance',
    aboutTitle: 'About Resonance',
    other: '中文',
    saved: 'Contact file downloaded',
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
  const ctx = makeCtx(dir, 'live', { personId, lang: cardLang(dir), card, host: card.stage });
  const instance = dir.mount({ front: faceParts(card.front), back: faceParts(card.back) }, ctx);
  current = { card, ctx, instance };

  $('#hint').textContent = t.hint;
  $('#save .o-label').textContent = t.save;
  $('#copy .o-label').textContent = t.copy;
  $('#about-link .o-label').firstChild.textContent = t.about + ' ';
  $('#about-link').href = `${BRAND.url}/${ui === 'zh' ? 'zh-TW' : 'en'}/about`;
  $('#about-title').textContent = t.aboutTitle;
  $('#mission').textContent = MISSION[ui];
  $('#email').textContent = person.email;
  $('#lang .lang-label').textContent = t.other;
  $('#lang').lang = ui === 'zh' ? 'en' : 'zh-Hant';
  $('#status').textContent = '';
  fontsSettled(card.stage).then(() => (document.documentElement.dataset.ready = '1'));
}

function vcard() {
  const esc = (s) => String(s).replace(/([,;\\])/g, '\\$1');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(person.family)};${esc(person.given)};;;`,
    `FN:${esc(person.zh)} ${esc(person.en)}`,
    `NICKNAME:${esc(person.zh)}`,
    `ORG:${esc(BRAND.name.zh)} ${esc(BRAND.name.en)}`,
    `EMAIL;TYPE=INTERNET:${person.email}`,
    `URL:${BRAND.url}`,
    `URL;TYPE=card:${cardUrl(person)}`,
    `NOTE:${esc(BRAND.headline.zh)} · ${esc(BRAND.headline.en)}`,
    'END:VCARD',
  ];
  return lines.join('\r\n') + '\r\n';
}

function init() {
  $('#brand-mark').innerHTML = waveMark('currentColor', 1.8);
  // The Resonance site's hand-drawn controls (js/organic.js): filled wobbly buttons, the frameless
  // globe, a wavy rule, a pen's wavy underline. Seeds are the site's own, one per element.
  $('#lang').insertAdjacentHTML('afterbegin', globeIcon());
  organicBare($('#lang'), { seed: 53 });
  organicButton($('#save'), { variant: 'solid', seed: 3 });
  organicButton($('#copy'), { variant: 'tonal', seed: 601 });
  organicButton($('#about-link'), { variant: 'tonal', seed: 401 });
  organicDivider($('#about-rule'), { seed: 17 });
  organicLink($('#foot-link'));
  $('#save').addEventListener('click', () => {
    const blob = new Blob([vcard()], { type: 'text/vcard;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${person.en.replace(/\s+/g, '-')}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    $('#status').textContent = T[ui].saved;
  });
  $('#copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(person.email);
      $('#status').textContent = T[ui].copied;
    } catch {
      const range = document.createRange();
      range.selectNodeContents($('#email'));
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      $('#status').textContent = T[ui].copyFailed;
    }
  });
  $('#lang').addEventListener('click', () => {
    ui = ui === 'zh' ? 'en' : 'zh';
    render();
  });
  window.addEventListener('hashchange', () => location.reload());
  render();
}

init();
