/**
 * Injecte les coordonnées depuis js/config/site.js.
 *
 * Tant qu’une information n’est pas renseignée, un placeholder explicite est
 * affiché : le site ne doit jamais présenter de coordonnées inventées.
 *
 * Usage : <span data-contact="email"></span>
 *         <a data-contact="email" data-contact-as="link">…</a>
 */

import { CONTACT, PLACEHOLDER_LABEL } from '../config/site.js';

const SCHEMES = { email: 'mailto:', phone: 'tel:' };

export function initContactInfo() {
  document.querySelectorAll('[data-contact]').forEach((node) => {
    const key = node.dataset.contact;
    const value = CONTACT[key];

    if (!value) {
      node.textContent = PLACEHOLDER_LABEL;
      node.classList.add('placeholder-value');
      if (node.tagName === 'A') {
        node.removeAttribute('href');
        node.setAttribute('aria-disabled', 'true');
      }
      return;
    }

    const display = key === 'phone' ? CONTACT.phoneDisplay || value : value;
    node.textContent = display;
    node.classList.remove('placeholder-value');

    if (node.dataset.contactAs === 'link' && SCHEMES[key]) {
      node.setAttribute('href', SCHEMES[key] + String(value).replace(/\s/g, ''));
      node.removeAttribute('aria-disabled');
    }
  });
}
