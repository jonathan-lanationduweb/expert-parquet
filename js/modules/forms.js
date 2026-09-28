/**
 * Formulaires : peuplement depuis la configuration, validation, étapes,
 * prévisualisation de photos, récapitulatif et soumission.
 *
 * Aucun envoi réel n’est effectué tant que `FORMS.endpoint` vaut `null`
 * (js/config/site.js). Dans ce mode, le formulaire affiche honnêtement les
 * données qu’il aurait transmises. Voir TODO-INTEGRATIONS.md.
 */

import { FORMS, endpointFor, formMode, uploadEnabled } from '../config/site.js';
import * as OPTIONS from '../config/options.js';

const LISTS = {
  PROBLEMES: OPTIONS.PROBLEMES,
  TYPES_PARQUET: OPTIONS.TYPES_PARQUET,
  SUPPORTS: OPTIONS.SUPPORTS,
  ANCIENNETES: OPTIONS.ANCIENNETES,
  PIECES: OPTIONS.PIECES,
  PROFILS: OPTIONS.PROFILS,
  LOGEMENTS: OPTIONS.LOGEMENTS,
  SURFACES: OPTIONS.SURFACES,
  DELAIS: OPTIONS.DELAIS,
  OBJETS_CONTACT: OPTIONS.OBJETS_CONTACT,
};

export function initForms() {
  document.querySelectorAll('[data-options]').forEach(populate);
  document.querySelectorAll('[data-form]').forEach(setupForm);
  document.querySelectorAll('[data-upload]').forEach(setupUpload);
}

/* ------------------------------------------------------------------ options */

function populate(container) {
  const list = LISTS[container.dataset.options];
  if (!list) return;

  if (container.tagName === 'SELECT') {
    list.forEach((option) => {
      const node = document.createElement('option');
      node.value = option.value;
      node.textContent = option.label;
      container.append(node);
    });
    return;
  }

  const type = container.dataset.control === 'checkbox' ? 'checkbox' : 'radio';
  const name = container.dataset.name;
  list.forEach((option) => {
    const label = document.createElement('label');
    label.className = `choice choice--${type === 'radio' ? 'radio' : 'check'}`;
    const input = document.createElement('input');
    input.type = type;
    input.name = type === 'checkbox' ? `${name}[]` : name;
    input.value = option.value;
    const box = document.createElement('span');
    box.className = 'choice__box';
    const text = document.createElement('span');
    text.className = 'choice__label';
    text.textContent = option.label;
    label.append(input, box, text);
    container.append(label);
  });
}

/* --------------------------------------------------------------- formulaire */

/* Date d'affichage de chaque formulaire. Une WeakMap plutôt qu'un attribut :
   cette valeur est une mesure interne, elle n'a rien à faire dans le DOM où
   elle serait triviale à réécrire depuis la console — et surtout lisible par
   un robot qui saurait alors quoi renvoyer. */
const ouvertureDuFormulaire = new WeakMap();

/* Contexte du pré-diagnostic, tel que reçu dans l'URL au chargement du
   formulaire. Conservé à part pour être transmis au serveur sous
   `diagnosticContext` : c'est la trace des réponses du visiteur et de
   l'orientation générale — jamais un constat. */
const contexteDiagnostic = new WeakMap();

