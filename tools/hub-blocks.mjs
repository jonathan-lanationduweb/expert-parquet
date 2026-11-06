/**
 * Blocs de l'accueil « hub d'orientation » (05/10/2026).
 *
 * L'accueil découle de trois intentions, posées dès le premier écran :
 *
 *   TROUVER MON PARQUET        → le moteur de recommandation (page dédiée)
 *   APPROVISIONNER MON CHANTIER → le même moteur, en mode professionnel
 *   ANALYSER MON PROBLÈME       → le pré-diagnostic Expert Parquet
 *
 * La STRUCTURE de chaque bloc est ici, figée (V1 validée). Les TEXTES viennent
 * de la page « Accueil » de WordPress (champs), les problèmes et conseils
 * affichés sont ceux marqués « mis en avant », la FAQ est le groupe « Accueil ».
 */

import { rel } from './layout.mjs';
import { photo } from './images.mjs';
import { articleCard, sectionHead } from './partials.mjs';
import { partnerUrl } from '../js/config/site.js';
import { champ, page, imageDe, problemesAvant, conseilsAvant } from './cms/snapshot.mjs';

const A = (cle) => champ('accueil', cle);

/* ------------------------------------------------------------ hero */

export function heroHub(depth) {
  /* Le hero de la V1 validée (release/v2-preproduction), à l'identique dans sa
     composition, ses proportions, son voile et sa typographie. Seuls le titre,
     les deux phrases et les deux boutons sont des champs : le premier bouton
     mène au moteur « Trouver mon parquet », le second au pré-diagnostic. */
  return `  <section class="hero">
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
      ${photo(depth, imageDe(page('accueil').image), { sizes: '100vw', priority: true, alt: '' })}
    </div>
    <div class="container hero__inner">
      <h1 class="hero-title hero__title">${A('hero_titre')}</h1>
      <p class="hero__sub">${A('hero_sous_titre')}</p>
      <div class="hero__foot">
        <p class="hero__lead">${A('hero_lead')}</p>
        <div class="hero__actions btn-group">
          <a class="btn btn--primary btn--lg" href="${rel(depth, 'pages/trouver-mon-parquet.html')}">${A('hero_cta_principal')}</a>
          <a class="btn btn--on-dark btn--lg" href="${rel(depth, 'pages/diagnostic.html')}#pre-diagnostic">${A('hero_cta_secondaire')}</a>
        </div>
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------ accroche
   Sur l'accueil, le moteur n'est pas ouvert : une introduction compacte, trois
   lignes sur ce qu'on demande, un bouton vers la page du moteur. */

export function finderTeaser(depth) {
  return `  <section class="section section--alt section--tight" id="trouver-mon-parquet" aria-labelledby="teaser-titre">
    <div class="container">
      <div class="finder-teaser">
        <div data-reveal>
          <p class="kicker">${A('moteur_kicker')}</p>
          <h2 class="u-mt-md" id="teaser-titre">${A('moteur_titre')}</h2>
        </div>
        <div class="finder-teaser__side" data-reveal data-reveal-delay="90">
          <ul class="finder-teaser__list">
            <li>01 — ${A('moteur_etape_1')}</li>
            <li>02 — ${A('moteur_etape_2')}</li>
            <li>03 — ${A('moteur_etape_3')}</li>
          </ul>
          <p class="finder-teaser__actions"><a class="btn btn--primary" href="${rel(depth, 'pages/trouver-mon-parquet.html')}">${A('moteur_bouton')}</a></p>
          <p class="disclaimer">${A('moteur_transparence')}</p>
        </div>
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------ moteur */

export function finderSection(depth, { entete = true } = {}) {
  const premibel = partnerUrl('premibel', 'trouver-mon-parquet-sans-js');
  const over = partnerUrl('overparquet', 'trouver-mon-parquet-sans-js', 'professionnel');
  const titre = entete
    ? `          <p class="kicker">Trouver mon parquet</p>
          <h2 class="u-mt-md" id="finder-titre">Quelques critères, les parquets qui correspondent</h2>`
    : `          <h2 class="finder-intro__title" id="finder-titre">Comment ça marche</h2>`;
  return `  <section class="section${entete ? ' section--alt' : ' section--tight'}" id="trouver-mon-parquet" aria-labelledby="finder-titre">
    <div class="container">
      <div class="finder-layout${entete ? '' : ' finder-layout--page'}">
        <div class="finder-intro" data-reveal>
${titre}
          <ol class="howto">
            <li><span>01</span> Décrivez votre projet&nbsp;: pièce, type, motif, teinte, finition.</li>
            <li><span>02</span> Expert Parquet compare vos critères aux catalogues réels des enseignes.</li>
            <li><span>03</span> Accédez aux parquets qui correspondent, chez l’enseigne adaptée.</li>
          </ol>
          <dl class="destinations">
            <div><dt>Expert Parquet</dt><dd>comprend votre besoin et recommande — il ne vend rien</dd></div>
            <div><dt>Premibel</dt><dd>choix, conseil et showroom — particuliers et professionnels</dd></div>
            <div><dt>Over Parquet</dt><dd>approvisionnement professionnel — sur justificatif d’entreprise</dd></div>
          </dl>
        </div>
        <div class="finder-panel" id="finder" data-reveal data-reveal-delay="90">
          <div data-finder data-finder-context="trouver-mon-parquet">
            <noscript>
              <div class="callout callout--neutral">
                <p class="callout__title">JavaScript désactivé</p>
                <p>Le moteur de recommandation nécessite JavaScript. Vous pouvez parcourir directement les parquets${premibel ? ` <a class="link" href="${premibel.replace(/&/g, '&amp;')}" rel="sponsored noopener">chez Premibel</a>` : ''}${over ? ` ou, pour un chantier professionnel, <a class="link" href="${over.replace(/&/g, '&amp;')}" rel="sponsored noopener">chez Over Parquet</a>` : ''}.</p>
              </div>
            </noscript>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------ problèmes */

export function problemGrid(depth) {
  const cartes = problemesAvant(4)
    .map(
      (p, i) => `        <li class="problem-tile" data-reveal data-reveal-delay="${i * 60}">
          <a class="problem-tile__link" href="${rel(depth, `pages/problemes/${p.slug}.html`)}">
            <span class="problem-tile__num">${String(i + 1).padStart(2, '0')}</span>
            <span class="problem-tile__label">${p.labelCourt || p.titreCourt || p.title}</span>
            <span class="problem-tile__teaser">${p.accroche}</span>
          </a>
        </li>`
    )
    .join('\n');
  return `  <section class="section" id="problemes" aria-labelledby="problemes-titre">
    <div class="container">
${sectionHead({
    kicker: A('problemes_kicker'),
    title: A('problemes_titre'),
    text: A('problemes_texte'),
    link: `<a class="link-arrow" href="${rel(depth, 'pages/problemes.html')}">${A('problemes_lien')}</a>`,
  }).replace('<h2 class="sec-head__title ">', '<h2 class="sec-head__title" id="problemes-titre">')}
      <ul class="problem-grid u-mt-xl">
${cartes}
      </ul>
    </div>
  </section>`;
}

/* ------------------------------------------------------------ conseils */

export function adviceTrio(depth) {
  const choix = conseilsAvant(3);
  return `  <section class="section section--alt" id="conseils" aria-labelledby="conseils-titre">
    <div class="container">
${sectionHead({
    kicker: A('conseils_kicker'),
    title: A('conseils_titre'),
    text: A('conseils_texte'),
    link: `<a class="link-arrow" href="${rel(depth, 'pages/conseils.html')}">${A('conseils_lien')}</a>`,
  }).replace('<h2 class="sec-head__title ">', '<h2 class="sec-head__title" id="conseils-titre">')}
      <div class="advice-trio u-mt-xl">
${choix.map((a, i) => articleCard(depth, a, i, 'row')).join('\n')}
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------ expertise */

export function expertiseBand(depth) {
  return `  <section class="expertise-band" id="expertise" aria-labelledby="expertise-titre">
    <div class="container expertise-band__inner">
      <div data-reveal>
        <p class="kicker">${A('expertise_kicker')}</p>
        <h2 class="u-mt-md" id="expertise-titre">${A('expertise_titre')}</h2>
        <p class="u-mt-sm">${A('expertise_texte')}</p>
      </div>
      <div class="expertise-band__actions" data-reveal data-reveal-delay="90">
        <a class="btn btn--primary" href="${rel(depth, 'pages/devis.html')}">${A('expertise_bouton')}</a>
        <a class="link-arrow link-arrow--inverse" href="${rel(depth, 'pages/expertise.html')}#deroulement">${A('expertise_lien')}</a>
      </div>
    </div>
  </section>`;
}
