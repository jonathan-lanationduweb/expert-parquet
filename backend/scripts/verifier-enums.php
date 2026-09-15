<?php
/**
 * Vérifie que le contrat de données du backend n'a pas dérivé du front.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE SCRIPT EXISTE
 *
 * `js/config/options.js` est la source de vérité : c'est lui qui décide des
 * choix proposés au visiteur. Le backend en tient une copie — il le faut, car
 * un backend qui fait confiance aux valeurs envoyées par le client ne valide
 * rien du tout.
 *
 * Deux copies d'une même liste finissent toujours par diverger. Le jour où un
 * choix est ajouté côté front, l'API le REFUSERA en silence : le visiteur
 * remplira son formulaire et se verra opposer une erreur sur un champ qu'il a
 * pourtant rempli correctement. Ce script rend cette dérive visible avant
 * qu'elle ne coûte une demande.
 *
 * Le script contrôle aussi la DURÉE DE CONSERVATION : celle que la page de
 * confidentialité annonce au visiteur doit être celle que la tâche
 * d'effacement applique réellement.
 *
 * À lancer après toute modification de `options.js` ou de `site.js`, et dans
 * une éventuelle intégration continue.
 *
 * ---------------------------------------------------------------------------
 * USAGE
 *
 *   php backend/scripts/verifier-enums.php [chemin/vers/js/config/options.js]
 *
 * Sans argument, le chemin par défaut est `js/config/options.js` à la racine
 * du projet.
 * Code de sortie 0 si tout concorde, 1 sinon.
 *
 * Le fichier front est lu tel quel, sans Node : ces déclarations sont
 * purement littérales, une lecture directe suffit et évite de dépendre d'un
 * runtime supplémentaire pour un simple contrôle.
 */

if ( 'cli' !== PHP_SAPI ) {
	exit( "Ce script s'exécute en ligne de commande.\n" );
}

/** Correspondance entre les constantes exportées du front et nos énumérations. */
const CORRESPONDANCE = array(
	'ANCIENNETES'    => 'anciennetes',
	'DEBUTS'         => 'debuts',
	'DELAIS'         => 'delais',
	'LOGEMENTS'      => 'logements',
	'OBJETS_CONTACT' => 'objets_contact',
	'PIECES'         => 'pieces',
	'PROBLEMES'      => 'problemes',
	'PROFILS'        => 'profils',
	'SUPPORTS'       => 'supports',
	'SURFACES'       => 'surfaces',
	'TYPES_PARQUET'  => 'types_parquet',
);

/* Le script vit dans backend/scripts/ ; la racine du projet est deux niveaux
   au-dessus, et WordPress dans backend/public/. */
define( 'EP_RACINE_PROJET', dirname( __DIR__, 2 ) );
define( 'EP_RACINE_WP', dirname( __DIR__ ) . '/public' );

$defaut = EP_RACINE_PROJET . '/js/config/options.js';
$source = $argv[1] ?? $defaut;

if ( ! is_file( $source ) ) {
	fwrite( STDERR, "Fichier introuvable : $source\n" );
	fwrite( STDERR, "Indiquez le chemin de js/config/options.js en argument.\n" );
	exit( 1 );
}

/**
 * Extrait les couples value/label déclarés dans une constante exportée.
 *
 * @return array<string,string>
 */
function lire_constante( string $js, string $nom ): array {
	if ( ! preg_match( '/export\s+const\s+' . preg_quote( $nom, '/' ) . '\s*=\s*\[(.*?)\n\];/s', $js, $m ) ) {
		return array();
	}
	$paires = array();
	preg_match_all(
		"/\{\s*value:\s*'([^']*)'\s*,\s*label:\s*'([^']*)'/u",
		$m[1],
		$entrees,
		PREG_SET_ORDER
	);
	foreach ( $entrees as $e ) {
		$paires[ $e[1] ] = $e[2];
	}
	return $paires;
}

$js    = file_get_contents( $source );
$front = array();
foreach ( CORRESPONDANCE as $constante => $enum ) {
	$paires = lire_constante( $js, $constante );
	if ( ! $paires ) {
		fwrite( STDERR, "Constante illisible ou vide dans le front : $constante\n" );
		exit( 1 );
	}
	$front[ $enum ] = $paires;
}

