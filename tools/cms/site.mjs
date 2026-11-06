/**
 * La configuration du site, côté build : identité, apparence, navigation,
 * pied de page, SEO — la section `site` de l'instantané, validée.
 *
 * Ce fichier fait partie de l'outillage de développement (dossier `tools/`).
 * Il n'est PAS chargé par le site. Il n'importe rien du reste de l'outillage
 * (layout.mjs s'appuie dessus).
 *
 * Deux principes :
 *   - des VALEURS PAR DÉFAUT égales à la V1 : un instantané sans section `site`
 *     (ou un réglage laissé vide) produit exactement le site d'avant ;
 *   - une VALIDATION qui refuse de construire plutôt que de publier un site
 *     cassé : couleur, adresses, destinations, icônes, nombre de colonnes.
 */

import { snapshot, media } from './snapshot.mjs';

/* ------------------------------------------------------------ référentiels */

/** Les pages internes qu'un lien peut viser. Même liste que EP_Site::pages_internes(). */
export const PAGES_INTERNES = {
  accueil: 'index.html',
  problemes: 'pages/problemes.html',
  conseils: 'pages/conseils.html',
  diagnostic: 'pages/diagnostic.html',
  expertise: 'pages/expertise.html',
  'a-propos': 'pages/a-propos.html',
  contact: 'pages/contact.html',
  faq: 'pages/faq.html',
  devis: 'pages/devis.html',
  'trouver-mon-parquet': 'pages/trouver-mon-parquet.html',
  'mentions-legales': 'pages/mentions-legales.html',
};

/** Les parcours métier : le build construit l'URL. */
export const PARCOURS = {
  moteur: { href: 'pages/trouver-mon-parquet.html', hash: '' },
  'moteur-pro': { href: 'pages/trouver-mon-parquet.html', hash: '', query: 'profil=professionnel&besoin=supply' },
  diagnostic: { href: 'pages/diagnostic.html', hash: '#pre-diagnostic' },
  expertise: { href: 'pages/devis.html', hash: '' },
};

export const PARTENAIRES = {
  premibel: { besoin: 'selection', profil: '' },
  overparquet: { besoin: 'supply', profil: 'professionnel' },
};

export const ICONES_AUTORISEES = ['instagram', 'facebook', 'linkedin', 'youtube', 'email', 'telephone', 'externe'];
export const RESEAUX = ['instagram', 'facebook', 'linkedin', 'youtube'];
export const MAX_COLONNES = 4;

/* ------------------------------------------------------------ défauts (= V1) */

const lien = (type, libelle, destination, ordre) => ({ type, libelle, destination, icone: '', nouvel_onglet: false, actif: true, ordre });

export const DEFAUTS = {
  identity: { nom: 'Expert Parquet', baseline: 'Comprendre votre besoin parquet, puis aller à la bonne solution.', logo: null, logoClair: null, logoSombre: null, symbole: null, favicon: null, og: null },
  appearance: { accent: '#B04A1E', accentSombre: '' },
  navigation: {
    entrees: [
      { type: 'metier', key: 'problemes', label: 'Problèmes', visible: true, ordre: 1 },
      { type: 'metier', key: 'conseils', label: 'Conseils', visible: true, ordre: 2 },
      { type: 'metier', key: 'diagnostic', label: 'Diagnostic', visible: true, ordre: 3 },
      { type: 'metier', key: 'expertise', label: 'Expertise', visible: true, ordre: 4 },
      { type: 'metier', key: 'a-propos', label: 'À propos', visible: true, ordre: 5 },
    ],
    cta: { label: 'Trouver mon parquet', destination: 'moteur' },
  },
  footer: {
    pitch: 'Comprendre votre besoin parquet, puis aller à la bonne solution.',
    copyright: 'Expert Parquet',
    colonnes: [
      { titre: 'Comprendre', visible: true, ordre: 1, liens: [lien('page', 'Diagnostic', 'diagnostic', 1), lien('page', 'Problèmes', 'problemes', 2), lien('page', 'Conseils', 'conseils', 3)] },
      { titre: 'Solutions', visible: true, ordre: 2, liens: [lien('page', 'Trouver mon parquet', 'trouver-mon-parquet', 1), lien('partenaire', 'Choisir son parquet — Premibel', 'premibel', 2), lien('partenaire', 'Approvisionnement pro — Over Parquet', 'overparquet', 3), lien('page', 'Expertise', 'expertise', 4)] },
      { titre: 'Informations', visible: true, ordre: 3, liens: [lien('page', 'À propos', 'a-propos', 1), lien('page', 'Contact', 'contact', 2)] },
    ],
    legaux: [lien('page', 'Mentions légales', 'mentions-legales', 1)],
    reseaux: [],
  },
  seo: {
    nom: 'Expert Parquet',
    suffixe: ' | Expert Parquet',
    titreDefaut: 'Expert Parquet',
    descriptionDefaut: 'Comprendre un problème de parquet, trouver le parquet adapté et savoir quand une expertise se justifie.',
    descriptionSite: 'Hub d’orientation parquet : comprendre un problème, qualifier un projet, trouver le parquet adapté chez l’enseigne partenaire, et savoir quand une expertise se justifie.',
    og: null,
    indexation: true,
    organisation: { nom: 'Expert Parquet', url: 'https://expert-parquet.com' },
    websiteJsonLd: true,
  },
};

