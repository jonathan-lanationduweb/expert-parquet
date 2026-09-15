/**
 * Accordéon accessible (FAQ, listes de causes).
 *
 * Balisage attendu :
 *   <div class="accordion" data-accordion [data-accordion-single]>
 *     <div class="accordion__item">
 *       <h3><button class="accordion__trigger" aria-expanded="false"
 *                   aria-controls="ID">…<span class="accordion__icon"></span></button></h3>
 *       <div class="accordion__panel" id="ID" role="region" data-open="false">
 *         <div class="accordion__panel-inner"><div>…</div></div>
 *       </div>
 *     </div>
 *   </div>
 */

export function initAccordions() {
  document.querySelectorAll('[data-accordion]').forEach(setupAccordion);
}

function setupAccordion(root) {
  const single = root.hasAttribute('data-accordion-single');
  const triggers = Array.from(root.querySelectorAll('.accordion__trigger'));
  if (triggers.length === 0) return;

  triggers.forEach((trigger, index) => {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) return;

    setState(trigger, trigger.getAttribute('aria-expanded') === 'true');

    trigger.addEventListener('click', () => {
      const willOpen = trigger.getAttribute('aria-expanded') !== 'true';
      if (single && willOpen) triggers.forEach((other) => other !== trigger && setState(other, false));
      setState(trigger, willOpen);
    });

    trigger.addEventListener('keydown', (event) => {
      const map = { ArrowDown: 1, ArrowUp: -1 };
      if (event.key in map) {
        event.preventDefault();
        const next = (index + map[event.key] + triggers.length) % triggers.length;
        triggers[next].focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        triggers[0].focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        triggers[triggers.length - 1].focus();
      }
    });
  });

  // Ouvre l’élément ciblé par l’ancre de l’URL, le cas échéant.
  if (window.location.hash) {
    const target = root.querySelector(`.accordion__trigger[aria-controls="${window.location.hash.slice(1)}"]`);
    if (target) setState(target, true);
  }
}

function setState(trigger, open) {
  const panel = document.getElementById(trigger.getAttribute('aria-controls'));
  trigger.setAttribute('aria-expanded', String(open));
  if (!panel) return;
  panel.dataset.open = String(open);
  // Le panneau replié reste dans le flux (transition de hauteur) : `inert` le
  // retire de la tabulation et de l’arbre d’accessibilité tant qu’il est fermé.
  if (open) panel.removeAttribute('inert');
  else panel.setAttribute('inert', '');
}
