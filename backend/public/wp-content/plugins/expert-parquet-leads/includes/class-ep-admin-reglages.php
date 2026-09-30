<?php
/**
 * Écran Réglages — ce qui est configuré, en lecture seule.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI RIEN N'EST MODIFIABLE ICI
 *
 * La configuration de cette extension vit dans `wp-config.php` : durée de
 * conservation, fournisseur d'envoi, dossier privé, environnement. C'est
 * voulu. Une valeur stockée en base pourrait être changée par n'importe quelle
 * session d'administration — y compris une session volée — alors qu'un fichier
 * hors Git, sur le serveur, demande un accès au serveur. Pour des réglages qui
 * décident du sort de données personnelles, la différence n'est pas
 * théorique.
 *
 * Cet écran RÉPOND donc à une question : « dans quel état tourne le
 * système ? ». Il n'en change aucun.
 *
 * ---------------------------------------------------------------------------
 * CE QU'IL N'AFFICHE PAS
 *
 * Aucune valeur sensible : ni identifiant, ni mot de passe, ni clé, ni jeton,
 * ni adresse de destination. Et, côté anti-spam, aucun détail qui aiderait à
 * contourner la protection — on dit qu'elle est active, pas comment elle
 * fonctionne.
 */

defined( 'ABSPATH' ) || exit;

class EP_Admin_Reglages {

	public static function rendre(): void {
		global $wpdb;

		echo '<div class="wrap ep-ecran">';
		echo '<h1 class="wp-heading-inline">Réglages</h1><hr class="wp-header-end">';
		EP_Admin::afficher_message();
		echo '<p class="ep-entete__sous-titre">État de la configuration, en lecture seule. Les réglages se modifient dans <code>wp-config.php</code>, sur le serveur.</p>';

		echo '<div class="ep-reglages">';
		self::environnement( $wpdb );
		self::formulaires();
		self::photos();
		self::emails();
		self::antispam();
		self::rgpd();
		self::securite();
		self::api();
		echo '</div></div>';
	}

	/* --------------------------------------------------------- environnement */

	private static function environnement( $wpdb ): void {
		$maj    = EP_Etat_Systeme::mise_a_jour();
		$points = EP_Etat_Systeme::points();

		$lignes = array(
			array( 'Environnement', $points['mode']['valeur'] ),
			array( 'Adresse', esc_html( (string) wp_parse_url( home_url(), PHP_URL_HOST ) ) ),
			array( 'API', '<code>/' . esc_html( rest_get_url_prefix() . '/' . EP_REST_NS ) . '/</code>' ),
			array( 'Version de l’extension', esc_html( EP_VERSION ) ),
			array( 'Version du schéma', esc_html( (string) EP_DB::version_installee() ) . ( EP_DB::version_installee() === EP_DB::VERSION ? '' : ' <span class="ep-etat__valeur ep-etat__valeur--ko">à migrer</span>' ) ),
			array( 'WordPress', esc_html( get_bloginfo( 'version' ) ) . ( $maj ? ' <span class="ep-etat__valeur ep-etat__valeur--attente">' . esc_html( $maj ) . ' disponible</span>' : '' ) ),
			array( 'PHP', esc_html( PHP_VERSION ) ),
			array( 'MySQL', esc_html( (string) $wpdb->db_version() ) ),
			array( 'Thème actif', esc_html( (string) wp_get_theme()->get( 'Name' ) ) ),
		);
		$h = EP_Admin::table_champs( $lignes );
		if ( $maj ) {
			$h .= '<p class="ep-meta" style="margin-top:12px">Mise à jour du cœur à planifier séparément : elle ne fait pas partie des réglages de cette extension.</p>';
		}
		EP_Admin::carte( 'Environnement', $h );
	}

	/* ----------------------------------------------------------- formulaires */

	private static function formulaires(): void {
		$routes = rest_get_server()->get_routes();
		$actif  = static fn( string $r ): string => isset( $routes[ '/' . EP_REST_NS . $r ] )
			? self::etat( 'ok', 'Actif' )
			: self::etat( 'ko', 'Inactif' );

		$lignes = array(
			array( 'Formulaire de contact', $actif( '/contact' ) ),
			array( 'Demande d’expertise', $actif( '/quote' ) ),
			array( 'Dépôt de photographies', isset( $routes[ '/' . EP_REST_NS . '/quote/(?P<ref>' . EP_Lead::REFERENCE_MOTIF . ')/photos' ] ) ? self::etat( 'ok', 'Actif' ) : self::etat( 'ko', 'Inactif' ) ),
			array( 'Version du consentement', esc_html( (string) EP_CONSENT_VERSION ) ),
		);
		EP_Admin::carte( 'Formulaires', EP_Admin::table_champs( $lignes ) );
	}

