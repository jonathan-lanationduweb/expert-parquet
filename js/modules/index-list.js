/**
 * Liste éditoriale : vignette qui suit le curseur au survol d’une ligne.
 *
 * Purement décoratif et strictement desktop :
 *  - la vignette est en aria-hidden, aucune information n’y est exclusive ;
 *  - le survol à la souris ET le focus clavier la déclenchent ;
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

  /**
   * Remplacement ATOMIQUE de la vignette.
   *
   * `srcset` doit être réécrit en même temps que `src`. Dès qu'un `srcset` est
   * présent, le navigateur choisit parmi ses candidats et ignore `src` — qui
   * n'est plus qu'un repli. Le module ne changeait que `src` : depuis
   * l'arrivée des images responsives, la vignette restait donc figée sur la
   * première photographie de la liste, quelle que soit la ligne survolée.
   *
   * Les valeurs viennent des attributs `data-preview-*` produits par
   * tools/images.mjs. Rien n'est reconstruit ici : le pipeline reste la source
   * de vérité.
   */
  const afficher = (row) => {
    const src = row.dataset.previewSrc;
    if (!src || image.getAttribute('src') === src) return;
    image.setAttribute('src', src);
    if (row.dataset.previewSrcset) image.setAttribute('srcset', row.dataset.previewSrcset);
    if (row.dataset.previewW) image.setAttribute('width', row.dataset.previewW);
    if (row.dataset.previewH) image.setAttribute('height', row.dataset.previewH);
  };

  /**
   * Décodage anticipé, au premier survol de la LISTE seulement.
   *
   * Sans cela, la première image de chaque ligne se charge au moment précis où
   * le curseur l'atteint : la vignette apparaît vide puis se remplit. Les
   * images sont demandées avec le même `srcset` et le même `sizes` que la
   * vignette, donc le navigateur sélectionne exactement le fichier qu'il aura
   * à afficher — et le trouve en cache.
   *
   * Huit petites images, uniquement pour un visiteur à la souris qui survole
   * réellement cette section, et une seule fois.
   */
  let prechargees = false;
  const precharger = () => {
    if (prechargees) return;
    prechargees = true;
    rows.forEach((row) => {
      if (!row.dataset.previewSrc) return;
      const img = new Image();
      img.sizes = image.sizes || '';
      if (row.dataset.previewSrcset) img.srcset = row.dataset.previewSrcset;
      img.src = row.dataset.previewSrc;
    });
  };

  rows.forEach((row) => {
    row.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      precharger();
      afficher(row);
      preview.classList.add('is-visible');
      start();
    });

    /* Au clavier, il n'y a pas de curseur à suivre : la vignette se cale sur la
       ligne focalisée. `:focus-visible` évite de la faire surgir après un clic
       à la souris, qui donne aussi le focus. */
    row.addEventListener('focus', () => {
      if (!row.matches(':focus-visible')) return;
      precharger();
      afficher(row);
      const bounds = root.getBoundingClientRect();
      const ligne = row.getBoundingClientRect();
      targetX = Math.max(0, bounds.width - preview.offsetWidth - 16);
      targetY = Math.max(
        0,
        Math.min(ligne.top - bounds.top + ligne.height / 2 - preview.offsetHeight / 2, bounds.height - preview.offsetHeight)
      );
      preview.classList.add('is-visible');
      start();
    });

    row.addEventListener('blur', () => {
      preview.classList.remove('is-visible');
      stop();
    });
  });

  root.addEventListener('pointerleave', () => {
    preview.classList.remove('is-visible');
    stop();
  });
}
