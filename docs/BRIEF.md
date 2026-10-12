# Brief: the 共振 Resonance team card

Read this whole file before you design or review anything in this folder.

## The ask (from the owner, in their words, condensed)

- A business card for the team, **double-sided**. Mainly a **digital web card that turns over** with a
  cool 3D feel (they pointed at motion.dev), plus a **static version** generated from the same design for
  printing later.
- Not sure yet whether Chinese and English should be **mixed on one card** or **one side Chinese, one side
  English**. Show what each looks like.
- Use the website's **organic blobs**, especially the moment where **two blobs melt into one**: that fusion
  is the image they feel strongest about (共振 = two lives meeting).
- The website's **sand / grain** texture may not work on a card. Decide deliberately: the digital card can
  carry a little; print should not fake it (see Print).
- **Chinese text looks too big** next to Latin at the same size. Size type deliberately (see Type).
- Should the card be animated? Yes on screen, gently; it must also have a still frame for print.
- The card must feel **high quality, warm, organic**, like the brand. Concise: a card is not a flyer.

The mission statement (for reference; it lives on the digital page, NOT on the printed card):
「我們相信故事的力量：每個人生而立體而獨特，都帶著自己珍貴的人生經驗；而故事，是串聯人與人、發揮影響力最好的途徑，
這是我們打造「共振」的原因。使用者把一段人生寫成一張故事卡片；讀到觸動自己的故事時，回應不是按讚，而是寫下自己的卡片去「共振」它，讓生命影響生命。」

At most ONE line of brand copy goes on a card. Use the site's own words from `js/people.js` → `BRAND`
(`headline` 讓生命影響生命 / Let lives influence lives is the strongest; `answer` 回應一個故事的，是另一個故事 /
A story is answered by another story; `everyone`; `cycle` 共振・立體・體悟). Do not invent slogans.

## The brand (the Resonance repo, /Users/ncchen/Documents/Resonance, is the source of truth)

- Palette (OKLCH, `INK` in `js/people.js`): cream paper, terracotta accent (deep terracotta for text-size
  accents), pastel blob inks terracotta-light / lavender / sage / yellow / sky, warm near-black text.
- Type: **Playfair Display** (display, Latin), **DM Sans** (body, Latin), **Noto Serif TC** and
  **Noto Sans TC** (Chinese). All four are loaded from Google Fonts in `index.html`
  (Playfair 400/600/700/800 + italic 400/600; DM Sans 400–700 + italic 400; Noto Serif TC 400–700;
  Noto Sans TC 400/500/700). Use no other font.
- The mark: three rippling waves (`waveMark()` in `js/people.js`). Wordmark: 共振 / Resonance.
- Hand-drawn language: wobbly outlines from seeded bezier curves (`src/lib/design/wobRect.ts`,
  `wobCircle.ts`, `wavyPath.ts`, `prng.ts` in the Resonance repo; strokes are "one pen": 1.4 / 1 / 1.8 px
  at screen size, `src/lib/design/strokes.ts`). Port what you need into your own direction file.
- The blobs: `src/lib/design/driftingBlobs.ts` → ported here as `js/blobs.js` (see API below). The
  site's landing hero (`src/components/sections/HeroSection`) shows them drifting and fusing.
- The About page says it plainly: people get **flattened** into a school name, a job title, a follower
  count; stories make a person **立體** (three-dimensional) again. The team is shown "by name and face
  only: no school, major, year or title". A business card is the most flattening object there is; this
  one should not flatten. So: **no invented job titles**. The team name is `BRAND.team`
  (共振小隊 / The Resonance Crew).
- Team: `PEOPLE` in `js/people.js` (Chinese name, English name as on their passports, a photo, a SAMPLE
  e-mail). Photos are small square webp portraits in `assets/team/`.

## The folder and the contract

```
index.html          the proposal page (don't edit)
css/base.css        page + 3D card + face coordinate system (don't edit)
js/app.js           the shell: direction tabs, people, language, motion/grain toggles, print proof (don't edit)
js/card3d.js        the 3D card (Motion springs: lean, tap/drag/keys to turn, painted edges) (don't edit)
js/blobs.js         metaball engine (don't edit)
js/people.js        PEOPLE, BRAND, INK, waveMark (don't edit)
js/qr.js            qrSvg(text, { color, round }) (don't edit)
directions/<id>.js  ONE design direction: its default export is the contract below  ← you own yours
directions/<id>.css its styles (scope every rule under `[data-direction="<id>"]` or your own class prefix)
tools/shot.mjs      headless Chrome screenshots
```

