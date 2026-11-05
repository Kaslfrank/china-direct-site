import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const guardTag = '  <script src="/analytics-guard.js"></script>';

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.git') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(fullPath));
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(fullPath);
  }

  return files;
}

let changed = 0;
let guarded = 0;

for (const file of await htmlFiles(root)) {
  let html = await readFile(file, 'utf8');
  if (!html.includes('G-R8L3DZK9VP') && !html.includes('110906864')) continue;

  guarded += 1;
  const original = html;
  const eol = original.includes('\r\n') ? '\r\n' : '\n';

  if (!html.includes('/analytics-guard.js')) {
    html = html.replace(/<head>[ \t]*(?:\r?\n)?/i, `<head>${eol}${guardTag}${eol}`);
  }

  html = html.replace(
    /(^|\n)(\s*)ym\(110906864,\s*(['"])init\3,/g,
    '$1$2if (!window.__chinaDirectAnalyticsDisabled) ym(110906864, $3init$3,'
  );

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed += 1;
  }
}

console.log(`Analytics guard present on ${guarded} pages; updated ${changed}.`);
