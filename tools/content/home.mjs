import { rel } from '../layout.mjs';
import { photo } from '../images.mjs';
import {
  indexList,
  ARTICLES,
  articleCard,
  faqAccordion,
  faqJsonLd,
  sectionHead,
  formulaireEnDemo,
  solutionsPartenaires,
  revealMore,
} from '../partials.mjs';

const D = 0;

/*
 * ORDRE DE LA PAGE (01/10/2026)
 *
 * C'est la hiérarchie des conversions du README, lue de haut en bas :
 *
 *   hero          « Un problème ou un projet parquet ? » — deux entrées
 *   ↓ tout de suite
 *   solutions     Trouver la bonne solution — Premibel, Over Parquet
 *   ↓ ensuite seulement
 *   comprendre    Comprendre mon problème — pré-diagnostic, désordres, conseils
 *   pré-diagnostic
 *   ↓ puis
 *   expertise     Quand faire appel à une expertise ? — Expert Parquet
 *   ↓
 *   éditorial     articles, FAQ
 *   ↓
 *   pied compact
 *
 * Ce qui a quitté l'accueil, et pourquoi : le manifeste et les trois domaines
 * disaient le positionnement AVANT de donner la réponse que la plupart des
 * visiteurs viennent chercher ; le bloc « observation », le déroulement, le
 * carrousel et le bandeau de parcours racontaient tous l'expertise, c'est-à-
 * dire la troisième conversion, sur quatre écrans. Ces contenus restent sur
 * les pages Expertise et Diagnostic, où ils sont à leur place.
 */

/* Les trois façons de comprendre, dans l'ordre où elles se présentent à
   quelqu'un qui constate un désordre : l'outil, puis la liste, puis la lecture. */
const ENTREES_COMPRENDRE = [
  {
    num: '01',
    title: 'Pré-diagnostic',
    text: 'Cinq questions pour poser le contexte et recevoir une première orientation — pas un diagnostic.',
    href: '#pre-diagnostic',
    cta: 'Décrire mon problème',
  },
  {
    num: '02',
    title: 'Problèmes de parquet',
    text: 'Huit désordres courants, chacun avec ses causes possibles, ses erreurs fréquentes et ses premières vérifications.',
    href: 'pages/problemes.html',
    cta: 'Voir les désordres',
  },
  {
    num: '03',
    title: 'Conseils',
    text: 'Entretien, rénovation, pose, choix du parquet&nbsp;: un média technique écrit pour être utile avant l’intervention.',
    href: 'pages/conseils.html',
    cta: 'Lire les conseils',
  },
];

/* Les situations où l'expertise se justifie. Des critères, jamais une
   invitation : règle éditoriale §2.7. Le quatrième dit ce que l'expertise peut
   conclure et qu'aucune vente ne dira — qu'il n'y a rien à remplacer. */
const CRITERES_EXPERTISE = [
  'La cause reste incertaine après les premières vérifications.',
  'Des travaux importants dépendent de la réponse&nbsp;: rénover, réparer ou remplacer.',
  'Un tiers est concerné — poseur, assurance, bailleur, copropriété.',
  'Le parquet peut encore être sauvé, et un remplacement serait prématuré.',
];

