<?php
/**
 * Durcissement de l'installation.
 *
 * ---------------------------------------------------------------------------
 * PRINCIPE
 *
 * Ce WordPress ne sert aucune page publique. Tout ce qui est ouvert au monde
 * sans l'être utilement est une surface d'attaque gratuite. On ferme donc tout
 * ce dont ce backend n'a pas l'usage — et cela représente presque tout.
 *
 * Aucun greffon de sécurité n'est installé. Wordfence et consorts sont lourds,
 * appellent l'extérieur, et dupliquent essentiellement ce que donnent les
 * quelques dizaines de lignes ci-dessous plus un `wp-admin` restreint par
 * adresse IP côté serveur.
 */

defined( 'ABSPATH' ) || exit;

class EP_Security {

	public static function init(): void {
		// XML-RPC : aucune application mobile, aucun pingback. Vecteur
		// classique d'amplification de force brute.
		/* `xmlrpc_enabled` à false suffit : WordPress répond alors une faute
		   XML-RPC propre (« services désactivés »). Renvoyer `false` pour
		   `wp_xmlrpc_server_class`, comme c'était fait, empêchait d'instancier
		   le serveur et produisait une erreur fatale — un 500 dans les journaux
		   à chaque sonde de robot, pour le même résultat fonctionnel. */
		add_filter( 'xmlrpc_enabled', '__return_false' );
		/* `xmlrpc_enabled` ne coupe que les méthodes authentifiées : `system.*`,
		   `demo.*` et surtout `pingback.ping` — le vecteur d'amplification —
		   resteraient joignables. Aucune méthode du tout : toute requête reçoit
		   une faute « méthode inconnue », sans erreur fatale. */
		add_filter( 'xmlrpc_methods', '__return_empty_array' );
		/* Et un 403 franc dès que la requête est XML-RPC (`XMLRPC_REQUEST` est
		   défini en tête de xmlrpc.php, avant le chargement de WordPress) :
		   les méthodes `system.*` que le serveur rajoute lui-même n'ont ainsi
		   même pas l'occasion de répondre. */
		if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) {
			status_header( 403 );
			header( 'Content-Type: text/plain; charset=UTF-8' );
			exit( "XML-RPC désactivé.\n" );
		}

		// Énumération des comptes : ?author=1 révèle l'identifiant de
		// connexion, c'est-à-dire la moitié d'une attaque par force brute.
		add_action( 'template_redirect', array( __CLASS__, 'bloquer_auteur' ) );

		// L'API REST native est fermée aux anonymes. Notre espace de noms
		// reste ouvert : c'est le seul.
		add_filter( 'rest_authentication_errors', array( __CLASS__, 'fermer_rest_natif' ) );
		add_filter( 'rest_endpoints', array( __CLASS__, 'retirer_utilisateurs' ) );

		// Un formulaire de connexion ne dit jamais laquelle des deux
		// informations est fausse.
		add_filter( 'login_errors', static fn() => EP_Connexion::message( 'Identifiants incorrects.' ) );

		// Verrou temporaire sur les tentatives repetees.
		EP_Connexion::init();

		// Version de WordPress retirée des en-têtes et des URL d'assets.
		remove_action( 'wp_head', 'wp_generator' );
		add_filter( 'the_generator', '__return_empty_string' );

		// En-têtes de sécurité sur tout ce que sert ce backend.
		add_action( 'send_headers', array( __CLASS__, 'entetes' ) );

		/* `send_headers` ne se déclenche ni sur `wp-login.php` ni dans
		   l'administration : ce sont des requêtes qui ne passent pas par le
		   chargement d'un gabarit. Mesuré — la page de connexion n'avait donc
		   AUCUN `X-Content-Type-Options`. On complète, sans toucher à la
		   politique de cadre : WordPress pose lui-même `SAMEORIGIN` sur la
		   connexion, et certains parcours d'authentification en dépendent. */
		add_action( 'login_init', array( __CLASS__, 'entetes_admin' ) );
		add_action( 'admin_init', array( __CLASS__, 'entetes_admin' ) );

		/* Ce WordPress n'a aucune raison d'être indexé. `blog_public` à 0 pose
		   l'en-tête X-Robots-Tag ; mais depuis WordPress 5.7, `do_robots()`
		   n'écrit plus « Disallow: / » pour autant — il ne bloque que
		   /wp-admin/. On l'écrit donc nous-mêmes : une API n'a rien à offrir à
		   un robot d'indexation. */
		add_filter( 'pre_option_blog_public', static fn() => '0' );
		add_filter( 'robots_txt', static fn() => "User-agent: *\nDisallow: /\n" );

		/* `_admin_menu` et non `admin_menu` : c'est le seul moment où le menu
		   est déjà construit mais pas encore filtré selon les droits. Voir le
		   commentaire de `epurer_menu()` — accroché plus tard, le retrait
		   n'aurait plus aucun effet sur le recensement des refus. */
		add_action( '_admin_menu', array( __CLASS__, 'epurer_menu' ), 999 );

