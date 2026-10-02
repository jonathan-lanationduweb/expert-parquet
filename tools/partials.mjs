/**
 * Blocs réutilisables partagés par plusieurs pages (outillage de build).
 *
 * Principe de la direction artistique : très peu de composants, mais des
 * composants de grande échelle. Pas de grille de petites cartes.
 */

import { rel } from './layout.mjs';
import { photo, photoData, estClaire } from './images.mjs';
/* Même configuration que celle servie au navigateur : un seul interrupteur. */
import { formMode, CONTACT, SITE, RGPD, ORIENTATION, partnerFor, partnerUrl } from '../js/config/site.js';
import { orientation, BESOINS } from '../js/config/orientation-rules.js';

/* --------------------------------------------------------------- icônes
   Jeu réduit au strict nécessaire : flèches, validation, alerte, question.
   Les pictogrammes décoratifs de l'ancienne version ont été supprimés. */

/**
 * Jeu d'icônes, cinq formes dessinées pour ce projet.
 *
 * Les attributs `width` et `height` sont OBLIGATOIRES, pas décoratifs.
 * `css/reset.css` applique `display: block; max-width: 100%; height: auto` à
 * tous les `svg`. Un SVG qui n'a qu'un `viewBox`, sans dimension intrinsèque,
 * se comporte alors comme un bloc de largeur automatique : il occupe TOUTE la
 * largeur de son conteneur et sa hauteur suit le rapport du viewBox. Un icône
 * de 16 px dans un paragraphe de 832 px se retrouvait affiché en 832 × 832.
 *
 * Ces attributs donnent la taille intrinsèque ; toute règle CSS qui fixe
 * `width`/`height` (`.callout__title svg`, `.showcase__btn svg`…) continue de
 * l'emporter. Ne jamais retirer ces attributs.
 */
export const ICONS = {
  arrowRight:
    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="square" aria-hidden="true"><path d="M3 9h12M10.5 4.5 15 9l-4.5 4.5"/></svg>',
  arrowLeft:
    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="square" aria-hidden="true"><path d="M15 9H3M7.5 4.5 3 9l4.5 4.5"/></svg>',
  check:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square" aria-hidden="true"><path d="m3 8.5 3.5 3.5L13 4.5"/></svg>',
  alert:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square" aria-hidden="true"><path d="M8 2 1.5 14h13z"/><path d="M8 6.5v3.2M8 12h.01"/></svg>',
  help:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square" aria-hidden="true"><circle cx="8" cy="8" r="6.2"/><path d="M6.3 6.3a1.75 1.75 0 1 1 2.4 1.6c-.5.2-.7.6-.7 1.1v.2"/><path d="M8 11.6h.01"/></svg>',
  search:
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square" aria-hidden="true"><circle cx="7.2" cy="7.2" r="5"/><path d="m13.5 13.5-2.7-2.7"/></svg>',
};

/* ------------------------------------------------------------------ Premibel
   Destinations éditoriales vers le distributeur partenaire.

   Règles tenues, dans cet ordre :
   - le lien n'arrive QU'APRÈS que la cause du désordre a été traitée dans le
     texte, c'est-à-dire au moment où le lecteur choisit réellement un produit ;
   - zéro à deux liens par page, jamais un par paragraphe ;
   - l'ancre décrit la destination, elle n'est pas optimisée pour un mot-clé ;
   - aucune catégorie n'est inventée : les URL ci-dessous ont été relevées dans
     la navigation du site et vérifiées une à une (HTTP 200, le 11/09/2026).

   `parquet-flottant` est bien la catégorie des contrecollés : c'est le nom
   qu'emploie Premibel, dont le titre de page est « Parquet flottant et
   contrecollé ». Ne pas le remplacer par une URL devinée.
*/
export const PREMIBEL = {
  accueil: 'https://premibel.fr/',
  massif: 'https://premibel.fr/parquet-massif/',
  contrecolle: 'https://premibel.fr/parquet-flottant/',
  stratifie: 'https://premibel.fr/parquet-sol-stratifie/',
  chene: 'https://premibel.fr/chene/',
  finitionHuile: 'https://premibel.fr/huile/',
  finitionVernie: 'https://premibel.fr/verni/',
  conseils: 'https://premibel.fr/astuces-conseils/',
};

/**
 * Lien sortant contextuel, dans le corps du texte.
 *
 * `sponsored` n'est pas décoratif. Expert Parquet entretient une relation
 * commerciale avec les enseignes vers lesquelles il oriente : ne pas le
 * déclarer sur un lien sortant, c'est exactement ce que les moteurs appellent
 * un lien non divulgué. Les boutons le portaient déjà ; les liens de
 * paragraphe ne l'avaient pas, alors qu'ils mènent au même endroit pour la
 * même raison.
 *
 * `noopener` reste sans `target` : la navigation se fait dans le même onglet,
 * il n'y a donc aucune fenêtre à isoler — l'attribut demeure au cas où un
 * `target` serait ajouté un jour.
 *
 * Les attributs de mesure sont présents mais marqués `editorial` : un lien lu
 * dans une phrase ne vaut pas un bouton de fin de page, et mélanger les deux
 * rendrait tout comptage faux.
 */
export function premibelLink(url, texte, contexte = 'editorial') {
  return `<a href="${url}" rel="sponsored noopener" data-event="commercial_orientation"`
    + ` data-destination="premibel" data-besoin="selection" data-lien="editorial"`
    + ` data-context="${contexte}">${texte}</a>`;
}

/* ------------------------------------------------- orientation commerciale
   Le pendant statique de ce que le pré-diagnostic construit à l'exécution.

   Une page servie ne sait pas QUI la lit : elle n'a ni profil, ni surface, ni
   délai. Le moteur (js/config/orientation-rules.js) reçoit donc le seul
   critère disponible — le problème traité par la page — et rend la destination
   ouverte à tous. Le cas à deux enseignes, lui, n'apparaît que là où le
   visiteur a dit qui il est : le pré-diagnostic et l'après-devis.

   Aucun JavaScript n'est nécessaire ici : la destination est un lien ordinaire.
   Quand le moteur n'en retient aucune, une phrase le dit — jamais un bouton
   mort. */

