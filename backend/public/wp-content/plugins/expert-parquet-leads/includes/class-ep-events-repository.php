<?php
/**
 * Dépôt des événements : table `{prefix}expert_parquet_lead_events`.
 *
 * L'historique d'une demande. Chaque ligne dit CE QUI s'est passé, QUAND,
 * et PAR QUI — jamais le contenu : `metadata` porte des compteurs, des
 * identifiants de fichiers, un motif d'erreur, pas une adresse ou un
 * message. Les données personnelles sont dans la demande, une seule fois.
 */

defined( 'ABSPATH' ) || exit;

class EP_Events_Repository {

	public const TYPES = array(
		'lead_created', 'photos_received', 'photo_added', 'photo_deleted',
		'status_changed', 'note_added', 'email_sent', 'email_failed', 'email_logged',
		'lead_exported', 'lead_deleted', 'schema_migrated',
	);

	/**
	 * @param array $opts user_id (int|null), old_status, new_status, metadata (array).
	 */
	public static function consigner( int $lead_id, string $type, array $opts = array() ): ?int {
		global $wpdb;
		if ( ! in_array( $type, self::TYPES, true ) ) {
			return null;
		}
		$user = array_key_exists( 'user_id', $opts ) ? $opts['user_id'] : ( is_user_logged_in() ? get_current_user_id() : null );
		$meta = isset( $opts['metadata'] ) && is_array( $opts['metadata'] ) && $opts['metadata']
			? wp_json_encode( $opts['metadata'], JSON_UNESCAPED_UNICODE )
			: null;

		$ok = $wpdb->insert(
			self::table(),
			array(
				'lead_id'    => $lead_id,
				'wp_user_id' => null === $user || 0 === (int) $user ? null : (int) $user,
				'event_type' => $type,
				'old_status' => $opts['old_status'] ?? null,
				'new_status' => $opts['new_status'] ?? null,
				'metadata'   => $meta,
				'created_at' => current_time( 'mysql' ),
			)
		);
		return false === $ok ? null : (int) $wpdb->insert_id;
	}

	public static function pour_lead( int $lead_id ): array {
		global $wpdb;
		$lignes = $wpdb->get_results(
			$wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE lead_id = %d ORDER BY created_at ASC, id ASC', $lead_id ),
			ARRAY_A
		);
		return array_map(
			static function ( $l ) {
				$l['id']         = (int) $l['id'];
				$l['lead_id']    = (int) $l['lead_id'];
				$l['wp_user_id'] = null === $l['wp_user_id'] ? null : (int) $l['wp_user_id'];
				$l['metadata']   = $l['metadata'] ? ( json_decode( $l['metadata'], true ) ?: array() ) : array();
				return $l;
			},
			$lignes ?: array()
		);
	}

	public static function supprimer_pour_lead( int $lead_id ): int {
		global $wpdb;
		return (int) $wpdb->delete( self::table(), array( 'lead_id' => $lead_id ) );
	}

	/** Libellé lisible d'un événement, pour la fiche. */
	public static function decrire( array $e ): string {
		$m = $e['metadata'];
		switch ( $e['event_type'] ) {
			case 'lead_created':
				return 'Demande reçue.';
			case 'photos_received':
				return sprintf( '%d photographie(s) reçue(s).', (int) ( $m['count'] ?? 0 ) );
			case 'photo_added':
				return 'Photographie ajoutée.';
			case 'photo_deleted':
				return 'Photographie supprimée.';
			case 'status_changed':
				return sprintf( 'Statut : %s → %s', EP_Lead::libelle_statut( (string) $e['old_status'] ), EP_Lead::libelle_statut( (string) $e['new_status'] ) );
			case 'note_added':
				return 'Note ajoutée.';
			case 'email_sent':
				return sprintf( '%s envoyé.', $m['quoi'] ?? 'Courriel' );
			case 'email_failed':
				return sprintf( '%s NON envoyé : %s', $m['quoi'] ?? 'Courriel', $m['erreur'] ?? 'erreur inconnue' );
			case 'email_logged':
				return sprintf( '%s écrit dans le journal (aucun SMTP configuré).', $m['quoi'] ?? 'Courriel' );
			case 'lead_exported':
				return sprintf( 'Export CSV : %d demande(s).', (int) ( $m['count'] ?? 0 ) );
			case 'lead_deleted':
				return 'Demande effacée.';
			case 'schema_migrated':
				return 'Migration de schéma.';
		}
		return $e['event_type'];
	}

	private static function table(): string {
		return EP_DB::events();
	}
}
