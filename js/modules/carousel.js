/**
 * Carrousel « Situations à analyser ».
 *
 * Choix assumés :
 *  - scroll natif + scroll-snap, aucune dépendance, aucun autoplay ;
 *  - le viewport est focusable : les flèches du clavier le font défiler,
 *    et Tab passe dans les liens des slides ;
 *  - swipe natif sur mobile, molette et trackpad sur ordinateur ;
 *  - compteur 01 / 05 et barre de progression mis à jour au scroll, quelle que
 *    soit la façon dont le défilement a été provoqué.
 *
 * Les mesures coûteuses (scrollWidth, largeur de slide) sont mises en cache et
 * recalculées au redimensionnement : le gestionnaire de scroll ne lit alors que
 * `scrollLeft`, ce qui évite de recalculer la mise en page à chaque événement —
 * et de dépendre de requestAnimationFrame, gelé dans un onglet en arrière-plan.
 *
 * --- La molette -----------------------------------------------------------
 *
 * Une première version faisait trop de choses par événement : écriture de
 * `scrollLeft`, bascule d'une classe CSS, mise à jour synchrone du compteur et
 * de la barre, plus une cascade de `setTimeout`. À soixante à cent vingt
 * événements par seconde sur un trackpad, cela produisait un défilement
 * saccadé — le coût principal venant de la barre de progression, animée sur
 * `width`, donc relançant une transition et un calcul de mise en page à chaque
 * événement.
 *
 * La version actuelle tient en quatre règles :
 *
 * 1. Un mouvement déjà horizontal (|deltaX| > |deltaY|) est laissé au
 *    navigateur : il sait faire défiler un conteneur horizontal.
 * 2. En butée dans la direction demandée, on ne fait rien — pas de
 *    `preventDefault` — et la page reprend la main immédiatement.
 * 3. Sinon les deltas sont ACCUMULÉS et appliqués une seule fois par image,
 *    dans un `requestAnimationFrame`. Une écriture par image au maximum, quel
 *    que soit le débit du périphérique.
 * 4. Aucun minuteur, aucune classe à basculer, aucun état de geste.
 *
 * Deux réglages CSS accompagnent cela (css/components.css) : `scroll-behavior`
 * n'est plus déclaré sur le conteneur — les flèches et le clavier passent déjà
 * `behavior` explicitement — et l'accrochage passe en `proximity` sur grand
 * écran, pour accompagner le geste au lieu de le corriger.
 */

/**
 * Conversion d'une ligne en pixels. Une souris à crans rapporte des lignes
 * (`deltaMode === 1`), typiquement 3 par cran ; un trackpad rapporte des
 * pixels. Sans cette normalisation, les deux périphériques n'avancent pas du
 * tout à la même vitesse.
 */
const PIXELS_PAR_LIGNE = 40;

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

  /**
   * Bout de course : `aria-disabled`, jamais `disabled`.
   *
   * Un `<button>` qui passe à `disabled` alors qu'il a le focus perd ce focus
   * au profit de <body> : l'utilisateur au clavier qui atteignait la dernière
   * diapositive se retrouvait éjecté en haut du document. `aria-disabled`
   * annonce l'état sans retirer l'élément du parcours de tabulation ; le clic
   * est neutralisé dans `scrollByStep`.
   */
  const setBoundary = (button, atteint) => {
    if (!button) return;
    button.setAttribute('aria-disabled', String(atteint));
  };

  const update = () => {
    const left = viewport.scrollLeft;
    const scrollable = max > 2;
    setBoundary(prev, !scrollable || left <= 2);
    setBoundary(next, !scrollable || left >= max - 2);

    /* Le compteur désigne la diapositive en tête de lecture, arrondie au pas.
       Exception à la borne droite : le conteneur montrant deux diapositives à
       la fois, `scrollLeft` plafonne bien avant que la dernière n'atteigne le
       bord gauche — la formule affichait donc « 04 / 05 » alors que le
       carrousel était en butée et que la flèche suivante était désactivée.
       En butée, c'est la dernière situation qui est à l'écran : on l'annonce.
       (Défaut préexistant, relevé en testant la molette.) */
    const enButee = scrollable && left >= max - 1;
    const index = enButee
      ? slides.length - 1
      : Math.min(slides.length - 1, Math.round(left / step));
    if (current) current.textContent = String(index + 1).padStart(2, '0');
    if (bar) {
      /* `transform` et non `width` : la largeur est une propriété de mise en
         page, et l'animer relançait un calcul complet à chaque événement de
         molette. Une mise à l'échelle est prise en charge par le compositeur. */
      const progress = scrollable ? left / max : 0;
      bar.style.transform = `scaleX(${visibleRatio + (1 - visibleRatio) * progress})`;
    }
  };

  const scrollByStep = (direction) => {
    const bouton = direction > 0 ? next : prev;
    if (bouton && bouton.getAttribute('aria-disabled') === 'true') return;
    viewport.scrollBy({ left: direction * step, behavior: motion() });
  };

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

  /* ------------------------------------------------------------ molette */

  let deltaEnAttente = 0;
  let frame = null;

  /** Une seule écriture, une seule mise à jour, par image. */
  const appliquer = () => {
    frame = null;
    viewport.scrollLeft += deltaEnAttente;
    deltaEnAttente = 0;
    update();
  };

  const onWheel = (event) => {
    // 1. Déjà horizontal : le navigateur s'en charge mieux que nous.
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    const dy =
      event.deltaY *
      (event.deltaMode === 1 ? PIXELS_PAR_LIGNE : event.deltaMode === 2 ? viewport.clientWidth : 1);
    if (!dy) return;

    // 2. Butée : on ne consomme rien, la page continue sans le moindre à-coup.
    const position = viewport.scrollLeft + deltaEnAttente;
    if (dy > 0 ? position >= max - 1 : position <= 1) return;

    /* 3. Sinon on accumule, borné par ce qui reste réellement à parcourir.
       Ce bornage n'est pas cosmétique : `requestAnimationFrame` est suspendu
       dans un onglet en arrière-plan, et sans lui le total en attente
       grandirait sans fin pour se déverser d'un coup au retour de l'onglet. */
    event.preventDefault();
    deltaEnAttente = Math.max(
      -viewport.scrollLeft,
      Math.min(deltaEnAttente + dy, max - viewport.scrollLeft)
    );
    if (!frame) frame = window.requestAnimationFrame(appliquer);
  };

  viewport.addEventListener('wheel', onWheel, { passive: false });

  viewport.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure, { once: true });
  measure();
}

function motion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}
