/**
 * QR codes as SVG, drawn in the cards' own ink: each module a softly
 * rounded square, the three finder eyes as rounded rings — still a plain,
 * scannable code (error correction M, quiet zone left to the layout).
 *
 * Uses qrcode-generator (window.qrcode, loaded from jsDelivr in index.html).
 */

export function qrSvg(text, { color = 'currentColor', round = 0.38, className = 'qr' } = {}) {
  const make = window.qrcode;
  if (!make) return '';
  const qr = make(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const eye = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const k = Math.max(0, Math.min(0.5, round));
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (eye(r, c) || !qr.isDark(r, c)) continue;
      d += roundedRect(c + 0.06, r + 0.06, 0.88, 0.88, k * 0.88);
    }
  }
  const eyes = [
    [0, 0],
    [0, n - 7],
    [n - 7, 0],
  ]
    .map(([r, c]) =>
      // Outer ring 7×7 (stroke 1), inner 3×3.
      `<rect x="${c + 0.5}" y="${r + 0.5}" width="6" height="6" rx="${1.9 * k + 0.4}" fill="none" stroke="${color}" stroke-width="1"/>` +
      `<rect x="${c + 2}" y="${r + 2}" width="3" height="3" rx="${1.1 * k + 0.2}" fill="${color}"/>`,
    )
    .join('');
  return (
    `<svg class="${className}" viewBox="0 0 ${n} ${n}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR code: ${escapeAttr(text)}">` +
    `<path d="${d}" fill="${color}"/>${eyes}</svg>`
  );
}

function roundedRect(x, y, w, h, r) {
  const f = (v) => Math.round(v * 1000) / 1000;
  return (
    `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}` +
    `V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}` +
    `H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}` +
    `V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`
  );
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
