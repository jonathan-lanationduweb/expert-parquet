/**
 * Gabarit HTML commun à toutes les pages du site.
 *
 * Ce fichier fait partie de l’outillage de développement (dossier `tools/`).
 * Il n’est PAS chargé par le site : il sert uniquement à générer les fichiers
 * HTML statiques livrés à la racine du projet. Voir tools/build.mjs.
 */

import { assetStamps, moduleScripts, STAMP_PARAM } from './fingerprint.mjs';
import { partnerFor, partnerUrl } from '../js/config/site.js';
import { media } from './cms/snapshot.mjs';
/* La configuration du site (Site → Identité / Apparence / Navigation / Footer / SEO).
   theme.mjs est importé AVANT le calcul des empreintes : il écrit css/theme.css. */
import './cms/theme.mjs';
import { logos, favicon, ogParDefaut, entreesMenu, navigationSite, footer as footerConfig, seo, PAGES_INTERNES, PARCOURS, PARTENAIRES, cheminMedia } from './cms/site.mjs';
import { ICONES_LIENS } from './partials-icones.mjs';

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

/* L'ordre dit le positionnement : on entre par le problème (diagnostic,
   désordres, conseils) ; l'expertise reste accessible mais n'ouvre plus le
   menu — elle est la troisième conversion, pas la première (README,
   « Hiérarchie des conversions »). */
/* Les trois parcours d'abord : problème (Problèmes, Conseils, Diagnostic),
   expertise, puis À propos. « Trouver mon parquet » est le bouton du header,
   pas une entrée de menu — un seul lien pour une seule destination. Contact est
   une fonction utilitaire : il reste dans le pied de page et sur À propos. */
/* Les destinations possibles du menu : fermées, dans le code. L'ordre, la
   visibilité et le libellé de chaque entrée se règlent dans WordPress
   (Contenu → Navigation) et arrivent par l'instantané. */
export const DESTINATIONS_NAV = {
  problemes: 'pages/problemes.html',
  conseils: 'pages/conseils.html',
  diagnostic: 'pages/diagnostic.html',
  expertise: 'pages/expertise.html',
  'a-propos': 'pages/a-propos.html',
};

export const NAV = entreesMenu()
  .map((n) => {
    if (n.type === 'custom') return { label: n.label, href: n.url, externe: true };
    return DESTINATIONS_NAV[n.key] ? { label: n.label, href: DESTINATIONS_NAV[n.key] } : null;
  })
  .filter(Boolean);

/* Le bouton du header mène à la résolution du besoin — la section des
   enseignes de l'accueil — et non plus au formulaire d'expertise. Un seul
   bouton, partout. */
/* `#finder` : le bouton ouvre la page SUR le questionnaire, première question
   et premières réponses visibles, focus sur le titre de la question. */
const CTA = PARCOURS[navigationSite().cta.destination || 'moteur'] || PARCOURS.moteur;
export const HEADER_CTA = { label: navigationSite().cta.label || 'Trouver mon parquet', href: CTA.href, hash: CTA.destination === 'moteur' || !CTA.hash ? '#finder' : CTA.hash };

/* Le pied de page vient de la configuration du site (Site → Footer) : colonnes,
   liens, liens légaux, réseaux, texte de marque, copyright. Le gabarit, les
   proportions et le nombre maximal de colonnes restent ici. La constante
   ci-dessous n'est plus lue : elle documente la forme historique. */
