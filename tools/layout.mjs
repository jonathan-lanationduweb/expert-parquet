/**
 * Gabarit HTML commun à toutes les pages du site.
 *
 * Ce fichier fait partie de l’outillage de développement (dossier `tools/`).
 * Il n’est PAS chargé par le site : il sert uniquement à générer les fichiers
 * HTML statiques livrés à la racine du projet. Voir tools/build.mjs.
 */

import { assetStamps, moduleScripts, STAMP_PARAM } from './fingerprint.mjs';
import { partnerFor, partnerUrl } from '../js/config/site.js';

export const SITE = {
  name: 'Expert Parquet',
  baseUrl: 'https://expert-parquet.com',
  locale: 'fr_FR',
  twitter: null, // aucun compte connu : pas de balise inventée
};

/**
 * Environnement de build — `preprod` (défaut) ou `prod`.
 *
 *     node tools/build.mjs                 → préproduction
 *     BUILD_ENV=prod node tools/build.mjs  → production
 *
 * Pourquoi la préproduction est le DÉFAUT, et non l'inverse : le site n'a qu'un
 * seul artefact, le HTML versionné, et il est publié par `git push`. Si le
 * défaut était `prod`, il suffirait d'oublier une variable d'environnement pour
 * qu'une préproduction devienne indexable — c'est l'erreur silencieuse. Avec ce
 * défaut, l'oubli produit l'erreur inverse : une production en `noindex`, qui
 * se voit immédiatement et se corrige par un rebuild. Entre une erreur visible
 * et une erreur invisible, on choisit la visible.
 *
 * Ce qui change, et rien d'autre :
 *
 * - `<meta name="robots">` : `noindex, nofollow` en préproduction.
 * - `robots.txt` : `Disallow: /` en préproduction, sans ligne `Sitemap`.
 *
 * Ce qui NE change PAS, volontairement : la balise `canonical`, les `og:url` et
 * les URL du sitemap continuent de désigner https://expert-parquet.com. Ce sont
 * les adresses définitives de ces contenus ; la préproduction n'est qu'un lieu
 * de relecture. Et sous `noindex`, la canonique n'est de toute façon plus lue.
 *
 * Rappel mesuré sur l'hébergement actuel : un `robots.txt` servi sous
 * `/expert-parquet/` n'est PAS celui que les robots consultent — ils lisent
 * celui de la racine du domaine. Sur GitHub Pages, la seule protection qui
 * fonctionne réellement est donc la balise `robots` de chaque page.
 */
export const BUILD_ENV = process.env.BUILD_ENV === 'prod' ? 'prod' : 'preprod';
export const IS_PROD = BUILD_ENV === 'prod';

export const NAV = [
  { label: 'Expertise', href: 'pages/expertise.html' },
  { label: 'Diagnostic', href: 'pages/diagnostic.html' },
  { label: 'Problèmes', href: 'pages/problemes.html' },
  { label: 'Conseils', href: 'pages/conseils.html' },
  { label: 'À propos', href: 'pages/a-propos.html' },
  { label: 'Contact', href: 'pages/contact.html' },
];

/** Footer en quatre colonnes, structuré comme un sommaire de dossier. */
const FOOTER_COLUMNS = [
  {
    title: 'Expertise',
    links: [
      { label: 'Diagnostic', href: 'pages/diagnostic.html' },
      { label: 'Problèmes', href: 'pages/problemes.html' },
      { label: 'Expertise parquet', href: 'pages/expertise.html' },
      { label: 'Demande de devis', href: 'pages/devis.html' },
    ],
  },
  {
    title: 'Comprendre',
    links: [
      { label: 'Conseils', href: 'pages/conseils.html' },
      { label: 'Choisir un parquet', href: 'pages/conseils/choisir-parquet.html' },
      { label: 'Entretien', href: 'pages/conseils/entretien.html' },
      { label: 'Rénovation', href: 'pages/conseils/renovation.html' },
      { label: 'Pose', href: 'pages/conseils/pose.html' },
      { label: 'FAQ', href: 'pages/faq.html' },
    ],
  },
  {
    /* Les enseignes ont leur place ici pour la meme raison que le reste du
       pied de page : c'est la zone ou l'on cherche « ou est-ce que je vais ? »
       quand on n'a pas trouve ailleurs. Deux liens, etiquetes par audience :
       envoyer un particulier vers une enseigne qui le refuse serait une
       impasse, alors le pied de page le dit avant le clic. */
    title: 'Solutions parquet',
    links: [
      { label: 'Choisir son parquet — Premibel', partenaire: 'premibel', besoin: 'selection' },
      { label: 'Approvisionnement professionnel — Over Parquet', partenaire: 'overparquet', besoin: 'supply', profil: 'professionnel' },
    ],
  },
  {
    title: 'Informations',
    links: [
      { label: 'À propos', href: 'pages/a-propos.html' },
      { label: 'Contact', href: 'pages/contact.html' },
      { label: 'Mentions légales', href: 'pages/mentions-legales.html' },
    ],
  },
];

