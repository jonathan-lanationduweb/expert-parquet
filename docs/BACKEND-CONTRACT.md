# Contrat backend — Expert Parquet

Ce document décrit **ce que le frontend envoie** et **ce que le serveur en fait**.

Le backend existe désormais : c'est une installation WordPress dédiée, dans le projet
`backend/public` du projet, qui ne publie aucune page et sert uniquement d'API,
de stockage et d'administration. Les demandes sont stockées dans **quatre tables
dédiées** (`{prefix}expert_parquet_leads`, `_lead_photos`, `_lead_notes`,
`_lead_events`), jamais dans les tables de contenu de WordPress. Son propre `README.md` couvre l'installation,
l'exploitation et la mise en service ; le présent document ne décrit que **le contrat
entre les deux**.

Le site reste **en mode démonstration** tant que les points d'envoi de
`js/config/site.js` valent `null` — c'est l'état livré, et le site l'affiche
honnêtement, sur les formulaires comme sur la page de confidentialité.

Une exception, locale et uniquement à l'exécution : servi sur `expert-parquet.test`,
`localhost` ou `127.0.0.1`, le front appelle le backend **local** (table `LOCAL_API`
de `site.js`) et masque les mentions de démonstration. Le générateur ne voit jamais
cette table ; le HTML publié, GitHub Pages et la préproduction restent en
démonstration, et les garde-fous de `tools/check.mjs` portent sur `FORMS`, qui n'a pas
bougé.

Il documente la réalité du front, pas un idéal : les noms de champs ci-dessous sont
exactement ceux des attributs `name` présents dans le HTML généré. Aucun champ n’a été
ajouté au formulaire pour correspondre à ce contrat.

---

## 1. Deux modes, une seule bascule

`js/config/site.js` :

```js
export const FORMS = {
  endpoint: null,          // repli commun
  contactEndpoint: null,   // data-form="contact"
  quoteEndpoint: null,     // data-form="devis"
  method: 'POST',
  maxFiles: 6,
  maxFileSizeMo: 8,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
};
```

Le téléversement des photographies n'a **pas** d'interrupteur à lui : `uploadEnabled()`
suit l'existence du point d'envoi de la demande d'expertise. Deux réglages
indépendants auraient permis un état incohérent — un formulaire qui envoie la demande
mais abandonne les photographies en silence.

| Mode | Condition | Comportement du front |
| --- | --- | --- |
| **DEMO** | aucun point d’envoi | Validation locale, puis récapitulatif lisible de la saisie. **Aucun appel réseau, aucun faux succès.** L’écran de fin s’intitule « Votre demande n’a pas été transmise ». |
| **LIVE** | un point d’envoi est renseigné | `POST` JSON, gestion de l’attente, du succès, de l’erreur réseau et du refus serveur. |

`endpointFor(nomDuFormulaire)` est le **seul** endroit qui décide : point d’envoi propre,
sinon repli commun, sinon `null`. `formMode()` en dérive `'demo'` ou `'live'`.

Passer en LIVE ne demande que de renseigner une URL. **Aucun gabarit à refaire.**

### États exposés

`js/modules/forms.js` écrit l’état courant sur l’élément en `data-form-state`, et le mode
en `data-form-mode` :

`idle` → `validating` → (`demo` | `submitting` → `success` | `error`)

`demo` et `success` sont deux états **distincts** : le site ne doit jamais laisser croire
qu’une demande est partie alors qu’elle ne l’est pas.

---

## 2. Charge utile — CONTACT

`POST` `contactEndpoint`, `Content-Type: application/json`.

```json
{
  "nom": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "telephone": "+33 6 12 34 56 78",
  "objet": "question-technique",
  "message": "Mon parquet grince dans le couloir depuis cet hiver…",
  "consentement": "oui",
  "_form": "contact",
  "_page": "/pages/contact.html"
}
```

