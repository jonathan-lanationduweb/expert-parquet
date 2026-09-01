import { rel, breadcrumb } from '../layout.mjs';
import {
  ICONS,
  PROBLEMS,
  indexList,
  ctaBand,
  processSection,
  ARTICLES,
  articleCard,
  faqAccordion,
  faqJsonLd,
  pageHero,
} from '../partials.mjs';

const D = 1;

/* ========================================================================== */
/* Expertise parquet                                                          */
/* ========================================================================== */

function expertisePage() {
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Expertise parquet' },
  ]);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'Expertise',
    title: 'L’expertise parquet, ou comment remonter du symptôme à la cause',
    lead: 'Un parquet qui pose problème raconte quelque chose de son support, de son environnement et de sa pose. L’expertise consiste à lire ces indices dans le bon ordre.',
    image: 'parquet-detail.jpg',
    imageAlt: '',
    actions: `<a class="btn btn--primary" href="${rel(D, 'pages/devis.html')}">Demander une expertise</a><a class="btn btn--on-dark" href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">Lancer le pré-diagnostic</a>`,
  })}

  <section class="section">
    <div class="container">
      <div class="article-layout">
        <div class="prose" id="article-body">
          <h2 id="pourquoi">Pourquoi demander une expertise&nbsp;?</h2>
          <p>Dans beaucoup de situations, la question posée n’est pas « comment réparer&nbsp;? » mais « qu’est-ce qui se passe réellement&nbsp;? ». Tant que la cause n’est pas identifiée, toute réparation reste un pari : elle peut tenir, ou reproduire le même désordre quelques mois plus tard.</p>
          <p>Une expertise se justifie particulièrement lorsque plusieurs hypothèses restent ouvertes, lorsque le budget de travaux envisagé est significatif, ou lorsqu’un tiers est impliqué — entreprise de pose, assurance, bailleur, copropriété.</p>

          <div class="callout">
            <p class="callout__title">${ICONS.alert} Ce que l’expertise n’est pas</p>
            <p>Ce site propose une analyse technique. Il ne délivre pas de rapport judiciaire, d’attestation officielle ni d’avis d’assurance. Si votre situation relève d’une procédure, dites-le dès votre demande : la réponse précisera ce qui est possible et ce qui ne lest pas.</p>
          </div>

          <h2 id="situations">Dans quelles situations&nbsp;?</h2>
          <ul>
            <li><strong>Avant une rénovation</strong> — pour savoir ce qui peut être conservé et dans quel ordre intervenir.</li>
            <li><strong>Après un sinistre</strong> — pour documenter l’état réel du parquet et du support, au-delà de ce qui se voit.</li>
            <li><strong>En cas de doute sur la pose</strong> — quand les symptômes apparaissent tôt, ou de manière régulière sur toute la surface.</li>
            <li><strong>Face à une humidité persistante</strong> — pour distinguer remontée, condensation et infiltration.</li>
            <li><strong>Avant un remplacement</strong> — pour vérifier que la cause a bien été traitée avant de reposer.</li>
          </ul>

          <h2 id="observations">Ce qui peut être observé</h2>
          <p>Une observation méthodique couvre quatre familles d’éléments, du plus visible au plus déterminant.</p>

          <div class="symptom-block">
            <div class="symptom-panel">
              <h3>${ICONS.check} Le revêtement</h3>
              <ul class="rich-list">
                <li>État et sens des lames</li>
                <li>Jeux entre lames, tuilage, désaffleurements</li>
                <li>État de la finition</li>
                <li>Zones sonores ou souples au passage</li>
              </ul>
            </div>
            <div class="symptom-panel">
              <h3>${ICONS.check} Le support</h3>
              <ul class="rich-list">
                <li>Nature : dalle, chape, plancher bois</li>
                <li>Planéité relevée à la règle</li>
                <li>Humidité résiduelle</li>
                <li>Présence d’une barrière anti-humidité</li>
              </ul>
            </div>
            <div class="symptom-panel">
              <h3>${ICONS.check} L’environnement</h3>
              <ul class="rich-list">
                <li>Hygrométrie de la pièce</li>
                <li>Ventilation et renouvellement d’air</li>
                <li>Type de chauffage</li>
                <li>Expositions et ponts thermiques</li>
              </ul>
            </div>
            <div class="symptom-panel">
              <h3>${ICONS.search} La mise en œuvre</h3>
              <ul class="rich-list">
                <li>Jeux périphériques et joints de fractionnement</li>
                <li>Type de pose : collée, flottante, clouée</li>
                <li>Acclimatation du bois avant pose</li>
                <li>Documents et fiches techniques du chantier</li>
              </ul>
            </div>
          </div>

          <h2 id="symptome-cause">Symptôme et cause&nbsp;: la distinction qui change tout</h2>
          <p>Un même symptôme peut avoir des origines radicalement différentes, et deux symptômes très différents peuvent partager la même cause. C’est ce qui rend le raccourci « parquet qui grince = clou à remettre » aussi tentant qu’inefficace.</p>
          <div class="table-scroll">
            <table>
              <thead>
                <tr><th scope="col">Symptôme observé</th><th scope="col">Causes possibles très différentes</th></tr>
              </thead>
              <tbody>
                <tr><td>Grincement localisé</td><td>Fixation desserrée, sous-couche tassée, mouvement du support, jeu périphérique insuffisant</td></tr>
                <tr><td>Lames bombées</td><td>Absence de joint de dilatation, remontée d’humidité, incident ponctuel d’eau, hygrométrie élevée</td></tr>
                <tr><td>Auréole persistante</td><td>Finition usée, humidité du support, liquide pénétré, réaction chimique du bois</td></tr>
                <tr><td>Lames désolidarisées</td><td>Décollement, emboîtement endommagé, défaut de planéité initial, vieillissement de la colle</td></tr>
              </tbody>
            </table>
          </div>

          <h2 id="support">L’importance du support</h2>
          <p>Le support conditionne presque tout&nbsp;: sa planéité détermine la répartition des appuis, sa siccité conditionne le comportement du bois, sa nature impose le type de pose possible. C’est la raison pour laquelle une expertise s’intéresse au sol autant qu’au parquet — et pourquoi les contrôles préalables à une pose sont si déterminants. Cette question est développée dans notre article sur <a href="${rel(D, 'articles/pourquoi-le-support-est-essentiel.html')}">le rôle du support avant la pose</a>.</p>

          <h2 id="humidite">L’humidité, facteur transversal</h2>
          <p>Le bois est hygroscopique&nbsp;: il échange en permanence de l’humidité avec son environnement, gonfle quand il en absorbe, retrait quand il en perd. Ce comportement est normal. Il devient un problème quand l’amplitude dépasse ce que la pose a prévu, ou quand une source d’eau permanente entretient le phénomène.</p>
          <p>Trois origines à ne pas confondre&nbsp;: la <strong>remontée</strong> depuis le support, la <strong>condensation</strong> liée à l’air de la pièce, l<strong>infiltration</strong> ponctuelle. Voir la page dédiée à l<a href="${rel(D, 'pages/problemes/humidite.html')}">humidité et le parquet</a>.</p>

          <h2 id="conditions-de-pose">Conditions de pose et vieillissement</h2>
          <p>Un parquet posé dans de bonnes conditions vieillit lentement et de façon prévisible&nbsp;: la finition s’épuise, la teinte évolue, quelques jeux saisonniers apparaissent. Un parquet posé dans de mauvaises conditions manifeste souvent ses limites tôt, et de façon cohérente sur toute la surface. La chronologie d’apparition des symptômes est donc une information de premier plan.</p>

          <h2 id="preparer">Ce qu’il est utile de préparer</h2>
          <p>Plus les informations suivantes sont disponibles, plus l’analyse gagne en précision — et plus l’intervention est courte.</p>
          <ul class="rich-list rich-list--check">
            <li>Date de pose approximative et, si possible, devis ou facture</li>
            <li>Type de parquet et de pose, s’ils sont connus</li>
            <li>Nature du support, si elle a été observée</li>
            <li>Chronologie du problème&nbsp;: apparition, évolution, événements concomitants</li>
            <li>Photos d’ensemble et de détail, prises en lumière naturelle</li>
            <li>Historique d’entretien et produits utilisés</li>
          </ul>

          <div class="callout callout--slate u-mt-lg">
            <p class="callout__title">${ICONS.check} Étape suivante</p>
            <p>Le <a href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">pré-diagnostic en ligne</a> reprend ces questions sous forme de parcours guidé. Ses réponses sont ensuite reportées automatiquement dans le <a href="${rel(D, 'pages/devis.html')}">formulaire de demande</a>.</p>
          </div>
        </div>

        <aside class="article-aside">
          <nav class="toc" data-toc data-toc-scope="#article-body" aria-labelledby="toc-title">
            <p class="toc__title" id="toc-title">Sur cette page</p>
            <ul class="toc__list" data-toc-list></ul>
          </nav>
          <div class="aside-card aside-card--accent">
            <p class="aside-card__title">Décrire votre situation</p>
            <p>Quelques minutes suffisent pour poser le contexte et obtenir une première orientation.</p>
            <a class="btn btn--primary btn--sm btn--block" href="${rel(D, 'pages/devis.html')}">Demander une expertise</a>
          </div>
        </aside>
      </div>
    </div>
  </section>

