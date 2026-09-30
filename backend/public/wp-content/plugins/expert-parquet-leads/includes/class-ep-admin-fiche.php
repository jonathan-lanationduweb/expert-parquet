<?php
/**
 * La fiche d'une demande : tout ce qu'on doit voir pour la traiter.
 *
 * ---------------------------------------------------------------------------
 * ORGANISATION
 *
 * Colonne large — ce que la personne a écrit : coordonnées, demande, texte
 * libre, pré-diagnostic, photographies.
 * Colonne étroite — ce que NOUS en faisons : statut, notes, historique, et
 * tout en bas seulement, l'effacement.
 *
 * ---------------------------------------------------------------------------
 * RÈGLES D'AFFICHAGE
 *
 * - Un champ vide n'a pas de ligne. Quinze lignes à « — » ne renseignent sur
 *   rien et noient les trois qui comptent.
 * - Aucun JSON brut. Le pré-diagnostic est rendu avec les mêmes libellés que
 *   ceux lus par le visiteur ; l'historique est rendu en phrases.
 * - Tout ce qui vient de la base passe par `esc_html`/`esc_attr`/`esc_url`.
 *   C'est ici que se joue la protection contre le XSS stocké : une
 *   description piégée ne doit jamais être interprétée dans le navigateur du
 *   gestionnaire.
 */

defined( 'ABSPATH' ) || exit;

class EP_Admin_Fiche {

	/** Champs rendus ailleurs que dans le bloc « Demande ». */
	private const AILLEURS = array( 'prenom', 'nom', 'email', 'telephone', 'code_postal', 'ville', 'message', 'description', 'consentement' );

	public static function rendre(): void {
		$ref  = isset( $_GET['ref'] ) ? sanitize_text_field( wp_unslash( (string) $_GET['ref'] ) ) : '';
		$lead = EP_Leads_Repository::par_reference( $ref );

		echo '<div class="wrap ep-ecran">';
		if ( ! $lead ) {
			printf(
				'<h1>Demande</h1><p>Demande introuvable.</p><p><a href="%s">← Retour aux demandes</a></p></div>',
				esc_url( EP_Admin::url_liste() )
			);
			return;
		}

		self::entete( $lead );
		EP_Admin::afficher_message();

		echo '<div class="ep-grille ep-grille--fiche"><div>';
		self::bloc_orientation( $lead );
		self::bloc_coordonnees( $lead );
		self::bloc_demande( $lead );
		self::bloc_texte( $lead );
		self::bloc_prediagnostic( $lead );
		self::bloc_photos( $lead );
		echo '</div><div>';
		self::bloc_statut( $lead );
		self::bloc_notes( $lead );
		self::bloc_historique( $lead );
		self::bloc_rgpd( $lead );
		echo '</div></div></div>';
	}

	/* ------------------------------------------------------------------ entête */

	private static function entete( array $lead ): void {
		printf(
			'<h1 class="wp-heading-inline">%s</h1><hr class="wp-header-end">',
			esc_html( EP_Lead::titre( $lead ) )
		);
		printf(
			'<div class="ep-fiche-entete">'
			. '<span class="ep-fiche-entete__ref">%s</span>'
			. '<span class="ep-badge ep-badge--type">%s</span>'
			. '%s'
			. '<span class="ep-fiche-entete__date">reçue le %s</span>'
			. '</div>',
			esc_html( $lead['public_id'] ),
			esc_html( 'devis' === $lead['form_type'] ? 'Demande d’expertise' : 'Contact' ),
			EP_Admin::badge_statut( $lead['status'] ),
			esc_html( mysql2date( 'd/m/Y à H\hi', $lead['created_at'] ) )
		);
		printf(
			'<p class="ep-barre-actions">'
			. '<a class="button button-primary" href="#ep-statut">Modifier le statut</a>'
			. '<a class="button" href="#ep-note">Ajouter une note</a>'
			. '<a class="button button-link" href="%s">← Retour aux demandes</a>'
			. '</p>',
			esc_url( EP_Admin::url_liste() )
		);
	}

	/* ------------------------------------------------------------------ blocs */

