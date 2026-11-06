<?php
/**
 * Import du contenu initial dans WordPress — idempotent.
 *
 * Chaque élément du JSON porte une clé technique (`key`), écrite en méta
 * `_ep_cle` sur le post créé. Relancer l'import retrouve le post par cette clé
 * et le met à jour au lieu d'en créer un second. Les médias sont retrouvés par
 * `_ep_legacy_file` (le nom du fichier dans assets/images).
 *
 * Lancé par backend/scripts/importer-contenu.php, en ligne de commande, avec
 * un administrateur comme utilisateur courant (le HTML éditorial contient des
 * éléments que KSES retirerait à un rôle sans `unfiltered_html`).
 */

defined( 'ABSPATH' ) || exit;

class EP_Import {

	private static array $journal = array();
	private static array $faq_ids = array();
	private static array $media_ids = array();

	public static function executer( string $fichier ): array {
		if ( ! is_readable( $fichier ) ) {
			throw new RuntimeException( "Fichier introuvable : $fichier" );
		}
		$data = json_decode( (string) file_get_contents( $fichier ), true );
		if ( ! is_array( $data ) ) {
			throw new RuntimeException( 'JSON illisible.' );
		}
		self::$journal = array();

		self::termes( EP_Contenu::TAX_THEME, $data['themes'] ?? array() );
		self::termes( EP_Contenu::TAX_GROUPE, $data['groupesFaq'] ?? array() );
		self::medias( $data['media'] ?? array() );
		self::marque();
		self::faq( $data['faq'] ?? array() );
		self::conseils( $data['conseils'] ?? array() );
		self::problemes( $data['problemes'] ?? array() );
		self::pages( $data['pages'] ?? array() );

		if ( ! empty( $data['navigation'] ) && ! get_option( 'ep_navigation' ) ) {
			update_option( 'ep_navigation', $data['navigation'], true );
			self::note( 'navigation', 'créée' );
		}
		if ( ! empty( $data['headerCta'] ) && ! get_option( 'ep_header_cta' ) ) {
			update_option( 'ep_header_cta', (string) $data['headerCta'], true );
		}
		return self::$journal;
	}

	private static function note( string $quoi, string $etat ): void {
		self::$journal[] = array( $quoi, $etat );
	}

	/* ------------------------------------------------------------ termes */

	private static function termes( string $tax, array $liste ): void {
		foreach ( $liste as $t ) {
			$existant = get_term_by( 'slug', $t['slug'], $tax );
			if ( $existant ) {
				wp_update_term( $existant->term_id, $tax, array( 'name' => $t['name'] ) );
				$id = $existant->term_id;
				self::note( "$tax:{$t['slug']}", 'mis à jour' );
			} else {
				$r = wp_insert_term( $t['name'], $tax, array( 'slug' => $t['slug'] ) );
				if ( is_wp_error( $r ) ) {
					self::note( "$tax:{$t['slug']}", 'ERREUR ' . $r->get_error_message() );
					continue;
				}
				$id = (int) $r['term_id'];
				self::note( "$tax:{$t['slug']}", 'créé' );
			}
			update_term_meta( $id, 'ep_ordre', (int) ( $t['ordre'] ?? 0 ) );
			if ( isset( $t['titre'] ) ) {
				update_term_meta( $id, 'ep_titre', (string) $t['titre'] );
			}
		}
	}

	/* ------------------------------------------------------------ médias */

	private static function medias( array $liste ): void {
		require_once ABSPATH . 'wp-admin/includes/image.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';

		$source = EP_Contenu::projet_dir() . '/assets/images/';
		foreach ( $liste as $m ) {
			$file = (string) $m['file'];
			$id   = self::media_par_legacy( $file );
			if ( ! $id ) {
				$chemin = $source . $file;
				if ( ! is_readable( $chemin ) ) {
					self::note( "media:$file", 'ERREUR fichier source introuvable' );
					continue;
				}
				$tmp = wp_tempnam( $file );
				copy( $chemin, $tmp );
				$id = media_handle_sideload( array( 'name' => $file, 'tmp_name' => $tmp ), 0, null );
				if ( is_wp_error( $id ) ) {
					@unlink( $tmp );
					self::note( "media:$file", 'ERREUR ' . $id->get_error_message() );
					continue;
				}
				update_post_meta( $id, '_ep_legacy_file', $file );
				self::note( "media:$file", 'créé' );
			} else {
				self::note( "media:$file", 'déjà présent' );
			}
			update_post_meta( $id, '_wp_attachment_image_alt', (string) ( $m['alt'] ?? '' ) );
			if ( isset( $m['clarte'] ) ) {
				update_post_meta( $id, '_ep_clarte', (float) $m['clarte'] );
			}
			self::$media_ids[ $file ] = (int) $id;
		}
	}