	/* ---------------------------------------------------------------- photos */

	private static function photos(): void {
		$bilan  = EP_Photos_Repository::bilan();
		$formats = array_map(
			static fn( string $m ): string => strtoupper( str_replace( 'image/', '', $m ) ),
			EP_Photos::TYPES
		);

		$lignes = array(
			array( 'Nombre maximal', esc_html( (string) EP_Photos::MAX_FICHIERS ) . ' par demande' ),
			array( 'Taille maximale', esc_html( size_format( EP_Photos::MAX_OCTETS ) ) . ' par fichier' ),
			array( 'Formats acceptés', esc_html( implode( ', ', $formats ) ) ),
			array( 'Redimensionnement', esc_html( (string) EP_Photos::COTE_MAX ) . ' px au plus grand côté' ),
			array( 'Métadonnées', self::etat( 'ok', 'EXIF retiré au réencodage' ) ),
			array( 'Emplacement', self::etat( 'ok', 'Hors de la racine web' ) ),
			array( 'Conservées', esc_html( sprintf( '%d fichier(s), %s', $bilan['nombre'], size_format( $bilan['octets'], 1 ) ?: '0 o' ) ) ),
		);

		$h = EP_Admin::table_champs( $lignes );
		$limites = EP_Photos::limites_php();
		if ( $limites ) {
			$h .= '<p class="ep-meta" style="margin-top:12px"><strong>La configuration PHP est en deçà de ce que le formulaire accepte :</strong></p><ul class="ep-meta" style="list-style:disc;margin-left:1.4em">';
			foreach ( $limites as $l ) {
				$h .= '<li>' . esc_html( $l ) . '</li>';
			}
			$h .= '</ul>';
		} else {
			$h .= '<p class="ep-meta" style="margin-top:12px">La configuration PHP accepte ce que le formulaire promet.</p>';
		}
		EP_Admin::carte( 'Photographies', $h );
	}

	/* ---------------------------------------------------------------- emails */

	private static function emails(): void {
		$point  = EP_Etat_Systeme::points()['emails'];
		$lignes = array(
			array( 'Fournisseur SMTP', self::etat( defined( 'EP_SMTP_HOTE' ) ? 'ok' : 'attente', defined( 'EP_SMTP_HOTE' ) ? 'Configuré' : 'Non configuré' ) ),
			array( 'Adresse destinataire', self::etat( defined( 'EP_MAIL_DEST' ) ? 'ok' : 'attente', defined( 'EP_MAIL_DEST' ) ? 'Configurée' : 'Non configurée' ) ),
			array( 'Mode', self::etat( $point['niveau'], EP_Mail::configure() ? 'Envoi SMTP' : 'Journal privé' ) ),
		);
		$h = EP_Admin::table_champs( $lignes )
			. sprintf(
				'<p class="ep-meta" style="margin-top:12px">%s <a href="%s">Détail sur la page Emails</a>.</p>',
				esc_html( $point['detail'] ),
				esc_url( EP_Admin::url_page( EP_Admin::PAGE_EMAILS ) )
			);
		EP_Admin::carte( 'Emails', $h );
	}

	/* -------------------------------------------------------------- anti-spam */

	/**
	 * Volontairement pauvre en détails. Annoncer la durée minimale de
	 * remplissage, le nom du champ leurre ou la façon dont l'empreinte est
	 * calculée, c'est écrire le mode d'emploi du contournement. Un exploitant
	 * a besoin de savoir que la protection tourne ; pas comment elle est
	 * réglée.
	 */
	private static function antispam(): void {
		$lignes = array(
			array( 'Protection anti-spam', self::etat( 'ok', 'Active' ) ),
			array( 'Limitation des envois', self::etat( 'ok', 'Active' ) ),
			array( 'Champ leurre', self::etat( 'ok', 'Actif' ) ),
			array( 'Limitation des connexions', self::etat( class_exists( 'EP_Connexion' ) ? 'ok' : 'ko', class_exists( 'EP_Connexion' ) ? 'Active' : 'Absente' ) ),
		);
		$h = EP_Admin::table_champs( $lignes )
			. '<p class="ep-meta" style="margin-top:12px">Les demandes refusées ne sont pas enregistrées. Celles qui passent mais paraissent douteuses arrivent en statut <em>Indésirable</em> et sont effacées après ' . (int) EP_Purge::JOURS_SPAM . ' jours.</p>';
		EP_Admin::carte( 'Anti-spam', $h );
	}

	/* ------------------------------------------------------------------ RGPD */

