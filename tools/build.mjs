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

import { renderPage, SITE, BUILD_ENV, IS_PROD } from './layout.mjs';
import { exigerConfigurationProduction } from './production-guard.mjs';
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
  /* Avant d'écrire quoi que ce soit : une production incomplète ne doit pas
     exister, même à l'état de fichiers sur le disque. */
  exigerConfigurationProduction({ isProd: IS_PROD });

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
  process.stdout.write(
    IS_PROD
      ? 'Environnement : PRODUCTION — pages indexables, robots.txt ouvert.'
      : 'Environnement : PRÉPRODUCTION — pages en noindex.'
  );
  process.stdout.write(
    IS_PROD ? '' : ' Pour la production : BUILD_ENV=prod node tools/build.mjs'
  );
  process.stdout.write(String.fromCharCode(10));
}

/**
 * Sitemap SANS `<lastmod>`.
 *
 * Il portait la date du BUILD : les vingt-six dates changeaient donc à chaque
 * régénération, même quand pas une ligne de contenu n'avait bougé. Deux
 * conséquences concrètes — un diff parasite dans chaque commit, et un conflit
 * de fusion systématique dès que deux branches avaient été construites des
 * jours différents (quarante-deux marqueurs lors de la dernière intégration,
 * tous sur des `<lastmod>`).
 *
 * Et surtout, c'était une date fausse : `<lastmod>` doit désigner la dernière
 * modification du CONTENU, que le générateur ne connaît pas — les textes vivent
 * dans `tools/content/`, dont l'historique appartient à Git. L'élément est
 * facultatif dans la spécification, et un moteur ignore de toute façon un
 * `lastmod` qu'il juge peu fiable. On l'omet plutôt que de le fabriquer.
 */
async function writeSitemap(pages) {
  const urls = pages
    .map((page) => {
      const loc = `${SITE.baseUrl}/${page.path === 'index.html' ? '' : page.path}`;
      return `  <url>
    <loc>${loc}</loc>
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
  const prod = `# Expert Parquet — robots.txt (production)
User-agent: *
Allow: /
Disallow: /tools/

Sitemap: ${SITE.baseUrl}/sitemap.xml
`;

  // En préproduction, la protection qui compte reste le <meta name="robots">
  // de chaque page : un robots.txt servi sous un sous-dossier n'est pas celui
  // que les robots consultent — ils ne lisent que celui de la racine du
  // domaine. Ce fichier ne fait donc que dire l'intention.
  const preprod = `# Expert Parquet — robots.txt (PRÉPRODUCTION)
# Ce build n'est pas destiné à l'indexation.
User-agent: *
Disallow: /
`;

  await writeFile(join(ROOT, 'robots.txt'), IS_PROD ? prod : preprod, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
