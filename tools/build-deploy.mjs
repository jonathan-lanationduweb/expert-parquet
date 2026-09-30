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

  /* La table des hôtes de développement ne part pas en ligne. Elle est
     délimitée dans la source par deux marques ; ici on remplace ce qu'elles
     encadrent, sans jamais toucher au fichier d'origine. */
  await neutraliserBlocsDeDeveloppement(join(DIST, 'js', 'config', 'site.js'));

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

  /* --- Ce que le CONTENU ne doit pas contenir -----------------------------

     Le contrôle des chemins ne suffit pas : un secret ou une adresse de
     développement peut vivre à l'intérieur d'un fichier parfaitement légitime.
     On relit donc le texte publié. Deux familles seulement, celles qui font
     réellement des dégâts : ce qui ne devrait jamais sortir, et ce qui trahit
     un build fait depuis un poste de développement. */
  const suspects = [];
  const adressesDev = [];
  for (const f of relatifs) {
    if (!/\.(html|css|js|json|xml|txt)$/i.test(f)) continue;
    const texte = await readFile(join(DIST, f), 'utf8');

    for (const [nom, motif] of Object.entries(SECRETS)) {
      if (motif.test(texte)) suspects.push(`${f} — ${nom}`);
    }
    const dev = texte.match(/https?:\/\/[^"'\s)]*(\.local|\.test|localhost|127\.0\.0\.1|192\.168\.)[^"'\s)]*/gi);
    if (dev) adressesDev.push(`${f} — ${[...new Set(dev)].slice(0, 2).join(', ')}`);
  }

  if (suspects.length) {
    console.error(`\n  REFUSÉ — ${suspects.length} fichier(s) portant une valeur qui ne doit pas être publiée :`);
    for (const x of suspects.slice(0, 20)) console.error(`    - ${x}`);
    process.exit(1);
  }
  if (adressesDev.length) {
    console.error(`\n  REFUSÉ — ${adressesDev.length} fichier(s) citant une adresse de développement :`);
    for (const x of adressesDev.slice(0, 20)) console.error(`    - ${x}`);
    process.exit(1);
  }

  console.log('  Aucun fichier interdit, aucun secret, aucune adresse de développement.\n');
}

/**
 * Motifs de secrets. Volontairement peu nombreux et précis : une liste large
 * produirait des faux positifs sur du texte éditorial, et une alerte qui crie
 * trop souvent finit par ne plus être lue.
 */
const SECRETS = {
  'clé ou sel WordPress': /\b(AUTH|SECURE_AUTH|LOGGED_IN|NONCE)_(KEY|SALT)\b/,
  'identifiants de base': /\bDB_(PASSWORD|USER|NAME)\b/,
  'réglage SMTP': /\bEP_SMTP_(PASS|USER|HOTE)\b/,
  'mot de passe en clair': /(?:mot de passe|password|passwd)\s*[:=]\s*['"]?\S{6,}/i,
  'clé privée': /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  'jeton d’API': /\b(?:api[_-]?key|access[_-]?token|bearer)\s*[:=]\s*['"]?[A-Za-z0-9_-]{16,}/i,
};

/**
 * Vide les régions marquées `DEV-ONLY` d'un fichier de l'artefact.
 *
 * On ne supprime pas la déclaration : le reste du module s'en sert. On la
 * laisse VIDE, ce qui donne exactement le comportement voulu en production —
 * aucun hôte local connu, donc aucun point d'envoi local, et ce sont les
 * `FORMS.*Endpoint` qui décident.
 */
async function neutraliserBlocsDeDeveloppement(fichier) {
  let texte;
  try {
    texte = await readFile(fichier, 'utf8');
  } catch {
    return;
  }
  const regions = /\/\* DEV-ONLY:START[\s\S]*?DEV-ONLY:END \*\//g;
  if (!regions.test(texte)) return;
  const nettoye = texte.replace(
    regions,
    '/* Table des hôtes de développement retirée à la publication. */\nconst LOCAL_API = {};'
  );
  await writeFile(fichier, nettoye, 'utf8');
  console.log('  Bloc de développement retiré de js/config/site.js');
}

main();
