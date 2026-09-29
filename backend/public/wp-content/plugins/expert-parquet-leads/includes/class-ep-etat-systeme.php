<?php
/**
 * État réel du système, en un seul endroit.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UNE CLASSE À PART
 *
 * Trois écrans posent les mêmes questions — le tableau de bord, la page
 * Emails, la page Réglages. Dupliquer les vérifications, c'est se condamner à
 * ce qu'elles divergent : un écran annoncerait « opérationnel » là où un autre
 * dirait le contraire, et plus personne ne saurait lequel croire.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CETTE CLASSE NE FAIT PAS
 *
 * Elle ne répare rien, ne configure rien, n'écrit rien. Elle CONSTATE.
 *
 * Et elle ne ment pas par optimisme : un courriel non configuré n'est pas une
 * panne — c'est un choix encore à faire — mais ce n'est pas non plus un
 * système opérationnel. D'où trois niveaux et non deux : `ok`, `attente`
 * (volontairement pas encore fait), `ko` (cassé). Une durée de conservation
 * absente reste `attente` : ce n'est pas au code de décider à notre place
 * combien de temps on garde les données de quelqu'un.
 */

defined( 'ABSPATH' ) || exit;

class EP_Etat_Systeme {

	/** Mémorisé : le tableau de bord interroge deux fois les mêmes points. */
	private static ?array $cache = null;

	/**
	 * Tous les points de contrôle.
	 *
	 * @return array<string,array{libelle:string,niveau:string,valeur:string,detail:string}>
	 */
	public static function points(): array {
		if ( null !== self::$cache ) {
			return self::$cache;
		}

		self::$cache = array(
			'api'        => self::api(),
			'base'       => self::base(),
			'photos'     => self::photos(),
			'emails'     => self::emails(),
			'cron'       => self::cron(),
			'mode'       => self::mode(),
		);
		return self::$cache;
	}

	/** Vrai si un point au moins est cassé (niveau `ko`). */
	public static function en_panne(): bool {
		foreach ( self::points() as $p ) {
			if ( 'ko' === $p['niveau'] ) {
				return true;
			}
		}
		return false;
	}

	/* ---------------------------------------------------------------- points */

	/**
	 * L'API : nos routes sont-elles réellement enregistrées ?
	 *
	 * `rest_get_server()` déclenche `rest_api_init`, qui n'a pas lieu dans
	 * l'administration. C'est le seul moyen de répondre autrement qu'en
	 * supposant — et c'est moins coûteux qu'un aller-retour HTTP vers notre
	 * propre serveur, qui, lui, pourrait échouer pour des raisons de réseau
	 * sans que l'extension y soit pour quoi que ce soit.
	 */
	private static function api(): array {
		$routes   = rest_get_server()->get_routes();
		$attendus = array( '/' . EP_REST_NS . '/health', '/' . EP_REST_NS . '/contact', '/' . EP_REST_NS . '/quote' );
		$manque   = array();
		foreach ( $attendus as $r ) {
			if ( ! isset( $routes[ $r ] ) ) {
				$manque[] = $r;
			}
		}
		return $manque
			? self::point( 'API', 'ko', 'Routes manquantes', implode( ', ', $manque ) )
			: self::point( 'API', 'ok', 'Opérationnelle', count( $attendus ) . ' routes publiques enregistrées.' );
	}

	private static function base(): array {
		$tables  = EP_DB::tables_presentes();
		$absentes = array_keys( array_filter( $tables, static fn( $ok ) => ! $ok ) );
		if ( $absentes ) {
			return self::point( 'Base de données', 'ko', 'Tables manquantes', implode( ', ', $absentes ) );
		}
		return self::point(
			'Base de données',
			'ok',
			'Opérationnelle',
			sprintf( '%d tables dédiées, schéma v%d.', count( $tables ), EP_DB::version_installee() )
		);
	}

