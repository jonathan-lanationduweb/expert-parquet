/**
 * Le parcours de sortie d'un contenu, traduit en HTML.
 *
 * Dans WordPress, le rédacteur choisit une destination (moteur, pré-diagnostic,
 * expertise, aucune) et, pour le moteur, des critères dans des listes fermées.
 * Il ne saisit jamais d'URL : c'est ici qu'elle se construit, et ici que se
 * décide le bandeau de fin de page.
 */

import { BANDES, blocRemplacement } from '../partials.mjs';

/** Le bandeau final selon la sortie ; `defaut` quand la sortie n'en impose pas. */
export function bandePourSortie(sortie, defaut) {
  if (sortie === 'moteur') return BANDES.choisir;
  if (sortie === 'expertise') return BANDES.expertise;
  if (sortie === 'diagnostic') return BANDES.probleme;
  return defaut;
}

/** Les critères du moteur à transmettre dans l'URL — seulement ceux renseignés. */
export function prefillDe(params = {}) {
  const prefill = {};
  for (const cle of ['piece', 'type', 'essence', 'motif', 'teinte', 'finition']) {
    if (params[cle]) prefill[cle] = params[cle];
  }
  if (params.chauffage) prefill.chauffage = '1';
  if (params.pro) {
    prefill.profil = 'professionnel';
    prefill.besoin = 'supply';
  }
  return prefill;
}

/**
 * L'encart « Trouver un parquet adapté » après le texte, quand le rédacteur a
 * demandé un remplacement plausible ET une sortie vers le moteur. Les textes
 * vides prennent les valeurs standard de `blocRemplacement`.
 */
export function sortieBloc(depth, contenu, campagne) {
  if (!contenu.remplacement || contenu.sortie !== 'moteur') return '';
  const options = { campagne, prefill: prefillDe(contenu.sortieParams) };
  if (contenu.sortieTitre) options.titre = contenu.sortieTitre;
  if (contenu.sortieTexte) options.texte = contenu.sortieTexte;
  if (contenu.sortieAction) options.action = contenu.sortieAction;
  if (contenu.sortieSecondaire === false) options.secondaire = null;
  return blocRemplacement(depth, options);
}
