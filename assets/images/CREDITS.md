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

---

## Photographies hors sujet — constat du 11/09/2026

Chaque fichier a été **ouvert et regardé** pour rédiger les textes alternatifs
(`tools/images.mjs`). Quatre visuels ne montrent pas le sujet de la page où ils
sont employés. Ce n'est pas une question de goût : un lecteur d'écran ne peut
pas en recevoir une description honnête, et un visiteur voyant n'y trouve pas ce
que le titre annonce.

| Fichier | Ce que le fichier montre réellement | Où il est employé |
| --- | --- | --- |
| `degat-eaux.jpg` | Une flaque d'eau boueuse en forêt, avec des bottes. Aucun parquet. | Pages *Humidité* et *Dégât des eaux*, article humidité, carrousel — **11 pages** |
| `taches.jpg` | Un grand parquet clair en bon état. Aucune tache, aucune rayure. | Hero *Parquet abîmé : taches et rayures* |
| `parquet-ancien.jpg` | Une pièce neuve et vide, au sol stratifié gris. | Catégorie *Rénovation*, carrousel *Parquet ancien* |
| `soulevement.jpg` | Des planches plates et régulières. Aucun bombement, aucun tuilage. | Page *Parquet qui gondole*, article associé |

En attendant leur remplacement, ces quatre images sont déclarées **décoratives**
(`alt=""`) plutôt que décrites par le titre de la page : leur donner un texte
alternatif conforme au sujet reviendrait à écrire quelque chose de faux.

Quatre autres visuels sont des **textures** employées comme aplats — ils ne
prétendent rien montrer et sont légitimement décoratifs : `domaine-diagnostic`,
`domaine-desordres`, `grincement`, `parquet-detail`.

Neuf visuels montrent bien leur sujet et portent désormais une description :
`hero-wide`, `architectural`, `interieur-clair`, `inspection`, `entretien`,
`lames-bougent`, `rayures`, `pose-support`.

**Conclusion.** Le problème de la bibliothèque n'est pas seulement le recyclage
(`degat-eaux.jpg` sur 11 pages sur 26) mais la pertinence. Des photographies de
chantiers réels — détails de lames, mesures d'humidité, jonctions, supports —
régleraient les deux d'un coup. Aucune banque d'images ne fournira un tuilage de
lame crédible.

## Variantes responsives

`assets/images/r/` contient les déclinaisons générées par
`python tools/make-images.py` : 480, 768, 1200 et 1600 px de large, sans jamais
dépasser la taille de l'original. 57 fichiers au 11/09/2026.

Ces variantes ne sont **pas** retouchées à la main. Après avoir ajouté ou
remplacé une photographie, relancer le script puis `node tools/build.mjs` :
`tools/images.mjs` lit les dimensions réelles dans l'en-tête des fichiers et
construit le `srcset` d'après les variantes présentes sur le disque.

## Correction du 11/09/2026 sur les fichiers sources

Les deux masters `expert-parquet-mark.png` (821 Ko) et `expert-parquet-logo.png`
(409 Ko) sont décrits plus haut comme « non servis aux visiteurs ». C'est
inexact : l'hébergement actuel publie l'intégralité du dépôt, et les deux
fichiers répondent en HTTP 200. Ils restent les masters à conserver ; c'est leur
**déploiement** qu'il faudra exclure, pas leur présence dans le dépôt.

---

## Mise à jour du 11/09/2026

### `degat-eaux.jpg` — retirée du projet

C'était la seule image de la bibliothèque qui ne montrait **pas un sol** : une
flaque d'eau boueuse en forêt, avec des bottes. Elle illustrait les pages
*Humidité* et *Dégât des eaux*, l'article humidité et deux diapositives du
carrousel — onze pages sur vingt-six. Le fichier a été supprimé et ses emplois
répartis :

| Emploi | Nouvelle image |
| --- | --- |
| Page *Humidité*, article humidité, carrousel « Humidité persistante » | `parquet-chevrons.jpg` |
| Page *Dégât des eaux*, carrousel « Après un dégât des eaux » | `rayures.jpg` |

### `parquet-chevrons.jpg` — ajoutée

| | |
| --- | --- |
| **Source** | <https://www.pexels.com/photo/36178801/> |
| **Licence** | Licence Pexels — usage libre, y compris commercial, attribution non obligatoire : <https://www.pexels.com/license/> |
| **Récupérée le** | 11/09/2026 |
| **Dimensions** | 1800 × 1200 (recadrage paysage demandé au CDN Pexels) |
| **Poids** | 140 Ko |
| **Texte alternatif** | « Parquet en damier au ras du sol, à la jonction d'un mur et de sa plinthe, traversé par une bande de lumière » |

Pourquoi celle-ci : c'est un **vrai parquet**, photographié au ras du sol, où
l'on distingue le motif, les joints, la plinthe et l'angle de mur — c'est-à-dire
précisément ce dont le site parle (jeu périphérique, calepinage). Elle sert
aussi de couverture à l'article *Massif ou contrecollé*.

### Recherche de remplacements : résultat négatif, et c'est une information

Les trois autres visuels signalés hors sujet — `taches.jpg`,
`parquet-ancien.jpg`, `soulevement.jpg` — **n'ont pas été remplacés**.

Six requêtes distinctes ont été passées sur Pexels : *water damaged wood floor*,
*damaged parquet floor*, *old worn wooden floor*, *scratched wooden floor*,
*wet wooden floor*, *herringbone parquet floor*. Toutes renvoient le **même
fonds d'environ huit photographies génériques** — textures de bois, écorces
d'arbre, pièces vides. Aucune ne montre un bombement, un tuilage, une tache
d'humidité ou une usure de parquet.

Conclusion : **les banques d'images généralistes n'ont pas d'inventaire de
pathologies de parquet.** Les remplacer par d'autres photographies génériques
n'aurait rien changé — sinon les pixels. Ils restent donc déclarés décoratifs
(`alt=""`), ce qui est la position honnête : ce sont bien des parquets, ils ne
montrent simplement pas le désordre dont parle la page.

Seule une campagne de prises de vue sur chantiers réels réglera ce point. C'est
aussi ce qui distinguerait durablement le site de ses concurrents, qui puisent
dans le même fonds.