${processSection(D)}

${ctaBand(D)}
`;

  return {
    path: 'pages/expertise.html',
    depth: D,
    navCurrent: 'pages/expertise.html',
    title: 'Expertise parquet : comprendre l’origine d’un problème',
    description:
      'Pourquoi et quand demander une expertise de parquet, ce qui est observé, la différence entre symptôme et cause, le rôle du support et de l’humidité.',
    css: ['pages/home.css', 'pages/article.css'],
    ogImage: 'assets/images/parquet-detail.jpg',
    body,
    jsonLd: [crumb.jsonLd],
  };
}

/* ========================================================================== */
/* Diagnostic parquet                                                         */
/* ========================================================================== */

const DIAGNOSTIC_FAQ = [
  {
    q: 'Pourquoi mon parquet bouge-t-il alors qu’il est récent&nbsp;?',
    a: '<p>Un parquet récent qui bouge oriente en priorité vers les conditions de mise en œuvre&nbsp;: acclimatation du bois insuffisante avant la pose, support encore humide, jeu périphérique absent. La régularité du phénomène sur l’ensemble de la surface est un indice fort.</p>',
  },
  {
    q: 'Comment savoir si le problème vient du parquet ou du support&nbsp;?',
    a: '<p>Trois indices orientent vers le support&nbsp;: le désordre touche une zone étendue plutôt que quelques lames, il suit un tracé (une bande, un angle, une zone de passage de canalisation), et il évolue lentement. À l’inverse, un défaut limité à quelques lames voisines évoque plus souvent le revêtement lui-même.</p>',
  },
  {
    q: 'Faut-il mesurer l’humidité, et avec quoi&nbsp;?',
    a: '<p>Deux mesures différentes sont utiles&nbsp;: l’humidité relative de l’air de la pièce, avec un hygromètre, et l’humidité du support, avec un appareil adapté à sa nature. Un simple hygromètre d’ambiance donne déjà une indication utile s’il est relevé plusieurs jours de suite, à heure comparable.</p>',
  },
  {
    q: 'Un diagnostic peut-il se faire uniquement sur photos&nbsp;?',
    a: '<p>Non, mais les photos font gagner un temps réel. Elles permettent d’écarter certaines hypothèses, de préparer les points à contrôler et parfois de constater qu’une visite n’est pas nécessaire. Elles ne remplacent ni les mesures ni l’observation du support.</p>',
  },
];

function diagnosticPage() {
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Diagnostic parquet' },
  ]);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'Diagnostic',
    title: 'Diagnostic parquet&nbsp;: identifier ce qui se passe réellement',
    lead: 'Pourquoi mon parquet bouge-t-il&nbsp;? D’où vient cette tache&nbsp;? Est-ce un défaut de pose&nbsp;? Cette page donne la méthode, puis un parcours guidé pour poser votre situation.',
    image: 'inspection.jpg',
    imageAlt: '',
    actions: `<a class="btn btn--primary" href="#pre-diagnostic">Lancer le pré-diagnostic</a>`,
  })}

  <section class="section">
    <div class="container">
      <div class="article-layout">
        <div class="prose" id="article-body">
          <h2 id="methode">Une méthode en quatre questions</h2>
          <p>Un diagnostic de parquet ne commence jamais par la solution. Il commence par quatre questions dont les réponses réduisent progressivement le champ des hypothèses.</p>
          <ol>
            <li><strong>Où&nbsp;?</strong> Le désordre est-il localisé, réparti sur une bande, ou généralisé&nbsp;? Une géographie précise oriente déjà vers le support ou vers le revêtement.</li>
            <li><strong>Depuis quand&nbsp;?</strong> Un phénomène présent dès la pose, apparu après un événement, ou installé depuis des années n’appelle pas la même lecture.</li>
            <li><strong>Évolue-t-il&nbsp;?</strong> Un désordre stabilisé et un désordre progressif se traitent différemment — et pas dans la même urgence.</li>
            <li><strong>Qu’est-ce qui a changé&nbsp;?</strong> Travaux, changement de chauffage, sinistre, modification de la ventilation, absence prolongée&nbsp;: presque tout désordre a un contexte.</li>
          </ol>

          <h2 id="observer-seul">Ce que vous pouvez observer vous-même</h2>
          <p>Sans outillage particulier, plusieurs constats sont à votre portée et font gagner un temps considérable.</p>
          <ul class="rich-list rich-list--check">
            <li>Le jeu périphérique&nbsp;: soulevez délicatement une plinthe ou observez sous une porte, le parquet doit pouvoir bouger.</li>
            <li>Le son au passage&nbsp;: un son creux signale souvent un décollement ou un vide.</li>
            <li>La planéité approximative&nbsp;: une règle ou une planche droite posée au sol révèle creux et bosses.</li>
            <li>L’hygrométrie de la pièce&nbsp;: relevée plusieurs jours, elle situe l’environnement du bois.</li>
            <li>La géographie du désordre&nbsp;: photographiez l’ensemble de la pièce, pas seulement la zone abîmée.</li>
          </ul>

          <div class="callout callout--warning">
            <p class="callout__title">${ICONS.alert} À éviter avant d’avoir compris</p>
            <p>Poncer, reboucher, revitrifier ou remplacer des lames avant d’identifier la cause fait disparaître les indices sans traiter le problème. Si une zone est instable ou dangereuse, sécurisez-la — mais gardez des photos de l’état initial.</p>
          </div>

          <h2 id="lecture">Lire les symptômes ensemble, pas isolément</h2>
          <p>Un symptôme seul est ambigu. Deux ou trois symptômes combinés deviennent souvent parlants. Quelques associations fréquentes&nbsp;:</p>
          <div class="table-scroll">
            <table>
              <thead>
                <tr><th scope="col">Combinaison observée</th><th scope="col">Piste privilégiée</th></tr>
              </thead>
              <tbody>
                <tr><td>Bombement en périphérie + plinthes serrées</td><td>Jeu de dilatation insuffisant ou obstrué</td></tr>
                <tr><td>Auréoles + odeur + zone constante</td><td>Humidité venant du support ou d’une fuite</td></tr>
                <tr><td>Grincements saisonniers réversibles</td><td>Variation hygrométrique normale, amplitude à vérifier</td></tr>
                <tr><td>Son creux étendu + lames mobiles</td><td>Décollement ou défaut de planéité initial</td></tr>
                <tr><td>Symptômes uniformes dès la première année</td><td>Conditions de mise en œuvre à examiner</td></tr>
              </tbody>
            </table>
          </div>

          <h2 id="quand-expert">Quand passer à une expertise</h2>
          <p>Le passage à une expertise se justifie quand une décision coûteuse dépend de la réponse, quand plusieurs hypothèses restent également plausibles, ou quand un tiers doit être convaincu. Voir la page <a href="${rel(D, 'pages/expertise.html')}">Expertise parquet</a>.</p>
        </div>

        <aside class="article-aside">
          <nav class="toc" data-toc data-toc-scope="#article-body" aria-labelledby="toc-title-diag">
            <p class="toc__title" id="toc-title-diag">Sur cette page</p>
            <ul class="toc__list" data-toc-list></ul>
          </nav>
          <div class="aside-card">
            <p class="aside-card__title">Problèmes courants</p>
            <p>Chaque symptôme dispose de sa page dédiée&nbsp;: causes, vérifications, erreurs fréquentes.</p>
            <a class="btn btn--outline btn--sm btn--block" href="${rel(D, 'pages/problemes.html')}">Voir les problèmes</a>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <section class="section section--mineral" id="pre-diagnostic">
    <div class="container">
      <div class="sec-head" data-reveal>
        <p class="kicker">Parcours guidé</p>
        <h2>Décrivez votre problème</h2>
        <p class="lead">Cinq questions, une orientation générale, et les vérifications à mener. Rien n’est envoyé&nbsp;: tout se passe dans votre navigateur.</p>
      </div>
      <div class="u-mt-xl" data-reveal>
        <div data-diagnostic data-quote-url="${rel(D, 'pages/devis.html')}">
          <noscript>
            <div class="callout callout--neutral">
              <p class="callout__title">JavaScript désactivé</p>
              <p>Le pré-diagnostic nécessite JavaScript. Décrivez votre situation dans le <a class="link" href="${rel(D, 'pages/devis.html')}">formulaire de demande</a>.</p>
            </div>
          </noscript>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container container--text">
      <div class="sec-head" data-reveal>
        <p class="kicker">Questions fréquentes</p>
        <h2>Autour du diagnostic</h2>
      </div>
      <div class="u-mt-lg" data-reveal>
${faqAccordion(DIAGNOSTIC_FAQ, 'diag-faq')}
      </div>
    </div>
  </section>

${ctaBand(D, {
    title: 'Votre situation mérite un regard précis',
    secondaryLabel: null,
  })}
`;

  return {
    path: 'pages/diagnostic.html',
    depth: D,
    navCurrent: 'pages/diagnostic.html',
    title: 'Diagnostic parquet : méthode et pré-diagnostic en ligne',
    description:
      'Méthode de diagnostic d’un problème de parquet : où, depuis quand, évolution, contexte. Observations à faire soi-même et pré-diagnostic guidé en 5 questions.',
    css: ['pages/home.css', 'pages/article.css', 'pages/diagnostic.css'],
    ogImage: 'assets/images/inspection.jpg',
    body,
    jsonLd: [crumb.jsonLd, faqJsonLd(DIAGNOSTIC_FAQ)],
  };
}

