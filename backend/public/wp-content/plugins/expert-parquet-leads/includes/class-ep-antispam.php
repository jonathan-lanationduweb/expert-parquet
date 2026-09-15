<?php
/**
 * Protections anti-robots, sans tiers et sans cookie.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI PAS DE CAPTCHA POUR COMMENCER
 *
 * Un CAPTCHA — Turnstile ou reCAPTCHA — ajoute un SOUS-TRAITANT, donc un
 * arbitrage RGPD, une mention dans la politique de confidentialité, et une
 * dépendance réseau qui casse le formulaire si le service tombe. reCAPTCHA
 * ajoute en plus un transfert hors UE.
 *
 * Les trois protections ci-dessous ne coûtent rien de tout cela et suffisent
 * largement au volume attendu. Elles sont conçues pour être complétées par
 * Turnstile le jour où du spam passe réellement — pas avant.
 *
 * 1. CHAMP LEURRE. Un champ invisible qu'un humain ne remplit jamais. La
 *    plupart des robots remplissent tout ce qu'ils trouvent.
 * 2. DURÉE DE REMPLISSAGE. Un formulaire soumis en moins de trois secondes
 *    n'a pas été lu.
 *
 *    `_ts` est une DURÉE en millisecondes, mesurée par le navigateur entre
 *    l'affichage du formulaire et son envoi — surtout pas un horodatage
 *    absolu. Le site étant statique, aucun serveur ne peut horodater la page ;
 *    il faudrait donc comparer l'heure du visiteur à celle du serveur. Or une
 *    horloge client qui avance de quelques secondes suffirait alors à faire
 *    rejeter une demande parfaitement légitime, avec un message générique et
 *    aucun moyen pour l'intéressé de s'en sortir. Une durée ne dépend que de
 *    la régularité de l'horloge locale pendant la visite : plus d'écart
 *    possible.
 *
 *    Il n'y a volontairement PAS de borne haute. Elle ne protégerait de rien —
 *    un robot qui rejoue une requête réécrit cette valeur aussi facilement que
 *    le reste — et elle refuserait l'envoi d'un visiteur ayant laissé son
 *    onglet ouvert une nuit. C'est la limitation de débit qui fait ce travail.
 * 3. LIMITATION DE DÉBIT. Par empreinte d'adresse IP, glissante.
 *
 * Aucune de ces protections ne stocke d'adresse IP en clair : seule une
 * empreinte salée est conservée, et seulement le temps de la fenêtre.
 */

defined( 'ABSPATH' ) || exit;

class EP_Antispam {

	/** Durée minimale de remplissage, en secondes. */
	public const DELAI_MINIMAL = 3;

	/** Fenêtre et plafond de la limitation de débit. */
	public const FENETRE = 10 * MINUTE_IN_SECONDS;
	public const PLAFOND = 5;

	/** Plafond global, tous visiteurs confondus, en dernier rempart. */
	public const FENETRE_GLOBALE = HOUR_IN_SECONDS;
	public const PLAFOND_GLOBAL  = 60;

	/**
	 * Empreinte non réversible de l'adresse IP.
	 *
	 * L'adresse elle-même n'est jamais écrite : ni en base, ni dans un
	 * transient, ni dans les journaux. Une empreinte salée avec une clé propre
	 * au site suffit à compter, et ne permet pas de remonter au visiteur.
	 */
	public static function empreinte(): string {
		$ip = '';
		foreach ( array( 'HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP', 'REMOTE_ADDR' ) as $cle ) {
			if ( ! empty( $_SERVER[ $cle ] ) ) {
				$ip = (string) $_SERVER[ $cle ];
				break;
			}
		}
		/* `X-Forwarded-For` est volontairement absent : il est trivialement
		   falsifiable tant qu'aucun proxy de confiance n'est en place. Le jour
		   où Cloudflare sera devant, `CF-Connecting-IP` prendra le relais. */
		return hash_hmac( 'sha256', $ip, wp_salt( 'nonce' ) );
	}

	/**
	 * Contrôle complet. Retourne un message d'erreur, ou null si tout va bien.
	 *
	 * Le message est volontairement le même pour toutes les causes : détailler
	 * « votre horodatage est trop récent » apprendrait à un robot comment
	 * passer.
	 */
	public static function verifier( array $donnees ): ?string {
		// 1. Champ leurre.
		if ( ! empty( $donnees['_hp'] ) ) {
			return 'refus';
		}

		/* 2. Durée de remplissage, en millisecondes.
		   Absente — JavaScript désactivé, champ retiré — la mesure est
		   simplement ignorée : mieux vaut laisser passer que refuser un
		   visiteur pour une protection secondaire. Une valeur négative, elle,
		   ne peut venir d'un navigateur. */
		if ( isset( $donnees['_ts'] ) ) {
			$ecoule = (int) $donnees['_ts'];
			if ( $ecoule < 0 || ( $ecoule > 0 && $ecoule < self::DELAI_MINIMAL * 1000 ) ) {
				return 'refus';
			}
		}

		// 3. Limitation de débit.
		if ( ! self::debit_acceptable() ) {
			return 'debit';
		}

		return null;
	}

	private static function debit_acceptable(): bool {
		$cle    = 'ep_debit_' . substr( self::empreinte(), 0, 32 );
		$compte = (int) get_transient( $cle );
		if ( $compte >= self::PLAFOND ) {
			return false;
		}
		set_transient( $cle, $compte + 1, self::FENETRE );

		$global = (int) get_transient( 'ep_debit_global' );
		if ( $global >= self::PLAFOND_GLOBAL ) {
			return false;
		}
		set_transient( 'ep_debit_global', $global + 1, self::FENETRE_GLOBALE );

		return true;
	}
}
