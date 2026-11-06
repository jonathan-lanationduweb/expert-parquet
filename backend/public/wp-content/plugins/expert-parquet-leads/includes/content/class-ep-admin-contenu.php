<?php
/**
 * L'administration du contenu : menu, tableau de bord « gestion du site »,
 * écran Navigation, écran Publication du site.
 *
 * ---------------------------------------------------------------------------
 * UN SEUL MENU, TROIS RUBRIQUES
 *
 *   EXPERT PARQUET
 *     Tableau de bord
 *     CONTENU         Accueil · Conseils · Problèmes · FAQ · Pages · Médias ·
 *                     Navigation · Publication du site
 *     ACTIVITÉ        Demandes · Contacts · Devis · Photos · Emails
 *     ADMINISTRATION  Réglages · Thèmes · Groupes de FAQ · Étiquettes
 *
 * Les écrans natifs utiles (listes de contenus, médiathèque, pages, termes)
 * sont réutilisés tels quels : ils sont simplement rangés ici. Les menus
 * natifs correspondants sont retirés de leur place d'origine (EP_Security),
 * pour qu'il n'y ait qu'un chemin.
 */

defined( 'ABSPATH' ) || exit;

class EP_Admin_Contenu {

	public const PAGE_NAVIGATION  = 'expert-parquet-navigation';
	public const PAGE_PUBLICATION = 'expert-parquet-publication';
	public const PAGE_MAINTENANCE = 'expert-parquet-maintenance';

