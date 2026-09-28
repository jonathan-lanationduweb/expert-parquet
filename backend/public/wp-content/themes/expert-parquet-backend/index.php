<?php
/**
 * Gabarit unique du thème technique.
 *
 * WordPress exige `index.php` dans tout thème : c'est le dernier recours de la
 * hiérarchie de gabarits. Ici il n'a rien à rendre.
 *
 * En pratique il n'est jamais atteint : `EP_Security::fermer_front()` s'accroche
 * à `template_redirect` en priorité 1, répond 404 et termine la requête avant
 * que WordPress ne choisisse un gabarit. Ce fichier est donc un filet, pas un
 * chemin — et un filet doit rester silencieux plutôt que de rendre une page
 * d'exemple, un flux ou une archive.
 *
 * Si l'extension venait à être désactivée, cette réponse resterait la bonne :
 * 404, aucun contenu, aucune information sur l'installation.
 *
 * @package Expert_Parquet_Backend
 */

defined( 'ABSPATH' ) || exit;

status_header( 404 );
nocache_headers();
header( 'Content-Type: text/plain; charset=utf-8' );
header( 'X-Robots-Tag: noindex, nofollow', true );
echo "Cette adresse ne publie aucune page.\n";
exit;