A direction module's default export:

```js
export default {
  id: 'meet', letter: 'A', name: '相遇', enName: 'Meeting',
  orientation: 'landscape',            // or 'portrait' (54 × 90 mm)
  edgeColor: 'oklch(…)',               // optional: the card's edge (a painted edge shows as it turns)
  radiusMm: 0, thicknessMm: 0.7,       // optional
  pitch: '一句話：這個方向是什麼',          // zh-TW, shown beside the card
  notes: [{ k: '概念', v: '…' }, { k: '字級', v: '…' }, { k: '印刷', v: '…' }, { k: '動態', v: '…' }],
  langs: [{ id: 'both', label: '中英並列' }, { id: 'zh', label: '中文' }, …],  // first = default
  stillTime: 7.5,                      // seconds: the frame the still card and the print file show
  mount(faces, ctx) { …; return { destroy() { … } }; },
};
```

`faces.front` / `faces.back` = `{ root, art, content }`. `art` is an absolutely positioned layer that
covers the face **plus 2 mm bleed on every side**; `content` covers the trim box exactly. `mount` is
called for the 3D card (mode `live` or `still`) AND separately for each flat print proof (mode `print`),
so it must be pure: build DOM into the given elements, keep no module-level state, clean up in destroy().

`ctx`:
- `mode`: `'live'` (screen, moving) | `'still'` (screen, frozen at stillTime) | `'print'` (press: no grain,
  no motion, vector blobs). `ctx.live` is false for still, print and prefers-reduced-motion.
