<?php
/**
 * Contrôle de ce qu'une sauvegarde devra emporter — sans rien sauvegarder.
 *
 * ---------------------------------------------------------------------------
 * CE QU'IL FAIT, ET CE QU'IL NE FAIT PAS
 *
 * Il LIT. Il ne copie rien, n'écrit rien, n'envoie rien, ne supprime rien. Il
 * répond à une seule question : le jour où l'on sauvegarde, tout ce qui compte
 * est-il présent, lisible, et de quelle taille ?
 *
 * Il ne choisit pas non plus de destination : un stockage distant engage un
 * coût et un contrat, c'est une décision, pas une commande.
 *
 * Usage :  php backend/scripts/verifier-sauvegarde.php
 */

if ( PHP_SAPI !== 'cli' ) {
	exit( "Ce script s'exécute en ligne de commande.\n" );
}

define( 'WP_USE_THEMES', false );
require dirname( __DIR__ ) . '/public/wp-load.php';

global $wpdb;

/** Taille lisible, sans dépendance. */
function ep_taille( float $octets ): string {
	foreach ( array( 'o', 'Ko', 'Mo', 'Go' ) as $unite ) {
		if ( $octets < 1024 || 'Go' === $unite ) {
			return sprintf( '%.1f %s', $octets, $unite );
		}
		$octets /= 1024;
	}
	return '';
}

/** Poids d'un dossier, récursivement. */
function ep_poids( string $dossier ): array {
	if ( ! is_dir( $dossier ) ) {
		return array( 'fichiers' => 0, 'octets' => 0, 'lisible' => false );
	}
	$fichiers = 0;
	$octets   = 0;
	$it       = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $dossier, FilesystemIterator::SKIP_DOTS ) );
	foreach ( $it as $f ) {
		if ( $f->isFile() ) {
			++$fichiers;
			$octets += $f->getSize();
		}
	}
	return array( 'fichiers' => $fichiers, 'octets' => $octets, 'lisible' => is_readable( $dossier ) );
}

$prive = rtrim( EP_PRIVATE_DIR, '/\\' );
$erreurs = 0;

echo "\n  SAUVEGARDE — état de ce qui devra être emporté\n";
echo "  ---------------------------------------------\n\n";

/* --- 1. Base de données ------------------------------------------------- */
echo "  Base de données\n";
$tables = EP_DB::tables_presentes();
$absentes = array_keys( array_filter( $tables, static fn( $ok ) => ! $ok ) );
printf( "    tables métier      : %d/%d%s\n", count( $tables ) - count( $absentes ), count( $tables ), $absentes ? ' — MANQUANTES : ' . implode( ', ', $absentes ) : '' );
if ( $absentes ) {
	++$erreurs;
}

$poids_db = 0;
foreach ( array( EP_DB::leads(), EP_DB::photos(), EP_DB::notes(), EP_DB::events() ) as $t ) {
	$ligne = $wpdb->get_row( $wpdb->prepare( 'SHOW TABLE STATUS LIKE %s', $t ), ARRAY_A );
	$n     = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t}" );
	$taille = (int) ( $ligne['Data_length'] ?? 0 ) + (int) ( $ligne['Index_length'] ?? 0 );
	$poids_db += $taille;
	printf( "    %-34s %6d lignes  %10s\n", $t, $n, ep_taille( $taille ) );
}
/* `mysqldump` n'est pas garanti présent : on le signale sans en faire un échec,
   l'hébergeur fournit souvent son propre outil d'export. */
$dump = trim( (string) shell_exec( 'mysqldump --version 2>&1' ) );
printf( "    outil d'export     : %s\n", str_contains( strtolower( $dump ), 'mysqldump' ) ? 'mysqldump disponible' : 'mysqldump introuvable — utiliser l’export de l’hébergeur' );

/* --- 2. Données privées -------------------------------------------------- */
echo "\n  Données privées (hors racine web)\n";
$racine_web = rtrim( str_replace( '\\', '/', ABSPATH ), '/' );
$dans_le_web = str_starts_with( str_replace( '\\', '/', $prive ) . '/', $racine_web . '/' );
printf( "    emplacement        : %s\n", $dans_le_web ? 'DANS LA RACINE WEB — à corriger' : 'hors racine web' );
if ( $dans_le_web ) {
	++$erreurs;
}

$poids_fichiers = 0;
foreach ( array( 'photos' => 'photographies des demandes', 'logs' => 'journaux' ) as $sous => $quoi ) {
	$p = ep_poids( $prive . '/' . $sous );
	$poids_fichiers += $p['octets'];
	printf( "    %-18s %4d fichiers  %10s  %s\n", $sous, $p['fichiers'], ep_taille( $p['octets'] ), $p['lisible'] ? '' : 'ILLISIBLE' );
	if ( ! $p['lisible'] ) {
		++$erreurs;
	}
}

/* --- 3. Configuration ---------------------------------------------------- */
echo "\n  Configuration\n";
foreach ( array(
	'wp-config.php'      => ABSPATH . 'wp-config.php',
	'identifiants'       => $prive . '/IDENTIFIANTS.txt',
) as $quoi => $chemin ) {
	$existe = is_file( $chemin );
	printf( "    %-18s %s%s\n", $quoi, $existe ? 'présent' : 'absent', $existe && ! is_readable( $chemin ) ? ' — ILLISIBLE' : '' );
	if ( $existe && ! is_readable( $chemin ) ) {
		++$erreurs;
	}
}
printf( "    durée RGPD         : %s\n", EP_Purge::configuree() ? EP_Purge::mois() . ' mois' : 'NON DÉFINIE' );

/* --- 4. Volume ----------------------------------------------------------- */
$total = $poids_db + $poids_fichiers;
echo "\n  Volume\n";
printf( "    base               : %s\n", ep_taille( $poids_db ) );
printf( "    fichiers privés    : %s\n", ep_taille( $poids_fichiers ) );
printf( "    total par sauvegarde : %s\n", ep_taille( $total ) );
printf( "    30 sauvegardes     : environ %s\n", ep_taille( $total * 30 ) );

echo "\n  " . ( $erreurs ? "$erreurs point(s) à corriger avant de compter sur une sauvegarde.\n\n" : "Tout est présent et lisible.\n\n" );
exit( $erreurs ? 1 : 0 );
