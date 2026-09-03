/**
 * Blocs réutilisables partagés par plusieurs pages (outillage de build).
 *
 * Principe de la direction artistique : très peu de composants, mais des
 * composants de grande échelle. Pas de grille de petites cartes.
 */

import { rel } from './layout.mjs';

/* --------------------------------------------------------------- icônes
   Jeu réduit au strict nécessaire : flèches, validation, alerte, question.
   Les pictogrammes décoratifs de l'ancienne version ont été supprimés. */

export const ICONS = {
  arrowRight: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="square" aria-hidden="true"><path d="M3 9h12M10.5 4.5 15 9l-4.5 4.5"/></svg>',
  arrowLeft: '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="square" aria-hidden="true"><path d="M15 9H3M7.5 4.5 3 9l4.5 4.5"/></svg>',
  check: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" aria-hidden="true"><path d="m3 8.5 3.5 3.5L13 4.5"/></svg>',
  alert: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square" aria-hidden="true"><path d="M8 2 1.5 14h13z"/><path d="M8 6.5v3.2M8 12h.01"/></svg>',
  help: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M6.3 6.3a1.75 1.75 0 1 1 2.4 1.6c-.5.2-.7.6-.7 1.1v.2"/><path d="M8 11.6h.01"/></svg>',
  search: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square" aria-hidden="true"><circle cx="7.2" cy="7.2" r="5"/><path d="m13.5 13.5-2.7-2.7"/></svg>',
};

/* ------------------------------------------------- catalogue des problèmes
   Sert à la fois à la liste éditoriale de la page d'accueil, au hub
   « Problèmes » et aux liens contextuels. */

export const PROBLEMS = [
  {
    slug: 'parquet-qui-grince',
    label: 'Parquet qui grince',
    teaser: 'Un frottement, rarement le bois lui-même.',
    image: 'grincement.jpg',
  },
  {
    slug: 'parquet-gondole',
    label: 'Parquet qui se soulève',
    teaser: 'Le bois a gonflé sans avoir où s’étendre.',
    image: 'soulevement.jpg',
  },
  {
    slug: 'lames-qui-bougent',
    label: 'Lames qui bougent',
    teaser: 'Le revêtement n’est plus solidaire de son support.',
    image: 'lames-bougent.jpg',
  },
  {
    slug: 'humidite',
    label: 'Humidité',
    teaser: 'Remontée, condensation ou infiltration&nbsp;: trois réponses différentes.',
    image: 'degat-eaux.jpg',
  },
  {
    slug: 'degat-des-eaux',
    label: 'Dégât des eaux',
    teaser: 'L’état visible ne dit rien de l’état du support.',
    image: 'rayures.jpg',
  },
  {
    slug: 'defaut-de-pose',
    label: 'Défaut de pose',
    teaser: 'Des symptômes réguliers sur toute la surface.',
    image: 'pose-support.jpg',
  },
  {
    slug: 'parquet-abime',
    label: 'Taches et rayures',
    teaser: 'La profondeur de l’atteinte détermine la solution.',
    image: 'taches.jpg',
  },
  {
    slug: 'parquet-abime',
    label: 'Parquet ancien',
    teaser: 'Patine ou dégradation&nbsp;: tout se joue sur l’épaisseur utile.',
    image: 'parquet-ancien.jpg',
    key: 'parquet-ancien',
  },
];

/** Liste éditoriale numérotée, avec vignette révélée au survol. */
export function indexList(depth, { items = PROBLEMS, id = 'problemes-index' } = {}) {
  const rows = items
    .map((item, index) => {
      const num = String(index + 1).padStart(2, '0');
      return `        <a class="index-row" href="${rel(depth, `pages/problemes/${item.slug}.html`)}" data-index-item data-preview="${rel(depth, `assets/images/${item.image}`)}">
          <span class="index-row__num">${num}</span>
          <span class="index-row__title">${item.label}</span>
          <span class="index-row__text">${item.teaser}</span>
          <span class="index-row__arrow" aria-hidden="true"></span>
        </a>`;
    })
    .join('\n');

  return `      <div class="index-list" data-index-list id="${id}">
${rows}
        <div class="index-list__preview" data-index-preview aria-hidden="true"><img src="${rel(depth, `assets/images/${items[0].image}`)}" alt="" width="300" height="380" loading="lazy" decoding="async"></div>
      </div>`;
}

