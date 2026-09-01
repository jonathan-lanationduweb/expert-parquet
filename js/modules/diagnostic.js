/**
 * Pré-diagnostic interactif.
 *
 * 100 % frontend : aucune donnée n’est envoyée. Le résultat est construit à
 * partir de js/config/diagnostic-rules.js et reste volontairement formulé
 * comme une orientation, jamais comme un diagnostic.
 *
 * Point de branchement futur : `onComplete` reçoit l’objet de réponses et peut
 * être relié à une API (voir TODO-INTEGRATIONS.md).
 */

import { PROBLEMES, TYPES_PARQUET, SUPPORTS, DEBUTS, PIECES, labelOf } from '../config/options.js';
import {
  ORIENTATIONS,
  NOTES_TYPE,
  NOTES_SUPPORT,
  NOTES_DEBUT,
  DISCLAIMER,
} from '../config/diagnostic-rules.js';

const STEPS = [
  {
    key: 'probleme',
    question: 'Quel problème observez-vous ?',
    help: 'Choisissez le symptôme le plus visible. Vous pourrez préciser ensuite.',
    options: PROBLEMES,
    required: true,
  },
  {
    key: 'debut',
    question: 'Depuis quand ?',
    help: 'L’ancienneté du phénomène oriente fortement l’analyse.',
    options: DEBUTS,
    required: true,
  },
  {
    key: 'piece',
    question: 'Dans quelle pièce ?',
    help: 'L’usage de la pièce influence l’humidité et les sollicitations.',
    options: PIECES,
    required: true,
  },
  {
    key: 'type',
    question: 'Quel type de parquet ?',
    help: 'Si vous hésitez, indiquez « Je ne sais pas » : c’est une information utile en soi.',
    options: TYPES_PARQUET,
    required: true,
  },
  {
    key: 'support',
    question: 'Quel est le support, si vous le connaissez ?',
    help: 'Le support explique une grande partie des désordres de parquet.',
    options: SUPPORTS,
    required: false,
  },
];

export function initDiagnostic() {
  document.querySelectorAll('[data-diagnostic]').forEach(setupDiagnostic);
}