| Champ | Type | Obligatoire | Valeurs |
| --- | --- | --- | --- |
| `nom` | string | oui | libre |
| `email` | string | oui | validé côté client, **à revalider côté serveur** |
| `telephone` | string | non | libre |
| `objet` | enum | oui | `question-technique` · `demande-expertise` · `suivi-dossier` · `partenariat` · `autre` |
| `message` | string | oui | 20 caractères minimum côté client |
| `consentement` | `"oui"` | oui | présent seulement si la case est cochée |
| `_form` | string | — | ajouté par le front : `"contact"` |
| `_page` | string | — | ajouté par le front : `window.location.pathname` |

---

## 3. Charge utile — DEMANDE D’EXPERTISE / DEVIS

`POST` `quoteEndpoint`, `Content-Type: application/json`.

```json
{
  "probleme": ["grincement", "lames-mobiles"],
  "type": "massif",
  "anciennete": "2-10-ans",
  "support": "dalle-beton",
  "piece": "sejour",
  "surface": "25-50",
  "logement": "appartement",
  "profil": "particulier",
  "code_postal": "75011",
  "ville": "Paris",
  "delai": "mois",
  "description": "Depuis cet hiver, plusieurs lames du séjour se sont bombées…",
  "prenom": "Jean",
  "nom": "Dupont",
  "email": "jean.dupont@example.com",
  "telephone": "+33 6 12 34 56 78",
  "consentement": "oui",
  "_form": "devis",
  "_page": "/pages/devis.html"
}
```

| Champ | Type | Obligatoire | Valeurs |
| --- | --- | --- | --- |
| `probleme` | string[] | oui, au moins un | `grincement` · `gonflement` · `lames-mobiles` · `humidite` · `taches` · `rayures` · `deformation` · `degat-des-eaux` · `defaut-de-pose` et 2 autres — liste de référence dans `js/config/options.js` (`PROBLEMES`) |
| `type` | enum | non | `massif` · `contrecolle` · `stratifie` · `autre` · `inconnu` |
| `anciennete` | enum | non | `moins-6-mois` · `6-mois-2-ans` · `2-10-ans` · `plus-10-ans` · `inconnu` |
| `support` | enum | non | `dalle-beton` · `chape` · `plancher-bois` · `ancien-revetement` · `plancher-chauffant` · `inconnu` |
| `piece` | enum | non | `sejour` · `chambre` · `cuisine` · `salle-de-bain` · `couloir` · `bureau` · `plusieurs` · `autre` |
| `surface` | enum | non | `moins-10` · `10-25` · `25-50` · `50-100` · `plus-100` · `inconnu` |
| `logement` | enum | non | `maison` · `appartement` · `local-pro` · `autre` |
| `profil` | enum | non | `particulier` · `professionnel` |
| `code_postal` | string | oui | 5 chiffres, validé côté client |
| `ville` | string | oui | libre |
| `delai` | enum | non | `urgent` · `mois` · `trimestre` · `reflexion` |
| `description` | string | oui | 30 caractères minimum côté client |
| `prenom` | string | oui | libre |
| `nom` | string | oui | libre |
| `email` | string | oui | validé côté client |
| `telephone` | string | non | libre |
| `consentement` | `"oui"` | oui | — |

### Le cas de `diagnosticContext`

Le pré-diagnostic ne transmet aujourd’hui son contexte que par des **paramètres d’URL**
(`?probleme=…&type=…&piece=…`), que `prefillFromUrl()` reporte dans les champs
correspondants. Il n’existe donc **pas** de champ `diagnosticContext` dans le formulaire,
et ce contrat n’en invente pas.

Le jour où l’on voudra transmettre l’orientation complète, l’objet `answers` de
`js/modules/diagnostic.js` contient déjà tout : il suffira de le sérialiser sous la clé
`diagnosticContext`.

**Ce n’est pas un diagnostic affirmatif** : c’est la trace des réponses du visiteur et
d’une orientation générale. Le serveur ne doit jamais le présenter comme un constat, et
l’avertissement qui accompagne le pré-diagnostic — « ce pré-diagnostic constitue une
première orientation et ne remplace pas une expertise sur place » — doit rester affiché.

---

## 4. Photographies — deux requêtes, pas une

