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
     et RÉAPPLIQUÉES côté serveur, qui ne fait jamais confiance au client.

     Les trois formats listés sont ceux que la chaîne sait traiter DE BOUT EN
     BOUT : le navigateur les prévisualise, `EP_Photos::TYPES` les accepte, et
     GD sait les décoder puis les réencoder — ce réencodage étant ce qui retire
     les données EXIF, dont les coordonnées GPS du domicile.

     HEIC a été retiré. Il était annoncé ici alors que l'attribut `accept` du
     formulaire, le serveur et GD le refusaient tous les trois : un iPhone
     pouvait donc déposer une photographie que l'aperçu affichait avant que le
     serveur ne l'écarte en silence. Annoncer un format qu'on ne sait pas
     traiter est pire que de ne pas l'annoncer. Vérifié le 28/09/2026 :
     `imagecreatefromheic()` n'existe pas et `gd_info()` ne mentionne pas HEIC.

     Cette liste est un CONTRAT : la modifier suppose de modifier en même temps
     l'attribut `accept` (tools/content/form-pages.mjs), `EP_Photos::TYPES` et
     le décodeur GD correspondant. */
  maxFiles: 6,
  maxFileSizeMo: 8,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
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

/* ==========================================================================
   ORIENTATION COMMERCIALE
   ========================================================================== */

/**
 * Partenaires vers qui orienter un visiteur dont le projet dépasse la
 * réparation.
 *
 * --------------------------------------------------------------------------
 * CE QUE CE BLOC EST, ET CE QU'IL N'EST PAS
 *
 * Expert Parquet aide d'abord. L'orientation n'apparaît qu'au moment où
 * l'achat devient une suite plausible, elle est toujours formulée au
 * conditionnel, et elle demande un clic. Aucune redirection automatique :
 * un visiteur venu comprendre un grincement ne doit jamais se retrouver sur
 * un catalogue sans l'avoir demandé.
 *
 * --------------------------------------------------------------------------
 * LES CLÉS SONT CELLES DE `customer_type`
 *
 * `particulier` et `professionnel` sont exactement les valeurs de `PROFILS`
 * (js/config/options.js), du champ `profil` du formulaire de devis, de
 * l'énumération `profils` du backend et de la colonne `customer_type`. Une
 * troisième nomenclature — `individual`, `b2b`, `visitor_type` — obligerait à
 * traduire d'un bout à l'autre de la chaîne, et divergerait au premier oubli.
 *
 * --------------------------------------------------------------------------
 * UNE URL MANQUANTE EST `null`, JAMAIS DEVINÉE
 *
 * `url: null` signifie « destination pas encore connue ». L'interface l'annonce
 * alors clairement au lieu de fabriquer un lien : un lien inventé qui tombe en
 * 404 coûte plus cher que l'absence de lien.
 *
 * --------------------------------------------------------------------------
 * `audience` : À QUI CHAQUE ENSEIGNE OUVRE RÉELLEMENT SA PORTE
 *
 * Ce champ n'est pas décoratif, et il n'est pas déduit d'une intention
 * commerciale : il rapporte ce que chaque site DÉCLARE de lui-même, vérifié le
 * 29/09/2026. Il sert de garde-fou — `partnerUrl()` refuse de produire un lien
 * vers une enseigne qui n'accepte pas le profil du visiteur.
 *
 * Sans ce garde-fou, un particulier pourrait être envoyé vers un grossiste qui
 * exige un KBIS à l'inscription : un cul-de-sac, et une promesse trahie.
 */
export const PARTNERS = {
  /* L'ordre est celui de `PROFILS` et du formulaire : particulier d'abord,
     parce que c'est le public majoritaire du site. */
  overparquet: {
    nom: 'Over Parquet',
    /**
     * Forme canonique vérifiée : `www.over-parquet.com` redirige (301) vers
     * `over-parquet.com`.
     */
    url: 'https://over-parquet.com/',
    /**
     * Le site s'annonce « 100 % PRO — Site réservé aux professionnels » et
     * demande un KBIS à la création de compte. Il n'ouvre donc PAS aux
     * particuliers, quelle que soit la règle commerciale retenue.
     */
    audience: ['professionnel'],
    resume: 'Distributeur de parquets réservé aux professionnels, sur justificatif d’entreprise.',
  },
  premibel: {
    nom: 'Premibel',
    /**
     * Entrée générale : le site est ouvert aux particuliers comme aux
     * professionnels, et c'est là qu'on choisit un parquet — showroom,
     * plus de 700 références, conseil.
     *
     * `www` est la forme canonique : `premibel.fr` redirige (301) vers elle.
     * Les liens ÉDITORIAUX du site emploient encore la forme sans `www` — ils
     * appartiennent à la V1 validée et ne sont pas réécrits ici.
     */
    url: 'https://www.premibel.fr/',
    /**
     * Un professionnel a une porte à lui : compte pro, tarifs dédiés,
     * commande simplifiée. L'envoyer sur l'entrée grand public lui ferait
     * refaire le chemin.
     */
    urlParProfil: {
      professionnel: 'https://www.premibel.fr/guide-inscription-pro/',
    },
    /** Le site vend aux particuliers ET tient un espace professionnel. */
    audience: ['particulier', 'professionnel'],
    resume: 'Distributeur de parquets ouvert aux particuliers comme aux professionnels.',
  },
};


