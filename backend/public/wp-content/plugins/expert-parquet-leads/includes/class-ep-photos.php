<?php
/**
 * Photographies des demandes : stockage privé, contrôle réel, EXIF retiré.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI PAS wp-content/uploads
 *
 * Une photographie d'intérieur, associée à un nom, un téléphone et un code
 * postal, identifie un foyer. `wp-content/uploads` est servi directement par
 * Apache : l'URL est devinable, le dossier est indexable, et aucune
 * autorisation n'est vérifiée. Y déposer ces fichiers reviendrait à publier des
 * données personnelles de tiers.
 *
 * Les fichiers vont donc dans EP_PRIVATE_DIR, HORS de la racine web, sous un
 * nom aléatoire, et ne sont servis que par `servir()` après vérification de la
 * capacité. Leurs métadonnées (taille, dimensions, empreinte) sont dans la
 * table `{prefix}expert_parquet_lead_photos` — voir EP_Photos_Repository.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UN RÉENCODAGE SYSTÉMATIQUE
 *
 * Ni l'extension ni le `Content-Type` annoncé par le client ne prouvent quoi
 * que ce soit. Le type réel est lu dans les octets. Mais on va plus loin : le
 * fichier est RÉENCODÉ. Cette seule opération neutralise d'un coup le
 * polyglotte (un fichier valide à la fois comme image et comme script), le SVG
 * déguisé, les données arbitraires en fin de fichier — et supprime l'EXIF,
 * donc les coordonnées GPS que portent la plupart des photos de téléphone.
 */

defined( 'ABSPATH' ) || exit;

class EP_Photos {

	public const MAX_FICHIERS = 6;
	public const MAX_OCTETS   = 8 * 1024 * 1024;

	/** Types réellement acceptés, vérifiés sur les octets. */
	public const TYPES = array( 'image/jpeg', 'image/png', 'image/webp' );

	/** Côté le plus long conservé : au-delà, rien n'est gagné pour un constat. */
	public const COTE_MAX = 2000;

	public static function dossier(): string {
		// EP_PRIVATE_DIR est l'unique source du chemin privé (définie dans
		// wp-config.php, sinon par l'amorce de l'extension, hors racine web).
		return rtrim( EP_PRIVATE_DIR, '/\\' ) . '/photos';
	}

	/** Chemin absolu d'une photographie à partir de sa clé de stockage. */
	public static function chemin( array $photo ): string {
		// La clé est reconstruite depuis des valeurs contrôlées (entier, 32 hex) :
		// aucune partie d'une URL n'entre jamais telle quelle dans un chemin.
		return self::dossier() . '/' . (int) $photo['lead_id'] . '/' . $photo['stored_filename'];
	}

	/** Crée le dossier et le verrouille, au cas où il finirait exposé. */
	public static function preparer_stockage(): void {
		$dir = self::dossier();
		if ( ! is_dir( $dir ) ) {
			wp_mkdir_p( $dir );
		}
		if ( ! file_exists( $dir . '/.htaccess' ) ) {
			file_put_contents( $dir . '/.htaccess', "Require all denied\nOptions -Indexes\n" );
		}
		if ( ! file_exists( $dir . '/index.php' ) ) {
			file_put_contents( $dir . '/index.php', "<?php // Rien a voir ici.\n" );
		}
	}

