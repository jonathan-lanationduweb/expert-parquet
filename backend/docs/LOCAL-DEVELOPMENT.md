# Développement local

## Hôtes

| Hôte | Sert | Configuration |
|---|---|---|
| `http://expert-parquet.test` | le générateur statique (`expert-parquet.com`) | VirtualHost Apache, `httpd-vhosts.conf` ligne 64 |
| `http://api.expert-parquet.test` | ce backend | VirtualHost Apache, ligne 79 |

Entrées `hosts` (IPv4) présentes depuis le 11/09/2026, Apache WAMP redémarré,
`httpd -t` Syntax OK. Les deux hôtes répondent `200` ; le formulaire du front,
servi sur `expert-parquet.test`, appelle automatiquement
`api.expert-parquet.test` (table `LOCAL_API` de `js/config/site.js`).

## Les trois états du front

| Hôte du front | Mode | Pourquoi |
|---|---|---|
| `expert-parquet.test`, `localhost`, `127.0.0.1` | **LIVE LOCAL** — envoie au backend local | `LOCAL_API`, lue seulement dans un navigateur |
| GitHub Pages, préproduction | **DEMO** — rien n'est envoyé, le site le dit | points d'envoi `null` dans `FORMS` |
| production | inactive | tant que `FORMS.*Endpoint` (HTTPS), `CONTACT.legalEntity`, `CONTACT.email`, `RGPD.conservationMois` ne sont pas renseignés — `tools/check.mjs` refuse la construction sinon |

En LIVE LOCAL, les mentions « formulaire de démonstration » du HTML généré sont
masquées à l'exécution ; la page de confidentialité n'est pas réécrite.

## Repli sans Apache

```powershell
C:\wamp64\bin\php\php8.3.28\php.exe -c C:\wamp64\bin\php\php8.3.28\php.ini -S 127.0.0.1:8080 -t C:\Users\jonat\Desktop\expert-parquet.com\backend\public
```

**`-c` est indispensable** : sans lui, le binaire 8.3 lancé depuis PowerShell
charge le `php.ini` de PHP 8.2 (2 Mo par fichier). `wp-config.php` accepte
`127.0.0.1:8080` et `localhost:8080` dans sa liste blanche d'hôtes.

## Configuration PHP

Corrigée dans `php.ini` **et** `phpForApache.ini` de PHP 8.3.28, chargée par
Apache depuis le redémarrage du 11/09 :

```ini
upload_max_filesize = 8M
post_max_size       = 64M
memory_limit        = 256M
expose_php          = Off
```

Le back-office affiche un avertissement si ces valeurs redevenaient
insuffisantes.

## Base

Quatre tables dédiées, créées et mises à niveau automatiquement au chargement
(`EP_DB::verifier()`, version 3). Pour inspecter :

```sql
SHOW TABLES LIKE 'ep_expert_parquet%';
SHOW CREATE TABLE ep_expert_parquet_leads;
SELECT COUNT(*) FROM ep_posts WHERE post_type = 'ep_lead';   -- doit valoir 0
```

Réactiver l'extension relance `installer()` sans perte. Aucun `DROP TABLE`,
jamais.

## Fichiers servis

`.htaccess` refuse `docs/`, `bin/`, `*.md`, `*.log`, `*.bak`, `readme.html`,
`license.txt`, `wp-config-sample.php` et `wp-admin/install.php` : seul
WordPress répond sur l'hôte API.

## Journaux

| Quoi | Où |
|---|---|
| Erreurs PHP / WordPress | `backend-private/logs/wp-debug.log` |
| Courriels non envoyés (pas de SMTP) | `backend-private/logs/courriels.log` |
| Effacements de demandes | `backend-private/logs/suppressions.log` (référence, statut, motif — aucune donnée personnelle) |
| Historique d'une demande | sa fiche, boîte « Historique » (table des événements) |

## Contrôles

```bash
php backend/scripts/verifier-enums.php   # contrat front/back : énumérations, libellés, conservation
php -l backend/public/wp-content/plugins/expert-parquet-leads/includes/*.php
node tools/build.mjs && node tools/check.mjs
```

## Comptes

`ep-admin` (administrateur) — mot de passe dans
`backend-private/IDENTIFIANTS.txt`. Créer un compte « Gestionnaire de
demandes » (`ep_gestionnaire`) pour le suivi quotidien. Les comptes d'essai des
vérifications sont supprimés après chaque campagne.

## Back-office

`admin.php?page=expert-parquet-leads` (liste, recherche, filtres, export) et
`admin.php?page=expert-parquet-lead&ref=<référence>` (fiche). Les anciennes
adresses `edit.php?post_type=ep_lead` redirigent vers la liste.
