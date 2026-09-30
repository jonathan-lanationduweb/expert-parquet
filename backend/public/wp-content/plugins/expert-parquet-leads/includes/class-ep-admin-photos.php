<?php
/**
 * Écran Photographies — toutes les photographies reçues, les plus récentes
 * d'abord.
 *
 * ---------------------------------------------------------------------------
 * CE N'EST PAS UNE MÉDIATHÈQUE
 *
 * Ces fichiers ne sont pas des médias WordPress et ne doivent pas le devenir :
 * ce sont des photographies de l'intérieur de gens, envoyées pour un
 * diagnostic. Elles vivent hors de la racine web, sans entrée dans `posts`,
 * sans URL publique, sans miniature déposée dans `uploads`. Chaque vignette
 * est servie par `admin-post.php`, qui revérifie la capacité avant de toucher
 * au disque, et l'en-tête interdit toute mise en cache partagée.
 *
 * Il n'y a donc ni glisser-déposer, ni sélection multiple, ni « copier
 * l'URL » : cet écran sert à RETROUVER une photographie et à rejoindre la
 * demande qui la porte.
 */

defined( 'ABSPATH' ) || exit;

class EP_Admin_Photos {

	private const PAR_PAGE = 24;

	public static function rendre(): void {
		$page   = max( 1, isset( $_GET['paged'] ) ? (int) $_GET['paged'] : 1 );
		$bilan  = EP_Photos_Repository::bilan();
		$photos = EP_Photos_Repository::recentes( self::PAR_PAGE, ( $page - 1 ) * self::PAR_PAGE );
		$leads  = EP_Leads_Repository::par_ids( array_column( $photos, 'lead_id' ) );

		echo '<div class="wrap ep-ecran">';
		echo '<h1 class="wp-heading-inline">Photographies</h1><hr class="wp-header-end">';
		EP_Admin::afficher_message();
		printf(
			'<p class="ep-entete__sous-titre">%d photographie(s) conservée(s), %s au total. Fichiers stockés hors de la racine web.</p>',
			$bilan['nombre'],
			esc_html( size_format( $bilan['octets'], 1 ) ?: '0 o' )
		);

		if ( ! $photos ) {
			echo '<div class="ep-carte"><div class="ep-carte__corps"><p class="ep-vide">Aucune photographie reçue pour le moment.</p></div></div></div>';
			return;
		}

		echo '<div class="ep-galerie" data-ep-galerie>';
		foreach ( $photos as $p ) {
			$lead = $leads[ $p['lead_id'] ] ?? null;
			if ( ! $lead ) {
				/* Une photographie sans demande ne devrait pas exister : la
				   cascade d'effacement retire les fichiers en premier. Si une
				   ligne survivait, l'afficher sans contexte serait pire que
				   l'ignorer — le compteur, lui, la voit toujours. */
				continue;
			}
			self::vignette( $p, $lead );
		}
		echo '</div>';

		self::pagination( $page, $bilan['nombre'] );
		echo '</div>';
	}

	private static function vignette( array $photo, array $lead ): void {
		$url = wp_nonce_url(
			admin_url( 'admin-post.php?action=ep_photo&ref=' . rawurlencode( $lead['public_id'] ) . '&photo=' . rawurlencode( $photo['public_id'] ) ),
			'ep_photo_' . $lead['public_id']
		);
		$titre = sprintf(
			'%s — %s, %d × %d pixels',
			EP_Lead::titre( $lead ),
			mysql2date( 'd/m/Y', $photo['created_at'] ),
			(int) $photo['width'],
			(int) $photo['height']
		);

		printf(
			'<figure>'
			. '<a href="%1$s" data-ep-photo data-ep-titre="%2$s" data-ep-alt="%3$s" target="_blank" rel="noopener">'
			. '<img src="%1$s" alt="%3$s" loading="lazy"></a>'
			. '<figcaption>'
			. '<span class="ep-galerie__nom"><strong>%4$s</strong></span>'
			. '%5$s<br>%6$s · %7$d Ko<br>'
			. '<a href="%8$s">Voir la demande</a>'
			. '</figcaption></figure>',
			esc_url( $url ),
			esc_attr( $titre ),
			esc_attr( 'Photographie envoyée avec la demande ' . substr( $lead['public_id'], 0, 8 ) ),
			esc_html( EP_Lead::titre( $lead ) ),
			esc_html( EP_Admin_Tableau_Bord::probleme( $lead ) ),
			esc_html( mysql2date( 'd/m/Y', $photo['created_at'] ) ),
			(int) round( $photo['size_bytes'] / 1024 ),
			esc_url( EP_Admin::url_fiche( $lead['public_id'] ) )
		);
	}

	private static function pagination( int $page, int $total ): void {
		$pages = (int) ceil( $total / self::PAR_PAGE );
		if ( $pages < 2 ) {
			return;
		}
		$liens = paginate_links(
			array(
				'base'      => add_query_arg( 'paged', '%#%' ),
				'format'    => '',
				'current'   => $page,
				'total'     => $pages,
				'prev_text' => '‹ Précédentes',
				'next_text' => 'Suivantes ›',
			)
		);
		if ( $liens ) {
			echo '<div class="tablenav"><div class="tablenav-pages">' . wp_kses_post( $liens ) . '</div></div>';
		}
	}
}
