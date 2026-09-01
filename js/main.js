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
import { initForms } from './modules/forms.js';
import { initToc } from './modules/toc.js';
import { initIndexLists } from './modules/index-list.js';
import { initContactInfo } from './modules/contact-info.js';

document.documentElement.classList.remove('no-js');

function boot() {
  const modules = [
    initNavigation,
    initContactInfo,
    initAnimations,
    initAccordions,
    initCarousels,
    initIndexLists,
    initToc,
    initDiagnostic,
    initForms,
  ];

  modules.forEach((init) => {
    try {
      init();
    } catch (error) {
      console.error(`[expert-parquet] échec d’initialisation de ${init.name} :`, error);
    }
  });

  initCurrentYear();
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
