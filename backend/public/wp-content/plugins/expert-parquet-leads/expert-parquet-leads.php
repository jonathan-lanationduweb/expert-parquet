<?php
/**
 * Plugin Name:  Expert Parquet — Demandes
 * Description:  Réception, stockage et administration des demandes envoyées par le site statique Expert Parquet. Aucune page publique : ce plugin fournit une API et un back-office, sur des tables dédiées.
 * Version:      2.0.0
 * Requires PHP: 8.0
 * Text Domain:  expert-parquet
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UN PLUGIN SUR MESURE PLUTÔT QU'UN GREFFON DE FORMULAIRES
 *
 * Contact Form 7, Gravity Forms et consorts apportent d'abord un CONSTRUCTEUR
 * de formulaires. Or les formulaires d'Expert Parquet existent déjà : ils sont
 * écrits à la main dans le générateur statique, validés côté navigateur, et
 * leur contrat de données est figé dans docs/BACKEND-CONTRACT.md. Installer un
 * constructeur reviendrait à payer l'historique de vulnérabilités d'un gros
 * greffon pour une fonctionnalité dont on n'a pas l'usage.
 *
 * Ce plugin ne fait donc que ce qui manque : recevoir, valider, stocker,
 * notifier, administrer.
 *
 * ---------------------------------------------------------------------------
 * ARCHITECTURE (schéma 3)
 *
 *   WordPress      = infrastructure : comptes, droits, wp-admin, REST, cron, courriels.
 *   Tables dédiées = stockage métier : `{prefix}expert_parquet_leads`, `_lead_photos`,
 *                    `_lead_notes`, `_lead_events` (EP_DB).
 *   Dépôts         = seuls détenteurs de `$wpdb` (EP_*_Repository).
 *
 * Aucune donnée métier ne transite par `posts` ou `postmeta`. Le type de
 * contenu `ep_lead` des versions précédentes n'existe plus.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CE PLUGIN NE FAIT PAS
 *
 * - Il n'affiche aucune page publique. WordPress ne sert pas le site.
 * - Il ne gère ni les articles, ni le SEO, ni les gabarits : tout cela reste
 *   au générateur statique.
 * - Il n'expose aucune lecture publique. Les seuls points d'entrée ouverts
 *   sont des POST d'écriture et une sonde ; tout le reste exige une capacité.
 */

defined( 'ABSPATH' ) || exit;

define( 'EP_VERSION', '2.0.0' );
define( 'EP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'EP_PLUGIN_FILE', __FILE__ );

/**
 * Espace de noms REST. Volontairement propre au projet : on n'ajoute rien sous
 * `wp/v2`, qui est par ailleurs fermé aux anonymes (voir class-ep-security).
 */
define( 'EP_REST_NS', 'expert-parquet/v1' );

/**
 * Version du texte de consentement affiché par le front. À incrémenter si la
 * case à cocher ou la page de confidentialité change de sens : chaque demande
 * enregistre la version à laquelle elle a consenti.
 */
if ( ! defined( 'EP_CONSENT_VERSION' ) ) {
	define( 'EP_CONSENT_VERSION', '1' );
}

/**
 * Dossier privé (photographies, journaux). Normalement défini dans
 * wp-config.php. S'il ne l'est pas, le repli suit la structure du projet :
 * WordPress vit dans `backend/public`, les données privées dans
 * `backend-private` à la racine — donc HORS de la racine web de l'hôte API,
 * et interdit par Apache sur l'hôte du site. Jamais `wp-content` : une
 * photographie de l'intérieur d'un tiers ne doit pas pouvoir se retrouver
 * servie par Apache à cause d'une constante oubliée.
 * C'est l'unique définition ; toutes les classes lisent EP_PRIVATE_DIR.
 */
if ( ! defined( 'EP_PRIVATE_DIR' ) ) {
	define( 'EP_PRIVATE_DIR', dirname( rtrim( ABSPATH, '/\\' ), 2 ) . '/backend-private' );
}

/**
 * Origines autorisées à appeler l'API depuis un navigateur.
 *
 * Liste blanche explicite, jamais `*` : une étoile laisserait n'importe quel
 * site poster dans la base depuis le navigateur de ses visiteurs. Les entrées
 * locales servent au développement et devront disparaître en production.
 */
define(
	'EP_ORIGINES_AUTORISEES',
	array(
		'https://expert-parquet.com',
		'https://www.expert-parquet.com',
		'http://expert-parquet.test',
		'http://localhost:8477',
		'http://127.0.0.1:8477',
	)
);

require_once EP_PLUGIN_DIR . 'includes/class-ep-db.php';
require_once EP_PLUGIN_DIR . 'includes/class-ep-schema.php';
require_once EP_PLUGIN_DIR . 'includes/class-ep-lead.php';
require_once EP_PLUGIN_DIR . 'includes/class-ep-leads-repository.php';
require_once EP_PLUGIN_DIR . 'includes/class-ep-photos-repository.php';
require_once EP_PLUGIN_DIR . 'includes/class-ep-notes-repository.php';
require_once EP_PLUGIN_DIR . 'includes/class-ep-events-repository.php';
require_once EP_PLUGIN_DIR . 'includes/class-ep-antispam.php';
require_once EP_PLUGIN_DIR . 'includes/class-ep-photos.php';
require_once EP_PLUGIN_DIR . 'includes/class-ep-mail.php';
require_once EP_PLUGIN_DIR . 'includes/class-ep-rest.php';
require_once EP_PLUGIN_DIR . 'includes/class-ep-security.php';
require_once EP_PLUGIN_DIR . 'includes/class-ep-purge.php';

if ( is_admin() ) {
	require_once EP_PLUGIN_DIR . 'includes/class-ep-liste-demandes.php';
	require_once EP_PLUGIN_DIR . 'includes/class-ep-admin.php';
	EP_Admin::init();
} else {
	// EP_Mail::recapitulatif() a besoin de EP_Admin::url_fiche() hors administration.
	require_once EP_PLUGIN_DIR . 'includes/class-ep-admin.php';
}

EP_Lead::init();
EP_Rest::init();
EP_Security::init();
EP_Purge::init();

/**
 * Activation : crée ou met à niveau les tables, le rôle, le dossier privé et
 * la tâche d'effacement. Idempotent : réactiver ne perd rien.
 */
register_activation_hook(
	__FILE__,
	static function () {
		EP_DB::installer();
		EP_Lead::creer_role();
		EP_Photos::preparer_stockage();
		EP_Purge::programmer();
		flush_rewrite_rules();
	}
);

/**
 * Désactivation : la tâche planifiée est retirée (un événement qui appelle une
 * classe absente provoquerait une erreur fatale à chaque passage du cron).
 * Les tables et leurs données sont CONSERVÉES — jamais de DROP TABLE.
 */
register_deactivation_hook(
	__FILE__,
	static function () {
		EP_Purge::deprogrammer();
		flush_rewrite_rules();
	}
);
