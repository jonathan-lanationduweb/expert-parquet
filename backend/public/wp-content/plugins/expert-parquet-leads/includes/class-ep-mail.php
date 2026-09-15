<?php
/**
 * Notification interne et accusé de réception.
 *
 * ---------------------------------------------------------------------------
 * ÉTAT : AUCUN ENVOI RÉEL N'EST CONFIGURÉ
 *
 * Sans fournisseur SMTP transactionnel, `wp_mail()` passe par `mail()` de PHP :
 * en local elle échoue silencieusement, en production elle expédie depuis une
 * IP mutualisée sans SPF ni DKIM — directement dans les indésirables. Un
 * accusé de réception qui n'arrive pas est pire que pas d'accusé du tout.
 *
 * Tant qu'aucun fournisseur n'est renseigné, les courriels sont donc ÉCRITS
 * DANS UN JOURNAL. Rien n'est perdu, rien n'est prétendu. Le jour où les
 * identifiants existent, six constantes dans wp-config.php suffisent :
 *
 *   define( 'EP_SMTP_HOTE', 'smtp-relay.exemple.fr' );
 *   define( 'EP_SMTP_PORT', 587 );
 *   define( 'EP_SMTP_USER', '...' );
 *   define( 'EP_SMTP_PASS', '...' );
 *   define( 'EP_MAIL_FROM', 'ne-pas-repondre@expert-parquet.com' );
 *   define( 'EP_MAIL_DEST', 'contact@expert-parquet.com' );
 *
 * Dans tous les cas, l'issue est consignée dans l'historique de la demande
 * (`email_sent`, `email_failed`, `email_logged`), et un échec d'envoi
 * n'annule jamais la demande : elle est déjà enregistrée.
 *
 * ---------------------------------------------------------------------------
 * COURRIELS EN TEXTE BRUT
 *
 * Volontairement. Un message composé de données saisies par un inconnu et
 * rendu en HTML dans un client de messagerie est un vecteur d'injection.
 *
 * Cette classe reçoit une DEMANDE (ligne du dépôt), jamais un WP_Post.
 */

defined( 'ABSPATH' ) || exit;

class EP_Mail {

	public static function configure(): bool {
		return defined( 'EP_SMTP_HOTE' ) && defined( 'EP_MAIL_DEST' );
	}

	private static function journal(): string {
		return rtrim( EP_PRIVATE_DIR, '/\\' ) . '/logs/courriels.log';
	}

	private static function expedier( array $lead, string $destinataire, string $sujet, string $corps, string $quoi ): void {
		$lead_id = (int) $lead['id'];

		if ( self::configure() ) {
			$erreur = null;
			$noter  = static function ( $e ) use ( &$erreur ) {
				$erreur = $e instanceof WP_Error ? $e->get_error_message() : 'erreur inconnue';
			};
			add_action( 'phpmailer_init', array( __CLASS__, 'brancher_smtp' ) );
			add_action( 'wp_mail_failed', $noter );
			$ok = wp_mail( $destinataire, $sujet, $corps, array( 'Content-Type: text/plain; charset=UTF-8' ) );
			remove_action( 'wp_mail_failed', $noter );
			remove_action( 'phpmailer_init', array( __CLASS__, 'brancher_smtp' ) );

			if ( $ok && ! $erreur ) {
				EP_Events_Repository::consigner( $lead_id, 'email_sent', array( 'user_id' => null, 'metadata' => array( 'quoi' => $quoi ) ) );
			} else {
				EP_Events_Repository::consigner(
					$lead_id,
					'email_failed',
					array( 'user_id' => null, 'metadata' => array( 'quoi' => $quoi, 'erreur' => mb_substr( (string) ( $erreur ?: 'refus du transport' ), 0, 200 ) ) )
				);
			}
			return;
		}

		$ligne = sprintf(
			"[%s] MODE JOURNAL (aucun SMTP configuré)\nÀ : %s\nSujet : %s\n%s\n%s\n\n",
			current_time( 'mysql' ),
			$destinataire,
			$sujet,
			str_repeat( '-', 60 ),
			$corps
		);
		$fichier = self::journal();
		wp_mkdir_p( dirname( $fichier ) );
		$ecrit = file_put_contents( $fichier, $ligne, FILE_APPEND | LOCK_EX );
		EP_Events_Repository::consigner(
			$lead_id,
			$ecrit ? 'email_logged' : 'email_failed',
			array( 'user_id' => null, 'metadata' => array( 'quoi' => $quoi, 'erreur' => $ecrit ? null : 'journal inaccessible' ) )
		);
	}

