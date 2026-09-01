/**
 * Base de connaissance du pré-diagnostic.
 *
 * IMPORTANT — cadre éditorial :
 * ce module ne produit JAMAIS un diagnostic. Il formule des pistes générales,
 * au conditionnel, et renvoie systématiquement vers une expertise sur place.
 * Aucune formulation ne doit affirmer une cause certaine.
 */

/** Orientation par symptôme principal. */
export const ORIENTATIONS = {
  grincement: {
    titre: 'Un grincement traduit presque toujours un frottement',
    resume:
      'Le bruit vient rarement du bois lui-même : il naît d’un frottement entre deux éléments qui ne sont plus solidaires — lame contre lame, lame contre support, ou support contre structure.',
    pistes: [
      'Un jeu apparu entre les lames et leur support (colle vieillie, clou ou vis desserrés).',
      'Une variation dimensionnelle du bois liée aux écarts d’hygrométrie entre saisons.',
      'Une sous-couche tassée ou irrégulière sous un parquet flottant.',
      'Un support (solives, chape) qui travaille indépendamment du revêtement.',
    ],
    verifications: [
      'Localiser précisément la zone bruyante et noter si elle se déplace.',
      'Observer si le bruit varie selon la saison ou l’humidité de la pièce.',
      'Vérifier l’état des joints périphériques le long des murs.',
    ],
  },
  gonflement: {
    titre: 'Un gonflement signale un apport d’eau ou un manque de jeu',
    resume:
      'Le bois absorbe l’humidité et augmente de volume. Si le parquet ne dispose pas d’espace pour se dilater, il se soulève, tuile ou forme des vagues.',
    pistes: [
      'Un joint de dilatation périphérique absent, insuffisant ou obstrué.',
      'Une remontée d’humidité par le support (dalle non protégée, chape encore humide).',
      'Un incident ponctuel : fuite, débordement, nettoyage à grande eau.',
      'Une hygrométrie ambiante durablement élevée.',
    ],
    verifications: [
      'Contrôler la présence d’un jeu libre entre parquet et murs, sous les plinthes.',
      'Rechercher une source d’eau à proximité immédiate de la zone déformée.',
      'Mesurer l’humidité relative de la pièce sur plusieurs jours.',
    ],
  },
  'lames-mobiles': {
    titre: 'Des lames mobiles indiquent une perte de solidarité',
    resume:
      'Lorsque des lames se désolidarisent, c’est souvent le lien entre revêtement et support, ou l’assemblage entre lames, qui est en cause.',
    pistes: [
      'Un décollement partiel dans le cas d’une pose collée.',
      'Un système demboîtement endommagé sur une pose flottante.',
      'Un support insuffisamment plan au moment de la pose.',
      'Un vieillissement de la colle ou de la fixation mécanique.',
    ],
    verifications: [
      'Repérer si les lames mobiles forment une zone continue ou sont dispersées.',
      'Écouter le son au passage : un son creux évoque un décollement.',
      'Vérifier la planéité approximative du sol avec une règle longue.',
    ],
  },
  humidite: {
    titre: 'L’humidité peut venir du dessous, de l’air ou d’un incident',
    resume:
      'Identifier l’origine est déterminant : les réponses techniques diffèrent totalement selon qu’il s’agit d’une remontée capillaire, d’une condensation ou d’une fuite.',
    pistes: [
      'Une remontée d’humidité depuis le support ou le vide sanitaire.',
      'Une condensation liée à une ventilation insuffisante.',
      'Une infiltration ponctuelle (canalisation, menuiserie, façade).',
      'Un support qui n’a pas suffisamment séché avant la pose.',
    ],
    verifications: [
      'Noter si les traces sont localisées ou réparties sur la surface.',
      'Observer si le phénomène est saisonnier ou permanent.',
      'Vérifier le bon fonctionnement de la ventilation de la pièce.',
    ],
  },
  taches: {
    titre: 'Une tache se lit à sa profondeur autant qu’à sa couleur',
    resume:
      'Une salissure de surface, une auréole dans la finition et une pénétration dans le bois n’appellent pas les mêmes réponses.',
    pistes: [
      'Une finition (vitrification, huile) usée localement qui ne protège plus.',
      'Un liquide resté en contact prolongé avec le bois.',
      'Une réaction chimique du bois (tanin, métal, produit ménager inadapté).',
      'Une remontée d’humidité laissant une auréole persistante.',
    ],
    verifications: [
      'Déterminer si la tache est en surface ou dans l’épaisseur du bois.',
      'Identifier le type de finition existante avant tout essai de nettoyage.',
      'Tester tout produit sur une zone discrète.',
    ],
  },
  rayures: {
    titre: 'Les rayures posent surtout la question de la finition',
    resume:
      'Selon quelles s’arrêtent à la couche de finition ou entament le bois, le traitement va du simple raccord au ponçage complet.',
    pistes: [
      'Une finition usée par le passage ou l’absence de protection sous les meubles.',
      'Des gravillons transportés sous les semelles depuis l’extérieur.',
      'Un entretien réalisé avec un produit ou un accessoire trop abrasif.',
      'Une essence de bois tendre plus sensible aux marques.',
    ],
    verifications: [
      'Passer l’ongle : s’il accroche, la rayure dépasse la finition.',
      'Regarder la répartition : couloirs de passage ou zones ponctuelles.',
      'Vérifier l’épaisseur restante de la couche d’usure sur un contrecollé.',
    ],
  },
  deformation: {
    titre: 'Une déformation générale interroge le support',
    resume:
      'Quand la déformation dépasse quelques lames, la cause se situe généralement sous le revêtement plutôt que dans le revêtement lui-même.',
    pistes: [
      'Un défaut de planéité du support préexistant à la pose.',
      'Un mouvement de structure (plancher bois, affaissement ponctuel).',
      'Une humidité diffuse répartie sur toute la surface.',
      'Une pose contrainte, sans jeu suffisant en périphérie.',
    ],
    verifications: [
      'Mesurer l’amplitude de la déformation avec une règle de 2 mètres.',
      'Vérifier si la déformation évolue dans le temps.',
      'Rechercher des désordres associés (portes qui frottent, fissures).',
    ],
  },
  'degat-des-eaux': {
    titre: 'Après un sinistre, la chronologie compte autant que l’état visible',
    resume:
      'Un parquet touché par l’eau peut sembler stabilisé en surface alors que le support reste chargé en humidité. Documenter le sinistre est essentiel.',
    pistes: [
      'De l’eau piégée entre le revêtement et son support.',
      'Un support (chape, plancher) encore humide plusieurs semaines après.',
      'Un gonflement irréversible des lames en périphérie de la zone.',
      'Un décollement progressif sur pose collée.',
    ],
    verifications: [
      'Dater précisément le sinistre et l’intervention de mise hors d’eau.',
      'Photographier la zone à intervalles réguliers.',
      'Conserver tous les échanges avec l’assurance et les intervenants.',
    ],
  },
  'defaut-de-pose': {
    titre: 'Un défaut de pose se reconnaît souvent à sa régularité',
    resume:
      'Contrairement à un désordre accidentel, un défaut de mise en œuvre produit des symptômes cohérents sur l’ensemble de la surface.',
    pistes: [
      'Un support non préparé : planéité, siccité ou propreté insuffisantes.',
      'Une absence de jeu périphérique ou de joints de fractionnement.',
      'Un délai d’acclimatation du bois non respecté avant pose.',
      'Un sens de pose ou un calepinage inadapté à la pièce.',
    ],
    verifications: [
      'Rassembler devis, factures et fiches techniques des produits posés.',
      'Vérifier la présence et la largeur des jeux en périphérie.',
      'Noter la date de pose et les conditions du chantier.',
    ],
  },
  vieillissement: {
    titre: 'Un parquet ancien n’est pas nécessairement un parquet à remplacer',
    resume:
      'L’enjeu est de savoir ce qui reste exploitable : épaisseur utile, tenue du support, état des assemblages.',
    pistes: [
      'Une couche d’usure encore suffisante pour envisager une rénovation.',
      'Des lames localement dégradées, remplaçables ponctuellement.',
      'Un support ancien qui a bougé et demande une reprise.',
      'Une finition en fin de vie plutôt qu’un bois abîmé.',
    ],
    verifications: [
      'Mesurer l’épaisseur restante au niveau d’une bouche d’aération ou d’un seuil.',
      'Repérer les lames réellement dégradées par rapport à l’ensemble.',
      'Distinguer patine et dégradation.',
    ],
  },
  autre: {
    titre: 'Une observation méthodique reste le meilleur point de départ',
    resume:
      'Sans symptôme dominant identifié, l’analyse repose sur la description précise de la situation et sur des observations sur place.',
    pistes: [
      'Un ensemble de facteurs combinés plutôt qu’une cause unique.',
      'Un phénomène évolutif qu’il faut observer dans la durée.',
      'Un désordre dont l’origine se situe hors du revêtement.',
    ],
    verifications: [
      'Décrire le phénomène le plus précisément possible, avec des photos.',
      'Noter la date d’apparition et les évolutions constatées.',
      'Relever tout événement concomitant (travaux, sinistre, changement de chauffage).',
    ],
  },
};

