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
 * Solution — chaque URL de ressource porte une empreinte de son **contenu**,
 * calculée sur un contenu normalisé en LF (voir `normaliseEol`) afin de ne pas
 * dépendre des fins de ligne du checkout local.
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
 * - **Une empreinte par module JavaScript**, `main.js` compris. Les modules
 *   s’importent entre eux (`main.js` → `modules/*.js` → `config/*.js`) et sont
 *   chargés par des `import` statiques, à des URL que le HTML ne cite pas.
 *   C’est la table d’importation émise dans chaque page (voir
 *   `importMap()` dans tools/layout.mjs) qui associe chaque module à son URL
 *   estampillée : le HTML cite donc bien, indirectement, TOUTES les URL du
 *   graphe.
 *
 * Pourquoi une empreinte par fichier plutôt qu’une seule pour tout l’arbre :
 * corriger `carousel.js` ne doit pas forcer le retéléchargement de
 * `forms.js`, de `site.js` et du point d’entrée. Chaque module garde son cache
 * tant que son propre contenu ne bouge pas.
 *
 * Ce qui reste vrai — il faut REGÉNÉRER les pages après avoir modifié un
 * module : c’est le HTML qui porte la table. `tools/check.mjs` refuse un HTML
 * dont une empreinte ne correspond plus au fichier sur le disque, et signale
 * donc un build oublié.
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

/**
 * Contenu ramené à des fins de ligne LF, POUR LE CALCUL DE L’EMPREINTE
 * uniquement — aucun fichier source n’est réécrit.
 *
 * Sans cela l’empreinte dépend des octets présents sur le disque, donc de
 * `core.autocrlf` : Git réécrit les fins de ligne au checkout, mais seulement
 * sur les fichiers qu’il touche. Après un changement de branche l’arbre est
 * donc mixte, les empreintes changent sans qu’une seule ligne de CSS ait bougé,
 * et `tools/check.mjs` signale des « empreintes périmées » sur un clone neuf.
 *
 * L’empreinte devient ainsi indépendante du système, de `core.autocrlf` et du
 * mode de checkout : le même contenu donne partout la même valeur.
 */
export function normaliseEol(buffer) {
  const text = buffer.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return Buffer.from(text, 'utf8');
}

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
    hash.update(normaliseEol(readFileSync(file)));
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

  for (const file of walk(join(ROOT, 'js'))) {
    if (!file.endsWith('.js')) continue;
    stamps.set(posix(relative(ROOT, file)), hashTree([file]));
  }

  return stamps;
}

/**
 * Les modules chargés par `import`, c’est-à-dire tout `js/` sauf le point
 * d’entrée — lui est cité directement par le HTML, avec son `src`.
 *
 * Sert à construire la table d’importation. L’ordre est stable : deux builds
 * du même arbre produisent le même HTML, octet pour octet.
 */
export function moduleScripts() {
  return walk(join(ROOT, 'js'))
    .filter((file) => file.endsWith('.js'))
    .map((file) => posix(relative(ROOT, file)))
    /* `main.js` est cité directement ; `maintenance-admin.js` est un script
       autonome (barre admin du site statique), chargé par <script src>, pas
       importé — il n'a donc pas sa place dans la table d'importation. */
    .filter((path) => path !== 'js/main.js' && path !== 'js/maintenance-admin.js');
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
