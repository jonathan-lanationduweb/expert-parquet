# Mise en production — liste de contrôle

Ce document est une **suite d'actions**, pas un récapitulatif. Chaque case non
cochée est un obstacle réel entre l'état actuel et une mise en ligne.

Ce qui est déjà tenu par le code n'y figure pas : le générateur refuse de
produire une version de production tant que les valeurs juridiques manquent
(`tools/production-guard.mjs`), l'artefact refuse de partir s'il contient un
chemin interne, un secret ou une adresse de développement
(`tools/build-deploy.mjs`), et le back-office annonce lui-même ce qui n'est pas
configuré.

---

## 0. Décisions humaines — bloquantes

Personne d'autre que l'éditeur ne peut les prendre. **Tant qu'elles manquent, le
build de production échoue volontairement.**

- [ ] **Identité de l'éditeur** — `CONTACT.legalEntity` dans `js/config/site.js`
- [ ] **Numéro d'immatriculation (SIRET)** — `CONTACT.siret`
- [ ] **Adresse postale** — `CONTACT.address`
- [ ] **Adresse e-mail publique** — `CONTACT.email` (elle sert aussi à exercer les droits RGPD)
- [ ] **Durée de conservation RGPD** — `RGPD.conservationMois`, **et** `EP_CONSERVATION_MOIS`
      dans `wp-config.php`, avec **la même valeur**. Le site annonce une durée,
      le backend l'applique : les deux doivent dire la même chose.
- [ ] Téléphone, horaires, zone d'intervention — non bloquants, mais des phrases
      resteront incomplètes tant qu'ils sont absents.

> La valeur locale de 36 mois est une **valeur de travail**. Ce n'est pas une
> décision de production, et le back-office l'affiche comme telle.

---

## 1. Noms de domaine et certificats

Rien de tout cela ne peut être fait depuis le dépôt.

- [ ] **DNS front** — `expert-parquet.com` (et `www` si le domaine final le
      requiert) vers l'hébergement du site statique
- [ ] **DNS API** — `api.expert-parquet.com` vers le serveur WordPress
- [ ] **HTTPS front** — certificat valide, redirection HTTP → HTTPS
- [ ] **HTTPS API** — certificat valide ; `FORCE_SSL_ADMIN` l'exige côté WordPress
- [ ] Vérifier qu'aucun enregistrement ne pointe encore vers un environnement de test

Les enregistrements exacts dépendent de l'hébergeur retenu : **aucune adresse IP
n'est écrite ici**, elle serait fausse.

---

## 2. Serveur API et WordPress

- [ ] Serveur provisionné, PHP ≥ 8.0, extensions GD et mysqli
- [ ] `backend/public` déployé **hors** du dépôt public — jamais sur GitHub Pages
- [ ] `backend-private/` créé hors de la racine web, accessible en écriture au
      processus PHP, **jamais** sous `wp-content`
- [ ] VirtualHost calqué sur `backend/config/httpd-vhosts.apres-regroupement.conf` :
      `/backend/` et `/backend-private/` refusés, `xmlrpc.php` non exposé,
      PHP de `wp-content` refusé en appel direct, `install.php` et `uploads/` fermés
