<?php
/**
 * Exemple de configuration WordPress — Expert Parquet (backend).
 *
 * Copier vers `backend/public/wp-config.php`, puis remplir les valeurs marquees
 * « A REMPLIR ». Le fichier reel n'est PAS versionne : il contient les
 * identifiants de la base et les cles de session.
 *
 * Le principe de ce fichier : UNE ligne decide de l'environnement, et tous les
 * reglages qui different entre le poste de travail et le serveur en decoulent.
 * Recopier ces reglages a la main d'un fichier a l'autre est exactement la
 * facon dont `WP_DEBUG` se retrouve actif en production.
 *
 * @package Expert_Parquet
 */

/* --- Base de donnees -------------------------------------------------------
   A REMPLIR. L'utilisateur MySQL n'a besoin que de SELECT, INSERT, UPDATE,
   DELETE, CREATE, ALTER et INDEX sur cette base — pas de FILE, pas de SUPER,
   et surtout pas d'acces aux autres bases du serveur. */
define( 'DB_NAME',     'A_REMPLIR' );
define( 'DB_USER',     'A_REMPLIR' );
define( 'DB_PASSWORD', 'A_REMPLIR' );
define( 'DB_HOST',     'localhost' );
define( 'DB_CHARSET',  'utf8mb4' );
define( 'DB_COLLATE',  '' );

/* --- Cles et sels ----------------------------------------------------------
   A REMPLIR avec des valeurs UNIQUES, generees sur :
   https://api.wordpress.org/secret-key/1.1/salt/

   Ne jamais reutiliser celles d'un autre site, ne jamais les committer. Les
   changer deconnecte toutes les sessions ouvertes — c'est d'ailleurs le moyen
   le plus rapide de fermer une session volee. */
define( 'AUTH_KEY',         'A_REMPLIR' );
define( 'SECURE_AUTH_KEY',  'A_REMPLIR' );
define( 'LOGGED_IN_KEY',    'A_REMPLIR' );
define( 'NONCE_KEY',        'A_REMPLIR' );
define( 'AUTH_SALT',        'A_REMPLIR' );
define( 'SECURE_AUTH_SALT', 'A_REMPLIR' );
define( 'LOGGED_IN_SALT',   'A_REMPLIR' );
define( 'NONCE_SALT',       'A_REMPLIR' );

/* Prefixe des tables. Les quatre tables metier s'y accrochent :
   `<prefixe>expert_parquet_leads`, `_lead_photos`, `_lead_notes`,
   `_lead_events`. Le changer sur une installation existante casse le lien. */
$table_prefix = 'ep_';

/* --- Environnement ---------------------------------------------------------
   'local' sur le poste de travail, 'production' sur le serveur.
   'staging' se comporte comme la production, sauf pour le journal de debogage. */
define( 'WP_ENVIRONMENT_TYPE', 'production' );
$ep_production = in_array( WP_ENVIRONMENT_TYPE, array( 'production', 'staging' ), true );

define( 'WP_DEBUG', ! $ep_production );
/* Le journal va hors de la racine web : un `debug.log` servi en HTTP raconte
   les chemins du serveur et parfois le contenu des requetes. */
define( 'WP_DEBUG_LOG', '/chemin/hors/racine/web/backend-private/logs/wp-debug.log' );
/* Jamais affiche, meme en local : une trace d'execution imprimee dans une
   reponse d'API finit par etre lue par quelqu'un d'autre que le developpeur. */
define( 'WP_DEBUG_DISPLAY', false );
@ini_set( 'display_errors', 0 );

/* --- Durcissement ----------------------------------------------------------
   Editeur de fichiers ferme partout : sur un back-office qui detient des
   donnees personnelles, editer du PHP depuis le navigateur transforme un vol
   de session en execution de code. */
define( 'DISALLOW_FILE_EDIT', true );

/* Installation d'extensions et de themes fermee en production : le code arrive
   par le depot, pas par un formulaire. Ouverte en local, sinon l'ecran des
   extensions devient inutilisable pendant le developpement. */
define( 'DISALLOW_FILE_MODS', $ep_production );

/* HTTPS obligatoire pour l'administration — en production seulement :
   l'imposer sur un poste local servi en HTTP boucle sur wp-login.php. */
if ( $ep_production ) {
	define( 'FORCE_SSL_ADMIN', true );
}

/* Aucune revision : elles n'ont pas de sens pour des demandes recues, et
   dupliqueraient des donnees personnelles dans la base. */
define( 'WP_POST_REVISIONS', false );
define( 'AUTOSAVE_INTERVAL', 86400 );

/* --- Stockage prive --------------------------------------------------------
   Les photographies envoyees par les visiteurs ne vont pas dans
   `wp-content/uploads`, qui est servi par le serveur web. Ce dossier doit etre
   HORS de la racine web, et accessible en ecriture par PHP. */
define( 'EP_PRIVATE_DIR', '/chemin/hors/racine/web/backend-private' );

/* --- Conservation des donnees (RGPD) ---------------------------------------
   Nombre de mois avant purge automatique des demandes closes.
   AUCUNE valeur par defaut n'est proposee ici : une duree de conservation est
   une decision du responsable du traitement, pas un reglage technique. Tant
   que la constante n'est pas definie, la purge des demandes closes ne s'execute
   pas et le back-office le signale.
   define( 'EP_CONSERVATION_MOIS', 00 ); */

/* --- Envoi des courriels ---------------------------------------------------
   A REMPLIR avec un fournisseur transactionnel. Sans ces constantes, rien n'est
   expedie : tout est ecrit dans un journal prive et trace en evenement.
   Le mot de passe SMTP est un secret : il reste dans CE fichier, jamais ailleurs.
   define( 'EP_SMTP_HOTE', 'smtp-relay.exemple.fr' );
   define( 'EP_SMTP_PORT', 587 );
   define( 'EP_SMTP_USER', 'A_REMPLIR' );
   define( 'EP_SMTP_PASS', 'A_REMPLIR' );
   define( 'EP_MAIL_FROM', 'ne-pas-repondre@exemple.fr' );
   define( 'EP_MAIL_DEST', 'demandes@exemple.fr' ); */

/* --- Adresses --------------------------------------------------------------
   Cette installation ne publie aucune page : elle sert `/wp-json/` et
   `/wp-admin`. Le site public est un autre domaine, entierement statique. */
define( 'WP_HOME',    'https://api.exemple.fr' );
define( 'WP_SITEURL', 'https://api.exemple.fr' );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
