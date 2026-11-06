/*
 * Back-office Expert Parquet — écrans de contenu et de configuration.
 *
 *  - sélection d'une image dans la médiathèque native (wp.media) pour les
 *    champs image (vignette, fond de maintenance, cartes média de l'identité) ;
 *  - affichage conditionnel des critères du moteur selon le parcours de sortie ;
 *  - compteur de caractères sur le titre SEO ;
 *  - aperçu de la couleur d'accent (Apparence), aperçu SEO, lignes de liens.
 *
 * Amélioration progressive : sans ce script, les champs restent des champs,
 * les éditions de liens sont dépliées, les ajouts restent des <details>.
 */
( function () {
	'use strict';

	/* ---------------------------------------------------------- médiathèque */
	document.querySelectorAll( '[data-ep-image]' ).forEach( function ( bloc ) {
		var champ   = bloc.querySelector( '[data-ep-image-id]' );
		var zone    = bloc.querySelector( '.ep-image__zone' );
		var choisir = bloc.querySelector( '[data-ep-image-choisir]' );
		var retirer = bloc.querySelector( '[data-ep-image-retirer]' );
		var nom     = bloc.querySelector( '[data-ep-image-nom]' );
		var dims    = bloc.querySelector( '[data-ep-image-dims]' );
		var repli   = bloc.querySelector( '[data-ep-image-repli]' );
		var libelle = bloc.querySelector( '[data-ep-image-libelle]' );
		if ( ! champ || ! choisir || ! window.wp || ! wp.media ) {
			return;
		}
		var cadre = null;
		choisir.addEventListener( 'click', function ( e ) {
			e.preventDefault();
			if ( ! cadre ) {
				cadre = wp.media( { title: 'Choisir une image', button: { text: 'Utiliser cette image' }, multiple: false, library: { type: 'image' } } );
				cadre.on( 'select', function () {
					var media = cadre.state().get( 'selection' ).first().toJSON();
					var src   = ( media.sizes && ( media.sizes.medium || media.sizes.thumbnail ) ) ? ( media.sizes.medium || media.sizes.thumbnail ).url : media.url;
					champ.value = media.id;
					zone.innerHTML = '';
					var img = document.createElement( 'img' );
					img.className = 'ep-image__apercu';
					img.src = src;
					img.alt = '';
					zone.appendChild( img );
					if ( nom ) { nom.textContent = media.filename || ''; }
					if ( dims ) { dims.textContent = media.width ? media.width + ' × ' + media.height + ' px' : ''; }
					if ( repli ) { repli.hidden = true; }
					if ( libelle ) { libelle.textContent = 'Remplacer'; }
					if ( retirer ) {
						retirer.hidden = false;
					}
				} );
			}
			cadre.open();
		} );
		if ( retirer ) {
			retirer.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				champ.value = '0';
				zone.innerHTML = zone.classList.contains( 'ep-media-carte__apercu' ) ? '<span class="ep-media-carte__vide">Aucune image</span>' : '';
				if ( nom ) { nom.textContent = ''; }
				if ( dims ) { dims.textContent = ''; }
				if ( repli ) { repli.hidden = false; }
				if ( libelle ) { libelle.textContent = 'Choisir'; }
				retirer.hidden = true;
			} );
		}
	} );

	/* ---------------------------------------------------------- sortie */
	document.querySelectorAll( '[data-ep-sortie]' ).forEach( function ( bloc ) {
		var select = bloc.querySelector( 'select[name="ep_sortie"]' );
		var moteur = bloc.querySelector( '[data-ep-sortie-moteur]' );
		var encart = bloc.querySelector( '[data-ep-sortie-encart]' );
		if ( ! select ) {
			return;
		}
		var sync = function () {
			var estMoteur = 'moteur' === select.value;
			if ( moteur ) { moteur.hidden = ! estMoteur; }
			if ( encart ) { encart.hidden = ! estMoteur; }
		};
		select.addEventListener( 'change', sync );
		sync();
	} );

	/* ---------------------------------------------------------- compteur */
	document.querySelectorAll( '[data-ep-compteur]' ).forEach( function ( input ) {
		var max   = parseInt( input.getAttribute( 'data-ep-compteur' ), 10 ) || 60;
		var badge = document.createElement( 'span' );
		badge.className = 'ep-compteur';
		input.insertAdjacentElement( 'afterend', badge );
		var maj = function () {
			var n = input.value.length;
			badge.textContent = n + ' / ' + max;
			badge.classList.toggle( 'ep-compteur--trop', n > max );
		};
		input.addEventListener( 'input', maj );
		maj();
	} );

	/* ---------------------------------------------------------- couleur */
	document.querySelectorAll( '[data-ep-couleur-pour]' ).forEach( function ( pick ) {
		var champ = document.getElementById( pick.getAttribute( 'data-ep-couleur-pour' ) );
		if ( ! champ ) { return; }
		pick.addEventListener( 'input', function () { champ.value = pick.value.toUpperCase(); champ.dispatchEvent( new Event( 'input', { bubbles: true } ) ); } );
		champ.addEventListener( 'input', function () { if ( /^#[0-9a-fA-F]{6}$/.test( champ.value ) ) { pick.value = champ.value; } } );
	} );

	/* ---------------------------------------------------------- aperçu de l'accent (Apparence) */
	( function () {
		var accent = document.querySelector( '[data-ep-accent]' );
		if ( ! accent ) { return; }
		var sombreChamp = document.querySelector( '[data-ep-accent-sombre]' );
		var cibles = document.querySelectorAll( '[data-ep-apparence], [data-ep-apparence-apercu]' );
		var hex = document.querySelector( '[data-ep-hex]' );
		var hexSombre = document.querySelector( '[data-ep-derive-hex="sombre"]' );
		var hexPale = document.querySelector( '[data-ep-derive-hex="pale"]' );
		var rgb = function ( h ) { return [ parseInt( h.slice( 1, 3 ), 16 ), parseInt( h.slice( 3, 5 ), 16 ), parseInt( h.slice( 5, 7 ), 16 ) ]; };
		var toHex = function ( c ) { return '#' + c.map( function ( v ) { v = Math.max( 0, Math.min( 255, Math.round( v ) ) ); return ( v < 16 ? '0' : '' ) + v.toString( 16 ).toUpperCase(); } ).join( '' ); };
		/* mêmes règles que EP_Projet : assombrir 17 %, mélanger 82 % de blanc */
		var assombrir = function ( h, f ) { return toHex( rgb( h ).map( function ( v ) { return v * ( 1 - f ); } ) ); };
		var melanger = function ( h, vers, part ) { var a = rgb( h ), b = rgb( vers ); return toHex( a.map( function ( v, i ) { return v + ( b[ i ] - v ) * part; } ) ); };
		var maj = function () {
			var v = accent.value.trim().toUpperCase();
			if ( ! /^#[0-9A-F]{6}$/.test( v ) ) { return; }
			var s = sombreChamp && /^#[0-9a-fA-F]{6}$/.test( sombreChamp.value.trim() ) ? sombreChamp.value.trim().toUpperCase() : assombrir( v, 0.17 );
			var p = melanger( v, '#FFFFFF', 0.82 );
			cibles.forEach( function ( el ) {
				el.style.setProperty( '--ep-apercu-accent', v );
				el.style.setProperty( '--ep-apercu-accent-sombre', s );
				el.style.setProperty( '--ep-apercu-accent-pale', p );
			} );
			if ( hex ) { hex.textContent = v; }
			if ( hexSombre ) { hexSombre.textContent = s; }
			if ( hexPale ) { hexPale.textContent = p; }
		};
		accent.addEventListener( 'input', maj );
		if ( sombreChamp ) { sombreChamp.addEventListener( 'input', maj ); }
	}() );

	/* ---------------------------------------------------------- destination des liens (footer) */
	document.querySelectorAll( '[data-ep-lien], [data-ep-ajout] .ep-lien__grille' ).forEach( function ( bloc ) {
		var type  = bloc.querySelector( 'select[name$="[type]"]' );
		var liste = bloc.querySelector( '.ep-dest-liste' );
		var libre = bloc.querySelector( '.ep-dest-libre' );
		if ( ! type || ! liste || ! libre ) { return; }
		var sync = function () {
			var libreType = [ 'externe', 'email', 'telephone' ].indexOf( type.value ) !== -1;
			liste.hidden = libreType;
			libre.hidden = ! libreType;
			libre.placeholder = { externe: 'https://…', email: 'nom@domaine.fr', telephone: '+33 1 23 45 67 89' }[ type.value ] || '';
		};
		type.addEventListener( 'change', sync );
		liste.addEventListener( 'change', function () {
			var t = liste.value.split( ':' )[ 0 ];
			if ( t && type.value !== t ) { type.value = t; }
		} );
		sync();
	} );

	/* ---------------------------------------------------------- lignes de liens : édition repliée, résumé vivant */
	var ICONES = { instagram: 'dashicons-instagram', facebook: 'dashicons-facebook-alt', linkedin: 'dashicons-linkedin', youtube: 'dashicons-youtube', email: 'dashicons-email', telephone: 'dashicons-phone', externe: 'dashicons-external' };
	document.querySelectorAll( '[data-ep-lien]' ).forEach( function ( ligne ) {
		var bouton  = ligne.querySelector( '[data-ep-lien-modifier]' );
		var edition = ligne.querySelector( '[data-ep-lien-edition]' );
		var nom     = ligne.querySelector( '[data-ep-lien-nom]' );
		var libelle = ligne.querySelector( 'input[name$="[libelle]"]' );
		var actif   = ligne.querySelector( 'input[name$="[actif]"]' );
		var icone   = ligne.querySelector( '[data-ep-icone]' );
		var vignette = ligne.querySelector( '.ep-lien__icone' );
		if ( bouton && edition ) {
			edition.hidden = true;
			bouton.addEventListener( 'click', function () {
				edition.hidden = ! edition.hidden;
				bouton.setAttribute( 'aria-expanded', edition.hidden ? 'false' : 'true' );
				if ( ! edition.hidden && libelle ) { libelle.focus(); }
			} );
		}
		if ( libelle && nom ) {
			libelle.addEventListener( 'input', function () { nom.textContent = libelle.value; } );
		}
		if ( actif ) {
			actif.addEventListener( 'change', function () { ligne.classList.toggle( 'ep-lien--inactif', ! actif.checked ); } );
		}
		if ( icone && vignette ) {
			icone.addEventListener( 'change', function () {
				var d = ICONES[ icone.value ];
				vignette.classList.toggle( 'ep-lien__icone--vide', ! d );
				vignette.innerHTML = '<span class="dashicons ' + ( d || 'dashicons-minus' ) + '" aria-hidden="true"></span>';
			} );
		}
	} );
	/* réseaux sociaux : le pictogramme suit le réseau choisi */
	document.querySelectorAll( '.ep-reseau' ).forEach( function ( ligne ) {
		var select = ligne.querySelector( 'select[data-ep-icone]' );
		var vignette = ligne.querySelector( '.ep-lien__icone' );
		if ( ! select || ! vignette ) { return; }
		select.addEventListener( 'change', function () {
			vignette.innerHTML = '<span class="dashicons ' + ( ICONES[ select.value ] || 'dashicons-share' ) + '" aria-hidden="true"></span>';
		} );
	} );
	/* navigation : une entrée masquée se grise */
	document.querySelectorAll( '.ep-ligne input[name$="[visible]"]' ).forEach( function ( c ) {
		c.addEventListener( 'change', function () { c.closest( '.ep-ligne' ).classList.toggle( 'ep-ligne--masquee', ! c.checked ); } );
	} );
	/* footer : l'état « Visible / Masquée » d'une colonne suit sa case dans le résumé replié */
	document.querySelectorAll( '[data-ep-pli]' ).forEach( function ( pli ) {
		var visible = pli.querySelector( '[data-ep-pli-visible]' );
		var etat    = pli.querySelector( '[data-ep-pli-etat]' );
		if ( ! visible || ! etat ) { return; }
		visible.addEventListener( 'change', function () {
			etat.textContent = visible.checked ? 'Visible' : 'Masquée';
			etat.classList.toggle( 'ep-etiquette--ok', visible.checked );
			etat.classList.toggle( 'ep-etiquette--off', ! visible.checked );
		} );
	} );
	/* « + Ajouter » : au dépliage, le premier champ prend le focus */
	document.querySelectorAll( '[data-ep-ajout]' ).forEach( function ( d ) {
		d.addEventListener( 'toggle', function () {
			if ( d.open ) {
				/* les champs du gabarit ne sont envoyés qu'une fois le bloc ouvert */
				d.querySelectorAll( 'input[disabled], select[disabled]' ).forEach( function ( c ) { c.disabled = false; } );
				var f = d.querySelector( 'input[type="text"], select' ); if ( f ) { f.focus(); }
			}
		} );
	} );

	/* ---------------------------------------------------------- aperçu SEO */
	document.querySelectorAll( '[data-ep-apercu-seo]' ).forEach( function ( bloc ) {
		var titre = document.querySelector( '[name="ep_seo_title"]' );
		var desc  = document.querySelector( '[name="ep_seo_description"]' );
		var t = bloc.querySelector( '[data-ep-seo-titre]' );
		var d = bloc.querySelector( '[data-ep-seo-desc]' );
		if ( titre && t ) {
			var base = t.textContent;
			titre.addEventListener( 'input', function () { t.textContent = titre.value ? titre.value + ( t.getAttribute( 'data-suffixe' ) || '' ) : base; } );
		}
		if ( desc && d ) {
			var baseD = d.textContent;
			desc.addEventListener( 'input', function () { d.textContent = desc.value ? desc.value.slice( 0, 160 ) : baseD; } );
		}
	} );
	/* aperçu SEO global (écran SEO) : titre par défaut + suffixe, description par défaut */
	( function () {
		var bloc = document.querySelector( '[data-ep-apercu-seo-global]' );
		if ( ! bloc ) { return; }
		var t = bloc.querySelector( '[data-ep-seo-titre]' ), d = bloc.querySelector( '[data-ep-seo-desc]' );
		var nom = document.querySelector( '[name="nom"]' ), suf = document.querySelector( '[name="suffixe"]' ), titre = document.querySelector( '[name="titre_defaut"]' ), desc = document.querySelector( '[name="description_defaut"]' );
		var maj = function () {
			var s = ( suf ? suf.value : '' ).trim();
			if ( t ) { t.textContent = ( ( titre && titre.value ) || ( nom && nom.value ) || '' ) + ( s ? ' ' + s : '' ); }
			if ( d && desc ) { d.textContent = desc.value.slice( 0, 160 ); }
		};
		[ nom, suf, titre, desc ].forEach( function ( el ) { if ( el ) { el.addEventListener( 'input', maj ); } } );
	}() );

	/* ---------------------------------------------------------- confirmation */
	document.querySelectorAll( '[data-ep-confirmer]' ).forEach( function ( form ) {
		form.addEventListener( 'submit', function ( e ) {
			if ( ! window.confirm( form.getAttribute( 'data-ep-confirmer' ) ) ) {
				e.preventDefault();
			}
		} );
	} );
}() );
