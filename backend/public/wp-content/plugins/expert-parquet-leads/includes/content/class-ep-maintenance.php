<?php
/**
 * Mode maintenance du site public.
 *
 * ---------------------------------------------------------------------------
 * UNE VRAIE INTERCEPTION SERVEUR, IMMÉDIATE
 *
 * Le site public est du HTML statique servi par Apache depuis la racine du
 * projet, où `AllowOverride All` est accordé. Le plugin y entretient un bloc
 * dans `.htaccess` (entre marqueurs, comme WordPress le fait pour ses
 * permaliens) qui :
 *
 *   - teste l'existence d'un FICHIER TÉMOIN hors racine web
 *     (backend-private/maintenance/active) : activer, c'est créer ce fichier,
 *     désactiver, c'est le supprimer — effet immédiat, aucun rebuild ;
 *   - répond 503 Service Unavailable avec `Retry-After`, `X-Robots-Tag:
 *     noindex` et la page /maintenance.html en corps, pour TOUTE adresse
 *     publique ;
 *   - laisse passer /wp-admin, /wp-login.php, /wp-json, /wp-content,
 *     /wp-includes (de toute façon servis par alias, hors de ce dossier), la
 *     page de maintenance et ses ressources (/css, /assets) ;
 *   - laisse passer le navigateur qui porte le cookie de contournement, posé
 *     par un administrateur depuis l'écran « Publication du site » ;
 *   - hors maintenance, ne sert /maintenance.html qu'au navigateur qui porte
 *     le cookie d'aperçu : la page n'est jamais indexable ni visible par hasard.
 *
 * La page elle-même est écrite par ce plugin (HTML statique, feuille
 * css/pages/maintenance.css, image copiée depuis la médiathèque dans
 * assets/maintenance/) à chaque enregistrement des réglages.
 */

defined( 'ABSPATH' ) || exit;

class EP_Maintenance {

	public const OPTION  = 'ep_maintenance';
	public const MARQUEUR = 'Expert Parquet maintenance';

	public static function init(): void {
		add_action( 'admin_post_ep_maintenance_enregistrer', array( __CLASS__, 'action_enregistrer' ) );
		add_action( 'admin_post_ep_maintenance_basculer', array( __CLASS__, 'action_basculer' ) );
		add_action( 'admin_post_ep_maintenance_apercu', array( __CLASS__, 'action_apercu' ) );
		add_action( 'admin_post_ep_maintenance_contourner', array( __CLASS__, 'action_contourner' ) );
		add_action( 'admin_post_ep_maintenance_visiteur', array( __CLASS__, 'action_visiteur' ) );
		add_action( 'admin_bar_menu', array( __CLASS__, 'barre' ), 80 );
	}

	/* ------------------------------------------------------------ réglages */

	public static function defauts(): array {
		return array(
			'actif'        => false,
			'titre'        => 'Site en maintenance',
			'message'      => 'Nous mettons actuellement le site à jour. Nous revenons très bientôt.',
			'retour'       => '',
			'email'        => '',
			'bouton'       => 'Nous contacter',
			'image_id'     => 0,
			'jeton_bypass' => '',
			'jeton_apercu' => '',
		);
	}

	public static function reglages(): array {
		$r = get_option( self::OPTION );
		$r = is_array( $r ) ? $r : array();
		$r = array_merge( self::defauts(), $r );
		if ( '' === $r['jeton_bypass'] || '' === $r['jeton_apercu'] ) {
			$r['jeton_bypass'] = $r['jeton_bypass'] ?: bin2hex( random_bytes( 16 ) );
			$r['jeton_apercu'] = $r['jeton_apercu'] ?: bin2hex( random_bytes( 16 ) );
			update_option( self::OPTION, $r, true );
		}
		return $r;
	}

	public static function actif(): bool {
		return is_file( self::fichier_temoin() );
	}

	/* ------------------------------------------------------------ chemins */

	public static function racine(): string {
		return EP_Contenu::projet_dir();
	}

	public static function fichier_temoin(): string {
		return rtrim( EP_PRIVATE_DIR, '/\\' ) . '/maintenance/active';
	}

	public static function fichier_page(): string {
		return self::racine() . '/maintenance.html';
	}