/* Le schéma est chargé seul : inutile de démarrer WordPress entier pour
   comparer deux tableaux. `ABSPATH` est simplement défini pour satisfaire le
   garde-fou en tête de fichier. */
defined( 'ABSPATH' ) || define( 'ABSPATH', EP_RACINE_WP . '/' );
require EP_RACINE_WP . '/wp-content/plugins/expert-parquet-leads/includes/class-ep-schema.php';

$enums    = EP_Schema::enums();
$libelles = EP_Schema::libelles();
$ecarts   = array();

foreach ( $front as $enum => $paires ) {
	$connues = $enums[ $enum ] ?? array();
	$traduit = $libelles[ $enum ] ?? array();

	foreach ( $paires as $valeur => $libelle ) {
		if ( ! in_array( $valeur, $connues, true ) ) {
			$ecarts[] = "$enum/$valeur : présent dans le front, REFUSÉ par l'API.";
		}
		if ( ! isset( $traduit[ $valeur ] ) ) {
			$ecarts[] = "$enum/$valeur : aucun libellé côté backend.";
		} elseif ( $traduit[ $valeur ] !== $libelle ) {
			$ecarts[] = "$enum/$valeur : libellé différent — front « $libelle », backend « {$traduit[ $valeur ]} ».";
		}
	}
	foreach ( $connues as $valeur ) {
		if ( ! isset( $paires[ $valeur ] ) ) {
			$ecarts[] = "$enum/$valeur : accepté par l'API mais absent du front.";
		}
	}
	foreach ( array_keys( $traduit ) as $valeur ) {
		if ( ! isset( $paires[ $valeur ] ) ) {
			$ecarts[] = "$enum/$valeur : libellé backend sans valeur correspondante.";
		}
	}
}
foreach ( array_keys( $enums ) as $enum ) {
	if ( ! isset( $front[ $enum ] ) ) {
		$ecarts[] = "$enum : énumération inconnue du front.";
	}
}

/* --- Duree de conservation ---------------------------------------------------
   Le front l'ANNONCE au visiteur sur la page de confidentialite ; le backend
   l'APPLIQUE. Un ecart entre les deux, c'est soit une promesse non tenue, soit
   des dossiers effaces plus tot que l'exploitant ne le croit. */
$site = dirname( $source ) . '/site.js';
if ( is_file( $site ) ) {
	$js_site = file_get_contents( $site );
	preg_match( '/conservationMois:\s*(null|\d+)/', $js_site, $m );
	$front_mois = ( $m && 'null' !== $m[1] ) ? (int) $m[1] : null;

	require_once EP_RACINE_WP . '/wp-content/plugins/expert-parquet-leads/includes/class-ep-purge.php';
	$back_mois = defined( 'EP_CONSERVATION_MOIS' ) ? (int) EP_CONSERVATION_MOIS : EP_Purge::MOIS_DEFAUT;

	/* wp-config.php n'est pas charge ici (ce script ne demarre pas WordPress) :
	   on lit la constante dans le fichier, ce qui suffit a comparer. */
	$conf = EP_RACINE_WP . '/wp-config.php';
	if ( is_file( $conf ) && preg_match( "/EP_CONSERVATION_MOIS'\s*,\s*(\d+)/", file_get_contents( $conf ), $mc ) ) {
		$back_mois = (int) $mc[1];
	}

	if ( null !== $front_mois && $front_mois !== $back_mois ) {
		$ecarts[] = "conservation : le site annonce $front_mois mois, le backend en applique $back_mois.";
	}
	if ( null === $front_mois ) {
		echo "Note : le front est en mode demonstration, aucune duree de conservation annoncee.
";
	}
} else {
	echo "Note : site.js introuvable, duree de conservation non verifiee.
";
}

$total = array_sum( array_map( 'count', $enums ) );

if ( $ecarts ) {
	fwrite( STDERR, "Dérive détectée entre le front et le backend :\n\n" );
	foreach ( $ecarts as $e ) {
		fwrite( STDERR, "  - $e\n" );
	}
	fwrite( STDERR, sprintf( "\n%d écart(s) sur %d valeurs.\n", count( $ecarts ), $total ) );
	exit( 1 );
}

printf( "Contrat conforme : %d énumérations, %d valeurs, aucun écart.\n", count( $enums ), $total );
exit( 0 );
