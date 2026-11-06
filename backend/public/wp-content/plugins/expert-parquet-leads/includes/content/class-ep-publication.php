<?php
/**
 * Publication du site depuis WordPress, et prévisualisation.
 *
 * ---------------------------------------------------------------------------
 * CE QUE FAIT LE BOUTON « PUBLIER LE SITE »
 *
 * Il lance, sur la machine qui héberge WordPress, UNE commande fixe :
 *
 *     node tools/publish.mjs --mode site
 *
 * Le script récupère l'instantané éditorial (contenus publiés), régénère le
 * site statique, le contrôle, et remet l'ancien site en place si quelque chose
 * échoue. Son état est écrit dans backend-private/build/etat.json ; cet écran
 * le lit. Le mode `apercu` fait la même chose avec les brouillons, dans
 * `_preview/`, jamais à la racine.
 *
 * ---------------------------------------------------------------------------
 * GARDE-FOUS
 *
 *   - capacité `ep_publier_site` (ou l'édition du contenu, pour l'aperçu) ;
 *   - nonce sur chaque action ;
 *   - la constante `EP_BUILD_LOCAL` doit valoir `true` dans wp-config.php ET
 *     l'environnement WordPress doit être `local` ou `development` : en
 *     production cette mécanique n'existe pas (la publication y passera par
 *     un déclenchement distant, lot ultérieur) ;
 *   - commande en tableau (jamais d'interpréteur de commandes), aucun
 *     argument venu du navigateur, délai maximal, journal privé ;
 *   - rien de ce qui est affiché ne vient de la configuration : le journal
 *     est celui du script, qui ne manipule aucun secret.
 */

defined( 'ABSPATH' ) || exit;

class EP_Publication {

	public const DELAI_MAX = 240;

	public static function init(): void {
		add_action( 'admin_post_ep_publier', array( __CLASS__, 'action_publier' ) );
		add_action( 'admin_post_ep_apercu', array( __CLASS__, 'action_apercu' ) );
		add_filter( 'preview_post_link', array( __CLASS__, 'lien_apercu' ), 10, 2 );
		/* Nos contenus n'ont pas d'adresse WordPress : « Voir » et « Prévisualiser »
		   mènent à l'aperçu reconstruit, jamais à une page 404 de WordPress. */
		add_filter( 'post_type_link', array( __CLASS__, 'lien_apercu' ), 10, 2 );
		add_filter( 'page_link', array( __CLASS__, 'lien_page' ), 10, 2 );
	}

	public static function lien_page( $lien, $id ) {
		$post = get_post( $id );
		if ( ! $post || ! in_array( $post->post_name, EP_Contenu::PAGES, true ) || ! is_admin() ) {
			return $lien;
		}
		return self::url_action_apercu( $post->ID );
	}

	/* ------------------------------------------------------------ disponibilité */

	public static function projet_dir(): string {
		return EP_Contenu::projet_dir();
	}

	/** Pourquoi la publication locale n'est pas possible, ou null si elle l'est. */
	public static function indisponible(): ?string {
		if ( ! defined( 'EP_BUILD_LOCAL' ) || true !== EP_BUILD_LOCAL ) {
			return 'La publication locale n’est pas activée : EP_BUILD_LOCAL n’est pas définie à true dans wp-config.php.';
		}
		if ( ! in_array( wp_get_environment_type(), array( 'local', 'development' ), true ) ) {
			return 'La publication locale est réservée à un environnement local ou de développement.';
		}
		if ( ! function_exists( 'proc_open' ) ) {
			return 'PHP ne permet pas de lancer un processus (proc_open indisponible).';
		}
		if ( ! is_file( self::projet_dir() . '/tools/publish.mjs' ) ) {
			return 'Le script tools/publish.mjs est introuvable dans le projet.';
		}
		if ( ! self::node_bin() ) {
			return 'Node.js est introuvable. Définissez EP_NODE_BIN dans wp-config.php.';
		}
		return null;
	}

	/** L'exécutable Node : constante, sinon l'emplacement standard, sinon le PATH. */
	public static function node_bin(): ?string {
		if ( defined( 'EP_NODE_BIN' ) && EP_NODE_BIN ) {
			return is_file( (string) EP_NODE_BIN ) ? (string) EP_NODE_BIN : null;
		}
		$candidats = array( 'C:\\Program Files\\nodejs\\node.exe', '/usr/local/bin/node', '/usr/bin/node', '/opt/homebrew/bin/node' );
		foreach ( $candidats as $c ) {
			if ( is_file( $c ) ) {
				return $c;
			}
		}
		return 'node';
	}