- `person`, `people`, `brand` (BRAND), `ink` (INK), `lang` (the picked langs id), `grain` (0 or 1: the
  viewer's toggle; always 0 in print).
- `trim` [w, h] mm, `bleed` 2, `box` = the art layer in **design units of 0.1 mm**, bleed included:
  `{ x: -20, y: -20, w: 940, h: 580 }` landscape / `{ x: -20, y: -20, w: 580, h: 940 }` portrait. The trim
  box is 0…900 × 0…540 (or 0…540 × 0…900).
- `blobs`: `js/blobs.js`. On screen use `blobs.canvasLayer(faces.x.art, { box, paper: ink.paper, grain })`
  then `layer.draw(blobList, t)` per frame; for still/print set `faces.x.art.innerHTML =
  blobs.blobSvg(blobList, t, { box, paper: ink.paper })` (vector; one blob = flat colour, two = gradient
  across the neck, more = embedded image). A blob = `{ x, y, R, seed, color, alpha, pace?, w?, stretch? }`
  in design units. `blobs.meeting(A, B, k)` stages two blobs closing in (k 0 → 1: apart → neck → one).
  `blobs.fieldAt`, `outlinePath`, `smoothstep`, `lerp` are there too.
- `qrSvg(text, { color })` → an SVG string; `ctx.url` is what the QR opens: the person's digital card (card.html#<id> on GitHub Pages).
  Keep a quiet zone of ≥ 2 modules round it; print it ≥ 14 mm wide.
- `waveMark(color, strokeWidth)` → the brand mark SVG string.
- `paintEdge(name, css)`: paint one edge of the 3D card ('l' | 'r' | 't' | 'b', a colour or a gradient);
  a no-op in the proof and print. A direction may also export `edgePaint: { r: css }` (static), `turnDir: -1`
  (the 翻面 button / Enter / taps turn it so the RIGHT edge comes toward the viewer; +1 the left) and
  `proofSpread: true` (the proof adds both faces side by side, trim to trim, as they meet at the shared edge).
  The front's right edge and the back's left edge (as seen) are the same physical edge, `.c3-edge-r`.
- `loop(fn)`: live → fn(t) every frame (30 fps, paused off-screen), t starting at stillTime; otherwise fn(stillTime)
  once. `onSide(fn)`: fn('front' | 'back') as the card turns over (live only). `ctx.side`: the side showing.
  Don't draw a hidden face's canvas every frame when you can avoid it.

Sizes: every face sets `--mm` (one millimetre of the printed card) and `--pt` (one point) as CSS
custom properties, whatever size the card is shown at. **Write all type and spacing as
`calc(var(--pt) * 8)` / `calc(var(--mm) * 4)`** so screen and print are the same design.

## Type (this is where most business cards fail)

- Chinese glyphs fill the em box; Latin x-height is about half of it. At the same font-size Chinese reads
  ~15–20 % bigger and much heavier. When Chinese sits beside Latin, set the Chinese at about **0.85–0.9×**
  the Latin size and one weight lighter, or give it its own deliberately smaller size and generous
  tracking (0.08–0.25em for a name). Never fake-bold Chinese; Noto weights 400–600 are plenty.
- Print minimums: Latin ≥ 6.5 pt, Chinese ≥ 7 pt; contact lines 6.5–7.5 pt; a name 10–15 pt (Chinese name
  often 11–13 pt with tracking). A card read at arm's length needs hierarchy from weight, space and
  colour, not from size jumps.
- Safe area: keep every word ≥ 4 mm inside the trim (3.5 mm absolute minimum).
- Contact lines: tabular figures where digits line up; e-mail and site as text people can type.
- zh-TW copy: a single sentence or fragment gets no 「。」 at the end. No em dashes (——, —) anywhere in copy.
- English names: as given ("Nian-Cheng Chen"). Small caps / letter-spaced caps only for short labels.

## Print

- 90 × 54 mm (Taiwan's standard), 2 mm bleed each side, the proof shows crop marks. Portrait is 54 × 90.
- Blobs print as vector paths (`blobSvg`). No digital grain in print: texture comes from the paper
  (cotton / textured fine paper, ~300–600 gsm) or the process (risograph's natural grain, where two
  overprinted spot inks make a third colour where blobs meet, which IS the fusion). Recommend real
  finishes only if they serve the idea (edge painting, letterpress / deboss of the wave mark, spot colour).
- Pastels shift in CMYK: say so in notes if a direction depends on a delicate colour.

## Motion (screen)

- The shell already does the 3D: lean toward the pointer, light glare, tap / drag / Enter / ← → to turn,
  spring physics, painted edges, an arrival settle, and one hint wiggle. Don't re-implement any of that.
- Your motion lives inside the faces: blobs breathing slowly (pace ≈ 1 is the hero's calm pace), two blobs
  meeting, something that answers the turn (`onSide`). One orchestrated moment beats many effects.
  Calm, slow, organic. Nothing loops fast, nothing bounces cartoonishly.
- Respect `ctx.live` (false under reduced motion: draw the still frame).

## Quality bar

- It must look designed by a good studio, specific to Resonance, not a template. Generous margins, a
  clear hierarchy, few elements. The blob fusion should be the memorable image.
- Both faces must hold up at true size (the print proof) AND on a phone (card ≈ 330 px wide landscape).
- Dark page theme: the card stays paper (it's an object on a dark desk); check it still looks right.
- No console errors. No layout overflow. Text never touches or crosses a blob edge awkwardly.

## Checking your work (do it, and look at the images)

The folder is served at http://127.0.0.1:4317 (already running). `tools/shot.mjs` drives Chrome over the
DevTools protocol in REAL time: the page opens at exactly the size you ask (any width), and the shot is
taken `--wait` ms (default 1500) after the page is ready, so `--wait=4000` shows a live card 4 s in.
`/card.html?d=<id>#<person>` is the recipient's page (the digital card as it will be shared).
`node tools/export.mjs <id> --people=chen` writes the print files (print/<id>/chen.pdf, 2 pages, 94 × 58 mm or
58 × 94, and 300 dpi PNGs of each face). Screenshots:

```
node tools/shot.mjs "/?d=<id>&view=card&motion=still" $SHOTS/<id>-front.png 1000 700 2
node tools/shot.mjs "/?d=<id>&view=card&motion=still&side=back" $SHOTS/<id>-back.png 1000 700 2
node tools/shot.mjs "/?d=<id>&view=flat" $SHOTS/<id>-flat.png 1100 460 2          # both faces at print size w/ bleed
node tools/shot.mjs "/?d=<id>&view=print&side=front" $SHOTS/<id>-print-front.png 400 260 3
node tools/shot.mjs "/?d=<id>" $SHOTS/<id>-page.png 1280 1600 1                     # the whole proposal page
node tools/shot.mjs "/?d=<id>" $SHOTS/<id>-mobile.png 390 1800 2                    # phone width
node tools/shot.mjs "/?d=<id>" $SHOTS/<id>-dark.png 1280 900 1 --dark
```

Add `&p=hsiao` (or fang, cheng) to see another person, `&lang=<id>` for a language option,
`&grain=0` to turn the grain off, `&motion=live` (default) to catch a moving frame
(the card's arrival animation runs for ~1.5 s; `--wait=6000` gives it time).
Use the Read tool on the PNGs to look at them. `$SHOTS` is given in your task.
Screenshots must not be written into this folder.
