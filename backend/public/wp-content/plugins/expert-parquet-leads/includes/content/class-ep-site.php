<?php
/**
 * La configuration du site : identité, apparence, navigation, pied de page,
 * référencement. Des options WordPress, validées, exportées dans l'instantané
 * sous `site`, lues par le générateur statique.
 *
 * ---------------------------------------------------------------------------
 * CE QUE WORDPRESS PILOTE, CE QUE LE CODE PROTÈGE
 *
 * WordPress : nom, signature, logotypes, favicon, image sociale, couleur
 * d'accent, entrées du menu (ordre, libellé, visibilité, liens personnalisés),
 * bouton du header, colonnes et liens du pied de page, réseaux sociaux,
 * copyright, réglages SEO globaux.
 *
 * Le code : le gabarit du header et du pied de page, le nombre maximal de
 * colonnes, les destinations métier (le build construit les URL), le jeu
 * d'icônes autorisé, la base canonique, le `noindex` d'environnement que rien
 * ne contourne, la direction artistique.
 *
 * Les VALEURS PAR DÉFAUT reproduisent exactement la V1 validée : un site
 * construit sans rien régler est identique à celui d'avant.
 */

defined( 'ABSPATH' ) || exit;

class EP_Site {

	public const VERSION = 1;

	public const OPT_IDENTITE   = 'ep_site_identite';
	public const OPT_APPARENCE  = 'ep_site_apparence';
	public const OPT_NAVIGATION = 'ep_site_navigation';
	public const OPT_FOOTER     = 'ep_site_footer';
	public const OPT_SEO        = 'ep_site_seo';
	public const OPT_MODIFIE    = 'ep_site_modifie';

	public const MAX_COLONNES    = 4;
	public const MAX_LIENS       = 8;
	public const MAX_PERSONNALISES = 4;

	/* ------------------------------------------------------------ référentiels */

	/** Les pages internes qu'un lien peut viser : slug → chemin public. */
	public static function pages_internes(): array {
		return array(
			'accueil'            => array( 'index.html', 'Accueil' ),
			'problemes'          => array( 'pages/problemes.html', 'Problèmes' ),
			'conseils'           => array( 'pages/conseils.html', 'Conseils' ),
			'diagnostic'         => array( 'pages/diagnostic.html', 'Diagnostic' ),
			'expertise'          => array( 'pages/expertise.html', 'Expertise' ),
			'a-propos'           => array( 'pages/a-propos.html', 'À propos' ),
			'contact'            => array( 'pages/contact.html', 'Contact' ),
			'faq'                => array( 'pages/faq.html', 'FAQ' ),
			'devis'              => array( 'pages/devis.html', 'Demande d’expertise' ),
			'trouver-mon-parquet' => array( 'pages/trouver-mon-parquet.html', 'Trouver mon parquet' ),
			'mentions-legales'   => array( 'pages/mentions-legales.html', 'Mentions légales' ),
		);
	}

	/** Les parcours métier : clé → libellé (le build construit l'URL). */
	public static function parcours(): array {
		return array(
			'moteur'     => 'Trouver mon parquet (moteur)',
			'moteur-pro' => 'Trouver mon parquet, mode professionnel',
			'diagnostic' => 'Pré-diagnostic',
			'expertise'  => 'Demande d’expertise',
		);
	}

	/** Les enseignes partenaires, telles que le site les connaît. */
	public static function partenaires(): array {
		return array(
			'premibel'    => array( 'Premibel', 'selection', '' ),
			'overparquet' => array( 'Over Parquet', 'supply', 'professionnel' ),
		);
	}

	/** Les types de lien et leur libellé. */
	public static function types_lien(): array {
		return array(
			'page'       => 'Page du site',
			'parcours'   => 'Parcours métier',
			'partenaire' => 'Enseigne partenaire',
			'externe'    => 'Lien externe',
			'email'      => 'Adresse e-mail',
			'telephone'  => 'Téléphone',
		);
	}

