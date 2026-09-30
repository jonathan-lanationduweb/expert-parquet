<?php
/**
 * La liste des demandes : une WP_List_Table classique, branchée sur le dépôt.
 *
 * WordPress fournit la pagination, les en-têtes triables, la boîte de
 * recherche et les « vues » par statut. Nous ne fournissons que les données —
 * qui viennent de la table dédiée, jamais de `posts`.
 */

defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'WP_List_Table' ) ) {
	require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

class EP_Liste_Demandes extends WP_List_Table {

	public const PAR_PAGE = 20;

	/** Colonne d'affichage → colonne SQL autorisée au tri. */
	private const TRIS = array(
		'created_at' => 'created_at',
		'status'     => 'status',
		'city'       => 'city',
		'nom'        => 'last_name',
		'form_type'  => 'form_type',
	);

	private array $photos_par_lead = array();

	/** Page d'administration qui affiche cette liste (les liens doivent y revenir). */
	private string $page;

	/**
	 * Type de formulaire imposé par l'écran courant — `contact` ou `devis`.
	 *
	 * Statique, parce que `filtres()` l'est : l'export, qui s'exécute dans une
	 * autre requête, retrouve le type dans l'URL (`ep_form`), que les liens de
	 * cet écran portent déjà. Remis à `null` par l'appelant en fin de rendu :
	 * une propriété statique qui traîne est une source d'erreurs silencieuses.
	 */
	public static ?string $type_impose = null;

	public function __construct( string $page = EP_Admin::PAGE_LISTE ) {
		$this->page = $page;
		parent::__construct( array( 'singular' => 'demande', 'plural' => 'demandes', 'ajax' => false ) );
	}

	/** Nombre total de demandes correspondant aux filtres (après `prepare_items`). */
	public function total(): int {
		return (int) ( $this->_pagination_args['total_items'] ?? 0 );
	}

	/** URL de l'écran courant, éventuellement filtrée. */
	private function url( array $args = array() ): string {
		return EP_Admin::url_page( $this->page, $args );
	}

	/** Filtres actifs, lus dans la requête et nettoyés — les seuls que le dépôt connaît. */
	public static function filtres(): array {
		$lire = static fn( string $k ): string => isset( $_GET[ $k ] ) ? sanitize_text_field( wp_unslash( (string) $_GET[ $k ] ) ) : '';
		return array(
			's'           => $lire( 's' ),
			'status'      => $lire( 'ep_status' ),
			// Le type imposé par l'écran l'emporte sur ce que porte l'URL.
			'form_type'   => self::$type_impose ?? $lire( 'ep_form' ),
			'problem'     => $lire( 'ep_problem' ),
			'month'       => $lire( 'ep_month' ),
			'postal_code' => $lire( 'ep_cp' ),
		);
	}

	public function get_columns(): array {
		return array(
			'created_at' => 'Date',
			'public_id'  => 'Référence',
			'nom'        => 'Nom',
			'form_type'  => 'Type',
			'phone'      => 'Téléphone',
			'email'      => 'E-mail',
			'probleme'   => 'Problème',
			'city'       => 'Ville',
			'status'     => 'Statut',
			'source'     => 'Origine',
		);
	}

	protected function get_sortable_columns(): array {
		return array(
			'created_at' => array( 'created_at', true ),
			'status'     => array( 'status', false ),
			'city'       => array( 'city', false ),
			'nom'        => array( 'nom', false ),
			'form_type'  => array( 'form_type', false ),
		);
	}

	protected function get_views(): array {
		$compte  = EP_Leads_Repository::compter_par_statut( self::$type_impose );
		$courant = self::filtres()['status'];
		$total   = array_sum( array_diff_key( $compte, array( EP_Lead::STATUT_SPAM => 0 ) ) );
		$vues    = array(
			'tous' => sprintf(
				'<a href="%s"%s>Toutes <span class="count">(%d)</span></a>',
				esc_url( $this->url() ),
				'' === $courant ? ' class="current"' : '',
				$total
			),
		);
		foreach ( EP_Lead::statuts() as $cle => $libelle ) {
			if ( empty( $compte[ $cle ] ) ) {
				continue;
			}
			$vues[ $cle ] = sprintf(
				'<a href="%s"%s>%s <span class="count">(%d)</span></a>',
				esc_url( $this->url( array( 'ep_status' => $cle ) ) ),
				$courant === $cle ? ' class="current"' : '',
				esc_html( $libelle ),
				$compte[ $cle ]
			);
		}
		return $vues;
	}

	protected function extra_tablenav( $which ): void {
		if ( 'top' !== $which ) {
			return;
		}
		$f = self::filtres();
		echo '<div class="alignleft actions">';

		/* Sur Contacts et Devis, le type est déjà celui de l'écran : proposer
		   de le changer donnerait un filtre sans effet — ou, pire, un filtre
		   contredit en silence par le préfiltre. */
		if ( null === self::$type_impose ) {
			echo '<label class="screen-reader-text" for="ep_form">Type de demande</label>';
			echo '<select name="ep_form" id="ep_form"><option value="">Tous les types</option>';
			foreach ( array( 'devis' => 'Expertise', 'contact' => 'Contact' ) as $v => $l ) {
				printf( '<option value="%s"%s>%s</option>', esc_attr( $v ), selected( $f['form_type'], $v, false ), esc_html( $l ) );
			}
			echo '</select> ';
		}

		echo '<label class="screen-reader-text" for="ep_problem">Problème constaté</label>';
		echo '<select name="ep_problem" id="ep_problem"><option value="">Tous les problèmes</option>';
		foreach ( EP_Schema::enums()['problemes'] as $v ) {
			printf( '<option value="%s"%s>%s</option>', esc_attr( $v ), selected( $f['problem'], $v, false ), esc_html( EP_Schema::libelle_valeur( 'problemes', $v ) ) );
		}
		echo '</select> ';

		echo '<label class="screen-reader-text" for="ep_month">Mois de réception</label>';
		printf( '<input type="month" id="ep_month" name="ep_month" value="%s"> ', esc_attr( $f['month'] ) );
		echo '<label class="screen-reader-text" for="ep_cp">Code postal</label>';
		printf( '<input type="text" id="ep_cp" name="ep_cp" value="%s" placeholder="Code postal" size="8" inputmode="numeric"> ', esc_attr( $f['postal_code'] ) );
		submit_button( 'Filtrer', '', 'filter_action', false );

		/* L'export part vers admin-post.php, donc dans une requête où le
		   préfiltre de l'écran n'existe plus : le type voyage dans l'URL. */
		printf(
			' <a class="button" href="%s">Exporter en CSV</a>',
			esc_url(
				EP_Admin::url_export(
					array(
						'ep_status'  => $f['status'],
						'ep_form'    => $f['form_type'],
						'ep_problem' => $f['problem'],
						'ep_month'   => $f['month'],
						'ep_cp'      => $f['postal_code'],
						's'          => $f['s'],
					)
				)
			)
		);
		echo '</div>';
	}

	public function prepare_items(): void {
		$this->_column_headers = array( $this->get_columns(), array(), $this->get_sortable_columns(), 'created_at' );

		$tri  = isset( $_GET['orderby'] ) ? sanitize_key( (string) $_GET['orderby'] ) : 'created_at';
		$sens = isset( $_GET['order'] ) && 'asc' === strtolower( (string) $_GET['order'] ) ? 'ASC' : 'DESC';
		$tri  = self::TRIS[ $tri ] ?? 'created_at';

		$page     = $this->get_pagenum();
		$resultat = EP_Leads_Repository::rechercher( self::filtres(), $page, self::PAR_PAGE, $tri, $sens );

		$this->items           = $resultat['items'];
		$this->photos_par_lead = EP_Photos_Repository::compter_pour( array_column( $this->items, 'id' ) );
		$this->set_pagination_args( array( 'total_items' => $resultat['total'], 'per_page' => self::PAR_PAGE ) );
	}

	public function no_items(): void {
		echo 'Aucune demande ne correspond.';
	}

	/** Toutes les cellules passent par esc_html : c'est ici que se joue la protection contre le XSS stocké. */
	protected function column_default( $item, $column_name ): string {
		switch ( $column_name ) {
			case 'created_at':
				return esc_html( mysql2date( 'd/m/Y H\hi', $item['created_at'] ) );
			case 'public_id':
				return sprintf( '<a href="%s"><code>%s</code></a>', esc_url( EP_Admin::url_fiche( $item['public_id'] ) ), esc_html( $item['public_id'] ) );
			case 'nom':
				$photos = $this->photos_par_lead[ $item['id'] ] ?? 0;
				return sprintf(
					'<strong><a href="%s">%s</a></strong>%s<div class="row-actions"><span><a href="%1$s">Ouvrir</a></span></div>',
					esc_url( EP_Admin::url_fiche( $item['public_id'] ) ),
					esc_html( trim( $item['first_name'] . ' ' . $item['last_name'] ) ?: '—' ),
					$photos ? ' <span class="dashicons dashicons-camera" title="' . esc_attr( $photos . ' photographie(s)' ) . '"></span>' : ''
				);
			case 'form_type':
				return esc_html( 'devis' === $item['form_type'] ? 'Expertise' : 'Contact' );
			case 'phone':
				return esc_html( $item['phone'] ?: '—' );
			case 'email':
				return $item['email'] ? '<a href="mailto:' . esc_attr( $item['email'] ) . '">' . esc_html( $item['email'] ) . '</a>' : '—';
			case 'probleme':
				$p = EP_Leads_Repository::valeur( $item, 'probleme' );
				if ( ! $p ) {
					return esc_html( 'contact' === $item['form_type'] ? EP_Schema::libelle_valeur( 'objets_contact', (string) $item['subject'] ) : '—' );
				}
				return esc_html( implode( ', ', array_map( static fn( $v ) => EP_Schema::libelle_valeur( 'problemes', $v ), array_slice( $p, 0, 3 ) ) ) );
			case 'city':
				return esc_html( trim( $item['postal_code'] . ' ' . $item['city'] ) ?: '—' );
			case 'status':
				return EP_Admin::badge_statut( (string) $item['status'] );
			case 'source':
				return esc_html( $item['source_url'] ?: '—' );
		}
		return '';
	}
}
