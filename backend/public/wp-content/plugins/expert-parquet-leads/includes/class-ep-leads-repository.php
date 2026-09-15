<?php
/**
 * Dépôt des demandes : la seule classe qui lit ou écrit la table
 * `{prefix}expert_parquet_leads`.
 *
 * ---------------------------------------------------------------------------
 * RÈGLES
 *
 * - `$wpdb` ne sort pas d'ici. Le reste de l'extension manipule des tableaux
 *   associatifs (une ligne = une demande) et appelle ces méthodes.
 * - Toute valeur dynamique passe par `$wpdb->prepare()`. Les noms de colonnes
 *   et les directions de tri viennent de listes blanches, jamais de la
 *   requête HTTP.
 * - Les noms de colonnes sont en anglais (convention SQL) ; les noms de champs
 *   du formulaire restent ceux du contrat front (`prenom`, `code_postal`…).
 *   `COLONNES` fait la correspondance dans les deux sens, en un seul endroit.
 */

defined( 'ABSPATH' ) || exit;

class EP_Leads_Repository {

	/** Champ du contrat front → colonne SQL. */
	public const COLONNES = array(
		'prenom'       => 'first_name',
		'nom'          => 'last_name',
		'email'        => 'email',
		'telephone'    => 'phone',
		'code_postal'  => 'postal_code',
		'ville'        => 'city',
		'profil'       => 'customer_type',
		'logement'     => 'building_type',
		'piece'        => 'room',
		'surface'      => 'surface',
		'type'         => 'parquet_type',
		'probleme'     => 'problem_type',
		'anciennete'   => 'parquet_age',
		'support'      => 'support_type',
		'delai'        => 'desired_delay',
		'objet'        => 'subject',
		'message'      => 'message',
		'description'  => 'description',
	);

	/** Colonnes autorisées pour ORDER BY. */
	private const TRIS = array( 'created_at', 'updated_at', 'status', 'city', 'last_name', 'form_type', 'postal_code' );

	/** Colonnes fouillées par la recherche libre. */
	private const RECHERCHE = array( 'first_name', 'last_name', 'email', 'phone', 'public_id', 'city', 'postal_code' );

	/* ------------------------------------------------------------ écriture */

	/**
	 * Enregistre une demande validée.
	 *
	 * @param string $form_type 'contact' ou 'devis'.
	 * @param array  $propre    Champs validés par EP_Schema, clés du contrat front.
	 * @param array  $contexte  source_url, referrer_url, ip_fingerprint, diagnostic_context.
	 * @return array|null La ligne créée, ou null.
	 */
	public static function creer( string $form_type, array $propre, array $contexte ): ?array {
		global $wpdb;
		$maintenant = current_time( 'mysql' );

		$ligne = array(
			'public_id'          => EP_Lead::nouvelle_reference(),
			'form_type'          => $form_type,
			'status'             => EP_Lead::STATUT_INITIAL,
			'diagnostic_context' => $contexte['diagnostic_context'] ?? null,
			'source_url'         => substr( (string) ( $contexte['source_url'] ?? '' ), 0, 255 ),
			'referrer_url'       => substr( (string) ( $contexte['referrer_url'] ?? '' ), 0, 255 ),
			'ip_fingerprint'     => substr( (string) ( $contexte['ip_fingerprint'] ?? '' ), 0, 16 ),
			'legal_basis'        => 'consent',
			'consent_version'    => defined( 'EP_CONSENT_VERSION' ) ? (string) EP_CONSENT_VERSION : '1',
			'consent_at'         => $maintenant,
			'created_at'         => $maintenant,
			'updated_at'         => $maintenant,
		);
		foreach ( self::COLONNES as $champ => $colonne ) {
			if ( ! array_key_exists( $champ, $propre ) ) {
				continue;
			}
			$v = $propre[ $champ ];
			// `probleme` est le seul tableau : liste séparée par des virgules,
			// filtrable par LIKE et lisible à l'œil dans la table.
			$ligne[ $colonne ] = is_array( $v ) ? implode( ',', array_map( 'strval', $v ) ) : (string) $v;
		}

		$ok = $wpdb->insert( self::table(), $ligne );
		if ( false === $ok ) {
			return null;
		}
		return self::par_id( (int) $wpdb->insert_id );
	}

