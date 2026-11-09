import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = path.join(root, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const listed = new Set(
  [...sitemap.matchAll(/<loc>(https:\/\/www\.chinadirect\.pro\/[^<]*)<\/loc>/g)].map((match) => match[1]),
);
const contentRoots = ['projects', 'en/projects', 'services', 'en/services', 'blog', 'en/blog'];
const expected = [];

function collectIndexPages(relativeDirectory) {
  const directory = path.join(root, relativeDirectory);
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) collectIndexPages(relative);
    if (entry.isFile() && entry.name === 'index.html') {
      expected.push(`https://www.chinadirect.pro/${relativeDirectory.replace(/\\/g, '/')}/`);
    }
  }
}

for (const directory of contentRoots) collectIndexPages(directory);

const errors = [];
for (const url of expected) {
  if (!listed.has(url)) errors.push(`Missing from sitemap: ${url}`);
}

for (const url of listed) {
  const pathname = new URL(url).pathname;
  if (!/^\/(?:en\/)?(?:projects|services|blog)\//.test(pathname)) continue;
  const file = path.join(root, pathname.slice(1), 'index.html');
  if (!fs.existsSync(file)) errors.push(`Sitemap URL has no index.html: ${url}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`Sitemap validated: ${expected.length} content pages listed.`);