	public static function fichier_htaccess(): string {
		return self::racine() . '/.htaccess';
	}

	/* ------------------------------------------------------------ actions */

	private static function exiger(): void {
		if ( ! current_user_can( EP_Roles::CAP_MAINTENANCE ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
	}

	private static function retour( string $msg ): void {
		wp_safe_redirect( add_query_arg( 'ep_msg', $msg, EP_Admin::url_page( EP_Admin_Contenu::PAGE_MAINTENANCE ) ) );
		exit;
	}

	public static function action_enregistrer(): void {
		self::exiger();
		check_admin_referer( 'ep_maintenance_enregistrer' );
		$p = wp_unslash( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- vérifié ci-dessus.
		$r = self::reglages();

		$r['titre']    = EP_Champs::texte_propre( (string) ( $p['titre'] ?? '' ) ) ?: self::defauts()['titre'];
		$r['message']  = EP_Champs::texte_propre( (string) ( $p['message'] ?? '' ) ) ?: self::defauts()['message'];
		$r['bouton']   = EP_Champs::texte_propre( (string) ( $p['bouton'] ?? '' ) ) ?: self::defauts()['bouton'];
		$email         = sanitize_email( (string) ( $p['email'] ?? '' ) );
		$r['email']    = is_email( $email ) ? $email : '';
		/* La date de retour : effacée seulement sur demande explicite (case cochée),
		   jamais modifiée automatiquement. */
		if ( ! empty( $p['effacer_retour'] ) ) {
			$r['retour'] = '';
		} else {
			$retour      = trim( (string) ( $p['retour'] ?? '' ) );
			$r['retour'] = preg_match( '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', $retour ) ? $retour : '';
		}
		$r['image_id'] = (int) ( $p['image_id'] ?? 0 );

		update_option( self::OPTION, $r, true );
		$erreur = self::appliquer( $r );
		self::retour( $erreur ? 'maintenance_erreur' : 'maintenance_enregistree' );
	}

	public static function action_basculer(): void {
		self::exiger();
		check_admin_referer( 'ep_maintenance_basculer' );
		$vers = isset( $_POST['etat'] ) && 'on' === $_POST['etat']; // phpcs:ignore WordPress.Security.NonceVerification.Missing
		$r    = self::reglages();
		$r['actif'] = $vers;
		update_option( self::OPTION, $r, true );
		$erreur = self::appliquer( $r );
		if ( $erreur ) {
			self::retour( 'maintenance_erreur' );
		}
		EP_Events_Repository::consigner( 0, 'maintenance_toggled', array( 'metadata' => array( 'actif' => $vers ) ) );
		self::retour( $vers ? 'maintenance_on' : 'maintenance_off' );
	}

	/** Pose le cookie d'aperçu et ouvre la page, sans rien activer. */
	public static function action_apercu(): void {
		self::exiger();
		check_admin_referer( 'ep_maintenance_apercu' );
		$r = self::reglages();
		if ( ! is_file( self::fichier_page() ) ) {
			self::appliquer( $r );
		}
		self::cookie( 'ep_maintenance_apercu', $r['jeton_apercu'], HOUR_IN_SECONDS );
		wp_redirect( home_url( '/maintenance.html' ) ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
		exit;
	}

	/** Pose le cookie de contournement : l'administrateur voit le vrai site malgré la maintenance. */
	public static function action_contourner(): void {
		self::exiger();
		check_admin_referer( 'ep_maintenance_contourner' );
		$r = self::reglages();
		self::cookie( 'ep_maintenance_bypass', $r['jeton_bypass'], 12 * HOUR_IN_SECONDS );
		/* Marqueur non secret, lisible par le JS du site statique : il permet
		   d'afficher la barre « vue administrateur » sans lire le jeton (httponly)
		   et sans requête superflue pour les visiteurs, qui ne l'ont jamais. */
		self::cookie( 'ep_admin_view', '1', 12 * HOUR_IN_SECONDS, false );
		wp_redirect( home_url( '/' ) ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
		exit;
	}

	/**
	 * « Voir comme un visiteur » : efface le cookie de contournement (et celui
	 * d'aperçu) puis renvoie sur l'accueil, où la vraie page 503/maintenance
	 * s'affiche. Évite à l'administrateur de vider ses cookies à la main. Le
	 * cookie étant httponly, seul le serveur peut l'effacer — d'où cette action.
	 * Geste de confort non sensible : aucune donnée changée, pas de nonce requis.
	 */
	public static function action_visiteur(): void {
		self::exiger();
		self::cookie( 'ep_maintenance_bypass', '', -3600 );
		self::cookie( 'ep_maintenance_apercu', '', -3600 );
		self::cookie( 'ep_admin_view', '', -3600, false );
		wp_redirect( home_url( '/' ) ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
		exit;
	}

	private static function cookie( string $nom, string $valeur, int $duree, bool $httponly = true ): void {
		setcookie( $nom, $valeur, array( 'expires' => time() + $duree, 'path' => '/', 'secure' => is_ssl(), 'httponly' => $httponly, 'samesite' => 'Lax' ) );
	}

	/** Un rappel visible partout dans l'administration quand le site est fermé. */
	public static function barre( $barre ): void {
		if ( ! is_object( $barre ) || ! self::actif() || ! current_user_can( EP_Roles::CAP_MAINTENANCE ) ) {
			return;
		}
		$barre->add_node(
			array(
				'id'    => 'ep-maintenance',
				'title' => '● Maintenance active',
				'href'  => EP_Admin::url_page( EP_Admin_Contenu::PAGE_MAINTENANCE ),
				'meta'  => array( 'class' => 'ep-barre-maintenance' ),
			)
		);
	}

	/* ------------------------------------------------------------ application */

	/**
	 * Met le disque en accord avec les réglages : page, image, .htaccess,
	 * fichier témoin. Renvoie un message d'erreur, ou null.
	 */
	public static function appliquer( array $r ): ?string {
		$racine = self::racine();
		if ( ! is_writable( $racine ) ) {
			return 'La racine du site n’est pas accessible en écriture.';
		}

		$image = self::copier_image( (int) $r['image_id'] );
		$ok    = (bool) file_put_contents( self::fichier_page(), self::html( $r, $image ), LOCK_EX );
		if ( ! $ok ) {
			return 'La page de maintenance n’a pas pu être écrite.';
		}

		if ( ! self::ecrire_htaccess( $r ) ) {
			return 'Le fichier .htaccess de la racine n’a pas pu être mis à jour.';
		}

		$temoin = self::fichier_temoin();
		wp_mkdir_p( dirname( $temoin ) );
		if ( ! empty( $r['actif'] ) ) {
			file_put_contents( $temoin, gmdate( 'c' ) . "\n", LOCK_EX );
		} elseif ( is_file( $temoin ) ) {
			unlink( $temoin );
		}
		return null;
	}

	/** Secondes avant le retour annoncé, pour `Retry-After` ; une heure par défaut. */
	private static function retry_after( array $r ): int {
		if ( empty( $r['retour'] ) ) {
			return 3600;
		}
		$ts = strtotime( $r['retour'] . ':00 ' . wp_timezone_string() );
		if ( ! $ts || $ts <= time() ) {
			return 3600;
		}
		return max( 60, $ts - time() );
	}

	/** Le bloc .htaccess, entre marqueurs. */
	private static function ecrire_htaccess( array $r ): bool {
		if ( ! function_exists( 'insert_with_markers' ) ) {
			require_once ABSPATH . 'wp-admin/includes/misc.php';
		}
		$bypass = preg_quote( $r['jeton_bypass'], '/' );
		$apercu = preg_quote( $r['jeton_apercu'], '/' );
		$retry  = self::retry_after( $r );
		$lignes = array(
			'# Mode maintenance du site public — geré par le plugin Expert Parquet.',
			'# Activation : presence du fichier temoin backend-private/maintenance/active.',
			'<IfModule mod_rewrite.c>',
			'RewriteEngine On',
			'# Jamais bloque : administration, API, ressources de la page de maintenance.',
			'RewriteCond %{REQUEST_URI} !^/(wp-admin|wp-includes|wp-content|wp-json|wp-login\.php|wp-cron\.php|maintenance\.html|css/|assets/|favicon\.ico|robots\.txt) [NC]',
			'# Un administrateur qui a demande a voir le site passe (cookie pose depuis WordPress).',
			'RewriteCond %{HTTP_COOKIE} !(^|;\s*)ep_maintenance_bypass=' . $bypass . '(;|$)',
			'RewriteCond %{DOCUMENT_ROOT}/backend-private/maintenance/active -f',
			'RewriteRule ^ - [E=EP_MAINT:1,R=503,L]',
			'# Hors maintenance, la page n\'est visible qu\'avec le cookie d\'apercu.',
			'RewriteCond %{REQUEST_URI} ^/maintenance\.html$',
			'RewriteCond %{DOCUMENT_ROOT}/backend-private/maintenance/active !-f',
			'RewriteCond %{HTTP_COOKIE} !(^|;\s*)ep_maintenance_apercu=' . $apercu . '(;|$)',
			'RewriteRule ^ - [R=404,L]',
			'</IfModule>',
			'ErrorDocument 503 /maintenance.html',
			'<IfModule mod_headers.c>',
			'Header always set Retry-After "' . $retry . '" env=REDIRECT_EP_MAINT',
			'Header always set X-Robots-Tag "noindex, nofollow" env=REDIRECT_EP_MAINT',
			'Header always set Cache-Control "no-store" env=REDIRECT_EP_MAINT',
			'Header always set Retry-After "' . $retry . '" env=EP_MAINT',
			'Header always set X-Robots-Tag "noindex, nofollow" env=EP_MAINT',
			'Header always set Cache-Control "no-store" env=EP_MAINT',
			'</IfModule>',
		);
		return insert_with_markers( self::fichier_htaccess(), self::MARQUEUR, $lignes );
	}

	/**
	 * Copie l'image choisie (et ses tailles) dans assets/maintenance/ : la
	 * médiathèque n'est pas servie publiquement, la page doit se suffire.
	 */
	private static function copier_image( int $id ): ?array {
		$dossier = self::racine() . '/assets/maintenance';
		wp_mkdir_p( $dossier );
		foreach ( glob( $dossier . '/fond*' ) ?: array() as $ancien ) {
			@unlink( $ancien );
		}
		if ( $id <= 0 ) {
			return null;
		}
		$source = get_attached_file( $id );
		$meta   = (array) wp_get_attachment_metadata( $id );
		if ( ! $source || ! is_readable( $source ) ) {
			return null;
		}
		$ext = strtolower( pathinfo( $source, PATHINFO_EXTENSION ) ) ?: 'jpg';
		copy( $source, $dossier . '/fond.' . $ext );
		$srcset = array();
		foreach ( EP_Contenu::TAILLES as $l ) {
			$s = $meta['sizes'][ 'ep-' . $l ] ?? null;
			if ( $s && ! empty( $s['file'] ) && is_readable( dirname( $source ) . '/' . $s['file'] ) ) {
				copy( dirname( $source ) . '/' . $s['file'], $dossier . '/fond-' . $l . '.' . $ext );
				$srcset[] = '/assets/maintenance/fond-' . $l . '.' . $ext . ' ' . (int) ( $s['width'] ?? $l ) . 'w';
			}
		}
		$w = (int) ( $meta['width'] ?? 0 );
		$h = (int) ( $meta['height'] ?? 0 );
		if ( $w ) {
			$srcset[] = '/assets/maintenance/fond.' . $ext . ' ' . $w . 'w';
		}
		return array( 'src' => '/assets/maintenance/fond.' . $ext, 'srcset' => implode( ', ', $srcset ), 'width' => $w, 'height' => $h );
	}

	/* ------------------------------------------------------------ page */

	/** Même empreinte que tools/fingerprint.mjs : sha256(chemin . NUL . contenu en LF), 8 hexadécimaux. */
	private static function empreinte( string $relatif ): string {
		$f = self::racine() . '/' . $relatif;
		if ( ! is_readable( $f ) ) {
			return '';
		}
		$contenu = str_replace( array( "\r\n", "\r" ), "\n", (string) file_get_contents( $f ) );
		return substr( hash( 'sha256', $relatif . "\0" . $contenu ), 0, 8 );
	}

	private static function css( string $relatif ): string {
		$e = self::empreinte( $relatif );
		return '  <link rel="stylesheet" href="/' . $relatif . ( $e ? '?v=' . $e : '' ) . '">';
	}

	/** « le 20 novembre 2026 à 14 h 30 », ou vide. */
	/** La date de retour est-elle renseignée mais déjà passée ? (avertissement admin) */
	public static function retour_depassee( array $r ): bool {
		if ( empty( $r['retour'] ) ) {
			return false;
		}
		$ts = strtotime( $r['retour'] . ':00 ' . wp_timezone_string() );
		return (bool) $ts && $ts <= time();
	}

	public static function retour_lisible( array $r ): string {
		if ( empty( $r['retour'] ) ) {
			return '';
		}
		$ts = strtotime( $r['retour'] . ':00 ' . wp_timezone_string() );
		/* Date absente, invalide ou dépassée : aucune date n'est montrée au public
		   (on n'annonce pas un retour déjà passé). La date reste enregistrée telle
		   quelle — elle n'est jamais modifiée automatiquement. */
		if ( ! $ts || $ts <= time() ) {
			return '';
		}
		$mois = array( 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre' );
		$d    = (int) wp_date( 'j', $ts );
		$m    = $mois[ (int) wp_date( 'n', $ts ) - 1 ];
		$a    = wp_date( 'Y', $ts );
		$hh   = (int) wp_date( 'G', $ts );
		$mm   = wp_date( 'i', $ts );
		return 'le ' . ( 1 === $d ? '1er' : $d ) . ' ' . $m . ' ' . $a . ' à ' . $hh . ' h' . ( '00' === $mm ? '' : ' ' . $mm );
	}

	public static function html( array $r, ?array $image ): string {
		$e      = static fn( string $s ): string => esc_html( $s );
		$titre  = $r['titre'];
		$retour = self::retour_lisible( $r );
		$cta    = '';
		if ( $r['email'] ) {
			/* Un seul bouton, et seulement si un contact existe : aucune
			   fonction « être prévenu » n'existe, donc aucun second bouton. */
			$cta = '        <p class="maint__actions"><a class="btn btn--primary btn--lg" href="mailto:' . esc_attr( $r['email'] ) . '">' . $e( $r['bouton'] ) . '<span class="maint__fleche" aria-hidden="true">&rarr;</span></a></p>' . "\n";
		}
		$media = '';
		if ( $image ) {
			$media = '    <div class="maint__media" aria-hidden="true">' . "\n"
				. '      <img src="' . esc_attr( $image['src'] ) . '"' . ( $image['srcset'] ? ' srcset="' . esc_attr( $image['srcset'] ) . '" sizes="(min-width: 901px) 45vw, 100vw"' : '' ) . ' alt=""' . ( $image['width'] ? ' width="' . $image['width'] . '" height="' . $image['height'] . '"' : '' ) . ' fetchpriority="high" decoding="async">' . "\n"
				. '    </div>' . "\n";
		}

		return '<!doctype html>' . "\n"
			. '<html lang="fr">' . "\n"
			. '<head>' . "\n"
			. '  <meta charset="utf-8">' . "\n"
			. '  <meta name="viewport" content="width=device-width, initial-scale=1">' . "\n"
			. '  <title>' . $e( $titre ) . ' | Expert Parquet</title>' . "\n"
			. '  <meta name="description" content="' . esc_attr( $r['message'] ) . '">' . "\n"
			. '  <meta name="robots" content="noindex, nofollow">' . "\n"
			. '  <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">' . "\n"
			. '  <link rel="shortcut icon" href="/assets/icons/favicon.ico">' . "\n"
			. '  <meta name="theme-color" content="#17181A">' . "\n"
			. '  <link rel="preload" href="/assets/fonts/inter-latin-var.woff2" as="font" type="font/woff2" crossorigin>' . "\n"
			. '  <link rel="preload" href="/assets/fonts/inter-tight-latin-var.woff2" as="font" type="font/woff2" crossorigin>' . "\n"
			. implode( "\n", array_map( array( __CLASS__, 'css' ), array( 'css/fonts.css', 'css/variables.css', 'css/theme.css', 'css/reset.css', 'css/base.css', 'css/components.css', 'css/pages/maintenance.css' ) ) ) . "\n"
			. '</head>' . "\n"
			. '<body class="maintenance' . ( $image ? '' : ' maintenance--sans-image' ) . '">' . "\n"
			. '  <a class="skip-link" href="#main">Aller au contenu principal</a>' . "\n"
			. '  <main id="main" class="maint">' . "\n"
			. '    <section class="maint__panel">' . "\n"
			. '      <a class="maint__brand" href="/" aria-label="Expert Parquet"><img src="/assets/brand/expert-parquet-logo-on-light.png" alt="" width="338" height="128" fetchpriority="high" decoding="async"></a>' . "\n"
			. '      <div class="maint__content">' . "\n"
			. '        <p class="maint__kicker"><span class="maint__kicker-line" aria-hidden="true"></span>Maintenance</p>' . "\n"
			. '        <h1 class="maint__title">' . $e( $titre ) . '</h1>' . "\n"
			. '        <p class="maint__text">' . $e( $r['message'] ) . '</p>' . "\n"
			. '        <p class="maint__retour">' . ( $retour ? 'Retour prévu ' . $e( $retour ) . '.' : 'Retour prévu prochainement.' ) . '</p>' . "\n"
			. $cta
			. '      </div>' . "\n"
			. '    </section>' . "\n"
			. $media
			. '  </main>' . "\n"
			. '  <footer class="maint__footer">' . "\n"
			. '    <img src="/assets/brand/expert-parquet-logo-on-dark.png" alt="Expert Parquet" width="338" height="128" loading="lazy" decoding="async">' . "\n"
			. '    <p>Comprendre votre besoin parquet, puis aller à la bonne solution.</p>' . "\n"
			. '  </footer>' . "\n"
			. '</body>' . "\n"
			. '</html>' . "\n";
	}

	/* ------------------------------------------------------------ écran dédié */

	/** La page Maintenance dédiée : le panneau complet dans un écran à part. */
	public static function ecran(): void {
		if ( ! current_user_can( EP_Roles::CAP_MAINTENANCE ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
		$actif = self::actif();
		echo '<div class="wrap ep-ecran ep-gestion"><div class="ep-entete-page"><div><h1 class="wp-heading-inline">Maintenance</h1><p class="ep-entete__sous-titre">Afficher une page temporaire aux visiteurs, sans toucher au site publié.</p></div>';
		printf( '<div class="ep-entete-page__actions"><a class="ep-lien-action" href="%s" target="_blank" rel="noopener">Aperçu de la page <span class="dashicons dashicons-external" aria-hidden="true"></span></a></div>', esc_url( wp_nonce_url( admin_url( 'admin-post.php' ) . '?action=ep_maintenance_apercu', 'ep_maintenance_apercu' ) ) );
		echo '</div><hr class="wp-header-end" style="display:none">';
		EP_Admin_Contenu::messages();
		echo '<div class="ep-gestion__grille"><div class="ep-gestion__principal">';
		self::panneau();
		echo '</div><div class="ep-gestion__droite"><div class="ep-panneau"><h2 class="ep-panneau__titre"><span class="dashicons dashicons-info-outline" aria-hidden="true"></span>État du site</h2>';
		if ( $actif ) {
			echo '<p class="ep-statut"><span class="ep-pastille ep-pastille--actif"></span> Maintenance publique — <strong>ACTIVÉE</strong></p><p class="ep-panneau__texte">Les visiteurs voient la page de maintenance (HTTP 503).</p>';
			echo '<p class="ep-statut"><span class="ep-pastille ep-pastille--ok"></span> Accès administrateur — <strong>AUTORISÉ</strong></p><p class="ep-panneau__texte">Vous gardez l’accès au site et à WordPress.</p>';
		} else {
			echo '<p class="ep-statut"><span class="ep-pastille ep-pastille--ok"></span> Maintenance publique — <strong>DÉSACTIVÉE</strong></p><p class="ep-panneau__texte">Le site public est servi normalement.</p>';
		}
		printf( '<a class="ep-bouton ep-bouton--bloc" href="%s">Publication du site <span aria-hidden="true">→</span></a>', esc_url( EP_Admin::url_page( EP_Admin_Contenu::PAGE_PUBLICATION ) ) );
		echo '</div></div></div></div>';
	}

	/** Une carte compacte pour un rail : état + accès à la page Maintenance. */
	public static function carte(): void {
		$actif = self::actif();
		echo '<div class="ep-panneau"><h2 class="ep-panneau__titre"><span class="dashicons dashicons-hammer" aria-hidden="true"></span>Page de maintenance</h2>';
		if ( $actif ) {
			echo '<p class="ep-statut"><span class="ep-pastille ep-pastille--actif"></span> État : <span class="ep-etiquette ep-etiquette--actif">Activée</span></p><p class="ep-panneau__texte">Les visiteurs voient la page de maintenance.</p>';
		} else {
			echo '<p class="ep-statut"><span class="ep-pastille"></span> État : <span class="ep-etiquette ep-etiquette--off">Désactivée</span></p><p class="ep-panneau__texte">Le site public est en ligne.</p>';
		}
		printf( '<a class="ep-bouton ep-bouton--bloc" href="%s"><span class="dashicons dashicons-hammer" aria-hidden="true"></span>Gérer la maintenance <span aria-hidden="true">→</span></a>', esc_url( EP_Admin::url_page( EP_Admin_Contenu::PAGE_MAINTENANCE ) ) );
		echo '</div>';
	}

	/* ------------------------------------------------------------ panneau */

	/** Le panneau « Page de maintenance » : la configuration complète (page Maintenance dédiée). */
	public static function panneau(): void {
		$r      = self::reglages();
		$actif  = self::actif();
		$image  = $r['image_id'] ? wp_get_attachment_image( (int) $r['image_id'], 'thumbnail', false, array( 'class' => 'ep-image__apercu' ) ) : '';
		$admin  = admin_url( 'admin-post.php' );

		echo '<div class="ep-panneau ep-panneau--maintenance" id="maintenance">';

		/* En-tête : titre et interrupteur. L'interrupteur SOUMET la bascule,
		   après confirmation. */
		echo '<div class="ep-panneau__entete"><h2 class="ep-panneau__titre"><span class="dashicons dashicons-admin-generic" aria-hidden="true"></span>Page de maintenance</h2>';
		echo '<form method="post" action="' . esc_url( $admin ) . '" class="ep-toggle-form" data-ep-confirmer="' . esc_attr( $actif ? 'Rouvrir le site public ?' : 'Activer la maintenance ? Tous les visiteurs verront la page de maintenance immédiatement. Vous garderez l’accès à WordPress.' ) . '">';
		wp_nonce_field( 'ep_maintenance_basculer' );
		echo '<input type="hidden" name="action" value="ep_maintenance_basculer"><input type="hidden" name="etat" value="' . ( $actif ? 'off' : 'on' ) . '">';
		printf( '<button type="submit" class="ep-toggle%s" role="switch" aria-checked="%s" aria-label="%s"><span class="ep-toggle__curseur"></span></button><span class="ep-toggle__libelle">%s</span>', $actif ? ' ep-toggle--on' : '', $actif ? 'true' : 'false', $actif ? 'Désactiver la maintenance' : 'Activer la maintenance', $actif ? 'Activé' : 'Désactivé' );
		echo '</form></div>';

		if ( $actif ) {
			echo '<div class="ep-maint-statuts">';
			echo '<p class="ep-statut"><span class="ep-pastille ep-pastille--actif"></span> Maintenance publique — <strong>ACTIVÉE</strong></p><p class="ep-panneau__texte">Les visiteurs voient la page de maintenance.</p>';
			echo '<p class="ep-statut"><span class="ep-pastille ep-pastille--ok"></span> Accès administrateur — <strong>AUTORISÉ</strong></p><p class="ep-panneau__texte">Les administrateurs peuvent continuer à consulter le site.</p>';
			echo '<div class="ep-info"><span class="dashicons dashicons-info-outline" aria-hidden="true"></span><span>Si vous voyez encore le site normal, c’est parce que votre session administrateur contourne la maintenance. Les visiteurs non connectés voient bien la page de maintenance.</span></div>';
			printf( '<p class="ep-panneau__alerte"><a href="%s">Voir le site malgré la maintenance</a></p>', esc_url( wp_nonce_url( $admin . '?action=ep_maintenance_contourner', 'ep_maintenance_contourner' ) ) );
			echo '</div>';
		} else {
			echo '<p class="ep-statut"><span class="ep-pastille"></span> Maintenance publique — <strong>DÉSACTIVÉE</strong></p><p class="ep-panneau__texte">Le site est accessible normalement. Activez-la pour afficher une page temporaire aux visiteurs.</p>';
		}

		/* Réglages */
		echo '<form method="post" action="' . esc_url( $admin ) . '" class="ep-maint-form">';
		wp_nonce_field( 'ep_maintenance_enregistrer' );
		echo '<input type="hidden" name="action" value="ep_maintenance_enregistrer">';
		printf( '<p class="ep-champ"><label for="ep-m-titre">Titre de la page</label><input type="text" id="ep-m-titre" name="titre" value="%s"></p>', esc_attr( $r['titre'] ) );
		printf( '<p class="ep-champ"><label for="ep-m-message">Message affiché</label><textarea id="ep-m-message" name="message" rows="3">%s</textarea></p>', esc_textarea( $r['message'] ) );
		echo '<div class="ep-deux-champs">';
		printf( '<p class="ep-champ"><label for="ep-m-retour">Date de retour (optionnel)</label><input type="datetime-local" id="ep-m-retour" name="retour" value="%s"></p>', esc_attr( $r['retour'] ) );
		printf( '<p class="ep-champ"><label for="ep-m-email">Contact d’urgence (optionnel)</label><input type="email" id="ep-m-email" name="email" value="%s" placeholder="contact@…"></p>', esc_attr( $r['email'] ) );
		echo '</div>';
		if ( self::retour_depassee( $r ) ) {
			echo '<div class="ep-info ep-info--alerte"><span class="dashicons dashicons-warning" aria-hidden="true"></span><span>La date de retour configurée est dépassée. Elle n’est plus affichée aux visiteurs. Modifiez-la ci-dessus, ou <label class="ep-effacer-retour"><input type="checkbox" name="effacer_retour" value="1"> effacez-la</label>, puis enregistrez.</span></div>';
		}
		printf( '<p class="ep-champ ep-champ--discret"><label for="ep-m-bouton">Libellé du bouton de contact</label><input type="text" id="ep-m-bouton" name="bouton" value="%s"></p>', esc_attr( $r['bouton'] ) );
		printf( '<a class="ep-bouton ep-bouton--contour-terra ep-bouton--bloc" href="%s" target="_blank" rel="noopener">Aperçu de la page de maintenance <span class="dashicons dashicons-external" aria-hidden="true"></span></a>', esc_url( wp_nonce_url( $admin . '?action=ep_maintenance_apercu', 'ep_maintenance_apercu' ) ) );
		echo '<div class="ep-info"><span class="dashicons dashicons-info-outline" aria-hidden="true"></span><span>Lorsque le mode maintenance est actif, seule la page de maintenance est visible des visiteurs du site. Le retour annoncé est envoyé aux moteurs de recherche (Retry-After).</span></div>';
		printf(
			'<div class="ep-champ ep-image-ligne" data-ep-image><span class="ep-champ__libelle">Image de fond de la maintenance</span><div class="ep-image-ligne__corps"><div class="ep-image__zone ep-image-ligne__vignette">%s</div><div class="ep-image-ligne__actions"><span><button type="button" class="ep-bouton ep-bouton--contour ep-bouton--petit" data-ep-image-choisir><span class="dashicons dashicons-format-image" aria-hidden="true"></span>Remplacer l’image</button> <button type="button" class="ep-bouton ep-bouton--danger ep-bouton--petit" data-ep-image-retirer aria-label="Retirer l’image"%s><span class="dashicons dashicons-trash" aria-hidden="true"></span></button></span><span class="description">Format recommandé : 1920 × 1080 px<br>Image sobre et cohérente avec votre identité.</span></div></div><input type="hidden" name="image_id" value="%d" data-ep-image-id></div>',
			$image, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_get_attachment_image.
			$r['image_id'] ? '' : ' hidden',
			(int) $r['image_id']
		);
		echo '<p class="ep-panneau__pied"><button type="submit" class="ep-bouton ep-bouton--contour ep-bouton--petit">Enregistrer la page de maintenance</button></p>';
		echo '</form></div>';
	}
}
