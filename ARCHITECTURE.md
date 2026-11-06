# Architecture — Expert Parquet

Document technique. Pour l'installation et la personnalisation courante, voir
[README.md](README.md).

---

## 1. Routes

### Pages principales

| URL | Rôle | Intention de recherche |
| --- | --- | --- |
| `/index.html` | Accueil, page de conversion | marque, « problème parquet » |
| `/pages/trouver-mon-parquet.html` | Moteur « Trouver mon parquet » : critères → produits réels, catégorie, enseigne (§24) | « trouver un parquet », « quel parquet choisir » |
| `/pages/expertise.html` | Ce qu'est une expertise, quand la demander | « expertise parquet » |
| `/pages/diagnostic.html` | Méthode + pré-diagnostic guidé | « diagnostic parquet », « pourquoi mon parquet bouge » |
| `/pages/problemes.html` | Hub des symptômes | « problèmes de parquet » |
| `/pages/conseils.html` | Hub éditorial + catégories | « conseils parquet » |
| `/pages/devis.html` | Formulaire 4 étapes | « devis expertise parquet » |
| `/pages/contact.html` | Contact court + FAQ contact | marque |
| `/pages/a-propos.html` | Positionnement | marque |
| `/pages/faq.html` | FAQ complète, 3 groupes | questions longue traîne |
| `/pages/mentions-legales.html` | Gabarit légal | — |

### Pages « problème » (`/pages/problemes/`)

`parquet-qui-grince` · `parquet-gondole` · `lames-qui-bougent` · `humidite` ·
`parquet-abime` · `degat-des-eaux` · `defaut-de-pose`

Toutes suivent la **même trame**, ce qui les rend duplicables sans effort :

```
Hero image + fil d'Ariane
Symptômes observés
Causes possibles          (formulées au conditionnel, jamais affirmatives)
Erreurs fréquentes
Premières vérifications   (réalisables sans outillage)
Quand demander une expertise
Encadré « portée de cette page »
FAQ (accordéon + JSON-LD FAQPage)
Contenus associés
Bandeau CTA
```

### Pages catégorie (`/pages/conseils/`)

`entretien` · `renovation` · `pose` · `choisir-parquet`

Contenu éditorial réel (et non une simple liste de liens), sommaire latéral,
articles associés.

### Articles (`/articles/`)

`pourquoi-un-parquet-grince` · `parquet-qui-se-souleve-que-faire` ·
`humidite-et-parquet-signes-qui-alertent` · `renover-un-parquet-tres-abime` ·
`pourquoi-le-support-est-essentiel`

---

## 2. Générateur

Le HTML livré est statique. Il est produit par `tools/build.mjs` (Node ≥ 18, zéro
dépendance) à partir de GABARITS (`tools/content/*.mjs`) et d'un INSTANTANÉ ÉDITORIAL
(`data/content/snapshot.json`) exporté de WordPress — voir §25. Les modules de
contenu ne contiennent plus de texte : ils lisent l'instantané et le mettent en forme.

```
tools/
├── build.mjs            Orchestration + sitemap + robots
├── check.mjs            Contrôle qualité (voir §9)
├── make-icons.mjs       Déclinaisons du logo et des favicons (voir §12)
├── layout.mjs           <head>, header, footer, breadcrumb, JSON-LD
├── partials.mjs         Icônes SVG, liste éditoriale, CTA, processus,
│                        cartes d'articles, accordéon FAQ, en-têtes de page
├── publish.mjs          Instantané → build → contrôle, avec restauration (§25)
├── cms/
│   ├── snapshot.mjs     Lecture typée de l'instantané (conseils, problèmes, FAQ, pages…)
│   ├── html.mjs         HTML éditorial → conventions du site (liens, icônes, blocs)
│   ├── fetch-snapshot.mjs  Récupère l'instantané et les médias depuis WordPress
│   └── migration/contenu-initial.json  Ce qui a été importé dans WordPress (trace)
└── content/
    ├── home.mjs         Accueil (champs de la page « Accueil »)
    ├── core-pages.mjs   Expertise, diagnostic, hubs, à propos, FAQ, légal
    ├── form-pages.mjs   Devis, contact
    ├── problem-pages.mjs Pages symptôme (type Problème → gabarit)
    ├── advice-pages.mjs  Pages guide (type Conseil, format guide)
    ├── articles.mjs      Articles (type Conseil, format article)
    ├── sortie.mjs        Parcours de sortie → encart et bandeau
    └── graph.mjs         Contenus associés
```

Chaque module exporte une fonction qui renvoie des objets page :

```js
{
  path,        // 'pages/expertise.html'
  depth,       // 1 → préfixe relatif '../'
  title, description, css, ogImage, navCurrent, jsonLd, body
}
```

`renderPage()` assemble le document complet. Les chemins sont calculés par `rel(depth, …)`
pour rester **relatifs** quel que soit le niveau de profondeur du fichier.

---

## 3. CSS