export function orientationCommerciale(depth, { campagne, compact = false, titre, intro, besoin, profil } = {}) {
  /* Le HTML servi porte le repli SANS JavaScript : un lien vers l'enseigne
     ouverte à tous. Le mini-routeur le remplace dès qu'il s'installe. Personne
     ne tombe donc sur un bloc muet, et personne n'a de formulaire à remplir
     pour franchir la porte. */
  const repli = orientation({ need: besoin || BESOINS.SELECTION });
  const cle = repli.destinations[0];
  const partenaire = cle ? partnerFor(cle) : null;
  const url = cle ? partnerUrl(cle, campagne) : null;

  const lienDeRepli = url
    ? `        <a class="btn btn--outline btn--sm" href="${url.replace(/&/g, '&amp;')}" rel="sponsored noopener"`
      + ` data-event="commercial_orientation"`
      + ` data-destination="${cle === 'overparquet' ? 'over-parquet' : cle}"`
      + ` data-context="${campagne}">${ORIENTATION.action.replace('%s', partenaire.nom)}</a>
`
    : '';

  const attributs = [
    `data-orientation-routeur="${campagne}"`,
    /* Le routeur est en JavaScript et ne sait pas où il est servi : la
       profondeur de la page se résout ici, une bonne fois. */
    `data-expertise-url="${rel(depth, 'pages/diagnostic.html')}#pre-diagnostic"`,
    besoin ? `data-besoin="${besoin}"` : '',
    profil ? `data-profil="${profil}"` : '',
  ].filter(Boolean).join(' ');

  return `      <div class="callout callout--neutral${compact ? '' : ' u-mt-lg'}" data-orientation>
        <p class="callout__title">${titre || ORIENTATION.titre}</p>
${compact ? '' : `        <p>${intro || ORIENTATION.intro}</p>
`}        <div class="orientation" ${attributs}>
${lienDeRepli}        </div>
        <p class="disclaimer u-mt-sm">${ORIENTATION.mention}</p>
      </div>`;
}



/* --------------------------------------------------- solutions partenaires
   Le bloc qui NOMME les enseignes.

   Le mini-routeur demande au visiteur ce qu'il veut faire ; celui-ci part de
   l'autre bout et dit ce qui existe. Quand quelqu'un sait déjà qu'il cherche
   un parquet, lui poser une question de plus est une politesse inutile : deux
   noms, deux métiers, deux liens.

   Les deux enseignes ne reçoivent PAS le même traitement, parce qu'elles ne
   couvrent pas le même monde. Premibel accueille les particuliers comme les
   professionnels et répond au choix : elle est en tête, en bouton plein.
   Over Parquet est réservé aux professionnels sur justificatif d'entreprise —
   l'annoncer en gros à un particulier serait l'envoyer contre une porte
   fermée. Elle est donc présentée pour ce qu'elle est, étiquetée, en second.

   Aucun formulaire, aucune donnée demandée : ces liens partent directement. */

export function solutionsPartenaires(
  depth,
  { campagne, titre = null, kicker = null, intro = null, compact = false, textes = {} } = {}
) {
  /* `textes` permet à une page de reformuler une carte — l'accueil, par
     exemple, dit la même chose en moins de mots — sans toucher aux libellés
     de référence ci-dessous, relevés sur les sites des enseignes. Seuls
     `pour`, `texte` et `action` sont remplaçables : l'enseigne, son audience
     et la mesure ne se reformulent pas. */
  const cartes = [
    {
      cle: 'premibel',
      pour: 'Particuliers et professionnels',
      texte: 'Le choix, le conseil et le showroom&nbsp;: plus de 700 références, toutes finitions, des experts pour comparer avant de décider.',
      action: 'Découvrir les parquets',
      classe: 'btn btn--primary btn--block',
      profil: '',
    },
    {
      cle: 'overparquet',
      pour: 'Professionnels — chantiers',
      texte: 'L’approvisionnement&nbsp;: stock immédiat, retrait rapide et tarifs professionnels. Inscription sur justificatif d’entreprise.',
      action: 'Approvisionner mon chantier',
      classe: 'btn btn--outline btn--block',
      profil: 'professionnel',
    },
  ].map((c) => {
    const t = textes[c.cle] || {};
    return { ...c, pour: t.pour || c.pour, texte: t.texte || c.texte, action: t.action || c.action };
  });

  const rendues = cartes
    .map((c) => {
      const partenaire = partnerFor(c.cle);
      const url = partenaire ? partnerUrl(c.cle, campagne, c.profil) : null;
      /* Une enseigne non configurée ne laisse pas un bouton mort : elle
         disparaît, tout simplement. */
      if (!url) return '';
      return `          <div class="solution">
            <p class="solution__nom">${partenaire.nom}</p>
            <p class="solution__pour">${c.pour}</p>
            <p class="solution__texte">${c.texte}</p>
            <a class="${c.classe}" href="${url.replace(/&/g, '&amp;')}" rel="sponsored noopener"`
        + ` data-event="commercial_orientation" data-destination="${c.cle === 'overparquet' ? 'over-parquet' : c.cle}"`
        + ` data-besoin="${c.cle === 'overparquet' ? 'supply' : 'selection'}" data-context="${campagne}">${c.action}</a>
          </div>`;
    })
    .filter(Boolean);

  if (rendues.length === 0) return '';

  const entete = compact
    ? `      <p class="kicker">${titre || 'Trouver le parquet adapté'}</p>
${intro ? `      <p class="solutions__intro">${intro}</p>` : ''}`
    : sectionHead({
      kicker: kicker || 'Où trouver votre parquet',
      title: titre || 'Trouver le parquet adapté',
      text: intro || 'Expert Parquet ne vend pas de parquet. Nous vous orientons vers l’enseigne qui correspond à votre projet — sans formulaire, sans inscription.',
    });

  return `${entete}
      <div class="solutions u-mt-lg" data-reveal>
${rendues.join('\n')}
      </div>`;
}