	/**
	 * Change le statut. Pose `closed_at` à l'entrée dans un statut clos et
	 * l'efface à la sortie : le délai de conservation court depuis la
	 * clôture, et une réouverture arrête le compte à rebours.
	 *
	 * @return string|null L'ancien statut, ou null si rien n'a changé.
	 */
	public static function changer_statut( int $id, string $nouveau ): ?string {
		global $wpdb;
		$ligne = self::par_id( $id );
		if ( ! $ligne || ! isset( EP_Lead::statuts()[ $nouveau ] ) || $ligne['status'] === $nouveau ) {
			return null;
		}
		$maj = array( 'status' => $nouveau, 'updated_at' => current_time( 'mysql' ) );
		if ( EP_Lead::est_clos( $nouveau ) && ! EP_Lead::est_clos( $ligne['status'] ) ) {
			$maj['closed_at'] = current_time( 'mysql' );
		} elseif ( ! EP_Lead::est_clos( $nouveau ) && EP_Lead::est_clos( $ligne['status'] ) ) {
			$maj['closed_at'] = null;
		}
		$wpdb->update( self::table(), $maj, array( 'id' => $id ) );
		return $ligne['status'];
	}

	/** Écrit `closed_at` directement — réservé aux essais et à la maintenance. */
	public static function forcer_closed_at( int $id, ?string $date ): void {
		global $wpdb;
		$wpdb->update( self::table(), array( 'closed_at' => $date ), array( 'id' => $id ) );
	}

	public static function forcer_updated_at( int $id, string $date ): void {
		global $wpdb;
		$wpdb->update( self::table(), array( 'updated_at' => $date ), array( 'id' => $id ) );
	}

	/** Supprime la ligne seule. La cascade est orchestrée par EP_Lead::effacer(). */
	public static function supprimer( int $id ): bool {
		global $wpdb;
		return (bool) $wpdb->delete( self::table(), array( 'id' => $id ) );
	}

	/* ------------------------------------------------------------- lecture */

	public static function par_id( int $id ): ?array {
		global $wpdb;
		$ligne = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE id = %d', $id ), ARRAY_A );
		return $ligne ? self::typer( $ligne ) : null;
	}

	public static function par_reference( string $ref ): ?array {
		global $wpdb;
		if ( ! EP_Lead::reference_valide( $ref ) ) {
			return null;
		}
		$ligne = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE public_id = %s', $ref ), ARRAY_A );
		return $ligne ? self::typer( $ligne ) : null;
	}

	public static function reference_existe( string $ref ): bool {
		global $wpdb;
		return (bool) $wpdb->get_var( $wpdb->prepare( 'SELECT 1 FROM ' . self::table() . ' WHERE public_id = %s', $ref ) );
	}

	/**
	 * Valeur d'un champ du contrat front, dans sa forme front (le problème
	 * redevient un tableau). Sert à l'affichage, aux courriels et à l'export,
	 * qui raisonnent avec `EP_Schema`.
	 */
	public static function valeur( array $ligne, string $champ ) {
		$colonne = self::COLONNES[ $champ ] ?? null;
		if ( ! $colonne ) {
			return '';
		}
		$v = $ligne[ $colonne ] ?? '';
		if ( 'probleme' === $champ ) {
			return '' === $v ? array() : explode( ',', (string) $v );
		}
		return $v;
	}

