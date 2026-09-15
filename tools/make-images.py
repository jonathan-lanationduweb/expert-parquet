#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère les variantes responsives des photographies du site.

Ce fichier fait partie de l'outillage de développement (dossier `tools/`).
Il n'est PAS lancé par `tools/build.mjs` et le site n'en dépend à aucun moment :
il produit des fichiers, qui sont ensuite versionnés comme n'importe quel autre
visuel. Lancer à la main après avoir ajouté ou remplacé une photo :

    python tools/make-images.py

Pourquoi Python et non Node, contrairement à `make-icons.mjs` : ce dernier
décode et réencode du PNG, format dont le codec tient en cent lignes. Le JPEG
demande une transformée en cosinus discrète et un décodage Huffman ; l'écrire à
la main serait beaucoup de code fragile pour un gain nul. Pillow fait ce travail
depuis vingt ans. La règle « zéro dépendance » du projet porte sur ce qui est
SERVI au navigateur — elle n'a jamais interdit d'utiliser un outil local pour
fabriquer un fichier.

Si Pillow n'est pas installé, ce script s'arrête proprement et le site continue
de fonctionner : `tools/images.mjs` n'émet un `srcset` que pour les variantes
réellement présentes sur le disque.

Sortie : assets/images/r/<nom>-<largeur>.jpg
"""

import os
import sys

SOURCE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'images')
SORTIE = os.path.join(SOURCE, 'r')

# Quatre paliers, pas dix. Ils couvrent le téléphone (480), la tablette et le
# desktop courant (768, 1200) et les écrans à forte densité (1600). Une variante
# plus large que l'original n'est jamais produite : agrandir n'apporte rien.
LARGEURS = [480, 768, 1200, 1600]

# 82 : au-dessus, le poids monte sans gain visible sur des photographies de bois
# ; en dessous, les aplats de mur commencent à se baguer.
QUALITE = 82


def main():
    try:
        from PIL import Image
    except ImportError:
        print('Pillow est absent : aucune variante générée.', file=sys.stderr)
        print('  py -m pip install Pillow', file=sys.stderr)
        return 1

    os.makedirs(SORTIE, exist_ok=True)
    sources = sorted(f for f in os.listdir(SOURCE) if f.lower().endswith('.jpg'))
    if not sources:
        print('Aucune photographie trouvée dans assets/images.', file=sys.stderr)
        return 1

    total_src = 0
    total_out = 0
    produites = 0

    for nom in sources:
        chemin = os.path.join(SOURCE, nom)
        total_src += os.path.getsize(chemin)
        with Image.open(chemin) as im:
            im = im.convert('RGB')
            largeur_src, hauteur_src = im.size
            base = os.path.splitext(nom)[0]
            faites = []
            for largeur in LARGEURS:
                if largeur >= largeur_src:
                    continue
                hauteur = round(hauteur_src * largeur / largeur_src)
                cible = os.path.join(SORTIE, '%s-%d.jpg' % (base, largeur))
                # LANCZOS : le rééchantillonnage le plus net sur des textures
                # de bois, où un filtre bilinéaire efface le fil.
                im.resize((largeur, hauteur), Image.LANCZOS).save(
                    cible,
                    'JPEG',
                    quality=QUALITE,
                    optimize=True,
                    progressive=True,
                )
                total_out += os.path.getsize(cible)
                faites.append(largeur)
                produites += 1
            print('  %-28s %5dx%-5d -> %s' % (
                nom, largeur_src, hauteur_src,
                ', '.join(str(w) for w in faites) if faites else 'aucune (déjà petite)',
            ))

    print('')
    print('%d variantes produites dans assets/images/r/' % produites)
    print('Sources : %.2f Mo · variantes : %.2f Mo' % (
        total_src / 1048576.0, total_out / 1048576.0))
    return 0


if __name__ == '__main__':
    sys.exit(main())