/* ------------------------------------------------------------ lecture */

let SITE = null;

function fusion(defaut, valeur) {
  if (Array.isArray(defaut)) return Array.isArray(valeur) ? valeur : defaut;
  if (defaut && typeof defaut === 'object') {
    const out = { ...defaut };
    for (const [k, v] of Object.entries(valeur || {})) {
      out[k] = k in defaut && defaut[k] && typeof defaut[k] === 'object' && !Array.isArray(defaut[k]) ? fusion(defaut[k], v) : v;
    }
    return out;
  }
  return valeur === undefined || valeur === null || valeur === '' ? defaut : valeur;
}

/** La configuration complète, défauts appliqués, validée une fois par build. */
export function site() {
  if (SITE) return SITE;
  const brut = snapshot().site || {};
  SITE = {
    identity: fusion(DEFAUTS.identity, brut.identity),
    appearance: fusion(DEFAUTS.appearance, brut.appearance),
    navigation: fusion(DEFAUTS.navigation, brut.navigation),
    footer: fusion(DEFAUTS.footer, brut.footer),
    seo: fusion(DEFAUTS.seo, brut.seo),
  };
  const erreurs = valider(SITE);
  if (erreurs.length) {
    throw new Error(`Configuration du site invalide — rien n'est construit :\n  - ${erreurs.join('\n  - ')}\nCorrigez-la dans WordPress (Site → Configuration du site).`);
  }
  return SITE;
}

/* ------------------------------------------------------------ validation */

const HEX = /^#[0-9A-Fa-f]{6}$/;
const URL_OK = /^https?:\/\/[^\s"<>]+$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function valider(s) {
  const e = [];
  if (!HEX.test(s.appearance.accent)) e.push(`couleur d'accent invalide : ${s.appearance.accent}`);
  if (s.appearance.accentSombre && !HEX.test(s.appearance.accentSombre)) e.push(`accent sombre invalide : ${s.appearance.accentSombre}`);
  for (const cle of ['logo', 'logoClair', 'logoSombre', 'favicon', 'og']) {
    const id = s.identity[cle];
    if (id && !media(id)) e.push(`identité : le média ${cle} (${id}) n'est pas dans l'instantané`);
  }
  if (s.seo.og && !media(s.seo.og)) e.push(`SEO : l'image sociale (${s.seo.og}) n'est pas dans l'instantané`);
  if (s.seo.organisation.url && !URL_OK.test(s.seo.organisation.url)) e.push(`SEO : adresse d'organisation invalide : ${s.seo.organisation.url}`);

  for (const n of s.navigation.entrees) {
    if (n.type === 'custom') {
      if (!n.label || !URL_OK.test(n.url || '')) e.push(`navigation : lien personnalisé invalide (${n.label || 'sans libellé'})`);
    } else if (!PAGES_INTERNES[n.key] && n.key !== 'moteur') {
      e.push(`navigation : destination inconnue « ${n.key} »`);
    }
  }
  if (!PARCOURS[s.navigation.cta.destination || 'moteur']) e.push('navigation : destination du bouton inconnue');

  const colonnes = s.footer.colonnes.filter((c) => c.visible !== false);
  if (colonnes.length > MAX_COLONNES) e.push(`pied de page : ${colonnes.length} colonnes visibles, ${MAX_COLONNES} au plus`);
  if (colonnes.length === 0) e.push('pied de page : aucune colonne visible');
  const verifierLien = (l, ou) => {
    switch (l.type) {
      case 'page':
        if (!PAGES_INTERNES[l.destination]) e.push(`${ou} : page interne inconnue « ${l.destination} »`);
        break;
      case 'parcours':
        if (!PARCOURS[l.destination]) e.push(`${ou} : parcours inconnu « ${l.destination} »`);
        break;
      case 'partenaire':
        if (!PARTENAIRES[l.destination]) e.push(`${ou} : enseigne inconnue « ${l.destination} »`);
        break;
      case 'externe':
        if (!URL_OK.test(l.destination)) e.push(`${ou} : adresse externe invalide « ${l.destination} »`);
        break;
      case 'email':
        if (!EMAIL.test(l.destination)) e.push(`${ou} : e-mail invalide « ${l.destination} »`);
        break;
      case 'telephone':
        if (!/^[0-9+ .]{8,}$/.test(l.destination)) e.push(`${ou} : téléphone invalide « ${l.destination} »`);
        break;
      default:
        e.push(`${ou} : type de lien inconnu « ${l.type} »`);
    }
    if (l.icone && !ICONES_AUTORISEES.includes(l.icone)) e.push(`${ou} : icône non autorisée « ${l.icone} »`);
    if (!l.libelle) e.push(`${ou} : lien sans libellé`);
  };
  for (const c of s.footer.colonnes) {
    if (!c.titre) e.push('pied de page : colonne sans titre');
    for (const l of c.liens || []) verifierLien(l, `pied de page, colonne « ${c.titre} »`);
  }
  for (const l of s.footer.legaux || []) verifierLien(l, 'pied de page, liens légaux');
  for (const r of s.footer.reseaux || []) {
    if (!RESEAUX.includes(r.reseau)) e.push(`réseaux sociaux : réseau inconnu « ${r.reseau} »`);
    if (!URL_OK.test(r.url || '')) e.push(`réseaux sociaux : adresse invalide pour ${r.reseau}`);
  }
  return e;
}

