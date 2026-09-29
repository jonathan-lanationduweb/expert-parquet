<?php
/**
 * Back-office : menu, actions, et ce qui est partagé par tous nos écrans.
 *
 * ---------------------------------------------------------------------------
 * RÉPARTITION
 *
 * Cette classe tient le MENU, les ACTIONS (`admin-post.php`) et les
 * utilitaires communs (URL, carte, badge, messages). Le rendu de chaque écran
 * vit dans sa propre classe :
 *
 *   EP_Admin_Tableau_Bord   l'accueil
 *   EP_Liste_Demandes       la liste (WP_List_Table), réutilisée par Contacts et Devis
 *   EP_Admin_Fiche          la fiche d'une demande
 *   EP_Admin_Photos         les photographies
 *   EP_Admin_Emails         l'état des courriels
 *   EP_Admin_Reglages       la configuration, en lecture seule
 *   EP_Etat_Systeme         les points de contrôle, partagés par trois écrans
 *
 * ---------------------------------------------------------------------------
 * SANS TYPE DE CONTENU
 *
 * Des pages d'administration ordinaires :
 *
 *   admin.php?page=expert-parquet                  le tableau de bord
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

	public const PAGE_TB       = 'expert-parquet';
	public const PAGE_LISTE    = 'expert-parquet-leads';
	public const PAGE_CONTACTS = 'expert-parquet-contacts';
	public const PAGE_DEVIS    = 'expert-parquet-devis';
	public const PAGE_PHOTOS   = 'expert-parquet-photos';
	public const PAGE_EMAILS   = 'expert-parquet-emails';
	public const PAGE_REGLAGES = 'expert-parquet-reglages';
	public const PAGE_FICHE    = 'expert-parquet-lead';

	public static function init(): void {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
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

	/**
	 * Branchements qui doivent exister HORS administration.
	 *
	 * `login_redirect` se déclenche sur `wp-login.php`, où `is_admin()` est
	 * faux : enregistré dans `init()`, le filtre ne serait jamais posé.
	 */
	public static function init_global(): void {
		add_filter( 'login_redirect', array( __CLASS__, 'apres_connexion' ), 10, 3 );
		add_action( 'admin_bar_menu', array( __CLASS__, 'barre' ), 999 );
	}

	/* ------------------------------------------------------------------ URLs */

	public static function url_page( string $slug, array $args = array() ): string {
		$url = admin_url( 'admin.php?page=' . $slug );
		return $args ? add_query_arg( $args, $url ) : $url;
	}

	public static function url_liste( array $args = array() ): string {
		return self::url_page( self::PAGE_LISTE, $args );
	}

	public static function url_fiche( string $ref ): string {
		return admin_url( 'admin.php?page=' . self::PAGE_FICHE . '&ref=' . rawurlencode( $ref ) );
	}

	/** Export CSV : l'action porte les filtres courants et un nonce. */
	public static function url_export( array $filtres = array() ): string {
		return wp_nonce_url(
			add_query_arg( array_filter( array_merge( array( 'action' => 'ep_export' ), $filtres ) ), admin_url( 'admin-post.php' ) ),
			'ep_export'
		);
	}

	/* ------------------------------------------------------------------ menu */

	public static function menu(): void {
		$cap = EP_Lead::CAP;

		/* Position 3 : juste sous le tableau de bord de WordPress. Ce back-office
		   n'a qu'un métier, il doit être la première chose qu'on voie. */
		add_menu_page( 'Expert Parquet', 'Expert Parquet', $cap, self::PAGE_TB, array( 'EP_Admin_Tableau_Bord', 'rendre' ), 'dashicons-clipboard', 3 );

		$pages = array(
			array( self::PAGE_TB, 'Tableau de bord', array( 'EP_Admin_Tableau_Bord', 'rendre' ) ),
			array( self::PAGE_LISTE, 'Demandes', array( __CLASS__, 'page_liste' ) ),
			array( self::PAGE_CONTACTS, 'Contacts', array( __CLASS__, 'page_contacts' ) ),
			array( self::PAGE_DEVIS, 'Devis', array( __CLASS__, 'page_devis' ) ),
			array( self::PAGE_PHOTOS, 'Photos', array( 'EP_Admin_Photos', 'rendre' ) ),
			array( self::PAGE_EMAILS, 'Emails', array( 'EP_Admin_Emails', 'rendre' ) ),
			array( self::PAGE_REGLAGES, 'Réglages', array( 'EP_Admin_Reglages', 'rendre' ) ),
		);
		foreach ( $pages as $p ) {
			add_submenu_page( self::PAGE_TB, $p[1] . ' — Expert Parquet', $p[1], $cap, $p[0], $p[2] );
		}

		/* La fiche : une page enregistrée mais absente du menu. Parent VIDE, et
		   non `remove_submenu_page()` après coup : retirer l'entrée du menu
		   ferait échouer `user_can_access_admin_page()`, qui retrouve la page
		   par son parent — d'où un 403 pour tout le monde, administrateur
		   compris. */
		$hook = add_submenu_page( '', 'Demande', 'Demande', $cap, self::PAGE_FICHE, array( 'EP_Admin_Fiche', 'rendre' ) );
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

	/**
	 * Feuille de style et script d'aperçu, UNIQUEMENT sur nos écrans.
	 *
	 * Charger notre CSS partout maquillerait des pages de WordPress que nous
	 * ne maîtrisons pas, et ferait payer un fichier de plus à chaque écran
	 * d'administration. La version suit `filemtime` : pas de cache tenace
	 * après une correction.
	 */
	public static function assets( string $hook ): void {
		if ( ! self::est_notre_ecran() ) {
			return;
		}
		$base = plugins_url( 'assets/', EP_PLUGIN_FILE );

		wp_enqueue_style( 'ep-admin', $base . 'admin.css', array(), self::version_fichier( 'assets/admin.css' ) );

		/* L'aperçu ne sert que là où il y a des photographies. `str_ends_with`
		   et non `str_contains` : le crochet de la liste se termine par
		   `expert-parquet-leads`, qui CONTIENT `expert-parquet-lead` — le
		   script serait chargé sur un écran qui n'a pas de galerie. */
		if ( str_ends_with( $hook, self::PAGE_FICHE ) || str_ends_with( $hook, self::PAGE_PHOTOS ) ) {
			wp_enqueue_script( 'ep-admin', $base . 'admin.js', array(), self::version_fichier( 'assets/admin.js' ), true );
		}
	}

	private static function version_fichier( string $relatif ): string {
		$chemin = EP_PLUGIN_DIR . $relatif;
		return is_file( $chemin ) ? (string) filemtime( $chemin ) : EP_VERSION;
	}

	private static function est_notre_ecran(): bool {
		$ecran = get_current_screen();
		return $ecran && str_contains( (string) $ecran->id, 'expert-parquet' );
	}

	public static function rediriger_ancien_cpt(): void {
		global $pagenow;
		if ( 'edit.php' === $pagenow && isset( $_GET['post_type'] ) && 'ep_lead' === $_GET['post_type'] ) {
			wp_safe_redirect( self::url_liste(), 301 );
			exit;
		}
	}

	/* ------------------------------------------------------- confort du rôle */

	/**
	 * Après connexion, un gestionnaire arrive sur SON tableau de bord.
	 *
	 * Le tableau de bord de WordPress ne lui montre rien d'utile : ni
	 * brouillons, ni commentaires, ni activité de site — ce WordPress ne
	 * publie rien. On ne force rien pour un administrateur, qui a d'autres
	 * raisons d'y passer, ni quand une destination précise a été demandée
	 * (lien profond, session expirée en cours de route).
	 */
	public static function apres_connexion( $url, $demande, $utilisateur ) {
		if ( ! $utilisateur instanceof WP_User || ! $utilisateur->has_cap( EP_Lead::CAP ) ) {
			return $url;
		}
		if ( $utilisateur->has_cap( 'manage_options' ) ) {
			return $url;
		}
		$generiques = array( '', admin_url(), admin_url( 'index.php' ), admin_url( '/' ) );
		if ( is_string( $demande ) && ! in_array( untrailingslashit( $demande ), array_map( 'untrailingslashit', $generiques ), true ) ) {
			return $url;
		}
		return self::url_page( self::PAGE_TB );
	}

	/**
	 * Barre supérieure : on retire au gestionnaire ce qui ne le concerne pas.
	 *
	 * Le logo WordPress mène à la documentation et aux forums, « + » propose
	 * de créer des articles qu'il ne peut pas écrire, et les commentaires sont
	 * désactivés partout. L'expérience de l'administrateur n'est pas touchée.
	 */
	public static function barre( $barre ): void {
		if ( ! is_object( $barre ) || ! is_user_logged_in() || current_user_can( 'manage_options' ) ) {
			return;
		}
		if ( ! current_user_can( EP_Lead::CAP ) ) {
			return;
		}
		foreach ( array( 'wp-logo', 'new-content', 'comments' ) as $noeud ) {
			$barre->remove_node( $noeud );
		}
	}

	/* ----------------------------------------------------------------- liste */

	public static function page_liste(): void {
		self::rendre_liste( self::PAGE_LISTE, null, 'Demandes', 'Toutes les demandes reçues, hors indésirables.' );
	}

	public static function page_contacts(): void {
		self::rendre_liste( self::PAGE_CONTACTS, 'contact', 'Contacts', 'Messages envoyés depuis le formulaire de contact.' );
	}

	public static function page_devis(): void {
		self::rendre_liste( self::PAGE_DEVIS, 'devis', 'Demandes de devis', 'Demandes d’expertise : problème, surface, localisation, délai.' );
	}

	/**
	 * Un seul écran de liste pour trois entrées de menu.
	 *
	 * Contacts et Devis ne sont PAS des tables, ni des copies : ce sont la même
	 * liste, préfiltrée sur `form_type`. Dupliquer la logique aurait garanti
	 * qu'un filtre corrigé ici reste cassé là.
	 */
	private static function rendre_liste( string $page, ?string $type, string $titre, string $sous_titre ): void {
		self::exiger();
		EP_Liste_Demandes::$type_impose = $type;

		$table = new EP_Liste_Demandes( $page );
		$table->prepare_items();

		printf( '<div class="wrap ep-ecran"><h1 class="wp-heading-inline">%s</h1><hr class="wp-header-end">', esc_html( $titre ) );
		self::afficher_message();
		printf(
			'<p class="ep-entete__sous-titre">%s %s</p>',
			esc_html( $sous_titre ),
			esc_html( sprintf( '%d au total.', $table->total() ) )
		);

		$table->views();
		echo '<form method="get">';
		printf( '<input type="hidden" name="page" value="%s">', esc_attr( $page ) );
		$f = EP_Liste_Demandes::filtres();
		if ( $f['status'] ) {
			printf( '<input type="hidden" name="ep_status" value="%s">', esc_attr( $f['status'] ) );
		}
		/* Boîte de recherche écrite à la main plutôt que `$table->search_box()` :
		   celle de WordPress emploie le MÊME texte pour l'étiquette et pour le
		   bouton. Un intitulé utile — « nom, e-mail, téléphone, référence,
		   ville, code postal » — donnait donc un bouton de 441 px, qui sortait
		   de l'écran à 390 px de large. Ici l'explication va à l'étiquette et
		   au texte indicatif, le bouton reste un verbe. */
		printf(
			'<p class="search-box">'
			. '<label class="screen-reader-text" for="ep-recherche">Rechercher une demande par nom, adresse e-mail, téléphone, référence, ville ou code postal</label>'
			. '<input type="search" id="ep-recherche" name="s" value="%s" placeholder="Nom, e-mail, référence, ville…">',
			esc_attr( $f['s'] )
		);
		submit_button( 'Rechercher', '', '', false, array( 'id' => 'search-submit' ) );
		echo '</p>';

		echo '<div class="ep-defilement">';
		$table->display();
		echo '</div></form></div>';

		EP_Liste_Demandes::$type_impose = null;
	}

	private static function exiger(): void {
		if ( ! current_user_can( EP_Lead::CAP ) ) {
			wp_die( 'Accès refusé.', 'Accès refusé', array( 'response' => 403 ) );
		}
	}

	/* ------------------------------------------------------------ utilitaires */

	/** Carte : le conteneur de tous nos écrans. `$html` est DÉJÀ échappé. */
	public static function carte( string $titre, string $html, string $id = '', string $classe = '' ): void {
		printf(
			'<div class="ep-carte %s"%s><h2 class="ep-carte__titre">%s</h2><div class="ep-carte__corps">%s</div></div>',
			esc_attr( $classe ),
			$id ? ' id="' . esc_attr( $id ) . '"' : '',
			esc_html( $titre ),
			$html
		);
	}

	/** Tableau libellé → valeur. Les valeurs arrivent DÉJÀ échappées. */
	public static function table_champs( array $lignes ): string {
		$h = '<table class="ep-champs"><tbody>';
		foreach ( $lignes as $l ) {
			$h .= sprintf( '<tr><th scope="row">%s</th><td>%s</td></tr>', esc_html( $l[0] ), $l[1] );
		}
		return $h . '</tbody></table>';
	}

	/** Badge de statut : la couleur seule ne dit rien, le libellé reste écrit. */
	public static function badge_statut( string $statut ): string {
		return sprintf(
			'<span class="ep-badge ep-badge--%s">%s</span>',
			esc_attr( $statut ),
			esc_html( EP_Lead::libelle_statut( $statut ) )
		);
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

	public static function afficher_message(): void {
		$m      = isset( $_GET['ep_msg'] ) ? sanitize_key( (string) $_GET['ep_msg'] ) : '';
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

	/**
	 * Rappelle l'état de la configuration sur nos écrans de travail.
	 *
	 * Deux principes. D'abord ne pas crier au feu : un fournisseur d'envoi
	 * absent est une décision remise à plus tard, pas une panne — c'est une
	 * information, pas une erreur. Ensuite ne pas radoter : le tableau de bord,
	 * la page Emails et les Réglages AFFICHENT déjà ces états ; y superposer un
	 * bandeau qui répète la même chose apprend à ne plus lire les bandeaux.
	 */
	public static function avis(): void {
		if ( ! self::est_notre_ecran() ) {
			return;
		}

		/* Une table manquante, elle, casse tout : partout, et en rouge. */
		$manquantes = array_keys( array_filter( EP_DB::tables_presentes(), static fn( $ok ) => ! $ok ) );
		if ( $manquantes ) {
			echo '<div class="notice notice-error"><p><strong>Tables manquantes :</strong> ' . esc_html( implode( ', ', $manquantes ) ) . '. Désactivez puis réactivez l’extension.</p></div>';
		}

		$ecran = (string) get_current_screen()->id;
		$deja  = static fn( string $page ): bool => str_contains( $ecran, $page );
		if ( $deja( self::PAGE_REGLAGES ) || $deja( self::PAGE_EMAILS ) || str_ends_with( $ecran, self::PAGE_TB ) ) {
			return;
		}

		$limites = EP_Photos::limites_php();
		if ( $limites ) {
			echo '<div class="notice notice-warning"><p><strong>La configuration PHP est en deçà de ce que le formulaire accepte.</strong> Des photographies peuvent être perdues à la réception.</p><ul style="list-style:disc;margin-left:2em">';
			foreach ( $limites as $l ) {
				echo '<li>' . esc_html( $l ) . '</li>';
			}
			echo '</ul></div>';
		}

		if ( ! EP_Mail::configure() ) {
			printf(
				'<div class="notice notice-info is-dismissible"><p><strong>Emails transactionnels : non configurés.</strong> Les demandes sont bien enregistrées ici, mais aucun courriel n’est expédié — les messages partent dans un journal privé. <a href="%s">Voir l’état des emails</a></p></div>',
				esc_url( self::url_page( self::PAGE_EMAILS ) )
			);
		}

		if ( ! EP_Purge::configuree() ) {
			printf(
				'<div class="notice notice-info is-dismissible"><p><strong>Durée de conservation : non décidée.</strong> Les demandes closes ne sont pas effacées automatiquement tant que <code>EP_CONSERVATION_MOIS</code> n’est pas définie dans <code>wp-config.php</code> — et la même valeur doit être annoncée par le site. <a href="%s">Voir les réglages</a></p></div>',
				esc_url( self::url_page( self::PAGE_REGLAGES ) )
			);
		}
	}
}