/**
 * Texte nu, pour les données structurées : elles sont lues par des machines,
 * pas rendues comme du HTML. Un `&nbsp;` y resterait littéral et se
 * retrouverait indexé tel quel dans un fil d’Ariane ou un titre d’article.
 */
export function plainText(value) {
  return String(value)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[ \t\n]+/g, ' ')
    .trim();
}

/** Chemin relatif depuis une page située à `depth` niveaux sous la racine. */
export function rel(depth, path) {
  const prefix = depth === 0 ? '' : '../'.repeat(depth);
  return prefix + path;
}

/**
 * Empreintes de contenu des feuilles de style et du script d’entrée,
 * calculées une seule fois par build. Voir tools/fingerprint.mjs pour le
 * raisonnement.
 */
const STAMPS = assetStamps();

/** Chemin relatif estampillé de l’empreinte du contenu, s’il y en a une. */
export function relAsset(depth, path) {
  const stamp = STAMPS.get(path);
  const href = rel(depth, path);
  return stamp ? `${href}?${STAMP_PARAM}=${stamp}` : href;
}

/**
 * Table d’importation : chaque module reçoit son URL estampillée.
 *
 * ---------------------------------------------------------------------------
 * LE PROBLÈME
 *
 * `main.js` est cité par le HTML avec son empreinte, donc jamais servi périmé.
 * Ses `import` statiques, eux, désignent des URL nues — `./modules/carousel.js`.
 * Un correctif publié pouvait donc s’exécuter avec un module encore en cache :
 * du HTML neuf, un point d’entrée neuf, et une vieille version de
 * `carousel.js`. C’est arrivé pendant les essais du carrousel.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UNE TABLE D’IMPORTATION
 *
 * Elle réécrit les spécificateurs à l’exécution, dans le navigateur. Les
 * sources gardent donc des imports lisibles (`./modules/carousel.js`), aucun
 * fichier n’est copié ni réécrit, aucun empaqueteur n’entre dans le projet —
 * trois choses auxquelles ce site tient.
 *
 * Les clés sont écrites RELATIVEMENT à la page, comme toutes les autres URL
 * du site : une clé absolue (`/js/…`) casserait la promesse de fonctionner
 * dans un sous-dossier. Le navigateur résout clé et spécificateur en URL
 * absolues avant de les comparer, les deux formes se rejoignent donc.
 *
 * Un navigateur sans table d’importation ignore le bloc et charge les modules
 * à leur URL nue : exactement le comportement d’avant, jamais une erreur.
 *
 * La table doit précéder le premier script de type `module` — c’est une règle
 * du format, et c’est le cas ici : elle est émise juste au-dessus.
 */
export function importMap(depth) {
  /*
   * `./` explicite à la racine du site.
   *
   * Une clé qui ne commence ni par `/`, ni par `./`, ni par `../` n’est PAS
   * une URL pour le navigateur : c’est un spécificateur NU, du genre `lodash`,
   * et il ne sera jamais rapproché d’un `import './modules/carousel.js'`. À la
   * profondeur 0, `rel()` produit `js/modules/carousel.js` — la table aurait
   * donc été silencieusement sans effet sur la page d’accueil, et efficace
   * partout ailleurs. Le préfixe la rend URL-like à toutes les profondeurs.
   */
  const relatif = (path) => {
    const href = rel(depth, path);
    return href.startsWith('.') || href.startsWith('/') ? href : `./${href}`;
  };
  const relatifEstampille = (path) => {
    const href = relAsset(depth, path);
    return href.startsWith('.') || href.startsWith('/') ? href : `./${href}`;
  };

  const entrees = moduleScripts()
    .map((path) => `    "${relatif(path)}": "${relatifEstampille(path)}"`)
    .join(',\n');

  return `  <script type="importmap">
{
  "imports": {
${entrees}
  }
}
  </script>`;
}

