/**
 * Pages centrales : Expertise, Diagnostic, hubs Problèmes et Conseils,
 * À propos, FAQ, Mentions légales.
 *
 * Les gabarits sont ici ; les textes viennent des pages WordPress à champs
 * (Expertise, Diagnostic, Problèmes, Conseils, À propos) et des FAQ par
 * groupe. Les mentions légales restent entièrement dans le code : leur
 * section « Données personnelles » dépend de la configuration RGPD.
 */

import { rel, breadcrumb } from '../layout.mjs';
import { photo } from '../images.mjs';
import {
  indexList,
  ctaBand,
  BANDES,
  processSection,
  articleCard,
  faqAccordion,
  faqJsonLd,
  pageHero,
  sectionDonneesPersonnelles,
  problemesListe,
} from '../partials.mjs';
import { page, champ, faqs, imageDe, articles, articlesRecents, guides, themes, groupeFaq } from '../cms/snapshot.mjs';
import { htmlPourPage, faqPourPage } from '../cms/html.mjs';
import { cheminMedia } from '../cms/site.mjs';

const D = 1;

/** Les métadonnées communes d'une page à champs : titre de balise, description, image. */
function metaPage(slug) {
  const p = page(slug);
  const titreCourt = champ(slug, 'titre_court') || p.title;
  return {
    title: titreCourt,
    fullTitle: p.seoTitle ? `${p.seoTitle} | Expert Parquet` : null,
    description: p.seoDescription || champ(slug, 'lead').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ''),
    ogImage: p.seoImage ? cheminMedia(p.seoImage, undefined) : p.image ? `assets/images/${imageDe(p.image)}` : undefined,
  };
}

function heroDePage(slug, { actions = '', image = true } = {}) {
  const p = page(slug);
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: champ(slug, 'fil_ariane') || p.title },
  ]);
  const img = image && p.image ? imageDe(p.image) : null;
  return {
    crumb,
    html: pageHero(D, {
      crumbHtml: crumb.html,
      kicker: champ(slug, 'kicker'),
      title: p.title,
      lead: champ(slug, 'lead'),
      image: img,
      actions,
    }),
  };
}

/* ========================================================================== */
/* Expertise parquet                                                          */
/* ========================================================================== */

function expertisePage() {
  const { crumb, html: hero } = heroDePage('expertise', {
    actions: `<a class="btn btn--primary" href="${rel(D, 'pages/devis.html')}">Demander une expertise</a><a class="btn btn--on-dark" href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">Lancer le pré-diagnostic</a>`,
  });

  const body = `${hero}

  <section class="section">
    <div class="container">
      <div class="article-layout">
        <div class="prose" id="article-body">
${htmlPourPage(page('expertise').html, D)}
        </div>

        <aside class="article-aside">
          <nav class="toc" data-toc data-toc-scope="#article-body" aria-labelledby="toc-title">
            <details class="toc__box">
              <summary class="toc__title" id="toc-title">Sur cette page</summary>
              <ul class="toc__list" data-toc-list></ul>
            </details>
          </nav>
          <!-- Le bouton « Demander une expertise » est dans l'en-tête de page et
               dans le bandeau final : ici, la porte d'à côté. -->
          <div class="aside-card aside-card--accent">
            <p class="aside-card__title">Pas sûr d’avoir besoin d’une expertise&nbsp;?</p>
            <p>Le pré-diagnostic pose le contexte en cinq questions et dit la suite logique&nbsp;: réparer, remplacer, ou faire expertiser.</p>
            <a class="btn btn--outline btn--sm btn--block" href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">Lancer le pré-diagnostic</a>
          </div>
        </aside>
      </div>
    </div>
  </section>

${processSection(D)}

${ctaBand(D)}
`;

  return {
    path: 'pages/expertise.html',
    depth: D,
    navCurrent: 'pages/expertise.html',
    ...metaPage('expertise'),
    css: ['pages/home.css', 'pages/article.css'],
    body,
    jsonLd: [crumb.jsonLd],
  };
}

/* ========================================================================== */
/* Diagnostic parquet                                                         */
/* ========================================================================== */

