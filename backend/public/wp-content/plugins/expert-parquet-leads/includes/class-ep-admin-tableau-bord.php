<?php
/**
 * Tableau de bord Expert Parquet — la page d'accueil du back-office.
 *
 * ---------------------------------------------------------------------------
 * CE QU'IL MONTRE
 *
 * Ce qu'on regarde en arrivant le matin : combien de demandes attendent une
 * action, lesquelles viennent d'arriver, et si le système va bien. Rien
 * d'autre. Un tableau de bord qui affiche tout n'aide à rien.
 *
 * ---------------------------------------------------------------------------
 * CHAQUE NOMBRE VIENT DE LA BASE
 *
 * Aucun chiffre n'est estimé, arrondi ni inventé. Les compteurs sortent d'UNE
 * requête groupée (`EP_Leads_Repository::statistiques()`), pas d'un COUNT par
 * carte : sept indicateurs ne doivent pas coûter sept allers-retours.
 *
 * Les quatre premiers indicateurs forment une PARTITION des statuts réels —
 * chaque demande est comptée une fois et une seule, les indésirables mis à
 * part. Le bloc « À traiter » plus bas est, lui, une union assumée (nouvelles
 * + à contacter) : c'est une file de travail, pas un cinquième compteur.
 */

defined( 'ABSPATH' ) || exit;

class EP_Admin_Tableau_Bord {

	/** Statuts en cours de traitement, dans l'ordre du parcours commercial. */
	private const EN_COURS = array( 'contacted', 'qualified', 'quote' );

	/** Statuts qui appellent une action immédiate. */
	private const A_TRAITER = array( 'new', 'to_contact' );

	public static function rendre(): void {
		$stats   = EP_Leads_Repository::statistiques();
		$par     = $stats['par_statut'];
		$semaine = EP_Leads_Repository::compter_depuis( gmdate( 'Y-m-d H:i:s', current_time( 'timestamp' ) - 7 * DAY_IN_SECONDS ) );

		$dernieres = EP_Leads_Repository::recentes( 8 );
		$a_traiter = EP_Leads_Repository::recentes( 5, self::A_TRAITER );
		$photos    = EP_Photos_Repository::compter_pour(
			array_merge( array_column( $dernieres, 'id' ), array_column( $a_traiter, 'id' ) )
		);

		$somme = static fn( array $cles ): int => array_sum( array_map( static fn( $c ) => $par[ $c ] ?? 0, $cles ) );

		echo '<div class="wrap ep-ecran">';
		echo '<h1 class="wp-heading-inline">Expert Parquet</h1><hr class="wp-header-end">';
		EP_Admin::afficher_message();
		printf(
			'<p class="ep-entete__sous-titre">%s au total dans le back-office.</p>',
			esc_html( self::pluriel( $stats['total'], 'demande', 'demandes' ) )
		);

		/* --------------------------------------------------------- indicateurs */

		echo '<div class="ep-chiffres">';
		self::chiffre( 'Nouvelles', $par['new'] ?? 0, EP_Admin::url_liste( array( 'ep_status' => 'new' ) ), 'Voir', ( $par['new'] ?? 0 ) > 0 );
		self::chiffre( 'À contacter', $par['to_contact'] ?? 0, EP_Admin::url_liste( array( 'ep_status' => 'to_contact' ) ), 'Voir', ( $par['to_contact'] ?? 0 ) > 0 );
		/* Ces deux cartes agrègent plusieurs statuts ; le lien, lui, n'en ouvre
		   qu'un. L'intitulé le dit, plutôt que de laisser croire que la liste
		   affichera les 334. Le détail complet est dans les onglets de la
		   liste, qui comptent statut par statut. */
		self::chiffre( 'En cours', $somme( self::EN_COURS ), EP_Admin::url_liste( array( 'ep_status' => 'contacted' ) ), 'Voir les contactées' );
		self::chiffre( 'Terminées', $somme( EP_Lead::STATUTS_CLOS ), EP_Admin::url_liste( array( 'ep_status' => 'won' ) ), 'Voir les gagnées' );
		echo '</div>';

		echo '<div class="ep-chiffres">';
		self::chiffre( 'Contacts', $stats['par_type']['contact'] ?? 0, EP_Admin::url_page( EP_Admin::PAGE_CONTACTS ), 'Voir les contacts' );
		self::chiffre( 'Demandes de devis', $stats['par_type']['devis'] ?? 0, EP_Admin::url_page( EP_Admin::PAGE_DEVIS ), 'Voir les devis' );
		self::chiffre( '7 derniers jours', $semaine, EP_Admin::url_liste(), 'Toutes les demandes' );
		echo '</div>';

		/* --------------------------------------------- qualification commerciale

		   Ces deux nombres sortent de `customer_type`, qui existe depuis le
		   schéma v3 : ils comptent des demandes réellement reçues. On ne
		   compte PAS les orientations vers un partenaire — aucun clic n'est
		   enregistré, et un compteur inventé serait pire qu'une absence. */
		$profils = EP_Leads_Repository::compter_par_profil();
		echo '<div class="ep-chiffres">';
		self::chiffre( 'Leads particuliers', $profils['particulier'], EP_Admin::url_liste( array( 'orderby' => 'profil', 'order' => 'asc' ) ), 'Voir' );
		self::chiffre( 'Leads professionnels', $profils['professionnel'], EP_Admin::url_liste( array( 'orderby' => 'profil', 'order' => 'desc' ) ), 'Voir' );
		self::chiffre( 'Profil non renseigné', $profils['sans_profil'], EP_Admin::url_page( EP_Admin::PAGE_CONTACTS ), 'Surtout des contacts' );
		echo '</div>';

		/* ---------------------------------------------------------- deux colonnes */

		echo '<div class="ep-grille"><div>';
		self::bloc_dernieres( $dernieres, $photos );
		self::bloc_a_traiter( $a_traiter, $photos );
		echo '</div><div>';
		self::bloc_etat();
		self::bloc_actions();
		echo '</div></div></div>';
	}

