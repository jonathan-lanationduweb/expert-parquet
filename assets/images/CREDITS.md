# Crédits photographiques

Toutes les images de ce dossier proviennent de **[Pexels](https://www.pexels.com)** et
sont utilisables gratuitement, y compris à des fins commerciales, sans attribution
obligatoire ([licence Pexels](https://www.pexels.com/license/)). Les sources sont
néanmoins listées ici par honnêteté et pour permettre de retrouver l'original.

Le nom du photographe est documenté pour les images **remplacées le 7 septembre 2026**
(voir la section dédiée plus bas). Pour les plus anciennes il n'avait pas pu être relevé
automatiquement, l'API Pexels n'étant pas accessible depuis l'environnement de
développement ; chaque page liée ci-dessous le porte, à compléter si une attribution
nominale est souhaitée.

| Fichier | Usage principal | Source |
| --- | --- | --- |
| `hero.jpg` | Hero de la page d'accueil, image Open Graph par défaut | <https://www.pexels.com/photo/17181935/> |
| `parquet-detail.jpg` | Page *Expertise parquet* | <https://www.pexels.com/photo/9285783/> |
| `inspection.jpg` | Page *Diagnostic parquet* | <https://www.pexels.com/photo/5973909/> |
| `domaine-diagnostic.jpg` | Domaine « Diagnostic du parquet » (accueil) | <https://www.pexels.com/photo/326311/> |
| `grincement.jpg` | Page *Parquet qui grince*, article associé | <https://www.pexels.com/photo/10900708/> |
| `soulevement.jpg` | Page *Parquet qui gondole*, article associé | <https://www.pexels.com/photo/172291/> |
| `lames-bougent.jpg` | Page *Lames qui bougent* | <https://www.pexels.com/photo/6364752/> |
| `degat-eaux.jpg` | Pages *Humidité* et *Dégât des eaux*, article humidité, carrousel *Après un dégât des eaux* | <https://www.pexels.com/photo/12519041/> |
| `taches.jpg` | Hero *Parquet abîmé : taches et rayures*, vignette de la liste des symptômes | <https://www.pexels.com/photo/photograph-of-a-wooden-floor-11126101/> |
| `rayures.jpg` | Article *Peut-on rénover un parquet très abîmé ?*, vignette *Dégât des eaux* | <https://www.pexels.com/photo/6044253/> |
| `pose-support.jpg` | Page *Défaut de pose*, catégorie *Pose*, article support | <https://www.pexels.com/photo/20818874/> |
| `parquet-ancien.jpg` | Catégorie *Rénovation* | <https://www.pexels.com/photo/11018239/> |
| `entretien.jpg` | Catégorie *Entretien* | <https://www.pexels.com/photo/4440568/> |
| `interieur-clair.jpg` | Page *À propos*, hero *Choisir un parquet*, carte *Conseils* | <https://www.pexels.com/photo/living-room-with-beige-walls-19836805/> |
| `hero-wide.jpg` | Bloc « L'expertise commence par l'observation » (accueil) | <https://www.pexels.com/photo/2082093/> |
| `architectural.jpg` | Domaine « Expertise avant intervention » (accueil) | <https://www.pexels.com/photo/wooden-floor-and-white-walls-inside-a-house-7587883/> |
| `domaine-desordres.jpg` | Domaine « Désordres et défauts » (accueil) | <https://www.pexels.com/photo/2530326/> |

## Icônes

Le jeu d'icônes a été volontairement réduit à cinq formes (flèches, validation, alerte,
question, loupe) : les pictogrammes décoratifs de la première version participaient à
l'effet « gabarit ». Ce sont des **SVG dessinés pour ce projet**, définis dans
`tools/partials.mjs` et intégrés directement dans le HTML. Aucune bibliothèque
d'icônes tierce n'est utilisée.

## Identité visuelle

Le logo n'est pas une image sous licence : c'est l'**identité propre du site**, fournie
sous deux formes dans `assets/brand/` — `expert-parquet-mark.png` (symbole seul) et
`expert-parquet-logo.png` (logotype horizontal). Ces deux fichiers sont les **masters**
à conserver ; ils ne sont pas servis aux visiteurs.

Toutes les déclinaisons employées par le site sont produites par
`node tools/make-icons.mjs` et ne doivent **pas** être retouchées à la main :

| Fichier | Emploi |
| --- | --- |
| `assets/brand/expert-parquet-logo-on-light.png` | En-tête sur fond clair |
| `assets/brand/expert-parquet-logo-on-dark.png` | En-tête posé sur le hero, signature du pied |
| `assets/icons/favicon-16x16.png` · `favicon-32x32.png` · `favicon.ico` | Onglet du navigateur |
| `assets/icons/apple-touch-icon.png` | Écran d'accueil iOS |

La signature typographique provisoire (« **Expert** Parquet » en deux graisses d'Inter
Tight) et le favicon de gabarit ont été retirés.


## Photographies remplacées le 7 septembre 2026

Trois images avaient été identifiées comme faibles : elles ne montraient pas leur sujet,
ou cassaient l'identité architecturale du site. Elles ont été remplacées à noms de
fichiers inchangés, donc sans toucher aux contenus.

| | `interieur-clair.jpg` | `architectural.jpg` | `taches.jpg` |
| --- | --- | --- | --- |
| **Titre** | Living Room with Beige Walls | Wooden Floor and White Walls Inside a House | Photograph of a Wooden Floor |
| **Auteur** | Lisa Anna | Max Vakhtbovych | Engin Akyurt |
| **Plateforme** | Pexels | Pexels | Pexels |
| **Page d'origine** | <https://www.pexels.com/photo/living-room-with-beige-walls-19836805/> | <https://www.pexels.com/photo/wooden-floor-and-white-walls-inside-a-house-7587883/> | <https://www.pexels.com/photo/photograph-of-a-wooden-floor-11126101/> |
| **Licence** | Licence Pexels — usage libre, y compris commercial, attribution non obligatoire | idem | idem |
| **Récupérée le** | 7 septembre 2026 | 7 septembre 2026 | 7 septembre 2026 |
| **Dimensions** | 1600 × 1067 (3:2) | 1800 × 1440 (5:4) | 1800 × 1200 (3:2) |
| **Poids** | 174 Ko | 151 Ko | 469 Ko |

Texte de la licence : <https://www.pexels.com/license/>

Les fichiers ont été demandés au CDN Pexels aux dimensions exactes de leur emplacement
(`&fit=crop&w=…&h=…`), donc **recadrés à la source, jamais étirés** ni redimensionnés
localement. Pour `architectural.jpg` et `taches.jpg` ces dimensions sont désormais celles
que le gabarit déclare dans le HTML : le rapport intrinsèque et le rapport annoncé
coïncident, ce qui n'était pas le cas des anciens fichiers.

Ce qui a motivé chaque remplacement :

- **`interieur-clair.jpg`** — l'ancienne était une photo d'annonce immobilière américaine
  (deux ventilateurs de plafond, canapés marron, tapis à poils longs, sol en stratifié
  gris). La nouvelle est un intérieur nordique contemporain : lames de chêne larges au
  centre du cadre, murs greige, lumière naturelle, mobilier rare.
- **`architectural.jpg`** — l'ancienne montrait un escalier vu de dessus, en dominante
  orange, sans parquet lisible. La nouvelle est une pièce vide avant emménagement,
  parquet chevron sur toute la partie basse, cadrage frontal, murs blancs, menuiserie
  noire. Elle dit « architecture **et** parquet », pas seulement « architecture ».
- **`taches.jpg`** — l'ancienne montrait des lames de teck neuves et parfaitement saines
  sur une page consacrée aux taches et rayures : le sujet annoncé était absent. La
  nouvelle est un parquet massif ancien en lumière rasante, avec usure, joints noircis,
  marques localisées et variations de teinte entre lames. Le défaut est visible sans être
  spectaculaire.

## À faire

- Remplacer progressivement ces images par des **photographies de chantiers réels**
  (détails de lames, mesures d'humidité, jonctions, supports) : elles seront plus justes
  et plus crédibles.
- `degat-eaux.jpg` sert actuellement deux pages différentes, faute de visuel adapté à
  l'humidité. À dédoublonner.
- Consigner ici toute nouvelle image ou vidéo ajoutée, avec sa source, son auteur, sa
  licence et sa date de récupération.
