# Règles éditoriales — Expert Parquet

Document **interne**. Il fixe la manière d'écrire sur ce site. Il ne répète pas
ce qui est déjà documenté ailleurs :

- l'architecture technique et les pièges du générateur → `ARCHITECTURE.md`
- les sujets à traiter et leur priorité → `docs/CONTENT-ROADMAP.md`
- les photographies, leurs sources et leurs licences → `assets/images/CREDITS.md`

---

## 1. La règle qui prime sur toutes les autres

**Ce site ne conclut pas à distance.** Aucune page, aucun article, aucune
réponse de FAQ ne doit affirmer la cause d'un désordre qu'on n'a pas observé.

Concrètement :

| À éviter | À écrire |
| --- | --- |
| « Votre parquet gondole à cause d'une remontée capillaire. » | « Un bombement le long d'un mur évoque une remontée d'humidité du support, sans qu'on puisse l'affirmer sans mesure. » |
| « Il faut poncer. » | « Le ponçage se justifie quand l'épaisseur utile le permet — c'est la mesure qui décide. » |
| « Ce défaut est une malfaçon. » | « Des symptômes réguliers sur toute la surface orientent vers les conditions de pose. » |

Le conditionnel n'est pas une précaution de langage : c'est la description
exacte de ce qu'on sait depuis un écran. Un texte qui tranche à distance
contredit la promesse même du site, et se retourne contre lui à la première
observation qui dit l'inverse.

## 2. Structure d'un article

L'ordre est toujours le même, parce qu'il suit celui du lecteur.

1. **Chapô** (`standfirst`) — deux ou trois phrases. Ce que l'article résout.
2. **La réponse courte** — un `<h2>` qui répond immédiatement. Le lecteur qui
   s'arrête là doit déjà avoir gagné quelque chose.
3. **Le mécanisme** — pourquoi le phénomène se produit. C'est ce qui distingue
   un contenu utile d'une liste d'astuces.
4. **Les cas de figure** — situations, variantes, ce qui est normal et ce qui
   ne l'est pas.
5. **Ce que le lecteur peut vérifier lui-même** — une liste ordonnée d'actions
   réalisables sans outillage, ou avec un outil à quelques euros.
6. **Les réflexes à éviter** — souvent la partie la plus utile, parce qu'elle
   empêche une dépense inutile.
7. **Quand une expertise devient utile** — jamais « appelez-nous », toujours
   des critères. Trois situations concrètes valent mieux qu'une invitation.
8. **FAQ** — seulement si deux vraies questions restent. Sinon, pas de FAQ.
9. Contenus associés et rappel d'action : produits par le gabarit.

**Longueur** : 800 à 1 200 mots pour un guide. Un sujet qui tient en 600 mots
s'écrit en 600 mots. Rien n'est ajouté pour atteindre un seuil.

## 3. Ce qu'on n'écrit pas

- Aucun chiffre invérifiable : nombre de chantiers, années d'expérience,
  pourcentage de réussite, délai d'intervention.
- Aucune promesse de résultat.
- Aucun superlatif commercial (« la meilleure solution », « incontournable »).
- Aucune formule de remplissage (« il est important de noter que »,
  « dans le monde d'aujourd'hui », « comme chacun sait »).
- Aucune FAQ écrite pour occuper une place dans les résultats de recherche.

## 4. Zéro plagiat — la méthode, pas l'intention

Les concurrents et les forums servent à **identifier les questions réellement
posées**. Jamais de source de texte.

Interdits, sans exception : reprendre une structure complète d'article, un
paragraphe, une formulation caractéristique, un tableau, une FAQ, un visuel
protégé.

La méthode qui l'évite en pratique :

1. Rassembler les faits depuis **plusieurs** sources indépendantes.
2. Les vérifier entre elles, et noter les désaccords plutôt que de choisir.
3. Fermer les sources.
4. Écrire depuis le raisonnement technique, dans la voix du site.

Un article qui ne peut pas s'écrire sans avoir une page ouverte à côté n'est
pas prêt à être écrit.

## 5. Sources

Par ordre de confiance :

1. **NF DTU** de la famille 51 (51.1 clouée, 51.2 collée, 51.11 flottante) et
   normes produit (NF EN 13226 pour le massif, NF EN 13489 pour le contrecollé).
2. **Organismes professionnels** de la filière bois, **CSTB**, avis techniques.
3. **Fiches techniques fabricants et distributeurs**.
4. **Publications expertes** reconnues.
5. **Magazines travaux, comparateurs, forums** — pour les questions uniquement.

Les valeurs relevées dans une source secondaire sont signalées comme telles
jusqu'à vérification dans le texte normatif. Écrire « la valeur couramment
retenue est de… » plutôt que « la norme impose… » quand on n'a pas lu la norme.

**Toute source consultée pour un article est consignée** dans
`docs/CONTENT-ROADMAP.md`, section « Sources par article ».

## 6. Vocabulaire

Le lexique du site est technique mais sans jargon décoratif. Quelques
constantes :

