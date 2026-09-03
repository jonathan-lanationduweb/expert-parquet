#!/usr/bin/env node
/**
 * Générateur des pages statiques d’Expert Parquet.
 *
 * Pourquoi un générateur ? Le site compte une trentaine de pages qui partagent
 * exactement le même header, le même footer et les mêmes blocs (cartes
 * problèmes, bandeau CTA, processus). Les dupliquer à la main garantirait des
 * divergences. Le générateur produit du HTML statique pur : le site livré ne
 * dépend d’aucun runtime, Node n’est nécessaire que pour régénérer les pages.
 *
 * Usage :  node tools/build.mjs
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderPage, SITE } from './layout.mjs';
import { homePage } from './content/home.mjs';
import { corePages } from './content/core-pages.mjs';
import { formPages } from './content/form-pages.mjs';
import { problemPages } from './content/problem-pages.mjs';
import { advicePages } from './content/advice-pages.mjs';
import { articlePages } from './content/articles.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Priorités de sitemap par famille de pages. */
function priorityFor(path) {
  if (path === 'index.html') return '1.0';
  if (path.startsWith('pages/problemes/') || path.startsWith('articles/')) return '0.7';
  if (path === 'pages/devis.html' || path === 'pages/expertise.html' || path === 'pages/diagnostic.html') return '0.9';
  if (path === 'pages/mentions-legales.html') return '0.2';
  return '0.6';
}

async function main() {
  const pages = [
    homePage(),
    ...corePages(),
    ...formPages(),
    ...problemPages(),
    ...advicePages(),
    ...articlePages(),
  ];

  const seen = new Set();
  for (const page of pages) {
    if (seen.has(page.path)) throw new Error(`Chemin de page dupliqué : ${page.path}`);
    seen.add(page.path);

    const target = join(ROOT, page.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, renderPage(page), 'utf8');
    process.stdout.write(`  ✓ ${page.path}\n`);
  }

  await writeSitemap(pages);
  await writeRobots();

  process.stdout.write(`\n${pages.length} pages générées + sitemap.xml + robots.txt\n`);
}

async function writeSitemap(pages) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages
    .map((page) => {
      const loc = `${SITE.baseUrl}/${page.path === 'index.html' ? '' : page.path}`;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${page.lastmod || today}</lastmod>
    <priority>${priorityFor(page.path)}</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  await writeFile(join(ROOT, 'sitemap.xml'), xml, 'utf8');
}

async function writeRobots() {
  const content = `# Expert Parquet — robots.txt
User-agent: *
Allow: /
Disallow: /tools/

Sitemap: ${SITE.baseUrl}/sitemap.xml
`;
  await writeFile(join(ROOT, 'robots.txt'), content, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
