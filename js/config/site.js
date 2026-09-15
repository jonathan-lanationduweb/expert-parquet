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
  endpoint: null, // ex. 'https://api.expert-parquet.com/expert-parquet/v1'
  /** Point d'envoi du formulaire de contact (data-form="contact"). */
  contactEndpoint: null, // ex. 'https://api.expert-parquet.com/wp-json/expert-parquet/v1/contact'
  /** Point d'envoi de la demande d'expertise (data-form="devis"). */
  quoteEndpoint: null, // ex. 'https://api.expert-parquet.com/wp-json/expert-parquet/v1/quote'

  method: 'POST',

  /* --- Photographies de la demande d'expertise ---------------------------------
     Les photos partent APRÈS la demande, pas avec elle : le serveur répond à
     l'envoi JSON par un identifiant et un jeton de dépôt, et les fichiers
     suivent dans une seconde requête. Un envoi unique ferait perdre la demande
     entière si le téléversement de six fichiers échouait en fin de course —
     c'est-à-dire au pire moment, sur une connexion mobile.

     Rien à configurer ici : l'adresse de dépôt et le jeton viennent de la
     réponse du serveur. Le téléversement suit donc automatiquement le point
     d'envoi de la demande d'expertise.

     Ces limites sont appliquées côté navigateur pour épargner un envoi inutile,
     et RÉAPPLIQUÉES côté serveur, qui ne fait jamais confiance au client. */
  maxFiles: 6,
  maxFileSizeMo: 8,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
};

/**
 * Le téléversement suit l'existence d'un point d'envoi pour la demande
 * d'expertise. Un seul interrupteur, donc aucune combinaison incohérente
 * possible — on ne peut pas se retrouver avec un formulaire qui envoie la
 * demande mais abandonne les photos en silence, ni l'inverse.
 */
export function uploadEnabled() {
  return Boolean(endpointFor('devis'));
}

/**
 * Traitement des données personnelles — À RENSEIGNER AVANT MISE EN SERVICE.
 *
 * Ces valeurs alimentent la page « Mentions légales et confidentialité ». Tant
 * que les formulaires sont en mode DEMO, elles ne servent à rien : rien n'est
 * collecté, et la page le dit.
 *
 * Dès qu'un point d'envoi est renseigné, elles deviennent OBLIGATOIRES et
 * `tools/check.mjs` refuse la construction si l'une manque. Ce n'est pas un
 * excès de zèle : mettre en service une collecte de données personnelles sans
 * nommer le responsable du traitement ni la durée de conservation est un
 * manquement, et la page de confidentialité promet aujourd'hui l'inverse.
 *
 * `conservationMois` doit correspondre à ce que fait RÉELLEMENT le backend :
 * l'extension WordPress purge les demandes closes passé ce délai. Annoncer une
 * durée sans l'appliquer serait pire que de n'en annoncer aucune.
 */
export const RGPD = {
  /** Durée de conservation d'une demande close, en mois. */
  conservationMois: null, // ex. 36
  /** Finalité, en une phrase, au présent. */
  finalite: 'répondre à votre demande et, le cas échéant, préparer une intervention',
  /** Qui accède aux données, en clair. */
  destinataires: 'les seules personnes chargées du traitement des demandes chez Expert Parquet',
  /**
   * Sous-traitants réellement utilisés (hébergeur, service d'envoi de
   * courriels). Liste vide tant qu'il n'y en a pas — n'inventez rien.
   */
  sousTraitants: [],
};

/** Correspondance `data-form` → clé de point d'envoi dans FORMS. */
const ENDPOINT_BY_FORM = {
  contact: 'contactEndpoint',
  devis: 'quoteEndpoint',
};

/**
 * Backend LOCAL, par nom d'hôte — et uniquement à l'exécution dans un
 * navigateur.
 *
 * Trois états coexistent, et un seul fichier les porte :
 *
 *   - expert-parquet.test (ou le serveur de développement)  → LIVE LOCAL :
 *     le formulaire parle au WordPress local, on teste la chaîne entière ;
 *   - GitHub Pages / préproduction                          → DEMO ;
 *   - production                                            → inactive tant
 *     que les valeurs juridiques (CONTACT, RGPD) et une URL HTTPS ne sont pas
 *     renseignées dans FORMS ci-dessus.
 *
 * Cette table n'est lue QUE si `window` existe et que l'hôte courant y
 * figure. Le générateur (Node) ne la voit jamais : le HTML publié reste en
 * démonstration, avec ses mentions et sa page de confidentialité. Les
 * garde-fous de `tools/check.mjs` portent sur FORMS et ne sont donc ni
 * contournés ni affaiblis — aucun de ces hôtes n'est atteignable depuis
 * l'extérieur.
 *
 * Localement, les mentions « formulaire de démonstration » générées dans le
 * HTML sont masquées à l'exécution par `forms.js` ; la page de confidentialité
 * n'est pas réécrite, c'est un environnement de développement.
 */
const LOCAL_API = {
  'expert-parquet.test': 'http://api.expert-parquet.test/wp-json/expert-parquet/v1',
  localhost: 'http://127.0.0.1:8080/wp-json/expert-parquet/v1',
  '127.0.0.1': 'http://127.0.0.1:8080/wp-json/expert-parquet/v1',
};

const LOCAL_ROUTES = { contact: '/contact', devis: '/quote' };

function localEndpointFor(formName) {
  if (typeof window === 'undefined' || !window.location) return null;
  const base = LOCAL_API[window.location.hostname];
  const route = LOCAL_ROUTES[formName];
  return base && route ? base + route : null;
}

/**
 * Point d'envoi effectif d'un formulaire : celui qui lui est propre, sinon le
 * repli commun, sinon le backend local si l'hôte est un hôte de
 * développement, sinon `null`. Un seul endroit décide, pour que la logique ne
 * soit pas dupliquée dans les composants.
 */
export function endpointFor(formName) {
  const key = ENDPOINT_BY_FORM[formName];
  return (key && FORMS[key]) || FORMS.endpoint || localEndpointFor(formName) || null;
}

/** Mode d'un formulaire : 'live' s'il a un point d'envoi, 'demo' sinon. */
export function formMode(formName) {
  return endpointFor(formName) ? 'live' : 'demo';
}
