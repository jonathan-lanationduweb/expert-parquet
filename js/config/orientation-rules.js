/**
 * Moteur d'orientation commerciale.
 *
 * ---------------------------------------------------------------------------
 * CE QUI A CHANGÉ, ET POURQUOI
 *
 * La première version routait sur le seul profil : professionnel → une
 * enseigne, particulier → l'autre. C'était faux sur le fond — le profil dit
 * QUI parle, pas CE DONT il a besoin — et faux en pratique : la destination
 * prévue pour les particuliers ne les accepte pas.
 *
 * Ici, c'est le BESOIN qui décide. Le profil reste un critère, décisif sur un
 * seul point : l'accès. Il n'est plus le routeur.
 *
 * ---------------------------------------------------------------------------
 * CE QUE LES DEUX ENSEIGNES PROPOSENT RÉELLEMENT
 *
 * Relevé sur leurs sites le 30/09/2026, pas supposé.
 *
 * PREMIBEL — ouvert aux particuliers ET aux professionnels.
 *   Deux showrooms à Paris et un entrepôt, plus de 700 références, des styles
 *   posés (point de Hongrie, bâton rompu, Versailles), toutes les finitions,
 *   des experts 6 j/7, devis gratuit, conseil sur le type de pose, paiement en
 *   quatre fois. Un espace professionnel avec tarifs dédiés existe aussi.
 *   → l'enseigne où l'on CHOISIT : voir, toucher, être conseillé.
 *
 * OVER PARQUET — « 100 % PRO », inscription sur KBIS vérifié, prix visibles
 *   après connexion seulement.
 *   Plus de 500 références en stock immédiat, Click & Collect en trois heures,
 *   remises professionnelles, livraison offerte dès 1000 € HT.
 *   → l'enseigne où l'on S'APPROVISIONNE : disponibilité, délai, volume.
 *
 * Les deux vendent du massif, du contrecollé, du stratifié, de la terrasse et
 * des accessoires : ce n'est donc PAS le produit qui les distingue, c'est la
 * manière de l'obtenir. D'où une matrice fondée sur le besoin, jamais sur
 * l'essence ou le format du parquet.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CE MODULE NE FAIT PAS
 *
 * Il ne redirige rien et n'ouvre aucune fenêtre : il rend une décision, que
 * l'interface présente et que le visiteur suit ou non. Et il préfère rendre
 * « aucune destination » plutôt qu'une destination douteuse — un site d'aide
 * qui pousse à l'achat sans raison perd ce qui fait sa valeur.
 */

import { PARTNERS } from './site.js';
import { REMPLACEMENT_PLAUSIBLE } from './diagnostic-rules.js';

/** Les trois besoins que les données du projet permettent de distinguer. */
export const BESOINS = {
  /** Comprendre, mesurer, faire constater. Aucune vente n'y répond. */
  EXPERTISE: 'expertise',
  /** Choisir un nouveau parquet : voir, comparer, être conseillé. */
  SELECTION: 'selection',
  /** Approvisionner un chantier : disponibilité, délai, volume. */
  APPROVISIONNEMENT: 'approvisionnement',
};

/** Libellés affichables des besoins, pour le site et le back-office. */
export const LIBELLE_BESOIN = {
  [BESOINS.EXPERTISE]: 'Expertise ou réparation',
  [BESOINS.SELECTION]: 'Choix d’un nouveau parquet',
  [BESOINS.APPROVISIONNEMENT]: 'Approvisionnement de chantier',
};

/** Surfaces qui relèvent d'un chantier plutôt que d'une pièce. */
const GRANDES_SURFACES = ['50-100', 'plus-100'];

/**
 * Le besoin, déduit des seules réponses réellement disponibles.
 *
 * Le remplacement n'est envisagé que pour les symptômes de
 * `REMPLACEMENT_PLAUSIBLE` — la même liste que le pré-diagnostic, pour que le
 * site ne se contredise pas d'un écran à l'autre. Un grincement ou une tache
 * n'ouvrent donc jamais une orientation commerciale.
 */
export function besoinDuProjet({ probleme, surface, delai, logement, customerType } = {}) {
  const problemes = [].concat(probleme || []).filter(Boolean);
  if (!problemes.some((p) => REMPLACEMENT_PLAUSIBLE.includes(p))) {
    return BESOINS.EXPERTISE;
  }

  /* Approvisionnement : trois signaux, tous issus du formulaire, et seulement
     pour un professionnel — un particulier pressé reste quelqu'un qui doit
     d'abord choisir. */
  const chantier =
    customerType === 'professionnel' &&
    (logement === 'local-pro' || GRANDES_SURFACES.includes(surface) || delai === 'urgent');

  return chantier ? BESOINS.APPROVISIONNEMENT : BESOINS.SELECTION;
}

/** Une enseigne accepte-t-elle ce profil ? Vide = profil inconnu, on reste prudent. */
function accepte(cle, customerType) {
  const p = PARTNERS[cle];
  if (!p || !p.url) return false;
  if (!p.audience) return true;
  /* Profil inconnu : on n'oriente que vers une enseigne ouverte à tous. Un
     visiteur qui n'a pas dit qui il est ne doit pas se heurter à un KBIS. */
  if (!customerType) return p.audience.includes('particulier');
  return p.audience.includes(customerType);
}

/**
 * La décision.
 *
 * @returns {{besoin: string, destinations: string[], raison: string}}
 *   `destinations` est vide quand il faut rester chez Expert Parquet, et peut
 *   contenir DEUX enseignes quand les deux répondent réellement au besoin —
 *   dans ce cas la première est la plus proche du besoin exprimé, et
 *   l'interface présente les deux avec leur différence.
 */
export function orienter(projet = {}) {
  const customerType = projet.customerType || '';
  const besoin = besoinDuProjet(projet);

  if (besoin === BESOINS.EXPERTISE) {
    return {
      besoin,
      destinations: [],
      raison: 'Le besoin porte sur la cause du désordre, pas sur l’achat d’un parquet.',
    };
  }

  /* L'ordre dit la pertinence, pas une préférence commerciale : on met en
     tête l'enseigne dont le métier répond au besoin exprimé. */
  const ordre =
    besoin === BESOINS.APPROVISIONNEMENT
      ? ['overparquet', 'premibel']
      : ['premibel', 'overparquet'];

  const destinations = ordre.filter((cle) => accepte(cle, customerType));

  return {
    besoin,
    destinations,
    raison: raisonner(besoin, customerType, destinations),
  };
}

function raisonner(besoin, customerType, destinations) {
  if (destinations.length === 0) {
    return 'Aucune enseigne partenaire n’est ouverte à ce profil pour ce besoin.';
  }
  if (destinations.length > 1) {
    return 'Deux solutions peuvent correspondre à ce projet.';
  }
  if (besoin === BESOINS.APPROVISIONNEMENT) {
    return 'Le projet ressemble à un approvisionnement de chantier.';
  }
  return customerType === 'particulier' || !customerType
    ? 'Le projet suppose de choisir un parquet, avec conseil et showroom.'
    : 'Le projet suppose de choisir un parquet.';
}

/**
 * Ce qui distingue chaque enseigne, en une phrase, affichée quand les deux
 * sont proposées. Sans cela, présenter deux boutons reviendrait à déléguer un
 * choix sans donner de quoi le faire.
 */
export const DIFFERENCE = {
  premibel: 'Showroom, plus de 700 références et conseil : l’enseigne où l’on choisit.',
  overparquet: 'Stock immédiat, retrait en trois heures et remises professionnelles : l’enseigne où l’on s’approvisionne. Réservée aux professionnels.',
};