/**
 * Paramètres de campagne ajoutés aux liens d'orientation — et à eux seuls.
 *
 * Ils sont construits ici, une fois, plutôt que recopiés dans les gabarits :
 * une campagne mal orthographiée dans un seul fichier produirait des
 * statistiques fausses sans que rien ne le signale.
 *
 * Les liens ÉDITORIAUX déjà présents dans les articles n'en reçoivent pas :
 * ce sont des références de contenu, pas des apports d'affaires, et les
 * marquer reviendrait à réécrire la V1 validée.
 */
export const PARTNER_UTM = {
  source: 'expert-parquet',
  medium: 'referral',
};

/** Une enseigne par sa clé (`premibel`, `overparquet`), ou `null`. */
export function partnerFor(cle) {
  return PARTNERS[cle] || null;
}

/** Vrai si cette enseigne a une destination connue. */
export function partnerConfigured(cle) {
  const p = partnerFor(cle);
  return Boolean(p && p.url);
}

/**
 * URL d'orientation, marquée pour l'analyse, ou `null` si la destination n'est
 * pas connue. L'appelant doit traiter ce `null` — c'est ce qui garantit
 * qu'aucun lien mort n'est rendu.
 *
 * Le choix de l'enseigne, lui, appartient au moteur d'orientation
 * (js/config/orientation-rules.js) : cette fonction ne fait que fabriquer
 * l'adresse d'une enseigne déjà retenue.
 *
 * @param {string} cle       'premibel' | 'overparquet'
 * @param {string} campagne  d'où part le visiteur : 'pre-diagnostic', 'accueil',
 *                           'probleme-degat-des-eaux'…
 */
export function partnerUrl(cle, campagne, customerType) {
  const p = partnerFor(cle);
  if (!p || !p.url) return null;
  /* Une enseigne peut avoir une porte par profil : on prend la plus directe
     pour ce visiteur, l'entrée générale sinon. */
  const base = (p.urlParProfil && p.urlParProfil[customerType]) || p.url;
  const url = new URL(base);
  url.searchParams.set('utm_source', PARTNER_UTM.source);
  url.searchParams.set('utm_medium', PARTNER_UTM.medium);
  if (campagne) url.searchParams.set('utm_campaign', campagne);
  return url.toString();
}

/**
 * Textes de l'orientation, en un seul endroit : le pré-diagnostic les rend à
 * l'exécution, le générateur les rend dans les pages statiques. Deux copies
 * finiraient par ne plus dire la même chose.
 *
 * Le conditionnel est volontaire et ne doit pas être « simplifié » : ce site
 * ne prononce pas de remplacement, il envisage une hypothèse.
 */
export const ORIENTATION = {
  titre: 'Si le remplacement se confirme',
  intro:
    'Une partie des désordres finit par poser la question d’un nouveau parquet. Ce n’est pas une conclusion : c’est une hypothèse à vérifier lors de l’expertise. Si elle se confirme, voici vers qui nous orientons.',
  question: 'Vous êtes :',
  /** Libellé du bouton de choix, par profil. */
  choix: {
    particulier: 'Particulier',
    professionnel: 'Professionnel',
  },
  /** Intitulé de la ligne, par profil. */
  pour: {
    particulier: 'Pour les particuliers',
    professionnel: 'Pour les professionnels',
  },
  /**
   * Libellé du lien sortant. `%s` reçoit le nom de l'enseigne : le visiteur
   * doit savoir où il va AVANT de cliquer, et voir qu'il quitte Expert Parquet.
   */
  action: 'Continuer chez %s',
  /**
   * La phrase de transparence. Elle dit ce qui est vérifiable — nous orientons
   * vers des distributeurs partenaires — sans rien affirmer sur la propriété
   * ni les liens capitalistiques entre les sociétés, que nous ne connaissons
   * pas et qu'il ne nous appartient pas d'écrire.
   */
  mention:
    'Expert Parquet oriente vers des distributeurs partenaires. Le diagnostic et l’expertise restent indépendants de la vente.',
  /**
   * Affiché à la place du lien quand le profil ne peut pas être orienté.
   * La phrase ne renomme pas l'audience : l'intitulé `pour` le fait déjà.
   */
  indisponible:
    'aucune destination n’est ouverte pour l’instant. Vous pouvez demander une expertise : elle précisera ce qui est réellement nécessaire.',
  retour: 'Changer de profil',
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
 *   - expert-parquet-dev.local (ou le serveur de développement)  → LIVE LOCAL :
 *     le formulaire parle au WordPress local, servi par le MÊME hôte, et on
 *     teste la chaîne entière ;
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
  /* Chemin RELATIF : en local, le site statique et WordPress sont servis par le
     même hôte — WordPress est routé par des alias Apache (/wp-admin, /wp-json...).
     Les appels sont donc de même origine : pas de requête préalable CORS, pas
     d'adresse à réécrire si le nom d'hôte change, et rien à corriger si l'on
     ouvre le site par une autre interface réseau.

     La production reste libre d'avoir une API sur un autre domaine : elle passe
     par `FORMS.contactEndpoint` / `quoteEndpoint` ci-dessus, qui l'emportent sur
     cette table. Les deux environnements ne se mélangent pas. */
  'expert-parquet-dev.local': '/wp-json/expert-parquet/v1',
  /* Serveur de développement statique servi à part : l'API reste sur son hôte. */
  localhost: 'http://expert-parquet-dev.local/wp-json/expert-parquet/v1',
  '127.0.0.1': 'http://expert-parquet-dev.local/wp-json/expert-parquet/v1',
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
