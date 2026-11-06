/**
 * Appariement produits ↔ critères, et classement.
 *
 * ---------------------------------------------------------------------------
 * DEUX SORTES DE CRITÈRES
 *
 * Les critères DURS éliminent : un produit qui ne les satisfait pas — ou dont
 * on ignore s'il les satisfait — n'est pas proposé. Ce sont ceux où une erreur
 * coûterait cher au visiteur :
 *   - le type (massif / contrecollé / stratifié) ;
 *   - le motif ;
 *   - la pièce humide : seuls les produits que l'ENSEIGNE classe « salles de
 *     bain et cuisines » passent — nous n'inventons aucune compatibilité ;
 *   - la terrasse : seules les lames de terrasse ;
 *   - le chauffage au sol : seuls les produits que l'enseigne déclare
 *     compatibles. Inconnu = non proposé.
 *
 * Les critères SOUPLES classent : la pièce sèche (séjour, chambre…), la teinte
 * et la finition. Un produit dont la teinte est inconnue n'est pas éliminé,
 * mais il passe derrière ceux dont la teinte correspond.
 *
 * ---------------------------------------------------------------------------
 * EXPLICABLE
 *
 * Chaque score s'accompagne de `raisons` (ce qui correspond) et `ecarts` (ce
 * qui ne correspond pas ou n'est pas renseigné). La carte résultat les
 * affiche telles quelles : « Pourquoi ce parquet ? » a une réponse lisible.
 */

import { LIBELLES, motifFiable } from '../catalog/normalize.js';
import { ESSENCES } from './criteria.js';

/* Le motif d'un produit, ou null s'il est contredit par le nom de la fiche :
   une donnée douteuse n'élimine ni ne qualifie. */
const motifDe = (p) => (motifFiable(p) ? p.motif : null);

export const POIDS = {
  type: 30,
  essence: 25,
  motif: 25,
  piece: 20,
  teinte: 15,
  finition: 10,
  chauffage: 5,
};

const LIBELLE_FAMILLE = { clair: 'Teinte claire', naturel: 'Teinte naturelle', moyen: 'Teinte moyenne à brune', fonce: 'Teinte foncée', gris: 'Teinte grise' };
const LIBELLE_PIECE_CRITERE = { salon: 'un séjour', chambre: 'une chambre', entree: 'une entrée ou un couloir', bureau: 'un bureau ou un local commercial', humide: 'une cuisine ou une salle de bain', terrasse: 'une terrasse' };

/** Critères durs. Retourne la raison de l'exclusion, ou null si le produit passe. */
export function exclusion(p, c) {
  if (!p.enStock) return 'rupture';
  if (c.piece === 'terrasse') {
    if (p.type !== 'terrasse') return 'pas-terrasse';
  } else if (p.type === 'terrasse') {
    return 'terrasse-hors-sujet';
  }
  if (c.type && p.type !== c.type) return 'type';
  /* L'essence est dure elle aussi : un bambou « esprit chêne » n'est pas un
     chêne, et l'enseigne renseigne l'essence sur la quasi-totalité des fiches. */
  if (c.essence && !(p.essence && ESSENCES[c.essence].includes(p.essence))) return 'essence';
  if (c.motif && motifDe(p) !== c.motif) return 'motif';
  if (c.piece === 'humide' && !p.pieces.includes('humide')) return 'humide';
  if (c.chauffage && !(p.chauffage === 'basse' || p.chauffage === 'haute')) return 'chauffage';
  return null;
}

/**
 * Score d'un produit déjà passé par `exclusion()`.
 * @returns {{score:number, exact:boolean, raisons:string[], ecarts:string[]}}
 */
