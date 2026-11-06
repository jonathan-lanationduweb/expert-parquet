# Administrer le contenu d’Expert Parquet

Le site public est du HTML statique. Son contenu éditorial se gère dans WordPress
(`/wp-admin`), puis se publie en un clic. Le design, le moteur « Trouver mon
parquet », le pré-diagnostic, les formulaires et les catalogues produits restent
dans le code : rien de tout cela ne se modifie depuis WordPress.

Le menu **Expert Parquet** regroupe tout :

| Rubrique | Entrées |
|---|---|
| Contenu | Accueil · Conseils · Problèmes · FAQ · Pages · Médias |
| Site | Configuration du site · Identité · Apparence · Navigation · Footer · SEO · Publication du site · Maintenance · Utilisateurs |
| Activité | Demandes · Contacts · Devis · Photos · Emails |
| Administration | Réglages · Thèmes · Groupes de FAQ · Étiquettes |

Deux règles à retenir :

1. **Publier un contenu ne le met pas en ligne.** Il faut ensuite cliquer
   **Publier le site** (Contenu → Publication du site). Un rappel s’affiche dans
   l’éditeur tant que des contenus publiés attendent.
2. **Un brouillon n’atteint jamais le site public.** Il est visible dans
   l’aperçu seulement.

## Créer un conseil

Contenu → Conseils → **Ajouter**.

- **Titre** : le H1 de la page.
- **Texte** : l’éditeur. Blocs autorisés : paragraphe, titre (H2/H3), liste,
  citation, image, tableau, séparateur. Un lien vers une page du site s’écrit
  depuis la racine : `/pages/problemes/humidite.html`, `/articles/<slug>.html`.
  Les liens vers Premibel ou Over Parquet sont reconnus et balisés par le site.
- **Extrait** : le résumé affiché dans les cartes et les listes.
- **Image mise en avant** : l’image de couverture (et l’image de partage).
- **Classement** (colonne de droite) : format *Article* (dans `/articles/`) ou
  *Guide* (dans `/pages/conseils/`), **thème** (un seul), temps de lecture
  (vide = calculé), mise en avant sur l’accueil et son ordre.
- **Présentation** : chapô ; pour un guide, titre court, libellé court et
  introduction de l’en-tête.
- **Parcours de sortie** : vers quoi orienter le lecteur à la fin — moteur,
  pré-diagnostic, expertise ou aucun. Pour le moteur, des critères facultatifs
  (pièce, type, essence…) et l’encart de fin de texte. Le site construit le lien.
- **Contenus associés** et **questions fréquentes liées** : choisis dans des
  listes ; une question n’est jamais recopiée dans un contenu.
- **Référencement** : titre SEO (sans « | Expert Parquet »), meta description.

Puis **Enregistrer le brouillon**, **Prévisualiser**, et **Publier**.

## Créer un problème

Contenu → Problèmes → **Ajouter**. La page a une structure fixe ; vous
remplissez : titre, titre court, libellé court, accroche, introduction,
symptômes, causes (`Titre | Explication`, une par ligne), erreurs,
vérifications, « quand demander une expertise », remplacement plausible,
problème du pré-diagnostic associé, contenus associés, FAQ liées, mise en avant,
parcours de sortie, SEO. L’éditeur sert à un complément facultatif.

## Gérer la FAQ

Contenu → FAQ. Une question = un contenu : la question en titre, la réponse dans
l’éditeur, un **groupe** (colonne de droite) et un **ordre** (boîte Attributs).

| Groupe | Où la question s’affiche |
|---|---|
| Accueil, Diagnostic, Contact | la section FAQ de la page du même nom |
| Problèmes, Travaux, Expertise | la page FAQ, dans cet ordre |
| Contenus | nulle part seule : à rattacher à un conseil ou un problème |

Dépublier une question (brouillon) la retire du site au prochain « Publier le
site ».

## Gérer une image