/* ------------------------------------------------------ bloc remplacement
   La sortie des pages problème quand le remplacement est plausible.

   Ces pages sont les meilleures portes d'entrée du site : quelqu'un qui
   cherche « parquet gondolé » a un problème réel et immédiat. Jusqu'ici elles
   ne proposaient qu'une chose — faire expertiser. C'est la bonne réponse
   lorsqu'on peut réparer ; c'en est une mauvaise quand la page vient
   d'expliquer que le parquet est probablement perdu.

   Le bloc dit donc l'hypothèse à voix haute, et donne la suite : choisir un
   parquet chez Premibel. Il ne prétend pas conclure — la page entière répète
   que seule une observation tranche — mais il cesse de faire semblant que
   l'expertise est la seule issue.

   Over Parquet n'apparaît QUE si la page concerne réellement un contexte
   professionnel. Proposer une enseigne fermée aux particuliers sur une page
   lue par des particuliers reviendrait à pousser un domaine, pas à aider. */

export function blocRemplacement(depth, {
  campagne,
  pro = false,
  titre = 'Votre parquet doit peut-être être remplacé&nbsp;?',
  texte = 'Si l’état constaté ne laisse plus de matière à travailler, la question n’est plus de réparer mais de choisir. Premibel accueille particuliers et professionnels&nbsp;: showroom, conseil et plus de 700 références, sans formulaire ni inscription.',
  action = 'Choisir un nouveau parquet chez Premibel',
  secondaire = 'Faire expertiser avant de décider',
} = {}) {
  const premibel = partnerFor('premibel');
  const url = premibel ? partnerUrl('premibel', campagne) : null;
  if (!url) return '';

  const lignes = [];
  lignes.push('          <div class="remplacement" data-reveal>');
  lignes.push('            <p class="remplacement__titre">' + titre + '</p>');
  lignes.push('            <p class="remplacement__texte">' + texte + '</p>');
  lignes.push('            <div class="remplacement__actions">');
  lignes.push('              <a class="btn btn--primary" href="' + url.replace(/&/g, '&amp;') + '" rel="sponsored noopener"'
    + ' data-event="commercial_orientation" data-destination="premibel" data-besoin="selection"'
    + ' data-context="' + campagne + '">' + action + '</a>');
  if (secondaire) {
    lignes.push('              <a class="btn btn--outline btn--sm" href="' + rel(depth, 'pages/devis.html') + '">' + secondaire + '</a>');
  }
  lignes.push('            </div>');

  if (pro) {
    const over = partnerFor('overparquet');
    const urlPro = over ? partnerUrl('overparquet', campagne, 'professionnel') : null;
    if (urlPro) {
      lignes.push('            <p class="remplacement__pro">Vous êtes professionnel et devez approvisionner un chantier&nbsp;? '
        + '<a href="' + urlPro.replace(/&/g, '&amp;') + '" rel="sponsored noopener"'
        + ' data-event="commercial_orientation" data-destination="over-parquet" data-besoin="supply"'
        + ' data-customer-type="professionnel" data-context="' + campagne + '">Over Parquet</a>'
        + ' fournit le stock et les tarifs professionnels.</p>');
    }
  }

  lignes.push('          </div>');
  return lignes.join(String.fromCharCode(10));
}


/* ------------------------------------------------- catalogue des problèmes
   Sert à la fois à la liste éditoriale de la page d'accueil, au hub
   « Problèmes » et aux liens contextuels. */

export const PROBLEMS = [
  {
    slug: 'parquet-qui-grince',
    label: 'Parquet qui grince',
    teaser: 'Un frottement, rarement le bois lui-même.',
    image: 'grincement.jpg',
  },
  {
    slug: 'parquet-gondole',
    label: 'Parquet qui se soulève',
    teaser: 'Le bois a gonflé sans avoir où s’étendre.',
    image: 'soulevement.jpg',
  },
  {
    slug: 'lames-qui-bougent',
    label: 'Lames qui bougent',
    teaser: 'Le revêtement n’est plus solidaire de son support.',
    image: 'lames-bougent.jpg',
  },
  {
    slug: 'humidite',
    label: 'Humidité',
    teaser: 'Remontée, condensation ou infiltration&nbsp;: trois réponses différentes.',
    image: 'parquet-chevrons.jpg',
  },
  {
    slug: 'degat-des-eaux',
    label: 'Dégât des eaux',
    teaser: 'L’état visible ne dit rien de l’état du support.',
    image: 'rayures.jpg',
  },
  {
    slug: 'defaut-de-pose',
    label: 'Défaut de pose',
    teaser: 'Des symptômes réguliers sur toute la surface.',
    image: 'pose-support.jpg',
  },
  {
    slug: 'parquet-abime',
    label: 'Taches et rayures',
    teaser: 'La profondeur de l’atteinte détermine la solution.',
    image: 'taches.jpg',
  },
  {
    slug: 'parquet-abime',
    label: 'Parquet ancien',
    teaser: 'Patine ou dégradation&nbsp;: tout se joue sur l’épaisseur utile.',
    image: 'parquet-ancien.jpg',
    key: 'parquet-ancien',
  },
];

/**
 * Liste éditoriale numérotée, avec vignette révélée au survol.
 *
 * `collapse` active la divulgation progressive : sur petit écran seulement, les
 * `collapse` premières entrées restent visibles et les suivantes passent en
 * `hidden`, un bouton les révélant d'un geste. Le contenu reste DANS le
 * document — il est donc lu par les moteurs, qui rendent le HTML — et
 * l'intégralité de la liste réapparaît au-delà du point de rupture.
 */
/** Largeur d'affichage de la vignette de survol, partagée par toutes ses données. */
const APERCU_SIZES = '300px';

