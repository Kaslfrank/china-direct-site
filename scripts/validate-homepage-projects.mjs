import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const expected = JSON.parse(fs.readFileSync(path.join(root, 'data/homepage-projects.json'), 'utf8'));
const errors = [];
const start = html.indexOf('<section class="projects" id="projects">');
const end = html.indexOf('</section>', start);
const section = start < 0 || end < 0 ? '' : html.slice(start, end + 10);

if (!section) errors.push('Homepage #projects section is missing.');
if (/\bdata-project=|\bdata-open-project=/.test(section)) {
  errors.push('Legacy modal project cards are forbidden.');
}

const cards = [...section.matchAll(/<article\s+class="([^"]*\bprojects__item\b[^"]*)"[\s\S]*?<\/article>/g)];
const actual = [];

for (const [index, card] of cards.entries()) {
  const classes = card[1].split(/\s+/);
  const body = card[0];
  if (!classes.includes('projects__item--page')) errors.push('Card ' + (index + 1) + ' uses the legacy format.');
  const link = body.match(/href="(\/projects\/[^"#?]+\/)"/);
  if (!link) {
    errors.push('Card ' + (index + 1) + ' has no project page link.');
    continue;
  }
  const url = link[1];
  actual.push(url);
  if (!fs.existsSync(path.join(root, url.slice(1), 'index.html'))) errors.push('Missing page: ' + url);
  const image = body.match(/<img\s+[^>]*src="([^"]+)"/);
  if (!image || !fs.existsSync(path.join(root, image[1].replace(/^\//, '')))) errors.push('Missing image for: ' + url);
}

if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push('Homepage project list/order differs from data/homepage-projects.json.');
if (new Set(actual).size !== actual.length) errors.push('Homepage contains duplicate project cards.');

if (errors.length) {
  console.error(errors.map((error) => '- ' + error).join('\n'));
  process.exit(1);
}
console.log('Homepage projects validated: ' + actual.length);