/**
 * Logotype horizontal, en deux versions produites par tools/make-icons.mjs.
 * Sur fond sombre seul le LOGOTYPE est inversé, le symbole reste intact :
 * éclaircir le « P » en changerait la matière (voir make-icons.mjs).
 *
 * La version réservée n’est émise dans l’en-tête que sur les pages à hero
 * sombre — ailleurs elle serait chargée pour rien. C’est le même fichier que
 * celui du pied de page, donc une seule requête par visite.
 */
const LOGO = { width: 338, height: 128 };
const LOGO_ON_LIGHT = 'assets/brand/expert-parquet-logo-on-light.png';
const LOGO_ON_DARK = 'assets/brand/expert-parquet-logo-on-dark.png';

/**
 * Trois régimes de chargement, et non deux :
 *
 *   'haute'  visible au premier écran et sur le chemin du LCP
 *   'normal' présent au premier écran mais masqué par le CSS — il doit être
 *            téléchargé pour être prêt à l'affichage, sans passer devant
 *   'differe' hors du premier écran (pied de page, panneau du menu fermé)
 *
 * Le régime « normal » existe pour un cas précis : sur une page à hero sombre,
 * la version claire du logotype est masquée jusqu'au défilement. La passer en
 * `loading="lazy"` la ferait charger seulement au moment où elle s'affiche,
 * donc clignoter ; la laisser en `fetchpriority="high"` la faisait concourir
 * avec l'image du hero. Aucun attribut : elle se charge normalement, en file.
 */
function logoImg(depth, { inverse = false, className, chargement = 'differe' }) {
  const src = inverse ? LOGO_ON_DARK : LOGO_ON_LIGHT;
  const attr =
    chargement === 'haute' ? ' fetchpriority="high"' : chargement === 'differe' ? ' loading="lazy"' : '';
  return `<img class="${className}" src="${rel(depth, src)}" alt="" width="${LOGO.width}" height="${LOGO.height}"${attr} decoding="async">`;
}

function brand(depth, { over = false } = {}) {
  /* `fetchpriority="high"` va à la version RÉELLEMENT visible au premier écran.
     Sur une page à hero sombre, c'est la version réservée ; la version claire y
     est masquée jusqu'au défilement. Les deux étaient prioritaires : 89 Ko de
     logotype se disputaient la bande passante avec l'image du hero, qui porte
     le LCP. La version masquée reste téléchargée — il faut qu'elle soit prête
     à l'instant où la page défile — mais elle ne passe plus devant. */
  const light = logoImg(depth, { className: 'brand__logo', chargement: over ? 'normal' : 'haute' });
  const dark = over
    ? `
      ${logoImg(depth, { inverse: true, className: 'brand__logo brand__logo--inverse', chargement: 'haute' })}`
    : '';
  return `<a class="brand" href="${rel(depth, 'index.html')}" aria-label="Expert Parquet, retour à l’accueil">
      ${light}${dark}
    </a>`;
}

/**
 * Un lien de pied de page, interne ou commercial.
 *
 * Les liens commerciaux ne passent pas par `rel()` — ils sortent du site — et
 * portent `rel="sponsored noopener"` avec les memes attributs de mesure que
 * partout ailleurs. Une enseigne non configuree ne laisse rien : mieux vaut
 * une colonne plus courte qu'un lien mort.
 */
function lienPiedDePage(depth, lien) {
  if (!lien.partenaire) {
    return `<a href="${rel(depth, lien.href)}">${lien.label}</a>`;
  }

  const partenaire = partnerFor(lien.partenaire);
  const url = partenaire ? partnerUrl(lien.partenaire, 'pied-de-page', lien.profil || '') : null;
  if (!url) return '';

  const destination = lien.partenaire === 'overparquet' ? 'over-parquet' : lien.partenaire;
  const profil = lien.profil ? ` data-customer-type="${lien.profil}"` : '';
  return `<a href="${url.replace(/&/g, '&amp;')}" rel="sponsored noopener"`
    + ` data-event="commercial_orientation" data-destination="${destination}"`
    + ` data-besoin="${lien.besoin}"${profil} data-context="pied-de-page">${lien.label}</a>`;
}

