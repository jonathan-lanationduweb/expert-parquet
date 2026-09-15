<?php
/**
 * Back-office : pages dédiées, statut, notes, photographies, historique, export.
 *
 * ---------------------------------------------------------------------------
 * SANS TYPE DE CONTENU
 *
 * Deux pages d'administration ordinaires :
 *
 *   admin.php?page=expert-parquet-leads            la liste
 *   admin.php?page=expert-parquet-lead&ref=<réf>   la fiche
 *
 * et des actions `admin-post.php`. Le contrôle d'accès est direct — page ou
 * action → `current_user_can( EP_Lead::CAP )` — sans méta-capacités, sans
 * `map_meta_cap`, sans dépendance à `edit_posts`. C'est exactement la chaîne
 * qui avait cassé le back-office avec le type de contenu.
 *
 * L'URL de la fiche porte la RÉFÉRENCE publique, jamais l'identifiant SQL.
 *
 * ---------------------------------------------------------------------------
 * AFFICHAGE
 *
 * Tout ce qui vient de la base passe par `esc_html`/`esc_attr`/`esc_url` à
 * l'affichage, en plus de la validation à l'entrée. C'est ici que se joue la
 * protection contre le XSS stocké : une description piégée ne doit jamais
 * être interprétée dans le navigateur du gestionnaire.
 */

defined( 'ABSPATH' ) || exit;

class EP_Admin {

	public const PAGE_LISTE = 'expert-parquet-leads';
	public const PAGE_FICHE = 'expert-parquet-lead';

	public static function init(): void {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_notices', array( __CLASS__, 'avis' ) );
		/* Les anciennes adresses du type de contenu (schéma ≤ 2) mènent à la
		   nouvelle liste plutôt qu'à l'erreur « type de contenu invalide ». */
		add_action( 'admin_init', array( __CLASS__, 'rediriger_ancien_cpt' ) );

		add_action( 'admin_post_ep_statut', array( __CLASS__, 'action_statut' ) );
		add_action( 'admin_post_ep_note', array( __CLASS__, 'action_note' ) );
		add_action( 'admin_post_ep_photo', array( __CLASS__, 'action_photo' ) );
		add_action( 'admin_post_ep_supprimer_photo', array( __CLASS__, 'action_supprimer_photo' ) );
		add_action( 'admin_post_ep_supprimer', array( __CLASS__, 'action_supprimer' ) );
		add_action( 'admin_post_ep_export', array( __CLASS__, 'exporter' ) );
	}

	/* ------------------------------------------------------------------ URLs */

	public static function url_liste(): string {
		return admin_url( 'admin.php?page=' . self::PAGE_LISTE );
	}

	public static function url_fiche( string $ref ): string {
		return admin_url( 'admin.php?page=' . self::PAGE_FICHE . '&ref=' . rawurlencode( $ref ) );
	}

	/* ------------------------------------------------------------------ menu */

	public static function menu(): void {
		add_menu_page( 'Demandes — Expert Parquet', 'Expert Parquet', EP_Lead::CAP, self::PAGE_LISTE, array( __CLASS__, 'page_liste' ), 'dashicons-clipboard', 26 );
		add_submenu_page( self::PAGE_LISTE, 'Demandes', 'Demandes', EP_Lead::CAP, self::PAGE_LISTE, array( __CLASS__, 'page_liste' ) );
		/* La fiche : une page enregistrée mais absente du menu. Parent VIDE, et
		   non `remove_submenu_page()` après coup : retirer l'entrée du menu
		   ferait échouer `user_can_access_admin_page()`, qui retrouve la page
		   par son parent — d'où un 403 pour tout le monde, administrateur
		   compris. */
		$hook = add_submenu_page( '', 'Demande', 'Demande', EP_Lead::CAP, self::PAGE_FICHE, array( __CLASS__, 'page_fiche' ) );
		/* Sans parent, WordPress ne retrouve pas le titre de la page et passe
		   `null` à `strip_tags()` dans admin-header.php — une dépréciation PHP
		   à chaque affichage de fiche. On le pose nous-mêmes, avant l'en-tête. */
		add_action(
			'load-' . $hook,
			static function () {
				$GLOBALS['title'] = 'Demande — Expert Parquet';
			}
		);
	}