	/** Les icônes autorisées : clé → libellé. Les dessins vivent dans tools/partials.mjs. */
	public static function icones(): array {
		return array(
			''          => 'Aucune',
			'instagram' => 'Instagram',
			'facebook'  => 'Facebook',
			'linkedin'  => 'LinkedIn',
			'youtube'   => 'YouTube',
			'email'     => 'E-mail',
			'telephone' => 'Téléphone',
			'externe'   => 'Lien externe',
		);
	}

	public static function reseaux(): array {
		return array( 'instagram' => 'Instagram', 'facebook' => 'Facebook', 'linkedin' => 'LinkedIn', 'youtube' => 'YouTube' );
	}

	/* ------------------------------------------------------------ défauts (= V1) */

	public static function defaut_identite(): array {
		return array(
			'nom'           => 'Expert Parquet',
			'baseline'      => 'Comprendre votre besoin parquet, puis aller à la bonne solution.',
			'logo_id'       => 0, // logotype principal (sur fond clair)
			'logo_clair_id' => 0, // variante pour fond sombre
			'logo_sombre_id' => 0, // variante pour fond clair, si différente du principal
			'symbole_id'    => 0,
			'favicon_id'    => 0,
			'og_id'         => 0,
		);
	}

	public static function defaut_apparence(): array {
		return array( 'accent' => '#B04A1E', 'accent_sombre' => '' );
	}

	public static function defaut_navigation(): array {
		return array(
			'entrees' => array(
				array( 'type' => 'metier', 'key' => 'problemes', 'label' => 'Problèmes', 'visible' => true, 'ordre' => 1 ),
				array( 'type' => 'metier', 'key' => 'conseils', 'label' => 'Conseils', 'visible' => true, 'ordre' => 2 ),
				array( 'type' => 'metier', 'key' => 'diagnostic', 'label' => 'Diagnostic', 'visible' => true, 'ordre' => 3 ),
				array( 'type' => 'metier', 'key' => 'expertise', 'label' => 'Expertise', 'visible' => true, 'ordre' => 4 ),
				array( 'type' => 'metier', 'key' => 'a-propos', 'label' => 'À propos', 'visible' => true, 'ordre' => 5 ),
			),
			'cta'     => array( 'label' => 'Trouver mon parquet', 'destination' => 'moteur' ),
		);
	}

	public static function defaut_footer(): array {
		$lien = static fn( string $type, string $libelle, string $destination, int $ordre, array $extra = array() ): array => array_merge(
			array( 'type' => $type, 'libelle' => $libelle, 'destination' => $destination, 'icone' => '', 'nouvel_onglet' => false, 'actif' => true, 'ordre' => $ordre ),
			$extra
		);
		return array(
			'pitch'     => 'Comprendre votre besoin parquet, puis aller à la bonne solution.',
			'copyright' => 'Expert Parquet',
			'colonnes'  => array(
				array( 'titre' => 'Comprendre', 'visible' => true, 'ordre' => 1, 'liens' => array(
					$lien( 'page', 'Diagnostic', 'diagnostic', 1 ),
					$lien( 'page', 'Problèmes', 'problemes', 2 ),
					$lien( 'page', 'Conseils', 'conseils', 3 ),
				) ),
				array( 'titre' => 'Solutions', 'visible' => true, 'ordre' => 2, 'liens' => array(
					$lien( 'page', 'Trouver mon parquet', 'trouver-mon-parquet', 1 ),
					$lien( 'partenaire', 'Choisir son parquet — Premibel', 'premibel', 2 ),
					$lien( 'partenaire', 'Approvisionnement pro — Over Parquet', 'overparquet', 3 ),
					$lien( 'page', 'Expertise', 'expertise', 4 ),
				) ),
				array( 'titre' => 'Informations', 'visible' => true, 'ordre' => 3, 'liens' => array(
					$lien( 'page', 'À propos', 'a-propos', 1 ),
					$lien( 'page', 'Contact', 'contact', 2 ),
				) ),
			),
			'legaux'    => array( $lien( 'page', 'Mentions légales', 'mentions-legales', 1 ) ),
			'reseaux'   => array(),
		);
	}