| On dit | On ne dit pas |
| --- | --- |
| désordre | sinistre (sauf après un vrai sinistre), problème |
| jeu périphérique | espace de dilatation |
| épaisseur utile | épaisseur ponçable |
| couche noble | parement d'usure, couche de surface |
| siccité | sécheresse |
| hygrométrie | humidité (quand on parle de l'air) |
| contrecollé | semi-massif, « parquet flottant » comme nom de produit |
| pré-diagnostic | diagnostic (jamais, pour l'outil en ligne) |

« Parquet flottant » désigne un **type de pose**, pas une structure. Un
contrecollé peut être collé ; un flottant est une manière de poser.

Typographie : espace insécable (`&nbsp;`) avant `? ! : ;` et dans les unités
(`5&nbsp;mm`). Apostrophes courbes. Guillemets français.

## 7. Liens internes

Chaque article relie au minimum :

- la **page problème** correspondante, s'il en existe une ;
- un **guide** ou un **autre article** du même cluster ;
- le **pré-diagnostic** ou la **demande d'expertise**, une seule fois, à la fin.

Les ancres décrivent la destination en langue naturelle — « la page parquet qui
gondole », pas « parquet gondolé pas cher ». Aucune ancre optimisée.

Les recommandations de fin de contenu sont **calculées**, pas écrites à la main
dans le HTML : renseigner `tags` et `related` dans le catalogue `ARTICLES`
(`tools/partials.mjs`) suffit, `tools/content/graph.mjs` fait le reste. Voir
`ARCHITECTURE.md` §19.

## 8. Premibel

**Quand.** Uniquement au moment où le lecteur passe d'une problématique
technique à une intention de choix ou d'achat — c'est-à-dire après que la cause
du désordre a été traitée dans le texte. Jamais en introduction, jamais dans un
article de diagnostic.

**Combien.** 0 à 2 liens par article. La majorité des articles n'en portent
aucun, et c'est l'état normal. Sur les huit articles publiés le 11/09/2026,
cinq n'ont aucun lien.

**Comment.** Ancres descriptives (« parquets massifs », « contrecollés »,
« gammes huilées »), jamais d'impératif commercial. Les destinations sont
centralisées dans la constante `PREMIBEL` de `tools/partials.mjs`, et chaque URL
y est vérifiée avant usage — **aucune catégorie n'est devinée**.

**Ce qu'on n'écrit pas.** Toute formule affirmant une indépendance qui n'a pas
été établie : « nous recommandons en toute indépendance », « notre sélection
impartiale », « le meilleur rapport qualité-prix ». Voir §11 ci-dessous.

## 9. Images et textes alternatifs

Chaque photographie est **regardée** avant d'être décrite. Pas d'exception.

- Image **informative** (elle montre le sujet) → `alt` court, descriptif,
  naturel. « Parquet en damier au ras du sol, à la jonction d'un mur et de sa
  plinthe. »
- Image **décorative** (fond de hero sous un dégradé, texture employée comme
  aplat, photographie qui ne montre pas son sujet) → `alt=""`.
- **Jamais** d'`alt` qui décrit ce que la page raconte plutôt que ce que la
  photo montre. « Lames de parquet gondolées » sur une photo de planches plates
  est un mensonge pour un lecteur d'écran.
- **Jamais** de mots-clés dans un `alt`.

Les descriptions vivent dans un dictionnaire unique, `tools/images.mjs` : une
photographie, une description, quel que soit l'endroit où elle est employée.
Une image non déclarée fait échouer le build.

## 10. Données structurées

Autorisées : `Article`, `FAQPage`, `BreadcrumbList`, `WebSite`.

Interdites tant que les informations n'existent pas réellement : `Review`,
`AggregateRating`, `Offer` et tout prix, `author` nommé, `Organization` avec
une raison sociale. Un balisage qui décrit une réalité inexistante est une
fausse déclaration, pas une optimisation.

## 11. Transparence — points à clarifier

Deux sujets ne relèvent pas de la rédaction et attendent une décision de
l'éditeur :

1. **La nature de la relation avec Premibel.** Si une relation commerciale ou
   organisationnelle existe, elle doit être annoncée, et les liens porter
   `rel="sponsored"`. En attendant, les formulations restent descriptives
   (« les catalogues spécialisés publient ces caractéristiques ») et
   n'affirment aucune indépendance.
2. **L'identité de l'éditeur.** Le site emploie « nous » sans que personne ne
   soit identifié. Tant que `CONTACT` (`js/config/site.js`) est vide, aucun
   texte ne doit laisser entendre une structure, une équipe ou une
   qualification. Voir `TODO-INTEGRATIONS.md`.

## 12. Avant de publier

- [ ] Aucune affirmation de cause sans observation
- [ ] Réponse directe dans le premier `<h2>`
- [ ] Une section « ce que vous pouvez vérifier vous-même »
- [ ] Une section « quand une expertise devient utile », avec des critères
- [ ] `tags` et `related` renseignés dans `ARTICLES`
- [ ] Liens internes vers le problème, un guide, et le parcours
- [ ] 0 à 2 liens Premibel, au bon endroit du texte
- [ ] Sources consignées dans `CONTENT-ROADMAP.md`
- [ ] Photographie regardée, `alt` conforme à ce qu'elle montre
- [ ] `node tools/build.mjs && node tools/check.mjs` sans erreur