function diagnosticPage() {
  const FAQ = faqPourPage(faqs('diagnostic'), D);
  const { crumb, html: hero } = heroDePage('diagnostic', {
    actions: `<a class="btn btn--primary" href="#pre-diagnostic">Lancer le pré-diagnostic</a>`,
  });

  const body = `${hero}

  <section class="section">
    <div class="container">
      <div class="article-layout">
        <div class="prose" id="article-body">
${htmlPourPage(page('diagnostic').html, D)}
        </div>

        <aside class="article-aside">
          <nav class="toc" data-toc data-toc-scope="#article-body" aria-labelledby="toc-title-diag">
            <details class="toc__box">
              <summary class="toc__title" id="toc-title-diag">Sur cette page</summary>
              <ul class="toc__list" data-toc-list></ul>
            </details>
          </nav>
          <div class="aside-card">
            <p class="aside-card__title">Problèmes courants</p>
            <p>Chaque symptôme dispose de sa page dédiée&nbsp;: causes, vérifications, erreurs fréquentes.</p>
            <a class="btn btn--outline btn--sm btn--block" href="${rel(D, 'pages/problemes.html')}">Voir les problèmes</a>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <section class="section section--mineral" id="pre-diagnostic">
    <div class="container">
      <div class="sec-head" data-reveal>
        <p class="kicker">${champ('diagnostic', 'prediag_kicker')}</p>
        <h2>${champ('diagnostic', 'prediag_titre')}</h2>
        <p class="lead">${champ('diagnostic', 'prediag_lead')}</p>
      </div>
      <div class="u-mt-xl" data-reveal>
        <div data-diagnostic data-quote-url="${rel(D, 'pages/devis.html')}" data-finder-url="${rel(D, 'pages/trouver-mon-parquet.html')}">
          <noscript>
            <div class="callout callout--neutral">
              <p class="callout__title">JavaScript désactivé</p>
              <p>Le pré-diagnostic nécessite JavaScript. Décrivez votre situation dans le <a class="link" href="${rel(D, 'pages/devis.html')}">formulaire de demande</a>.</p>
            </div>
          </noscript>
        </div>
      </div>
    </div>
  </section>
${FAQ.length ? `
  <section class="section">
    <div class="container container--text">
      <div class="sec-head" data-reveal>
        <p class="kicker">${champ('diagnostic', 'faq_kicker')}</p>
        <h2>${champ('diagnostic', 'faq_titre')}</h2>
      </div>
      <div class="u-mt-lg" data-reveal>
${faqAccordion(FAQ, 'diag-faq')}
      </div>
    </div>
  </section>
` : ''}
${ctaBand(D, BANDES.diagnostic)}
`;

  return {
    path: 'pages/diagnostic.html',
    depth: D,
    navCurrent: 'pages/diagnostic.html',
    ...metaPage('diagnostic'),
    css: ['pages/home.css', 'pages/article.css', 'pages/diagnostic.css'],
    body,
    jsonLd: [crumb.jsonLd, FAQ.length ? faqJsonLd(FAQ) : null],
  };
}

/* ========================================================================== */
/* Hub : problèmes de parquet                                                 */
/* ========================================================================== */

function problemsHubPage() {
  const { crumb, html: hero } = heroDePage('problemes', { image: false });

  const body = `${hero}

  <section class="section">
    <div class="container">
${indexList(D)}
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="split split--top">
        <div class="sec-head" data-reveal>
          <p class="kicker">Grille de lecture</p>
          <h2>Trois questions avant de choisir un symptôme</h2>
          <p class="lead">Elles suffisent souvent à réduire de moitié le nombre d’hypothèses.</p>
        </div>
        <div class="grid" data-reveal>
          <div class="stage">
            <p class="stage__num">01</p>
            <p class="stage__text"><strong>Étendue.</strong> Quelques lames, une zone, ou toute la pièce&nbsp;? Plus c’est étendu, plus le support est en cause.</p>
          </div>
          <div class="stage">
            <p class="stage__num">02</p>
            <p class="stage__text"><strong>Chronologie.</strong> Depuis la pose, après un événement, ou progressivement&nbsp;? La date d’apparition oriente l’analyse.</p>
          </div>
          <div class="stage">
            <p class="stage__num">03</p>
            <p class="stage__text"><strong>Réversibilité.</strong> Le phénomène varie-t-il avec les saisons&nbsp;? Un désordre réversible n’est pas un désordre stable.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="sec-head sec-head--split" data-reveal>
        <div class="sec-head">
          <p class="kicker">Pour aller plus loin</p>
          <h2>Articles associés</h2>
        </div>
        <a class="link-arrow" href="${rel(D, 'pages/conseils.html')}">Tous les conseils</a>
      </div>
      <div class="grid grid--3 u-mt-xl">
${articles().slice(0, 3).map((article, index) => articleCard(D, article, index)).join('\n')}
      </div>
    </div>
  </section>

${ctaBand(D, BANDES.probleme)}
`;

  return {
    path: 'pages/problemes.html',
    depth: D,
    navCurrent: 'pages/problemes.html',
    ...metaPage('problemes'),
    css: ['pages/home.css'],
    body,
    jsonLd: [crumb.jsonLd],
  };
}

