<?php
/**
 * Écran Emails — comprendre ce que le système fait des notifications.
 *
 * ---------------------------------------------------------------------------
 * CE QU'IL DIT, ET CE QU'IL NE DIT PAS
 *
 * Aujourd'hui aucun fournisseur d'envoi n'est configuré, VOLONTAIREMENT. Cet
 * écran doit donc rendre la situation limpide sans la dramatiser : les
 * demandes sont bien enregistrées, simplement aucun courriel ne part. Ce n'est
 * pas une panne, c'est une décision remise à plus tard.
 *
 * Aucune valeur de configuration n'est affichée : on dit qu'une constante est
 * DÉFINIE, jamais ce qu'elle contient. Un mot de passe SMTP, un identifiant,
 * une adresse d'expédition n'ont rien à faire dans une page web — même
 * derrière une session d'administrateur, même en local.
 *
 * Le journal privé n'est pas davantage affiché : il contient les courriels
 * eux-mêmes, donc des adresses et des messages. On en donne l'emplacement, le
 * poids et la date — pas une ligne du contenu.
 */

defined( 'ABSPATH' ) || exit;

class EP_Admin_Emails {

	/** Les événements qui concernent les courriels. */
	private const TYPES = array( 'email_sent', 'email_failed', 'email_logged' );

	public static function rendre(): void {
		$configure = EP_Mail::configure();

		echo '<div class="wrap ep-ecran">';
		echo '<h1 class="wp-heading-inline">Emails</h1><hr class="wp-header-end">';
		EP_Admin::afficher_message();

		printf(
			'<p class="ep-entete__sous-titre">%s</p>',
			$configure
				? 'Les notifications internes et les accusés de réception sont expédiés.'
				: 'Les demandes sont bien enregistrées dans le back-office, mais aucun courriel n’est encore expédié.'
		);

		echo '<div class="ep-grille"><div>';
		self::bloc_etat( $configure );
		self::bloc_journal( $configure );
		echo '</div><div>';
		self::bloc_envois();
		echo '</div></div></div>';
	}

	/* ------------------------------------------------------------------ état */

	private static function bloc_etat( bool $configure ): void {
		/* Chaque réglage du relais, présent ou non. `EP_Mail::configuration()`
		   ne rend que des booléens : aucune valeur ne traverse cet écran. */
		$config = EP_Mail::configuration();
		$etat   = static fn( bool $present, string $oui, string $non, string $niveauNon = 'attente' ): string
			=> self::valeur( $present ? 'ok' : $niveauNon, $present ? $oui : $non );

		$lignes = array(
			array( 'Fournisseur SMTP', $etat( $config['hote'], 'Configuré', 'À configurer avant production' ) ),
			array( 'Port', $etat( $config['port'], 'Défini', 'Défaut (587)', 'neutre' ) ),
			array( 'Chiffrement', $etat( $config['securite'], 'Défini', 'Défaut (TLS)', 'neutre' ) ),
			array( 'Authentification', $etat( $config['utilisateur'], 'Configurée', 'Aucune', 'neutre' ) ),
			array( 'Adresse d’expédition', $etat( $config['expediteur'], 'Configurée', 'Par défaut de WordPress', 'neutre' ) ),
			array( 'Nom d’expéditeur', $etat( $config['nom_expediteur'], 'Défini', 'Défaut (Expert Parquet)', 'neutre' ) ),
			array( 'Adresse destinataire', $etat( $config['destinataire'], 'Configurée', 'À configurer avant production' ) ),
			array( 'Mode actuel', self::valeur( $configure ? 'ok' : 'attente', $configure ? 'Envoi SMTP' : 'Journal privé' ) ),
		);

		$h  = EP_Admin::table_champs( $lignes );
		$h .= '<p class="ep-meta" style="margin-top:12px">Seule la <em>présence</em> de chaque réglage est indiquée. Aucune valeur — hôte, identifiant, mot de passe, adresse — n’est affichée ici ni enregistrée ailleurs que dans <code>wp-config.php</code>.</p>';

		if ( ! $configure ) {
			$h .= '<p class="ep-meta">Pour activer les envois : définir <code>EP_SMTP_HOTE</code> et <code>EP_MAIL_DEST</code> dans <code>wp-config.php</code>. Tant que ce n’est pas fait, rien n’est perdu : chaque message est écrit dans le journal privé et consigné dans l’historique de la demande.</p>';
		}

		EP_Admin::carte( 'Emails transactionnels', $h );
	}