function footerBrand(depth) {
  return `<a class="footer__wordmark" href="${rel(depth, 'index.html')}" aria-label="Expert Parquet, retour à l’accueil">${logoImg(depth, { inverse: true, className: 'footer__logo' })}</a>`;
}

/**
 * Croix de fermeture du drawer. Dessinée ici plutôt que dans le jeu d’icônes
 * de partials.mjs : ce dernier importe déjà `rel` depuis ce fichier, et une
 * importation croisée rendrait fragile l’initialisation de `STAMPS`.
 */
const CLOSE_ICON =
  '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" aria-hidden="true"><path d="M4.5 4.5 17.5 17.5M17.5 4.5 4.5 17.5"/></svg>';

function header(depth, current, over) {
  const items = NAV.map(
    (item) => `          <li><a class="nav__link" href="${rel(depth, item.href)}"${current === item.href ? ' aria-current="page"' : ''}>${item.label}</a></li>`
  ).join('\n');

  return `<header class="site-header${over ? ' site-header--over' : ''}" data-header>
  <div class="container site-header__inner">
    ${brand(depth, { over })}
    <nav class="nav" id="site-nav" data-nav aria-label="Navigation principale">
      <div class="nav__bar">
        ${logoImg(depth, { inverse: true, className: 'nav__logo' })}
        <button class="nav__close" type="button" data-nav-close aria-label="Fermer le menu">${CLOSE_ICON}</button>
      </div>
      <div class="nav__scroll">
        <ul class="nav__list">
${items}
        </ul>
      </div>
      <a class="btn btn--primary btn--block nav__cta-mobile" href="${rel(depth, 'pages/devis.html')}">Demander une expertise</a>
    </nav>
    <div class="header__actions">
      <a class="btn btn--primary btn--sm header__cta-desktop" href="${rel(depth, 'pages/devis.html')}">Demander une expertise</a>
      <button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-nav">
        <span class="visually-hidden">Ouvrir le menu</span>
        <span class="nav-toggle__bars" aria-hidden="true"><span></span><span></span><span></span></span>
      </button>
    </div>
  </div>
</header>`;
}

/**
 * Rappel d’action mobile. Non émis sur la page de demande elle-même : y
 * proposer « demander une expertise » n’aurait aucun sens.
 */
const PAGES_SANS_RAPPEL = new Set(['pages/devis.html', 'pages/contact.html']);

function stickyCta(depth, path) {
  /* Pas de rappel collant sur une page dont le contenu EST un formulaire : la
     barre fixe recouvrirait les actions d'étape, elles-mêmes collées en bas
     sur téléphone, et proposerait d'aller demander une expertise à quelqu'un
     qui est déjà en train de le faire. */
  if (PAGES_SANS_RAPPEL.has(path)) return '';
  return `<a class="sticky-cta" href="${rel(depth, 'pages/devis.html')}" data-sticky-cta>
  <span>Demander une expertise</span>
  <span class="sticky-cta__arrow" aria-hidden="true"></span>
</a>`;
}

function footer(depth) {
  const columns = FOOTER_COLUMNS.map(
    (column) => `        <div>
          <h2 class="footer__title">${column.title}</h2>
          <ul class="footer__list">
${column.links.map((link) => `            <li>${lienPiedDePage(depth, link)}</li>`).join('\n')}
          </ul>
        </div>`
  ).join('\n');

  return `<footer class="site-footer">
  <div class="container">
    <div class="footer__top">
      <div>
        ${footerBrand(depth)}
        <p class="footer__pitch">Comprendre l’origine d’un problème de parquet avant de décider comment intervenir.</p>
        <p class="footer__cta"><a class="btn btn--on-dark" href="${rel(depth, 'pages/contact.html')}">Nous écrire</a></p>
      </div>
      <div class="footer__cols">
${columns}
      </div>
    </div>
    <div class="footer__bottom">
      <p>&copy; <span data-current-year>2026</span> Expert Parquet — site indépendant.</p>
      <ul class="footer__legal-links">
        <li><a href="${rel(depth, 'pages/mentions-legales.html')}">Mentions légales</a></li>
      </ul>
    </div>
  </div>
</footer>`;
}

/**
 * Fil d’Ariane : `trail` = [{ label, href? }], le dernier élément est la page
 * courante. Retourne le HTML et le JSON-LD BreadcrumbList associé.
 */