	/**
	 * Les logotypes historiques (assets/brand) entrent dans la médiathèque et
	 * deviennent l'identité du site, à leur emplacement d'origine (`_ep_legacy_file`
	 * avec dossier) : le HTML généré ne change pas d'un octet.
	 */
	private static function marque(): void {
		$source = EP_Contenu::projet_dir() . '/assets/';
		$ids    = array();
		foreach ( array( 'logo' => 'brand/expert-parquet-logo-on-light.png', 'logo_clair' => 'brand/expert-parquet-logo-on-dark.png' ) as $cle => $file ) {
			$id = self::media_par_legacy( $file );
			if ( ! $id ) {
				if ( ! is_readable( $source . $file ) ) {
					self::note( "media:$file", 'ERREUR fichier source introuvable' );
					continue;
				}
				$tmp = wp_tempnam( basename( $file ) );
				copy( $source . $file, $tmp );
				$id = media_handle_sideload( array( 'name' => basename( $file ), 'tmp_name' => $tmp ), 0, 'Logotype Expert Parquet' . ( 'logo_clair' === $cle ? ' (fond sombre)' : '' ) );
				if ( is_wp_error( $id ) ) {
					@unlink( $tmp );
					self::note( "media:$file", 'ERREUR ' . $id->get_error_message() );
					continue;
				}
				update_post_meta( $id, '_ep_legacy_file', $file );
				update_post_meta( $id, '_wp_attachment_image_alt', '' );
				self::note( "media:$file", 'créé' );
			} else {
				self::note( "media:$file", 'déjà présent' );
			}
			$ids[ $cle ] = (int) $id;
		}
		$identite = EP_Site::identite();
		$maj      = false;
		if ( ! $identite['logo_id'] && ! empty( $ids['logo'] ) ) {
			$identite['logo_id'] = $ids['logo'];
			$maj = true;
		}
		if ( ! $identite['logo_clair_id'] && ! empty( $ids['logo_clair'] ) ) {
			$identite['logo_clair_id'] = $ids['logo_clair'];
			$maj = true;
		}
		if ( $maj ) {
			update_option( EP_Site::OPT_IDENTITE, $identite, true );
			self::note( 'identite', 'logotypes rattachés' );
		}
	}

	private static function media_par_legacy( string $file ): int {
		$q = get_posts( array( 'post_type' => 'attachment', 'post_status' => 'any', 'posts_per_page' => 1, 'meta_key' => '_ep_legacy_file', 'meta_value' => $file, 'fields' => 'ids' ) );
		return $q ? (int) $q[0] : 0;
	}

	private static function media_id( ?string $file ): int {
		if ( ! $file ) {
			return 0;
		}
		return self::$media_ids[ $file ] ?? self::media_par_legacy( $file );
	}

	/* ------------------------------------------------------------ posts */

	private static function par_cle( string $cle, string $type ): ?WP_Post {
		$q = get_posts( array( 'post_type' => $type, 'post_status' => array( 'publish', 'draft', 'pending', 'future', 'private' ), 'posts_per_page' => 1, 'meta_key' => EP_Contenu::META_CLE, 'meta_value' => $cle ) );
		return $q ? $q[0] : null;
	}

	/** Crée ou met à jour un post. Les données sont « slashées » comme l'attend wp_insert_post. */
	private static function poser( string $cle, string $type, array $champs, array $metas, array $termes = array() ): int {
		$existant = self::par_cle( $cle, $type );
		$champs  += array( 'post_type' => $type, 'post_status' => 'publish' );
		if ( $existant ) {
			$champs['ID'] = $existant->ID;
			$id = wp_update_post( wp_slash( $champs ), true );
			self::note( $cle, 'mis à jour' );
		} else {
			$id = wp_insert_post( wp_slash( $champs ), true );
			self::note( $cle, 'créé' );
		}
		if ( is_wp_error( $id ) ) {
			self::note( $cle, 'ERREUR ' . $id->get_error_message() );
			return 0;
		}
		update_post_meta( $id, EP_Contenu::META_CLE, $cle );
		foreach ( $metas as $k => $v ) {
			update_post_meta( $id, $k, $v );
		}
		foreach ( $termes as $tax => $slugs ) {
			$ids = array();
			foreach ( (array) $slugs as $s ) {
				$t = get_term_by( 'slug', $s, $tax );
				if ( $t ) {
					$ids[] = (int) $t->term_id;
				} elseif ( EP_Contenu::TAX_TAG === $tax ) {
					$r = wp_insert_term( $s, $tax, array( 'slug' => $s ) );
					if ( ! is_wp_error( $r ) ) {
						$ids[] = (int) $r['term_id'];
					}
				}
			}
			wp_set_object_terms( $id, $ids, $tax, false );
		}
		return (int) $id;
	}

	private static function bool( $v ): string {
		return $v ? '1' : '0';
	}

	private static function faq( array $liste ): void {
		foreach ( $liste as $f ) {
			$cle = 'faq:' . $f['key'];
			$id  = self::poser(
				$cle,
				EP_Contenu::CPT_FAQ,
				array(
					'post_title'   => $f['question'],
					'post_content' => $f['answer'],
					'menu_order'   => (int) $f['ordre'],
				),
				array(),
				array( EP_Contenu::TAX_GROUPE => array( $f['groupe'] ) )
			);
			if ( $id ) {
				self::$faq_ids[ $f['key'] ] = $id;
			}
		}
	}