/* ------------------------------------------------------------ accès */

export const identite = () => site().identity;
export const apparence = () => site().appearance;
export const navigationSite = () => site().navigation;
export const footer = () => site().footer;
export const seo = () => site().seo;

/** Le chemin public d'un média d'identité, ou le repli donné. */
export function cheminMedia(id, repli) {
  const m = media(id);
  if (!m) return repli;
  return m.chemin || (m.file.startsWith('cms/') ? `assets/images/${m.file}` : `assets/images/${m.file}`);
}

/** Les trois logotypes, avec leurs replis : principal → variantes. */
export function logos() {
  const i = identite();
  const principal = cheminMedia(i.logo, 'assets/brand/expert-parquet-logo-on-light.png');
  const dims = (id, d) => {
    const m = media(id);
    return m && m.width && m.height ? { width: m.width, height: m.height } : d;
  };
  const DEF = { width: 338, height: 128 };
  return {
    surClair: { src: cheminMedia(i.logoSombre, principal), ...dims(i.logoSombre || i.logo, DEF) },
    surSombre: { src: cheminMedia(i.logoClair, i.logo ? principal : 'assets/brand/expert-parquet-logo-on-dark.png'), ...dims(i.logoClair || i.logo, DEF) },
  };
}

/** Le favicon administré, ou null : les favicons historiques restent alors en place. */
export function favicon() {
  const m = media(identite().favicon);
  if (!m || !m.sizes || !m.sizes['favicon-32']) return null;
  const ext = (m.file.match(/\.[a-z0-9]+$/i) || ['.png'])[0];
  return {
    ico16: `assets/icons/cms/favicon-16x16${ext}`,
    ico32: `assets/icons/cms/favicon-32x32${ext}`,
    apple: `assets/icons/cms/apple-touch-icon${ext}`,
    disponibles: Object.keys(m.sizes).filter((k) => k.startsWith('favicon-')),
  };
}

/** L'image sociale par défaut : SEO, sinon identité, sinon l'image du hero. */
export function ogParDefaut() {
  return cheminMedia(seo().og, cheminMedia(identite().og, 'assets/images/hero.jpg'));
}

/** Les entrées visibles du menu, triées. */
export function entreesMenu() {
  return [...navigationSite().entrees].filter((n) => n.visible !== false).sort((a, b) => (a.ordre || 0) - (b.ordre || 0) || String(a.key).localeCompare(String(b.key)));
}

/** Les couleurs dérivées de l'accent ; pour l'accent V1, les valeurs V1 exactes. */
export function palette() {
  const { accent, accentSombre } = apparence();
  const a = accent.toUpperCase();
  if (a === '#B04A1E' && !accentSombre) {
    return { terra: '#B04A1E', terraDark: '#8E3A16', terraSoft: '#F0E5DF', terraOnDark: '#C96A38' };
  }
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const hex = (c) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  const mix = (c1, c2, p) => c1.map((v, i) => v + (c2[i] - v) * p);
  const base = rgb(a);
  return {
    terra: a,
    terraDark: accentSombre ? accentSombre.toUpperCase() : hex(mix(base, [0, 0, 0], 0.2)),
    terraSoft: hex(mix(base, [255, 255, 255], 0.85)),
    terraOnDark: hex(mix(base, [255, 255, 255], 0.22)),
  };
}
