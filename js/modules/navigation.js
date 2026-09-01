/**
 * Navigation : menu mobile accessible + état du header au scroll.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initNavigation() {
  initDrawer();
  initHeaderScroll();
}

function initDrawer() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  const overlay = document.querySelector('[data-nav-overlay]');
  if (!toggle || !nav) return;

  let lastFocused = null;

  const isOpen = () => document.body.classList.contains('nav-open');

  const open = () => {
    lastFocused = document.activeElement;
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    nav.removeAttribute('inert');
    const first = nav.querySelector(FOCUSABLE);
    if (first) first.focus();
    document.addEventListener('keydown', onKeydown);
  };

  const close = ({ restoreFocus = true } = {}) => {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
    if (isMobile()) nav.setAttribute('inert', '');
    if (restoreFocus && lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = Array.from(nav.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  toggle.addEventListener('click', () => (isOpen() ? close() : open()));
  if (overlay) overlay.addEventListener('click', () => close());

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a') && isOpen()) close({ restoreFocus: false });
  });

  // Le drawer ne doit être hors du flux de tabulation que sur mobile fermé.
  const mq = window.matchMedia('(max-width: 1024px)');
  const isMobile = () => mq.matches;
  const syncInert = () => {
    if (isMobile() && !isOpen()) nav.setAttribute('inert', '');
    else nav.removeAttribute('inert');
    if (!isMobile() && isOpen()) close({ restoreFocus: false });
  };
  mq.addEventListener('change', syncInert);
  syncInert();
}

function initHeaderScroll() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  // Mise à jour directe plutôt que via requestAnimationFrame : la lecture de
  // window.scrollY ne force aucun recalcul de mise en page, et le header ne
  // dépend donc pas d'un rAF (gelé dans un onglet en arrière-plan). Sur les
  // pages à header transparent, cet état conditionne la lisibilité.
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 12);

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}
