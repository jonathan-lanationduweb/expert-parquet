/**
 * Photographies : dimensions réelles, textes alternatifs, images responsives.
 *
 * Ce fichier fait partie de l’outillage de développement (dossier `tools/`).
 * Il n’est PAS chargé par le site.
 *
 * Trois problèmes résolus d’un coup.
 *
 * 1. LES DIMENSIONS SONT LUES, jamais déclarées : dans l'instantané éditorial
 *    (ce que WordPress a mesuré au téléversement) ou, à défaut, dans l’en-tête
 *    du fichier au moment du build. Elles ne peuvent pas diverger du fichier.
 *
 * 2. LE SITE NE SERT PLUS SES IMAGES DESKTOP AUX TÉLÉPHONES. Les variantes
 *    (480, 768, 1200, 1600) alimentent un `srcset`. Pour les images
 *    historiques elles vivent dans `assets/images/r/` ; pour celles ajoutées
 *    depuis la médiathèque, WordPress les génère et le build les recopie dans
 *    `assets/images/cms/r/`. La liste est établie d’après les fichiers
 *    RÉELLEMENT présents : sans variante, le `srcset` est omis, la page reste
 *    correcte.
 *
 * 3. LE TEXTE ALTERNATIF EST CELUI DU MÉDIA. Le rédacteur le renseigne dans la
 *    médiathèque ; un alt vide signifie « décorative » et donne `alt=""`.
 *    Il n'existe plus de registre d'images dans le code.
 *
 * La CLARTÉ (90e centile de luminance relative) vient elle aussi du média,
 * mesurée par le plugin au téléversement : au-dessus de 0,42, un texte blanc
 * posé sur la photographie demande un voile renforcé (`page-hero--clair`).
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rel } from './layout.mjs';
import { snapshot } from './cms/snapshot.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = join(ROOT, 'assets', 'images');

const SEUIL_CLARTE = 0.42;

/* ------------------------------------------------------------ registre */

let REGISTRE = null;

/** `nom de fichier → { alt, clarte, width, height }`, d'après l'instantané. */
function registre() {
  if (REGISTRE) return REGISTRE;
  REGISTRE = new Map();
  for (const m of Object.values(snapshot().media)) {
    REGISTRE.set(m.file, { alt: m.alt || null, clarte: m.clarte, width: m.width, height: m.height });
  }
  return REGISTRE;
}

function meta(fichier) {
  const m = registre().get(fichier);
  if (!m) throw new Error(`Image absente de l'instantané éditorial : ${fichier}. Téléversez-la dans la médiathèque et rattachez-la à un contenu.`);
  return m;
}

/** La photographie est-elle trop claire pour un texte blanc sans renfort ? */
export function estClaire(fichier) {
  const m = registre().get(fichier);
  return Boolean(m && typeof m.clarte === 'number' && m.clarte > SEUIL_CLARTE);
}

/* ------------------------------------------------------------ dimensions */

/** Dimensions déclarées dans le premier marqueur SOFn d’un JPEG. */
function tailleJpeg(buffer) {
  let i = 2;
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marqueur = buffer[i + 1];
    if (marqueur >= 0xc0 && marqueur <= 0xcf && marqueur !== 0xc4 && marqueur !== 0xc8 && marqueur !== 0xcc) {
      return { width: buffer.readUInt16BE(i + 7), height: buffer.readUInt16BE(i + 5) };
    }
    i += 2 + buffer.readUInt16BE(i + 2);
  }
  throw new Error('dimensions JPEG introuvables');
}

function taillePng(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const TAILLES = new Map();

export function dimensions(fichier) {
  /* Les images de la médiathèque : ce que WordPress a mesuré. Les images
     historiques : le fichier lui-même, car WordPress a pu en réduire une copie
     (`big_image_size_threshold`) alors que c'est l'original qui est servi. */
  const m = registre().get(fichier);
  if (fichier.startsWith('cms/') && m && m.width && m.height) return { width: m.width, height: m.height };
  if (!TAILLES.has(fichier)) {
    const buffer = readFileSync(join(DOSSIER, fichier));
    TAILLES.set(fichier, fichier.toLowerCase().endsWith('.png') ? taillePng(buffer) : tailleJpeg(buffer));
  }
  return TAILLES.get(fichier);
}

/* ------------------------------------------------------------ variantes */

const DISPONIBLES = new Map();

function listeVariantes(dossier) {
  if (!DISPONIBLES.has(dossier)) {
    DISPONIBLES.set(dossier, existsSync(dossier) ? readdirSync(dossier) : []);
  }
  return DISPONIBLES.get(dossier);
}

/** Dossier des variantes et chemin public d'une variante, selon l'origine de l'image. */
function emplacement(fichier) {
  const cms = fichier.startsWith('cms/');
  const nom = basename(fichier);
  const base = nom.replace(/\.[^.]+$/, '');
  const ext = nom.slice(base.length);
  return {
    dossier: cms ? join(DOSSIER, 'cms', 'r') : join(DOSSIER, 'r'),
    publique: (w) => (cms ? `assets/images/cms/r/${base}-${w}${ext}` : `assets/images/r/${base}-${w}${ext}`),
    base,
    ext,
  };
}

function variantes(fichier) {
  const { dossier, base, ext } = emplacement(fichier);
  const motif = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)${ext.replace('.', '\\.')}$`);
  return listeVariantes(dossier)
    .map((f) => {
      const m = f.match(motif);
      return m ? Number(m[1]) : null;
    })
    .filter((w) => w !== null)
    .sort((a, b) => a - b);
}

/* ------------------------------------------------------------ émission */

/**
 * Les données d'une photographie, sans balise — pour le code qui doit
 * REMPLACER une image déjà présente (vignette de survol de la liste des
 * désordres) : `src` ET `srcset`, jamais l'un sans l'autre.
 */
export function photoData(depth, fichier, { sizes = '100vw', alt: altForce } = {}) {
  const m = meta(fichier);
  const { width, height } = dimensions(fichier);
  const src = rel(depth, `assets/images/${fichier}`);
  const { publique } = emplacement(fichier);
  const largeurs = variantes(fichier);
  const srcset = largeurs.length
    ? [...largeurs.map((w) => `${rel(depth, publique(w))} ${w}w`), `${src} ${width}w`].join(', ')
    : null;

  return {
    src,
    srcset,
    sizes,
    width,
    height,
    alt: altForce !== undefined ? altForce : m.alt || '',
  };
}

/**
 * Balise `<img>` complète : dimensions réelles, `srcset`, `sizes`, chargement.
 * `priority` réserve `fetchpriority="high"` à la seule image du premier écran
 * qui porte le LCP : en poser partout revient à n’en prioriser aucune.
 */
export function photo(depth, fichier, { sizes = '100vw', priority = false, className = null, alt: altForce } = {}) {
  const { src, srcset, width, height, alt } = photoData(depth, fichier, { sizes, alt: altForce });

  const attrs = [
    className ? `class="${className}"` : null,
    `src="${src}"`,
    srcset ? `srcset="${srcset}"` : null,
    srcset ? `sizes="${sizes}"` : null,
    `alt="${alt || ''}"`,
    `width="${width}"`,
    `height="${height}"`,
    priority ? 'fetchpriority="high"' : 'loading="lazy"',
    'decoding="async"',
  ].filter(Boolean);

  return `<img ${attrs.join(' ')}>`;
}