const FAQ = [
  {
    q: 'Le pré-diagnostic en ligne remplace-t-il une expertise&nbsp;?',
    a: '<p>Non. Il oriente&nbsp;: à partir de quelques réponses, il propose des causes possibles et des vérifications utiles. Seule une observation sur place, avec des mesures, permet d’identifier une cause. C’est écrit à la fin du parcours.</p>',
  },
  {
    q: 'Faut-il démonter le parquet pour comprendre un problème&nbsp;?',
    a: '<p>Dans la plupart des cas, non. Beaucoup d’informations s’obtiennent sans dépose&nbsp;: jeux périphériques, planéité, mesures d’humidité de l’air et du support, sondage au niveau d’un seuil ou d’une bouche d’aération. Une dépose ponctuelle n’intervient que si elle est indispensable et après accord.</p>',
  },
  {
    q: 'Puis-je envoyer des photos avant une intervention&nbsp;?',
    a:
      '<p>Oui, c’est recommandé&nbsp;: elles font gagner du temps et permettent de préparer la visite. Le formulaire de demande prévoit une sélection de photos.' +
      (formulaireEnDemo('devis')
        ? ' <strong>À noter&nbsp;:</strong> ce formulaire est pour l’instant une démonstration, les photos restent affichées dans votre navigateur et ne sont pas transmises.'
        : ' Elles sont transmises avec la demande, et consultables uniquement par Expert Parquet.') +
      '</p>',
  },
  {
    q: 'Intervenez-vous partout en France&nbsp;?',
    a: '<p>La zone d’intervention n’est pas encore renseignée sur ce site. Précisez votre code postal dans votre demande&nbsp;: la réponse indiquera ce qui est possible pour votre secteur.</p>',
  },
];