export function scoreProduct(p, c) {
  let score = 0;
  let exact = true;
  const raisons = [];
  const ecarts = [];

  if (c.type && p.type === c.type) { score += POIDS.type; raisons.push(LIBELLES.type[p.type]); }
  if (c.essence && p.essence && ESSENCES[c.essence].includes(p.essence)) { score += POIDS.essence; raisons.push(p.essence); }
  if (c.motif && motifDe(p) === c.motif) { score += POIDS.motif; raisons.push(LIBELLES.motif[p.motif]); }

  if (c.piece === 'humide' && p.pieces.includes('humide')) {
    score += POIDS.piece;
    raisons.push('Classé « salles de bain et cuisines » par l’enseigne');
  } else if (c.piece === 'terrasse' && p.type === 'terrasse') {
    score += POIDS.piece;
    raisons.push('Lame de terrasse');
  } else if (c.piece && c.piece !== 'humide' && c.piece !== 'terrasse') {
    if (p.pieces.includes(c.piece)) { score += POIDS.piece; raisons.push(`Proposé pour ${LIBELLE_PIECE_CRITERE[c.piece]}`); }
    else if (p.pieces.length === 0) { ecarts.push('pièce non renseignée'); exact = false; }
    else { score -= POIDS.piece / 2; ecarts.push(`non classé pour ${LIBELLE_PIECE_CRITERE[c.piece]}`); exact = false; }
  }

  if (c.chauffage && (p.chauffage === 'basse' || p.chauffage === 'haute')) {
    score += POIDS.chauffage;
    raisons.push(p.chauffage === 'haute' ? 'Compatible chauffage au sol (basse et haute température)' : 'Compatible chauffage au sol basse température');
  }

  if (c.teintes.length) {
    if (p.teinte && c.teintes.includes(p.teinte)) { score += POIDS.teinte; raisons.push(`${LIBELLE_FAMILLE[c.famille]} (${LIBELLES.teinte[p.teinte].toLowerCase()})`); }
    else if (!p.teinte) { ecarts.push('teinte non renseignée'); exact = false; }
    else { score -= POIDS.teinte; ecarts.push(`teinte ${LIBELLES.teinte[p.teinte].toLowerCase()}`); exact = false; }
  }

  if (c.finition) {
    if (p.finition === c.finition) { score += POIDS.finition; raisons.push(LIBELLES.finition[p.finition]); }
    else if (!p.finition) { ecarts.push('finition non renseignée'); exact = false; }
    else { score -= POIDS.finition / 2; ecarts.push(`finition ${LIBELLES.finition[p.finition].toLowerCase()}`); exact = false; }
  }

  /* Sans aucun critère souple ni dur satisfait, on n'a rien à expliquer : ce
     produit n'est pas une recommandation, juste un produit. */
  if (raisons.length === 0) exact = false;

  return { score, exact, raisons, ecarts };
}

/**
 * Produits candidats (critères durs) avec leur score.
 */
export function matchProducts(produits, c) {
  const out = [];
  for (const p of produits) {
    if (exclusion(p, c)) continue;
    out.push({ produit: p, ...scoreProduct(p, c) });
  }
  return out;
}

/* Complétude d'une fiche : le nombre de facettes réellement renseignées. À
   score égal, une fiche mieux décrite passe devant — ce n'est pas une
   métrique inventée, c'est la donnée qu'on a. Le motif douteux ne compte pas. */
export function completude(p) {
  return [p.type, p.essence, motifDe(p), p.teinte, p.finition, p.chauffage, p.pieces.length > 0, p.image].filter(Boolean).length;
}

/**
 * Classement stable : exacts d'abord, score décroissant, nombre de raisons,
 * complétude de la fiche, puis nom — deux exécutions donnent le même ordre,
 * et l'ordre alphabétique ne décide qu'en tout dernier.
 */
export function rankProducts(candidats) {
  return [...candidats].sort((a, b) =>
    (b.exact - a.exact) ||
    (b.score - a.score) ||
    (b.raisons.length - a.raisons.length) ||
    (completude(b.produit) - completude(a.produit)) ||
    a.produit.nom.localeCompare(b.produit.nom, 'fr', { sensitivity: 'base' })
  );
}

/**
 * La recommandation, prête à afficher.
 *
 *   niveau 1 : des produits précis (exacts sur tous les critères posés) ;
 *   niveau 2 : rien d'exact — l'appelant proposera une catégorie ;
 *   niveau 3 : rien du tout — l'appelant proposera l'enseigne.
 *
 * `proches` : jusqu'à deux produits qui passent les critères durs mais pas
 * tous les souples, avec leurs écarts, pour ne pas laisser un écran vide quand
 * la nuance est seulement une teinte ou une finition.
 */
export function recommend(produits, c, { max = 3 } = {}) {
  const classes = rankProducts(matchProducts(produits, c));
  const exacts = classes.filter((x) => x.exact).slice(0, max);
  const proches = exacts.length ? [] : classes.filter((x) => !x.exact && x.raisons.length).slice(0, 2);
  return {
    niveau: exacts.length ? 1 : classes.length ? 2 : 2,
    exacts,
    proches,
    candidats: classes.length,
  };
}