function setupForm(form) {
  const steps = Array.from(form.querySelectorAll('[data-form-step]'));
  const stepper = form.querySelector('[data-form-stepper]');
  const recap = form.querySelector('[data-recap]') || document.querySelector('[data-recap]');
  let current = 0;

  // Mode et état initiaux exposés sur l'élément : le CSS et les tests peuvent
  // s'y accrocher, et un futur passage en LIVE ne change rien au gabarit.
  form.dataset.formMode = formMode(form.dataset.form || '');
  setState(form, 'idle');

  /* Le HTML généré porte les mentions du mode DEMO. Si, à l'exécution, un
     point d'envoi existe (backend local sur un hôte de développement), elles
     deviennent fausses : on les retire. */
  if (form.dataset.formMode === 'live') {
    form.querySelectorAll('[data-demo-only]').forEach((node) => {
      node.hidden = true;
    });
  }

  /* Instant d'affichage du formulaire. On n'envoie PAS cette valeur mais la
     DURÉE écoulée jusqu'à l'envoi : un horodatage absolu obligerait le serveur
     à comparer son horloge à celle du visiteur, et quelques secondes d'avance
     sur une machine mal réglée suffiraient à faire refuser une demande
     parfaitement légitime. Une durée ne dépend que de l'horloge locale. */
  ouvertureDuFormulaire.set(form, Date.now());

  prefillFromUrl(form);

  if (steps.length > 1) {
    steps.forEach((step, i) => (step.hidden = i !== 0));
    updateStepper();

    form.querySelectorAll('[data-form-next]').forEach((btn) =>
      btn.addEventListener('click', () => {
        if (!validateStep(steps[current])) return;
        current = Math.min(current + 1, steps.length - 1);
        showStep();
      })
    );
    form.querySelectorAll('[data-form-prev]').forEach((btn) =>
      btn.addEventListener('click', () => {
        current = Math.max(current - 1, 0);
        showStep();
      })
    );
  }

  form.addEventListener('input', () => updateRecap(form, recap));
  form.addEventListener('change', () => updateRecap(form, recap));
  updateRecap(form, recap);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const scope = steps.length > 1 ? steps[current] : form;
    setState(form, 'validating');
    if (!validateStep(scope)) {
      setState(form, 'idle');
      return;
    }
    submit(form);
  });

  function showStep() {
    steps.forEach((step, i) => (step.hidden = i !== current));
    updateStepper();
    const heading = steps[current].querySelector('h2, h3, .form-step__title');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    const top = form.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  function updateStepper() {
    if (!stepper) return;
    const bar = stepper.querySelector('[data-stepper-bar]');
    const label = stepper.querySelector('[data-stepper-label]');
    const title = stepper.querySelector('[data-stepper-title]');
    if (bar) bar.style.width = `${((current + 1) / steps.length) * 100}%`;
    if (label) label.textContent = `Étape ${current + 1} / ${steps.length}`;
    if (title) title.textContent = steps[current].dataset.formStep || '';
  }
}

/* --------------------------------------------------------------- validation */

function validateStep(scope) {
  const fields = Array.from(scope.querySelectorAll('[required], [data-validate]'));
  let firstInvalid = null;

  fields.forEach((field) => {
    const wrapper = field.closest('.field') || field.parentElement;
    const message = validateField(field, scope);
    if (wrapper) {
      wrapper.classList.toggle('has-error', Boolean(message));
      const errorNode = wrapper.querySelector('.field__error');
      if (errorNode) errorNode.textContent = message || '';
    }
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message && !firstInvalid) firstInvalid = field;
  });

  // Groupes de boutons radio obligatoires
  scope.querySelectorAll('[data-required-group]').forEach((group) => {
    const name = group.dataset.name || group.dataset.requiredGroup;
    const checked = group.querySelector('input:checked');
    const wrapper = group.closest('.field') || group;
    wrapper.classList.toggle('has-error', !checked);
    const errorNode = wrapper.querySelector('.field__error');
    if (errorNode) errorNode.textContent = checked ? '' : 'Merci de sélectionner une réponse.';
    if (!checked && !firstInvalid) firstInvalid = group.querySelector('input');
    void name;
  });

  if (firstInvalid) {
    firstInvalid.focus({ preventScroll: false });
    return false;
  }
  return true;
}

function validateField(field) {
  const value = field.type === 'checkbox' ? field.checked : String(field.value || '').trim();

  if (field.hasAttribute('required')) {
    if (field.type === 'checkbox' && !field.checked) {
      return field.dataset.errorRequired || 'Cette case doit être cochée pour continuer.';
    }
    if (field.type !== 'checkbox' && !value) {
      return field.dataset.errorRequired || 'Ce champ est obligatoire.';
    }
  }
  if (!value || field.type === 'checkbox') return '';

  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) {
    return 'Merci de saisir une adresse e-mail valide.';
  }
  if (field.type === 'tel' && !/^[+0-9 ().-]{6,}$/.test(value)) {
    return 'Merci de saisir un numéro de téléphone valide.';
  }
  if (field.dataset.validate === 'postal' && !/^[0-9]{5}$/.test(value)) {
    return 'Le code postal doit comporter 5 chiffres.';
  }
  if (field.minLength > 0 && value.length < field.minLength) {
    return `Merci de détailler un peu plus (${field.minLength} caractères minimum).`;
  }
  return '';
}

/* ----------------------------------------------------------------- récap */