/* ========================================================================== */
/* Hub : problèmes de parquet                                                 */
/* ========================================================================== */

function problemsHubPage() {
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Problèmes de parquet' },
  ]);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'Hub éditorial',
    title: 'Problèmes de parquet',
    lead: 'Huit désordres courants, leurs causes possibles, les erreurs fréquentes et les premières vérifications. Chaque page suit la même structure pour être lue vite.',
  })}

  <section class="section">
    <div class="container">
${indexList(D)}
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="split split--top">
        <div class="sec-head" data-reveal>
          <p class="kicker">Grille de lecture</p>
          <h2>Trois questions avant de choisir un symptôme</h2>
          <p class="lead">Elles suffisent souvent à réduire de moitié le nombre d’hypothèses.</p>
        </div>
        <div class="grid" data-reveal>
          <div class="stage">
            <p class="stage__num">01</p>
            <p class="stage__text"><strong>Étendue.</strong> Quelques lames, une zone, ou toute la pièce&nbsp;? Plus c’est étendu, plus le support est en cause.</p>
          </div>
          <div class="stage">
            <p class="stage__num">02</p>
            <p class="stage__text"><strong>Chronologie.</strong> Depuis la pose, après un événement, ou progressivement&nbsp;? La date d’apparition oriente l’analyse.</p>
          </div>
          <div class="stage">
            <p class="stage__num">03</p>
            <p class="stage__text"><strong>Réversibilité.</strong> Le phénomène varie-t-il avec les saisons&nbsp;? Un désordre réversible n’est pas un désordre stable.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="sec-head sec-head--split" data-reveal>
        <div class="sec-head">
          <p class="kicker">Pour aller plus loin</p>
          <h2>Articles associés</h2>
        </div>
        <a class="link-arrow" href="${rel(D, 'pages/conseils.html')}">Tous les conseils</a>
      </div>
      <div class="grid grid--3 u-mt-xl">
