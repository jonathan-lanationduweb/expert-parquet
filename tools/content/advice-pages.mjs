/**
 * Pages-guides « Conseils » (type Conseil, format « guide » dans WordPress).
 * Chacune est un vrai contenu éditorial, pas une simple liste de liens, et
 * pointe vers les articles et les symptômes concernés.
 */

import { rel, breadcrumb } from '../layout.mjs';
import { ctaBand, BANDES, pageHero, problemesListe } from '../partials.mjs';
import { relatedSection } from './graph.mjs';
import { guides, imageDe } from '../cms/snapshot.mjs';
import { htmlPourPage } from '../cms/html.mjs';
import { cheminMedia } from '../cms/site.mjs';
import { sortieBloc, bandePourSortie } from './sortie.mjs';

const D = 2;

function renderCategory(category) {
  const titreCourt = category.titreCourt || category.title;
  const image = imageDe(category.image);
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Conseils', href: 'pages/conseils.html' },
    { label: titreCourt },
  ]);
  const problemes = problemesListe();
  const lies = (category.problemes || []).filter(Boolean);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'Conseils',
    title: category.title,
    lead: category.lead,
    image,
  })}

  <section class="section">
    <div class="container">
      <div class="article-layout">
        <div class="prose" id="article-body">
          <p class="lead">${category.standfirst}</p>

${htmlPourPage(category.html, D)}

${sortieBloc(D, category, `conseils-${category.slug}`)}
        </div>

        <aside class="article-aside">
          <nav class="toc" data-toc data-toc-scope="#article-body" aria-labelledby="toc-${category.slug}">
            <details class="toc__box">
              <summary class="toc__title" id="toc-${category.slug}">Sur cette page</summary>
              <ul class="toc__list" data-toc-list></ul>
            </details>
          </nav>
          <div class="aside-card aside-card--accent">
            <p class="aside-card__title">Un doute sur votre situation&nbsp;?</p>
            <p>Le pré-diagnostic pose le contexte en cinq questions.</p>
            <a class="btn btn--primary btn--sm btn--block" href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">Décrire mon problème</a>
          </div>
          ${lies.length ? `<div class="aside-card">
            <p class="aside-card__title">Symptômes liés</p>
            <p>${lies
              .map((slug) => {
                const problem = problemes.find((item) => item.slug === slug);
                return `<a class="link" href="${rel(D, `pages/problemes/${slug}.html`)}">${problem ? problem.label : slug}</a>`;
              })
              .join('<br>')}</p>
          </div>` : ''}
        </aside>
      </div>
    </div>
  </section>

${relatedSection(D, { type: 'conseil', slug: category.slug }, { kicker: 'À lire ensuite' })}

${ctaBand(D, bandePourSortie(category.sortie, BANDES.probleme))}
`;

  return {
    path: `pages/conseils/${category.slug}.html`,
    depth: D,
    navCurrent: 'pages/conseils.html',
    title: titreCourt,
    fullTitle: category.seoTitle ? `${category.seoTitle} | Expert Parquet` : null,
    description: category.seoDescription || category.excerpt,
    css: ['pages/home.css', 'pages/article.css'],
    ogImage: category.seoImage ? cheminMedia(category.seoImage, undefined) : image ? `assets/images/${image}` : undefined,
    body,
    jsonLd: [crumb.jsonLd],
  };
}

export function advicePages() {
  return guides().map(renderCategory);
}
