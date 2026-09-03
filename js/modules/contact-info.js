/**
 * Injecte les coordonnées depuis js/config/site.js.
 *
 * Une information absente n’est PAS remplacée par un libellé technique : son
 * bloc est masqué. Un visiteur ne doit jamais lire « [À renseigner] » — soit
 * l’information est réelle et affichée, soit elle n’existe pas encore et rien
 * ne s’affiche. Le jour où `site.js` est rempli, les blocs réapparaissent
 * seuls, sans toucher au HTML.
 *
 * Usage : <div data-contact-block><span data-contact="email"></span></div>
 *         <a data-contact="email" data-contact-as="link">…</a>
 */

import { CONTACT } from '../config/site.js';

const SCHEMES = { email: 'mailto:', phone: 'tel:' };

export function initContactInfo() {
  document.querySelectorAll('[data-contact]').forEach((node) => {
    const key = node.dataset.contact;
    const value = CONTACT[key];
    // Le bloc à masquer est l’ancêtre marqué, à défaut le nœud lui-même.
    const block = node.closest('[data-contact-block]') || node;

    if (!value) {
      block.hidden = true;
      return;
    }

    block.hidden = false;
    node.textContent = key === 'phone' ? CONTACT.phoneDisplay || value : value;

    if (node.dataset.contactAs === 'link' && SCHEMES[key]) {
      node.setAttribute('href', SCHEMES[key] + String(value).replace(/\s/g, ''));
      node.removeAttribute('aria-disabled');
    }
  });

  // Un groupe dont tous les blocs sont masqués laisserait une colonne vide.
  document.querySelectorAll('[data-contact-group]').forEach((group) => {
    const blocks = group.querySelectorAll('[data-contact-block]');
    const visible = [...blocks].some((block) => !block.hidden);
    if (!visible) group.hidden = true;
  });
}
