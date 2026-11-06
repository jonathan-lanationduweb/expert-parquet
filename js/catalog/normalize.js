/**
 * Forme canonique d'un produit côté navigateur.
 *
 * L'essentiel de la normalisation est fait à l'import (tools/catalog/
 * import-catalog.mjs), à partir des catégories et attributs des enseignes.
 * Ici on ne fait que garantir la forme : un champ absent devient `null` ou
 * `[]`, jamais `undefined`, pour que le moteur n'ait aucun cas particulier.
 *
 * Les libellés affichables des facettes vivent ici aussi : ce sont ceux que
 * le visiteur lit dans les résultats (« Point de Hongrie », « Huilé »…).
 */

export const LIBELLES = {
  type: { massif: 'Massif', contrecolle: 'Contrecollé', stratifie: 'Stratifié', terrasse: 'Lame de terrasse' },
  motif: { 'lames-droites': 'Lames droites', 'point-de-hongrie': 'Point de Hongrie', 'baton-rompu': 'Bâton rompu', versailles: 'Versailles' },
  teinte: { blanc: 'Blanc', clair: 'Clair', naturel: 'Naturel', miel: 'Miel', brun: 'Brun', cuivre: 'Cuivre', fonce: 'Foncé', gris: 'Gris' },
  finition: { verni: 'Verni', huile: 'Huilé', brut: 'Brut', stratifie: 'Stratifié' },
  pieces: { salon: 'Séjour', chambre: 'Chambre', entree: 'Entrée, couloir', bureau: 'Bureau, usage commercial', humide: 'Salles de bain et cuisines' },
  chauffage: { basse: 'Chauffage au sol basse température', haute: 'Chauffage au sol basse et haute température', non: 'Non compatible chauffage au sol' },
};

export const ENSEIGNE_NOM = { premibel: 'Premibel', overparquet: 'Over Parquet' };

const texte = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function normalizeProduct(p) {
  if (!p || !p.id || !p.url || !p.nom) return null;
  return {
    id: p.id,
    enseigne: p.enseigne === 'overparquet' ? 'overparquet' : 'premibel',
    sku: texte(p.sku),
    nom: p.nom,
    url: p.url,
    image: p.image && p.image.src ? { src: p.image.src, thumb: p.image.thumb || p.image.src, alt: p.image.alt || p.nom } : null,
    type: texte(p.type),
    motif: texte(p.motif),
    teinte: texte(p.teinte),
    finition: texte(p.finition),
    essence: texte(p.essence),
    pieces: Array.isArray(p.pieces) ? p.pieces.filter(Boolean) : [],
    chauffage: texte(p.chauffage),
    epaisseur: texte(p.epaisseur),
    largeur: texte(p.largeur),
    coucheUsure: texte(p.coucheUsure),
    aspect: Array.isArray(p.aspect) ? p.aspect.filter(Boolean) : [],
    enStock: p.enStock !== false,
    contrepartie: p.contrepartie && p.contrepartie.url ? { ...p.contrepartie } : null,
  };
}

/**
 * Le motif classé par l'enseigne est-il contredit par le nom de la fiche ?
 *
 * Exemple relevé à l'import : des stratifiés « Decoart bâton rompu … » rangés
 * dans « Lames droites ». La donnée source n'est pas réécrite ; elle n'est
 * simplement pas tenue pour fiable — ni affichée, ni utilisée pour apparier.
 */
const MOTIFS_DANS_LE_NOM = [
  ['point-de-hongrie', /point\s*de\s*hongrie/i],
  ['baton-rompu', /b[aâ]ton\s*rompu/i],
  ['versailles', /versailles/i],
];
export function motifFiable(p) {
  if (!p.motif) return false;
  for (const [motif, re] of MOTIFS_DANS_LE_NOM) {
    if (re.test(p.nom || '') && motif !== p.motif) return false;
  }
  return true;
}

/** Deux à quatre caractéristiques réelles, pour la carte résultat. */
export function caracteristiques(p) {
  const out = [];
  /* Sur un stratifié, « chêne » est un décor imprimé, pas une essence : on le
     dit tel quel. */
  if (p.essence) out.push(p.type === 'stratifie' ? `Décor ${p.essence.toLowerCase()}` : p.essence);
  if (p.type) out.push(LIBELLES.type[p.type] || p.type);
  if (p.motif && motifFiable(p)) out.push(LIBELLES.motif[p.motif] || p.motif);
  if (p.finition && p.finition !== 'stratifie') out.push(LIBELLES.finition[p.finition] || p.finition);
  if (p.largeur && p.epaisseur) out.push(`${p.largeur} × ${p.epaisseur}`);
  else if (p.largeur) out.push(`largeur ${p.largeur}`);
  if (p.coucheUsure) out.push(`couche d’usure ${p.coucheUsure}`);
  return out.slice(0, 4);
}
