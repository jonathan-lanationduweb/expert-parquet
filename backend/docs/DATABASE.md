# Base de données

Base `expert_parquet`, utilisateur `ep_wp` (droits limités à cette base),
préfixe `ep_`, `utf8mb4` / `utf8mb4_unicode_520_ci`, moteur **InnoDB**.

## Principe

**WordPress = infrastructure. Tables dédiées = stockage métier.**

Les demandes, leurs photographies, les notes internes et l'historique vivent
dans quatre tables créées par l'extension. **Aucune donnée métier ne transite
par `ep_posts` ni `ep_postmeta`** : le type de contenu `ep_lead` des schémas 1
et 2 n'existe plus, et `SELECT COUNT(*) FROM ep_posts WHERE post_type='ep_lead'`
vaut 0 — c'est une condition de validation, vérifiée après chaque création.

WordPress conserve ce qui est le sien : `ep_users`/`ep_usermeta` (comptes,
rôles, capacité `ep_gerer_demandes`), `ep_options` (version de schéma,
transients des jetons de dépôt et des compteurs de débit, cron).

## Les quatre tables

Noms construits avec `$wpdb->prefix` — jamais `ep_` en dur. Localement :

| Table | Rôle |
|---|---|
| `ep_expert_parquet_leads` | une ligne par demande |
| `ep_expert_parquet_lead_photos` | métadonnées des photographies (les octets sont sur disque, hors racine web) |
| `ep_expert_parquet_lead_notes` | notes internes des gestionnaires |
| `ep_expert_parquet_lead_events` | historique typé |

Relations **logiques** (`lead_id`), sans clé étrangère SQL : `dbDelta` les gère
mal, et l'intégrité est assurée par `EP_Lead::effacer()` — fichiers →
photographies → notes → événements → demande, dans cet ordre. Vérifié : zéro
ligne orpheline après purge.

### `expert_parquet_leads`

| Colonne | Type | Contenu |
|---|---|---|
| `id` | bigint unsigned, PK, auto | identifiant interne — **jamais exposé** |
| `public_id` | char(26), **UNIQUE** | référence publique : 128 bits aléatoires en base32 minuscule `[a-z2-7]` |
| `form_type` | varchar(20), index | `contact` · `devis` |
| `status` | varchar(20), index, défaut `new` | `new` · `to_contact` · `contacted` · `qualified` · `quote` · `won` · `lost` · `archived` · `spam` — pas d'ENUM SQL |
| `first_name`, `last_name` | varchar(120) | prénom, nom (le formulaire de contact n'a qu'un champ « Nom » → `last_name`) |
| `email` | varchar(190), index | |
| `phone` | varchar(40) | |
| `postal_code` | varchar(10), index | |
| `city` | varchar(120) | |
| `customer_type`, `building_type`, `room`, `surface` | varchar(40) | valeurs du contrat (`particulier`, `appartement`, `sejour`, `25-50`) |
| `parquet_type`, `parquet_age`, `support_type`, `desired_delay` | varchar(40) | idem |
| `problem_type` | varchar(255) | liste séparée par des virgules (`gonflement,humidite`) ; filtre par `CONCAT(',',…,',') LIKE '%,x,%'` |
| `subject` | varchar(40) | objet du contact |
| `message`, `description` | text | textes libres, bornés à 5 000 à la validation |
| `diagnostic_context` | text | JSON tel que reçu du pré-diagnostic, ≤ 4 000 octets ; jamais un constat |
| `source_url`, `referrer_url` | varchar(255) | page d'origine, référent HTTP |
| `ip_fingerprint` | char(16) | empreinte HMAC tronquée — **jamais l'IP** |
| `legal_basis` | varchar(40), défaut `consent` | |
| `consent_version` | varchar(20) | `EP_CONSENT_VERSION` au moment de l'envoi |
| `consent_at` | datetime, null | |
| `closed_at` | datetime, null | posé à l'entrée dans `won`/`lost`/`archived`, effacé à la sortie |
| `created_at`, `updated_at` | datetime, index sur `created_at` | |

Les libellés lisibles (« Gonflement ou soulèvement ») sont appliqués à
l'affichage et à l'export par `EP_Schema::afficher()` ; la table ne stocke que
les codes du contrat front.

### `expert_parquet_lead_photos`

| Colonne | Type |
|---|---|
| `id` | bigint unsigned, PK |
| `lead_id` | bigint unsigned, index |
| `public_id` | char(32), **UNIQUE** — 128 bits hex |
| `storage_key` | varchar(190) — `<lead_id>/<public_id>.jpg`, relatif à `EP_PRIVATE_DIR/photos` |
| `original_filename` | varchar(255) — nom d'origine nettoyé, informatif, jamais utilisé comme chemin |
| `stored_filename` | varchar(64) |
| `mime_type` | varchar(40), toujours `image/jpeg` après réencodage |
| `size_bytes`, `width`, `height` | int unsigned |
| `sha256` | char(64) |
| `exif_stripped` | tinyint(1), toujours 1 |
| `created_at` | datetime, index |
| `deleted_at` | datetime, null (réservé ; la suppression est aujourd'hui physique) |

### `expert_parquet_lead_notes`

`id` PK · `lead_id` index · `wp_user_id` index · `note` text · `created_at` index · `updated_at`.

### `expert_parquet_lead_events`

`id` PK · `lead_id` index (0 pour un événement global comme l'export) ·
`wp_user_id` null (système) · `event_type` varchar(40) index · `old_status`,
`new_status` null · `metadata` text JSON · `created_at` index.

Types : `lead_created`, `photos_received`, `photo_added`, `photo_deleted`,
`status_changed`, `note_added`, `email_sent`, `email_failed`, `email_logged`,
`lead_exported`, `lead_deleted`, `schema_migrated`.

`metadata` ne duplique jamais une donnée personnelle : compteurs, libellé du
courriel concerné, motif d'erreur SMTP, 8 premiers caractères d'un identifiant
de photo, filtres d'un export.

## Version de schéma

`ep_options.ep_schema_version` = **3**. `EP_DB::verifier()` s'exécute à chaque
chargement (`init`, priorité 1) et appelle `installer()` si la version stockée
est inférieure. `installer()` est idempotente : `dbDelta()` + forçage InnoDB si
le moteur diffère + écriture de la version. Relançable à volonté ; **aucun
`DROP TABLE`**, ni à la désactivation, ni à la désinstallation.

| Version | Date | Contenu |
|---|---|---|
| 1 | 11/09/2026 | type de contenu `ep_lead` + `postmeta` |
| 2 | 11/09/2026 | référence publique 16 hex dans `postmeta` |
| **3** | 11/09/2026 | quatre tables dédiées ; référence 128 bits ; statuts normalisés ; abandon du type de contenu. Base vide au moment de la bascule : aucune migration de contenu. |

## Ce qui n'est pas en base

Les photographies : `EP_PRIVATE_DIR/photos/<lead_id>/<public_id>.jpg`, hors
racine web. Les journaux : `EP_PRIVATE_DIR/logs/` (`courriels.log`,
`suppressions.log`, `wp-debug.log`).

## Sauvegarde

`mysqldump expert_parquet` **et** le dossier privé, ensemble.
