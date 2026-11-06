/**
 * Pages « problème ». Toutes suivent exactement la même structure :
 * symptômes → causes possibles → erreurs fréquentes → premières vérifications
 * → quand demander une expertise → contenus associés.
 *
 * Le contenu vient de WordPress (type Problème) par l'instantané éditorial.
 * Créer une page problème : Expert Parquet → Problèmes → Ajouter, puis
 * « Publier le site ». La structure ci-dessous est imposée par le gabarit.
 */

import { rel, breadcrumb } from '../layout.mjs';
import { ICONS, ctaBand, BANDES, faqAccordion, faqJsonLd, pageHero } from '../partials.mjs';
import { relatedSection } from './graph.mjs';
import { problemes, faqParIds, imageDe } from '../cms/snapshot.mjs';
import { htmlPourPage, faqPourPage } from '../cms/html.mjs';
import { cheminMedia } from '../cms/site.mjs';
import { sortieBloc } from './sortie.mjs';

const D = 2;

function renderProblemPage(problem) {
  const faq = faqPourPage(faqParIds(problem.faq), D);
  const image = imageDe(problem.image);
  const titreCourt = problem.titreCourt || problem.title;
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Problèmes', href: 'pages/problemes.html' },
    { label: titreCourt },
  ]);

  const causes = problem.causes
    .map(
      (cause) => `            <li><strong>${cause.t}.</strong> ${cause.d}</li>`
    )
    .join('\n');

  const complement = htmlPourPage(problem.html, D);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'Problème de parquet',
    title: problem.title,
    lead: problem.lead,
    image,
    /* Parcours « problème » : comprendre d'abord. Le pré-diagnostic est le
       premier bouton, l'expertise le second — elle vient quand la cause
       résiste, pas avant. */
    actions: `<a class="btn btn--primary" href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">Analyser mon problème</a><a class="btn btn--on-dark" href="${rel(D, 'pages/devis.html')}">Demander une expertise</a>`,
  })}

  <section class="section">
    <div class="container">
      <div class="article-layout">
        <div class="prose" id="article-body">
          <h2 id="symptomes">Symptômes observés</h2>
          <ul>
${problem.symptomes.map((item) => `            <li>${item}</li>`).join('\n')}
          </ul>

          <h2 id="causes">Causes possibles</h2>
          <p>Ces pistes sont générales&nbsp;: elles ne valent pas diagnostic. Plusieurs peuvent se combiner sur une même surface.</p>
          <ul>
${causes}
          </ul>

          <h2 id="erreurs">Erreurs fréquentes</h2>
          <ul>
${problem.erreurs.map((item) => `            <li>${item}</li>`).join('\n')}
          </ul>

          <h2 id="verifications">Premières vérifications</h2>
          <p>À faire soi-même, sans outillage particulier, avant toute intervention.</p>
          <ul class="rich-list rich-list--check">
${problem.verifications.map((item) => `            <li>${item}</li>`).join('\n')}
          </ul>
${complement.trim() ? `
${complement}
` : ''}
          <h2 id="expertise">Quand demander une expertise</h2>
          <p>${htmlPourPage(problem.expertise, D)}</p>

${sortieBloc(D, problem, `probleme-${problem.slug}`)}

          <div class="callout u-mt-lg">
            <p class="callout__title">${ICONS.alert} Portée de cette page</p>
            <p>Ce contenu est informatif. Il décrit des mécanismes généraux et ne peut pas établir la cause d’un désordre particulier&nbsp;: seule une observation sur place, avec mesures, le permet.</p>
          </div>

          ${faq.length ? `<h2 id="faq">Questions fréquentes</h2>
          <div class="u-mt-md">
${faqAccordion(faq, `${problem.slug}-faq`)}
          </div>` : ''}
        </div>

        <aside class="article-aside">
          <nav class="toc" data-toc data-toc-scope="#article-body" aria-labelledby="toc-${problem.slug}">
            <details class="toc__box">
              <summary class="toc__title" id="toc-${problem.slug}">Sur cette page</summary>
              <ul class="toc__list" data-toc-list></ul>
            </details>
          </nav>
          <div class="aside-card aside-card--accent">
            <p class="aside-card__title">Votre cas est différent&nbsp;?</p>
            <p>Le pré-diagnostic pose le contexte en cinq questions et propose une orientation adaptée à vos réponses.</p>
            <a class="link-arrow" href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">Faire le pré-diagnostic</a>
          </div>
          <div class="aside-card">
            <p class="aside-card__title">Autres symptômes</p>
            <p><a class="link" href="${rel(D, 'pages/problemes.html')}">Voir tous les problèmes de parquet</a></p>
          </div>
        </aside>
      </div>
    </div>
  </section>

${relatedSection(D, { type: 'probleme', slug: problem.slug }, { kicker: 'Pour aller plus loin' })}

${ctaBand(D, BANDES.probleme)}
`;

  return {
    path: `pages/problemes/${problem.slug}.html`,
    depth: D,
    navCurrent: 'pages/problemes.html',
    title: titreCourt,
    fullTitle: problem.seoTitle ? `${problem.seoTitle} | Expert Parquet` : null,
    description: problem.seoDescription || problem.lead.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ''),
    css: ['pages/home.css', 'pages/article.css'],
    ogImage: problem.seoImage ? cheminMedia(problem.seoImage, undefined) : image ? `assets/images/${image}` : undefined,
    body,
    jsonLd: [crumb.jsonLd, faq.length ? faqJsonLd(faq) : null],
  };
}

export function problemPages() {
  return problemes().map(renderProblemPage);
}
