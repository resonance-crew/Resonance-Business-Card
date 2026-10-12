/**
 * Where Chrome and the local server are, for the tools (cdp.mjs drives Chrome
 * over the DevTools protocol; shot.mjs and export.mjs use it).
 */
export const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const BASE = process.env.BASE ?? 'http://127.0.0.1:4317';

/** A path?query of this folder, or a full URL, as a URL on the local server. */
export function urlOf(target) {
  return target.startsWith('http') ? target : BASE + (target.startsWith('/') ? target : '/' + target);
}