/* ========================================================================== */
/* Hub : conseils                                                             */
/* ========================================================================== */

function adviceHubPage() {
  const { crumb, html: hero } = heroDePage('conseils', { image: false });

  /* Les trois plus récents en vignettes : c'est la fonction « quoi de neuf »,
     et elle n'a de sens que si elle reste courte. */
  const recents = articlesRecents(3);

  /* Tout le fonds, regroupé par thème — les thèmes de WordPress, dans leur
     ordre. Un thème sans article n'affiche rien. */
  const parTheme = themes()
    .map((theme) => ({ theme, items: articles().filter((a) => a.theme === theme.slug) }))
    .filter((g) => g.items.length);
  const sansTheme = articles().filter((a) => !a.theme || !themes().some((t) => t.slug === a.theme));
  if (sansTheme.length) parTheme.push({ theme: { slug: 'autres', name: 'Autres' }, items: sansTheme });

  const groupes = parTheme
    .map(
      ({ theme, items }) => `      <div class="theme-group" data-reveal>
        <h3 class="theme-group__title">${theme.name}</h3>
        <div class="next-read">
${items
          .map(
            (article) => `          <a class="next-read__item" href="${rel(D, `articles/${article.slug}.html`)}">
            <span class="next-read__kind">${article.readingTime}</span>
            <span class="next-read__title">${article.title}</span>
            <span class="next-read__text">${article.excerpt}</span>
            <span class="next-read__arrow" aria-hidden="true"></span>
          </a>`
          )
          .join('\n')}
        </div>
      </div>`
    )
    .join('\n');

  /* Les cartes de catégories sont les guides, dans leur ordre éditorial. */
  const categories = guides().map(
    (category, index) => `      <article class="card" data-reveal data-reveal-delay="${index * 50}">
        <div class="card__media card__media--16x9">
          ${photo(D, imageDe(category.image), { sizes: '(min-width: 901px) 33vw, (min-width: 641px) 50vw, 100vw' })}
        </div>
        <div class="card__body">
          <h3 class="card__title"><a class="card__link" href="${rel(D, `pages/conseils/${category.slug}.html`)}">${category.labelCourt || category.titreCourt || category.title}</a></h3>
          <p class="card__text">${category.excerpt}</p>
        </div>
      </article>`
  ).join('\n');

  const body = `${hero}

  <section class="section">
    <div class="container">
      <div class="sec-head" data-reveal>
        <h2>Catégories</h2>
      </div>
      <div class="grid grid--4 hub-categories u-mt-lg">
${categories}
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="sec-head" data-reveal>
        <p class="kicker">Derniers articles</p>
        <h2>À lire</h2>
      </div>
      <div class="grid grid--3 u-mt-lg">
${recents.map((article, index) => articleCard(D, article, index)).join('\n')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="sec-head" data-reveal>
        <p class="kicker">Tous les articles</p>
        <h2 class="sec-head__title">Par thème</h2>
        <p class="lead">Le même fonds, rangé par question posée plutôt que par date de publication.</p>
      </div>
${groupes}
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="sec-head" data-reveal>
        <p class="kicker">Par symptôme</p>
        <h2>Vous cherchez une réponse précise&nbsp;?</h2>
        <p class="lead">Les pages « problèmes » traitent chaque symptôme séparément.</p>
      </div>
      <ul class="filter-bar u-mt-lg" data-reveal>
${problemesListe().map((problem) => `        <li><a class="filter-chip" href="${rel(D, `pages/problemes/${problem.slug}.html`)}">${problem.label}</a></li>`).join('\n')}
      </ul>
    </div>
  </section>

${ctaBand(D, BANDES.orientation)}
`;

  return {
    path: 'pages/conseils.html',
    depth: D,
    navCurrent: 'pages/conseils.html',
    ...metaPage('conseils'),
    css: ['pages/home.css'],
    body,
    jsonLd: [crumb.jsonLd],
  };
}