	/* ------------------------------------------------------------ état */

	public static function fichier_etat(): string {
		return rtrim( EP_PRIVATE_DIR, '/\\' ) . '/build/etat.json';
	}

	/** Le dernier état connu : l'option (avec le journal), sinon le fichier du script. */
	public static function etat(): ?array {
		$e = get_option( 'ep_publication_etat' );
		if ( is_array( $e ) && $e ) {
			return $e;
		}
		return self::etat_fichier();
	}

	private static function etat_fichier(): ?array {
		$f = self::fichier_etat();
		if ( ! is_readable( $f ) ) {
			return null;
		}
		$e = json_decode( (string) file_get_contents( $f ), true );
		return is_array( $e ) ? $e : null;
	}

	/** La dernière publication RÉUSSIE du site (pas un aperçu). */
	public static function derniere_reussie(): ?array {
		$e = get_option( 'ep_publication_derniere_reussie' );
		return is_array( $e ) && $e ? $e : null;
	}

	/** La configuration du site a-t-elle changé depuis la dernière publication réussie ? */
	public static function configuration_en_attente(): bool {
		$m = EP_Site::modifie_le();
		if ( ! $m ) {
			return false;
		}
		$d = self::derniere_reussie();
		return ! $d || strtotime( $m ) > strtotime( (string) $d['fin'] );
	}

	/** Les contenus publiés modifiés après la dernière publication réussie. */
	public static function en_attente(): array {
		$derniere = self::derniere_reussie();
		$args     = array(
			'post_type'      => array_merge( EP_Contenu::TYPES, array( 'page' ) ),
			'post_status'    => array( 'publish' ),
			'posts_per_page' => 20,
			'orderby'        => 'modified',
			'order'          => 'DESC',
		);
		if ( $derniere && ! empty( $derniere['fin'] ) ) {
			$args['date_query'] = array( array( 'column' => 'post_modified_gmt', 'after' => gmdate( 'Y-m-d H:i:s', strtotime( $derniere['fin'] ) ) ) );
		}
		return get_posts( $args );
	}

	/* ------------------------------------------------------------ exécution */

	/**
	 * Lance la publication (ou l'aperçu) et attend sa fin.
	 *
	 * @return array l'état écrit par le script, ou un état d'échec.
	 */
	public static function executer( string $mode ): array {
		$mode  = 'apercu' === $mode ? 'apercu' : 'site';
		$motif = self::indisponible();
		if ( $motif ) {
			return array( 'ok' => false, 'mode' => $mode, 'message' => $motif );
		}

		$projet = self::projet_dir();
		wp_mkdir_p( rtrim( EP_PRIVATE_DIR, '/\\' ) . '/logs' );
		wp_mkdir_p( dirname( self::fichier_etat() ) );

		/* L'état précédent est retiré : on ne confondra pas un ancien succès
		   avec le résultat de cette exécution. */
		@unlink( self::fichier_etat() );

		$commande = array( self::node_bin(), $projet . '/tools/publish.mjs', '--mode', $mode );
		$env      = array_merge( self::environnement(), array( 'EP_CMS_URL' => rest_url() ) );
		$spec     = array( 0 => array( 'pipe', 'r' ), 1 => array( 'pipe', 'w' ), 2 => array( 'pipe', 'w' ) );

		set_time_limit( self::DELAI_MAX + 30 );
		$debut = microtime( true );
		$proc  = proc_open( $commande, $spec, $pipes, $projet, $env, array( 'bypass_shell' => true ) );
		if ( ! is_resource( $proc ) ) {
			return array( 'ok' => false, 'mode' => $mode, 'message' => 'Impossible de lancer le processus de publication.' );
		}
		fclose( $pipes[0] );
		stream_set_blocking( $pipes[1], false );
		stream_set_blocking( $pipes[2], false );

		$sortie = '';
		$tue    = false;
		while ( true ) {
			$sortie .= (string) stream_get_contents( $pipes[1] );
			$sortie .= (string) stream_get_contents( $pipes[2] );
			$statut  = proc_get_status( $proc );
			if ( ! $statut['running'] ) {
				break;
			}
			if ( microtime( true ) - $debut > self::DELAI_MAX ) {
				proc_terminate( $proc );
				$tue = true;
				break;
			}
			usleep( 200000 );
		}
		$sortie .= (string) stream_get_contents( $pipes[1] );
		$sortie .= (string) stream_get_contents( $pipes[2] );
		fclose( $pipes[1] );
		fclose( $pipes[2] );
		$code = proc_close( $proc );

		$etat = self::etat_fichier();
		if ( ! $etat ) {
			$etat = array(
				'ok'      => false,
				'mode'    => $mode,
				'debut'   => gmdate( 'c', (int) $debut ),
				'fin'     => gmdate( 'c' ),
				'pages'   => 0,
				'message' => $tue
					? 'La publication a dépassé le délai maximal et a été interrompue.'
					: 'Le script ne s’est pas terminé normalement (code ' . (int) $code . ').',
			);
		}
		/* Les dernières lignes du journal, pour l'écran : jamais plus. */
		$lignes          = array_values( array_filter( array_map( 'trim', explode( "\n", str_replace( "\r", '', $sortie ) ) ) ) );
		$etat['journal'] = array_slice( $lignes, -40 );
		$etat['par']     = get_current_user_id();
		update_option( 'ep_publication_etat', $etat, false );
		if ( 'site' === $mode && ! empty( $etat['ok'] ) ) {
			update_option( 'ep_publication_derniere_reussie', array( 'fin' => $etat['fin'], 'pages' => (int) ( $etat['pages'] ?? 0 ), 'par' => get_current_user_id() ), false );
		}
		EP_Events_Repository::consigner( 0, 'site_published', array( 'metadata' => array( 'mode' => $mode, 'ok' => ! empty( $etat['ok'] ), 'pages' => (int) ( $etat['pages'] ?? 0 ) ) ) );
		return $etat;
	}