	public static function defaut_seo(): array {
		return array(
			'nom'                => 'Expert Parquet',
			'suffixe'            => ' | Expert Parquet',
			'titre_defaut'       => 'Expert Parquet',
			'description_defaut' => 'Comprendre un problème de parquet, trouver le parquet adapté et savoir quand une expertise se justifie.',
			'description_site'   => 'Hub d’orientation parquet : comprendre un problème, qualifier un projet, trouver le parquet adapté chez l’enseigne partenaire, et savoir quand une expertise se justifie.',
			'og_id'              => 0,
			'indexation'         => true,
			'organisation_nom'   => 'Expert Parquet',
			'organisation_url'   => 'https://expert-parquet.com',
			'website_jsonld'     => true,
		);
	}

	/* ------------------------------------------------------------ lecture */

	private static function lire( string $option, array $defaut ): array {
		$v = get_option( $option );
		return is_array( $v ) ? array_replace( $defaut, $v ) : $defaut;
	}

	public static function identite(): array {
		return self::lire( self::OPT_IDENTITE, self::defaut_identite() );
	}

	public static function apparence(): array {
		return self::lire( self::OPT_APPARENCE, self::defaut_apparence() );
	}

	public static function navigation(): array {
		$v = get_option( self::OPT_NAVIGATION );
		if ( is_array( $v ) && ! empty( $v['entrees'] ) ) {
			return array_replace( self::defaut_navigation(), $v );
		}
		/* Compatibilité : la navigation du lot précédent (ep_navigation / ep_header_cta). */
		$nav = self::defaut_navigation();
		$anc = get_option( 'ep_navigation' );
		if ( is_array( $anc ) && $anc ) {
			$nav['entrees'] = array_map( static fn( $e ) => array( 'type' => 'metier', 'key' => (string) $e['key'], 'label' => (string) $e['label'], 'visible' => ! empty( $e['visible'] ), 'ordre' => (int) $e['ordre'] ), $anc );
		}
		$cta = get_option( 'ep_header_cta' );
		if ( $cta ) {
			$nav['cta']['label'] = (string) $cta;
		}
		return $nav;
	}

	public static function footer(): array {
		$v = get_option( self::OPT_FOOTER );
		return is_array( $v ) && isset( $v['colonnes'] ) ? array_replace( self::defaut_footer(), $v ) : self::defaut_footer();
	}

	public static function seo(): array {
		return self::lire( self::OPT_SEO, self::defaut_seo() );
	}

	/** Première installation : les valeurs de la V1 deviennent des données. */
	public static function installer(): void {
		if ( (int) get_option( 'ep_site_version', 0 ) >= self::VERSION ) {
			return;
		}
		foreach ( array(
			self::OPT_IDENTITE   => self::identite(),
			self::OPT_APPARENCE  => self::apparence(),
			self::OPT_NAVIGATION => self::navigation(),
			self::OPT_FOOTER     => self::footer(),
			self::OPT_SEO        => self::seo(),
		) as $opt => $val ) {
			if ( ! is_array( get_option( $opt ) ) ) {
				update_option( $opt, $val, true );
			}
		}
		update_option( 'ep_site_version', self::VERSION, true );
	}

	/** Horodatage de la dernière modification de configuration (pour « en attente »). */
	public static function marquer_modifie(): void {
		update_option( self::OPT_MODIFIE, gmdate( 'c' ), false );
	}

	public static function modifie_le(): ?string {
		$v = get_option( self::OPT_MODIFIE );
		return $v ? (string) $v : null;
	}

	/* ------------------------------------------------------------ validation */

	public static function couleur_valide( string $v ): bool {
		return (bool) preg_match( '/^#[0-9a-fA-F]{6}$/', $v );
	}

	public static function url_valide( string $v ): bool {
		return (bool) preg_match( '#^https?://[^\s"<>]+$#i', $v ) && false !== wp_http_validate_url( $v );
	}