/* ========================================================================== */
/* À propos                                                                   */
/* ========================================================================== */

function aboutPage() {
  const { crumb, html: hero } = heroDePage('a-propos', { image: false });
  const p = page('a-propos');

  const body = `${hero}

  <section class="section">
    <div class="container">
      <div class="split">
        <div class="prose">
${htmlPourPage(p.html, D)}
        </div>
        <div class="media media--4x3" data-reveal>
          ${photo(D, imageDe(p.image), { sizes: '(min-width: 901px) 45vw, 100vw' })}
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container container--text">
      <div class="sec-head" data-reveal>
        <p class="kicker">Transparence</p>
        <h2 id="recommandations">Comment fonctionnent nos recommandations</h2>
      </div>
      <div class="prose u-mt-lg" data-reveal>
        <p>Expert Parquet qualifie votre besoin et le traduit en critères. Il ne vend rien et ne détient aucun stock. Les références proposées par le moteur sont ensuite à consulter chez l’une des deux enseignes externes, selon votre profil et votre projet&nbsp;:</p>
        <ul>
          <li><strong>Premibel</strong> — choix, conseil et achat, pour les particuliers comme pour les professionnels. <a href="https://www.premibel.fr/" target="_blank" rel="noopener">Voir le site de Premibel</a>.</li>
          <li><strong>Over Parquet</strong> — approvisionnement professionnel, sur justificatif d’entreprise. <a href="https://over-parquet.com/" target="_blank" rel="noopener">Voir le site d’Over Parquet</a>.</li>
        </ul>
        <p>Nous citons leurs catalogues comme sources de recommandation&nbsp;; le choix et l’achat se font sur leur site.</p>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container container--text">
      <div class="sec-head" data-reveal>
        <p class="kicker">${champ('a-propos', 'encart_kicker')}</p>
        <h2>${champ('a-propos', 'encart_titre')}</h2>
      </div>
      <div class="prose u-mt-lg" data-reveal>
${htmlPourPage(champ('a-propos', 'encart_html'), D)}
      </div>
    </div>
  </section>

${processSection(D)}

${ctaBand(D, BANDES.orientation)}
`;

  return {
    path: 'pages/a-propos.html',
    depth: D,
    navCurrent: 'pages/a-propos.html',
    ...metaPage('a-propos'),
    css: ['pages/home.css', 'pages/article.css'],
    body,
    jsonLd: [crumb.jsonLd],
  };
}

/* ========================================================================== */
/* FAQ                                                                        */
/* ========================================================================== */

/* Les groupes de la page FAQ ; les autres groupes alimentent chacun une page. */
const GROUPES_PAGE_FAQ = ['symptomes', 'travaux', 'expertise'];

function faqPage() {
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Questions fréquentes' },
  ]);

  const groupes = GROUPES_PAGE_FAQ.map((slug) => ({ groupe: groupeFaq(slug), items: faqPourPage(faqs(slug), D) })).filter((g) => g.groupe && g.items.length);

  const html = groupes
    .map(
      ({ groupe, items }) => `      <div class="u-mt-xl" data-reveal>
        <h2 id="faq-${groupe.slug}">${groupe.titre || groupe.name}</h2>
        <div class="u-mt-md">
${faqAccordion(items, `faq-${groupe.slug}`)}
        </div>
      </div>`
    )
    .join('\n');

  const allItems = groupes.flatMap((g) => g.items);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'FAQ',
    title: 'Questions fréquentes',
    lead: 'Les questions qui reviennent le plus souvent, regroupées par thème. Les réponses restent informatives&nbsp;: elles n’engagent aucune prestation et ne remplacent pas une observation sur place.',
  })}

  <section class="section">
    <div class="container container--text">
