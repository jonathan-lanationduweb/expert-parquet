<?php
/**
 * Schéma de la base : quatre tables dédiées, versionnées.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI DES TABLES DÉDIÉES
 *
 * Une demande d'expertise n'est pas un article. La stocker dans les tables de
 * contenu de WordPress (posts + postmeta) éparpille ses vingt champs en autant
 * de lignes clé/valeur non typées, mêle des données personnelles au contenu
 * éditorial, et fait dépendre chaque requête des méta-capacités d'un type de
 * contenu — un mécanisme qui a déjà cassé le back-office une fois.
 *
 * Ici : une ligne par demande, des colonnes typées, des index utiles, et
 * trois tables satellites (photographies, notes, événements). WordPress reste
 * l'infrastructure — comptes, droits, administration, REST, cron, courriels —
 * mais ne stocke plus la donnée métier.
 *
 * ---------------------------------------------------------------------------
 * VERSION ET MIGRATION
 *
 * `ep_schema_version` dans les options. `installer()` est idempotente :
 * `dbDelta()` crée ce qui manque et ajuste ce qui a changé, sans jamais
 * supprimer ni vider. Relançable autant de fois qu'on veut. Aucun DROP TABLE,
 * nulle part — pas même à la désinstallation : perdre des demandes parce
 * qu'on a cliqué « supprimer l'extension » n'est pas un comportement
 * acceptable pour des données de tiers.
 *
 * Pas de clés étrangères SQL : `dbDelta` les gère mal, et l'intégrité est
 * assurée par les dépôts (suppression en cascade applicative, dans l'ordre :
 * fichiers → photographies → notes → événements → demande).
 */

defined( 'ABSPATH' ) || exit;

class EP_DB {

	/** Version courante du schéma. v3 = tables dédiées (11/09/2026). */
	public const VERSION = 3;

	public static function leads(): string {
		global $wpdb;
		return $wpdb->prefix . 'expert_parquet_leads';
	}

	public static function photos(): string {
		global $wpdb;
		return $wpdb->prefix . 'expert_parquet_lead_photos';
	}

	public static function notes(): string {
		global $wpdb;
		return $wpdb->prefix . 'expert_parquet_lead_notes';
	}

	public static function events(): string {
		global $wpdb;
		return $wpdb->prefix . 'expert_parquet_lead_events';
	}

	public static function version_installee(): int {
		return (int) get_option( 'ep_schema_version', 0 );
	}

	/** Au chargement : installe ou met à niveau si nécessaire. */
	public static function verifier(): void {
		if ( self::version_installee() < self::VERSION ) {
			self::installer();
		}
	}

	/**
	 * Crée ou met à niveau les quatre tables.
	 *
	 * Conventions de `dbDelta` respectées à la lettre — elles sont plus
	 * strictes que MySQL : deux espaces avant PRIMARY KEY, KEY nommées,
	 * types en minuscules sans DEFAULT sur les TEXT, pas de guillemets
	 * inversés autour des noms de colonnes.
	 */
	public static function installer(): void {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset = $wpdb->get_charset_collate();
		$leads   = self::leads();
		$photos  = self::photos();
		$notes   = self::notes();
		$events  = self::events();

		/* Longueurs : `public_id` = 26 caractères base32 (128 bits) ; les
		   champs d'énumération font moins de 40 caractères ; `problem_type`
		   porte une liste séparée par des virgules (11 valeurs max). Les
		   textes libres sont en TEXT, bornés à la validation (5 000). */
		$sql_leads = "CREATE TABLE $leads (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  public_id char(26) NOT NULL,
  form_type varchar(20) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'new',
  first_name varchar(120) NOT NULL DEFAULT '',
  last_name varchar(120) NOT NULL DEFAULT '',
  email varchar(190) NOT NULL DEFAULT '',
  phone varchar(40) NOT NULL DEFAULT '',
  postal_code varchar(10) NOT NULL DEFAULT '',
  city varchar(120) NOT NULL DEFAULT '',
  customer_type varchar(40) NOT NULL DEFAULT '',
  building_type varchar(40) NOT NULL DEFAULT '',
  room varchar(40) NOT NULL DEFAULT '',
  surface varchar(40) NOT NULL DEFAULT '',
  parquet_type varchar(40) NOT NULL DEFAULT '',
  problem_type varchar(255) NOT NULL DEFAULT '',
  parquet_age varchar(40) NOT NULL DEFAULT '',
  support_type varchar(40) NOT NULL DEFAULT '',
  desired_delay varchar(40) NOT NULL DEFAULT '',
  subject varchar(40) NOT NULL DEFAULT '',
  message text,
  description text,
  diagnostic_context text,
  source_url varchar(255) NOT NULL DEFAULT '',
  referrer_url varchar(255) NOT NULL DEFAULT '',
  ip_fingerprint char(16) NOT NULL DEFAULT '',
  legal_basis varchar(40) NOT NULL DEFAULT 'consent',
  consent_version varchar(20) NOT NULL DEFAULT '',
  consent_at datetime DEFAULT NULL,
  closed_at datetime DEFAULT NULL,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY public_id (public_id),
  KEY status (status),
  KEY form_type (form_type),
  KEY created_at (created_at),
  KEY postal_code (postal_code),
  KEY email (email)
) ENGINE=InnoDB $charset;";

