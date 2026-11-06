/**
 * Icônes des liens de pied de page et des réseaux sociaux — le jeu FERMÉ que
 * WordPress peut associer à un lien (Site → Footer). Aucun SVG ne vient de la
 * base : seule la clé y est stockée, le dessin est ici.
 *
 * Ce fichier fait partie de l'outillage de développement. Même grammaire que
 * les icônes de partials.mjs : trait 1.3, bouts carrés, `aria-hidden`,
 * dimensions intrinsèques obligatoires (voir le commentaire de ICONS).
 */

const s = (chemin) =>
  `<svg class="footer__icone" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${chemin}</svg>`;

export const ICONES_LIENS = {
  instagram: s('<rect x="2.5" y="2.5" width="11" height="11" rx="3"/><circle cx="8" cy="8" r="2.6"/><path d="M11.3 4.7h.01"/>'),
  facebook: s('<path d="M9.2 14V8.8h1.8l.3-2.1H9.2V5.4c0-.6.2-1 1-1h1.1V2.6c-.2 0-.9-.1-1.6-.1-1.6 0-2.7 1-2.7 2.8v1.4H5.2v2.1H7V14"/>'),
  linkedin: s('<rect x="2.5" y="6" width="2.4" height="7.5"/><path d="M3.7 2.6h.01"/><path d="M7.4 13.5V6h2.3v1c.5-.7 1.3-1.2 2.3-1.2 1.8 0 2.5 1.2 2.5 3v4.7h-2.4V9.3c0-.9-.3-1.5-1.1-1.5-.9 0-1.3.7-1.3 1.6v4.1"/>'),
  youtube: s('<path d="M2.5 5.2c0-1 .7-1.7 1.7-1.8 1.3-.1 2.6-.1 3.8-.1s2.5 0 3.8.1c1 .1 1.7.8 1.7 1.8v5.6c0 1-.7 1.7-1.7 1.8-1.3.1-2.6.1-3.8.1s-2.5 0-3.8-.1c-1-.1-1.7-.8-1.7-1.8z"/><path d="M6.8 5.9v4.2L10.3 8z"/>'),
  email: s('<rect x="2" y="3.5" width="12" height="9"/><path d="m2.5 4 5.5 4.5L13.5 4"/>'),
  telephone: s('<path d="M3.2 2.5h2.6l1.1 2.9-1.5 1.1a8 8 0 0 0 4.1 4.1l1.1-1.5 2.9 1.1v2.6c0 .4-.3.7-.7.7A11.3 11.3 0 0 1 2.5 3.2c0-.4.3-.7.7-.7z"/>'),
  externe: s('<path d="M6.5 3.5H3.5v9h9V9.5"/><path d="M9 3.5h3.5V7M12.5 3.5 7.5 8.5"/>'),
};