	/**
	 * Reçoit les fichiers d'une requête multipart et les attache à une demande.
	 *
	 * Retourne array( $stockees, $erreurs ) — $stockees = lignes de la table.
	 */
	public static function attacher( int $lead_id, array $fichiers ): array {
		self::preparer_stockage();
		$stockees = array();
		$erreurs  = array();

		$noms    = (array) ( $fichiers['name'] ?? array() );
		$tmps    = (array) ( $fichiers['tmp_name'] ?? array() );
		$tailles = (array) ( $fichiers['size'] ?? array() );
		$codes   = (array) ( $fichiers['error'] ?? array() );

		if ( count( $noms ) > self::MAX_FICHIERS ) {
			return array( array(), array( sprintf( '%d photographies au maximum.', self::MAX_FICHIERS ) ) );
		}

		/* Le plafond vaut PAR DEMANDE, pas par requête. Le jeton de dépôt reste
		   valable trente minutes : sans ce compte, six requêtes de six fichiers
		   feraient trente-six photographies. On accepte ce qui reste, et on dit
		   ce qu'on refuse. */
		$restantes = self::MAX_FICHIERS - EP_Photos_Repository::compter( $lead_id );
		if ( $restantes <= 0 ) {
			return array( array(), array( sprintf( 'Cette demande a déjà ses %d photographies.', self::MAX_FICHIERS ) ) );
		}
		if ( count( $noms ) > $restantes ) {
			$erreurs[] = sprintf( '%d photographie(s) refusée(s) : %d au maximum par demande.', count( $noms ) - $restantes, self::MAX_FICHIERS );
			$noms      = array_slice( $noms, 0, $restantes, true );
		}

		foreach ( $noms as $i => $nom ) {
			/* Le code d'erreur de PHP est lu AVANT tout le reste : un fichier
			   refusé par `upload_max_filesize` arrive avec un `tmp_name` vide
			   et serait sinon ignoré en silence. */
			$code = (int) ( $codes[ $i ] ?? UPLOAD_ERR_OK );
			if ( UPLOAD_ERR_NO_FILE === $code ) {
				continue;
			}
			if ( UPLOAD_ERR_OK !== $code ) {
				$erreurs[] = in_array( $code, array( UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE ), true )
					? 'Fichier trop volumineux pour le serveur.'
					: 'Le fichier n’a pas pu être reçu.';
				continue;
			}
			$tmp = $tmps[ $i ] ?? '';
			if ( ! $tmp || ! is_uploaded_file( $tmp ) ) {
				$erreurs[] = 'Le fichier n’a pas pu être reçu.';
				continue;
			}
			if ( ( $tailles[ $i ] ?? 0 ) > self::MAX_OCTETS ) {
				$erreurs[] = 'Fichier trop volumineux.';
				continue;
			}

			// Type RÉEL, lu dans les octets — jamais l'extension.
			$info = @getimagesize( $tmp );
			if ( ! $info || ! in_array( $info['mime'] ?? '', self::TYPES, true ) ) {
				$erreurs[] = 'Format non accepté.';
				continue;
			}

			$destination = self::dossier() . '/' . $lead_id;
			if ( ! is_dir( $destination ) ) {
				wp_mkdir_p( $destination );
			}
			// Nom aléatoire : le nom d'origine peut porter des informations
			// personnelles, et un nom devinable est un nom trouvable.
			$id      = bin2hex( random_bytes( 16 ) );
			$fichier = $id . '.jpg';
			$chemin  = $destination . '/' . $fichier;

			if ( ! self::reencoder( $tmp, $info['mime'], $chemin ) ) {
				$erreurs[] = 'Image illisible.';
				continue;
			}

			$dims  = @getimagesize( $chemin );
			$ligne = EP_Photos_Repository::ajouter(
				array(
					'lead_id'           => $lead_id,
					'public_id'         => $id,
					'storage_key'       => $lead_id . '/' . $fichier,
					'original_filename' => sanitize_file_name( wp_basename( (string) $nom ) ),
					'stored_filename'   => $fichier,
					'mime_type'         => 'image/jpeg',
					'size_bytes'        => filesize( $chemin ),
					'width'             => $dims ? (int) $dims[0] : 0,
					'height'            => $dims ? (int) $dims[1] : 0,
					'sha256'            => hash_file( 'sha256', $chemin ),
				)
			);
			if ( ! $ligne ) {
				// La base a refusé la ligne : on ne garde pas un fichier orphelin.
				@unlink( $chemin );
				$erreurs[] = 'Enregistrement impossible.';
				continue;
			}
			$stockees[] = $ligne;
		}

		if ( $stockees ) {
			EP_Events_Repository::consigner(
				$lead_id,
				'photos_received',
				array( 'user_id' => null, 'metadata' => array( 'count' => count( $stockees ) ) )
			);
		}

		return array( $stockees, $erreurs );
	}

	/**
	 * Réencodage en JPEG. C'est ici que l'EXIF disparaît : GD ne recopie pas
	 * les métadonnées de la source, donc les coordonnées GPS non plus.
	 */
	private static function reencoder( string $source, string $mime, string $destination ): bool {
		if ( ! function_exists( 'imagecreatefromjpeg' ) ) {
			return false;
		}
		$img = match ( $mime ) {
			'image/jpeg' => @imagecreatefromjpeg( $source ),
			'image/png'  => @imagecreatefrompng( $source ),
			'image/webp' => function_exists( 'imagecreatefromwebp' ) ? @imagecreatefromwebp( $source ) : false,
			default      => false,
		};
		if ( ! $img ) {
			return false;
		}

		$l   = imagesx( $img );
		$h   = imagesy( $img );
		$max = max( $l, $h );
		if ( $max > self::COTE_MAX ) {
			$ratio = self::COTE_MAX / $max;
			$redim = imagescale( $img, (int) round( $l * $ratio ), (int) round( $h * $ratio ) );
			if ( $redim ) {
				imagedestroy( $img );
				$img = $redim;
			}
		}

		// Fond blanc : un PNG transparent aplati sur du noir devient illisible.
		$plat = imagecreatetruecolor( imagesx( $img ), imagesy( $img ) );
		imagefill( $plat, 0, 0, imagecolorallocate( $plat, 255, 255, 255 ) );
		imagecopy( $plat, $img, 0, 0, 0, 0, imagesx( $img ), imagesy( $img ) );

		$ok = imagejpeg( $plat, $destination, 82 );
		imagedestroy( $img );
		imagedestroy( $plat );
		return (bool) $ok;
	}

