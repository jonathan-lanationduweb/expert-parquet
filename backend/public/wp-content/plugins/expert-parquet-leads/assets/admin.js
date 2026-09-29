/*
 * Back-office Expert Parquet — aperçu des photographies.
 *
 * Amélioration progressive : le HTML servi contient des liens ordinaires vers
 * la photographie (servie par admin-post.php, capacité vérifiée avant toute
 * lecture disque). Sans ce script, le clic ouvre l'image dans un onglet — le
 * travail reste possible. Avec lui, l'image s'ouvre par-dessus la fiche.
 *
 * Aucune bibliothèque, aucun CDN.
 */
( function () {
	'use strict';

	var galerie = document.querySelector( '[data-ep-galerie]' );
	if ( ! galerie || ! window.matchMedia ) {
		return;
	}

	var liens = Array.prototype.slice.call( galerie.querySelectorAll( 'a[data-ep-photo]' ) );
	if ( ! liens.length ) {
		return;
	}

	var declencheur = null;
	var boite       = construire();

	function construire() {
		var fond = document.createElement( 'div' );
		fond.className = 'ep-apercu';
		fond.hidden = true;
		fond.setAttribute( 'role', 'dialog' );
		fond.setAttribute( 'aria-modal', 'true' );
		fond.setAttribute( 'aria-label', 'Aperçu de la photographie' );

		fond.innerHTML =
			'<div class="ep-apercu__boite">' +
				'<div class="ep-apercu__barre">' +
					'<span class="ep-apercu__titre"></span>' +
					'<button type="button" class="button ep-apercu__fermer">Fermer</button>' +
				'</div>' +
				'<img class="ep-apercu__image" src="" alt="">' +
			'</div>';

		document.body.appendChild( fond );

		fond.querySelector( '.ep-apercu__fermer' ).addEventListener( 'click', fermer );
		fond.addEventListener( 'mousedown', function ( e ) {
			// Un clic hors de la boîte referme, comme partout ailleurs.
			if ( e.target === fond ) {
				fermer();
			}
		} );

		return fond;
	}

	function ouvrir( lien ) {
		declencheur = lien;

		var image = boite.querySelector( '.ep-apercu__image' );
		image.setAttribute( 'src', lien.getAttribute( 'href' ) );
		/* La description alternative reste celle du contexte : une photographie
		   de parquet envoyée par un tiers, dont nous ne connaissons pas le
		   contenu. On ne fabrique pas une description que nous n'avons pas. */
		image.setAttribute( 'alt', lien.getAttribute( 'data-ep-alt' ) || '' );
		boite.querySelector( '.ep-apercu__titre' ).textContent = lien.getAttribute( 'data-ep-titre' ) || '';

		boite.hidden = false;
		document.addEventListener( 'keydown', auClavier, true );
		boite.querySelector( '.ep-apercu__fermer' ).focus();
	}

	function fermer() {
		boite.hidden = true;
		boite.querySelector( '.ep-apercu__image' ).setAttribute( 'src', '' );
		document.removeEventListener( 'keydown', auClavier, true );
		if ( declencheur ) {
			declencheur.focus();
			declencheur = null;
		}
	}

	/* Échappement ferme ; Tab reste prisonnier de la boîte, qui ne contient
	   qu'un bouton — le piège tient donc en une ligne. */
	function auClavier( e ) {
		if ( 'Escape' === e.key ) {
			e.preventDefault();
			fermer();
			return;
		}
		if ( 'Tab' === e.key ) {
			e.preventDefault();
			boite.querySelector( '.ep-apercu__fermer' ).focus();
		}
	}

	liens.forEach( function ( lien ) {
		lien.addEventListener( 'click', function ( e ) {
			// Ctrl/cmd//molette : on laisse le navigateur ouvrir un onglet.
			if ( e.metaKey || e.ctrlKey || e.shiftKey || 1 === e.button ) {
				return;
			}
			e.preventDefault();
			ouvrir( lien );
		} );
	} );
}() );
