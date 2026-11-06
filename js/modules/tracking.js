/**
 * Suivi première partie, sans réseau.
 *
 * Trois événements, distingués dès maintenant pour qu'un outil d'analyse
 * branché plus tard n'ait rien à deviner :
 *
 *   recommendation_result  le moteur a rendu une recommandation
 *   product_click          clic vers UN produit chez une enseigne
 *   partner_click          clic vers une catégorie ou l'entrée d'une enseigne
 *                          (dont les anciens `commercial_orientation`)
 *
 * Ce module n'envoie RIEN : ni Google Analytics, ni pixel, ni requête vers le
 * backend. Il publie chaque événement de deux façons neutres :
 *
 *   - `document.dispatchEvent(new CustomEvent('ep:track', { detail }))`
 *   - `window.epTrack` : un tampon des 50 derniers événements
 *
 * Un collecteur (consentement, outil maison, backend) s'abonnera à `ep:track`.
 * La navigation n'en dépend jamais : les liens restent des liens.
 *
 * Ce qui serait nécessaire pour un enregistrement côté serveur est documenté
 * dans docs/BACKEND-CONTRACT.md (« Suivi anonyme »).
 */

const TAMPON_MAX = 50;

export function track(type, detail = {}) {
  const evenement = { type, at: new Date().toISOString(), page: location.pathname, ...detail };
  window.epTrack = window.epTrack || [];
  window.epTrack.push(evenement);
  if (window.epTrack.length > TAMPON_MAX) window.epTrack.shift();
  document.dispatchEvent(new CustomEvent('ep:track', { detail: evenement }));
  return evenement;
}

/* Les attributs `data-*` d'un lien de sortie, tels que posés par les
   gabarits et le moteur. Seuls ceux présents sont transmis. */
const CHAMPS = ['destination', 'besoin', 'context', 'productId', 'productName', 'category', 'level'];

export function initTracking() {
  if (document.documentElement.dataset.epTracking) return;
  document.documentElement.dataset.epTracking = '1';

  document.addEventListener(
    'click',
    (e) => {
      const lien = e.target.closest('a[data-event]');
      if (!lien) return;
      const brut = lien.dataset.event;
      const type = brut === 'commercial_orientation' ? 'partner_click' : brut;
      const detail = { href: lien.href };
      for (const champ of CHAMPS) if (lien.dataset[champ]) detail[champ] = lien.dataset[champ];
      track(type, detail);
    },
    { capture: true }
  );
}
