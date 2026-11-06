/**
 * Blocs réutilisables partagés par plusieurs pages (outillage de build).
 *
 * Principe de la direction artistique : très peu de composants, mais des
 * composants de grande échelle. Pas de grille de petites cartes.
 */

import { rel } from './layout.mjs';
import { photo, estClaire } from './images.mjs';
/* Même configuration que celle servie au navigateur : un seul interrupteur. */
import { formMode, CONTACT, SITE, RGPD } from '../js/config/site.js';
import { problemes, theme, imageDe } from './cms/snapshot.mjs';

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

/* Depuis le 05/10/2026, la sortie n'est plus l'enseigne mais le MOTEUR
   « Trouver mon parquet » : c'est lui qui propose un vrai produit, une vraie
   catégorie, puis l'enseigne adaptée — et jamais une page d'accueil générique
   quand une référence précise correspond. `prefill` transmet ce que la page
   sait déjà (pièce humide, chauffage au sol…), que le moteur ne redemande pas. */
export function blocRemplacement(depth, {
  campagne,
  pro = false,
  prefill = {},
  titre = 'Votre parquet doit peut-être être remplacé&nbsp;?',
  texte = 'Si l’état constaté ne laisse plus de matière à travailler, la question n’est plus de réparer mais de choisir. Quelques critères suffisent pour identifier les parquets qui correspondent à votre projet — de vraies références, chez l’enseigne adaptée.',
  action = 'Trouver un parquet adapté',
  secondaire = 'Faire expertiser avant de décider',
} = {}) {
  const base = rel(depth, 'pages/trouver-mon-parquet.html');
  const params = new URLSearchParams({ ...prefill, via: campagne });
  const url = base + '?' + params.toString();

  const lignes = [];
  lignes.push('          <div class="remplacement" data-reveal>');
  lignes.push('            <p class="remplacement__titre">' + titre + '</p>');
  lignes.push('            <p class="remplacement__texte">' + texte + '</p>');
  lignes.push('            <div class="remplacement__actions">');
  lignes.push('              <a class="btn btn--primary" href="' + url.replace(/&/g, '&amp;') + '"'
    + ' data-event="finder_open" data-besoin="selection" data-context="' + campagne + '">' + action + '</a>');
  if (secondaire) {
    lignes.push('              <a class="btn btn--outline btn--sm" href="' + rel(depth, 'pages/devis.html') + '">' + secondaire + '</a>');
  }
  lignes.push('            </div>');

  if (pro) {
    const urlPro = base + '?' + new URLSearchParams({ ...prefill, profil: 'professionnel', besoin: 'supply', via: campagne }).toString();
    lignes.push('            <p class="remplacement__pro">Vous êtes professionnel et devez approvisionner un chantier&nbsp;? '
      + '<a href="' + urlPro.replace(/&/g, '&amp;') + '" data-event="finder_open" data-besoin="supply" data-context="' + campagne + '">Le même parcours en mode professionnel</a>'
      + ' propose la solution d’approvisionnement adaptée.</p>');
  }

  lignes.push('          </div>');
  return lignes.join(String.fromCharCode(10));
}


/**
 * Liste éditoriale numérotée, avec vignette révélée au survol.
 *
 * `collapse` active la divulgation progressive : sur petit écran seulement, les
 * `collapse` premières entrées restent visibles et les suivantes passent en
 * `hidden`, un bouton les révélant d'un geste. Le contenu reste DANS le
 * document — il est donc lu par les moteurs, qui rendent le HTML — et
 * l'intégralité de la liste réapparaît au-delà du point de rupture.
 */

/** Les problèmes de l'instantané, sous la forme attendue par la liste. */
export function problemesListe() {
  return problemes().map((p) => ({
    slug: p.slug,
    label: p.labelCourt || p.titreCourt || p.title,
    teaser: p.accroche,
    /* Sans vignette : l'image du hero du site, jamais une balise cassée. */
    image: imageDe(p.imageVignette || p.image) || 'hero.jpg',
  }));
}

export function indexList(
  depth,
  { items = problemesListe(), id = 'problemes-index', collapse = null, moreLabel = null } = {}
) {
  const rows = items
    .map((item, index) => {
      const num = String(index + 1).padStart(2, '0');
      return `        <a class="index-row" href="${rel(depth, `pages/problemes/${item.slug}.html`)}" data-index-item>
          <span class="index-row__num">${num}</span>
          <span class="index-row__title">${item.label}</span>
          <span class="index-row__text">${item.teaser}</span>
          <span class="index-row__arrow" aria-hidden="true"></span>
        </a>`;
    })
    .join('\n');

  const list = `      <div class="index-list" id="${id}">
${rows}
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
    /* Troisième sortie, en lien texte : pour les pages qui servent les trois
       parcours à la fois (FAQ, diagnostic). Jamais un troisième bouton. */
    lienLabel = null,
    lienHref = null,
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
        ${lienLabel ? `<a class="link-arrow link-arrow--inverse" href="${rel(depth, lienHref)}">${lienLabel}</a>` : ''}
      </div>
    </div>
  </section>`;
}