${ARTICLES.slice(0, 3).map((article, index) => articleCard(D, article, index)).join('\n')}
      </div>
    </div>
  </section>

${ctaBand(D)}
`;

  return {
    path: 'pages/problemes.html',
    depth: D,
    navCurrent: 'pages/problemes.html',
    title: 'Problèmes de parquet : symptômes, causes et vérifications',
    description:
      'Parquet qui grince, gondole, lames qui bougent, humidité, taches, dégât des eaux, défaut de pose : causes possibles et premières vérifications pour chaque symptôme.',
    css: ['pages/home.css'],
    body,
    jsonLd: [crumb.jsonLd],
  };
}

/* ========================================================================== */
/* Hub : conseils                                                             */
/* ========================================================================== */

export const ADVICE_CATEGORIES = [
  {
    slug: 'entretien',
    label: 'Entretien',
    image: 'entretien.jpg',
    teaser: 'Préserver une finition, choisir les bons produits, éviter les gestes qui abîment.',
  },
  {
    slug: 'renovation',
    label: 'Rénovation',
    image: 'parquet-ancien.jpg',
    teaser: 'Ce qui se rénove, ce qui se remplace, et comment décider entre les deux.',
  },
  {
    slug: 'pose',
    label: 'Pose',
    image: 'pose-support.jpg',
    teaser: 'Support, acclimatation, jeux périphériques : les conditions qui font tenir un parquet.',
  },
  {
    slug: 'choisir-parquet',
    label: 'Choisir un parquet',
    image: 'interieur-clair.jpg',
    teaser: 'Massif, contrecollé, stratifié : ce qui distingue réellement ces familles.',
  },
];

function adviceHubPage() {
  const crumb = breadcrumb(D, [{ label: 'Accueil', href: 'index.html' }, { label: 'Conseils' }]);

  const categories = ADVICE_CATEGORIES.map(
    (category, index) => `      <article class="card" data-reveal data-reveal-delay="${index * 50}">
        <div class="card__media card__media--16x9">
          <img src="${rel(D, `assets/images/${category.image}`)}" alt="" width="1400" height="788" loading="lazy" decoding="async">
        </div>
        <div class="card__body">
          <h3 class="card__title"><a class="card__link" href="${rel(D, `pages/conseils/${category.slug}.html`)}">${category.label}</a></h3>
          <p class="card__text">${category.teaser}</p>
        </div>
      </article>`
  ).join('\n');

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'Conseils',
    title: 'Comprendre son parquet',
    lead: 'Un média technique consacré au parquet&nbsp;: diagnostic, entretien, rénovation, pose, humidité, défauts et choix du revêtement. Des contenus écrits pour être utiles, pas pour vendre.',
  })}

  <section class="section">
    <div class="container">
      <div class="sec-head" data-reveal>
        <h2>Catégories</h2>
      </div>
      <div class="grid grid--4 u-mt-lg">
${categories}
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="sec-head" data-reveal>
        <p class="kicker">Derniers articles</p>
        <h2>À lire</h2>
      </div>
      <div class="grid grid--3 u-mt-lg">
${ARTICLES.map((article, index) => articleCard(D, article, index)).join('\n')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="sec-head" data-reveal>
        <p class="kicker">Par symptôme</p>
        <h2>Vous cherchez une réponse précise&nbsp;?</h2>
        <p class="lead">Les pages « problèmes » traitent chaque symptôme séparément.</p>
      </div>
      <ul class="filter-bar u-mt-lg" data-reveal>
${PROBLEMS.map((problem) => `        <li><a class="filter-chip" href="${rel(D, `pages/problemes/${problem.slug}.html`)}">${problem.label}</a></li>`).join('\n')}
      </ul>
    </div>
  </section>

${ctaBand(D)}
`;

  return {
    path: 'pages/conseils.html',
    depth: D,
    navCurrent: 'pages/conseils.html',
    title: 'Conseils parquet : entretien, rénovation, pose, humidité',
    description:
      'Articles techniques sur le parquet : diagnostic, entretien, rénovation, pose, humidité, défauts et choix du revêtement. Contenus pédagogiques et concrets.',
    css: ['pages/home.css'],
    ogImage: 'assets/images/interieur-clair.jpg',
    body,
    jsonLd: [crumb.jsonLd],
  };
}