export function homePage() {
  const entrees = ENTREES_COMPRENDRE.map(
    (e, index) => `        <li class="stage" data-reveal data-reveal-delay="${index * 80}">
          <span class="stage__num">${e.num}</span>
          <h3 class="stage__title">${e.title}</h3>
          <p class="stage__text">${e.text}</p>
          <p class="stage__cta"><a class="link-arrow" href="${e.href.startsWith('#') ? e.href : rel(D, e.href)}">${e.cta}</a></p>
        </li>`
  ).join('\n');

  const criteres = CRITERES_EXPERTISE.map(
    (c, index) => `          <li><span>${String(index + 1).padStart(2, '0')}</span> ${c}</li>`
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
      Cahier des charges du tournage&nbsp;: VIDEO_BRIEF.md.
    -->
    <div class="hero__media">
      ${photo(D, 'hero.jpg', { sizes: '100vw', priority: true })}
    </div>
    <div class="container hero__inner">
      <h1 class="hero-title hero__title">Un problème ou un projet parquet&nbsp;?</h1>
      <p class="hero__sub">Comprenez votre situation, puis allez à la bonne solution.</p>
      <div class="hero__foot">
        <p class="hero__lead">Conseils, pré-diagnostic et expertise technique — et l’orientation vers l’enseigne qui correspond à votre projet.</p>
        <!-- Deux entrées, et deux seulement. Le projet d'abord : la plupart
             des visiteurs cherchent un parquet, pas une expertise. Celui qui
             a un désordre trouve sa porte juste à côté, au même niveau de
             lecture, et elle mène à la section qui lui est consacrée — pas
             directement à un formulaire. -->
        <div class="hero__actions btn-group">
          <a class="btn btn--primary btn--lg" href="#solutions">Choisir ou remplacer mon parquet</a>
          <a class="btn btn--on-dark btn--lg" href="#comprendre">J’ai un problème avec mon parquet</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ====================================== TROUVER LA BONNE SOLUTION
       Tout de suite après le hero, et c'est voulu : la plupart des visiteurs
       arrivent avec un projet, pas avec un litige. Deux noms, deux métiers,
       deux liens — aucun formulaire, aucune inscription. -->
  <section class="section section--tight" id="solutions">
    <div class="container">
${solutionsPartenaires(D, {
    campagne: 'accueil',
    kicker: 'Choisir ou remplacer un parquet',
    titre: 'Trouver la bonne solution',
    intro: 'Expert Parquet ne vend pas de parquet. Nous vous orientons vers l’enseigne qui correspond à votre projet — sans formulaire, sans inscription.',
    textes: {
      premibel: {
        texte: 'Choisir, comparer, être conseillé — pour un projet particulier ou professionnel.',
        action: 'Voir les parquets',
      },
      overparquet: {
        texte: 'Approvisionnement professionnel&nbsp;: chantier, stock et disponibilité. Inscription sur justificatif d’entreprise.',
        action: 'Approvisionner mon chantier',
      },
    },
  })}
    </div>
  </section>

  <!-- ======================================== COMPRENDRE MON PROBLÈME
       Ensuite seulement. Trois entrées — l'outil, la liste, la lecture — puis
       la liste des désordres elle-même, qui est la vraie porte d'entrée SEO
       du site et reste donc dans le HTML de l'accueil. -->
  <section class="section section--alt" id="comprendre">
    <div class="container">
${sectionHead({
    kicker: 'J’ai un problème avec mon parquet',
    title: 'Comprendre mon problème',
    text: 'Un désordre se comprend avant de se réparer — et avant de se remplacer. Trois façons d’y arriver, selon ce que vous savez déjà.',
  })}
      <ol class="stages stages--3 u-mt-2xl">
${entrees}
      </ol>
      <div class="comprendre__liste" id="problemes" data-reveal>
        <p class="kicker">Par symptôme</p>
${indexList(D, { collapse: 4, moreLabel: 'Voir les 4 autres désordres' })}
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

  <!-- ============================ QUAND FAIRE APPEL À UNE EXPERTISE ?
       La troisième conversion, à sa place : après les enseignes et après la
       compréhension. Des critères, pas une invitation — et le rappel que la
       première chose qu'une expertise peut conclure, c'est qu'il n'y a rien à
       faire. -->
  <section class="observation" id="expertise">
    <div class="observation__media">
      ${photo(D, 'architectural.jpg', { sizes: '(min-width: 901px) 50vw, 100vw' })}
    </div>
    <div class="observation__body">
      <div data-reveal>
        <p class="kicker">Expert Parquet</p>
        <h2 class="u-mt-md">Quand faire appel à une expertise&nbsp;?</h2>
        <p>L’expertise n’est pas la réponse à tout. Elle se justifie dans quatre situations — et la première chose qu’elle peut conclure, c’est qu’il n’y a rien à remplacer.</p>
        <ol class="observation__factors observation__factors--rows">
${criteres}
        </ol>
        <div class="observation__actions btn-group">
          <a class="btn btn--primary" href="${rel(D, 'pages/devis.html')}">Demander une expertise</a>
          <a class="link-arrow link-arrow--inverse" href="${rel(D, 'pages/expertise.html')}#deroulement">Comment se déroule une expertise</a>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================================ CONTENU ÉDITORIAL -->
  <section class="section" id="conseils">
    <div class="container">
${sectionHead({
    kicker: 'Conseils',
    title: 'Comprendre son parquet',
    text: 'Un média technique consacré au parquet, écrit pour être utile avant l’intervention plutôt que pour vendre une prestation.',
    link: `<a class="link-arrow" href="${rel(D, 'pages/conseils.html')}">Tous les conseils</a>`,
  })}
      <div class="magazine u-mt-2xl" id="conseils-mis-en-avant">
        <div>
${articleCard(D, ARTICLES[4], 0, 'feature')}
        </div>
        <div class="magazine__side">
${articleCard(D, ARTICLES[0], 1, 'row')}
${articleCard(D, ARTICLES[2], 2, 'row')}
        </div>
      </div>
${revealMore({ target: 'conseils-mis-en-avant', count: 2, label: 'Voir un autre article', itemSelector: '.card' })}
    </div>
  </section>

  <!-- ============================================================ FAQ -->
  <section class="section section--alt section--tight">
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
`;

  return {
    path: 'index.html',
    depth: D,
    fullTitle: 'Expert Parquet — Diagnostic et expertise de parquet',
    title: 'Diagnostic et expertise de parquet',
    description:
      'Un problème ou un projet parquet ? Trouvez l’enseigne adaptée, comprenez l’origine d’un désordre avec le pré-diagnostic, et sachez quand une expertise se justifie.',
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
