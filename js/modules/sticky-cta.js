/**
 * Rappel d’action fixé en bas d’écran, sur mobile uniquement.
 *
 * Règle : la barre ne s’affiche QUE dans la zone intermédiaire de la page —
 * ni pendant le hero (l’appel à l’action y est déjà présent et visible), ni
 * à l’approche du bandeau final ou du pied de page (elle doublerait un CTA
 * déjà à l’écran). Elle n’a donc de raison d’être que là où le visiteur lit
 * du contenu sans aucun appel à l’action sous les yeux.
 *
 * Deux IntersectionObserver plutôt qu’un écouteur de défilement : aucun
 * travail à chaque pixel scrollé, et le seuil suit la géométrie réelle.
 */

export function initStickyCta() {
  const cta = document.querySelector('[data-sticky-cta]');
  if (!cta) return;

  const head = document.querySelector('.hero, .page-hero');
  const ends = document.querySelectorAll('.cta-band, .site-footer');
  if (!head && !ends.length) return;

  let inHead = Boolean(head);
  const visibleEnds = new Set();

  const apply = () => {
    cta.classList.toggle('is-visible', !inHead && visibleEnds.size === 0);
  };

  if (head) {
    new IntersectionObserver(
      ([entry]) => {
        inHead = entry.isIntersecting;
        apply();
      },
      { threshold: 0 }
    ).observe(head);
  }

  if (ends.length) {
    // La marge basse fait disparaître la barre AVANT que le CTA final
    // n’entre à l’écran : les deux ne se croisent jamais.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleEnds.add(entry.target);
          else visibleEnds.delete(entry.target);
        });
        apply();
      },
      { rootMargin: '0px 0px 140px 0px' }
    );
    ends.forEach((el) => observer.observe(el));
  }

  apply();
}
