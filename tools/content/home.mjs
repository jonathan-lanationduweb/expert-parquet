import { rel } from '../layout.mjs';
import {
  ICONS,
  indexList,
  ctaBand,
  processSection,
  showcase,
  ARTICLES,
  articleCard,
  faqAccordion,
  faqJsonLd,
  sectionHead,
} from '../partials.mjs';

const D = 0;

/* Trois grands domaines, présentés en lignes alternées pleine largeur. */
const DOMAINS = [
  {
    num: '01',
    title: 'Diagnostic du parquet',
    text: 'Identifier ce que l’on observe réellement, puis remonter aux causes possibles. Un grincement, une lame qui bouge ou une tache sont des signaux : leur origine se trouve presque toujours ailleurs que là où on les voit.',
    points: ['Lecture des symptômes', 'Mesures d’humidité', 'Contrôle des jeux et de la planéité'],
    image: 'inspection.jpg',
    href: 'pages/diagnostic.html',
    cta: 'La méthode de diagnostic',
  },
  {
    num: '02',
    title: 'Désordres et défauts',
    text: 'Humidité, soulèvement, grincement, lames mobiles, défauts de pose. Chaque désordre a sa grille de lecture : étendue, chronologie, réversibilité. Ce sont ces trois questions qui réduisent le champ des hypothèses.',
    points: ['Sept familles de désordres documentées', 'Erreurs fréquentes à éviter', 'Vérifications réalisables sans outillage'],
    image: 'domaine-desordres.jpg',
    href: 'pages/problemes.html',
    cta: 'Voir les désordres',
  },
  {
    num: '03',
    title: 'Expertise avant intervention',
    text: 'Évaluer la situation avant de rénover, réparer ou remplacer. Reposer un revêtement sans avoir traité la cause revient à programmer le même désordre, souvent plus vite que la première fois.',
    points: ['Avant rénovation', 'Après sinistre', 'Suspicion de défaut de mise en œuvre'],
    image: 'architectural.jpg',
    href: 'pages/expertise.html',
    cta: 'En quoi consiste l’expertise',
  },
];

const EXPERTISES = [
  'Diagnostic parquet',
  'Humidité et déformations',
  'Défauts de pose',
  'Parquet après dégât des eaux',
  'Expertise avant rénovation',
  'Analyse d’un parquet ancien',
  'Désordres esthétiques',
  'Préparation avant remplacement',
];

const FAQ = [
  {
    q: 'Le pré-diagnostic en ligne remplace-t-il une expertise&nbsp;?',
    a: '<p>Non. Il oriente : à partir de quelques réponses, il propose des causes possibles et des vérifications utiles. Seule une observation sur place, avec des mesures, permet d’identifier une cause. C’est écrit à la fin du parcours.</p>',
  },
  {
    q: 'Faut-il démonter le parquet pour comprendre un problème&nbsp;?',
    a: '<p>Dans la plupart des cas, non. Beaucoup d’informations s’obtiennent sans dépose : jeux périphériques, planéité, mesures d’humidité de l’air et du support, sondage au niveau d’un seuil ou d’une bouche d’aération. Une dépose ponctuelle n’intervient que si elle est indispensable et après accord.</p>',
  },
  {
    q: 'Puis-je envoyer des photos avant une intervention&nbsp;?',
    a: '<p>Oui, c’est recommandé : elles font gagner du temps et permettent de préparer la visite. Le formulaire de demande prévoit une sélection de photos. <strong>À noter :</strong> tant qu’aucun serveur n’est connecté, les photos sont uniquement prévisualisées dans votre navigateur et ne sont pas transmises.</p>',
  },
  {
    q: 'Intervenez-vous partout en France&nbsp;?',
    a: '<p>La zone d’intervention n’est pas encore renseignée sur ce site. Précisez votre code postal dans votre demande : la réponse indiquera ce qui est possible pour votre secteur.</p>',
  },
];