Contenu → Médias. Téléversez (JPEG de préférence, 1600 px de large ou plus),
renseignez le **texte alternatif** (vide = image décorative), puis choisissez
l’image comme « image mise en avant » d’un contenu. Remplacer une image : la
téléverser, puis la sélectionner à la place de l’ancienne. Supprimer un média
que plus aucun contenu n’utilise le retire du site au prochain build.

Les photographies envoyées avec les demandes d’expertise ne sont pas dans la
médiathèque : elles restent dans le stockage privé des demandes.

## Modifier l’accueil

Contenu → Accueil. Les textes du hero, du bloc « Trouver mon parquet », des
sections Problèmes, Conseils, Expertise et FAQ sont des champs. L’image du hero
est l’image mise en avant. Les quatre problèmes et les trois conseils affichés
sont ceux marqués **« mis en avant »** dans leur fiche (avec un ordre). La FAQ de
l’accueil est le groupe « Accueil ». La structure de la page ne change pas.

Les pages À propos, Expertise, Diagnostic, Contact, Conseils et Problèmes se
modifient de la même façon (Contenu → Pages) : un en-tête à champs, un texte
dans l’éditeur quand la page en a un.

## Configuration du site

Site → **Configuration du site** est le point d’entrée : une carte par écran, avec
l’état de chacun. Le tableau de bord y renvoie aussi (ligne « Configuration du
site », sous les raccourcis). Tout ce qui est modifié ici est **mis en attente**
jusqu’au prochain **Publier le site** : la page Publication et le tableau de
bord l’indiquent (« Configuration du site modifiée : à publier »). Le bouton
**Prévisualiser** de chaque écran reconstruit l’aperçu avec la configuration
enregistrée, sans toucher au site en ligne.

Ce qui n’est **pas** administrable, volontairement : tailles, marges, arrondis,
typographies, CSS, structure des pages, gabarits. La direction artistique du site
est figée dans le code ; WordPress fournit les valeurs, pas le dessin.

### Identité (administrateur)

Nom du site, baseline, logo principal (fond clair), logo clair (fond sombre :
pied de page, menu mobile), logo sombre (variante), symbole, favicon, image de
partage par défaut. Chaque image se choisit dans la médiathèque ; **Supprimer**
revient à la valeur de repli (logo principal, favicons actuels du site, image du
hero). Le favicon doit être carré : le site produit les tailles 16, 32 et 180 à
partir de l’original et les range dans `assets/icons/cms/` ; sans favicon
choisi, les fichiers historiques de `assets/icons/` restent servis.

### Apparence (administrateur)

Une seule décision : la **couleur d’accent** (boutons, filets, numéros, liens
actifs), en hexadécimal strict `#RRGGBB`. Une valeur invalide est refusée à
l’enregistrement et refusée au build. Le terracotta officiel est `#B04A1E` :
avec lui, le site est strictement identique à la V1 (le build écrit
`css/theme.css` avec les valeurs d’origine). Avec une autre couleur, le build
dérive les nuances (foncée, pâle, sur fond sombre) ; le reste de la palette ne
bouge pas.

### Navigation (éditeur ou administrateur)

Les entrées métier (Problèmes, Conseils, Diagnostic, Expertise, À propos) :
libellé, ordre (à partir de 1), visibilité. Jusqu’à **quatre liens
personnalisés** (libellé + adresse `https://`, ouverts dans un nouvel onglet
avec `rel="noopener"`). Libellé du bouton du header ; sa destination reste le
moteur « Trouver mon parquet ». Le menu mobile suit la même liste.

### Footer (éditeur ou administrateur)

Phrase d’accroche, **jusqu’à quatre colonnes** (titre, ordre, visibilité,
suppression) de liens, liens légaux, réseaux sociaux (Instagram, Facebook,
LinkedIn, YouTube) et copyright. Un lien a un **type** qui borne sa
destination : page du site, parcours, partenaire (liste fermée), externe
(`https://`), e-mail, téléphone. Les icônes viennent d’une bibliothèque fermée
(les quatre réseaux, e-mail, téléphone, externe) : pas de téléversement d’icône.
La disposition s’adapte au nombre de colonnes (1 à 4) ; avec trois colonnes et
les liens d’origine, le pied de page est identique à la V1.