	private static function metas_sortie( array $c ): array {
		return array(
			'ep_sortie'            => (string) $c['sortie'],
			'ep_sortie_params'     => (array) $c['sortieParams'],
			'ep_sortie_titre'      => (string) $c['sortieTitre'],
			'ep_sortie_texte'      => (string) $c['sortieTexte'],
			'ep_sortie_action'     => (string) $c['sortieAction'],
			'ep_sortie_secondaire' => self::bool( $c['sortieSecondaire'] ),
			'ep_remplacement'      => self::bool( $c['remplacement'] ),
			'ep_featured'          => self::bool( $c['featured'] ),
			'ep_featured_order'    => (int) $c['featuredOrder'],
			'ep_related'           => array_values( (array) $c['related'] ),
			'ep_faq'               => array_values( array_filter( array_map( static fn( $k ) => self::$faq_ids[ $k ] ?? 0, (array) ( $c['faqKeys'] ?? array() ) ) ) ),
			'ep_seo_title'         => (string) ( $c['seoTitle'] ?? '' ),
			'ep_seo_description'   => (string) ( $c['seoDescription'] ?? '' ),
		);
	}

	private static function conseils( array $liste ): void {
		foreach ( $liste as $c ) {
			$champs = array(
				'post_title'   => $c['title'],
				'post_name'    => $c['slug'],
				'post_content' => $c['html'],
				'post_excerpt' => $c['excerpt'],
				'menu_order'   => (int) $c['ordre'],
			);
			if ( ! empty( $c['date'] ) ) {
				$champs['post_date']     = $c['date'] . ' 09:00:00';
				$champs['post_date_gmt'] = get_gmt_from_date( $c['date'] . ' 09:00:00' );
			}
			$metas = self::metas_sortie( $c ) + array(
				'ep_format'       => $c['format'],
				'ep_titre_court'  => (string) ( $c['titreCourt'] ?? '' ),
				'ep_label_court'  => (string) ( $c['labelCourt'] ?? '' ),
				'ep_standfirst'   => (string) $c['standfirst'],
				'ep_lead'         => (string) ( $c['lead'] ?? '' ),
				'ep_reading_time' => (string) $c['readingTime'],
				'ep_problemes'    => array_values( (array) ( $c['problemes'] ?? array() ) ),
				'_thumbnail_id'   => self::media_id( $c['image'] ),
			);
			self::poser( $c['key'], EP_Contenu::CPT_CONSEIL, $champs, $metas, array(
				EP_Contenu::TAX_THEME => array( $c['theme'] ),
				EP_Contenu::TAX_TAG   => (array) $c['tags'],
			) );
		}
	}

	private static function problemes( array $liste ): void {
		foreach ( $liste as $c ) {
			$champs = array(
				'post_title'   => $c['title'],
				'post_name'    => $c['slug'],
				'post_content' => (string) $c['html'],
				'menu_order'   => (int) $c['ordre'],
			);
			$metas = self::metas_sortie( $c ) + array(
				'ep_titre_court'    => (string) $c['titreCourt'],
				'ep_label_court'    => (string) $c['labelCourt'],
				'ep_accroche'       => (string) $c['accroche'],
				'ep_lead'           => (string) $c['lead'],
				'ep_symptomes'      => array_values( (array) $c['symptomes'] ),
				'ep_causes'         => array_values( (array) $c['causes'] ),
				'ep_erreurs'        => array_values( (array) $c['erreurs'] ),
				'ep_verifications'  => array_values( (array) $c['verifications'] ),
				'ep_expertise'      => (string) $c['expertise'],
				'ep_diagnostic'     => (string) $c['diagnostic'],
				'ep_image_vignette' => self::media_id( $c['imageVignette'] ?? null ),
				'_thumbnail_id'     => self::media_id( $c['image'] ),
			);
			self::poser( $c['key'], EP_Contenu::CPT_PROBLEME, $champs, $metas, array( EP_Contenu::TAX_TAG => (array) $c['tags'] ) );
		}
	}

	private static function pages( array $liste ): void {
		foreach ( $liste as $p ) {
			$champs = (array) $p['champs'];
			$metas  = array(
				'ep_champs'          => $champs,
				'ep_seo_title'       => (string) ( $champs['seo_title'] ?? '' ),
				'ep_seo_description' => (string) ( $champs['seo_description'] ?? '' ),
				'_thumbnail_id'      => self::media_id( $p['image'] ?? null ),
			);
			unset( $metas['ep_champs']['seo_title'], $metas['ep_champs']['seo_description'] );
			self::poser( $p['key'], 'page', array(
				'post_title'   => $p['title'],
				'post_name'    => $p['slug'],
				'post_content' => (string) $p['html'],
			), $metas );
		}
	}
}