/* ========================================================================== */
/* À propos                                                                   */
/* ========================================================================== */

function aboutPage() {
  const crumb = breadcrumb(D, [{ label: 'Accueil', href: 'index.html' }, { label: 'À propos' }]);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'À propos',
    title: 'Un site consacré à une seule question&nbsp;: que se passe-t-il sous vos pieds&nbsp;?',
    lead: 'Expert Parquet est né d’un constat simple&nbsp;: sur un parquet qui pose problème, la plupart des recherches en ligne mènent à des solutions avant d’avoir posé la question de la cause.',
  })}

  <section class="section">
    <div class="container">
      <div class="split">
        <div class="prose">
          <h2>Notre positionnement</h2>
          <p>Nous traitons le parquet comme un système&nbsp;: un revêtement, un support, un environnement et des conditions de pose. Un symptôme se lit dans cet ensemble, jamais isolément. C’est la seule approche qui permet de dire honnêtement, parfois, qu’il n’y a rien à faire — ou au contraire que le problème visible n’est pas le vrai sujet.</p>
          <h2>Ce que vous trouverez ici</h2>
          <ul>
            <li>Des pages par symptôme, structurées de la même façon pour être lues vite.</li>
            <li>Un pré-diagnostic guidé qui pose le contexte sans prétendre conclure.</li>
            <li>Des contenus techniques rédigés sans jargon inutile ni promesse commerciale.</li>
            <li>Un point d’entrée unique pour décrire une situation et demander une expertise.</li>
          </ul>
          <h2>Ce que nous ne faisons pas</h2>
          <ul>
            <li>Nous n’annonçons pas de tarif avant d’avoir compris la demande.</li>
            <li>Nous ne publions ni avis, ni compteur, ni label que nous ne pourrions justifier.</li>
            <li>Nous ne présentons pas une orientation en ligne comme un diagnostic établi.</li>
          </ul>
        </div>
        <div class="media media--4x3" data-reveal>
          <img src="${rel(D, 'assets/images/interieur-clair.jpg')}" alt="Intérieur clair avec parquet bois" width="1600" height="1067" loading="lazy" decoding="async">
        </div>
      </div>
    </div>
  </section>

  <section class="section section--alt">
    <div class="container">
      <div class="sec-head" data-reveal>
        <p class="kicker">${ICONS.alert} Informations à compléter</p>
        <h2>Cette page attend vos informations réelles</h2>
        <p class="lead">Rien de ce qui suit n’a été inventé. Ces emplacements sont prévus pour recevoir des informations vérifiables avant la mise en ligne.</p>
      </div>
      <div class="grid grid--2 u-mt-lg" data-reveal>
        <div class="stage">
          <p class="card__title">Structure juridique</p>
          <p class="card__text">Raison sociale, forme juridique, SIRET, adresse du siège&nbsp;: <span class="placeholder-value">[À renseigner]</span></p>
        </div>
        <div class="stage">
          <p class="card__title">Parcours et qualifications</p>
          <p class="card__text">Formation, expérience, éventuelles certifications&nbsp;: <span class="placeholder-value">[À renseigner]</span>. Aucune qualification ne sera affichée sans justificatif.</p>
        </div>
        <div class="stage">
          <p class="card__title">Assurance professionnelle</p>
          <p class="card__text">Assureur, numéro de contrat, étendue de la couverture&nbsp;: <span class="placeholder-value">[À renseigner]</span></p>
        </div>
        <div class="stage">
          <p class="card__title">Zone d’intervention</p>
          <p class="card__text">Départements ou régions couverts, conditions de déplacement&nbsp;: <span class="placeholder-value">[À renseigner]</span></p>
        </div>
      </div>
      <p class="disclaimer u-mt-lg">Tant que ces champs ne sont pas remplis, aucun chiffre, aucune date de création, aucun nombre de clients et aucune distinction ne figure sur ce site. Les valeurs sont centralisées dans <code>js/config/site.js</code>.</p>
    </div>
  </section>

