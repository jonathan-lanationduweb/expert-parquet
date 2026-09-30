# Expert Parquet — expert-parquet.com

Site éditorial et de conversion consacré au **diagnostic et à l'expertise de parquet**.
Objectif : permettre à un visiteur d'identifier son problème, de comprendre ce qui le
provoque, puis de demander une expertise ou un devis.

Projet **totalement indépendant** : aucune dépendance à un autre site, aucun contenu
repris ailleurs, identité graphique et composants propres.

---

## Statut

| Chantier | État |
| --- | --- |
| **V1** | **validée et acceptée**, figée sur `release/v1-validated` |
| **V2 — Conversion et leads** | **en validation** — destination particulier à confirmer |
| **V2 — Back-office** | **en validation** |
| **Production** | **pas encore ouverte** |

Orientation commerciale validée : **professionnel → Premibel**, **particulier →
Over Parquet**. Aide et expertise d'abord, commerce ensuite — voir la section
**V2 — Conversion et leads** pour la réserve qui reste à lever.

Environnement local complet et fonctionnel.

La V1 acceptée comprend :

| Domaine | Contenu |
| --- | --- |
| Frontend | 34 pages, responsive, design validé, pré-diagnostic, formulaires, articles et conseils |
| SEO | métadonnées, données structurées, sitemap, maillage interne, contrôle qualité automatique |
| Backend | WordPress en infrastructure seule, API REST dédiée, 4 tables métier, dépôts de photographies privés |
| Back-office | gestion des demandes, statuts, notes, historique, export CSV |
| Sécurité | partie publique fermée, limitation des connexions, secrets hors Git, uploads hors racine web |
| Exploitation | hôte local unique, thème backend maison, déploiement statique, Git organisé |

Contrôle de référence : **34 pages générées, 34 analysées, 0 erreur**.

La branche `release/v1-validated` fige cet état.

---

## 1. Objectif et parcours

```
Problème constaté → Comprendre → Pré-diagnostic → Expertise → Demande de devis
```

Trois portes d'entrée mènent au même point de conversion :

- les **pages « problème »** (un symptôme = une page) ;
- le **pré-diagnostic interactif** (5 questions, orientation générale) ;
- les **articles de conseils** (SEO longue traîne).

Expert Parquet est d'abord un site **d'aide et d'expertise**. Il doit ensuite servir
de **passerelle commerciale qualifiée** : générer des demandes, distinguer le
particulier du professionnel, puis orienter chacun vers le bon interlocuteur.

```
Professionnel  →  Premibel
Particulier    →  Over Parquet
```

> **Cette orientation appartient à la V2 et n'est pas intégrée.** Des liens
> éditoriaux vers Premibel existent dans les conseils et les articles — ce sont des
> références de contenu, pas une qualification. Over Parquet n'apparaît nulle part
> dans le site. Voir la section **V2 — Conversion et leads**.

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

## 3. Environnement local

Un seul hôte sert le site **et** WordPress. WordPress n'est ni déplacé ni dupliqué :
Apache route `/wp-admin`, `/wp-login.php`, `/wp-includes`, `/wp-content` et `/wp-json`
vers `backend/public` par des alias.

| | |
| --- | --- |
| Site | <http://expert-parquet-dev.local> |
| Administration | <http://expert-parquet-dev.local/wp-admin/index.php> |
| API | <http://expert-parquet-dev.local/wp-json/expert-parquet/v1/> |

Les chemins `/backend/`, `/backend/public/` et `/backend-private/` répondent **404**.

**Identifiants locaux : `backend-private/IDENTIFIANTS.txt`.** Ce fichier n'est pas
versionné et ne doit jamais l'être — aucun identifiant, aucun secret ne figure dans ce
dépôt. Mise en place détaillée : [backend/docs/LOCAL-DEVELOPMENT.md](backend/docs/LOCAL-DEVELOPMENT.md).

---

## 4. Lancer le site

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

## 5. Régénérer les pages

Les 34 pages partagent le même header, le même footer et les mêmes blocs. Elles sont
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

## 6. Structure

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
│   ├── public/                   WordPress (API + back-office) — routé par alias Apache
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

