/**
 * Moteur « Trouver mon parquet » — l'interface.
 *
 * Point d'ancrage : un élément `[data-finder]`. Le HTML servi contient déjà,
 * dans un <noscript>, des liens vers les entrées réelles des enseignes :
 * personne ne reste devant un bloc vide.
 *
 * Toute la logique de décision est ailleurs et testable sans navigateur :
 *   js/recommendation/criteria.js   — traduire le besoin en critères
 *   js/recommendation/matching.js   — éliminer, noter, classer, expliquer
 *   js/recommendation/fallbacks.js  — catégorie réelle, puis enseigne
 *   js/catalog/load.js              — lire l'instantané du catalogue
 *
 * Ce module ne fait que poser les questions, appeler ces fonctions et rendre
 * le résultat. Il ne contient aucune règle métier.
 *
 * Pré-remplissage : les paramètres d'URL (`?piece=…&type=…&profil=…&via=…`)
 * sont lus au montage. Le pré-diagnostic s'en sert pour transmettre ce qu'il
 * sait déjà — on ne repose pas une question dont on connaît la réponse.
 *
 * Déclencheurs : un lien `[data-finder-start]` (les cartes du hero) remet le
 * moteur à zéro, applique `data-finder-profil` / `data-finder-besoin` et
 * amène le visiteur à la première question.
 */

import { QUESTIONS, TEXTES } from '../config/finder-questions.js';
import { normalizeCriteria, criteriaFromSearch, criteresPoses } from '../recommendation/criteria.js';
import { recommend } from '../recommendation/matching.js';
import { getCategoryFallback, getPartnerFallback, avecUtm } from '../recommendation/fallbacks.js';
import { loadCatalog, loadCatalogIndex } from '../catalog/load.js';
import { caracteristiques, LIBELLES, ENSEIGNE_NOM } from '../catalog/normalize.js';
import { partnerUrl } from '../config/site.js';
import { track } from './tracking.js';

const LIBELLE_CRITERE = {
  piece: (v) => ({ salon: 'Séjour', chambre: 'Chambre', entree: 'Entrée, couloir', humide: 'Cuisine ou salle de bain', bureau: 'Bureau, commerce', terrasse: 'Terrasse' })[v],
  chauffage: () => 'Chauffage au sol',
  type: (v) => LIBELLES.type[v],
  essence: (v) => ({ chene: 'Chêne', bambou: 'Bambou', exotique: 'Bois exotique' })[v],
  motif: (v) => LIBELLES.motif[v],
  teinte: (v) => ({ clair: 'Teinte claire', naturel: 'Teinte naturelle', moyen: 'Teinte moyenne à brune', fonce: 'Teinte foncée', gris: 'Teinte grise' })[v],
  finition: (v) => ({ huile: 'Huilé', verni: 'Verni', brut: 'Brut' })[v],
};

let compteur = 0;

export function initFinder() {
  document.querySelectorAll('[data-finder]').forEach(monter);
}

