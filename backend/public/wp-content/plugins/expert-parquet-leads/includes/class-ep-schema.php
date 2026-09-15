<?php
/**
 * Contrat de données : champs attendus, énumérations, règles de validation.
 *
 * ---------------------------------------------------------------------------
 * SOURCE DE VÉRITÉ
 *
 * Les valeurs ci-dessous sont celles de `js/config/options.js` dans le projet
 * front, extraites le 11/09/2026 (11 énumérations, 61 valeurs). Les noms de
 * champs sont ceux des attributs `name` réellement présents dans le HTML
 * généré — pas un idéal, la réalité du formulaire. Voir
 * docs/BACKEND-CONTRACT.md côté front.
 *
 * La validation du navigateur est un confort d'usage. Tout est revalidé ici :
 * un client n'est jamais une source de vérité, et une requête peut être forgée
 * sans passer par le formulaire.
 *
 * `EP_Schema::verifier_coherence()` compare cette liste à un export du front
 * et signale toute dérive (voir bin/verifier-enums.php).
 */

defined( 'ABSPATH' ) || exit;

class EP_Schema {

	/** Longueurs maximales, alignées sur ce qu'un humain écrit réellement. */
	public const MAX_COURT  = 120;
	public const MAX_MOYEN  = 200;
	public const MAX_LONG   = 5000;

	/**
	 * Énumérations autorisées. Une valeur hors liste est REFUSÉE, jamais
	 * corrigée en silence : accepter une valeur inconnue reviendrait à stocker
	 * une donnée dont on ne sait plus ce qu'elle veut dire.
	 */
	public static function enums(): array {
		return array(
			'anciennetes'     => array( 'moins-6-mois', '6-mois-2-ans', '2-10-ans', 'plus-10-ans', 'inconnu' ),
			'debuts'          => array( 'jours', 'semaines', 'mois', 'annees', 'depuis-pose' ),
			'delais'          => array( 'urgent', 'mois', 'trimestre', 'reflexion' ),
			'logements'       => array( 'maison', 'appartement', 'local-pro', 'autre' ),
			'objets_contact'  => array( 'question-technique', 'demande-expertise', 'suivi-dossier', 'partenariat', 'autre' ),
			'pieces'          => array( 'sejour', 'chambre', 'cuisine', 'salle-de-bain', 'couloir', 'bureau', 'plusieurs', 'autre' ),
			'problemes'       => array( 'grincement', 'gonflement', 'lames-mobiles', 'humidite', 'taches', 'rayures', 'deformation', 'degat-des-eaux', 'defaut-de-pose', 'vieillissement', 'autre' ),
			'profils'         => array( 'particulier', 'professionnel' ),
			'supports'        => array( 'dalle-beton', 'chape', 'plancher-bois', 'ancien-revetement', 'plancher-chauffant', 'inconnu' ),
			'surfaces'        => array( 'moins-10', '10-25', '25-50', '50-100', 'plus-100', 'inconnu' ),
			'types_parquet'   => array( 'massif', 'contrecolle', 'stratifie', 'autre', 'inconnu' ),
		);
	}