export function indexList(
  depth,
  { items = PROBLEMS, id = 'problemes-index', collapse = null, moreLabel = null } = {}
) {
  const rows = items
    .map((item, index) => {
      const num = String(index + 1).padStart(2, '0');
      /* La vignette de survol est remplacée par le script : il lui faut TOUTES
         les données de l'image, pas seulement son `src`. Un `srcset` présent
         l'emporte sur `src` — changer le seul `src` ne changeait rien à
         l'écran. Les attributs sont produits par tools/images.mjs, jamais
         écrits à la main dans le JavaScript. */
      const vignette = photoData(depth, item.image, { sizes: APERCU_SIZES, alt: '' });
      return `        <a class="index-row" href="${rel(depth, `pages/problemes/${item.slug}.html`)}" data-index-item data-preview-src="${vignette.src}" data-preview-srcset="${vignette.srcset || ''}" data-preview-w="${vignette.width}" data-preview-h="${vignette.height}">
          <span class="index-row__num">${num}</span>
          <span class="index-row__title">${item.label}</span>
          <span class="index-row__text">${item.teaser}</span>
          <span class="index-row__arrow" aria-hidden="true"></span>
        </a>`;
    })
    .join('\n');

  const list = `      <div class="index-list" data-index-list id="${id}">
${rows}
        <div class="index-list__preview" data-index-preview aria-hidden="true">${photo(depth, items[0].image, { sizes: APERCU_SIZES, alt: '' })}</div>
      </div>`;

  if (!collapse || collapse >= items.length) return list;

  const reste = items.length - collapse;
  const label = moreLabel || `Voir les ${reste} autres`;
  return `${list}
${revealMore({ target: id, count: collapse, label, itemSelector: '.index-row' })}`;
}

/**
 * Bouton « voir la suite » d'une liste repliée sur petit écran.
 *
 * Le bouton est émis DANS le HTML plutôt qu'inséré par le script : inséré
 * après coup, il déplacerait le contenu au chargement. Il est masqué tant que
 * `html.no-js` est présent — sans JavaScript, la liste est déjà complète et un
 * bouton inerte n'aurait aucun sens.
 */
export function revealMore({ target, count, label, itemSelector }) {
  return `      <button class="reveal-more" type="button" data-reveal-more="${target}" data-reveal-count="${count}" data-reveal-items="${itemSelector}" aria-expanded="false" aria-controls="${target}">
        <span data-reveal-label>${label}</span>
        <span class="reveal-more__sign" aria-hidden="true"></span>
      </button>`;
}

/* ------------------------------------------------------------- bandeau CTA */

