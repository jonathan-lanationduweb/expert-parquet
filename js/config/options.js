/**
 * Référentiel unique des choix proposés dans les formulaires et le
 * pré-diagnostic. Toute nouvelle valeur se déclare ICI et nulle part ailleurs.
 *
 * Chaque entrée : { value, label } — `value` est la clé technique envoyée au
 * backend, `label` le libellé affiché.
 */

export const PROBLEMES = [
  { value: 'grincement', label: 'Grincement', page: 'parquet-qui-grince' },
  { value: 'gonflement', label: 'Gonflement ou soulèvement', page: 'parquet-gondole' },
  { value: 'lames-mobiles', label: 'Lames qui bougent', page: 'lames-qui-bougent' },
  { value: 'humidite', label: 'Humidité', page: 'humidite' },
  { value: 'taches', label: 'Taches', page: 'parquet-abime' },
  { value: 'rayures', label: 'Rayures', page: 'parquet-abime' },
  { value: 'deformation', label: 'Déformation générale', page: 'parquet-gondole' },
  { value: 'degat-des-eaux', label: 'Dégât des eaux', page: 'degat-des-eaux' },
  { value: 'defaut-de-pose', label: 'Problème de pose', page: 'defaut-de-pose' },
  { value: 'vieillissement', label: 'Parquet ancien ou usé', page: 'parquet-abime' },
  { value: 'autre', label: 'Autre problème', page: null },
];

export const TYPES_PARQUET = [
  { value: 'massif', label: 'Parquet massif' },
  { value: 'contrecolle', label: 'Parquet contrecollé' },
  { value: 'stratifie', label: 'Stratifié' },
  { value: 'autre', label: 'Autre revêtement bois' },
  { value: 'inconnu', label: 'Je ne sais pas' },
];

export const SUPPORTS = [
  { value: 'dalle-beton', label: 'Dalle béton' },
  { value: 'chape', label: 'Chape (ciment ou anhydrite)' },
  { value: 'plancher-bois', label: 'Plancher bois / solives' },
  { value: 'ancien-revetement', label: 'Ancien revêtement conservé' },
  { value: 'plancher-chauffant', label: 'Plancher chauffant' },
  { value: 'inconnu', label: 'Je ne sais pas' },
];

export const ANCIENNETES = [
  { value: 'moins-6-mois', label: 'Moins de 6 mois' },
  { value: '6-mois-2-ans', label: 'Entre 6 mois et 2 ans' },
  { value: '2-10-ans', label: 'Entre 2 et 10 ans' },
  { value: 'plus-10-ans', label: 'Plus de 10 ans' },
  { value: 'inconnu', label: 'Je ne sais pas' },
];

export const DEBUTS = [
  { value: 'jours', label: 'Quelques jours' },
  { value: 'semaines', label: 'Quelques semaines' },
  { value: 'mois', label: 'Plusieurs mois' },
  { value: 'annees', label: 'Plus d’un an' },
  { value: 'depuis-pose', label: 'Depuis la pose' },
];

export const PIECES = [
  { value: 'sejour', label: 'Séjour / salon' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'cuisine', label: 'Cuisine' },
  { value: 'salle-de-bain', label: 'Salle de bain' },
  { value: 'couloir', label: 'Couloir / entrée' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'plusieurs', label: 'Plusieurs pièces' },
  { value: 'autre', label: 'Autre' },
];

export const PROFILS = [
  { value: 'particulier', label: 'Particulier' },
  { value: 'professionnel', label: 'Professionnel' },
];

export const LOGEMENTS = [
  { value: 'maison', label: 'Maison' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'local-pro', label: 'Local professionnel' },
  { value: 'autre', label: 'Autre' },
];

export const SURFACES = [
  { value: 'moins-10', label: 'Moins de 10 m²' },
  { value: '10-25', label: '10 à 25 m²' },
  { value: '25-50', label: '25 à 50 m²' },
  { value: '50-100', label: '50 à 100 m²' },
  { value: 'plus-100', label: 'Plus de 100 m²' },
  { value: 'inconnu', label: 'Je ne sais pas' },
];

export const DELAIS = [
  { value: 'urgent', label: 'Dès que possible' },
  { value: 'mois', label: 'Dans le mois' },
  { value: 'trimestre', label: 'Dans les 3 mois' },
  { value: 'reflexion', label: 'Je me renseigne' },
];

export const OBJETS_CONTACT = [
  { value: 'question-technique', label: 'Question technique' },
  { value: 'suivi-dossier', label: 'Suivi d’un dossier' },
  { value: 'partenariat', label: 'Partenariat ou presse' },
  { value: 'autre', label: 'Autre' },
];

/** Utilitaire : retrouver le libellé d’une valeur dans une liste. */
export function labelOf(list, value) {
  const found = list.find((item) => item.value === value);
  return found ? found.label : '';
}