	public static function media_valide( int $id ): bool {
		if ( $id <= 0 ) {
			return true;
		}
		$p = get_post( $id );
		return $p && 'attachment' === $p->post_type && str_starts_with( (string) $p->post_mime_type, 'image/' );
	}

	/**
	 * Nettoie et valide un lien ; renvoie null s'il est inutilisable.
	 * `$erreurs` reçoit un message par problème rencontré.
	 */
	public static function nettoyer_lien( array $l, array &$erreurs, bool $avec_icone = true ): ?array {
		$libelle = EP_Champs::texte_propre( (string) ( $l['libelle'] ?? '' ) );
		$type    = sanitize_key( (string) ( $l['type'] ?? 'page' ) );
		$dest    = trim( (string) ( $l['destination'] ?? '' ) );
		if ( '' === $libelle && '' === $dest ) {
			return null; // ligne vide : ignorée
		}
		if ( ! isset( self::types_lien()[ $type ] ) ) {
			$erreurs[] = "Type de lien inconnu pour « $libelle ».";
			return null;
		}
		switch ( $type ) {
			case 'page':
				$dest = sanitize_key( $dest );
				if ( ! isset( self::pages_internes()[ $dest ] ) ) {
					$erreurs[] = "« $libelle » : page interne inconnue.";
					return null;
				}
				break;
			case 'parcours':
				$dest = sanitize_key( $dest );
				if ( ! isset( self::parcours()[ $dest ] ) ) {
					$erreurs[] = "« $libelle » : parcours inconnu.";
					return null;
				}
				break;
			case 'partenaire':
				$dest = sanitize_key( $dest );
				if ( ! isset( self::partenaires()[ $dest ] ) ) {
					$erreurs[] = "« $libelle » : enseigne inconnue.";
					return null;
				}
				break;
			case 'externe':
				$dest = esc_url_raw( $dest );
				if ( ! self::url_valide( $dest ) ) {
					$erreurs[] = "« $libelle » : adresse externe invalide (http:// ou https:// attendu).";
					return null;
				}
				break;
			case 'email':
				$dest = sanitize_email( $dest );
				if ( ! is_email( $dest ) ) {
					$erreurs[] = "« $libelle » : adresse e-mail invalide.";
					return null;
				}
				break;
			case 'telephone':
				$dest = preg_replace( '/[^0-9+ .]/', '', $dest );
				if ( strlen( preg_replace( '/\D/', '', $dest ) ) < 8 ) {
					$erreurs[] = "« $libelle » : numéro de téléphone invalide.";
					return null;
				}
				break;
		}
		if ( '' === $libelle ) {
			$erreurs[] = 'Un lien sans libellé a été ignoré.';
			return null;
		}
		$icone = $avec_icone ? sanitize_key( (string) ( $l['icone'] ?? '' ) ) : '';
		if ( ! isset( self::icones()[ $icone ] ) ) {
			$icone = '';
		}
		return array(
			'type'          => $type,
			'libelle'       => $libelle,
			'destination'   => $dest,
			'icone'         => $icone,
			'nouvel_onglet' => ! empty( $l['nouvel_onglet'] ) && in_array( $type, array( 'externe', 'partenaire' ), true ),
			'actif'         => ! empty( $l['actif'] ),
			'ordre'         => max( 1, min( 99, (int) ( $l['ordre'] ?? 1 ) ) ),
		);
	}

	/* ------------------------------------------------------------ export */

	/**
	 * Un média choisi comme favicon avant que les tailles carrées n'existent
	 * n'en a pas : on les produit à la demande, une fois.
	 */
	public static function assurer_tailles_favicon( int $id ): void {
		if ( $id <= 0 ) {
			return;
		}
		$meta = (array) wp_get_attachment_metadata( $id );
		if ( ! empty( $meta['sizes']['ep-favicon-32'] ) ) {
			return;
		}
		$fichier = get_attached_file( $id );
		if ( ! $fichier || ! is_readable( $fichier ) ) {
			return;
		}
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$neuf = wp_generate_attachment_metadata( $id, $fichier );
		if ( $neuf ) {
			wp_update_attachment_metadata( $id, $neuf );
		}
	}