/* Le bandeau final n'est plus le même partout : il prolonge le parcours de la
   page. Une page « problème » renvoie d'abord au pré-diagnostic, une page
   « choisir » au moteur, une page d'expertise à la demande d'expertise. */
export const BANDES = {
  probleme: {
    title: 'Un doute sur l’origine du problème&nbsp;?',
    text: 'Décrivez votre situation en cinq questions&nbsp;: vous recevrez les vérifications à faire en priorité et la suite logique — réparer, remplacer, ou faire expertiser.',
    primaryLabel: 'Analyser mon problème',
    primaryHref: 'pages/diagnostic.html#pre-diagnostic',
    secondaryLabel: 'Demander une expertise',
    secondaryHref: 'pages/devis.html',
  },
  choisir: {
    title: 'Vous savez ce que vous cherchez&nbsp;?',
    text: 'Quelques critères suffisent pour identifier les parquets qui correspondent à votre projet — de vraies références, chez l’enseigne adaptée.',
    primaryLabel: 'Trouver mon parquet',
    primaryHref: 'pages/trouver-mon-parquet.html',
    secondaryLabel: 'Analyser mon problème',
    secondaryHref: 'pages/diagnostic.html#pre-diagnostic',
  },
  orientation: {
    title: 'Par où commencer&nbsp;?',
    text: 'Un parquet à choisir, un désordre à comprendre, ou une situation qui demande une analyse&nbsp;: chaque besoin a sa suite.',
    primaryLabel: 'Trouver mon parquet',
    primaryHref: 'pages/trouver-mon-parquet.html',
    secondaryLabel: 'Analyser mon problème',
    secondaryHref: 'pages/diagnostic.html#pre-diagnostic',
  },
  /* La FAQ sert les trois parcours : deux boutons et un lien, pas trois boutons. */
  faq: {
    title: 'Vous n’avez pas trouvé votre réponse&nbsp;?',
    text: 'Posez votre situation en cinq questions, ou cherchez directement le parquet qui correspond à votre projet.',
    primaryLabel: 'Analyser mon problème',
    primaryHref: 'pages/diagnostic.html#pre-diagnostic',
    secondaryLabel: 'Trouver mon parquet',
    secondaryHref: 'pages/trouver-mon-parquet.html',
    lienLabel: 'Demander une expertise',
    lienHref: 'pages/devis.html',
  },
  /* Le pied de la page Diagnostic : le pré-diagnostic vient d'être fait juste
     au-dessus, le bandeau dit la suite selon ce qu'on en retient. */
  diagnostic: {
    title: 'Et ensuite&nbsp;?',
    text: 'Un remplacement à envisager, une analyse nécessaire, ou simplement mieux comprendre&nbsp;: chaque situation a sa suite.',
    primaryLabel: 'Trouver mon parquet',
    primaryHref: 'pages/trouver-mon-parquet.html',
    secondaryLabel: 'Demander une expertise',
    secondaryHref: 'pages/devis.html',
    lienLabel: 'Voir les problèmes fréquents',
    lienHref: 'pages/problemes.html',
  },
  /* L'expertise : les valeurs par défaut de ctaBand. */
  expertise: {},
};

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

/** Carte article. `variant` : 'default' | 'feature' | 'row'. `article` vient de l'instantané. */
export function articleCard(depth, article, index = 0, variant = 'default') {
  const categorie = (theme(article.theme) || {}).name || '';
  const ratioClass = variant === 'feature' ? 'media--3x2' : 'media--4x3';
  const h = variant === 'feature' ? 933 : 1050;
  return `      <article class="card${variant === 'feature' ? ' card--feature' : ''}${variant === 'row' ? ' card--row' : ''}" data-reveal data-reveal-delay="${index * 70}">
        <div class="card__media ${ratioClass}">
          ${photo(depth, imageDe(article.image), { sizes: variant === 'row' ? '(max-width: 520px) 34vw, (max-width: 900px) 30vw, 18vw' : '(min-width: 901px) 40vw, 100vw' })}
        </div>
        <div class="card__body">
          <p class="card__meta"><span>${categorie}</span><span>${article.readingTime}</span></p>
          <h3 class="card__title"><a class="card__link" href="${rel(depth, `articles/${article.slug}.html`)}">${article.title}</a></h3>
          <p class="card__text">${article.excerpt}</p>
        </div>
      </article>`;
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