const FOOTER_COLUMNS_V1 = [
  {
    title: 'Comprendre',
    links: [
      { label: 'Diagnostic', href: 'pages/diagnostic.html' },
      { label: 'Problèmes', href: 'pages/problemes.html' },
      { label: 'Conseils', href: 'pages/conseils.html' },
    ],
  },
  {
    /* Les enseignes ont leur place ici pour la même raison que le reste du
       pied de page : c'est la zone où l'on cherche « où est-ce que je vais ? »
       quand on n'a pas trouvé ailleurs. Deux liens, étiquetés par audience :
       envoyer un particulier vers une enseigne qui le refuse serait une
       impasse, alors le pied de page le dit avant le clic. L'expertise vient
       en troisième, comme partout sur le site. */
    title: 'Solutions',
    links: [
      { label: 'Trouver mon parquet', href: 'pages/trouver-mon-parquet.html' },
      { label: 'Choisir son parquet — Premibel', partenaire: 'premibel', besoin: 'selection' },
      { label: 'Approvisionnement pro — Over Parquet', partenaire: 'overparquet', besoin: 'supply', profil: 'professionnel' },
      { label: 'Expertise', href: 'pages/expertise.html' },
    ],
  },
  {
    /* Mentions légales : une seule fois, dans la ligne basse. */
    title: 'Informations',
    links: [
      { label: 'À propos', href: 'pages/a-propos.html' },
      { label: 'Contact', href: 'pages/contact.html' },
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
/* Les logotypes : Site → Identité. Sur fond clair, le logo sombre (ou le
   principal) ; sur fond sombre, le logo clair (ou le principal). */
const LOGOS = logos();
const LOGO = { width: LOGOS.surClair.width, height: LOGOS.surClair.height };
const LOGO_ON_LIGHT = LOGOS.surClair.src;
const LOGO_ON_DARK = LOGOS.surSombre.src;

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
  const l = inverse ? LOGOS.surSombre : LOGOS.surClair;
  const attr =
    chargement === 'haute' ? ' fetchpriority="high"' : chargement === 'differe' ? ' loading="lazy"' : '';
  return `<img class="${className}" src="${rel(depth, l.src)}" alt="" width="${l.width}" height="${l.height}"${attr} decoding="async">`;
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
  const icone = lien.icone && ICONES_LIENS[lien.icone] ? `${ICONES_LIENS[lien.icone]} ` : '';
  const cible = lien.nouvel_onglet ? ' target="_blank" rel="noopener"' : '';
  const texte = `${icone}${lien.libelle}`;
  switch (lien.type) {
    case 'page':
      return `<a href="${rel(depth, PAGES_INTERNES[lien.destination])}">${texte}</a>`;
    case 'parcours': {
      const p = PARCOURS[lien.destination];
      return `<a href="${rel(depth, p.href)}${p.query ? `?${p.query}` : ''}${p.hash || ''}">${texte}</a>`;
    }
    case 'externe':
      return `<a href="${escapeAttr(lien.destination)}"${cible || ' rel="noopener"'}>${texte}</a>`;
    case 'email':
      return `<a href="mailto:${escapeAttr(lien.destination)}">${texte}</a>`;
    case 'telephone':
      return `<a href="tel:${lien.destination.replace(/[^0-9+]/g, '')}">${texte}</a>`;
    case 'partenaire': {
      const info = PARTENAIRES[lien.destination];
      const partenaire = partnerFor(lien.destination);
      const url = partenaire ? partnerUrl(lien.destination, 'pied-de-page', info.profil || '') : null;
      /* Une enseigne non configurée ne laisse rien : mieux vaut une colonne plus courte qu'un lien mort. */
      if (!url) return '';
      const destination = lien.destination === 'overparquet' ? 'over-parquet' : lien.destination;
      const profil = info.profil ? ` data-customer-type="${info.profil}"` : '';
      return `<a href="${url.replace(/&/g, '&amp;')}" rel="sponsored noopener"${lien.nouvel_onglet ? ' target="_blank"' : ''}`
        + ` data-event="commercial_orientation" data-destination="${destination}"`
        + ` data-besoin="${info.besoin}"${profil} data-context="pied-de-page">${texte}</a>`;
    }
    default:
      return '';
  }
}

/** Les réseaux sociaux, avec leur icône ; rien si aucun n'est configuré. */
function reseauxPiedDePage() {
  const liste = (footerConfig().reseaux || []).filter((r) => r.visible !== false && r.url).sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  if (!liste.length) return '';
  const NOMS = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', youtube: 'YouTube' };
  return `
      <ul class="footer__social" aria-label="Réseaux sociaux">
${liste.map((r) => `        <li><a href="${escapeAttr(r.url)}" target="_blank" rel="noopener" aria-label="${NOMS[r.reseau] || r.reseau}">${ICONES_LIENS[r.reseau] || ''}</a></li>`).join('\n')}
      </ul>`;
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
    (item) => item.externe
      ? `          <li><a class="nav__link" href="${escapeAttr(item.href)}" target="_blank" rel="noopener">${item.label}</a></li>`
      : `          <li><a class="nav__link" href="${rel(depth, item.href)}${item.hash || ''}"${current === item.href ? ' aria-current="page"' : ''}>${item.label}</a></li>`
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
      <a class="btn btn--primary btn--block nav__cta-mobile" href="${rel(depth, HEADER_CTA.href)}${HEADER_CTA.hash}">${HEADER_CTA.label}</a>
    </nav>
    <div class="header__actions">
      <a class="btn btn--primary btn--sm header__cta-desktop" href="${rel(depth, HEADER_CTA.href)}${HEADER_CTA.hash}">${HEADER_CTA.label}</a>
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
/* L'accueil non plus : son parcours principal mène aux enseignes, et une
   barre « Demander une expertise » collée sous chaque écran dirait le
   contraire de ce que la page raconte. Les pages problème, elles, le gardent :
   là, l'expertise est la bonne réponse. */
const PAGES_SANS_RAPPEL = new Set(['index.html', 'pages/trouver-mon-parquet.html', 'pages/devis.html', 'pages/contact.html']);

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
  const config = footerConfig();
  const colonnes = config.colonnes
    .filter((c) => c.visible !== false)
    .sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  const columns = colonnes
    .map((column) => {
      const liens = (column.liens || [])
        .filter((l) => l.actif !== false)
        .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
        .map((l) => lienPiedDePage(depth, l))
        .filter(Boolean);
      return `        <div>
          <h2 class="footer__title">${column.titre}</h2>
          <ul class="footer__list">
${liens.map((html) => `            <li>${html}</li>`).join('\n')}
          </ul>
        </div>`;
    })
    .join('\n');
  /* Trois colonnes est le dessin de la V1 ; une, deux ou quatre ont leur variante. */
  const classeCols = colonnes.length === 3 ? '' : ` footer__cols--${colonnes.length}`;
  const legaux = (config.legaux || [])
    .filter((l) => l.actif !== false)
    .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
    .map((l) => lienPiedDePage(depth, l))
    .filter(Boolean);

  return `<footer class="site-footer">
  <div class="container">
    <div class="footer__top">
      <div>
        ${footerBrand(depth)}
        <p class="footer__pitch">${config.pitch}</p>
      </div>
      <div class="footer__cols${classeCols}">
${columns}
      </div>
    </div>
    <div class="footer__bottom">
      <p>&copy; <span data-current-year>2026</span> ${config.copyright}</p>${reseauxPiedDePage()}
      <ul class="footer__legal-links">
${legaux.map((html) => `        <li>${html}</li>`).join('\n')}
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
    ogImage = ogParDefaut(),
    navCurrent = null,
    headerOver = false,
    bodyClass = '',
    fullTitle = null,
    noindex = false,
    baseHref = null,
  } = page;

  const canonical = `${SITE.baseUrl}/${path === 'index.html' ? '' : path}`;
  const SEO = seo();
  /* Le suffixe de marque est toujours séparé du titre par un espace, quelle que
     soit la saisie côté WordPress (« Titre | Expert Parquet »). */
  const suffixe = String(SEO.suffixe || '').trim();
  const headTitle = fullTitle || `${title || SEO.titreDefaut}${suffixe ? ` ${suffixe}` : ''}`;
  const metaDescription = description || SEO.descriptionDefaut;
  /* Le `noindex` d'environnement ne se contourne pas : en préproduction et en
     local, toujours. En production, l'administrateur peut fermer l'indexation.
     Une page peut aussi se déclarer `noindex` par nature (ex. la page 404), et
     elle ne s'indexe alors jamais, même en production. */
  const robots = !noindex && IS_PROD && SEO.indexation ? 'index, follow' : 'noindex, nofollow';
  const FAV = favicon();
  const typeFav = FAV && /\.jpe?g$/i.test(FAV.ico32) ? 'image/jpeg' : FAV && /\.webp$/i.test(FAV.ico32) ? 'image/webp' : 'image/png';
  const favicons = FAV
    ? `  <link rel="icon" type="${typeFav}" sizes="32x32" href="${rel(depth, FAV.ico32)}">
  <link rel="icon" type="${typeFav}" sizes="16x16" href="${rel(depth, FAV.ico16)}">
  <link rel="apple-touch-icon" href="${rel(depth, FAV.apple)}">`
    : `  <link rel="icon" type="image/png" sizes="32x32" href="${rel(depth, 'assets/icons/favicon-32x32.png')}">
  <link rel="icon" type="image/png" sizes="16x16" href="${rel(depth, 'assets/icons/favicon-16x16.png')}">
  <link rel="apple-touch-icon" href="${rel(depth, 'assets/icons/apple-touch-icon.png')}">
  <link rel="shortcut icon" href="${rel(depth, 'assets/icons/favicon.ico')}">`;
  const styles = ['fonts.css', 'variables.css', 'theme.css', 'reset.css', 'base.css', 'layout.css', 'components.css', ...css]
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
${baseHref ? `  <base href="${baseHref}">\n` : ''}  <title>${headTitle}</title>
  <meta name="description" content="${escapeAttr(metaDescription)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="${robots}">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Expert Parquet">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${escapeAttr(headTitle)}">
  <meta property="og:description" content="${escapeAttr(metaDescription)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE.baseUrl}/${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeAttr(headTitle)}">
  <meta name="twitter:description" content="${escapeAttr(metaDescription)}">
  <meta name="twitter:image" content="${SITE.baseUrl}/${ogImage}">

${favicons}
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
${maintenanceAdminBar(depth)}
</body>
</html>
`;
}

/**
 * Barre « vue administrateur » sur le site statique, pendant la maintenance.
 *
 * Le site public est du HTML statique : impossible d'y rendre la barre
 * d'administration de WordPress. Ce petit script, inerte pour les visiteurs,
 * n'agit que si le marqueur non secret `ep_admin_view` est présent (posé par
 * WordPress quand un administrateur choisit « Voir le site malgré la
 * maintenance »). Il confirme alors que la maintenance est bien active
 * (`/maintenance.html` répond 200) et affiche une barre discrète. Le jeton de
 * contournement reste httponly ; ce marqueur n'est qu'un drapeau d'affichage.
 * « Voir comme un visiteur » passe par WordPress pour effacer le cookie
 * httponly (le JS ne le peut pas), puis la vraie page 503 s'affiche.
 */
function maintenanceAdminBar(depth) {
  return `  <script defer src="${relAsset(depth, 'js/maintenance-admin.js')}"></script>`;
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
