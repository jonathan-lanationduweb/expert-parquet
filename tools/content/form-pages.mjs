import { rel, breadcrumb } from '../layout.mjs';
import { ICONS, pageHero, faqAccordion, faqJsonLd, mentionDemo, champLeurre } from '../partials.mjs';
import { page, champ, faqs } from '../cms/snapshot.mjs';
import { faqPourPage } from '../cms/html.mjs';

const D = 1;

/* ========================================================================== */
/* Demande de devis / d’expertise                                             */
/* ========================================================================== */

function quotePage() {
  const crumb = breadcrumb(D, [
    { label: 'Accueil', href: 'index.html' },
    { label: 'Demande de devis' },
  ]);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: 'Demande',
    title: 'Demander une expertise ou un devis',
    lead: 'Quatre étapes courtes. Plus votre description est précise, plus la réponse le sera — et plus l’intervention éventuelle sera courte.',
  })}

  <section class="section">
    <div class="container">
      <div class="quote-layout">
        <div class="form-panel">
          <div class="stepper" data-form-stepper>
            <div class="stepper__meta">
              <span class="stepper__current" data-stepper-label>Étape 1 / 3</span>
              <span data-stepper-title>Votre problème</span>
            </div>
            <div class="stepper__track"><div class="stepper__bar" data-stepper-bar></div></div>
          </div>

          <form class="form" data-form="devis" novalidate>
            <!-- ÉTAPE 1 — le problème, la description, les photos -->
            <fieldset class="form-step" data-form-step="Votre problème">
              <legend class="visually-hidden">Votre problème</legend>
              <div>
                <h2 class="form-step__title">Votre problème</h2>
                <p class="form-step__intro">Si vous avez déjà fait le pré-diagnostic, vos réponses sont reprises automatiquement.</p>
              </div>

              <div class="field">
                <span class="field__label" id="label-probleme">Quels problèmes observez-vous&nbsp;? <span class="field__required" aria-hidden="true">*</span></span>
                <p class="field__hint">Plusieurs réponses possibles.</p>
                <div class="choice-grid" data-options="PROBLEMES" data-control="checkbox" data-name="probleme" data-required-group="probleme" role="group" aria-labelledby="label-probleme"></div>
                <p class="field__error" role="alert"></p>
              </div>

              <div class="field">
                <label class="field__label" for="description">Décrivez la situation <span class="field__required" aria-hidden="true">*</span></label>
                <p class="field__hint">Depuis quand&nbsp;? Sur quelle étendue&nbsp;? Un événement particulier avant l’apparition&nbsp;?</p>
                <textarea class="textarea" id="description" name="description" minlength="30" required placeholder="Exemple : depuis cet hiver, plusieurs lames du séjour se sont bombées le long du mur extérieur. Le parquet a été posé il y a trois ans sur une chape. Aucun dégât des eaux connu."></textarea>
                <p class="field__error" role="alert"></p>
              </div>

              <div class="field">
                <span class="field__label">Photos</span>
                <p class="field__hint">Une vue d’ensemble et deux ou trois détails en lumière naturelle suffisent généralement.</p>
                <div class="dropzone" data-upload>
                  <label class="btn btn--outline btn--sm" for="photos">
                    Sélectionner des photos
                    <input type="file" id="photos" name="photos" accept="image/jpeg,image/png,image/webp" multiple>
                  </label>
                  <p class="dropzone__hint">ou glissez-déposez vos fichiers ici — JPEG, PNG ou WebP, 6 fichiers maximum, 8&nbsp;Mo par fichier.</p>
                </div>
                <ul class="upload-errors" data-upload-errors role="alert" hidden></ul>
                <div class="file-previews" data-upload-previews></div>
                <p class="field__hint" data-upload-count aria-live="polite"></p>
                ${mentionDemo('devis', `${ICONS.alert} Vos photos restent dans votre navigateur&nbsp;: elles servent uniquement à l’aperçu ci-dessous et ne sont pas envoyées.`)}
              </div>

              <!-- Précisions repliées : utiles quand on les a, jamais exigées.
                   Un expert établit le support et l’ancienneté sur place ; les
                   demander en tête de formulaire ne servait qu’à allonger. -->
              <details class="field">
                <summary class="field__label">Préciser votre parquet (facultatif)</summary>
                <div class="field u-mt-sm">
                  <span class="field__label" id="label-type">Type de parquet</span>
                  <div class="choice-grid" data-options="TYPES_PARQUET" data-control="radio" data-name="type" data-recap-key="Type de parquet" data-recap-group role="radiogroup" aria-labelledby="label-type"></div>
                </div>
                <div class="field">
                  <label class="field__label" for="piece">Pièce concernée</label>
                  <select class="select" id="piece" name="piece" data-options="PIECES" data-recap-key="Pièce">
                    <option value="">Non précisée</option>
                  </select>
                </div>
              </details>

              <div class="form-nav">
                <span></span>
                <button class="btn btn--primary" type="button" data-form-next>Continuer</button>
              </div>
            </fieldset>

            <!-- ÉTAPE 2 — le lieu -->
            <fieldset class="form-step" data-form-step="Le lieu" hidden>
              <legend class="visually-hidden">Le lieu concerné</legend>
              <div>
                <h2 class="form-step__title">Le lieu concerné</h2>
                <p class="form-step__intro">Le code postal suffit à situer l’intervention.</p>
              </div>

              <div class="field-row">
                <div class="field">
                  <label class="field__label" for="code-postal">Code postal <span class="field__required" aria-hidden="true">*</span></label>
                  <input class="input" type="text" id="code-postal" name="code_postal" inputmode="numeric" autocomplete="postal-code" maxlength="5" required data-validate="postal" data-recap-key="Code postal" placeholder="75011">
                  <p class="field__error" role="alert"></p>
                </div>
                <div class="field">
                  <label class="field__label" for="ville">Ville</label>
                  <input class="input" type="text" id="ville" name="ville" autocomplete="address-level2" data-recap-key="Ville">
                  <p class="field__error" role="alert"></p>
                </div>
              </div>

              <!-- Facultatif, et replié : ces réponses aident à dimensionner une
                   visite, elles ne conditionnent rien. -->
              <details class="field">
                <summary class="field__label">Préciser le projet (facultatif)</summary>
                <div class="field-row u-mt-sm">
                  <div class="field">
                    <label class="field__label" for="surface">Surface approximative</label>
                    <select class="select" id="surface" name="surface" data-options="SURFACES" data-recap-key="Surface">
                      <option value="">Non précisée</option>
                    </select>
                  </div>
                  <div class="field">
                    <label class="field__label" for="delai">Délai souhaité</label>
                    <select class="select" id="delai" name="delai" data-options="DELAIS" data-recap-key="Délai">
                      <option value="">Non précisé</option>
                    </select>
                  </div>
                </div>
                <div class="field">
                  <span class="field__label" id="label-logement">Type de bien</span>
                  <div class="choice-grid" data-options="LOGEMENTS" data-control="radio" data-name="logement" data-recap-key="Type de bien" data-recap-group role="radiogroup" aria-labelledby="label-logement"></div>
                </div>
              </details>

              <div class="form-nav">
                <button class="btn btn--ghost" type="button" data-form-prev>Retour</button>
                <button class="btn btn--primary" type="button" data-form-next>Continuer</button>
              </div>
            </fieldset>

            <!-- ÉTAPE 3 — vos coordonnées -->
            <fieldset class="form-step" data-form-step="Vous joindre" hidden>
              <legend class="visually-hidden">Vos coordonnées</legend>
              <div>
                <h2 class="form-step__title">Vos coordonnées</h2>
                <p class="form-step__intro">Uniquement ce qui est nécessaire pour vous répondre.</p>
              </div>

              <!-- Facultatif : le profil sert à orienter, pas à traiter la
                   demande. Il est déjà coché si le pré-diagnostic l’a recueilli,
                   et on ne repose jamais une question déjà répondue. -->
              <div class="field">
                <span class="field__label" id="label-profil">Vous êtes</span>
                <div class="choice-grid" data-options="PROFILS" data-control="radio" data-name="profil" role="radiogroup" aria-labelledby="label-profil"></div>
              </div>

              <div class="field-row">
                <div class="field">
                  <label class="field__label" for="prenom">Prénom <span class="field__required" aria-hidden="true">*</span></label>
                  <input class="input" type="text" id="prenom" name="prenom" autocomplete="given-name" required>
                  <p class="field__error" role="alert"></p>
                </div>
                <div class="field">
                  <label class="field__label" for="nom">Nom <span class="field__required" aria-hidden="true">*</span></label>
                  <input class="input" type="text" id="nom" name="nom" autocomplete="family-name" required>
                  <p class="field__error" role="alert"></p>
                </div>
              </div>

              <div class="field-row">
                <div class="field">
                  <label class="field__label" for="email">Adresse e-mail <span class="field__required" aria-hidden="true">*</span></label>
                  <input class="input" type="email" id="email" name="email" autocomplete="email" required>
                  <p class="field__error" role="alert"></p>
                </div>
                <div class="field">
                  <label class="field__label" for="telephone">Téléphone</label>
                  <input class="input" type="tel" id="telephone" name="telephone" autocomplete="tel" placeholder="Facultatif">
                  <p class="field__error" role="alert"></p>
                </div>
              </div>

              <div class="field">
                <label class="consent" for="consentement">
                  <input type="checkbox" id="consentement" name="consentement" value="oui" required data-error-required="Votre accord est nécessaire pour traiter la demande.">
                  <span>J’accepte que les informations transmises soient utilisées pour traiter ma demande et me recontacter. Elles ne sont ni revendues ni transmises à des tiers. Conformément au RGPD, je peux demander leur accès, leur rectification ou leur suppression&nbsp;— voir les <a href="mentions-legales.html">mentions légales</a>.</span>
                </label>
                <p class="field__error" role="alert"></p>
              </div>

              ${mentionDemo('devis', 'Formulaire de démonstration&nbsp;— aucune demande n’est transmise pour le moment.')}
              ${champLeurre('devis')}

              <div class="form-nav">
                <button class="btn btn--ghost" type="button" data-form-prev>Retour</button>
                <button class="btn btn--primary btn--lg" type="submit">Envoyer ma demande</button>
              </div>
            </fieldset>
          </form>

          <div data-form-output></div>
        </div>

        <aside class="quote-aside">
          <div class="recap" data-recap>
            <p class="recap__title">Récapitulatif</p>
            <ul class="recap__list" data-recap-list></ul>
            <p class="recap__empty" data-recap-empty>Vos réponses s’afficheront ici au fur et à mesure.</p>
          </div>
          <div class="aside-card">
            <p class="aside-card__title">Pas encore prêt&nbsp;?</p>
            <p>Le pré-diagnostic pose le contexte en cinq questions et reporte ensuite vos réponses dans ce formulaire.</p>
            <a class="btn btn--outline btn--sm btn--block" href="${rel(D, 'pages/diagnostic.html')}#pre-diagnostic">Lancer le pré-diagnostic</a>
          </div>
          <div class="aside-card">
            <p class="aside-card__title">Une simple question&nbsp;?</p>
            <p>Le formulaire de contact est plus court et convient mieux à une demande d’information.</p>
            <a class="btn btn--ghost btn--sm btn--block" href="${rel(D, 'pages/contact.html')}">Aller au contact</a>
          </div>
        </aside>
      </div>
    </div>
  </section>
