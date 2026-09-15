# Expert Parquet — expert-parquet.com

Site éditorial et de conversion consacré au **diagnostic et à l'expertise de parquet**.
Objectif : permettre à un visiteur d'identifier son problème, de comprendre ce qui le
provoque, puis de demander une expertise ou un devis.

Projet **totalement indépendant** : aucune dépendance à un autre site, aucun contenu
repris ailleurs, identité graphique et composants propres.

---

## 1. Objectif et parcours

```
Problème constaté → Comprendre → Pré-diagnostic → Expertise → Demande de devis
```

Trois portes d'entrée mènent au même point de conversion :

- les **pages « problème »** (un symptôme = une page) ;
- le **pré-diagnostic interactif** (5 questions, orientation générale) ;
- les **articles de conseils** (SEO longue traîne).

---

## 2. Stack

| Élément | Choix | Raison |
| --- | --- | --- |
| Balisage | HTML5 statique | Rendu immédiat, aucun runtime, hébergement trivial |
| Styles | CSS moderne, fichiers séparés | Variables CSS, `:has()`, `clamp()`, container queries non nécessaires |
| Scripts | JavaScript ES modules natifs | Pas de bundler, pas de dépendance, chargement différé natif |
| Polices | Google Fonts (Inter Tight + Inter) | Une seule famille, deux optiques ; `preconnect` + `display=swap` |
| Génération | Node ≥ 18 (`tools/`) | Outillage de développement uniquement, non livré au navigateur |

**Aucune dépendance npm. Aucun framework. Aucun build obligatoire pour servir le site.**

React n'a pas été retenu : le site est éditorial, les seules zones interactives
(pré-diagnostic, formulaires, carrousel, liste à survol) tiennent en quelques modules
ES de moins de 300 lignes chacun.

### Direction artistique

Cabinet d'expertise plutôt que blog de bricolage : grandes surfaces presque
monochromes, typographie grotesque à grande échelle **en graisse normale**, angles
droits, filets plutôt que bordures fermées, aucune ombre décorative. L'accent terre
cuite est volontairement rare — CTA, quelques numéros, états d'interaction — et ne
teinte jamais une surface entière.

Trois règles structurent le reste :

1. **Pas de grille de petites cartes.** Une information qui mérite de l'impact reçoit
   une grande image, une grande typographie ou une ligne pleine largeur.
2. **Pas de micro-label capitale coloré au-dessus de chaque titre.** L'intitulé de
   section (`.kicker`) est en casse normale, sobre, et n'apparaît que là où il informe.
3. **Chaque grande section a sa propre composition** — hero immersif, manifeste,
   lignes alternées, liste numérotée, panneau sombre, carrousel, grille magazine.

---

## 3. Lancer le site

Le site est composé de fichiers statiques. N'importe quel serveur HTTP convient :

```bash
npx http-server . -p 8477 -c-1
```

Puis ouvrir <http://localhost:8477>.

> Les chemins sont **relatifs** : le site fonctionne aussi bien à la racine d'un domaine
> que dans un sous-dossier. L'ouverture directe des fichiers en `file://` fonctionne
> pour la navigation, mais les modules ES sont bloqués par la politique CORS des
> navigateurs — un serveur HTTP est donc nécessaire pour tester les parties interactives.

---

## 4. Régénérer les pages

Les 26 pages partagent le même header, le même footer et les mêmes blocs. Elles sont
générées à partir des fichiers de contenu du dossier `tools/` :

```bash
node tools/build.mjs
```

La commande réécrit tous les fichiers HTML, `sitemap.xml` et `robots.txt`.

### Préproduction et production

Le build connaît deux environnements. Le défaut est la **préproduction** :

```bash
node tools/build.mjs                 # préproduction : pages en noindex
BUILD_ENV=prod node tools/build.mjs  # production : pages indexables
```

Le défaut est volontairement le plus prudent. Le site n'a qu'un seul artefact —
le HTML versionné, publié par `git push` — et si le défaut était `prod`, un
simple oubli de variable rendrait une préproduction indexable sans que rien ne
le signale. Avec ce défaut, l'oubli produit l'erreur inverse : une production en
`noindex`, qui se voit tout de suite. Le build affiche l'environnement retenu à
chaque lancement.

Ce qui change : la balise `<meta name="robots">` de chaque page et le contenu de
`robots.txt`. Ce qui ne change pas : la balise canonique, les `og:url` et les URL
du sitemap, qui désignent toujours le domaine définitif.

