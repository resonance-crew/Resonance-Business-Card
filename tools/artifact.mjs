#!/usr/bin/env node
/**
 * Lays the site out for publishing as a claude.ai Artifact: the proposal page
 * without its own <html>/<head>/<body> wrapper (the Artifact host adds one),
 * and every file it loads beside it at the same relative paths.
 *
 *   node tools/artifact.mjs <out-dir>
 *
 * Prints the files map (published path → source) as JSON.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] ?? path.join(ROOT, '.artifact'));
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const page = fs
  .readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  .replace(/<!doctype html>\s*/i, '')
  .replace(/<html[^>]*>\s*/i, '')
  .replace(/<\/?head>\s*/gi, '')
  .replace(/<body[^>]*>\s*/i, '')
  .replace(/\s*<\/body>\s*<\/html>\s*$/i, '\n');
fs.writeFileSync(path.join(out, 'index.html'), page);

const files = {};
const walk = (dir) => {
  for (const name of fs.readdirSync(path.join(ROOT, dir))) {
    const rel = path.join(dir, name);
    const st = fs.statSync(path.join(ROOT, rel));
    if (st.isDirectory()) walk(rel);
    else if (/\.(js|css|svg|webp|png|html)$/.test(name)) {
      fs.mkdirSync(path.join(out, dir), { recursive: true });
      fs.copyFileSync(path.join(ROOT, rel), path.join(out, rel));
      files[rel] = path.join(out, rel);
    }
  }
};
for (const dir of ['css', 'js', 'directions', 'assets']) walk(dir);
fs.copyFileSync(path.join(ROOT, 'card.html'), path.join(out, 'card.html'));
files['card.html'] = path.join(out, 'card.html');
console.log(JSON.stringify(files, null, 2));
