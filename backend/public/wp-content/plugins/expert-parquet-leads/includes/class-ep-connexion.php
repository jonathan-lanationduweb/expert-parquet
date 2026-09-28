<?php
/**
 * Limitation des tentatives de connexion.
 *
 * WordPress accepte par défaut un nombre illimité de mots de passe sur
 * `wp-login.php`. Sur une installation qui ne publie aucune page et n'a qu'un
 * ou deux comptes, c'est la seule porte qui reste : elle mérite un verrou.
 *
 * Ce que fait cette classe :
 *  - compte les échecs par empreinte d'adresse IP, sur une fenêtre glissante ;
 *  - au-delà du seuil, refuse les tentatives pendant une durée bornée ;
 *  - efface le compteur dès qu'une connexion réussit.
 *
 * Ce qu'elle ne fait pas, volontairement :
 *  - aucun blocage définitif. Un verrou permanent se retourne contre son
 *    propriétaire le jour où quelqu'un le déclenche à sa place ;
 *  - aucune écriture de l'adresse IP. Seule une empreinte salée est stockée,
 *    dans un transient qui expire tout seul : il n'y a rien à purger, rien à
 *    exporter en cas de demande d'accès, rien à fuir ;
 *  - aucune distinction entre un compte existant et un compte inexistant. Un
 *    attaquant qui apprend qu'un identifiant existe a déjà fait la moitié du
 *    chemin.
 *
 * Elle ne remplace pas une protection en amont (pare-feu, Cloudflare, accès
 * restreint par IP) : elle ne voit qu'une requête déjà arrivée jusqu'à PHP.
 * `SECURITY.md` le dit explicitement.
 *
 * @package Expert_Parquet
 */

defined( 'ABSPATH' ) || exit;

class EP_Connexion {

	/**
	 * Nombre d'échecs tolérés avant blocage.
	 *
	 * Six laisse la place à une faute de frappe répétée, à un mot de passe
	 * enregistré devenu obsolète et à un changement de clavier, sans laisser
	 * de marge utile à une attaque par dictionnaire.
	 */
	public const PLAFOND = 6;

	/** Fenêtre de comptage des échecs. */
	public const FENETRE = 15 * MINUTE_IN_SECONDS;

	/** Durée du blocage une fois le plafond atteint. */
	public const BLOCAGE = 15 * MINUTE_IN_SECONDS;

	/** Préfixes des transients. Le nettoyage est assuré par leur expiration. */
	private const CLE_ECHECS  = 'ep_cx_e_';
	private const CLE_BLOCAGE = 'ep_cx_b_';

	public static function init(): void {
		/* Priorité 30 : après les fournisseurs d'authentification natifs de
		   WordPress (cookie à 20, identifiants à 20). Le contrôle porte donc
		   sur une tentative réelle, et le refus remplace le résultat. */
		add_filter( 'authenticate', array( __CLASS__, 'barrer' ), 30, 3 );
		add_action( 'wp_login_failed', array( __CLASS__, 'compter_echec' ) );
		add_action( 'wp_login', array( __CLASS__, 'oublier' ), 10, 0 );
	}

	/** Clé de compteur propre à l'appelant, sans adresse IP en clair. */
	private static function cle( string $prefixe ): string {
		return $prefixe . substr( EP_Antispam::empreinte(), 0, 32 );
	}

	/** Secondes restantes avant la fin du blocage, 0 si aucun blocage. */
	public static function blocage_restant(): int {
		$jusqua = (int) get_transient( self::cle( self::CLE_BLOCAGE ) );
		return $jusqua > time() ? $jusqua - time() : 0;
	}

	/**
	 * Refus d'une tentative pendant un blocage.
	 *
	 * Le filtre est appelé aussi au simple affichage du formulaire, sans
	 * identifiant : on ne compte alors rien et on ne bloque rien.
	 *
	 * @param null|WP_User|WP_Error $utilisateur Résultat des fournisseurs précédents.
	 * @param string                $identifiant Identifiant soumis.
	 * @param string                $motdepasse  Mot de passe soumis.
	 * @return null|WP_User|WP_Error
	 */
	public static function barrer( $utilisateur, $identifiant, $motdepasse ) {
		if ( '' === (string) $identifiant && '' === (string) $motdepasse ) {
			return $utilisateur;
		}

		$restant = self::blocage_restant();
		if ( 0 === $restant ) {
			return $utilisateur;
		}

		/* Le compte est peut-être bon : on refuse quand même. Laisser passer
		   une connexion réussie pendant un blocage rendrait le verrou inutile
		   pour qui devine juste au mauvais moment. */
		return new WP_Error(
			'ep_trop_de_tentatives',
			sprintf(
				/* translators: %d : nombre de minutes restantes. */
				esc_html__( 'Trop de tentatives de connexion. Réessayez dans %d minutes.', 'expert-parquet' ),
				max( 1, (int) ceil( $restant / MINUTE_IN_SECONDS ) )
			)
		);
	}

	/**
	 * Un échec de plus.
	 *
	 * L'identifiant soumis n'est PAS pris en compte dans la clé : compter par
	 * identifiant permettrait à un attaquant de verrouiller le compte d'un
	 * tiers en se trompant volontairement. On compte par origine.
	 */
	public static function compter_echec(): void {
		if ( self::blocage_restant() > 0 ) {
			return;
		}

		$cle     = self::cle( self::CLE_ECHECS );
		$echecs  = (int) get_transient( $cle ) + 1;

		if ( $echecs >= self::PLAFOND ) {
			delete_transient( $cle );
			set_transient( self::cle( self::CLE_BLOCAGE ), time() + self::BLOCAGE, self::BLOCAGE );
			return;
		}

		set_transient( $cle, $echecs, self::FENETRE );
	}

	/** Une connexion réussie remet le compteur à zéro. */
	public static function oublier(): void {
		delete_transient( self::cle( self::CLE_ECHECS ) );
		delete_transient( self::cle( self::CLE_BLOCAGE ) );
	}

	/**
	 * Message affiché sur la page de connexion.
	 *
	 * `EP_Security` remplace tous les messages d'erreur par un texte unique,
	 * pour qu'aucun ne révèle si l'identifiant existe. Le blocage est la seule
	 * exception : il ne dit rien du compte, seulement de l'origine de la
	 * requête, et un visiteur légitime doit comprendre pourquoi il attend.
	 */
	public static function message( string $defaut ): string {
		$restant = self::blocage_restant();
		if ( 0 === $restant ) {
			return $defaut;
		}
		return sprintf(
			/* translators: %d : nombre de minutes restantes. */
			esc_html__( 'Trop de tentatives de connexion. Réessayez dans %d minutes.', 'expert-parquet' ),
			max( 1, (int) ceil( $restant / MINUTE_IN_SECONDS ) )
		);
	}
}