	/**
	 * Sert une photographie à un gestionnaire authentifié.
	 *
	 * Le contrôle de capacité est fait AVANT toute lecture disque ; la
	 * photographie est retrouvée en base par sa référence, jamais par un
	 * chemin venu de l'URL.
	 */
	public static function servir( int $lead_id, string $photo_id ): void {
		if ( ! current_user_can( EP_Lead::CAP ) ) {
			status_header( 403 );
			exit;
		}
		$photo = EP_Photos_Repository::par_reference( $lead_id, $photo_id );
		if ( ! $photo ) {
			status_header( 404 );
			exit;
		}
		$chemin = self::chemin( $photo );
		if ( ! is_file( $chemin ) ) {
			status_header( 404 );
			exit;
		}
		header( 'Content-Type: image/jpeg' );
		header( 'Content-Length: ' . filesize( $chemin ) );
		header( 'X-Content-Type-Options: nosniff' );
		header( 'Content-Disposition: inline' );
		// Jamais en cache partagé : le fichier est privé.
		header( 'Cache-Control: private, no-store' );
		readfile( $chemin );
		exit;
	}

	/** Supprime UNE photographie : le fichier, puis la ligne. */
	public static function supprimer_photo( array $photo, ?int $user_id ): bool {
		$chemin = self::chemin( $photo );
		if ( is_file( $chemin ) ) {
			@unlink( $chemin );
		}
		$ok = EP_Photos_Repository::supprimer( (int) $photo['id'] );
		if ( $ok ) {
			EP_Events_Repository::consigner(
				(int) $photo['lead_id'],
				'photo_deleted',
				array( 'user_id' => $user_id, 'metadata' => array( 'photo' => substr( $photo['public_id'], 0, 8 ) ) )
			);
		}
		return $ok;
	}

	/**
	 * Retire du disque tous les fichiers d'une demande. Retourne leur nombre.
	 * Les lignes de la table sont supprimées par l'appelant (EP_Lead::effacer),
	 * qui orchestre l'ordre complet.
	 */
	public static function supprimer_fichiers( int $lead_id ): int {
		$dir = self::dossier() . '/' . $lead_id;
		if ( ! is_dir( $dir ) ) {
			return 0;
		}
		$n = 0;
		foreach ( glob( $dir . '/*.jpg' ) ?: array() as $f ) {
			if ( @unlink( $f ) ) {
				++$n;
			}
		}
		@rmdir( $dir );
		return $n;
	}

	/**
	 * Les limites de PHP sont-elles à la hauteur de ce que le site promet ?
	 *
	 * Le formulaire annonce six photographies de huit mégaoctets. Si PHP est
	 * réglé plus bas, les fichiers sont refusés avant d'atteindre ce code et
	 * le visiteur croit avoir envoyé ses photographies. Retourne la liste des
	 * réglages insuffisants, vide si tout va bien.
	 *
	 * @return string[]
	 */
	public static function limites_php(): array {
		$manques = array();
		$octets  = static fn( string $cle ): int => (int) wp_convert_hr_to_bytes( (string) ini_get( $cle ) );

		if ( $octets( 'upload_max_filesize' ) < self::MAX_OCTETS ) {
			$manques[] = sprintf(
				'upload_max_filesize vaut %s : une photographie de plus de cette taille sera refusée alors que le formulaire en accepte %d Mo.',
				ini_get( 'upload_max_filesize' ),
				self::MAX_OCTETS / 1048576
			);
		}
		$total = self::MAX_FICHIERS * self::MAX_OCTETS + 262144;
		if ( $octets( 'post_max_size' ) < $total ) {
			$manques[] = sprintf(
				'post_max_size vaut %s : un envoi de %d photographies de %d Mo (soit %d Mo) sera rejeté sans message exploitable.',
				ini_get( 'post_max_size' ),
				self::MAX_FICHIERS,
				self::MAX_OCTETS / 1048576,
				(int) ceil( $total / 1048576 )
			);
		}
		if ( (int) ini_get( 'max_file_uploads' ) < self::MAX_FICHIERS ) {
			$manques[] = sprintf( 'max_file_uploads vaut %s, inférieur aux %d photographies acceptées.', ini_get( 'max_file_uploads' ), self::MAX_FICHIERS );
		}
		return $manques;
	}
}
