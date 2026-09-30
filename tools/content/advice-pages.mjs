/**
 * Pages de catégorie « Conseils ». Chacune est un vrai contenu éditorial,
 * pas une simple liste de liens, et pointe vers les articles concernés.
 */

import { rel, breadcrumb } from '../layout.mjs';
import { ICONS, PROBLEMS, ctaBand, pageHero, PREMIBEL, premibelLink, orientationCommerciale } from '../partials.mjs';
import { relatedSection } from './graph.mjs';

const D = 2;

export const ADVICE_CATEGORIES = [
  {
    slug: 'entretien',
    tags: ['entretien', 'esthetique'],
    title: 'Entretien du parquet',
    h1: 'Entretenir un parquet sans l’abîmer',
    lead: 'L’entretien n’est pas un détail cosmétique&nbsp;: c’est ce qui décide de la durée de vie de la finition, et donc du moment où une rénovation deviendra nécessaire.',
    image: 'entretien.jpg',
    description:
      'Entretenir un parquet selon sa finition : vitrifié, huilé ou ciré. Gestes quotidiens, produits à éviter, fréquence d’entretien et signaux d’usure.',
    intro:
      'Sur un parquet, on n’entretient pas le bois&nbsp;: on entretient sa finition. C’est elle qui reçoit les rayures, absorbe les liquides et s’épuise avec le passage. Identifier sa nature est donc le préalable à tout geste.',
    sections: [
      {
        id: 'identifier',
        title: 'Identifier la finition avant tout',
        content: `<p>Trois familles de finition coexistent, avec des logiques d’entretien opposées.</p>
          <div class="table-scroll">
            <table>
              <thead><tr><th scope="col">Finition</th><th scope="col">Reconnaissance</th><th scope="col">Logique d’entretien</th></tr></thead>
              <tbody>
                <tr><td>Vitrifiée</td><td>Film continu en surface, l’eau perle</td><td>Nettoyage doux, aucune couche à nourrir</td></tr>
                <tr><td>Huilée</td><td>Aspect mat, toucher bois, l’eau pénètre légèrement</td><td>Nettoyage adapté puis renourrissage périodique</td></tr>
                <tr><td>Cirée</td><td>Aspect satiné profond, la cire se marque à l’ongle</td><td>Entretien à la cire, très sensible à l’eau</td></tr>
              </tbody>
            </table>
          </div>
          <p>Un test simple&nbsp;: déposez une goutte d’eau dans un coin discret. Si elle reste en perle plusieurs minutes, la finition est probablement vitrifiée et en bon état. Si elle s’étale et pénètre, la protection est huilée, cirée, ou vitrifiée mais usée.</p>`,
      },
      {
        id: 'quotidien',
        title: 'Les gestes qui comptent vraiment',
        content: `<ul class="rich-list rich-list--check">
            <li>Dépoussiérer régulièrement&nbsp;: la poussière et le sable sont abrasifs, ce sont eux qui rayent.</li>
            <li>Passer une serpillière bien essorée, jamais détrempée&nbsp;: l’eau est l’ennemi principal.</li>
            <li>Protéger les pieds de meubles avec des patins feutre, et les changer quand ils s’encrassent.</li>
            <li>Placer un tapis à l’entrée&nbsp;: il retient les gravillons avant qu’ils n’arrivent sur le parquet.</li>
            <li>Essuyer immédiatement tout liquide renversé, sans laisser le temps à la pénétration.</li>
          </ul>`,
      },
      {
        id: 'eviter',
        title: 'Ce qui abîme sans qu’on s’en aperçoive',
        content: `<ul>
            <li><strong>Le lavage à grande eau.</strong> L’eau s’infiltre entre les lames, gonfle le bois par les chants et finit par ouvrir les joints.</li>
            <li><strong>Les nettoyants universels.</strong> Beaucoup sont alcalins&nbsp;: ils attaquent progressivement les finitions.</li>
            <li><strong>Le vinaigre blanc.</strong> Populaire mais acide&nbsp;: il ternit les vitrifications à la longue.</li>
            <li><strong>Les vapeurs.</strong> Un nettoyeur vapeur combine chaleur et eau, la pire association pour un parquet.</li>
            <li><strong>Les roulettes dures.</strong> Une chaise de bureau sans tapis de protection use une vitrification en quelques mois.</li>
          </ul>`,
      },
      {
        id: 'signaux',
        title: 'Les signaux qui annoncent une rénovation',
        content: `<p>Une finition ne meurt pas d’un coup&nbsp;: elle prévient. Trois signaux méritent attention.</p>
          <ul>
            <li>Des <strong>zones mates</strong> apparaissent dans les couloirs de passage alors que le reste reste brillant.</li>
            <li>L’eau ne <strong>perle plus</strong> aux endroits sollicités&nbsp;: la protection n’est plus continue.</li>
            <li>Les <strong>taches s’installent</strong> plus vite qu’avant, et partent moins bien.</li>
          </ul>
          <p>À ce stade, une remise en état légère suffit souvent. Attendre davantage, c’est laisser le bois se salir en profondeur et transformer un entretien en ponçage.</p>`,
      },
    ],
    related: ['finition-parquet-huile-vitrifie', 'renover-un-parquet-tres-abime', 'traces-noires-sur-un-parquet'],
    problems: ['parquet-abime'],
  },
  {
    /* Orientation commerciale DESACTIVEE ici, a dessein.
       Ces deux pages portent deja DEUX liens editoriaux vers Premibel, et la
       regle que le projet s'est donnee (voir PREMIBEL dans tools/partials.mjs)
       plafonne a deux liens par page. Un troisieme ferait basculer une page de
       conseil en page d'apport d'affaires. Le mecanisme reste en place : passer
       cette ligne a `true` suffit si la regle change.
       remplacement: true, */
    slug: 'renovation',
    tags: ['renovation', 'esthetique', 'choix'],
    title: 'Rénovation de parquet',
    h1: 'Rénover un parquet&nbsp;: ce qui se décide avant de poncer',
    lead: 'Rénover, réparer ponctuellement ou remplacer&nbsp;? La réponse tient à trois mesures et à une question&nbsp;: la cause du désordre a-t-elle été traitée&nbsp;?',
    image: 'parquet-ancien.jpg',
    description:
      'Rénover un parquet : épaisseur utile, état du support, faisabilité du ponçage. Comment arbitrer entre rénovation, réparation partielle et remplacement.',
    intro:
      'La rénovation d’un parquet n’est pas une opération esthétique&nbsp;: c’est une décision technique qui engage le sol pour dix ou vingt ans. Trois éléments la conditionnent, et aucun n’est visible depuis la surface.',
    sections: [
      {
        id: 'epaisseur',
        title: 'Premier critère&nbsp;: l’épaisseur utile',
        content: `<p>Poncer, c’est retirer de la matière. La question n’est donc pas « peut-on poncer&nbsp;? » mais « combien reste-t-il à retirer&nbsp;? ».</p>
          <ul>
            <li><strong>Massif.</strong> L’épaisseur au-dessus des rainures autorise généralement plusieurs rénovations successives.</li>
            <li><strong>Contrecollé.</strong> Seule la couche noble supérieure est ponçable. Sa mesure décide de tout.</li>
            <li><strong>Stratifié.</strong> Aucun ponçage possible&nbsp;: la couche décorative est un film imprimé.</li>
          </ul>
          <p>La mesure se fait au niveau d’un point où l’épaisseur est visible&nbsp;: seuil de porte, bouche d’aération, découpe autour d’un tuyau.</p>`,
      },
      {
        id: 'support',
        title: 'Deuxième critère&nbsp;: l’état du support',
        content: `<p>Un parquet rénové sur un support défaillant reproduira ses désordres. Avant tout ponçage, trois contrôles s’imposent&nbsp;: planéité, siccité, adhérence. Ce sont exactement les mêmes que pour une pose neuve — le sujet est développé dans notre article sur <a href="${rel(D, 'articles/pourquoi-le-support-est-essentiel.html')}">le rôle du support</a>.</p>`,
      },
      {
        id: 'cause',
        title: 'Troisième critère&nbsp;: la cause a-t-elle été traitée&nbsp;?',
        content: `<p>C’est le critère le plus souvent oublié, et le plus coûteux quand il l’est. Rénover un parquet gondolé par une remontée d’humidité non traitée revient à programmer le même désordre, généralement plus vite que la première fois.</p>
          <div class="callout callout--warning">
            <p class="callout__title">${ICONS.alert} Ordre des opérations</p>
            <p>Identifier la cause → la traiter → laisser le support revenir à un état stable → seulement ensuite, rénover. Inverser cet ordre est la première source de rénovations refaites deux fois.</p>
          </div>`,
      },
      {
        id: 'arbitrer',
        title: 'Arbitrer entre les trois voies',
        content: `<div class="table-scroll">
            <table>
              <thead><tr><th scope="col">Situation</th><th scope="col">Voie généralement adaptée</th></tr></thead>
              <tbody>
                <tr><td>Finition usée, bois sain, épaisseur suffisante</td><td>Rénovation de la finition, avec ou sans ponçage complet</td></tr>
                <tr><td>Quelques lames dégradées, reste en bon état</td><td>Remplacement ponctuel, avec la difficulté de la teinte</td></tr>
                <tr><td>Épaisseur insuffisante ou support à reprendre</td><td>Remplacement, après traitement de la cause</td></tr>
                <tr><td>Stratifié abîmé</td><td>Remplacement des lames ou de la surface</td></tr>
              </tbody>
            </table>
          </div>
          <p>Lorsque le remplacement s’impose, le choix du nouveau revêtement se pose&nbsp;: essence, épaisseur, type de pose et compatibilité avec le support. Deux familles couvrent la quasi-totalité des remplacements en rénovation — le ${premibelLink(PREMIBEL.massif, 'parquet massif')}, qui se reponcera plus tard, et le ${premibelLink(PREMIBEL.contrecolle, 'contrecollé')}, plus tolérant sur un support existant. Ces caractéristiques sont utiles à comparer une fois la cause du désordre traitée, pas avant.</p>`,
      },
    ],
    related: ['renover-un-parquet-tres-abime', 'massif-ou-contrecolle', 'finition-parquet-huile-vitrifie'],
    problems: ['parquet-abime', 'parquet-gondole'],
  },
  {
    slug: 'pose',
    tags: ['pose', 'support', 'structure', 'mesure'],
    title: 'Pose de parquet',
    h1: 'Pose de parquet&nbsp;: ce qui se joue avant la première lame',
    lead: 'La grande majorité des désordres de parquet trouvent leur origine dans les heures qui précèdent la pose, pas dans celles qui la suivent.',
    image: 'pose-support.jpg',
    description:
      'Pose de parquet : préparation du support, acclimatation du bois, jeux de dilatation, types de pose. Les conditions qui déterminent la tenue dans le temps.',
    intro:
      'Une pose réussie tient à un enchaînement de conditions vérifiables. Aucune n’est spectaculaire, toutes sont décisives — et leur absence ne se voit qu’après coup.',
    sections: [
      {
        id: 'support',
        title: 'Le support&nbsp;: trois contrôles non négociables',
        content: `<ul>
            <li><strong>Planéité.</strong> Un support hors tolérance laisse des lames sans appui. Le contrôle se fait à la règle, sur plusieurs directions.</li>
            <li><strong>Siccité.</strong> Un support encore humide relargue son eau dans le revêtement pendant des mois. La mesure est indispensable, l’estimation visuelle ne vaut rien.</li>
            <li><strong>Propreté et cohésion.</strong> Poussière, laitance, résidus de colle&nbsp;: rien n’adhère sur un support non préparé.</li>
          </ul>`,
      },
      {
        id: 'acclimatation',
        title: 'L’acclimatation du bois',
        content: `<p>Le bois livré n’a pas le même taux d’humidité que la pièce où il sera posé. Le laisser s’équilibrer avant la pose évite qu’il ne le fasse après — auquel cas il gonfle ou se rétracte une fois immobilisé.</p>
          <p>Deux conditions&nbsp;: la pièce doit être dans son état d’usage normal (chauffée, ventilée, hors d’air et hors d’eau), et le délai doit être respecté même si le planning presse. C’est le poste le plus souvent sacrifié sur un chantier tendu.</p>`,
      },
      {
        id: 'jeux',
        title: 'Les jeux de dilatation',
        content: `<p>Un parquet doit pouvoir bouger. C’est la condition de sa survie, pas une tolérance esthétique.</p>
          <ul class="rich-list rich-list--check">
            <li>Jeu périphérique le long de tous les murs et obstacles fixes.</li>
            <li>Jeu autour des tuyaux, poteaux, seuils et huisseries.</li>
            <li>Joints de fractionnement sur les grandes surfaces et entre pièces.</li>
            <li>Plinthes qui recouvrent le jeu sans le bloquer.</li>
          </ul>
          <p>Un parquet dont le jeu est comblé, obstrué ou inexistant se soulève à la première variation d’hygrométrie. Voir <a href="${rel(D, 'pages/problemes/parquet-gondole.html')}">parquet qui gondole</a>.</p>`,
      },
      {
        id: 'types',
        title: 'Trois types de pose, trois logiques',
        content: `<div class="table-scroll">
            <table>
              <thead><tr><th scope="col">Type de pose</th><th scope="col">Principe</th><th scope="col">Point de vigilance</th></tr></thead>
              <tbody>
                <tr><td>Collée</td><td>Le parquet est solidaire du support</td><td>Planéité et siccité du support, choix de la colle</td></tr>
                <tr><td>Flottante</td><td>Les lames s’assemblent entre elles, libres du support</td><td>Qualité de la sous-couche, jeux périphériques</td></tr>
                <tr><td>Clouée</td><td>Fixation mécanique sur lambourdes ou solives</td><td>État et espacement de la structure porteuse</td></tr>
              </tbody>
            </table>
          </div>
          <p>Le choix n’est pas libre&nbsp;: il découle du support, du type de parquet et de la présence éventuelle d’un plancher chauffant.</p>`,
      },
    ],
    related: ['reception-chantier-parquet', 'parquet-et-plancher-chauffant', 'pourquoi-le-support-est-essentiel'],
    problems: ['defaut-de-pose', 'parquet-gondole'],
  },
  {
    /* Orientation commerciale DESACTIVEE ici, a dessein.
       Ces deux pages portent deja DEUX liens editoriaux vers Premibel, et la
       regle que le projet s'est donnee (voir PREMIBEL dans tools/partials.mjs)
       plafonne a deux liens par page. Un troisieme ferait basculer une page de
       conseil en page d'apport d'affaires. Le mecanisme reste en place : passer
       cette ligne a `true` suffit si la regle change.
       remplacement: true, */
    slug: 'choisir-parquet',
    tags: ['choix', 'structure', 'pose'],
    title: 'Choisir un parquet',
    h1: 'Choisir un parquet&nbsp;: ce qui distingue réellement les familles',
    lead: 'Massif, contrecollé, stratifié&nbsp;: les trois mots reviennent partout, souvent mal employés. La différence n’est pas une question de gamme mais de structure — et elle décide de tout le reste.',
    image: 'interieur-clair.jpg',
    description:
      'Massif, contrecollé, stratifié&nbsp;: différences réelles, aptitude au ponçage, compatibilité avec le plancher chauffant et critères de choix par pièce.',
    intro:
      'Avant d’esthétique, un choix de parquet est un choix de structure. C’est elle qui détermine si le sol pourra être rénové, s’il supportera un plancher chauffant, et comment il vieillira.',
    sections: [
      {
        id: 'familles',
        title: 'Trois structures, pas trois qualités',
        content: `<div class="table-scroll">
            <table>
              <thead><tr><th scope="col">Famille</th><th scope="col">Structure</th><th scope="col">Ponçable</th></tr></thead>
              <tbody>
                <tr><td>Parquet massif</td><td>Une seule essence dans toute l’épaisseur</td><td>Oui, plusieurs fois selon l’épaisseur</td></tr>
                <tr><td>Parquet contrecollé</td><td>Couche noble sur support en couches croisées</td><td>Oui, selon l’épaisseur de la couche noble</td></tr>
                <tr><td>Stratifié</td><td>Décor imprimé sous résine, sur panneau</td><td>Non</td></tr>
              </tbody>
            </table>
          </div>
          <div class="callout callout--slate">
            <p class="callout__title">${ICONS.help} Précision de vocabulaire</p>
            <p>Le stratifié n’est pas un parquet au sens réglementaire du terme&nbsp;: sa surface n’est pas du bois. Cela n’en fait pas un mauvais produit, mais cela change radicalement ce qu’on peut en attendre dans le temps.</p>
          </div>`,
      },
      {
        id: 'piece',
        title: 'Le critère de la pièce',
        content: `<ul>
            <li><strong>Séjour, chambre.</strong> Peu de contraintes hydriques&nbsp;: le choix se fait surtout sur l’esthétique et la durabilité souhaitée.</li>
            <li><strong>Cuisine.</strong> Projections fréquentes&nbsp;: la finition et sa maintenance comptent plus que l’essence.</li>
            <li><strong>Salle de bain.</strong> Environnement exigeant&nbsp;: essences et mises en œuvre spécifiques, ventilation déterminante.</li>
            <li><strong>Couloir, entrée.</strong> Passage concentré&nbsp;: c’est là que la finition s’épuise en premier.</li>
          </ul>`,
      },
      {
        id: 'chauffant',
        title: 'Le cas du plancher chauffant',
        content: `<p>Un plancher chauffant impose des contraintes strictes et cumulatives&nbsp;: épaisseur limitée, essences à faible variation dimensionnelle, résistance thermique du complexe, type de pose imposé, protocole de mise en chauffe à respecter avant et après la pose.</p>
          <p>Ce n’est pas un détail de mise en œuvre&nbsp;: c’est un cadre technique qui restreint fortement les options. Le vérifier avant de choisir évite de devoir renoncer à un produit déjà commandé.</p>`,
      },
      {
        id: 'ou-regarder',
        title: 'Où trouver les données techniques',
        content: `<p>Les critères qui comptent — épaisseur totale, épaisseur de couche noble, essence, format, finition d’origine, compatibilité plancher chauffant, type de pose admis — figurent dans les fiches techniques produit. C’est sur ces données qu’un choix se construit, pas sur une photo d’ambiance. Pour comparer concrètement essences, formats et finitions une fois ces critères posés, les catalogues des distributeurs spécialisés les publient référence par référence&nbsp;: ${premibelLink(PREMIBEL.massif, 'parquets massifs')} et ${premibelLink(PREMIBEL.contrecolle, 'contrecollés')} chez Premibel, par exemple.</p>
          <p>Un dernier conseil&nbsp;: si le parquet remplace un revêtement qui a posé problème, réglez la question de la cause avant celle du produit. Un excellent parquet posé sur un support défaillant se comportera comme un mauvais.</p>`,
      },
    ],
    related: ['massif-ou-contrecolle', 'finition-parquet-huile-vitrifie', 'parquet-et-plancher-chauffant'],
    problems: ['defaut-de-pose'],
  },
];

