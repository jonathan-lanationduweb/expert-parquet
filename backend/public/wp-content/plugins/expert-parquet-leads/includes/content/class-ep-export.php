<?php
/**
 * L'instantané éditorial : ce que WordPress donne au générateur statique.
 *
 * ---------------------------------------------------------------------------
 * UNE ROUTE, UN JETON, UNE STRUCTURE DÉTERMINISTE
 *
 *   GET /wp-json/expert-parquet/v1/content/export[?apercu=1]
 *   GET /wp-json/expert-parquet/v1/content/media/<id>[?taille=480]
 *
 * Protégées par un jeton serveur à serveur (en-tête `X-EP-Build-Token`), lu
 * dans `EP_BUILD_TOKEN` ou, à défaut, dans `backend-private/build-token.txt`
 * — créé au premier appel, jamais affiché. Le build (tools/cms/fetch-snapshot.mjs)
 * lit le même fichier. Aucune session, aucun cookie : un appel de script.
 *
 * Sans `apercu`, seuls les contenus PUBLIÉS sortent : un brouillon n'atteint
 * jamais le site public. Avec `apercu=1`, les brouillons, les contenus en
 * attente et planifiés sont inclus, pour la prévisualisation.
 *
 * Les listes sont triées explicitement (ordre éditorial, puis date, puis
 * identifiant) : deux exports du même contenu donnent le même JSON, donc le
 * même site.
 */

defined( 'ABSPATH' ) || exit;

class EP_Export {

	public const VERSION = 1;

	private static array $medias = array();
	private static array $statuts = array( 'publish' );

	public static function init(): void {
		add_action( 'rest_api_init', array( __CLASS__, 'routes' ) );
	}

	public static function routes(): void {
		$perm = array( __CLASS__, 'autoriser' );
		register_rest_route( EP_REST_NS, '/content/export', array( 'methods' => 'GET', 'callback' => array( __CLASS__, 'route_export' ), 'permission_callback' => $perm ) );
		register_rest_route( EP_REST_NS, '/content/media/(?P<id>\d+)', array( 'methods' => 'GET', 'callback' => array( __CLASS__, 'route_media' ), 'permission_callback' => $perm ) );
	}

	/* ------------------------------------------------------------ jeton */

	public static function fichier_jeton(): string {
		return rtrim( EP_PRIVATE_DIR, '/\\' ) . '/build-token.txt';
	}

	/** Le jeton de build ; créé s'il n'existe pas. Jamais journalisé, jamais affiché. */
	public static function jeton(): string {
		if ( defined( 'EP_BUILD_TOKEN' ) && EP_BUILD_TOKEN ) {
			return (string) EP_BUILD_TOKEN;
		}
		$f = self::fichier_jeton();
		if ( is_readable( $f ) ) {
			$j = trim( (string) file_get_contents( $f ) );
			if ( strlen( $j ) >= 32 ) {
				return $j;
			}
		}
		$j = bin2hex( random_bytes( 32 ) );
		wp_mkdir_p( dirname( $f ) );
		file_put_contents( $f, $j . "\n", LOCK_EX );
		@chmod( $f, 0600 );
		return $j;
	}

	public static function autoriser( WP_REST_Request $r ) {
		$attendu = self::jeton();
		$fourni  = (string) $r->get_header( 'x-ep-build-token' );
		if ( $fourni && hash_equals( $attendu, $fourni ) ) {
			return true;
		}
		return new WP_Error( 'ep_export_refuse', 'Accès refusé.', array( 'status' => 403 ) );
	}

	/* ------------------------------------------------------------ routes */

	public static function route_export( WP_REST_Request $r ): WP_REST_Response {
		$apercu = '1' === (string) $r->get_param( 'apercu' );
		$rep    = new WP_REST_Response( self::instantane( $apercu ), 200 );
		$rep->header( 'Cache-Control', 'no-store' );
		return $rep;
	}

	/** Sert un média original ou une taille, pour un build distant. Local : le build copie le fichier. */
	public static function route_media( WP_REST_Request $r ) {
		$id     = (int) $r->get_param( 'id' );
		$taille = (string) $r->get_param( 'taille' );
		$post   = get_post( $id );
		if ( ! $post || 'attachment' !== $post->post_type ) {
			return new WP_Error( 'ep_media_introuvable', 'Média introuvable.', array( 'status' => 404 ) );
		}
		$chemin = get_attached_file( $id );
		if ( $taille ) {
			$meta = wp_get_attachment_metadata( $id );
			$f    = $meta['sizes'][ 'ep-' . preg_replace( '/[^a-z0-9-]/', '', $taille ) ]['file'] ?? null;
			if ( $f ) {
				$chemin = dirname( (string) $chemin ) . '/' . $f;
			}
		}
		if ( ! $chemin || ! is_readable( $chemin ) ) {
			return new WP_Error( 'ep_media_illisible', 'Fichier illisible.', array( 'status' => 404 ) );
		}
		nocache_headers();
		header( 'Content-Type: ' . (string) $post->post_mime_type );
		header( 'Content-Length: ' . (string) filesize( $chemin ) );
		readfile( $chemin );
		exit;
	}

