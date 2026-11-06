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
 *
 * Le contenu vient de l'instantané éditorial (data/content/snapshot.json, voir
 * tools/cms/). BUILD_OUT désigne un autre dossier de sortie (prévisualisation) ;
 * EP_SNAPSHOT un autre instantané (brouillons compris).
 */

import { writeFile, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderPage, SITE, BUILD_ENV, IS_PROD } from './layout.mjs';
import { seo } from './cms/site.mjs';
import { exigerConfigurationProduction } from './production-guard.mjs';
import { homePage } from './content/home.mjs';
import { notFoundPage } from './content/not-found.mjs';
import { corePages } from './content/core-pages.mjs';
import { finderPage } from './content/finder-page.mjs';
import { formPages } from './content/form-pages.mjs';
import { problemPages } from './content/problem-pages.mjs';
import { advicePages } from './content/advice-pages.mjs';
import { articlePages } from './content/articles.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
/* Dossier de sortie : la racine du projet, sauf prévisualisation. */
const OUT = process.env.BUILD_OUT ? resolve(process.env.BUILD_OUT) : ROOT;

/** Priorités de sitemap par famille de pages. */
function priorityFor(path) {
  if (path === 'index.html') return '1.0';
  if (path.startsWith('pages/problemes/') || path.startsWith('articles/')) return '0.7';
  if (path === 'pages/devis.html' || path === 'pages/expertise.html' || path === 'pages/diagnostic.html' || path === 'pages/trouver-mon-parquet.html') return '0.9';
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
    finderPage(),
    ...formPages(),
    ...problemPages(),
    ...advicePages(),
    ...articlePages(),
  ];

  const seen = new Set();
  for (const page of pages) {
    if (seen.has(page.path)) throw new Error(`Chemin de page dupliqué : ${page.path}`);
    seen.add(page.path);
  }

  /* Aucune adresse historique ne disparaît par accident : dépublier dans
     WordPress un contenu qui a déjà eu une URL publique arrête le build, avec
     la marche à suivre. Retirer une URL est une décision de développement
     (liste + redirection), pas un clic. */
  await exigerUrlsHistoriques(seen);

  for (const page of pages) {

    const target = join(OUT, page.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, renderPage(page), 'utf8');
    process.stdout.write(`  ✓ ${page.path}\n`);
  }

  await writeSitemap(pages);
  await writeRobots();

  /* La page 404 est produite À PART : servie pour toute adresse inexistante,
     elle n'est pas une page de contenu et ne doit donc jamais figurer au
     sitemap. Elle se déclare `noindex` et porte son propre `base href`. */
  await writeFile(join(OUT, '404.html'), renderPage(notFoundPage()), 'utf8');
  process.stdout.write('  ✓ 404.html (hors sitemap)\n');

  /* Les pages que le build ne produit plus (contenu dépublié, slug changé)
     sont retirées : un fichier orphelin resterait servi, hors sitemap, et
     ferait échouer le contrôle qualité. */
  const retirees = await retirerPagesOrphelines(seen);
  for (const r of retirees) process.stdout.write(`  − ${r} (retirée)\n`);

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

async function exigerUrlsHistoriques(seen) {
  let liste;
  try {
    liste = JSON.parse(await readFile(join(ROOT, 'data', 'content', 'urls-historiques.json'), 'utf8')).pages || [];
  } catch {
    return;
  }
  const manquantes = liste.filter((p) => !seen.has(p));
  if (manquantes.length) {
    throw new Error(
      `Adresse(s) historique(s) absente(s) du build : ${manquantes.join(', ')}.\n` +
        'Un contenu qui a déjà eu une URL publique a été dépublié ou renommé dans WordPress. ' +
        'Republiez-le, ou retirez l’adresse de data/content/urls-historiques.json en prévoyant une redirection.'
    );
  }
}

/** Les fichiers HTML des dossiers générés qui ne correspondent plus à aucune page. */
async function retirerPagesOrphelines(seen) {
  const retirees = [];
  const marcher = async (dossier, prefixe) => {
    let entrees;
    try {
      entrees = await readdir(join(OUT, dossier));
    } catch {
      return;
    }
    for (const nom of entrees) {
      const relatif = `${prefixe}${nom}`;
      const s = await stat(join(OUT, dossier, nom));
      if (s.isDirectory()) await marcher(join(dossier, nom), `${relatif}/`);
      else if (nom.endsWith('.html') && !seen.has(relatif)) {
        await rm(join(OUT, dossier, nom));
        retirees.push(relatif);
      }
    }
  };
  await marcher('pages', 'pages/');
  await marcher('articles', 'articles/');
  return retirees;
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
  await writeFile(join(OUT, 'sitemap.xml'), xml, 'utf8');
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

  /* En production, l'administrateur peut fermer l'indexation (Site → SEO) :
     le robots.txt suit la balise robots des pages. */
  await writeFile(join(OUT, 'robots.txt'), IS_PROD && seo().indexation ? prod : preprod, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