En mode démonstration, le front sélectionne, prévisualise localement et permet de
retirer un fichier ; il ne prétend jamais qu’un fichier est téléversé, et l’interface
le dit.

En mode LIVE, **la demande part d’abord, les photographies suivent** :

1. `POST /quote` en JSON → `{ ok, reference, photoToken, photoUrl }` ;
2. `POST` vers `photoUrl` en `multipart/form-data`, champs `token` et `photos[]`.

Un envoi unique ferait perdre la demande entière si le téléversement de six fichiers
de huit mégaoctets échouait en fin de course — c’est-à-dire au pire moment, sur une
connexion mobile. Ici, le sort des photographies ne remet jamais la demande en cause :
l’écran de confirmation dit combien ont été reçues, et le dit aussi quand aucune ne
l’a été.

`photoToken` vit trente minutes et n’autorise que l’ajout de fichiers à **cette**
demande : connaître une référence ne suffit pas à greffer une photographie sur le
dossier de quelqu’un d’autre. Il n’ouvre aucune lecture. Le plafond de six
photographies vaut **par demande**, cumulé sur toutes les requêtes du jeton.

`reference` est une référence publique aléatoire — 128 bits (`random_bytes(16)`) en
base32 minuscule, 26 caractères `[a-z2-7]` — : l’API n’expose jamais l’identifiant SQL,
séquentiel donc devinable. Ce n’est pas un secret : elle n’ouvre accès à rien. C’est elle qui figure dans
l’accusé de réception et que le gestionnaire retrouve dans le back-office.

| Point | Valeur |
| --- | --- |
| Nombre maximum | 6 (`FORMS.maxFiles`) |
| Taille maximum par fichier | 8 Mo (`FORMS.maxFileSizeMo`) |
| Types acceptés côté navigateur | `image/jpeg`, `image/png`, `image/webp`, `image/heic` |
| Types acceptés côté serveur | `image/jpeg`, `image/png`, `image/webp` — lus **dans les octets** |

`image/heic` est proposé au navigateur parce que c’est le format par défaut des
iPhone, mais le serveur ne le stocke pas tel quel : GD ne le lit pas. Safari convertit
en JPEG à la sélection dans la quasi-totalité des cas ; si un fichier HEIC brut arrive,
il est refusé avec un message explicite plutôt qu’enregistré illisible.

Ces limites sont appliquées côté navigateur **et** côté serveur : le client n’est pas
une source de vérité. Le serveur **réencode** systématiquement, ce qui neutralise d’un
coup le fichier polyglotte, le SVG déguisé, les données arbitraires en fin de fichier —
et supprime l’EXIF, donc les coordonnées GPS.

### Champs techniques ajoutés par le front

| Champ | Contenu | Rôle |
| --- | --- | --- |
| `_form` | `contact` ou `devis` | origine |
| `_page` | chemin de la page | contexte |
| `_hp` | toujours vide | champ leurre : rempli, la demande est refusée |
| `_ts` | **durée** de remplissage, en millisecondes | sous trois secondes, la demande est refusée |
| `diagnosticContext` | les paramètres d’URL reçus au chargement (`probleme`, `type`, `piece`, `via=pre-diagnostic`) | trace des réponses au pré-diagnostic, conservée telle quelle — **jamais un constat** ; le visiteur peut avoir modifié ses réponses dans le formulaire, les deux sont gardés |

`_ts` est une durée, **pas un horodatage absolu**. Le site étant statique, aucun
serveur ne peut horodater la page : il faudrait comparer l’horloge du visiteur à celle
du serveur, et quelques secondes d’avance sur une machine mal réglée suffiraient à
faire refuser une demande légitime, avec un message générique et aucun recours.

---

## 5. Réponses attendues du serveur

| Cas | Statut | Corps | Réaction du front, déjà codée |
| --- | --- | --- | --- |
| Accepté | `200` / `201` | libre | état `success`, écran de confirmation |
| Champs refusés | `422` | `{ "errors": { "email": "Adresse invalide" }, "message": "…" }` | état `error`, message posé **sous chaque champ concerné**, focus sur le premier, saisie conservée |
| Autre erreur | `4xx` / `5xx` | libre | état `error`, message réseau, saisie conservée |
| Réseau injoignable | — | — | idem |

