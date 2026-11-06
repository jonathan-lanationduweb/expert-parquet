<?php
/**
 * Le modèle éditorial : types de contenu, taxonomies, champs, médias.
 *
 * ---------------------------------------------------------------------------
 * CE QUE WORDPRESS GÈRE, CE QU'IL NE GÈRE PAS
 *
 * WordPress est la SOURCE ÉDITORIALE : conseils, problèmes, FAQ, pages à
 * champs, médias, navigation. Il ne rend aucune page : le générateur statique
 * (tools/build.mjs) lit un instantané exporté par EP_Export et produit le site.
 * Les gabarits, la direction artistique, le moteur « Trouver mon parquet » et
 * les catalogues produits restent dans le code.
 *
 * ---------------------------------------------------------------------------
 * TROIS TYPES, UNE CAPACITÉ
 *
 * `ep_conseil`, `ep_probleme` et `ep_faq` partagent le type de capacité
 * `ep_contenu` : un rédacteur qui peut écrire un conseil peut écrire une FAQ.
 * Les méta-capacités sont déclarées explicitement aux rôles (EP_Roles) — c'est
 * leur absence qui avait cassé l'ancien type `ep_lead`, pas le mécanisme.
 *
 * Aucune réécriture d'URL, aucune page publique : `public => false`,
 * `show_in_rest => true` uniquement pour l'éditeur de blocs.
 */

defined( 'ABSPATH' ) || exit;

class EP_Contenu {

	public const CPT_CONSEIL  = 'ep_conseil';
	public const CPT_PROBLEME = 'ep_probleme';
	public const CPT_FAQ      = 'ep_faq';
	public const TAX_THEME    = 'ep_theme';
	public const TAX_TAG      = 'ep_tag';
	public const TAX_GROUPE   = 'ep_faq_groupe';

	/** Les trois types éditoriaux. */
	public const TYPES = array( self::CPT_CONSEIL, self::CPT_PROBLEME, self::CPT_FAQ );

	/** Slugs des pages à gabarit : seules celles-ci sont exportées. */
	public const PAGES = array( 'accueil', 'a-propos', 'expertise', 'contact', 'diagnostic', 'conseils', 'problemes' );

	/** Clé technique stable posée par l'import : garantit l'idempotence. */
	public const META_CLE = '_ep_cle';

	/** Tailles d'image alignées sur tools/images.mjs (srcset). */
	public const TAILLES = array( 480, 768, 1200, 1600 );

	public static function init(): void {
		add_action( 'init', array( __CLASS__, 'enregistrer' ), 5 );
		add_filter( 'allowed_block_types_all', array( __CLASS__, 'blocs_autorises' ), 10, 2 );
		add_filter( 'use_block_editor_for_post_type', array( __CLASS__, 'editeur_blocs' ), 10, 2 );
		add_filter( 'wp_generate_attachment_metadata', array( __CLASS__, 'mesurer_clarte' ), 10, 2 );
		add_filter( 'big_image_size_threshold', static fn() => 2400 );
		add_action( 'admin_init', array( __CLASS__, 'retirer_boites_inutiles' ) );
		add_filter( 'enter_title_here', array( __CLASS__, 'titre_indicatif' ), 10, 2 );
		add_filter( 'default_hidden_meta_boxes', array( __CLASS__, 'boites_masquees' ), 10, 2 );
		/* Les révisions : utiles au contenu, inutiles aux demandes (qui ne sont
		   pas des posts). `WP_POST_REVISIONS` reste réglable dans wp-config. */
		add_filter( 'wp_revisions_to_keep', array( __CLASS__, 'revisions' ), 10, 2 );

		/* La médiathèque est servie par WordPress, pas par Apache. Le dossier
		   `uploads` reste fermé au public (il l'était pour les photographies
		   des demandes, qui n'y sont d'ailleurs pas) : pour un utilisateur
		   connecté qui gère les médias, les adresses des fichiers passent par
		   `admin-post.php?action=ep_fichier`, qui vérifie la capacité puis
		   sert le fichier. Le site public, lui, n'affiche que les copies que
		   le build a posées dans assets/images. */
		add_filter( 'upload_dir', array( __CLASS__, 'adresses_medias' ) );
		add_action( 'admin_post_ep_fichier', array( __CLASS__, 'servir_fichier' ) );
	}

