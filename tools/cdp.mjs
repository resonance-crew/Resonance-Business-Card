/**
 * Headless Chrome driven over the DevTools protocol, for the print files:
 * exact paper sizes (the command line's --print-to-pdf rounds a 94 mm page
 * to whole CSS pixels and comes out ~0.2 mm short), exact-pixel PNGs at any
 * width (no window minimum), and waiting for the page to say it is ready
 * (fonts loaded) instead of guessing.
 *
 *   const chrome = await launch();
 *   await chrome.pdf('/?d=meet&view=print&side=both', 'out.pdf', { widthMm: 94, heightMm: 58 });
 *   await chrome.png('/?d=meet&view=print&side=front', 'out.png', { widthMm: 94, heightMm: 58, dpi: 300 });
 *   await chrome.close();
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CHROME, urlOf } from './chrome.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Chrome lays a 94 × 58 mm page out exactly but rounds the PDF's page box
 * (~0.2 mm over). Pull each /MediaBox in to the exact size, keeping the
 * top-left corner where the layout put it (PDF's origin is bottom-left, so
 * the excess comes off the right and the bottom). The new box is written
 * in the same number of bytes, so the file's cross-reference offsets hold.
 */
function exactBoxes(buf, widthMm, heightMm) {
  const W = (widthMm / 25.4) * 72;
  const H = (heightMm / 25.4) * 72;
  const text = buf.toString('latin1');
  let fixed = 0;
  const out = text.replace(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g, (whole, w, h) => {
    const ah = Number(h);
    const box = `/MediaBox [0 ${(ah - H).toFixed(2)} ${W.toFixed(2)} ${ah.toFixed(2)}]`;
    if (box.length > whole.length || Number(w) < W - 0.01 || ah < H - 0.01) return whole;
    fixed++;
    return box.slice(0, -1) + ' '.repeat(whole.length - box.length) + ']';
  });
  if (!fixed) console.warn('  (page box left as Chrome wrote it)');
  return Buffer.from(out, 'latin1');
}

export async function launch() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'rbc-cdp-'));
  const child = spawn(
    CHROME,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--hide-scrollbars',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: 'ignore', detached: true },
  );
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
  const [port] = fs.readFileSync(portFile, 'utf8').split('\n');
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  const waiters = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method) {
      for (const w of waiters.splice(0)) w(msg);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id;
      pending.set(n, { res, rej });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  await send('Page.enable');
  await send('Runtime.enable');

  async function open(target, { width, height, scale = 1, dark = false, mobile = false }) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }] });
    await send('Page.navigate', { url: urlOf(target) });
    // Wait for the page to say it's ready (app.js sets data-ready once fonts have loaded), then a beat.
    for (let i = 0; i < 150; i++) {
      await sleep(100);
      const r = await send('Runtime.evaluate', { expression: 'document.documentElement.dataset.ready === "1"', returnByValue: true }).catch(() => null);
      if (r?.result?.value) break;
    }
    await sleep(600);
  }

  return {
    async pdf(target, out, { widthMm, heightMm }) {
      await open(target, { width: Math.ceil((widthMm * 96) / 25.4), height: Math.ceil((heightMm * 96) / 25.4) });
      const { data } = await send('Page.printToPDF', {
        paperWidth: widthMm / 25.4,
        paperHeight: heightMm / 25.4,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        printBackground: true,
        preferCSSPageSize: false,
        scale: 1,
      });
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, exactBoxes(Buffer.from(data, 'base64'), widthMm, heightMm));
      return out;
    },
    async png(target, out, { widthMm, heightMm, dpi = 300 }) {
      // Exact device pixels, round(mm / 25.4 × dpi). Chrome sizes a capture in whole CSS px, so the
      // page is captured a hair larger at dpi / 96 and trimmed to size (≤ 1 px of bleed each side;
      // the PDF is the master, this is the preview).
      const pw = Math.round((widthMm / 25.4) * dpi);
      const ph = Math.round((heightMm / 25.4) * dpi);
      const scale = dpi / 96;
      const cw = Math.ceil(pw / scale);
      const ch = Math.ceil(ph / scale);
      await open(target, { width: cw, height: ch, scale: 1 });
      const { data } = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: cw, height: ch, scale },
        captureBeyondViewport: false,
      });
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, Buffer.from(data, 'base64'));
      spawnSync('sips', ['--cropToHeightWidth', String(ph), String(pw), out], { stdio: 'ignore' });
      spawnSync('sips', ['-s', 'dpiWidth', String(dpi), '-s', 'dpiHeight', String(dpi), out], { stdio: 'ignore' });
      return out;
    },
    /** The viewport as a PNG, in real time: `waitMs` after the page is ready (animations run as they would for a person). */
    async shot(target, out, { width = 1280, height = 860, scale = 1, dark = false, waitMs = 1500 } = {}) {
      await open(target, { width, height, scale, dark, mobile: width < 600 });
      await sleep(waitMs);
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
      fs.writeFileSync(out, Buffer.from(data, 'base64'));
      return out;
    },
    /**
     * The whole page at exactly `width` × `height` device px with nothing behind it (alpha), as a PNG:
     * laid out `width / scale` CSS px wide, so a page that fills the window's width scales with it.
     */
    async layer(target, out, { width, height, scale = 4 }) {
      await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
      await open(target, { width: width / scale, height: height / scale, scale });
      const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await send('Emulation.setDefaultBackgroundColorOverride', {});
      fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
      fs.writeFileSync(out, Buffer.from(data, 'base64'));
      return out;
    },
    /** The viewport as it is now (after evaluate() has acted on the page). */
    async capture(out) {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
      fs.writeFileSync(out, Buffer.from(data, 'base64'));
      return out;
    },
    /** Run a script in the page (for checks): returns its value. */
    async evaluate(expression) {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return r?.result?.value;
    },
    async close() {
      try {
        ws.close();
      } catch {
        /* closed */
      }
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        /* gone */
      }
      spawnSync('pkill', ['-f', profile], { stdio: 'ignore' });
      fs.rmSync(profile, { recursive: true, force: true });
    },
  };
}