	/* ------------------------------------------------------------ instantané */

	public static function instantane( bool $apercu = false ): array {
		self::$medias  = array();
		self::$statuts = $apercu ? array( 'publish', 'draft', 'pending', 'future', 'private' ) : array( 'publish' );

		$conseils  = array_map( array( __CLASS__, 'conseil' ), EP_Contenu::publies( EP_Contenu::CPT_CONSEIL, self::$statuts ) );
		$problemes = array_map( array( __CLASS__, 'probleme' ), EP_Contenu::publies( EP_Contenu::CPT_PROBLEME, self::$statuts ) );
		$faq       = array_map( array( __CLASS__, 'faq' ), EP_Contenu::publies( EP_Contenu::CPT_FAQ, self::$statuts ) );
		$pages     = array();
		foreach ( EP_Contenu::PAGES as $slug ) {
			$p = EP_Contenu::page( $slug, self::$statuts );
			if ( $p ) {
				$pages[ $slug ] = self::page( $p );
			}
		}
		/* La configuration du site : identité, apparence, navigation, pied de
		   page, SEO. Elle enregistre ses médias comme les contenus. */
		$site = EP_Site::exporter();
		ksort( self::$medias );

		return array(
			'version'     => self::VERSION,
			'apercu'      => $apercu,
			'generatedAt' => gmdate( 'c' ),
			'navigation'  => self::navigation(),
			'headerCta'   => array( 'label' => (string) get_option( 'ep_header_cta', 'Trouver mon parquet' ) ),
			'site'        => $site,
			'themes'      => self::termes( EP_Contenu::TAX_THEME ),
			'groupesFaq'  => self::termes( EP_Contenu::TAX_GROUPE ),
			'faq'         => $faq,
			'conseils'    => $conseils,
			'problemes'   => $problemes,
			'pages'       => $pages,
			'media'       => self::$medias,
		);
	}

	public static function navigation_defaut(): array {
		return array(
			array( 'key' => 'problemes', 'label' => 'Problèmes', 'visible' => true, 'ordre' => 1 ),
			array( 'key' => 'conseils', 'label' => 'Conseils', 'visible' => true, 'ordre' => 2 ),
			array( 'key' => 'diagnostic', 'label' => 'Diagnostic', 'visible' => true, 'ordre' => 3 ),
			array( 'key' => 'expertise', 'label' => 'Expertise', 'visible' => true, 'ordre' => 4 ),
			array( 'key' => 'a-propos', 'label' => 'À propos', 'visible' => true, 'ordre' => 5 ),
		);
	}

	public static function navigation(): array {
		$nav = get_option( 'ep_navigation' );
		if ( ! is_array( $nav ) || ! $nav ) {
			$nav = self::navigation_defaut();
		}
		usort( $nav, static fn( $a, $b ) => ( (int) $a['ordre'] <=> (int) $b['ordre'] ) ?: strcmp( $a['key'], $b['key'] ) );
		return array_values( $nav );
	}

	private static function termes( string $taxonomie ): array {
		$termes = get_terms( array( 'taxonomy' => $taxonomie, 'hide_empty' => false ) );
		if ( is_wp_error( $termes ) ) {
			return array();
		}
		$out = array();
		foreach ( $termes as $t ) {
			$out[] = array(
				'slug'  => $t->slug,
				'name'  => $t->name,
				'titre' => (string) get_term_meta( $t->term_id, 'ep_titre', true ),
				'ordre' => (int) get_term_meta( $t->term_id, 'ep_ordre', true ),
			);
		}
		usort( $out, static fn( $a, $b ) => ( $a['ordre'] <=> $b['ordre'] ) ?: strcmp( $a['slug'], $b['slug'] ) );
		return $out;
	}

	/* ------------------------------------------------------------ contenus */

	private static function m( int $id, string $cle, $defaut = '' ) {
		$v = get_post_meta( $id, $cle, true );
		return ( '' === $v || null === $v ) ? $defaut : $v;
	}

	private static function bool( int $id, string $cle, bool $defaut = false ): bool {
		$v = get_post_meta( $id, $cle, true );
		if ( '' === $v || null === $v ) {
			return $defaut;
		}
		return in_array( $v, array( '1', 1, true, 'true' ), true );
	}

	/** Le HTML tel que le build le reçoit : blocs rendus, rien d'autre. */
	public static function html( WP_Post $post ): string {
		$c = (string) $post->post_content;
		if ( has_blocks( $c ) ) {
			$c = do_blocks( $c );
		}
		return $c;
	}

