import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

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

try {
  await access(path.join(root, 'analytics-guard.js'));
} catch {
  failures.push('analytics-guard.js is missing');
}

let trackedPages = 0;

for (const file of await htmlFiles(root)) {
  const html = await readFile(file, 'utf8');
  if (!html.includes('G-R8L3DZK9VP') && !html.includes('110906864')) continue;

  trackedPages += 1;
  const relative = path.relative(root, file);
  const guardIndex = html.indexOf('/analytics-guard.js');
  const firstTrackerIndex = Math.min(
    ...[html.indexOf('G-R8L3DZK9VP'), html.indexOf('110906864')].filter((index) => index >= 0)
  );

  if (guardIndex < 0) failures.push(`${relative}: analytics guard tag is missing`);
  if (guardIndex > firstTrackerIndex) failures.push(`${relative}: analytics guard loads after a tracker`);
  if (/^\s*ym\(110906864,\s*(['"])init\1,/m.test(html)) {
    failures.push(`${relative}: Yandex Metrika init is not protected by the analytics guard`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Analytics guard validated on ${trackedPages} tracked pages.`);