Les clés de `errors` doivent être les `name` exacts des tableaux ci-dessus.

---

## 6. Ce que le serveur fait — et ce qui reste à décider

Tout ce qui suit est **implémenté** dans `backend/public`. Le détail et les
raisons sont dans les commentaires de chaque classe de l’extension, et dans son
`README.md`.

- **Validation serveur.** Tout est revalidé : types, longueurs, appartenance aux
  énumérations, format du code postal, format de l’adresse e-mail. `EP_Schema` tient
  les onze énumérations et leurs soixante et une valeurs, copiées de
  `js/config/options.js`. `php bin/verifier-enums.php` signale toute dérive entre les
  deux — sans quoi un choix ajouté côté front serait refusé en silence par l’API.
- **Anti-spam sans tiers.** Champ leurre, durée de remplissage, limitation de débit
  (5 envois / 10 min par empreinte d’IP, 60 / heure au total). Ni CAPTCHA ni cookie :
  cela aurait ajouté un sous-traitant, un arbitrage RGPD et une dépendance réseau qui
  casse le formulaire quand le service tombe. Turnstile reste possible **le jour où du
  spam passe réellement**, pas avant.
- **Message de refus neutre.** Toutes les causes anti-robots donnent le même message :
  détailler « votre horodatage est trop récent » apprendrait à un robot comment passer.
- **Types MIME lus dans les octets**, jamais l’extension ni le `Content-Type` déclaré.
  Et au-delà : réencodage systématique.
- **Taille d’envoi.** Plafond par fichier et plafond global. Quand la requête dépasse
  `post_max_size`, PHP vide `$_POST` avant que le code ne s’exécute : ce cas est
  détecté et répond `413` avec un message compréhensible, au lieu du « dépôt non
  autorisé » trompeur qu’aurait produit l’absence de jeton.
- **Métadonnées des photos.** L’EXIF disparaît au réencodage, coordonnées GPS
  comprises.
- **Journalisation minimale.** **Aucune adresse IP en clair** — ni en base, ni en
  transient, ni dans les journaux : seule une empreinte salée sert à compter. Le contenu
  des messages n’est jamais journalisé.
- **RGPD.** Responsable du traitement, finalité, destinataires et durée de conservation
  sont générés sur la page des mentions légales **à partir de** `CONTACT` et `RGPD`
  dans `js/config/site.js`. `tools/check.mjs` **refuse la construction** si un point
  d’envoi est renseigné sans ces valeurs : une page qui promet « aucune donnée n’est
  collectée » alors que le formulaire collecte serait une fausse déclaration.
- **Conservation.** Purge quotidienne automatique : une demande close est effacée avec
  ses photographies après `EP_CONSERVATION_MOIS` mois, une demande indésirable après
  trente jours. Cette constante doit être égale à `RGPD.conservationMois` côté front ;
  le script de vérification compare les deux.

### Ce qui reste à décider — et que personne d’autre ne peut décider

- **La durée de conservation** (`RGPD.conservationMois`). Elle dépend de l’usage réel
  des dossiers, pas de la technique.
- **L’identité du responsable du traitement** (`CONTACT.legalEntity`, `CONTACT.email`).
- **Le fournisseur d’envoi de courriels.** Sans lui, les notifications sont écrites
  dans un journal privé plutôt qu’expédiées — et l’administration le rappelle.
- **Une procédure de suppression sur demande.** L’effacement d’une demande depuis le
  back-office fonctionne et emporte les photographies ; ce qui manque est la procédure
  humaine : qui reçoit la demande, sous quel délai, avec quelle trace.

### Secrets

**Aucune clé d’API ni aucun secret ne doit figurer dans le frontend** : tout ce dossier
est servi au navigateur. `js/config/site.js` ne contient que des URL publiques.
L’authentification éventuelle du point d’envoi est l’affaire du serveur.