function updateRecap(form, recap) {
  if (!recap) return;
  const list = recap.querySelector('[data-recap-list]');
  const empty = recap.querySelector('[data-recap-empty]');
  if (!list) return;

  const entries = [];
  form.querySelectorAll('[data-recap-key]').forEach((field) => {
    const label = field.dataset.recapKey;
    let value = '';
    if (field.tagName === 'SELECT') {
      value = field.selectedOptions[0] ? field.selectedOptions[0].textContent : '';
      if (field.selectedIndex === 0 && !field.value) value = '';
    } else if (field.dataset.recapGroup !== undefined) {
      const checked = field.querySelector('input:checked');
      value = checked ? checked.closest('.choice').querySelector('.choice__label').textContent : '';
    } else {
      value = String(field.value || '').trim();
    }
    if (value) entries.push([label, value]);
  });

  list.innerHTML = '';
  entries.forEach(([key, value]) => {
    const li = document.createElement('li');
    const k = document.createElement('span');
    k.className = 'recap__key';
    k.textContent = key;
    const v = document.createElement('span');
    v.className = 'recap__val';
    v.textContent = value;
    li.append(k, v);
    list.append(li);
  });
  if (empty) empty.hidden = entries.length > 0;
}

/* ---------------------------------------------------------------- upload */

/** « image/jpeg, image/png » → « JPEG, PNG ». */
function libelleFormats() {
  return FORMS.acceptedTypes
    .map((type) => type.replace('image/', '').toUpperCase().replace('WEBP', 'WebP'))
    .join(', ');
}

/** 12582912 → « 12 Mo ». Une décimale seulement au-dessous de 10 Mo. */
function enMegaoctets(octets) {
  const mo = octets / (1024 * 1024);
  return `${mo < 10 ? mo.toFixed(1).replace('.', ',') : Math.round(mo)} Mo`;
}

