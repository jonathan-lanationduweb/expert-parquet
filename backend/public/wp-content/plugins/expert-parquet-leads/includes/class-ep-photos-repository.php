<?php
/**
 * Dépôt des photographies : table `{prefix}expert_parquet_lead_photos`.
 *
 * La table ne contient que des MÉTADONNÉES. Les octets sont sur disque, hors
 * racine web, sous `storage_key` (chemin relatif au dossier privé). Le nom
 * d'origine est conservé pour information — il peut porter un nom de personne
 * ou de lieu, c'est une donnée personnelle comme les autres et il part avec
 * la demande.
 */

defined( 'ABSPATH' ) || exit;

class EP_Photos_Repository {

	public static function ajouter( array $photo ): ?array {
		global $wpdb;
		$ligne = array(
			'lead_id'           => (int) $photo['lead_id'],
			'public_id'         => (string) $photo['public_id'],
			'storage_key'       => (string) $photo['storage_key'],
			'original_filename' => mb_substr( (string) ( $photo['original_filename'] ?? '' ), 0, 255 ),
			'stored_filename'   => (string) $photo['stored_filename'],
			'mime_type'         => (string) ( $photo['mime_type'] ?? 'image/jpeg' ),
			'size_bytes'        => (int) ( $photo['size_bytes'] ?? 0 ),
			'width'             => (int) ( $photo['width'] ?? 0 ),
			'height'            => (int) ( $photo['height'] ?? 0 ),
			'sha256'            => (string) ( $photo['sha256'] ?? '' ),
			'exif_stripped'     => 1,
			'created_at'        => current_time( 'mysql' ),
		);
		if ( false === $wpdb->insert( self::table(), $ligne ) ) {
			return null;
		}
		return self::par_id( (int) $wpdb->insert_id );
	}

	public static function par_id( int $id ): ?array {
		global $wpdb;
		$l = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE id = %d', $id ), ARRAY_A );
		return $l ? self::typer( $l ) : null;
	}

	/** Photographie par sa référence publique, pour une demande donnée. */
	public static function par_reference( int $lead_id, string $public_id ): ?array {
		global $wpdb;
		if ( ! preg_match( '/^[a-f0-9]{32}$/', $public_id ) ) {
			return null;
		}
		$l = $wpdb->get_row(
			$wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE lead_id = %d AND public_id = %s AND deleted_at IS NULL', $lead_id, $public_id ),
			ARRAY_A
		);
		return $l ? self::typer( $l ) : null;
	}

	/** Photographies actives d'une demande, dans l'ordre de réception. */
	public static function pour_lead( int $lead_id ): array {
		global $wpdb;
		$lignes = $wpdb->get_results(
			$wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE lead_id = %d AND deleted_at IS NULL ORDER BY id ASC', $lead_id ),
			ARRAY_A
		);
		return array_map( array( __CLASS__, 'typer' ), $lignes ?: array() );
	}

	public static function compter( int $lead_id ): int {
		global $wpdb;
		return (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM ' . self::table() . ' WHERE lead_id = %d AND deleted_at IS NULL', $lead_id ) );
	}

	/** Nombre de photographies par demande, pour la liste (une requête). */
	public static function compter_pour( array $lead_ids ): array {
		global $wpdb;
		$lead_ids = array_values( array_filter( array_map( 'intval', $lead_ids ) ) );
		if ( ! $lead_ids ) {
			return array();
		}
		$place  = implode( ',', array_fill( 0, count( $lead_ids ), '%d' ) );
		$lignes = $wpdb->get_results(
			$wpdb->prepare( 'SELECT lead_id, COUNT(*) AS n FROM ' . self::table() . " WHERE deleted_at IS NULL AND lead_id IN ($place) GROUP BY lead_id", $lead_ids ),
			ARRAY_A
		);
		$out = array();
		foreach ( (array) $lignes as $l ) {
			$out[ (int) $l['lead_id'] ] = (int) $l['n'];
		}
		return $out;
	}

	/**
	 * Les dernières photographies reçues, toutes demandes confondues.
	 *
	 * Aucune jointure vers la table des demandes : chaque dépôt reste maître de
	 * sa table. L'écran qui a besoin des deux appelle
	 * `EP_Leads_Repository::par_ids()` avec les `lead_id` obtenus ici — deux
	 * requêtes au total, et la frontière tient.
	 */
	public static function recentes( int $limite = 24, int $offset = 0 ): array {
		global $wpdb;
		$lignes = $wpdb->get_results(
			$wpdb->prepare(
				'SELECT * FROM ' . self::table() . ' WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC LIMIT %d OFFSET %d',
				max( 1, $limite ),
				max( 0, $offset )
			),
			ARRAY_A
		);
		return array_map( array( __CLASS__, 'typer' ), $lignes ?: array() );
	}

	/** Nombre et poids total des photographies actives, pour les écrans de suivi. */
	public static function bilan(): array {
		global $wpdb;
		$l = $wpdb->get_row( 'SELECT COUNT(*) AS n, COALESCE(SUM(size_bytes), 0) AS octets FROM ' . self::table() . ' WHERE deleted_at IS NULL', ARRAY_A );
		return array( 'nombre' => (int) ( $l['n'] ?? 0 ), 'octets' => (int) ( $l['octets'] ?? 0 ) );
	}

	/** Suppression définitive de la ligne (le fichier est retiré par EP_Photos). */
	public static function supprimer( int $id ): bool {
		global $wpdb;
		return (bool) $wpdb->delete( self::table(), array( 'id' => $id ) );
	}

	public static function supprimer_pour_lead( int $lead_id ): int {
		global $wpdb;
		return (int) $wpdb->delete( self::table(), array( 'lead_id' => $lead_id ) );
	}

	private static function table(): string {
		return EP_DB::photos();
	}

	private static function typer( array $l ): array {
		foreach ( array( 'id', 'lead_id', 'size_bytes', 'width', 'height', 'exif_stripped' ) as $c ) {
			$l[ $c ] = (int) $l[ $c ];
		}
		return $l;
	}
}