Chargement, dans cet ordre (l'ordre compte pour la cascade) :

```
variables.css → reset.css → base.css → layout.css → components.css → pages/*.css
```

| Fichier | Contenu |
| --- | --- |
| `variables.css` | **Source unique** : couleurs de marque, rôles sémantiques, typographies, échelle fluide, espacements, conteneurs, rayons, ombres, durées, header, z-index |
| `reset.css` | Reset minimal, `:focus-visible`, `prefers-reduced-motion` |
| `base.css` | Titres, texte, liens, listes riches, `.visually-hidden`, `.skip-link`, utilitaires |
| `layout.css` | `.container`, `.section`, grilles, `.split`, header, drawer mobile, fil d'Ariane, footer |
| `components.css` | Boutons, badges, media, cartes d'article, encadrés, colonnes d'étapes, liste éditoriale, carrousel, formulaires, bandeau CTA, accordéon, `[data-reveal]` |
| `pages/home.css` | En-têtes de page (`page-hero`), FAQ en deux colonnes, magazine et hub conseils ; le hero d'accueil historique y reste pour les pages qui l'emploient |
| `pages/hub.css` | Accueil « hub » : hero compact et ses trois parcours, section et interface du moteur, cartes résultat, tuiles problèmes, trio conseils, bandeau expertise |
| `pages/article.css` | Gabarit éditorial : `.prose`, sommaire, colonne latérale, panneaux symptômes |
| `pages/diagnostic.css` | Pré-diagnostic, formulaire devis multi-étapes, récapitulatif, page contact |

### Conventions

- Nommage **BEM allégé** : `.block__element--modifier`.
- Aucune valeur de couleur, d'espacement ou de durée codée en dur hors `variables.css`
  (seule exception documentée : les largeurs dans les `@media`, que CSS n'autorise pas
  à écrire avec `var()`).
- **Aucun `style=""`, aucun `<style>`, aucun script inline** — vérifié par `check.mjs`.

### Pièges corrigés, à connaître avant de modifier

1. **`overflow-x: hidden` sur `body`.** Il transforme `body` en conteneur de
   défilement : `window.scrollY` reste figé et le `sticky` du header se comporte mal.
   Le fichier utilise `overflow-x: clip` derrière un `@supports`, qui coupe le
   débordement sans créer de scroller.
2. **`backdrop-filter` sur le header.** Il crée un bloc conteneur pour les descendants
   en `position: fixed`, ce qui casse le drawer mobile (il se retrouve haut de 130 px
   au lieu de la hauteur du viewport). Le header n'en porte plus.
3. **Ordre de cascade et `.btn`.** `components.css` est chargé après `layout.css` :
   masquer un bouton depuis `layout.css` demande une spécificité renforcée
   (`.header__actions .header__cta-desktop`), sans quoi `display: inline-flex` de
   `.btn` l'emporte.
4. **`max-width` en `ch` sur un conteneur.** L'unité se calcule dans la police du
   conteneur, pas dans celle du titre : la limite de mesure doit être posée sur
   l'élément typographique lui-même (`.article-head__title`, pas `.article-head`).
5. **Contraste du gris secondaire.** `--color-stone-2` doit rester ≥ 4,5:1 sur le fond
   ivoire (actuellement 4,9:1). Sur fond sombre, `.section--inverse` bascule les textes
   secondaires vers `--text-inverse-muted`.
6. **Le header crée un contexte d'empilement.** Il est `position: fixed` avec un
   `z-index`. Le `z-index` du drawer, qui est son descendant, est donc **local** à ce
   contexte : il ne peut pas rivaliser avec l'overlay, enfant direct de `<body>`.
   L'overlay à 190 passait devant tout le header à 100 — liens, CTA et bouton de
   fermeture compris — et comme il est `pointer-events: auto` à l'ouverture, chaque tap
   atterrissait sur lui, refermant le menu au lieu de suivre le lien. Correctif :
   `body.nav-open .site-header { z-index: var(--z-drawer); }` élève le header au-dessus
   de l'overlay, et l'ordre interne du header se règle avec des valeurs locales (drawer
   `z-index: 1`, `.header__actions` `z-index: 2` pour garder le bouton de fermeture
   au-dessus du panneau).
7. **Les SVG en ligne doivent porter `width` et `height`.** `reset.css` applique
   `display: block; max-width: 100%; height: auto` à tous les `svg`. Un SVG qui n'a
   qu'un `viewBox` n'a aucune dimension intrinsèque : il occupe alors toute la largeur
   de son conteneur, et sa hauteur suit le rapport du viewBox. Une icône de 16 px se
   retrouvait affichée en 832 × 832 dans un paragraphe. Les attributs sont portés par
   `ICONS` dans `tools/partials.mjs` ; ne pas les retirer.
8. **Un `.nav__link` coloré par l'état du header.** `.site-header--over.is-scrolled
   .nav__link` (spécificité 0,3,0) écrasait la règle du drawer (0,1,0), média requête
   comprise — les média requêtes n'ajoutent pas de spécificité. Sur l'accueil défilé,
   les liens du drawer étaient peints en `--text-strong` #17181A sur un fond #17181A.
   Ces règles de contraste sur hero sont désormais bornées à `min-width: 1025px`.

---

## 4. JavaScript

`js/main.js` est le **seul** script chargé par les pages
(`<script type="module">`, donc différé nativement). Il appelle chaque module dans un
`try/catch` : une erreur isolée ne casse pas le reste de la page.

| Module | Point d'ancrage | Rôle |
| --- | --- | --- |
| `navigation.js` | `[data-nav-toggle]`, `[data-nav]` | Drawer mobile (piège de focus, `Escape`, `inert`, overlay), état du header au scroll |
| `contact-info.js` | `[data-contact="…"]` | Injecte les coordonnées réelles, **ou masque le bloc** si l'information n'est pas fournie (voir §14) |
| `sticky-cta.js` | `[data-sticky-cta]` | Rappel d'action mobile : visible seulement entre le hero et le bandeau final (voir §15) |
| `animations.js` | `[data-reveal]` | Apparition au scroll via `IntersectionObserver`, désactivée si `prefers-reduced-motion` |
| `accordion.js` | `[data-accordion]` | FAQ accessible : `aria-expanded`, flèches haut/bas, `Home`/`End`, ouverture par ancre |
| `carousel.js` | `[data-showcase]` | Carrousel « Situations à analyser » : scroll natif + `scroll-snap`, boutons, clavier, compteur 01/05, barre de progression. Mesures mises en cache au redimensionnement pour ne pas dépendre de `requestAnimationFrame` |
| `toc.js` | `[data-toc]` | Génère le sommaire depuis les `h2[id]`/`h3[id]`, surligne la section lue |
| `diagnostic.js` | `[data-diagnostic]` | Pré-diagnostic (voir §6). Quand un remplacement peut être envisagé, sa sortie mène au moteur « Trouver mon parquet » avec la pièce et le type déjà connus (`?piece=…&type=…&via=pre-diagnostic`) |
| `finder.js` | `[data-finder]`, `[data-finder-start]` | Moteur « Trouver mon parquet » : cinq questions au plus, résultats produits réels, replis catégorie puis enseigne (voir §24). Aucune règle métier dans le module |
| `tracking.js` | `a[data-event]` | Suivi première partie sans réseau : `recommendation_result`, `product_click`, `partner_click` publiés par `CustomEvent('ep:track')` et dans `window.epTrack` (voir §24) |
| `forms.js` | `[data-form]`, `[data-options]`, `[data-upload]` | Peuplement, validation, étapes, photos, récapitulatif, soumission (voir §7) |

Tous les modules sont **défensifs** : sans point d'ancrage dans le DOM, ils ne font rien.
Une même page n'en active donc que ce dont elle a besoin.

---

## 5. Design system

Résumé des tokens (`css/variables.css`) :

- **Couleurs** — blanc minéral `#F6F5F3`, gris pierre `#EFEEEB` / `#E4E2DE`, gris
  moyen `#6E6B66`, graphite `#4A4845`, noir doux `#17181A`. Accent terre cuite
  `#B04A1E`, **rare par construction** : CTA, quelques numéros, états d'interaction.
  Aucune surface entière n'est teintée en accent.
- **Typographie** — *Inter Tight* (titres) + *Inter* (texte) : une seule famille, deux
  optiques. Aucune serif : c'est elle qui produisait l'effet « magazine ». Les titres
  sont grands **et** en graisse normale (400/500) — c'est ce réglage qui donne la
  lecture architecturale plutôt que publicitaire.
- **Échelle** — peu de tailles, grands écarts : `--fs-hero` (jusqu'à 7,5 rem),
  `--fs-d1`, `--fs-d2`, `--fs-h3`, puis le texte. Tout en `clamp()`.
- **Espacements** — échelle 4 px (`--space-3xs` … `--space-4xl`) + trois rythmes de
  section (`--section-y-tight` / `--section-y` / `--section-y-large`).
- **Rayons** — 0 partout, sauf les boutons en pilule. `--radius-xs` (2 px) en réserve.
- **Ombres** — quasi inexistantes : la profondeur vient du contraste et des filets.
- **Animation** — 4 durées, 2 courbes ; toutes réduites à `0.01ms` sous
  `prefers-reduced-motion`.

Composants disponibles : boutons (7 variantes × 3 tailles), badges, media ratios,
cartes d'article (standard, vedette, ligne), encadrés (`callout`, `disclaimer`),
colonnes d'étapes numérotées (`.stages`), liste éditoriale numérotée
(`.index-list`), carrousel plein format (`.showcase`), champs de formulaire
soulignés, tuiles de choix, zone de dépôt de photos, stepper, bandeau CTA, chips de
filtre, accordéon, rappel d'action mobile (`.sticky-cta`, voir §15).

Le composant `placeholder-value` a été retiré : plus aucune page publique n'affiche
de valeur à renseigner (voir §14).

### Compositions de page d'accueil (`css/pages/hub.css`)

L'accueil est un **hub d'orientation** : il attire par le problème, le diagnostic et
les conseils ; il qualifie le besoin ; il propose les vrais parquets correspondants ;
puis il envoie précisément chez Premibel ou Over Parquet. L'expertise n'est gardée
que pour les situations qui la nécessitent. Tout découle de trois intentions posées
dans le premier écran (`tools/hub-blocks.mjs`) :

1. `hub-hero` + `parcours` — titre, promesse et trois cartes : **Trouver mon parquet**
   (ouvre le moteur), **Approvisionner mon chantier** (le même moteur en mode
   professionnel, étiqueté « Professionnels »), **Analyser mon problème** (le
   pré-diagnostic). Les cartes tiennent sous 900 px de haut à 1440 px de large ; sur
   téléphone, la première carte et son bouton sont dans le premier écran ;
2. `finder-teaser` — une introduction compacte au moteur (§24), qui vit sur sa page
   `pages/trouver-mon-parquet.html` et n'est jamais ouvert par défaut sur l'accueil ;
3. `problem-grid` — quatre problèmes fréquents, puis « voir tous les problèmes » ;
4. `advice-trio` — trois conseils, puis « voir tous les conseils » ;
5. `expertise-band` — un bandeau court : « Votre situation nécessite une analyse
   humaine ? », le seul bouton « Demander une expertise » de la page ;
6. `faq-split` — trois questions ; puis le pied de page compact.

Ce qui n'y est plus : la section « partenaires » (les enseignes sont les destinations
des solutions, nommées dans les cartes et les résultats), le pré-diagnostic intégré (il
vit sur `pages/diagnostic.html`), la liste des huit désordres, le magazine à grande
image, les compositions `statement`, `domain`, `observation`, `showcase`, `journey`
et `cta-band`.

Le header suit la même hiérarchie : le menu commence par « Trouver un parquet », son
unique bouton `HEADER_CTA` mène à `index.html#trouver-mon-parquet`, et le rappel
collant mobile « Demander une expertise » n'est pas émis sur l'accueil.

---

## 6. Pré-diagnostic

**Fichiers** : `js/modules/diagnostic.js` + `js/config/diagnostic-rules.js` +
`js/config/options.js`.

**Balisage requis** — un seul élément :

```html
<div data-diagnostic data-quote-url="pages/devis.html">
  <noscript>…repli éditorial…</noscript>
</div>
```

**Déroulé** — 5 étapes construites en JavaScript à partir de `STEPS` :

1. Quel problème observez-vous ? (`PROBLEMES`)
2. Depuis quand ? (`DEBUTS`)
3. Dans quelle pièce ? (`PIECES`)
4. Quel type de parquet ? (`TYPES_PARQUET`)
5. Quel support ? (`SUPPORTS`, facultatif — bouton « Passer »)

**Résultat** — assemblé depuis `ORIENTATIONS[symptôme]` :

- un titre et un résumé du mécanisme en jeu ;
- une liste de **causes possibles** ;
- une liste de **premières vérifications** ;
- des notes contextuelles issues de `NOTES_TYPE`, `NOTES_SUPPORT`, `NOTES_DEBUT` ;
- l'avertissement `DISCLAIMER`, **toujours affiché** ;
- un CTA vers le devis, avec les réponses passées en paramètres d'URL.

**Cadre éditorial, non négociable** : le module ne produit jamais de diagnostic. Les
formulations restent au conditionnel et l'avertissement suivant accompagne chaque
résultat :

> Ce pré-diagnostic constitue une première orientation et ne remplace pas une expertise
> sur place.

**Branchement futur** : la fonction `buildQuoteUrl()` sérialise déjà les réponses.
Pour envoyer le pré-diagnostic à une API, appeler l'endpoint dans `buildResult()` —
l'objet `answers` contient l'intégralité des réponses.

---

## 7. Formulaires

**Fichier** : `js/modules/forms.js`. **Configuration** : `js/config/site.js` (`FORMS`) et
`js/config/options.js`.

### Peuplement automatique

```html
<select data-options="SURFACES"></select>
<div class="choice-grid" data-options="PROBLEMES" data-control="checkbox" data-name="probleme"></div>
```

Les libellés ne sont donc écrits **qu'une fois**, dans `options.js`.

### Étapes (devis)

Quatre `fieldset[data-form-step]`. `[data-form-next]` / `[data-form-prev]` naviguent,
la validation s'exécute avant chaque passage à l'étape suivante, le focus va au titre de
l'étape et un `stepper` affiche la progression.

### Validation

Côté client, `novalidate` sur le formulaire pour maîtriser les messages :

- champs `required` (y compris cases à cocher, avec `data-error-required`) ;
- groupes de choix obligatoires (`data-required-group`) ;
- e-mail, téléphone, code postal (`data-validate="postal"`), longueur minimale ;
- messages en français dans `.field__error[role="alert"]`, `aria-invalid` positionné,
  focus donné au premier champ en erreur.

### Photos

`[data-upload]` : sélection, glisser-déposer, prévisualisation locale, suppression
unitaire, limites lues dans `FORMS` (6 fichiers, 8 Mo, JPEG/PNG/WebP).
**Aucun téléversement** tant que `FORMS.uploadEnabled` vaut `false` — et l'interface
l'indique explicitement à l'utilisateur.

### Récapitulatif

Les champs portant `data-recap-key="Libellé"` alimentent en direct le panneau latéral.

### Soumission

```js
point d'envoi === null
  → mode démonstration : le formulaire affiche le JSON qui serait envoyé
point d'envoi === 'https://…'
  → POST JSON, puis dépôt des photographies dans une seconde requête,
    gestion de l'attente, du succès, de l'erreur réseau et du refus serveur
```

Un seul interrupteur pour brancher le backend : les points d'envoi dans
`js/config/site.js`. Il commande **aussi** les textes : les mentions « formulaire de
démonstration » et la section « Données personnelles » de la page de confidentialité
sont générées à partir de cette même configuration (`tools/partials.mjs`). Sans cela,
le jour de la bascule, le site continuerait d'affirmer qu'il ne collecte rien tout en
collectant — ce que la version de démonstration promet explicitement de ne pas faire.

Détails dans [TODO-INTEGRATIONS.md](TODO-INTEGRATIONS.md) et
[docs/BACKEND-CONTRACT.md](docs/BACKEND-CONTRACT.md).

---

## 8. SEO

- HTML sémantique, **un seul `h1` par page**, hiérarchie `h2`/`h3` cohérente.
- `title` et `meta description` spécifiques, `canonical` absolu.
- Open Graph complet + Twitter Card `summary_large_image`.
- Favicons PNG 16/32 + `favicon.ico` (16/32/48) + `apple-touch-icon`, `theme-color`.
- `robots.txt` (bloque `/tools/`) et `sitemap.xml` générés, priorités différenciées.
- Fils d'Ariane visibles **et** balisés `BreadcrumbList`.
- Données structurées : `WebSite` (accueil), `Article` (articles), `FAQPage` (pages
  comportant une FAQ), `BreadcrumbList` (toutes les pages internes).
- **Aucun `Organization`** : il exigerait des informations d'entreprise réelles, qui ne
  sont pas fournies. À ajouter dans `tools/layout.mjs` une fois les données connues.
- Maillage interne : accueil → hubs → pages symptôme → articles → devis, plus des liens
  contextuels dans le corps des textes.

---

## 9. Contrôle qualité

`node tools/check.mjs` vérifie sur les 26 pages :

- liens internes et ancres (`#id`) existants, y compris inter-pages ;
- images présentes sur le disque, `alt` obligatoire, `width`/`height`, stratégie de
  chargement ;
- absence de `style=""`, de `<style>`, de script inline non JSON-LD et de gestionnaires
  `on*` ;
- un `h1` unique, `title`, `meta description`, `canonical`, Open Graph, `lang`,
  lien d'évitement ;
- JSON-LD syntaxiquement valide ;
- chaque champ de formulaire associé à un `label` ;
- **empreintes de contenu** : chaque feuille de style et le script d'entrée doivent en
  porter une, et elle doit correspondre au fichier actuel — un HTML généré avant une
  modification de CSS ou de JS est donc signalé comme « empreinte périmée » (voir §13) ;
- cohérence bidirectionnelle entre `sitemap.xml` et les fichiers présents.

---

## 10. Accessibilité

- Lien d'évitement vers `#main` sur toutes les pages.
- Drawer mobile : `aria-expanded`, piège de focus, fermeture par `Escape` et par
  l'overlay, `inert` sur le drawer fermé, restauration du focus.
- Accordéon : boutons natifs, `aria-controls`/`aria-expanded`, navigation aux flèches.
- Formulaires : chaque champ a un `label`, les groupes ont un `role` et un
  `aria-labelledby`, les erreurs sont annoncées via `role="alert"`.
- Carrousel : viewport focusable, défilement clavier natif, boutons libellés, aucun
  autoplay.
- `:focus-visible` visible partout, contrastes conformes AA sur les couples de couleurs
  utilisés.
- `prefers-reduced-motion` neutralise animations, révélations et défilements doux.

---

## 11. Performance

- HTML statique, rendu immédiat, aucune ressource JavaScript bloquante.
- Un seul module d'entrée, chargé en `type="module"` (différé), sous‑modules à la demande.
- Images dimensionnées (`width`/`height`) pour éviter le CLS, `loading="lazy"` partout
  sauf visuels de hero (`fetchpriority="high"`), `decoding="async"`.
- Polices : `preconnect` vers Google Fonts, `display=swap`, deux familles, quatre graisses.
- Animations limitées à `opacity` et `transform`.
- Aucun bundle, aucune bibliothèque tierce, aucun traceur.

---

## 12. Identité visuelle

Deux **masters** dans `assets/brand/`, seuls fichiers à conserver et à remplacer si
l'identité évolue : `expert-parquet-mark.png` (symbole) et `expert-parquet-logo.png`
(logotype horizontal). Ils ne sont pas servis aux visiteurs.

Tout le reste est **dérivé** par `node tools/make-icons.mjs` (zéro dépendance :
décodeur / encodeur PNG, Lanczos-3 et écriture ICO sont dans le fichier) :

| Sortie | Dimensions | Emploi |
| --- | --- | --- |
| `brand/expert-parquet-logo-on-light.png` | 338 × 128 | En-tête sur fond clair |
| `brand/expert-parquet-logo-on-dark.png` | 338 × 128 | En-tête sur le hero, pied de page |
| `icons/favicon-16x16.png` · `favicon-32x32.png` | 16, 32 | Onglet |
| `icons/favicon.ico` | 16 + 32 + 48 | Onglet, favoris, Windows |
| `icons/apple-touch-icon.png` | 180 × 180 | Écran d'accueil iOS |

Les deux fichiers de logotype font 338 × 128 pour couvrir en 2× leur plus grande
utilisation (la signature du pied, 64 px). Le CSS ne pose **que la hauteur**
(`--brand-h`, `--brand-h-small`, `--brand-logo-h`), jamais la largeur : le rapport
reste celui du fichier, le logo ne peut donc pas être étiré.

### Trois décisions non évidentes

1. **Sur fond sombre, seul le logotype est inversé.** Le texte du logo est graphite :
   sur le hero il tomberait à ~2:1 de contraste. Mais éclaircir *aussi* le « P » du
   symbole le transforme en pièce métallique et change la matière de la marque. Le
   « P » sombre reste parfaitement lisible sur fond sombre, car les lames crème et la
   lame terre cuite en dessinent le contour. C'est donc `lightenInk()` appliqué à
   partir de la césure symbole / logotype seulement — césure détectée
   automatiquement, pas codée en dur.

2. **Les favicons sont une déclinaison simplifiée, sur tuile opaque.** Le symbole mêle
   du crème et du graphite : en transparence il perd ses lames sur fond clair et son
   « P » sur fond sombre. La tuile crème (`--color-white`) lui donne un rendu
   identique quel que soit le thème du navigateur, et supprime toute question de
   frange. À 16 px les lames crème (#E8E1D6) disparaissent dans cette tuile : elles
   sont donc ramenées au gris pierre de la charte (`--color-stone`) — assez sombre
   pour se lire, assez clair pour ne pas concurrencer le « P ».

3. **Pas de SVG.** Le symbole est un rendu matiéré (veinage, chants, biseaux), pas un
   logotype à aplats. Une vectorisation par segmentation des trois matières est
   géométriquement fidèle, mais elle perd l'épaisseur des lames et le veinage : ce
   n'est plus le même dessin. Les PNG sont donc la seule forme livrée. Ne pas
   « rattraper » ce point par une vectorisation automatique.

### La version réservée n'est émise que là où elle sert

`brand()` dans `tools/layout.mjs` ne place le second `<img>` dans l'en-tête que si la
page a un hero sombre (`headerOver`), c'est-à-dire l'accueil seul. La bascule entre
les deux versions est purement CSS, pilotée par les classes que `navigation.js` pose
déjà (`.site-header--over`, `.is-scrolled`) — aucun JavaScript ajouté.

---

## 13. Empreintes de contenu (cache)

**Problème.** GitHub Pages sert **tout** en `Cache-Control: max-age=600`, HTML compris
(vérifié sur `index.html`, `layout.css` et `main.js`). Un visiteur pouvait donc recevoir
un HTML fraîchement déployé accompagné d'une feuille de style mise en cache jusqu'à dix
minutes plus tôt, et voir la page avec l'ancien CSS. C'est exactement ce qui est arrivé
au déploiement du logo.

**Solution.** `tools/fingerprint.mjs` calcule une empreinte SHA-256 (8 hexadécimaux) du
**contenu**, et `relAsset()` dans `tools/layout.mjs` l'ajoute à l'URL :

```html
<link rel="stylesheet" href="../css/layout.css?v=d0c52ad4">
<script type="module" src="../js/main.js?v=2a6f865b"></script>
```

Tant qu'un fichier ne change pas, son URL ne change pas et le cache joue pleinement son
rôle. Dès qu'il change, l'URL change et le navigateur est *obligé* de retélécharger : un
HTML neuf ne peut plus être associé à un CSS ancien, puisqu'il ne cite même plus
l'ancienne URL.

**Empreinte calculée sur un contenu normalisé en LF.** Le hachage passe par
`normaliseEol()` : les fins de ligne sont ramenées à `\n` **pour le calcul
seulement**, aucun fichier source n'est réécrit. Sans cela l'empreinte dépendait
des octets du disque, donc de `core.autocrlf` — Git réécrit les fins de ligne au
checkout, mais seulement sur les fichiers qu'il touche, et l'arbre devenait mixte
après un changement de branche. Conséquence : `check.mjs` signalait des
« empreintes périmées » sur un clone neuf, et chaque machine produisait des diffs
parasites sur les 26 pages. L'empreinte est désormais indépendante du système, de
`core.autocrlf` et du mode de checkout.

`.gitattributes` impose par ailleurs `text eol=lf` aux sources texte, pour
supprimer l'ambiguïté à la source plutôt que de la rattraper. `check.mjs` vérifie
l'invariant : le même contenu en LF, en CRLF ou en CR doit donner exactement la
même empreinte.


**Pas d'horodatage.** `?v=Date.now()` produirait une URL neuve à chaque build, y compris
quand rien n'a bougé, et annulerait tout le bénéfice du cache. Deux builds successifs
sans modification produisent ici un HTML **identique à l'octet**.

**Deux granularités, pour une raison précise :**

- **une empreinte par feuille de style** — elles sont indépendantes (aucun `@import`
  dans ce projet), modifier `home.css` ne doit donc pas invalider `base.css` ;
- **une seule empreinte pour tout `js/`, portée par `main.js`** — les modules
  s'importent entre eux (`main.js` → `modules/*.js` → `config/*.js`). Une empreinte par
  fichier laisserait `main.js` inchangé quand seul `navigation.js` bouge, et l'URL citée
  par le HTML ne bougerait pas. En couvrant l'arbre entier, la modification de n'importe
  quel module change l'URL du point d'entrée.

**Limite connue et assumée.** Les sous-modules sont chargés par des `import` statiques, à
des URL sans empreinte : ils restent soumis au `max-age=600` de GitHub Pages, comme le
HTML lui-même. Fermer complètement cette fenêtre imposerait de réécrire les
spécificateurs d'import, donc de servir des copies générées des sources — un dossier de
build que ce projet n'a pas. Le gain visé, la désynchronisation HTML / CSS, est acquis.

`node tools/check.mjs` refuse une ressource sans empreinte **et** une empreinte qui ne
correspond plus au fichier : un build oublié est donc détecté avant le déploiement.

---

## 14. Informations absentes

Le site ne doit **jamais** afficher de valeur inventée, mais il ne doit pas non plus
afficher de libellé technique à sa place. La règle est : soit l'information est réelle et
affichée, soit elle n'existe pas et **rien ne s'affiche**.

- `js/modules/contact-info.js` masque le bloc `[data-contact-block]` d'une coordonnée
  absente, et masque le groupe `[data-contact-group]` entier si toutes le sont. Le jour
  où `js/config/site.js` est rempli, les blocs réapparaissent seuls, sans toucher au HTML.
- Les pages publiques ne contiennent plus aucun `[À renseigner]`, aucun nom de fichier de
  configuration, aucune mention de serveur ou de *backend*. Ce qui devait être dit l'est
  en langue naturelle : « Formulaire de démonstration : aucune demande n'est
  transmise pour le moment. »
- L'écran de fin des formulaires affiche un **récapitulatif lisible** de la saisie, et non
  le JSON qui serait transmis. Son titre dit explicitement que la demande n'a pas été
  envoyée.
- Ce qui reste à brancher est consigné dans [TODO-INTEGRATIONS.md](TODO-INTEGRATIONS.md),
  pas sur les pages publiques.
- La charge utile que le front enverra, les états des formulaires et les protections à
  prévoir côté serveur sont décrits dans
  [docs/BACKEND-CONTRACT.md](docs/BACKEND-CONTRACT.md). Le passage en mode LIVE ne
  demande que de renseigner une URL dans `js/config/site.js`.

---

## 15. Rappel d'action mobile

`js/modules/sticky-cta.js` + `.sticky-cta` dans `components.css`.

Barre graphite fixée en bas d'écran, **sous 768 px uniquement**. Volontairement pas un
bandeau terre cuite : l'accent doit rester rare, et une barre orange présente sur
toutes les pages mobiles en ferait l'élément dominant du site.

Elle n'apparaît que dans la zone où le visiteur lit du contenu **sans aucun appel à
l'action sous les yeux** — deux `IntersectionObserver` (et non un écouteur de défilement)
la masquent tant que le hero est visible, et de nouveau dès que le bandeau final ou le
pied de page approche à moins de 140 px. Hors de cette zone elle est en
`visibility: hidden`, donc pas focalisable au clavier. La page de demande n'en reçoit pas.

`padding-bottom` intègre `env(safe-area-inset-bottom)` pour l'encoche iOS.

---

## 16. Confort tactile

Trois blocs `@media (pointer: coarse)`, un par fichier concerné — le desktop n'est jamais
touché :

- `base.css` — le lien fléché mesure 31 px de haut et porte son trait en `border-bottom` :
  on ne peut donc pas l'espacer par du padding sans décoller le trait du texte. Une couche
  absolue centrée porte la zone tactile à 44 px **sans rien déplacer à l'écran**.
- `components.css` — `.btn--sm` passe de 37 px à `min-height: 44px`.
- `layout.css` — listes du pied, liens légaux et fil d'Ariane : l'écart des `gap` est
  transféré vers le padding des liens, le pas passe de 34 px à environ 42 px. Le rythme
  visuel reste proche, chaque cible devient confortable.

Les cartes d'article n'ont pas besoin de règle : `.card__link::after { inset: 0 }` rend
déjà la carte entière cliquable.

---

## 17. Le drawer mobile est un changement de contexte, pas un panneau posé dessus

L'ancien menu occupait `min(440px, 92vw)`. Les 8 % restants laissaient voir une
bande du site à gauche : l'œil continuait de lire la page derrière, et le
panneau se lisait comme une surface flottante plutôt que comme un changement
d'écran. Il occupe désormais tout le viewport.

Trois décisions valent d'être expliquées.

**`height: 100dvh` doublé de `min-height: 100svh`.** `svh` est la hauteur du
viewport barre d'URL affichée, `dvh` la hauteur courante. Comme `svh <= dvh` en
toutes circonstances, les deux déclarations ensemble ne peuvent jamais rendre le
panneau plus haut que ce qui est réellement visible — le CTA du bas reste
atteignable pendant que la barre d'URL se rétracte. `min-height` sert aussi de
repli pour les navigateurs qui ignorent `dvh`.

**Le verrouillage du défilement passe par `position: fixed` sur `<body>`, pas
par `overflow: hidden`.** Safari iOS ignore `overflow: hidden` sur le corps et
continue de faire défiler la page derrière un panneau fixe. La seule méthode
fiable consiste à sortir le corps du flux en compensant la position de
défilement courante par un décalage négatif (`js/modules/navigation.js`, objet
`scrollLock`). Sans cette compensation, la page saute en haut à l'ouverture,
puis de nouveau à la fermeture.

**Le voile semi-transparent a été supprimé.** Un panneau opaque qui occupe tout
le viewport n'a pas de « dehors » sur lequel cliquer. C'est accessoirement ce
voile — enfant direct de `<body>`, donc hors du contexte d'empilement du header
— qui interceptait les taps sur les liens du menu au lot précédent. La classe de
bug disparaît avec lui, pas seulement le symptôme.

La taille des liens et leurs espacements suivent la HAUTEUR du viewport
(`clamp(..., ...vh, ...)`), pas sa largeur : c'est la hauteur qui manque en
paysage. À 844 × 390, les six liens et le CTA tiennent sans défilement.

## 18. Divulgation progressive : ce qui est replié, et ce qui ne l'est jamais

La page d'accueil faisait 15 878 px à 375 px de large, soit 19,5 écrans. Elle en
fait 11 748, soit 14,5 (−26 %). L'essentiel du gain vient du rythme — des vides
calibrés pour des colonnes larges, empilés sur une seule colonne — et non du
contenu.

Deux listes seulement sont repliées, et uniquement sous 640 px
(`js/modules/reveal-more.js`) : les huit désordres réduits à quatre et les trois
articles réduits à deux. (La liste des domaines, elle aussi repliée, a quitté
l'accueil avec la réorganisation « projet d'abord, problème ensuite ».)

Les règles qui encadrent ce repli :

- le contenu reste **dans le document**, marqué `hidden` — les moteurs rendent
  la page et le lisent ;
- au-delà de 640 px, tout réapparaît, sans exception ;
- une liste que l'utilisateur a dépliée ne se replie jamais dans son dos ;
- le focus suit ce qui apparaît, sinon le bouton disparaît sous le doigt et le
  focus retombe sur `<body>` ;
- sans JavaScript, la liste est déjà entière et le bouton reste masqué.

Ce qui n'est **jamais** replié : le hero, la section Premibel / Over Parquet, les
trois entrées « Comprendre mon problème », les critères d'expertise et la FAQ. Ce
sont les étapes du parcours.

## 19. Les contenus associés sont un graphe, pas un `slice(0, 3)`

La fin d'un article proposait les trois premiers articles du tableau, moins
lui-même. Un lecteur venu pour l'humidité se voyait donc proposer le grincement
— parce qu'il figure en première position, pas parce qu'il a un rapport. Et la
suggestion ne sortait jamais des articles.

`tools/content/graph.mjs` construit un index des trois familles de contenus
(articles, désordres, guides), chacune portant des `tags`. Les recommandations
écrites à la main dans `related` passent en premier ; les places restantes vont
aux contenus qui partagent le plus d'étiquettes. Deux contenus du même type au
maximum, pour que le lecteur passe d'un article à une page de désordre puis à un
guide.

Le résultat est **déterministe** — à score égal, l'ordre du catalogue tranche —
donc deux builds successifs produisent le même HTML.

Effet de bord mesuré sur le maillage interne : `conseils/choisir-parquet` est
passée de 1 à 25 liens entrants, aucune page n'est orpheline, et la profondeur
maximale depuis l'accueil est de 2 clics.

## 20. Les dimensions d'image ne se saisissent plus à la main

Soixante-cinq balises `<img>` déclaraient un `width`/`height` sans rapport avec
le fichier — `entretien.jpg` était annoncée en 1800 × 1200 alors qu'elle mesure
1400 × 2100, soit un portrait déclaré en paysage. Les conteneurs `aspect-ratio`
masquaient le symptôme, mais la donnée restait fausse dans la source, et elle
aurait été héritée par tout travail ultérieur sur les images.

`tools/images.mjs` lit désormais les dimensions dans l'en-tête SOFn du fichier
au moment du build. Elles ne peuvent plus diverger. Le même module porte le
dictionnaire des textes alternatifs et construit le `srcset` d'après les
variantes réellement présentes dans `assets/images/r/` : si elles n'ont pas été
générées, l'attribut est simplement omis et la page reste correcte.

Une photographie non déclarée dans le dictionnaire fait **échouer le build**.
C'est voulu : l'alternative serait une page publiée avec un `alt` vide en
silence.

## 21. Piège n° 9 — `<lastmod>` fabriqué

Le sitemap portait la date du BUILD. Les vingt-six dates changeaient donc à
chaque régénération, même quand pas une ligne de contenu n'avait bougé : un diff
parasite dans chaque commit, et un conflit de fusion systématique dès que deux
branches avaient été construites des jours différents — quarante-deux marqueurs
lors de la dernière intégration, tous sur des `<lastmod>`.

C'était surtout une date **fausse** : `<lastmod>` doit désigner la dernière
modification du contenu, que le générateur ne connaît pas. L'élément est
facultatif dans la spécification ; il est désormais omis. Ne pas le réintroduire
sans une source de vérité réelle.

## 22. Piège n° 10 — un `robots.txt` de sous-dossier ne protège rien

Sur l'hébergement de préproduction, le site est servi sous `/expert-parquet/`.
Le `robots.txt` publié à cette adresse **n'est pas celui que les robots
consultent** : ils ne lisent que celui de la racine du domaine, qui n'existe pas
ici. La seule protection qui fonctionne réellement est donc la balise
`<meta name="robots">` de chaque page — d'où la notion d'environnement de build
décrite dans le README.


## 24. Catalogue et recommandation — « Trouver mon parquet »

### D'où viennent les produits

Premibel et Over Parquet tournent sous WooCommerce et exposent l'API « Store » de
WooCommerce Blocks, publique et sans authentification (`/wp-json/wc/store/v1/products`,
`/products/categories`). Relevé le 05/10/2026 : 783 produits chez Premibel, 877 chez
Over Parquet, tous avec identifiant, nom, URL canonique, référence, image, catégories
et attributs (essence, finition, chauffage au sol, épaisseur, largeur, pose…).

`tools/catalog/import-catalog.mjs` télécharge les deux catalogues, **écarte tout ce qui
n'est pas un parquet** (accessoires, plinthes, colles, isolation, lots de fin de série),
normalise chaque fiche en facettes lisibles par le moteur à partir des catégories et
attributs de l'enseigne — jamais du nom —, relie les références communes aux deux
enseignes (nom et description identiques) et écrit :

| Fichier | Contenu |
| --- | --- |
| `data/catalog-premibel.json` | 411 parquets en stock, avec image |
| `data/catalog-overparquet.json` | 438 parquets en stock, avec image |
| `data/catalog-index.json` | date de l'instantané, statistiques, **catégories réelles** (slug → nom, URL, effectif) |
| `js/config/catalog-version.js` | empreinte des JSON, pour le cache |

Les JSON ne sont **jamais embarqués dans les pages** : `js/catalog/load.js` lit celui
de l'enseigne cherchée quand le moteur en a besoin. Le navigateur ne contacte jamais
les sites des enseignes. Ni prix ni stock ne sont conservés : figés dans un instantané,
ils seraient faux dès la première mise à jour ; la date du relevé est affichée sous
les résultats.

### Trois niveaux, toujours le plus précis qui soit fiable

1. **Produit** — des références exactes sur tous les critères posés ;
2. **Catégorie** — une catégorie réelle de l'enseigne, la plus spécifique dont on a
   l'adresse (`js/recommendation/fallbacks.js` lit `catalog-index.json`, ne construit
   aucune URL) ;
3. **Enseigne** — l'entrée adaptée au profil (`js/config/site.js`).

### Questions et critères

Cinq questions au plus (`js/config/finder-questions.js`), choisies après l'audit :
pièce ou usage (+ case « chauffage au sol »), type (+ essence : chêne, bambou, bois
exotique), motif, teinte, finition. Une question sans objet n'est pas posée (pas de
type ni de motif pour une terrasse, pas de finition ni d'essence pour un stratifié).
Les critères venus du pré-diagnostic (`?piece=…&type=…&via=pre-diagnostic`) sont
repris, affichés, et leurs questions sautées.

### Appariement et score (`js/recommendation/matching.js`)

Critères **durs** — éliminent, et l'inconnu élimine aussi : type, essence, motif,
pièce humide (seuls les produits que l'enseigne classe « salles de bain et cuisines »),
terrasse, chauffage au sol (seuls les produits déclarés compatibles). Critères
**souples** — classent : pièce sèche (+20), teinte (+15, −15 si contraire), finition
(+10). Poids : type 30, essence 25, motif 25, pièce 20, teinte 15, finition 10,
chauffage 5. Chaque résultat porte ses `raisons` (affichées sous « Pourquoi ce
parquet ? ») et ses `ecarts`. Un produit n'est « exact » que s'il satisfait tous les
critères posés ; sinon la page le dit et propose la catégorie, puis l'enseigne.

### Professionnels

Le parcours « Approvisionner mon chantier » cherche chez Over Parquet et montre, pour
une référence qui existe aussi chez Premibel (61 références communes), le lien « Aussi
chez Premibel (choix, conseil) ». **Un particulier n'est jamais envoyé chez Over
Parquet** — `normalizeCriteria()` ne retient ce périmètre que pour un profil
professionnel déclaré.

### Suivi

`js/modules/tracking.js` publie `recommendation_result` (critères, niveau, nombre,
identifiants), `product_click` (avec `data-product-id`, `data-product-name`,
`data-category`, `data-level`) et `partner_click` — par `CustomEvent('ep:track')` et
dans `window.epTrack`. Aucune requête réseau, aucun tiers. Ce qu'il faudrait pour
enregistrer côté serveur est décrit dans `docs/BACKEND-CONTRACT.md` (« Suivi anonyme »).

### Tests

`node tools/catalog/test-scenarios.mjs` joue neuf scénarios sur les instantanés, sans
navigateur, et échoue si un niveau attendu n'est pas atteint ou si un produit non
classé « salles de bain » était proposé pour une pièce humide.

---

## 23. Plus aucun tiers

Les deux familles typographiques venaient de `fonts.googleapis.com` : chaque
page envoyait l'adresse IP du visiteur à un tiers, sans base légale déclarée
nulle part sur le site. C'était le seul sous-traitant de ce site ; il n'y en a
plus aucun.

Les fichiers sont servis depuis `assets/fonts/`, en variable et sous-ensemble
latin — une requête par famille couvre les graisses 400 à 600, et le latin
suffit au français (il comprend le « œ », U+0152-0153). Licence SIL Open Font
License 1.1, qui autorise explicitement la redistribution.

Gain secondaire, non négligeable : la feuille de Google était bloquante et les
fichiers de police n'étaient découverts qu'après son analyse — deux allers-
retours vers deux domaines distincts avant la première lettre affichée. Les
polices sont désormais préchargées depuis le `<head>`, sur la même origine.

---

## 25. CMS éditorial — WordPress écrit, le build lit

### Le principe

```
WordPress (wp-admin)            instantané                  générateur            site
Conseils · Problèmes · FAQ  →  data/content/snapshot.json  →  tools/build.mjs  →  HTML statique
Pages à champs · Médias                                        (gabarits, DA, moteur,
Navigation · Publication                                        diagnostic : dans le code)
```

Le DESIGN, les gabarits, le moteur « Trouver mon parquet », le pré-diagnostic, les
formulaires, la sécurité et les catalogues produits restent dans le code. Le CONTENU —
textes, images, SEO, mises en avant, parcours de sortie, navigation — est administré
dans WordPress. Il n'existe plus de texte éditorial dans `tools/`.

### Le modèle dans WordPress (plugin `expert-parquet-leads`, dossier `includes/content/`)

| Objet | Type WordPress | Champs métier (meta) |
|---|---|---|
| Conseil | `ep_conseil` (titre, éditeur, extrait, image, révisions) | format article/guide, thème (`ep_theme`, un seul), étiquettes, chapô, titre et libellé courts, temps de lecture, mise en avant + ordre, parcours de sortie + critères du moteur, contenus associés, FAQ liées, SEO |
| Problème | `ep_probleme` | titre/libellé courts, accroche, introduction, vignette, symptômes, causes, erreurs, vérifications, « quand demander une expertise », remplacement plausible, problème du pré-diagnostic, associés, FAQ, mise en avant, sortie, SEO |
| Question | `ep_faq` (titre = question, éditeur = réponse, ordre) | groupe (`ep_faq_groupe`) |
| Page | `page` native, slug parmi `accueil`, `a-propos`, `expertise`, `contact`, `diagnostic`, `conseils`, `problemes` | champs du gabarit (`ep_champs`), SEO, image mise en avant, éditeur quand le gabarit a un corps |
| Navigation | options `ep_navigation`, `ep_header_cta` | libellé, ordre, visibilité ; destinations fixes |

Les trois types partagent le type de capacité `ep_contenu`. Rôles : `ep_redacteur`
(écrit, ne publie pas), `ep_editeur` (publie, ordonne, publie le site, maintenance),
`ep_gestionnaire` (demandes, inchangé). Les blocs autorisés dans l'éditeur sont le
paragraphe, le titre, la liste, la citation, l'image, le tableau, le séparateur, et le
bloc classique pour le contenu migré. Les URL ne se saisissent jamais : le parcours de
sortie est une liste fermée et le build construit le lien.

### L'export

`GET /wp-json/expert-parquet/v1/content/export[?apercu=1]`, protégé par un jeton
serveur à serveur (`backend-private/build-token.txt`, créé par le plugin ; en-tête
`X-EP-Build-Token`). Sans `apercu`, seuls les contenus publiés sortent ; avec,
les brouillons aussi — pour la prévisualisation seulement. La structure est triée et
déterministe. `tools/cms/fetch-snapshot.mjs` l'écrit dans `data/content/snapshot.json`
(versionné : le build est reproductible et relisible en diff) et copie les médias.

### Les images

Les images historiques restent dans `assets/images/` avec leurs variantes ; les images
ajoutées depuis la médiathèque vont dans `assets/images/cms/` avec les tailles 480, 768,
1200 et 1600 générées par WordPress (`add_image_size`). L'`alt` est celui du média, la
clarté (90e centile de luminance, pour le voile du hero) est mesurée par le plugin au
téléversement. Le site public ne dépend jamais de WordPress pour afficher une image.
Les photographies des demandes d'expertise ne passent pas par la médiathèque.

### Le HTML éditorial (`tools/cms/html.mjs`)

Quatre passes : `[ep_icon nom]` → SVG du jeu d'icônes ; `href="/pages/x.html"` →
lien relatif à la profondeur de la page ; lien vers premibel.fr ou over-parquet.com →
`rel="sponsored noopener"` et attributs de mesure ; balisage de l'éditeur de blocs →
composants du site (tableau → `.table-scroll`, image → pipeline d'images, classes
`wp-block-*` retirées, titres bornés à H2/H3, `id` posé sur les H2 pour le sommaire).

### Publication et aperçu

`tools/publish.mjs --mode site` : instantané publié → sauvegarde du HTML courant →
`build.mjs` → `check.mjs` → en cas d'échec, restauration du site précédent. État dans
`backend-private/build/etat.json`, journal dans `backend-private/logs/build.log`.
`--mode apercu` : instantané avec brouillons → `_preview/` (ressources copiées), jamais
la racine.

Depuis WordPress, « Publier le site » et « Prévisualiser » lancent ce script par
`proc_open` (commande en tableau, aucun argument venu du navigateur, délai de 240 s),
uniquement si `EP_BUILD_LOCAL` vaut `true` dans wp-config.php ET que l'environnement est
`local` ou `development`. En production, la mécanique n'existe pas : la publication y
passera par un déclenchement distant (lot ultérieur) ; l'écran l'explique.

### Mode maintenance

Un bloc dans le `.htaccess` de la racine (entre marqueurs, écrit par le plugin) répond
`503` + `Retry-After` + `X-Robots-Tag: noindex` avec `/maintenance.html` dès qu'un
fichier témoin existe (`backend-private/maintenance/active`). Activer, c'est créer ce
fichier : effet immédiat, aucun rebuild. `/wp-admin`, `/wp-login.php`, `/wp-json`,
`/wp-content`, `/wp-includes`, `/css`, `/assets` et la page elle-même passent toujours ;
un cookie de contournement, posé depuis WordPress, laisse passer l'administrateur ; hors
maintenance, la page n'est servie qu'avec un cookie d'aperçu. La page est écrite par le
plugin (DA du site, `css/pages/maintenance.css`, image copiée dans
`assets/maintenance/`) ; `check.mjs` l'ignore, elle n'est pas dans le sitemap.

### Migration

Le contenu historique a été extrait des anciennes constantes vers
`tools/cms/migration/contenu-initial.json`, importé par
`backend/scripts/importer-contenu.php` (idempotent : clé technique `_ep_cle` sur chaque
post, `_ep_legacy_file` sur chaque média). Les URL publiques n'ont pas changé : les
slugs sont ceux d'avant. Les seules différences de rendu, voulues : les catégories
d'articles sont devenues les quatre thèmes de la taxonomie ; la liste des problèmes
compte sept entrées au lieu de huit (le doublon « Parquet ancien » renvoyait à la même
page) ; les liens relatifs écrits à la main dans quelques réponses de FAQ sont normalisés
par `rel()` ; les H2 des pages à éditeur portent un `id`.

## 26. Configuration du site — WordPress fournit les valeurs, le front protège la DA

### Le principe

Après le contenu (§25), la couche « site » : identité, apparence, navigation, pied de
page, SEO. Même mécanique — WordPress écrit, l'instantané transporte, le build lit — et
une règle de plus : **ce n'est pas un page builder**. Les gabarits, les tailles, les
marges, les typographies, les rayons et la structure des pages ne sont pas exposés.
L'administrateur choisit des valeurs dans des listes bornées ; le code décide du dessin.

```
EP_Site (options ep_site_*)  →  snapshot.site {identity, appearance,   →  tools/cms/site.mjs  →  layout.mjs
Identité · Apparence ·            navigation, footer, seo}                 (fusion + validation     theme.mjs
Navigation · Footer · SEO                                                  stricte, défauts = V1)   home.mjs
```

### Côté WordPress (`includes/content/`)

| Classe | Rôle |
|---|---|
| `EP_Projet` | la **fiche du projet** pour l'admin : nom, accent, logo d'administration, libellés. Ses variables CSS (`--ep-accent`, `--ep-accent-sombre`, `--ep-accent-pale`…) sont injectées dans l'admin ; plus aucune couleur en dur dans `admin-*.css`. Surchargeable par la constante `EP_PROJET`. |
| `EP_Site` | référentiels fermés (pages internes, parcours, partenaires, icônes, réseaux, 4 colonnes max), **valeurs par défaut = V1**, lecture avec compatibilité des anciennes options (`ep_navigation`, `ep_header_cta`), validation (`couleur_valide`, `url_valide`, `media_valide`, `nettoyer_lien`), tailles de favicon, `exporter()`. Un enregistrement marque `ep_site_modifie` : la Publication affiche « configuration en attente ». |
| `EP_Admin_Site` | hub « Configuration du site » + cinq écrans et leurs actions `admin_post_ep_site_*`. Capacités : `ep_configurer_site` (Identité, Apparence, SEO — administrateur) et `ep_gerer_navigation` (Navigation, Footer — éditeur). |

Les secrets, chemins et commandes ne traversent jamais ces écrans ni l'export : ils
restent dans `wp-config.php`, `backend-private/` et les réglages techniques.

### Côté build

- `tools/cms/site.mjs` : `DEFAUTS` (la V1, mot pour mot), `site()` fusionne l'instantané
  sur les défauts et **lève une erreur** sur toute valeur hors référentiel (couleur non
  hexadécimale, type de lien inconnu, icône hors bibliothèque, plus de quatre colonnes,
  URL non `https`). Un instantané invalide ne produit pas de site : le précédent reste
  en ligne (publish.mjs).
- `tools/cms/theme.mjs` : écrit `css/theme.css` — la seule feuille dérivée d'une valeur
  administrée. Accent par défaut → valeurs V1 à l'identique ; autre accent → nuances
  dérivées. Chargée après `variables.css`, avant le reste. Pendant un aperçu, la feuille
  de la racine est remise telle quelle : l'aperçu ne recolore pas le site en ligne.
- `tools/partials-icones.mjs` : la bibliothèque fermée d'icônes du pied de page.
- `layout.mjs` lit logos, favicon, menu (entrées métier + liens personnalisés), CTA,
  colonnes du pied de page (`footer__cols--N`), réseaux, suffixe et description par
  défaut, image sociale par défaut ; `home.mjs` émet WebSite + Organization.
- Indexation : `IS_PROD && seo.indexation`. Hors production, `noindex` et `robots.txt`
  bloquant, non contournables depuis WordPress.

### Médias

L'export donne à chaque média un `chemin` relatif au site (historique : `assets/…` ;
médiathèque : `assets/images/cms/…`). Le favicon administré est découpé en 16, 32 et
180 (`add_image_size`, `ep-favicon-*`), copié dans `assets/icons/cms/` ; sans favicon
administré, les fichiers historiques d'`assets/icons/` sont servis. Les logos de marque
ont été importés comme médias historiques (`_ep_legacy_file = brand/…`) : l'identité
par défaut pointe sur eux, et le header est identique à la V1.

### Conventions réutilisables (socle des prochains projets)

Pas de paquet générique : des conventions, reprises telles quelles projet après projet.

1. **Une fiche projet** (`EP_Projet`) porte le nom, l'accent et le logo de l'admin ;
   l'interface d'administration n'a aucune couleur ni nom en dur.
2. **Une structure d'admin commune** : un menu de marque avec rubriques Contenu /
   Site / Activité / Administration, un tableau de bord qui renvoie vers les écrans
   sans les dupliquer, un hub « Configuration du site » à cartes.
3. **Des modules métier** (ici le moteur, le pré-diagnostic, les demandes) séparés de
   la **configuration commune** (identité, apparence, navigation, footer, SEO,
   publication, maintenance, rôles), qui est la même d'un site à l'autre.
4. **WordPress pilote les valeurs, le front protège la DA** : listes fermées,
   validation des deux côtés, défauts égaux au rendu de référence, aucune taille ni
   typographie exposée, une seule feuille dérivée (`theme.css`).
5. **Rôles en quatre niveaux** : rédacteur (écrit), éditeur (publie, navigation,
   footer, maintenance), administrateur (identité, apparence, SEO, technique),
   gestionnaire d'activité (demandes). Les secrets ne sont jamais à portée des rôles
   éditoriaux.
6. **Tout passe par l'instantané** : une modification de configuration est « en
   attente » jusqu'à la publication, se prévisualise sans toucher au site en ligne,
   et un instantané invalide est refusé par le build.
