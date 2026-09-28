/**
 * Prépare l'arborescence à publier.
 *
 * Le dépôt contient le site, mais pas seulement : il contient aussi le
 * générateur (`tools/`), la documentation technique (`docs/`, `*.md`) et le
 * backend WordPress. Tant que GitHub Pages sert la racine d'une branche, tout
 * cela part en ligne — y compris `docs/BACKEND-CONTRACT.md`, qui décrit le
 * champ leurre et la règle de durée minimale de l'anti-spam. Publier la
 * conception d'une protection, c'est l'affaiblir.
 *
 * Ce script recopie donc dans `dist/` ce qui est PUBLIC, et rien d'autre.
 *
 * Liste blanche, et non liste noire : une exclusion oubliée publie un fichier,
 * une inclusion oubliée en retire un — et l'erreur se voit tout de suite au
 * lieu de fuiter en silence. Le contrôle final compare d'ailleurs les pages
 * copiées au sitemap.
 *
 * Usage :
 *   BUILD_ENV=prod node tools/build.mjs   # génère le site indexable
 *   node tools/build-deploy.mjs           # prépare dist/
 */

import { cp, mkdir, rm, readdir, stat, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

/** Dossiers publiés intégralement. */
const DOSSIERS = ['css', 'js', 'assets', 'pages', 'articles'];

/** Fichiers publiés à la racine. */
const FICHIERS = ['index.html', 'robots.txt', 'sitemap.xml', '.nojekyll'];

/**
 * Filtre appliqué à l'intérieur des dossiers publiés.
 *
 * `assets/images/CREDITS.md` est le cas concret : un fichier de travail rangé
 * au milieu des photographies. La règle porte sur l'extension plutôt que sur
 * son nom, pour que le prochain fichier du même genre soit écarté sans qu'on
 * ait à y penser.
 */
const EXCLUS = /(^|[\\/])(\.|_)|\.(md|mjs|py|sh|bak|orig|tmp)$/i;

async function lister(dir, base = dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const complet = join(dir, e.name);
    const rel = relative(base, complet);
    if (EXCLUS.test(rel)) continue;
    if (e.isDirectory()) await lister(complet, base, out);
    else out.push(complet);
  }
  return out;
}

async function main() {
  if (!existsSync(join(ROOT, 'index.html'))) {
    console.error('index.html absent — lancer `node tools/build.mjs` d’abord.');
    process.exit(1);
  }

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  let copies = 0;
  let octets = 0;

  for (const nom of DOSSIERS) {
    const source = join(ROOT, nom);
    if (!existsSync(source)) continue;
    for (const fichier of await lister(source)) {
      const rel = relative(ROOT, fichier);
      const cible = join(DIST, rel);
      await mkdir(dirname(cible), { recursive: true });
      await cp(fichier, cible);
      octets += (await stat(fichier)).size;
      copies++;
    }
  }

  for (const nom of FICHIERS) {
    const source = join(ROOT, nom);
    if (!existsSync(source)) {
      if (nom === '.nojekyll') {
        /* Sans ce fichier, GitHub Pages passe la sortie dans Jekyll, qui
           ignore tout chemin commençant par un tiret bas. */
        await writeFile(join(DIST, nom), '');
        copies++;
        continue;
      }
      console.error(`  MANQUANT : ${nom}`);
      process.exit(1);
    }
    await cp(source, join(DIST, nom));
    octets += (await stat(source)).size;
    copies++;
  }

  /* --- Contrôle de sortie --------------------------------------------------
     Un script de publication qui ne vérifie pas ce qu'il vient de publier ne
     vaut pas mieux que la configuration qu'il remplace. */
  const publies = await lister(DIST);
  const relatifs = publies.map((f) => relative(DIST, f).split(sep).join('/'));

  const interdits = relatifs.filter((f) =>
    /^(tools|docs|backend|backend-private)\//.test(f) ||
    /\.(md|mjs|py|php|sh|bak|env)$/i.test(f) ||
    /^\.(git|kilo|vscode)/.test(f) ||
    /(^|\/)wp-config/i.test(f) ||
    /IDENTIFIANTS/i.test(f)
  );

  const pages = relatifs.filter((f) => f.endsWith('.html'));
  const sitemap = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].length;

  console.log(`\n  dist/ : ${copies} fichiers, ${(octets / 1048576).toFixed(1)} Mo`);
  console.log(`  pages HTML : ${pages.length}   URL au sitemap : ${urls}`);

  if (interdits.length) {
    console.error(`\n  REFUSÉ — ${interdits.length} fichier(s) qui n’ont rien à être publiés :`);
    for (const f of interdits.slice(0, 20)) console.error(`    - ${f}`);
    process.exit(1);
  }
  if (pages.length !== urls) {
    console.error(`\n  REFUSÉ — ${pages.length} pages copiées pour ${urls} URL au sitemap.`);
    process.exit(1);
  }

  console.log('  Aucun fichier interdit. Arborescence publiable.\n');
}

main();
