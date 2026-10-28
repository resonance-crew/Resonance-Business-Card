/**
 * Who the cards are for, and the brand copy they share.
 *
 * Names and photos are the team as the site's About page shows them
 * (resonance.channel/about). The e-mail addresses are SAMPLES: the domain
 * routes mail, but nobody has confirmed these mailboxes. Replace them here
 * before anything goes to print.
 */

export const PEOPLE = [
  {
    id: 'chen',
    /** Their paper puppet (js/cast.js): on their card's Chinese face, and on the previous teammate's English face. */
    puppet: 'tuck',
    /** Their own short address: <CARD_BASE>ncc */
    short: 'ncc',
    zh: '陳念誠',
    en: 'Nian-Cheng Chen',
    // How the English name breaks on a card that sets given name and family name apart.
    given: 'Nian-Cheng',
    family: 'Chen',
    photo: 'assets/team/chen.webp',
    email: 'ncc@resonance.channel',
    seed: 11,
    /**
     * A card page of their own (card.html): their links in place of the three buttons, as their own site has
     * them (ncchen99.github.io, its first page) and GitHub, and the e-mail copied on a tap. Without it, the page
     * is the team's: save the contact, copy the e-mail, see Resonance's About page.
     */
    personal: {
      links: [
        {
          kind: 'resonance',
          label: { zh: '共振 Resonance', en: 'Resonance' },
          href: {
            zh: 'https://resonance.channel/zh-TW/u/%E5%BF%B5%E8%AA%A0',
            en: 'https://resonance.channel/en/u/%E5%BF%B5%E8%AA%A0',
          },
        },
        { kind: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/ncchen.foss/' },
        { kind: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/ncchen99' },
        // Not on their site (yet): the owner asked for it on the card, 2026-10-28.
        { kind: 'github', label: 'GitHub', href: 'https://github.com/ncchen99' },
      ],
    },
  },
  {
    id: 'hsiao',
    puppet: 'tag',
    short: 'liball',
    zh: '蕭力文',
    en: 'Li-Wen Hsiao',
    given: 'Li-Wen',
    family: 'Hsiao',
    photo: 'assets/team/hsiao.webp',
    email: 'liball@resonance.channel',
    seed: 37,
  },
  {
    id: 'fang',
    puppet: 'dot',
    short: 'nunu',
    zh: '方昱晴',
    en: 'Yu-Ching Fang',
    given: 'Yu-Ching',
    family: 'Fang',
    photo: 'assets/team/fang.webp',
    email: 'yu-ching@resonance.channel',
    seed: 61,
  },
  {
    id: 'cheng',
    puppet: 'card',
    short: 'ted',
    zh: '鄭義信',
    en: 'Yi-Hsin Cheng',
    given: 'Yi-Hsin',
    family: 'Cheng',
    photo: 'assets/team/cheng.webp',
    email: 'ted@resonance.channel',
    seed: 83,
  },
  {
    id: 'xue',
    puppet: 'night',
    short: 'winnie',
    zh: '薛惠馨',
    // Her English name, which she goes by (the others' are their passports' romanisation), and her spelling of 薛.
    en: 'Winnie Xue',
    given: 'Winnie',
    family: 'Xue',
    // Not on the site's About page yet: no portrait.
    photo: null,
    email: 'winnie@resonance.channel',
    seed: 113,
  },
];

/**
 * Where the digital cards live. The QR code on each printed card opens that
 * person's own digital card, where the contact can be saved. Each person has
 * a short page at <CARD_BASE><short> (ncc.html etc., made from card.html by
 * tools/short-pages.mjs; GitHub Pages serves /ncc as ncc.html).
 */
export const CARD_BASE = 'https://hi.resonance.channel/';

/** One person's digital card: <CARD_BASE><short>. */
export function cardUrl(person) {
  return `${CARD_BASE}${person.short}`;
}

/** The site's own words, in both languages, exactly as resonance.channel prints them. */
export const BRAND = {
  name: { zh: '共振', en: 'Resonance' },
  team: { zh: '共振小隊', en: 'The Resonance Crew' },
  site: 'resonance.channel',
  url: 'https://resonance.channel',
  /** The landing page's headline. */
  headline: { zh: '讓生命影響生命', en: 'Let lives influence lives' },
  /** The About page's "how it works" title. */
  answer: { zh: '回應一個故事的，是另一個故事', en: 'A story is answered by another story' },
  /** The About page's closing line. */
  everyone: { zh: '人人都是故事的分享者', en: 'Everyone has a story to share' },
  /** The three beliefs. */
  cycle: { zh: ['共振', '立體', '體悟'], en: ['Resonance', 'Depth', 'Insight'] },
};

/**
 * The palette, as tokens.css in the Resonance repo writes it (OKLCH).
 * Blob inks are the hero's pastels; text and accents are the site's.
 */
export const INK = {
  cream: 'oklch(96.5% 0.015 75)',
  creamDark: 'oklch(93% 0.018 75)',
  paper: 'oklch(97.5% 0.01 80)',
  terracotta: 'oklch(62% 0.14 45)',
  terracottaDeep: 'oklch(54.5% 0.125 45)',
  terracottaLight: 'oklch(88% 0.08 55)',
  lavender: 'oklch(80% 0.07 290)',
  sage: 'oklch(78% 0.07 140)',
  yellow: 'oklch(88% 0.10 90)',
  sky: 'oklch(82% 0.07 220)',
  text: 'oklch(26% 0.03 60)',
  muted: 'oklch(52% 0.04 70)',
};

/** The brand mark: three rippling waves, in a 24 × 24 box (atoms/ResonanceIcon in the app). */
export const WAVE_PATHS = [
  'M3.4,8.2 C5.4,5.9 7.3,5.8 9.2,8.0 C11.1,10.2 13.0,10.3 15.0,8.1 C16.9,6.0 18.8,5.9 20.7,8.1',
  'M3.0,12.1 C5.1,9.7 7.1,9.8 9.0,12.0 C10.9,14.2 12.9,14.3 14.9,12.1 C16.8,9.9 18.8,9.8 20.9,12.0',
  'M3.5,16.0 C5.4,13.8 7.4,13.7 9.3,15.9 C11.2,18.1 13.1,18.2 15.1,16.0 C17.0,13.9 18.9,13.8 20.8,16.0',
];

/** The wave mark as an inline SVG string, stroked in `color`. */
export function waveMark(color = 'currentColor', strokeWidth = 1.8) {
  return (
    `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    WAVE_PATHS.map((d) => `<path d="${d}"/>`).join('') +
    `</svg>`
  );
}