${processSection(D)}

${ctaBand(D, {
    title: 'Parlons de votre parquet',
    text: 'Décrivez votre situation, avec ou sans photos. Vous recevrez une réponse sur ce qu’il est utile de vérifier.',
  })}
`;

  return {
    path: 'pages/a-propos.html',
    depth: D,
    navCurrent: 'pages/a-propos.html',
    title: 'À propos dExpert Parquet',
    description:
      'Le positionnement dExpert Parquet : traiter le parquet comme un système — revêtement, support, environnement, conditions de pose — et distinguer le symptôme de sa cause.',
    css: ['pages/home.css', 'pages/article.css'],
    ogImage: 'assets/images/interieur-clair.jpg',
    body,
    jsonLd: [crumb.jsonLd],
  };
}

/* ========================================================================== */
/* FAQ                                                                        */
/* ========================================================================== */

const FAQ_GROUPS = [
  {
    id: 'faq-symptomes',
    title: 'Comprendre un symptôme',
    items: [
      {
        q: 'Pourquoi mon parquet grince-t-il&nbsp;?',
        a: '<p>Le grincement provient d’un frottement&nbsp;: entre deux lames, entre le parquet et son support, ou entre le support et la structure. Les causes fréquentes sont une fixation desserrée, une sous-couche tassée, un jeu périphérique insuffisant ou une variation d’humidité saisonnière. Détail complet sur la page <a href="problemes/parquet-qui-grince.html">Parquet qui grince</a>.</p>',
      },
      {
        q: 'Pourquoi des lames se soulèvent-elles&nbsp;?',
        a: '<p>Parce que le bois a gonflé et n’a pas où s’étendre. Deux familles de causes&nbsp;: un apport d’humidité (remontée du support, fuite, hygrométrie élevée) ou un manque de jeu de dilatation en périphérie. Souvent les deux se combinent.</p>',
      },
      {
        q: 'L’humidité peut-elle endommager un parquet&nbsp;?',
        a: '<p>Oui, et pas seulement par un contact direct avec de l’eau. Une hygrométrie durablement élevée suffit à faire gonfler les lames, à décoller une pose collée et à favoriser des moisissures sous le revêtement. L’inverse est vrai aussi&nbsp;: un air trop sec fait apparaître des jeux entre lames.</p>',
      },
      {
        q: 'Des jeux entre les lames en hiver sont-ils normaux&nbsp;?',
        a: '<p>Un léger retrait en période de chauffe est un comportement normal du bois, particulièrement sur du massif. Ce qui n’est pas normal, c’est une amplitude importante, des jeux qui ne se referment jamais, ou l’apparition de fentes dans les lames elles-mêmes.</p>',
      },
    ],
  },
  {
    id: 'faq-travaux',
    title: 'Réparer, rénover, remplacer',
    items: [
      {
        q: 'Quand faut-il remplacer un parquet&nbsp;?',
        a: '<p>Trois situations principales&nbsp;: l’épaisseur utile restante ne permet plus de ponçage, les lames sont dégradées structurellement sur une part importante de la surface, ou le support impose une reprise complète. Un parquet visuellement fatigué n’est pas nécessairement un parquet à remplacer.</p>',
      },
      {
        q: 'Peut-on réparer seulement quelques lames&nbsp;?',
        a: '<p>Souvent oui, en pose clouée ou collée, à condition de retrouver des lames compatibles en essence, largeur et épaisseur. La difficulté n’est pas technique mais esthétique&nbsp;: une lame neuve n’a pas la patine des autres. Sur une pose flottante, le remplacement impose parfois de démonter jusqu’à la zone concernée.</p>',
      },
      {
        q: 'Un stratifié peut-il être poncé&nbsp;?',
        a: '<p>Non. Un stratifié n’est pas du bois massif&nbsp;: sa couche décorative est un film imprimé. Les lames abîmées se remplacent, mais la surface ne se rénove pas par ponçage. C’est une différence essentielle avec un parquet massif ou contrecollé.</p>',
      },
      {
        q: 'Faut-il traiter la cause avant de refaire le parquet&nbsp;?',
        a: '<p>Oui, systématiquement. Reposer un revêtement sur un support encore humide ou sur un défaut de planéité non corrigé revient à reproduire le désordre, généralement plus vite que la première fois.</p>',
      },
    ],
  },
  {
    id: 'faq-expertise',
    title: 'L’expertise en pratique',
    items: [
      {
        q: 'Une expertise nécessite-t-elle de démonter le parquet&nbsp;?',
        a: '<p>Dans la majorité des cas, non. Les jeux périphériques, la planéité, les mesures d’humidité et le sondage au niveau d’un seuil ou d’une bouche d’aération apportent déjà beaucoup. Une dépose ponctuelle n’intervient que si elle est indispensable, et toujours après accord explicite.</p>',
      },
      {
        q: 'Puis-je envoyer des photos avant une intervention&nbsp;?',
        a: '<p>Oui, c’est recommandé. Le formulaire de demande prévoit une sélection de photos. Précision importante&nbsp;: tant qu’aucun serveur n’est connecté à ce site, les photos sont uniquement prévisualisées dans votre navigateur et ne sont pas transmises.</p>',
      },
      {
        q: 'Quelles informations préparer avant une demande&nbsp;?',
        a: '<p>La date de pose approximative, le type de parquet s’il est connu, la nature du support, la chronologie du problème, et quelques photos d’ensemble et de détail prises en lumière naturelle. Les devis ou factures de pose sont précieux en cas de suspicion de défaut de mise en œuvre.</p>',
      },
      {
        q: 'Combien coûte une expertise&nbsp;?',
        a: '<p>Aucun tarif n’est affiché sur ce site tant que la grille n’a pas été arrêtée&nbsp;: <span class="placeholder-value">[À renseigner]</span>. Le coût dépend de la nature de la demande, de la surface concernée et du déplacement. Il est communiqué avant toute intervention.</p>',
      },
      {
        q: 'Intervenez-vous dans ma région&nbsp;?',
        a: '<p>La zone d’intervention n’est pas encore renseignée&nbsp;: <span class="placeholder-value">[À renseigner]</span>. Indiquez votre code postal dans votre demande, la réponse précisera ce qui est possible.</p>',
      },
    ],
  },
];

function faqPage() {
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Questions fréquentes' },
  ]);

  const groups = FAQ_GROUPS.map(
    (group) => `      <div class="u-mt-xl" data-reveal>
        <h2 id="${group.id}">${group.title}</h2>
        <div class="u-mt-md">
