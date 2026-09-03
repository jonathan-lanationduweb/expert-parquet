/**
 * Gabarit HTML commun à toutes les pages du site.
 *
 * Ce fichier fait partie de l’outillage de développement (dossier `tools/`).
 * Il n’est PAS chargé par le site : il sert uniquement à générer les fichiers
 * HTML statiques livrés à la racine du projet. Voir tools/build.mjs.
 */

export const SITE = {
  name: 'Expert Parquet',
  baseUrl: 'https://expert-parquet.com',
  locale: 'fr_FR',
  twitter: null, // aucun compte connu : pas de balise inventée
};

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
      { label: 'Entretien', href: 'pages/conseils/entretien.html' },
      { label: 'Rénovation', href: 'pages/conseils/renovation.html' },
      { label: 'Pose', href: 'pages/conseils/pose.html' },
      { label: 'FAQ', href: 'pages/faq.html' },
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

/** Chemin relatif depuis une page située à `depth` niveaux sous la racine. */
export function rel(depth, path) {
  const prefix = depth === 0 ? '' : '../'.repeat(depth);
  return prefix + path;
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

function logoImg(depth, { inverse = false, className, priority }) {
  const src = inverse ? LOGO_ON_DARK : LOGO_ON_LIGHT;
  const loading = priority ? ' fetchpriority="high"' : ' loading="lazy"';
  return `<img class="${className}" src="${rel(depth, src)}" alt="" width="${LOGO.width}" height="${LOGO.height}"${loading} decoding="async">`;
}

function brand(depth, { over = false } = {}) {
  const light = logoImg(depth, { className: 'brand__logo', priority: true });
  const dark = over
    ? `
      ${logoImg(depth, { inverse: true, className: 'brand__logo brand__logo--inverse', priority: true })}`
    : '';
  return `<a class="brand" href="${rel(depth, 'index.html')}" aria-label="Expert Parquet, retour à l’accueil">
      ${light}${dark}
    </a>`;
}

function footerBrand(depth) {
  return `<a class="footer__wordmark" href="${rel(depth, 'index.html')}" aria-label="Expert Parquet, retour à l’accueil">${logoImg(depth, { inverse: true, className: 'footer__logo' })}</a>`;
}

function header(depth, current, over) {
  const items = NAV.map(
    (item) => `        <li><a class="nav__link" href="${rel(depth, item.href)}"${current === item.href ? ' aria-current="page"' : ''}>${item.label}</a></li>`
  ).join('\n');

  return `<header class="site-header${over ? ' site-header--over' : ''}" data-header>
  <div class="container site-header__inner">
    ${brand(depth, { over })}
    <nav class="nav" id="site-nav" data-nav aria-label="Navigation principale">
      <ul class="nav__list">
${items}
      </ul>
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
</header>
<div class="nav-overlay" data-nav-overlay></div>`;
}

function footer(depth) {
  const columns = FOOTER_COLUMNS.map(
    (column) => `        <div>
          <h2 class="footer__title">${column.title}</h2>
          <ul class="footer__list">
${column.links.map((link) => `            <li><a href="${rel(depth, link.href)}">${link.label}</a></li>`).join('\n')}
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
      <p>&copy; <span data-current-year>2026</span> Expert Parquet — site indépendant. Coordonnées et mentions légales à compléter avant mise en ligne.</p>
      <ul class="footer__legal-links">
        <li><a href="${rel(depth, 'pages/mentions-legales.html')}">Mentions légales</a></li>
        <li><a href="${rel(depth, 'pages/faq.html')}">FAQ</a></li>
        <li><a href="${rel(depth, 'pages/contact.html')}">Contact</a></li>
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
      name: item.label,
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
  const styles = ['variables.css', 'reset.css', 'base.css', 'layout.css', 'components.css', ...css]
    .map((file) => `  <link rel="stylesheet" href="${rel(depth, `css/${file}`)}">`)
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
  <meta name="robots" content="index, follow">

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

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=Inter:wght@400;500;600&display=swap">

${styles}

  <script type="module" src="${rel(depth, 'js/main.js')}"></script>
${structured}
</head>
<body${classes ? ` class="${classes}"` : ''}>
  <a class="skip-link" href="#main">Aller au contenu principal</a>
${header(depth, navCurrent, headerOver)}

  <main id="main">
${body}
  </main>

${footer(depth)}
</body>
</html>
`;
}

export function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
