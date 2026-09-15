<?php
/**
 * Dépôt des notes internes : table `{prefix}expert_parquet_lead_notes`.
 *
 * Une note est écrite par un gestionnaire, pour les gestionnaires. Elle ne
 * quitte jamais le back-office : ni courriel, ni export CSV, ni API.
 */

defined( 'ABSPATH' ) || exit;

class EP_Notes_Repository {

	/**
	 * @return int|null Identifiant de la note, ou null si la base a refusé
	 *                  l'écriture (chaîne non UTF-8, par exemple).
	 */
	public static function ajouter( int $lead_id, int $user_id, string $note ): ?int {
		global $wpdb;
		$maintenant = current_time( 'mysql' );
		$ok = $wpdb->insert(
			self::table(),
			array(
				'lead_id'    => $lead_id,
				'wp_user_id' => $user_id,
				'note'       => wp_strip_all_tags( $note ),
				'created_at' => $maintenant,
				'updated_at' => $maintenant,
			)
		);
		return false === $ok ? null : (int) $wpdb->insert_id;
	}

	public static function pour_lead( int $lead_id ): array {
		global $wpdb;
		$lignes = $wpdb->get_results(
			$wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE lead_id = %d ORDER BY created_at DESC, id DESC', $lead_id ),
			ARRAY_A
		);
		return array_map(
			static function ( $l ) {
				$l['id'] = (int) $l['id'];
				$l['lead_id'] = (int) $l['lead_id'];
				$l['wp_user_id'] = (int) $l['wp_user_id'];
				return $l;
			},
			$lignes ?: array()
		);
	}

	public static function supprimer_pour_lead( int $lead_id ): int {
		global $wpdb;
		return (int) $wpdb->delete( self::table(), array( 'lead_id' => $lead_id ) );
	}

	private static function table(): string {
		return EP_DB::notes();
	}
}
