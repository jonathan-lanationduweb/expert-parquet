/**
 * Corps éditoriaux des articles.
 *
 * Ce fichier fait partie de l'outillage de développement (dossier `tools/`).
 * Il n'est PAS chargé par le site.
 *
 * Séparé de `articles.mjs`, qui ne garde que le gabarit. La raison est simple :
 * le rendu d'un article tient en quatre-vingts lignes et ne bouge presque
 * jamais, alors que la matière éditoriale grossit à chaque publication. Les
 * mêler rendait illisible le peu de logique qu'il y a, et faisait défiler
 * des centaines de lignes de prose avant d'atteindre la première instruction.
 *
 * Chaque entrée porte :
 *   standfirst  le chapô, affiché sous le titre
 *   html        le corps, en HTML éditorial ; les attributs `id` des <h2>/<h3>
 *               alimentent le sommaire construit par js/modules/toc.js
 *   faq         questions réellement posées, ou tableau vide — une FAQ n'est
 *               pas un quota à remplir
 *
 * Les métadonnées (titre, catégorie, date, temps de lecture, image, tags,
 * related) vivent dans `ARTICLES`, côté `tools/partials.mjs` : c'est ce
 * catalogue que lisent la page d'accueil, le hub Conseils et le graphe de
 * contenus associés.
 */

import { rel } from '../layout.mjs';
import { ICONS, PREMIBEL, premibelLink } from '../partials.mjs';

const D = 1;