	public static function adresses_medias( array $dirs ): array {
		if ( ! is_user_logged_in() || ! current_user_can( 'upload_files' ) ) {
			return $dirs;
		}
		if ( defined( 'EP_UPLOADS_PUBLICS' ) && EP_UPLOADS_PUBLICS ) {
			return $dirs;
		}
		$base            = admin_url( 'admin-post.php?action=ep_fichier&f=' );
		$dirs['baseurl'] = rtrim( $base, '/' );
		$dirs['url']     = $dirs['baseurl'] . $dirs['subdir'];
		return $dirs;
	}

	/** Sert un fichier de la médiathèque à un utilisateur habilité. Jamais de PHP, jamais hors du dossier. */
	public static function servir_fichier(): void {
		if ( ! current_user_can( 'upload_files' ) ) {
			status_header( 403 );
			exit;
		}
		$f = isset( $_GET['f'] ) ? wp_unslash( (string) $_GET['f'] ) : '';
		$f = ltrim( str_replace( '\\', '/', $f ), '/' );
		if ( '' === $f || str_contains( $f, '..' ) || ! preg_match( '/\.(jpe?g|png|gif|webp|avif|svg)$/i', $f ) ) {
			status_header( 404 );
			exit;
		}
		remove_filter( 'upload_dir', array( __CLASS__, 'adresses_medias' ) );
		$base   = wp_get_upload_dir()['basedir'];
		$chemin = realpath( $base . '/' . $f );
		if ( ! $chemin || ! str_starts_with( str_replace( '\\', '/', $chemin ), str_replace( '\\', '/', (string) realpath( $base ) ) ) || ! is_file( $chemin ) ) {
			status_header( 404 );
			exit;
		}
		$type = wp_check_filetype( $chemin )['type'] ?: 'application/octet-stream';
		header( 'Content-Type: ' . $type );
		header( 'Content-Length: ' . (string) filesize( $chemin ) );
		header( 'Cache-Control: private, max-age=3600' );
		header( 'X-Content-Type-Options: nosniff' );
		readfile( $chemin );
		exit;
	}

	/* ------------------------------------------------------------ types */

