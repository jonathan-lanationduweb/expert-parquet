# Contrat backend — Expert Parquet

Ce document décrit **ce que le frontend envoie déjà** et **ce que le serveur devra
faire** le jour où il existera. Aucun backend n’est développé à ce stade.

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
  uploadEnabled: false,
  maxFiles: 6,
  maxFileSizeMo: 8,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
};
```

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

## 4. Photographies

**Aucune photo n’est envoyée à ce jour.** `FORMS.uploadEnabled` vaut `false`. Le front
sélectionne, prévisualise localement et permet de retirer un fichier de la sélection ; il
ne prétend jamais qu’un fichier est téléversé, et l’interface le dit.

Quand un service de stockage existera :

| Point | Valeur prévue |
| --- | --- |
| Transport | `multipart/form-data` — les métadonnées JSON dans un champ `payload`, les fichiers dans `photos[]` |
| Nombre maximum | 6 (`FORMS.maxFiles`) |
| Taille maximum par fichier | 8 Mo (`FORMS.maxFileSizeMo`) |
| Types acceptés | `image/jpeg`, `image/png`, `image/webp`, `image/heic` |

Ces limites sont **déjà appliquées côté navigateur**. Elles devront l’être **aussi** côté
serveur : le client n’est pas une source de vérité.

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

## 6. À prévoir côté serveur — rien n’est implémenté

C’est la liste des décisions à prendre avant d’ouvrir un point d’envoi.

- **Validation serveur obligatoire.** La validation du navigateur est un confort
  d’usage, pas une protection. Tout doit être revalidé : types, longueurs, appartenance
  aux énumérations, format du code postal, format de l’adresse e-mail.
- **Anti-spam.** À arbitrer entre un *honeypot* (champ leurre invisible : aucun tiers,
  aucun cookie, souvent suffisant à ce volume), Cloudflare Turnstile ou reCAPTCHA. Les
  deux derniers ajoutent un sous-traitant, donc un arbitrage RGPD.
- **Limitation de débit.** Par adresse IP et par point d’envoi, avec réponse `429` ; le
  front l’affichera comme une erreur réseau.
- **Types MIME.** Vérifier le contenu réel des fichiers, jamais l’extension ni le
  `Content-Type` déclaré par le client.
- **Taille d’envoi.** Plafond global de la requête, en plus du plafond par fichier.
- **Métadonnées des photos.** Les JPEG issus de téléphones portent souvent des
  coordonnées GPS. Les retirer au dépôt, sauf besoin explicite et signalé au visiteur.
- **Journalisation minimale.** Horodatage, point d’envoi, statut, identifiant de
  demande. Ne pas journaliser le contenu des messages ni les données personnelles.
- **RGPD.** Responsable du traitement, finalité, destinataires et durée de conservation
  doivent être publiés sur la page des mentions légales **avant** la première collecte.
  Voir `ARCHITECTURE.md` §14 et `TODO-INTEGRATIONS.md`.
- **Conservation.** Durée à arrêter — par exemple 24 mois après le dernier échange —
  avec purge automatique et procédure de suppression sur demande.

### Secrets

**Aucune clé d’API ni aucun secret ne doit figurer dans le frontend** : tout ce dossier
est servi au navigateur. `js/config/site.js` ne contient que des URL publiques.
L’authentification éventuelle du point d’envoi est l’affaire du serveur.
