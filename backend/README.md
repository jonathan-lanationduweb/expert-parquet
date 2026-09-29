# Expert Parquet — backend

WordPress sert ici **uniquement** d'infrastructure : comptes, droits,
`wp-admin`, API REST, cron, courriels. **Les données métier — demandes,
photographies, notes, historique — vivent dans quatre tables dédiées**, jamais
dans les tables de contenu de WordPress. Aucune page publique n'est servie ; le
site public reste le générateur statique de `expert-parquet.com`.

```
  expert-parquet-dev.local  ── UN SEUL hote local ──────────────────
  /  /pages  /articles …            le site statique
  /wp-admin  /wp-login.php  /wp-json …  WordPress, route par alias Apache
                    │
                    ▼                 WordPress = infrastructure
                                   ├─ {prefix}expert_parquet_leads
                                   ├─ {prefix}expert_parquet_lead_photos   (octets hors racine web)
                                   ├─ {prefix}expert_parquet_lead_notes
                                   └─ {prefix}expert_parquet_lead_events
```

| Document | Contenu |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | les deux couches, les classes, le cycle d'une demande |
| [docs/DATABASE.md](docs/DATABASE.md) | les quatre tables : colonnes, index, version de schéma |
| [docs/API.md](docs/API.md) | routes, charges, codes d'erreur, CORS |
| [docs/SECURITY.md](docs/SECURITY.md) | protections, et ce qui a été vérifié |
| [docs/LOCAL-DEVELOPMENT.md](docs/LOCAL-DEVELOPMENT.md) | hôtes, Apache, PHP, contrôles |
| [docs/PRODUCTION-CHECKLIST.md](docs/PRODUCTION-CHECKLIST.md) | ce qui reste à décider et à faire |

## Ce qui est installé

| | |
|---|---|
| WordPress | `<projet>/backend/public` |
| Dossier privé | `<projet>/backend-private` — photos, journaux, identifiants ; **hors de la racine web de l’API**, et interdit par Apache sur l’hôte du site |
| Base | `expert_parquet`, utilisateur `ep_wp`, préfixe `ep_`, InnoDB, schéma **3** |
| Extension | `backend/public/wp-content/plugins/expert-parquet-leads` v2.0.0 — 14 classes, aucune dépendance |
| Identifiants | `backend-private/IDENTIFIANTS.txt` — `ep-admin` |

Aucune extension tierce : pas de greffon de sécurité, de SMTP ni de
constructeur de page.

## Démarrer

`http://expert-parquet-dev.local/wp-admin/index.php` → menu **Expert Parquet ›
Demandes**. Le site et WordPress partagent cet hôte : le front appelle l'API en
chemin relatif, `/wp-json/expert-parquet/v1/…`. Détail et repli sans Apache dans
[docs/LOCAL-DEVELOPMENT.md](docs/LOCAL-DEVELOPMENT.md).

## L'API en deux mots

`expert-parquet/v1` : `POST /contact`, `POST /quote`,
`POST /quote/{référence}/photos`, `GET /health`. Pas de nonce ; protection par
origine, champ leurre, durée de remplissage, limitation de débit. Erreurs au
format du front. Les photographies partent **après** la demande, avec un jeton
de 30 minutes. Le visiteur ne voit qu'une référence aléatoire de 128 bits
(26 caractères), jamais un identifiant SQL.

## Le back-office

Liste (`WP_List_Table`) : date, référence, nom, type, téléphone, e-mail,
problème, ville, statut, origine ; recherche sur nom, prénom, e-mail,
téléphone, référence, ville, code postal ; filtres statut, formulaire,
problème, mois, code postal ; export CSV lisible. Fiche : détail, contexte du
pré-diagnostic, photographies (consultation et suppression), statut, notes,
historique typé, effacement complet.

Statuts : Nouvelle, À contacter, Contactée, Qualifiée, Devis envoyé, Gagnée,
Perdue, Archivée, Indésirable. Les trois statuts clos démarrent le compte à
rebours de conservation.

Deux niveaux : **Administrateur** et **Gestionnaire de demandes** (les
demandes, rien d'autre). Une capacité, un contrôle direct — pas de
méta-capacités.

## Courriels

Rien n'est envoyé tant que `EP_SMTP_HOTE` et `EP_MAIL_DEST` ne sont pas
définis : journal privé (`backend-private/logs/`) + événement `email_logged`. Avec un SMTP, l'issue
réelle est tracée (`email_sent` / `email_failed`) ; un échec n'annule jamais la
demande. Le chemin d'échec a été vérifié contre un relais inexistant.

## Données personnelles

Aucune IP en clair ; EXIF/GPS retirés ; consentement versionné ; purge
quotidienne (demande close effacée avec photos, notes et historique après
`EP_CONSERVATION_MOIS` mois ; indésirable après 30 jours ; réouverture annule) ;
effacement complet depuis la fiche, tracé sans donnée personnelle. **La durée
de production n'est pas fixée** — `EP_CONSERVATION_MOIS` vaut 36 en local
(valeur de TEST) et le front refuse une mise en service sans
`RGPD.conservationMois`. **Sans `EP_CONSERVATION_MOIS`, il n'y a aucune valeur
par défaut** : les dossiers clos ne sont pas effacés et le back-office
l'affiche — une durée de conservation ne se décide pas par oubli de
configuration. Seule la règle des indésirables (30 jours) reste active.

## Vérifier

```bash
php backend/scripts/verifier-enums.php
```

## Sauvegardes

Base **et** dossier privé, ensemble ; `wp-config.php` à part (sels).