	/**
	 * Recherche paginée pour le back-office.
	 *
	 * @param array $filtres s, status, form_type, problem, month (AAAA-MM), postal_code.
	 * @return array{items: array[], total: int}
	 */
	public static function rechercher( array $filtres, int $page = 1, int $par_page = 20, string $tri = 'created_at', string $sens = 'DESC' ): array {
		global $wpdb;
		$ou   = array( '1=1' );
		$args = array();

		if ( ! empty( $filtres['status'] ) && isset( EP_Lead::statuts()[ $filtres['status'] ] ) ) {
			$ou[]   = 'status = %s';
			$args[] = $filtres['status'];
		} elseif ( empty( $filtres['status'] ) ) {
			// Sans filtre, les indésirables restent hors de la vue courante.
			$ou[]   = 'status <> %s';
			$args[] = EP_Lead::STATUT_SPAM;
		}
		if ( ! empty( $filtres['form_type'] ) && in_array( $filtres['form_type'], array( 'contact', 'devis' ), true ) ) {
			$ou[]   = 'form_type = %s';
			$args[] = $filtres['form_type'];
		}
		if ( ! empty( $filtres['problem'] ) && in_array( $filtres['problem'], EP_Schema::enums()['problemes'], true ) ) {
			// La liste est "a,b,c" : on encadre de virgules pour une égalité stricte par élément.
			$ou[]   = 'CONCAT(",", problem_type, ",") LIKE %s';
			$args[] = '%,' . $wpdb->esc_like( $filtres['problem'] ) . ',%';
		}
		if ( ! empty( $filtres['month'] ) && preg_match( '/^\d{4}-\d{2}$/', $filtres['month'] ) ) {
			$ou[]   = 'DATE_FORMAT(created_at, "%%Y-%%m") = %s';
			$args[] = $filtres['month'];
		}
		if ( ! empty( $filtres['postal_code'] ) ) {
			$ou[]   = 'postal_code LIKE %s';
			$args[] = $wpdb->esc_like( preg_replace( '/\D/', '', (string) $filtres['postal_code'] ) ) . '%';
		}
		if ( isset( $filtres['s'] ) && '' !== trim( (string) $filtres['s'] ) ) {
			$terme = '%' . $wpdb->esc_like( trim( (string) $filtres['s'] ) ) . '%';
			$parts = array();
			foreach ( self::RECHERCHE as $c ) {
				$parts[] = "$c LIKE %s";
				$args[]  = $terme;
			}
			$parts[] = 'CONCAT(first_name, " ", last_name) LIKE %s';
			$args[]  = $terme;
			$ou[]    = '(' . implode( ' OR ', $parts ) . ')';
		}

		$tri  = in_array( $tri, self::TRIS, true ) ? $tri : 'created_at';
		$sens = 'ASC' === strtoupper( $sens ) ? 'ASC' : 'DESC';
		$where = implode( ' AND ', $ou );

		$total = (int) $wpdb->get_var( $args ? $wpdb->prepare( 'SELECT COUNT(*) FROM ' . self::table() . " WHERE $where", $args ) : 'SELECT COUNT(*) FROM ' . self::table() . " WHERE $where" );

		$page   = max( 1, $page );
		$offset = ( $page - 1 ) * $par_page;
		$sql    = 'SELECT * FROM ' . self::table() . " WHERE $where ORDER BY $tri $sens, id $sens LIMIT %d OFFSET %d";
		$lignes = $wpdb->get_results( $wpdb->prepare( $sql, array_merge( $args, array( $par_page, $offset ) ) ), ARRAY_A );

		return array(
			'items' => array_map( array( __CLASS__, 'typer' ), $lignes ?: array() ),
			'total' => $total,
		);
	}

	/** Toutes les lignes correspondant aux filtres (export). */
	public static function tous( array $filtres ): array {
		$r = self::rechercher( $filtres, 1, 100000, 'created_at', 'DESC' );
		return $r['items'];
	}

	/** Compteurs par statut, pour les vues de la liste. */
	public static function compter_par_statut(): array {
		global $wpdb;
		$lignes = $wpdb->get_results( 'SELECT status, COUNT(*) AS n FROM ' . self::table() . ' GROUP BY status', ARRAY_A );
		$out    = array();
		foreach ( (array) $lignes as $l ) {
			$out[ $l['status'] ] = (int) $l['n'];
		}
		return $out;
	}

	public static function compter(): int {
		global $wpdb;
		return (int) $wpdb->get_var( 'SELECT COUNT(*) FROM ' . self::table() );
	}

	/**
	 * Identifiants à effacer : statuts donnés, date de référence antérieure à
	 * la limite. `colonne` est prise dans une liste blanche.
	 */
	public static function a_purger( array $statuts, string $colonne, string $limite, int $max = 200 ): array {
		global $wpdb;
		if ( ! in_array( $colonne, array( 'closed_at', 'updated_at', 'created_at' ), true ) || ! $statuts ) {
			return array();
		}
		$place = implode( ',', array_fill( 0, count( $statuts ), '%s' ) );
		$sql   = 'SELECT id FROM ' . self::table() . " WHERE status IN ($place) AND $colonne IS NOT NULL AND $colonne < %s ORDER BY $colonne ASC LIMIT %d";
		$ids   = $wpdb->get_col( $wpdb->prepare( $sql, array_merge( $statuts, array( $limite, $max ) ) ) );
		return array_map( 'intval', (array) $ids );
	}

	/* ------------------------------------------------------------- interne */

	private static function table(): string {
		return EP_DB::leads();
	}

	private static function typer( array $l ): array {
		$l['id'] = (int) $l['id'];
		return $l;
	}
}