	/** La section `site` de l'instantané. Les médias sont enregistrés par EP_Export. */
	/**
	 * Le suffixe des titres garde toujours UN espace devant lui (« Titre | Marque »),
	 * quelle que soit la façon dont il a été saisi ou stocké. Vide : pas de suffixe.
	 */
	public static function normaliser_suffixe( string $v ): string {
		$v = trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( $v ) ) );
		return '' === $v ? '' : ' ' . $v;
	}

	public static function exporter(): array {
		$i = self::identite();
		self::assurer_tailles_favicon( (int) $i['favicon_id'] );
		$a = self::apparence();
		$n = self::navigation();
		$f = self::footer();
		$s = self::seo();

		$entrees = array_values( $n['entrees'] );
		usort( $entrees, static fn( $x, $y ) => ( (int) $x['ordre'] <=> (int) $y['ordre'] ) );

		$tri = static function ( array $liste ): array {
			usort( $liste, static fn( $x, $y ) => ( (int) ( $x['ordre'] ?? 0 ) <=> (int) ( $y['ordre'] ?? 0 ) ) );
			return array_values( $liste );
		};
		$colonnes = array();
		foreach ( $tri( $f['colonnes'] ) as $c ) {
			$colonnes[] = array(
				'titre'   => (string) $c['titre'],
				'visible' => ! empty( $c['visible'] ),
				'ordre'   => (int) $c['ordre'],
				'liens'   => $tri( array_values( $c['liens'] ?? array() ) ),
			);
		}

		return array(
			'identity'   => array(
				'nom'        => (string) $i['nom'],
				'baseline'   => (string) $i['baseline'],
				'logo'       => EP_Export::media( (int) $i['logo_id'] ),
				'logoClair'  => EP_Export::media( (int) $i['logo_clair_id'] ),
				'logoSombre' => EP_Export::media( (int) $i['logo_sombre_id'] ),
				'symbole'    => EP_Export::media( (int) $i['symbole_id'] ),
				'favicon'    => EP_Export::media( (int) $i['favicon_id'] ),
				'og'         => EP_Export::media( (int) $i['og_id'] ),
			),
			'appearance' => array(
				'accent'       => self::couleur_valide( (string) $a['accent'] ) ? strtoupper( (string) $a['accent'] ) : '#B04A1E',
				'accentSombre' => self::couleur_valide( (string) $a['accent_sombre'] ) ? strtoupper( (string) $a['accent_sombre'] ) : '',
			),
			'navigation' => array(
				'entrees' => $entrees,
				'cta'     => array( 'label' => (string) $n['cta']['label'], 'destination' => (string) ( $n['cta']['destination'] ?? 'moteur' ) ),
			),
			'footer'     => array(
				'pitch'     => (string) $f['pitch'],
				'copyright' => (string) $f['copyright'],
				'colonnes'  => $colonnes,
				'legaux'    => $tri( array_values( $f['legaux'] ?? array() ) ),
				'reseaux'   => $tri( array_values( $f['reseaux'] ?? array() ) ),
			),
			'seo'        => array(
				'nom'               => (string) $s['nom'],
				'suffixe'           => self::normaliser_suffixe( (string) $s['suffixe'] ),
				'titreDefaut'       => (string) $s['titre_defaut'],
				'descriptionDefaut' => (string) $s['description_defaut'],
				'descriptionSite'   => (string) $s['description_site'],
				'og'                => EP_Export::media( (int) $s['og_id'] ),
				'indexation'        => ! empty( $s['indexation'] ),
				'organisation'      => array( 'nom' => (string) $s['organisation_nom'], 'url' => (string) $s['organisation_url'] ),
				'websiteJsonLd'     => ! empty( $s['website_jsonld'] ),
			),
		);
	}
}