function renderCategory(category) {
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Conseils', href: 'pages/conseils.html' },
    { label: category.title },
  ]);

  const sections = category.sections
    .map(
      (section) => `          <h2 id="${section.id}">${section.title}</h2>
          ${section.content}`
    )
    .join('\n\n');

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'Conseils',
    title: category.h1,
    lead: category.lead,
    image: category.image,
  })}

  <section class="section">
    <div class="container">
      <div class="article-layout">
        <div class="prose" id="article-body">
          <p class="lead">${category.intro}</p>

${sections}

${category.remplacement ? orientationCommerciale(D, { campagne: `conseils-${category.slug}` }) : ''}
        </div>

        <aside class="article-aside">
          <nav class="toc" data-toc data-toc-scope="#article-body" aria-labelledby="toc-${category.slug}">
            <details class="toc__box">
              <summary class="toc__title" id="toc-${category.slug}">Sur cette page</summary>
              <ul class="toc__list" data-toc-list></ul>
            </details>
          </nav>
          <div class="aside-card aside-card--accent">
            <p class="aside-card__title">Un doute sur votre situation&nbsp;?</p>
            <p>Le pré-diagnostic pose le contexte en cinq questions.</p>
            <a class="btn btn--primary btn--sm btn--block" href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">Décrire mon problème</a>
          </div>
          ${category.problems.length ? `<div class="aside-card">
            <p class="aside-card__title">Symptômes liés</p>
            <p>${category.problems
              .map((slug) => {
                const problem = PROBLEMS.find((item) => item.slug === slug);
                return `<a class="link" href="${rel(D, `pages/problemes/${slug}.html`)}">${problem ? problem.label : slug}</a>`;
              })
              .join('<br>')}</p>
          </div>` : ''}
        </aside>
      </div>
    </div>
  </section>

${relatedSection(D, { type: 'conseil', slug: category.slug }, { kicker: 'À lire ensuite' })}

${ctaBand(D)}
`;

  return {
    path: `pages/conseils/${category.slug}.html`,
    depth: D,
    navCurrent: 'pages/conseils.html',
    title: category.title,
    description: category.description,
    css: ['pages/home.css', 'pages/article.css'],
    ogImage: `assets/images/${category.image}`,
    body,
    jsonLd: [crumb.jsonLd],
  };
}

export function advicePages() {
  return ADVICE_CATEGORIES.map(renderCategory);
}
