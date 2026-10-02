# Architecture — Expert Parquet

Document technique. Pour l'installation et la personnalisation courante, voir
[README.md](README.md).

---

## 1. Routes

### Pages principales

| URL | Rôle | Intention de recherche |
| --- | --- | --- |
| `/index.html` | Accueil, page de conversion | marque, « problème parquet » |
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
dépendance) à partir de modules de contenu. Motif : 26 pages partagent header, footer,
liste éditoriale, bandeau CTA, carrousel et bloc processus ; les dupliquer à la main
garantirait des divergences.

```
tools/
├── build.mjs            Orchestration + sitemap + robots
├── check.mjs            Contrôle qualité (voir §9)
├── make-icons.mjs       Déclinaisons du logo et des favicons (voir §12)
├── layout.mjs           <head>, header, footer, breadcrumb, JSON-LD
├── partials.mjs         Icônes SVG, liste éditoriale, CTA, processus, carrousel,
│                        catalogue d'articles, accordéon FAQ, en-têtes de page
└── content/
    ├── home.mjs         Accueil
    ├── core-pages.mjs   Expertise, diagnostic, hubs, à propos, FAQ, légal
    ├── form-pages.mjs   Devis, contact
    ├── problem-pages.mjs 7 pages symptôme (données → gabarit)
    ├── advice-pages.mjs  4 pages catégorie
    └── articles.mjs      5 articles
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
| `pages/home.css` | Hero immersif, en-têtes de page, liste « par symptôme », bloc observation (critères d'expertise), pré-diagnostic, magazine, FAQ |
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
| `index-list.js` | `[data-index-list]` | Vignette suivant le curseur sur la liste éditoriale. Strictement desktop, pointeur fin, hors `prefers-reduced-motion` ; purement décoratif (`aria-hidden`) |
| `contact-info.js` | `[data-contact="…"]` | Injecte les coordonnées réelles, **ou masque le bloc** si l'information n'est pas fournie (voir §14) |
| `sticky-cta.js` | `[data-sticky-cta]` | Rappel d'action mobile : visible seulement entre le hero et le bandeau final (voir §15) |
| `animations.js` | `[data-reveal]` | Apparition au scroll via `IntersectionObserver`, désactivée si `prefers-reduced-motion` |
| `accordion.js` | `[data-accordion]` | FAQ accessible : `aria-expanded`, flèches haut/bas, `Home`/`End`, ouverture par ancre |
| `carousel.js` | `[data-showcase]` | Carrousel « Situations à analyser » : scroll natif + `scroll-snap`, boutons, clavier, compteur 01/05, barre de progression. Mesures mises en cache au redimensionnement pour ne pas dépendre de `requestAnimationFrame` |
| `toc.js` | `[data-toc]` | Génère le sommaire depuis les `h2[id]`/`h3[id]`, surligne la section lue |
| `diagnostic.js` | `[data-diagnostic]` | Pré-diagnostic (voir §6) |
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
colonnes d'étapes numérotées (`.stages`), liste éditoriale numérotée avec vignette au
survol (`.index-list`), carrousel plein format (`.showcase`), champs de formulaire
soulignés, tuiles de choix, zone de dépôt de photos, stepper, bandeau CTA, chips de
filtre, accordéon, rappel d'action mobile (`.sticky-cta`, voir §15).

Le composant `placeholder-value` a été retiré : plus aucune page publique n'affiche
de valeur à renseigner (voir §14).

### Compositions de page d'accueil (`css/pages/home.css`)

L'accueil suit l'ordre des conversions (README, « Hiérarchie des conversions ») :

1. `hero` (immersif, prêt pour la vidéo) — deux CTA : « Choisir ou remplacer mon
   parquet » (`#solutions`) et « J'ai un problème avec mon parquet » (`#comprendre`) ;
2. `#solutions` — **Trouver la bonne solution** : Premibel et Over Parquet, via
   `solutionsPartenaires()` (`tools/partials.mjs`) ; placé tout de suite sous le hero ;
3. `#comprendre` — **Comprendre mon problème** : trois entrées (`.stages--3` :
   pré-diagnostic, problèmes, conseils) puis la liste « par symptôme » (`.index-list`) ;
4. `prediag` (section sombre, panneau clair) ;
5. `observation` (`#expertise`) — **Quand faire appel à une expertise ?** : demi-écran
   image / demi-écran panneau sombre, quatre critères (`.observation__factors--rows`),
   CTA devis + lien vers le déroulement ;
6. `magazine` (un article vedette + deux compacts) ;
7. `faq-split`, puis le pied de page compact.

Les compositions `statement`, `domain`, `showcase`, `journey` et `cta-band` ont été
retirées de l'accueil (et de `home.css`) lors de cette réorganisation ; le carrousel
(`carousel.js`) reste disponible pour une autre page.

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
trois entrées « Comprendre mon problème », le pré-diagnostic, les critères
d'expertise et la FAQ. Ce sont les étapes du parcours.

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