	/** L'environnement minimal du processus : le PATH du système, rien d'autre. */
	private static function environnement(): array {
		$env = array();
		foreach ( array( 'PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'COMSPEC', 'PATHEXT', 'SystemDrive', 'ProgramFiles' ) as $k ) {
			$v = getenv( $k );
			if ( false !== $v ) {
				$env[ $k ] = $v;
			}
		}
		return $env;
	}

	/* ------------------------------------------------------------ actions */

	public static function action_publier(): void {
		if ( ! current_user_can( EP_Roles::CAP_PUBLIER ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
		check_admin_referer( 'ep_publier' );
		$etat = self::executer( 'site' );
		wp_safe_redirect( add_query_arg( 'ep_msg', $etat['ok'] ? 'publie' : 'publication_echec', EP_Admin::url_page( EP_Admin_Contenu::PAGE_PUBLICATION ) ) );
		exit;
	}

	public static function action_apercu(): void {
		$id = isset( $_GET['post'] ) ? (int) $_GET['post'] : 0;
		if ( ! $id || ! current_user_can( 'edit_post', $id ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
		check_admin_referer( 'ep_apercu_' . $id );
		$post = get_post( $id );
		$etat = self::executer( 'apercu' );
		if ( ! $post || empty( $etat['ok'] ) ) {
			wp_die(
				'<h1>Aperçu indisponible</h1><p>' . esc_html( $etat['message'] ?? 'Erreur inconnue.' ) . '</p><p><a href="' . esc_url( EP_Admin::url_page( EP_Admin_Contenu::PAGE_PUBLICATION ) ) . '">Voir l’état de la publication</a></p>',
				'Aperçu indisponible',
				array( 'response' => 500 )
			);
		}
		wp_redirect( self::url_apercu( $post ) ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- même hôte, construit ici.
		exit;
	}

	/** L'adresse d'un contenu dans l'aperçu. */
	public static function url_apercu( WP_Post $post ): string {
		$chemin = EP_Contenu::chemin( $post ) ?: 'index.html';
		return home_url( '/_preview/' . $chemin );
	}

	/** L'adresse de l'action d'aperçu d'un contenu (bouton « Prévisualiser »). */
	public static function url_action_apercu( int $id ): string {
		/* Brute, sans `&amp;` : elle voyage aussi en JSON (REST de l'éditeur). */
		return add_query_arg(
			array( 'action' => 'ep_apercu', 'post' => $id, '_wpnonce' => wp_create_nonce( 'ep_apercu_' . $id ) ),
			admin_url( 'admin-post.php' )
		);
	}

	/** Le bouton « Prévisualiser » de l'éditeur mène à l'aperçu reconstruit. */
	public static function lien_apercu( $lien, $post ) {
		if ( ! $post instanceof WP_Post ) {
			return $lien;
		}
		if ( ! in_array( $post->post_type, array_merge( EP_Contenu::TYPES, array( 'page' ) ), true ) ) {
			return $lien;
		}
		if ( 'page' === $post->post_type && ! in_array( $post->post_name, EP_Contenu::PAGES, true ) ) {
			return $lien;
		}
		return self::url_action_apercu( $post->ID );
	}
}