export function ctaBand(depth, options = {}) {
  const {
    title = 'Un doute sur l’origine du problème&nbsp;?',
    text = 'Décrivez votre situation en quelques minutes. Vous recevrez les éléments à vérifier en priorité et, si elle se justifie, une proposition d’expertise.',
    primaryLabel = 'Demander une expertise',
    primaryHref = 'pages/devis.html',
    secondaryLabel = 'Lancer le pré-diagnostic',
    secondaryHref = 'pages/diagnostic.html#pre-diagnostic',
  } = options;

  return `  <section class="cta-band">
    <div class="cta-band__inner">
      <div data-reveal>
        <h2 class="cta-band__title">${title}</h2>
        <p>${text}</p>
      </div>
      <div class="btn-group" data-reveal data-reveal-delay="90">
        <a class="btn btn--primary btn--lg" href="${rel(depth, primaryHref)}">${primaryLabel}</a>
        ${secondaryLabel ? `<a class="btn btn--on-dark btn--lg" href="${rel(depth, secondaryHref)}">${secondaryLabel}</a>` : ''}
      </div>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- processus */

export const PROCESS_STEPS = [
  {
    num: '01',
    title: 'Comprendre',
    text: 'Le récit du problème, l’historique du parquet, le contexte de la pièce et ce qui a changé avant l’apparition.',
  },
  {
    num: '02',
    title: 'Observer',
    text: 'Lames, jeux périphériques, planéité, mesures d’humidité de l’air et du support. Rien n’est déduit sans avoir été vu.',
  },
  {
    num: '03',
    title: 'Identifier',
    text: 'Séparer le symptôme visible de son origine réelle, écarter les hypothèses que les observations contredisent.',
  },
  {
    num: '04',
    title: 'Recommander',
    text: 'Les solutions envisageables, leurs conditions de réussite, leurs limites — et, parfois, la conclusion qu’il n’y a rien à faire.',
  },
];

export function processSection(depth, { inverse = false } = {}) {
  const steps = PROCESS_STEPS.map(
    (step, index) => `        <li class="stage" data-reveal data-reveal-delay="${index * 80}">
          <span class="stage__num">${step.num}</span>
          <h3 class="stage__title">${step.title}</h3>
          <p class="stage__text">${step.text}</p>
        </li>`
  ).join('\n');

  return `  <section class="section${inverse ? ' section--inverse' : ''}" id="deroulement">
    <div class="container">
      <div class="sec-head sec-head--split" data-reveal>
        <div>
          <div class="sec-head__rule"></div>
          <p class="kicker">Méthode</p>
          <h2 class="sec-head__title u-mt-md">Comment se déroule une expertise</h2>
        </div>
        <div class="sec-head__aside">
          <p class="lead">Quatre temps, du récit initial aux recommandations. Aucun ne se saute&nbsp;: c’est la seule façon de distinguer ce que l’on voit de ce qui le provoque.</p>
        </div>
      </div>
      <ol class="stages u-mt-2xl">
${steps}
      </ol>
    </div>
  </section>`;
}

/* ----------------------------------------------------------------- articles */

export const ARTICLES = [
  {
    slug: 'pourquoi-un-parquet-grince',
    related: ['parquet-qui-grince', 'lames-qui-bougent', 'pose'],
    tags: ['grincement', 'support', 'pose', 'structure'],
    title: 'Pourquoi un parquet se met-il à grincer&nbsp;?',
    category: 'Diagnostic',
    date: '2026-02-10',
    dateLabel: '10 février 2026',
    readingTime: '6 min',
    image: 'grincement.jpg',
    excerpt:
      'Le grincement est un symptôme, pas une cause. Comprendre d’où vient le frottement évite d’engager des travaux inutiles.',
  },
  {
    slug: 'parquet-qui-se-souleve-que-faire',
    related: ['parquet-gondole', 'lames-qui-secartent', 'degat-des-eaux'],
    tags: ['deformation', 'humidite', 'pose', 'sinistre'],
    title: 'Que faire lorsqu’un parquet se soulève&nbsp;?',
    category: 'Défauts',
    date: '2026-02-24',
    dateLabel: '24 février 2026',
    readingTime: '7 min',
    image: 'soulevement.jpg',
    excerpt:
      'Un parquet qui bombe réagit presque toujours à l’eau ou à un manque de jeu. Les premiers gestes conditionnent la suite.',
  },
  {
    slug: 'humidite-et-parquet-signes-qui-alertent',
    seoTitle: 'Humidité et parquet&nbsp;: les signes d’alerte',
    related: ['parquet-gondole', 'degat-des-eaux', 'pose'],
    tags: ['humidite', 'mesure', 'support', 'sinistre'],
    title: 'Humidité et parquet&nbsp;: quels signes doivent alerter&nbsp;?',
    category: 'Humidité',
    date: '2026-03-09',
    dateLabel: '9 mars 2026',
    readingTime: '8 min',
    image: 'parquet-chevrons.jpg',
    excerpt:
      'Certains signaux apparaissent bien avant le désordre visible. Savoir les lire permet d’agir avant la dégradation.',
  },
  {
    sortie: {
      titre: 'Trop abîmé pour être sauvé&nbsp;?',
      texte: 'Quand le ponçage n’a plus de matière à prendre, rénover coûte plus cher que remplacer. Premibel réunit le choix, le conseil et deux showrooms — particuliers comme professionnels.',
      action: 'Voir les parquets chez Premibel',
      secondaire: null,
    },
    slug: 'renover-un-parquet-tres-abime',
    related: ['parquet-abime', 'renovation', 'choisir-parquet'],
    tags: ['renovation', 'esthetique', 'choix', 'entretien'],
    title: 'Peut-on rénover un parquet très abîmé&nbsp;?',
    category: 'Rénovation',
    date: '2026-03-23',
    dateLabel: '23 mars 2026',
    readingTime: '7 min',
    image: 'rayures.jpg',
    excerpt:
      'Entre patine et dégradation, la frontière n’est pas toujours nette. Trois critères décident de la faisabilité.',
  },
  {
    slug: 'pourquoi-le-support-est-essentiel',
    seoTitle: 'Le support&nbsp;: ce qui se joue avant la pose',
    related: ['defaut-de-pose', 'pose', 'parquet-gondole'],
    tags: ['support', 'pose', 'mesure', 'structure'],
    title: 'Pourquoi le support est-il essentiel avant la pose&nbsp;?',
    category: 'Pose',
    date: '2026-04-07',
    dateLabel: '7 avril 2026',
    readingTime: '9 min',
    image: 'pose-support.jpg',
    excerpt:
      'La majorité des désordres se jouent sous le parquet. Planéité, siccité, propreté&nbsp;: les trois contrôles décisifs.',
  },
  {
    slug: 'lames-qui-secartent',
    seoTitle: 'Lames qui s’écartent&nbsp;: normal ou défaut&nbsp;?',
    tags: ['deformation', 'humidite', 'structure', 'mesure'],
    related: ['lames-qui-bougent', 'parquet-qui-sonne-creux', 'humidite'],
    title: 'Lames qui s’écartent&nbsp;: jeu normal ou défaut&nbsp;?',
    category: 'Diagnostic',
    date: '2026-09-11',
    dateLabel: '11 septembre 2026',
    readingTime: '7 min',
    image: 'lames-bougent.jpg',
    excerpt:
      'Des joints qui s’ouvrent en hiver et se referment au printemps sont normaux. Trois situations, en revanche, méritent d’être regardées de près.',
  },
  {
    slug: 'parquet-qui-sonne-creux',
    seoTitle: 'Pourquoi un parquet sonne creux',
    tags: ['structure', 'support', 'pose', 'grincement'],
    related: ['lames-qui-bougent', 'defaut-de-pose', 'pourquoi-un-parquet-grince'],
    title: 'Parquet qui sonne creux&nbsp;: ce que le bruit indique',
    category: 'Diagnostic',
    date: '2026-09-11',
    dateLabel: '11 septembre 2026',
    readingTime: '6 min',
    image: 'parquet-detail.jpg',
    excerpt:
      'Normal sur une pose flottante, préoccupant sur une pose collée. La première question n’est pas pourquoi ça sonne creux, mais comment le parquet est posé.',
  },
  {
    slug: 'traces-noires-sur-un-parquet',
    seoTitle: 'Traces noires sur un parquet&nbsp;: les causes',
    tags: ['esthetique', 'humidite', 'sinistre', 'entretien'],
    related: ['humidite', 'parquet-abime', 'parquet-salle-de-bain'],
    title: 'Traces noires sur un parquet&nbsp;: comment les distinguer',
    category: 'Humidité',
    date: '2026-09-11',
    dateLabel: '11 septembre 2026',
    readingTime: '7 min',
    image: 'rayures.jpg',
    excerpt:
      'Réaction chimique, moisissure ou finition épuisée&nbsp;: trois phénomènes différents, trois réponses différentes. La forme et l’odeur suffisent souvent à trancher.',
  },
  {
    slug: 'reception-chantier-parquet',
    seoTitle: 'Réception d’un chantier de parquet',
    tags: ['pose', 'mesure', 'structure', 'support'],
    related: ['defaut-de-pose', 'pose', 'parquet-et-plancher-chauffant'],
    title: 'Réception d’un chantier de parquet&nbsp;: ce qu’on contrôle le jour J',
    category: 'Pose',
    date: '2026-09-11',
    dateLabel: '11 septembre 2026',
    readingTime: '8 min',
    image: 'inspection.jpg',
    excerpt:
      'La plupart des désordres apparaissent des mois après la pose. Ce que la réception peut faire, c’est consigner l’état initial et les conditions de mise en œuvre.',
  },
  {
    sortie: {
      titre: 'Vous cherchez un parquet compatible plancher chauffant&nbsp;?',
      texte: 'La compatibilité se lit sur la fiche technique&nbsp;: épaisseur, essence, résistance thermique. Premibel indique ces caractéristiques et peut les vérifier avec vous.',
      action: 'Voir les parquets compatibles chez Premibel',
      secondaire: null,
    },
    slug: 'parquet-et-plancher-chauffant',
    seoTitle: 'Parquet et plancher chauffant&nbsp;: à vérifier',
    tags: ['choix', 'pose', 'support', 'mesure'],
    related: ['massif-ou-contrecolle', 'parquet-salle-de-bain', 'choisir-parquet'],
    title: 'Parquet et plancher chauffant&nbsp;: les points à vérifier',
    category: 'Pose',
    date: '2026-09-11',
    dateLabel: '11 septembre 2026',
    readingTime: '9 min',
    image: 'pose-support.jpg',
    excerpt:
      'Résistance thermique, température de surface, protocole de mise en chauffe&nbsp;: trois conditions cumulatives qui se vérifient avant la commande, jamais après.',
  },
  {
    sortie: {
      titre: 'Vous savez maintenant lequel vous convient&nbsp;?',
      texte: 'Massif ou contrecollé, le critère est la structure, pas la gamme. Reste à les voir&nbsp;: Premibel propose les deux familles, toutes épaisseurs et toutes finitions.',
      action: 'Comparer les deux familles chez Premibel',
      secondaire: null,
    },
    slug: 'massif-ou-contrecolle',
    seoTitle: 'Massif ou contrecollé&nbsp;: quelles différences',
    tags: ['choix', 'structure', 'renovation'],
    related: ['choisir-parquet', 'parquet-et-plancher-chauffant', 'renovation'],
    title: 'Massif ou contrecollé&nbsp;: ce qui les distingue vraiment',
    category: 'Choix',
    date: '2026-09-11',
    dateLabel: '11 septembre 2026',
    readingTime: '8 min',
    image: 'parquet-chevrons.jpg',
    excerpt:
      'Deux structures, pas deux gammes. La différence décide de la stabilité, du nombre de rénovations possibles et du type de pose admis.',
  },
  {
    sortie: {
      titre: 'Reste à choisir la finition sur pièce',
      texte: 'Huilé, vitrifié ou brut&nbsp;: la différence se voit et se touche mieux qu’elle ne se lit. Premibel présente les finitions posées, en showroom.',
      action: 'Voir les finitions chez Premibel',
      secondaire: null,
    },
    slug: 'finition-parquet-huile-vitrifie',
    seoTitle: 'Finition&nbsp;: huilé, vitrifié ou brut',
    tags: ['choix', 'entretien', 'esthetique'],
    related: ['entretien', 'traces-noires-sur-un-parquet', 'renovation'],
    title: 'Huilé, vitrifié ou brut&nbsp;: choisir une finition',
    category: 'Choix',
    date: '2026-09-11',
    dateLabel: '11 septembre 2026',
    readingTime: '8 min',
    image: 'interieur-clair.jpg',
    excerpt:
      'La finition est la seule couche qui prend l’usure. Elle décide de l’entretien quotidien et de la façon dont les accidents se réparent.',
  },
  {
    sortie: {
      titre: 'Vous cherchez une essence qui tienne l’humidité&nbsp;?',
      texte: 'Toutes les essences ne valent pas en pièce humide, et la pose compte autant que le bois. Un conseiller Premibel peut confirmer un choix avant commande.',
      action: 'Trouver une essence adaptée chez Premibel',
      secondaire: null,
    },
    slug: 'parquet-salle-de-bain',
    seoTitle: 'Poser du parquet en salle de bain',
    tags: ['choix', 'humidite', 'pose', 'structure'],
    related: ['humidite', 'finition-parquet-huile-vitrifie', 'choisir-parquet'],
    title: 'Parquet en salle de bain&nbsp;: à quelles conditions&nbsp;?',
    category: 'Choix',
    date: '2026-09-11',
    dateLabel: '11 septembre 2026',
    readingTime: '7 min',
    image: 'architectural.jpg',
    excerpt:
      'Essence durable, mise en œuvre étanche et ventilation qui fonctionne. Si l’une des trois manque, le bois finira par s’en apercevoir.',
  },
];

/** Carte article. `variant` : 'default' | 'feature' | 'row'. */
export function articleCard(depth, article, index = 0, variant = 'default') {
  const ratioClass = variant === 'feature' ? 'media--3x2' : 'media--4x3';
  const h = variant === 'feature' ? 933 : 1050;
  return `      <article class="card${variant === 'feature' ? ' card--feature' : ''}${variant === 'row' ? ' card--row' : ''}" data-reveal data-reveal-delay="${index * 70}">
        <div class="card__media ${ratioClass}">
          ${photo(depth, article.image, { sizes: variant === 'row' ? '(max-width: 520px) 34vw, (max-width: 900px) 30vw, 18vw' : '(min-width: 901px) 40vw, 100vw' })}
        </div>
        <div class="card__body">
          <p class="card__meta"><span>${article.category}</span><span>${article.readingTime}</span></p>
          <h3 class="card__title"><a class="card__link" href="${rel(depth, `articles/${article.slug}.html`)}">${article.title}</a></h3>
          <p class="card__text">${article.excerpt}</p>
        </div>
      </article>`;
}

/* ------------------------------------------------------------- carrousel */

export const SHOWCASE = [
  {
    title: 'Soulèvement des lames',
    text: 'Bombement, vagues ou tuilage&nbsp;: ce que la géométrie du désordre indique sur son origine.',
    image: 'soulevement.jpg',
    href: 'pages/problemes/parquet-gondole.html',
  },
  {
    title: 'Humidité persistante',
    text: 'Distinguer une remontée du support, une condensation d’ambiance et une infiltration ponctuelle.',
    image: 'parquet-chevrons.jpg',
    href: 'pages/problemes/humidite.html',
  },
  {
    title: 'Défaut de pose',
    text: 'Jeux périphériques, planéité, siccité, acclimatation&nbsp;: les contrôles que l’on reconstitue après coup.',
    image: 'pose-support.jpg',
    href: 'pages/problemes/defaut-de-pose.html',
  },
  {
    title: 'Parquet ancien',
    text: 'Mesurer l’épaisseur utile restante et l’état des assemblages avant d’arbitrer entre rénover et remplacer.',
    image: 'parquet-ancien.jpg',
    href: 'pages/problemes/parquet-abime.html',
  },
  {
    title: 'Après un dégât des eaux',
    text: 'Documenter, mesurer le support, attendre la stabilisation&nbsp;: la chronologie compte autant que le constat.',
    image: 'rayures.jpg',
    href: 'pages/problemes/degat-des-eaux.html',
  },
];

export function showcase(depth, { inverse = false } = {}) {
  const total = String(SHOWCASE.length).padStart(2, '0');
  const slides = SHOWCASE.map(
    (item, index) => `          <a class="showcase__slide" href="${rel(depth, item.href)}">
            <div class="showcase__media">
              ${photo(depth, item.image, { sizes: '(min-width: 901px) 38vw, 82vw' })}
            </div>
            <div class="showcase__body">
              <span class="showcase__num">${String(index + 1).padStart(2, '0')}</span>
              <span>
                <span class="showcase__title">${item.title}</span>
                <span class="showcase__text">${item.text}</span>
              </span>
            </div>
          </a>`
  ).join('\n');

  return `      <div class="showcase" data-showcase>
        <div class="showcase__viewport" data-showcase-viewport tabindex="0" role="group" aria-label="Situations à analyser, faites défiler horizontalement">
${slides}
        </div>
        <div class="showcase__controls">
          <p class="showcase__counter" aria-live="polite" aria-atomic="true"><span class="visually-hidden">Situation </span><b data-showcase-current>01</b> / ${total}</p>
          <div class="showcase__progress" aria-hidden="true"><div class="showcase__progress-bar" data-showcase-bar></div></div>
          <div class="showcase__nav">
            <button class="showcase__btn" type="button" data-showcase-prev aria-label="Situation précédente">${ICONS.arrowLeft}</button>
            <button class="showcase__btn" type="button" data-showcase-next aria-label="Situation suivante">${ICONS.arrowRight}</button>
          </div>
        </div>
      </div>`;
}

/* --------------------------------------------------------------------- FAQ */

export function faqAccordion(items, idPrefix, { single = false } = {}) {
  const blocks = items
    .map((item, index) => {
      const id = `${idPrefix}-${index + 1}`;
      return `      <div class="accordion__item">
        <h3>
          <button class="accordion__trigger" type="button" id="${id}-trigger" aria-expanded="false" aria-controls="${id}">
            <span>${item.q}</span>
            <span class="accordion__icon" aria-hidden="true"></span>
          </button>
        </h3>
        <div class="accordion__panel" id="${id}" role="region" aria-labelledby="${id}-trigger" data-open="false">
          <div class="accordion__panel-inner"><div>${item.a}</div></div>
        </div>
      </div>`;
    })
    .join('\n');

  return `    <div class="accordion" data-accordion${single ? ' data-accordion-single' : ''}>
${blocks}
    </div>`;
}

export function faqJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: stripTags(item.q),
      acceptedAnswer: { '@type': 'Answer', text: stripTags(item.a) },
    })),
  };
}

export function stripTags(html) {
  return String(html)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ------------------------------------------------------------ en-tête page */

/**
 * En-tête de page.
 *
 * L'image de fond est TOUJOURS décorative, et c'est un choix, pas un oubli :
 * elle est posée sous un dégradé d'assombrissement, derrière le `<h1>` et le
 * chapô qui disent déjà de quoi traite la page. La décrire une seconde fois à
 * un lecteur d'écran n'ajouterait rien et ferait double emploi avec le titre.
 * Les textes alternatifs de tools/images.mjs servent partout ailleurs, où
 * l'image est un contenu et non un fond.
 */
export function pageHero(depth, { kicker, title, lead, crumbHtml, actions = '', image = null }) {
  const inner = `      <div class="page-hero__inner">
        ${kicker ? `<p class="kicker">${kicker}</p>` : ''}
        <h1 class="page-hero__title">${title}</h1>
        <p class="page-hero__lead">${lead}</p>
        ${actions ? `<div class="page-hero__actions btn-group">${actions}</div>` : ''}
        <div class="page-hero__rule"></div>
      </div>`;

  if (image) {
    /* Le voile est dimensionné d'après la clarté MESURÉE de la photographie,
       pas page par page : une photo sombre garde un voile léger, une photo
       claire reçoit ce qu'il faut pour que le texte blanc reste lisible.
       Voir tools/images.mjs, `estClaire`. */
    const voile = estClaire(image) ? ' page-hero--clair' : '';
    return `  <section class="page-hero page-hero--media${voile}">
    <div class="page-hero__bg" aria-hidden="true">
      ${photo(depth, image, { sizes: '100vw', priority: true, alt: '' })}
    </div>
    <div class="container">
      ${crumbHtml}
${inner}
    </div>
  </section>`;
  }

  return `  <section class="page-hero">
    <div class="container">
      ${crumbHtml}
${inner}
    </div>
  </section>`;
}

/** En-tête de section standard : filet, intitulé, titre, paragraphe optionnel. */
export function sectionHead({ kicker, title, text = null, link = null, titleClass = '' }) {
  const left = `        <div>
          <div class="sec-head__rule"></div>
          ${kicker ? `<p class="kicker">${kicker}</p>` : ''}
          <h2 class="sec-head__title ${titleClass}">${title}</h2>
        </div>`;

  if (!text && !link) {
    return `      <div class="sec-head" data-reveal>
${left}
      </div>`;
  }

  return `      <div class="sec-head sec-head--split" data-reveal>
${left}
        <div class="sec-head__aside">
          ${text ? `<p class="lead">${text}</p>` : ''}
          ${link ? `<p class="u-mt-lg">${link}</p>` : ''}
        </div>
      </div>`;
}

/* ========================================================================== */
/* Formulaires : mode DEMO / LIVE                                             */
/* ========================================================================== */

/**
 * Le site affiche partout qu'aucune donnée n'est transmise. C'est vrai tant
 * qu'aucun point d'envoi n'est renseigné dans `js/config/site.js` — et faux
 * dès qu'il l'est. Une page qui promet « rien n'est transmis » alors que le
 * formulaire envoie réellement une demande est une fausse déclaration, et sur
 * la page de confidentialité, un manquement.
 *
 * Ces trois aides lisent la MÊME configuration que le JavaScript du site. Il
 * n'existe donc qu'un seul interrupteur : renseigner l'URL suffit à corriger
 * en même temps le comportement et tous les textes qui en parlent.
 */
export function formulaireEnDemo(nom) {
  return formMode(nom) === 'demo';
}

/** Vrai tant qu'AUCUN des deux formulaires n'a de point d'envoi. */
export function siteEnDemo() {
  return formulaireEnDemo('contact') && formulaireEnDemo('devis');
}

/**
 * Texte affiché sous un formulaire, ou chaîne vide en mode LIVE : en
 * production, la mention n'a plus lieu d'être et sa présence inquiéterait.
 */
export function mentionDemo(nom, texte) {
  /* `data-demo-only` : à l'exécution, quand l'hôte est un hôte de
     développement raccordé au backend local, `forms.js` masque cette mention
     — le formulaire envoie réellement, la phrase serait fausse. */
  return formulaireEnDemo(nom) ? `<p class="disclaimer" data-demo-only>${texte}</p>` : '';
}

/**
 * Champ leurre.
 *
 * Il est dans le HTML SERVI, et non ajouté par JavaScript : un robot qui se
 * contente de lire la page et de poster le formulaire ne verrait jamais un
 * champ créé au dernier moment — le piège ne prendrait personne.
 *
 * Masqué par la feuille de style et non par `hidden` ni `display:none`, que
 * les robots un peu sérieux savent détecter et éviter. `aria-hidden` et
 * `tabindex="-1"` le retirent du parcours d'un lecteur d'écran et du clavier :
 * il ne doit jamais atteindre un humain, sous peine de faire refuser sa
 * demande sans qu'il comprenne pourquoi.
 *
 * `autocomplete="off"` est indispensable : sans lui, le remplissage
 * automatique du navigateur peut y déposer une valeur et bloquer un visiteur
 * réel.
 */
export function champLeurre(suffixe) {
  const id = `hp-${suffixe}`;
  return `<div class="honeypot" aria-hidden="true">
                <label for="${id}">Ne remplissez pas ce champ</label>
                <input type="text" id="${id}" name="_hp" value="" tabindex="-1" autocomplete="off">
              </div>`;
}

/**
 * Section « Données personnelles » de la page de confidentialité.
 *
 * Deux textes, et un seul est vrai à la fois. En mode DEMO, le site affirme
 * qu'il ne collecte rien — c'est exact, et c'est vérifiable. En mode LIVE, il
 * doit nommer le responsable du traitement, la finalité, les destinataires et
 * la durée de conservation : c'est ce que la version DEMO promet explicitement
 * de faire « avant toute mise en service ». Générer les deux depuis la même
 * configuration évite qu'on oublie cette promesse le jour de la bascule.
 *
 * `check.mjs` refuse une construction LIVE dont les valeurs manquent : mieux
 * vaut une construction qui échoue qu'une page qui ment.
 */
export function sectionDonneesPersonnelles() {
  if (siteEnDemo()) {
    return `<p><strong>Aucune donnée n’est collectée à ce jour.</strong> Les formulaires du site fonctionnent en démonstration&nbsp;: ce que vous y saisissez reste dans votre navigateur, n’est ni transmis, ni enregistré, ni consulté par personne. Les photographies éventuellement sélectionnées ne sont pas téléversées.</p>
        <p>Lorsque les demandes seront réellement traitées, cette page précisera le responsable du traitement, la finalité, les destinataires et la durée de conservation, avant toute mise en service.</p>
        <p>Le règlement général sur la protection des données ouvre un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité. Il s’exercera auprès du responsable du traitement dès que celui-ci sera identifié&nbsp;; d’ici là, aucune donnée personnelle n’est détenue par ce site.</p>`;
  }

  const responsable = CONTACT.legalEntity || SITE.name;
  const contact = CONTACT.email
    ? `<a href="mailto:${CONTACT.email}">${CONTACT.email}</a>`
    : 'l’adresse indiquée en tête de ces mentions';
  const mois = RGPD.conservationMois;
  const duree = mois % 12 === 0 ? `${mois / 12} an${mois > 12 ? 's' : ''}` : `${mois} mois`;
  const tiers = RGPD.sousTraitants.length
    ? `<p>Les prestataires suivants interviennent dans ce traitement&nbsp;: ${RGPD.sousTraitants.join(', ')}.</p>`
    : '<p>Aucun prestataire tiers n’intervient dans ce traitement en dehors de l’hébergement du site.</p>';

  return `<p><strong>Responsable du traitement&nbsp;:</strong> ${responsable}. <strong>Finalité&nbsp;:</strong> ${RGPD.finalite}. <strong>Base légale&nbsp;:</strong> votre demande explicite.</p>
        <p>Les informations transmises par les formulaires (identité, coordonnées, description du désordre et photographies éventuelles) sont enregistrées pour ce seul usage. Les destinataires sont ${RGPD.destinataires}. Rien n’est revendu, cédé ni utilisé à des fins de prospection.</p>
        <p><strong>Durée de conservation&nbsp;:</strong> ${duree} après la clôture de votre demande. Passé ce délai, la demande et ses photographies sont supprimées automatiquement.</p>
        <p>Les photographies ne sont jamais publiées ni accessibles par une adresse web&nbsp;: elles sont stockées hors du site et ne s’affichent que pour les personnes habilitées à traiter votre demande. Les données de localisation éventuellement contenues dans leurs métadonnées sont retirées à la réception.</p>
        ${tiers}
        <p>Le règlement général sur la protection des données vous ouvre un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité. Pour l’exercer, écrivez à ${contact}. Vous pouvez également introduire une réclamation auprès de la CNIL.</p>`;
}
