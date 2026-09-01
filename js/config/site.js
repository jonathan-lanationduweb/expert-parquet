/**
 * Configuration générale du site.
 *
 * TOUTES les informations de contact sont des placeholders : elles doivent
 * être remplacées par les vraies valeurs avant mise en ligne.
 * Voir TODO-INTEGRATIONS.md.
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

export const PLACEHOLDER_LABEL = '[À renseigner]';

/**
 * Endpoint de soumission des formulaires.
 * Tant que `endpoint` vaut null, aucun envoi réseau n’est effectué :
 * les formulaires fonctionnent en mode démonstration locale et le disent.
 */
export const FORMS = {
  endpoint: null, // ex. 'https://api.expert-parquet.com/v1/leads'
  method: 'POST',
  uploadEnabled: false, // passe à true quand le backend accepte les fichiers
  maxFiles: 6,
  maxFileSizeMo: 8,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
};

/** Liens éditoriaux externes utilisés ponctuellement dans les contenus. */
export const EXTERNAL_LINKS = {
  premibel: 'https://premibel.fr',
};
