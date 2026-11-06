import { rel } from '../layout.mjs';
import { pageHero } from '../partials.mjs';

const D = 0;

/*
 * PAGE 404 — adresse introuvable.
 *
 * Servie par le serveur (Apache en production : `ErrorDocument 404 /404.html`)
 * pour TOUTE adresse inexistante, quelle que soit sa profondeur. Le corps de la
 * page reste donc à l'adresse demandée (ex. /pages/quelque-chose) : un chemin
 * relatif y pointerait à côté. D'où le `baseHref: '/'` — toutes les URL
 * relatives (CSS, JS, liens) se résolvent alors depuis la racine du domaine,
 * quelle que soit l'adresse qui a déclenché la 404.
 *
 * Hors sitemap (ce n'est pas une page de contenu) et toujours `noindex` : une
 * page d'erreur n'a rien à faire dans l'index de Google.
 */
export function notFoundPage() {
  const actions =
    `<a class="btn btn--primary" href="${rel(D, 'index.html')}">Retour à l’accueil</a>` +
    `<a class="btn btn--outline" href="${rel(D, 'pages/problemes.html')}">Problèmes de parquet</a>` +
    `<a class="btn btn--outline" href="${rel(D, 'pages/trouver-mon-parquet.html')}">Trouver mon parquet</a>`;

  const body = `${pageHero(D, {
    crumbHtml: '',
    kicker: 'Erreur 404',
    title: 'Cette page est introuvable',
    lead: 'La page que vous cherchez a été déplacée, renommée, ou n’a jamais existé. Reprenez depuis l’accueil, ou choisissez l’une des entrées ci-dessous.',
    actions,
  })}
`;

  return {
    path: '404.html',
    depth: D,
    noindex: true,
    baseHref: '/',
    navCurrent: null,
    title: 'Page introuvable',
    description:
      'La page demandée est introuvable. Reprenez depuis l’accueil d’Expert Parquet ou rejoignez les problèmes de parquet et le moteur « Trouver mon parquet ».',
    css: ['pages/home.css'],
    body,
  };
}