	/**
	 * Orientation commerciale.
	 *
	 * Ce bloc ne décide rien : il RAPPELLE le profil déclaré par la personne
	 * et vers qui le site l'oriente, pour qu'un gestionnaire qui rappelle sache
	 * à qui il parle. Il n'apparaît pas quand le profil est inconnu — un
	 * message de contact ne le demande pas, et le supposer fausserait le
	 * suivi.
	 *
	 * Le mot « possible » est là pour de bon : le site propose une orientation,
	 * il ne constate pas un achat. Rien ici n'indique qu'un clic a eu lieu —
	 * aucun clic n'est enregistré, et afficher un chiffre qui n'existe pas
	 * serait pire que de n'en afficher aucun.
	 */
	private static function bloc_orientation( array $lead ): void {
		$profil   = (string) ( $lead['customer_type'] ?? '' );
		$decision = EP_Orientation::pour_lead( $lead );

		/* Le bloc n'a de sens que s'il apprend quelque chose : ni profil, ni
		   besoin établi, il ne s'affiche pas. */
		if ( '' === EP_Lead::libelle_profil( $profil ) && EP_Orientation::BESOIN_INCONNU === $decision['besoin'] ) {
			return;
		}

		$lignes   = array();
		$lignes[] = array(
			'Profil déclaré',
			'' !== EP_Lead::libelle_profil( $profil )
				? EP_Admin::badge_profil( $profil )
				: '<span class="ep-etat__valeur ep-etat__valeur--attente">non renseigné</span>',
		);
		$lignes[] = array( 'Besoin détecté', esc_html( EP_Orientation::libelle_besoin( $decision['besoin'] ) ) );

		$noms = EP_Orientation::noms( $decision['destinations'] );
		if ( count( $noms ) > 1 ) {
			$lignes[] = array( 'Orientations possibles', esc_html( implode( ' ou ', $noms ) ) );
		} elseif ( 1 === count( $noms ) ) {
			$lignes[] = array( 'Orientation possible', esc_html( $noms[0] ) );
		} elseif ( EP_Orientation::BESOIN_EXPERTISE === $decision['besoin'] ) {
			$lignes[] = array( 'Orientation commerciale', 'Aucune — expertise uniquement' );
		} else {
			$lignes[] = array( 'Orientation commerciale', '<span class="ep-etat__valeur ep-etat__valeur--attente">à qualifier</span>' );
		}

		$h  = EP_Admin::table_champs( $lignes );
		$h .= '<p class="ep-meta" style="margin-top:12px">' . esc_html( $decision['raison'] ) . '</p>';
		$h .= '<p class="ep-meta">Déduit des réponses de la demande&nbsp;: profil, problème, surface, délai, type de local. C’est une proposition faite sur le site&nbsp;— elle ne préjuge ni d’un clic, ni d’un achat.</p>';

		EP_Admin::carte( 'Orientation', $h );
	}

	private static function bloc_coordonnees( array $lead ): void {
		$lignes = array();

		$nom = trim( $lead['first_name'] . ' ' . $lead['last_name'] );
		if ( '' !== $nom ) {
			$lignes[] = array( $lead['first_name'] ? 'Prénom et nom' : 'Nom', esc_html( $nom ) );
		}
		if ( $lead['email'] ) {
			$lignes[] = array( 'Adresse e-mail', sprintf( '<a href="mailto:%1$s">%1$s</a>', esc_attr( $lead['email'] ) ) );
		}
		if ( $lead['phone'] ) {
			// `tel:` n'accepte pas les espaces ; l'affichage garde la forme saisie.
			$lignes[] = array( 'Téléphone', sprintf( '<a href="tel:%s">%s</a>', esc_attr( preg_replace( '/[^\d+]/', '', $lead['phone'] ) ), esc_html( $lead['phone'] ) ) );
		}
		$ville = trim( $lead['postal_code'] . ' ' . $lead['city'] );
		if ( '' !== $ville ) {
			$lignes[] = array( 'Localisation', esc_html( $ville ) );
		}

		self::carte( 'Coordonnées', $lignes ? self::table( $lignes ) : '<p class="ep-vide">Aucune coordonnée.</p>' );
	}

	/** Les champs métier renseignés, dans l'ordre du formulaire. */
	private static function bloc_demande( array $lead ): void {
		$champs = 'contact' === $lead['form_type'] ? EP_Schema::champs_contact() : EP_Schema::champs_devis();
		$lignes = array();

		foreach ( $champs as $nom => $regle ) {
			if ( in_array( $nom, self::AILLEURS, true ) ) {
				continue;
			}
			$v = EP_Leads_Repository::valeur( $lead, $nom );
			if ( '' === $v || array() === $v ) {
				continue;
			}
			$lignes[] = array( $regle[3], esc_html( EP_Schema::afficher( $regle, $v ) ) );
		}

		self::carte(
			'devis' === $lead['form_type'] ? 'Demande d’expertise' : 'Demande',
			$lignes ? self::table( $lignes ) : '<p class="ep-vide">Aucune précision n’a été donnée.</p>'
		);
	}