		// Aucune page publique : le thème n'est jamais rendu.
		add_action( 'template_redirect', array( __CLASS__, 'fermer_front' ), 1 );
	}

	/**
	 * Ferme la partie publique de WordPress.
	 *
	 * Ce WordPress ne publie rien ; rendre quand même un thème, c'est exposer
	 * gratuitement le contenu d'exemple, la version du thème, les flux RSS,
	 * les pages d'archives — autant de points d'entrée pour de la
	 * reconnaissance. Toute requête qui atteint le chargement du gabarit
	 * reçoit une réponse courte et un 404. L'API REST (`/wp-json`,
	 * `?rest_route=`), l'administration, la connexion, le cron et
	 * `admin-post.php` ne passent pas par ici et restent intacts.
	 * `robots.txt` est laissé à WordPress : il répond « Disallow: / », ce qui
	 * est exactement ce qu'on veut.
	 */
	public static function fermer_front(): void {
		if ( is_robots() || is_favicon() ) {
			return;
		}
		status_header( 404 );
		nocache_headers();
		header( 'Content-Type: text/plain; charset=UTF-8' );
		echo "Expert Parquet — API.\n";
		exit;
	}

	/**
	 * Retire les menus éditoriaux, inutilisés et nuisibles ici.
	 *
	 * ---------------------------------------------------------------------
	 * CE N'EST PAS QUE DE L'ESTHÉTIQUE
	 *
	 * Le site public est un site statique : ni article, ni page, ni
	 * commentaire ne sont publiés depuis WordPress. Les laisser affichés
	 * inviterait à rédiger ici un contenu qui ne paraîtrait jamais.
	 *
	 * Surtout, leur présence CASSE le rôle « Gestionnaire de demandes ».
	 * WordPress recense dans `$_wp_submenu_nopriv` les entrées refusées à
	 * l'utilisateur ; un gestionnaire n'ayant pas la capacité `edit_posts`
	 * du blog, l'entrée `edit.php` y est inscrite. Or `user_can_access_admin_page()`
	 * raisonne sur le seul nom de fichier : il voit `edit.php` interdit et
	 * refuse aussi `edit.php?post_type=ep_lead`, pourtant autorisé. Le
	 * gestionnaire se retrouvait devant un 403 sur la liste des demandes,
	 * alors même qu'il pouvait ouvrir chaque demande individuellement.
	 *
	 * Il faut donc supprimer l'entrée du sous-menu, et pas seulement le menu :
	 * c'est `$submenu` que WordPress parcourt pour remplir ce recensement.
	 * Et il faut le faire sur `_admin_menu`, car ce recensement est établi
	 * AVANT que `admin_menu` ne se déclenche : un retrait plus tardif ne
	 * changerait rien. La solution alternative — accorder `edit_posts` au
	 * gestionnaire — lui ouvrirait tout le contenu du site, à l'exact opposé
	 * du moindre privilège.
	 *
	 * Retirer ces entrées n'ouvre aucun accès : `wp-admin/edit.php` vérifie
	 * lui-même `edit_posts` avant d'afficher quoi que ce soit, et un
	 * gestionnaire ne l'a pas.
	 */
	public static function epurer_menu(): void {
		global $submenu;

		/* Articles et commentaires : inutilisés. Pages et Médias : utilisés,
		   mais rangés sous le menu Expert Parquet (EP_Admin_Contenu) — un seul
		   chemin pour le rédacteur. */
		foreach ( array( 'edit.php', 'edit.php?post_type=page', 'edit-comments.php', 'upload.php' ) as $page ) {
			remove_menu_page( $page );
			unset( $submenu[ $page ] );
		}
	}

	public static function bloquer_auteur(): void {
		if ( ! is_admin() && isset( $_GET['author'] ) ) {
			wp_safe_redirect( home_url(), 301 );
			exit;
		}
	}

	/**
	 * Ferme `wp/v2` aux visiteurs non connectés.
	 *
	 * La vérification porte sur la route courante : notre espace de noms doit
	 * rester joignable, sinon les formulaires du site ne fonctionnent plus.
	 */
	public static function fermer_rest_natif( $resultat ) {
		if ( ! empty( $resultat ) ) {
			return $resultat;
		}
		$route = $GLOBALS['wp']->query_vars['rest_route'] ?? '';
		if ( str_starts_with( ltrim( (string) $route, '/' ), EP_REST_NS ) ) {
			return $resultat;
		}
		if ( ! is_user_logged_in() ) {
			return new WP_Error(
				'ep_rest_ferme',
				'API non disponible.',
				array( 'status' => 401 )
			);
		}
		return $resultat;
	}

	/** Retire les routes d'utilisateurs, même pour une session connectée. */
	public static function retirer_utilisateurs( array $routes ): array {
		foreach ( array( '/wp/v2/users', '/wp/v2/users/(?P<id>[\d]+)' ) as $route ) {
			unset( $routes[ $route ] );
		}
		return $routes;
	}

	/**
	 * En-têtes de sécurité.
	 *
	 * `frame-ancestors 'none'` empêche d'encadrer l'administration, donc le
	 * détournement de clic sur les actions d'un gestionnaire connecté.
	 */
	/** Les en-têtes qui valent partout, y compris là où le gabarit n'est pas chargé. */
	public static function entetes_admin(): void {
		if ( headers_sent() ) {
			return;
		}
		header( 'X-Content-Type-Options: nosniff' );
		header( 'Referrer-Policy: strict-origin-when-cross-origin' );
		header( 'Permissions-Policy: geolocation=(), camera=(), microphone=(), interest-cohort=()' );
	}

	public static function entetes(): void {
		header( 'X-Content-Type-Options: nosniff' );
		header( 'Referrer-Policy: strict-origin-when-cross-origin' );
		header( 'X-Frame-Options: DENY' );
		header( "Content-Security-Policy: frame-ancestors 'none'" );
		header( 'Permissions-Policy: geolocation=(), camera=(), microphone=(), interest-cohort=()' );
	}
}