Contrôle qualité automatique (liens, ancres, images, alt, H1, métadonnées, JSON-LD,
CSS/JS inline, cohérence du sitemap) :

```bash
node tools/check.mjs
```

> Le HTML généré est le livrable : il peut être édité directement si l'on renonce au
> générateur. Dans ce cas, supprimer `tools/` et maintenir les pages à la main.

### Régénérer le logo et les favicons

Les deux masters de l'identité vivent dans `assets/brand/` :
`expert-parquet-mark.png` (symbole) et `expert-parquet-logo.png` (logotype
horizontal). Toutes les déclinaisons servies au visiteur en sont dérivées :

```bash
node tools/make-icons.mjs
```

Ne pas retoucher les fichiers produits à la main : ils seraient écrasés au prochain
lancement. Pour changer le logo, remplacer un master puis relancer la commande.

### Régénérer les variantes responsives des photographies

Les photographies sont servies en `srcset` à partir de variantes 480 / 768 /
1200 / 1600 px, rangées dans `assets/images/r/` :

```bash
python tools/make-images.py
```

Ce script est le seul du projet à ne pas être écrit en Node, et pour une raison
précise : il décode et réencode du JPEG, ce qui suppose une transformée en
cosinus discrète et un décodage Huffman. Pillow fait ce travail de manière
éprouvée ; l'écrire à la main serait beaucoup de code fragile pour un gain nul.
La règle « zéro dépendance » du projet porte sur ce qui est **servi au
navigateur**, pas sur l'outillage local.

Si Pillow est absent, le script s'arrête proprement et le site continue de
fonctionner : `tools/images.mjs` n'émet un `srcset` que pour les variantes
réellement présentes sur le disque.

Après avoir ajouté une photographie, penser à la déclarer dans le dictionnaire
de `tools/images.mjs` — le build échoue explicitement sur une image inconnue,
plutôt que de produire une page avec un `alt` vide en silence.

---

## 5. Structure

```
expert-parquet.com/
├── index.html                    Accueil
├── pages/
│   ├── expertise.html            Expertise parquet
│   ├── diagnostic.html           Diagnostic + pré-diagnostic
│   ├── problemes.html            Hub des symptômes
│   ├── conseils.html             Hub éditorial
│   ├── devis.html                Demande d'expertise (4 étapes)
│   ├── contact.html              Contact court
│   ├── a-propos.html             Positionnement
│   ├── faq.html                  FAQ complète
│   ├── mentions-legales.html     Gabarit légal à compléter
│   ├── problemes/                7 pages symptôme
│   └── conseils/                 4 pages catégorie
├── articles/                     5 articles de fond
├── assets/
│   ├── brand/                    Logo : masters + déclinaisons générées
│   ├── images/                   Photographies (+ CREDITS.md)
│   ├── icons/                    Favicons PNG + ICO + apple-touch-icon
│   └── video/                    Vide — voir VIDEO_BRIEF.md
├── css/
│   ├── variables.css             Design tokens (source unique)
│   ├── reset.css
│   ├── base.css                  Typographie, utilitaires
│   ├── layout.css                Conteneurs, grilles, header, footer
│   ├── components.css            Boutons, listes éditoriales, carrousel, formulaires…
│   └── pages/                    home.css, article.css, diagnostic.css
├── js/
│   ├── main.js                   Point d'entrée unique
│   ├── config/                   site.js, options.js, diagnostic-rules.js
│   └── modules/                  navigation, diagnostic, forms, carousel,
│                                 index-list, accordion, toc, animations,
│                                 contact-info, sticky-cta
├── tools/                        Générateur, empreintes, contrôle qualité (dev only)
├── robots.txt
├── sitemap.xml
├── ARCHITECTURE.md
├── TODO-INTEGRATIONS.md
├── VIDEO_BRIEF.md
│
├── backend/                      ⚠ NE FAIT PAS PARTIE DU SITE PUBLIÉ
│   ├── public/                   WordPress (API + back-office) — racine de api.expert-parquet.test
│   ├── docs/                     ARCHITECTURE, DATABASE, API, SECURITY, LOCAL-DEVELOPMENT, PRODUCTION-CHECKLIST
│   ├── config/                   Copies de référence de la configuration Apache
│   ├── scripts/                  verifier-enums.php (contrôle du contrat front/back)
│   └── README.md                 Point d'entrée du backend
│
└── backend-private/              ⚠ DONNÉES PRIVÉES — jamais publiées, jamais versionnées
    ├── photos/                   Photographies des demandes
    ├── logs/                     Journaux (courriels, suppressions, débogage)
    └── IDENTIFIANTS.txt          Identifiants locaux
```