	public static function init(): void {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ), 20 );
		add_action( 'admin_menu', array( __CLASS__, 'ordonner' ), 999 );
		add_filter( 'custom_menu_order', '__return_true' );
		add_filter( 'menu_order', array( __CLASS__, 'menu_en_tete' ) );
		add_filter( 'parent_file', array( __CLASS__, 'parent_file' ) );
		add_filter( 'submenu_file', array( __CLASS__, 'submenu_file' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
		add_action( 'admin_post_ep_navigation', array( __CLASS__, 'action_navigation' ) );
		add_action( 'admin_post_ep_accueil', array( __CLASS__, 'action_accueil' ) );
		add_action( 'admin_notices', array( __CLASS__, 'avis' ) );
		add_filter( 'post_row_actions', array( __CLASS__, 'action_apercu_ligne' ), 10, 2 );
		add_filter( 'page_row_actions', array( __CLASS__, 'action_apercu_ligne' ), 10, 2 );
	}

	/* ------------------------------------------------------------ menu */

	public static function menu(): void {
		$tb = EP_Admin::PAGE_TB;
		add_submenu_page( $tb, 'Navigation — Expert Parquet', 'Navigation', EP_Roles::CAP_NAVIGATION, self::PAGE_NAVIGATION, array( __CLASS__, 'ecran_navigation' ) );
		add_submenu_page( $tb, 'Publication du site — Expert Parquet', 'Publication du site', EP_Roles::CAP_PUBLIER, self::PAGE_PUBLICATION, array( __CLASS__, 'ecran_publication' ) );
		add_submenu_page( $tb, 'Maintenance — Expert Parquet', 'Maintenance', EP_Roles::CAP_MAINTENANCE, self::PAGE_MAINTENANCE, array( 'EP_Maintenance', 'ecran' ) );
	}

	/**
	 * L'espace Expert Parquet passe en tête de la colonne ; l'administration
	 * WordPress native suit, inchangée. Aucune entrée n'est retirée.
	 */
	public static function menu_en_tete( array $ordre ): array {
		$tb = EP_Admin::PAGE_TB;
		if ( ! in_array( $tb, $ordre, true ) ) {
			return $ordre;
		}
		return array_values( array_merge( array( $tb ), array_filter( $ordre, static fn( $slug ) => $slug !== $tb ) ) );
	}

	/** L'identifiant de la page Accueil, pour le raccourci du menu. */
	public static function id_accueil(): int {
		$p = EP_Contenu::page( 'accueil' );
		return $p ? $p->ID : 0;
	}

	/**
	 * Réordonne le sous-menu et y insère les rubriques. WordPress a déjà ajouté
	 * les entrées des types de contenu ; on compose la liste finale à partir
	 * de ce qui existe, par slug, pour ne jamais inventer une capacité.
	 */
	public static function ordonner(): void {
		global $submenu;
		$tb = EP_Admin::PAGE_TB;
		if ( empty( $submenu[ $tb ] ) ) {
			return;
		}
		$existants = array();
		foreach ( $submenu[ $tb ] as $entree ) {
			$existants[ $entree[2] ] = $entree;
		}
		$conseil  = 'edit.php?post_type=' . EP_Contenu::CPT_CONSEIL;
		$probleme = 'edit.php?post_type=' . EP_Contenu::CPT_PROBLEME;
		$faq      = 'edit.php?post_type=' . EP_Contenu::CPT_FAQ;
		$accueil  = self::id_accueil();

		$section = static fn( string $nom ): array => array( '<span class="ep-menu-section">' . $nom . '</span>', 'read', 'ep-section-' . sanitize_key( $nom ), '' );
		/* Une icône devant chaque entrée, comme sur la maquette : les sous-menus de
		   WordPress n'en ont pas nativement. */
		$ico     = static fn( string $icone, string $libelle ): string => '<span class="dashicons ' . $icone . ' ep-menu-icone" aria-hidden="true"></span>' . $libelle;
		$lien    = static fn( string $libelle, string $cap, string $slug, string $icone = '' ): array => array( $icone ? $ico( $icone, $libelle ) : $libelle, $cap, $slug, $libelle . ' — Expert Parquet' );
		$avec    = static function ( ?array $entree, string $icone ) use ( $ico ): ?array {
			if ( ! $entree ) {
				return null;
			}
			$entree[0] = $ico( $icone, wp_strip_all_tags( $entree[0] ) );
			return $entree;
		};

		$premiere = $existants[ $tb ] ?? $lien( 'Tableau de bord', 'read', $tb );
		if ( current_user_can( 'edit_ep_contenus' ) ) {
			$premiere[0] = 'Gestion du site';
		}
		$ordre = array(
			$avec( $premiere, 'dashicons-dashboard' ),
			$section( 'Contenu' ),
			$avec( $existants[ $conseil ] ?? $lien( 'Conseils', 'edit_ep_contenus', $conseil ), 'dashicons-media-document' ),
			$avec( $existants[ $probleme ] ?? $lien( 'Problèmes', 'edit_ep_contenus', $probleme ), 'dashicons-admin-tools' ),
			$avec( $existants[ $faq ] ?? $lien( 'FAQ', 'edit_ep_contenus', $faq ), 'dashicons-format-chat' ),
			$lien( 'Pages', 'edit_pages', 'edit.php?post_type=page', 'dashicons-edit' ),
			$lien( 'Médias', 'upload_files', 'upload.php', 'dashicons-format-image' ),
			$section( 'Site' ),
			$avec( $existants[ EP_Admin_Site::PAGE_HUB ] ?? null, 'dashicons-admin-settings' ),
			$accueil ? $lien( 'Accueil', 'edit_pages', 'admin.php?page=' . $tb . '&vue=accueil', 'dashicons-admin-home' ) : null,
			$avec( $existants[ EP_Admin_Site::PAGE_IDENTITE ] ?? null, 'dashicons-id-alt' ),
			$avec( $existants[ EP_Admin_Site::PAGE_APPARENCE ] ?? null, 'dashicons-art' ),
			$avec( $existants[ self::PAGE_NAVIGATION ] ?? null, 'dashicons-menu-alt' ),
			$avec( $existants[ EP_Admin_Site::PAGE_FOOTER ] ?? null, 'dashicons-editor-table' ),
			$avec( $existants[ EP_Admin_Site::PAGE_SEO ] ?? null, 'dashicons-search' ),
			$avec( $existants[ self::PAGE_PUBLICATION ] ?? null, 'dashicons-upload' ),
			current_user_can( EP_Roles::CAP_MAINTENANCE ) ? $avec( $existants[ self::PAGE_MAINTENANCE ] ?? $lien( 'Maintenance', EP_Roles::CAP_MAINTENANCE, 'admin.php?page=' . self::PAGE_MAINTENANCE ), 'dashicons-hammer' ) : null,
			current_user_can( 'list_users' ) ? $lien( 'Utilisateurs', 'list_users', 'users.php', 'dashicons-admin-users' ) : null,
			$section( 'Activité' ),
			$avec( $existants[ EP_Admin::PAGE_LISTE ] ?? null, 'dashicons-clipboard' ),
			$avec( $existants[ EP_Admin::PAGE_CONTACTS ] ?? null, 'dashicons-email' ),
			$avec( $existants[ EP_Admin::PAGE_DEVIS ] ?? null, 'dashicons-media-text' ),
			$avec( $existants[ EP_Admin::PAGE_PHOTOS ] ?? null, 'dashicons-camera' ),
			$avec( $existants[ EP_Admin::PAGE_EMAILS ] ?? null, 'dashicons-email-alt' ),
			$section( 'Outils du site' ),
			$avec( $existants[ EP_Admin::PAGE_REGLAGES ] ?? null, 'dashicons-admin-generic' ),
			$lien( 'Thèmes', EP_Roles::CAP_THEMES, 'edit-tags.php?taxonomy=' . EP_Contenu::TAX_THEME . '&post_type=' . EP_Contenu::CPT_CONSEIL, 'dashicons-category' ),
			$lien( 'Groupes de FAQ', EP_Roles::CAP_THEMES, 'edit-tags.php?taxonomy=' . EP_Contenu::TAX_GROUPE . '&post_type=' . EP_Contenu::CPT_FAQ, 'dashicons-category' ),
			$lien( 'Étiquettes', EP_Roles::CAP_THEMES, 'edit-tags.php?taxonomy=' . EP_Contenu::TAX_TAG . '&post_type=' . EP_Contenu::CPT_CONSEIL, 'dashicons-tag' ),
		);
		$submenu[ $tb ] = array_values( array_filter( $ordre ) ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	/** Les écrans natifs rangés sous notre menu : le menu reste ouvert quand on y est. */
	public static function parent_file( $parent ) {
		global $pagenow, $typenow, $taxnow;
		if ( in_array( $pagenow, array( 'upload.php', 'media-new.php' ), true ) ) {
			return EP_Admin::PAGE_TB;
		}
		if ( 'page' === $typenow && in_array( $pagenow, array( 'edit.php', 'post.php', 'post-new.php' ), true ) ) {
			return EP_Admin::PAGE_TB;
		}
		if ( in_array( $taxnow, array( EP_Contenu::TAX_THEME, EP_Contenu::TAX_GROUPE, EP_Contenu::TAX_TAG ), true ) ) {
			return EP_Admin::PAGE_TB;
		}
		return $parent;
	}

	public static function submenu_file( $submenu_file, $parent ) {
		global $pagenow, $typenow, $taxnow;
		if ( EP_Admin::PAGE_TB !== $parent ) {
			return $submenu_file;
		}
		/* « Gestion du site » ouvert depuis l'entrée Accueil : c'est elle qui s'allume. */
		if ( isset( $_GET['vue'] ) && 'accueil' === $_GET['vue'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return 'admin.php?page=' . EP_Admin::PAGE_TB . '&vue=accueil';
		}
		if ( in_array( $pagenow, array( 'upload.php', 'media-new.php' ), true ) ) {
			return 'upload.php';
		}
		if ( 'page' === $typenow ) {
			$id = isset( $_GET['post'] ) ? (int) $_GET['post'] : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return $id && $id === self::id_accueil() ? 'post.php?post=' . $id . '&action=edit' : 'edit.php?post_type=page';
		}
		if ( $taxnow ) {
			$type = EP_Contenu::TAX_GROUPE === $taxnow ? EP_Contenu::CPT_FAQ : EP_Contenu::CPT_CONSEIL;
			return 'edit-tags.php?taxonomy=' . $taxnow . '&post_type=' . $type;
		}
		return $submenu_file;
	}

	public static function assets( string $hook ): void {
		$base = plugins_url( 'assets/', EP_PLUGIN_FILE );
		wp_enqueue_style( 'ep-admin-menu', $base . 'admin-menu.css', array(), (string) filemtime( EP_PLUGIN_DIR . 'assets/admin-menu.css' ) );
		wp_add_inline_style( 'ep-admin-menu', EP_Projet::variables_css() );
		wp_add_inline_script(
			'jquery-core',
			"document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('#adminmenu .ep-menu-section').forEach(function(s){var li=s.closest('li');if(li){li.classList.add('ep-menu-section-item');}var a=s.closest('a');if(a){a.removeAttribute('href');a.setAttribute('aria-hidden','true');a.setAttribute('tabindex','-1');}});});"
		);
		$notres = array( EP_Admin::PAGE_TB, self::PAGE_NAVIGATION, self::PAGE_PUBLICATION, self::PAGE_MAINTENANCE, EP_Admin_Site::PAGE_HUB, EP_Admin_Site::PAGE_IDENTITE, EP_Admin_Site::PAGE_APPARENCE, EP_Admin_Site::PAGE_FOOTER, EP_Admin_Site::PAGE_SEO );
		$ici    = false;
		foreach ( $notres as $slug ) {
			if ( str_ends_with( $hook, $slug ) ) {
				$ici = true;
			}
		}
		if ( $ici ) {
			wp_enqueue_media();
			wp_enqueue_style( 'ep-admin', $base . 'admin.css', array(), (string) filemtime( EP_PLUGIN_DIR . 'assets/admin.css' ) );
			wp_enqueue_style( 'ep-admin-contenu', $base . 'admin-contenu.css', array(), (string) filemtime( EP_PLUGIN_DIR . 'assets/admin-contenu.css' ) );
			wp_enqueue_script( 'ep-admin-contenu', $base . 'admin-contenu.js', array(), (string) filemtime( EP_PLUGIN_DIR . 'assets/admin-contenu.js' ), true );
		}
	}

	/** « Aperçu » dans les listes de contenus : l'aperçu reconstruit. */
	public static function action_apercu_ligne( array $actions, WP_Post $post ): array {
		$types = array_merge( EP_Contenu::TYPES, array( 'page' ) );
		if ( ! in_array( $post->post_type, $types, true ) || ! current_user_can( 'edit_post', $post->ID ) ) {
			return $actions;
		}
		if ( 'page' === $post->post_type && ! in_array( $post->post_name, EP_Contenu::PAGES, true ) ) {
			return $actions;
		}
		unset( $actions['view'] );
		$actions['ep_apercu'] = '<a href="' . esc_url( EP_Publication::url_action_apercu( $post->ID ) ) . '" target="_blank" rel="noopener">Aperçu</a>';
		return $actions;
	}

	/* ------------------------------------------------------------ tableau de bord */

	/** La page d'accueil du menu : gestion du site pour qui édite, demandes pour qui gère. */
	public static function tableau_bord(): void {
		if ( ! current_user_can( 'edit_ep_contenus' ) && current_user_can( EP_Lead::CAP ) ) {
			EP_Admin_Tableau_Bord::rendre();
			return;
		}
		if ( ! current_user_can( 'edit_ep_contenus' ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
		self::gestion_du_site();
	}

	private static function compte( string $type ): array {
		$c = wp_count_posts( $type );
		return array( 'publies' => (int) ( $c->publish ?? 0 ), 'brouillons' => (int) ( $c->draft ?? 0 ) + (int) ( $c->pending ?? 0 ) );
	}

	/** Les cartes de navigation de la maquette, adaptées aux fonctions réelles. */
	private static function cartes(): array {
		$expertise = EP_Contenu::page( 'expertise' );
		return array(
			array( 'dashicons-admin-home', 'Accueil', 'Héros, sections et contenu principal', 'Éditer la page', self::url_accueil(), 'edit_pages', true ),
			array( 'dashicons-media-document', 'Conseils', 'Articles et guides de conseil', 'Gérer les conseils', admin_url( 'edit.php?post_type=' . EP_Contenu::CPT_CONSEIL ), 'edit_ep_contenus', false ),
			array( 'dashicons-admin-tools', 'Problèmes', 'Problèmes par type de parquet', 'Gérer les problèmes', admin_url( 'edit.php?post_type=' . EP_Contenu::CPT_PROBLEME ), 'edit_ep_contenus', false ),
			array( 'dashicons-format-chat', 'FAQ', 'Questions fréquentes et réponses', 'Gérer la FAQ', admin_url( 'edit.php?post_type=' . EP_Contenu::CPT_FAQ ), 'edit_ep_contenus', false ),
			array( 'dashicons-format-image', 'Médias', 'Médiathèque et visuels du site', 'Voir les médias', admin_url( 'upload.php' ), 'upload_files', false ),
			array( 'dashicons-edit', 'Pages', 'À propos, Diagnostic, Contact et hubs', 'Gérer les pages', admin_url( 'edit.php?post_type=page' ), 'edit_pages', false ),
			array( 'dashicons-chart-bar', 'Expertise', 'Page expertise et processus', 'Éditer la page', $expertise ? get_edit_post_link( $expertise->ID, 'raw' ) : admin_url( 'edit.php?post_type=page' ), 'edit_pages', false ),
			array( 'dashicons-admin-links', 'Navigation', 'Menu du site et bouton du header', 'Gérer le menu', EP_Admin::url_page( self::PAGE_NAVIGATION ), EP_Roles::CAP_NAVIGATION, false ),
			array( 'dashicons-admin-settings', 'Configuration du site', 'Identité, apparence, footer, SEO, publication', 'Ouvrir la configuration', EP_Admin::url_page( EP_Admin_Site::PAGE_HUB ), 'edit_ep_contenus', false ),
		);
	}

	public static function url_accueil(): string {
		return admin_url( 'admin.php?page=' . EP_Admin::PAGE_TB . '&vue=accueil' );
	}

	private static function gestion_du_site(): void {
		$accueil = EP_Contenu::page( 'accueil' );
		echo '<div class="wrap ep-ecran ep-gestion">';
		echo '<div class="ep-entete-page"><div><h1 class="wp-heading-inline">Gestion du site</h1><p class="ep-entete__sous-titre">Modifiez les contenus de votre site Expert Parquet depuis WordPress.</p></div>';
		if ( $accueil ) {
			printf( '<div class="ep-entete-page__actions"><a class="ep-lien-action" href="%s" target="_blank" rel="noopener">Voir la page <span class="dashicons dashicons-external" aria-hidden="true"></span></a></div>', esc_url( EP_Publication::url_action_apercu( $accueil->ID ) ) );
		}
		echo '</div><hr class="wp-header-end" style="display:none">';
		EP_Admin::afficher_message();
		self::messages();

		echo '<div class="ep-cartes-nav">';
		foreach ( self::cartes() as [$icone, $titre, $texte, $bouton, $url, $cap, $actif] ) {
			if ( ! current_user_can( $cap ) ) {
				continue;
			}
			printf(
				'<div class="ep-carte-nav%s"><span class="dashicons %s ep-carte-nav__icone" aria-hidden="true"></span><p class="ep-carte-nav__titre">%s</p><p class="ep-carte-nav__texte">%s</p><a class="ep-carte-nav__cta%s" href="%s">%s</a></div>',
				$actif ? ' ep-carte-nav--active' : '',
				esc_attr( $icone ),
				esc_html( $titre ),
				esc_html( $texte ),
				$actif ? ' ep-carte-nav__cta--plein' : '',
				esc_url( $url ),
				esc_html( $bouton )
			);
		}
		echo '</div>';

		if ( ! $accueil ) {
			echo '<p class="ep-avertissement">La page « Accueil » n’existe pas dans WordPress : créez une page dont l’adresse (slug) est <code>accueil</code>.</p></div>';
			return;
		}

		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="ep-gestion__grille">';
		wp_nonce_field( 'ep_accueil' );
		echo '<input type="hidden" name="action" value="ep_accueil"><input type="hidden" name="post_id" value="' . (int) $accueil->ID . '">';

		/* ------------------------------------------------ colonne principale */
		echo '<div class="ep-gestion__principal">';
		echo '<div class="ep-bloc">';
		echo '<div class="ep-bloc__entete"><div><h2 class="ep-bloc__titre">Édition de l’accueil</h2><p class="ep-bloc__sous-titre">Modifiez les différents blocs de la page d’accueil. Les changements sont visibles après publication.</p></div>';
		printf( '<a class="ep-bouton ep-bouton--contour" href="%s" target="_blank" rel="noopener">Voir la page <span class="dashicons dashicons-external" aria-hidden="true"></span></a></div>', esc_url( EP_Publication::url_action_apercu( $accueil->ID ) ) );
		self::sections_accueil( $accueil );
		echo '</div></div>';

		/* ------------------------------------------------ colonne droite */
		echo '<div class="ep-gestion__droite">';
		self::panneau_publication_accueil( $accueil );
		echo '</form>';
		EP_Maintenance::carte();
		echo '</div>';
		echo '</div>';
	}

	/* ------------------------------------------------------------ sections de l'accueil */

	private static function champ_texte( string $cle, string $libelle, string $valeur, bool $zone = false, string $classe = '' ): void {
		$id = 'ep-a-' . $cle;
		if ( $zone ) {
			printf( '<p class="ep-champ %s"><label for="%s">%s</label><textarea id="%s" name="ep_champs[%s]" rows="3">%s</textarea></p>', esc_attr( $classe ), esc_attr( $id ), esc_html( $libelle ), esc_attr( $id ), esc_attr( $cle ), esc_textarea( $valeur ) );
		} else {
			printf( '<p class="ep-champ %s"><label for="%s">%s</label><input type="text" id="%s" name="ep_champs[%s]" value="%s"></p>', esc_attr( $classe ), esc_attr( $id ), esc_html( $libelle ), esc_attr( $id ), esc_attr( $cle ), esc_attr( $valeur ) );
		}
	}

	/** Le champ « Lien » de la maquette : ici une destination fermée, affichée, jamais saisie. */
	private static function champ_action( string $libelle, string $destination ): void {
		printf( '<p class="ep-champ"><label>%s</label><span class="ep-action-fixe"><span class="dashicons dashicons-admin-links" aria-hidden="true"></span>%s</span></p>', esc_html( $libelle ), esc_html( $destination ) );
	}

	private static function section_ouvrir( string $icone, string $titre, bool $ouverte = true ): void {
		printf( '<details class="ep-section"%s><summary class="ep-section__entete"><span class="dashicons %s ep-section__icone" aria-hidden="true"></span><span class="ep-section__titre">%s</span><span class="dashicons dashicons-arrow-up-alt2 ep-section__chevron" aria-hidden="true"></span></summary><div class="ep-section__corps">', $ouverte ? ' open' : '', esc_attr( $icone ), esc_html( $titre ) );
	}

	private static function section_fermer(): void {
		echo '</div></details>';
	}

	private static function sections_accueil( WP_Post $accueil ): void {
		$v  = (array) get_post_meta( $accueil->ID, 'ep_champs', true );
		$c  = static fn( string $k ): string => (string) ( $v[ $k ] ?? '' );
		$id = $accueil->ID;

		/* Hero */
		self::section_ouvrir( 'dashicons-media-default', 'Section héros (bannière principale)' );
		echo '<div class="ep-section__deux">';
		echo '<div>';
		self::champ_texte( 'hero_titre', 'Titre principal', $c( 'hero_titre' ) );
		self::champ_texte( 'hero_sous_titre', 'Texte d’introduction', $c( 'hero_sous_titre' ), true );
		self::champ_texte( 'hero_lead', 'Texte d’accroche', $c( 'hero_lead' ), true );
		echo '<div class="ep-deux-champs">';
		self::champ_texte( 'hero_cta_principal', 'Texte du bouton principal', $c( 'hero_cta_principal' ) );
		self::champ_action( 'Action du bouton principal', 'Trouver mon parquet' );
		echo '</div><div class="ep-deux-champs">';
		self::champ_texte( 'hero_cta_secondaire', 'Texte du bouton secondaire', $c( 'hero_cta_secondaire' ) );
		self::champ_action( 'Action du bouton secondaire', 'Pré-diagnostic' );
		echo '</div></div>';
		echo '<div>';
		$thumb = (int) get_post_thumbnail_id( $id );
		echo '<div class="ep-image-bloc" data-ep-image>';
		echo '<div class="ep-image-bloc__entete"><span class="ep-champ__libelle">Image d’arrière-plan</span><span class="ep-image-bloc__actions"><button type="button" class="ep-bouton ep-bouton--contour ep-bouton--petit" data-ep-image-choisir><span class="dashicons dashicons-format-image" aria-hidden="true"></span>Remplacer l’image</button><button type="button" class="ep-bouton ep-bouton--danger ep-bouton--petit" data-ep-image-retirer aria-label="Retirer l’image"' . ( $thumb ? '' : ' hidden' ) . '><span class="dashicons dashicons-trash" aria-hidden="true"></span></button></span></div>';
		echo '<div class="ep-image-bloc__apercu ep-image__zone">' . ( $thumb ? wp_get_attachment_image( $thumb, 'large', false, array( 'class' => 'ep-image__apercu' ) ) : '<span class="ep-image-bloc__vide">Aucune image</span>' ) . '</div>';
		echo '<input type="hidden" name="image_id" value="' . $thumb . '" data-ep-image-id>';
		echo '<div class="ep-aide"><p class="ep-aide__titre">Conseils pour une image optimale</p><ul><li>Format recommandé : 1920 × 1080 px ou plus large</li><li>Image lumineuse et chaleureuse</li><li>Évitez les textes dans l’image (ils sont déjà dans le titre)</li></ul></div>';
		echo '</div></div></div>';
		self::section_fermer();

		/* Moteur */
		self::section_ouvrir( 'dashicons-search', 'Bloc – Trouver mon parquet / critères', false );
		echo '<div class="ep-section__deux">';
		echo '<div>';
		self::champ_texte( 'moteur_kicker', 'Surtitre', $c( 'moteur_kicker' ) );
		self::champ_texte( 'moteur_titre', 'Titre', $c( 'moteur_titre' ), true );
		self::champ_texte( 'moteur_bouton', 'Texte du bouton', $c( 'moteur_bouton' ) );
		echo '</div><div>';
		self::champ_texte( 'moteur_etape_1', 'Ligne 01', $c( 'moteur_etape_1' ) );
		self::champ_texte( 'moteur_etape_2', 'Ligne 02', $c( 'moteur_etape_2' ) );
		self::champ_texte( 'moteur_etape_3', 'Ligne 03', $c( 'moteur_etape_3' ) );
		echo '</div></div>';
		self::champ_texte( 'moteur_transparence', 'Texte de transparence Premibel / Over Parquet', $c( 'moteur_transparence' ), true );
		self::section_fermer();

		/* Problèmes */
		self::section_ouvrir( 'dashicons-admin-tools', 'Bloc – Problèmes fréquents', false );
		echo '<div class="ep-section__deux">';
		echo '<div>';
		self::champ_texte( 'problemes_kicker', 'Surtitre', $c( 'problemes_kicker' ) );
		self::champ_texte( 'problemes_titre', 'Titre', $c( 'problemes_titre' ) );
		self::champ_texte( 'problemes_lien', 'Lien « voir tout »', $c( 'problemes_lien' ) );
		echo '</div><div>';
		self::champ_texte( 'problemes_texte', 'Texte', $c( 'problemes_texte' ), true, 'ep-champ--haut' );
		echo '</div></div>';
		self::vignettes_mises_en_avant( EP_Contenu::CPT_PROBLEME, 4, 'Problèmes affichés', 'Gérer les problèmes', 'ep_accroche' );
		self::section_fermer();

		/* Conseils */
		self::section_ouvrir( 'dashicons-media-document', 'Bloc – Conseils', false );
		echo '<div class="ep-section__deux">';
		echo '<div>';
		self::champ_texte( 'conseils_kicker', 'Surtitre', $c( 'conseils_kicker' ) );
		self::champ_texte( 'conseils_titre', 'Titre', $c( 'conseils_titre' ) );
		self::champ_texte( 'conseils_lien', 'Lien « voir tout »', $c( 'conseils_lien' ) );
		echo '</div><div>';
		self::champ_texte( 'conseils_texte', 'Texte', $c( 'conseils_texte' ), true, 'ep-champ--haut' );
		echo '</div></div>';
		self::vignettes_mises_en_avant( EP_Contenu::CPT_CONSEIL, 3, 'Conseils affichés', 'Gérer les conseils', 'excerpt' );
		self::section_fermer();

		/* Expertise */
		self::section_ouvrir( 'dashicons-chart-bar', 'Bloc – Expertise', false );
		echo '<div class="ep-section__deux">';
		echo '<div>';
		self::champ_texte( 'expertise_kicker', 'Surtitre', $c( 'expertise_kicker' ) );
		self::champ_texte( 'expertise_titre', 'Titre', $c( 'expertise_titre' ) );
		echo '<div class="ep-deux-champs">';
		self::champ_texte( 'expertise_bouton', 'Texte du bouton', $c( 'expertise_bouton' ) );
		self::champ_action( 'Action du bouton', 'Demande d’expertise' );
		echo '</div>';
		self::champ_texte( 'expertise_lien', 'Texte du lien (→ déroulement)', $c( 'expertise_lien' ) );
		echo '</div><div>';
		self::champ_texte( 'expertise_texte', 'Texte', $c( 'expertise_texte' ), true, 'ep-champ--haut' );
		echo '</div></div>';
		self::section_fermer();

		/* FAQ */
		self::section_ouvrir( 'dashicons-format-chat', 'Bloc – Questions fréquentes', false );
		echo '<div class="ep-section__deux"><div>';
		self::champ_texte( 'faq_kicker', 'Surtitre', $c( 'faq_kicker' ) );
		self::champ_texte( 'faq_titre', 'Titre', $c( 'faq_titre' ) );
		echo '</div><div>';
		self::champ_texte( 'faq_lien', 'Lien « voir toute la FAQ »', $c( 'faq_lien' ) );
		echo '</div></div>';
		$faq = get_posts( array( 'post_type' => EP_Contenu::CPT_FAQ, 'post_status' => 'publish', 'posts_per_page' => -1, 'orderby' => 'menu_order', 'order' => 'ASC', 'tax_query' => array( array( 'taxonomy' => EP_Contenu::TAX_GROUPE, 'field' => 'slug', 'terms' => 'accueil' ) ) ) );
		printf( '<p class="ep-liste-titre">Questions affichées (%d) <a href="%s">Gérer la FAQ <span aria-hidden="true">→</span></a></p>', count( $faq ), esc_url( admin_url( 'edit.php?post_type=' . EP_Contenu::CPT_FAQ ) ) );
		if ( $faq ) {
			echo '<ol class="ep-liste-faq">';
			foreach ( $faq as $q ) {
				printf( '<li><a href="%s">%s</a></li>', esc_url( get_edit_post_link( $q->ID, 'raw' ) ), esc_html( wp_strip_all_tags( $q->post_title ) ) );
			}
			echo '</ol>';
		}
		self::section_fermer();
	}

	/** Les contenus « mis en avant », comme des vignettes, dans l'ordre affiché sur le site. */
	private static function vignettes_mises_en_avant( string $type, int $n, string $titre, string $gerer, string $champ_texte ): void {
		$posts = get_posts( array( 'post_type' => $type, 'post_status' => 'publish', 'posts_per_page' => -1, 'meta_key' => 'ep_featured', 'meta_value' => '1', 'orderby' => 'menu_order', 'order' => 'ASC' ) );
		usort( $posts, static fn( $a, $b ) => ( (int) get_post_meta( $a->ID, 'ep_featured_order', true ) ?: 99 ) <=> ( (int) get_post_meta( $b->ID, 'ep_featured_order', true ) ?: 99 ) );
		$posts = array_slice( $posts, 0, $n );
		printf( '<p class="ep-liste-titre">%s (%d) <a href="%s">%s <span aria-hidden="true">→</span></a></p>', esc_html( $titre ), count( $posts ), esc_url( admin_url( 'edit.php?post_type=' . $type ) ), esc_html( $gerer ) );
		if ( ! $posts ) {
			echo '<p class="description">Aucun contenu marqué « mis en avant » : le site complète automatiquement avec les plus récents.</p>';
			return;
		}
		echo '<div class="ep-vignettes">';
		foreach ( $posts as $p ) {
			$image = (int) get_post_meta( $p->ID, 'ep_image_vignette', true ) ?: (int) get_post_thumbnail_id( $p->ID );
			$texte = 'excerpt' === $champ_texte ? $p->post_excerpt : (string) get_post_meta( $p->ID, $champ_texte, true );
			$label = (string) get_post_meta( $p->ID, 'ep_label_court', true ) ?: (string) get_post_meta( $p->ID, 'ep_titre_court', true ) ?: $p->post_title;
			printf(
				'<a class="ep-vignette" href="%s"><span class="ep-vignette__media">%s</span><span class="ep-vignette__titre">%s</span><span class="ep-vignette__texte">%s</span></a>',
				esc_url( get_edit_post_link( $p->ID, 'raw' ) ),
				$image ? wp_get_attachment_image( $image, 'medium' ) : '',
				esc_html( wp_strip_all_tags( $label ) ),
				esc_html( wp_strip_all_tags( $texte ) )
			);
		}
		echo '</div>';
	}

	/* ------------------------------------------------------------ panneau publication */

	private static function panneau_publication_accueil( WP_Post $accueil ): void {
		$auteur   = get_the_modified_author() ?: get_userdata( (int) $accueil->post_author )?->display_name;
		$derniere = EP_Publication::derniere_reussie();
		$attente  = EP_Publication::en_attente();
		echo '<div class="ep-panneau"><h2 class="ep-panneau__titre">Publication de l’accueil</h2>';
		printf(
			'<p class="ep-statut"><span class="ep-pastille ep-pastille--ok"></span> Statut actuel : <span class="ep-badge-statut">%s</span></p>',
			esc_html( 'publish' === $accueil->post_status ? 'Publié' : get_post_status_object( $accueil->post_status )->label )
		);
		printf(
			'<p class="ep-panneau__meta">Dernière modification : %s<br>par %s</p>',
			esc_html( wp_date( 'j M Y \à H:i', get_post_modified_time( 'U', false, $accueil ) ) ),
			esc_html( $auteur ?: '—' )
		);
		echo '<button type="submit" class="ep-bouton ep-bouton--plein ep-bouton--bloc">Mettre à jour la page</button>';
		printf( '<a class="ep-bouton ep-bouton--contour ep-bouton--bloc" href="%s" target="_blank" rel="noopener">Voir la page publique <span class="dashicons dashicons-external" aria-hidden="true"></span></a>', esc_url( EP_Publication::url_action_apercu( $accueil->ID ) ) );
		if ( current_user_can( EP_Roles::CAP_PUBLIER ) ) {
			printf(
				'<p class="ep-panneau__site">%s <a href="%s">Publier le site <span aria-hidden="true">→</span></a></p>',
				$attente
					? esc_html( sprintf( '%d contenu%s en attente de mise en ligne.', count( $attente ), count( $attente ) > 1 ? 's' : '' ) )
					: ( $derniere ? esc_html( 'Site public à jour (' . wp_date( 'j M \à H:i', strtotime( $derniere['fin'] ) ) . ').' ) : 'Le site public se met à jour à la publication.' ),
				esc_url( EP_Admin::url_page( self::PAGE_PUBLICATION ) )
			);
		}
		echo '</div>';
	}

	/** Enregistre les champs de l'accueil saisis depuis « Gestion du site ». */
	public static function action_accueil(): void {
		$id = isset( $_POST['post_id'] ) ? (int) $_POST['post_id'] : 0;
		if ( ! $id || ! current_user_can( 'edit_post', $id ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
		check_admin_referer( 'ep_accueil' );
		$p = wp_unslash( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$def = array();
		foreach ( EP_Champs::champs_page( 'accueil' ) as $liste ) {
			foreach ( $liste as [$cle, , $t] ) {
				$def[ $cle ] = $t;
			}
		}
		$valeurs = (array) get_post_meta( $id, 'ep_champs', true );
		foreach ( (array) ( $p['ep_champs'] ?? array() ) as $cle => $v ) {
			if ( isset( $def[ $cle ] ) ) {
				$valeurs[ $cle ] = 'html' === $def[ $cle ] ? EP_Champs::html_propre( (string) $v ) : EP_Champs::texte_propre( (string) $v );
			}
		}
		update_post_meta( $id, 'ep_champs', $valeurs );
		$image = (int) ( $p['image_id'] ?? 0 );
		if ( $image > 0 ) {
			set_post_thumbnail( $id, $image );
		} else {
			delete_post_thumbnail( $id );
		}
		/* La date de modification suit, et les révisions aussi. */
		wp_update_post( array( 'ID' => $id ) );
		wp_safe_redirect( add_query_arg( 'ep_msg', 'accueil', self::url_accueil() ) );
		exit;
	}

	/* ------------------------------------------------------------ publication */

	/**
	 * L'état de la publication, en clair : à jour ou en attente, date de la
	 * dernière mise en ligne, nombre de pages, bouton Publier. Pas de jargon
	 * technique. `$compact` : variante pour un rail (ajoute un lien Détails).
	 */
	public static function bloc_publication( bool $compact = false ): void {
		$etat     = EP_Publication::etat();
		$derniere = EP_Publication::derniere_reussie();
		$motif    = EP_Publication::indisponible();
		$attente  = EP_Publication::en_attente();
		$a_jour   = $derniere && ! $attente && ! EP_Publication::configuration_en_attente();

		echo '<div class="ep-panneau"><h2 class="ep-panneau__titre"><span class="dashicons dashicons-upload" aria-hidden="true"></span>Publication du site</h2>';
		if ( $a_jour ) {
			echo '<p class="ep-statut"><span class="ep-pastille ep-pastille--ok"></span> État : <span class="ep-etiquette ep-etiquette--ok">Site à jour</span></p>';
		} else {
			echo '<p class="ep-statut"><span class="ep-pastille ep-pastille--actif"></span> État : <span class="ep-etiquette ep-etiquette--actif">Modifications en attente</span></p>';
		}
		if ( $etat && 'site' === ( $etat['mode'] ?? '' ) && empty( $etat['ok'] ) ) {
			printf( '<p class="ep-statut"><span class="ep-pastille ep-pastille--echec"></span> Dernière tentative en échec : %s</p>', esc_html( $etat['message'] ?? '' ) );
		}
		echo '<dl class="ep-pub-faits">';
		printf( '<div><dt>Dernière publication</dt><dd>%s</dd></div>', $derniere ? esc_html( wp_date( 'd/m/Y \à H\hi', strtotime( $derniere['fin'] ) ) ) : 'Jamais depuis WordPress' );
		printf( '<div><dt>Pages</dt><dd>%s</dd></div>', $derniere ? (int) $derniere['pages'] : '—' );
		echo '</dl>';

		if ( $motif ) {
			echo '<p class="ep-info"><span class="dashicons dashicons-info-outline" aria-hidden="true"></span><span>' . esc_html( $motif ) . '</span></p>';
		} elseif ( current_user_can( EP_Roles::CAP_PUBLIER ) ) {
			echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" data-ep-confirmer="Publier le site maintenant ? Le site public sera mis à jour à partir de vos contenus publiés.">';
			wp_nonce_field( 'ep_publier' );
			echo '<input type="hidden" name="action" value="ep_publier">';
			echo '<button type="submit" class="ep-bouton ep-bouton--plein ep-bouton--bloc">Publier le site</button>';
			if ( $compact ) {
				printf( '<a class="ep-bouton ep-bouton--bloc" href="%s">Détails</a>', esc_url( EP_Admin::url_page( self::PAGE_PUBLICATION ) ) );
			}
			echo '</form>';
		}
		echo '<p class="ep-panneau__note">Vos modifications restent en attente jusqu’à ce que vous publiiez le site.</p>';
		echo '</div>';
	}

	public static function ecran_publication(): void {
		if ( ! current_user_can( EP_Roles::CAP_PUBLIER ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
		echo '<div class="wrap ep-ecran ep-gestion"><div class="ep-entete-page"><div><h1 class="wp-heading-inline">Publication du site</h1><p class="ep-entete__sous-titre">Mettez le site public à jour avec vos derniers contenus.</p></div>';
		$accueil = EP_Contenu::page( 'accueil' );
		if ( $accueil ) {
			printf( '<div class="ep-entete-page__actions"><a class="ep-lien-action" href="%s" target="_blank" rel="noopener">Prévisualiser <span class="dashicons dashicons-external" aria-hidden="true"></span></a></div>', esc_url( EP_Publication::url_action_apercu( $accueil->ID ) ) );
		}
		echo '</div><hr class="wp-header-end" style="display:none">';
		self::messages();
		echo '<div class="ep-gestion__grille"><div class="ep-gestion__principal">';
		self::bloc_publication( false );

		$attente = EP_Publication::en_attente();
		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">Contenus en attente de publication</h2><div style="margin-top:12px">';
		if ( ! $attente ) {
			echo '<p class="ep-vide-etat">Rien en attente : tout ce qui est publié dans WordPress est déjà sur le site.</p>';
		} else {
			echo '<ul class="ep-actions-rapides">';
			foreach ( $attente as $p ) {
				printf( '<li><a href="%s">%s</a> <span class="ep-date">— %s</span></li>', esc_url( get_edit_post_link( $p->ID, 'raw' ) ), esc_html( wp_strip_all_tags( $p->post_title ) ), esc_html( mysql2date( 'd/m H\hi', $p->post_modified ) ) );
			}
			echo '</ul>';
		}
		echo '</div></div>';

		/* Historique : la dernière exécution, repliée, pour qui veut vérifier. */
		$etat = EP_Publication::etat();
		if ( $etat && ! empty( $etat['journal'] ) ) {
			echo '<details class="ep-bloc ep-avance"><summary class="ep-avance__resume"><span class="dashicons dashicons-arrow-down-alt2 ep-pli__chevron" aria-hidden="true"></span><span><span class="ep-bloc__titre">Historique de la dernière publication</span><span class="ep-bloc__sous-titre">Le détail de la dernière exécution.</span></span></summary><div class="ep-avance__corps"><pre class="ep-journal">' . esc_html( implode( "\n", (array) $etat['journal'] ) ) . '</pre></div></details>';
		}

		echo '</div><div class="ep-gestion__droite">';
		EP_Maintenance::carte();
		echo '</div></div></div>';
	}

	/* ------------------------------------------------------------ navigation */

	public static function ecran_navigation(): void {
		EP_Admin_Site::ecran_navigation();
	}

	public static function ecran_navigation_ancien(): void {
		if ( ! current_user_can( EP_Roles::CAP_NAVIGATION ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
		$nav     = EP_Export::navigation();
		$defauts = array();
		foreach ( EP_Export::navigation_defaut() as $d ) {
			$defauts[ $d['key'] ] = $d['label'];
		}
		$cta = (string) get_option( 'ep_header_cta', 'Trouver mon parquet' );

		echo '<div class="wrap ep-ecran"><h1 class="wp-heading-inline">Navigation</h1><hr class="wp-header-end">';
		self::messages();
		echo '<p class="ep-entete__sous-titre">Le menu principal du site. Les destinations sont fixes (le design du header reste dans le code) ; vous réglez le libellé, l’ordre et la visibilité de chacune.</p>';
		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
		wp_nonce_field( 'ep_navigation' );
		echo '<input type="hidden" name="action" value="ep_navigation">';
		echo '<div class="ep-carte"><h2 class="ep-carte__titre">Entrées du menu</h2><div class="ep-carte__corps">';
		echo '<table class="widefat striped ep-table-nav"><thead><tr><th scope="col" style="width:30%">Destination</th><th scope="col">Libellé affiché</th><th scope="col" style="width:90px">Ordre</th><th scope="col" style="width:90px">Visible</th></tr></thead><tbody>';
		foreach ( $nav as $n ) {
			$k = $n['key'];
			printf(
				'<tr><td><code>%1$s</code><br><span class="description">%2$s</span></td>'
				. '<td><label class="screen-reader-text" for="nav-%1$s">Libellé</label><input type="text" id="nav-%1$s" name="nav[%1$s][label]" value="%3$s"></td>'
				. '<td><label class="screen-reader-text" for="ordre-%1$s">Ordre</label><input type="number" id="ordre-%1$s" name="nav[%1$s][ordre]" value="%4$d" min="1" max="20" style="width:70px"></td>'
				. '<td><input type="checkbox" name="nav[%1$s][visible]" value="1"%5$s aria-label="Visible"></td></tr>',
				esc_attr( $k ),
				esc_html( $defauts[ $k ] ?? '' ),
				esc_attr( $n['label'] ),
				(int) $n['ordre'],
				checked( $n['visible'] !== false, true, false )
			);
		}
		echo '</tbody></table>';
		echo '</div></div>';
		echo '<div class="ep-carte"><h2 class="ep-carte__titre">Bouton du header</h2><div class="ep-carte__corps">';
		printf( '<p class="ep-champ"><label for="ep-cta">Libellé du bouton (→ Trouver mon parquet)</label><input type="text" id="ep-cta" name="header_cta" value="%s" class="regular-text"><span class="description">La destination est fixe : la page du moteur « Trouver mon parquet ».</span></p>', esc_attr( $cta ) );
		echo '</div></div>';
		submit_button( 'Enregistrer la navigation' );
		echo '</form><p class="description">Les changements s’appliquent au prochain « Publier le site ».</p></div>';
	}

	public static function action_navigation(): void {
		if ( ! current_user_can( EP_Roles::CAP_NAVIGATION ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
		check_admin_referer( 'ep_navigation' );
		$p   = wp_unslash( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$nav = array();
		foreach ( EP_Export::navigation_defaut() as $d ) {
			$k = $d['key'];
			$e = isset( $p['nav'][ $k ] ) && is_array( $p['nav'][ $k ] ) ? $p['nav'][ $k ] : array();
			$nav[] = array(
				'key'     => $k,
				'label'   => EP_Champs::texte_propre( (string) ( $e['label'] ?? '' ) ) ?: $d['label'],
				'ordre'   => max( 1, min( 20, (int) ( $e['ordre'] ?? $d['ordre'] ) ) ),
				'visible' => ! empty( $e['visible'] ),
			);
		}
		update_option( 'ep_navigation', $nav, true );
		update_option( 'ep_header_cta', EP_Champs::texte_propre( (string) ( $p['header_cta'] ?? '' ) ) ?: 'Trouver mon parquet', true );
		wp_safe_redirect( add_query_arg( 'ep_msg', 'navigation', EP_Admin::url_page( self::PAGE_NAVIGATION ) ) );
		exit;
	}

	/* ------------------------------------------------------------ messages */

	public static function messages(): void {
		$m      = isset( $_GET['ep_msg'] ) ? sanitize_key( (string) $_GET['ep_msg'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$textes = array(
			'navigation'              => array( 'success', 'Navigation enregistrée. Publiez le site pour l’appliquer.' ),
			'accueil'                 => array( 'success', 'Page d’accueil mise à jour. Publiez le site pour la mettre en ligne.' ),
			'publie'                  => array( 'success', 'Site publié.' ),
			'publication_echec'       => array( 'error', 'La publication a échoué : le site précédent est resté en place. Voir le journal ci-dessous.' ),
			'maintenance_enregistree' => array( 'success', 'Page de maintenance enregistrée.' ),
			'maintenance_on'          => array( 'warning', 'Maintenance activée : le public voit désormais la page de maintenance.' ),
			'maintenance_off'         => array( 'success', 'Maintenance désactivée : le site public est de nouveau servi.' ),
			'maintenance_erreur'      => array( 'error', 'La maintenance n’a pas pu être appliquée (écriture impossible à la racine du site).' ),
		);
		if ( isset( $textes[ $m ] ) ) {
			printf( '<div class="notice notice-%s is-dismissible"><p>%s</p></div>', esc_attr( $textes[ $m ][0] ), esc_html( $textes[ $m ][1] ) );
		}
	}

	/** Rappel après publication d'un contenu : il faut encore publier le site. */
	public static function avis(): void {
		$ecran = get_current_screen();
		if ( ! $ecran || 'post' !== $ecran->base || ! in_array( $ecran->post_type, array_merge( EP_Contenu::TYPES, array( 'page' ) ), true ) ) {
			return;
		}
		if ( ! current_user_can( EP_Roles::CAP_PUBLIER ) || ! EP_Publication::en_attente() ) {
			return;
		}
		printf(
			'<div class="notice notice-info"><p>Des contenus publiés ne sont pas encore sur le site public. <a href="%s">Publier le site</a></p></div>',
			esc_url( EP_Admin::url_page( self::PAGE_PUBLICATION ) )
		);
	}
}