	private static function commun( WP_Post $p ): array {
		$id = $p->ID;
		return array(
			'id'             => $id,
			'slug'           => EP_Contenu::slug( $p ),
			'status'         => $p->post_status,
			'title'          => $p->post_title,
			'titreCourt'     => (string) self::m( $id, 'ep_titre_court' ),
			'labelCourt'     => (string) self::m( $id, 'ep_label_court' ),
			'seoTitle'       => (string) self::m( $id, 'ep_seo_title' ),
			'seoDescription' => (string) self::m( $id, 'ep_seo_description' ),
			'seoImage'       => self::media( (int) self::m( $id, 'ep_seo_image', 0 ) ),
			'image'          => self::media( (int) get_post_thumbnail_id( $id ) ),
			'tags'           => self::slugs( $id, EP_Contenu::TAX_TAG ),
			'date'           => get_the_date( 'Y-m-d', $p ),
			'modified'       => get_the_modified_date( 'c', $p ),
			'ordre'          => (int) $p->menu_order,
			'related'        => array_values( array_map( 'strval', (array) self::m( $id, 'ep_related', array() ) ) ),
			'faq'            => self::faq_liees( $id ),
			'featured'       => self::bool( $id, 'ep_featured' ),
			'featuredOrder'  => (int) self::m( $id, 'ep_featured_order', 0 ),
			'remplacement'   => self::bool( $id, 'ep_remplacement' ),
			'sortie'         => (string) self::m( $id, 'ep_sortie', 'aucun' ),
			'sortieParams'   => self::params( $id ),
			'sortieTitre'    => (string) self::m( $id, 'ep_sortie_titre' ),
			'sortieTexte'    => (string) self::m( $id, 'ep_sortie_texte' ),
			'sortieAction'   => (string) self::m( $id, 'ep_sortie_action' ),
			'sortieSecondaire' => self::bool( $id, 'ep_sortie_secondaire', true ),
		);
	}

	private static function params( int $id ): array {
		$p   = (array) self::m( $id, 'ep_sortie_params', array() );
		$out = array();
		foreach ( array( 'piece', 'type', 'essence', 'motif', 'teinte', 'finition' ) as $k ) {
			$out[ $k ] = (string) ( $p[ $k ] ?? '' );
		}
		$out['chauffage'] = ! empty( $p['chauffage'] );
		$out['pro']       = ! empty( $p['pro'] );
		return $out;
	}

	private static function slugs( int $id, string $tax ): array {
		$t = wp_get_object_terms( $id, $tax, array( 'fields' => 'slugs' ) );
		return is_array( $t ) ? array_values( $t ) : array();
	}

	/** Les FAQ liées, dans l'ordre choisi, en ne gardant que celles qui sortent dans cet instantané. */
	private static function faq_liees( int $id ): array {
		$out = array();
		foreach ( (array) self::m( $id, 'ep_faq', array() ) as $fid ) {
			$f = get_post( (int) $fid );
			if ( $f && EP_Contenu::CPT_FAQ === $f->post_type && in_array( $f->post_status, self::$statuts, true ) ) {
				$out[] = (int) $fid;
			}
		}
		return $out;
	}

	public static function conseil( WP_Post $p ): array {
		$id   = $p->ID;
		$html = self::html( $p );
		$temps = (string) self::m( $id, 'ep_reading_time' );
		if ( '' === $temps ) {
			$mots  = str_word_count( wp_strip_all_tags( $html ) );
			$temps = max( 1, (int) round( $mots / 200 ) ) . ' min';
		}
		return self::commun( $p ) + array(
			'format'      => (string) self::m( $id, 'ep_format', 'article' ),
			'excerpt'     => (string) $p->post_excerpt,
			'standfirst'  => (string) self::m( $id, 'ep_standfirst' ),
			'lead'        => (string) self::m( $id, 'ep_lead' ),
			'html'        => $html,
			'theme'       => self::slugs( $id, EP_Contenu::TAX_THEME )[0] ?? '',
			'readingTime' => $temps,
			'problemes'   => array_values( array_map( 'strval', (array) self::m( $id, 'ep_problemes', array() ) ) ),
		);
	}

	public static function probleme( WP_Post $p ): array {
		$id = $p->ID;
		return self::commun( $p ) + array(
			'accroche'      => (string) self::m( $id, 'ep_accroche' ),
			'lead'          => (string) self::m( $id, 'ep_lead' ),
			'imageVignette' => self::media( (int) self::m( $id, 'ep_image_vignette', 0 ) ) ?? self::media( (int) get_post_thumbnail_id( $id ) ),
			'symptomes'     => array_values( (array) self::m( $id, 'ep_symptomes', array() ) ),
			'causes'        => array_values( (array) self::m( $id, 'ep_causes', array() ) ),
			'erreurs'       => array_values( (array) self::m( $id, 'ep_erreurs', array() ) ),
			'verifications' => array_values( (array) self::m( $id, 'ep_verifications', array() ) ),
			'expertise'     => (string) self::m( $id, 'ep_expertise' ),
			'html'          => self::html( $p ),
			'diagnostic'    => (string) self::m( $id, 'ep_diagnostic' ),
		);
	}