### Le site, le backend, et ce qui les sépare

Tout le projet tient dans un seul dossier, mais **le site publié n'est que la
racine** : `index.html`, `pages/`, `articles/`, `assets/`, `css/`, `js/`.

`backend/` et `backend-private/` partagent ce dossier sans faire partie du
site. Ils sont tenus à l'écart par trois moyens indépendants :

- le VirtualHost `expert-parquet.test` **refuse ces deux chemins** (404 sur
  l'URL, `Require all denied` sur les répertoires, `AllowOverride None`) ;
- le générateur (`tools/build.mjs`, `tools/check.mjs`) ne les parcourt pas :
  ils n'apparaissent ni dans les pages, ni dans `sitemap.xml` ;
- WordPress a son propre hôte, `api.expert-parquet.test`, dont la racine est
  `backend/public` — un visiteur ne voit jamais `expert-parquet.test/backend/`.

`backend-private/` contient des données personnelles de tiers et des
identifiants : il est exclu de Git et ne doit jamais être copié dans le site
ni dans `backend/public`.

---

## 6. Personnalisation

### Coordonnées et informations d'entreprise

Un seul fichier : **`js/config/site.js`**.

```js
export const CONTACT = {
  email: null,   // → remplacer par 'contact@expert-parquet.com'
  phone: null,
  address: null,
  hours: null,
  coverage: null,
};
```

Tant qu'une valeur vaut `null`, l'interface affiche `[À renseigner]` au lieu d'une
information inventée. Les emplacements sont marqués `data-contact="…"` dans le HTML.

### Design system

Tout est centralisé dans **`css/variables.css`** : couleurs, typographies, tailles,
espacements, rayons, durées d'animation, hauteurs de header.
Changer la teinte d'accent se fait sur une seule ligne (`--color-terra`).

### Listes de choix des formulaires

Un seul fichier : **`js/config/options.js`** (problèmes, types de parquet, supports,
surfaces, délais…). Les `<select>` et grilles de cases sont peuplés depuis ces listes
via l'attribut `data-options`, ce qui interdit toute divergence entre pages.

### Contenu du pré-diagnostic

**`js/config/diagnostic-rules.js`** : une entrée par symptôme (titre, résumé, pistes,
vérifications) plus les notes liées au type de parquet, au support et à l'ancienneté.

### Ajouter une page « problème »

Ajouter une entrée dans `PROBLEM_PAGES` (`tools/content/problem-pages.mjs`) puis
relancer `node tools/build.mjs`. La page, son fil d'Ariane, ses données structurées et
son entrée de sitemap sont produits automatiquement.

---

## 7. État actuel

Le site est **complet côté front**, et un backend existe désormais dans le projet
dossier `backend/public` — une installation WordPress dédiée qui ne publie
aucune page et sert uniquement d'API, de stockage et d'administration. Les articles et
le référencement restent gérés ici, par le générateur statique.

Le site est livré **en mode démonstration** : le raccordement est écrit et vérifié de
bout en bout, mais les points d'envoi valent `null`.

- Les formulaires **ne sont connectés à aucun serveur** : à la validation, ils affichent
  exactement les données qui seraient transmises. Rien ne quitte le navigateur, et
  l'interface le dit explicitement.
- Renseigner un point d'envoi dans `js/config/site.js` bascule **en même temps** le
  comportement et tous les textes qui en parlent, page de confidentialité comprise.
  `node tools/check.mjs` refuse la construction tant que le responsable du traitement,
  son adresse et la durée de conservation ne sont pas renseignés.
- Les photos sélectionnées dans le formulaire de devis sont **prévisualisées localement
  et jamais téléversées**.
- Les coordonnées, mentions légales, tarifs et zone d'intervention sont des
  **placeholders explicites**.

La liste complète des branchements à faire figure dans
[TODO-INTEGRATIONS.md](TODO-INTEGRATIONS.md).

---

## 8. Crédits images

Les photographies proviennent de Pexels (licence libre). Sources détaillées :
[assets/images/CREDITS.md](assets/images/CREDITS.md).