	/**
	 * Libellés humains des valeurs d'énumération.
	 *
	 * Ce sont exactement les `label` de `js/config/options.js` : le visiteur a
	 * coché « Gonflement ou soulèvement », le gestionnaire doit lire la même
	 * chose. Stocker le code et n'afficher que lui obligerait l'exploitant à
	 * traduire mentalement `plancher-chauffant` ou `6-mois-2-ans` — et un
	 * export CSV rempli de codes n'est pas exploitable par un tiers.
	 *
	 * La valeur technique reste la seule enregistrée en base : les libellés
	 * peuvent être réécrits sans toucher aux données déjà reçues.
	 */
	public static function libelles(): array {
		return array(
			'anciennetes'    => array(
				'moins-6-mois' => 'Moins de 6 mois',
				'6-mois-2-ans' => 'Entre 6 mois et 2 ans',
				'2-10-ans'     => 'Entre 2 et 10 ans',
				'plus-10-ans'  => 'Plus de 10 ans',
				'inconnu'      => 'Je ne sais pas',
			),
			'debuts'         => array(
				'jours'       => 'Quelques jours',
				'semaines'    => 'Quelques semaines',
				'mois'        => 'Plusieurs mois',
				'annees'      => 'Plus d’un an',
				'depuis-pose' => 'Depuis la pose',
			),
			'delais'         => array(
				'urgent'     => 'Dès que possible',
				'mois'       => 'Dans le mois',
				'trimestre'  => 'Dans les 3 mois',
				'reflexion'  => 'Je me renseigne',
			),
			'logements'      => array(
				'maison'      => 'Maison',
				'appartement' => 'Appartement',
				'local-pro'   => 'Local professionnel',
				'autre'       => 'Autre',
			),
			'objets_contact' => array(
				'question-technique' => 'Question technique',
				'demande-expertise'  => 'Demande d’expertise',
				'suivi-dossier'      => 'Suivi d’un dossier',
				'partenariat'        => 'Partenariat ou presse',
				'autre'              => 'Autre',
			),
			'pieces'         => array(
				'sejour'        => 'Séjour / salon',
				'chambre'       => 'Chambre',
				'cuisine'       => 'Cuisine',
				'salle-de-bain' => 'Salle de bain',
				'couloir'       => 'Couloir / entrée',
				'bureau'        => 'Bureau',
				'plusieurs'     => 'Plusieurs pièces',
				'autre'         => 'Autre',
			),
			'problemes'      => array(
				'grincement'     => 'Grincement',
				'gonflement'     => 'Gonflement ou soulèvement',
				'lames-mobiles'  => 'Lames qui bougent',
				'humidite'       => 'Humidité',
				'taches'         => 'Taches',
				'rayures'        => 'Rayures',
				'deformation'    => 'Déformation générale',
				'degat-des-eaux' => 'Dégât des eaux',
				'defaut-de-pose' => 'Problème de pose',
				'vieillissement' => 'Parquet ancien ou usé',
				'autre'          => 'Autre problème',
			),
			'profils'        => array(
				'particulier'    => 'Particulier',
				'professionnel'  => 'Professionnel',
			),
			'supports'       => array(
				'dalle-beton'        => 'Dalle béton',
				'chape'              => 'Chape (ciment ou anhydrite)',
				'plancher-bois'      => 'Plancher bois / solives',
				'ancien-revetement'  => 'Ancien revêtement conservé',
				'plancher-chauffant' => 'Plancher chauffant',
				'inconnu'            => 'Je ne sais pas',
			),
			'surfaces'       => array(
				'moins-10'  => 'Moins de 10 m²',
				'10-25'     => '10 à 25 m²',
				'25-50'     => '25 à 50 m²',
				'50-100'    => '50 à 100 m²',
				'plus-100'  => 'Plus de 100 m²',
				'inconnu'   => 'Je ne sais pas',
			),
			'types_parquet'  => array(
				'massif'      => 'Parquet massif',
				'contrecolle' => 'Parquet contrecollé',
				'stratifie'   => 'Stratifié',
				'autre'       => 'Autre revêtement bois',
				'inconnu'     => 'Je ne sais pas',
			),
		);
	}

	/**
	 * Libellé d'une valeur. Retourne la valeur brute si elle n'est pas
	 * traduite : mieux vaut afficher un code qu'une case vide, car une donnée
	 * reçue ne doit jamais disparaître de l'écran du gestionnaire.
	 */
	public static function libelle_valeur( string $enum, string $valeur ): string {
		return self::libelles()[ $enum ][ $valeur ] ?? $valeur;
	}

	/**
	 * Rend lisible la valeur d'un champ décrit par `champs_contact()` ou
	 * `champs_devis()` : traduit les énumérations, joint les tableaux.
	 */
	public static function afficher( array $regle, $valeur ): string {
		list( $type, , $contrainte ) = $regle;
		if ( is_array( $valeur ) ) {
			if ( 'enum_multi' === $type ) {
				$valeur = array_map(
					static fn( $v ) => self::libelle_valeur( (string) $contrainte, (string) $v ),
					$valeur
				);
			}
			return implode( ', ', array_map( 'strval', $valeur ) );
		}
		$valeur = (string) $valeur;
		if ( 'enum' === $type ) {
			return self::libelle_valeur( (string) $contrainte, $valeur );
		}
		if ( 'oui' === $type ) {
			return $valeur ? 'Oui' : 'Non';
		}
		return $valeur;
	}