${faqAccordion(group.items, group.id)}
        </div>
      </div>`
  ).join('\n');

  const allItems = FAQ_GROUPS.flatMap((group) => group.items);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'FAQ',
    title: 'Questions fréquentes',
    lead: 'Les questions qui reviennent le plus souvent, regroupées par thème. Les réponses restent informatives&nbsp;: elles n’engagent aucune prestation et ne remplacent pas une observation sur place.',
  })}

  <section class="section">
    <div class="container container--text">
${groups}
      <p class="disclaimer u-mt-xl">Une question absente de cette liste&nbsp;? Elle a sa place dans le <a class="link" href="${rel(D, 'pages/contact.html')}">formulaire de contact</a>.</p>
    </div>
  </section>

${ctaBand(D)}
`;

  return {
    path: 'pages/faq.html',
    depth: D,
    navCurrent: null,
    title: 'FAQ parquet : symptômes, travaux et expertise',
    description:
      'Réponses aux questions fréquentes sur le parquet : grincement, lames qui se soulèvent, humidité, remplacement, réparation partielle et déroulement d’une expertise.',
    css: ['pages/home.css', 'pages/article.css'],
    body,
    jsonLd: [crumb.jsonLd, faqJsonLd(allItems)],
  };
}

/* ========================================================================== */
/* Mentions légales                                                           */
/* ========================================================================== */

