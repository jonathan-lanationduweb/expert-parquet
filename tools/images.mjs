/**
 * Photographies : dimensions réelles, textes alternatifs, images responsives.
 *
 * Ce fichier fait partie de l’outillage de développement (dossier `tools/`).
 * Il n’est PAS chargé par le site.
 *
 * Trois problèmes résolus d’un coup.
 *
 * 1. LES DIMENSIONS ÉTAIENT FAUSSES. Soixante-cinq balises `<img>` déclaraient
 *    un `width`/`height` sans rapport avec le fichier — `entretien.jpg` était
 *    annoncée en 1800 × 1200 alors qu’elle mesure 1400 × 2100, soit un portrait
 *    déclaré en paysage. Les conteneurs `aspect-ratio` masquaient le symptôme,
 *    mais la donnée restait fausse dans la source. Les dimensions sont
 *    désormais LUES dans l’en-tête du fichier au moment du build : elles ne
 *    peuvent plus diverger.
 *
 * 2. LE SITE SERVAIT SES IMAGES DESKTOP AUX TÉLÉPHONES. `hero.jpg` fait
 *    2000 px de large et 228 Ko ; un écran de 375 px en recevait l’intégralité.
 *    `tools/make-images.py` produit des variantes dans `assets/images/r/`, et
 *    ce module construit le `srcset` correspondant. La liste est établie
 *    d’après les fichiers RÉELLEMENT présents : si les variantes n’ont pas été
 *    générées, le `srcset` est simplement omis et la page reste correcte.
 *
 * 3. TOUS LES `alt` ÉTAIENT VIDES. Y compris sur des photographies censées
 *    illustrer un symptôme.
 *
 * Sur les textes alternatifs, une règle de méthode : chaque description
 * ci-dessous correspond à ce que la photographie montre RÉELLEMENT, après
 * l’avoir regardée. Plusieurs visuels de la bibliothèque ne montrent pas leur
 * sujet (voir assets/images/CREDITS.md) ; ils sont marqués décoratifs (`alt`
 * nul) plutôt que décrits par le titre de la page qui les accueille. Décrire
 * une flaque d’eau en forêt comme « traces d’humidité sur un parquet » serait
 * faux pour un lecteur d’écran, et remplir un `alt` de mots-clés ne rendrait
 * service à personne.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rel } from './layout.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = join(ROOT, 'assets', 'images');
const VARIANTES = join(DOSSIER, 'r');

/**
 * Texte alternatif de chaque photographie.
 *
 * `null` = image décorative : elle n’apporte aucune information que le texte
 * voisin ne porte déjà, et un lecteur d’écran doit l’ignorer (`alt=""`).
 * C’est le cas des fonds de hero — posés sous un dégradé, derrière un titre —
 * et des textures de bois employées comme aplats.
 *
 * `horsSujet` signale une photographie qui n’illustre pas le sujet de la page
 * où elle est employée. Elle reste décorative en attendant un remplacement ;
 * l’indication est là pour que ce constat ne se perde pas.
 */
export const PHOTOS = {
  'hero.jpg': {
    clarte: 0.57, alt: null },
  'hero-wide.jpg': {
    clarte: 0.87,
    alt: 'Chambre lumineuse ouverte sur de grandes baies vitrées, parquet en lames larges',
  },
  'architectural.jpg': {
    clarte: 0.77,
    alt: 'Pièce blanche vide au parquet posé en point de Hongrie, ouverte sur un jardin',
  },
  'interieur-clair.jpg': {
    clarte: 0.64,
    alt: 'Séjour aux tons beiges meublé sobrement, parquet en chêne clair',
  },
  'inspection.jpg': {
    clarte: 0.54,
    alt: 'Main relevant une mesure au mètre ruban sur une lame de bois',
  },
  'entretien.jpg': {
    clarte: 0.92,
    alt: 'Personne passant un balai à franges sur un sol en bois',
  },
  'lames-bougent.jpg': {
    clarte: 0.23,
    alt: 'Plancher en lames courtes et irrégulières vu en enfilade',
  },
  'rayures.jpg': {
    clarte: 0.11,
    alt: 'Plancher ancien très sombre, profondément marqué et taché',
  },
  'pose-support.jpg': {
    clarte: 0.60,
    alt: 'Surface lisse et uniforme d’une dalle béton avant pose',
  },
  // --- Textures employées comme aplats : rien à décrire -----------------------
  'domaine-diagnostic.jpg': {
    clarte: 0.07, alt: null },
  'domaine-desordres.jpg': {
    clarte: 0.19, alt: null },
  'grincement.jpg': {
    clarte: 0.26, alt: null },
  'parquet-detail.jpg': {
    clarte: 0.14, alt: null },
  'parquet-chevrons.jpg': {
    clarte: 0.39,
    alt: 'Parquet en damier au ras du sol, à la jonction d’un mur et de sa plinthe, traversé par une bande de lumière',
  },
  // --- Photographies hors sujet, décoratives par défaut -----------------------
  'taches.jpg': {
    clarte: 0.67,
    alt: null,
    horsSujet: 'Grand parquet clair en bon état : aucune tache ni rayure visible, alors que le visuel illustre la page Parquet abîmé.',
  },
  'parquet-ancien.jpg': {
    clarte: 0.70,
    alt: null,
    horsSujet: 'Pièce neuve vide au sol stratifié gris : ce n’est pas un parquet ancien.',
  },
  'soulevement.jpg': {
    clarte: 0.45,
    alt: null,
    horsSujet: 'Planches plates et régulières : aucun bombement ni tuilage visible, alors que le visuel illustre le soulèvement.',
  },
};

