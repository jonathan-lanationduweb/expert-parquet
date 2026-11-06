<?php
/**
 * Les champs métier des contenus éditoriaux : boîtes natives, champs simples.
 *
 * Pas de constructeur, pas d'éditeur maison : des <input>, des <select>, des
 * <textarea>, dans des boîtes WordPress ordinaires. Les listes (symptômes,
 * causes, vérifications) se saisissent une entrée par ligne — c'est ce qu'un
 * rédacteur comprend sans mode d'emploi, et ce qui se relit le mieux.
 *
 * Les URL ne se saisissent JAMAIS : un parcours de sortie se choisit dans une
 * liste fermée, ses paramètres aussi, et c'est le build qui construit le lien.
 */

defined( 'ABSPATH' ) || exit;

class EP_Champs {

	private const NONCE = 'ep_champs';

	public static function init(): void {
		add_action( 'add_meta_boxes', array( __CLASS__, 'boites' ), 10, 2 );
		add_action( 'save_post', array( __CLASS__, 'enregistrer' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
		add_filter( 'manage_' . EP_Contenu::CPT_CONSEIL . '_posts_columns', array( __CLASS__, 'colonnes_conseil' ) );
		add_action( 'manage_' . EP_Contenu::CPT_CONSEIL . '_posts_custom_column', array( __CLASS__, 'colonne_conseil' ), 10, 2 );
		add_filter( 'manage_' . EP_Contenu::CPT_FAQ . '_posts_columns', array( __CLASS__, 'colonnes_faq' ) );
		add_action( 'manage_' . EP_Contenu::CPT_FAQ . '_posts_custom_column', array( __CLASS__, 'colonne_faq' ), 10, 2 );
		add_filter( 'manage_' . EP_Contenu::CPT_PROBLEME . '_posts_columns', array( __CLASS__, 'colonnes_probleme' ) );
		add_action( 'manage_' . EP_Contenu::CPT_PROBLEME . '_posts_custom_column', array( __CLASS__, 'colonne_probleme' ), 10, 2 );
		add_action( 'pre_get_posts', array( __CLASS__, 'ordre_liste_faq' ) );
	}

	public static function assets( string $hook ): void {
		if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}
		$ecran = get_current_screen();
		if ( ! $ecran || ! in_array( $ecran->post_type, array_merge( EP_Contenu::TYPES, array( 'page' ) ), true ) ) {
			return;
		}
		wp_enqueue_media();
		$base = plugins_url( 'assets/', EP_PLUGIN_FILE );
		wp_enqueue_style( 'ep-admin-contenu', $base . 'admin-contenu.css', array(), (string) filemtime( EP_PLUGIN_DIR . 'assets/admin-contenu.css' ) );
		wp_enqueue_script( 'ep-admin-contenu', $base . 'admin-contenu.js', array(), (string) filemtime( EP_PLUGIN_DIR . 'assets/admin-contenu.js' ), true );
	}

	/* ------------------------------------------------------------ boîtes */

	public static function boites( string $type, WP_Post $post ): void {
		switch ( $type ) {
			case EP_Contenu::CPT_CONSEIL:
				add_meta_box( 'ep-conseil-classement', 'Classement', array( __CLASS__, 'boite_classement_conseil' ), $type, 'side', 'high' );
				add_meta_box( 'ep-conseil-texte', 'Présentation', array( __CLASS__, 'boite_presentation_conseil' ), $type, 'normal', 'high' );
				add_meta_box( 'ep-sortie', 'Parcours de sortie', array( __CLASS__, 'boite_sortie' ), $type, 'normal', 'default' );
				add_meta_box( 'ep-associes', 'Contenus associés', array( __CLASS__, 'boite_associes' ), $type, 'normal', 'default' );
				add_meta_box( 'ep-faq-liees', 'Questions fréquentes liées', array( __CLASS__, 'boite_faq_liees' ), $type, 'normal', 'default' );
				add_meta_box( 'ep-seo', 'Référencement', array( __CLASS__, 'boite_seo' ), $type, 'normal', 'low' );
				break;
			case EP_Contenu::CPT_PROBLEME:
				add_meta_box( 'ep-probleme-classement', 'Classement', array( __CLASS__, 'boite_classement_probleme' ), $type, 'side', 'high' );
				add_meta_box( 'ep-probleme-presentation', 'Présentation', array( __CLASS__, 'boite_presentation_probleme' ), $type, 'normal', 'high' );
				add_meta_box( 'ep-probleme-structure', 'Structure de la page', array( __CLASS__, 'boite_structure_probleme' ), $type, 'normal', 'high' );
				add_meta_box( 'ep-sortie', 'Parcours de sortie', array( __CLASS__, 'boite_sortie' ), $type, 'normal', 'default' );
				add_meta_box( 'ep-associes', 'Contenus associés', array( __CLASS__, 'boite_associes' ), $type, 'normal', 'default' );
				add_meta_box( 'ep-faq-liees', 'Questions fréquentes liées', array( __CLASS__, 'boite_faq_liees' ), $type, 'normal', 'default' );
				add_meta_box( 'ep-seo', 'Référencement', array( __CLASS__, 'boite_seo' ), $type, 'normal', 'low' );
				break;
			case EP_Contenu::CPT_FAQ:
				add_meta_box( 'ep-faq-groupe', 'Groupe', array( __CLASS__, 'boite_groupe_faq' ), $type, 'side', 'high' );
				break;
			case 'page':
				if ( in_array( $post->post_name, EP_Contenu::PAGES, true ) || 'auto-draft' === $post->post_status ) {
					add_meta_box( 'ep-page-champs', 'Champs de la page', array( __CLASS__, 'boite_page' ), $type, 'normal', 'high' );
					add_meta_box( 'ep-seo', 'Référencement', array( __CLASS__, 'boite_seo' ), $type, 'normal', 'low' );
				}
				break;
		}
	}

	/* ------------------------------------------------------------ rendu */

	private static function nonce(): void {
		wp_nonce_field( self::NONCE, self::NONCE . '_nonce' );
	}

	private static function meta( int $id, string $cle, $defaut = '' ) {
		$v = get_post_meta( $id, $cle, true );
		return ( '' === $v || null === $v || array() === $v ) ? $defaut : $v;
	}

	private static function texte( string $nom, string $libelle, string $valeur, string $aide = '', int $max = 0 ): void {
		printf(
			'<p class="ep-champ"><label for="%1$s">%2$s</label><input type="text" id="%1$s" name="%1$s" value="%3$s" class="widefat"%5$s>%4$s</p>',
			esc_attr( $nom ),
			esc_html( $libelle ),
			esc_attr( $valeur ),
			$aide ? '<span class="description">' . wp_kses_post( $aide ) . '</span>' : '',
			$max ? ' data-ep-compteur="' . $max . '"' : ''
		);
	}

	private static function zone( string $nom, string $libelle, string $valeur, string $aide = '', int $lignes = 3 ): void {
		printf(
			'<p class="ep-champ"><label for="%1$s">%2$s</label><textarea id="%1$s" name="%1$s" rows="%5$d" class="widefat">%3$s</textarea>%4$s</p>',
			esc_attr( $nom ),
			esc_html( $libelle ),
			esc_textarea( $valeur ),
			$aide ? '<span class="description">' . wp_kses_post( $aide ) . '</span>' : '',
			$lignes
		);
	}

	private static function liste( string $nom, string $libelle, array $valeurs, string $aide ): void {
		self::zone( $nom, $libelle, implode( "\n", $valeurs ), $aide, max( 3, count( $valeurs ) + 1 ) );
	}

	private static function choix( string $nom, string $libelle, array $options, string $valeur, string $aide = '', bool $vide = false ): void {
		$h = sprintf( '<p class="ep-champ"><label for="%1$s">%2$s</label><select id="%1$s" name="%1$s">', esc_attr( $nom ), esc_html( $libelle ) );
		if ( $vide ) {
			$h .= '<option value="">—</option>';
		}
		foreach ( $options as $cle => $lib ) {
			$h .= sprintf( '<option value="%s"%s>%s</option>', esc_attr( (string) $cle ), selected( (string) $cle, $valeur, false ), esc_html( $lib ) );
		}
		$h .= '</select>' . ( $aide ? '<span class="description">' . esc_html( $aide ) . '</span>' : '' ) . '</p>';
		echo $h; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- composé ci-dessus.
	}

	private static function case( string $nom, string $libelle, bool $coche, string $aide = '' ): void {
		printf(
			'<p class="ep-champ ep-champ--case"><label><input type="checkbox" name="%1$s" value="1"%3$s> %2$s</label>%4$s</p>',
			esc_attr( $nom ),
			esc_html( $libelle ),
			checked( $coche, true, false ),
			$aide ? '<span class="description">' . esc_html( $aide ) . '</span>' : ''
		);
	}

	private static function image( string $nom, string $libelle, int $id, string $aide = '' ): void {
		$apercu = $id ? wp_get_attachment_image( $id, 'thumbnail', false, array( 'class' => 'ep-image__apercu' ) ) : '';
		printf(
			'<div class="ep-champ ep-image" data-ep-image><span class="ep-champ__libelle">%2$s</span><div class="ep-image__zone">%3$s</div>'
			. '<input type="hidden" name="%1$s" value="%4$d" data-ep-image-id>'
			. '<button type="button" class="button" data-ep-image-choisir>Choisir dans la médiathèque</button> '
			. '<button type="button" class="button-link-delete" data-ep-image-retirer%5$s>Retirer</button>%6$s</div>',
			esc_attr( $nom ),
			esc_html( $libelle ),
			$apercu,
			$id,
			$id ? '' : ' hidden',
			$aide ? '<span class="description">' . esc_html( $aide ) . '</span>' : ''
		);
	}

	/* ---------------------------------------------------- conseil */

	public static function boite_classement_conseil( WP_Post $post ): void {
		self::nonce();
		self::choix( 'ep_format', 'Format', EP_Contenu::formats(), (string) self::meta( $post->ID, 'ep_format', 'article' ), 'Un article vit dans /articles/, un guide dans /pages/conseils/.' );
		self::theme( $post );
		self::texte( 'ep_reading_time', 'Temps de lecture', (string) self::meta( $post->ID, 'ep_reading_time' ), 'Laisser vide : calculé automatiquement d’après le texte (ex. « 6 min »).' );
		echo '<hr>';
		self::case( 'ep_featured', 'Mettre en avant sur l’accueil', (bool) self::meta( $post->ID, 'ep_featured', false ), 'Trois conseils au plus sont affichés, dans l’ordre ci-dessous.' );
		self::texte( 'ep_featured_order', 'Ordre de mise en avant', (string) self::meta( $post->ID, 'ep_featured_order', '0' ), '1 = premier.' );
	}

	private static function theme( WP_Post $post ): void {
		$termes  = get_terms( array( 'taxonomy' => EP_Contenu::TAX_THEME, 'hide_empty' => false, 'meta_key' => 'ep_ordre', 'orderby' => 'meta_value_num', 'order' => 'ASC' ) );
		$actuels = wp_get_object_terms( $post->ID, EP_Contenu::TAX_THEME, array( 'fields' => 'ids' ) );
		$actuel  = is_array( $actuels ) && $actuels ? (int) $actuels[0] : 0;
		echo '<fieldset class="ep-champ"><legend class="ep-champ__libelle">Thème</legend>';
		if ( is_wp_error( $termes ) || ! $termes ) {
			echo '<p class="description">Aucun thème. Créez-en dans Administration → Thèmes.</p>';
		}
		foreach ( (array) $termes as $t ) {
			printf( '<label class="ep-radio"><input type="radio" name="ep_theme" value="%d"%s> %s</label>', $t->term_id, checked( $t->term_id, $actuel, false ), esc_html( $t->name ) );
		}
		echo '</fieldset>';
	}

	public static function boite_presentation_conseil( WP_Post $post ): void {
		self::zone( 'ep_standfirst', 'Chapô', (string) self::meta( $post->ID, 'ep_standfirst' ), 'Articles : sous le titre. Guides : premier paragraphe du texte.', 3 );
		self::zone( 'ep_lead', 'Introduction de l’en-tête (guides)', (string) self::meta( $post->ID, 'ep_lead' ), 'Guides seulement : le texte sous le titre, sur l’image d’en-tête.', 2 );
		self::texte( 'ep_titre_court', 'Titre court', (string) self::meta( $post->ID, 'ep_titre_court' ), 'Guides : fil d’Ariane et balise &lt;title&gt; si aucun titre SEO. Vide = titre du conseil.' );
		self::texte( 'ep_label_court', 'Libellé court', (string) self::meta( $post->ID, 'ep_label_court' ), 'Guides : nom de la carte sur la page Conseils (ex. « Entretien »).' );
		echo '<p class="description">L’<strong>extrait</strong> (boîte « Extrait » ci-dessous) sert de résumé dans les cartes et les listes. L’<strong>image mise en avant</strong> est l’image de couverture.</p>';
	}

	/* ---------------------------------------------------- problème */

	public static function boite_classement_probleme( WP_Post $post ): void {
		self::nonce();
		self::choix( 'ep_diagnostic', 'Problème du pré-diagnostic associé', EP_Contenu::problemes_diagnostic(), (string) self::meta( $post->ID, 'ep_diagnostic' ), 'La clé du pré-diagnostic qui mène à cette page.', true );
		self::case( 'ep_remplacement', 'Remplacement plausible', (bool) self::meta( $post->ID, 'ep_remplacement', false ), 'Avec le parcours « moteur », affiche l’encart « Trouver un parquet adapté ».' );
		echo '<hr>';
		self::case( 'ep_featured', 'Mettre en avant sur l’accueil', (bool) self::meta( $post->ID, 'ep_featured', false ), 'Quatre problèmes au plus, dans l’ordre ci-dessous.' );
		self::texte( 'ep_featured_order', 'Ordre de mise en avant', (string) self::meta( $post->ID, 'ep_featured_order', '0' ), '1 = premier.' );
	}

	public static function boite_presentation_probleme( WP_Post $post ): void {
		self::texte( 'ep_titre_court', 'Titre court', (string) self::meta( $post->ID, 'ep_titre_court' ), 'Fil d’Ariane et balise &lt;title&gt; (ex. « Parquet qui grince »).' );
		self::texte( 'ep_label_court', 'Libellé court', (string) self::meta( $post->ID, 'ep_label_court' ), 'Dans les listes et les tuiles de l’accueil.' );
		self::texte( 'ep_accroche', 'Accroche', (string) self::meta( $post->ID, 'ep_accroche' ), 'Une phrase, sous le libellé dans les listes.' );
		self::zone( 'ep_lead', 'Introduction', (string) self::meta( $post->ID, 'ep_lead' ), 'Le chapô sous le titre de la page.', 3 );
		self::image( 'ep_image_vignette', 'Vignette de liste', (int) self::meta( $post->ID, 'ep_image_vignette', 0 ), 'Vide : l’image mise en avant est utilisée.' );
	}

	public static function boite_structure_probleme( WP_Post $post ): void {
		$causes = (array) self::meta( $post->ID, 'ep_causes', array() );
		$lignes = array_map( static fn( $c ) => ( $c['t'] ?? '' ) . ' | ' . ( $c['d'] ?? '' ), $causes );
		echo '<p class="description">La structure de la page est fixe : symptômes, causes, erreurs, vérifications, expertise. Une entrée par ligne.</p>';
		self::liste( 'ep_symptomes', 'Symptômes observés', (array) self::meta( $post->ID, 'ep_symptomes', array() ), 'Une phrase par ligne.' );
		self::liste( 'ep_causes', 'Causes possibles', $lignes, 'Une cause par ligne, sous la forme <code>Titre | Explication</code>.' );
		self::liste( 'ep_erreurs', 'Erreurs fréquentes', (array) self::meta( $post->ID, 'ep_erreurs', array() ), 'Une erreur par ligne.' );
		self::liste( 'ep_verifications', 'Premières vérifications', (array) self::meta( $post->ID, 'ep_verifications', array() ), 'Une vérification par ligne.' );
		self::zone( 'ep_expertise', 'Quand demander une expertise', (string) self::meta( $post->ID, 'ep_expertise' ), 'Un paragraphe. Les liens vers une page du site s’écrivent depuis la racine : <code>/pages/conseils/entretien.html</code>.', 4 );
		echo '<p class="description">Le <strong>contenu</strong> de l’éditeur ci-dessus est un complément facultatif, affiché après les vérifications.</p>';
	}

	/* ---------------------------------------------------- FAQ */

	public static function boite_groupe_faq( WP_Post $post ): void {
		self::nonce();
		$termes  = get_terms( array( 'taxonomy' => EP_Contenu::TAX_GROUPE, 'hide_empty' => false, 'meta_key' => 'ep_ordre', 'orderby' => 'meta_value_num', 'order' => 'ASC' ) );
		$actuels = wp_get_object_terms( $post->ID, EP_Contenu::TAX_GROUPE, array( 'fields' => 'ids' ) );
		$actuel  = is_array( $actuels ) && $actuels ? (int) $actuels[0] : 0;
		foreach ( (array) $termes as $t ) {
			printf( '<label class="ep-radio"><input type="radio" name="ep_faq_groupe" value="%d"%s> %s</label>', $t->term_id, checked( $t->term_id, $actuel, false ), esc_html( $t->name ) );
		}
		echo '<p class="description">Accueil, Diagnostic et Contact alimentent la section FAQ de leur page. Problèmes, Travaux et Expertise composent la page FAQ. « Contenus » regroupe les questions rattachées à un conseil ou un problème.</p>';
		echo '<p class="description">L’<strong>ordre</strong> se règle dans la boîte « Attributs » (champ Ordre). Une question dépubliée (brouillon) disparaît du site au prochain build.</p>';
	}

	/* ---------------------------------------------------- commun */

	public static function boite_sortie( WP_Post $post ): void {
		$id      = $post->ID;
		$sortie  = (string) self::meta( $id, 'ep_sortie', 'aucun' );
		$params  = (array) self::meta( $id, 'ep_sortie_params', array() );
		$crit    = EP_Contenu::criteres_moteur();
		echo '<div data-ep-sortie>';
		self::choix( 'ep_sortie', 'Vers quoi orienter le lecteur à la fin ?', EP_Contenu::sorties(), $sortie, 'Décide du bandeau de fin de page et de l’encart de sortie. Le site construit le lien.' );
		echo '<div class="ep-sortie__moteur" data-ep-sortie-moteur' . ( 'moteur' === $sortie ? '' : ' hidden' ) . '>';
		echo '<p class="description">Critères transmis au moteur (facultatifs) : il ne reposera pas ces questions.</p><div class="ep-grille-champs">';
		foreach ( $crit as $cle => $options ) {
			self::choix( 'ep_sp_' . $cle, ucfirst( $cle ), $options, (string) ( $params[ $cle ] ?? '' ), '', true );
		}
		echo '</div>';
		self::case( 'ep_sp_chauffage', 'Chauffage au sol', ! empty( $params['chauffage'] ) );
		self::case( 'ep_sp_pro', 'Mode professionnel (approvisionnement de chantier)', ! empty( $params['pro'] ) );
		echo '</div>';
		if ( EP_Contenu::CPT_CONSEIL === $post->post_type ) {
			self::case( 'ep_remplacement', 'Afficher l’encart de sortie à la fin du texte', (bool) self::meta( $id, 'ep_remplacement', false ), 'Avec le parcours « moteur » : « Trouver un parquet adapté » juste après l’article.' );
		}
		echo '<div data-ep-sortie-encart' . ( 'moteur' === $sortie ? '' : ' hidden' ) . '>';
		self::texte( 'ep_sortie_titre', 'Titre de l’encart', (string) self::meta( $id, 'ep_sortie_titre' ), 'Vide : « Votre parquet doit peut-être être remplacé ? »' );
		self::zone( 'ep_sortie_texte', 'Texte de l’encart', (string) self::meta( $id, 'ep_sortie_texte' ), 'Vide : texte standard.', 2 );
		self::texte( 'ep_sortie_action', 'Libellé du bouton', (string) self::meta( $id, 'ep_sortie_action' ), 'Vide : « Trouver un parquet adapté »' );
		self::case( 'ep_sortie_secondaire', 'Proposer aussi « Faire expertiser avant de décider »', (bool) self::meta( $id, 'ep_sortie_secondaire', true ) );
		echo '</div></div>';
	}

	public static function boite_associes( WP_Post $post ): void {
		$related = (array) self::meta( $post->ID, 'ep_related', array() );
		echo '<p class="description">Trois contenus proposés sous « Continuer à comprendre ». Vide : choisis automatiquement d’après les étiquettes communes.</p>';
		for ( $i = 0; $i < 3; $i++ ) {
			self::selecteur_contenu( 'ep_related_' . $i, 'Contenu associé ' . ( $i + 1 ), (string) ( $related[ $i ] ?? '' ), $post->ID );
		}
		if ( EP_Contenu::CPT_CONSEIL === $post->post_type ) {
			$problemes = (array) self::meta( $post->ID, 'ep_problemes', array() );
			echo '<hr><p class="description">Guides seulement : « Symptômes liés » dans la colonne latérale.</p>';
			$options = array();
			foreach ( EP_Contenu::publies( EP_Contenu::CPT_PROBLEME, array( 'publish', 'draft', 'pending', 'future' ) ) as $p ) {
				$options[ $p->post_name ] = $p->post_title;
			}
			for ( $i = 0; $i < 3; $i++ ) {
				self::choix( 'ep_problemes_' . $i, 'Symptôme lié ' . ( $i + 1 ), $options, (string) ( $problemes[ $i ] ?? '' ), '', true );
			}
		}
	}

	private static function selecteur_contenu( string $nom, string $libelle, string $valeur, int $exclu ): void {
		$groupes = array(
			'Conseils'  => EP_Contenu::publies( EP_Contenu::CPT_CONSEIL, array( 'publish', 'draft', 'pending', 'future' ) ),
			'Problèmes' => EP_Contenu::publies( EP_Contenu::CPT_PROBLEME, array( 'publish', 'draft', 'pending', 'future' ) ),
		);
		$h = sprintf( '<p class="ep-champ"><label for="%1$s">%2$s</label><select id="%1$s" name="%1$s"><option value="">—</option>', esc_attr( $nom ), esc_html( $libelle ) );
		foreach ( $groupes as $lib => $posts ) {
			$h .= '<optgroup label="' . esc_attr( $lib ) . '">';
			foreach ( $posts as $p ) {
				if ( $p->ID === $exclu ) {
					continue;
				}
				$h .= sprintf( '<option value="%s"%s>%s</option>', esc_attr( $p->post_name ), selected( $p->post_name, $valeur, false ), esc_html( wp_strip_all_tags( $p->post_title ) ) );
			}
			$h .= '</optgroup>';
		}
		echo $h . '</select></p>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	public static function boite_faq_liees( WP_Post $post ): void {
		$ids = array_map( 'intval', (array) self::meta( $post->ID, 'ep_faq', array() ) );
		$faq = EP_Contenu::publies( EP_Contenu::CPT_FAQ, array( 'publish', 'draft', 'pending', 'future' ) );
		$options = array();
		foreach ( $faq as $q ) {
			$options[ $q->ID ] = wp_strip_all_tags( $q->post_title ) . ( 'publish' === $q->post_status ? '' : ' (brouillon)' );
		}
		printf( '<p class="description">Les questions existent dans <a href="%s">FAQ</a> et se choisissent ici : une question n’est jamais recopiée dans un contenu. <a href="%s">Ajouter une question</a>.</p>', esc_url( admin_url( 'edit.php?post_type=' . EP_Contenu::CPT_FAQ ) ), esc_url( admin_url( 'post-new.php?post_type=' . EP_Contenu::CPT_FAQ ) ) );
		for ( $i = 0; $i < 4; $i++ ) {
			self::choix( 'ep_faq_' . $i, 'Question ' . ( $i + 1 ), $options, (string) ( $ids[ $i ] ?? '' ), '', true );
		}
	}

	public static function boite_seo( WP_Post $post ): void {
		if ( 'page' === $post->post_type || EP_Contenu::CPT_FAQ === $post->post_type ) {
			self::nonce();
		}
		self::texte( 'ep_seo_title', 'Titre SEO', (string) self::meta( $post->ID, 'ep_seo_title' ), 'Balise &lt;title&gt;, sans « | Expert Parquet » (ajouté automatiquement). Vide : le titre. Idéal : moins de 60 caractères.', 60 );
		self::zone( 'ep_seo_description', 'Meta description', (string) self::meta( $post->ID, 'ep_seo_description' ), 'Vide : le chapô ou l’extrait. Idéal : 120 à 158 caractères.', 2 );
		self::image( 'ep_seo_image', 'Image sociale (si différente de l’image mise en avant)', (int) self::meta( $post->ID, 'ep_seo_image', 0 ), '1200 × 630 px. Vide : l’image mise en avant, sinon l’image sociale par défaut du site.' );
		/* Aperçu simple du résultat : titre, adresse, description. */
		$seo    = EP_Site::seo();
		$titre  = (string) self::meta( $post->ID, 'ep_seo_title' ) ?: (string) self::meta( $post->ID, 'ep_titre_court' ) ?: wp_strip_all_tags( $post->post_title );
		$desc   = (string) self::meta( $post->ID, 'ep_seo_description' ) ?: wp_strip_all_tags( (string) self::meta( $post->ID, 'ep_standfirst' ) ?: $post->post_excerpt ?: (string) self::meta( $post->ID, 'ep_lead' ) );
		$chemin = EP_Contenu::chemin( $post ) ?: '';
		printf(
			'<div class="ep-apercu-seo" data-ep-apercu-seo><span class="ep-champ__libelle">Aperçu du résultat</span><div class="ep-apercu-seo__carte"><p class="ep-apercu-seo__titre" data-ep-seo-titre data-suffixe="%s">%s%s</p><p class="ep-apercu-seo__url">https://expert-parquet.com/%s</p><p class="ep-apercu-seo__desc" data-ep-seo-desc>%s</p></div></div>',
			esc_attr( EP_Site::normaliser_suffixe( (string) $seo['suffixe'] ) ),
			esc_html( $titre ),
			esc_html( EP_Site::normaliser_suffixe( (string) $seo['suffixe'] ) ),
			esc_html( 'index.html' === $chemin ? '' : $chemin ),
			esc_html( mb_strimwidth( $desc, 0, 160, '…' ) )
		);
		echo '<p class="description">L’adresse de la page vient du permalien (slug) : ne le changez pas après publication sans raison.</p>';
	}

	/* ---------------------------------------------------- pages */

	/** Les champs de chaque page à gabarit. Le gabarit est dans le code (tools/content). */
	public static function champs_page( string $slug ): array {
		$hero = array(
			array( 'kicker', 'Surtitre', 'text' ),
			array( 'fil_ariane', 'Libellé dans le fil d’Ariane', 'text' ),
			array( 'lead', 'Introduction (chapô)', 'textarea' ),
			array( 'titre_court', 'Titre court (balise title par défaut)', 'text' ),
		);
		switch ( $slug ) {
			case 'accueil':
				return array(
					'Hero' => array(
						array( 'hero_titre', 'Titre', 'text' ),
						array( 'hero_sous_titre', 'Sous-titre', 'text' ),
						array( 'hero_lead', 'Texte d’accroche', 'textarea' ),
						array( 'hero_cta_principal', 'Bouton principal (→ Trouver mon parquet)', 'text' ),
						array( 'hero_cta_secondaire', 'Bouton secondaire (→ pré-diagnostic)', 'text' ),
					),
					'Bloc « Trouver mon parquet »' => array(
						array( 'moteur_kicker', 'Surtitre', 'text' ),
						array( 'moteur_titre', 'Titre', 'textarea' ),
						array( 'moteur_etape_1', 'Ligne 01', 'text' ),
						array( 'moteur_etape_2', 'Ligne 02', 'text' ),
						array( 'moteur_etape_3', 'Ligne 03', 'text' ),
						array( 'moteur_bouton', 'Bouton', 'text' ),
						array( 'moteur_transparence', 'Texte de transparence Premibel / Over Parquet', 'textarea' ),
					),
					'Problèmes fréquents' => array(
						array( 'problemes_kicker', 'Surtitre', 'text' ),
						array( 'problemes_titre', 'Titre', 'text' ),
						array( 'problemes_texte', 'Texte', 'textarea' ),
						array( 'problemes_lien', 'Lien « voir tout »', 'text' ),
					),
					'Conseils' => array(
						array( 'conseils_kicker', 'Surtitre', 'text' ),
						array( 'conseils_titre', 'Titre', 'text' ),
						array( 'conseils_texte', 'Texte', 'textarea' ),
						array( 'conseils_lien', 'Lien « voir tout »', 'text' ),
					),
					'Expertise' => array(
						array( 'expertise_kicker', 'Surtitre', 'text' ),
						array( 'expertise_titre', 'Titre', 'text' ),
						array( 'expertise_texte', 'Texte', 'textarea' ),
						array( 'expertise_bouton', 'Bouton (→ demande d’expertise)', 'text' ),
						array( 'expertise_lien', 'Lien (→ déroulement)', 'text' ),
					),
					'FAQ' => array(
						array( 'faq_kicker', 'Surtitre', 'text' ),
						array( 'faq_titre', 'Titre', 'text' ),
						array( 'faq_lien', 'Lien « voir toute la FAQ »', 'text' ),
					),
				);
			case 'a-propos':
				return array(
					'En-tête' => $hero,
					'Encart « Ce que nous n’affichons pas »' => array(
						array( 'encart_kicker', 'Surtitre', 'text' ),
						array( 'encart_titre', 'Titre', 'text' ),
						array( 'encart_html', 'Texte (paragraphes HTML)', 'html' ),
					),
				);
			case 'diagnostic':
				return array(
					'En-tête' => $hero,
					'Pré-diagnostic' => array(
						array( 'prediag_kicker', 'Surtitre', 'text' ),
						array( 'prediag_titre', 'Titre', 'text' ),
						array( 'prediag_lead', 'Texte', 'textarea' ),
					),
					'FAQ' => array(
						array( 'faq_kicker', 'Surtitre', 'text' ),
						array( 'faq_titre', 'Titre', 'text' ),
					),
				);
			case 'contact':
				return array(
					'En-tête' => $hero,
					'FAQ' => array(
						array( 'faq_kicker', 'Surtitre', 'text' ),
						array( 'faq_titre', 'Titre', 'text' ),
					),
				);
			case 'expertise':
			case 'conseils':
			case 'problemes':
				return array( 'En-tête' => $hero );
		}
		return array();
	}

	public static function boite_page( WP_Post $post ): void {
		$slug   = $post->post_name;
		$champs = self::champs_page( $slug );
		if ( ! $champs ) {
			printf( '<p class="description">Cette page n’a pas de gabarit dans le site. Les pages administrables sont : %s.</p>', esc_html( implode( ', ', EP_Contenu::PAGES ) ) );
			return;
		}
		$valeurs = (array) self::meta( $post->ID, 'ep_champs', array() );
		$notes   = array(
			'accueil'    => 'La structure du hero et des sections est celle de la V1 : seuls les textes changent ici. Les problèmes et conseils affichés sont ceux marqués « mis en avant ». La FAQ affichée est le groupe « Accueil ». L’image du hero est l’image mise en avant.',
			'a-propos'   => 'Le texte principal est le contenu de l’éditeur ci-dessus ; l’image mise en avant s’affiche à côté.',
			'expertise'  => 'Le texte principal est le contenu de l’éditeur ci-dessus. L’image mise en avant est le fond de l’en-tête. Les étapes de la méthode et l’encart latéral restent dans le gabarit.',
			'diagnostic' => 'Le texte de méthode est le contenu de l’éditeur. Le pré-diagnostic lui-même est une fonction du site. La FAQ affichée est le groupe « Diagnostic ».',
			'contact'    => 'Le formulaire est une fonction du site. La FAQ affichée est le groupe « Contact ».',
			'conseils'   => 'Les cartes de catégories sont les conseils au format « guide » ; la liste par thème vient des thèmes. L’image mise en avant sert d’image de partage.',
			'problemes'  => 'La liste des désordres vient des problèmes publiés.',
		);
		if ( isset( $notes[ $slug ] ) ) {
			echo '<p class="description ep-note">' . esc_html( $notes[ $slug ] ) . '</p>';
		}
		foreach ( $champs as $groupe => $liste ) {
			echo '<h4 class="ep-groupe">' . esc_html( $groupe ) . '</h4>';
			foreach ( $liste as [$cle, $libelle, $type] ) {
				$v = (string) ( $valeurs[ $cle ] ?? '' );
				if ( 'text' === $type ) {
					self::texte( 'ep_champs[' . $cle . ']', $libelle, $v );
				} else {
					self::zone( 'ep_champs[' . $cle . ']', $libelle, $v, 'html' === $type ? 'HTML simple autorisé (paragraphes, gras, liens).' : '', 'html' === $type ? 5 : 3 );
				}
			}
		}
	}

	/* ------------------------------------------------------------ sauvegarde */

	public static function enregistrer( int $id, WP_Post $post ): void {
		if ( ! isset( $_POST[ self::NONCE . '_nonce' ] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( (string) $_POST[ self::NONCE . '_nonce' ] ) ), self::NONCE ) ) {
			return;
		}
		if ( wp_is_post_autosave( $id ) || wp_is_post_revision( $id ) ) {
			return;
		}
		$type = $post->post_type;
		if ( ! in_array( $type, array_merge( EP_Contenu::TYPES, array( 'page' ) ), true ) || ! current_user_can( 'edit_post', $id ) ) {
			return;
		}
		$p = wp_unslash( $_POST ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- vérifié ci-dessus.

		$texte = static fn( string $k ): string => isset( $p[ $k ] ) ? self::texte_propre( (string) $p[ $k ] ) : '';
		$lignes = static fn( string $k ): array => isset( $p[ $k ] ) ? array_values( array_filter( array_map( array( __CLASS__, 'texte_propre' ), preg_split( '/\r\n|\r|\n/', (string) $p[ $k ] ) ), 'strlen' ) ) : array();

		if ( EP_Contenu::CPT_CONSEIL === $type ) {
			$format = isset( EP_Contenu::formats()[ $p['ep_format'] ?? '' ] ) ? $p['ep_format'] : 'article';
			update_post_meta( $id, 'ep_format', $format );
			if ( isset( $p['ep_theme'] ) ) {
				wp_set_object_terms( $id, array( (int) $p['ep_theme'] ), EP_Contenu::TAX_THEME, false );
			}
			foreach ( array( 'ep_standfirst', 'ep_lead', 'ep_titre_court', 'ep_label_court', 'ep_reading_time' ) as $k ) {
				update_post_meta( $id, $k, $texte( $k ) );
			}
			$problemes = array();
			for ( $i = 0; $i < 3; $i++ ) {
				$v = sanitize_title( (string) ( $p[ 'ep_problemes_' . $i ] ?? '' ) );
				if ( $v ) {
					$problemes[] = $v;
				}
			}
			update_post_meta( $id, 'ep_problemes', $problemes );
		}

		if ( EP_Contenu::CPT_PROBLEME === $type ) {
			foreach ( array( 'ep_titre_court', 'ep_label_court', 'ep_accroche', 'ep_lead' ) as $k ) {
				update_post_meta( $id, $k, $texte( $k ) );
			}
			update_post_meta( $id, 'ep_image_vignette', (int) ( $p['ep_image_vignette'] ?? 0 ) );
			$diag = sanitize_key( (string) ( $p['ep_diagnostic'] ?? '' ) );
			update_post_meta( $id, 'ep_diagnostic', isset( EP_Contenu::problemes_diagnostic()[ $diag ] ) ? $diag : '' );
			update_post_meta( $id, 'ep_symptomes', $lignes( 'ep_symptomes' ) );
			update_post_meta( $id, 'ep_erreurs', $lignes( 'ep_erreurs' ) );
			update_post_meta( $id, 'ep_verifications', $lignes( 'ep_verifications' ) );
			$causes = array();
			foreach ( $lignes( 'ep_causes' ) as $l ) {
				$parts    = array_map( 'trim', explode( '|', $l, 2 ) );
				$causes[] = array( 't' => $parts[0], 'd' => $parts[1] ?? '' );
			}
			update_post_meta( $id, 'ep_causes', $causes );
			update_post_meta( $id, 'ep_expertise', self::html_propre( (string) ( $p['ep_expertise'] ?? '' ) ) );
		}

		if ( EP_Contenu::CPT_FAQ === $type && isset( $p['ep_faq_groupe'] ) ) {
			wp_set_object_terms( $id, array( (int) $p['ep_faq_groupe'] ), EP_Contenu::TAX_GROUPE, false );
		}

		if ( in_array( $type, array( EP_Contenu::CPT_CONSEIL, EP_Contenu::CPT_PROBLEME ), true ) ) {
			update_post_meta( $id, 'ep_featured', empty( $p['ep_featured'] ) ? '0' : '1' );
			update_post_meta( $id, 'ep_featured_order', max( 0, (int) ( $p['ep_featured_order'] ?? 0 ) ) );
			update_post_meta( $id, 'ep_remplacement', empty( $p['ep_remplacement'] ) ? '0' : '1' );

			$sortie = isset( EP_Contenu::sorties()[ $p['ep_sortie'] ?? '' ] ) ? $p['ep_sortie'] : 'aucun';
			update_post_meta( $id, 'ep_sortie', $sortie );
			$params = array();
			foreach ( EP_Contenu::criteres_moteur() as $cle => $options ) {
				$v = sanitize_key( (string) ( $p[ 'ep_sp_' . $cle ] ?? '' ) );
				$params[ $cle ] = isset( $options[ $v ] ) ? $v : '';
			}
			$params['chauffage'] = ! empty( $p['ep_sp_chauffage'] );
			$params['pro']       = ! empty( $p['ep_sp_pro'] );
			update_post_meta( $id, 'ep_sortie_params', $params );
			update_post_meta( $id, 'ep_sortie_titre', $texte( 'ep_sortie_titre' ) );
			update_post_meta( $id, 'ep_sortie_texte', $texte( 'ep_sortie_texte' ) );
			update_post_meta( $id, 'ep_sortie_action', $texte( 'ep_sortie_action' ) );
			update_post_meta( $id, 'ep_sortie_secondaire', empty( $p['ep_sortie_secondaire'] ) ? '0' : '1' );

			$related = array();
			for ( $i = 0; $i < 3; $i++ ) {
				$v = sanitize_title( (string) ( $p[ 'ep_related_' . $i ] ?? '' ) );
				if ( $v && ! in_array( $v, $related, true ) ) {
					$related[] = $v;
				}
			}
			update_post_meta( $id, 'ep_related', $related );
			$faq = array();
			for ( $i = 0; $i < 4; $i++ ) {
				$v = (int) ( $p[ 'ep_faq_' . $i ] ?? 0 );
				if ( $v && ! in_array( $v, $faq, true ) ) {
					$faq[] = $v;
				}
			}
			update_post_meta( $id, 'ep_faq', $faq );
		}

		if ( 'page' === $type && isset( $p['ep_champs'] ) && is_array( $p['ep_champs'] ) ) {
			$def   = array();
			foreach ( self::champs_page( $post->post_name ) as $liste ) {
				foreach ( $liste as [$cle, , $t] ) {
					$def[ $cle ] = $t;
				}
			}
			$valeurs = array();
			foreach ( $p['ep_champs'] as $cle => $v ) {
				if ( ! isset( $def[ $cle ] ) ) {
					continue;
				}
				$valeurs[ $cle ] = 'html' === $def[ $cle ] ? self::html_propre( (string) $v ) : self::texte_propre( (string) $v );
			}
			update_post_meta( $id, 'ep_champs', $valeurs );
		}

		if ( isset( $p['ep_seo_title'] ) ) {
			update_post_meta( $id, 'ep_seo_title', $texte( 'ep_seo_title' ) );
			update_post_meta( $id, 'ep_seo_description', $texte( 'ep_seo_description' ) );
			$img = (int) ( $p['ep_seo_image'] ?? 0 );
			update_post_meta( $id, 'ep_seo_image', EP_Site::media_valide( $img ) ? max( 0, $img ) : 0 );
		}
	}

	/**
	 * Texte court : balises retirées, espaces normalisés — mais l'espace
	 * insécable (U+00A0) est conservé, c'est de la typographie française.
	 */
	public static function texte_propre( string $v ): string {
		$v = wp_strip_all_tags( $v );
		$v = preg_replace( '/[\r\n\t ]+/', ' ', $v );
		return trim( (string) $v );
	}

	public static function html_propre( string $v ): string {
		return trim( wp_kses_post( $v ) );
	}

	/* ------------------------------------------------------------ colonnes */

	public static function colonnes_conseil( array $c ): array {
		$out = array();
		foreach ( $c as $k => $v ) {
			$out[ $k ] = $v;
			if ( 'title' === $k ) {
				$out['ep_format'] = 'Format';
				$out['ep_sortie'] = 'Sortie';
				$out['ep_avant']  = 'Accueil';
			}
		}
		unset( $out['date'] );
		$out['date'] = 'Date';
		return $out;
	}

	public static function colonne_conseil( string $col, int $id ): void {
		self::colonne_commune( $col, $id );
		if ( 'ep_format' === $col ) {
			echo esc_html( EP_Contenu::formats()[ get_post_meta( $id, 'ep_format', true ) ?: 'article' ] ?? 'Article' );
		}
	}

	public static function colonnes_probleme( array $c ): array {
		$out = array();
		foreach ( $c as $k => $v ) {
			$out[ $k ] = $v;
			if ( 'title' === $k ) {
				$out['ep_sortie'] = 'Sortie';
				$out['ep_avant']  = 'Accueil';
			}
		}
		return $out;
	}

	public static function colonne_probleme( string $col, int $id ): void {
		self::colonne_commune( $col, $id );
	}

	private static function colonne_commune( string $col, int $id ): void {
		if ( 'ep_sortie' === $col ) {
			echo esc_html( EP_Contenu::sorties()[ get_post_meta( $id, 'ep_sortie', true ) ?: 'aucun' ] ?? '—' );
		}
		if ( 'ep_avant' === $col ) {
			echo get_post_meta( $id, 'ep_featured', true ) ? esc_html( '✓ ' . (int) get_post_meta( $id, 'ep_featured_order', true ) ) : '—';
		}
	}

	public static function colonnes_faq( array $c ): array {
		$out = array();
		foreach ( $c as $k => $v ) {
			if ( 'title' === $k ) {
				$out[ $k ] = 'Question';
				$out['ep_ordre'] = 'Ordre';
				continue;
			}
			$out[ $k ] = $v;
		}
		return $out;
	}

	public static function colonne_faq( string $col, int $id ): void {
		if ( 'ep_ordre' === $col ) {
			echo (int) get_post_field( 'menu_order', $id );
		}
	}

	/** La liste des FAQ se lit dans l'ordre du site : groupe, puis ordre. */
	public static function ordre_liste_faq( WP_Query $q ): void {
		if ( ! is_admin() || ! $q->is_main_query() || EP_Contenu::CPT_FAQ !== $q->get( 'post_type' ) || $q->get( 'orderby' ) ) {
			return;
		}
		$q->set( 'orderby', array( 'menu_order' => 'ASC', 'title' => 'ASC' ) );
	}
}
