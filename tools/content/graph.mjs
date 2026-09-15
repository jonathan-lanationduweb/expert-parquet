/**
 * Graphe de contenu — choix des contenus associés.
 *
 * Ce fichier fait partie de l’outillage de développement (dossier `tools/`).
 * Il n’est PAS chargé par le site.
 *
 * Le problème résolu : jusqu’ici, la fin d’un article proposait les trois
 * premiers articles du tableau `ARTICLES`, moins lui-même. Un lecteur venu pour
 * l’humidité se voyait donc proposer le grincement, parce qu’il figure en
 * première position — pas parce qu’il a un rapport. Et la suggestion ne sortait
 * jamais des articles : ni page de désordre, ni page de conseil.
 *
 * Le principe retenu :
 *
 * 1. Les recommandations écrites à la main dans `related` (et `problems`)
 *    passent d’abord. Ce sont des choix éditoriaux, ils ne se discutent pas.
 * 2. Les places restantes sont comblées par les contenus qui partagent le plus
 *    d’étiquettes (`tags`) avec le contenu courant.
 * 3. Un contenu ne se recommande jamais lui-même, aucun doublon, et deux
 *    contenus du même type au maximum : l’intérêt est justement de faire passer
 *    d’un article à une page de désordre, puis à une page de conseil.
 *
 * En cas d’égalité de score, l’ordre du catalogue tranche — le résultat est donc
 * déterministe, et deux builds successifs produisent le même HTML.
 */

import { rel } from '../layout.mjs';
import { ARTICLES } from '../partials.mjs';
import { PROBLEM_PAGES } from './problem-pages.mjs';
import { ADVICE_CATEGORIES } from './advice-pages.mjs';

/** Libellé affiché devant chaque suggestion : le lecteur sait où il va. */
const TYPE_LABEL = {
  article: 'Article',
  probleme: 'Désordre',
  conseil: 'Guide',
};

/**
 * L’index est construit au premier appel, pas à l’évaluation du module : les
 * modules de pages importent ce fichier et ce fichier les importe en retour.
 * Le cycle est sans danger tant que rien n’est lu au chargement.
 */
let INDEX = null;

function buildIndex() {
  const items = [];

  for (const a of ARTICLES) {
    items.push({
      type: 'article',
      slug: a.slug,
      href: `articles/${a.slug}.html`,
      title: a.title,
      teaser: a.excerpt,
      tags: a.tags || [],
      related: a.related || [],
    });
  }

  for (const p of PROBLEM_PAGES) {
    items.push({
      type: 'probleme',
      slug: p.slug,
      href: `pages/problemes/${p.slug}.html`,
      title: p.title,
      teaser: p.lead,
      tags: p.tags || [],
      related: p.related || [],
    });
  }

  for (const c of ADVICE_CATEGORIES) {
    items.push({
      type: 'conseil',
      slug: c.slug,
      href: `pages/conseils/${c.slug}.html`,
      title: c.title,
      teaser: c.lead,
      tags: c.tags || [],
      related: [...(c.related || []), ...(c.problems || [])],
    });
  }

  return items;
}

function index() {
  if (!INDEX) INDEX = buildIndex();
  return INDEX;
}

/** Première phrase d’un chapô, pour tenir sur deux lignes dans une vignette. */
function premierePhrase(texte) {
  const nu = String(texte || '').trim();
  const fin = nu.search(/[.!?](\s|$)/);
  return fin === -1 ? nu : nu.slice(0, fin + 1);
}

/**
 * Contenus associés à `{ type, slug }`.
 * `explicites` complète les `related` déclarés par le contenu courant, pour les
 * catalogues (les articles) qui n’en portent pas encore.
 */
export function relatedItems({ type, slug, tags = [], explicites = [] }, limit = 3) {
  const tous = index();
  const courant = tous.find((item) => item.type === type && item.slug === slug);
  const mesTags = new Set(courant ? courant.tags : tags);
  const prioritaires = [...explicites, ...(courant ? courant.related : [])];

  const candidats = tous
    .filter((item) => !(item.type === type && item.slug === slug))
    .map((item) => {
      const rang = prioritaires.indexOf(item.slug);
      const communs = item.tags.filter((t) => mesTags.has(t)).length;
      return {
        item,
        // Une recommandation écrite à la main l’emporte sur n’importe quel score
        // calculé ; son rang dans la liste conserve l’ordre voulu.
        score: rang === -1 ? communs : 1000 - rang,
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  const choisis = [];
  const parType = {};
  for (const { item } of candidats) {
    if (choisis.length >= limit) break;
    parType[item.type] = parType[item.type] || 0;
    if (parType[item.type] >= 2) continue;
    parType[item.type] += 1;
    choisis.push(item);
  }
  return choisis;
}

/**
 * Bloc « Continuer à comprendre » : trois pistes au maximum, sans image.
 *
 * Sans image, volontairement : la fin d’un article est l’endroit où le lecteur
 * décide de continuer ou de partir. Trois grandes vignettes photographiques y
 * coûtaient plus de 400 px sur téléphone et répétaient des images déjà vues
 * dans l’article. Un titre et une phrase suffisent à choisir.
 */
export function relatedSection(depth, ref, { title = 'Continuer à comprendre', kicker = 'À lire ensuite', lead = null } = {}) {
  const items = relatedItems(ref);
  if (items.length === 0) return '';

  const rows = items
    .map(
      (item) => `        <a class="next-read__item" href="${rel(depth, item.href)}">
          <span class="next-read__kind">${TYPE_LABEL[item.type]}</span>
          <span class="next-read__title">${item.title}</span>
          <span class="next-read__text">${premierePhrase(item.teaser)}</span>
          <span class="next-read__arrow" aria-hidden="true"></span>
        </a>`
    )
    .join('\n');

  return `  <section class="section section--alt">
    <div class="container container--mid">
      <div class="sec-head" data-reveal>
        <div class="sec-head__rule"></div>
        <p class="kicker">${kicker}</p>
        <h2 class="sec-head__title">${title}</h2>
        ${lead ? `<p class="lead u-mt-md">${lead}</p>` : ''}
      </div>
      <div class="next-read u-mt-lg" data-reveal>
${rows}
      </div>
    </div>
  </section>`;
}