	/* ------------------------------------------------------------- indicateur */

	private static function chiffre( string $libelle, int $valeur, string $url, string $lien, bool $attention = false ): void {
		printf(
			'<div class="ep-chiffre%1$s"><span class="ep-chiffre__libelle">%2$s</span><span class="ep-chiffre__valeur">%3$d</span>%4$s</div>',
			$attention ? ' ep-chiffre--attention' : '',
			esc_html( $libelle ),
			$valeur,
			$valeur > 0
				? sprintf( '<a class="ep-chiffre__lien" href="%s">%s</a>', esc_url( $url ), esc_html( $lien ) )
				: '<span class="ep-chiffre__lien" aria-disabled="true">—</span>'
		);
	}

	/* ------------------------------------------------------------------ blocs */

	private static function bloc_dernieres( array $demandes, array $photos ): void {
		echo '<div class="ep-carte"><h2 class="ep-carte__titre">Dernières demandes</h2>';
		if ( ! $demandes ) {
			echo '<div class="ep-carte__corps"><p class="ep-vide">Aucune demande pour le moment.</p></div></div>';
			return;
		}
		echo '<div class="ep-carte__corps ep-defilement">';
		self::tableau( $demandes, $photos );
		echo '</div>';
		printf(
			'<div class="ep-carte__pied"><a href="%s">Voir toutes les demandes</a></div></div>',
			esc_url( EP_Admin::url_liste() )
		);
	}

	private static function bloc_a_traiter( array $demandes, array $photos ): void {
		echo '<div class="ep-carte"><h2 class="ep-carte__titre">À traiter</h2><div class="ep-carte__corps">';
		echo '<p class="ep-vide" style="margin-bottom:10px">Demandes nouvelles ou en attente d’un premier contact.</p>';
		if ( ! $demandes ) {
			echo '<p class="ep-vide">Rien en attente.</p></div></div>';
			return;
		}
		echo '<div class="ep-defilement">';
		self::tableau( $demandes, $photos );
		echo '</div></div></div>';
	}