	private static function bloc_journal( bool $configure ): void {
		$fichier = rtrim( EP_PRIVATE_DIR, '/\\' ) . '/logs/courriels.log';
		$existe  = is_file( $fichier );

		$lignes = array(
			array( 'Emplacement', '<code>backend-private/logs/courriels.log</code>' ),
			array( 'Fichier', self::valeur( $existe ? 'neutre' : 'neutre', $existe ? 'présent' : 'pas encore créé' ) ),
		);
		if ( $existe ) {
			$lignes[] = array( 'Poids', esc_html( size_format( (int) filesize( $fichier ), 1 ) ?: '0 o' ) );
			$lignes[] = array( 'Dernière écriture', esc_html( wp_date( 'd/m/Y à H\hi', (int) filemtime( $fichier ) ) ) );
		}

		$h  = EP_Admin::table_champs( $lignes );
		$h .= '<p class="ep-meta" style="margin-top:12px">'
			. ( $configure
				? 'Le journal ne reçoit plus que les échecs d’envoi.'
				: 'Tant qu’aucun fournisseur n’est configuré, chaque courriel est écrit ici au lieu d’être expédié.' )
			. ' Son contenu — adresses et messages — n’est pas affiché dans le back-office : il est hors de la racine web et se consulte sur le serveur.</p>';

		EP_Admin::carte( 'Journal privé', $h );
	}

	/**
	 * Ce que le système envoie, et ce qu'il en a fait récemment.
	 *
	 * Les événements ne portent AUCUNE donnée personnelle — seulement la
	 * nature du message et son sort. La demande concernée reste accessible
	 * par sa référence, pour qui a la capacité.
	 */
	private static function bloc_envois(): void {
		$h = '<p class="ep-meta" style="margin-bottom:12px">Deux courriels par demande&nbsp;: une <strong>notification interne</strong> et un <strong>accusé de réception</strong> au demandeur. Aucun envoi commercial, aucune liste de diffusion.</p>';

		$events = EP_Events_Repository::derniers( self::TYPES, 15 );
		if ( ! $events ) {
			EP_Admin::carte( 'Derniers événements', $h . '<p class="ep-vide">Aucun événement pour le moment.</p>' );
			return;
		}
		$leads = EP_Leads_Repository::par_ids( array_column( $events, 'lead_id' ) );

		$h .= '<ul class="ep-journal">';
		foreach ( $events as $e ) {
			$lead = $leads[ $e['lead_id'] ] ?? null;
			$h   .= sprintf(
				'<li class="%s"><span class="ep-journal__quoi">%s</span><span class="ep-meta">%s%s</span></li>',
				'email_failed' === $e['event_type'] ? 'ep-journal--fait' : '',
				esc_html( EP_Events_Repository::decrire( $e ) ),
				esc_html( mysql2date( 'd/m/Y à H\hi', $e['created_at'] ) ),
				$lead
					? sprintf( ' — <a href="%s">demande %s</a>', esc_url( EP_Admin::url_fiche( $lead['public_id'] ) ), esc_html( substr( $lead['public_id'], 0, 8 ) ) )
					: ''
			);
		}
		EP_Admin::carte( 'Derniers événements', $h . '</ul>' );
	}

	private static function valeur( string $niveau, string $texte ): string {
		return sprintf(
			'<span class="ep-etat__valeur ep-etat__valeur--%s">%s %s</span>',
			esc_attr( $niveau ),
			esc_html( EP_Etat_Systeme::symbole( $niveau ) ),
			esc_html( $texte )
		);
	}
}