- le VirtualHost `expert-parquet-dev.local` **refuse ces deux chemins** (404 sur
  l'URL, `Require all denied` sur les répertoires, `AllowOverride None`) ;
- le générateur (`tools/build.mjs`, `tools/check.mjs`) ne les parcourt pas :
  ils n'apparaissent ni dans les pages, ni dans `sitemap.xml` ;
- WordPress est atteint par des **alias Apache** (`/wp-admin`, `/wp-login.php`,
  `/wp-json`) qui pointent dans `backend/public`. Ce sont des chemins d'URL :
  le chemin physique `/backend/` reste refusé, et un visiteur ne voit jamais
  `expert-parquet-dev.local/backend/`.

`backend-private/` contient des données personnelles de tiers et des
identifiants : il est exclu de Git et ne doit jamais être copié dans le site
ni dans `backend/public`.

---

## 7. Personnalisation

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

## 8. Architecture en bref

| Couche | Où | Quoi |
| --- | --- | --- |
| Frontend | racine (`index.html`, `pages/`, `articles/`, `css/`, `js/`) | HTML, CSS et JavaScript natifs, sans dépendance |
| Génération | `node tools/build.mjs` | produit les 34 pages, `sitemap.xml`, `robots.txt` |
| Contrôle qualité | `node tools/check.mjs` | liens, ancres, images, métadonnées, JSON-LD, cohérence du sitemap |
| Backend | `backend/public/` | WordPress comme **infrastructure** : API, stockage, administration — aucune page publiée |
| Extension métier | `backend/public/wp-content/plugins/expert-parquet-leads/` | API REST, 4 tables dédiées, back-office, courriels, purge RGPD |
| Données privées | `backend-private/` | photographies, journaux, identifiants — hors Git, hors racine web |
| Déploiement statique | `node tools/build-deploy.mjs` | prépare `dist/` par liste blanche, refuse tout chemin interne |

Détails : [backend/docs/ARCHITECTURE.md](backend/docs/ARCHITECTURE.md),
[backend/docs/DATABASE.md](backend/docs/DATABASE.md),
[backend/docs/API.md](backend/docs/API.md),
[docs/BACKEND-CONTRACT.md](docs/BACKEND-CONTRACT.md).

---

## 9. Sécurité

Résumé volontairement sommaire ; le détail est dans
[backend/docs/SECURITY.md](backend/docs/SECURITY.md).

- **Backend séparé du site.** WordPress ne rend aucune page publique ; les chemins
  physiques `backend/` et `backend-private/` sont refusés par Apache.
- **Photographies hors racine web.** Stockées sous `backend-private/`, servies
  uniquement à une session autorisée, jamais mises en cache partagé.
- **API fermée par défaut.** Écriture seule en public, liste blanche d'origines
  explicite, jamais `*` ; l'API native de WordPress est fermée aux anonymes et la
  liste des comptes en est retirée.
- **Connexions limitées.** Les tentatives sont comptées par origine, jamais par
  identifiant, et l'empreinte conservée est pseudonymisée.
- **Anti-spam actif** sur les deux formulaires. Ses réglages ne sont pas documentés :
  les écrire reviendrait à publier le mode d'emploi du contournement.
- **Droits WordPress au minimum.** Une capacité métier dédiée, un rôle
  « Gestionnaire de demandes » qui n'atteint ni les extensions, ni les réglages, ni
  les comptes.
- **Aucun secret dans Git.** `wp-config.php`, `backend-private/` et les identifiants
  sont ignorés ; un modèle sans valeur (`backend/config/wp-config.example.php`) tient
  lieu de documentation.

---

## 10. Git et branches

Toutes les branches de travail sont **locales** : rien n'est publié sur `origin`.

| Branche | Rôle |
| --- | --- |
| `main` | version historique stable, publiée |
| `chore/repository-cleanup` | nettoyage du dépôt (données privées, cœur WordPress, outillage local ignorés) |
| `feature/front-v1` | frontend V1 |
| `feature/backend-v1` | backend et intégration V1 |
| `release/v1-validated` | **photographie locale de la V1 officiellement acceptée** |
| `feature/admin-backoffice-v2` | évolution de l'administration WordPress |
| `feature/v2-conversion-leads` | conversion, qualification et orientation commerciale |
| `feature/v2-integration` | **les deux chantiers V2 réunis** — c'est la branche de travail courante |

```
main
  └── chore/repository-cleanup
        └── feature/front-v1
              └── feature/backend-v1
                    └── release/v1-validated
                          ├── feature/admin-backoffice-v2 ─┐
                          └── feature/v2-conversion-leads ─┴─► feature/v2-integration
```

Les deux chantiers V2 partent **du même point** et restent séparés : l'administration
d'un côté, la conversion de l'autre. S'ils finissent par dépendre l'un de l'autre, le
rapprochement sera une décision explicite, pas un effet de bord.

---

## 11. V2 — Conversion et leads

Expert Parquet reste d'abord un site d'aide et d'expertise. Il doit ensuite permettre :

- la **génération de demandes** qualifiées ;
- la **distinction particulier / professionnel** ;
- l'**orientation** vers le bon interlocuteur.

```
Professionnel  →  Premibel
Particulier    →  Over Parquet
```

**STATUT : en validation — destination particulier à confirmer.**

Ce qui fonctionne : la qualification (le profil choisi au pré-diagnostic remplit
`customer_type` sans nouvelle donnée), l'orientation en fin de pré-diagnostic pour les
trois symptômes où un remplacement est plausible, un bloc compact sur l'accueil et sur
deux pages problème, et une suite commerciale après un devis enregistré.

Ce qui bloque, et n'est pas une question technique : **Over Parquet s'annonce « 100 % PRO
— Site réservé aux professionnels » et demande un KBIS à l'inscription.** La règle validée
envoie pourtant les particuliers chez lui. Tant qu'elle n'est pas tranchée, le code refuse
de produire ce lien et affiche un état informatif : aucun particulier n'est envoyé vers une
porte fermée. La table `PARCOURS` de `js/config/site.js` tient la décision en deux lignes.

| Profil | Destination validée | Ce que le site accepte |
| --- | --- | --- |
| Professionnel | Premibel — [guide d'inscription pro](https://www.premibel.fr/guide-inscription-pro/) | particuliers **et** professionnels |
| Particulier | Over Parquet — `over-parquet.com` | professionnels **uniquement** |

Chantier : `feature/v2-conversion-leads`.

---

## 12. Avant la production

Décisions encore ouvertes. Aucune ne relève du code : elles vous appartiennent.

| Sujet | État |
| --- | --- |
| Identité de l'éditeur | à arrêter — les mentions légales sont un gabarit |
| Durée de conservation RGPD | **non décidée** ; le back-office l'affiche comme telle et n'applique aucune valeur par défaut |
| Fournisseur SMTP | non configuré ; les courriels partent dans un journal privé |
| Relation commerciale avec Premibel | à documenter précisément |
| Relation commerciale avec Over Parquet | à documenter précisément |
| Mentions légales finales | à valider une fois l'identité arrêtée |
| DNS et HTTPS | à mettre en place (`expert-parquet.com`, éventuel domaine d'API) |
| Déploiement production | artefact prêt (`tools/build-deploy.mjs`), mise en ligne à décider |

Liste opérationnelle complète :
[backend/docs/PRODUCTION-CHECKLIST.md](backend/docs/PRODUCTION-CHECKLIST.md) et
[TODO-INTEGRATIONS.md](TODO-INTEGRATIONS.md).

---

## 13. État actuel

Le front est complet et le backend fonctionne : en local, les formulaires **écrivent
réellement** dans WordPress. Le site reste servi en statique ; les articles et le
référencement sont gérés par le générateur, jamais par WordPress.

- **En local**, le point d'envoi est résolu automatiquement (`LOCAL_API` de
  `js/config/site.js`) : contact et demande d'expertise enregistrent une demande, les
  photographies sont reçues, réencodées et stockées hors racine web.
- **Hors développement**, les points d'envoi (`FORMS.*Endpoint`) valent `null` : les
  formulaires restent en **démonstration** et l'annoncent explicitement. Renseigner un
  point d'envoi bascule en même temps le comportement et tous les textes qui en
  parlent, page de confidentialité comprise.
- `node tools/check.mjs` refuse la construction tant que le responsable du traitement,
  son adresse et la durée de conservation ne sont pas renseignés.
- Les coordonnées, mentions légales, tarifs et zone d'intervention sont des
  **placeholders explicites**.

La liste complète des branchements à faire figure dans
[TODO-INTEGRATIONS.md](TODO-INTEGRATIONS.md).

---

## 14. Crédits images

Les photographies proviennent de Pexels (licence libre). Sources détaillées :
[assets/images/CREDITS.md](assets/images/CREDITS.md).
