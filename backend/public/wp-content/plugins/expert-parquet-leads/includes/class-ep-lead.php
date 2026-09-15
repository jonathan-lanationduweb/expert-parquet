<?php
/**
 * La demande : statuts, capacité, rôle, référence publique, effacement.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CETTE CLASSE N'EST PLUS
 *
 * Jusqu'au schéma 2, une demande était un type de contenu WordPress
 * (`ep_lead`) : une ligne de `posts`, vingt lignes de `postmeta`, des statuts
 * personnalisés et des méta-capacités. Ce stockage a été abandonné au schéma 3
 * pour quatre tables dédiées — voir EP_DB et docs/DATABASE.md. Cette classe ne
 * connaît plus ni `wp_insert_post`, ni `get_post_meta`, ni `register_post_type`.
 *
 * Elle garde ce qui est indépendant du stockage : la définition des statuts,
 * la capacité et le rôle, la génération de la référence publique, et
 * l'effacement complet d'une demande dans le bon ordre.
 *
 * ---------------------------------------------------------------------------
 * STATUTS
 *
 * Valeurs internes courtes et stables, en anglais, jamais affichées : ce sont
 * les libellés qui le sont. `won`, `lost` et `archived` sont les statuts CLOS —
 * c'est à partir de leur date d'entrée (`closed_at`) que court la durée de
 * conservation. `spam` a sa propre règle d'effacement, plus courte.
 */

defined( 'ABSPATH' ) || exit;

class EP_Lead {

	/** Capacité métier : qui peut gérer les demandes peut tout faire dessus. */
	public const CAP = 'ep_gerer_demandes';

	/** Rôle dédié : cette capacité + `read`, rien d'autre. */
	public const ROLE = 'ep_gestionnaire';

	public const STATUT_INITIAL = 'new';
	public const STATUT_SPAM    = 'spam';
	public const STATUTS_CLOS   = array( 'won', 'lost', 'archived' );

	/** Référence publique : 128 bits, base32 minuscule, 26 caractères. */
	public const REFERENCE_MOTIF = '[a-z2-7]{26}';

	/** Statut interne → libellé affiché. */
	public static function statuts(): array {
		return array(
			'new'        => 'Nouvelle',
			'to_contact' => 'À contacter',
			'contacted'  => 'Contactée',
			'qualified'  => 'Qualifiée',
			'quote'      => 'Devis envoyé',
			'won'        => 'Gagnée',
			'lost'       => 'Perdue',
			'archived'   => 'Archivée',
			'spam'       => 'Indésirable',
		);
	}

	public static function libelle_statut( string $statut ): string {
		return self::statuts()[ $statut ] ?? $statut;
	}

	public static function est_clos( string $statut ): bool {
		return in_array( $statut, self::STATUTS_CLOS, true );
	}

	public static function init(): void {
		// Le schéma est vérifié avant tout le reste : les dépôts en dépendent.
		add_action( 'init', array( 'EP_DB', 'verifier' ), 1 );
	}

	/**
	 * Référence publique.
	 *
	 * 16 octets de `random_bytes` — 128 bits, l'entropie d'un UUID v4 sans
	 * ses bits de version — encodés en base32 RFC 4648 minuscule : 26
	 * caractères, uniquement des lettres et des chiffres, sans ambiguïté
	 * majuscule/minuscule, utilisables tels quels dans une URL, un CSV, un
	 * courriel ou au téléphone. L'unicité est de plus vérifiée en base ; à
	 * 128 bits c'est une formalité, mais elle ne coûte qu'une requête.
	 *
	 * Ce n'est PAS un secret : connaître une référence ne donne accès à rien.
	 * Le dépôt de photographies exige un jeton distinct.
	 */
	public static function nouvelle_reference(): string {
		do {
			$ref = self::base32( random_bytes( 16 ) );
		} while ( EP_Leads_Repository::reference_existe( $ref ) );
		return $ref;
	}

	public static function reference_valide( string $ref ): bool {
		return (bool) preg_match( '/^' . self::REFERENCE_MOTIF . '$/', $ref );
	}

	private static function base32( string $octets ): string {
		$alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
		$bits     = '';
		foreach ( str_split( $octets ) as $o ) {
			$bits .= str_pad( decbin( ord( $o ) ), 8, '0', STR_PAD_LEFT );
		}
		$out = '';
		foreach ( str_split( $bits, 5 ) as $morceau ) {
			$out .= $alphabet[ bindec( str_pad( $morceau, 5, '0', STR_PAD_RIGHT ) ) ];
		}
		return $out;
	}

	/** Titre lisible : « Prénom Nom — Ville », pour la liste et les courriels. */
	public static function titre( array $lead ): string {
		$nom   = trim( ( $lead['first_name'] ?? '' ) . ' ' . ( $lead['last_name'] ?? '' ) );
		$ville = $lead['city'] ?? '';
		$t     = trim( $nom . ( $ville ? ' — ' . $ville : '' ) );
		return '' === $t ? 'Demande' : $t;
	}

	/** Donne la capacité aux administrateurs, et crée le rôle dédié. */
	public static function creer_role(): void {
		$admin = get_role( 'administrator' );
		if ( $admin ) {
			$admin->add_cap( self::CAP );
		}
		/* Moindre privilège dès le premier jour : un compte de suivi n'a
		   aucune raison d'atteindre les extensions, les réglages ou les
		   comptes. Le contrôle est direct — page ou action → capacité — sans
		   passer par les méta-capacités d'un type de contenu. */
		if ( ! get_role( self::ROLE ) ) {
			add_role( self::ROLE, 'Gestionnaire de demandes', array( 'read' => true, self::CAP => true ) );
		}
	}

	/**
	 * Effacement complet et définitif d'une demande.
	 *
	 * L'ordre compte : d'abord ce qui est hors base (les fichiers), puis les
	 * tables satellites, puis la demande. Si l'opération s'interrompait en
	 * cours, on aurait au pire une demande sans photographies — jamais des
	 * photographies sans demande, introuvables et donc jamais effacées.
	 *
	 * Rien ne subsiste en base, y compris les événements : conserver
	 * l'historique d'une demande effacée reviendrait à garder une trace de
	 * la personne. La suppression elle-même est consignée dans un journal
	 * privé, avec la référence et le motif — pas la moindre donnée
	 * personnelle.
	 */
	public static function effacer( int $id, string $motif, ?int $user_id = null ): bool {
		$lead = EP_Leads_Repository::par_id( $id );
		if ( ! $lead ) {
			return false;
		}
		$nb_photos = EP_Photos::supprimer_fichiers( $id );
		EP_Photos_Repository::supprimer_pour_lead( $id );
		EP_Notes_Repository::supprimer_pour_lead( $id );
		EP_Events_Repository::supprimer_pour_lead( $id );
		$ok = EP_Leads_Repository::supprimer( $id );

		$journal = rtrim( EP_PRIVATE_DIR, '/\\' ) . '/logs/suppressions.log';
		wp_mkdir_p( dirname( $journal ) );
		file_put_contents(
			$journal,
			sprintf(
				"[%s] lead_deleted reference=%s statut=%s photos=%d motif=%s par=%s\n",
				current_time( 'mysql' ),
				$lead['public_id'],
				$lead['status'],
				$nb_photos,
				$motif,
				$user_id ? 'utilisateur#' . $user_id : 'systeme'
			),
			FILE_APPEND | LOCK_EX
		);
		return $ok;
	}
}