### SEO global (administrateur)

Nom du site, suffixe des titres (toujours séparé du titre par une espace :
« Titre | Expert Parquet »), titre et description par défaut, image sociale
par défaut (prioritaire sur celle de l’Identité), données Organization et
WebSite (JSON-LD de l’accueil), et l’interrupteur **Indexation**. L’indexation
ne vaut qu’en production : hors production le build écrit toujours `noindex` et
un `robots.txt` bloquant, quel que soit le réglage. Le bloc **Sitemap** rappelle
le nombre d’adresses, la date du dernier build, l’état d’indexation et les
adresses de `sitemap.xml` et `robots.txt` ; le sitemap n’est pas éditable, il
découle des contenus publiés.

### SEO d’un contenu

Dans chaque conseil, problème et page : boîte **Référencement** avec slug, titre
SEO, description, image sociale et un aperçu du résultat (titre avec suffixe,
adresse, description) mis à jour pendant la saisie. Vide, chaque champ retombe
sur le titre du contenu, son extrait, son image mise en avant puis l’image par
défaut.

### Réglages techniques

Jeton de build, chemins, commandes, environnement, clés : ils ne sont **jamais**
affichés dans ces écrans ni exportés dans l’instantané. Ils vivent dans
`wp-config.php`, `backend-private/` et Administration → Réglages, réservés à
l’administrateur.

## Prévisualiser

Bouton **Prévisualiser** de l’éditeur (ou **Aperçu** dans une liste). Le site est
reconstruit en quelques secondes dans `/_preview/` avec les brouillons, et
s’ouvre sur votre contenu. Enregistrez le brouillon avant : l’aperçu montre ce
qui est enregistré.

## Publier le site

Contenu → **Publication du site** → **Publier le site**. L’écran affiche l’état
(date, nombre de pages, succès ou échec), les contenus en attente et le journal.
Si le contrôle qualité trouve une erreur (lien cassé, image manquante…), le site
précédent reste en ligne et l’erreur s’affiche.

En local, la publication tourne sur la machine. En production, elle passera par
un déclenchement distant (lot ultérieur) ; d’ici là, `node tools/publish.mjs
--mode site` fait la même chose en ligne de commande.

## Mode maintenance

Contenu → Publication du site → panneau **Page de maintenance**.

- **Enregistrer** : titre, message, date de retour, e-mail de contact, image de
  fond. La page `maintenance.html` est réécrite immédiatement.
- **Aperçu de la page de maintenance** : la voir sans l’activer.
- **Activer la maintenance** : effet immédiat pour tout le public — chaque
  adresse du site répond `503` avec la page de maintenance et `Retry-After`.
  WordPress, la connexion et l’API restent accessibles. Le bouton « Voir le site
  malgré la maintenance » vous laisse passer.
- **Désactiver la maintenance** : le site est de nouveau servi, immédiatement.

Aucun rebuild n’est nécessaire : l’activation repose sur un fichier témoin lu
par le serveur web.

## Rôles

| Rôle | Peut | Ne peut pas |
|---|---|---|
| Rédacteur de contenu | créer, modifier, téléverser des médias, remplir le SEO d’un contenu | publier un contenu, publier le site, configurer le site |
| Éditeur de contenu | la même chose, publier, dépublier, ordonner, publier le site, activer la maintenance, **Navigation et Footer** | Identité, Apparence, SEO global, réglages techniques, administrer WordPress |
| Gestionnaire de demandes | les demandes, contacts, devis, photos | le contenu, la configuration |
| Administrateur | tout, dont Identité, Apparence, SEO global et les réglages techniques | — |
