/**
 * Pages « problème ». Toutes suivent exactement la même structure :
 * symptômes → causes possibles → erreurs fréquentes → premières vérifications
 * → quand demander une expertise → contenus associés.
 *
 * Pour créer une nouvelle page, il suffit d’ajouter une entrée à PROBLEM_PAGES
 * puis de relancer `node tools/build.mjs`.
 */

import { rel, breadcrumb } from '../layout.mjs';
import { ICONS, ctaBand, faqAccordion, faqJsonLd, pageHero } from '../partials.mjs';
import { relatedSection } from './graph.mjs';

const D = 2;

export const PROBLEM_PAGES = [
  {
    slug: 'parquet-qui-grince',
    tags: ['grincement', 'support', 'structure', 'pose'],
    title: 'Parquet qui grince',
    h1: 'Parquet qui grince&nbsp;: d’où vient vraiment le bruit&nbsp;?',
    lead: 'Le grincement est le désordre le plus fréquent et le plus mal compris. Ce n’est pas le bois qui « craque »&nbsp;: c’est un frottement entre deux éléments qui ne sont plus solidaires.',
    image: 'grincement.jpg',
    description:
      'Parquet qui grince : origines du frottement, causes possibles, erreurs fréquentes et vérifications à mener avant d’intervenir.',
    symptomes: [
      'Un bruit sec ou aigu au passage, toujours au même endroit.',
      'Un grincement qui apparaît ou s’accentue en période de chauffe.',
      'Un craquement large, ressenti dans le pied autant qu’entendu.',
      'Un bruit qui se déplace progressivement sur la surface.',
    ],
    causes: [
      { t: 'Fixation desserrée', d: 'Sur une pose clouée ou vissée, la fixation perd sa tenue et la lame joue sur son support à chaque passage.' },
      { t: 'Colle vieillie ou décollement local', d: 'Sur pose collée, un décollement partiel crée un vide où la lame vient taper.' },
      { t: 'Sous-couche tassée', d: 'Sur pose flottante, une sous-couche écrasée sous les zones de passage supprime l’appui régulier.' },
      { t: 'Jeu de dilatation insuffisant', d: 'Un parquet contraint en périphérie se met en compression&nbsp;: les lames frottent les unes contre les autres.' },
      { t: 'Mouvement du support', d: 'Un plancher bois qui travaille transmet ses mouvements au revêtement.' },
      { t: 'Variation hygrométrique', d: 'Un air trop sec en hiver crée des jeux entre lames&nbsp;; ces jeux deviennent des zones de frottement.' },
    ],
    erreurs: [
      'Visser au travers des lames sans savoir ce qui se trouve dessous — canalisation, câble, plancher chauffant.',
      'Injecter un produit lubrifiant&nbsp;: l’effet est temporaire et complique les interventions ultérieures.',
      'Reposer une plinthe serrée contre le parquet, ce qui aggrave la compression.',
      'Conclure trop vite à un défaut de pose alors que le phénomène est saisonnier et réversible.',
    ],
    verifications: [
      'Cartographier les zones bruyantes en marchant lentement, pièce par pièce.',
      'Noter si le bruit varie selon la saison ou l’humidité ambiante.',
      'Vérifier que le parquet n’est pas bloqué en périphérie, sous les plinthes et aux seuils.',
      'Écouter le son au passage&nbsp;: creux (vide sous la lame) ou plein (frottement latéral).',
      'Relever l’hygrométrie de la pièce plusieurs jours de suite.',
    ],
    expertise:
      'Un grincement isolé et stable est rarement inquiétant. Une expertise se justifie quand le bruit s’étend, quand il s’accompagne d’un affaissement ou de lames mobiles, ou quand il apparaît sur un parquet récent&nbsp;: la question devient alors celle de la mise en œuvre.',
    related: ['pourquoi-un-parquet-grince', 'parquet-qui-sonne-creux', 'lames-qui-secartent'],
    faq: [
      {
        q: 'Un parquet neuf peut-il grincer&nbsp;?',
        a: '<p>Oui, et c’est un signal à ne pas banaliser. Sur un parquet récent, le grincement oriente vers les conditions de pose&nbsp;: acclimatation trop courte, support insuffisamment plan, jeu périphérique absent. La régularité du phénomène sur toute la surface est un indice fort.</p>',
      },
      {
        q: 'Le grincement peut-il disparaître seul&nbsp;?',
        a: '<p>Quand il est lié à une variation saisonnière d’hygrométrie, oui&nbsp;: il apparaît en période de chauffe et s’estompe au retour d’un air plus humide. Un grincement permanent, lui, ne disparaît pas spontanément.</p>',
      },
    ],
  },
  {
    slug: 'parquet-gondole',
    tags: ['deformation', 'humidite', 'pose', 'sinistre'],
    title: 'Parquet qui gondole',
    h1: 'Parquet qui gondole ou se soulève',
    lead: 'Quand un parquet bombe, forme des vagues ou tuile, le bois a gonflé sans avoir où s’étendre. Deux familles de causes se combinent presque toujours&nbsp;: un apport d’humidité et un manque de jeu.',
    image: 'soulevement.jpg',
    description:
      'Parquet qui gondole, se soulève ou tuile : causes possibles, erreurs à éviter et vérifications avant toute intervention.',
    symptomes: [
      'Des lames bombées vers le haut, souvent le long d’un mur.',
      'Un tuilage&nbsp;: les bords de lame remontent, le centre reste bas.',
      'Une ondulation générale visible en lumière rasante.',
      'Un décollement audible ou un creux sous le pied.',
    ],
    causes: [
      { t: 'Joint de dilatation absent ou obstrué', d: 'Sans espace libre en périphérie, le bois qui gonfle n’a qu’une direction possible&nbsp;: vers le haut.' },
      { t: 'Remontée d’humidité du support', d: 'Une dalle sans barrière anti-humidité alimente le parquet en permanence.' },
      { t: 'Incident d’eau ponctuel', d: 'Fuite, débordement, nettoyage à grande eau&nbsp;: l’eau pénètre entre les lames et gonfle le bois par le dessous.' },
      { t: 'Hygrométrie ambiante élevée', d: 'Une pièce durablement humide suffit à faire travailler le bois au-delà de ce que la pose a prévu.' },
      { t: 'Chape encore humide à la pose', d: 'Un support qui n’a pas fini de sécher relargue son humidité dans le revêtement.' },
    ],
    erreurs: [
      'Poser des charges lourdes sur la zone bombée pour « l’aplatir »&nbsp;: le bois se fend au lieu de redescendre.',
      'Reposer immédiatement des lames neuves sans avoir séché ni contrôlé le support.',
      'Chauffer fortement la pièce pour accélérer le séchage&nbsp;: le retrait brutal fissure les lames.',
      'Recouper la périphérie sans avoir identifié la source d’humidité.',
    ],
    verifications: [
      'Contrôler le jeu périphérique&nbsp;: le parquet doit pouvoir bouger sous la plinthe.',
      'Chercher une source d’eau proche&nbsp;: canalisation encastrée, mur extérieur, appareil ménager.',
      'Mesurer l’hygrométrie de la pièce sur plusieurs jours.',
      'Observer si le phénomène recule lorsque l’air s’assèche.',
      'Photographier la zone régulièrement pour objectiver l’évolution.',
    ],
    expertise:
      'Un soulèvement qui progresse, qui touche plusieurs pièces, ou qui suit un sinistre justifie une expertise&nbsp;: la question n’est plus de savoir si le bois a gonflé, mais d’où vient l’eau et si le support est encore chargé.',
    related: ['parquet-qui-se-souleve-que-faire', 'lames-qui-secartent', 'humidite-et-parquet-signes-qui-alertent'],
    faq: [
      {
        q: 'Un parquet gonflé peut-il revenir à plat&nbsp;?',
        a: '<p>Partiellement, parfois. Si le gonflement est récent et que la source d’humidité est supprimée, le bois peut redescendre en séchant. Mais le séchage laisse souvent des déformations résiduelles&nbsp;: bords écrasés, tuilage, joints ouverts. Un séchage lent et contrôlé donne toujours de meilleurs résultats qu’un séchage forcé.</p>',
      },
      {
        q: 'Faut-il déposer le parquet en urgence après une fuite&nbsp;?',
        a: '<p>Pas systématiquement. Ce qui est urgent, c’est de couper la source, d’évacuer l’eau libre et de mettre la pièce en ventilation. La décision de dépose se prend ensuite, en fonction de l’état du support&nbsp;: c’est précisément ce qu’une observation technique permet d’évaluer.</p>',
      },
    ],
  },
  {
    slug: 'lames-qui-bougent',
    tags: ['structure', 'pose', 'support', 'grincement'],
    title: 'Lames qui bougent',
    h1: 'Lames qui bougent ou se désolidarisent',
    lead: 'Quand une lame joue sous le pied, le lien entre le revêtement et son support a cédé — ou l’assemblage entre lames ne remplit plus son rôle.',
    image: 'lames-bougent.jpg',
    description:
      'Lames de parquet qui bougent, se désolidarisent ou sonnent creux : causes possibles, vérifications et moment où une expertise devient utile.',
    symptomes: [
      'Une lame qui s’enfonce légèrement au passage.',
      'Un son creux, très différent du reste de la surface.',
      'Des désaffleurements entre lames voisines.',
      'Des joints qui s’ouvrent et se referment selon la saison.',
    ],
    causes: [
      { t: 'Décollement sur pose collée', d: 'La colle a vieilli, a mal pris, ou le support était poussiéreux au moment de l’encollage.' },
      { t: 'Emboîtement endommagé', d: 'Sur pose flottante, une languette ou une rainure cassée ne maintient plus les lames entre elles.' },
      { t: 'Défaut de planéité initial', d: 'Un creux dans le support laisse la lame sans appui&nbsp;: elle travaille à chaque passage.' },
      { t: 'Fixation mécanique fatiguée', d: 'Clous ou vis desserrés sur pose clouée, notamment sur plancher ancien.' },
      { t: 'Retrait du bois', d: 'Un air durablement sec ouvre les joints et réduit la cohésion d’ensemble.' },
    ],
    erreurs: [
      'Clouer par le dessus une lame flottante&nbsp;: le parquet perd sa capacité à se dilater.',
      'Combler un joint ouvert avec un mastic rigide, qui casse au premier mouvement.',
      'Remplacer la lame visible sans traiter le creux du support qui la mise en défaut.',
    ],
    verifications: [
      'Tapoter la surface pour cartographier les zones sonnant creux.',
      'Poser une règle longue pour repérer les creux et bosses du support.',
      'Vérifier si les lames mobiles forment une zone continue ou sont dispersées.',
      'Noter le type de pose&nbsp;: collée, flottante ou clouée.',
    ],
    expertise:
      'Une zone décollée étendue, un support suspecté non plan, ou des lames mobiles apparues rapidement après la pose&nbsp;: dans ces trois cas, comprendre avant de réparer évite de refaire deux fois.',
    related: ['lames-qui-secartent', 'parquet-qui-sonne-creux', 'pourquoi-un-parquet-grince'],
    faq: [
      {
        q: 'Peut-on recoller une lame par le dessus&nbsp;?',
        a: '<p>Des techniques d’injection existent, mais elles supposent de savoir ce qui se trouve sous la lame et pourquoi elle s’est désolidarisée. Appliquées sur un support creux ou humide, elles ne tiennent pas. Le diagnostic précède la réparation, pas l’inverse.</p>',
      },
    ],
  },
  {
    slug: 'humidite',
    tags: ['humidite', 'mesure', 'support', 'sinistre'],
    title: 'Humidité et parquet',
    h1: 'Humidité et parquet&nbsp;: identifier la bonne origine',
    lead: 'Remontée, condensation ou infiltration&nbsp;: trois phénomènes différents, trois réponses techniques différentes. Se tromper d’origine, c’est traiter pendant des mois sans résultat.',
    image: 'parquet-chevrons.jpg',
    description:
      'Humidité et parquet&nbsp;: distinguer remontée capillaire, condensation et infiltration. Signes, vérifications et erreurs fréquentes.',
    symptomes: [
      'Des auréoles ou des zones plus sombres, souvent en périphérie.',
      'Un gonflement progressif sans incident d’eau identifié.',
      'Une odeur persistante, particulièrement après une absence.',
      'Des joints qui ne se referment plus, ou au contraire fermés en permanence.',
      'Une finition qui blanchit ou se décolle localement.',
    ],
    causes: [
      { t: 'Remontée depuis le support', d: 'L’humidité du sol traverse une dalle non protégée. Le phénomène est constant, souvent réparti sur une bande ou une zone basse.' },
      { t: 'Condensation', d: 'L’air chargé en vapeur se condense sur les surfaces froides. Ventilation insuffisante et ponts thermiques sont les facteurs habituels.' },
      { t: 'Infiltration ponctuelle', d: 'Canalisation, menuiserie, façade&nbsp;: la trace est généralement localisée et suit un tracé identifiable.' },
      { t: 'Support insuffisamment sec à la pose', d: 'Une chape posée trop tôt relargue son humidité pendant des mois.' },
      { t: 'Usage de la pièce', d: 'Cuisine, salle de bain, séchage de linge&nbsp;: certaines pièces produisent structurellement plus de vapeur.' },
    ],
    erreurs: [
      'Poser un revêtement étanche par-dessus&nbsp;: l’humidité ne disparaît pas, elle se déplace.',
      'Traiter un mur contre les remontées alors que le problème vient de la ventilation.',
      'Ventiler uniquement la pièce touchée sans regarder le renouvellement d’air du logement.',
      'Poncer et revitrifier une zone encore humide&nbsp;: la finition ne tient pas.',
    ],
    verifications: [
      'Relever l’humidité relative de l’air pendant au moins une semaine, à heure fixe.',
      'Observer si les traces sont localisées, en bande, ou généralisées.',
      'Vérifier le fonctionnement réel des bouches de ventilation.',
      'Noter le caractère saisonnier ou permanent du phénomène.',
      'Photographier la même zone à intervalles réguliers.',
    ],
    expertise:
      'L’humidité est le domaine où la mesure remplace l’intuition. Dès que plusieurs origines restent plausibles, ou que des travaux sont envisagés, une observation avec mesures du support et de l’ambiance évite des dépenses mal orientées.',
    related: ['humidite-et-parquet-signes-qui-alertent', 'parquet-salle-de-bain', 'traces-noires-sur-un-parquet'],
    faq: [
      {
        q: 'Quel taux d’humidité viser dans une pièce avec parquet&nbsp;?',
        a: '<p>Le bois est à l’aise dans une plage d’hygrométrie relative modérée, ni très sèche ni très humide. Plus que la valeur ponctuelle, c’est la stabilité qui compte&nbsp;: des variations rapides et de grande amplitude fatiguent davantage le bois qu’un niveau constant légèrement au-dessus de l’idéal.</p>',
      },
      {
        q: 'Un déshumidificateur suffit-il&nbsp;?',
        a: '<p>Il soulage un excès d’humidité ambiante, ce qui est utile en cas de condensation. Il ne traite ni une remontée par le support, ni une infiltration&nbsp;: dans ces cas, il masque le symptôme sans agir sur la cause.</p>',
      },
    ],
  },
  {
    slug: 'parquet-abime',
    tags: ['esthetique', 'renovation', 'entretien'],
    title: 'Parquet abîmé&nbsp;: taches et rayures',
    h1: 'Parquet abîmé&nbsp;: taches, rayures et usure',
    lead: 'Presque tout se joue sur une question&nbsp;: le défaut s’arrête-t-il à la finition, ou atteint-il le bois&nbsp;? La réponse sépare un raccord de trente minutes d’une rénovation complète.',
    image: 'taches.jpg',
    description:
      'Taches, rayures et usure du parquet : distinguer atteinte de la finition et atteinte du bois, erreurs fréquentes et vérifications utiles.',
    symptomes: [
      'Des rayures fines et brillantes dans les zones de passage.',
      'Des marques profondes qui accrochent l’ongle.',
      'Des auréoles claires ou sombres sur une zone limitée.',
      'Une finition mate par endroits, brillante ailleurs.',
      'Un noircissement localisé autour d’un élément métallique.',
    ],
    causes: [
      { t: 'Finition usée', d: 'La couche de protection s’épuise en premier dans les couloirs de passage et devant les portes.' },
      { t: 'Abrasion mécanique', d: 'Gravillons sous les semelles, pieds de meubles non protégés, roulettes de chaise de bureau.' },
      { t: 'Liquide en contact prolongé', d: 'L’eau, le vin ou un produit ménager laissé sur une finition fatiguée pénètrent dans le bois.' },
      { t: 'Réaction chimique', d: 'Le tanin de certaines essences réagit au contact du métal ou de produits alcalins.' },
      { t: 'Entretien inadapté', d: 'Produits trop décapants, excès d’eau, monobrosse trop agressive.' },
    ],
    erreurs: [
      'Tester un produit détachant en plein milieu de la pièce plutôt que sur une zone discrète.',
      'Poncer localement une vitrification&nbsp;: la reprise reste visible.',
      'Appliquer une huile sur un parquet vitrifié, ou l’inverse.',
      'Laver à grande eau un parquet dont la finition ne protège plus.',
    ],
    verifications: [
      'Passer l’ongle&nbsp;: si elle accroche, la rayure dépasse la finition.',
      'Identifier le type de finition existante (vitrifiée, huilée, cirée) avant tout essai.',
      'Mesurer l’épaisseur utile restante sur un contrecollé, au niveau d’un seuil.',
      'Observer la répartition&nbsp;: usure de passage ou dégradation ponctuelle.',
    ],
    expertise:
      'L’expertise devient utile quand se pose la question du ponçage&nbsp;: y a-t-il assez de matière&nbsp;? Sur un contrecollé, cette mesure décide entre rénovation et remplacement. Voir aussi nos <a href="../conseils/entretien.html">conseils d’entretien</a>.',
    related: ['traces-noires-sur-un-parquet', 'renover-un-parquet-tres-abime', 'finition-parquet-huile-vitrifie'],
    faq: [
      {
        q: 'Combien de fois peut-on poncer un parquet&nbsp;?',
        a: '<p>Cela dépend entièrement de l’épaisseur utile&nbsp;: sur un massif, elle est généralement confortable&nbsp;; sur un contrecollé, elle se limite à la couche noble supérieure&nbsp;; sur un stratifié, elle est nulle, le ponçage est impossible. La mesure prime sur la règle générale.</p>',
      },
      {
        q: 'Une tache noire signifie-t-elle que le bois est perdu&nbsp;?',
        a: '<p>Pas nécessairement. Un noircissement peut être une réaction chimique superficielle, réversible après ponçage léger, ou le signe d’une humidité installée dans l’épaisseur. Distinguer les deux demande d’observer la zone en profondeur, pas seulement en surface.</p>',
      },
    ],
  },
  {
    slug: 'degat-des-eaux',
    tags: ['sinistre', 'humidite', 'renovation', 'mesure'],
    title: 'Dégât des eaux',
    h1: 'Parquet après un dégât des eaux',
    lead: 'L’état visible d’un parquet quelques jours après un sinistre ne dit presque rien de l’état de son support. La chronologie compte autant que le constat.',
    image: 'rayures.jpg',
    description:
      'Parquet après un dégât des eaux : ce qu’il faut faire, ce qu’il faut documenter, et pourquoi l’état visible ne suffit pas à décider.',
    symptomes: [
      'Un gonflement en périphérie de la zone touchée.',
      'Des lames qui se soulèvent plusieurs jours après l’incident.',
      'Une odeur qui persiste malgré le séchage de surface.',
      'Un décollement progressif sur pose collée.',
      'Des traces qui s’étendent au-delà de la zone initialement mouillée.',
    ],
    causes: [
      { t: 'Eau piégée sous le revêtement', d: 'L’eau s’infiltre entre les lames puis stagne entre parquet et support, hors de portée de la ventilation.' },
      { t: 'Support chargé en humidité', d: 'Une chape absorbe et restitue lentement&nbsp;: elle peut rester humide des semaines après le sinistre.' },
      { t: 'Séchage trop rapide', d: 'Un assèchement brutal provoque un retrait violent et fissure les lames.' },
      { t: 'Colle dégradée', d: 'Certaines colles perdent leurs propriétés au contact prolongé de l’eau.' },
    ],
    erreurs: [
      'Reposer un revêtement avant d’avoir vérifié le taux d’humidité résiduelle du support.',
      'Jeter les lames déposées avant tout constat&nbsp;: ce sont des éléments de preuve.',
      'Nettoyer et remettre en état avant d’avoir photographié l’état initial.',
      'Attendre que « ça sèche tout seul » sans ventiler ni mesurer.',
    ],
    verifications: [
      'Dater précisément le sinistre et la mise hors d’eau.',
      'Photographier la zone dès que possible, puis à intervalles réguliers.',
      'Conserver les échanges avec l’assurance, le syndic et les intervenants.',
      'Noter l’étendue exacte de la zone mouillée, même si elle n’est plus visible.',
      'Faire mesurer l’humidité du support avant toute repose.',
    ],
    expertise:
      'Après un sinistre, l’expertise sert d’abord à objectiver&nbsp;: quelle est l’étendue réelle des dommages, le support est-il sec, la repose est-elle possible et à quelles conditions. Ce site ne délivre ni rapport judiciaire ni avis d’assurance&nbsp;: précisez le contexte dès votre demande.',
    related: ['traces-noires-sur-un-parquet', 'parquet-qui-se-souleve-que-faire', 'humidite-et-parquet-signes-qui-alertent'],
    faq: [
      {
        q: 'Combien de temps faut-il attendre avant de reposer&nbsp;?',
        a: '<p>Il n’y a pas de délai standard&nbsp;: seul le taux d’humidité résiduelle du support permet de décider. Selon la nature du support, son épaisseur et les conditions de ventilation, cela peut aller de quelques semaines à plusieurs mois. Reposer trop tôt reproduit le désordre.</p>',
      },
      {
        q: 'Mon assurance demande un constat, pouvez-vous le faire&nbsp;?',
        a: '<p>Ce site propose une analyse technique, pas un rapport d’expertise judiciaire ni un avis d’assurance. Selon votre situation, une analyse technique peut néanmoins constituer un élément utile à votre dossier. Indiquez le contexte dans votre demande&nbsp;: la réponse précisera ce qui est possible.</p>',
      },
    ],
  },
  {
    slug: 'defaut-de-pose',
    tags: ['pose', 'support', 'structure', 'mesure'],
    title: 'Défaut de pose',
    h1: 'Suspicion de défaut de pose',
    lead: 'Un défaut de mise en œuvre se reconnaît souvent à sa régularité&nbsp;: contrairement à un désordre accidentel, il produit des symptômes cohérents sur toute la surface.',
    image: 'pose-support.jpg',
    description:
      'Défaut de pose de parquet : indices, causes possibles, documents à rassembler et vérifications avant d’engager une discussion avec le poseur.',
    symptomes: [
      'Des symptômes apparus dans les premiers mois suivant la pose.',
      'Un désordre uniforme sur l’ensemble de la surface, pas seulement par zones.',
      'Une absence visible de jeu périphérique.',
      'Des désaffleurements réguliers entre lames.',
      'Un calepinage qui ne tient pas compte de la géométrie de la pièce.',
    ],
    causes: [
      { t: 'Support non préparé', d: 'Planéité hors tolérance, poussière, siccité insuffisante&nbsp;: les trois causes les plus fréquentes.' },
      { t: 'Jeux périphériques absents', d: 'Sans espace de dilatation, le parquet se met en compression dès la première variation d’hygrométrie.' },
      { t: 'Acclimatation non respectée', d: 'Le bois doit s’équilibrer avec l’ambiance de la pièce avant d’être posé.' },
      { t: 'Produit inadapté au support', d: 'Certaines associations parquet/support/pose sont techniquement incompatibles, notamment sur plancher chauffant.' },
      { t: 'Absence de joints de fractionnement', d: 'Sur les grandes surfaces ou entre pièces, leur absence concentre les contraintes.' },
    ],
    erreurs: [
      'Engager une discussion sans avoir rassemblé devis, factures et fiches techniques.',
      'Faire intervenir un tiers avant tout constat&nbsp;: les indices disparaissent.',
      'Conclure à un défaut de pose sur un symptôme unique et localisé.',
      'Attendre trop longtemps&nbsp;: certaines démarches sont encadrées par des délais.',
    ],
    verifications: [
      'Rassembler tous les documents du chantier, y compris les échanges écrits.',
      'Relever la date de pose et les conditions du chantier (saison, occupation, chauffage).',
      'Mesurer les jeux périphériques accessibles.',
      'Vérifier la planéité générale à la règle.',
      'Photographier les points singuliers&nbsp;: seuils, angles, raccords.',
    ],
    expertise:
      'C’est le cas de figure où l’expertise apporte le plus&nbsp;: elle confronte les symptômes observés aux règles de mise en œuvre et aux documents du chantier. Ce site fournit une analyse technique&nbsp;; il ne délivre pas de rapport judiciaire.',
    related: ['reception-chantier-parquet', 'pourquoi-le-support-est-essentiel', 'parquet-qui-sonne-creux'],
    faq: [
      {
        q: 'Comment distinguer un défaut de pose d’un mauvais entretien&nbsp;?',
        a: '<p>Trois critères aident&nbsp;: la chronologie (un défaut de pose se manifeste tôt), l’étendue (il touche toute la surface, pas seulement les zones sollicitées) et la cohérence (les symptômes se répètent aux mêmes endroits relatifs, par exemple systématiquement en périphérie).</p>',
      },
    ],
  },
];