	private static function bloc_texte( array $lead ): void {
		$texte = (string) ( 'contact' === $lead['form_type'] ? $lead['message'] : $lead['description'] );
		if ( '' === trim( $texte ) ) {
			return;
		}
		self::carte(
			'contact' === $lead['form_type'] ? 'Message' : 'Description',
			'<p class="ep-texte-long">' . esc_html( $texte ) . '</p>'
		);
	}

	/**
	 * Le pré-diagnostic.
	 *
	 * Ce sont les paramètres d'URL laissés par l'outil en ligne : des réponses,
	 * pas un constat — et le visiteur a pu les corriger ensuite dans le
	 * formulaire. On le dit, et on rend les mêmes libellés qu'il a lus.
	 * Les clés inconnues (suivi de campagne, par exemple) sont affichées
	 * telles quelles plutôt que masquées : mieux vaut une ligne brute qu'une
	 * information escamotée.
	 */
	private static function bloc_prediagnostic( array $lead ): void {
		if ( empty( $lead['diagnostic_context'] ) ) {
			return;
		}
		$ctx = json_decode( (string) $lead['diagnostic_context'], true );
		if ( ! is_array( $ctx ) || ! $ctx ) {
			return;
		}

		$champs = EP_Schema::champs_devis();
		$lignes = array();
		foreach ( $ctx as $cle => $valeur ) {
			$cle    = (string) $cle;
			$regle  = $champs[ $cle ] ?? null;
			$lisible = $regle
				? EP_Schema::afficher( $regle, $valeur )
				: ( is_array( $valeur ) ? implode( ', ', array_map( 'strval', $valeur ) ) : (string) $valeur );
			$lignes[] = array( $regle ? $regle[3] : self::libelle_libre( $cle ), esc_html( $lisible ) );
		}

		self::carte(
			'Pré-diagnostic',
			'<p class="ep-vide" style="margin-bottom:10px">Réponses données au pré-diagnostic en ligne. C’est une orientation, pas un constat : le visiteur a pu les modifier dans le formulaire.</p>'
			. self::table( $lignes )
		);
	}

	/** Clé technique sans correspondance : rendue lisible sans être inventée. */
	private static function libelle_libre( string $cle ): string {
		$connus = array(
			'via'    => 'Arrivé par',
			'debut'  => 'Depuis quand',
			'source' => 'Source',
		);
		return $connus[ $cle ] ?? ucfirst( str_replace( array( '_', '-' ), ' ', $cle ) );
	}