	public static function enregistrer(): void {
		$caps = array(
			'edit_post'              => 'edit_ep_contenu',
			'read_post'              => 'read_ep_contenu',
			'delete_post'            => 'delete_ep_contenu',
			'edit_posts'             => 'edit_ep_contenus',
			'edit_others_posts'      => 'edit_others_ep_contenus',
			'publish_posts'          => 'publish_ep_contenus',
			'read_private_posts'     => 'read_private_ep_contenus',
			'delete_posts'           => 'delete_ep_contenus',
			'delete_private_posts'   => 'delete_private_ep_contenus',
			'delete_published_posts' => 'delete_published_ep_contenus',
			'delete_others_posts'    => 'delete_others_ep_contenus',
			'edit_private_posts'     => 'edit_private_ep_contenus',
			'edit_published_posts'   => 'edit_published_ep_contenus',
			'create_posts'           => 'edit_ep_contenus',
		);
		$commun = array(
			'public'              => false,
			'publicly_queryable'  => false,
			'exclude_from_search' => true,
			'show_ui'             => true,
			'show_in_menu'        => EP_Admin::PAGE_TB,
			'show_in_admin_bar'   => true,
			'show_in_rest'        => true,
			'rewrite'             => false,
			'query_var'           => false,
			'has_archive'         => false,
			'capability_type'     => array( 'ep_contenu', 'ep_contenus' ),
			'capabilities'        => $caps,
			'map_meta_cap'        => true,
			'menu_position'       => null,
		);

		register_post_type(
			self::CPT_CONSEIL,
			$commun + array(
				'labels'   => self::libelles( 'Conseil', 'Conseils', 'un conseil', 'le conseil' ),
				'supports' => array( 'title', 'editor', 'excerpt', 'thumbnail', 'revisions', 'page-attributes' ),
			)
		);
		register_post_type(
			self::CPT_PROBLEME,
			$commun + array(
				'labels'   => self::libelles( 'Problème', 'Problèmes', 'un problème', 'le problème' ),
				'supports' => array( 'title', 'editor', 'thumbnail', 'revisions', 'page-attributes' ),
			)
		);
		register_post_type(
			self::CPT_FAQ,
			$commun + array(
				'labels'   => self::libelles( 'Question', 'FAQ', 'une question', 'la question' ),
				'supports' => array( 'title', 'editor', 'revisions', 'page-attributes' ),
			)
		);

		$caps_tax = array(
			'manage_terms' => 'ep_gerer_themes',
			'edit_terms'   => 'ep_gerer_themes',
			'delete_terms' => 'ep_gerer_themes',
			'assign_terms' => 'edit_ep_contenus',
		);
		register_taxonomy(
			self::TAX_THEME,
			array( self::CPT_CONSEIL ),
			array(
				'labels'            => self::libelles_tax( 'Thème', 'Thèmes' ),
				'public'            => false,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'show_admin_column' => true,
				'hierarchical'      => true,
				'rewrite'           => false,
				'capabilities'      => $caps_tax,
				/* Un conseil appartient à UN thème : la boîte de sélection est
				   remplacée par un choix unique (EP_Champs). */
				'meta_box_cb'       => false,
			)
		);
		register_taxonomy(
			self::TAX_TAG,
			array( self::CPT_CONSEIL, self::CPT_PROBLEME ),
			array(
				'labels'            => self::libelles_tax( 'Étiquette', 'Étiquettes' ),
				'public'            => false,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'show_admin_column' => false,
				'hierarchical'      => false,
				'rewrite'           => false,
				'capabilities'      => $caps_tax,
			)
		);
		register_taxonomy(
			self::TAX_GROUPE,
			array( self::CPT_FAQ ),
			array(
				'labels'            => self::libelles_tax( 'Groupe', 'Groupes de FAQ' ),
				'public'            => false,
				'show_ui'           => true,
				'show_in_rest'      => true,
				'show_admin_column' => true,
				'hierarchical'      => true,
				'rewrite'           => false,
				'capabilities'      => $caps_tax,
				'meta_box_cb'       => false,
			)
		);

		register_term_meta( self::TAX_THEME, 'ep_ordre', array( 'type' => 'integer', 'single' => true, 'show_in_rest' => true, 'default' => 0 ) );
		register_term_meta( self::TAX_GROUPE, 'ep_ordre', array( 'type' => 'integer', 'single' => true, 'show_in_rest' => true, 'default' => 0 ) );
		register_term_meta( self::TAX_GROUPE, 'ep_titre', array( 'type' => 'string', 'single' => true, 'show_in_rest' => true, 'default' => '' ) );

		foreach ( self::TAILLES as $l ) {
			add_image_size( 'ep-' . $l, $l, 0, false );
		}
		/* Favicon administrable : WordPress produit les carrés, le build les copie. */
		add_image_size( 'ep-favicon-16', 16, 16, true );
		add_image_size( 'ep-favicon-32', 32, 32, true );
		add_image_size( 'ep-favicon-180', 180, 180, true );

		self::enregistrer_meta();
	}