${html}
      <p class="disclaimer u-mt-xl">Une question absente de cette liste&nbsp;? Elle a sa place dans le <a class="link" href="${rel(D, 'pages/contact.html')}">formulaire de contact</a>.</p>
    </div>
  </section>

${ctaBand(D, BANDES.faq)}
`;

  return {
    path: 'pages/faq.html',
    depth: D,
    navCurrent: null,
    title: 'FAQ parquet&nbsp;: symptômes, travaux et expertise',
    fullTitle: 'FAQ parquet&nbsp;: symptômes et travaux | Expert Parquet',
    description:
      'Réponses aux questions fréquentes sur le parquet : grincement, lames qui se soulèvent, humidité, réparation partielle et déroulement d’une expertise.',
    css: ['pages/home.css', 'pages/article.css'],
    body,
    jsonLd: [crumb.jsonLd, faqJsonLd(allItems)],
  };
}

/* ========================================================================== */
/* Mentions légales                                                           */
/* ========================================================================== */

function legalPage() {
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Mentions légales' },
  ]);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'Informations légales',
    title: 'Mentions légales',
    lead: 'Informations légales, traitement des données et portée des contenus publiés sur ce site.',
  })}

  <section class="section">
    <div class="container container--text">
      <div class="callout">
        <p class="callout__title">Site en préparation</p>
        <p>Ce site n’est pas encore exploité&nbsp;: aucune prestation n’y est vendue et aucun formulaire n’y transmet de données. Les mentions relatives à l’éditeur et à l’hébergeur seront publiées sur cette page avant son ouverture. Aucune information juridique n’a été inventée dans l’intervalle.</p>
      </div>

      <div class="prose u-mt-xl">
        <h2>Éditeur du site</h2>
        <p>L’identité de l’éditeur, sa forme juridique, son siège, son numéro d’immatriculation et le nom du directeur de la publication seront renseignés ici avant toute ouverture au public.</p>
        <p data-contact-block>Contact&nbsp;: <span data-contact="email"></span></p>
        <p>D’ici là, vous pouvez écrire via le <a href="contact.html">formulaire de contact</a>.</p>

        <h2>Hébergement</h2>
        <p>Le site est publié sous forme de fichiers statiques. Le nom et l’adresse de l’hébergeur seront précisés ici en même temps que les mentions de l’éditeur.</p>

        <h2>Propriété intellectuelle</h2>
        <p>Les textes de ce site sont originaux. Les photographies proviennent de banques d’images libres de droits&nbsp;; leurs sources sont listées dans le fichier <code>assets/images/CREDITS.md</code> du projet. Toute réutilisation des contenus rédactionnels nécessite l’accord préalable de l’éditeur.</p>

        <h2>Données personnelles</h2>
        ${sectionDonneesPersonnelles()}

        <h2>Cookies et mesure d’audience</h2>
        <p>Ce site n’utilise actuellement aucun cookie, aucun traceur et aucun outil de mesure d’audience. Si un outil d’analyse est ajouté ultérieurement, un dispositif de recueil du consentement sera mis en place au préalable.</p>

        <h2>Portée des contenus</h2>
        <p>Les contenus publiés ont une vocation informative. Le pré-diagnostic en ligne constitue une orientation générale et ne remplace pas une expertise sur place. Aucun contenu de ce site ne saurait être assimilé à un rapport d’expertise judiciaire, à une attestation officielle ou à un avis d’assurance.</p>

        <h2>Liens externes</h2>
        <p>Ce site peut renvoyer vers des ressources externes lorsque cela présente un intérêt éditorial. L’éditeur n’exerce aucun contrôle sur le contenu de ces sites tiers.</p>
      </div>
    </div>
  </section>
`;

  return {
    path: 'pages/mentions-legales.html',
    depth: D,
    navCurrent: null,
    title: 'Mentions légales',
    description:
      'Mentions légales du site Expert Parquet : éditeur, hébergement, propriété intellectuelle, données personnelles et portée des contenus publiés.',
    css: ['pages/home.css', 'pages/article.css'],
    body,
    jsonLd: [crumb.jsonLd],
  };
}

export function corePages() {
  return [
    expertisePage(),
    diagnosticPage(),
    problemsHubPage(),
    adviceHubPage(),
    aboutPage(),
    faqPage(),
    legalPage(),
  ];
}
