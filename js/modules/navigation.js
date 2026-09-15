/**
 * Navigation : menu mobile accessible + état du header au scroll.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initNavigation() {
  initDrawer();
  initHeaderScroll();
}

/**
 * Verrouillage du défilement pendant l'ouverture du drawer.
 *
 * `overflow: hidden` sur <body> ne suffit pas sur iOS : Safari continue de
 * faire défiler la page derrière un panneau en `position: fixed`. La seule
 * méthode fiable consiste à sortir le corps du flux et à compenser la position
 * de défilement courante par un décalage négatif — sans quoi la page saute en
 * haut à l'ouverture, puis de nouveau à la fermeture.
 */
const scrollLock = {
  y: 0,
  on() {
    this.y = window.scrollY;
    document.body.style.top = `-${this.y}px`;
    document.body.classList.add('nav-lock');
  },
  off() {
    if (!document.body.classList.contains('nav-lock')) return;
    document.body.classList.remove('nav-lock');
    document.body.style.top = '';
    // `instant` : la restauration n'est pas un déplacement voulu par
    // l'utilisateur, l'animer donnerait l'impression que la page bouge seule.
    window.scrollTo({ top: this.y, behavior: 'instant' });
  },
};

function initDrawer() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  const closeBtn = nav && nav.querySelector('[data-nav-close]');
  if (!toggle || !nav) return;

  let lastFocused = null;

  const isOpen = () => document.body.classList.contains('nav-open');

  const open = () => {
    lastFocused = document.activeElement;
    scrollLock.on();
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    nav.removeAttribute('inert');
    // Le focus va sur la croix plutôt que sur le premier lien : c'est la
    // sortie du panneau, elle est annoncée aux lecteurs d'écran, et la
    // tabulation suivante entre naturellement dans la navigation.
    const target = closeBtn || nav.querySelector(FOCUSABLE);
    if (target) target.focus();
    document.addEventListener('keydown', onKeydown);
  };

  const close = ({ restoreFocus = true } = {}) => {
    document.body.classList.remove('nav-open');
    scrollLock.off();
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
  if (closeBtn) closeBtn.addEventListener('click', () => close());

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
