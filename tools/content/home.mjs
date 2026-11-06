import { rel } from '../layout.mjs';
import { faqAccordion, faqJsonLd } from '../partials.mjs';
import { heroHub, finderTeaser, problemGrid, adviceTrio, expertiseBand } from '../hub-blocks.mjs';
import { page, champ, faqs, imageDe } from '../cms/snapshot.mjs';
import { seo, ogParDefaut, cheminMedia } from '../cms/site.mjs';
import { faqPourPage } from '../cms/html.mjs';

const D = 0;

/*
 * ACCUEIL — HUB D'ORIENTATION PARQUET (05/10/2026)
 *
 * Expert Parquet attire par le problème, le diagnostic, les conseils et le
 * SEO ; il comprend ce que cherche la personne ; il lui propose la bonne
 * solution — idéalement les vrais parquets correspondants — puis l'envoie
 * précisément chez Premibel ou Over Parquet. Il ne garde pour lui que les
 * situations qui nécessitent réellement une expertise.
 *
 *   1. header
 *   2. hero — deux parcours : Trouver mon parquet · J'ai un problème
 *   3. une introduction compacte au moteur « Trouver mon parquet », qui vit
 *      sur sa page (pages/trouver-mon-parquet.html)
 *   4. problèmes fréquents — quatre tuiles (mis en avant dans WordPress)
 *   5. conseils utiles — trois contenus (mis en avant dans WordPress)
 *   6. expertise — un bandeau court, secondaire
 *   7. FAQ courte — le groupe « Accueil »
 *   8. pied de page compact
 *
 * Les textes sont les champs de la page « Accueil » de WordPress ; la
 * structure est celle de la V1 validée et reste ici.
 */

export function homePage() {
  const accueil = page('accueil');
  const FAQ = faqPourPage(faqs('accueil'), D);
  const A = (cle) => champ('accueil', cle);

  const body = `${heroHub(D)}

${finderTeaser(D)}

${problemGrid(D)}

${adviceTrio(D)}

${expertiseBand(D)}

  <!-- ============================================================ FAQ -->
  <section class="section section--tight" aria-labelledby="faq-titre">
    <div class="container">
      <div class="faq-split">
        <div data-reveal>
          <div class="sec-head__rule"></div>
          <p class="kicker">${A('faq_kicker')}</p>
          <h2 class="u-mt-md sec-head__title" id="faq-titre">${A('faq_titre')}</h2>
          <p class="u-mt-lg"><a class="link-arrow" href="${rel(D, 'pages/faq.html')}">${A('faq_lien')}</a></p>
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
    /* Sur l'accueil, la marque vient en premier : le titre SEO est la balise
       entière, sans suffixe. */
    fullTitle: accueil.seoTitle || 'Expert Parquet',
    title: (accueil.seoTitle || 'Expert Parquet').replace(/^Expert Parquet — /, ''),
    description: accueil.seoDescription,
    css: ['pages/home.css', 'pages/hub.css'],
    navCurrent: null,
    headerOver: true,
    ogImage: accueil.seoImage ? cheminMedia(accueil.seoImage, ogParDefaut()) : (accueil.image ? `assets/images/${imageDe(accueil.image)}` : ogParDefaut()),
    body,
    jsonLd: [
      seo().websiteJsonLd
        ? {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: seo().nom,
            url: 'https://expert-parquet.com/',
            inLanguage: 'fr-FR',
            description: seo().descriptionSite,
            ...(seo().organisation.nom
              ? { publisher: { '@type': 'Organization', name: seo().organisation.nom, ...(seo().organisation.url ? { url: seo().organisation.url } : {}) } }
              : {}),
          }
        : null,
      faqJsonLd(FAQ),
    ],
  };
}