	private static function libelles( string $un, string $des, string $article, string $le ): array {
		return array(
			'name'               => $des,
			'singular_name'      => $un,
			'menu_name'          => $des,
			'all_items'          => $des,
			'add_new'            => 'Ajouter',
			'add_new_item'       => 'Ajouter ' . $article,
			'edit_item'          => 'Modifier ' . $le,
			'new_item'           => 'Nouveau',
			'view_item'          => 'Voir',
			'search_items'       => 'Rechercher',
			'not_found'          => 'Aucun contenu.',
			'not_found_in_trash' => 'Rien dans la corbeille.',
			'item_published'     => ucfirst( $un ) . ' publié. Pensez à « Publier le site » pour le mettre en ligne.',
			'item_updated'       => ucfirst( $un ) . ' mis à jour. Pensez à « Publier le site » pour le mettre en ligne.',
		);
	}

	private static function libelles_tax( string $un, string $des ): array {
		return array(
			'name'          => $des,
			'singular_name' => $un,
			'menu_name'     => $des,
			'all_items'     => $des,
			'edit_item'     => 'Modifier',
			'add_new_item'  => 'Ajouter',
			'search_items'  => 'Rechercher',
		);
	}

	/* ------------------------------------------------------------ champs */

	/**
	 * Les champs métier, déclarés une fois : type, valeur par défaut, et le
	 * type de contenu qui les porte. EP_Champs les affiche, EP_Export les lit.
	 */
	public static function champs(): array {
		$texte  = array( 'type' => 'string', 'default' => '' );
		$bool   = array( 'type' => 'boolean', 'default' => false );
		$entier = array( 'type' => 'integer', 'default' => 0 );
		$liste  = array( 'type' => 'array', 'default' => array() );
		$objet  = array( 'type' => 'object', 'default' => array() );

		$seo    = array( 'ep_seo_title' => $texte, 'ep_seo_description' => $texte, 'ep_seo_image' => $entier );
		$sortie = array(
			'ep_sortie'            => $texte + array( 'default' => 'aucun' ),
			'ep_sortie_params'     => $objet,
			'ep_sortie_titre'      => $texte,
			'ep_sortie_texte'      => $texte,
			'ep_sortie_action'     => $texte,
			'ep_sortie_secondaire' => $bool + array( 'default' => true ),
		);
		$avant = array( 'ep_featured' => $bool, 'ep_featured_order' => $entier );

		return array(
			self::CPT_CONSEIL  => array(
				'ep_format'       => $texte + array( 'default' => 'article' ),
				'ep_titre_court'  => $texte,
				'ep_label_court'  => $texte,
				'ep_lead'         => $texte,
				'ep_standfirst'   => $texte,
				'ep_reading_time' => $texte,
				'ep_related'      => $liste,
				'ep_problemes'    => $liste,
				'ep_faq'          => $liste,
				'ep_remplacement' => $bool,
			) + $avant + $sortie + $seo,
			self::CPT_PROBLEME => array(
				'ep_titre_court'   => $texte,
				'ep_label_court'   => $texte,
				'ep_accroche'      => $texte,
				'ep_lead'          => $texte,
				'ep_symptomes'     => $liste,
				'ep_causes'        => $liste,
				'ep_erreurs'       => $liste,
				'ep_verifications' => $liste,
				'ep_expertise'     => $texte,
				'ep_remplacement'  => $bool,
				'ep_diagnostic'    => $texte,
				'ep_image_vignette' => $entier,
				'ep_related'       => $liste,
				'ep_faq'           => $liste,
			) + $avant + $sortie + $seo,
			self::CPT_FAQ      => array(),
			'page'             => array(
				'ep_champs' => $objet,
			) + $seo,
		);
	}

	private static function enregistrer_meta(): void {
		foreach ( self::champs() as $type => $champs ) {
			foreach ( $champs as $cle => $def ) {
				$args = array(
					'type'          => $def['type'],
					'single'        => true,
					'default'       => $def['default'],
					'show_in_rest'  => false,
					'auth_callback' => static fn() => current_user_can( 'edit_ep_contenus' ) || current_user_can( 'edit_pages' ),
				);
				register_post_meta( $type, $cle, $args );
			}
		}
		register_post_meta( '', self::META_CLE, array( 'type' => 'string', 'single' => true, 'show_in_rest' => false ) );
		register_post_meta( 'attachment', '_ep_clarte', array( 'type' => 'number', 'single' => true, 'show_in_rest' => false ) );
		register_post_meta( 'attachment', '_ep_legacy_file', array( 'type' => 'string', 'single' => true, 'show_in_rest' => false ) );
	}