function setupUpload(zone) {
  const input = zone.querySelector('input[type="file"]');
  const previews = zone.parentElement.querySelector('[data-upload-previews]');
  const counter = zone.parentElement.querySelector('[data-upload-count]');
  const erreursNode = zone.parentElement.querySelector('[data-upload-errors]');
  if (!input || !previews) return;

  const files = [];
  const erreurs = [];

  /**
   * Un fichier écarté doit se voir.
   *
   * Les trois contrôles ci-dessous se contentaient d'un `return` : une
   * photographie trop lourde disparaissait sans un mot, et le visiteur en
   * concluait que le bouton ne marchait pas. Un rejet silencieux sur le
   * chemin de conversion est le pire endroit où en placer un.
   */
  const rendreErreurs = () => {
    if (!erreursNode) return;
    erreursNode.textContent = '';
    erreurs.forEach((message) => {
      const li = document.createElement('li');
      li.textContent = message;
      erreursNode.append(li);
    });
    erreursNode.hidden = erreurs.length === 0;
  };

  const refresh = () => {
    previews.innerHTML = '';
    files.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'file-preview';
      const img = document.createElement('img');
      img.alt = `Aperçu de ${file.name}`;
      img.width = 120;
      img.height = 120;
      /* Pas de `loading="lazy"` ici : la vignette pointe un `blob:` local, il
         n'y a aucun octet à économiser, et six aperçus au maximum. Surtout, le
         chargement différé empêchait la détection des fichiers illisibles —
         l'étape « Photos » étant masquée tant qu'on est aux étapes 1 à 2, les
         aperçus restaient hors écran, le décodage n'était jamais tenté et
         l'événement `error` ne se déclenchait pas. */
      img.src = URL.createObjectURL(file);
      img.addEventListener('load', () => URL.revokeObjectURL(img.src), { once: true });
      /* Dernier filet : un fichier peut annoncer `image/jpeg`, peser moins de
         8 Mo, et n'être pas décodable. Le navigateur ne le dit qu'ici, à
         l'échec du rendu de l'aperçu. On le retire plutôt que de laisser
         partir vers le serveur un fichier qu'il refusera de toute façon. */
      img.addEventListener(
        'error',
        () => {
          URL.revokeObjectURL(img.src);
          const position = files.indexOf(file);
          if (position === -1) return;
          files.splice(position, 1);
          erreurs.push(`« ${file.name} » n’a pas pu être lu. Le fichier est peut-être endommagé.`);
          refresh();
          rendreErreurs();
        },
        { once: true }
      );
      const name = document.createElement('p');
      name.className = 'file-preview__name';
      name.textContent = file.name;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'file-preview__remove';
      remove.innerHTML = '<span aria-hidden="true">&times;</span>';
      remove.setAttribute('aria-label', `Retirer ${file.name}`);
      remove.addEventListener('click', () => {
        files.splice(index, 1);
        refresh();
      });
      item.append(img, name, remove);
      previews.append(item);
    });
    if (counter) {
      counter.textContent = files.length
        ? `${files.length} photo${files.length > 1 ? 's' : ''} sélectionnée${files.length > 1 ? 's' : ''} sur ${FORMS.maxFiles} maximum.`
        : '';
    }
    zone.dataset.count = String(files.length);
  };

  /**
   * Un fichier refusé n'en fait refuser aucun autre.
   *
   * Sélectionner six photographies dont la deuxième est trop lourde doit en
   * ajouter cinq et expliquer la sixième, pas tout abandonner.
   */
  const add = (fileList) => {
    erreurs.length = 0;
    const enTrop = [];

    Array.from(fileList).forEach((file) => {
      if (files.length >= FORMS.maxFiles) {
        enTrop.push(file.name);
        return;
      }
      if (!FORMS.acceptedTypes.includes(file.type)) {
        erreurs.push(`« ${file.name} » : ce format n’est pas accepté. Utilisez ${libelleFormats()}.`);
        return;
      }
      if (file.size > FORMS.maxFileSizeMo * 1024 * 1024) {
        erreurs.push(
          `« ${file.name} » pèse ${enMegaoctets(file.size)} : la taille maximale est de ${FORMS.maxFileSizeMo} Mo par photo.`
        );
        return;
      }
      if (file.size === 0) {
        erreurs.push(`« ${file.name} » est vide et n’a pas pu être lu.`);
        return;
      }
      files.push(file);
    });

    /* Le plafond est une seule information, pas une par fichier : dix photos
       déposées d'un coup ne doivent pas produire quatre lignes identiques. */
    if (enTrop.length === 1) {
      erreurs.push(`Vous pouvez envoyer jusqu’à ${FORMS.maxFiles} photos. « ${enTrop[0]} » n’a pas été ajoutée.`);
    } else if (enTrop.length > 1) {
      erreurs.push(
        `Vous pouvez envoyer jusqu’à ${FORMS.maxFiles} photos. ${enTrop.length} fichiers n’ont pas été ajoutés.`
      );
    }

    refresh();
    rendreErreurs();
  };

  input.addEventListener('change', () => {
    add(input.files);
    input.value = '';
  });

  ['dragenter', 'dragover'].forEach((type) =>
    zone.addEventListener(type, (event) => {
      event.preventDefault();
      zone.classList.add('is-dragover');
    })
  );
  ['dragleave', 'drop'].forEach((type) =>
    zone.addEventListener(type, (event) => {
      event.preventDefault();
      zone.classList.remove('is-dragover');
    })
  );
  zone.addEventListener('drop', (event) => {
    if (event.dataTransfer && event.dataTransfer.files) add(event.dataTransfer.files);
  });

  zone.__files = files;
}

/* ------------------------------------------------------------------- états */

/**
 * États possibles d'un formulaire, écrits sur l'élément en `data-form-state`
 * pour que le CSS et les tests puissent s'y accrocher :
 *
 *   idle        au repos
 *   validating  validation côté navigateur en cours
 *   submitting  envoi réseau en cours (mode LIVE uniquement)
 *   demo        mode DEMO : validé côté navigateur, RIEN n'a été transmis
 *   success     le serveur a accepté la demande (mode LIVE uniquement)
 *   error       échec réseau ou refus du serveur
 *
 * `demo` et `success` sont volontairement DEUX états distincts : en mode DEMO
 * le site ne doit jamais laisser croire qu'une demande est partie.
 */
const ETATS = ['idle', 'validating', 'submitting', 'demo', 'success', 'error'];

function setState(form, etat) {
  if (!ETATS.includes(etat)) return;
  form.dataset.formState = etat;
  const busy = etat === 'submitting' || etat === 'validating';
  form.setAttribute('aria-busy', busy ? 'true' : 'false');
  const submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn) submitBtn.disabled = etat === 'submitting';
}

/* -------------------------------------------------------------- soumission */

