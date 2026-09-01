/**
 * Formulaires : peuplement depuis la configuration, validation, étapes,
 * prévisualisation de photos, récapitulatif et soumission.
 *
 * Aucun envoi réel n’est effectué tant que `FORMS.endpoint` vaut `null`
 * (js/config/site.js). Dans ce mode, le formulaire affiche honnêtement les
 * données qu’il aurait transmises. Voir TODO-INTEGRATIONS.md.
 */

import { FORMS } from '../config/site.js';
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

function setupForm(form) {
  const steps = Array.from(form.querySelectorAll('[data-form-step]'));
  const stepper = form.querySelector('[data-form-stepper]');
  const recap = form.querySelector('[data-recap]') || document.querySelector('[data-recap]');
  let current = 0;

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
    if (!validateStep(scope)) return;
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

function setupUpload(zone) {
  const input = zone.querySelector('input[type="file"]');
  const previews = zone.parentElement.querySelector('[data-upload-previews]');
  const counter = zone.parentElement.querySelector('[data-upload-count]');
  if (!input || !previews) return;

  const files = [];

  const refresh = () => {
    previews.innerHTML = '';
    files.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'file-preview';
      const img = document.createElement('img');
      img.alt = `Aperçu de ${file.name}`;
      img.width = 120;
      img.height = 120;
      img.loading = 'lazy';
      img.src = URL.createObjectURL(file);
      img.addEventListener('load', () => URL.revokeObjectURL(img.src), { once: true });
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

  const add = (fileList) => {
    Array.from(fileList).forEach((file) => {
      if (files.length >= FORMS.maxFiles) return;
      if (!FORMS.acceptedTypes.includes(file.type)) return;
      if (file.size > FORMS.maxFileSizeMo * 1024 * 1024) return;
      files.push(file);
    });
    refresh();
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

/* -------------------------------------------------------------- soumission */

async function submit(form) {
  const output = form.querySelector('[data-form-output]') || document.querySelector('[data-form-output]');
  const payload = serialize(form);
  const zone = form.querySelector('[data-upload]');
  const photoCount = zone && zone.__files ? zone.__files.length : 0;

  if (!FORMS.endpoint) {
    renderDemoResult(form, output, payload, photoCount);
    return;
  }

  const submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  try {
    const response = await fetch(FORMS.endpoint, {
      method: FORMS.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    renderSuccess(form, output);
  } catch (error) {
    if (output) {
      output.innerHTML = '';
      const message = document.createElement('div');
      message.className = 'form-message form-message--error';
      message.setAttribute('role', 'alert');
      message.textContent =
        'L’envoi n’a pas abouti. Merci de réessayer dans quelques instants ou de nous contacter directement.';
      output.append(message);
      console.error('[expert-parquet] envoi du formulaire impossible :', error);
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
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
  return payload;
}

function renderSuccess(form, output) {
  const panel = form.closest('.form-panel') || form.parentElement;
  form.hidden = true;
  if (!output) return;
  output.innerHTML = '';
  output.append(doneBlock('Votre demande a bien été transmise.', 'Nous revenons vers vous dans les meilleurs délais.'));
  void panel;
}

function renderDemoResult(form, output, payload, photoCount) {
  if (!output) return;
  form.hidden = true;
  const block = doneBlock(
    'Formulaire validé côté navigateur',
    'Aucun serveur n’est connecté pour le moment : rien n’a été envoyé et aucune donnée n’a quitté cette page. Voici exactement ce qui serait transmis une fois le backend branché.'
  );

  if (photoCount > 0) {
    const note = document.createElement('p');
    note.className = 'disclaimer';
    note.textContent = `${photoCount} photo${photoCount > 1 ? 's ont' : ' a'} été sélectionnée${photoCount > 1 ? 's' : ''} et prévisualisée${photoCount > 1 ? 's' : ''} localement. Les fichiers n’ont pas été téléversés : aucun service de stockage n’est encore configuré.`;
    block.append(note);
  }

  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(payload, null, 2);
  block.append(pre);

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
