/**
 * Point d’entrée unique du site.
 *
 * Chargé en `type="module"` (donc différé nativement). Chaque module est
 * défensif : s’il ne trouve pas son point d’ancrage dans le DOM, il ne fait
 * rien. Une même page peut donc n’en utiliser qu’un seul.
 */

import { initNavigation } from './modules/navigation.js';
import { initAnimations } from './modules/animations.js';
import { initAccordions } from './modules/accordion.js';
import { initCarousels } from './modules/carousel.js';
import { initDiagnostic } from './modules/diagnostic.js';
import { initOrientation } from './modules/orientation.js';
import { initForms } from './modules/forms.js';
import { initToc } from './modules/toc.js';
import { initContactInfo } from './modules/contact-info.js';
import { initStickyCta } from './modules/sticky-cta.js';
import { initRevealMore } from './modules/reveal-more.js';
import { initTracking } from './modules/tracking.js';

document.documentElement.classList.remove('no-js');

function boot() {
  const modules = [
    initTracking,
    initNavigation,
    initContactInfo,
    initAnimations,
    initAccordions,
    initCarousels,
    initToc,
    initDiagnostic,
    initOrientation,
    initForms,
    initStickyCta,
    initRevealMore,
  ];

  modules.forEach((init) => {
    try {
      init();
    } catch (error) {
      console.error(`[expert-parquet] échec d’initialisation de ${init.name} :`, error);
    }
  });

  initCurrentYear();
  initFinderALaDemande();
}

/**
 * Le moteur « Trouver mon parquet » et ses modules (catalogue, critères,
 * appariement, replis) ne sont chargés QUE sur une page qui en a l'ancrage :
 * importés statiquement, ils arrivaient sur les 35 pages pour n'en servir
 * qu'une. Le spécificateur reste relatif, comme les imports statiques, pour
 * que la table d'importation (empreintes `?v=`) continue de s'appliquer.
 */
function initFinderALaDemande() {
  if (!document.querySelector('[data-finder]')) return;
  import('./modules/finder.js')
    .then((m) => m.initFinder())
    .catch((error) => console.error('[expert-parquet] échec de chargement du moteur :', error));
}

function initCurrentYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll('[data-current-year]').forEach((node) => {
    node.textContent = year;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