	/**
	 * La galerie.
	 *
	 * Chaque vignette est un lien ordinaire vers `admin-post.php`, protégé par
	 * un nonce ; `EP_Photos::servir()` revérifie la capacité avant même de
	 * toucher au disque. Le script d'aperçu n'est qu'un confort par-dessus :
	 * sans lui, le clic ouvre la photographie dans un onglet.
	 */
	private static function bloc_photos( array $lead ): void {
		$photos = EP_Photos_Repository::pour_lead( $lead['id'] );
		if ( ! $photos ) {
			self::carte( 'Photographies', '<p class="ep-vide">Aucune photographie.</p>' );
			return;
		}

		$h = '<p class="ep-vide" style="margin-bottom:12px">Fichiers stockés hors de la racine web, servis uniquement à une session autorisée.</p>';
		$h .= '<div class="ep-galerie" data-ep-galerie>';
		$i = 0;
		foreach ( $photos as $p ) {
			++$i;
			$url = wp_nonce_url(
				admin_url( 'admin-post.php?action=ep_photo&ref=' . rawurlencode( $lead['public_id'] ) . '&photo=' . rawurlencode( $p['public_id'] ) ),
				'ep_photo_' . $lead['public_id']
			);
			$titre = sprintf( 'Photographie %d sur %d — %d × %d pixels, %d Ko', $i, count( $photos ), (int) $p['width'], (int) $p['height'], (int) round( $p['size_bytes'] / 1024 ) );
			$h    .= sprintf(
				'<figure><a href="%1$s" data-ep-photo data-ep-titre="%2$s" data-ep-alt="%3$s" target="_blank" rel="noopener">'
				. '<img src="%1$s" alt="%3$s" loading="lazy"></a>'
				. '<figcaption>%4$d × %5$d · %6$d Ko%7$s</figcaption></figure>',
				esc_url( $url ),
				esc_attr( $titre ),
				esc_attr( sprintf( 'Photographie %d envoyée avec la demande', $i ) ),
				(int) $p['width'],
				(int) $p['height'],
				(int) round( $p['size_bytes'] / 1024 ),
				$p['original_filename'] ? '<span class="ep-galerie__nom">' . esc_html( $p['original_filename'] ) . '</span>' : ''
			);
		}
		$h .= '</div>';

		/* Empreintes et clés de stockage : utiles le jour d'un doute, inutiles
		   le reste du temps. Repliées, donc, plutôt qu'étalées. */
		$h .= '<details class="ep-technique"><summary>Informations techniques</summary><table class="ep-champs"><tbody>';
		foreach ( $photos as $p ) {
			$h .= sprintf(
				'<tr><th>%s</th><td><code>%s</code><br><span class="ep-meta">%s · empreinte %s…</span></td></tr>',
				esc_html( $p['original_filename'] ?: 'sans nom' ),
				esc_html( $p['stored_filename'] ),
				esc_html( $p['mime_type'] ),
				esc_html( substr( (string) $p['sha256'], 0, 12 ) )
			);
		}
		$h .= '</tbody></table></details>';

		$h .= '<p style="margin:12px 0 0">';
		foreach ( $photos as $j => $p ) {
			$sup = wp_nonce_url(
				admin_url( 'admin-post.php?action=ep_supprimer_photo&ref=' . rawurlencode( $lead['public_id'] ) . '&photo=' . rawurlencode( $p['public_id'] ) ),
				'ep_supprimer_photo_' . $p['public_id']
			);
			$h  .= sprintf(
				'<a class="button button-small" href="%s" onclick="return confirm(\'Supprimer définitivement cette photographie ?\')">Supprimer la photographie %d</a> ',
				esc_url( $sup ),
				$j + 1
			);
		}
		$h .= '</p>';

		self::carte( 'Photographies', $h );
	}

	private static function bloc_statut( array $lead ): void {
		$h  = '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
		$h .= '<input type="hidden" name="action" value="ep_statut">';
		$h .= '<input type="hidden" name="ref" value="' . esc_attr( $lead['public_id'] ) . '">';
		$h .= wp_nonce_field( 'ep_statut_' . $lead['public_id'], '_wpnonce', true, false );
		$h .= '<p><label for="ep_statut"><strong>Statut</strong></label><br><select id="ep_statut" name="ep_statut" style="width:100%">';
		foreach ( EP_Lead::statuts() as $cle => $libelle ) {
			$h .= sprintf( '<option value="%s"%s>%s</option>', esc_attr( $cle ), selected( $lead['status'], $cle, false ), esc_html( $libelle ) );
		}
		$h .= '</select></p>';
		$h .= '<p class="ep-meta">Gagnée, Perdue et Archivée sont des statuts clos : la durée de conservation court à partir de là.</p>';
		$h .= '<p><button class="button button-primary" type="submit">Enregistrer le statut</button></p></form>';

		self::carte( 'Suivi', $h, 'ep-statut' );
	}

	private static function bloc_notes( array $lead ): void {
		$h  = '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
		$h .= '<input type="hidden" name="action" value="ep_note">';
		$h .= '<input type="hidden" name="ref" value="' . esc_attr( $lead['public_id'] ) . '">';
		$h .= wp_nonce_field( 'ep_note_' . $lead['public_id'], '_wpnonce', true, false );
		$h .= '<p><label for="ep_note"><strong>Nouvelle note</strong></label>';
		$h .= '<textarea id="ep_note" name="ep_note" rows="3" style="width:100%" placeholder="Visible uniquement ici." required></textarea></p>';
		$h .= '<p><button class="button" type="submit">Ajouter la note</button></p></form>';

		$notes = EP_Notes_Repository::pour_lead( $lead['id'] );
		if ( ! $notes ) {
			self::carte( 'Notes internes', $h . '<p class="ep-vide">Aucune note.</p>', 'ep-note' );
			return;
		}
		$h .= '<ul class="ep-liste-notes">';
		foreach ( $notes as $n ) {
			$auteur = $n['wp_user_id'] ? get_userdata( $n['wp_user_id'] ) : null;
			$h     .= sprintf(
				'<li><p>%s</p><span class="ep-meta">%s%s</span></li>',
				esc_html( $n['note'] ),
				esc_html( mysql2date( 'd/m/Y à H\hi', $n['created_at'] ) ),
				$auteur ? ' — ' . esc_html( $auteur->display_name ) : ''
			);
		}
		self::carte( 'Notes internes', $h . '</ul>', 'ep-note' );
	}

