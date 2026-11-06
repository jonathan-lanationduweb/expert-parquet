<?php
/**
 * Configuration centrale du PROJET côté back-office.
 *
 * Ce que le prochain site changera sans toucher au reste : le nom affiché dans
 * l'administration, la couleur d'accent de l'administration, le logotype de la
 * colonne de menu, les libellés métier. Tout le CSS d'administration lit ces
 * valeurs par des variables (`--ep-accent`…) : rien n'y est codé en dur.
 *
 * Ce n'est PAS la couleur du site public — celle-ci se règle dans
 * Site → Apparence et vit dans les données exportées (EP_Site). Les deux
 * coïncident pour Expert Parquet, elles peuvent diverger ailleurs.
 *
 * Volontairement un simple tableau de constantes : on prépare l'architecture
 * commune, on ne construit pas un paquet générique.
 */

defined( 'ABSPATH' ) || exit;

class EP_Projet {

	public static function config(): array {
		$defaut = array(
			'nom'          => 'Expert Parquet',
			'accent'       => '#B04A1E',
			'accent_sombre' => '#93401B',
			'logo_admin'   => 'assets/logo-on-dark.png',
			'libelles'     => array(
				'conseil'  => 'Conseil',
				'conseils' => 'Conseils',
				'probleme' => 'Problème',
				'problemes' => 'Problèmes',
				'demande'  => 'Demande',
				'demandes' => 'Demandes',
			),
		);
		/* Un site peut surcharger depuis wp-config.php : EP_PROJET = array(...). */
		if ( defined( 'EP_PROJET' ) && is_array( EP_PROJET ) ) {
			return array_replace_recursive( $defaut, EP_PROJET );
		}
		return $defaut;
	}

	public static function nom(): string {
		return (string) self::config()['nom'];
	}

	/** Les variables CSS de l'administration, dérivées de l'accent. */
	public static function variables_css(): string {
		$c       = self::config();
		$accent  = self::couleur( (string) $c['accent'], '#B04A1E' );
		$sombre  = self::couleur( (string) $c['accent_sombre'], self::assombrir( $accent, 0.17 ) );
		$pale    = self::melanger( $accent, '#FFFFFF', 0.82 );
		$creme   = self::melanger( $accent, '#FFFFFF', 0.94 );
		$clair   = self::melanger( $accent, '#FFFFFF', 0.6 );
		return ":root{--ep-accent:$accent;--ep-accent-sombre:$sombre;--ep-accent-pale:$pale;--ep-accent-creme:$creme;--ep-accent-clair:$clair;}";
	}

	public static function couleur( string $v, string $defaut ): string {
		return preg_match( '/^#[0-9a-fA-F]{6}$/', $v ) ? strtoupper( $v ) : $defaut;
	}

	public static function assombrir( string $hex, float $f ): string {
		[$r, $g, $b] = sscanf( $hex, '#%02x%02x%02x' );
		return sprintf( '#%02X%02X%02X', (int) round( $r * ( 1 - $f ) ), (int) round( $g * ( 1 - $f ) ), (int) round( $b * ( 1 - $f ) ) );
	}

	/** Mélange `hex` avec `vers` : `part` = proportion de `vers`. */
	public static function melanger( string $hex, string $vers, float $part ): string {
		[$r, $g, $b]    = sscanf( $hex, '#%02x%02x%02x' );
		[$r2, $g2, $b2] = sscanf( $vers, '#%02x%02x%02x' );
		$m = static fn( int $a, int $c ): int => (int) round( $a + ( $c - $a ) * $part );
		return sprintf( '#%02X%02X%02X', $m( $r, $r2 ), $m( $g, $g2 ), $m( $b, $b2 ) );
	}
}