		$sql_photos = "CREATE TABLE $photos (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  lead_id bigint(20) unsigned NOT NULL,
  public_id char(32) NOT NULL,
  storage_key varchar(190) NOT NULL,
  original_filename varchar(255) NOT NULL DEFAULT '',
  stored_filename varchar(64) NOT NULL,
  mime_type varchar(40) NOT NULL DEFAULT 'image/jpeg',
  size_bytes int(10) unsigned NOT NULL DEFAULT 0,
  width int(10) unsigned NOT NULL DEFAULT 0,
  height int(10) unsigned NOT NULL DEFAULT 0,
  sha256 char(64) NOT NULL DEFAULT '',
  exif_stripped tinyint(1) unsigned NOT NULL DEFAULT 1,
  created_at datetime NOT NULL,
  deleted_at datetime DEFAULT NULL,
  PRIMARY KEY  (id),
  UNIQUE KEY public_id (public_id),
  KEY lead_id (lead_id),
  KEY created_at (created_at)
) ENGINE=InnoDB $charset;";

		$sql_notes = "CREATE TABLE $notes (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  lead_id bigint(20) unsigned NOT NULL,
  wp_user_id bigint(20) unsigned NOT NULL DEFAULT 0,
  note text NOT NULL,
  created_at datetime NOT NULL,
  updated_at datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY lead_id (lead_id),
  KEY wp_user_id (wp_user_id),
  KEY created_at (created_at)
) ENGINE=InnoDB $charset;";

		$sql_events = "CREATE TABLE $events (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  lead_id bigint(20) unsigned NOT NULL DEFAULT 0,
  wp_user_id bigint(20) unsigned DEFAULT NULL,
  event_type varchar(40) NOT NULL,
  old_status varchar(20) DEFAULT NULL,
  new_status varchar(20) DEFAULT NULL,
  metadata text,
  created_at datetime NOT NULL,
  PRIMARY KEY  (id),
  KEY lead_id (lead_id),
  KEY event_type (event_type),
  KEY created_at (created_at)
) ENGINE=InnoDB $charset;";

		dbDelta( $sql_leads );
		dbDelta( $sql_photos );
		dbDelta( $sql_notes );
		dbDelta( $sql_events );

		/* InnoDB, explicitement. Ce MySQL est configuré avec MyISAM par défaut,
		   moteur sans transactions ni récupération après plantage — pas pour
		   des données de tiers. `dbDelta` ne touche jamais au moteur d'une
		   table existante ; l'ALTER est sans perte et n'est exécuté que si
		   nécessaire. */
		foreach ( array( $leads, $photos, $notes, $events ) as $table ) {
			$moteur = $wpdb->get_var( $wpdb->prepare( 'SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s', $table ) );
			if ( $moteur && 'InnoDB' !== $moteur ) {
				$wpdb->query( "ALTER TABLE `$table` ENGINE=InnoDB" );
			}
		}

		update_option( 'ep_schema_version', self::VERSION, true );
	}

	/** Les quatre tables existent-elles réellement ? (pour l'avis d'admin et les tests) */
	public static function tables_presentes(): array {
		global $wpdb;
		$etat = array();
		foreach ( array( self::leads(), self::photos(), self::notes(), self::events() ) as $t ) {
			$etat[ $t ] = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $t ) ) === $t;
		}
		return $etat;
	}
}
