# Crédits photographiques

Toutes les images de ce dossier proviennent de **[Pexels](https://www.pexels.com)** et
sont utilisables gratuitement, y compris à des fins commerciales, sans attribution
obligatoire ([licence Pexels](https://www.pexels.com/license/)). Les sources sont
néanmoins listées ici par honnêteté et pour permettre de retrouver l'original.

Le **nom du photographe n'a pas pu être relevé automatiquement** (l'API Pexels n'était
pas accessible depuis l'environnement de développement). Chaque page liée ci-dessous
l'indique ; à compléter avant mise en ligne si une attribution est souhaitée.

| Fichier | Usage principal | Source |
| --- | --- | --- |
| `hero.jpg` | Hero de la page d'accueil, image Open Graph par défaut | <https://www.pexels.com/photo/17181935/> |
| `parquet-detail.jpg` | Page *Expertise parquet* | <https://www.pexels.com/photo/9285783/> |
| `inspection.jpg` | Page *Diagnostic parquet* | <https://www.pexels.com/photo/5973909/> |
| `grincement.jpg` | Page *Parquet qui grince*, article associé | <https://www.pexels.com/photo/10900708/> |
| `soulevement.jpg` | Page *Parquet qui gondole*, article associé | <https://www.pexels.com/photo/172291/> |
| `lames-bougent.jpg` | Page *Lames qui bougent* | <https://www.pexels.com/photo/6364752/> |
| `degat-eaux.jpg` | Pages *Humidité* et *Dégât des eaux*, article humidité | <https://www.pexels.com/photo/12519041/> |
| `taches.jpg` | Page *Parquet abîmé : taches et rayures* | <https://www.pexels.com/photo/129731/> |
| `rayures.jpg` | Article *Peut-on rénover un parquet très abîmé ?* | <https://www.pexels.com/photo/6044253/> |
| `pose-support.jpg` | Page *Défaut de pose*, catégorie *Pose*, article support | <https://www.pexels.com/photo/20818874/> |
| `parquet-ancien.jpg` | Catégorie *Rénovation* | <https://www.pexels.com/photo/11018239/> |
| `entretien.jpg` | Catégorie *Entretien* | <https://www.pexels.com/photo/4440568/> |
| `interieur-clair.jpg` | Page *À propos*, catégorie *Choisir un parquet* | <https://www.pexels.com/photo/7027720/> |
| `hero-wide.jpg` | Bloc « L'expertise commence par l'observation » (accueil) | <https://www.pexels.com/photo/2082093/> |
| `architectural.jpg` | Domaine « Expertise avant intervention » (accueil) | <https://www.pexels.com/photo/15758635/> |
| `observation.jpg` | Carrousel « Après un dégât des eaux », page *Dégât des eaux* | <https://www.pexels.com/photo/3750272/> |
| `domaine-diagnostic.jpg` | Réserve — détail de lames | <https://www.pexels.com/photo/326311/> |
| `domaine-desordres.jpg` | Domaine « Désordres et défauts » (accueil) | <https://www.pexels.com/photo/2530326/> |
| `domaine-expertise.jpg` | Réserve — intérieur clair rénové | <https://www.pexels.com/photo/6890405/> |

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

## À faire

- Remplacer progressivement ces images par des **photographies de chantiers réels**
  (détails de lames, mesures d'humidité, jonctions, supports) : elles seront plus justes
  et plus crédibles.
- `degat-eaux.jpg` sert actuellement deux pages différentes, faute de visuel adapté à
  l'humidité. À dédoublonner.
- Consigner ici toute nouvelle image ou vidéo ajoutée, avec sa source, son auteur, sa
  licence et sa date de récupération.
