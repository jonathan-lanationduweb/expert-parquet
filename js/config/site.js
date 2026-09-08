/**
 * Configuration générale du site.
 *
 * Les coordonnées valent toutes `null` : l’interface masque alors le bloc
 * correspondant au lieu d’afficher un libellé technique (voir
 * ARCHITECTURE.md §14). Elles sont à renseigner avant mise en ligne.
 *
 * Les points d’envoi des formulaires valent également `null`, ce qui place le
 * site en mode DEMO — voir docs/BACKEND-CONTRACT.md.
 *
 * Ce fichier est servi au navigateur : aucune clé d’API, aucun secret.
 */

export const SITE = {
  name: 'Expert Parquet',
  domain: 'expert-parquet.com',
  baseUrl: 'https://expert-parquet.com',
  tagline: 'Diagnostic et expertise de parquet',
  description:
    'Comprendre l’origine d’un problème de parquet avant d’engager des travaux : diagnostic, expertise et conseils techniques.',
};

/**
 * Coordonnées — À RENSEIGNER.
 * `null` signifie « information non fournie » : l’interface affiche alors un
 * placeholder explicite plutôt qu’une valeur inventée.
 */
export const CONTACT = {
  email: null, // ex. 'contact@expert-parquet.com'
  phone: null, // ex. '+33 1 23 45 67 89'
  phoneDisplay: null,
  address: null,
  hours: null,
  coverage: null, // zone d’intervention
  legalEntity: null,
  siret: null,
};

/**
 * Configuration des formulaires.
 *
 * DEUX MODES, déterminés uniquement par la présence d'un point d'envoi :
 *
 *   DEMO — aucun point d'envoi. Rien n'est transmis, rien n'est stocké, et
 *          l'interface le dit explicitement. C'est l'état actuel du site.
 *   LIVE — un point d'envoi est renseigné. Le même HTML et le même JavaScript
 *          gèrent alors l'envoi, l'attente, le succès et les erreurs.
 *
 * Passer en LIVE ne demande QUE de renseigner une URL ici. Aucun gabarit à
 * refaire, aucun composant à réécrire. Voir BACKEND-CONTRACT.md pour la charge
 * utile attendue et les protections à prévoir côté serveur.
 *
 * Ne jamais placer de clé d'API ni de secret dans ce fichier : il est servi au
 * navigateur. L'authentification éventuelle est l'affaire du serveur.
 */
export const FORMS = {
  /** Repli commun, utilisé si aucun point d'envoi spécifique n'est défini. */
  endpoint: null, // ex. 'https://api.expert-parquet.com/v1/forms'
  /** Point d'envoi du formulaire de contact (data-form="contact"). */
  contactEndpoint: null, // ex. 'https://api.expert-parquet.com/v1/contact'
  /** Point d'envoi de la demande d'expertise (data-form="devis"). */
  quoteEndpoint: null, // ex. 'https://api.expert-parquet.com/v1/quotes'

  method: 'POST',

  /* --- Photographies de la demande d'expertise ---------------------------------
     `uploadEnabled` reste false tant qu'aucun service de stockage n'existe : le
     front sélectionne, prévisualise et retire des photos, mais n'en téléverse
     aucune et ne prétend jamais le contraire. Ces limites sont déjà appliquées
     côté navigateur ; elles devront l'être AUSSI côté serveur, qui ne doit
     jamais faire confiance au client. */
  uploadEnabled: false,
  maxFiles: 6,
  maxFileSizeMo: 8,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
};

/** Correspondance `data-form` → clé de point d'envoi dans FORMS. */
const ENDPOINT_BY_FORM = {
  contact: 'contactEndpoint',
  devis: 'quoteEndpoint',
};

/**
 * Point d'envoi effectif d'un formulaire : celui qui lui est propre, sinon le
 * repli commun, sinon `null`. Un seul endroit décide, pour que la logique ne
 * soit pas dupliquée dans les composants.
 */
export function endpointFor(formName) {
  const key = ENDPOINT_BY_FORM[formName];
  return (key && FORMS[key]) || FORMS.endpoint || null;
}

/** Mode d'un formulaire : 'live' s'il a un point d'envoi, 'demo' sinon. */
export function formMode(formName) {
  return endpointFor(formName) ? 'live' : 'demo';
}

/** Liens éditoriaux externes utilisés ponctuellement dans les contenus. */
export const EXTERNAL_LINKS = {
  premibel: 'https://premibel.fr',
};
