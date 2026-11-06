/**
 * Articles du blog « Conseils » — gabarit de rendu.
 *
 * En-tête, sommaire généré, image de couverture, corps, FAQ, contenus associés
 * et rappel d'action. Le contenu vient de WordPress (type Conseil, format
 * « article »), par l'instantané éditorial. Ce fichier ne contient que la mise
 * en page, et rien à lire pour qui cherche du contenu.
 */

import { rel, breadcrumb, SITE, plainText } from '../layout.mjs';
import { faqAccordion, faqJsonLd, ctaBand, BANDES } from '../partials.mjs';
import { relatedSection } from './graph.mjs';
import { photo } from '../images.mjs';
import { articles, faqParIds, imageDe, theme, dateLabel } from '../cms/snapshot.mjs';
import { htmlPourPage, faqPourPage } from '../cms/html.mjs';
import { cheminMedia } from '../cms/site.mjs';
import { sortieBloc, bandePourSortie } from './sortie.mjs';

const D = 1;

/**
 * Description courte a partir du chapeau de l'article.
 *
 * On prefere une VRAIE phrase : la premiere du chapeau si elle tient dans la
 * limite, sinon une coupe sur une frontiere de mot suivie de points de
 * suspension. Une description SEO saisie dans WordPress passe avant.
 */
export function resumer(html, max = 158) {
  const texte = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  if (texte.length <= max) return texte;

  const phrases = texte.match(/[^.!?]+[.!?]+/g) || [];
  let cumul = '';
  for (const phrase of phrases) {
    if ((cumul + phrase).trim().length > max) break;
    cumul += phrase;
  }
  cumul = cumul.trim();
  if (cumul.length >= 100) return cumul;

  const coupe = texte.slice(0, max - 1);
  return coupe.slice(0, coupe.lastIndexOf(' ')).replace(/[\s,;:]+$/, '') + '…';
}

function renderArticle(article) {
  const categorie = (theme(article.theme) || {}).name || '';
  const faq = faqPourPage(faqParIds(article.faq), D);
  const image = imageDe(article.image);
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
            <p class="kicker">${categorie}</p>
            <h1 class="article-head__title">${article.title}</h1>
            <p class="article-head__standfirst">${article.standfirst}</p>
            <p class="article-head__meta">
              <time datetime="${article.date}">Publié le ${dateLabel(article.date)}</time>
              <span aria-hidden="true">•</span>
              <span>${article.readingTime} de lecture</span>
            </p>
          </header>

${image ? `
          <figure class="media media--16x9 article__cover">
            ${photo(D, image, { sizes: '(min-width: 901px) 68vw, 100vw', priority: true })}
          </figure>
` : ''}
          <div class="prose u-mt-xl" id="article-body">
${htmlPourPage(article.html, D)}
${faq.length ? `
            <h2 id="faq">Questions fréquentes</h2>
            <div class="u-mt-md">
${faqAccordion(faq, `${article.slug}-faq`)}
            </div>` : ''}
          </div>

${sortieBloc(D, article, `article-${article.slug}`)}

          <!-- Plus d'encart « Et pour votre cas ? » : le bandeau final porte la
               sortie du parcours, l'encart latéral la sortie contextuelle. -->
        </div>

        <aside class="article-aside">
          <nav class="toc" data-toc data-toc-scope="#article-body" aria-labelledby="toc-${article.slug}">
            <details class="toc__box">
              <summary class="toc__title" id="toc-${article.slug}">Sommaire</summary>
              <ul class="toc__list" data-toc-list></ul>
            </details>
          </nav>
${asideArticle(article)}
        </aside>
      </div>
    </div>
  </section>

${relatedSection(D, { type: 'article', slug: article.slug })}

${ctaBand(D, bandePourSortie(article.sortie, BANDES.probleme))}
`;

  return {
    path: `articles/${article.slug}.html`,
    depth: D,
    navCurrent: 'pages/conseils.html',
    title: article.title,
    /* `title` reste le H1 visible ; le titre SEO, quand il existe, ne
       raccourcit QUE la balise <title>. */
    fullTitle: article.seoTitle ? `${article.seoTitle} | Expert Parquet` : null,
    description: article.seoDescription || resumer(article.standfirst),
    css: ['pages/home.css', 'pages/article.css'],
    ogImage: article.seoImage ? cheminMedia(article.seoImage, undefined) : image ? `assets/images/${image}` : undefined,
    body,
    jsonLd: [
      crumb.jsonLd,
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: plainText(article.title),
        description: article.standfirst.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ''),
        image: `${SITE.baseUrl}/assets/images/${image || 'hero.jpg'}`,
        datePublished: article.date,
        dateModified: article.date,
        inLanguage: 'fr-FR',
        mainEntityOfPage: `${SITE.baseUrl}/articles/${article.slug}.html`,
        articleSection: categorie,
      },
      faq.length ? faqJsonLd(faq) : null,
    ],
  };
}

/* L'encart latéral suit le parcours de sortie de l'article : un article de
   choix mène au moteur, un article de compréhension au pré-diagnostic, un
   article d'analyse à l'expertise. Un seul bouton, jamais le même que le
   bandeau final. */
function asideArticle(article) {
  if (article.sortie === 'moteur') {
    return `          <div class="aside-card aside-card--accent">
            <p class="aside-card__title">Vous savez ce que vous cherchez&nbsp;?</p>
            <p>Quelques critères suffisent pour identifier les parquets qui correspondent à votre projet.</p>
            <a class="btn btn--primary btn--sm btn--block" href="${rel(D, 'pages/trouver-mon-parquet.html')}">Trouver mon parquet</a>
          </div>`;
  }
  if (article.sortie === 'expertise') {
    return `          <div class="aside-card aside-card--accent">
            <p class="aside-card__title">Besoin d’un avis&nbsp;?</p>
            <p>Décrivez votre parquet et sa situation&nbsp;: vous recevrez les éléments à vérifier en priorité.</p>
            <a class="btn btn--primary btn--sm btn--block" href="${rel(D, 'pages/devis.html')}">Demander une expertise</a>
          </div>`;
  }
  return `          <div class="aside-card aside-card--accent">
            <p class="aside-card__title">Et pour votre cas&nbsp;?</p>
            <p>Cet article décrit des mécanismes généraux. Le pré-diagnostic pose votre situation en cinq questions.</p>
            <a class="btn btn--primary btn--sm btn--block" href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">Analyser mon problème</a>
          </div>`;
}

export function articlePages() {
  return articles().map(renderArticle);
}