	/* ------------------------------------------------------------ valeurs */

	/** Parcours de sortie : la clé est ce que le build comprend. */
	public static function sorties(): array {
		return array(
			'aucun'      => 'Aucun',
			'moteur'     => 'Trouver mon parquet (moteur)',
			'diagnostic' => 'Pré-diagnostic',
			'expertise'  => 'Expertise',
		);
	}

	public static function formats(): array {
		return array( 'article' => 'Article', 'guide' => 'Guide' );
	}

	/**
	 * Les valeurs comprises par le moteur, lues dans js/config/finder-questions.js
	 * pour n'avoir qu'une source. Un repli codé en dur protège l'administration
	 * si le fichier n'est pas lisible depuis le serveur.
	 */
	public static function criteres_moteur(): array {
		$repli = array(
			'piece'    => array( 'salon' => 'Séjour, salon', 'chambre' => 'Chambre', 'entree' => 'Entrée, couloir', 'humide' => 'Cuisine ou salle de bain', 'bureau' => 'Bureau, commerce', 'terrasse' => 'Terrasse' ),
			'type'     => array( 'massif' => 'Massif', 'contrecolle' => 'Contrecollé', 'stratifie' => 'Stratifié' ),
			'essence'  => array( 'chene' => 'Chêne', 'bambou' => 'Bambou', 'exotique' => 'Bois exotique' ),
			'motif'    => array( 'lames-droites' => 'Lames droites', 'point-de-hongrie' => 'Point de Hongrie', 'baton-rompu' => 'Bâton rompu', 'versailles' => 'Versailles' ),
			'teinte'   => array( 'clair' => 'Claire', 'naturel' => 'Naturelle', 'moyen' => 'Moyenne à brune', 'fonce' => 'Foncée', 'gris' => 'Grise' ),
			'finition' => array( 'huile' => 'Huilée', 'verni' => 'Vernie', 'brut' => 'Brute' ),
		);
		$fichier = self::projet_dir() . '/js/config/finder-questions.js';
		if ( ! is_readable( $fichier ) ) {
			return $repli;
		}
		$src = (string) file_get_contents( $fichier );
		$out = array();
		foreach ( array_keys( $repli ) as $cle ) {
			if ( ! preg_match( "/cle: '" . $cle . "',.*?options: \[(.*?)\n\s*\],/s", $src, $m ) ) {
				$out[ $cle ] = $repli[ $cle ];
				continue;
			}
			preg_match_all( "/value: '([a-z-]+)', label: '([^']+)'/", $m[1], $paires, PREG_SET_ORDER );
			$out[ $cle ] = $paires ? array_column( $paires, 2, 1 ) : $repli[ $cle ];
		}
		return $out;
	}

	/** Les problèmes du pré-diagnostic (js/config/options.js), même principe. */
	public static function problemes_diagnostic(): array {
		$repli   = array( 'grincement' => 'Grincement', 'gonflement' => 'Gonflement ou soulèvement', 'lames-mobiles' => 'Lames qui bougent', 'humidite' => 'Humidité', 'taches' => 'Taches', 'rayures' => 'Rayures', 'deformation' => 'Déformation générale', 'degat-des-eaux' => 'Dégât des eaux', 'defaut-de-pose' => 'Problème de pose', 'vieillissement' => 'Parquet ancien ou usé' );
		$fichier = self::projet_dir() . '/js/config/options.js';
		if ( ! is_readable( $fichier ) ) {
			return $repli;
		}
		$src = (string) file_get_contents( $fichier );
		if ( ! preg_match( '/export const PROBLEMES = \[(.*?)\n\];/s', $src, $m ) ) {
			return $repli;
		}
		preg_match_all( "/value: '([a-z-]+)', label: '([^']+)', page: ('[^']+'|null)/", $m[1], $paires, PREG_SET_ORDER );
		$out = array();
		foreach ( $paires as $p ) {
			if ( 'null' !== $p[3] ) {
				$out[ $p[1] ] = $p[2];
			}
		}
		return $out ?: $repli;
	}

