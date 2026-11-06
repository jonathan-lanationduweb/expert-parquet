/*
 * Barre « vue administrateur » du site statique, pendant la maintenance.
 *
 * Le site public est du HTML statique : on ne peut pas y rendre la barre
 * d'administration de WordPress. Ce script est inerte pour les visiteurs — il
 * ne fait rien sans le marqueur non secret `ep_admin_view`, posé par WordPress
 * quand un administrateur choisit « Voir le site malgré la maintenance ». Il
 * confirme ensuite que la maintenance est bien active (`/maintenance.html`
 * répond 200) avant d'afficher une barre discrète en haut de page.
 *
 * Le jeton de contournement reste httponly ; ce marqueur n'est qu'un drapeau
 * d'affichage. « Voir comme un visiteur » passe par WordPress pour effacer le
 * cookie httponly (le JS ne le peut pas), puis la vraie page 503 s'affiche.
 */
(function () {
  'use strict';
  if (!/(?:^|;\s*)ep_admin_view=1(?:;|$)/.test(document.cookie)) return;

  var clearMarker = function () {
    document.cookie = 'ep_admin_view=; path=/; max-age=0';
  };

  fetch('/maintenance.html', { method: 'GET', cache: 'no-store' })
    .then(function (r) {
      /* 200 : maintenance active et nous voyons le vrai site → administrateur.
         404 : maintenance terminée → on retire le marqueur devenu inutile. */
      if (!r.ok) {
        clearMarker();
        return;
      }
      var bar = document.createElement('div');
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', 'Mode maintenance');
      bar.style.cssText =
        'position:relative;z-index:99999;display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center;justify-content:center;padding:8px 16px;background:#17181A;color:#fff;font:500 13px/1.45 Inter,system-ui,sans-serif;text-align:center';

      var texte = document.createElement('span');
      texte.textContent =
        'Mode maintenance actif — vous voyez actuellement le site en tant qu’administrateur.';
      bar.appendChild(texte);

      var lien = function (href, label) {
        var a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        a.style.cssText =
          'color:#fff;font-weight:600;text-decoration:underline;white-space:nowrap';
        return a;
      };
      bar.appendChild(lien('/wp-admin/admin-post.php?action=ep_maintenance_visiteur', 'Voir comme un visiteur'));
      bar.appendChild(lien('/wp-admin/admin.php?page=expert-parquet-maintenance', 'Gérer la maintenance'));

      document.body.insertBefore(bar, document.body.firstChild);
    })
    .catch(function () {});
})();
