<?php
/**
 * Les points d'entrée REST publics.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI AUCUN NONCE
 *
 * Les visiteurs ne sont PAS connectés. Un nonce `wp_rest` est dérivé de la
 * session : sans cookie de connexion, il ne prouve rien et ne fait qu'ajouter
 * une classe de pannes (nonce périmé sur une page mise en cache). La protection
 * vient d'ailleurs : origine contrôlée, champ leurre, durée de remplissage,
 * limitation de débit.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LA FORME DES ERREURS N'EST PAS CELLE DE WORDPRESS
 *
 * Le front attend `{ errors: { champ: message }, message }` — c'est ce que lit
 * `renderServerErrors()` pour poser chaque message SOUS son champ. On émet
 * donc la forme du contrat, délibérément.
 *
 * ---------------------------------------------------------------------------
 * DEUX TEMPS POUR LES PHOTOGRAPHIES
 *
 * La demande part d'abord en JSON. Les photographies suivent, attachées à la
 * référence retournée, avec un jeton de dépôt distinct. Un envoi unique ferait
 * perdre la demande entière si le téléversement échouait en fin de course.
 *
 * Le visiteur ne voit JAMAIS l'identifiant SQL : uniquement la référence
 * publique (128 bits aléatoires).
 */

defined( 'ABSPATH' ) || exit;

class EP_Rest {

	public static function init(): void {
		add_action( 'rest_api_init', array( __CLASS__, 'enregistrer' ) );
		/* Priorité 5 : AVANT le gestionnaire natif de WordPress, retiré juste
		   en dessous. Voir `retirer_cors_natif()`. */
		add_filter( 'rest_pre_serve_request', array( __CLASS__, 'entetes_cors' ), 5, 4 );
		add_action( 'rest_api_init', array( __CLASS__, 'retirer_cors_natif' ), 20 );
	}

	/**
	 * Retire le gestionnaire CORS natif de WordPress : il ajoute
	 * `Access-Control-Allow-Credentials: true` et annonce PUT, PATCH, DELETE.
	 * Sur une API ouverte aux anonymes, autoriser les identifiants revient à
	 * dire qu'un navigateur peut la joindre EN EMPORTANT les cookies d'un
	 * gestionnaire connecté : une XSS sur un domaine de la liste blanche
	 * deviendrait une écriture authentifiée. Notre gestionnaire pose ce qui est
	 * nécessaire, et seulement pour notre espace de noms.
	 */
	public static function retirer_cors_natif(): void {
		remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
	}