	/** L'historique, en phrases et dans l'ordre chronologique inverse. */
	private static function bloc_historique( array $lead ): void {
		$events = EP_Events_Repository::pour_lead( $lead['id'] );
		if ( ! $events ) {
			self::carte( 'Historique', '<p class="ep-vide">—</p>' );
			return;
		}
		$h = '<ul class="ep-journal">';
		foreach ( array_reverse( $events ) as $e ) {
			$auteur = $e['wp_user_id'] ? get_userdata( $e['wp_user_id'] ) : null;
			$h     .= sprintf(
				'<li class="%s"><span class="ep-journal__quoi">%s</span><span class="ep-meta">%s%s</span></li>',
				in_array( $e['event_type'], array( 'status_changed', 'note_added' ), true ) ? 'ep-journal--fait' : '',
				esc_html( EP_Events_Repository::decrire( $e ) ),
				esc_html( mysql2date( 'd/m/Y à H\hi', $e['created_at'] ) ),
				$auteur ? ' — ' . esc_html( $auteur->display_name ) : ''
			);
		}
		self::carte( 'Historique', $h . '</ul>' );
	}

	/**
	 * Données et RGPD.
	 *
	 * Volontairement à part, en bas, avec sa propre couleur : l'effacement est
	 * irréversible et ne doit pas se trouver à portée de clic distrait des
	 * actions courantes. Nonce et capacité sont revérifiés côté serveur —
	 * l'éloignement visuel n'est qu'une protection contre l'accident.
	 */
	private static function bloc_rgpd( array $lead ): void {
		$lignes = array(
			array( 'Base légale', esc_html( $lead['legal_basis'] ) ),
			array( 'Consentement', esc_html( sprintf( 'version %s, le %s', $lead['consent_version'], $lead['consent_at'] ? mysql2date( 'd/m/Y à H\hi', $lead['consent_at'] ) : '—' ) ) ),
			array( 'Page d’origine', esc_html( $lead['source_url'] ?: '—' ) ),
		);
		if ( $lead['closed_at'] ) {
			$lignes[] = array( 'Close le', esc_html( mysql2date( 'd/m/Y à H\hi', $lead['closed_at'] ) ) );
		}
		$lignes[] = array(
			'Conservation',
			EP_Purge::configuree()
				? esc_html( sprintf( '%d mois après clôture', EP_Purge::mois() ) )
				: '<span class="ep-etat__valeur ep-etat__valeur--attente">non définie</span>',
		);

		$h  = self::table( $lignes );
		$h .= '<p class="ep-meta" style="margin-top:12px">Efface définitivement la demande, ses photographies, ses notes et son historique. À utiliser pour une demande d’effacement (RGPD) ou une erreur manifeste. Irréversible.</p>';
		$h .= '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" onsubmit="return confirm(\'Effacer définitivement cette demande et tout ce qui s’y rattache ?\')">';
		$h .= '<input type="hidden" name="action" value="ep_supprimer"><input type="hidden" name="ref" value="' . esc_attr( $lead['public_id'] ) . '">';
		$h .= wp_nonce_field( 'ep_supprimer_' . $lead['public_id'], '_wpnonce', true, false );
		$h .= '<p><button class="button button-link-delete" type="submit">Effacer la demande</button></p></form>';

		self::carte( 'Données et RGPD', $h, '', 'ep-danger' );
	}

	/* ---------------------------------------------------------------- outils */

	/* La carte et le tableau libellé/valeur sont ceux de tous nos écrans, tenus
	   par EP_Admin : deux définitions finiraient par diverger, et la fiche
	   n'aurait plus tout à fait l'allure du reste du back-office. */

	private static function carte( string $titre, string $html, string $id = '', string $classe = '' ): void {
		EP_Admin::carte( $titre, $html, $id, $classe );
	}

	/** Les valeurs arrivent DÉJÀ échappées : chaque appelant décide de son balisage. */
	private static function table( array $lignes ): string {
		return EP_Admin::table_champs( $lignes );
	}
}
