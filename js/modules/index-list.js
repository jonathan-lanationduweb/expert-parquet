/**
 * Liste éditoriale : vignette qui suit le curseur au survol d’une ligne.
 *
 * Purement décoratif et strictement desktop :
 *  - la vignette est en aria-hidden, aucune information n’y est exclusive ;
 *  - désactivé sous 1024 px, sur pointeur grossier et si l’utilisateur a
 *    demandé une réduction des animations ;
 *  - la liste reste une simple suite de liens : elle fonctionne sans JS.
 */

export function initIndexLists() {
  const supported =
    window.matchMedia('(min-width: 1025px)').matches &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supported) return;

  document.querySelectorAll('[data-index-list]').forEach(setupIndexList);
}

function setupIndexList(root) {
  const preview = root.querySelector('[data-index-preview]');
  const image = preview && preview.querySelector('img');
  const rows = Array.from(root.querySelectorAll('[data-index-item]'));
  if (!preview || !image || rows.length === 0) return;

  let raf = null;
  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let active = false;

  const render = () => {
    // Amortissement léger : la vignette suit sans coller au curseur.
    x += (targetX - x) * 0.16;
    y += (targetY - y) * 0.16;
    preview.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    raf = active ? window.requestAnimationFrame(render) : null;
  };

  const start = () => {
    if (active) return;
    active = true;
    x = targetX;
    y = targetY;
    render();
  };

  const stop = () => {
    active = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = null;
  };

  root.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const bounds = root.getBoundingClientRect();
    targetX = event.clientX - bounds.left + 28;
    targetY = event.clientY - bounds.top - preview.offsetHeight / 2;
    // Ne jamais laisser la vignette déborder du conteneur.
    targetX = Math.min(targetX, bounds.width - preview.offsetWidth);
    targetY = Math.max(0, Math.min(targetY, bounds.height - preview.offsetHeight));
  });

  rows.forEach((row) => {
    row.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      const src = row.dataset.preview;
      if (!src) return;
      if (image.getAttribute('src') !== src) image.setAttribute('src', src);
      preview.classList.add('is-visible');
      start();
    });
  });

  root.addEventListener('pointerleave', () => {
    preview.classList.remove('is-visible');
    stop();
  });
}