	public static function enregistrer(): void {
		$ouvert = '__return_true';

		register_rest_route( EP_REST_NS, '/contact', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'contact' ), 'permission_callback' => $ouvert ) );
		register_rest_route( EP_REST_NS, '/quote', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'devis' ), 'permission_callback' => $ouvert ) );
		register_rest_route(
			EP_REST_NS,
			'/quote/(?P<ref>' . EP_Lead::REFERENCE_MOTIF . ')/photos',
			array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'photos' ), 'permission_callback' => $ouvert )
		);
		// Sonde de santé : ce que supervisera l'hébergement. Ne révèle rien.
		register_rest_route( EP_REST_NS, '/health', array( 'methods' => 'GET', 'callback' => static fn() => array( 'ok' => true ), 'permission_callback' => $ouvert ) );
	}

	/**
	 * CORS : liste blanche stricte, jamais `*`, jamais `Allow-Credentials`.
	 * Les en-têtes de sécurité sont posés ici aussi : `send_headers` ne se
	 * déclenche pas sur le chemin REST.
	 */
	public static function entetes_cors( $servi, $resultat, $requete, $serveur ) {
		EP_Security::entetes();
		$route = $requete instanceof WP_REST_Request ? $requete->get_route() : '';
		if ( ! str_starts_with( ltrim( (string) $route, '/' ), EP_REST_NS ) ) {
			return $servi;
		}
		$origine = $_SERVER['HTTP_ORIGIN'] ?? '';
		if ( $origine && in_array( $origine, EP_ORIGINES_AUTORISEES, true ) ) {
			header( 'Access-Control-Allow-Origin: ' . $origine );
			header( 'Vary: Origin' );
			header( 'Access-Control-Allow-Methods: POST, GET, OPTIONS' );
			header( 'Access-Control-Allow-Headers: Content-Type' );
			header( 'Access-Control-Max-Age: 600' );
		}
		unset( $resultat, $serveur );
		return $servi;
	}

	/* --------------------------------------------------------------- erreurs */

	private static function refus( array $erreurs, string $message, int $statut = 422 ): WP_REST_Response {
		return new WP_REST_Response( array( 'errors' => (object) $erreurs, 'message' => $message ), $statut );
	}

	/**
	 * Contrôles communs : origine, anti-robots.
	 *
	 * L'origine n'est vérifiée QUE si l'en-tête est présent : un appel serveur
	 * à serveur légitime n'en envoie pas, et un navigateur en envoie toujours
	 * un sur une requête inter-origine.
	 */
	private static function prealables( WP_REST_Request $requete, array $donnees ): ?WP_REST_Response {
		$origine = $requete->get_header( 'origin' );
		if ( $origine && ! in_array( $origine, EP_ORIGINES_AUTORISEES, true ) ) {
			return self::refus( array(), 'Origine non autorisée.', 403 );
		}
		$souci = EP_Antispam::verifier( $donnees );
		if ( 'debit' === $souci ) {
			return self::refus( array(), 'Trop de demandes envoyées depuis cet appareil. Réessayez dans quelques minutes.', 429 );
		}
		if ( null !== $souci ) {
			// Message neutre : détailler apprendrait à un robot comment passer.
			return self::refus( array(), 'La demande n’a pas pu être traitée. Réessayez.', 400 );
		}
		return null;
	}

	/** Contexte technique conservé — jamais l'adresse IP en clair. */
	private static function contexte( WP_REST_Request $requete, array $donnees ): array {
		$referer = (string) $requete->get_header( 'referer' );
		return array(
			'source_url'     => isset( $donnees['_page'] ) ? sanitize_text_field( (string) $donnees['_page'] ) : '',
			'referrer_url'   => $referer ? esc_url_raw( $referer ) : '',
			'ip_fingerprint' => substr( EP_Antispam::empreinte(), 0, 16 ),
		);
	}

	/* --------------------------------------------------------------- contact */

	public static function contact( WP_REST_Request $requete ) {
		$donnees = (array) $requete->get_json_params();

		$stop = self::prealables( $requete, $donnees );
		if ( $stop ) {
			return $stop;
		}
		list( $propre, $erreurs ) = EP_Schema::valider( $donnees, EP_Schema::champs_contact() );
		if ( $erreurs ) {
			return self::refus( $erreurs, 'Certaines informations n’ont pas été acceptées. Corrigez les champs signalés.' );
		}

		$lead = EP_Leads_Repository::creer( 'contact', $propre, self::contexte( $requete, $donnees ) );
		if ( ! $lead ) {
			return self::refus( array(), 'Enregistrement impossible. Réessayez dans un instant.', 500 );
		}
		EP_Events_Repository::consigner( $lead['id'], 'lead_created', array( 'user_id' => null, 'metadata' => array( 'form' => 'contact' ) ) );
		EP_Mail::notifier( $lead );
		EP_Mail::accuser_reception( $lead );

		return new WP_REST_Response( array( 'ok' => true, 'reference' => $lead['public_id'] ), 201 );
	}

	/* ----------------------------------------------------------------- devis */

	public static function devis( WP_REST_Request $requete ) {
		$donnees = (array) $requete->get_json_params();

		$stop = self::prealables( $requete, $donnees );
		if ( $stop ) {
			return $stop;
		}
		list( $propre, $erreurs ) = EP_Schema::valider( $donnees, EP_Schema::champs_devis() );
		if ( $erreurs ) {
			return self::refus( $erreurs, 'Certaines informations n’ont pas été acceptées. Corrigez les champs signalés.' );
		}

		$contexte = self::contexte( $requete, $donnees );
		/* Le contexte du pré-diagnostic est conservé tel quel — c'est la trace
		   des réponses du visiteur et d'une orientation générale, jamais un
		   constat. Borné pour qu'un client forgé ne remplisse pas la table. */
		if ( isset( $donnees['diagnosticContext'] ) && is_array( $donnees['diagnosticContext'] ) ) {
			$json = wp_json_encode( $donnees['diagnosticContext'], JSON_UNESCAPED_UNICODE );
			$contexte['diagnostic_context'] = strlen( $json ) <= 4000 ? $json : null;
		}

		$lead = EP_Leads_Repository::creer( 'devis', $propre, $contexte );
		if ( ! $lead ) {
			return self::refus( array(), 'Enregistrement impossible. Réessayez dans un instant.', 500 );
		}
		EP_Events_Repository::consigner( $lead['id'], 'lead_created', array( 'user_id' => null, 'metadata' => array( 'form' => 'devis' ) ) );

		/* Jeton de dépôt : il autorise UNIQUEMENT l'ajout de photographies à
		   cette demande, pendant trente minutes. La référence, elle, n'est pas
		   un secret. Il n'ouvre aucune lecture. */
		$jeton = bin2hex( random_bytes( 16 ) );
		set_transient( 'ep_jeton_' . $lead['public_id'], $jeton, 30 * MINUTE_IN_SECONDS );

		EP_Mail::notifier( $lead );
		EP_Mail::accuser_reception( $lead );

		return new WP_REST_Response(
			array(
				'ok'         => true,
				'reference'  => $lead['public_id'],
				'photoToken' => $jeton,
				'photoUrl'   => rest_url( EP_REST_NS . '/quote/' . $lead['public_id'] . '/photos' ),
			),
			201
		);
	}

	/* ---------------------------------------------------------------- photos */

	public static function photos( WP_REST_Request $requete ) {
		$ref   = (string) $requete->get_param( 'ref' );
		$jeton = (string) $requete->get_param( 'token' );

		/* Envoi plus gros que `post_max_size` : PHP abandonne le corps AVANT
		   d'arriver ici. `$_POST` et `$_FILES` sont vides alors que l'en-tête
		   annonce une charge. Sans ce contrôle, l'absence de jeton ferait
		   répondre « dépôt non autorisé » — trompeur. */
		$annonce = (int) ( $_SERVER['CONTENT_LENGTH'] ?? 0 );
		if ( $annonce > 0 && ! $_POST && ! $_FILES ) {
			return self::refus( array(), 'L’envoi est trop volumineux pour le serveur. Réessayez avec moins de photographies, ou des photographies plus légères.', 413 );
		}

		$attendu = get_transient( 'ep_jeton_' . $ref );
		if ( ! $attendu || ! hash_equals( (string) $attendu, $jeton ) ) {
			return self::refus( array(), 'Dépôt non autorisé ou expiré.', 403 );
		}
		$lead = EP_Leads_Repository::par_reference( $ref );
		if ( ! $lead ) {
			return self::refus( array(), 'Demande introuvable.', 404 );
		}
		$fichiers = $_FILES['photos'] ?? null;
		if ( ! $fichiers ) {
			return self::refus( array(), 'Aucun fichier reçu.', 400 );
		}

		list( $stockees, $erreurs ) = EP_Photos::attacher( $lead['id'], $fichiers );

		return new WP_REST_Response( array( 'ok' => true, 'recues' => count( $stockees ), 'refusees' => $erreurs ), 200 );
	}
}
