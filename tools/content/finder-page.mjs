import { rel, breadcrumb } from '../layout.mjs';
import { pageHero } from '../partials.mjs';
import { finderSection } from '../hub-blocks.mjs';

const D = 1;

/*
 * PAGE « TROUVER MON PARQUET » (05/10/2026)
 *
 * Le moteur de recommandation a sa page. Sur l'accueil, il n'était ouvert par
 * défaut : la première question s'affichait sous le hero et transformait la
 * page en questionnaire. Ici il est déclenché volontairement — par le bouton
 * du hero, celui du header, le pied de page ou la sortie du pré-diagnostic —,
 * il a toute la place pour ses résultats, et il a une URL : partageable, et
 * capable de porter les critères déjà connus (`?piece=…&type=…&via=pre-
 * diagnostic`), que le moteur reprend sans les redemander.
 *
 * Pas de contenu SEO artificiel : un titre, une promesse, le moteur.
 */

export function finderPage() {
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Trouver mon parquet' },
  ]);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    /* Pas de surtitre : le titre et le bouton du header le disent déjà. */
    kicker: null,
    title: 'Trouver mon parquet',
    lead: 'Expert Parquet analyse vos critères puis vous oriente vers des références réelles, issues des catalogues de deux enseignes externes. Aucune donnée personnelle.',
  })}

${finderSection(D, { entete: false })}
`;

  return {
    path: 'pages/trouver-mon-parquet.html',
    depth: D,
    navCurrent: null,
    title: 'Trouver mon parquet',
    fullTitle: 'Trouver mon parquet pour votre projet | Expert Parquet',
    description:
      'Pièce, type, essence, motif, teinte, finition : les critères pour identifier les parquets adaptés à votre projet, dans les catalogues Premibel et Over Parquet.',
    css: ['pages/home.css', 'pages/hub.css'],
    bodyClass: 'page-finder',
    body,
    jsonLd: [crumb.jsonLd],
  };
}
