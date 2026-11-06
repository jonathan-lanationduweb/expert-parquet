/**
 * Replis : quand aucun produit précis ne correspond.
 *
 * Niveau 2 — une CATÉGORIE réelle de l'enseigne, la plus spécifique dont on a
 * l'adresse. On ne construit jamais une URL : chaque slug ci-dessous est lu
 * dans data/catalog-index.json, c'est-à-dire dans la liste des catégories
 * telle que l'enseigne l'a servie. Un slug absent de l'enseigne est ignoré.
 *
 * Niveau 3 — l'ENSEIGNE, par son entrée adaptée au profil (js/config/site.js).
 */

import { partnerUrl, partnerFor } from '../config/site.js';
import { LIBELLES } from '../catalog/normalize.js';

/* Priorité des catégories, du plus précis au plus général. Les slugs
   composés (motif × type) viennent avant les slugs simples. */
function slugsCandidats(c) {
  const out = [];
  if (c.piece === 'terrasse') out.push({ slug: 'lames-de-terrasse', libelle: 'Lames de terrasse' });
  if (c.piece === 'humide') {
    out.push({ slug: 'parquet-salle-de-bain', libelle: 'Parquet salle de bain' });
    out.push({ slug: 'parquet-pour-salles-de-bain-et-cuisines', libelle: 'Parquets pour salles de bain et cuisines' });
  }
  if (c.motif && c.type) {
    const combos = {
      'point-de-hongrie|contrecolle': 'parquet-flottant-point-de-hongrie',
      'point-de-hongrie|massif': 'point-de-hongrie-massif',
      'baton-rompu|massif': 'parquet-massif-baton-rompu',
      'baton-rompu|contrecolle': 'parquet-flottant-baton-rompu',
      'versailles|contrecolle': 'parquet-flottant-versailles',
      'lames-droites|massif': 'parquet-massif-lames-droites',
    };
    const slug = combos[`${c.motif}|${c.type}`];
    if (slug) out.push({ slug, libelle: `${LIBELLES.motif[c.motif]} ${LIBELLES.type[c.type].toLowerCase()}` });
  }
  if (c.motif) out.push({ slug: c.motif, libelle: LIBELLES.motif[c.motif] });
  if (c.type) {
    const t = { massif: 'parquet-massif', contrecolle: 'parquet-flottant', stratifie: 'parquet-sol-stratifie' }[c.type];
    out.push({ slug: t, libelle: `Parquet ${LIBELLES.type[c.type].toLowerCase()}` });
  }
  if (c.teintes && c.teintes.length) for (const t of c.teintes) out.push({ slug: t, libelle: `Parquets ${LIBELLES.teinte[t].toLowerCase()}s` });
  if (c.finition) out.push({ slug: c.finition, libelle: `Parquets ${LIBELLES.finition[c.finition].toLowerCase()}s` });
  if (c.piece && c.piece !== 'humide' && c.piece !== 'terrasse') {
    const p = { salon: 'parquet-salon', chambre: 'parquet-chambre', entree: 'parquet-entree-couloir', bureau: 'parquet-bureau-usage-commercial' }[c.piece];
    out.push({ slug: p, libelle: `Parquets pour ${LIBELLES.pieces[c.piece].toLowerCase()}` });
  }
  out.push({ slug: 'parquet', libelle: 'Tous les parquets' });
  return out;
}

/**
 * @param {object} index      data/catalog-index.json
 * @param {object} c          critères normalisés
 * @param {string} enseigne   'premibel' | 'overparquet'
 * @param {string} campagne   contexte UTM
 * @returns {{slug:string, libelle:string, nom:string, url:string, nb:number}|null}
 */
export function getCategoryFallback(index, c, enseigne, campagne) {
  const cats = index?.enseignes?.[enseigne]?.categories;
  if (!cats) return null;
  for (const cand of slugsCandidats(c)) {
    const cat = cats[cand.slug];
    if (cat && cat.url && cat.nb > 0) {
      return { ...cand, nom: cat.nom, nb: cat.nb, url: avecUtm(cat.url, campagne) };
    }
  }
  return null;
}

/** Niveau 3 : l'enseigne elle-même, par la bonne porte. */
export function getPartnerFallback(enseigne, c, campagne) {
  const p = partnerFor(enseigne);
  const url = partnerUrl(enseigne, campagne, c.profil);
  if (!p || !url) return null;
  return { enseigne, nom: p.nom, url };
}

function avecUtm(url, campagne) {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', 'expert-parquet');
    u.searchParams.set('utm_medium', 'referral');
    if (campagne) u.searchParams.set('utm_campaign', campagne);
    return u.toString();
  } catch {
    return url;
  }
}

export { avecUtm };