export const BODIES = {

  'pourquoi-un-parquet-grince': {
    standfirst:
      'Le grincement est le désordre le plus courant, et le plus souvent traité à l’envers&nbsp;: on cherche à faire taire le bruit avant de comprendre ce qui frotte. Voici comment lire ce signal.',
    html: `
          <h2 id="frottement">Un bruit, pas une maladie du bois</h2>
          <p>Contrairement à une idée tenace, un parquet ne grince pas parce qu’il est vieux, ni parce qu’il est de mauvaise qualité. Il grince parce que deux surfaces frottent l’une contre l’autre au moment où une charge les déplace. Le bruit est donc toujours mécanique, et toujours localisable.</p>
          <p>Trois interfaces peuvent être en cause&nbsp;: entre deux lames voisines, entre la lame et son support, ou entre le support et la structure qui le porte. Identifier laquelle change entièrement la nature de l’intervention.</p>

          <div class="callout callout--slate">
            <p class="callout__title">${ICONS.help} Le test le plus utile</p>
            <p>Marchez très lentement sur la zone bruyante, en transférant le poids progressivement. Un bruit qui apparaît uniquement au moment où le pied se pose et se relève évoque un jeu vertical&nbsp;; un bruit continu pendant le déplacement latéral évoque un frottement entre lames.</p>
          </div>

          <h2 id="causes">Ce qui crée le jeu</h2>
          <h3 id="fixation">La fixation qui a lâché</h3>
          <p>Sur une pose clouée ou vissée, la fixation subit des micro-mouvements à chaque passage. Avec le temps, le trou s’agrandit légèrement, la tenue diminue, et la lame se met à jouer. Le phénomène est progressif&nbsp;: il commence par un craquement discret et s’installe sur plusieurs mois.</p>

          <h3 id="souscouche">La sous-couche tassée</h3>
          <p>Sur une pose flottante, la sous-couche joue un rôle d’amortisseur et de régulateur. Dans les zones de passage intense, elle s’écrase. Le parquet perd son appui régulier et travaille verticalement à chaque pas. C’est la cause la plus fréquente des grincements apparus après quelques années sur un flottant.</p>

          <h3 id="compression">La compression périphérique</h3>
          <p>C’est le cas inverse, et il est plus préoccupant. Quand un parquet ne dispose pas d’un jeu suffisant contre les murs, il se met en compression dès qu’il gonfle. Les lames s’appuient les unes contre les autres et frottent latéralement. Le grincement s’accompagne alors souvent d’un léger bombement, à vérifier en lumière rasante.</p>

          <h3 id="hygrometrie">La saison</h3>
          <p>Le bois perd de l’humidité en période de chauffe et se rétracte. Les jeux s’ouvrent, les points de contact changent, des grincements apparaissent — puis disparaissent au printemps. Ce comportement est normal. Ce qui ne l’est pas, c’est une amplitude qui s’aggrave d’année en année.</p>

          <h2 id="diagnostic">Comment situer l’origine</h2>
          <p>Quatre observations suffisent généralement à orienter l’analyse.</p>
          <ol>
            <li><strong>Cartographier.</strong> Marchez lentement dans toute la pièce et notez les zones bruyantes. Un point isolé, une bande le long d’un mur ou une zone diffuse ne racontent pas la même histoire.</li>
            <li><strong>Écouter la tonalité.</strong> Un son sec et bref évoque un contact ponctuel&nbsp;; un crissement plus long évoque un frottement latéral.</li>
            <li><strong>Sonder le vide.</strong> Tapotez la surface&nbsp;: un son creux signale un décollement ou un manque d’appui.</li>
            <li><strong>Vérifier la périphérie.</strong> Le parquet doit pouvoir bouger sous la plinthe. S’il est bloqué, la compression devient l’hypothèse principale.</li>
          </ol>

          <h2 id="erreurs">Les réflexes à éviter</h2>
          <ul>
            <li><strong>Visser à l’aveugle.</strong> Sous un parquet peuvent passer des canalisations, des câbles ou un plancher chauffant. Percer sans savoir est un risque réel.</li>
            <li><strong>Injecter du talc ou un lubrifiant.</strong> L’effet dure quelques semaines et complique toute intervention ultérieure.</li>
            <li><strong>Serrer les plinthes.</strong> Cela supprime le jeu au moment même où il devient nécessaire.</li>
            <li><strong>Conclure au défaut de pose sur un seul indice.</strong> Un grincement saisonnier réversible n’est pas un défaut.</li>
          </ul>

          <h2 id="quand">Quand le grincement devient un signal</h2>
          <p>Un grincement isolé et stable est le plus souvent bénin. Trois situations méritent en revanche d’être prises au sérieux&nbsp;:</p>
          <ul class="rich-list rich-list--check">
            <li>Le bruit s’étend progressivement à de nouvelles zones.</li>
            <li>Il s’accompagne d’un affaissement, d’un bombement ou de lames mobiles.</li>
            <li>Il apparaît sur un parquet posé depuis moins de deux ans.</li>
          </ul>
          <p>Dans ces trois cas, la question n’est plus le bruit mais ce qu’il révèle&nbsp;: un support qui bouge, une humidité qui travaille, ou des conditions de pose à examiner. Voir la page <a href="${rel(D, 'pages/problemes/parquet-qui-grince.html')}">parquet qui grince</a> pour la grille complète, ou décrivez votre cas dans le <a href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">pré-diagnostic</a>.</p>
`,
    faq: [
      {
        q: 'Un tapis peut-il régler le problème&nbsp;?',
        a: '<p>Il atténue la perception du bruit sans rien changer au frottement. C’est une solution de confort, pas une réponse technique. Si le grincement est stable et bénin, elle peut suffire&nbsp;; s’il progresse, elle masque un signal utile.</p>',
      },
      {
        q: 'Le grincement abîme-t-il le parquet&nbsp;?',
        a: '<p>Le bruit en lui-même, non. Mais le mouvement qui le produit, oui&nbsp;: à force de jouer, une lame use son assemblage, fatigue sa fixation et finit par se désolidariser. C’est pour cela qu’un grincement qui progresse mérite attention.</p>',
      },
    ],
  },

  'parquet-qui-se-souleve-que-faire': {
    standfirst:
      'Un parquet qui bombe réagit presque toujours à l’eau ou à un manque d’espace. Les gestes des premières heures conditionnent ce qu’il restera possible de sauver.',
    html: `
          <h2 id="mecanisme">Ce qui se passe réellement</h2>
          <p>Le bois est hygroscopique&nbsp;: il absorbe l’humidité de son environnement et augmente de volume, principalement en largeur. Une pose bien conçue anticipe ce mouvement en ménageant un espace libre en périphérie. Quand cet espace manque, ou quand l’apport d’humidité dépasse ce qui était prévu, le bois n’a plus qu’une direction disponible&nbsp;: vers le haut.</p>
          <p>Le résultat prend trois formes&nbsp;: un bombement en dôme, une ondulation régulière en vagues, ou un tuilage où les bords de chaque lame remontent tandis que le centre reste bas. Ces trois figures ne racontent pas la même chose&nbsp;: le tuilage évoque une humidité venue du dessous, le bombement évoque plutôt une compression d’ensemble.</p>

          <h2 id="urgence">Les premières heures</h2>
          <p>Si le soulèvement fait suite à un incident d’eau identifiable, quatre gestes comptent, dans cet ordre.</p>
          <ol>
            <li><strong>Couper la source.</strong> Tout le reste est inutile tant que l’eau continue d’arriver.</li>
            <li><strong>Évacuer l’eau libre.</strong> En surface, mais aussi dans les joints, sans détremper davantage.</li>
            <li><strong>Ventiler.</strong> Ouvrir, faire circuler l’air, éviter le chauffage intense qui ferait sécher trop vite.</li>
            <li><strong>Documenter.</strong> Photographier avant de nettoyer&nbsp;: l’état initial est une information, parfois une preuve.</li>
          </ol>

          <div class="callout callout--warning">
            <p class="callout__title">${ICONS.alert} Ce qu’il ne faut pas faire</p>
            <p>Poser des charges lourdes pour aplatir la zone, chauffer fortement pour accélérer le séchage, ou déposer immédiatement les lames&nbsp;: ces trois réflexes aggravent la situation. Le bois qui sèche trop vite se fend&nbsp;; les lames déposées sans constat deviennent inexploitables&nbsp;; la charge fait éclater les assemblages.</p>
          </div>

          <h2 id="sans-incident">Quand aucun incident n’est identifié</h2>
          <p>C’est le cas le plus fréquent, et le plus révélateur. Un parquet qui se soulève sans qu’aucune fuite ne soit connue oriente vers deux hypothèses.</p>
          <h3 id="jeu">Le jeu de dilatation</h3>
          <p>Vérifiable simplement&nbsp;: soulevez délicatement une plinthe, ou regardez sous un seuil de porte. Le parquet doit pouvoir bouger latéralement. S’il est plaqué contre le mur, s’il a été calfeutré au mastic, ou si un joint d’origine a été comblé lors d’un chantier ultérieur, la compression s’explique.</p>
          <h3 id="humidite-support">L’humidité du support</h3>
          <p>Une remontée depuis la dalle alimente le parquet en continu. Le phénomène est lent, souvent réparti sur une bande ou une zone basse, et s’aggrave saisonnièrement. Il ne se traite pas au niveau du revêtement&nbsp;: voir notre page consacrée à l<a href="${rel(D, 'pages/problemes/humidite.html')}">humidité et le parquet</a>.</p>

          <h2 id="recuperer">Un parquet gonflé peut-il redescendre&nbsp;?</h2>
          <p>Parfois, partiellement. Si l’apport d’humidité est supprimé rapidement et que le séchage est lent, le bois peut retrouver une partie de son volume initial. Mais le retour n’est jamais complet&nbsp;: les bords comprimés restent écrasés, le tuilage persiste, et des jeux apparaissent là où les fibres ont travaillé.</p>
          <p>La règle pratique&nbsp;: attendre la stabilisation complète avant de décider. Trancher trop tôt conduit à déposer un parquet qui aurait pu être conservé, ou à rénover un parquet qui bougera encore.</p>

          <h2 id="apres">Après la stabilisation</h2>
          <p>Trois questions décident de la suite&nbsp;: la cause a-t-elle été traitée&nbsp;? Le support est-il revenu à un taux d’humidité compatible&nbsp;? L’état résiduel du revêtement permet-il une rénovation&nbsp;? Tant que la première réponse est non, les deux autres n’ont pas d’intérêt.</p>
`,
    faq: [
      {
        q: 'Combien de temps attendre avant de décider&nbsp;?',
        a: '<p>Il n’y a pas de délai standard&nbsp;: cela dépend de la quantité d’eau, de la nature du support et des conditions de ventilation. Le critère n’est pas le temps écoulé mais la mesure&nbsp;: le support doit avoir retrouvé un taux d’humidité compatible avec un revêtement bois.</p>',
      },
      {
        q: 'Faut-il prévenir l’assurance même si les dégâts semblent faibles&nbsp;?',
        a: '<p>L’étendue visible d’un sinistre est presque toujours inférieure à son étendue réelle, parce que le support absorbe. Déclarer tôt et documenter avec des photos datées coûte peu&nbsp;; constater trois mois plus tard que le désordre s’étend est nettement plus problématique.</p>',
      },
    ],
  },

  'humidite-et-parquet-signes-qui-alertent': {
    standfirst:
      'L’humidité annonce presque toujours son arrivée. Encore faut-il lire les bons signaux — et savoir distinguer une remontée d’une condensation, car les réponses n’ont rien à voir.',
    html: `
          <h2 id="trois-origines">Trois origines, trois logiques</h2>
          <p>Le mot « humidité » recouvre des phénomènes physiquement distincts. Les confondre conduit à traiter pendant des mois sans effet.</p>
          <div class="table-scroll">
            <table>
              <thead><tr><th scope="col">Origine</th><th scope="col">Signature typique</th><th scope="col">Où agir</th></tr></thead>
              <tbody>
                <tr><td>Remontée depuis le support</td><td>Constante, en bande ou en zone basse, s’aggrave lentement</td><td>Sur le support et son étanchéité</td></tr>
                <tr><td>Condensation</td><td>Saisonnière, sur les surfaces froides, liée à l’occupation</td><td>Sur la ventilation et le confort thermique</td></tr>
                <tr><td>Infiltration</td><td>Localisée, suit un tracé, apparaît après un événement</td><td>Sur la source&nbsp;: canalisation, menuiserie, façade</td></tr>
              </tbody>
            </table>
          </div>

          <h2 id="signaux-precoces">Les signaux précoces</h2>
          <p>Bien avant le gonflement visible, plusieurs indices apparaissent. Les repérer permet d’agir quand c’est encore simple.</p>
          <ul class="rich-list">
            <li><strong>Les joints ne bougent plus.</strong> Un parquet sain ouvre légèrement ses joints en hiver. S’ils restent fermés toute l’année, le bois est en permanence chargé.</li>
            <li><strong>La finition blanchit.</strong> Un voile laiteux localisé signale de l’eau piégée sous le film de finition.</li>
            <li><strong>L’odeur revient après une absence.</strong> Une odeur de renfermé qui réapparaît après quelques jours de fermeture indique une source permanente.</li>
            <li><strong>Une zone reste plus foncée.</strong> Même sèche au toucher, une zone qui garde une teinte différente conserve de l’humidité en profondeur.</li>
            <li><strong>Le parquet est plus souple à un endroit.</strong> Une souplesse anormale évoque un support ou une sous-couche déjà atteints.</li>
          </ul>

          <div class="callout">
            <p class="callout__title">${ICONS.search} Mesurer plutôt qu’estimer</p>
            <p>Un hygromètre d’ambiance coûte peu et donne une information réellement exploitable, à condition d’être relevé plusieurs jours de suite, à heure comparable. Une mesure unique ne dit rien&nbsp;: c’est la courbe qui parle.</p>
          </div>

          <h2 id="ni-trop-ni-pas-assez">Ni trop humide, ni trop sec</h2>
          <p>L’excès d’humidité fait gonfler le bois, mais l’excès de sécheresse le fait se rétracter&nbsp;: jeux permanents entre lames, fentes dans les lames elles-mêmes, assemblages qui se relâchent. Les logements très chauffés en hiver, sans apport d’humidité, produisent régulièrement ce second type de désordre.</p>
          <p>Ce qui compte n’est donc pas d’atteindre une valeur idéale, mais de limiter l’amplitude des variations. Un environnement stable légèrement au-dessus de l’optimum fatigue moins le bois qu’un environnement qui oscille fortement.</p>

          <h2 id="ventilation">La ventilation, facteur sous-estimé</h2>
          <p>Une part importante des problèmes d’humidité attribués au sol vient en réalité de l’air. Un logement mal ventilé accumule la vapeur produite par ses occupants, la cuisson, les douches et le séchage du linge. Cette vapeur se condense sur les surfaces froides, et le parquet en périphérie de pièce en fait partie.</p>
          <p>Avant d’envisager tout traitement du support, vérifier que les bouches de ventilation fonctionnent réellement — et pas seulement quelles existent — évite parfois l’ensemble du problème.</p>

          <h2 id="quand-alerter">Quand la situation demande un regard technique</h2>
          <ul class="rich-list rich-list--check">
            <li>Le phénomène persiste malgré une ventilation correcte.</li>
            <li>Il progresse d’une année sur l’autre.</li>
            <li>Plusieurs origines restent également plausibles.</li>
            <li>Des travaux importants sont envisagés.</li>
          </ul>
          <p>Dans ces cas, la mesure du support remplace utilement l’hypothèse. Décrivez votre situation dans le <a href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">pré-diagnostic</a> ou consultez la page <a href="${rel(D, 'pages/problemes/humidite.html')}">humidité et parquet</a>.</p>
`,
    faq: [
      {
        q: 'Une VMC suffit-elle à protéger un parquet&nbsp;?',
        a: '<p>Elle traite l’humidité de l’air, ce qui règle une bonne partie des problèmes de condensation. Elle n’a aucun effet sur une remontée depuis le support ou sur une infiltration&nbsp;: dans ces deux cas, elle ralentit les symptômes sans agir sur la cause.</p>',
      },
      {
        q: 'Peut-on poser un parquet dans une salle de bain&nbsp;?',
        a: '<p>Oui, sous conditions strictes&nbsp;: essences adaptées, finition appropriée, mise en œuvre spécifique aux pièces humides, et surtout ventilation efficace. Ce n’est pas une pose ordinaire, et l’entretien y est plus exigeant qu’ailleurs.</p>',
      },
    ],
  },

  'renover-un-parquet-tres-abime': {
    standfirst:
      'Entre un parquet patiné et un parquet à remplacer, la frontière n’est pas visuelle. Elle tient à trois mesures, dont aucune ne se lit depuis la surface.',
    html: `
          <h2 id="apparence">L’apparence trompe</h2>
          <p>Un parquet noirci, taché et rayé peut être parfaitement récupérable. Un parquet d’apparence correcte peut être condamné. La différence tient à ce qui reste sous la surface, pas à ce qu’on voit dessus.</p>
          <p>Trois mesures décident&nbsp;: l’épaisseur utile, l’état du support, et le fait que la cause du désordre ait été traitée ou non.</p>

          <h2 id="epaisseur">Première mesure&nbsp;: l’épaisseur utile</h2>
          <p>Poncer, c’est retirer de la matière. La question est donc de savoir combien il en reste au-dessus du point où le parquet cesse d’être ponçable.</p>
          <ul>
            <li><strong>Sur un massif</strong>, la limite est le haut des rainures. L’épaisseur disponible autorise généralement plusieurs rénovations successives sur la durée de vie du sol.</li>
            <li><strong>Sur un contrecollé</strong>, seule la couche noble supérieure peut être poncée. Selon son épaisseur d’origine et les rénovations déjà réalisées, la marge peut être confortable ou nulle.</li>
            <li><strong>Sur un stratifié</strong>, la question ne se pose pas&nbsp;: la surface est un décor imprimé, elle ne se ponce pas.</li>
          </ul>
          <p>La mesure se prend là où l’épaisseur est visible&nbsp;: seuil de porte, découpe autour d’un tuyau, bouche d’aération, ou bord d’une lame déjà déposée.</p>

          <div class="callout callout--slate">
            <p class="callout__title">${ICONS.search} Repérer le type de parquet</p>
            <p>Sur la tranche d’une lame, un massif présente un fil de bois continu&nbsp;; un contrecollé montre une superposition de couches, souvent avec un contreplaqué visible en dessous&nbsp;; un stratifié laisse apparaître un panneau de fibres uniforme, sans veinage.</p>
          </div>

          <h2 id="support">Deuxième mesure&nbsp;: le support</h2>
          <p>Un parquet rénové sur un support défaillant reproduira ses désordres, généralement plus vite qu’à l’origine. Trois contrôles s’imposent avant toute décision&nbsp;: la planéité, mesurée à la règle&nbsp;; la siccité, mesurée avec un appareil adapté&nbsp;; l’adhérence, dans le cas d’une pose collée.</p>
          <p>Ces contrôles sont exactement ceux d’une pose neuve. C’est logique&nbsp;: rénover, c’est engager le sol pour une nouvelle période longue.</p>

          <h2 id="cause">Troisième mesure&nbsp;: la cause a-t-elle été traitée&nbsp;?</h2>
          <p>C’est le critère le plus souvent négligé. Un parquet abîmé par une humidité non identifiée, une fuite non réparée ou un défaut de support non corrigé se dégradera à nouveau. La rénovation aura alors coûté le prix d’un sursis.</p>
          <p>L’ordre correct est invariable&nbsp;: identifier la cause, la traiter, laisser le support se stabiliser, puis rénover.</p>

          <h2 id="voies">Les voies possibles</h2>
          <h3 id="remise-en-etat">La remise en état légère</h3>
          <p>Quand la finition est usée mais le bois sain, un nettoyage en profondeur suivi d’une reprise de finition suffit souvent. C’est l’opération la moins invasive et la moins coûteuse&nbsp;: elle mérite d’être envisagée avant tout ponçage.</p>

          <h3 id="poncage">Le ponçage complet</h3>
          <p>Il redonne une surface neuve mais consomme de la matière définitivement. Il se justifie quand le bois lui-même est marqué, taché en profondeur ou irrégulier — et quand l’épaisseur le permet.</p>

          <h3 id="partiel">Le remplacement partiel</h3>
          <p>Techniquement réalisable sur pose clouée ou collée, à condition de retrouver des lames compatibles en essence, largeur et épaisseur. La difficulté est esthétique&nbsp;: une lame neuve n’a pas la patine des autres, et le raccord reste visible plusieurs années.</p>

          <h3 id="remplacement">Le remplacement complet</h3>
          <p>Il s’impose quand l’épaisseur utile est épuisée, quand la dégradation est structurelle sur une part importante de la surface, ou quand le support doit être repris. Le choix du nouveau revêtement se pose alors&nbsp;: essence, épaisseur, format, type de pose et compatibilité avec le support. Une fois la cause du désordre traitée, ces caractéristiques se comparent référence par référence dans les catalogues spécialisés — côté ${premibelLink(PREMIBEL.massif, 'parquet massif')} comme côté ${premibelLink(PREMIBEL.contrecolle, 'contrecollé')}.</p>

          <h2 id="decider">Décider sans se tromper</h2>
          <p>Un principe simple&nbsp;: la rénovation la moins invasive qui traite réellement le problème est presque toujours la bonne. Poncer un parquet dont la finition seule est usée gaspille de la matière irremplaçable&nbsp;; rénover un parquet dont le support est en cause gaspille le budget.</p>
`,
    faq: [
      {
        q: 'Un parquet noirci est-il perdu&nbsp;?',
        a: '<p>Pas nécessairement. Un noircissement peut être superficiel — réaction chimique du tanin, finition oxydée — et disparaître au premier passage de ponçage. Il peut aussi traduire une humidité installée dans l’épaisseur, auquel cas le ponçage ne suffira pas. Distinguer les deux demande d’observer la tranche du bois, pas seulement sa surface.</p>',
      },
      {
        q: 'Peut-on rénover soi-même&nbsp;?',
        a: '<p>Techniquement, oui, avec du matériel loué. Le risque n’est pas dans le geste mais dans la décision préalable&nbsp;: une ponceuse mal maîtrisée creuse le bois, et un ponçage engagé sans avoir mesuré l’épaisseur utile peut traverser la couche noble d’un contrecollé. Le diagnostic mérite plus d’attention que l’outillage.</p>',
      },
    ],
  },

  'pourquoi-le-support-est-essentiel': {
    standfirst:
      'La majorité des désordres de parquet se jouent sous le parquet. Trois contrôles préalables — planéité, siccité, cohésion — expliquent à eux seuls une grande part des problèmes rencontrés ensuite.',
    html: `
          <h2 id="systeme">Un parquet n’est pas un objet, c’est un système</h2>
          <p>On achète un parquet, on regarde une essence, une teinte, un format. Mais ce qui décide de son comportement dans le temps, c’est ce qu’il y a dessous. Le support détermine la répartition des appuis, l’échange d’humidité, la possibilité même de certains types de pose.</p>
          <p>C’est pour cette raison qu’une expertise de parquet commence presque toujours par des questions qui ne portent pas sur le parquet.</p>

          <h2 id="planeite">Contrôle 1&nbsp;: la planéité</h2>
          <p>Un support qui n’est pas plan laisse des lames sans appui. Sur pose collée, cela crée des zones creuses où la colle ne fait pas son travail&nbsp;: décollements et sons creux apparaissent. Sur pose flottante, la sous-couche compense les petites irrégularités, mais pas les creux importants&nbsp;: les lames travaillent, les assemblages fatiguent, les grincements s’installent.</p>
          <p>Le contrôle se fait avec une règle rigide de deux mètres, déplacée dans plusieurs directions et notamment en diagonale. Ce n’est pas un contrôle décoratif&nbsp;: c’est la mesure qui conditionne le choix entre pose directe, ragréage ou reprise complète.</p>

          <h2 id="siccite">Contrôle 2&nbsp;: la siccité</h2>
          <p>Un support neuf contient de l’eau. Une chape, une dalle, un ragréage sèchent lentement, sur des durées qui se comptent en semaines, parfois en mois selon l’épaisseur et les conditions. Poser un revêtement bois sur un support qui n’a pas fini de sécher revient à lui fournir une source d’humidité permanente pendant sa première année.</p>

          <div class="callout callout--warning">
            <p class="callout__title">${ICONS.alert} Le poste le plus souvent sacrifié</p>
            <p>Sur un chantier tendu, le délai de séchage est la variable d’ajustement la plus tentante&nbsp;: il ne se voit pas, il ne coûte rien à supprimer, et ses conséquences n’apparaissent que des mois plus tard. C’est précisément pour cela qu’il figure en tête des causes de désordres.</p>
          </div>

          <p>Le contrôle ne s’estime pas&nbsp;: il se mesure, avec un appareil adapté à la nature du support. Une surface sèche au toucher peut rester chargée en profondeur.</p>

          <h2 id="cohesion">Contrôle 3&nbsp;: la propreté et la cohésion</h2>
          <p>Rien n’adhère sur une surface poussiéreuse, farinante ou couverte de résidus. Sur une pose collée, c’est la condition même de la tenue. Sur un ancien revêtement conservé, la question devient double&nbsp;: le support tient-il, et tient-il à ce qu’il y a en dessous&nbsp;?</p>

          <h2 id="acclimatation">Le quatrième facteur&nbsp;: l’acclimatation</h2>
          <p>Ce n’est pas un contrôle du support, mais il appartient à la même logique. Le bois livré n’a pas le même taux d’humidité que la pièce où il sera posé. Le laisser s’équilibrer avant la pose évite qu’il ne le fasse après, une fois immobilisé entre quatre murs.</p>
          <p>Deux conditions pour que cela ait un sens&nbsp;: la pièce doit être dans son état d’usage — chauffée, ventilée, hors d’air et hors d’eau — et le délai doit être respecté réellement, pas symboliquement.</p>

          <h2 id="chauffant">Le cas du plancher chauffant</h2>
          <p>Il cumule les contraintes&nbsp;: résistance thermique limitée du complexe, essences à faible variation dimensionnelle, épaisseur restreinte, type de pose imposé, et protocole de mise en chauffe à respecter avant comme après la pose. Ce n’est pas un paramètre parmi d’autres&nbsp;: c’est un cadre qui restreint fortement les options possibles.</p>

          <h2 id="consequence">Ce que cela change pour vous</h2>
          <p>Si vous faites poser un parquet, ces contrôles doivent apparaître quelque part&nbsp;: dans le devis, dans un compte rendu, ou au minimum dans un échange écrit. S’ils n’apparaissent nulle part, cela ne signifie pas qu’ils n’ont pas été faits — mais en cas de désordre, rien ne permettra de le démontrer.</p>
          <p>Si vous constatez un désordre sur un parquet récent, ces mêmes contrôles sont les premiers à reconstituer. Voir la page <a href="${rel(D, 'pages/problemes/defaut-de-pose.html')}">suspicion de défaut de pose</a>.</p>
`,
    faq: [
      {
        q: 'Un ragréage règle-t-il tous les problèmes de planéité&nbsp;?',
        a: '<p>Il corrige les irrégularités dans une certaine limite d’épaisseur, à condition d’être appliqué sur un support sain, propre et lui-même stable. Il ne compense ni un affaissement structurel, ni un support qui bouge, ni une humidité présente&nbsp;: dans ces cas, il ne fait que déplacer le problème.</p>',
      },
      {
        q: 'Peut-on poser un parquet sur un ancien carrelage&nbsp;?',
        a: '<p>Souvent oui, à condition que le carrelage soit bien adhérent, plan et sec, et que la hauteur disponible le permette au niveau des portes et des seuils. Les carreaux descellés ou sonnant creux doivent être traités avant, sous peine de transmettre leur défaut au nouveau revêtement.</p>',
      },
    ],
  },

  'lames-qui-secartent': {
    standfirst:
      'Des joints qui s’ouvrent entre les lames inquiètent souvent plus que le gonflement. Pourtant, dans la majorité des cas, c’est le comportement normal d’un bois qui sèche. Voici comment faire la différence entre une respiration saisonnière et un défaut.',
    html: `
          <h2 id="reponse">La réponse courte</h2>
          <p>Un parquet qui présente des joints ouverts en hiver et les referme au printemps <strong>fonctionne normalement</strong>. Le bois perd de l’humidité en période de chauffe, il se rétracte, et l’espace apparaît. C’est l’exact opposé du gonflement, et c’est le même mécanisme.</p>
          <p>Trois situations, en revanche, méritent d’être regardées de près&nbsp;: un écart qui ne se referme jamais, un écart qui s’aggrave d’une année sur l’autre, et un écart localisé alors que le reste de la pièce ne bouge pas.</p>

          <h2 id="mecanisme">Ce qui se passe dans la lame</h2>
          <p>Le bois est hygroscopique&nbsp;: il échange en permanence de l’humidité avec l’air qui l’entoure jusqu’à trouver un équilibre. Quand l’air s’assèche, la lame rend de l’eau et perd du volume — surtout en largeur, très peu en longueur. Un parquet de six mètres de large qui se rétracte de 0,2 % perd un peu plus d’un centimètre, réparti sur toutes ses lames.</p>
          <p>C’est pour cela que l’écartement se voit sur les joints et pas ailleurs&nbsp;: le retrait de chaque lame est minuscule, mais il s’additionne.</p>

          <div class="callout callout--slate">
            <p class="callout__title">${ICONS.help} Le repère qui compte</p>
            <p>L’hygrométrie d’un logement chauffé descend fréquemment sous 35&nbsp;% en hiver, alors que les règles de pose visent une plage d’environ 45 à 65&nbsp;%. Un parquet posé dans les règles peut donc se retrouver, chaque hiver, dans des conditions plus sèches que celles prévues. Le retrait qui en résulte n’est pas un défaut du parquet&nbsp;: c’est une conséquence de l’air.</p>
          </div>

          <h2 id="normal">Ce qui reste dans le normal</h2>
          <ul class="rich-list rich-list--check">
            <li>Des joints qui s’ouvrent progressivement à l’entrée de l’hiver et se referment au printemps.</li>
            <li>Un phénomène réparti sur toute la surface, pas concentré à un endroit.</li>
            <li>Des lames qui restent solidaires, sans jeu vertical ni bruit nouveau.</li>
            <li>Une amplitude qui se répète d’une année sur l’autre sans progresser.</li>
          </ul>
          <p>Sur un parquet massif large, en pose clouée, dans un logement chauffé sans humidification, ce comportement est courant. Il peut être atténué en stabilisant l’air ambiant, rarement supprimé.</p>

          <h2 id="anormal">Ce qui doit alerter</h2>
          <h3 id="permanent">L’écart qui ne se referme pas</h3>
          <p>Si les joints restent ouverts au retour de l’humidité, le bois n’a pas simplement séché&nbsp;: il a probablement été posé à un taux d’humidité trop élevé, puis s’est stabilisé plus bas. Une acclimatation insuffisante avant la pose est l’hypothèse la plus fréquente, sans qu’elle puisse être affirmée sans observation.</p>

          <h3 id="aggrave">L’écart qui s’aggrave</h3>
          <p>Une amplitude qui augmente chaque année évoque un assèchement croissant — un chauffage plus intense, une ventilation modifiée, un plancher chauffant mal régulé — ou un désassemblage progressif des lames.</p>

          <h3 id="localise">L’écart localisé</h3>
          <p>Un joint ouvert à un seul endroit, alors que le reste de la pièce ne bouge pas, ne relève plus du retrait global. Il évoque plutôt une lame qui s’est désolidarisée de son support, une fixation qui a lâché ou un défaut ponctuel de pose. La page <a href="${rel(D, 'pages/problemes/lames-qui-bougent.html')}">lames qui bougent</a> traite précisément ce cas.</p>

          <h3 id="dents">Les joints « en dents de scie »</h3>
          <p>Quand quelques joints très larges alternent avec des joints fermés, les lames ne se rétractent pas librement&nbsp;: certaines restent collées ou clouées entre elles et le retrait se concentre sur une seule interface. C’est un indice de pose à faire vérifier.</p>

          <h2 id="verifier">Ce que vous pouvez vérifier vous-même</h2>
          <ol>
            <li><strong>Mesurer l’air.</strong> Un hygromètre à quelques euros, relevé matin et soir pendant une semaine, dit beaucoup plus qu’une impression.</li>
            <li><strong>Mesurer le joint.</strong> Glissez une cale d’épaisseur ou notez la largeur au même endroit, avec un repère discret, et refaites la mesure trois mois plus tard. C’est la variation qui compte, pas la valeur.</li>
            <li><strong>Photographier.</strong> Une photo datée, prise au même endroit et sous le même éclairage, objective une évolution bien mieux que la mémoire.</li>
            <li><strong>Vérifier la périphérie.</strong> Le parquet doit pouvoir bouger sous la plinthe. Un parquet bloqué se comporte anormalement dans les deux sens.</li>
            <li><strong>Chercher une source de chaleur.</strong> Un joint plus ouvert devant un radiateur ou une baie exposée au sud s’explique souvent par la seule différence de température locale.</li>
          </ol>

          <h2 id="erreurs">Les réflexes à éviter</h2>
          <ul>
            <li><strong>Reboucher les joints en hiver.</strong> Le mastic sera comprimé au printemps quand le bois regonflera, et il fera éclater les arêtes. Toute reprise se décide sur un parquet stabilisé.</li>
            <li><strong>Humidifier brutalement la pièce.</strong> Faire remonter l’hygrométrie de 30 à 60&nbsp;% en deux jours provoque un gonflement rapide, donc une compression. Le retour à l’équilibre se fait lentement.</li>
            <li><strong>Recouper les plinthes pour « rattraper ».</strong> Cela supprime le jeu périphérique dont le parquet a besoin.</li>
            <li><strong>Conclure au bois de mauvaise qualité.</strong> Le retrait dépend de l’essence, du débit et de l’humidité, pas du prix.</li>
          </ul>

          <h2 id="quand">Quand une expertise devient utile</h2>
          <p>Elle se justifie quand l’écartement ne suit plus les saisons, quand il s’accompagne d’un autre signal — lames mobiles, bruit nouveau, bombement ailleurs dans la pièce — ou quand il apparaît sur un parquet récent. La question devient alors celle des conditions de pose et du comportement du support, qui ne se lisent pas depuis la surface.</p>
          <p>Pour poser le contexte en quelques minutes, le <a href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">pré-diagnostic</a> reprend ces questions dans l’ordre. Il oriente&nbsp;; il ne conclut pas.</p>
`,
    faq: [
      {
        q: 'Un humidificateur règle-t-il le problème&nbsp;?',
        a: '<p>Il agit sur la cause quand celle-ci est bien un air trop sec, mais son effet est progressif et il doit être piloté&nbsp;: viser une plage stable, et non le taux le plus élevé possible. Un logement maintenu trop humide déplace simplement le problème vers le gonflement.</p>',
      },
      {
        q: 'Quelle largeur de joint est acceptable&nbsp;?',
        a: '<p>Il n’existe pas de seuil universel&nbsp;: il dépend de l’essence, de la largeur des lames, du type de pose et de l’écart d’hygrométrie subi. C’est pourquoi la mesure utile n’est pas la largeur à un instant donné, mais son évolution entre deux saisons.</p>',
      },
    ],
  },

  'parquet-qui-sonne-creux': {
    standfirst:
      'Un son creux sous le pied n’est pas un défaut en soi&nbsp;: c’est une information. Selon le type de pose, il peut être parfaitement normal ou signaler un décollement. Encore faut-il savoir lequel on écoute.',
    html: `
          <h2 id="reponse">La réponse courte</h2>
          <p>Le son creux vient d’un <strong>volume d’air entre le parquet et son support</strong>. Sur une pose flottante, cet air fait partie du principe même&nbsp;: le parquet ne touche pas le support, un son mat et légèrement résonnant est attendu. Sur une pose collée, il ne devrait pas y en avoir&nbsp;: un son creux y signale une perte d’adhérence.</p>
          <p>La première question n’est donc pas «&nbsp;pourquoi ça sonne creux&nbsp;?&nbsp;» mais «&nbsp;comment ce parquet est-il posé&nbsp;?&nbsp;».</p>

          <h2 id="type-pose">Identifier le type de pose sans rien démonter</h2>
          <p>Trois indices se lisent depuis la surface&nbsp;:</p>
          <ul>
            <li><strong>Le comportement au pied.</strong> Un flottant s’enfonce très légèrement et uniformément&nbsp;; un collé ne bouge pas.</li>
            <li><strong>La périphérie.</strong> Un flottant impose un jeu visible sous la plinthe, généralement 8 à 10&nbsp;mm. Un collé peut s’en approcher davantage.</li>
            <li><strong>Le seuil de porte.</strong> Une barre de seuil systématique à chaque changement de pièce est typique du flottant, qui doit pouvoir travailler par surface indépendante.</li>
          </ul>

          <div class="callout callout--slate">
            <p class="callout__title">${ICONS.help} Le test du tapotement</p>
            <p>Tapotez la surface avec l’articulation du doigt ou le manche d’un tournevis, tous les 30&nbsp;cm, en suivant une ligne. Notez où le son change. Une <em>zone</em> creuse aux contours nets ne raconte pas la même histoire qu’un son creux <em>uniforme</em> sur toute la pièce.</p>
          </div>

          <h2 id="flottant">Sur une pose flottante</h2>
          <p>Un son creux généralisé est normal. Ce qui ne l’est pas&nbsp;:</p>
          <ul class="rich-list rich-list--check">
            <li>Une <strong>zone</strong> nettement plus sonore que le reste, souvent dans un passage intense&nbsp;: la sous-couche s’y est tassée et le parquet a perdu son appui.</li>
            <li>Un son creux qui s’accompagne d’un mouvement vertical perceptible, voire d’un clic à chaque pas.</li>
            <li>Un creux apparu après un incident d’eau&nbsp;: la sous-couche peut s’être déformée ou le support avoir bougé.</li>
          </ul>
          <p>Dans ces cas, le bruit est le symptôme&nbsp;; la cause est sous la lame. Elle rejoint souvent celle du <a href="${rel(D, 'articles/pourquoi-un-parquet-grince.html')}">grincement</a>, qui procède du même défaut d’appui.</p>

          <h2 id="colle">Sur une pose collée</h2>
          <p>Là, le son creux mérite attention. Il indique que la colle n’assure plus la liaison sur cette zone. Plusieurs causes sont possibles, sans qu’aucune puisse être retenue sans observation&nbsp;:</p>
          <ul>
            <li>un <strong>support insuffisamment préparé</strong>&nbsp;: poussière, laitance, ancienne colle, primaire absent&nbsp;;</li>
            <li>un <strong>support encore humide</strong> à la pose, qui a empêché la prise&nbsp;;</li>
            <li>une <strong>colle inadaptée</strong> au couple support/parquet, ou appliquée en quantité insuffisante&nbsp;;</li>
            <li>un <strong>mouvement du support</strong> — fissure, tassement, dalle qui travaille&nbsp;;</li>
            <li>une <strong>contrainte du bois</strong> supérieure à la tenue de la colle, typiquement après un épisode d’humidité.</li>
          </ul>
          <p>La distinction entre ces hypothèses ne se fait pas à l’oreille. Elle demande de mesurer l’humidité du support et, parfois, de déposer une lame en zone discrète.</p>

          <h2 id="cloue">Sur une pose clouée</h2>
          <p>Le parquet repose sur des lambourdes ou un plancher porteur&nbsp;: un certain volume d’air existe par construction. Un son creux localisé peut alors signaler une lambourde déchaussée, un support qui a pris du jeu, ou une lame dont la fixation a lâché. C’est le cas le plus fréquent dans l’ancien.</p>

          <h2 id="verifier">Ce que vous pouvez vérifier vous-même</h2>
          <ol>
            <li><strong>Cartographier les zones creuses</strong> au tapotement, et les reporter sur un croquis de la pièce. Une bande le long d’un mur, une zone centrale ou des points isolés orientent différemment.</li>
            <li><strong>Dater l’apparition.</strong> Un creux présent depuis la pose n’a pas la même signification qu’un creux apparu après trois ans, ou après une fuite.</li>
            <li><strong>Chercher une corrélation.</strong> Les zones creuses coïncident-elles avec un passage, un mur extérieur, une canalisation, un point d’eau&nbsp;?</li>
            <li><strong>Observer en lumière rasante.</strong> Un décollement s’accompagne souvent d’un très léger bombement, invisible de face.</li>
          </ol>

          <h2 id="erreurs">Les réflexes à éviter</h2>
          <ul>
            <li><strong>Injecter de la colle par un trou.</strong> Sans savoir pourquoi la liaison a lâché, on referme le symptôme et on laisse la cause agir.</li>
            <li><strong>Visser pour «&nbsp;plaquer&nbsp;».</strong> Outre le risque de percer une canalisation ou un plancher chauffant, la vis reprend une contrainte que la colle n’a pas tenue — elle finira par céder à son tour.</li>
            <li><strong>Charger la zone.</strong> Poser un meuble lourd sur un décollement ne le résorbe pas et peut fendre la lame.</li>
            <li><strong>Ignorer un creux qui s’étend.</strong> Une zone qui gagne du terrain d’un mois à l’autre indique un phénomène actif.</li>
          </ul>

          <h2 id="quand">Quand une expertise devient utile</h2>
          <p>Elle se justifie sur une pose collée dès que la zone creuse dépasse quelques lames ou progresse, après un dégât des eaux, et sur un parquet récent — la question devenant alors celle de la préparation du support et du respect des conditions de pose. Voir <a href="${rel(D, 'pages/problemes/defaut-de-pose.html')}">défaut de pose</a> et <a href="${rel(D, 'articles/pourquoi-le-support-est-essentiel.html')}">pourquoi le support est essentiel</a>.</p>
`,
    faq: [
      {
        q: 'Un parquet flottant qui sonne creux est-il mal posé&nbsp;?',
        a: '<p>Pas nécessairement&nbsp;: la résonance fait partie du principe de la pose flottante, où le parquet repose sur une sous-couche sans être fixé au support. Ce qui interroge, c’est une zone nettement plus sonore que le reste, ou un son creux accompagné d’un mouvement vertical.</p>',
      },
      {
        q: 'Peut-on recoller une zone décollée sans tout déposer&nbsp;?',
        a: '<p>C’est parfois techniquement possible, mais l’intervention n’a de sens qu’une fois la cause identifiée et traitée. Recoller sur un support encore humide, ou sur un support qui bouge, revient à refaire la même opération quelques mois plus tard.</p>',
      },
    ],
  },

  'traces-noires-sur-un-parquet': {
    standfirst:
      'Une tache noire sur un parquet a rarement une seule explication. Réaction chimique du bois, moisissure, usure de la finition&nbsp;: trois phénomènes différents, trois réponses différentes. Les confondre conduit à traiter la mauvaise cause.',
    html: `
          <h2 id="reponse">La réponse courte</h2>
          <p>Trois familles expliquent la quasi-totalité des taches noires sur un parquet&nbsp;:</p>
          <ul class="rich-list rich-list--check">
            <li>une <strong>réaction chimique</strong> entre les tanins du bois et du métal en présence d’eau — nette, souvent en auréole, sans odeur&nbsp;;</li>
            <li>une <strong>moisissure</strong> liée à une humidité qui ne sèche pas — diffuse, irrégulière, souvent accompagnée d’une odeur&nbsp;;</li>
            <li>une <strong>finition atteinte</strong>, qui laisse les salissures pénétrer le bois — localisée sur les zones de passage ou de projection.</li>
          </ul>
          <p>La distinction se fait d’abord à l’œil et au nez, avant tout produit.</p>

          <h2 id="tanin">La réaction tanin-fer</h2>
          <p>Le chêne, le châtaignier et plusieurs essences riches en tanins réagissent au contact du fer en présence d’humidité. Le résultat est une coloration grise à noire, souvent très dessinée&nbsp;: le contour d’un pied de meuble métallique, la trace d’un clou, un cercle sous un pot de fleurs, la marque d’une bombe aérosol posée au sol.</p>
          <p>Deux caractéristiques la trahissent&nbsp;: la tache est <strong>nette</strong>, avec une forme qui rappelle l’objet en cause, et elle <strong>ne sent rien</strong>. Elle peut apparaître très vite, parfois en une nuit.</p>

          <div class="callout callout--slate">
            <p class="callout__title">${ICONS.help} Un indice décisif</p>
            <p>Regardez la forme. Un cercle, une bande, l’empreinte d’un patin&nbsp;: la géométrie évoque un objet, donc une réaction chimique. Une tache aux bords flous, ramifiée ou poudreuse, évoque un développement biologique.</p>
          </div>

          <h2 id="moisissure">La moisissure</h2>
          <p>Elle suppose trois conditions réunies dans la durée&nbsp;: de l’humidité, une température douce et un air qui ne circule pas. On la trouve donc typiquement le long d’une plinthe sur mur extérieur, sous un meuble bas, sous un tapis, ou dans un angle mal ventilé.</p>
          <p>Ses signes&nbsp;: des contours irréguliers, un aspect parfois duveteux ou poudreux, une extension progressive, et surtout une <strong>odeur</strong> de cave ou de linge humide. La finition peut cloquer ou perdre son brillant au-dessus de la zone.</p>
          <p>Ici, la tache n’est pas le problème&nbsp;: c’est son témoin. Nettoyer la surface sans traiter l’origine de l’humidité garantit la réapparition. La page <a href="${rel(D, 'pages/problemes/humidite.html')}">humidité et parquet</a> détaille les trois origines possibles — remontée, condensation, infiltration — qui n’appellent pas les mêmes réponses.</p>

          <h2 id="finition">La finition épuisée</h2>
          <p>Une troisième situation, plus banale&nbsp;: la finition ne protège plus. Le bois nu absorbe alors tout ce qui passe — eau, graisses, poussière — et noircit par imprégnation. Le phénomène suit la géographie de l’usage&nbsp;: devant l’évier, dans le couloir, au pied du canapé.</p>
          <p>Le test est simple et se fait en trente secondes&nbsp;: déposez une goutte d’eau sur une zone saine. Si elle perle, la finition tient&nbsp;; si elle pénètre et fonce le bois, elle est épuisée. Voir le guide <a href="${rel(D, 'pages/conseils/entretien.html')}">entretien du parquet</a>.</p>

          <h2 id="verifier">Ce que vous pouvez vérifier vous-même</h2>
          <ol>
            <li><strong>Sentir.</strong> Une odeur persistante oriente fortement vers l’humidité.</li>
            <li><strong>Regarder la forme et les bords.</strong> Nette et géométrique&nbsp;: chimique. Diffuse et irrégulière&nbsp;: biologique.</li>
            <li><strong>Situer.</strong> Mur extérieur, salle d’eau voisine, canalisation encastrée, sous-sol non chauffé&nbsp;: le contexte pèse autant que la tache.</li>
            <li><strong>Tester la finition</strong> à la goutte d’eau, sur une zone saine puis sur la zone tachée.</li>
            <li><strong>Mesurer l’hygrométrie</strong> de la pièce sur plusieurs jours, et comparer avec une pièce voisine.</li>
            <li><strong>Photographier avec une référence</strong> — une pièce de monnaie posée à côté — pour suivre l’évolution.</li>
          </ol>

          <h2 id="erreurs">Les réflexes à éviter</h2>
          <ul>
            <li><strong>L’eau de Javel.</strong> Elle décolore le bois sans retirer la cause, fragilise la finition et complique toute rénovation ultérieure.</li>
            <li><strong>Le ponçage local.</strong> Il crée un creux visible et une différence de teinte durable, sans traiter l’origine.</li>
            <li><strong>Recouvrir d’un tapis.</strong> Sur une moisissure, c’est aggraver la condition qui l’a créée.</li>
            <li><strong>Traiter avant d’avoir identifié.</strong> Un produit anti-tanin sur une moisissure, ou un fongicide sur une réaction chimique, ne font rien d’utile.</li>
          </ul>

          <h2 id="quand">Quand une expertise devient utile</h2>
          <p>Quand la tache s’étend, quand elle revient après nettoyage, quand plusieurs zones apparaissent sans lien apparent, ou quand elle accompagne un autre signal — lames qui bougent, odeur persistante, plinthe qui se décolle. La question n’est alors plus la tache mais l’humidité qui l’alimente, et cela suppose des mesures sur place, y compris dans le support.</p>
`,
    faq: [
      {
        q: 'Une tache noire peut-elle disparaître d’elle-même&nbsp;?',
        a: '<p>Une réaction tanin-fer, non&nbsp;: la coloration est dans la fibre. Une auréole d’humidité superficielle peut s’atténuer en séchant. Une moisissure ne disparaît pas tant que la source d’humidité reste active.</p>',
      },
      {
        q: 'Le noircissement signifie-t-il que le bois est perdu&nbsp;?',
        a: `<p>Pas nécessairement. La question est la profondeur d’atteinte, et elle ne se juge pas depuis la surface. Sur un massif ou un contrecollé à couche noble épaisse, un ponçage peut suffire si l’épaisseur utile le permet&nbsp;; encore faut-il que la cause ait été traitée. Voir le guide <a href="${rel(D, 'pages/conseils/renovation.html')}">rénovation de parquet</a>.</p>`,
      },
    ],
  },

  'reception-chantier-parquet': {
    standfirst:
      'La réception est le dernier moment où un défaut de pose se signale sans discussion. Une fois la signature donnée sans réserve, la charge de la preuve change de camp. Voici ce qui se contrôle, et comment.',
    html: `
          <h2 id="reponse">Pourquoi ce moment compte</h2>
          <p>Un parquet posé se juge mal le jour même&nbsp;: la plupart des désordres apparaissent après le premier cycle de chauffe, donc plusieurs mois plus tard. La réception ne peut donc pas garantir qu’il n’y aura aucun problème. Ce qu’elle peut faire, c’est <strong>consigner l’état initial et les conditions de mise en œuvre</strong> — les deux éléments sans lesquels toute discussion ultérieure devient invérifiable.</p>
          <p>Autrement dit&nbsp;: on ne contrôle pas seulement ce qui se voit, on <em>documente</em> ce qui ne se verra plus.</p>

          <h2 id="avant">Avant le jour J</h2>
          <p>Trois documents valent plus que n’importe quelle inspection visuelle&nbsp;:</p>
          <ul class="rich-list rich-list--check">
            <li>Le <strong>relevé d’humidité du support</strong> avant pose, daté, avec la méthode employée et l’emplacement des points de mesure.</li>
            <li>Le <strong>relevé de planéité</strong>, et la mention des reprises éventuelles (ragréage, primaire).</li>
            <li>La <strong>fiche technique du produit posé</strong> et celle de la colle ou de la sous-couche, qui définissent les conditions à respecter.</li>
          </ul>
          <p>Demandez-les avant la réception, pas pendant. S’ils n’existent pas, c’est en soi une information&nbsp;: elle ne prouve pas un défaut, mais elle signale qu’un contrôle prévu n’a pas été tracé.</p>

          <h2 id="surface">Le contrôle de surface</h2>
          <h3 id="planeite">Planéité et niveau</h3>
          <p>Posez une règle de 2&nbsp;m à plat, à plusieurs endroits et dans plusieurs directions. Les tolérances applicables dépendent du type de pose et du document de référence&nbsp;; l’ordre de grandeur couramment retenu pour un support destiné à recevoir un parquet est de 5&nbsp;mm sous la règle de 2&nbsp;m. Relevez les écarts constatés plutôt que de conclure&nbsp;: c’est la mesure qui fait foi, pas l’appréciation.</p>

          <h3 id="jeux">Jeux périphériques</h3>
          <p>Le parquet doit pouvoir bouger. Vérifiez le jeu contre les murs, autour des tuyaux, des seuils et des éléments fixes — souvent quelques millimètres, variables selon la surface et le produit. Un parquet bloqué en périphérie le jour de la pose est un désordre programmé, et c’est l’un des rares défauts qui se voient immédiatement.</p>

          <h3 id="alignement">Alignement et assemblage</h3>
          <ul>
            <li>Les joints entre lames sont-ils fermés et réguliers&nbsp;?</li>
            <li>Les coupes en périphérie sont-elles franches, sans éclat&nbsp;?</li>
            <li>Le calepinage est-il cohérent d’une pièce à l’autre&nbsp;?</li>
            <li>Les lames de chant sont-elles de longueur suffisante en début et fin de rang&nbsp;?</li>
          </ul>

          <h3 id="aspect">Aspect et teinte</h3>
          <p>Le bois est un matériau naturel&nbsp;: des variations de teinte et de figure sont normales et relèvent du classement d’aspect du produit. Ce qui se signale, ce sont les lames franchement discordantes, les défauts non prévus par le classement annoncé, et les rayures ou chocs postérieurs à la pose.</p>

          <div class="callout callout--slate">
            <p class="callout__title">${ICONS.alert} La lumière change tout</p>
            <p>Contrôlez en lumière rasante, volets ouverts, éclairage artificiel éteint si possible. Un défaut de planéité, un joint ouvert ou une rayure invisibles à la lumière zénithale sautent aux yeux dès que la lumière arrive de côté.</p>
          </div>

          <h2 id="sonore">Le contrôle au pied et à l’oreille</h2>
          <p>Marchez lentement sur toute la surface, y compris le long des murs et sous les meubles s’il y en a déjà. Notez&nbsp;:</p>
          <ol>
            <li>tout <strong>grincement</strong> ou craquement, avec son emplacement&nbsp;;</li>
            <li>toute <strong>zone creuse</strong> au tapotement, particulièrement sur une pose collée&nbsp;;</li>
            <li>tout <strong>mouvement vertical</strong> perceptible sous le pied&nbsp;;</li>
            <li>toute <strong>différence de comportement</strong> entre le centre et la périphérie.</li>
          </ol>
          <p>Ces observations ne prouvent rien à elles seules — un parquet neuf peut émettre des bruits d’assemblage qui se stabilisent. Mais elles constituent un état initial que personne ne pourra reconstituer plus tard.</p>

          <h2 id="reserves">Formuler des réserves utiles</h2>
          <p>Une réserve n’est exploitable que si elle est <strong>localisée, mesurée et datée</strong>. «&nbsp;Parquet qui grince&nbsp;» ne vaut rien&nbsp;; «&nbsp;grincement sur environ 1,5&nbsp;m le long du mur nord du séjour, constaté le 12&nbsp;mars&nbsp;» est vérifiable.</p>
          <ul>
            <li>Photographiez chaque point, avec un objet de référence pour l’échelle.</li>
            <li>Notez les mesures brutes, pas vos conclusions.</li>
            <li>Relevez les conditions du jour&nbsp;: température et hygrométrie de la pièce.</li>
            <li>Conservez une copie de tout, y compris des échanges écrits.</li>
          </ul>
          <p>Ce dossier a une autre vertu&nbsp;: s’il ne se passe rien, il ne coûte rien. S’il se passe quelque chose dix-huit mois plus tard, il devient la seule base de discussion factuelle.</p>

          <h2 id="quand">Quand une expertise devient utile</h2>
          <p>Avant la réception si un doute sérieux existe sur le support ou sur les conditions de pose — c’est le moment où une observation a le plus de valeur. Après, dès qu’un désordre apparaît et que son origine est discutée. La page <a href="${rel(D, 'pages/problemes/defaut-de-pose.html')}">défaut de pose</a> décrit ce qui se reconstitue après coup, et <a href="${rel(D, 'pages/expertise.html')}">en quoi consiste l’expertise</a> comment cela se déroule.</p>
          <p>Ce document décrit des points de contrôle techniques. Il ne constitue pas un avis juridique&nbsp;: les délais, garanties et voies de recours relèvent de votre contrat et, le cas échéant, d’un conseil qualifié.</p>
`,
    faq: [
      {
        q: 'Peut-on réceptionner un parquet le jour même de la pose&nbsp;?',
        a: '<p>C’est fréquent, mais le bois n’a pas encore subi un cycle complet de variation hygrométrique. Réceptionner avec des réserves de principe sur les points non observables à cette date, et documenter les conditions, est plus protecteur qu’une réception sans réserve ou qu’un refus mal fondé.</p>',
      },
      {
        q: 'Faut-il chauffer la pièce avant la réception&nbsp;?',
        a: '<p>Les conditions de température et d’hygrométrie attendues au moment de la pose sont définies par les documents de référence et par le fabricant. Elles font partie de ce qu’il est utile de relever et de noter le jour J, au même titre que les mesures de planéité.</p>',
      },
    ],
  },

  'parquet-et-plancher-chauffant': {
    standfirst:
      'Un plancher chauffant ne rend pas le parquet impossible&nbsp;: il réduit fortement la liste des produits compatibles et impose un protocole. Ces contraintes se vérifient avant la commande, jamais après.',
    html: `
          <h2 id="reponse">La réponse courte</h2>
          <p>Trois conditions doivent être réunies, et elles sont cumulatives&nbsp;:</p>
          <ul class="rich-list rich-list--check">
            <li>le <strong>complexe de sol</strong> — parquet, sous-couche, colle éventuelle — doit laisser passer la chaleur&nbsp;; la valeur couramment retenue comme plafond est une résistance thermique de 0,15&nbsp;m²·K/W&nbsp;;</li>
            <li>la <strong>température de surface</strong> du sol fini ne doit pas dépasser 28&nbsp;°C&nbsp;;</li>
            <li>le <strong>protocole de mise en chauffe</strong>, avant et après la pose, doit être respecté et tracé.</li>
          </ul>
          <p>Ces valeurs figurent dans les documents de référence de la pose de parquet et dans les fiches techniques produit. Elles se vérifient sur le papier avant d’acheter&nbsp;: aucune ne se rattrape après.</p>

          <h2 id="resistance">La résistance thermique, en clair</h2>
          <p>La résistance thermique mesure ce que le revêtement oppose au passage de la chaleur. Elle se calcule en divisant l’épaisseur par la conductivité du matériau, et elle <strong>s’additionne</strong>&nbsp;: parquet + sous-couche + colle. C’est l’erreur la plus fréquente — un parquet compatible devient incompatible une fois posé sur une sous-couche isolante.</p>
          <p>Deux leviers seulement&nbsp;: l’épaisseur et l’essence. Plus la lame est épaisse, plus elle isole&nbsp;; plus l’essence est dense et conductrice, moins elle freine. C’est ce qui explique la place du chêne, qui reste compatible à des épaisseurs où d’autres essences ne le sont plus.</p>

          <div class="callout callout--slate">
            <p class="callout__title">${ICONS.alert} La sous-couche, angle mort du calcul</p>
            <p>Une sous-couche acoustique choisie pour le confort peut à elle seule consommer l’essentiel du budget thermique disponible. Sur plancher chauffant, elle se choisit <em>avec</em> le parquet, pas séparément — et sa résistance thermique doit figurer sur sa fiche technique.</p>
          </div>

          <h2 id="stabilite">La stabilité de l’essence</h2>
          <p>Un plancher chauffant fait subir au bois des cycles de séchage et de reprise plus marqués qu’un chauffage classique. Deux conséquences&nbsp;:</p>
          <ul>
            <li>les essences <strong>nerveuses</strong>, à fort retrait, ouvrent davantage leurs joints en période de chauffe&nbsp;;</li>
            <li>les <strong>lames larges</strong> amplifient le phénomène, puisque le retrait s’exprime surtout en largeur.</li>
          </ul>
          <p>Le contrecollé est structurellement plus stable&nbsp;: ses couches croisées limitent le mouvement. Cela ne disqualifie pas le massif, mais cela explique pourquoi il est plus souvent proposé en format contenu et en essence stable sur ce type de support.</p>

          <h2 id="pose">Le type de pose</h2>
          <p>La pose collée est généralement privilégiée&nbsp;: le contact direct avec le support favorise l’échange thermique et supprime la lame d’air d’une pose flottante. La pose clouée, qui interpose des lambourdes et un vide, est en pratique exclue sur plancher chauffant. La pose flottante reste possible selon les produits, à condition que la sous-couche soit compatible et intégrée au calcul.</p>

          <h2 id="chauffe">Le protocole de mise en chauffe</h2>
          <p>C’est la partie la plus souvent négligée, et l’une des plus fréquemment en cause dans les désordres constatés après coup.</p>
          <ol>
            <li><strong>Avant la pose</strong>&nbsp;: la chape doit avoir été mise en chauffe puis refroidie selon le protocole du système, de façon à évacuer son humidité résiduelle et à avoir déjà « travaillé ».</li>
            <li><strong>Mesure de l’humidité du support</strong> après ce cycle, et non avant. C’est cette mesure qui autorise ou non la pose.</li>
            <li><strong>Arrêt du chauffage</strong> quelques jours avant et après la pose, selon les préconisations.</li>
            <li><strong>Remontée progressive</strong> en température, par paliers, jamais d’un coup.</li>
          </ol>
          <p>Chacune de ces étapes devrait être datée et conservée. Voir <a href="${rel(D, 'articles/reception-chantier-parquet.html')}">réception d’un chantier de parquet</a>.</p>

          <h2 id="verifier">Ce que vous pouvez vérifier vous-même</h2>
          <ol>
            <li><strong>Le type de système</strong>&nbsp;: basse température à eau, électrique, réversible (rafraîchissant). Le rafraîchissement ajoute un risque de condensation qui change les préconisations.</li>
            <li><strong>La résistance thermique annoncée</strong> du parquet envisagé, de la sous-couche et de la colle — puis leur somme.</li>
            <li><strong>La mention explicite «&nbsp;compatible plancher chauffant&nbsp;»</strong> sur la fiche produit, avec les conditions associées.</li>
            <li><strong>L’existence du procès-verbal de mise en chauffe</strong> de la chape.</li>
            <li><strong>La régulation</strong>&nbsp;: existe-t-il une limitation de température de départ&nbsp;?</li>
          </ol>

          <h2 id="erreurs">Les réflexes à éviter</h2>
          <ul>
            <li><strong>Choisir le parquet puis chercher une sous-couche.</strong> L’ordre inverse évite l’impasse.</li>
            <li><strong>Ajouter un tapis épais sur une grande surface.</strong> Il crée une zone de rétention de chaleur et un différentiel d’hygrométrie sous le tapis.</li>
            <li><strong>Monter en température rapidement</strong> à la première saison de chauffe.</li>
            <li><strong>Se fier à une mention commerciale sans la fiche technique.</strong> «&nbsp;Compatible&nbsp;» sans valeur chiffrée n’est pas une donnée.</li>
          </ul>

          <h2 id="quand">Quand une expertise devient utile</h2>
          <p>Avant travaux, quand le système est ancien ou mal documenté et que les contraintes réelles sont inconnues. Après, dès qu’un désordre apparaît sur un parquet posé sur plancher chauffant&nbsp;: la combinaison support chauffant + bois demande de distinguer ce qui relève du produit, de la pose ou du pilotage thermique — et cela suppose des mesures. Voir <a href="${rel(D, 'pages/problemes/parquet-gondole.html')}">parquet qui gondole</a> et <a href="${rel(D, 'pages/problemes/defaut-de-pose.html')}">défaut de pose</a>.</p>

          <h2 id="choisir">Une fois les contraintes connues</h2>
          <p>Quand la résistance thermique maximale, l’épaisseur admissible et le type de pose sont arrêtés, le choix du produit devient un travail de lecture de fiches techniques. Les catalogues spécialisés indiquent ces caractéristiques référence par référence — c’est le cas notamment des gammes ${premibelLink(PREMIBEL.contrecolle, 'contrecollées')}, structurellement les plus représentées sur ce type de support.</p>
`,
    faq: [
      {
        q: 'Le parquet massif est-il exclu sur plancher chauffant&nbsp;?',
        a: '<p>Non, mais il est plus contraint&nbsp;: l’épaisseur doit rester compatible avec le plafond de résistance thermique, et l’essence comme le format doivent limiter le retrait. Le contrecollé, dont les couches croisées stabilisent la lame, reste le choix le plus courant sur ce type de support.</p>',
      },
      {
        q: 'Peut-on poser un parquet sur un plancher chauffant électrique&nbsp;?',
        a: '<p>C’est possible avec des systèmes conçus pour, mais la montée en température est plus rapide qu’en hydraulique&nbsp;: la régulation et la limitation de température de surface deviennent déterminantes. La fiche technique du système et celle du parquet doivent être lues ensemble.</p>',
      },
    ],
  },

  'massif-ou-contrecolle': {
    standfirst:
      'Massif et contrecollé ne sont pas deux gammes, l’une noble et l’autre économique. Ce sont deux structures, qui ne se comportent pas de la même façon. La différence décide de la stabilité, du nombre de rénovations possibles et du type de pose.',
    html: `
          <h2 id="reponse">La réponse courte</h2>
          <p>Un <strong>parquet massif</strong> est une lame de bois unique, sur toute son épaisseur. Un <strong>contrecollé</strong> superpose une couche de bois noble, une âme et un contre-parement, les fils croisés. De cette différence de construction découle tout le reste.</p>
          <ul class="rich-list rich-list--check">
            <li>Le massif offre une épaisseur utile plus grande&nbsp;: il se ponce davantage, donc il dure plus longtemps si son support le permet.</li>
            <li>Le contrecollé est plus stable dimensionnellement&nbsp;: les couches croisées s’opposent mutuellement au retrait.</li>
            <li>Le stratifié, souvent cité avec eux, n’est pas un parquet&nbsp;: sa surface est un décor imprimé, sans bois d’usure.</li>
          </ul>

          <h2 id="couche">L’épaisseur utile, le seul chiffre qui compte</h2>
          <p>Sur un contrecollé, ce n’est pas l’épaisseur totale qui détermine la longévité mais la <strong>couche noble</strong>, appelée aussi parement ou couche d’usure. Les normes produit situent cette couche entre 2,5 et 6&nbsp;mm&nbsp;; en dessous de 2,5&nbsp;mm, le revêtement ne peut pas être désigné comme un parquet.</p>
          <p>Un ponçage consomme de la matière. Une couche noble de 3&nbsp;mm autorise donc un nombre limité de rénovations, là où un massif de 20&nbsp;mm en autorise plusieurs. C’est ce que recouvre l’expression « épaisseur utile », centrale dès qu’on parle de <a href="${rel(D, 'pages/conseils/renovation.html')}">rénovation</a>.</p>

          <div class="callout callout--slate">
            <p class="callout__title">${ICONS.alert} La confusion la plus coûteuse</p>
            <p>Deux contrecollés de 14&nbsp;mm d’épaisseur totale peuvent avoir l’un 2,5&nbsp;mm de couche noble, l’autre 4&nbsp;mm. Le second se rénovera, le premier beaucoup moins. L’épaisseur totale ne dit rien&nbsp;: c’est la couche noble qu’il faut lire sur la fiche technique.</p>
          </div>

          <h2 id="stabilite">La stabilité</h2>
          <p>Une lame massive est un bloc de bois&nbsp;: elle travaille dans le sens de sa largeur, proportionnellement à sa dimension et aux variations d’humidité. Plus elle est large, plus le mouvement est visible.</p>
          <p>Dans un contrecollé, les couches sont croisées&nbsp;: celle du dessus voudrait bouger dans un sens, celle du dessous l’en empêche. Le résultat est une lame qui varie nettement moins. C’est la raison technique pour laquelle le contrecollé domine sur plancher chauffant et permet des largeurs importantes sans ouvrir ses joints à chaque hiver.</p>
          <p>Cette stabilité n’est pas une immunité. Un contrecollé subit lui aussi l’humidité&nbsp;: il gonfle moins, mais un excès d’eau l’atteint — souvent d’abord par le décollement de ses couches.</p>

          <h2 id="pose">Le type de pose admis</h2>
          <ul>
            <li><strong>Massif</strong>&nbsp;: clouage sur lambourdes ou solivage, collage en plein sur support préparé. La pose flottante lui est généralement fermée, sa stabilité ne s’y prêtant pas.</li>
            <li><strong>Contrecollé</strong>&nbsp;: collage ou pose flottante sur sous-couche, selon le produit.</li>
          </ul>
          <p>Le support disponible restreint donc le choix autant que le goût. Sur une dalle béton en rénovation, sans hauteur pour des lambourdes, le collage ou le flottant s’imposent. Voir <a href="${rel(D, 'pages/conseils/pose.html')}">pose de parquet</a>.</p>

          <h2 id="decider">Comment décider, dans l’ordre</h2>
          <ol>
            <li><strong>Le support d’abord.</strong> Sa nature, sa planéité, son humidité et la hauteur disponible éliminent déjà des solutions. C’est le point de départ, pas l’esthétique.</li>
            <li><strong>Les contraintes du lieu.</strong> Plancher chauffant, pièce humide, copropriété exigeant une performance acoustique, passage intense.</li>
            <li><strong>L’horizon.</strong> Un logement que l’on garde trente ans et un investissement locatif n’appellent pas le même arbitrage sur l’épaisseur utile.</li>
            <li><strong>L’esthétique en dernier.</strong> Essence, format, motif et finition se choisissent dans ce qui reste — et il reste généralement beaucoup.</li>
          </ol>

          <h2 id="idees">Trois idées reçues</h2>
          <ul>
            <li><strong>«&nbsp;Le contrecollé, c’est du stratifié amélioré.&nbsp;»</strong> Non&nbsp;: sa surface est du bois véritable, avec une épaisseur d’usure réelle. Le stratifié n’en a aucune.</li>
            <li><strong>«&nbsp;Le massif dure toujours plus longtemps.&nbsp;»</strong> Il a le potentiel le plus élevé, mais posé sur un support inadapté ou dans une pièce trop humide, il se dégradera plus vite qu’un contrecollé bien choisi.</li>
            <li><strong>«&nbsp;L’épaisseur totale indique la qualité.&nbsp;»</strong> Sur un contrecollé, non — voir plus haut.</li>
          </ul>

          <h2 id="quand">Quand une expertise devient utile</h2>
          <p>Avant de choisir, quand le support est incertain ou quand un désordre a déjà eu lieu sur le revêtement précédent&nbsp;: reposer un parquet sur une cause non traitée revient à programmer le même problème. Voir <a href="${rel(D, 'articles/pourquoi-le-support-est-essentiel.html')}">pourquoi le support est essentiel avant la pose</a>.</p>

          <h2 id="comparer">Passer des critères au produit</h2>
          <p>Une fois le support caractérisé et les contraintes posées, la comparaison devient concrète&nbsp;: essences, formats, épaisseurs de couche noble et finitions se lisent référence par référence. Les catalogues spécialisés publient ces données, du côté des ${premibelLink(PREMIBEL.massif, 'parquets massifs')} comme des ${premibelLink(PREMIBEL.contrecolle, 'contrecollés')}. C’est à ce stade que le choix se fait&nbsp;— pas sur une photo d’ambiance.</p>
`,
    faq: [
      {
        q: 'Combien de fois peut-on poncer un contrecollé&nbsp;?',
        a: '<p>Cela dépend entièrement de l’épaisseur de sa couche noble, et de ce qu’un ponçage consomme selon l’état de surface. Une couche de 2,5&nbsp;mm laisse très peu de marge&nbsp;; une couche de 5 à 6&nbsp;mm s’approche du comportement d’un massif. Le chiffre à demander est donc celui de la couche noble, pas un nombre de ponçages annoncé.</p>',
      },
      {
        q: 'Le contrecollé est-il un choix par défaut&nbsp;?',
        a: '<p>Non. Sur plancher chauffant, en grande largeur ou sur une dalle sans hauteur disponible, c’est souvent le choix techniquement le plus cohérent, indépendamment du budget. À l’inverse, sur un solivage ancien avec de la hauteur, le massif cloué reste pertinent.</p>',
      },
    ],
  },

  'finition-parquet-huile-vitrifie': {
    standfirst:
      'La finition n’est pas un détail d’aspect&nbsp;: c’est la seule couche qui prend l’usure. Elle décide de l’entretien quotidien, de la façon dont les accidents se réparent, et du moment où une rénovation complète deviendra nécessaire.',
    html: `
          <h2 id="reponse">La réponse courte</h2>
          <p>Deux logiques s’opposent, et le reste en découle&nbsp;:</p>
          <ul class="rich-list rich-list--check">
            <li>Le <strong>vitrifié</strong> pose un film sur le bois. Il protège bien, s’entretient facilement — mais quand le film est rayé, la réparation locale se voit, et la reprise se fait par ponçage complet.</li>
            <li>L’<strong>huilé</strong> pénètre la fibre sans former de film. Il demande un entretien régulier, mais se répare zone par zone, sans reprendre toute la pièce.</li>
            <li>Le <strong>brut</strong> n’est pas une finition&nbsp;: c’est un parquet livré nu, à finir sur place. Il donne la main sur le choix, au prix d’une étape de chantier supplémentaire.</li>
          </ul>
          <p>Le bon critère n’est donc pas «&nbsp;lequel est le meilleur&nbsp;» mais «&nbsp;quel mode d’entretien et de réparation vous convient&nbsp;».</p>

          <h2 id="vitrifie">Le vitrifié</h2>
          <p>Une à trois couches de vernis forment une pellicule continue. L’eau ne pénètre pas, les taches non plus tant que le film est intact. L’entretien courant se limite à un balayage et à un lavage peu humide avec un produit neutre.</p>
          <p>Sa limite est aussi sa nature&nbsp;: <strong>ce qui traverse le film n’est plus rattrapable localement</strong>. Une rayure profonde, une brûlure, une tache qui a atteint le bois imposent de reprendre la surface. Et un raccord de vernis sur une zone isolée reste presque toujours visible, parce que le film neuf et le film usé ne réfléchissent pas la lumière de la même façon.</p>
          <p>Le vitrifié vieillit par zones de passage&nbsp;: le couloir, le devant du canapé, le tour de l’îlot ternissent d’abord.</p>

          <h2 id="huile">L’huilé</h2>
          <p>L’huile imprègne les premiers millimètres et laisse le bois «&nbsp;ouvert&nbsp;». L’aspect est plus mat, plus proche du toucher du bois, et la teinte se patine.</p>
          <p>Son atout est la <strong>réparabilité</strong>&nbsp;: une zone marquée se ponce légèrement et se ré-huile, et le raccord se fond. C’est un vrai avantage sur une grande surface, ou dans un logement où l’on préfère intervenir ponctuellement plutôt que tout refaire tous les dix ans.</p>
          <p>Sa contrainte est la régularité&nbsp;: une huile d’entretien à passer périodiquement, avec un produit compatible de celui d’origine. Un huilé négligé absorbe les liquides et se tache durablement — c’est une cause fréquente de <a href="${rel(D, 'articles/traces-noires-sur-un-parquet.html')}">marques sombres</a>.</p>

          <div class="callout callout--slate">
            <p class="callout__title">${ICONS.help} Identifier une finition en trente secondes</p>
            <p>Déposez une goutte d’eau sur une zone discrète. Si elle perle et reste ronde, le film est intact&nbsp;: vitrifié en bon état. Si elle s’étale lentement et fonce légèrement le bois avant de sécher sans trace, c’est un huilé. Si elle pénètre et laisse une auréole, la finition est épuisée, quelle qu’elle soit.</p>
          </div>

          <h2 id="brut">Le brut</h2>
          <p>Un parquet brut est finalisé après la pose. Cela permet de choisir l’aspect au dernier moment, d’égaliser la surface une fois posée, et d’adapter la teinte à la lumière réelle de la pièce. En contrepartie&nbsp;: une étape supplémentaire, de la poussière, un délai de séchage et une pièce inutilisable quelques jours.</p>
          <p>C’est souvent le choix retenu lorsque le parquet doit s’harmoniser avec un existant, ou sur un chantier où la finition d’usine ne survivrait pas aux corps d’état suivants.</p>

          <h2 id="choisir">Choisir selon l’usage, pas selon l’aspect</h2>
          <ol>
            <li><strong>Enfants, animaux, passage intense</strong>&nbsp;: la réparabilité de l’huilé compense la fréquence des accidents. Le vitrifié tient mieux au départ, mais se reprend moins souplement.</li>
            <li><strong>Cuisine ouverte, projections fréquentes</strong>&nbsp;: un film continu et bien entretenu protège davantage au quotidien.</li>
            <li><strong>Grande surface</strong>&nbsp;: pouvoir traiter 4&nbsp;m² sans reprendre 60&nbsp;m² pèse lourd.</li>
            <li><strong>Location</strong>&nbsp;: l’entretien régulier d’un huilé dépend d’un occupant qui n’en a pas toujours l’usage.</li>
            <li><strong>Rendu recherché</strong>&nbsp;: le mat profond de l’huile et le satiné d’un vernis ne se confondent pas, mais les vernis mats actuels réduisent l’écart visuel.</li>
          </ol>

          <h2 id="erreurs">Les réflexes à éviter</h2>
          <ul>
            <li><strong>Mélanger les logiques.</strong> Passer une huile sur un vitrifié ne nourrit rien&nbsp;: le film empêche toute pénétration, le produit reste en surface et colle la poussière.</li>
            <li><strong>Laver à grande eau.</strong> Sur les deux finitions, l’eau stagnante finit par passer les joints.</li>
            <li><strong>Employer un produit «&nbsp;universel&nbsp;» brillant.</strong> Les rénovateurs filmogènes créent une couche supplémentaire que le ponçage suivant devra retirer.</li>
            <li><strong>Attendre que la finition ait disparu.</strong> Une reprise faite à temps coûte un entretien&nbsp;; faite trop tard, elle coûte un ponçage.</li>
          </ul>

          <h2 id="quand">Quand une expertise devient utile</h2>
          <p>Rarement pour la finition seule, qui relève de l’entretien — voir le guide <a href="${rel(D, 'pages/conseils/entretien.html')}">entretien du parquet</a>. Elle le devient quand la dégradation de surface accompagne autre chose&nbsp;: un noircissement qui s’étend, un cloquage, une finition qui se décolle par plaques. Ces signes orientent vers une humidité sous-jacente, et la finition n’en est que le témoin.</p>

          <h2 id="produit">Au moment de choisir un produit</h2>
          <p>Le type de finition se décide avec l’essence et le format, pas après&nbsp;: tous les produits ne sont pas proposés dans toutes les finitions. Les catalogues spécialisés permettent de croiser ces critères, par exemple entre ${premibelLink(PREMIBEL.finitionHuile, 'gammes huilées')} et vernies.</p>
`,
    faq: [
      {
        q: 'Peut-on passer d’un vitrifié à un huilé&nbsp;?',
        a: '<p>Oui, mais cela suppose un ponçage complet jusqu’au bois nu&nbsp;: l’huile ne pénètre pas à travers un film de vernis, même partiellement usé. L’opération n’a donc de sens qu’au moment où une rénovation complète est de toute façon nécessaire, et à condition que l’épaisseur utile restante le permette.</p>',
      },
      {
        q: 'Une finition d’usine vaut-elle une finition sur place&nbsp;?',
        a: '<p>Les finitions appliquées en usine sont réalisées dans des conditions maîtrisées, souvent avec plus de couches qu’il n’est possible sur chantier. Une finition sur place permet en revanche d’égaliser la surface après pose et d’ajuster la teinte. Les deux se défendent&nbsp;; ce sont les contraintes du chantier qui tranchent le plus souvent.</p>',
      },
    ],
  },

  'parquet-salle-de-bain': {
    standfirst:
      'Poser du bois dans une pièce d’eau n’est pas une aberration&nbsp;: c’est un choix qui ne tolère aucune approximation. Trois conditions doivent être réunies, et la ventilation pèse autant que le parquet lui-même.',
    html: `
          <h2 id="reponse">La réponse courte</h2>
          <p>Oui, c’est possible — à trois conditions cumulatives&nbsp;:</p>
          <ul class="rich-list rich-list--check">
            <li>une <strong>essence naturellement durable</strong>, dense et riche en huiles, capable de supporter l’humidité sans se dégrader&nbsp;;</li>
            <li>une <strong>mise en œuvre étanche</strong>&nbsp;: pose collée en plein, joints traités, périphérie et traversées soignées&nbsp;;</li>
            <li>une <strong>ventilation qui fonctionne</strong>, capable d’évacuer la vapeur après chaque usage.</li>
          </ul>
          <p>Si l’une des trois manque, le bois finira par s’en apercevoir. La plus souvent négligée est la troisième — et c’est aussi la seule qui ne se répare pas en changeant de produit.</p>

          <h2 id="essence">L’essence</h2>
          <p>Toutes les essences ne se valent pas face à l’eau. Celles traditionnellement retenues pour les pièces humides sont denses et riches en composés qui les rendent naturellement durables — le teck en est l’exemple le plus connu, employé de longue date sur les ponts de bateau pour cette raison précise.</p>
          <p>À l’inverse, une essence tendre et peu durable posée en salle de bain ne tiendra pas, quelle que soit la finition appliquée par-dessus. La finition protège la surface&nbsp;; elle ne change pas la nature du bois.</p>

          <h2 id="pose">La mise en œuvre</h2>
          <h3 id="joints">Le traitement des joints</h3>
          <p>C’est le point critique. L’eau ne traverse pas une lame&nbsp;: elle passe <strong>entre</strong> les lames, puis stagne sous le parquet, là où elle ne sèche jamais. Les produits conçus pour les pièces d’eau, dits « pont de bateau », intègrent un joint souple entre lames pour fermer ce passage.</p>

          <h3 id="collage">Le type de pose</h3>
          <p>La pose collée en plein est la règle&nbsp;: elle supprime le vide sous le parquet, donc le volume où l’eau pourrait s’accumuler sans être détectée. Une pose flottante en salle de bain crée exactement l’espace qu’il faut éviter.</p>

          <h3 id="peripherie">La périphérie et les traversées</h3>
          <p>Les points d’entrée de l’eau sont toujours les mêmes&nbsp;: le pied de la douche ou de la baignoire, le contour du meuble vasque, le passage des alimentations et de l’évacuation, la jonction avec le seuil de porte. Chacun demande un traitement spécifique, et c’est souvent là que se joue la réussite ou l’échec.</p>

          <div class="callout callout--warning">
            <p class="callout__title">${ICONS.alert} La ventilation n’est pas un détail de confort</p>
            <p>Une douche libère une quantité importante de vapeur en quelques minutes. Sans extraction efficace, cette vapeur se condense sur les surfaces froides, dont le sol en périphérie. Le parquet subit alors une humidité cyclique qu’aucune finition ne compense durablement. Avant de choisir un produit, vérifiez que la VMC fonctionne réellement&nbsp;: une feuille de papier plaquée sur la bouche est un test sommaire mais parlant.</p>
          </div>

          <h2 id="entretien">L’entretien conditionne la durée</h2>
          <p>Un parquet de salle de bain demande une discipline simple&nbsp;: essuyer les projections plutôt que les laisser sécher, aérer après usage, et renouveler la finition selon la préconisation du produit. Ces gestes ne relèvent pas du soin excessif&nbsp;: ils font partie du choix.</p>
          <p>C’est d’ailleurs le vrai arbitrage à faire en amont. Le bois en salle de bain est un choix d’usage autant que d’esthétique. Voir le guide <a href="${rel(D, 'pages/conseils/entretien.html')}">entretien du parquet</a>.</p>

          <h2 id="verifier">Ce que vous pouvez vérifier avant de vous décider</h2>
          <ol>
            <li><strong>La ventilation</strong>&nbsp;: débit réel, et non simple présence d’une bouche.</li>
            <li><strong>Le support</strong>&nbsp;: nature, planéité, et surtout siccité. Une dalle encore humide interdit la pose collée.</li>
            <li><strong>Le comportement de la pièce</strong>&nbsp;: y a-t-il déjà de la condensation sur les murs ou les vitres après une douche&nbsp;?</li>
            <li><strong>La configuration</strong>&nbsp;: douche à l’italienne, baignoire, receveur — le risque de projection n’est pas le même.</li>
            <li><strong>Les fiches techniques</strong>&nbsp;: le produit est-il explicitement destiné aux pièces humides, avec ses conditions de pose&nbsp;?</li>
          </ol>

          <h2 id="erreurs">Les réflexes à éviter</h2>
          <ul>
            <li><strong>Compter sur un vernis «&nbsp;spécial pièce humide&nbsp;».</strong> Le film protège la face supérieure, pas les joints ni les rives.</li>
            <li><strong>Poser un parquet ordinaire et «&nbsp;faire attention&nbsp;».</strong> La vapeur ne se contrôle pas à la vigilance.</li>
            <li><strong>Traiter la ventilation après coup.</strong> Elle conditionne tout le reste&nbsp;; elle se règle avant.</li>
            <li><strong>Négliger le seuil.</strong> L’eau qui migre vers la pièce voisine y provoque des désordres qu’on attribue ensuite à autre chose.</li>
          </ul>

          <h2 id="quand">Quand une expertise devient utile</h2>
          <p>Avant travaux, quand la pièce présente déjà des signes de condensation ou quand le support est incertain&nbsp;: le diagnostic préalable coûte beaucoup moins que la dépose d’un parquet neuf. Après, dès que des marques sombres, un gonflement en périphérie ou une odeur apparaissent — signes qui orientent vers une eau qui s’accumule sous le revêtement plutôt que vers un défaut de surface. Voir <a href="${rel(D, 'pages/problemes/humidite.html')}">humidité et parquet</a>.</p>
`,
    faq: [
      {
        q: 'Un contrecollé convient-il en salle de bain&nbsp;?',
        a: '<p>Il faut vérifier au cas par cas&nbsp;: sa stabilité dimensionnelle est un atout, mais son point faible face à l’eau est le décollement des couches si l’humidité atteint l’âme. Les produits destinés aux pièces humides précisent explicitement cet usage&nbsp;; en l’absence de mention, il vaut mieux considérer que le produit n’y est pas destiné.</p>',
      },
      {
        q: 'Et pour des WC ou une buanderie&nbsp;?',
        a: '<p>Les contraintes sont moindres&nbsp;: pas de vapeur massive ni de projection directe. Un parquet courant y est généralement envisageable, en restant attentif aux abords des appareils et à la présence d’une évacuation au sol, qui suppose des précautions particulières.</p>',
      },
    ],
  },
};
