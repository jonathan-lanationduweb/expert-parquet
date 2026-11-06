/**
 * L'instantané éditorial, côté build : lecture et accès typés.
 *
 * Ce fichier fait partie de l'outillage de développement (dossier `tools/`).
 * Il n'est PAS chargé par le site.
 *
 * Source unique : `data/content/snapshot.json`, écrit par
 * tools/cms/fetch-snapshot.mjs à partir de WordPress. Aucun texte éditorial
 * ne vit plus dans les gabarits : ils lisent ici. La variable EP_SNAPSHOT
 * désigne un autre fichier (prévisualisation avec brouillons).
 *
 * Ce module n'importe rien du reste de l'outillage : layout.mjs et images.mjs
 * s'appuient dessus, il ne doit donc pas s'appuyer sur eux.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const CHEMIN = process.env.EP_SNAPSHOT
  ? resolve(process.env.EP_SNAPSHOT)
  : join(ROOT, 'data', 'content', 'snapshot.json');

let DATA = null;

/**
 * Les espaces insécables saisis dans WordPress (U+00A0) redeviennent l'entité
 * `&nbsp;` que les gabarits ont toujours écrite : même HTML, même rendu, et
 * les métadonnées (`escapeAttr`, `plainText`) continuent de les traiter.
 */
function entites(valeur) {
  if (typeof valeur === 'string') return valeur.replace(/ /g, '&nbsp;');
  if (Array.isArray(valeur)) return valeur.map(entites);
  if (valeur && typeof valeur === 'object') {
    return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, entites(v)]));
  }
  return valeur;
}

export function snapshot() {
  if (DATA) return DATA;
  if (!existsSync(CHEMIN)) {
    throw new Error(
      `Instantané éditorial introuvable : ${CHEMIN}\n` +
        'Récupérez-le depuis WordPress : node tools/cms/fetch-snapshot.mjs (ou « Publier le site » dans l’administration).'
    );
  }
  DATA = entites(JSON.parse(readFileSync(CHEMIN, 'utf8')));
  if (!DATA || DATA.version !== 1) throw new Error('Instantané éditorial : version inattendue.');
  return DATA;
}

/* ------------------------------------------------------------ médias */

export function media(id) {
  if (!id) return null;
  return snapshot().media[String(id)] || null;
}

/** Nom de fichier image d'un contenu (`hero.jpg` ou `cms/41-nom.jpg`), ou null. */
export function imageDe(id) {
  const m = media(id);
  return m ? m.file : null;
}

/* ------------------------------------------------------------ navigation */

export function navigation() {
  return snapshot().navigation.filter((n) => n.visible !== false);
}

export function headerCta() {
  return snapshot().headerCta.label || 'Trouver mon parquet';
}

/* ------------------------------------------------------------ taxonomies */

export function themes() {
  return snapshot().themes;
}

export function theme(slug) {
  return themes().find((t) => t.slug === slug) || null;
}

export function groupesFaq() {
  return snapshot().groupesFaq;
}

export function groupeFaq(slug) {
  return groupesFaq().find((g) => g.slug === slug) || null;
}

/* ------------------------------------------------------------ FAQ */

const faqItem = (f) => ({ q: f.question, a: f.answer, id: f.id });

/** Les questions d'un groupe, dans l'ordre éditorial. */
export function faqs(groupe) {
  return snapshot()
    .faq.filter((f) => f.groupe === groupe)
    .sort((a, b) => a.ordre - b.ordre || a.id - b.id)
    .map(faqItem);
}

/** Les questions rattachées à un contenu, dans l'ordre choisi par le rédacteur. */
export function faqParIds(ids) {
  const index = new Map(snapshot().faq.map((f) => [f.id, f]));
  return (ids || []).map((id) => index.get(id)).filter(Boolean).map(faqItem);
}

/* ------------------------------------------------------------ conseils */

export function conseils() {
  return snapshot().conseils;
}

export function articles() {
  return conseils().filter((c) => c.format !== 'guide');
}

export function guides() {
  return conseils().filter((c) => c.format === 'guide');
}

export function conseil(slug) {
  return conseils().find((c) => c.slug === slug) || null;
}

/** Les articles du plus récent au plus ancien ; à date égale, l'ordre éditorial. */
export function articlesRecents(n = 3) {
  return [...articles()].sort((a, b) => b.date.localeCompare(a.date) || a.ordre - b.ordre || a.id - b.id).slice(0, n);
}

/**
 * Les conseils mis en avant sur l'accueil : sélection manuelle ordonnée,
 * complétée par les plus récents s'il en manque.
 */
export function conseilsAvant(n = 3) {
  const choisis = articles()
    .filter((c) => c.featured)
    .sort((a, b) => (a.featuredOrder || 99) - (b.featuredOrder || 99) || a.ordre - b.ordre);
  const out = choisis.slice(0, n);
  for (const a of articlesRecents(articles().length)) {
    if (out.length >= n) break;
    if (!out.includes(a)) out.push(a);
  }
  return out;
}

/* ------------------------------------------------------------ problèmes */

export function problemes() {
  return snapshot().problemes;
}

export function probleme(slug) {
  return problemes().find((p) => p.slug === slug) || null;
}

export function problemesAvant(n = 4) {
  const choisis = problemes()
    .filter((p) => p.featured)
    .sort((a, b) => (a.featuredOrder || 99) - (b.featuredOrder || 99) || a.ordre - b.ordre);
  const out = choisis.slice(0, n);
  for (const p of problemes()) {
    if (out.length >= n) break;
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

/* ------------------------------------------------------------ pages */

export function page(slug) {
  const p = snapshot().pages[slug];
  if (!p) throw new Error(`Page « ${slug} » absente de l'instantané : créez-la dans WordPress (Pages) et publiez-la.`);
  return p;
}

/** Un champ d'une page à gabarit ; `defaut` si le rédacteur l'a laissé vide. */
export function champ(slug, cle, defaut = '') {
  const v = page(slug).champs[cle];
  return v === undefined || v === null || v === '' ? defaut : v;
}

/* ------------------------------------------------------------ outils */

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** `2026-02-10` → `10 février 2026`. Sans Intl : le résultat ne dépend pas de la machine. */
export function dateLabel(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  return `${Number(m[3])}${Number(m[3]) === 1 ? 'er' : ''} ${MOIS[Number(m[2]) - 1]} ${m[1]}`;
}

/** Le `<title>` d'un contenu : titre SEO, sinon titre court, sinon titre — suffixé. */
export function titrePage(entree, suffixe = ' | Expert Parquet') {
  const base = entree.seoTitle || entree.titreCourt || entree.title;
  return `${base}${suffixe}`;
}