	/**
	 * Le stockage : présent, accessible en écriture, et surtout HORS de la
	 * racine web. Un dossier privé qui aurait glissé sous `wp-content` serait
	 * une fuite, pas un détail de configuration.
	 */
	private static function photos(): array {
		$dir = EP_Photos::dossier();
		if ( ! is_dir( $dir ) ) {
			return self::point( 'Stockage photos', 'ko', 'Dossier absent', 'Désactivez puis réactivez l’extension pour le recréer.' );
		}
		if ( ! is_writable( $dir ) ) {
			return self::point( 'Stockage photos', 'ko', 'Écriture impossible', 'Les photographies reçues seraient perdues.' );
		}
		$racine = rtrim( str_replace( '\\', '/', ABSPATH ), '/' );
		$prive  = rtrim( str_replace( '\\', '/', $dir ), '/' );
		if ( str_starts_with( $prive . '/', $racine . '/' ) ) {
			return self::point( 'Stockage photos', 'ko', 'Dans la racine web', 'Les fichiers sont exposés : corrigez EP_PRIVATE_DIR.' );
		}
		return self::point( 'Stockage photos', 'ok', 'Opérationnel', 'Fichiers hors de la racine web, servis à une session autorisée.' );
	}

	/**
	 * Les courriels. Aucun SMTP n'est configuré aujourd'hui, et c'est
	 * VOLONTAIRE : les demandes sont enregistrées, les messages partent dans un
	 * journal privé. Ce n'est pas une panne — mais ce n'est pas non plus un
	 * envoi. On le dit dans ces termes.
	 */
	private static function emails(): array {
		if ( EP_Mail::configure() ) {
			return self::point( 'Emails', 'ok', 'Configurés', 'Les notifications et accusés de réception sont expédiés.' );
		}
		return self::point(
			'Emails',
			'attente',
			'Non configurés',
			'Les demandes sont bien enregistrées, mais aucun courriel n’est expédié : les messages sont écrits dans un journal privé.'
		);
	}

	private static function cron(): array {
		$suivant = wp_next_scheduled( EP_Purge::EVENEMENT );
		if ( ! $suivant ) {
			return self::point( 'Cron RGPD', 'ko', 'Non programmé', 'Les indésirables ne sont plus effacés automatiquement.' );
		}
		$quand = sprintf( 'Prochain passage le %s.', wp_date( 'd/m/Y à H\hi', $suivant ) );
		if ( ! EP_Purge::configuree() ) {
			return self::point(
				'Cron RGPD',
				'attente',
				'Programmé',
				$quand . ' Aucune durée de conservation définie : seuls les indésirables de plus de ' . EP_Purge::JOURS_SPAM . ' jours sont effacés.'
			);
		}
		return self::point( 'Cron RGPD', 'ok', 'Programmé', $quand );
	}

	private static function mode(): array {
		$type = wp_get_environment_type();
		$noms = array(
			'local'       => 'LOCAL',
			'development' => 'DÉVELOPPEMENT',
			'staging'     => 'PRÉPRODUCTION',
			'production'  => 'PRODUCTION',
		);
		return self::point(
			'Mode',
			'production' === $type ? 'ok' : 'neutre',
			$noms[ $type ] ?? strtoupper( $type ),
			'production' === $type ? 'Environnement de production.' : 'Environnement de travail : les garde-fous de production ne sont pas tous actifs.'
		);
	}

	/* ------------------------------------------------------------ mise à jour */

	/**
	 * Une mise à jour de WordPress est-elle proposée ? On le SIGNALE, on ne
	 * l'applique pas : mettre à jour le cœur pendant un chantier d'interface
	 * mêlerait deux changements sans rapport.
	 *
	 * Lecture du transient seul, jamais `wp_version_check()` : cette dernière
	 * appelle wordpress.org à chaque affichage.
	 */
    public static function mise_a_jour(): ?string {
		$maj = get_site_transient( 'update_core' );
		if ( ! $maj || empty( $maj->updates ) ) {
			return null;
		}
		foreach ( $maj->updates as $u ) {
			if ( isset( $u->response ) && 'upgrade' === $u->response && ! empty( $u->current ) ) {
				return (string) $u->current;
			}
		}
		return null;
	}

	/* -------------------------------------------------------------- interne */

	private static function point( string $libelle, string $niveau, string $valeur, string $detail = '' ): array {
		return compact( 'libelle', 'niveau', 'valeur', 'detail' );
	}

	/** Pastille lisible : un symbole ET un mot, jamais la couleur seule. */
	public static function symbole( string $niveau ): string {
		switch ( $niveau ) {
			case 'ok':
				return '✓';
			case 'attente':
				return '⚠';
			case 'ko':
				return '✕';
		}
		return '·';
	}
}
