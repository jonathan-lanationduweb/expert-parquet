# API

Espace de noms `expert-parquet/v1`. Base locale :
`http://expert-parquet-dev.local/wp-json/expert-parquet/v1` — le site et
WordPress partagent l'hôte, le front l'appelle donc en chemin relatif
`/wp-json/expert-parquet/v1`. En production, l'API pourra vivre sur son
propre domaine : c'est `FORMS.*Endpoint` qui décide.

Aucune authentification, aucun nonce : les visiteurs ne sont pas connectés.
Voir [SECURITY.md](SECURITY.md) pour ce qui protège ces routes à la place.
Toutes les routes écrivent et lisent dans les **tables dédiées** via les
dépôts — jamais dans `posts`/`postmeta`.

## Routes

| Méthode | Route | Rôle | Réponse |
|---|---|---|---|
| `GET` | `/health` | sonde | `200 {"ok":true}` |
| `POST` | `/contact` | formulaire de contact | `201 {"ok":true,"reference":"…"}` |
| `POST` | `/quote` | demande d'expertise | `201 {"ok":true,"reference":"…","photoToken":"…","photoUrl":"…"}` |
| `POST` | `/quote/{ref}/photos` | dépôt des photographies | `200 {"ok":true,"recues":n,"refusees":[…]}` |

`{ref}` est la **référence publique** : 128 bits aléatoires en base32
minuscule, 26 caractères `[a-z2-7]` (`apjrjecj72woyxhegbef4zf7la`). L'identifiant
SQL n'apparaît nulle part. La référence n'est pas un secret : elle n'ouvre
aucun accès ; le dépôt de photographies exige un jeton distinct.

## Charge utile

JSON, `Content-Type: application/json`. Les noms de champs sont ceux du
contrat front (`js/config/options.js`, vérifié par `bin/verifier-enums.php`).

**Contact** : `nom`, `email`, `telephone`?, `objet` (enum), `message` (≥ 20),
`consentement` (`"oui"`).

**Devis** : `probleme` (tableau d'enum, ≥ 1), `type`?, `anciennete`?,
`support`?, `piece`?, `surface`?, `logement`?, `profil`?, `code_postal`
(5 chiffres), `ville`, `delai`?, `description` (≥ 30), `prenom`, `nom`,
`email`, `telephone`?, `consentement`, `diagnosticContext`? (objet, ≤ 4 Ko,
conservé tel quel dans `diagnostic_context` — trace des réponses au
pré-diagnostic, jamais un constat ; les réponses finales du formulaire sont
stockées à part).

**Champs techniques** ajoutés par le front : `_form`, `_page` → `source_url`,
`_hp` (leurre, doit rester vide), `_ts` (**durée** de remplissage en ms). Le
`Referer` HTTP est conservé dans `referrer_url`.

Enregistré avec la demande : `status = new`, `legal_basis = consent`,
`consent_version = EP_CONSENT_VERSION`, `consent_at`, empreinte HMAC tronquée
de l'IP (jamais l'IP), événement `lead_created`.

## Photographies

Deux temps. `POST /quote` répond `photoUrl` et `photoToken` ; le front envoie
ensuite un `multipart/form-data` vers `photoUrl` avec `token` et `photos[]`.

- jeton valable 30 minutes, lié à cette référence, aucune lecture possible ;
- 6 photographies **par demande**, cumul sur plusieurs requêtes compris ;
- 8 Mo par fichier ; JPEG, PNG, WebP, type lu dans les octets ;
- réencodage JPEG systématique (EXIF/GPS supprimés, polyglottes neutralisés),
  côté le plus long ramené à 2 000 px ;
- nom aléatoire, stockage hors racine web, SHA-256 et dimensions en table.

`refusees` explique chaque refus : « Format non accepté. », « Fichier trop
volumineux pour le serveur. », « Cette demande a déjà ses 6 photographies. »…

## Erreurs

Forme du contrat, pas celle de WordPress :

```json
{ "errors": { "email": "Adresse e-mail invalide." }, "message": "Certaines informations n’ont pas été acceptées. Corrigez les champs signalés." }
```

| Code | Cas |
|---|---|
| `400` | contrôle anti-robots (message neutre), JSON invalide, aucun fichier |
| `403` | origine non autorisée, jeton absent/faux/expiré |
| `404` | route ou méthode inconnue, référence inconnue |
| `413` | requête plus grosse que `post_max_size` |
| `422` | champs refusés — un message **par champ**, clé = `name` |
| `429` | 5 envois / 10 min par empreinte d'IP, 60 / h au total |
| `500` | enregistrement impossible |

## CORS

Liste blanche `EP_ORIGINES_AUTORISEES` (`expert-parquet.com`, `www.`,
`expert-parquet-dev.local`, `localhost:8477`, `127.0.0.1:8477`). Réponse :
`Allow-Origin` égal à l'origine, `Allow-Methods: POST, GET, OPTIONS`,
`Allow-Headers: Content-Type`, `Max-Age: 600`. **Jamais `*`, jamais
`Allow-Credentials`** (le gestionnaire natif de WordPress est retiré). Une
origine inconnue ne reçoit aucun en-tête ; un `POST` avec un `Origin` inconnu
est refusé `403`.

## Ce que l'API ne fait pas

Aucune lecture : ni demande, ni liste, ni photographie. Tout cela passe par le
back-office, derrière une session et la capacité `ep_gerer_demandes`. `wp/v2`
est fermé aux anonymes, XML-RPC répond `403`.
