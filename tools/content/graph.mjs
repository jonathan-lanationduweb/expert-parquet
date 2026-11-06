/**
 * Graphe de contenu — choix des contenus associés.
 *
 * Ce fichier fait partie de l’outillage de développement (dossier `tools/`).
 * Il n’est PAS chargé par le site.
 *
 * Le principe retenu :
 *
 * 1. Les recommandations choisies dans WordPress (« Contenus associés », et
 *    « Symptômes liés » pour les guides) passent d’abord. Ce sont des choix
 *    éditoriaux, ils ne se discutent pas.
 * 2. Les places restantes sont comblées par les contenus qui partagent le plus
 *    d’étiquettes (`tags`) avec le contenu courant.
 * 3. Un contenu ne se recommande jamais lui-même, aucun doublon, et deux
 *    contenus du même type au maximum : l’intérêt est justement de faire passer
 *    d’un article à une page de désordre, puis à une page de conseil.
 *
 * En cas d’égalité de score, l’ordre éditorial tranche — le résultat est donc
 * déterministe, et deux builds successifs produisent le même HTML.
 */

import { rel } from '../layout.mjs';
import { articles, guides, problemes } from '../cms/snapshot.mjs';

/** Libellé affiché devant chaque suggestion : le lecteur sait où il va. */
const TYPE_LABEL = {
  article: 'Article',
  probleme: 'Désordre',
  conseil: 'Guide',
};

let INDEX = null;

function buildIndex() {
  const items = [];

  for (const a of articles()) {
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

  for (const p of problemes()) {
    items.push({
      type: 'probleme',
      slug: p.slug,
      href: `pages/problemes/${p.slug}.html`,
      title: p.titreCourt || p.title,
      teaser: p.lead,
      tags: p.tags || [],
      related: p.related || [],
    });
  }

  for (const c of guides()) {
    items.push({
      type: 'conseil',
      slug: c.slug,
      href: `pages/conseils/${c.slug}.html`,
      title: c.titreCourt || c.title,
      teaser: c.lead,
      tags: c.tags || [],
      related: [...(c.related || []), ...(c.problemes || [])],
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