export function breadcrumb(depth, trail) {
  if (!trail || trail.length === 0) return { html: '', jsonLd: null };

  const items = trail
    .map((item, index) => {
      const last = index === trail.length - 1;
      const content = last || !item.href
        ? `<span aria-current="page">${item.label}</span>`
        : `<a href="${rel(depth, item.href)}">${item.label}</a>`;
      return `        <li>${content}</li>`;
    })
    .join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: plainText(item.label),
      ...(item.href ? { item: `${SITE.baseUrl}/${item.href}` } : {}),
    })),
  };

  return {
    html: `<nav class="breadcrumb" aria-label="Fil d’Ariane">
      <ol>
${items}
      </ol>
    </nav>`,
    jsonLd,
  };
}

/**
 * Construit une page complète.
 *
 * @param {object} page
 * @param {string} page.title        <title> (sans le suffixe de marque)
 * @param {string} page.description  meta description
 * @param {string} page.path         chemin canonique, ex. 'pages/expertise.html'
 * @param {number} page.depth        profondeur du fichier (0 = racine)
 * @param {string} page.body         contenu HTML entre header et footer
 * @param {string[]} [page.css]      feuilles supplémentaires (chemins relatifs à /css)
 * @param {object[]} [page.jsonLd]   données structurées additionnelles
 * @param {string} [page.ogImage]    image Open Graph (chemin depuis la racine)
 * @param {string} [page.navCurrent] entrée de navigation à marquer active
 * @param {boolean} [page.headerOver] header transparent posé sur un hero sombre
 */
export function renderPage(page) {
  const {
    title,
    description,
    path,
    depth,
    body,
    css = [],
    jsonLd = [],
    ogImage = 'assets/images/hero.jpg',
    navCurrent = null,
    headerOver = false,
    bodyClass = '',
    fullTitle = null,
  } = page;

  const canonical = `${SITE.baseUrl}/${path === 'index.html' ? '' : path}`;
  const headTitle = fullTitle || `${title} | Expert Parquet`;
  const styles = ['fonts.css', 'variables.css', 'reset.css', 'base.css', 'layout.css', 'components.css', ...css]
    .map((file) => `  <link rel="stylesheet" href="${relAsset(depth, `css/${file}`)}">`)
    .join('\n');

  const structured = jsonLd
    .filter(Boolean)
    .map((data) => `  <script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`)
    .join('\n');

  const classes = [bodyClass, headerOver ? 'has-fixed-header' : ''].filter(Boolean).join(' ');

  return `<!doctype html>
<html lang="fr" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${headTitle}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="${IS_PROD ? 'index, follow' : 'noindex, nofollow'}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Expert Parquet">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${escapeAttr(headTitle)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE.baseUrl}/${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(headTitle)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="${SITE.baseUrl}/${ogImage}">

  <link rel="icon" type="image/png" sizes="32x32" href="${rel(depth, 'assets/icons/favicon-32x32.png')}">
  <link rel="icon" type="image/png" sizes="16x16" href="${rel(depth, 'assets/icons/favicon-16x16.png')}">
  <link rel="apple-touch-icon" href="${rel(depth, 'assets/icons/apple-touch-icon.png')}">
  <link rel="shortcut icon" href="${rel(depth, 'assets/icons/favicon.ico')}">
  <meta name="theme-color" content="#17181A">

  <link rel="preload" href="${rel(depth, 'assets/fonts/inter-latin-var.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${rel(depth, 'assets/fonts/inter-tight-latin-var.woff2')}" as="font" type="font/woff2" crossorigin>

${styles}

${importMap(depth)}
  <script type="module" src="${relAsset(depth, 'js/main.js')}"></script>
${structured}
</head>
<body${classes ? ` class="${classes}"` : ''}>
  <a class="skip-link" href="#main">Aller au contenu principal</a>
${header(depth, navCurrent, headerOver)}

  <main id="main">
${body}
  </main>

${footer(depth)}
${stickyCta(depth, path)}
</body>
</html>
`;
}

/**
 * Échappe une valeur d’attribut.
 *
 * Les titres et descriptions contiennent des `&nbsp;` (typographie française :
 * espace insécable devant les deux-points). Les échapper tels quels donnait
 * `&amp;nbsp;`, et les aperçus de partage affichaient littéralement
 * « parquet&nbsp;: … ». L’entité est donc d’abord ramenée au vrai caractère
 * insécable, AVANT l’échappement des esperluettes — l’ordre compte.
 */
export function escapeAttr(value) {
  return String(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