function setupDiagnostic(root) {
  const quotePath = root.dataset.quoteUrl || 'devis.html';
  const answers = {};
  let index = 0;

  root.innerHTML = '';
  root.classList.add('diagnostic');

  const stepper = buildStepper();
  const stage = document.createElement('div');
  stage.setAttribute('aria-live', 'polite');

  root.append(stepper.el, stage);

  render();

  function render() {
    const step = STEPS[index];
    stepper.update(index, STEPS.length);
    stage.innerHTML = '';
    stage.append(step ? buildStep(step) : buildResult());
    const first = stage.querySelector('input, button');
    if (first && root.dataset.autofocus !== 'off') {
      // Ne pas voler le focus au chargement initial de la page.
      if (root.dataset.started === 'true') first.focus();
    }
    root.dataset.started = 'true';
  }

  function buildStep(step) {
    const wrap = el('div', 'diagnostic__step');

    const head = el('div');
    head.append(
      el('p', 'label', `Étape ${index + 1} sur ${STEPS.length}`),
      el('h3', 'diagnostic__question u-mt-sm', step.question),
      el('p', 'diagnostic__help', step.help)
    );

    const grid = el('div', 'choice-grid');
    step.options.forEach((option) => {
      const label = el('label', 'choice choice--radio');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `diag-${step.key}`;
      input.value = option.value;
      input.checked = answers[step.key] === option.value;
      input.addEventListener('change', () => {
        answers[step.key] = option.value;
        nextBtn.disabled = false;
      });
      label.append(input, el('span', 'choice__box'), el('span', 'choice__label', option.label));
      grid.append(label);
    });

    const nav = el('div', 'diagnostic__nav');
    const backBtn = button('Retour', 'btn btn--ghost btn--sm');
    backBtn.disabled = index === 0;
    backBtn.addEventListener('click', () => {
      index = Math.max(0, index - 1);
      render();
    });

    const right = el('div', 'diagnostic__nav-right');
    const skipBtn = button('Passer', 'btn btn--ghost btn--sm');
    skipBtn.addEventListener('click', () => {
      delete answers[step.key];
      index += 1;
      render();
    });
    const nextBtn = button(index === STEPS.length - 1 ? 'Voir l’orientation' : 'Continuer', 'btn btn--primary btn--sm');
    nextBtn.disabled = step.required && !answers[step.key];
    nextBtn.addEventListener('click', () => {
      index += 1;
      render();
    });

    if (!step.required) right.append(skipBtn);
    right.append(nextBtn);
    nav.append(backBtn, right);

    wrap.append(head, grid, nav);
    return wrap;
  }

  function buildResult() {
    const orientation = ORIENTATIONS[answers.probleme] || ORIENTATIONS.autre;
    const wrap = el('div', 'diagnostic__result');

    const head = el('div', 'diagnostic__result-head');
    head.append(
      el('p', 'label', 'Orientation générale'),
      el('h3', 'diagnostic__question u-mt-sm', orientation.titre)
    );

    const summary = el('div', 'diagnostic__summary');
    summaryRow(summary, 'Symptôme principal', labelOf(PROBLEMES, answers.probleme));
    summaryRow(summary, 'Apparition', labelOf(DEBUTS, answers.debut));
    summaryRow(summary, 'Pièce concernée', labelOf(PIECES, answers.piece));
    summaryRow(summary, 'Type de parquet', labelOf(TYPES_PARQUET, answers.type));
    summaryRow(summary, 'Support', labelOf(SUPPORTS, answers.support));

    const body = el('div');
    body.append(el('p', null, orientation.resume));

    const pistes = el('div', 'u-mt-md');
    pistes.append(el('h4', null, 'Causes possibles à explorer'));
    pistes.append(list(orientation.pistes, 'rich-list u-mt-sm'));

    const verifs = el('div', 'u-mt-md');
    verifs.append(el('h4', null, 'Premières vérifications utiles'));
    verifs.append(list(orientation.verifications, 'rich-list rich-list--check u-mt-sm'));

    const notes = [NOTES_TYPE[answers.type], NOTES_SUPPORT[answers.support], NOTES_DEBUT[answers.debut]].filter(
      Boolean
    );
    const notesBlock = el('div', 'u-mt-md');
    if (notes.length) {
      const callout = el('div', 'callout callout--slate');
      callout.append(el('p', 'callout__title', 'À prendre en compte'));
      notes.forEach((note) => callout.append(el('p', null, note)));
      notesBlock.append(callout);
    }

    const disclaimer = el('p', 'disclaimer u-mt-md', DISCLAIMER);

    const actions = el('div', 'btn-group u-mt-lg');
    const cta = document.createElement('a');
    cta.className = 'btn btn--primary';
    cta.href = buildQuoteUrl(quotePath, answers);
    cta.textContent = 'Demander une expertise';
    const restart = button('Recommencer', 'btn btn--outline');
    restart.addEventListener('click', () => {
      Object.keys(answers).forEach((key) => delete answers[key]);
      index = 0;
      render();
    });
    actions.append(cta, restart);

    wrap.append(head, summary, body, pistes, verifs, notesBlock, disclaimer, actions);
    return wrap;
  }

  function summaryRow(parent, key, value) {
    if (!value) return;
    const row = el('div', 'diagnostic__summary-row');
    row.append(el('span', 'diagnostic__summary-key', key), el('span', 'diagnostic__summary-val', value));
    parent.append(row);
  }
}

/* ---------------------------------------------------------------- helpers */

function buildStepper() {
  const wrapper = el('div', 'stepper');
  const meta = el('div', 'stepper__meta');
  const current = el('span', 'stepper__current');
  const dots = el('div', 'diagnostic__dots');
  meta.append(current, dots);
  const track = el('div', 'stepper__track');
  const bar = el('div', 'stepper__bar');
  track.append(bar);
  wrapper.append(meta, track);

  return {
    el: wrapper,
    update(index, total) {
      const done = Math.min(index, total);
      current.textContent = index >= total ? 'Orientation' : `Étape ${index + 1} / ${total}`;
      bar.style.width = `${(done / total) * 100}%`;
      dots.innerHTML = '';
      for (let i = 0; i < total; i += 1) {
        const dot = el('span', 'diagnostic__dot');
        if (i < index) dot.classList.add('is-done');
        if (i === index) dot.classList.add('is-current');
        dots.append(dot);
      }
    },
  };
}

/** Pré-remplit le formulaire de devis avec les réponses du pré-diagnostic. */
function buildQuoteUrl(base, answers) {
  const params = new URLSearchParams();
  if (answers.probleme) params.set('probleme', answers.probleme);
  if (answers.type) params.set('type', answers.type);
  if (answers.piece) params.set('piece', answers.piece);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function button(label, className) {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = className;
  node.textContent = label;
  return node;
}

function list(items, className) {
  const ul = el('ul', className);
  items.forEach((item) => ul.append(el('li', null, item)));
  return ul;
}