function renderProblemPage(problem) {
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Problèmes', href: 'pages/problemes.html' },
    { label: problem.title },
  ]);

  const causes = problem.causes
    .map(
      (cause) => `            <li><strong>${cause.t}.</strong> ${cause.d}</li>`
    )
    .join('\n');

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'Problème de parquet',
    title: problem.h1,
    lead: problem.lead,
    image: problem.image,
    actions: `<a class="btn btn--primary" href="${rel(D, 'pages/devis.html')}">Demander une expertise</a><a class="btn btn--on-dark" href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">Pré-diagnostic</a>`,
  })}

  <section class="section">
    <div class="container">
      <div class="article-layout">
        <div class="prose" id="article-body">
          <h2 id="symptomes">Symptômes observés</h2>
          <ul>
${problem.symptomes.map((item) => `            <li>${item}</li>`).join('\n')}
          </ul>

          <h2 id="causes">Causes possibles</h2>
          <p>Ces pistes sont générales&nbsp;: elles ne valent pas diagnostic. Plusieurs peuvent se combiner sur une même surface.</p>
          <ul>
${causes}
          </ul>

          <h2 id="erreurs">Erreurs fréquentes</h2>
          <ul>
${problem.erreurs.map((item) => `            <li>${item}</li>`).join('\n')}
          </ul>

          <h2 id="verifications">Premières vérifications</h2>
          <p>À faire soi-même, sans outillage particulier, avant toute intervention.</p>
          <ul class="rich-list rich-list--check">