- [ ] `ServerTokens Prod` et `ServerSignature Off`
- [ ] En-têtes : `X-Content-Type-Options`, `Referrer-Policy`, politique de cadre
      (l'extension les pose déjà côté PHP, y compris sur la page de connexion)

## 3. Base de données

- [ ] Base créée, `utf8mb4` / `utf8mb4_unicode_ci`
- [ ] Utilisateur dédié, droits limités à cette base, **mot de passe long et unique**
- [ ] WordPress installé, puis extension **Expert Parquet — Demandes** activée
      (l'activation crée les quatre tables et le rôle)
- [ ] Thème **Expert Parquet Backend** activé
- [ ] Contrôle : les quatre tables existent, schéma v3 — visible dans
      **Expert Parquet › Réglages**

## 4. `wp-config.php` de production

Modèle : `backend/config/wp-config.example.php`. **Ce fichier n'entre jamais dans Git.**

- [ ] Clés et sels régénérés (`https://api.wordpress.org/secret-key/1.1/salt/`)
- [ ] `WP_ENVIRONMENT_TYPE = 'production'`
- [ ] `WP_DEBUG = false`, `WP_DEBUG_DISPLAY = false`
- [ ] `DISALLOW_FILE_EDIT = true`, `DISALLOW_FILE_MODS = true`
- [ ] `FORCE_SSL_ADMIN = true`
- [ ] `EP_PRIVATE_DIR` pointe hors racine web
- [ ] `EP_CONSERVATION_MOIS` — la durée décidée au point 0
- [ ] `DISABLE_WP_CRON = true` **uniquement** si un cron système existe (point 6)

## 5. Envoi des courriels

Aujourd'hui : aucun fournisseur, les messages partent dans un journal privé.
Le back-office l'affiche comme **« à configurer avant production »**.

- [ ] **Fournisseur retenu** — décision ouverte
- [ ] `EP_SMTP_HOTE`, `EP_SMTP_PORT`, `EP_SMTP_SECURITE` (`tls` | `ssl` | `none`)
- [ ] `EP_SMTP_USER`, `EP_SMTP_PASS` — **secrets**, uniquement dans `wp-config.php`
- [ ] `EP_MAIL_FROM`, `EP_MAIL_FROM_NOM`, `EP_MAIL_DEST`
- [ ] **SPF** — le relais autorisé à expédier pour le domaine
- [ ] **DKIM** — clé publiée, signature active
- [ ] **DMARC** — politique publiée
- [ ] Essai réel : une demande de test déclenche notification **et** accusé de
      réception, tous deux reçus hors indésirables

Sans SPF/DKIM/DMARC, les accusés de réception arriveront en indésirables — le
lead sera enregistré, mais le demandeur croira n'avoir rien reçu.

## 6. Tâches planifiées

- [ ] Cron système appelant `wp-cron.php` (par exemple toutes les 15 minutes)
- [ ] `DISABLE_WP_CRON = true` seulement **après** que le cron système fonctionne
- [ ] Contrôle : **Expert Parquet › Réglages** annonce la purge RGPD *programmée*
      avec sa prochaine date

## 7. Sauvegardes

- [ ] **Base de données** — export quotidien
- [ ] **`backend-private/photos`** — photographies des demandes, données de tiers
- [ ] **`backend-private/logs`** — journaux d'envoi et de suppression
- [ ] **`wp-config.php`** — hors Git, donc irrécupérable autrement
- [ ] Configuration serveur (VirtualHost, cron)
- [ ] **Rétention décidée** et cohérente avec la durée de conservation RGPD :
      garder six mois de sauvegardes d'une base purgée à 36 mois ne pose pas de
      problème ; l'inverse en poserait un
- [ ] **Restauration testée au moins une fois** — une sauvegarde jamais restaurée
      n'est pas une sauvegarde
- [ ] Destination décidée (hébergeur, stockage distant) — décision ouverte

Vérification de l'état local : `php backend/scripts/verifier-sauvegarde.php`
(lecture seule, ne sauvegarde rien).

## 8. Front statique

- [ ] Point 0 complet, sinon le build de production s'arrête de lui-même
- [ ] `FORMS.contactEndpoint` et `FORMS.quoteEndpoint` en **HTTPS**, vers l'API de production
- [ ] Liste blanche CORS de l'extension réduite aux origines de production :
      `https://expert-parquet.com` (et `https://www.expert-parquet.com` si ce
      domaine est servi) ; **retirer les origines locales**
- [ ] `BUILD_ENV=prod node tools/build.mjs` — pages indexables, `robots.txt` ouvert
- [ ] `node tools/check.mjs` — aucune erreur
- [ ] `node tools/build-deploy.mjs` — artefact accepté
- [ ] GitHub Pages : **Settings → Pages → Source : GitHub Actions**, sans quoi la
      racine de la branche continue d'être publiée

## 9. Surveillance

- [ ] Sonde sur `https://api.expert-parquet.com/wp-json/expert-parquet/v1/health`
      — attendu `200` et `{"ok":true}`, toutes les 5 minutes suffisent
- [ ] Alerte sur trois échecs consécutifs plutôt que sur un seul
- [ ] Surveillance de l'expiration des certificats
- [ ] La sonde ne porte **aucun secret** : c'est un simple GET public

## 10. Référencement

- [ ] Domaine vérifié dans la Search Console
- [ ] `sitemap.xml` soumis
- [ ] Inspection d'une page, demande d'indexation
- [ ] Contrôle : plus aucun `noindex` dans le HTML publié
- [ ] Analytics — **aucun identifiant n'est configuré**, et aucun ne doit être
      inventé. Si une mesure d'audience est voulue, elle suppose une décision et
      une mention dans la page de confidentialité.

## 11. Après la bascule

- [ ] Parcours complet depuis le site public : contact, devis, photographies
- [ ] Demande visible dans **Expert Parquet › Demandes**, profil et orientation corrects
- [ ] Courriels réellement reçus
- [ ] `/backend/`, `/backend-private/`, `/wp-config.php`, `/.git/` → **404**
- [ ] `/wp-json/wp/v2/users` → **401**
- [ ] Connexion : le verrou après six échecs fonctionne
- [ ] Une sauvegarde complète prise **avant** l'ouverture au public