/**
 * Au-dessus de ce seuil de clarté, un texte blanc posé sur la photographie
 * n'atteint plus 4,5:1 avec le voile ordinaire : le hero passe en voile
 * renforcé (`page-hero--clair`, css/pages/home.css).
 *
 * `clarte` est le 90e centile de luminance relative de chaque fichier, mesuré
 * une fois et recopié ci-dessus. Le 90e centile plutôt que la moyenne : ce qui
 * rend un texte illisible n'est pas la clarté générale de l'image mais la zone
 * claire qui passe derrière les lettres.
 */
const SEUIL_CLARTE = 0.42;

/** La photographie est-elle trop claire pour un texte blanc sans renfort ? */
export function estClaire(fichier) {
  const meta = PHOTOS[fichier];
  return Boolean(meta && meta.clarte !== undefined && meta.clarte > SEUIL_CLARTE);
}

/* --- Dimensions réelles ----------------------------------------------------- */

/** Dimensions déclarées dans le premier marqueur SOFn d’un JPEG. */
function tailleJpeg(buffer) {
  let i = 2;
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marqueur = buffer[i + 1];
    // SOF0..SOF15, en excluant DHT (C4), JPG (C8) et DAC (CC).
    if (marqueur >= 0xc0 && marqueur <= 0xcf && marqueur !== 0xc4 && marqueur !== 0xc8 && marqueur !== 0xcc) {
      return { width: buffer.readUInt16BE(i + 7), height: buffer.readUInt16BE(i + 5) };
    }
    i += 2 + buffer.readUInt16BE(i + 2);
  }
  throw new Error('dimensions JPEG introuvables');
}

const TAILLES = new Map();

export function dimensions(fichier) {
  if (!TAILLES.has(fichier)) {
    TAILLES.set(fichier, tailleJpeg(readFileSync(join(DOSSIER, fichier))));
  }
  return TAILLES.get(fichier);
}

/* --- Variantes disponibles --------------------------------------------------- */

const DISPONIBLES = existsSync(VARIANTES)
  ? readdirSync(VARIANTES).filter((f) => f.endsWith('.jpg'))
  : [];

function variantes(fichier) {
  const base = fichier.replace(/\.jpg$/, '');
  return DISPONIBLES.map((f) => {
    const m = f.match(new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)\\.jpg$`));
    return m ? Number(m[1]) : null;
  })
    .filter((w) => w !== null)
    .sort((a, b) => a - b);
}

/* --- Émission ---------------------------------------------------------------- */

/**
 * Balise `<img>` complète : dimensions réelles, `srcset`, `sizes`, chargement.
 *
 * `sizes` décrit la largeur d’AFFICHAGE de l’image selon le viewport. C’est
 * l’information que le navigateur ne peut pas deviner avant d’avoir la mise en
 * page, et sans laquelle il suppose `100vw` — donc télécharge trop grand.
 *
 * `priority` réserve `fetchpriority="high"` à la seule image du premier écran
 * qui porte le LCP : en poser partout revient à n’en prioriser aucune.
 */
/**
 * Les données d'une photographie, sans balise.
 *
 * Sert au code qui doit REMPLACER une image déjà présente dans le document —
 * la vignette de survol de la liste des désordres, par exemple. Un tel
 * remplacement doit porter sur `src` ET `srcset` : dès qu'un `srcset` est
 * présent, le navigateur choisit parmi ses candidats et **ignore `src`**, qui
 * n'est plus qu'un repli pour les navigateurs sans `srcset`. Changer le seul
 * `src` ne change donc rien à l'écran (vérifié : l'image restait bloquée sur
 * la première du catalogue).
 *
 * Cette fonction existe pour que le JavaScript n'ait jamais à reconstruire un
 * `srcset` à la main : ce fichier reste la source de vérité.
 */
export function photoData(depth, fichier, { sizes = '100vw', alt: altForce } = {}) {
  const meta = PHOTOS[fichier];
  if (!meta) throw new Error(`Photographie non déclarée dans tools/images.mjs : ${fichier}`);

  const { width, height } = dimensions(fichier);
  const src = rel(depth, `assets/images/${fichier}`);
  const largeurs = variantes(fichier);
  const srcset = largeurs.length
    ? [
        ...largeurs.map((w) => `${rel(depth, `assets/images/r/${fichier.replace(/\.jpg$/, '')}-${w}.jpg`)} ${w}w`),
        `${src} ${width}w`,
      ].join(', ')
    : null;

  return {
    src,
    srcset,
    sizes,
    width,
    height,
    alt: altForce !== undefined ? altForce : meta.alt || '',
  };
}

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

/** Photographies dont le contenu ne correspond pas à leur emploi. */
export function horsSujet() {
  return Object.entries(PHOTOS)
    .filter(([, meta]) => meta.horsSujet)
    .map(([fichier, meta]) => ({ fichier, motif: meta.horsSujet }));
}