	/**
	 * La durée de conservation est le seul réglage que ce back-office refuse
	 * de trancher tout seul. En local, 36 mois est une valeur de travail ;
	 * l'afficher comme « la » durée reviendrait à faire croire qu'une décision
	 * a été prise. Elle ne l'a pas été.
	 */
	private static function rgpd(): void {
		$production = 'production' === wp_get_environment_type();
		$suivant    = wp_next_scheduled( EP_Purge::EVENEMENT );

		$lignes = array(
			array( 'Purge automatique', self::etat( 'ok', 'Active' ) ),
			array(
				'Tâche planifiée',
				$suivant
					? self::etat( 'ok', 'Programmée' ) . '<br><span class="ep-meta">' . esc_html( wp_date( 'd/m/Y à H\hi', $suivant ) ) . '</span>'
					: self::etat( 'ko', 'Non programmée' ),
			),
		);

		if ( ! EP_Purge::configuree() ) {
			$lignes[] = array( 'Durée de conservation', self::etat( 'attente', 'Non décidée' ) );
		} elseif ( $production ) {
			$lignes[] = array( 'Durée de conservation', esc_html( sprintf( '%d mois après clôture', EP_Purge::mois() ) ) );
		} else {
			$lignes[] = array(
				'Durée de conservation',
				esc_html( sprintf( '%d mois', EP_Purge::mois() ) )
					. '<br><span class="ep-meta">valeur de développement — la durée de production reste à décider</span>',
			);
		}

		$lignes[] = array( 'Indésirables', esc_html( sprintf( 'effacés après %d jours', EP_Purge::JOURS_SPAM ) ) );
		$lignes[] = array( 'Effacement', esc_html( 'demande, photographies, notes et historique' ) );

		$h = EP_Admin::table_champs( $lignes )
			. '<p class="ep-meta" style="margin-top:12px">La durée annoncée ici doit être la même que celle affichée par le site (<code>RGPD.conservationMois</code>) et que celle des mentions légales.</p>';
		EP_Admin::carte( 'RGPD', $h );
	}

	/* -------------------------------------------------------------- sécurité */

	private static function securite(): void {
		$lignes = array(
			array( 'Partie publique', self::etat( 'ok', 'Fermée' ) ),
			array( 'XML-RPC', self::etat( 'ok', 'Désactivé' ) ),
			array( 'API REST native', self::etat( 'ok', 'Fermée aux anonymes' ) ),
			array( 'Liste des comptes', self::etat( 'ok', 'Retirée de l’API' ) ),
			array( 'Édition de fichiers', self::etat( defined( 'DISALLOW_FILE_EDIT' ) && DISALLOW_FILE_EDIT ? 'ok' : 'attente', defined( 'DISALLOW_FILE_EDIT' ) && DISALLOW_FILE_EDIT ? 'Interdite' : 'Autorisée' ) ),
			array( 'Indexation', self::etat( '0' === (string) get_option( 'blog_public' ) ? 'ok' : 'attente', '0' === (string) get_option( 'blog_public' ) ? 'Interdite' : 'Autorisée' ) ),
			array( 'Capacité requise', '<code>' . esc_html( EP_Lead::CAP ) . '</code>' ),
		);
		EP_Admin::carte( 'Sécurité', EP_Admin::table_champs( $lignes ) );
	}

	/* ------------------------------------------------------------------- API */

	private static function api(): void {
		$point  = EP_Etat_Systeme::points()['api'];
		$lignes = array(
			array( 'État', self::etat( $point['niveau'], $point['valeur'] ) ),
			array( 'Espace de noms', '<code>' . esc_html( EP_REST_NS ) . '</code>' ),
			array( 'Sonde', '<code>/health</code>' ),
			array( 'Écriture', '<code>POST /contact</code>, <code>POST /quote</code>' ),
			array( 'Photographies', '<code>POST /quote/{référence}/photos</code>' ),
			array( 'Lecture publique', self::etat( 'ok', 'Aucune' ) ),
			array( 'Origines autorisées', esc_html( sprintf( '%d, liste blanche explicite', count( EP_ORIGINES_AUTORISEES ) ) ) ),
		);
		$h = EP_Admin::table_champs( $lignes )
			. '<p class="ep-meta" style="margin-top:12px">Le dépôt de photographies exige un jeton remis à la création de la demande&nbsp;: connaître une référence ne suffit pas.</p>';
		EP_Admin::carte( 'API', $h );
	}

	/* ---------------------------------------------------------------- outils */

	private static function etat( string $niveau, string $texte ): string {
		return sprintf(
			'<span class="ep-etat__valeur ep-etat__valeur--%s">%s %s</span>',
			esc_attr( $niveau ),
			esc_html( EP_Etat_Systeme::symbole( $niveau ) ),
			esc_html( $texte )
		);
	}
}
