<?php
/**
 * Les écrans « Configuration du site » : hub, Identité, Apparence, Navigation,
 * Footer, SEO. Même langage visuel que « Gestion du site » (admin-contenu.css),
 * aucun constructeur : des champs, des listes, des sélecteurs fermés.
 *
 * Structure commune à chaque écran : en-tête (titre, sous-titre court,
 * « Prévisualiser ↗ »), colonne principale en panneaux, rail droit
 * « Modifications » (Enregistrer, Prévisualiser, rappel de publication).
 *
 * Droits : Identité, Apparence et SEO exigent `ep_configurer_site`
 * (administrateur). Navigation et Footer exigent `ep_gerer_navigation`
 * (éditeur de contenu et administrateur). Aucun réglage technique (secrets,
 * chemins, commandes) n'est ici : ils restent dans wp-config.php et dans
 * l'écran Réglages, en lecture seule.
 */

defined( 'ABSPATH' ) || exit;

class EP_Admin_Site {

	public const CAP = 'ep_configurer_site';

	public const PAGE_HUB       = 'expert-parquet-site';
	public const PAGE_IDENTITE  = 'expert-parquet-identite';
	public const PAGE_APPARENCE = 'expert-parquet-apparence';
	public const PAGE_FOOTER    = 'expert-parquet-footer';
	public const PAGE_SEO       = 'expert-parquet-seo';

	/** Icônes d'administration (Dashicons) pour la bibliothèque fermée d'icônes du site. */
	private const ICONES_ADMIN = array(
		'instagram' => 'dashicons-instagram',
		'facebook'  => 'dashicons-facebook-alt',
		'linkedin'  => 'dashicons-linkedin',
		'youtube'   => 'dashicons-youtube',
		'email'     => 'dashicons-email',
		'telephone' => 'dashicons-phone',
		'externe'   => 'dashicons-external',
	);