	/** Racine du projet (le site statique) : WordPress vit dans backend/public. */
	public static function projet_dir(): string {
		if ( defined( 'EP_PROJET_DIR' ) ) {
			return rtrim( (string) EP_PROJET_DIR, '/\\' );
		}
		return str_replace( '\\', '/', dirname( rtrim( ABSPATH, '/\\' ), 2 ) );
	}

	/* ------------------------------------------------------------ éditeur */

	/**
	 * Blocs autorisés sur les contenus éditoriaux : de quoi écrire, rien qui
	 * dessine une mise en page. `core/freeform` est le bloc « classique » : le
	 * contenu migré y vit tel quel, modifiable en WYSIWYG.
	 */
	public static function blocs_autorises( $autorises, $contexte ) {
		$post = $contexte->post ?? null;
		if ( ! $post || ! in_array( $post->post_type, array_merge( self::TYPES, array( 'page' ) ), true ) ) {
			return $autorises;
		}
		return array( 'core/paragraph', 'core/heading', 'core/list', 'core/list-item', 'core/quote', 'core/image', 'core/table', 'core/freeform', 'core/separator' );
	}

	public static function editeur_blocs( $actif, $type ) {
		return in_array( $type, array_merge( self::TYPES, array( 'page' ) ), true ) ? true : $actif;
	}

	public static function revisions( $nb, $post ) {
		return in_array( $post->post_type, array_merge( self::TYPES, array( 'page' ) ), true ) ? 10 : $nb;
	}

	public static function retirer_boites_inutiles(): void {
		foreach ( array_merge( self::TYPES, array( 'page' ) ) as $type ) {
			remove_meta_box( 'commentstatusdiv', $type, 'normal' );
			remove_meta_box( 'commentsdiv', $type, 'normal' );
			remove_meta_box( 'trackbacksdiv', $type, 'normal' );
			remove_meta_box( 'postcustom', $type, 'normal' );
			remove_meta_box( 'authordiv', $type, 'normal' );
		}
	}

	public static function titre_indicatif( $texte, $post ) {
		return match ( $post->post_type ) {
			self::CPT_FAQ => 'La question, telle que le visiteur la pose',
			self::CPT_PROBLEME => 'Titre de la page (H1)',
			self::CPT_CONSEIL => 'Titre du conseil (H1)',
			default => $texte,
		};
	}

	public static function boites_masquees( $masquees, $ecran ) {
		if ( in_array( $ecran->post_type, self::TYPES, true ) ) {
			$masquees[] = 'slugdiv';
		}
		return $masquees;
	}

	/* ------------------------------------------------------------ médias */

	/**
	 * Clarté d'une image : 90e centile de luminance relative, mesuré sur une
	 * réduction. Même définition que tools/images.mjs : au-dessus de 0,42, le
	 * hero reçoit un voile renforcé pour que le texte blanc reste lisible.
	 */
	public static function mesurer_clarte( array $meta, int $id ): array {
		$fichier = get_attached_file( $id );
		$clarte  = $fichier ? self::calculer_clarte( $fichier ) : null;
		if ( null !== $clarte ) {
			update_post_meta( $id, '_ep_clarte', $clarte );
		}
		return $meta;
	}

