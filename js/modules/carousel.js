/**
 * Carrousel « Situations à analyser ».
 *
 * Choix assumés :
 *  - scroll natif + scroll-snap, aucune dépendance, aucun autoplay ;
 *  - le viewport est focusable : les flèches du clavier le font défiler,
 *    et Tab passe dans les liens des slides ;
 *  - swipe natif sur mobile ;
 *  - compteur 01 / 05 et barre de progression mis à jour au scroll.
 *
 * Les mesures coûteuses (scrollWidth, largeur de slide) sont mises en cache et
 * recalculées au redimensionnement : le gestionnaire de scroll ne lit alors que
 * `scrollLeft`, ce qui évite de recalculer la mise en page à chaque événement —
 * et de dépendre de requestAnimationFrame, gelé dans un onglet en arrière-plan.
 */

export function initCarousels() {
  document.querySelectorAll('[data-showcase]').forEach(setupShowcase);
}

function setupShowcase(root) {
  const viewport = root.querySelector('[data-showcase-viewport]');
  if (!viewport) return;

  const prev = root.querySelector('[data-showcase-prev]');
  const next = root.querySelector('[data-showcase-next]');
  const bar = root.querySelector('[data-showcase-bar]');
  const current = root.querySelector('[data-showcase-current]');
  const slides = Array.from(viewport.querySelectorAll('.showcase__slide'));
  if (slides.length === 0) return;

  let step = 1;
  let max = 0;
  let visibleRatio = 1;

  const measure = () => {
    const gap = parseFloat(getComputedStyle(viewport).columnGap || '0') || 0;
    step = Math.max(1, slides[0].getBoundingClientRect().width + gap);
    max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    visibleRatio = Math.max(0.12, viewport.clientWidth / Math.max(viewport.scrollWidth, 1));
    update();
  };

  const update = () => {
    const left = viewport.scrollLeft;
    const scrollable = max > 2;
    if (prev) prev.disabled = !scrollable || left <= 2;
    if (next) next.disabled = !scrollable || left >= max - 2;

    const index = Math.min(slides.length - 1, Math.round(left / step));
    if (current) current.textContent = String(index + 1).padStart(2, '0');
    if (bar) {
      const progress = scrollable ? left / max : 0;
      bar.style.width = `${(visibleRatio + (1 - visibleRatio) * progress) * 100}%`;
    }
  };

  const scrollByStep = (direction) =>
    viewport.scrollBy({ left: direction * step, behavior: motion() });

  if (prev) prev.addEventListener('click', () => scrollByStep(-1));
  if (next) next.addEventListener('click', () => scrollByStep(1));

  viewport.addEventListener('keydown', (event) => {
    const actions = {
      ArrowRight: () => scrollByStep(1),
      ArrowLeft: () => scrollByStep(-1),
      Home: () => viewport.scrollTo({ left: 0, behavior: motion() }),
      End: () => viewport.scrollTo({ left: viewport.scrollWidth, behavior: motion() }),
    };
    if (!actions[event.key]) return;
    event.preventDefault();
    actions[event.key]();
  });

  viewport.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure, { once: true });
  measure();
}

function motion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}
