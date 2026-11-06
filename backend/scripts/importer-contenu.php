<?php
/**
 * Importe le contenu éditorial initial dans WordPress.
 *
 *   php backend/scripts/importer-contenu.php [chemin/vers/contenu-initial.json]
 *
 * Idempotent : relancer ne crée aucun doublon (voir EP_Import). À lancer en
 * ligne de commande uniquement, depuis la racine du projet ou n'importe où.
 */

if ( 'cli' !== PHP_SAPI ) {
	fwrite( STDERR, "Ligne de commande uniquement.\n" );
	exit( 1 );
}

$racine  = dirname( __DIR__, 2 );
$fichier = $argv[1] ?? ( $racine . '/tools/cms/migration/contenu-initial.json' );

define( 'WP_USE_THEMES', false );
$_SERVER['HTTP_HOST']   = $_SERVER['HTTP_HOST'] ?? 'expert-parquet-dev.local';
$_SERVER['REQUEST_URI'] = '/';
require __DIR__ . '/../public/wp-load.php';

/* Un administrateur : le HTML éditorial contient des attributs que KSES
   retirerait à un utilisateur sans `unfiltered_html`. */
$admins = get_users( array( 'role' => 'administrator', 'number' => 1, 'orderby' => 'ID', 'order' => 'ASC' ) );
if ( ! $admins ) {
	fwrite( STDERR, "Aucun administrateur.\n" );
	exit( 1 );
}
wp_set_current_user( $admins[0]->ID );

try {
	$journal = EP_Import::executer( $fichier );
} catch ( Throwable $e ) {
	fwrite( STDERR, 'Échec : ' . $e->getMessage() . "\n" );
	exit( 1 );
}

$compte = array();
foreach ( $journal as [$quoi, $etat] ) {
	$famille = explode( ':', $quoi, 2 )[0];
	$compte[ $famille ][ $etat ] = ( $compte[ $famille ][ $etat ] ?? 0 ) + 1;
	if ( str_starts_with( $etat, 'ERREUR' ) ) {
		echo "  ! $quoi : $etat\n";
	}
}
foreach ( $compte as $famille => $etats ) {
	$parts = array();
	foreach ( $etats as $etat => $n ) {
		$parts[] = "$n $etat";
	}
	echo str_pad( $famille, 14 ) . implode( ', ', $parts ) . "\n";
}
echo "Terminé.\n";
