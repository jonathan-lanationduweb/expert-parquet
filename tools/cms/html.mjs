/**
 * Le HTML éditorial venu de WordPress, rendu dans les conventions du site.
 *
 * Ce fichier fait partie de l'outillage de développement (dossier `tools/`).
 * Il n'est PAS chargé par le site.
 *
 * Le rédacteur écrit dans WordPress ; le gabarit garde la main sur la forme.
 * Quatre passes, dans cet ordre :
 *
 *   1. jetons d'icônes `[ep_icon nom]` → le SVG du jeu d'icônes ;
 *   2. liens internes écrits depuis la racine (`/pages/x.html`) → liens
 *      relatifs à la profondeur de la page, comme partout sur le site ;
 *   3. liens vers une enseigne partenaire → `rel="sponsored"` et attributs de
 *      mesure, sans que le rédacteur ait rien à savoir de tout cela ;
 *   4. balisage de l'éditeur de blocs → composants du site : un tableau
 *      devient `.table-scroll`, une image passe par le pipeline d'images
 *      (dimensions, srcset, alt), les classes `wp-block-*` disparaissent,
 *      les titres restent entre H2 et H3 et reçoivent un `id` pour le sommaire.
 */

import { rel } from '../layout.mjs';
import { ICONS } from '../partials.mjs';
import { photo } from '../images.mjs';
import { imageDe } from './snapshot.mjs';

const ENSEIGNES = [
  { hote: /^https?:\/\/(www\.)?premibel\.fr(\/|$)/, destination: 'premibel', besoin: 'selection' },
  { hote: /^https?:\/\/(www\.)?over-parquet\.com(\/|$)/, destination: 'over-parquet', besoin: 'supply' },
];

/** Identifiant d'ancre à partir d'un intitulé : minuscules, sans accents, tirets. */
export function slugifier(texte) {
  return String(texte)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'section';
}

function icones(html) {
  return html.replace(/\[ep_icon ([a-zA-Z]+)\]/g, (m, nom) => ICONS[nom] || '');
}

function liensInternes(html, depth) {
  return html.replace(/href="\/(?!\/)([^"]*)"/g, (m, chemin) => `href="${rel(depth, chemin)}"`);
}

function liensEnseignes(html, contexte) {
  return html.replace(/<a\s+([^>]*?)href="([^"]+)"([^>]*)>/g, (m, avant, href, apres) => {
    const e = ENSEIGNES.find((x) => x.hote.test(href));
    if (!e || /\brel=/.test(avant + apres)) return m;
    return `<a ${avant}href="${href}" rel="sponsored noopener" data-event="commercial_orientation"`
      + ` data-destination="${e.destination}" data-besoin="${e.besoin}" data-lien="editorial"`
      + ` data-context="${contexte}"${apres}>`;
  });
}

function blocs(html, depth, { sizes }) {
  let out = html;

  /* Tableaux : la figure de l'éditeur devient le conteneur défilant du site. */
  out = out.replace(/<figure class="wp-block-table[^"]*">\s*(<table[\s\S]*?<\/table>)\s*(?:<figcaption[^>]*>[\s\S]*?<\/figcaption>\s*)?<\/figure>/g, '<div class="table-scroll">$1</div>');

  /* Images de la médiathèque : la balise de l'éditeur est remplacée par celle
     du pipeline (dimensions réelles, srcset, alt du média). */
  out = out.replace(/<figure class="wp-block-image[^"]*">\s*<img[^>]*wp-image-(\d+)[^>]*>\s*(?:<figcaption[^>]*>([\s\S]*?)<\/figcaption>\s*)?<\/figure>/g, (m, id, legende) => {
    const fichier = imageDe(Number(id));
    if (!fichier) return '';
    return `<figure class="media media--16x9">${photo(depth, fichier, { sizes })}${legende ? `<figcaption>${legende}</figcaption>` : ''}</figure>`;
  });
  out = out.replace(/<img[^>]*wp-image-(\d+)[^>]*>/g, (m, id) => {
    const fichier = imageDe(Number(id));
    return fichier ? photo(depth, fichier, { sizes }) : '';
  });

  /* Classes de l'éditeur : le site a les siennes. */
  out = out.replace(/\sclass="((?:[^"]*\s)?wp-block-[^"]*)"/g, (m, classes) => {
    const reste = classes.split(/\s+/).filter((c) => c && !c.startsWith('wp-block-') && !/^(has-|is-)/.test(c));
    return reste.length ? ` class="${reste.join(' ')}"` : '';
  });

  /* Titres : H2 et H3 seulement. Un H2 sans identifiant en reçoit un, pour le
     sommaire ; un H3 n'y entre que si le rédacteur lui en a donné un. */
  out = out.replace(/<h1(\s[^>]*)?>([\s\S]*?)<\/h1>/g, '<h2$1>$2</h2>');
  out = out.replace(/<h([456])(\s[^>]*)?>([\s\S]*?)<\/h\1>/g, '<h3$2>$3</h3>');
  const vus = new Set();
  out = out.replace(/<h([2])(\s[^>]*)?>([\s\S]*?)<\/h\1>/g, (m, niveau, attrs = '', texte) => {
    const existant = /\sid="([^"]+)"/.exec(attrs || '');
    if (existant) {
      vus.add(existant[1]);
      return m;
    }
    let id = slugifier(texte);
    let n = 2;
    while (vus.has(id)) id = `${slugifier(texte)}-${n++}`;
    vus.add(id);
    return `<h${niveau} id="${id}"${attrs || ''}>${texte}</h${niveau}>`;
  });

  return out;
}

/**
 * @param {string} html      le HTML tel qu'exporté par WordPress
 * @param {number} depth     profondeur de la page cible
 * @param {object} [options]
 * @param {string} [options.contexte]  contexte de mesure des liens enseigne
 * @param {string} [options.sizes]     attribut `sizes` des images insérées
 */
export function htmlPourPage(html, depth, { contexte = 'editorial', sizes = '(min-width: 901px) 68vw, 100vw' } = {}) {
  if (!html) return '';
  return blocs(liensEnseignes(liensInternes(icones(html), depth), contexte), depth, { sizes });
}

/** Les réponses d'une liste de FAQ, rendues pour la page qui les affiche. */
export function faqPourPage(items, depth, contexte = 'faq') {
  return items.map((item) => ({ ...item, a: htmlPourPage(item.a, depth, { contexte }) }));
}
