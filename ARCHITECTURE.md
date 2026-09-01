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
| `pages/home.css` | Hero immersif, en-têtes de page, manifeste, domaines alternés, bloc observation, pré-diagnostic, magazine, FAQ, parcours |
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

---

## 4. JavaScript

`js/main.js` est le **seul** script chargé par les pages
(`<script type="module">`, donc différé nativement). Il appelle chaque module dans un
`try/catch` : une erreur isolée ne casse pas le reste de la page.

| Module | Point d'ancrage | Rôle |
| --- | --- | --- |
| `navigation.js` | `[data-nav-toggle]`, `[data-nav]` | Drawer mobile (piège de focus, `Escape`, `inert`, overlay), état du header au scroll |
| `index-list.js` | `[data-index-list]` | Vignette suivant le curseur sur la liste éditoriale. Strictement desktop, pointeur fin, hors `prefers-reduced-motion` ; purement décoratif (`aria-hidden`) |
| `contact-info.js` | `[data-contact="…"]` | Injecte les coordonnées ou le placeholder `[À renseigner]` |
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
cartes d'article (standard, vedette, ligne), encadrés (`callout`, `disclaimer`,
`placeholder-value`), colonnes d'étapes numérotées (`.stages`), liste éditoriale
numérotée avec vignette au survol (`.index-list`), carrousel plein format
(`.showcase`), champs de formulaire soulignés, tuiles de choix, zone de dépôt de
photos, stepper, bandeau CTA, chips de filtre, accordéon.

### Compositions de page d'accueil (`css/pages/home.css`)

`hero` (immersif, prêt pour la vidéo) · `statement` (manifeste + trois colonnes) ·
`domain` (lignes alternées image/texte, image débordant vers l'extérieur) ·
`observation` (demi-écran image / demi-écran panneau sombre) · `prediag` (section
sombre, panneau clair) · `showcase` · `magazine` (un article vedette + deux compacts) ·
`faq-split` · `journey` · `cta-band`.

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
FORMS.endpoint === null
  → mode démonstration : le formulaire affiche le JSON qui serait envoyé
FORMS.endpoint === 'https://…'
  → POST JSON, gestion des erreurs réseau, message de succès
```

Un seul point à modifier pour brancher un backend : `FORMS.endpoint` dans
`js/config/site.js`. Détails dans [TODO-INTEGRATIONS.md](TODO-INTEGRATIONS.md).

---

## 8. SEO

- HTML sémantique, **un seul `h1` par page**, hiérarchie `h2`/`h3` cohérente.
- `title` et `meta description` spécifiques, `canonical` absolu.
- Open Graph complet + Twitter Card `summary_large_image`.
- Favicon SVG + `apple-touch-icon`, `theme-color`.
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