`;

  return {
    path: 'pages/devis.html',
    depth: D,
    navCurrent: null,
    title: 'Demande de devis et d’expertise parquet',
    description:
      'Décrivez votre problème de parquet en quatre étapes : type de parquet, lieu, description détaillée et coordonnées. Photos possibles, réponse personnalisée.',
    css: ['pages/home.css', 'pages/article.css', 'pages/diagnostic.css'],
    body,
    jsonLd: [crumb.jsonLd],
  };
}

/* ========================================================================== */
/* Contact                                                                    */
/* ========================================================================== */


function contactPage() {
  /* Les textes de l'en-tête et la FAQ viennent de WordPress (page « Contact »,
     groupe de FAQ « Contact ») ; le formulaire est une fonction du site. */
  const p = page('contact');
  const CONTACT_FAQ = faqPourPage(faqs('contact'), D);
  const crumb = breadcrumb(D, [{ label: 'Accueil', href: 'index.html' }, { label: champ('contact', 'fil_ariane') || p.title }]);

  const body = `${pageHero(D, {
    crumbHtml: crumb.html,
    kicker: champ('contact', 'kicker'),
    title: p.title,
    lead: champ('contact', 'lead'),
  })}

  <section class="section">
    <div class="container">
      <div class="contact-layout">
        <div class="form-panel">
          <form class="form" data-form="contact" novalidate>
            <div class="field-row">
              <div class="field">
                <label class="field__label" for="c-nom">Nom <span class="field__required" aria-hidden="true">*</span></label>
                <input class="input" type="text" id="c-nom" name="nom" autocomplete="name" required>
                <p class="field__error" role="alert"></p>
              </div>
              <div class="field">
                <label class="field__label" for="c-email">Adresse e-mail <span class="field__required" aria-hidden="true">*</span></label>
                <input class="input" type="email" id="c-email" name="email" autocomplete="email" required>
                <p class="field__error" role="alert"></p>
              </div>
            </div>

            <div class="field-row">
              <div class="field">
                <label class="field__label" for="c-tel">Téléphone</label>
                <input class="input" type="tel" id="c-tel" name="telephone" autocomplete="tel" placeholder="Facultatif">
                <p class="field__error" role="alert"></p>
              </div>
              <div class="field">
                <label class="field__label" for="c-objet">Objet <span class="field__required" aria-hidden="true">*</span></label>
                <select class="select" id="c-objet" name="objet" data-options="OBJETS_CONTACT" required>
                  <option value="">Choisir un objet</option>
                </select>
                <p class="field__error" role="alert"></p>
              </div>
            </div>

            <div class="field">
              <label class="field__label" for="c-message">Message <span class="field__required" aria-hidden="true">*</span></label>
              <textarea class="textarea" id="c-message" name="message" minlength="20" required placeholder="Votre message"></textarea>
              <p class="field__error" role="alert"></p>
            </div>

            <div class="field">
              <label class="consent" for="c-consentement">
                <input type="checkbox" id="c-consentement" name="consentement" value="oui" required data-error-required="Votre accord est nécessaire pour traiter la demande.">
                <span>J’accepte que mes informations soient utilisées pour répondre à ce message. Elles ne sont ni revendues ni transmises à des tiers.</span>
              </label>
              <p class="field__error" role="alert"></p>
            </div>

            ${mentionDemo('contact', 'Formulaire de démonstration&nbsp;— aucun message n’est transmis pour le moment.')}
            ${champLeurre('contact')}

            <div class="form-nav">
              <span></span>
              <button class="btn btn--primary btn--lg" type="submit">Envoyer le message</button>
            </div>
          </form>
          <div data-form-output></div>
        </div>

        <!-- Coordonnées injectées par js/modules/contact-info.js depuis
             js/config/site.js. Les blocs sont MASQUÉS dans le HTML livré et
             ne réapparaissent que si la valeur existe.

             Deux raisons de partir masqué plutôt que visible :
             — l'ancre de l'e-mail pointait vers un dièse, c'est-à-dire un lien
               qui ne mène nulle part pour un robot d'indexation et pour un
               visiteur sans JavaScript ;
             — sans valeur, ces blocs n'affichent qu'une étiquette suivie du
               vide, ce qui promet une information qui n'existe pas encore.
             L'ancre n'a plus d'attribut href : tant qu'aucune adresse n'est
             renseignée, ce n'est pas un lien, seulement du texte. -->
        <div class="contact-info">
          <div data-contact-group hidden>
            <div class="contact-info__block" data-contact-block hidden>
              <p class="contact-info__label">E-mail</p>
              <p class="contact-info__value"><a data-contact="email" data-contact-as="link">e-mail</a></p>
            </div>
            <div class="contact-info__block" data-contact-block hidden>
              <p class="contact-info__label">Téléphone</p>
              <p class="contact-info__value"><span data-contact="phone"></span></p>
            </div>
            <div class="contact-info__block" data-contact-block hidden>
              <p class="contact-info__label">Adresse</p>
              <p class="contact-info__value"><span data-contact="address"></span></p>
            </div>
            <div class="contact-info__block" data-contact-block hidden>
              <p class="contact-info__label">Horaires</p>
              <p class="contact-info__value"><span data-contact="hours"></span></p>
            </div>
            <div class="contact-info__block" data-contact-block hidden>
              <p class="contact-info__label">Zone d’intervention</p>
              <p class="contact-info__value"><span data-contact="coverage"></span></p>
            </div>
          </div>

          <div class="contact-info__block">
            <p class="contact-info__label">Par où passer</p>
            <p class="contact-info__value contact-info__value--text">Pour un problème de parquet, la <a href="${rel(D, 'pages/devis.html')}">demande d’expertise</a> est la voie la plus directe&nbsp;: elle rassemble d’emblée les éléments nécessaires à une réponse utile.</p>
          </div>
          <div class="contact-info__block">
            <p class="contact-info__label">Avant d’écrire</p>
            <p class="contact-info__value contact-info__value--text">Le <a href="${rel(D, 'pages/diagnostic.html')}">pré-diagnostic</a> prend deux minutes et indique déjà les vérifications à mener. Il répond à une bonne partie des questions courantes.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
${CONTACT_FAQ.length ? `
  <section class="section section--alt">
    <div class="container container--text">
      <div class="sec-head" data-reveal>
        <p class="kicker">${champ('contact', 'faq_kicker')}</p>
        <h2>${champ('contact', 'faq_titre')}</h2>
      </div>
      <div class="u-mt-lg" data-reveal>
${faqAccordion(CONTACT_FAQ, 'contact-faq')}
      </div>
    </div>
  </section>
` : ''}`;

  return {
    path: 'pages/contact.html',
    depth: D,
    navCurrent: 'pages/contact.html',
    title: champ('contact', 'titre_court') || p.title,
    fullTitle: p.seoTitle ? `${p.seoTitle} | Expert Parquet` : null,
    description: p.seoDescription || champ('contact', 'lead').replace(/&nbsp;/g, ' '),
    css: ['pages/home.css', 'pages/article.css', 'pages/diagnostic.css'],
    body,
    jsonLd: [crumb.jsonLd, CONTACT_FAQ.length ? faqJsonLd(CONTACT_FAQ) : null],
  };
}

export function formPages() {
  return [quotePage(), contactPage()];
}
