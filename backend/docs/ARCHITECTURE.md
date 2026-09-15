# Architecture

```
  navigateur du visiteur
        │  HTML/CSS/JS statiques
        ▼
  expert-parquet.test  (Apache, DocumentRoot = dépôt du générateur statique)
        │  fetch() JSON, puis multipart pour les photographies
        ▼
  api.expert-parquet.test  (Apache + PHP 8.3, WordPress 7.1)
        │
        ├─ /wp-json/expert-parquet/v1/*    EP_Rest → dépôts
        ├─ /wp-admin/?page=expert-parquet-* EP_Admin → dépôts
        ├─ ep_expert_parquet_leads / _lead_photos / _lead_notes / _lead_events
        └─ …-backend-private/              photographies, journaux — HORS racine web
```

## Deux couches, une frontière nette

**WordPress est l'infrastructure** : comptes, rôles et capacité, `wp-admin`,
API REST, cron, courriels, configuration. **Les tables dédiées sont le
stockage métier.** Rien de ce qui concerne une demande ne passe par `posts`
ou `postmeta` ; le type de contenu `ep_lead` des premières versions a été
retiré au schéma 3, avec ses méta-capacités — la mécanique qui avait cassé le
back-office.

WordPress ne publie aucune page : toute requête qui atteindrait un thème
reçoit `404` texte. Les menus Articles, Pages, Commentaires sont retirés. Le
site public, ses articles et son référencement restent au générateur statique.

## L'extension `expert-parquet-leads`

| Classe | Rôle |
|---|---|
| `EP_DB` | noms des tables (`$wpdb->prefix`), création/mise à niveau par `dbDelta`, version de schéma, InnoDB |
| `EP_Leads_Repository` | **seule** classe à lire/écrire la table des demandes : création, lecture par id/référence, statut et `closed_at`, recherche paginée et filtrée, compteurs, sélection pour la purge |
| `EP_Photos_Repository` | métadonnées des photographies |
| `EP_Notes_Repository` | notes internes |
| `EP_Events_Repository` | historique typé, libellés des événements |
| `EP_Lead` | statuts et libellés, capacité et rôle, référence publique 128 bits, effacement complet ordonné |
| `EP_Schema` | contrat de données : champs, énumérations, libellés, validation (copie contrôlée de `js/config/options.js`) |
| `EP_Antispam` | champ leurre, durée de remplissage, limitation de débit par empreinte d'IP |
| `EP_Photos` | réception, contrôle des octets, réencodage, stockage privé, service protégé, limites PHP |
| `EP_Rest` | les quatre routes, CORS, forme des erreurs |
| `EP_Mail` | notification et accusé ; SMTP ou journal ; issue tracée en événement |
| `EP_Admin` + `EP_Liste_Demandes` | pages `admin.php?page=expert-parquet-leads` (WP_List_Table) et `…lead&ref=` ; actions `admin-post` ; export CSV |
| `EP_Purge` | effacement au terme de la conservation |
| `EP_Security` | XML-RPC, énumération, REST natif, en-têtes, menus, fermeture du front |

`$wpdb` n'apparaît que dans `EP_DB` et les quatre dépôts. Toute valeur
dynamique passe par `$wpdb->prepare()` ; colonnes de tri et directions
viennent de listes blanches.

## Cycle d'une demande

1. `POST /quote` — origine, anti-robots, validation, `EP_Leads_Repository::creer()`
   (référence, `status=new`, consentement versionné), événement `lead_created`,
   jeton de dépôt (30 min, transient), courriels (`email_*`).
2. `POST /quote/{ref}/photos` — jeton vérifié, `EP_Photos::attacher()` :
   octets contrôlés, réencodage, fichier hors racine web, ligne dans la table
   photos, plafond de six par demande, événement `photos_received`.
3. Back-office — statut (`status_changed`), notes (`note_added`), photographies
   (`photo_deleted`), export (`lead_exported`), effacement (`lead_deleted`,
   journal privé).
4. Clôture — `closed_at` posé à l'entrée dans `won`/`lost`/`archived`, effacé à
   la sortie.
5. Purge quotidienne — `EP_Lead::effacer()` : fichiers → photos → notes →
   événements → demande.

## Contrôle d'accès

Une capacité, `ep_gerer_demandes`. L'administrateur l'a ; le rôle
`ep_gestionnaire` n'a qu'elle et `read`. Chaque page et chaque action fait
`current_user_can()` **puis** vérifie le nonce, et retrouve la demande par
sa référence. Pas de méta-capacités, pas de `map_meta_cap`, aucune dépendance
à `edit_posts`.

## Où sont les choses

| | |
|---|---|
| WordPress | `C:\Users\jonat\Desktop\expert-parquet.com\backend\public` |
| Extension | `backend/public/wp-content/plugins/expert-parquet-leads/` |
| Dossier privé | `C:\Users\jonat\Desktop\expert-parquet.com\backend-private` (photos, journaux, identifiants) |
| Configuration | `backend/public/wp-config.php` — base, sels, `EP_PRIVATE_DIR`, `EP_CONSERVATION_MOIS`, `EP_SMTP_*` |
| Contrôle du contrat | `backend/scripts/verifier-enums.php` |
| Front | racine du projet — `js/config/site.js`, `js/modules/forms.js`, `docs/BACKEND-CONTRACT.md` |