	/** Une ligne = une demande, cliquable en entier par son nom et sa référence. */
	private static function tableau( array $demandes, array $photos ): void {
		echo '<table class="ep-table-compacte"><thead><tr>';
		foreach ( array( 'Date', 'Référence', 'Nom', 'Type', 'Problème', 'Ville', 'Statut' ) as $t ) {
			printf( '<th scope="col">%s</th>', esc_html( $t ) );
		}
		echo '</tr></thead><tbody>';

		foreach ( $demandes as $d ) {
			$url = EP_Admin::url_fiche( $d['public_id'] );
			$nb  = $photos[ $d['id'] ] ?? 0;
			printf(
				'<tr>'
				. '<td class="ep-date">%1$s</td>'
				. '<td><a href="%2$s"><code>%3$s</code></a></td>'
				. '<td><a href="%2$s"><strong>%4$s</strong></a>%5$s</td>'
				. '<td>%6$s</td><td>%7$s</td><td>%8$s</td><td>%9$s</td>'
				. '</tr>',
				esc_html( mysql2date( 'd/m H\hi', $d['created_at'] ) ),
				esc_url( $url ),
				esc_html( substr( $d['public_id'], 0, 8 ) ),
				esc_html( trim( $d['first_name'] . ' ' . $d['last_name'] ) ?: '—' ),
				$nb ? sprintf( ' <span class="dashicons dashicons-camera" title="%s"></span>', esc_attr( self::pluriel( $nb, 'photographie', 'photographies' ) ) ) : '',
				esc_html( 'devis' === $d['form_type'] ? 'Expertise' : 'Contact' ),
				esc_html( self::probleme( $d ) ),
				esc_html( trim( $d['postal_code'] . ' ' . $d['city'] ) ?: '—' ),
				EP_Admin::badge_statut( $d['status'] )
			);
		}
		echo '</tbody></table>';
	}

	private static function bloc_etat(): void {
		echo '<div class="ep-carte"><h2 class="ep-carte__titre">État du système</h2><div class="ep-carte__corps">';
		echo '<dl class="ep-etat">';
		foreach ( EP_Etat_Systeme::points() as $p ) {
			printf(
				'<dt>%s</dt><dd><span class="ep-etat__valeur ep-etat__valeur--%s">%s %s</span></dd>',
				esc_html( $p['libelle'] ),
				esc_attr( $p['niveau'] ),
				esc_html( EP_Etat_Systeme::symbole( $p['niveau'] ) ),
				esc_html( $p['valeur'] )
			);
		}
		echo '</dl>';

		if ( ! EP_Mail::configure() ) {
			printf(
				'<p class="ep-vide" style="margin-top:10px">Les demandes sont bien enregistrées ici, mais aucun courriel n’est expédié. <a href="%s">Voir les emails</a></p>',
				esc_url( EP_Admin::url_page( EP_Admin::PAGE_EMAILS ) )
			);
		}
		$maj = EP_Etat_Systeme::mise_a_jour();
		if ( $maj ) {
			printf(
				'<p class="ep-vide" style="margin-top:10px">WordPress %s est disponible. Mise à jour à planifier à part.</p>',
				esc_html( $maj )
			);
		}
		echo '</div></div>';
	}

	private static function bloc_actions(): void {
		$liens = array(
			array( EP_Admin::url_liste(), 'Voir les demandes' ),
			array( EP_Admin::url_liste( array( 'ep_status' => 'new' ) ), 'Voir les nouvelles demandes' ),
			array( EP_Admin::url_export(), 'Exporter les demandes (CSV)' ),
			array( EP_Admin::url_page( EP_Admin::PAGE_PHOTOS ), 'Voir les photographies' ),
			array( EP_Admin::url_page( EP_Admin::PAGE_EMAILS ), 'Voir les emails' ),
			array( EP_Admin::url_page( EP_Admin::PAGE_REGLAGES ), 'Voir l’état du système' ),
		);
		echo '<div class="ep-carte"><h2 class="ep-carte__titre">Actions rapides</h2><div class="ep-carte__corps"><ul class="ep-actions-rapides">';
		foreach ( $liens as $l ) {
			printf( '<li><a href="%s">%s</a></li>', esc_url( $l[0] ), esc_html( $l[1] ) );
		}
		echo '</ul></div></div>';
	}

	/* ---------------------------------------------------------------- outils */

	/** Problème constaté, ou objet du message pour un contact. */
	public static function probleme( array $lead ): string {
		$p = EP_Leads_Repository::valeur( $lead, 'probleme' );
		if ( ! $p ) {
			return 'contact' === $lead['form_type'] && $lead['subject']
				? EP_Schema::libelle_valeur( 'objets_contact', (string) $lead['subject'] )
				: '—';
		}
		return implode( ', ', array_map( static fn( $v ) => EP_Schema::libelle_valeur( 'problemes', $v ), array_slice( $p, 0, 2 ) ) );
	}

	private static function pluriel( int $n, string $un, string $plusieurs ): string {
		return $n . ' ' . ( $n > 1 ? $plusieurs : $un );
	}
}