function monter(racine) {
  if (racine.dataset.finderMonte) return;
  racine.dataset.finderMonte = '1';
  const id = `finder-${++compteur}`;
  const campagne = racine.dataset.finderContext || 'trouver-mon-parquet';

  /* Réponses brutes — exactement les clés que normalizeCriteria() accepte. */
  let reponses = {};
  let etape = 0;
  let prerempli = [];
  let vue = 'question';

  const brutUrl = criteriaFromSearch(location.search);
  if (Object.keys(brutUrl).length) {
    reponses = { ...brutUrl };
    if (reponses.chauffage) reponses.chauffage = reponses.chauffage === '1' || reponses.chauffage === 'oui';
    prerempli = criteresPoses(normalizeCriteria(reponses)).map((c) => c.cle);
    etape = premiereEtapeSansReponse();
  }

  /* Les cartes du hero. */
  document.querySelectorAll('[data-finder-start]').forEach((lien) => {
    lien.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;
      e.preventDefault();
      reponses = {};
      prerempli = [];
      if (lien.dataset.finderProfil) reponses.profil = lien.dataset.finderProfil;
      if (lien.dataset.finderBesoin) reponses.besoin = lien.dataset.finderBesoin;
      etape = 0;
      vue = 'question';
      rendre();
      racine.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
      focaliserTitre();
      if (history.replaceState) history.replaceState(null, '', lien.getAttribute('href'));
    });
  });

  racine.innerHTML = '';
  racine.classList.add('finder');
  rendre();

  /* Arrivée par le bouton du header (`#finder`) : le questionnaire doit être
     sous les yeux et la première question avoir le focus, sinon le bouton
     semble ne rien faire. */
  const ouvrirParAncre = (douceur) => {
    if (location.hash !== '#finder') return;
    const cible = document.getElementById('finder') || racine;
    /* Après le rendu, et sans animation à l'arrivée : un défilement doux lancé
       pendant le chargement est annulé par la restauration de position du
       navigateur. */
    setTimeout(() => {
      cible.scrollIntoView({ behavior: douceur && !prefersReduced() ? 'smooth' : 'auto', block: 'start' });
      focaliserTitre();
    }, 0);
  };
  ouvrirParAncre(false);
  window.addEventListener('hashchange', () => ouvrirParAncre(true));

  /* ------------------------------------------------------------ rendu */

  function criteres() {
    return normalizeCriteria(reponses);
  }

  function questionsVisibles() {
    const c = criteres();
    return QUESTIONS.filter((q) => !(q.sauf && q.sauf(c)));
  }

  function premiereEtapeSansReponse() {
    const qs = questionsVisibles();
    const i = qs.findIndex((q) => !(q.cle in reponses));
    return i === -1 ? qs.length : i;
  }

  function rendre() {
    racine.innerHTML = '';
    racine.dataset.finderVue = vue;
    if (vue === 'resultats') {
      rendreResultats();
      return;
    }
    const qs = questionsVisibles();
    if (etape >= qs.length) {
      vue = 'resultats';
      rendre();
      return;
    }
    rendreQuestion(qs[etape], etape, qs.length);
  }

  /* Le mode professionnel : une case à cocher, visible dès l'ouverture, avec
     le même composant que les autres choix. Aucune donnée personnelle : on
     déclare un usage, pas une identité. */
  function enteteMode() {
    const c = criteres();
    const bloc = el('div', 'finder__mode');
    bloc.append(el('p', 'finder__mode-q', TEXTES.modeProQuestion));
    const label = el('label', 'choice choice--check choice--inline');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.name = `${id}-pro`;
    cb.checked = c.scope === 'overparquet';
    cb.addEventListener('change', () => {
      if (cb.checked) {
        reponses.profil = 'professionnel';
        reponses.besoin = 'supply';
      } else {
        delete reponses.profil;
        delete reponses.besoin;
      }
      rendre();
    });
    label.append(cb, el('span', 'choice__box'), el('span', 'choice__label', TEXTES.modePro));
    bloc.append(label);
    if (c.scope === 'overparquet') {
      bloc.append(el('p', 'finder__note', TEXTES.modeProAide));
      /* Over Parquet est une enseigne externe : on la fait découvrir avant d'y
         envoyer qui que ce soit. Lien vérifié, nouvel onglet, attributs sûrs. */
      const lien = document.createElement('a');
      lien.className = 'link-arrow finder__mode-lien';
      lien.href = TEXTES.overParquetUrl;
      lien.target = '_blank';
      lien.rel = 'noopener noreferrer';
      lien.textContent = TEXTES.overParquetLien;
      Object.assign(lien.dataset, { event: 'partner_click', destination: 'over-parquet', besoin: 'supply', context: 'mode-pro-decouverte' });
      bloc.append(lien);
      bloc.append(el('p', 'finder__note finder__note--discret', TEXTES.modeProPremibel));
    }
    return bloc;
  }

  function resumeCriteres({ modifiable }) {
    const c = criteres();
    const poses = criteresPoses(c);
    if (!poses.length) return null;
    const wrap = el('div', 'finder__resume');
    /* L'origine des critères est dite : ceux du pré-diagnostic viennent de
       réponses données, ceux d'une page de conseil viennent de son sujet. */
    const origine = reponses.via === 'pre-diagnostic' ? 'Critères repris du pré-diagnostic' : 'Critères déjà renseignés';
    const titre = el('p', 'label', prerempli.length && vue === 'question' ? origine : 'Votre recherche');
    const liste = el('ul', 'finder__chips');
    for (const { cle, valeur } of poses) {
      const li = el('li', 'finder__chip', LIBELLE_CRITERE[cle](valeur));
      liste.append(li);
    }
    wrap.append(titre, liste);
    if (modifiable) {
      const modifier = bouton(TEXTES.modifier, 'btn btn--ghost btn--sm');
      modifier.addEventListener('click', () => {
        prerempli = [];
        vue = 'question';
        etape = 0;
        rendre();
        focaliserTitre();
      });
      wrap.append(modifier);
    }
    return wrap;
  }

  function rendreQuestion(q, index, total) {
    const c = criteres();
    const form = document.createElement('form');
    form.className = 'finder__step';
    form.noValidate = true;
    /* Un seul chemin pour avancer — clic sur « Continuer » ou Entrée dans le
       groupe — : l'événement submit, annulé avant tout re-rendu. */
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      avancer();
    });

    const entete = el('div', 'finder__head');
    entete.append(el('p', 'label', TEXTES.etape(index + 1)));
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'finder__fieldset';
    const legend = document.createElement('legend');
    legend.className = 'finder__question';
    legend.id = `${id}-q`;
    legend.tabIndex = -1;
    legend.textContent = q.question;
    fieldset.append(legend);
    if (q.aide) fieldset.append(el('p', 'finder__help', q.aide));

    const grille = el('div', 'choice-grid');
    const dejaRepondu = q.cle in reponses;
    /* Un critère facultatif se désélectionne : on modélise alors le groupe en
       cases à cocher à sélection unique (clic sur la case active → retour à
       « aucun choix »). La sémantique native case/cochée reste accessible au
       clavier et au lecteur d'écran, ce qu'un bouton radio natif, non
       décochable, ne permettrait pas. */
    const desactivable = Boolean(q.deselectable);
    const effetsPiece = (v) => {
      if (q.cle === 'type' && v === 'stratifie') delete reponses.finition;
      if (q.cle === 'piece' && v === 'terrasse') { delete reponses.type; delete reponses.motif; delete reponses.finition; }
    };
    for (const [i, option] of q.options.entries()) {
      const label = el('label', 'choice choice--radio');
      const input = document.createElement('input');
      input.type = desactivable ? 'checkbox' : 'radio';
      input.name = desactivable ? `${id}-${q.cle}-${i}` : `${id}-${q.cle}`;
      input.value = option.value === null ? '' : option.value;
      input.id = `${id}-${q.cle}-${i}`;
      input.checked = dejaRepondu && (reponses[q.cle] || null) === option.value;
      input.addEventListener('change', () => {
        if (desactivable) {
          if (input.checked) {
            /* Sélection unique : on décoche les autres (sans redéclencher leur
               « change », car .checked programmatique n'émet pas d'événement). */
            grille.querySelectorAll('input').forEach((o) => { if (o !== input) o.checked = false; });
            reponses[q.cle] = option.value;
            effetsPiece(option.value);
          } else {
            /* Reclic sur la case active : le critère disparaît réellement de
               l'état, il n'est pas remplacé par une valeur vide. */
            delete reponses[q.cle];
          }
          /* Critère facultatif : on peut continuer avec ou sans réponse. */
          suivant.disabled = false;
          return;
        }
        reponses[q.cle] = option.value;
        effetsPiece(option.value);
        suivant.disabled = false;
      });
      const texte = el('span', 'choice__label', option.label);
      if (option.help) texte.append(el('small', 'choice__help', ` — ${option.help}`));
      label.append(input, el('span', 'choice__box'), texte);
      grille.append(label);
    }
    fieldset.append(grille);

    if (q.complement && !(q.complement.sauf && q.complement.sauf(c))) {
      fieldset.append(complement(q.complement));
    }

    const nav = el('div', 'finder__nav');
    const retour = bouton(TEXTES.retour, 'btn btn--ghost btn--sm');
    retour.hidden = index === 0;
    retour.addEventListener('click', () => {
      etape = Math.max(0, etape - 1);
      rendre();
      focaliserTitre();
    });
    const dernier = index === total - 1;
    const suivant = bouton(dernier ? TEXTES.voirResultats : TEXTES.suivant, 'btn btn--primary btn--sm');
    suivant.type = 'submit';
    /* Un critère facultatif (désélectionnable) n'oblige pas à répondre. */
    suivant.disabled = desactivable ? false : !dejaRepondu;
    nav.append(retour, suivant);

    function avancer() {
      if (!desactivable && !(q.cle in reponses)) return;
      /* Le filtrage des questions dépend des réponses : on recalcule. */
      const qs = questionsVisibles();
      const position = qs.findIndex((x) => x.cle === q.cle);
      etape = position + 1;
      /* Une question dont la réponse est venue du pré-diagnostic n'est pas
         reposée : on la saute. « Modifier mes critères » rouvre tout. */
      while (etape < qs.length && prerempli.includes(qs[etape].cle)) etape += 1;
      if (etape >= qs.length) vue = 'resultats';
      rendre();
      focaliserTitre();
    }

    form.append(entete, fieldset, nav);
    const resume = resumeCriteres({ modifiable: false });
    /* Avant la première question : ce qu'on obtiendra à la fin. */
    if (index === 0 && !prerempli.length) racine.append(el('p', 'finder__promesse', TEXTES.promesse));
    if (resume && prerempli.length) racine.append(resume);
    racine.append(form, progression(index, total), enteteMode());
    void c;
  }

  /* Un complément sous une question : une case (chauffage au sol) ou un petit
     groupe de boutons radio (essence). Il n'est jamais obligatoire. */
  function complement(def) {
    if (def.type === 'radio') {
      const groupe = document.createElement('fieldset');
      groupe.className = 'finder__complement finder__complement--group';
      const legende = document.createElement('legend');
      legende.className = 'label';
      legende.textContent = def.label;
      groupe.append(legende);
      const ligne = el('div', 'choice-row');
      for (const [i, option] of def.options.entries()) {
        const label = el('label', 'choice choice--radio choice--inline');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `${id}-${def.cle}`;
        input.id = `${id}-${def.cle}-${i}`;
        input.value = option.value === null ? '' : option.value;
        input.checked = def.cle in reponses ? (reponses[def.cle] || null) === option.value : option.value === null;
        input.addEventListener('change', () => {
          reponses[def.cle] = option.value;
        });
        label.append(input, el('span', 'choice__box'), el('span', 'choice__label', option.label));
        ligne.append(label);
      }
      groupe.append(ligne);
      return groupe;
    }
    const comp = el('label', 'choice choice--check finder__complement');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.name = `${id}-${def.cle}`;
    cb.checked = Boolean(reponses[def.cle]);
    cb.addEventListener('change', () => {
      reponses[def.cle] = cb.checked;
    });
    comp.append(cb, el('span', 'choice__box'), el('span', 'choice__label', def.label));
    return comp;
  }

  function progression(index, total) {
    const barre = el('div', 'finder__progress');
    barre.setAttribute('role', 'progressbar');
    barre.setAttribute('aria-valuemin', '0');
    barre.setAttribute('aria-valuemax', String(total));
    barre.setAttribute('aria-valuenow', String(index + 1));
    barre.setAttribute('aria-label', 'Progression');
    const fill = el('span', 'finder__progress-fill');
    fill.style.width = `${Math.round(((index + 1) / total) * 100)}%`;
    barre.append(fill);
    return barre;
  }

  /* ------------------------------------------------------------ résultats */

  async function rendreResultats() {
    const c = criteres();
    const zone = el('div', 'finder__results');
    zone.setAttribute('aria-live', 'polite');
    zone.setAttribute('aria-busy', 'true');
    const titre = el('h3', 'finder__question', TEXTES.chargement);
    titre.id = `${id}-q`;
    titre.tabIndex = -1;
    zone.append(titre);
    racine.append(resumeCriteres({ modifiable: true }) || '', zone, enteteMode());

    const enseigne = c.scope;
    const nomEnseigne = ENSEIGNE_NOM[enseigne];

    /* Aucun critère posé : il n'y a rien à chercher, donc rien à « ne pas
       trouver ». On le dit, et on renvoie aux questions. */
    if (criteresPoses(c).length === 0) {
      titre.textContent = TEXTES.sansCritere;
      const retour = bouton(TEXTES.modifier, 'btn btn--primary btn--sm');
      retour.addEventListener('click', () => {
        prerempli = [];
        vue = 'question';
        etape = 0;
        rendre();
        focaliserTitre();
      });
      zone.append(retour);
      zone.setAttribute('aria-busy', 'false');
      focaliserTitre();
      return;
    }

    let catalogue;
    let index;
    try {
      [catalogue, index] = await Promise.all([loadCatalog(enseigne), loadCatalogIndex()]);
    } catch (e) {
      console.error('[finder]', e);
      titre.textContent = `${TEXTES.erreur} ${nomEnseigne}.`;
      const lien = lienEnseigne(getPartnerFallback(enseigne, c, campagne), c, 3);
      if (lien) zone.append(lien);
      zone.setAttribute('aria-busy', 'false');
      return;
    }

    const reco = recommend(catalogue.produits, c);
    const categorie = getCategoryFallback(index, c, enseigne, campagne);
    const enseigneRepli = getPartnerFallback(enseigne, c, campagne);
    const niveau = reco.exacts.length ? 1 : categorie ? 2 : 3;

    track('recommendation_result', {
      context: campagne,
      scope: enseigne,
      level: niveau,
      count: reco.exacts.length,
      candidates: reco.candidats,
      criteria: Object.fromEntries(criteresPoses(c).map((x) => [x.cle, x.valeur])),
      products: reco.exacts.map((x) => x.produit.id),
      via: c.via || undefined,
    });

    zone.innerHTML = '';
    zone.append(titre);
    if (reco.exacts.length) {
      titre.textContent = TEXTES.resultats(reco.exacts.length);
      const liste = el('ol', 'finder__list');
      for (const r of reco.exacts) liste.append(carteProduit(r, c, 1));
      zone.append(liste);
      /* La catégorie reste utile APRÈS des produits précis : voir plus large. */
      if (categorie) zone.append(lienCategorie(categorie, c, nomEnseigne, 1));
    } else {
      titre.textContent = TEXTES.aucun;
      if (reco.proches.length) {
        zone.append(el('p', 'finder__help', TEXTES.proches));
        const liste = el('ol', 'finder__list');
        for (const r of reco.proches) liste.append(carteProduit(r, c, 2, { proche: true }));
        zone.append(liste);
      }
      const actions = el('div', 'finder__fallbacks');
      if (categorie) actions.append(lienCategorie(categorie, c, nomEnseigne, 2));
      const lien = lienEnseigne(enseigneRepli, c, categorie ? 3 : 3, categorie ? 'link-arrow' : 'btn btn--primary');
      if (lien) actions.append(lien);
      zone.append(actions);
    }

    const pied = el('div', 'finder__foot');
    pied.append(el('p', 'disclaimer', TEXTES.instantane(dateFr(catalogue.generatedAt))));
    const recommencer = bouton(TEXTES.recommencer, 'btn btn--outline btn--sm');
    recommencer.addEventListener('click', () => {
      const profil = reponses.profil;
      const besoin = reponses.besoin;
      reponses = {};
      if (profil) reponses.profil = profil;
      if (besoin) reponses.besoin = besoin;
      prerempli = [];
      etape = 0;
      vue = 'question';
      rendre();
      focaliserTitre();
    });
    pied.append(recommencer);
    zone.append(pied);
    zone.setAttribute('aria-busy', 'false');
    focaliserTitre();
  }

  function carteProduit(r, c, niveau, { proche = false } = {}) {
    const p = r.produit;
    const enseigne = ENSEIGNE_NOM[p.enseigne];
    const li = el('li', `finder__item${proche ? ' finder__item--proche' : ''}`);
    const art = el('article', 'result');

    const media = el('div', 'result__media');
    if (p.image) {
      const img = document.createElement('img');
      img.src = p.image.thumb;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 324;
      img.height = 324;
      img.referrerPolicy = 'no-referrer-when-downgrade';
      media.append(img);
    }
    const corps = el('div', 'result__body');
    /* L'enseigne, et en un souffle pourquoi elle : le visiteur ne doit pas
       lire un simple lien commercial. */
    const store = el('p', 'result__store', enseigne);
    const pourquoi = TEXTES.pourquoiEnseigne[p.enseigne];
    if (pourquoi) store.append(el('small', 'result__store-why', ` — ${pourquoi}`));
    corps.append(store, el('h4', 'result__name', p.nom));
    const specs = caracteristiques(p);
    if (specs.length) {
      const ul = el('ul', 'result__specs');
      specs.forEach((s) => ul.append(el('li', null, s)));
      corps.append(ul);
    }
    if (r.raisons.length) {
      const pourquoi = el('div', 'result__why');
      pourquoi.append(el('p', 'label', TEXTES.pourquoi));
      const ul = el('ul', 'result__reasons');
      r.raisons.forEach((x) => ul.append(el('li', null, x)));
      pourquoi.append(ul);
      if (r.ecarts.length) pourquoi.append(el('p', 'result__gap', `Diffère : ${r.ecarts.join(', ')}.`));
      corps.append(pourquoi);
    }

    const actions = el('div', 'result__actions');
    const cta = document.createElement('a');
    cta.className = 'btn btn--primary btn--sm';
    cta.href = avecUtm(p.url, campagne);
    cta.rel = 'sponsored noopener';
    cta.textContent = TEXTES.voir(enseigne);
    Object.assign(cta.dataset, {
      event: 'product_click',
      destination: p.enseigne === 'overparquet' ? 'over-parquet' : 'premibel',
      besoin: c.scope === 'overparquet' ? 'supply' : 'selection',
      context: campagne,
      productId: String(p.id),
      productName: p.nom,
      category: p.type || '',
      level: String(niveau),
    });
    actions.append(cta);

    /* Professionnel : la même référence chez Premibel pour le choix et le
       conseil, quand elle y existe réellement. Jamais l'inverse pour un
       particulier : Over Parquet ne lui est pas ouvert. */
    if (c.scope === 'overparquet' && p.contrepartie && p.contrepartie.enseigne === 'premibel') {
      const alt = document.createElement('a');
      alt.className = 'link-arrow';
      alt.href = avecUtm(p.contrepartie.url, campagne);
      alt.rel = 'sponsored noopener';
      alt.textContent = 'Aussi chez Premibel (choix, conseil)';
      Object.assign(alt.dataset, { event: 'product_click', destination: 'premibel', besoin: 'selection', context: campagne, productId: String(p.contrepartie.id), productName: p.nom, category: p.type || '', level: String(niveau) });
      actions.append(alt);
    }
    corps.append(actions);
    art.append(media, corps);
    li.append(art);
    return li;
  }

  function lienCategorie(categorie, c, nomEnseigne, niveau) {
    const a = document.createElement('a');
    a.className = niveau === 2 ? 'btn btn--primary' : 'link-arrow finder__more';
    a.href = categorie.url;
    a.rel = 'sponsored noopener';
    a.textContent = TEXTES.categorie(categorie.nom, nomEnseigne);
    Object.assign(a.dataset, { event: 'partner_click', destination: c.scope === 'overparquet' ? 'over-parquet' : 'premibel', besoin: c.scope === 'overparquet' ? 'supply' : 'selection', context: campagne, category: categorie.slug, level: String(niveau) });
    return a;
  }

  function lienEnseigne(repli, c, niveau, classe = 'link-arrow') {
    if (!repli) return null;
    const a = document.createElement('a');
    a.className = classe;
    a.href = repli.url;
    a.rel = 'sponsored noopener';
    a.textContent = TEXTES.enseigne(repli.nom);
    Object.assign(a.dataset, { event: 'partner_click', destination: repli.enseigne === 'overparquet' ? 'over-parquet' : 'premibel', besoin: c.scope === 'overparquet' ? 'supply' : 'selection', context: campagne, level: String(niveau) });
    return a;
  }

  function focaliserTitre() {
    const cible = racine.querySelector(`#${id}-q`);
    if (cible) cible.focus({ preventScroll: true });
  }
}

/* ------------------------------------------------------------ utilitaires */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function bouton(label, className) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = className;
  b.textContent = label;
  return b;
}

function prefersReduced() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function dateFr(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* Évite un avertissement d'import inutilisé si l'entrée pro n'est pas configurée. */
void partnerUrl;
