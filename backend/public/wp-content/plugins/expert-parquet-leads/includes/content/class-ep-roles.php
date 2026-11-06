<?php
/**
 * Rôles et capacités éditoriaux.
 *
 *   ep_redacteur    écrit, modifie, téléverse des médias — ne publie pas
 *   ep_editeur      la même chose, publie, ordonne, lance la publication du site
 *   ep_gestionnaire les demandes, inchangé (EP_Lead)
 *   administrator   tout
 *
 * Les capacités sont déclarées explicitement, rôle par rôle. Les méta-capacités
 * des types de contenu (`edit_ep_contenu`…) sont résolues par WordPress à
 * partir de celles-ci grâce à `map_meta_cap`.
 *
 * Les rôles éditoriaux n'ont NI `edit_posts` NI `manage_options` : ni les
 * articles natifs, ni les extensions, ni les réglages, ni les comptes.
 */

defined( 'ABSPATH' ) || exit;

class EP_Roles {

	public const VERSION = 2;

	public const REDACTEUR = 'ep_redacteur';
	public const EDITEUR   = 'ep_editeur';

	/** Capacités propres au plugin, hors types de contenu. */
	public const CAP_PUBLIER     = 'ep_publier_site';
	public const CAP_MEDIAS      = 'ep_gerer_medias';
	public const CAP_NAVIGATION  = 'ep_gerer_navigation';
	public const CAP_MAINTENANCE = 'ep_gerer_maintenance';
	public const CAP_THEMES      = 'ep_gerer_themes';

	public static function init(): void {
		add_action( 'init', array( __CLASS__, 'verifier' ), 2 );
		add_filter( 'map_meta_cap', array( __CLASS__, 'medias' ), 10, 4 );
	}

	/** Installe ou met à niveau les rôles, une fois par version. */
	public static function verifier(): void {
		if ( (int) get_option( 'ep_roles_version', 0 ) >= self::VERSION ) {
			return;
		}
		self::installer();
		update_option( 'ep_roles_version', self::VERSION, true );
	}

	private static function caps_redacteur(): array {
		return array(
			'read'                        => true,
			'upload_files'                => true,
			self::CAP_MEDIAS              => true,
			'edit_ep_contenus'            => true,
			'edit_others_ep_contenus'     => true,
			'edit_published_ep_contenus'  => true,
			'delete_ep_contenus'          => true,
			'read_ep_contenu'             => true,
			'edit_pages'                  => true,
			'edit_others_pages'           => true,
			'edit_published_pages'        => true,
		);
	}

	private static function caps_editeur(): array {
		return self::caps_redacteur() + array(
			'publish_ep_contenus'          => true,
			'read_private_ep_contenus'     => true,
			'edit_private_ep_contenus'     => true,
			'delete_private_ep_contenus'   => true,
			'delete_published_ep_contenus' => true,
			'delete_others_ep_contenus'    => true,
			'publish_pages'                => true,
			'read_private_pages'           => true,
			'edit_private_pages'           => true,
			'delete_pages'                 => true,
			'delete_private_pages'         => true,
			'delete_published_pages'       => true,
			'delete_others_pages'          => true,
			self::CAP_THEMES               => true,
			self::CAP_PUBLIER              => true,
			self::CAP_NAVIGATION           => true,
			self::CAP_MAINTENANCE          => true,
		);
	}

	public static function installer(): void {
		remove_role( self::REDACTEUR );
		remove_role( self::EDITEUR );
		add_role( self::REDACTEUR, 'Rédacteur de contenu', self::caps_redacteur() );
		add_role( self::EDITEUR, 'Éditeur de contenu', self::caps_editeur() );

		$admin = get_role( 'administrator' );
		if ( $admin ) {
			foreach ( array_keys( self::caps_editeur() ) as $cap ) {
				$admin->add_cap( $cap );
			}
			/* La configuration globale (identité, apparence, SEO) : administrateur seul. */
			$admin->add_cap( 'ep_configurer_site' );
		}
		EP_Site::installer();
	}

	/**
	 * Les médias de la médiathèque appartiennent au type `attachment`, dont les
	 * capacités sont celles des articles natifs. Plutôt que de donner
	 * `edit_posts` aux rôles éditoriaux — ce qui rouvrirait les articles —, on
	 * accorde l'édition et la suppression d'un média à qui gère les médias.
	 */
	public static function medias( array $caps, string $cap, int $user_id, array $args ): array {
		if ( ! in_array( $cap, array( 'edit_post', 'delete_post', 'read_post' ), true ) || empty( $args[0] ) ) {
			return $caps;
		}
		$post = get_post( (int) $args[0] );
		if ( ! $post || 'attachment' !== $post->post_type ) {
			return $caps;
		}
		return user_can( $user_id, self::CAP_MEDIAS ) ? array( self::CAP_MEDIAS ) : $caps;
	}
}