/* ------------------------------------------------------------- bandeau CTA */

export function ctaBand(depth, options = {}) {
  const {
    title = 'Un doute sur l’origine du problème&nbsp;?',
    text = 'Décrivez votre situation en quelques minutes. Vous recevrez les éléments à vérifier en priorité et, si elle se justifie, une proposition d’expertise.',
    primaryLabel = 'Demander une expertise',
    primaryHref = 'pages/devis.html',
    secondaryLabel = 'Lancer le pré-diagnostic',
    secondaryHref = 'pages/diagnostic.html#pre-diagnostic',
  } = options;

  return `  <section class="cta-band">
    <div class="cta-band__inner">
      <div data-reveal>
        <h2 class="cta-band__title">${title}</h2>
        <p>${text}</p>
      </div>
      <div class="btn-group" data-reveal data-reveal-delay="90">
        <a class="btn btn--primary btn--lg" href="${rel(depth, primaryHref)}">${primaryLabel}</a>
        ${secondaryLabel ? `<a class="btn btn--on-dark btn--lg" href="${rel(depth, secondaryHref)}">${secondaryLabel}</a>` : ''}
      </div>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- processus */

export const PROCESS_STEPS = [
  {
    num: '01',
    title: 'Comprendre',
    text: 'Le récit du problème, l’historique du parquet, le contexte de la pièce et ce qui a changé avant l’apparition.',
  },
  {
    num: '02',
    title: 'Observer',
    text: 'Lames, jeux périphériques, planéité, mesures d’humidité de l’air et du support. Rien n’est déduit sans avoir été vu.',
  },
  {
    num: '03',
    title: 'Identifier',
    text: 'Séparer le symptôme visible de son origine réelle, écarter les hypothèses que les observations contredisent.',
  },
  {
    num: '04',
    title: 'Recommander',
    text: 'Les solutions envisageables, leurs conditions de réussite, leurs limites — et, parfois, la conclusion qu’il n’y a rien à faire.',
  },
];

export function processSection(depth, { inverse = false } = {}) {
  const steps = PROCESS_STEPS.map(
    (step, index) => `        <li class="stage" data-reveal data-reveal-delay="${index * 80}">
          <span class="stage__num">${step.num}</span>
          <h3 class="stage__title">${step.title}</h3>
          <p class="stage__text">${step.text}</p>
        </li>`
  ).join('\n');

  return `  <section class="section${inverse ? ' section--inverse' : ''}" id="deroulement">
    <div class="container">
      <div class="sec-head sec-head--split" data-reveal>
        <div>
          <div class="sec-head__rule"></div>
          <p class="kicker">Méthode</p>
          <h2 class="sec-head__title u-mt-md">Comment se déroule une expertise</h2>
        </div>
        <div class="sec-head__aside">
          <p class="lead">Quatre temps, du récit initial aux recommandations. Aucun ne se saute&nbsp;: c’est la seule façon de distinguer ce que l’on voit de ce qui le provoque.</p>
        </div>
      </div>
      <ol class="stages u-mt-2xl">
${steps}
      </ol>
    </div>
  </section>`;
}

/* ----------------------------------------------------------------- articles */

export const ARTICLES = [
  {
    slug: 'pourquoi-un-parquet-grince',
    title: 'Pourquoi un parquet se met-il à grincer&nbsp;?',
    category: 'Diagnostic',
    date: '2026-02-10',
    dateLabel: '10 février 2026',
    readingTime: '6 min',
    image: 'grincement.jpg',
    excerpt:
      'Le grincement est un symptôme, pas une cause. Comprendre d’où vient le frottement évite d’engager des travaux inutiles.',
  },
  {
    slug: 'parquet-qui-se-souleve-que-faire',
    title: 'Que faire lorsqu’un parquet se soulève&nbsp;?',
    category: 'Défauts',
    date: '2026-02-24',
    dateLabel: '24 février 2026',
    readingTime: '7 min',
    image: 'soulevement.jpg',
    excerpt:
      'Un parquet qui bombe réagit presque toujours à l’eau ou à un manque de jeu. Les premiers gestes conditionnent la suite.',
  },
  {
    slug: 'humidite-et-parquet-signes-qui-alertent',
    title: 'Humidité et parquet&nbsp;: quels signes doivent alerter&nbsp;?',
    category: 'Humidité',
    date: '2026-03-09',
    dateLabel: '9 mars 2026',
    readingTime: '8 min',
    image: 'degat-eaux.jpg',
    excerpt:
      'Certains signaux apparaissent bien avant le désordre visible. Savoir les lire permet d’agir avant la dégradation.',
  },
  {
    slug: 'renover-un-parquet-tres-abime',
    title: 'Peut-on rénover un parquet très abîmé&nbsp;?',
    category: 'Rénovation',
    date: '2026-03-23',
    dateLabel: '23 mars 2026',
    readingTime: '7 min',
    image: 'rayures.jpg',
    excerpt:
      'Entre patine et dégradation, la frontière n’est pas toujours nette. Trois critères décident de la faisabilité.',
  },
  {
    slug: 'pourquoi-le-support-est-essentiel',
    title: 'Pourquoi le support est-il essentiel avant la pose&nbsp;?',
    category: 'Pose',
    date: '2026-04-07',
    dateLabel: '7 avril 2026',
    readingTime: '9 min',
    image: 'pose-support.jpg',
    excerpt:
      'La majorité des désordres se jouent sous le parquet. Planéité, siccité, propreté&nbsp;: les trois contrôles décisifs.',
  },
];

/** Carte article. `variant` : 'default' | 'feature' | 'row'. */
export function articleCard(depth, article, index = 0, variant = 'default') {
  const ratioClass = variant === 'feature' ? 'media--3x2' : 'media--4x3';
  const h = variant === 'feature' ? 933 : 1050;
  return `      <article class="card${variant === 'feature' ? ' card--feature' : ''}${variant === 'row' ? ' card--row' : ''}" data-reveal data-reveal-delay="${index * 70}">
        <div class="card__media ${ratioClass}">
          <img src="${rel(depth, `assets/images/${article.image}`)}" alt="" width="1400" height="${h}" loading="lazy" decoding="async">
        </div>
        <div class="card__body">
          <p class="card__meta"><span>${article.category}</span><span>${article.readingTime}</span></p>
          <h3 class="card__title"><a class="card__link" href="${rel(depth, `articles/${article.slug}.html`)}">${article.title}</a></h3>
          <p class="card__text">${article.excerpt}</p>
        </div>
      </article>`;
}

/* ------------------------------------------------------------- carrousel */

export const SHOWCASE = [
  {
    title: 'Soulèvement des lames',
    text: 'Bombement, vagues ou tuilage&nbsp;: ce que la géométrie du désordre indique sur son origine.',
    image: 'soulevement.jpg',
    href: 'pages/problemes/parquet-gondole.html',
  },
  {
    title: 'Humidité persistante',
    text: 'Distinguer une remontée du support, une condensation d’ambiance et une infiltration ponctuelle.',
    image: 'degat-eaux.jpg',
    href: 'pages/problemes/humidite.html',
  },
  {
    title: 'Défaut de pose',
    text: 'Jeux périphériques, planéité, siccité, acclimatation&nbsp;: les contrôles que l’on reconstitue après coup.',
    image: 'pose-support.jpg',
    href: 'pages/problemes/defaut-de-pose.html',
  },
  {
    title: 'Parquet ancien',
    text: 'Mesurer l’épaisseur utile restante et l’état des assemblages avant d’arbitrer entre rénover et remplacer.',
    image: 'parquet-ancien.jpg',
    href: 'pages/problemes/parquet-abime.html',
  },
  {
    title: 'Après un dégât des eaux',
    text: 'Documenter, mesurer le support, attendre la stabilisation&nbsp;: la chronologie compte autant que le constat.',
    image: 'degat-eaux.jpg',
    href: 'pages/problemes/degat-des-eaux.html',
  },
];

export function showcase(depth, { inverse = false } = {}) {
  const total = String(SHOWCASE.length).padStart(2, '0');
  const slides = SHOWCASE.map(
    (item, index) => `          <a class="showcase__slide" href="${rel(depth, item.href)}">
            <div class="showcase__media">
              <img src="${rel(depth, `assets/images/${item.image}`)}" alt="" width="1400" height="933" loading="lazy" decoding="async">
            </div>
            <div class="showcase__body">
              <span class="showcase__num">${String(index + 1).padStart(2, '0')}</span>
              <span>
                <span class="showcase__title">${item.title}</span>
                <span class="showcase__text">${item.text}</span>
              </span>
            </div>
          </a>`
  ).join('\n');

  return `      <div class="showcase" data-showcase>
        <div class="showcase__viewport" data-showcase-viewport tabindex="0" role="group" aria-label="Situations à analyser, faites défiler horizontalement">
${slides}
        </div>
        <div class="showcase__controls">
          <p class="showcase__counter"><b data-showcase-current>01</b> / ${total}</p>
          <div class="showcase__progress" aria-hidden="true"><div class="showcase__progress-bar" data-showcase-bar></div></div>
          <div class="showcase__nav">
            <button class="showcase__btn" type="button" data-showcase-prev aria-label="Situation précédente">${ICONS.arrowLeft}</button>
            <button class="showcase__btn" type="button" data-showcase-next aria-label="Situation suivante">${ICONS.arrowRight}</button>
          </div>
        </div>
      </div>`;
}

/* --------------------------------------------------------------------- FAQ */

export function faqAccordion(items, idPrefix, { single = false } = {}) {
  const blocks = items
    .map((item, index) => {
      const id = `${idPrefix}-${index + 1}`;
      return `      <div class="accordion__item">
        <h3>
          <button class="accordion__trigger" type="button" id="${id}-trigger" aria-expanded="false" aria-controls="${id}">
            <span>${item.q}</span>
            <span class="accordion__icon" aria-hidden="true"></span>
          </button>
        </h3>
        <div class="accordion__panel" id="${id}" role="region" aria-labelledby="${id}-trigger" data-open="false">
          <div class="accordion__panel-inner"><div>${item.a}</div></div>
        </div>
      </div>`;
    })
    .join('\n');

  return `    <div class="accordion" data-accordion${single ? ' data-accordion-single' : ''}>
${blocks}
    </div>`;
}

export function faqJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: stripTags(item.q),
      acceptedAnswer: { '@type': 'Answer', text: stripTags(item.a) },
    })),
  };
}

export function stripTags(html) {
  return String(html)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ------------------------------------------------------------ en-tête page */

export function pageHero(depth, { kicker, title, lead, crumbHtml, actions = '', image = null, imageAlt = '' }) {
  const inner = `      <div class="page-hero__inner">
        ${kicker ? `<p class="kicker">${kicker}</p>` : ''}
        <h1 class="page-hero__title">${title}</h1>
        <p class="page-hero__lead">${lead}</p>
        ${actions ? `<div class="page-hero__actions btn-group">${actions}</div>` : ''}
        <div class="page-hero__rule"></div>
      </div>`;

  if (image) {
    return `  <section class="page-hero page-hero--media">
    <div class="page-hero__bg" aria-hidden="true">
      <img src="${rel(depth, `assets/images/${image}`)}" alt="${imageAlt}" width="1800" height="1200" fetchpriority="high" decoding="async">
    </div>
    <div class="container">
      ${crumbHtml}
${inner}
    </div>
  </section>`;
  }

  return `  <section class="page-hero">
    <div class="container">
      ${crumbHtml}
${inner}
    </div>
  </section>`;
}

/** En-tête de section standard : filet, intitulé, titre, paragraphe optionnel. */
export function sectionHead({ kicker, title, text = null, link = null, titleClass = '' }) {
  const left = `        <div>
          <div class="sec-head__rule"></div>
          ${kicker ? `<p class="kicker">${kicker}</p>` : ''}
          <h2 class="sec-head__title ${titleClass}">${title}</h2>
        </div>`;

  if (!text && !link) {
    return `      <div class="sec-head" data-reveal>
${left}
      </div>`;
  }

  return `      <div class="sec-head sec-head--split" data-reveal>
${left}
        <div class="sec-head__aside">
          ${text ? `<p class="lead">${text}</p>` : ''}
          ${link ? `<p class="u-mt-lg">${link}</p>` : ''}
        </div>
      </div>`;
}
