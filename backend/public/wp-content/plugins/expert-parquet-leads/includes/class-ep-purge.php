<?php
/**
 * Effacement des demandes au terme de leur durée de conservation.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE FICHIER EXISTE
 *
 * La page de confidentialité du site annonce une durée de conservation et
 * écrit que, passé ce délai, « la demande et ses photographies sont supprimées
 * automatiquement ». Sans ce qui suit, cette phrase serait fausse — et une
 * durée annoncée mais jamais appliquée est exactement ce que le RGPD
 * sanctionne. C'est la contrepartie technique d'une promesse publique.
 *
 * ---------------------------------------------------------------------------
 * CE QUI EST EFFACÉ, ET QUAND
 *
 *   - Une demande CLOSE (gagnée, perdue, archivée), `EP_CONSERVATION_MOIS`
 *     mois après sa clôture — `closed_at`, posé par le dépôt à l'entrée dans
 *     un statut clos et effacé à la sortie : rouvrir un dossier arrête le
 *     compte à rebours.
 *   - Une demande INDÉSIRABLE, trente jours après sa dernière modification.
 *
 * Une demande encore ouverte n'est jamais effacée. L'effacement passe par
 * `EP_Lead::effacer()` : fichiers → photographies → notes → événements →
 * demande, dans cet ordre, sans rien laisser d'orphelin.
 *
 * `EP_CONSERVATION_MOIS` vaut 36 en local. La durée de PRODUCTION n'est pas
 * fixée : c'est une décision humaine, et le front refuse d'ailleurs une mise
 * en service sans elle.
 */

defined( 'ABSPATH' ) || exit;

class EP_Purge {

	public const EVENEMENT = 'ep_purge_quotidienne';

	/** Délai avant effacement des indésirables, en jours. */
	public const JOURS_SPAM = 30;

	/**
	 * Il n'y a PAS de durée par défaut. Si `EP_CONSERVATION_MOIS` n'est pas
	 * définie, `mois()` vaut 0 et les dossiers clos ne sont pas effacés — le
	 * back-office l'affiche. Une valeur de repli (36, comme en local) aurait
	 * pu devenir une décision de conservation en production par simple oubli
	 * de configuration ; ce n'est pas au code de trancher cette question.
	 * Les indésirables gardent leur règle propre de trente jours.
	 */
	public const MOIS_DEFAUT = 0;

	public static function init(): void {
		add_action( self::EVENEMENT, array( __CLASS__, 'executer' ) );
		/* Planification vérifiée à chaque chargement, pas seulement à
		   l'activation : une extension déjà active au moment de l'ajout de la
		   tâche ne l'aurait sinon jamais programmée. */
		add_action( 'init', array( __CLASS__, 'programmer' ) );
	}

	public static function programmer(): void {
		if ( ! wp_next_scheduled( self::EVENEMENT ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::EVENEMENT );
		}
	}

	public static function deprogrammer(): void {
		$suivant = wp_next_scheduled( self::EVENEMENT );
		if ( $suivant ) {
			wp_unschedule_event( $suivant, self::EVENEMENT );
		}
	}

	/** Durée de conservation en mois, ou 0 si elle n'est pas configurée. */
	public static function mois(): int {
		$mois = defined( 'EP_CONSERVATION_MOIS' ) ? (int) EP_CONSERVATION_MOIS : self::MOIS_DEFAUT;
		return max( 0, $mois );
	}

	public static function configuree(): bool {
		return self::mois() > 0;
	}

	/** Passage quotidien. Retourne le nombre de demandes effacées. */
	public static function executer(): int {
		$efface = 0;

		if ( self::configuree() ) {
			$limite_clos = gmdate( 'Y-m-d H:i:s', strtotime( current_time( 'mysql' ) . ' -' . self::mois() . ' months' ) );
			foreach ( EP_Leads_Repository::a_purger( EP_Lead::STATUTS_CLOS, 'closed_at', $limite_clos ) as $id ) {
				if ( EP_Lead::effacer( $id, 'conservation_' . self::mois() . '_mois' ) ) {
					++$efface;
				}
			}
		}

		$limite_spam = gmdate( 'Y-m-d H:i:s', strtotime( current_time( 'mysql' ) . ' -' . self::JOURS_SPAM . ' days' ) );
		foreach ( EP_Leads_Repository::a_purger( array( EP_Lead::STATUT_SPAM ), 'updated_at', $limite_spam ) as $id ) {
			if ( EP_Lead::effacer( $id, 'indesirable_' . self::JOURS_SPAM . '_jours' ) ) {
				++$efface;
			}
		}

		if ( $efface ) {
			update_option( 'ep_derniere_purge', current_time( 'mysql' ), false );
		}
		return $efface;
	}
}
