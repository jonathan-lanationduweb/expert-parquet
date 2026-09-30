<?php
/**
 * Lecture de l'orientation commerciale d'une demande.
 *
 * ---------------------------------------------------------------------------
 * CETTE CLASSE NE DÉCIDE RIEN
 *
 * C'est le SITE qui oriente, et la règle vit dans
 * `js/config/orientation-rules.js`. Ici, on relit une demande déjà
 * enregistrée pour dire à un gestionnaire ce que le visiteur a probablement
 * vu — rien de plus. Aucun lien n'est produit, aucune URL n'est recopiée.
 *
 * ---------------------------------------------------------------------------
 * UNE DUPLICATION ASSUMÉE, ET BORNÉE
 *
 * Le back-office est en PHP, le moteur en JavaScript : impossible de partager
 * le code sans introduire un pont que ce projet ne veut pas. La règle est donc
 * réécrite ici, en un seul endroit, volontairement courte, et les deux
 * fichiers se citent mutuellement. Toute modification de la matrice doit
 * toucher les deux — c'est le prix, il est écrit.
 *
 * ---------------------------------------------------------------------------
 * CE QU'ELLE REFUSE DE FAIRE
 *
 * Deviner. Sans profil, sans problème exploitable, elle répond « à qualifier »
 * plutôt que d'inventer une orientation qui orienterait un rappel commercial
 * dans le vide.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI « APPROVISIONNEMENT » N'APPARAÎT PLUS ICI
 *
 * Le site ne DÉDUIT plus ce besoin : il le DEMANDE, en un clic, dans le
 * mini-routeur — et ce routeur ne remplit aucun formulaire, donc rien n'en
 * arrive jusqu'à cette table. Une demande enregistrée ne porte pas le besoin
 * exprimé ; la déduire de la surface, du délai ou du type de local reviendrait
 * à réintroduire la supposition qu'on vient de retirer du site.
 *
 * Une demande de devis dit donc au plus : la personne envisage peut-être de
 * changer de parquet. Le reste se demande au téléphone.
 */

defined( 'ABSPATH' ) || exit;

class EP_Orientation {

	public const BESOIN_EXPERTISE         = 'expertise';
	public const BESOIN_SELECTION         = 'selection';
	public const BESOIN_APPROVISIONNEMENT = 'approvisionnement';
	/** Données insuffisantes : ni besoin établi, ni orientation. */
	public const BESOIN_INCONNU = 'inconnu';

	/**
	 * Symptômes pour lesquels un remplacement est plausible.
	 * Miroir de `REMPLACEMENT_PLAUSIBLE` (js/config/diagnostic-rules.js).
	 */
	private const REMPLACEMENT_PLAUSIBLE = array( 'deformation', 'degat-des-eaux', 'vieillissement' );

	/** Nom affichable de chaque enseigne. Les URL restent côté site. */
	private const ENSEIGNES = array(
		'premibel'    => 'Premibel',
		'overparquet' => 'Over Parquet',
	);

	/** Enseignes ouvertes à chaque profil, relevé sur leurs sites le 30/09/2026. */
	private const AUDIENCES = array(
		'premibel'    => array( 'particulier', 'professionnel' ),
		'overparquet' => array( 'professionnel' ),
	);

	public static function libelle_besoin( string $besoin ): string {
		$libelles = array(
			self::BESOIN_EXPERTISE         => 'Expertise ou réparation',
			self::BESOIN_SELECTION         => 'Choix d’un nouveau parquet',
			self::BESOIN_APPROVISIONNEMENT => 'Approvisionnement de chantier',
			self::BESOIN_INCONNU           => 'À qualifier',
		);
		return $libelles[ $besoin ] ?? 'À qualifier';
	}

	/**
	 * Lit une demande et rend ce que le site en aurait déduit.
	 *
	 * @return array{besoin:string, destinations:string[], raison:string}
	 */
	public static function pour_lead( array $lead ): array {
		$profil    = (string) ( $lead['customer_type'] ?? '' );
		$problemes = array_filter( explode( ',', (string) ( $lead['problem_type'] ?? '' ) ) );

		/* Un message de contact ne décrit ni problème ni projet : il n'y a rien
		   à qualifier, et le dire vaut mieux que de supposer. */
		if ( ! $problemes && 'devis' !== ( $lead['form_type'] ?? '' ) ) {
			return self::resultat( self::BESOIN_INCONNU, array(), 'Le formulaire de contact ne recueille ni problème ni projet.' );
		}

		$remplacement = (bool) array_intersect( $problemes, self::REMPLACEMENT_PLAUSIBLE );
		if ( ! $remplacement ) {
			return self::resultat(
				self::BESOIN_EXPERTISE,
				array(),
				'Le besoin porte sur la cause du désordre, pas sur l’achat d’un parquet.'
			);
		}

		/* Le seul besoin qu'une demande enregistrée permette d'établir. Voir
		   l'en-tête : l'approvisionnement se dit, il ne se déduit pas. */
		$besoin = self::BESOIN_SELECTION;

		$destinations = array_values(
			array_filter(
				array( 'premibel', 'overparquet' ),
				static function ( $cle ) use ( $profil ) {
					// Profil inconnu : seules les enseignes ouvertes à tous.
					$cible = '' === $profil ? 'particulier' : $profil;
					return in_array( $cible, self::AUDIENCES[ $cle ], true );
				}
			)
		);

		if ( ! $destinations ) {
			return self::resultat( $besoin, array(), 'Aucune enseigne partenaire n’est ouverte à ce profil.' );
		}
		if ( count( $destinations ) > 1 ) {
			return self::resultat( $besoin, $destinations, 'Deux solutions peuvent correspondre à ce projet.' );
		}
		return self::resultat(
			$besoin,
			$destinations,
			'Le projet suppose de choisir un parquet, avec conseil et showroom.'
		);
	}

	/** Noms affichables des enseignes retenues. */
	public static function noms( array $destinations ): array {
		return array_map(
			static fn( $cle ) => self::ENSEIGNES[ $cle ] ?? $cle,
			$destinations
		);
	}

	private static function resultat( string $besoin, array $destinations, string $raison ): array {
		return compact( 'besoin', 'destinations', 'raison' );
	}
}
