/**
 * Critères de recherche — du besoin exprimé aux facettes du catalogue.
 *
 * Le visiteur parle de « séjour », de « clair », de « chauffage au sol ». Le
 * catalogue parle de catégories et d'attributs. Ce module fait la traduction,
 * dans un seul sens, et retourne toujours la même forme :
 *
 *   {
 *     scope:     'premibel' | 'overparquet'   — où l'on cherche
 *     profil:    'particulier' | 'professionnel' | ''
 *     piece:     'salon' | 'chambre' | 'entree' | 'bureau' | 'humide' | 'terrasse' | null
 *     chauffage: true | false
 *     type:      'massif' | 'contrecolle' | 'stratifie' | null
 *     motif:     'lames-droites' | 'point-de-hongrie' | 'baton-rompu' | 'versailles' | null
 *     teintes:   ['blanc','clair'] | ['naturel','miel'] | ['brun','cuivre'] | ['fonce'] | ['gris'] | []
 *     finition:  'huile' | 'verni' | 'brut' | null
 *     via:       d'où vient la demande ('pre-diagnostic', 'accueil'…)
 *   }
 *
 * `null` et `[]` signifient « sans préférence » : le critère n'intervient pas.
 */

/* Les familles de teinte que le visiteur choisit → les teintes du catalogue. */
export const FAMILLES_TEINTE = {
  clair: ['blanc', 'clair'],
  naturel: ['naturel', 'miel'],
  moyen: ['brun', 'cuivre'],
  fonce: ['fonce'],
  gris: ['gris'],
};

/* Pièces du pré-diagnostic (js/config/options.js) → pièces du catalogue. */
const PIECE_DEPUIS_DIAGNOSTIC = {
  sejour: 'salon',
  chambre: 'chambre',
  cuisine: 'humide',
  'salle-de-bain': 'humide',
  couloir: 'entree',
  bureau: 'bureau',
};

/* Essence : trois familles que le visiteur comprend. « Chêne » et « Bambou »
   sont les termes exacts de l'attribut « Essence » des enseignes ; « bois
   exotique » regroupe les essences qu'elles classent elles-mêmes dans la
   catégorie « Essences exotiques ». Le composite (décor de stratifié) n'est
   pas une essence : la question n'est pas posée pour un stratifié. */
export const ESSENCES = {
  chene: ['Chêne'],
  bambou: ['Bambou'],
  exotique: ['Wengé', 'Teck', 'Ipé', 'Merbau', 'Cumaru', 'Massaranduba', 'Itauba', 'Kempas', 'Tauari', 'Jarrah', 'Tatajuba', 'Padouk', 'Jatoba', 'Garapa'],
};

const PIECES = ['salon', 'chambre', 'entree', 'bureau', 'humide', 'terrasse'];
const TYPES = ['massif', 'contrecolle', 'stratifie'];
const MOTIFS = ['lames-droites', 'point-de-hongrie', 'baton-rompu', 'versailles'];
const FINITIONS = ['huile', 'verni', 'brut'];

const parmi = (v, liste) => (liste.includes(v) ? v : null);

/**
 * @param {object} brut  réponses du moteur, paramètres d'URL ou réponses du
 *                       pré-diagnostic — les clés acceptées sont les mêmes
 */
export function normalizeCriteria(brut = {}) {
  const profil = brut.profil === 'professionnel' ? 'professionnel' : brut.profil === 'particulier' ? 'particulier' : '';
  /* Over Parquet est réservé aux professionnels : seul un profil professionnel
     déclaré y cherche. Toute autre situation cherche chez Premibel. */
  const scope = profil === 'professionnel' && (brut.scope === 'overparquet' || brut.besoin === 'supply') ? 'overparquet' : 'premibel';

  let piece = parmi(brut.piece, PIECES);
  if (!piece && brut.piece && PIECE_DEPUIS_DIAGNOSTIC[brut.piece]) piece = PIECE_DEPUIS_DIAGNOSTIC[brut.piece];

  const famille = brut.teinte && FAMILLES_TEINTE[brut.teinte] ? brut.teinte : null;

  return {
    scope,
    profil,
    piece,
    chauffage: brut.chauffage === true || brut.chauffage === '1' || brut.chauffage === 'oui',
    type: piece === 'terrasse' ? null : parmi(brut.type, TYPES),
    essence: piece === 'terrasse' || brut.type === 'stratifie' ? null : parmi(brut.essence, Object.keys(ESSENCES)),
    motif: piece === 'terrasse' ? null : parmi(brut.motif, MOTIFS),
    famille,
    teintes: famille ? FAMILLES_TEINTE[famille] : [],
    finition: brut.type === 'stratifie' ? null : parmi(brut.finition, FINITIONS),
    via: typeof brut.via === 'string' ? brut.via.slice(0, 40) : '',
  };
}

/** Lit les critères depuis les paramètres d'une URL (pré-remplissage). */
export function criteriaFromSearch(search) {
  const q = new URLSearchParams(search || '');
  const brut = {};
  for (const k of ['piece', 'type', 'essence', 'motif', 'teinte', 'finition', 'profil', 'besoin', 'scope', 'via', 'chauffage']) {
    if (q.has(k)) brut[k] = q.get(k);
  }
  return brut;
}

/** Les critères réellement posés, pour l'affichage « votre recherche ». */
export function criteresPoses(c) {
  const out = [];
  if (c.piece) out.push({ cle: 'piece', valeur: c.piece });
  if (c.chauffage) out.push({ cle: 'chauffage', valeur: true });
  if (c.type) out.push({ cle: 'type', valeur: c.type });
  if (c.essence) out.push({ cle: 'essence', valeur: c.essence });
  if (c.motif) out.push({ cle: 'motif', valeur: c.motif });
  if (c.famille) out.push({ cle: 'teinte', valeur: c.famille });
  if (c.finition) out.push({ cle: 'finition', valeur: c.finition });
  return out;
}
