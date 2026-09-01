/**
 * Apparitions progressives au scroll.
 *
 * Contrat : tout élément portant `data-reveal` est masqué par CSS puis révélé
 * à l’entrée dans le viewport. `data-reveal-delay` (ms) permet d’échelonner.
 * Respecte `prefers-reduced-motion` : dans ce cas tout est visible d’entrée.
 */

export function initAnimations() {
  const targets = document.querySelectorAll('[data-reveal]');
  if (targets.length === 0) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = Number(el.dataset.revealDelay || 0);
        if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
        el.classList.add('is-visible');
        observer.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  targets.forEach((el) => observer.observe(el));
}