	/**
	 * Champs du formulaire de contact.
	 *
	 * Format : nom => array( type, obligatoire, contrainte, libellé humain ).
	 * Le libellé sert à l'administration et aux courriels — un gestionnaire ne
	 * doit jamais lire un nom technique.
	 */
	public static function champs_contact(): array {
		return array(
			'nom'           => array( 'texte', true,  self::MAX_COURT,          'Nom' ),
			'email'         => array( 'email', true,  self::MAX_COURT,          'Adresse e-mail' ),
			'telephone'     => array( 'tel',   false, 40,                       'Téléphone' ),
			'objet'         => array( 'enum',  true,  'objets_contact',         'Objet' ),
			'message'       => array( 'long',  true,  self::MAX_LONG,           'Message' ),
			'consentement'  => array( 'oui',   true,  null,                     'Consentement' ),
		);
	}

	/**
	 * Champs de la demande d'expertise.
	 *
	 * `probleme` est le seul tableau : le formulaire l'envoie en cases à
	 * cocher multiples, sous le nom `probleme[]`.
	 */
	public static function champs_devis(): array {
		return array(
			'probleme'      => array( 'enum_multi', true,  'problemes',       'Problème constaté' ),
			'type'          => array( 'enum',       false, 'types_parquet',   'Type de parquet' ),
			'anciennete'    => array( 'enum',       false, 'anciennetes',     'Ancienneté' ),
			'support'       => array( 'enum',       false, 'supports',        'Support' ),
			'piece'         => array( 'enum',       false, 'pieces',          'Pièce concernée' ),
			'surface'       => array( 'enum',       false, 'surfaces',        'Surface' ),
			'logement'      => array( 'enum',       false, 'logements',       'Type de logement' ),
			'profil'        => array( 'enum',       false, 'profils',         'Profil' ),
			'code_postal'   => array( 'cp',         true,  null,              'Code postal' ),
			'ville'         => array( 'texte',      true,  self::MAX_COURT,   'Ville' ),
			'delai'         => array( 'enum',       false, 'delais',          'Délai souhaité' ),
			'description'   => array( 'long',       true,  self::MAX_LONG,    'Description' ),
			'prenom'        => array( 'texte',      true,  self::MAX_COURT,   'Prénom' ),
			'nom'           => array( 'texte',      true,  self::MAX_COURT,   'Nom' ),
			'email'         => array( 'email',      true,  self::MAX_COURT,   'Adresse e-mail' ),
			'telephone'     => array( 'tel',        false, 40,                'Téléphone' ),
			'consentement'  => array( 'oui',        true,  null,              'Consentement' ),
		);
	}

	/** Longueurs minimales exigées côté navigateur, donc exigées ici aussi. */
	public const MIN_MESSAGE     = 20;
	public const MIN_DESCRIPTION = 30;

