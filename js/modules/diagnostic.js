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
  REMPLACEMENT_PLAUSIBLE,
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
  /* Le moteur « Trouver mon parquet » : la sortie quand un remplacement peut
     être envisagé. Les réponses déjà connues (pièce, type) l'accompagnent dans
     l'URL — il ne les redemande pas. */
  const finderPath = root.dataset.finderUrl || 'trouver-mon-parquet.html';
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
    /* Une étape : le premier choix. Le résultat : son titre, pas un bouton
       secondaire — c'est le résumé qu'on vient d'obtenir qu'il faut annoncer. */
    let first = stage.querySelector('input, button');
    if (!step) {
      const titre = stage.querySelector('.diagnostic__result h3');
      if (titre) { titre.tabIndex = -1; first = titre; }
    }
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

    const commerciale = buildOrientation(answers, cta);
    if (commerciale) wrap.append(commerciale);

    return wrap;
  }

  /**
   * Orientation commerciale — trois sorties possibles au bout du pré-diagnostic.
   *
   * A. Le besoin reste une analyse  → « Demander une expertise », déjà là.
   * B. Réparation ou rénovation     → rien de plus : on reste chez nous.
   * C. Remplacement plausible       → ce bloc, et lui seul.
   *
   * Il n'apparaît que pour les symptômes de `REMPLACEMENT_PLAUSIBLE`, il est
   * placé APRÈS l'appel à l'expertise, et il demande deux clics : choisir son
   * profil, puis suivre le lien. Aucune redirection, aucune fenêtre qui
   * s'ouvre toute seule.
   *
   * Effet utile au passage : le profil choisi part avec la demande d'expertise
   * (`profil=`), où il pré-coche « Particulier / Professionnel » et remplit
   * `customer_type` côté backend. La qualification est donc gratuite pour le
   * visiteur — il ne répond pas deux fois à la même question.
   */
  /**
   * La sortie du pré-diagnostic.
   *
   * Deux chemins, pas davantage : faire expertiser, ou choisir un parquet. La
   * question du profil n'est posée qu'APRÈS le second choix, par le
   * mini-routeur — et seulement parce qu'elle change la destination.
   *
   * Elle n'apparaît que pour les symptômes de `REMPLACEMENT_PLAUSIBLE` : un
   * grincement ou une tache ne deviennent jamais une proposition d'achat.
   */
  function buildOrientation(reponses, ctaExpertise) {
    if (!REMPLACEMENT_PLAUSIBLE.includes(reponses.probleme)) return null;

    const box = el('div', 'callout callout--neutral u-mt-lg');
    box.dataset.orientation = '';
    afficherChoix();
    return box;

    function afficherChoix() {
      box.innerHTML = '';
      box.append(
        el('p', 'callout__title', 'Un remplacement peut être envisagé'),
        el('p', 'orientation__question', 'C’est une hypothèse, pas une conclusion. Vous pouvez chercher dès maintenant un parquet adapté — vos réponses sont reprises, rien n’est redemandé — ou faire vérifier avant de décider.')
      );

      const groupe = el('div', 'orientation__choix');

      /* Chercher un parquet d'abord : après un pré-diagnostic qui vient de
         dire que le parquet est probablement perdu, proposer une expertise
         pour confirmer une perte coûterait au visiteur sans servir personne.
         L'expertise reste juste à côté, pour qui veut une certitude. */
      const trouver = document.createElement('a');
      trouver.className = 'btn btn--primary';
      trouver.href = buildFinderUrl(finderPath, reponses);
      trouver.textContent = 'Trouver un parquet adapté';
      trouver.dataset.event = 'finder_open';
      trouver.dataset.context = `pre-diagnostic-${reponses.probleme}`;
      groupe.append(trouver);

      const expertise = document.createElement('a');
      expertise.className = 'btn btn--outline';
      expertise.href = ctaExpertise.href;
      expertise.textContent = 'Faire expertiser avant de décider';
      groupe.append(expertise);

      box.append(groupe);
    }
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
/**
 * URL du moteur « Trouver mon parquet », avec ce que le pré-diagnostic sait
 * déjà et qui est FIABLE : la pièce et le type de parquet existant, s'ils ont
 * été donnés. « Je ne sais pas » et « autre » ne sont pas transmis — ce ne
 * sont pas des critères. L'ancre arrive en dernier, après les paramètres.
 */
function buildFinderUrl(base, answers) {
  const [chemin, ancre] = base.split('#');
  const params = new URLSearchParams();
  if (answers.piece && !['plusieurs', 'autre'].includes(answers.piece)) params.set('piece', answers.piece);
  if (['massif', 'contrecolle', 'stratifie'].includes(answers.type)) params.set('type', answers.type);
  if (answers.profil) params.set('profil', answers.profil);
  params.set('via', 'pre-diagnostic');
  return `${chemin}?${params.toString()}${ancre ? `#${ancre}` : ''}`;
}

function buildQuoteUrl(base, answers) {
  const params = new URLSearchParams();
  if (answers.probleme) params.set('probleme', answers.probleme);
  if (answers.type) params.set('type', answers.type);
  if (answers.piece) params.set('piece', answers.piece);
  // Le profil n'est posé que si le visiteur l'a choisi lui-même.
  if (answers.profil) params.set('profil', answers.profil);
  // Marque l'origine : un lien depuis une page « problème » porte aussi des
  // paramètres, mais n'est pas un pré-diagnostic.
  params.set('via', 'pre-diagnostic');
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