	public static function rediriger_ancien_cpt(): void {
		global $pagenow;
		if ( 'edit.php' === $pagenow && isset( $_GET['post_type'] ) && 'ep_lead' === $_GET['post_type'] ) {
			wp_safe_redirect( self::url_liste(), 301 );
			exit;
		}
	}

	private static function exiger(): void {
		if ( ! current_user_can( EP_Lead::CAP ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
	}

	private static function style(): void {
		echo '<style>
		.ep-statut{display:inline-block;padding:2px 8px;border-radius:10px;background:#f0f0f1;font-size:12px}
		.ep-statut--new{background:#dff0ff}.ep-statut--to_contact,.ep-statut--contacted{background:#fff3cd}
		.ep-statut--qualified,.ep-statut--quote{background:#e5f3e5}.ep-statut--won{background:#c8e6c9}
		.ep-statut--lost,.ep-statut--archived{background:#e9e9e9}.ep-statut--spam{background:#f8d7da}
		.ep-fiche{display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-top:16px}
		.ep-fiche .postbox{margin:0 0 16px}.ep-fiche .inside{padding:0 12px 12px}
		.ep-fiche table.widefat th{width:220px}
		.ep-photos{display:flex;flex-wrap:wrap;gap:10px}.ep-photos figure{margin:0;text-align:center}
		.ep-photos img{width:140px;height:140px;object-fit:cover;border:1px solid #ccd0d4;display:block}
		.ep-journal li{margin-bottom:.7em}.ep-journal code{font-size:11px}
		@media (max-width:1100px){.ep-fiche{grid-template-columns:1fr}}
		</style>';
	}

	/* ----------------------------------------------------------------- liste */

	public static function page_liste(): void {
		self::exiger();
		self::style();
		$table = new EP_Liste_Demandes();
		$table->prepare_items();
		echo '<div class="wrap"><h1 class="wp-heading-inline">Demandes</h1><hr class="wp-header-end">';
		self::message();
		$table->views();
		echo '<form method="get">';
		printf( '<input type="hidden" name="page" value="%s">', esc_attr( self::PAGE_LISTE ) );
		$f = EP_Liste_Demandes::filtres();
		if ( $f['status'] ) {
			printf( '<input type="hidden" name="ep_status" value="%s">', esc_attr( $f['status'] ) );
		}
		$table->search_box( 'Rechercher (nom, e-mail, téléphone, référence, ville, code postal)', 'ep' );
		$table->display();
		echo '</form></div>';
	}

	/* ----------------------------------------------------------------- fiche */

	public static function page_fiche(): void {
		self::exiger();
		self::style();
		$ref  = isset( $_GET['ref'] ) ? sanitize_text_field( wp_unslash( (string) $_GET['ref'] ) ) : '';
		$lead = EP_Leads_Repository::par_reference( $ref );
		echo '<div class="wrap">';
		if ( ! $lead ) {
			echo '<h1>Demande</h1><p>Demande introuvable.</p><p><a href="' . esc_url( self::url_liste() ) . '">← Retour à la liste</a></p></div>';
			return;
		}
		printf(
			'<h1 class="wp-heading-inline">%s</h1> <span class="ep-statut ep-statut--%s">%s</span><hr class="wp-header-end">',
			esc_html( EP_Lead::titre( $lead ) ),
			esc_attr( $lead['status'] ),
			esc_html( EP_Lead::libelle_statut( $lead['status'] ) )
		);
		self::message();
		printf( '<p><a href="%s">← Toutes les demandes</a></p>', esc_url( self::url_liste() ) );
		echo '<div class="ep-fiche"><div>';
		self::boite( 'Demande', self::html_detail( $lead ) );
		self::boite( 'Photographies', self::html_photos( $lead ) );
		echo '</div><div>';
		self::boite( 'Suivi', self::html_suivi( $lead ) );
		self::boite( 'Notes internes', self::html_notes( $lead ) );
		self::boite( 'Historique', self::html_journal( $lead ) );
		self::boite( 'Effacement', self::html_effacement( $lead ) );
		echo '</div></div></div>';
	}

	private static function boite( string $titre, string $html ): void {
		printf( '<div class="postbox"><div class="postbox-header"><h2 class="hndle">%s</h2></div><div class="inside">%s</div></div>', esc_html( $titre ), $html );
	}

	private static function html_detail( array $lead ): string {
		$champs = 'contact' === $lead['form_type'] ? EP_Schema::champs_contact() : EP_Schema::champs_devis();
		$h      = '<table class="widefat striped"><tbody>';
		$h     .= sprintf( '<tr><th>Référence</th><td><code>%s</code></td></tr>', esc_html( $lead['public_id'] ) );
		$h     .= sprintf( '<tr><th>Type</th><td>%s</td></tr>', 'devis' === $lead['form_type'] ? 'Demande d’expertise' : 'Contact' );
		foreach ( $champs as $nom => $regle ) {
			$v = EP_Leads_Repository::valeur( $lead, $nom );
			if ( '' === $v || array() === $v ) {
				continue;
			}
			$h .= sprintf( '<tr><th>%s</th><td>%s</td></tr>', esc_html( $regle[3] ), nl2br( esc_html( EP_Schema::afficher( $regle, $v ) ) ) );
		}
		$h .= sprintf( '<tr><th>Reçue le</th><td>%s</td></tr>', esc_html( mysql2date( 'd/m/Y à H\hi', $lead['created_at'] ) ) );
		$h .= sprintf( '<tr><th>Page d’origine</th><td>%s</td></tr>', esc_html( $lead['source_url'] ?: '—' ) );
		$h .= sprintf( '<tr><th>Référent</th><td>%s</td></tr>', esc_html( $lead['referrer_url'] ?: '—' ) );
		$h .= sprintf( '<tr><th>Consentement</th><td>%s (version %s, %s)</td></tr>', esc_html( $lead['legal_basis'] ), esc_html( $lead['consent_version'] ), esc_html( $lead['consent_at'] ?: '—' ) );
		if ( $lead['closed_at'] ) {
			$h .= sprintf( '<tr><th>Close le</th><td>%s</td></tr>', esc_html( mysql2date( 'd/m/Y à H\hi', $lead['closed_at'] ) ) );
		}
		if ( $lead['diagnostic_context'] ) {
			$ctx = json_decode( (string) $lead['diagnostic_context'], true );
			$h  .= '<tr><th>Pré-diagnostic</th><td>';
			$h  .= '<p class="description">Réponses données au pré-diagnostic en ligne. C’est une orientation, pas un constat ; le visiteur a pu les modifier dans le formulaire.</p>';
			if ( is_array( $ctx ) ) {
				$h .= '<ul style="margin:0">';
				foreach ( $ctx as $k => $v ) {
					$h .= sprintf( '<li><code>%s</code> : %s</li>', esc_html( (string) $k ), esc_html( is_array( $v ) ? implode( ', ', array_map( 'strval', $v ) ) : (string) $v ) );
				}
				$h .= '</ul>';
			} else {
				$h .= '<code>' . esc_html( (string) $lead['diagnostic_context'] ) . '</code>';
			}
			$h .= '</td></tr>';
		}
		return $h . '</tbody></table>';
	}

	private static function html_photos( array $lead ): string {
		$photos = EP_Photos_Repository::pour_lead( $lead['id'] );
		if ( ! $photos ) {
			return '<p>Aucune photographie.</p>';
		}
		$h = '<p class="description">Fichiers stockés hors de la racine web, servis uniquement à une session autorisée.</p><div class="ep-photos">';
		foreach ( $photos as $p ) {
			$url = wp_nonce_url( admin_url( 'admin-post.php?action=ep_photo&ref=' . rawurlencode( $lead['public_id'] ) . '&photo=' . rawurlencode( $p['public_id'] ) ), 'ep_photo_' . $lead['public_id'] );
			$sup = wp_nonce_url( admin_url( 'admin-post.php?action=ep_supprimer_photo&ref=' . rawurlencode( $lead['public_id'] ) . '&photo=' . rawurlencode( $p['public_id'] ) ), 'ep_supprimer_photo_' . $p['public_id'] );
			$h  .= sprintf(
				'<figure><a href="%1$s" target="_blank" rel="noopener"><img src="%1$s" alt=""></a><figcaption class="description">%2$s × %3$s · %4$s Ko<br><a href="%5$s" onclick="return confirm(\'Supprimer définitivement cette photographie ?\')">Supprimer</a></figcaption></figure>',
				esc_url( $url ),
				(int) $p['width'],
				(int) $p['height'],
				(int) round( $p['size_bytes'] / 1024 ),
				esc_url( $sup )
			);
		}
		return $h . '</div>';
	}

	private static function html_suivi( array $lead ): string {
		$h  = '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
		$h .= '<input type="hidden" name="action" value="ep_statut">';
		$h .= '<input type="hidden" name="ref" value="' . esc_attr( $lead['public_id'] ) . '">';
		$h .= wp_nonce_field( 'ep_statut_' . $lead['public_id'], '_wpnonce', true, false );
		$h .= '<p><label for="ep_statut"><strong>Statut</strong></label><br><select id="ep_statut" name="ep_statut" style="width:100%">';
		foreach ( EP_Lead::statuts() as $cle => $libelle ) {
			$h .= sprintf( '<option value="%s"%s>%s</option>', esc_attr( $cle ), selected( $lead['status'], $cle, false ), esc_html( $libelle ) );
		}
		$h .= '</select></p>';
		$h .= '<p class="description">Gagnée, Perdue et Archivée sont des statuts clos : la durée de conservation court à partir de là.</p>';
		$h .= '<p><button class="button button-primary" type="submit">Enregistrer le statut</button></p></form>';
		return $h;
	}

	private static function html_notes( array $lead ): string {
		$h  = '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
		$h .= '<input type="hidden" name="action" value="ep_note">';
		$h .= '<input type="hidden" name="ref" value="' . esc_attr( $lead['public_id'] ) . '">';
		$h .= wp_nonce_field( 'ep_note_' . $lead['public_id'], '_wpnonce', true, false );
		$h .= '<p><label for="ep_note" class="screen-reader-text">Nouvelle note</label><textarea id="ep_note" name="ep_note" rows="3" style="width:100%" placeholder="Visible uniquement ici." required></textarea></p>';
		$h .= '<p><button class="button" type="submit">Ajouter la note</button></p></form>';
		$notes = EP_Notes_Repository::pour_lead( $lead['id'] );
		if ( ! $notes ) {
			return $h . '<p class="description">Aucune note.</p>';
		}
		$h .= '<ul class="ep-journal" style="margin:0">';
		foreach ( $notes as $n ) {
			$auteur = $n['wp_user_id'] ? get_userdata( $n['wp_user_id'] ) : null;
			$h     .= sprintf(
				'<li>%s<br><span class="description">%s%s</span></li>',
				nl2br( esc_html( $n['note'] ) ),
				esc_html( mysql2date( 'd/m/Y H\hi', $n['created_at'] ) ),
				$auteur ? ' — ' . esc_html( $auteur->display_name ) : ''
			);
		}
		return $h . '</ul>';
	}

	private static function html_journal( array $lead ): string {
		$events = EP_Events_Repository::pour_lead( $lead['id'] );
		if ( ! $events ) {
			return '<p>—</p>';
		}
		$h = '<ul class="ep-journal" style="margin:0">';
		foreach ( array_reverse( $events ) as $e ) {
			$auteur = $e['wp_user_id'] ? get_userdata( $e['wp_user_id'] ) : null;
			$h     .= sprintf(
				'<li><strong>%s</strong><br><span class="description">%s%s · <code>%s</code></span></li>',
				esc_html( EP_Events_Repository::decrire( $e ) ),
				esc_html( mysql2date( 'd/m/Y H\hi', $e['created_at'] ) ),
				$auteur ? ' — ' . esc_html( $auteur->display_name ) : '',
				esc_html( $e['event_type'] )
			);
		}
		return $h . '</ul>';
	}

	private static function html_effacement( array $lead ): string {
		$h  = '<p class="description">Efface définitivement la demande, ses photographies, ses notes et son historique. À utiliser pour une demande d’effacement (RGPD) ou une erreur manifeste. Irréversible.</p>';
		$h .= '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" onsubmit="return confirm(\'Effacer définitivement cette demande et tout ce qui s’y rattache ?\')">';
		$h .= '<input type="hidden" name="action" value="ep_supprimer"><input type="hidden" name="ref" value="' . esc_attr( $lead['public_id'] ) . '">';
		$h .= wp_nonce_field( 'ep_supprimer_' . $lead['public_id'], '_wpnonce', true, false );
		$h .= '<p><button class="button button-link-delete" type="submit">Effacer la demande</button></p></form>';
		return $h;
	}

	/* --------------------------------------------------------------- actions */

	/** Capacité d'abord, nonce ensuite ; la demande est retrouvée par référence. */
	private static function preparer_action( string $nonce_action, string $methode = 'POST' ): array {
		self::exiger();
		$src = 'POST' === $methode ? $_POST : $_GET;
		$ref = isset( $src['ref'] ) ? sanitize_text_field( wp_unslash( (string) $src['ref'] ) ) : '';
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( (string) ( $src['_wpnonce'] ?? '' ) ) ), $nonce_action . $ref ) ) {
			wp_die( 'Jeton de sécurité invalide ou expiré.', 'Accès refusé', array( 'response' => 403 ) );
		}
		$lead = EP_Leads_Repository::par_reference( $ref );
		if ( ! $lead ) {
			wp_die( 'Demande introuvable.', 'Introuvable', array( 'response' => 404 ) );
		}
		return $lead;
	}

	private static function retour( string $ref, string $msg ): void {
		wp_safe_redirect( add_query_arg( 'ep_msg', $msg, $ref ? self::url_fiche( $ref ) : self::url_liste() ) );
		exit;
	}

	public static function action_statut(): void {
		$lead    = self::preparer_action( 'ep_statut_' );
		$nouveau = sanitize_key( (string) ( $_POST['ep_statut'] ?? '' ) );
		if ( ! isset( EP_Lead::statuts()[ $nouveau ] ) ) {
			self::retour( $lead['public_id'], 'statut_invalide' );
		}
		$ancien = EP_Leads_Repository::changer_statut( $lead['id'], $nouveau );
		if ( null !== $ancien ) {
			EP_Events_Repository::consigner( $lead['id'], 'status_changed', array( 'old_status' => $ancien, 'new_status' => $nouveau ) );
		}
		self::retour( $lead['public_id'], 'statut' );
	}

	public static function action_note(): void {
		$lead = self::preparer_action( 'ep_note_' );
		$note = trim( (string) wp_unslash( $_POST['ep_note'] ?? '' ) );
		if ( '' === $note ) {
			self::retour( $lead['public_id'], 'note_vide' );
		}
		if ( null === EP_Notes_Repository::ajouter( $lead['id'], get_current_user_id(), $note ) ) {
			/* La base a refusé le texte (UTF-8 invalide, par exemple). On le
			   dit, et on rend le texte nettoyé pour qu'il ne soit pas à retaper. */
			set_transient( 'ep_note_perdue_' . get_current_user_id(), wp_check_invalid_utf8( $note, true ), 5 * MINUTE_IN_SECONDS );
			self::retour( $lead['public_id'], 'note_perdue' );
		}
		EP_Events_Repository::consigner( $lead['id'], 'note_added' );
		self::retour( $lead['public_id'], 'note' );
	}

	/** Sert une photographie ; la capacité est vérifiée dans EP_Photos::servir, avant toute lecture disque. */
	public static function action_photo(): void {
		$lead = self::preparer_action( 'ep_photo_', 'GET' );
		EP_Photos::servir( $lead['id'], sanitize_text_field( wp_unslash( (string) ( $_GET['photo'] ?? '' ) ) ) );
	}

	public static function action_supprimer_photo(): void {
		self::exiger();
		$ref   = sanitize_text_field( wp_unslash( (string) ( $_GET['ref'] ?? '' ) ) );
		$photo = sanitize_text_field( wp_unslash( (string) ( $_GET['photo'] ?? '' ) ) );
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( (string) ( $_GET['_wpnonce'] ?? '' ) ) ), 'ep_supprimer_photo_' . $photo ) ) {
			wp_die( 'Jeton de sécurité invalide ou expiré.', 'Accès refusé', array( 'response' => 403 ) );
		}
		$lead = EP_Leads_Repository::par_reference( $ref );
		$p    = $lead ? EP_Photos_Repository::par_reference( $lead['id'], $photo ) : null;
		if ( $p ) {
			EP_Photos::supprimer_photo( $p, get_current_user_id() );
		}
		self::retour( $ref, 'photo_supprimee' );
	}

	public static function action_supprimer(): void {
		$lead = self::preparer_action( 'ep_supprimer_' );
		EP_Lead::effacer( $lead['id'], 'back-office', get_current_user_id() );
		self::retour( '', 'effacee' );
	}

	/* ---------------------------------------------------------------- export */

	/**
	 * Export CSV — exploitation courante, et droit d'accès / portabilité.
	 *
	 * Libellés lisibles, pas codes internes. Toute cellule commençant par un
	 * caractère qu'un tableur interpréterait comme une formule (= + - @, ou une
	 * tabulation/retour) est préfixée d'une apostrophe : une description
	 * commençant par « =HYPERLINK(... » ne s'exécutera pas dans Excel.
	 */
	public static function exporter(): void {
		self::exiger();
		if ( ! check_admin_referer( 'ep_export' ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
		$filtres  = EP_Liste_Demandes::filtres();
		$demandes = EP_Leads_Repository::tous( $filtres );

		nocache_headers();
		header( 'Content-Type: text/csv; charset=UTF-8' );
		header( 'Content-Disposition: attachment; filename=demandes-' . gmdate( 'Y-m-d' ) . '.csv' );

		$regles   = EP_Schema::champs_devis() + EP_Schema::champs_contact();
		$colonnes = array_merge( array( 'reference', 'formulaire', 'statut', 'recue_le', 'close_le', 'page' ), array_keys( $regles ) );

		$sortie = fopen( 'php://output', 'w' );
		fwrite( $sortie, "\xEF\xBB\xBF" ); // BOM : sans lui, Excel sous Windows abîme les accents.
		fputcsv( $sortie, $colonnes, ';' );
		foreach ( $demandes as $d ) {
			$ligne = array();
			foreach ( $colonnes as $c ) {
				switch ( $c ) {
					case 'reference':
						$v = $d['public_id'];
						break;
					case 'formulaire':
						$v = $d['form_type'];
						break;
					case 'statut':
						$v = EP_Lead::libelle_statut( $d['status'] );
						break;
					case 'recue_le':
						$v = $d['created_at'];
						break;
					case 'close_le':
						$v = $d['closed_at'] ?: '';
						break;
					case 'page':
						$v = $d['source_url'];
						break;
					default:
						$v = EP_Schema::afficher( $regles[ $c ], EP_Leads_Repository::valeur( $d, $c ) );
				}
				$ligne[] = self::cellule_sure( (string) $v );
			}
			fputcsv( $sortie, $ligne, ';' );
		}
		fclose( $sortie );

		EP_Events_Repository::consigner( 0, 'lead_exported', array( 'metadata' => array( 'count' => count( $demandes ), 'filtres' => array_filter( $filtres ) ) ) );
		exit;
	}

	private static function cellule_sure( string $v ): string {
		return ( '' !== $v && ( str_contains( '=+-@', $v[0] ) || "\t" === $v[0] || "\r" === $v[0] ) ) ? "'" . $v : $v;
	}

	/* ------------------------------------------------------------------ avis */

	private static function message(): void {
		$m = isset( $_GET['ep_msg'] ) ? sanitize_key( (string) $_GET['ep_msg'] ) : '';
		$textes = array(
			'statut'          => array( 'success', 'Statut enregistré.' ),
			'statut_invalide' => array( 'error', 'Statut inconnu.' ),
			'note'            => array( 'success', 'Note ajoutée.' ),
			'note_vide'       => array( 'warning', 'La note était vide.' ),
			'photo_supprimee' => array( 'success', 'Photographie supprimée.' ),
			'effacee'         => array( 'success', 'Demande effacée définitivement, photographies comprises.' ),
		);
		if ( isset( $textes[ $m ] ) ) {
			printf( '<div class="notice notice-%s is-dismissible"><p>%s</p></div>', esc_attr( $textes[ $m ][0] ), esc_html( $textes[ $m ][1] ) );
		}
		if ( 'note_perdue' === $m ) {
			$perdue = get_transient( 'ep_note_perdue_' . get_current_user_id() );
			delete_transient( 'ep_note_perdue_' . get_current_user_id() );
			echo '<div class="notice notice-error"><p><strong>Votre note n’a pas pu être enregistrée.</strong> Le texte contient des caractères que la base refuse. Retapez-le, ou collez-le depuis un éditeur de texte simple.</p>'
				. ( $perdue ? '<p><textarea rows="3" style="width:100%" readonly>' . esc_textarea( $perdue ) . '</textarea></p>' : '' ) . '</div>';
		}
	}

	/** Rappelle l'état de la configuration sur nos pages, sans interrompre le travail. */
	public static function avis(): void {
		$ecran = get_current_screen();
		if ( ! $ecran || ! str_contains( (string) $ecran->id, 'expert-parquet' ) ) {
			return;
		}
		$manquantes = array_keys( array_filter( EP_DB::tables_presentes(), static fn( $ok ) => ! $ok ) );
		if ( $manquantes ) {
			echo '<div class="notice notice-error"><p><strong>Tables manquantes :</strong> ' . esc_html( implode( ', ', $manquantes ) ) . '. Désactivez puis réactivez l’extension.</p></div>';
		}
		$limites = EP_Photos::limites_php();
		if ( $limites ) {
			echo '<div class="notice notice-warning"><p><strong>La configuration PHP est en deçà de ce que le formulaire accepte.</strong> Des photographies peuvent être perdues à la réception.</p><ul style="list-style:disc;margin-left:2em">';
			foreach ( $limites as $l ) {
				echo '<li>' . esc_html( $l ) . '</li>';
			}
			echo '</ul></div>';
		}
		if ( ! EP_Purge::configuree() ) {
			echo '<div class="notice notice-warning"><p><strong>Aucune durée de conservation configurée.</strong> Les demandes closes ne sont pas effacées automatiquement tant que <code>EP_CONSERVATION_MOIS</code> n’est pas définie dans <code>wp-config.php</code> — et la même valeur doit être annoncée par le site (<code>RGPD.conservationMois</code>).</p></div>';
		}
		if ( ! EP_Mail::configure() ) {
			echo '<div class="notice notice-warning"><p><strong>Aucun fournisseur d’envoi configuré.</strong> Les notifications et accusés de réception sont écrits dans un journal privé au lieu d’être expédiés. Renseigner <code>EP_SMTP_HOTE</code> et <code>EP_MAIL_DEST</code> dans <code>wp-config.php</code> pour les activer.</p></div>';
		}
	}
}