/** Compléments d’orientation liés au type de parquet déclaré. */
export const NOTES_TYPE = {
  massif:
    'Sur un parquet massif, l’épaisseur disponible autorise généralement plusieurs rénovations : la question porte souvent sur le support plutôt que sur le bois.',
  contrecolle:
    'Sur un contrecollé, tout dépend de l’épaisseur de la couche d’usure restante : elle conditionne la possibilité d’un ponçage.',
  stratifie:
    'Un stratifié n’est pas du bois massif : il ne se ponce pas. Les lames endommagées se remplacent, ou la surface se change.',
  autre: null,
  inconnu:
    'Identifier le type de revêtement est une étape préalable : cette information conditionne presque toutes les solutions envisageables.',
};

/** Compléments d’orientation liés au support déclaré. */
export const NOTES_SUPPORT = {
  'dalle-beton':
    'Sur dalle béton, la question de la barrière contre les remontées d’humidité se pose systématiquement.',
  chape:
    'Une chape doit avoir atteint un taux d’humidité résiduelle suffisamment bas avant toute pose : c’est un point de contrôle classique.',
  'plancher-bois':
    'Un plancher bois travaille avec la structure du bâtiment : les mouvements saisonniers sont normaux, leur amplitude ne lest pas toujours.',
  'ancien-revetement':
    'Poser sur un ancien revêtement conservé impose des vérifications précises : adhérence, planéité, nature du support sous-jacent.',
  'plancher-chauffant':
    'Un plancher chauffant impose des contraintes strictes : essence, épaisseur, type de pose et protocole de mise en chauffe.',
  inconnu: null,
};

/** Compléments liés à l’ancienneté du phénomène. */
export const NOTES_DEBUT = {
  jours:
    'Un phénomène très récent oriente souvent vers un événement identifiable : la recherche d’une cause ponctuelle est prioritaire.',
  semaines: null,
  mois: null,
  annees:
    'Un désordre installé depuis longtemps s’est souvent stabilisé : l’enjeu devient la faisabilité d’une réparation plutôt que l’urgence.',
  'depuis-pose':
    'Un symptôme présent dès la pose oriente vers les conditions de mise en œuvre. Rassembler les documents du chantier est utile.',
};

/** Avertissement obligatoire affiché avec tout résultat. */
export const DISCLAIMER =
  'Ce pré-diagnostic constitue une première orientation et ne remplace pas une expertise sur place. Les pistes évoquées sont générales : seule une observation directe du parquet et de son support permet d’identifier une cause.';
