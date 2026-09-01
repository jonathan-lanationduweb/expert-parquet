/**
 * Articles du blog « Conseils ».
 *
 * Gabarit commun : en-tête, sommaire généré, H2/H3, images, listes, encadrés,
 * FAQ, contenus associés et CTA discret. Le corps de chaque article est du
 * HTML éditorial ; tout le reste est produit par le gabarit.
 */

import { rel, breadcrumb, SITE } from '../layout.mjs';
import { ICONS, ARTICLES, articleCard, faqAccordion, faqJsonLd, ctaBand } from '../partials.mjs';

const D = 1;

const BODIES = {
  'pourquoi-un-parquet-grince': {
    standfirst:
      'Le grincement est le désordre le plus courant, et le plus souvent traité à l’envers&nbsp;: on cherche à faire taire le bruit avant de comprendre ce qui frotte. Voici comment lire ce signal.',
    coverAlt: 'Parquet en bois sombre vu de près',
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
          <p>Le bois perd de l’humidité en période de chauffe et se rétracte. Les jeux s’ouvrent, les points de contact changent, des grincements apparaissent — puis disparaissent au printemps. Ce comportement est normal. Ce qui ne lest pas, c’est une amplitude qui s’aggrave d’année en année.</p>

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
    coverAlt: 'Lames de parquet déformées',
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
    coverAlt: 'Gouttes d’eau sur un plancher en bois',
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
    coverAlt: 'Ancien parquet en bois usé',
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
          <p>Il s’impose quand l’épaisseur utile est épuisée, quand la dégradation est structurelle sur une part importante de la surface, ou quand le support doit être repris. Le choix du nouveau revêtement se pose alors&nbsp;: essence, épaisseur, format, type de pose et compatibilité avec le support. Les distributeurs spécialisés, comme <a href="https://premibel.fr" rel="noopener">Premibel</a>, publient ces caractéristiques techniques par référence&nbsp;; c’est sur elles que le choix se construit, une fois la cause du désordre traitée.</p>

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
    coverAlt: 'Chantier avec support de sol en béton',
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
};

function renderArticle(article) {
  const content = BODIES[article.slug];
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Conseils', href: 'pages/conseils.html' },
    { label: article.title },
  ]);

  const others = ARTICLES.filter((item) => item.slug !== article.slug).slice(0, 3);

  const body = `  <section class="section section--tight">
    <div class="container">
      ${crumb.html}
      <div class="article-layout u-mt-md">
        <div>
          <header class="article-head">
            <p class="kicker">${article.category}</p>
            <h1 class="article-head__title">${article.title}</h1>
            <p class="article-head__standfirst">${content.standfirst}</p>
            <p class="article-head__meta">
              <time datetime="${article.date}">Publié le ${article.dateLabel}</time>
              <span aria-hidden="true">•</span>
              <span>${article.readingTime} de lecture</span>
            </p>
          </header>

          <figure class="media media--16x9 article__cover">
            <img src="${rel(D, `assets/images/${article.image}`)}" alt="${content.coverAlt}" width="1400" height="788" fetchpriority="high" decoding="async">
          </figure>

          <div class="prose u-mt-xl" id="article-body">
${content.html}

            <h2 id="faq">Questions fréquentes</h2>
            <div class="u-mt-md">
${faqAccordion(content.faq, `${article.slug}-faq`)}
            </div>
          </div>

          <div class="article-foot">
            <div class="callout callout--neutral">
              <p class="callout__title">${ICONS.help} Et pour votre cas&nbsp;?</p>
              <p>Cet article décrit des mécanismes généraux. Pour poser votre situation particulière, le <a href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">pré-diagnostic</a> prend cinq minutes, ou décrivez-la directement dans la <a href="${rel(D, 'pages/devis.html')}">demande d’expertise</a>.</p>
            </div>
          </div>
        </div>

        <aside class="article-aside">
          <nav class="toc" data-toc data-toc-scope="#article-body" aria-labelledby="toc-${article.slug}">
            <p class="toc__title" id="toc-${article.slug}">Sommaire</p>
            <ul class="toc__list" data-toc-list></ul>
          </nav>
          <div class="aside-card aside-card--accent">
            <p class="aside-card__title">Besoin d’un avis&nbsp;?</p>
            <p>Décrivez votre parquet et son problème&nbsp;: vous recevrez les éléments à vérifier en priorité.</p>
            <a class="btn btn--primary btn--sm btn--block" href="${rel(D, 'pages/devis.html')}">Demander une expertise</a>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="sec-head" data-reveal>
        <p class="kicker">À lire ensuite</p>
        <h2>Contenus associés</h2>
      </div>
      <div class="grid grid--3 u-mt-lg">
${others.map((item, index) => articleCard(D, item, index)).join('\n')}
      </div>
    </div>
  </section>

${ctaBand(D)}
`;

  return {
    path: `articles/${article.slug}.html`,
    depth: D,
    navCurrent: 'pages/conseils.html',
    title: article.title,
    description: content.standfirst.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').slice(0, 180),
    css: ['pages/home.css', 'pages/article.css'],
    ogImage: `assets/images/${article.image}`,
    lastmod: article.date,
    body,
    jsonLd: [
      crumb.jsonLd,
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: content.standfirst.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ''),
        image: `${SITE.baseUrl}/assets/images/${article.image}`,
        datePublished: article.date,
        dateModified: article.date,
        inLanguage: 'fr-FR',
        mainEntityOfPage: `${SITE.baseUrl}/articles/${article.slug}.html`,
        articleSection: article.category,
      },
      faqJsonLd(content.faq),
    ],
  };
}

export function articlePages() {
  return ARTICLES.map(renderArticle);
}