	/**
	 * Valide une charge utile contre une définition de champs.
	 *
	 * Retourne `array( $propre, $erreurs )`. `$erreurs` est indexé par le nom
	 * EXACT du champ tel qu'il apparaît dans le HTML : c'est ce que le front
	 * attend pour poser le message sous le bon champ (voir renderServerErrors
	 * dans js/modules/forms.js).
	 */
	public static function valider( array $donnees, array $champs ): array {
		$enums   = self::enums();
		$propre  = array();
		$erreurs = array();

		foreach ( $champs as $nom => $regle ) {
			list( $type, $obligatoire, $contrainte, $libelle ) = $regle;
			$brut = $donnees[ $nom ] ?? null;

			if ( 'enum_multi' === $type ) {
				$valeurs = is_array( $brut ) ? $brut : ( null === $brut || '' === $brut ? array() : array( $brut ) );
				/* Un élément qui n'est pas une chaîne (tableau imbriqué, objet)
				   ne peut pas être une valeur d'énumération : refus net, plutôt
				   qu'une conversion en « Array » accompagnée d'un avertissement
				   PHP dans le journal. */
				if ( array_filter( $valeurs, static fn( $v ) => ! is_scalar( $v ) ) ) {
					$erreurs[ $nom ] = 'Valeur non reconnue.';
					continue;
				}
				$valeurs = array_values( array_unique( array_filter( array_map( 'strval', $valeurs ) ) ) );
				$permis  = $enums[ $contrainte ];
				$hors    = array_diff( $valeurs, $permis );
				if ( $hors ) {
					$erreurs[ $nom ] = 'Valeur non reconnue.';
					continue;
				}
				if ( $obligatoire && ! $valeurs ) {
					$erreurs[ $nom ] = 'Sélectionnez au moins une réponse.';
					continue;
				}
				$propre[ $nom ] = $valeurs;
				continue;
			}

			/* Seuls les scalaires sont admis pour un champ simple. Un tableau ou
			   un objet à la place d'un nom n'est pas une saisie, c'est une
			   requête forgée : refus, sans conversion silencieuse en « Array ». */
			if ( null !== $brut && ! is_scalar( $brut ) ) {
				$erreurs[ $nom ] = 'Valeur non reconnue.';
				continue;
			}
			$valeur = is_string( $brut ) ? trim( $brut ) : ( null === $brut ? '' : (string) $brut );

			if ( '' === $valeur ) {
				if ( $obligatoire ) {
					$erreurs[ $nom ] = 'oui' === $type
						? 'Votre accord est nécessaire pour traiter la demande.'
						: 'Ce champ est nécessaire.';
				}
				continue;
			}

			switch ( $type ) {
				case 'email':
					if ( ! is_email( $valeur ) || strlen( $valeur ) > $contrainte ) {
						$erreurs[ $nom ] = 'Adresse e-mail invalide.';
						continue 2;
					}
					$propre[ $nom ] = sanitize_email( $valeur );
					break;

				case 'tel':
					// Volontairement permissif : les formats internationaux sont
					// nombreux et refuser un numéro valide coûte un contact.
					if ( ! preg_match( '/^[0-9 .\-+()\/]{6,40}$/', $valeur ) ) {
						$erreurs[ $nom ] = 'Numéro de téléphone invalide.';
						continue 2;
					}
					$propre[ $nom ] = sanitize_text_field( $valeur );
					break;

				case 'cp':
					if ( ! preg_match( '/^[0-9]{5}$/', $valeur ) ) {
						$erreurs[ $nom ] = 'Code postal invalide.';
						continue 2;
					}
					$propre[ $nom ] = $valeur;
					break;

				case 'enum':
					if ( ! in_array( $valeur, $enums[ $contrainte ], true ) ) {
						$erreurs[ $nom ] = 'Valeur non reconnue.';
						continue 2;
					}
					$propre[ $nom ] = $valeur;
					break;

				case 'oui':
					if ( 'oui' !== $valeur ) {
						$erreurs[ $nom ] = 'Votre accord est nécessaire pour traiter la demande.';
						continue 2;
					}
					$propre[ $nom ] = 'oui';
					break;

				case 'long':
					$min = ( 'message' === $nom ) ? self::MIN_MESSAGE : self::MIN_DESCRIPTION;
					if ( mb_strlen( $valeur ) < $min ) {
						$erreurs[ $nom ] = sprintf( 'Merci de détailler un peu plus (%d caractères minimum).', $min );
						continue 2;
					}
					if ( mb_strlen( $valeur ) > $contrainte ) {
						$erreurs[ $nom ] = 'Message trop long.';
						continue 2;
					}
					// `wp_strip_all_tags` et non `wp_kses` : aucun HTML n'a de
					// raison d'être dans une description saisie au clavier.
					$propre[ $nom ] = wp_strip_all_tags( $valeur );
					break;

				default:
					if ( mb_strlen( $valeur ) > $contrainte ) {
						$erreurs[ $nom ] = 'Valeur trop longue.';
						continue 2;
					}
					$propre[ $nom ] = sanitize_text_field( $valeur );
			}
			unset( $libelle );
		}

		return array( $propre, $erreurs );
	}

	/** Libellé humain d'un champ, pour l'administration et les courriels. */
	public static function libelle( string $formulaire, string $champ ): string {
		$champs = 'contact' === $formulaire ? self::champs_contact() : self::champs_devis();
		return $champs[ $champ ][3] ?? $champ;
	}
}
