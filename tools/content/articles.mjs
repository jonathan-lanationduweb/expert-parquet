/**
 * Articles du blog « Conseils » — gabarit de rendu.
 *
 * En-tête, sommaire généré, image de couverture, corps, FAQ, contenus associés
 * et rappel d'action. Le corps éditorial de chaque article vit dans
 * `article-bodies.mjs` ; les métadonnées dans `ARTICLES` (tools/partials.mjs).
 * Ce fichier ne contient donc que la mise en page, et rien à lire pour qui
 * cherche du contenu.
 */

import { rel, breadcrumb, SITE, plainText } from '../layout.mjs';
import { ICONS, ARTICLES, faqAccordion, faqJsonLd, ctaBand } from '../partials.mjs';
import { relatedSection } from './graph.mjs';
import { photo } from '../images.mjs';
import { BODIES } from './article-bodies.mjs';

const D = 1;

function renderArticle(article) {
  const content = BODIES[article.slug];
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Conseils', href: 'pages/conseils.html' },
    { label: article.title },
  ]);

  const body = `  <section class="section section--tight">
    <div class="container">
      ${crumb.html}
      <div class="article-layout u-mt-md">
        <div>
          <header class="article-head">
            <p class="kicker">${article.category}</p>
            <h1 class="article-head__title">${article.title}</h1>
            <p class="article-head__standfirst">${content.standfirst}</p>
            <p class="article-head__meta">
              <time datetime="${article.date}">Publié le ${article.dateLabel}</time>
              <span aria-hidden="true">•</span>
              <span>${article.readingTime} de lecture</span>
            </p>
          </header>

          <figure class="media media--16x9 article__cover">
            ${photo(D, article.image, { sizes: '(min-width: 901px) 68vw, 100vw', priority: true })}
          </figure>

          <div class="prose u-mt-xl" id="article-body">
${content.html}

            <h2 id="faq">Questions fréquentes</h2>
            <div class="u-mt-md">
${faqAccordion(content.faq, `${article.slug}-faq`)}
            </div>
          </div>

          <div class="article-foot">
            <div class="callout callout--neutral">
              <p class="callout__title">${ICONS.help} Et pour votre cas&nbsp;?</p>
              <p>Cet article décrit des mécanismes généraux. Pour poser votre situation particulière, le <a href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">pré-diagnostic</a> prend cinq minutes, ou décrivez-la directement dans la <a href="${rel(D, 'pages/devis.html')}">demande d’expertise</a>.</p>
            </div>
          </div>
        </div>

        <aside class="article-aside">
          <nav class="toc" data-toc data-toc-scope="#article-body" aria-labelledby="toc-${article.slug}">
            <details class="toc__box">
              <summary class="toc__title" id="toc-${article.slug}">Sommaire</summary>
              <ul class="toc__list" data-toc-list></ul>
            </details>
          </nav>
          <div class="aside-card aside-card--accent">
            <p class="aside-card__title">Besoin d’un avis&nbsp;?</p>
            <p>Décrivez votre parquet et son problème&nbsp;: vous recevrez les éléments à vérifier en priorité.</p>
            <a class="btn btn--primary btn--sm btn--block" href="${rel(D, 'pages/devis.html')}">Demander une expertise</a>
          </div>
        </aside>
      </div>
    </div>
  </section>

${relatedSection(D, { type: 'article', slug: article.slug })}

${ctaBand(D)}
`;

  return {
    path: `articles/${article.slug}.html`,
    depth: D,
    navCurrent: 'pages/conseils.html',
    title: article.title,
    description: content.standfirst.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').slice(0, 180),
    css: ['pages/home.css', 'pages/article.css'],
    ogImage: `assets/images/${article.image}`,
    lastmod: article.date,
    body,
    jsonLd: [
      crumb.jsonLd,
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: plainText(article.title),
        description: content.standfirst.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ''),
        image: `${SITE.baseUrl}/assets/images/${article.image}`,
        datePublished: article.date,
        dateModified: article.date,
        inLanguage: 'fr-FR',
        mainEntityOfPage: `${SITE.baseUrl}/articles/${article.slug}.html`,
        articleSection: article.category,
      },
      faqJsonLd(content.faq),
    ],
  };
}

export function articlePages() {
  return ARTICLES.map(renderArticle);
}