function legalPage() {
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Mentions légales' },
  ]);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'Informations légales',
    title: 'Mentions légales',
    lead: 'Cette page est un gabarit. Elle doit être complétée avec des informations réelles et vérifiées avant toute mise en ligne publique.',
  })}

  <section class="section">
    <div class="container container--text">
      <div class="callout callout--warning">
        <p class="callout__title">${ICONS.alert} Document non finalisé</p>
        <p>Aucune information juridique n’a été inventée. Chaque mention <span class="placeholder-value">[À renseigner]</span> doit être remplie par l’éditeur du site, si nécessaire avec l’aide d’un conseil.</p>
      </div>

      <div class="prose u-mt-xl">
        <h2>Éditeur du site</h2>
        <p>Raison sociale&nbsp;: <span class="placeholder-value">[À renseigner]</span><br>
        Forme juridique&nbsp;: <span class="placeholder-value">[À renseigner]</span><br>
        Siège social&nbsp;: <span class="placeholder-value">[À renseigner]</span><br>
        SIRET&nbsp;: <span class="placeholder-value">[À renseigner]</span><br>
        Directeur de la publication&nbsp;: <span class="placeholder-value">[À renseigner]</span><br>
        Contact&nbsp;: <span data-contact="email"></span></p>

        <h2>Hébergement</h2>
        <p>Hébergeur&nbsp;: <span class="placeholder-value">[À renseigner]</span><br>
        Adresse&nbsp;: <span class="placeholder-value">[À renseigner]</span></p>

        <h2>Propriété intellectuelle</h2>
        <p>Les textes de ce site sont originaux. Les photographies proviennent de banques d’images libres de droits&nbsp;; leurs sources sont listées dans le fichier <code>assets/images/CREDITS.md</code> du projet. Toute réutilisation des contenus rédactionnels nécessite l’accord préalable de l’éditeur.</p>

        <h2>Données personnelles</h2>
        <p>Les formulaires de ce site collectent des données destinées uniquement au traitement des demandes. Responsable de traitement&nbsp;: <span class="placeholder-value">[À renseigner]</span>. Durée de conservation&nbsp;: <span class="placeholder-value">[À renseigner]</span>. Destinataires&nbsp;: <span class="placeholder-value">[À renseigner]</span>.</p>
        <p>Conformément au règlement général sur la protection des données, vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité, exerçable à l’adresse suivante&nbsp;: <span data-contact="email"></span>.</p>
        <p><strong>État actuel&nbsp;:</strong> aucun formulaire de ce site n’est connecté à un serveur. Aucune donnée saisie n’est transmise ni stockée&nbsp;; tout reste dans le navigateur du visiteur.</p>

        <h2>Cookies et mesure d’audience</h2>
        <p>Ce site n’utilise actuellement aucun cookie, aucun traceur et aucun outil de mesure d’audience. Si un outil d’analyse est ajouté ultérieurement, un dispositif de recueil du consentement sera mis en place au préalable.</p>

        <h2>Portée des contenus</h2>
        <p>Les contenus publiés ont une vocation informative. Le pré-diagnostic en ligne constitue une orientation générale et ne remplace pas une expertise sur place. Aucun contenu de ce site ne saurait être assimilé à un rapport d’expertise judiciaire, à une attestation officielle ou à un avis d’assurance.</p>

        <h2>Liens externes</h2>
        <p>Ce site peut renvoyer vers des ressources externes lorsque cela présente un intérêt éditorial. L’éditeur n’exerce aucun contrôle sur le contenu de ces sites tiers.</p>
      </div>
    </div>
  </section>
`;

  return {
    path: 'pages/mentions-legales.html',
    depth: D,
    navCurrent: null,
    title: 'Mentions légales',
    description:
      'Mentions légales du site Expert Parquet : éditeur, hébergement, propriété intellectuelle, données personnelles et portée des contenus publiés.',
    css: ['pages/home.css', 'pages/article.css'],
    body,
    jsonLd: [crumb.jsonLd],
  };
}

export function corePages() {
  return [
    expertisePage(),
    diagnosticPage(),
    problemsHubPage(),
    adviceHubPage(),
    aboutPage(),
    faqPage(),
    legalPage(),
  ];
}