	public static function faq( WP_Post $p ): array {
		return array(
			'id'       => $p->ID,
			'slug'     => EP_Contenu::slug( $p ),
			'status'   => $p->post_status,
			'question' => $p->post_title,
			'answer'   => self::html( $p ),
			'groupe'   => self::slugs( $p->ID, EP_Contenu::TAX_GROUPE )[0] ?? '',
			'ordre'    => (int) $p->menu_order,
			'modified' => get_the_modified_date( 'c', $p ),
		);
	}

	public static function page( WP_Post $p ): array {
		$id = $p->ID;
		return array(
			'id'             => $id,
			'slug'           => $p->post_name,
			'status'         => $p->post_status,
			'title'          => $p->post_title,
			'champs'         => (array) self::m( $id, 'ep_champs', array() ),
			'seoTitle'       => (string) self::m( $id, 'ep_seo_title' ),
			'seoDescription' => (string) self::m( $id, 'ep_seo_description' ),
			'seoImage'       => self::media( (int) self::m( $id, 'ep_seo_image', 0 ) ),
			'image'          => self::media( (int) get_post_thumbnail_id( $id ) ),
			'html'           => self::html( $p ),
			'modified'       => get_the_modified_date( 'c', $p ),
		);
	}

	/* ------------------------------------------------------------ médias */

	/** Référence un média dans l'instantané et renvoie son identifiant, ou null. */
	public static function media( int $id ): ?int {
		if ( $id <= 0 ) {
			return null;
		}
		if ( isset( self::$medias[ $id ] ) ) {
			return $id;
		}
		$post = get_post( $id );
		if ( ! $post || 'attachment' !== $post->post_type ) {
			return null;
		}
		$chemin = (string) get_attached_file( $id );
		$meta   = (array) wp_get_attachment_metadata( $id );
		$legacy = (string) get_post_meta( $id, '_ep_legacy_file', true );
		$ext    = strtolower( pathinfo( $chemin, PATHINFO_EXTENSION ) ) ?: 'jpg';
		$nom    = $legacy ?: ( 'cms/' . $id . '-' . sanitize_title( pathinfo( $chemin, PATHINFO_FILENAME ) ) . '.' . $ext );
		/* `chemin` : l'adresse publique depuis la racine du site. Une image
		   historique avec un dossier (`brand/x.png`) vit sous assets/, une image
		   historique nue sous assets/images/, une image de la médiathèque sous
		   assets/images/cms/. */
		$public = $legacy
			? ( str_contains( $legacy, '/' ) ? 'assets/' . $legacy : 'assets/images/' . $legacy )
			: 'assets/images/' . $nom;
		$tailles = array();
		foreach ( EP_Contenu::TAILLES as $l ) {
			$s = $meta['sizes'][ 'ep-' . $l ] ?? null;
			if ( $s && ! empty( $s['file'] ) ) {
				$tailles[ (string) $l ] = array(
					'path'  => dirname( $chemin ) . '/' . $s['file'],
					'url'   => rest_url( EP_REST_NS . '/content/media/' . $id . '?taille=' . $l ),
					'width' => (int) ( $s['width'] ?? $l ),
				);
			}
		}
		foreach ( array( 16, 32, 180 ) as $l ) {
			$s = $meta['sizes'][ 'ep-favicon-' . $l ] ?? null;
			if ( $s && ! empty( $s['file'] ) ) {
				$tailles[ 'favicon-' . $l ] = array(
					'path'  => dirname( $chemin ) . '/' . $s['file'],
					'url'   => rest_url( EP_REST_NS . '/content/media/' . $id . '?taille=favicon-' . $l ),
					'width' => $l,
				);
			}
		}
		$clarte = get_post_meta( $id, '_ep_clarte', true );
		self::$medias[ $id ] = array(
			'id'     => $id,
			'file'   => $nom,
			'chemin' => $public,
			'legacy' => '' !== $legacy,
			'alt'    => (string) get_post_meta( $id, '_wp_attachment_image_alt', true ),
			'clarte' => '' === $clarte ? null : (float) $clarte,
			'width'  => (int) ( $meta['width'] ?? 0 ),
			'height' => (int) ( $meta['height'] ?? 0 ),
			'mime'   => (string) $post->post_mime_type,
			'path'   => $chemin,
			'url'    => rest_url( EP_REST_NS . '/content/media/' . $id ),
			'sizes'  => $tailles,
		);
		return $id;
	}
}