	public static function init(): void {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ), 21 );
		foreach ( array( 'identite', 'apparence', 'navigation', 'footer', 'seo' ) as $ecran ) {
			add_action( 'admin_post_ep_site_' . $ecran, array( __CLASS__, 'action_' . $ecran ) );
		}
	}

	public static function menu(): void {
		$tb = EP_Admin::PAGE_TB;
		add_submenu_page( $tb, 'Configuration du site — ' . EP_Projet::nom(), 'Configuration', 'edit_ep_contenus', self::PAGE_HUB, array( __CLASS__, 'ecran_hub' ) );
		add_submenu_page( $tb, 'Identité — ' . EP_Projet::nom(), 'Identité', self::CAP, self::PAGE_IDENTITE, array( __CLASS__, 'ecran_identite' ) );
		add_submenu_page( $tb, 'Apparence — ' . EP_Projet::nom(), 'Apparence', self::CAP, self::PAGE_APPARENCE, array( __CLASS__, 'ecran_apparence' ) );
		add_submenu_page( $tb, 'Footer — ' . EP_Projet::nom(), 'Footer', EP_Roles::CAP_NAVIGATION, self::PAGE_FOOTER, array( __CLASS__, 'ecran_footer' ) );
		add_submenu_page( $tb, 'SEO — ' . EP_Projet::nom(), 'SEO', self::CAP, self::PAGE_SEO, array( __CLASS__, 'ecran_seo' ) );
	}

	/* ------------------------------------------------------------ outils */

	private static function exiger( string $cap ): void {
		if ( ! current_user_can( $cap ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
	}

	private static function url_apercu(): string {
		$accueil = EP_Contenu::page( 'accueil' );
		return $accueil ? EP_Publication::url_action_apercu( $accueil->ID ) : '';
	}

	/**
	 * En-tête commun : titre, sous-titre court, « Prévisualiser ↗ ». Avec
	 * `$action`, ouvre le formulaire et la grille principale + rail.
	 */
	private static function ouvrir( string $titre, string $sous_titre, string $action = '' ): void {
		echo '<div class="wrap ep-ecran ep-gestion">';
		echo '<div class="ep-entete-page"><div><h1 class="wp-heading-inline">' . esc_html( $titre ) . '</h1><p class="ep-entete__sous-titre">' . esc_html( $sous_titre ) . '</p></div>';
		$apercu = self::url_apercu();
		if ( $apercu ) {
			printf( '<div class="ep-entete-page__actions"><a class="ep-lien-action" href="%s" target="_blank" rel="noopener">Prévisualiser <span class="dashicons dashicons-external" aria-hidden="true"></span></a></div>', esc_url( $apercu ) );
		}
		echo '</div><hr class="wp-header-end" style="display:none">';
		self::messages();
		if ( $action ) {
			echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="ep-gestion__grille ep-gestion__grille--config">';
			wp_nonce_field( 'ep_site_' . $action );
			echo '<input type="hidden" name="action" value="ep_site_' . esc_attr( $action ) . '">';
			echo '<div class="ep-gestion__principal">';
		}
	}

	/**
	 * Rail droit commun : panneau « Modifications » (Enregistrer, Prévisualiser,
	 * rappel de publication). `$avant` : HTML d'un panneau placé au-dessus.
	 */
	private static function rail( string $aide = '', string $avant = '' ): void {
		echo '</div><div class="ep-gestion__droite">' . $avant; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '<div class="ep-panneau"><h2 class="ep-panneau__titre"><span class="dashicons dashicons-saved" aria-hidden="true"></span>Modifications</h2>';
		if ( $aide ) {
			echo '<p class="ep-panneau__texte">' . esc_html( $aide ) . '</p>';
		}
		echo '<div class="ep-panneau__actions"><button type="submit" class="ep-bouton ep-bouton--plein ep-bouton--bloc">Enregistrer</button>';
		$apercu = self::url_apercu();
		if ( $apercu ) {
			printf( '<a class="ep-bouton ep-bouton--bloc" href="%s" target="_blank" rel="noopener">Prévisualiser le site <span class="dashicons dashicons-external" aria-hidden="true"></span></a>', esc_url( $apercu ) );
		}
		echo '</div>';
		if ( current_user_can( EP_Roles::CAP_PUBLIER ) ) {
			printf( '<p class="ep-panneau__note">Les changements seront visibles après publication du site. <a href="%s">Publier le site <span aria-hidden="true">→</span></a></p>', esc_url( EP_Admin::url_page( EP_Admin_Contenu::PAGE_PUBLICATION ) ) );
		} else {
			echo '<p class="ep-panneau__note">Les changements seront visibles après publication du site.</p>';
		}
		echo '</div></div></form></div>';
	}

	private static function texte( string $nom, string $libelle, string $valeur, string $aide = '', bool $zone = false ): void {
		$id = 'ep-s-' . sanitize_key( $nom );
		if ( $zone ) {
			printf( '<p class="ep-champ"><label for="%s">%s</label><textarea id="%s" name="%s" rows="3">%s</textarea>%s</p>', esc_attr( $id ), esc_html( $libelle ), esc_attr( $id ), esc_attr( $nom ), esc_textarea( $valeur ), $aide ? '<span class="description">' . esc_html( $aide ) . '</span>' : '' );
		} else {
			printf( '<p class="ep-champ"><label for="%s">%s</label><input type="text" id="%s" name="%s" value="%s">%s</p>', esc_attr( $id ), esc_html( $libelle ), esc_attr( $id ), esc_attr( $nom ), esc_attr( $valeur ), $aide ? '<span class="description">' . esc_html( $aide ) . '</span>' : '' );
		}
	}

	private static function case( string $nom, string $libelle, bool $coche, string $aide = '' ): void {
		printf( '<p class="ep-champ ep-champ--case"><label><input type="checkbox" name="%s" value="1"%s> %s</label>%s</p>', esc_attr( $nom ), checked( $coche, true, false ), esc_html( $libelle ), $aide ? '<span class="description">' . esc_html( $aide ) . '</span>' : '' );
	}

	private static function select( string $nom, string $libelle, array $options, string $valeur, string $aide = '' ): void {
		$h = sprintf( '<p class="ep-champ"><label for="%1$s">%2$s</label><select id="%1$s" name="%3$s">', esc_attr( 'ep-s-' . sanitize_key( $nom ) ), esc_html( $libelle ), esc_attr( $nom ) );
		foreach ( $options as $k => $lib ) {
			$h .= sprintf( '<option value="%s"%s>%s</option>', esc_attr( (string) $k ), selected( (string) $k, $valeur, false ), esc_html( $lib ) );
		}
		echo $h . '</select>' . ( $aide ? '<span class="description">' . esc_html( $aide ) . '</span>' : '' ) . '</p>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Une carte média : aperçu, nom du fichier et dimensions, Remplacer /
	 * Supprimer. `$variante` : '' | 'sombre' (fond sombre) | 'carre' (favicon).
	 * Le champ caché porte l'identifiant ; il n'est jamais affiché.
	 */
	private static function media( string $nom, string $libelle, int $id, string $aide, string $variante = '', string $repli = '' ): void {
		$img   = $id ? wp_get_attachment_image( $id, 'medium', false, array( 'class' => 'ep-image__apercu' ) ) : '';
		$meta  = $id ? wp_get_attachment_metadata( $id ) : array();
		$fich  = $id ? basename( (string) get_attached_file( $id ) ) : '';
		$dims  = ! empty( $meta['width'] ) ? (int) $meta['width'] . ' × ' . (int) $meta['height'] . ' px' : '';
		$infos = $id
			? '<span class="ep-media-carte__nom" data-ep-image-nom>' . esc_html( $fich ) . '</span><span class="ep-media-carte__dims" data-ep-image-dims>' . esc_html( $dims ) . '</span>'
			: '<span class="ep-media-carte__nom" data-ep-image-nom></span><span class="ep-media-carte__dims" data-ep-image-dims></span><span class="ep-media-carte__repli" data-ep-image-repli>' . esc_html( $repli ?: 'Aucune image choisie.' ) . '</span>';
		printf(
			'<div class="ep-media-carte%7$s" data-ep-image data-ep-image-repli-texte="%9$s"><span class="ep-media-carte__libelle">%2$s</span><div class="ep-image__zone ep-media-carte__apercu">%3$s</div><div class="ep-media-carte__infos">%10$s</div><div class="ep-media-carte__actions"><button type="button" class="ep-bouton ep-bouton--petit" data-ep-image-choisir><span class="dashicons dashicons-format-image" aria-hidden="true"></span><span data-ep-image-libelle>%5$s</span></button><button type="button" class="ep-bouton ep-bouton--danger ep-bouton--petit" data-ep-image-retirer aria-label="Supprimer"%6$s><span class="dashicons dashicons-trash" aria-hidden="true"></span>Supprimer</button></div><p class="ep-media-carte__aide">%4$s</p><input type="hidden" name="%1$s" value="%8$d" data-ep-image-id></div>',
			esc_attr( $nom ),
			esc_html( $libelle ),
			$img ?: '<span class="ep-media-carte__vide">Aucune image</span>', // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			esc_html( $aide ),
			$id ? 'Remplacer' : 'Choisir',
			$id ? '' : ' hidden',
			$variante ? ' ep-media-carte--' . esc_attr( $variante ) : '',
			$id,
			esc_attr( $repli ?: 'Aucune image choisie.' ),
			$infos // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		);
	}

	private static function messages(): void {
		$m = isset( $_GET['ep_msg'] ) ? sanitize_key( (string) $_GET['ep_msg'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( 'site_enregistre' === $m ) {
			echo '<div class="notice notice-success is-dismissible"><p>Configuration enregistrée. Prévisualisez, puis publiez le site pour l’appliquer.</p></div>';
		}
		$erreurs = get_transient( 'ep_site_erreurs_' . get_current_user_id() );
		if ( $erreurs ) {
			delete_transient( 'ep_site_erreurs_' . get_current_user_id() );
			echo '<div class="notice notice-error"><p><strong>Certaines valeurs ont été refusées et n’ont pas été enregistrées :</strong></p><ul style="list-style:disc;margin-left:2em">';
			foreach ( (array) $erreurs as $e ) {
				echo '<li>' . esc_html( $e ) . '</li>';
			}
			echo '</ul></div>';
		}
	}

	private static function terminer( string $page, array $erreurs ): void {
		if ( $erreurs ) {
			set_transient( 'ep_site_erreurs_' . get_current_user_id(), $erreurs, 5 * MINUTE_IN_SECONDS );
		}
		EP_Site::marquer_modifie();
		wp_safe_redirect( add_query_arg( 'ep_msg', 'site_enregistre', EP_Admin::url_page( $page ) ) );
		exit;
	}

	/** Le libellé lisible d'une destination de lien, et son chemin. */
	private static function destination_lisible( array $l ): array {
		$type = (string) ( $l['type'] ?? 'page' );
		$dest = (string) ( $l['destination'] ?? '' );
		switch ( $type ) {
			case 'page':
				$p = EP_Site::pages_internes()[ $dest ] ?? null;
				return array( $p ? $p[1] : $dest, $p ? '/' . $p[0] : '' );
			case 'parcours':
				return array( EP_Site::parcours()[ $dest ] ?? $dest, '' );
			case 'partenaire':
				$p = EP_Site::partenaires()[ $dest ] ?? null;
				return array( $p ? $p[0] : $dest, '' );
			case 'email':
				return array( $dest, 'mailto:' );
			case 'telephone':
				return array( $dest, 'tel:' );
			default:
				return array( $dest, '' );
		}
	}

	private static function icone_admin( string $icone, bool $vide_si_absente = true ): string {
		if ( isset( self::ICONES_ADMIN[ $icone ] ) ) {
			return '<span class="ep-lien__icone" title="' . esc_attr( EP_Site::icones()[ $icone ] ?? $icone ) . '"><span class="dashicons ' . esc_attr( self::ICONES_ADMIN[ $icone ] ) . '" aria-hidden="true"></span></span>';
		}
		return $vide_si_absente ? '<span class="ep-lien__icone ep-lien__icone--vide" aria-hidden="true"><span class="dashicons dashicons-minus"></span></span>' : '';
	}

	/* ------------------------------------------------------------ hub */

	public static function cartes(): array {
		$etat     = EP_Publication::derniere_reussie();
		$maint    = EP_Maintenance::actif();
		$cartes   = array(
			array( 'dashicons-id-alt', 'Identité', 'Logo, favicon et informations de marque.', 'Modifier l’identité', EP_Admin::url_page( self::PAGE_IDENTITE ), self::CAP ),
			array( 'dashicons-art', 'Apparence', 'Accent visuel de la marque.', 'Modifier l’apparence', EP_Admin::url_page( self::PAGE_APPARENCE ), self::CAP ),
			array( 'dashicons-menu-alt', 'Navigation', 'Menu principal et bouton du header.', 'Gérer le menu', EP_Admin::url_page( EP_Admin_Contenu::PAGE_NAVIGATION ), EP_Roles::CAP_NAVIGATION ),
			array( 'dashicons-editor-table', 'Footer', 'Liens, colonnes et réseaux du pied de page.', 'Gérer le footer', EP_Admin::url_page( self::PAGE_FOOTER ), EP_Roles::CAP_NAVIGATION ),
			array( 'dashicons-search', 'SEO', 'Référencement et indexation.', 'Réglages SEO', EP_Admin::url_page( self::PAGE_SEO ), self::CAP ),
			array( 'dashicons-upload', 'Publication', $etat ? 'Mettre le site à jour. Dernière publication le ' . wp_date( 'd/m \à H\hi', strtotime( $etat['fin'] ) ) . '.' : 'Mettre le site à jour. Aucune publication depuis WordPress.', 'Publier le site', EP_Admin::url_page( EP_Admin_Contenu::PAGE_PUBLICATION ), EP_Roles::CAP_PUBLIER ),
			array( 'dashicons-hammer', 'Maintenance', $maint ? 'État du site : maintenance active (503).' : 'État du site : en ligne.', 'Gérer la maintenance', EP_Admin::url_page( EP_Admin_Contenu::PAGE_MAINTENANCE ), EP_Roles::CAP_MAINTENANCE ),
			array( 'dashicons-admin-users', 'Utilisateurs', 'Comptes et rôles de l’équipe.', 'Gérer les comptes', admin_url( 'users.php' ), 'list_users' ),
		);
		return array_values( array_filter( $cartes, static fn( $c ) => current_user_can( $c[5] ) ) );
	}

	public static function ecran_hub(): void {
		self::exiger( 'edit_ep_contenus' );
		self::ouvrir( 'Configuration du site', 'Identité, apparence, navigation, pied de page et référencement : tout ce qui se règle sans toucher au code.' );
		$cartes = self::cartes();
		echo '<div class="ep-cartes-nav' . ( 7 === count( $cartes ) ? ' ep-cartes-nav--7' : '' ) . '">';
		foreach ( $cartes as [$icone, $titre, $texte, $bouton, $url] ) {
			printf( '<div class="ep-carte-nav"><span class="dashicons %s ep-carte-nav__icone" aria-hidden="true"></span><p class="ep-carte-nav__titre">%s</p><p class="ep-carte-nav__texte">%s</p><a class="ep-carte-nav__cta" href="%s">%s</a></div>', esc_attr( $icone ), esc_html( $titre ), esc_html( $texte ), esc_url( $url ), esc_html( $bouton ) );
		}
		echo '</div>';
		echo '<div class="ep-aide" style="margin:0;max-width:760px"><p class="ep-aide__titre">Ce que ces écrans ne font pas</p><ul><li>La mise en page, les tailles de texte, les espacements et les composants restent dans le code.</li><li>Les secrets et la configuration technique restent dans wp-config.php (écran Réglages, lecture seule).</li></ul></div>';
		echo '</div>';
	}

	/* ------------------------------------------------------------ identité */

	public static function ecran_identite(): void {
		self::exiger( self::CAP );
		$i = EP_Site::identite();
		self::ouvrir( 'Identité', 'Gérez les éléments de marque utilisés sur le site.', 'identite' );
		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">Nom et signature</h2><p class="ep-bloc__sous-titre">Le nom sert aux données structurées et de repli au titre SEO. Le pied de page a son propre texte (écran Footer).</p>';
		echo '<div class="ep-deux-champs" style="margin-top:16px">';
		self::texte( 'nom', 'Nom du site', (string) $i['nom'] );
		self::texte( 'baseline', 'Baseline / signature', (string) $i['baseline'], 'Une phrase courte.' );
		echo '</div></div>';

		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">Logotypes</h2><p class="ep-bloc__sous-titre">Le site choisit le bon logotype selon le fond : logo principal sur fond clair, logo clair sur fond sombre.</p>';
		echo '<div class="ep-grille-medias">';
		self::media( 'logo_id', 'Logo principal', (int) $i['logo_id'], 'Fond clair : header, pages, maintenance. PNG ou SVG, fond transparent.' );
		self::media( 'logo_clair_id', 'Logo clair', (int) $i['logo_clair_id'], 'Fond sombre : pied de page, menu mobile.', 'sombre', 'Repli : le logo principal.' );
		self::media( 'logo_sombre_id', 'Logo sombre', (int) $i['logo_sombre_id'], 'Variante, seulement si le logo principal ne convient pas sur fond clair.', '', 'Repli : le logo principal.' );
		self::media( 'symbole_id', 'Symbole de marque', (int) $i['symbole_id'], 'Facultatif. Non utilisé par les gabarits actuels.', 'carre', 'Facultatif.' );
		echo '</div></div>';

		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">Favicon et image sociale</h2><p class="ep-bloc__sous-titre">Le site produit lui-même les tailles de favicon (16, 32 et 180 px) à partir d’une image carrée.</p>';
		echo '<div class="ep-grille-medias">';
		self::media( 'favicon_id', 'Favicon', (int) $i['favicon_id'], 'Image carrée, 512 × 512 px conseillé.', 'carre', 'Repli : les favicons actuels du site.' );
		self::media( 'og_id', 'Image de partage par défaut', (int) $i['og_id'], '1200 × 630 px. Utilisée quand une page n’a pas d’image.', '', 'Repli : l’image du hero.' );
		echo '</div></div>';
		self::rail( 'Les logotypes sont copiés dans le site à la publication ; le site public ne dépend jamais de WordPress.' );
	}

	public static function action_identite(): void {
		self::exiger( self::CAP );
		check_admin_referer( 'ep_site_identite' );
		$p = wp_unslash( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$i = EP_Site::identite();
		$erreurs = array();
		$i['nom']      = EP_Champs::texte_propre( (string) ( $p['nom'] ?? '' ) ) ?: EP_Site::defaut_identite()['nom'];
		$i['baseline'] = EP_Champs::texte_propre( (string) ( $p['baseline'] ?? '' ) );
		foreach ( array( 'logo_id', 'logo_clair_id', 'logo_sombre_id', 'symbole_id', 'favicon_id', 'og_id' ) as $k ) {
			$id = (int) ( $p[ $k ] ?? 0 );
			if ( ! EP_Site::media_valide( $id ) ) {
				$erreurs[] = "Le média choisi pour « $k » n’existe pas ou n’est pas une image.";
				continue;
			}
			$i[ $k ] = max( 0, $id );
		}
		update_option( EP_Site::OPT_IDENTITE, $i, true );
		self::terminer( self::PAGE_IDENTITE, $erreurs );
	}

	/* ------------------------------------------------------------ apparence */

	public static function ecran_apparence(): void {
		self::exiger( self::CAP );
		$a      = EP_Site::apparence();
		$accent = EP_Projet::couleur( (string) $a['accent'], '#B04A1E' );
		$sombre = EP_Projet::couleur( (string) $a['accent_sombre'], EP_Projet::assombrir( $accent, 0.17 ) );
		$pale   = EP_Projet::melanger( $accent, '#FFFFFF', 0.82 );
		$vars   = sprintf( '--ep-apercu-accent:%s;--ep-apercu-accent-sombre:%s;--ep-apercu-accent-pale:%s', $accent, $sombre, $pale );
		self::ouvrir( 'Apparence', 'Adaptez l’accent de marque sans modifier la direction artistique.', 'apparence' );

		echo '<div class="ep-bloc" data-ep-apparence style="' . esc_attr( $vars ) . '"><h2 class="ep-bloc__titre">Couleur d’accent</h2><p class="ep-bloc__sous-titre">Boutons, filets, numéros et liens actifs du site public. Un seul réglage ; le reste de la palette garantit les contrastes.</p>';
		echo '<div class="ep-nuancier" style="margin-top:18px"><div class="ep-nuancier__echantillon" data-ep-echantillon aria-hidden="true"></div><div>';
		printf( '<p class="ep-nuancier__hex" data-ep-hex>%s</p>', esc_html( $accent ) );
		printf( '<p class="ep-champ"><label for="ep-s-accent">Accent (hexadécimal)</label><span class="ep-couleur"><input type="color" value="%1$s" aria-label="Choisir la couleur" data-ep-couleur-pour="ep-s-accent"><input type="text" id="ep-s-accent" name="accent" value="%1$s" pattern="#[0-9a-fA-F]{6}" maxlength="7" data-ep-accent></span><span class="description">Six chiffres hexadécimaux. La valeur Expert Parquet est #B04A1E : avec elle, le site est strictement identique à la V1.</span></p>', esc_attr( $accent ) );
		echo '<ul class="ep-derives"><li><span class="ep-derives__pastille" style="background:var(--ep-apercu-accent-sombre)" data-ep-derive="sombre"></span>Accent sombre (survol) <code data-ep-derive-hex="sombre">' . esc_html( $sombre ) . '</code></li><li><span class="ep-derives__pastille" style="background:var(--ep-apercu-accent-pale)" data-ep-derive="pale"></span>Teinte pâle (fonds, badges) <code data-ep-derive-hex="pale">' . esc_html( $pale ) . '</code></li></ul>';
		echo '</div></div>';
		echo '<h3 class="ep-sous-titre">Accent sombre <small>Facultatif : vide, il est calculé à partir de l’accent. À renseigner seulement si le survol calculé ne convient pas.</small></h3>';
		printf( '<p class="ep-champ"><label for="ep-s-accent-sombre">Accent sombre (hexadécimal)</label><span class="ep-couleur"><input type="color" value="%1$s" aria-label="Choisir la couleur" data-ep-couleur-pour="ep-s-accent-sombre"><input type="text" id="ep-s-accent-sombre" name="accent_sombre" value="%2$s" pattern="#[0-9a-fA-F]{6}" maxlength="7" placeholder="calculé" data-ep-accent-sombre></span></p>', esc_attr( $sombre ), esc_attr( (string) $a['accent_sombre'] ) );
		echo '</div>';

		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">Direction artistique protégée</h2><p class="ep-bloc__sous-titre">Ce que la couleur d’accent ne touche jamais.</p>';
		echo '<ul class="ep-liste-coches" style="margin-top:14px"><li>Typographies</li><li>Dimensions et espacements</li><li>Composants</li><li>Mise en page</li><li>Couleurs de texte et de fond</li><li>Contrastes</li></ul></div>';

		$apercu = '<div class="ep-panneau" style="' . esc_attr( $vars ) . '" data-ep-apparence-apercu><h2 class="ep-panneau__titre"><span class="dashicons dashicons-visibility" aria-hidden="true"></span>Aperçu</h2><p class="ep-panneau__texte">Ce que la couleur d’accent contrôle sur le site. L’aperçu suit la valeur saisie ; le site public ne change qu’à la publication.</p>'
			. '<div class="ep-apercu-accent">'
			. '<div class="ep-apercu-accent__item"><span class="ep-apercu-accent__legende">Bouton</span><span class="ep-apercu-accent__bouton">Trouver mon parquet</span></div>'
			. '<div class="ep-apercu-accent__item"><span class="ep-apercu-accent__legende">Lien</span><span class="ep-apercu-accent__lien">Voir toute la FAQ</span></div>'
			. '<div class="ep-apercu-accent__item"><span class="ep-apercu-accent__legende">Surtitre</span><span class="ep-apercu-accent__kicker">Problèmes fréquents</span></div>'
			. '<div class="ep-apercu-accent__item"><span class="ep-apercu-accent__legende">Numéro</span><span class="ep-apercu-accent__numero">01</span></div>'
			. '<div class="ep-apercu-accent__item"><span class="ep-apercu-accent__legende">Filet</span><span class="ep-apercu-accent__filet"></span></div>'
			. '<div class="ep-apercu-accent__item"><span class="ep-apercu-accent__legende">Badge</span><span class="ep-apercu-accent__badge">Expertise</span></div>'
			. '</div></div>';
		self::rail( 'Vérifiez le contraste du bouton dans l’aperçu : un accent trop clair rend le texte blanc illisible.', $apercu );
	}

	public static function action_apparence(): void {
		self::exiger( self::CAP );
		check_admin_referer( 'ep_site_apparence' );
		$p = wp_unslash( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$a = EP_Site::apparence();
		$erreurs = array();
		$accent = strtoupper( trim( (string) ( $p['accent'] ?? '' ) ) );
		if ( EP_Site::couleur_valide( $accent ) ) {
			$a['accent'] = $accent;
		} else {
			$erreurs[] = 'Couleur d’accent invalide : six chiffres hexadécimaux attendus, par exemple #B04A1E.';
		}
		$sombre = strtoupper( trim( (string) ( $p['accent_sombre'] ?? '' ) ) );
		if ( '' === $sombre || EP_Site::couleur_valide( $sombre ) ) {
			$a['accent_sombre'] = $sombre;
		} else {
			$erreurs[] = 'Accent sombre invalide.';
		}
		update_option( EP_Site::OPT_APPARENCE, $a, true );
		self::terminer( self::PAGE_APPARENCE, $erreurs );
	}

	/* ------------------------------------------------------------ navigation */

	public static function ecran_navigation(): void {
		self::exiger( EP_Roles::CAP_NAVIGATION );
		$n       = EP_Site::navigation();
		$defauts = array();
		foreach ( EP_Site::defaut_navigation()['entrees'] as $d ) {
			$defauts[ $d['key'] ] = $d['label'];
		}
		$pages = EP_Site::pages_internes();
		self::ouvrir( 'Navigation', 'Gérez les libellés, l’ordre et la visibilité du menu.', 'navigation' );

		/* Entrées métier : une ligne éditoriale par destination. */
		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">Entrées du menu</h2><p class="ep-bloc__sous-titre">Les destinations sont fixes. Vous réglez le libellé affiché, l’ordre (1 en premier) et la visibilité. Le menu mobile suit la même liste.</p>';
		echo '<ul class="ep-lignes"><li class="ep-ligne ep-ligne--entete" aria-hidden="true"><span></span><span>Destination</span><span>Libellé affiché</span><span>Ordre</span><span>Visible</span></li>';
		foreach ( $n['entrees'] as $e ) {
			if ( 'metier' !== ( $e['type'] ?? 'metier' ) ) {
				continue;
			}
			$k = $e['key'];
			printf(
				'<li class="ep-ligne%6$s"><span class="dashicons dashicons-menu ep-ligne__poignee" aria-hidden="true"></span><div class="ep-ligne__dest"><span class="ep-ligne__nom">%2$s</span><span class="ep-ligne__chemin">%7$s</span></div><p class="ep-champ"><label for="ep-nav-%1$s-label">Libellé</label><input type="text" id="ep-nav-%1$s-label" name="nav[%1$s][label]" value="%3$s"></p><p class="ep-champ"><label for="ep-nav-%1$s-ordre">Ordre</label><input type="number" id="ep-nav-%1$s-ordre" name="nav[%1$s][ordre]" value="%4$d" min="1" max="20"></p><div class="ep-ligne__case"><label><input type="checkbox" name="nav[%1$s][visible]" value="1"%5$s> Visible</label></div></li>',
				esc_attr( $k ),
				esc_html( $defauts[ $k ] ?? $k ),
				esc_attr( $e['label'] ),
				(int) $e['ordre'],
				checked( ! empty( $e['visible'] ), true, false ),
				empty( $e['visible'] ) ? ' ep-ligne--masquee' : '',
				esc_html( isset( $pages[ $k ] ) ? '/' . $pages[ $k ][0] : '' )
			);
		}
		echo '</ul></div>';

		/* Liens personnalisés : la liste, ou un état vide, puis « + Ajouter un lien ». */
		$persos = array_values( array_filter( $n['entrees'], static fn( $e ) => 'custom' === ( $e['type'] ?? '' ) ) );
		echo '<div class="ep-bloc"><div class="ep-bloc__entete"><div><h2 class="ep-bloc__titre">Liens personnalisés</h2><p class="ep-bloc__sous-titre">À réserver aux cas qu’aucune destination métier ne couvre. ' . EP_Site::MAX_PERSONNALISES . ' au plus ; un lien externe s’ouvre dans un nouvel onglet.</p></div><span class="ep-etiquette ep-etiquette--off">' . count( $persos ) . ' / ' . EP_Site::MAX_PERSONNALISES . '</span></div>';
		if ( ! $persos ) {
			echo '<p class="ep-vide-etat">Aucun lien personnalisé. Le menu ne contient que les destinations métier.</p>';
		} else {
			echo '<ul class="ep-lignes"><li class="ep-ligne ep-ligne--entete ep-ligne--perso" aria-hidden="true"><span></span><span>Libellé</span><span>Adresse</span><span>Ordre</span><span>Visible</span><span></span></li>';
			foreach ( $persos as $i => $e ) {
				printf(
					'<li class="ep-ligne ep-ligne--perso%6$s"><span class="dashicons dashicons-menu ep-ligne__poignee" aria-hidden="true"></span><p class="ep-champ"><label for="ep-perso-%1$d-label">Libellé</label><input type="text" id="ep-perso-%1$d-label" name="perso[%1$d][label]" value="%2$s"></p><p class="ep-champ"><label for="ep-perso-%1$d-url">Adresse</label><input type="url" id="ep-perso-%1$d-url" name="perso[%1$d][url]" value="%3$s" placeholder="https://"></p><p class="ep-champ"><label for="ep-perso-%1$d-ordre">Ordre</label><input type="number" id="ep-perso-%1$d-ordre" name="perso[%1$d][ordre]" value="%4$d" min="1" max="20"></p><div class="ep-ligne__case"><label><input type="checkbox" name="perso[%1$d][visible]" value="1"%5$s> Visible</label></div><div class="ep-ligne__case ep-ligne__case--danger"><label><input type="checkbox" name="perso[%1$d][supprimer]" value="1"> Supprimer</label></div></li>',
					$i,
					esc_attr( (string) ( $e['label'] ?? '' ) ),
					esc_attr( (string) ( $e['url'] ?? '' ) ),
					(int) ( $e['ordre'] ?? 10 ),
					checked( ! empty( $e['visible'] ), true, false ),
					empty( $e['visible'] ) ? ' ep-ligne--masquee' : ''
				);
			}
			echo '</ul>';
		}
		if ( count( $persos ) < EP_Site::MAX_PERSONNALISES ) {
			$i = count( $persos );
			echo '<details class="ep-ajout" data-ep-ajout><summary class="ep-bouton"><span class="dashicons dashicons-plus-alt2" aria-hidden="true"></span>Ajouter un lien</summary><div class="ep-ajout__corps"><p class="ep-ajout__titre">Nouveau lien personnalisé</p>';
			printf(
				'<div class="ep-ligne ep-ligne--ajout" style="border:0;padding:0;background:none"><p class="ep-champ"><label for="ep-perso-%1$d-label">Libellé</label><input type="text" id="ep-perso-%1$d-label" name="perso[%1$d][label]" value=""></p><p class="ep-champ"><label for="ep-perso-%1$d-url">Adresse</label><input type="url" id="ep-perso-%1$d-url" name="perso[%1$d][url]" value="" placeholder="https://"></p><p class="ep-champ"><label for="ep-perso-%1$d-ordre">Ordre</label><input type="number" id="ep-perso-%1$d-ordre" name="perso[%1$d][ordre]" value="10" min="1" max="20"></p><div class="ep-ligne__case"><label><input type="checkbox" name="perso[%1$d][visible]" value="1" checked> Visible</label></div></div>',
				$i
			);
			echo '<p class="ep-aide-champ">Le lien n’est créé qu’à l’enregistrement, si libellé et adresse https:// sont renseignés.</p></div></details>';
		}
		echo '</div>';

		/* Le bouton principal du header. */
		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">Bouton principal du header</h2><p class="ep-bloc__sous-titre">Le libellé est libre ; la destination métier reste verrouillée.</p>';
		echo '<div class="ep-deux-champs" style="margin-top:16px">';
		self::texte( 'cta_label', 'Libellé', (string) $n['cta']['label'] );
		printf( '<p class="ep-champ"><label>Destination</label><span class="ep-action-fixe"><span class="dashicons dashicons-admin-links" aria-hidden="true"></span>%s<span class="dashicons dashicons-lock ep-action-fixe__verrou" aria-hidden="true" title="Destination verrouillée"></span></span></p>', esc_html( EP_Site::parcours()['moteur'] ) );
		echo '</div></div>';
		self::rail( 'Le header garde son dessin : vous changez les mots et l’ordre, pas la mise en page.' );
	}

	public static function action_navigation(): void {
		self::exiger( EP_Roles::CAP_NAVIGATION );
		check_admin_referer( 'ep_site_navigation' );
		$p = wp_unslash( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$erreurs = array();
		$entrees = array();
		foreach ( EP_Site::defaut_navigation()['entrees'] as $d ) {
			$k = $d['key'];
			$e = isset( $p['nav'][ $k ] ) && is_array( $p['nav'][ $k ] ) ? $p['nav'][ $k ] : array();
			$entrees[] = array(
				'type'    => 'metier',
				'key'     => $k,
				'label'   => EP_Champs::texte_propre( (string) ( $e['label'] ?? '' ) ) ?: $d['label'],
				'ordre'   => max( 1, min( 20, (int) ( $e['ordre'] ?? $d['ordre'] ) ) ),
				'visible' => ! empty( $e['visible'] ),
			);
		}
		foreach ( (array) ( $p['perso'] ?? array() ) as $e ) {
			if ( ! is_array( $e ) || ! empty( $e['supprimer'] ) ) {
				continue;
			}
			$label = EP_Champs::texte_propre( (string) ( $e['label'] ?? '' ) );
			$url   = esc_url_raw( trim( (string) ( $e['url'] ?? '' ) ) );
			if ( '' === $label && '' === $url ) {
				continue;
			}
			if ( '' === $label || ! EP_Site::url_valide( $url ) ) {
				$erreurs[] = 'Lien personnalisé ignoré : libellé et adresse https:// sont obligatoires.';
				continue;
			}
			if ( count( array_filter( $entrees, static fn( $x ) => 'custom' === $x['type'] ) ) >= EP_Site::MAX_PERSONNALISES ) {
				$erreurs[] = 'Quatre liens personnalisés au plus.';
				break;
			}
			$entrees[] = array( 'type' => 'custom', 'key' => 'perso-' . substr( md5( $url ), 0, 8 ), 'label' => $label, 'url' => $url, 'externe' => true, 'ordre' => max( 1, min( 20, (int) ( $e['ordre'] ?? 10 ) ) ), 'visible' => ! empty( $e['visible'] ) );
		}
		$n = EP_Site::navigation();
		$n['entrees']      = $entrees;
		$n['cta']['label'] = EP_Champs::texte_propre( (string) ( $p['cta_label'] ?? '' ) ) ?: 'Trouver mon parquet';
		update_option( EP_Site::OPT_NAVIGATION, $n, true );
		update_option( 'ep_header_cta', $n['cta']['label'], true );
		self::terminer( EP_Admin_Contenu::PAGE_NAVIGATION, $erreurs );
	}

	/* ------------------------------------------------------------ footer */

	/** Les champs d'édition d'un lien (type, libellé, destination, icône, ordre, options). */
	private static function champs_lien( string $prefixe, array $l ): string {
		$types = EP_Site::types_lien();
		$id    = sanitize_key( $prefixe );
		$h     = '<div class="ep-lien__grille">';
		$h    .= '<p class="ep-champ"><label for="' . $id . '-type">Type</label><select id="' . $id . '-type" name="' . esc_attr( $prefixe ) . '[type]">';
		foreach ( $types as $k => $lib ) {
			$h .= sprintf( '<option value="%s"%s>%s</option>', esc_attr( $k ), selected( $k, (string) ( $l['type'] ?? 'page' ), false ), esc_html( $lib ) );
		}
		$h .= '</select></p>';
		$h .= sprintf( '<p class="ep-champ"><label for="%s-libelle">Libellé</label><input type="text" id="%s-libelle" name="%s[libelle]" value="%s"></p>', $id, $id, esc_attr( $prefixe ), esc_attr( (string) ( $l['libelle'] ?? '' ) ) );
		/* Destination : une liste pour les types fermés, un champ texte pour les autres.
		   Les deux sont présents ; le serveur lit celui qui correspond au type. */
		$dest = (string) ( $l['destination'] ?? '' );
		$h   .= '<p class="ep-champ"><label for="' . $id . '-dest">Destination</label><select id="' . $id . '-dest" name="' . esc_attr( $prefixe ) . '[destination_liste]" class="ep-dest-liste">';
		$h   .= '<optgroup label="Pages">';
		foreach ( EP_Site::pages_internes() as $k => [$chemin, $lib] ) {
			$h .= sprintf( '<option value="page:%s"%s>%s</option>', esc_attr( $k ), selected( 'page:' . $k, ( $l['type'] ?? '' ) . ':' . $dest, false ), esc_html( $lib ) );
		}
		$h .= '</optgroup><optgroup label="Parcours">';
		foreach ( EP_Site::parcours() as $k => $lib ) {
			$h .= sprintf( '<option value="parcours:%s"%s>%s</option>', esc_attr( $k ), selected( 'parcours:' . $k, ( $l['type'] ?? '' ) . ':' . $dest, false ), esc_html( $lib ) );
		}
		$h .= '</optgroup><optgroup label="Enseignes">';
		foreach ( EP_Site::partenaires() as $k => $info ) {
			$h .= sprintf( '<option value="partenaire:%s"%s>%s</option>', esc_attr( $k ), selected( 'partenaire:' . $k, ( $l['type'] ?? '' ) . ':' . $dest, false ), esc_html( $info[0] ) );
		}
		$h    .= '</optgroup></select>';
		$libre = in_array( (string) ( $l['type'] ?? '' ), array( 'externe', 'email', 'telephone' ), true ) ? $dest : '';
		$h    .= sprintf( '<input type="text" name="%s[destination_libre]" value="%s" placeholder="https://…, e-mail ou téléphone" aria-label="Destination (libre)" class="ep-dest-libre"></p>', esc_attr( $prefixe ), esc_attr( $libre ) );
		$h    .= '<p class="ep-champ"><label for="' . $id . '-icone">Icône</label><select id="' . $id . '-icone" name="' . esc_attr( $prefixe ) . '[icone]" data-ep-icone>';
		foreach ( EP_Site::icones() as $k => $lib ) {
			$h .= sprintf( '<option value="%s"%s>%s</option>', esc_attr( $k ), selected( $k, (string) ( $l['icone'] ?? '' ), false ), esc_html( $lib ) );
		}
		$h .= '</select></p>';
		$h .= sprintf( '<p class="ep-champ"><label for="%s-ordre">Ordre</label><input type="number" id="%s-ordre" name="%s[ordre]" value="%d" min="1" max="99"></p>', $id, $id, esc_attr( $prefixe ), (int) ( $l['ordre'] ?? 1 ) );
		$h .= '</div>';
		$h .= sprintf( '<div class="ep-lien__options"><label><input type="checkbox" name="%s[nouvel_onglet]" value="1"%s> Ouvrir dans un nouvel onglet</label></div>', esc_attr( $prefixe ), checked( ! empty( $l['nouvel_onglet'] ), true, false ) );
		return $h;
	}

	/** Un lien existant : ligne compacte (icône, libellé, destination, actions), édition repliée. */
	private static function ligne_lien( string $prefixe, array $l ): void {
		[$lib_dest, $chemin] = self::destination_lisible( $l );
		$types   = EP_Site::types_lien();
		$inactif = empty( $l['actif'] );
		$h       = '<li class="ep-lien' . ( $inactif ? ' ep-lien--inactif' : '' ) . '" data-ep-lien>';
		$h      .= '<div class="ep-lien__resume"><span class="dashicons dashicons-menu ep-ligne__poignee ep-lien__poignee" aria-hidden="true"></span>' . self::icone_admin( (string) ( $l['icone'] ?? '' ) );
		$h      .= '<div class="ep-lien__texte"><span class="ep-lien__nom" data-ep-lien-nom>' . esc_html( (string) ( $l['libelle'] ?? '' ) ) . '</span><span class="ep-lien__dest"><span class="ep-etiquette ep-etiquette--off">' . esc_html( $types[ $l['type'] ?? 'page' ] ?? $l['type'] ) . '</span>' . esc_html( $lib_dest . ( $chemin && '/' === $chemin[0] ? ' · ' . $chemin : '' ) ) . '</span></div>';
		$h      .= '<div class="ep-lien__actions"><button type="button" class="ep-lien-action" data-ep-lien-modifier aria-expanded="false"><span class="dashicons dashicons-edit" aria-hidden="true"></span>Modifier</button>';
		$h      .= sprintf( '<label><input type="checkbox" name="%s[actif]" value="1"%s> Visible</label>', esc_attr( $prefixe ), checked( ! $inactif, true, false ) );
		$h      .= sprintf( '<label class="ep-lien__supprimer"><input type="checkbox" name="%s[supprimer]" value="1"> Supprimer</label></div></div>', esc_attr( $prefixe ) );
		$h      .= '<div class="ep-lien__edition" data-ep-lien-edition>' . self::champs_lien( $prefixe, $l ) . '</div></li>';
		echo $h; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/** La liste des liens d'un groupe, puis « + Ajouter un lien ». */
	private static function liste_liens( string $prefixe, array $liens, bool $ajouter = true ): void {
		$i = 0;
		if ( ! $liens ) {
			echo '<p class="ep-vide-etat">Aucun lien.</p>';
		} else {
			echo '<ul class="ep-liens">';
			foreach ( $liens as $l ) {
				self::ligne_lien( $prefixe . '[' . $i++ . ']', $l );
			}
			echo '</ul>';
		}
		if ( $ajouter && $i < EP_Site::MAX_LIENS ) {
			$p = $prefixe . '[' . $i . ']';
			echo '<details class="ep-ajout" data-ep-ajout><summary class="ep-bouton ep-bouton--petit"><span class="dashicons dashicons-plus-alt2" aria-hidden="true"></span>Ajouter un lien</summary><div class="ep-ajout__corps"><p class="ep-ajout__titre">Nouveau lien</p>';
			/* Champs désactivés tant que le bloc est replié : rien n'est envoyé, donc rien à refuser.
			   Le script les active à l'ouverture (data-ep-ajout). */
			echo str_replace( array( '<input ', '<select ' ), array( '<input disabled ', '<select disabled ' ), self::champs_lien( $p, array( 'type' => 'page', 'ordre' => $i + 1 ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo '<input disabled type="hidden" name="' . esc_attr( $p ) . '[actif]" value="1">';
			echo '<p class="ep-aide-champ">Le lien n’est créé qu’à l’enregistrement, si le libellé est renseigné.</p></div></details>';
		}
	}

	public static function ecran_footer(): void {
		self::exiger( EP_Roles::CAP_NAVIGATION );
		$f = EP_Site::footer();
		self::ouvrir( 'Footer', 'Gérez les colonnes, liens et réseaux du pied de page.', 'footer' );
		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">Marque</h2><p class="ep-bloc__sous-titre">Le texte sous le logo et la ligne de copyright.</p>';
		echo '<div style="margin-top:16px">';
		self::texte( 'pitch', 'Texte sous le logo', (string) $f['pitch'], 'Une phrase.', true );
		self::texte( 'copyright', 'Copyright', (string) $f['copyright'], 'Affiché après « © » et l’année en cours.' );
		echo '</div></div>';

		$colonnes = array_values( $f['colonnes'] );
		usort( $colonnes, static fn( $a, $b ) => ( (int) $a['ordre'] <=> (int) $b['ordre'] ) );
		echo '<div class="ep-bloc"><div class="ep-bloc__entete"><div><h2 class="ep-bloc__titre">Colonnes de liens</h2><p class="ep-bloc__sous-titre">Dépliez une colonne pour modifier son titre et ses liens. La première est ouverte par défaut.</p></div><span class="ep-etiquette ep-etiquette--off">' . count( $colonnes ) . ' / ' . EP_Site::MAX_COLONNES . '</span></div>';
		echo '<div class="ep-accordeon">';
		foreach ( $colonnes as $ci => $c ) {
			$liens = array_values( $c['liens'] ?? array() );
			usort( $liens, static fn( $a, $b ) => ( (int) $a['ordre'] <=> (int) $b['ordre'] ) );
			$actifs  = count( array_filter( $liens, static fn( $l ) => ! empty( $l['actif'] ) ) );
			$vis     = ! empty( $c['visible'] );
			$titre_h = $c['titre'] ? ' <span class="ep-pli__titre-sec">· ' . esc_html( $c['titre'] ) . '</span>' : '';
			printf(
				'<details class="ep-pli" data-ep-pli%1$s><summary class="ep-pli__resume"><span class="dashicons dashicons-arrow-down-alt2 ep-pli__chevron" aria-hidden="true"></span><span class="ep-pli__nom">Colonne %2$d%3$s</span><span class="ep-pli__meta"><span class="ep-etiquette ep-etiquette--off">%4$s</span><span class="ep-etiquette %5$s" data-ep-pli-etat>%6$s</span></span></summary><div class="ep-pli__corps">',
				0 === $ci ? ' open' : '',
				$ci + 1,
				$titre_h, // phpcs:ignore WordPress.Security.EscapeOutput
				esc_html( sprintf( '%d lien%s', $actifs, $actifs > 1 ? 's' : '' ) ),
				$vis ? 'ep-etiquette--ok' : 'ep-etiquette--off',
				$vis ? 'Visible' : 'Masquée'
			);
			echo '<div class="ep-deux-champs">';
			self::texte( 'col[' . $ci . '][titre]', 'Titre de la colonne', (string) $c['titre'] );
			printf( '<p class="ep-champ"><label for="ep-col-%1$d-ordre">Ordre</label><input type="number" id="ep-col-%1$d-ordre" name="col[%1$d][ordre]" value="%2$d" min="1" max="9"></p>', $ci, (int) $c['ordre'] );
			echo '</div>';
			printf( '<p class="ep-champ ep-champ--case"><label><input type="checkbox" name="col[%1$d][visible]" value="1"%2$s data-ep-pli-visible> Afficher cette colonne sur le site</label></p>', $ci, checked( $vis, true, false ) );
			echo '<h3 class="ep-sous-titre">Liens</h3>';
			self::liste_liens( 'col[' . $ci . '][liens]', $liens );
			printf( '<div class="ep-zone-danger"><span>Retirer cette colonne et ses liens du pied de page à l’enregistrement.</span><label><input type="checkbox" name="col[%d][supprimer]" value="1"> Supprimer la colonne</label></div>', $ci );
			echo '</div></details>';
		}
		echo '</div>';
		if ( count( $colonnes ) < EP_Site::MAX_COLONNES ) {
			$ci = count( $colonnes );
			echo '<details class="ep-ajout" data-ep-ajout style="margin-top:14px"><summary class="ep-bouton"><span class="dashicons dashicons-plus-alt2" aria-hidden="true"></span>Ajouter une colonne</summary><div class="ep-bloc ep-bloc--nouvelle" style="margin-top:12px"><h2 class="ep-bloc__titre">Nouvelle colonne</h2><p class="ep-bloc__sous-titre">Renseignez un titre pour la créer à l’enregistrement (' . EP_Site::MAX_COLONNES . ' colonnes au plus).</p>';
			echo '<div class="ep-deux-champs" style="margin-top:16px">';
			self::texte( 'col[' . $ci . '][titre]', 'Titre de la colonne', '' );
			printf( '<p class="ep-champ"><label for="ep-col-%1$d-ordre">Ordre</label><input type="number" id="ep-col-%1$d-ordre" name="col[%1$d][ordre]" value="%2$d" min="1" max="9"></p>', $ci, $ci + 1 );
			echo '</div><input type="hidden" name="col[' . $ci . '][visible]" value="1">';
			echo '<h3 class="ep-sous-titre">Liens</h3>';
			self::liste_liens( 'col[' . $ci . '][liens]', array() );
			echo '</div></details>';
		}
		echo '</div>';

		$legaux  = array_values( $f['legaux'] ?? array() );
		$reseaux = array_values( $f['reseaux'] ?? array() );
		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">Bas de page</h2><p class="ep-bloc__sous-titre">La ligne basse du pied de page : liens légaux et réseaux sociaux.</p><div class="ep-accordeon" style="margin-top:14px">';

		printf( '<details class="ep-pli" data-ep-pli><summary class="ep-pli__resume"><span class="dashicons dashicons-arrow-down-alt2 ep-pli__chevron" aria-hidden="true"></span><span class="ep-pli__nom">Liens légaux</span><span class="ep-pli__meta"><span class="ep-etiquette ep-etiquette--off">%s</span></span></summary><div class="ep-pli__corps">', esc_html( sprintf( '%d lien%s', count( $legaux ), count( $legaux ) > 1 ? 's' : '' ) ) );
		echo '<p class="ep-bloc__sous-titre" style="margin:0 0 12px">À côté du copyright.</p>';
		self::liste_liens( 'legaux', $legaux );
		echo '</div></details>';

		printf( '<details class="ep-pli" data-ep-pli><summary class="ep-pli__resume"><span class="dashicons dashicons-arrow-down-alt2 ep-pli__chevron" aria-hidden="true"></span><span class="ep-pli__nom">Réseaux sociaux</span><span class="ep-pli__meta"><span class="ep-etiquette ep-etiquette--off">%s</span></span></summary><div class="ep-pli__corps">', esc_html( sprintf( '%d réseau%s', count( $reseaux ), count( $reseaux ) > 1 ? 'x' : '' ) ) );
		echo '<p class="ep-bloc__sous-titre" style="margin:0 0 12px">Affichés avec leur pictogramme. Rien ne s’affiche sans adresse.</p>';
		if ( ! $reseaux ) {
			echo '<p class="ep-vide-etat">Aucun réseau social affiché.</p>';
		} else {
			echo '<div class="ep-reseaux">';
			foreach ( $reseaux as $ri => $r ) {
				echo '<div class="ep-reseau">' . self::icone_admin( (string) $r['reseau'] ) . '<p class="ep-champ"><label for="ep-reseau-' . $ri . '">Réseau</label><select id="ep-reseau-' . $ri . '" name="reseaux[' . $ri . '][reseau]" data-ep-icone>';
				foreach ( EP_Site::reseaux() as $k => $lib ) {
					printf( '<option value="%s"%s>%s</option>', esc_attr( $k ), selected( $k, (string) $r['reseau'], false ), esc_html( $lib ) );
				}
				echo '</select></p>';
				printf( '<p class="ep-champ"><label for="ep-reseau-%1$d-url">Adresse</label><input type="url" id="ep-reseau-%1$d-url" name="reseaux[%1$d][url]" value="%2$s" placeholder="https://"></p>', $ri, esc_attr( (string) $r['url'] ) );
				printf( '<p class="ep-champ"><label for="ep-reseau-%1$d-ordre">Ordre</label><input type="number" id="ep-reseau-%1$d-ordre" name="reseaux[%1$d][ordre]" value="%2$d" min="1" max="20" aria-label="Ordre"></p>', $ri, (int) $r['ordre'] );
				printf( '<div class="ep-reseau__actions"><label><input type="checkbox" name="reseaux[%1$d][visible]" value="1"%2$s> Visible</label><label class="ep-lien__supprimer"><input type="checkbox" name="reseaux[%1$d][supprimer]" value="1"> Supprimer</label></div></div>', $ri, checked( ! empty( $r['visible'] ), true, false ) );
			}
			echo '</div>';
		}
		$ri = count( $reseaux );
		echo '<details class="ep-ajout" data-ep-ajout><summary class="ep-bouton ep-bouton--petit"><span class="dashicons dashicons-plus-alt2" aria-hidden="true"></span>Ajouter un réseau</summary><div class="ep-ajout__corps"><p class="ep-ajout__titre">Nouveau réseau</p><div class="ep-reseau" style="border:0;padding:0">' . self::icone_admin( 'instagram' ) . '<p class="ep-champ"><label for="ep-reseau-' . $ri . '">Réseau</label><select id="ep-reseau-' . $ri . '" name="reseaux[' . $ri . '][reseau]" data-ep-icone>';
		foreach ( EP_Site::reseaux() as $k => $lib ) {
			printf( '<option value="%s">%s</option>', esc_attr( $k ), esc_html( $lib ) );
		}
		echo '</select></p>';
		printf( '<p class="ep-champ"><label for="ep-reseau-%1$d-url">Adresse</label><input type="url" id="ep-reseau-%1$d-url" name="reseaux[%1$d][url]" value="" placeholder="https://"></p>', $ri );
		printf( '<p class="ep-champ"><label for="ep-reseau-%1$d-ordre">Ordre</label><input type="number" id="ep-reseau-%1$d-ordre" name="reseaux[%1$d][ordre]" value="%2$d" min="1" max="20"></p><input type="hidden" name="reseaux[%1$d][visible]" value="1">', $ri, $ri + 1 );
		echo '</div><p class="ep-aide-champ">Le réseau n’est créé qu’à l’enregistrement, si l’adresse https:// du profil est renseignée.</p></details>';
		echo '</div></div>';

		self::rail( 'Le pied de page est reconstruit à la publication. Un lien dont la destination est invalide est refusé, jamais publié cassé.' );
	}

	/** Lit une ligne de lien envoyée par le formulaire et la normalise pour EP_Site::nettoyer_lien. */
	private static function lien_depuis_formulaire( array $l ): array {
		$type = sanitize_key( (string) ( $l['type'] ?? 'page' ) );
		if ( in_array( $type, array( 'externe', 'email', 'telephone' ), true ) ) {
			$dest = (string) ( $l['destination_libre'] ?? '' );
		} else {
			$liste = (string) ( $l['destination_liste'] ?? '' );
			[$t, $d] = array_pad( explode( ':', $liste, 2 ), 2, '' );
			$dest  = $t === $type ? $d : '';
			if ( '' === $dest && '' !== $liste ) {
				/* L'utilisateur a choisi une destination d'un autre type : on suit la liste. */
				$type = $t;
				$dest = $d;
			}
		}
		return array( 'type' => $type, 'libelle' => $l['libelle'] ?? '', 'destination' => $dest, 'icone' => $l['icone'] ?? '', 'nouvel_onglet' => ! empty( $l['nouvel_onglet'] ), 'actif' => ! empty( $l['actif'] ), 'ordre' => $l['ordre'] ?? 1 );
	}

	public static function action_footer(): void {
		self::exiger( EP_Roles::CAP_NAVIGATION );
		check_admin_referer( 'ep_site_footer' );
		$p = wp_unslash( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$erreurs = array();
		$f = EP_Site::footer();
		$f['pitch']     = EP_Champs::texte_propre( (string) ( $p['pitch'] ?? '' ) );
		$f['copyright'] = EP_Champs::texte_propre( (string) ( $p['copyright'] ?? '' ) ) ?: EP_Site::defaut_footer()['copyright'];

		$colonnes = array();
		foreach ( (array) ( $p['col'] ?? array() ) as $c ) {
			if ( ! is_array( $c ) || ! empty( $c['supprimer'] ) ) {
				continue;
			}
			$titre = EP_Champs::texte_propre( (string) ( $c['titre'] ?? '' ) );
			$liens = array();
			foreach ( (array) ( $c['liens'] ?? array() ) as $l ) {
				if ( ! is_array( $l ) || ! empty( $l['supprimer'] ) ) {
					continue;
				}
				$n = EP_Site::nettoyer_lien( self::lien_depuis_formulaire( $l ), $erreurs );
				if ( $n ) {
					$liens[] = $n;
				}
			}
			if ( '' === $titre && ! $liens ) {
				continue;
			}
			if ( '' === $titre ) {
				$erreurs[] = 'Une colonne sans titre a été ignorée.';
				continue;
			}
			if ( count( $colonnes ) >= EP_Site::MAX_COLONNES ) {
				$erreurs[] = EP_Site::MAX_COLONNES . ' colonnes au plus : la colonne « ' . $titre . ' » a été ignorée.';
				continue;
			}
			$colonnes[] = array( 'titre' => $titre, 'visible' => ! empty( $c['visible'] ), 'ordre' => max( 1, min( 9, (int) ( $c['ordre'] ?? 1 ) ) ), 'liens' => array_slice( $liens, 0, EP_Site::MAX_LIENS ) );
		}
		if ( ! $colonnes ) {
			$erreurs[] = 'Le pied de page garde au moins une colonne : la configuration précédente a été conservée.';
		} else {
			$f['colonnes'] = $colonnes;
		}

		$legaux = array();
		foreach ( (array) ( $p['legaux'] ?? array() ) as $l ) {
			if ( ! is_array( $l ) || ! empty( $l['supprimer'] ) ) {
				continue;
			}
			$n = EP_Site::nettoyer_lien( self::lien_depuis_formulaire( $l ), $erreurs, false );
			if ( $n ) {
				$legaux[] = $n;
			}
		}
		$f['legaux'] = $legaux;

		$reseaux = array();
		foreach ( (array) ( $p['reseaux'] ?? array() ) as $r ) {
			if ( ! is_array( $r ) || ! empty( $r['supprimer'] ) ) {
				continue;
			}
			$url = esc_url_raw( trim( (string) ( $r['url'] ?? '' ) ) );
			if ( '' === $url ) {
				continue;
			}
			$reseau = sanitize_key( (string) ( $r['reseau'] ?? '' ) );
			if ( ! isset( EP_Site::reseaux()[ $reseau ] ) || ! EP_Site::url_valide( $url ) ) {
				$erreurs[] = 'Réseau social ignoré : réseau inconnu ou adresse invalide.';
				continue;
			}
			$reseaux[] = array( 'reseau' => $reseau, 'url' => $url, 'ordre' => max( 1, min( 20, (int) ( $r['ordre'] ?? 1 ) ) ), 'visible' => ! empty( $r['visible'] ) );
		}
		$f['reseaux'] = $reseaux;

		update_option( EP_Site::OPT_FOOTER, $f, true );
		self::terminer( self::PAGE_FOOTER, $erreurs );
	}

	/* ------------------------------------------------------------ SEO */

	public static function ecran_seo(): void {
		self::exiger( self::CAP );
		$s = EP_Site::seo();
		self::ouvrir( 'SEO', 'Contrôlez les informations essentielles pour les moteurs.', 'seo' );

		/* SEO global + aperçu de résultat */
		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">SEO global</h2><p class="ep-bloc__sous-titre">Chaque page, conseil et problème garde ses propres titre et description (boîte « Référencement »). Ces valeurs servent de suffixe et de repli.</p>';
		echo '<div class="ep-section__deux" style="margin-top:16px">';
		self::texte( 'nom', 'Nom SEO du site', (string) $s['nom'], 'Données structurées (WebSite, Organization).' );
		self::texte( 'suffixe', 'Suffixe des titres', (string) $s['suffixe'], 'Ajouté après le titre de chaque page, séparé par une espace.' );
		echo '</div>';
		self::texte( 'titre_defaut', 'Titre par défaut', (string) $s['titre_defaut'], 'Si une page n’a ni titre SEO ni titre.' );
		self::texte( 'description_defaut', 'Meta description par défaut', (string) $s['description_defaut'], 'Si une page n’a ni description SEO ni extrait. 120 à 158 caractères.', true );
		$suffixe = EP_Site::normaliser_suffixe( (string) $s['suffixe'] );
		printf(
			'<div class="ep-apercu-seo" data-ep-apercu-seo-global><p class="ep-apercu-seo__legende">Aperçu d’un résultat de recherche (représentation)</p><div class="ep-apercu-seo__carte"><p class="ep-apercu-seo__url">https://expert-parquet.com/</p><p class="ep-apercu-seo__titre" data-ep-seo-titre>%s</p><p class="ep-apercu-seo__desc" data-ep-seo-desc>%s</p></div></div>',
			esc_html( ( (string) $s['titre_defaut'] ?: (string) $s['nom'] ) . $suffixe ),
			esc_html( mb_substr( (string) $s['description_defaut'], 0, 160 ) )
		);
		echo '</div>';

		/* Réseaux sociaux */
		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">Réseaux sociaux</h2><p class="ep-bloc__sous-titre">L’image affichée quand une page est partagée et qu’elle n’a pas d’image propre.</p>';
		echo '<div class="ep-grille-medias" style="margin-top:16px">';
		self::media( 'og_id', 'Image de partage par défaut', (int) $s['og_id'], '1200 × 630 px. Prioritaire sur celle de l’écran Identité.', '', 'Repli : l’image de l’écran Identité, puis celle du hero.' );
		echo '</div></div>';

		/* Indexation */
		$env = wp_get_environment_type();
		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">Indexation</h2><p class="ep-bloc__sous-titre">L’indexation ne vaut qu’en production. Hors production, le site est toujours en noindex, quelle que soit cette case : c’est le build qui l’impose selon l’environnement.</p>';
		echo '<div class="ep-indexation" style="margin-top:14px">';
		self::case( 'indexation', 'Autoriser l’indexation par les moteurs de recherche (production)', ! empty( $s['indexation'] ) );
		printf( '<span class="ep-indexation__env">Environnement actuel <span class="ep-etiquette ep-etiquette--mono">%s</span> · base canonique <span class="ep-etiquette ep-etiquette--mono">https://expert-parquet.com</span></span>', esc_html( $env ) );
		echo '</div></div>';

		/* Sitemap */
		$racine  = EP_Contenu::projet_dir();
		$sitemap = $racine . '/sitemap.xml';
		$urls    = is_readable( $sitemap ) ? preg_match_all( '/<loc>/', (string) file_get_contents( $sitemap ) ) : 0;
		$noindex = is_readable( $racine . '/index.html' ) && str_contains( (string) file_get_contents( $racine . '/index.html' ), 'content="noindex' );
		echo '<div class="ep-bloc"><h2 class="ep-bloc__titre">Sitemap</h2><p class="ep-bloc__sous-titre">Produit à chaque publication à partir des pages générées. Rien à cocher page par page.</p>';
		echo '<div class="ep-sitemap" style="margin-top:16px"><div>';
		printf( '<p class="ep-sitemap__etat"><span class="ep-pastille %s"></span> %s</p>', is_readable( $sitemap ) ? 'ep-pastille--ok' : '', is_readable( $sitemap ) ? 'Opérationnel' : 'Pas encore généré' );
		printf( '<p class="ep-sitemap__chiffre">%d<small>URL%s %s</small></p>', (int) $urls, $urls > 1 ? 's' : '', $noindex ? 'listées — build en noindex (préproduction / local)' : 'indexables' );
		printf( '<p class="ep-sitemap__meta">Dernière génération : %s</p>', is_readable( $sitemap ) ? esc_html( wp_date( 'd/m/Y \à H\hi', filemtime( $sitemap ) ) ) : '—' );
		echo '</div><div class="ep-sitemap__actions">';
		printf( '<a class="ep-bouton" href="%s" target="_blank" rel="noopener">Voir le sitemap <span class="dashicons dashicons-external" aria-hidden="true"></span></a>', esc_url( home_url( '/sitemap.xml' ) ) );
		printf( '<a class="ep-lien-action ep-lien-action--neutre" href="%s" target="_blank" rel="noopener" style="justify-content:center">robots.txt <span class="dashicons dashicons-external" aria-hidden="true"></span></a>', esc_url( home_url( '/robots.txt' ) ) );
		echo '</div></div></div>';

		/* Réglages avancés : les informations d'entreprise transmises à Google
		   (données structurées JSON-LD). Repliés : l'utilisateur courant n'a pas
		   à les comprendre pour gérer son site. */
		echo '<details class="ep-bloc ep-avance"><summary class="ep-avance__resume"><span class="dashicons dashicons-arrow-down-alt2 ep-pli__chevron" aria-hidden="true"></span><span><span class="ep-bloc__titre">Réglages avancés</span><span class="ep-bloc__sous-titre">Informations de l’entreprise pour Google. Facultatif.</span></span></summary><div class="ep-avance__corps">';
		echo '<h3 class="ep-sous-titre">Informations de l’entreprise pour Google<small>Ce que Google peut afficher sur votre entreprise (nom, site). Transmis via les « données structurées » (format JSON-LD), générées automatiquement.</small></h3>';
		echo '<div class="ep-section__deux">';
		self::texte( 'organisation_nom', 'Nom de l’entreprise', (string) $s['organisation_nom'] );
		self::texte( 'organisation_url', 'Adresse du site de l’entreprise', (string) $s['organisation_url'], 'https://…' );
		echo '</div>';
		self::texte( 'description_site', 'Description de l’entreprise', (string) $s['description_site'], 'Une phrase décrivant l’activité du site.', true );
		self::case( 'website_jsonld', 'Transmettre aussi les informations du site à Google', ! empty( $s['website_jsonld'] ), 'Données structurées « WebSite » sur l’accueil. Laissez coché en cas de doute.' );
		echo '</div></details>';
		self::rail( 'Le build refuse une adresse d’entreprise invalide. Les titres de pages restent dans chaque contenu.' );
	}

	public static function action_seo(): void {
		self::exiger( self::CAP );
		check_admin_referer( 'ep_site_seo' );
		$p = wp_unslash( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$s = EP_Site::seo();
		$erreurs = array();
		foreach ( array( 'nom', 'titre_defaut', 'description_defaut', 'description_site', 'organisation_nom' ) as $k ) {
			$s[ $k ] = EP_Champs::texte_propre( (string) ( $p[ $k ] ?? '' ) );
		}
		$s['suffixe'] = EP_Site::normaliser_suffixe( (string) ( $p['suffixe'] ?? '' ) );
		$url = esc_url_raw( trim( (string) ( $p['organisation_url'] ?? '' ) ) );
		if ( '' === $url || EP_Site::url_valide( $url ) ) {
			$s['organisation_url'] = $url;
		} else {
			$erreurs[] = 'Adresse de l’organisation invalide.';
		}
		$og = (int) ( $p['og_id'] ?? 0 );
		if ( EP_Site::media_valide( $og ) ) {
			$s['og_id'] = max( 0, $og );
		} else {
			$erreurs[] = 'Image sociale : média introuvable.';
		}
		$s['indexation']     = ! empty( $p['indexation'] );
		$s['website_jsonld'] = ! empty( $p['website_jsonld'] );
		update_option( EP_Site::OPT_SEO, $s, true );
		self::terminer( self::PAGE_SEO, $erreurs );
	}
}