	/** Branche PHPMailer sur le relais transactionnel. */
	public static function brancher_smtp( $phpmailer ): void {
		$phpmailer->isSMTP();
		$phpmailer->Host       = EP_SMTP_HOTE;
		$phpmailer->Port       = defined( 'EP_SMTP_PORT' ) ? EP_SMTP_PORT : 587;
		$phpmailer->SMTPAuth   = defined( 'EP_SMTP_USER' );
		$phpmailer->SMTPSecure = 'tls';
		if ( defined( 'EP_SMTP_USER' ) ) {
			$phpmailer->Username = EP_SMTP_USER;
			$phpmailer->Password = EP_SMTP_PASS;
		}
		if ( defined( 'EP_MAIL_FROM' ) ) {
			$phpmailer->setFrom( EP_MAIL_FROM, 'Expert Parquet' );
		}
	}

	/** Récapitulatif lisible d'une demande, pour l'exploitant. */
	private static function recapitulatif( array $lead ): string {
		$champs = 'contact' === $lead['form_type'] ? EP_Schema::champs_contact() : EP_Schema::champs_devis();
		$lignes = array();
		foreach ( $champs as $nom => $regle ) {
			$valeur = EP_Leads_Repository::valeur( $lead, $nom );
			if ( '' === $valeur || array() === $valeur ) {
				continue;
			}
			$lignes[] = sprintf( '%-22s : %s', $regle[3], EP_Schema::afficher( $regle, $valeur ) );
		}
		$lignes[] = '';
		$lignes[] = sprintf( '%-22s : %s', 'Page d’origine', $lead['source_url'] ?: '—' );
		$lignes[] = sprintf( '%-22s : %s', 'Reçue le', $lead['created_at'] );
		$lignes[] = sprintf( '%-22s : %s', 'Référence', $lead['public_id'] );
		$lignes[] = sprintf( '%-22s : %s', 'Dossier', EP_Admin::url_fiche( $lead['public_id'] ) );
		return implode( "\n", $lignes );
	}

	/** Notification à l'exploitant. */
	public static function notifier( array $lead ): void {
		$destinataire = defined( 'EP_MAIL_DEST' ) ? EP_MAIL_DEST : get_option( 'admin_email' );
		$sujet        = sprintf(
			'[Expert Parquet] %s — %s',
			'devis' === $lead['form_type'] ? 'Demande d’expertise' : 'Message',
			EP_Lead::titre( $lead )
		);
		self::expedier( $lead, $destinataire, $sujet, self::recapitulatif( $lead ), 'Notification interne' );
	}

	/**
	 * Accusé de réception au visiteur.
	 *
	 * Aucune promesse de délai, et aucun récapitulatif de ses données
	 * personnelles — un courriel se retrouve dans des boîtes partagées. Seule
	 * la référence, qui n'ouvre accès à rien.
	 */
	public static function accuser_reception( array $lead ): void {
		if ( empty( $lead['email'] ) ) {
			return;
		}
		$corps = implode(
			"\n",
			array(
				'Bonjour,',
				'',
				'Nous avons bien reçu votre demande concernant votre parquet.',
				'Elle sera lue et vous recevrez une réponse à cette adresse.',
				'',
				'Référence de votre demande : ' . $lead['public_id'],
				'',
				'Ce message confirme la réception ; il ne constitue ni un diagnostic,',
				'ni un engagement d’intervention.',
				'',
				'— Expert Parquet',
			)
		);
		self::expedier( $lead, $lead['email'], 'Votre demande a bien été reçue', $corps, 'Accusé de réception' );
	}
}
