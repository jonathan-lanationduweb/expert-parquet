/**
 * Orientation commerciale — le besoin d'abord.
 *
 * ---------------------------------------------------------------------------
 * CE QUI A CHANGÉ, ET POURQUOI
 *
 * La version précédente DEVINAIT le besoin : elle lisait la surface, le délai,
 * le type de local, et en déduisait si la personne approvisionnait un chantier
 * ou choisissait un parquet. Cela supposait qu'elle ait rempli un formulaire —
 * onze champs obligatoires — avant de pouvoir être orientée vers une enseigne.
 * Un formulaire devenait un péage.
 *
 * Désormais la personne le DIT, en un clic. Deux questions au plus, et aucune
 * donnée personnelle n'est demandée pour franchir la porte :
 *
 *   1. Votre besoin   → choisir un parquet | approvisionner un chantier
 *   2. Vous êtes      → particulier | professionnel   (seulement si utile)
 *
 * Les données du formulaire — surface, délai, local — restent utiles LORSQU'ELLES
 * EXISTENT DÉJÀ : elles servent alors à relire une demande enregistrée. Elles
 * ne sont plus jamais demandées dans le seul but de choisir une destination.
 *
 * ---------------------------------------------------------------------------
 * CE QUE LES DEUX ENSEIGNES PROPOSENT RÉELLEMENT
 *
 * Relevé sur leurs sites le 30/09/2026, pas supposé.
 *
 * PREMIBEL — ouvert aux particuliers ET aux professionnels. Deux showrooms,
 *   plus de 700 références, styles posés, toutes finitions, experts 6 j/7,
 *   devis gratuit, espace professionnel avec tarifs dédiés.
 *   → l'enseigne où l'on CHOISIT.
 *
 * OVER PARQUET — « 100 % PRO », inscription sur KBIS vérifié, prix visibles
 *   après connexion. Plus de 500 références en stock immédiat, Click & Collect
 *   en trois heures, remises professionnelles.
 *   → l'enseigne où l'on S'APPROVISIONNE.
 *
 * Les deux vendent les mêmes familles de produits : ce n'est pas le produit qui
 * les distingue, c'est la manière de l'obtenir.
 *
 * ---------------------------------------------------------------------------
 * UNE RÈGLE QUI NE SE DISCUTE PAS
 *
 * Over Parquet n'accepte pas les particuliers. Un particulier n'y est donc
 * jamais envoyé, quel que soit son besoin — même s'il annonce un chantier.
 */

import { PARTNERS } from './site.js';
import { REMPLACEMENT_PLAUSIBLE } from './diagnostic-rules.js';

/** Les trois besoins, tels que le visiteur les exprime lui-même. */
export const BESOINS = {
  /** Comprendre, mesurer, faire réparer. Aucune vente n'y répond. */
  EXPERTISE: 'expertise',
  /** Choisir un parquet : voir, comparer, être conseillé. */
  SELECTION: 'selection',
  /** Approvisionner un chantier : disponibilité, délai, volume. */
  APPROVISIONNEMENT: 'supply',
};

/** Libellés affichables. */
export const LIBELLE_BESOIN = {
  [BESOINS.EXPERTISE]: 'Expertise ou réparation',
  [BESOINS.SELECTION]: 'Choix d’un nouveau parquet',
  [BESOINS.APPROVISIONNEMENT]: 'Approvisionnement de chantier',
};

/**
 * Les questions du mini-routeur. Deux au maximum, et la seconde n'est posée
 * que parce qu'elle change réellement la réponse : elle décide de l'accès
 * (Over Parquet est fermé aux particuliers) et de la porte d'entrée chez
 * Premibel (espace professionnel ou entrée générale).
 */