${problem.verifications.map((item) => `            <li>${item}</li>`).join('\n')}
          </ul>

          <h2 id="expertise">Quand demander une expertise</h2>
          <p>${problem.expertise}</p>

          <div class="callout u-mt-lg">
            <p class="callout__title">${ICONS.alert} Portée de cette page</p>
            <p>Ce contenu est informatif. Il décrit des mécanismes généraux et ne peut pas établir la cause d’un désordre particulier&nbsp;: seule une observation sur place, avec mesures, le permet.</p>
          </div>

          ${problem.faq.length ? `<h2 id="faq">Questions fréquentes</h2>
          <div class="u-mt-md">
${faqAccordion(problem.faq, `${problem.slug}-faq`)}
          </div>` : ''}
        </div>

        <aside class="article-aside">
          <nav class="toc" data-toc data-toc-scope="#article-body" aria-labelledby="toc-${problem.slug}">
            <details class="toc__box">
              <summary class="toc__title" id="toc-${problem.slug}">Sur cette page</summary>
              <ul class="toc__list" data-toc-list></ul>
            </details>
          </nav>
          <div class="aside-card aside-card--accent">
            <p class="aside-card__title">Votre cas est différent&nbsp;?</p>
            <p>Le pré-diagnostic pose le contexte en cinq questions et propose une orientation adaptée à vos réponses.</p>
            <a class="btn btn--primary btn--sm btn--block" href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">Décrire mon problème</a>
          </div>
          <div class="aside-card">
            <p class="aside-card__title">Autres symptômes</p>
            <p><a class="link" href="${rel(D, 'pages/problemes.html')}">Voir tous les problèmes de parquet</a></p>
          </div>
        </aside>
      </div>
    </div>
  </section>

${relatedSection(D, { type: 'probleme', slug: problem.slug }, { kicker: 'Pour aller plus loin' })}

${ctaBand(D)}
`;

  return {
    path: `pages/problemes/${problem.slug}.html`,
    depth: D,
    navCurrent: 'pages/problemes.html',
    title: problem.title,
    description: problem.description,
    css: ['pages/home.css', 'pages/article.css'],
    ogImage: `assets/images/${problem.image}`,
    body,
    jsonLd: [crumb.jsonLd, problem.faq.length ? faqJsonLd(problem.faq) : null],
  };
}

export function problemPages() {
  return PROBLEM_PAGES.map(renderProblemPage);
}