async function submit(form) {
  const output = form.querySelector('[data-form-output]') || document.querySelector('[data-form-output]');
  const nom = form.dataset.form || '';
  const payload = serialize(form);
  const zone = form.querySelector('[data-upload]');
  const photoCount = zone && zone.__files ? zone.__files.length : 0;
  const url = endpointFor(nom);

  // --- Mode DEMO : aucun appel réseau, aucun faux succès. -------------------
  if (!url) {
    setState(form, 'demo');
    renderDemoResult(form, output, payload, photoCount);
    return;
  }

  // --- Mode LIVE ------------------------------------------------------------
  setState(form, 'submitting');
  renderPending(output);
  try {
    const response = await fetch(url, {
      method: FORMS.method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });

    // 422 : le serveur a refusé des champs. On les affiche là où ils sont,
    // sans réécrire le formulaire — c'est tout l'intérêt d'avoir prévu l'état.
    if (response.status === 422) {
      const corps = await response.json().catch(() => null);
      setState(form, 'error');
      renderServerErrors(form, output, corps);
      return;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const recu = await response.json().catch(() => null);

    /* La demande est enregistrée. Les photos suivent, et leur sort ne remet
       jamais celle-ci en cause : on ne va pas annoncer un échec pour une pièce
       jointe alors que l'essentiel est passé. Le résultat du dépôt est
       simplement dit honnêtement dans le message de confirmation. */
    let photos = null;
    if (photoCount > 0 && zone && uploadEnabled()) {
      photos = await envoyerPhotos(recu, zone.__files);
    }

    setState(form, 'success');
    renderSuccess(form, output, photos);
  } catch (error) {
    setState(form, 'error');
    renderNetworkError(output);
    console.error('[expert-parquet] envoi du formulaire impossible :', error);
  }
}

/**
 * Second temps : dépôt des photographies.
 *
 * Le serveur a répondu à la demande par `photoUrl` et `photoToken`. L'adresse
 * n'est donc pas devinée côté client, et le jeton n'autorise QUE l'ajout de
 * fichiers à cette demande-là, pour une durée courte.
 *
 * Retourne `{ envoyees, refusees }`, ou `null` si le serveur n'attend pas de
 * photos — un formulaire de contact, par exemple.
 */
async function envoyerPhotos(recu, fichiers) {
  if (!recu || !recu.photoUrl || !recu.photoToken || !fichiers || !fichiers.length) return null;

  const corps = new FormData();
  corps.append('token', recu.photoToken);
  fichiers.forEach((file) => corps.append('photos[]', file, file.name));

  try {
    // Pas d'en-tête Content-Type : le navigateur doit poser lui-même la
    // frontière multipart, qu'on ne peut pas connaître ici.
    const reponse = await fetch(recu.photoUrl, { method: 'POST', body: corps });
    if (!reponse.ok) return { envoyees: 0, refusees: fichiers.length };
    const detail = await reponse.json().catch(() => null);
    const envoyees = detail && typeof detail.recues === 'number' ? detail.recues : fichiers.length;
    return { envoyees, refusees: fichiers.length - envoyees };
  } catch (error) {
    console.error('[expert-parquet] dépôt des photographies impossible :', error);
    return { envoyees: 0, refusees: fichiers.length };
  }
}

/** Attente : message discret, annoncé aux lecteurs d'écran. */
function renderPending(output) {
  if (!output) return;
  output.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'form-message';
  p.setAttribute('role', 'status');
  p.textContent = 'Envoi en cours…';
  output.append(p);
}

function renderNetworkError(output) {
  if (!output) return;
  output.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'form-message form-message--error';
  p.setAttribute('role', 'alert');
  p.textContent =
    'L’envoi n’a pas abouti. Vérifiez votre connexion et réessayez ; votre saisie est conservée.';
  output.append(p);
}

/**
 * Erreurs renvoyées par le serveur. Format attendu, décrit dans
 * BACKEND-CONTRACT.md : { errors: { nomDuChamp: "message" }, message?: "…" }.
 * Chaque message est posé sous SON champ, comme la validation locale.
 */
function renderServerErrors(form, output, corps) {
  const champs = (corps && corps.errors) || {};
  let premier = null;
  Object.entries(champs).forEach(([nom, message]) => {
    const field = form.querySelector(`[name="${CSS.escape(nom)}"], [name="${CSS.escape(nom)}[]"]`);
    const holder = field && field.closest('.field');
    const slot = holder && holder.querySelector('.field__error');
    if (slot) {
      slot.textContent = String(message);
      if (field.setAttribute) field.setAttribute('aria-invalid', 'true');
      if (!premier) premier = field;
    }
  });

  if (output) {
    output.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'form-message form-message--error';
    p.setAttribute('role', 'alert');
    p.textContent =
      (corps && corps.message) || 'Certaines informations n’ont pas été acceptées. Corrigez les champs signalés.';
    output.append(p);
  }
  if (premier && premier.focus) premier.focus();
}

function serialize(form) {
  const data = new FormData(form);
  const payload = {};
  data.forEach((value, key) => {
    if (value instanceof File) return;
    if (key.endsWith('[]')) {
      const clean = key.slice(0, -2);
      payload[clean] = payload[clean] || [];
      payload[clean].push(value);
    } else if (payload[key] !== undefined) {
      payload[key] = [].concat(payload[key], value);
    } else {
      payload[key] = value;
    }
  });
  payload._form = form.dataset.form || 'inconnu';
  payload._page = window.location.pathname;

  /* Durée de remplissage, en millisecondes. Un formulaire envoyé en moins de
     trois secondes n'a pas été lu ; le serveur s'en sert comme indice, jamais
     comme preuve. Le champ leurre `_hp` est lui déjà dans le formulaire, donc
     déjà repris par le FormData ci-dessus. */
  const ouverture = ouvertureDuFormulaire.get(form);
  if (ouverture) payload._ts = Date.now() - ouverture;

  /* Le contexte du pré-diagnostic part avec la demande d'expertise. Le
     visiteur a pu modifier ses réponses dans le formulaire : les deux sont
     conservés, le serveur les présente comme ce qu'ils sont. */
  const contexte = contexteDiagnostic.get(form);
  if (contexte && payload._form === 'devis') payload.diagnosticContext = contexte;

  return payload;
}

function renderSuccess(form, output, photos) {
  const panel = form.closest('.form-panel') || form.parentElement;
  form.hidden = true;
  if (!output) return;
  output.innerHTML = '';
  output.append(
    doneBlock('Votre demande a bien été transmise.', 'Nous revenons vers vous dans les meilleurs délais.')
  );

  /* Le sort des photographies est dit tel quel. Taire un dépôt partiel
     laisserait le visiteur croire que le constat est complet, et l'expertise
     se ferait sur des éléments manquants. */
  if (photos) {
    const p = document.createElement('p');
    p.className = 'form-message';
    if (photos.envoyees === 0) {
      p.className += ' form-message--error';
      p.textContent =
        'Vos photographies n’ont pas pu être déposées. Votre demande, elle, est bien enregistrée : nous vous les redemanderons par courriel.';
    } else if (photos.refusees > 0) {
      p.className += ' form-message--error';
      p.textContent = `${photos.envoyees} photographie${photos.envoyees > 1 ? 's ont' : ' a'} été reçue${
        photos.envoyees > 1 ? 's' : ''
      }, ${photos.refusees} n’a pas pu l’être.`;
    } else {
      p.textContent = `${photos.envoyees} photographie${photos.envoyees > 1 ? 's' : ''} reçue${
        photos.envoyees > 1 ? 's' : ''
      }.`;
    }
    output.append(p);
  }
  void panel;
}

/**
 * Libellé lisible d’un champ : son libellé de récapitulatif s’il en a un,
 * sinon le texte de son <label>, débarrassé de l’astérisque des champs
 * obligatoires. Un visiteur ne doit jamais lire un nom technique de champ.
 */
function fieldLabel(form, field) {
  if (field.dataset.recapKey) return field.dataset.recapKey;
  const label = field.id ? form.querySelector(`label[for="${field.id}"]`) : field.closest('label');
  if (!label) return null;
  const clone = label.cloneNode(true);
  clone.querySelectorAll('.field__required, input, .field__error').forEach((node) => node.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim().replace(/\s*\*$/, '');
}

/** Valeur affichable d’un champ (le texte de l’option pour un select). */
function fieldValue(field) {
  if (field.tagName === 'SELECT') {
    if (!field.value) return '';
    return field.selectedOptions[0] ? field.selectedOptions[0].textContent.trim() : '';
  }
  if (field.type === 'checkbox' || field.type === 'radio') return '';
  return String(field.value || '').trim();
}

/**
 * Récapitulatif lisible de ce que le visiteur vient de saisir.
 * Remplace le vidage JSON de la première version : un visiteur n’a rien à
 * faire d’un payload, mais relire sa demande a du sens.
 */
function recapList(form) {
  const list = document.createElement('dl');
  list.className = 'form-recap';
  let count = 0;

  form.querySelectorAll('input, select, textarea').forEach((field) => {
    if (!field.name || field.disabled) return;
    const value = fieldValue(field);
    if (!value) return;
    const label = fieldLabel(form, field);
    if (!label) return;
    const term = document.createElement('dt');
    term.textContent = label;
    const desc = document.createElement('dd');
    desc.textContent = value;
    list.append(term, desc);
    count += 1;
  });

  // Grilles de choix : un seul intitulé par groupe, valeurs jointes.
  form.querySelectorAll('[data-options][data-control]').forEach((group) => {
    const checked = [...group.querySelectorAll('input:checked')];
    if (!checked.length) return;
    const field = group.closest('.field');
    const legend = field && field.querySelector('.field__label');
    const term = document.createElement('dt');
    term.textContent = legend ? legend.textContent.replace(/\s*\*$/, '').trim() : 'Sélection';
    const desc = document.createElement('dd');
    desc.textContent = checked
      .map((input) => {
        const wrap = input.closest('.choice');
        const label = wrap && wrap.querySelector('.choice__label');
        return label ? label.textContent.trim() : input.value;
      })
      .join(', ');
    list.append(term, desc);
    count += 1;
  });

  return count ? list : null;
}

function renderDemoResult(form, output, payload, photoCount) {
  if (!output) return;
  form.hidden = true;
  const block = doneBlock(
    'Votre demande n’a pas été transmise',
    'Ce formulaire est une démonstration : aucun envoi n’est actif pour le moment. Vos réponses sont restées dans votre navigateur — relisez-les ci-dessous, ou revenez les modifier.'
  );

  if (photoCount > 0) {
    const note = document.createElement('p');
    note.className = 'disclaimer';
    const plural = photoCount > 1 ? 's' : '';
    note.textContent = `${photoCount} photo${plural} affichée${plural} en aperçu, non envoyée${plural}.`;
    block.append(note);
  }

  const recap = recapList(form);
  if (recap) {
    const heading = document.createElement('p');
    heading.className = 'form-recap__title';
    heading.textContent = 'Ce que vous avez saisi';
    block.append(heading, recap);
  }

  const again = document.createElement('button');
  again.type = 'button';
  again.className = 'btn btn--outline';
  again.textContent = 'Modifier ma demande';
  again.addEventListener('click', () => {
    form.hidden = false;
    output.innerHTML = '';
    form.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  });
  block.append(again);

  output.innerHTML = '';
  output.append(block);
  block.querySelector('h2').focus();
  void payload;
}

function doneBlock(title, text) {
  const wrap = document.createElement('div');
  wrap.className = 'form-done';
  wrap.setAttribute('role', 'status');

  const icon = document.createElement('div');
  icon.className = 'form-done__icon';
  icon.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  const heading = document.createElement('h2');
  heading.textContent = title;
  heading.setAttribute('tabindex', '-1');

  const paragraph = document.createElement('p');
  paragraph.className = 'text-muted';
  paragraph.style.maxWidth = '';
  paragraph.textContent = text;

  wrap.append(icon, heading, paragraph);
  return wrap;
}

/* --------------------------------------------------------------- préremplissage */

function prefillFromUrl(form) {
  const params = new URLSearchParams(window.location.search);
  if ([...params.keys()].length === 0) return;

  const contexte = {};
  params.forEach((value, key) => {
    if (key in contexte) contexte[key] = [].concat(contexte[key], value);
    else contexte[key] = value;
  });
  contexteDiagnostic.set(form, contexte);

  params.forEach((value, key) => {
    const radio = form.querySelector(`input[type="radio"][name="${CSS.escape(key)}"][value="${CSS.escape(value)}"]`);
    if (radio) {
      radio.checked = true;
      return;
    }
    const checkbox = form.querySelector(
      `input[type="checkbox"][name="${CSS.escape(key)}[]"][value="${CSS.escape(value)}"]`
    );
    if (checkbox) {
      checkbox.checked = true;
      return;
    }
    const field = form.querySelector(`[name="${CSS.escape(key)}"]`);
    if (field && field.tagName !== 'BUTTON') field.value = value;
  });
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