	public static function calculer_clarte( string $fichier ): ?float {
		if ( ! function_exists( 'imagecreatefromstring' ) || ! is_readable( $fichier ) ) {
			return null;
		}
		$src = @imagecreatefromstring( (string) file_get_contents( $fichier ) );
		if ( ! $src ) {
			return null;
		}
		$w = imagesx( $src );
		$h = imagesy( $src );
		$l = 64;
		$hh = max( 1, (int) round( $h * $l / max( 1, $w ) ) );
		$petit = imagecreatetruecolor( $l, $hh );
		imagecopyresampled( $petit, $src, 0, 0, 0, 0, $l, $hh, $w, $h );
		$valeurs = array();
		for ( $y = 0; $y < $hh; $y++ ) {
			for ( $x = 0; $x < $l; $x++ ) {
				$rgb = imagecolorat( $petit, $x, $y );
				$r   = ( ( $rgb >> 16 ) & 255 ) / 255;
				$g   = ( ( $rgb >> 8 ) & 255 ) / 255;
				$b   = ( $rgb & 255 ) / 255;
				$lin = static fn( float $c ): float => $c <= 0.03928 ? $c / 12.92 : ( ( $c + 0.055 ) / 1.055 ) ** 2.4;
				$valeurs[] = 0.2126 * $lin( $r ) + 0.7152 * $lin( $g ) + 0.0722 * $lin( $b );
			}
		}
		imagedestroy( $petit );
		imagedestroy( $src );
		sort( $valeurs );
		$i = (int) floor( 0.9 * ( count( $valeurs ) - 1 ) );
		return round( $valeurs[ $i ], 2 );
	}

	/* ------------------------------------------------------------ requêtes */

	/** Les contenus publiés d'un type, dans l'ordre éditorial (menu_order, puis date). */
	public static function publies( string $type, array $statuts = array( 'publish' ) ): array {
		return get_posts(
			array(
				'post_type'        => $type,
				'post_status'      => $statuts,
				'posts_per_page'   => -1,
				'orderby'          => array( 'menu_order' => 'ASC', 'date' => 'ASC', 'ID' => 'ASC' ),
				'suppress_filters' => false,
			)
		);
	}

	/** La page à gabarit d'un slug, quel que soit son statut. */
	public static function page( string $slug, array $statuts = array( 'publish', 'draft', 'pending', 'future', 'private' ) ): ?WP_Post {
		$pages = get_posts( array( 'post_type' => 'page', 'name' => $slug, 'post_status' => $statuts, 'posts_per_page' => 1 ) );
		return $pages ? $pages[0] : null;
	}

	/**
	 * Le slug d'un contenu : celui de WordPress, ou — pour un brouillon qui n'en
	 * a pas encore — celui que WordPress lui donnera à la publication.
	 */
	public static function slug( WP_Post $post ): string {
		return $post->post_name ?: sanitize_title( $post->post_title ) ?: 'contenu-' . $post->ID;
	}

	/** Chemin public d'un contenu, tel que le build l'écrit. */
	public static function chemin( WP_Post $post ): ?string {
		$slug = self::slug( $post );
		switch ( $post->post_type ) {
			case self::CPT_CONSEIL:
				return 'guide' === get_post_meta( $post->ID, 'ep_format', true )
					? 'pages/conseils/' . $slug . '.html'
					: 'articles/' . $slug . '.html';
			case self::CPT_PROBLEME:
				return 'pages/problemes/' . $slug . '.html';
			case 'page':
				return 'accueil' === $slug ? 'index.html' : 'pages/' . $slug . '.html';
			case self::CPT_FAQ:
				$groupes = wp_get_object_terms( $post->ID, self::TAX_GROUPE, array( 'fields' => 'slugs' ) );
				$g       = is_array( $groupes ) && $groupes ? $groupes[0] : '';
				return match ( $g ) {
					'accueil' => 'index.html',
					'diagnostic' => 'pages/diagnostic.html',
					'contact' => 'pages/contact.html',
					default => 'pages/faq.html',
				};
		}
		return null;
	}
}
