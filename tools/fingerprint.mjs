/**
 * Empreintes de contenu pour les feuilles de style et le script d’entrée.
 *
 * Ce fichier fait partie de l’outillage de développement (dossier `tools/`).
 * Il n’est PAS chargé par le site.
 *
 * Problème résolu — GitHub Pages sert **tout** en `Cache-Control: max-age=600`,
 * HTML compris. Un visiteur pouvait donc recevoir un HTML fraîchement déployé
 * accompagné d’une feuille de style mise en cache jusqu’à dix minutes plus tôt :
 * la page s’affichait avec l’ancien CSS. C’est exactement ce qui est arrivé au
 * déploiement du logo.
 *
 * Solution — chaque URL de ressource porte une empreinte de son **contenu**.
 * Tant que le fichier ne change pas, l’URL ne change pas et le cache joue
 * pleinement son rôle ; dès qu’il change, l’URL change et le navigateur est
 * *obligé* de retélécharger. Un HTML neuf ne peut donc plus être associé à un
 * CSS ancien : le HTML neuf ne cite même plus l’ancienne URL.
 *
 * Pas d’horodatage : `?v=Date.now()` produirait une URL neuve à chaque build,
 * y compris quand rien n’a bougé, et annulerait tout le bénéfice du cache.
 *
 * Deux granularités, pour une raison précise :
 *
 * - **Une empreinte par feuille de style.** Elles sont indépendantes (aucun
 *   `@import` dans ce projet), donc modifier `home.css` ne doit pas invalider
 *   `base.css`.
 *
 * - **Une seule empreinte pour tout `js/`, portée par `main.js`.** Les modules
 *   s’importent entre eux (`main.js` → `modules/*.js` → `config/*.js`) : une
 *   empreinte par fichier laisserait `main.js` inchangé quand seul
 *   `navigation.js` bouge, et l’URL citée par le HTML ne bougerait pas. En
 *   couvrant l’arbre entier, toute modification d’un module quelconque change
 *   l’URL du point d’entrée.
 *
 * Limite connue et assumée : les sous-modules sont chargés par des `import`
 * statiques, à des URL sans empreinte. Ils restent donc soumis au `max-age=600`
 * de GitHub Pages, comme le HTML lui-même. Fermer complètement cette fenêtre
 * imposerait de réécrire les spécificateurs d’import, donc de servir des copies
 * générées des sources — un dossier de build que ce projet n’a pas et ne veut
 * pas. Le gain réel visé ici, la désynchronisation HTML / CSS, est acquis.
 */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Nom du paramètre d’URL portant l’empreinte. */
export const STAMP_PARAM = 'v';

/** Longueur de l’empreinte : 8 hexadécimaux, soit 32 bits — largement assez. */
const LENGTH = 8;

/** Tous les fichiers d’un dossier, récursivement, en ordre stable. */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const posix = (path) => path.split(sep).join('/');

/**
 * Empreinte d’un arbre de fichiers : chemins **et** contenus sont hachés, pour
 * qu’un simple renommage change aussi l’empreinte. L’ordre est trié, donc le
 * résultat est reproductible d’une machine à l’autre.
 */
function hashTree(files) {
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(posix(relative(ROOT, file)));
    hash.update('\0');
    hash.update(readFileSync(file));
  }
  return hash.digest('hex').slice(0, LENGTH);
}

/**
 * Table `chemin du projet → empreinte`, calculée une fois par build.
 * Les clés sont les chemins tels que le gabarit les écrit, par exemple
 * `css/layout.css` ou `js/main.js`.
 */
export function assetStamps() {
  const stamps = new Map();

  for (const file of walk(join(ROOT, 'css'))) {
    if (!file.endsWith('.css')) continue;
    stamps.set(posix(relative(ROOT, file)), hashTree([file]));
  }

  const scripts = walk(join(ROOT, 'js')).filter((file) => file.endsWith('.js'));
  stamps.set('js/main.js', hashTree(scripts));

  return stamps;
}

/**
 * Vérifie qu’une URL estampillée porte bien l’empreinte du fichier actuel.
 * Utilisé par `tools/check.mjs` : détecte un HTML généré avant une
 * modification de CSS ou de JS, c’est-à-dire un build oublié.
 */
export function verifyStamp(projectPath, stamp) {
  const stamps = assetStamps();
  if (!stamps.has(projectPath)) return null;
  return stamps.get(projectPath) === stamp;
}