export const ROUTEUR = {
  besoin: {
    question: 'Votre besoin :',
    choix: [
      { valeur: BESOINS.SELECTION, libelle: 'Choisir un parquet' },
      { valeur: BESOINS.APPROVISIONNEMENT, libelle: 'Approvisionner un chantier' },
    ],
  },
  profil: {
    question: 'Vous êtes :',
    choix: [
      { valeur: 'particulier', libelle: 'Particulier' },
      { valeur: 'professionnel', libelle: 'Professionnel' },
    ],
  },
};

/**
 * Le besoin d'une demande déjà enregistrée, quand personne ne l'a exprimé.
 *
 * Sert au back-office et à l'après-devis : on relit ce qu'on a. Le
 * remplacement n'est envisagé que pour les symptômes de
 * `REMPLACEMENT_PLAUSIBLE` — la même liste que le pré-diagnostic, pour que le
 * site ne se contredise pas d'un écran à l'autre.
 */
export function besoinDeduit({ probleme } = {}) {
  const problemes = [].concat(probleme || []).filter(Boolean);
  return problemes.some((p) => REMPLACEMENT_PLAUSIBLE.includes(p))
    ? BESOINS.SELECTION
    : BESOINS.EXPERTISE;
}

/** Une enseigne accepte-t-elle ce profil ? Profil inconnu : on reste prudent. */
function accepte(cle, customerType) {
  const p = PARTNERS[cle];
  if (!p || !p.url) return false;
  if (!p.audience) return true;
  if (!customerType) return p.audience.includes('particulier');
  return p.audience.includes(customerType);
}

/**
 * La décision.
 *
 * @param {object} projet
 * @param {string} [projet.need]          besoin exprimé — prioritaire sur tout
 * @param {string} [projet.customerType]  'particulier' | 'professionnel'
 * @param {object} [projet.knownContext]  ce qu'on sait déjà (problème…), pour
 *                                        déduire le besoin s'il n'est pas dit
 * @returns {{besoin: string, destinations: string[], raison: string}}
 */
export function orientation({ need, customerType = '', knownContext = {} } = {}) {
  const besoin = need || besoinDeduit(knownContext);

  if (besoin === BESOINS.EXPERTISE) {
    return {
      besoin,
      destinations: [],
      raison: 'Le besoin porte sur la cause du désordre, pas sur l’achat d’un parquet.',
    };
  }

  /* L'ordre dit la pertinence, pas une préférence commerciale : en tête,
     l'enseigne dont le métier répond au besoin exprimé. */
  const ordre =
    besoin === BESOINS.APPROVISIONNEMENT
      ? ['overparquet', 'premibel']
      : ['premibel', 'overparquet'];

  const destinations = ordre.filter((cle) => accepte(cle, customerType));

  return { besoin, destinations, raison: raisonner(besoin, customerType, destinations) };
}

function raisonner(besoin, customerType, destinations) {
  if (destinations.length === 0) {
    return 'Aucune enseigne partenaire n’est ouverte à ce profil.';
  }
  if (destinations.length > 1) {
    return 'Deux solutions peuvent convenir.';
  }
  if (besoin === BESOINS.APPROVISIONNEMENT) {
    return 'Over Parquet est réservé aux professionnels : pour ce projet, Premibel fournit aussi bien le volume que le conseil.';
  }
  return 'Showroom, références et conseil.';
}

/**
 * Ce qui distingue chaque enseigne, en une phrase. Affiché dès qu'on en
 * propose deux : présenter deux boutons sans dire ce qui les sépare
 * reviendrait à déléguer un choix sans donner de quoi le faire.
 */
export const DIFFERENCE = {
  premibel: 'Pour le choix, le conseil et le showroom.',
  overparquet: 'Pour l’approvisionnement professionnel, le stock et la disponibilité.',
};

/* Compatibilité : l'ancien nom reste appelable le temps que tout converge. */
export const orienter = (projet = {}) =>
  orientation({
    need: projet.need,
    customerType: projet.customerType,
    knownContext: { probleme: projet.probleme },
  });