export function homePage() {
  const domains = DOMAINS.map(
    (domain) => `        <article class="domain" data-reveal>
          <div class="domain__media">
            <img src="${rel(D, `assets/images/${domain.image}`)}" alt="" width="1800" height="1440" loading="lazy" decoding="async">
          </div>
          <div class="domain__body">
            <span class="domain__num">${domain.num}</span>
            <h3 class="domain__title">${domain.title}</h3>
            <p class="domain__text">${domain.text}</p>
            <ul class="rich-list domain__list">
${domain.points.map((point) => `              <li>${point}</li>`).join('\n')}
            </ul>
            <p class="domain__cta"><a class="link-arrow" href="${rel(D, domain.href)}">${domain.cta}</a></p>
          </div>
        </article>`
  ).join('\n');

  const expertises = EXPERTISES.map(
    (item, index) => `          <li class="index-row" data-static>
            <span class="index-row__num">${String(index + 1).padStart(2, '0')}</span>
            <span class="index-row__title">${item}</span>
          </li>`
  ).join('\n');

  const body = `  <!-- ============================================== HERO IMMERSIF -->
  <section class="hero">
    <!--
      MÉDIA DU HERO
      Aujourd’hui : une image fixe. Le conteneur, le dégradé de lisibilité et les
      règles CSS (.hero__media img / .hero__media video) sont déjà prévus pour une
      vidéo. Le jour où le fichier existe, remplacer l’img ci-dessous par :

        <video autoplay muted loop playsinline preload="metadata"
               poster="assets/images/hero.jpg" width="1920" height="1080">
          <source src="assets/video/hero.webm" type="video/webm">
          <source src="assets/video/hero.mp4" type="video/mp4">
          <img src="assets/images/hero.jpg" alt="" width="2000" height="1333">
        </video>

      Aucune vidéo n’est fournie à ce stade et aucun fichier factice n’a été créé.
      Cahier des charges du tournage : VIDEO_BRIEF.md.
    -->
    <div class="hero__media">
      <img src="${rel(D, 'assets/images/hero.jpg')}" alt="" width="2000" height="1333" fetchpriority="high" decoding="async">
    </div>
    <div class="container hero__inner">
      <h1 class="hero-title hero__title">Un problème avec votre parquet&nbsp;?</h1>
      <p class="hero__sub">Commençons par comprendre ce qui se passe.</p>
      <div class="hero__foot">
        <p class="hero__lead">Diagnostic, expertise et conseils techniques pour identifier l’origine d’un désordre avant d’engager des travaux.</p>
        <div class="hero__actions btn-group">
          <a class="btn btn--primary btn--lg" href="${rel(D, 'pages/devis.html')}">Demander une expertise</a>
          <a class="btn btn--on-dark btn--lg" href="#pre-diagnostic">Décrire mon problème</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================== POSITIONNEMENT -->
  <section class="statement">
    <div class="container">
      <p class="statement__text" data-reveal>Comprendre l’origine d’un problème <em>avant</em> de décider comment intervenir.</p>
      <div class="statement__grid">
        <div class="statement__item" data-reveal>
          <h3>Le symptôme n’est pas la cause</h3>
          <p>Un même bruit, une même déformation peuvent avoir quatre origines différentes. Traiter ce que l’on voit sans chercher pourquoi, c’est refaire deux fois.</p>
        </div>
        <div class="statement__item" data-reveal data-reveal-delay="80">
          <h3>Presque tout se joue sous le parquet</h3>
          <p>Planéité, siccité, nature du support, hygrométrie de la pièce. Le revêtement n’est souvent que le révélateur d’un problème situé ailleurs.</p>
        </div>
        <div class="statement__item" data-reveal data-reveal-delay="160">
          <h3>Une observation, pas une promesse</h3>
          <p>Ce site ne vend pas de solution avant d’avoir regardé. Il arrive qu’une observation conclue qu’il n’y a rien à faire — c’est aussi un résultat.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================ DOMAINES D’EXPERTISE -->
  <section class="section section--alt" id="domaines">
    <div class="container">
${sectionHead({
    kicker: 'Nos domaines',
    title: 'Trois manières d’aborder un parquet',
    text: 'Selon l’avancement de votre réflexion, l’entrée n’est pas la même : identifier un symptôme, comprendre un désordre installé, ou évaluer une situation avant travaux.',
  })}
      <div class="u-mt-2xl">
${domains}
      </div>
    </div>
  </section>

  <!-- ================================================ LISTE PROBLÈMES -->
  <section class="section" id="problemes">
    <div class="container">
${sectionHead({
    kicker: 'Par symptôme',
    title: 'Quel problème rencontrez-vous&nbsp;?',
    text: 'Huit désordres courants, chacun traité de la même façon : symptômes, causes possibles, erreurs fréquentes, premières vérifications.',
    link: `<a class="link-arrow" href="${rel(D, 'pages/problemes.html')}">Voir tous les problèmes</a>`,
  })}
      <div class="u-mt-2xl" data-reveal>
${indexList(D)}
      </div>
    </div>
  </section>

  <!-- ================================================== OBSERVATION -->
  <section class="observation">
    <div class="observation__media">
      <img src="${rel(D, 'assets/images/hero-wide.jpg')}" alt="Intérieur clair avec parquet et grandes ouvertures" width="2400" height="1602" loading="lazy" decoding="async">
    </div>
    <div class="observation__body">
      <div data-reveal>
        <p class="kicker">Notre approche</p>
        <h2 class="u-mt-md">L’expertise commence par l’observation</h2>
        <p>Un même symptôme peut avoir plusieurs origines, et deux symptômes très différents peuvent partager la même cause. C’est pourquoi l’analyse ne part jamais de la solution : elle part de ce qui est mesurable.</p>
        <ul class="observation__factors">
          <li><span>01</span> Le support</li>
          <li><span>02</span> L’humidité</li>
          <li><span>03</span> Les conditions de pose</li>
          <li><span>04</span> L’environnement</li>
          <li><span>05</span> Le vieillissement</li>
          <li><span>06</span> L’usage de la pièce</li>
        </ul>
        <p class="observation__cta"><a class="link-arrow link-arrow--inverse" href="${rel(D, 'pages/expertise.html')}">Découvrir notre approche</a></p>
      </div>
    </div>
  </section>

  <!-- ================================================ PRÉ-DIAGNOSTIC -->
  <section class="section prediag" id="pre-diagnostic">
    <div class="container">
      <div class="prediag__grid">
        <div class="prediag__intro" data-reveal>
          <p class="kicker">Pré-diagnostic</p>
          <h2 class="u-mt-md">Décrivez votre problème</h2>
          <p>Cinq questions courtes pour poser le contexte. À la fin, une orientation générale et les vérifications utiles — pas un diagnostic.</p>
          <ol class="prediag__steps">
            <li><b>01</b> Le symptôme observé</li>
            <li><b>02</b> Depuis quand</li>
            <li><b>03</b> La pièce concernée</li>
            <li><b>04</b> Le type de parquet</li>
            <li><b>05</b> Le support, si connu</li>
          </ol>
        </div>
        <div data-reveal data-reveal-delay="90">
          <div data-diagnostic data-quote-url="${rel(D, 'pages/devis.html')}">
            <noscript>
              <div class="callout callout--neutral">
                <p class="callout__title">JavaScript désactivé</p>
                <p>Le pré-diagnostic interactif nécessite JavaScript. Vous pouvez décrire votre situation directement dans le <a class="link" href="${rel(D, 'pages/devis.html')}">formulaire de demande</a>, ou parcourir les <a class="link" href="${rel(D, 'pages/problemes.html')}">problèmes courants</a>.</p>
              </div>
            </noscript>
          </div>
        </div>
      </div>
    </div>
  </section>

${processSection(D)}

  <!-- ============================================ SITUATIONS / CARROUSEL -->
  <section class="section section--inverse" id="situations">
    <div class="container">
${sectionHead({
    kicker: 'Cas de figure',
    title: 'Situations à analyser',
    text: 'Les configurations qui reviennent le plus souvent. Ce ne sont pas des réalisations : ce sont les situations types sur lesquelles porte une expertise.',
  })}
      <div class="u-mt-2xl" data-reveal>
${showcase(D)}
      </div>
    </div>
  </section>

  <!-- ================================================== NOS EXPERTISES -->
  <section class="section">
    <div class="container">
      <div class="split split--wide-text split--top">
        <div data-reveal>
          <div class="sec-head__rule"></div>
          <p class="kicker">Nos expertises</p>
          <h2 class="u-mt-md sec-head__title">Ce sur quoi porte une intervention</h2>
          <p class="lead u-mt-lg u-maxw-46">Selon la demande, l’analyse se concentre sur un point précis ou sur l’ensemble du système parquet, support et environnement.</p>
          <p class="u-mt-xl"><a class="btn btn--dark" href="${rel(D, 'pages/devis.html')}">Demander une expertise</a></p>
        </div>
        <div data-reveal data-reveal-delay="90">
          <ul class="index-list index-list--compact">
${expertises}
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- ======================================================= CONSEILS -->
  <section class="section section--alt" id="conseils">
    <div class="container">
${sectionHead({
    kicker: 'Conseils',
    title: 'Comprendre son parquet',
    text: 'Un média technique consacré au parquet, écrit pour être utile avant l’intervention plutôt que pour vendre une prestation.',
    link: `<a class="link-arrow" href="${rel(D, 'pages/conseils.html')}">Tous les conseils</a>`,
  })}
      <div class="magazine u-mt-2xl">
        <div>
${articleCard(D, ARTICLES[4], 0, 'feature')}
        </div>
        <div class="magazine__side">
${articleCard(D, ARTICLES[0], 1, 'row')}
${articleCard(D, ARTICLES[2], 2, 'row')}
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================================ FAQ -->
  <section class="section">
    <div class="container">
      <div class="faq-split">
        <div data-reveal>
          <div class="sec-head__rule"></div>
          <p class="kicker">Questions fréquentes</p>
          <h2 class="u-mt-md sec-head__title">Ce que l’on nous demande le plus souvent</h2>
          <p class="u-mt-lg"><a class="link-arrow" href="${rel(D, 'pages/faq.html')}">Voir toute la FAQ</a></p>
        </div>
        <div data-reveal data-reveal-delay="90">
${faqAccordion(FAQ, 'home-faq', { single: true })}
        </div>
      </div>
    </div>
  </section>

  <!-- ======================================================= PARCOURS -->
  <section class="section section--tight">
    <div class="container">
      <div class="journey" data-reveal>
        <div class="journey__item"><b>01</b>Problème constaté</div>
        <div class="journey__item"><b>02</b>Comprendre</div>
        <div class="journey__item"><b>03</b>Pré-diagnostic</div>
        <div class="journey__item"><b>04</b>Expertise</div>
        <div class="journey__item"><b>05</b>Recommandations</div>
      </div>
    </div>
  </section>

${ctaBand(D)}
`;

  return {
    path: 'index.html',
    depth: D,
    fullTitle: 'Expert Parquet — Diagnostic et expertise de parquet',
    title: 'Diagnostic et expertise de parquet',
    description:
      'Parquet qui grince, gonfle, se soulève ou s’abîme : identifiez l’origine du problème avant d’engager des travaux. Pré-diagnostic en ligne, expertise et conseils techniques.',
    css: ['pages/home.css', 'pages/diagnostic.css'],
    navCurrent: null,
    headerOver: true,
    body,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Expert Parquet',
        url: 'https://expert-parquet.com/',
        inLanguage: 'fr-FR',
        description:
          'Diagnostic, expertise et conseils techniques pour identifier l’origine d’un problème de parquet.',
      },
      faqJsonLd(FAQ),
    ],
  };
}

void ICONS;
