# Mise en production — liste de contrôle

Rien ici n'est fait. C'est la liste de ce qui **doit** l'être, dans l'ordre, et
de ce qui revient à un humain.

## 1. Décisions à prendre (personne d'autre ne peut)

- [ ] **Durée de conservation** des demandes closes — `RGPD.conservationMois`
      (front) **=** `EP_CONSERVATION_MOIS` (backend). `bin/verifier-enums.php`
      échoue en cas d'écart. Aucune valeur n'a été fixée à votre place : le 36
      de `wp-config.php` local est une valeur de TEST, et sans constante le
      backend n'efface aucun dossier clos.
- [ ] **Responsable du traitement** — `CONTACT.legalEntity`, `CONTACT.email`.
- [ ] **Fournisseur SMTP transactionnel** — ses identifiants vont dans
      `wp-config.php`, jamais en base.
- [ ] **Procédure de suppression sur demande** — qui reçoit, sous quel délai,
      quelle trace. La suppression technique existe (fiche → corbeille →
      définitif, photographies comprises) ; la procédure humaine, non.
- [ ] Hébergeur et éventuels sous-traitants — `RGPD.sousTraitants`.

## 2. Serveur

- [ ] DNS de `api.expert-parquet.com` ; **HTTPS** (Let's Encrypt suffit).
      Le front refuse un point d'envoi en clair.
- [ ] `ServerTokens Prod` et `ServerSignature Off` dans Apache (la version
      d'Apache sort encore dans l'en-tête `Server` en local).
- [ ] PHP : `upload_max_filesize = 8M`, `post_max_size = 64M`,
      `memory_limit = 256M`, `expose_php = Off`. Le back-office avertit si
      insuffisant.
- [ ] Restreindre `/wp-admin/` et `/wp-login.php` par adresse IP, ou au moins
      par une authentification HTTP en plus.
- [ ] Un vrai cron système appelant `wp-cron.php` toutes les heures, et
      `DISABLE_WP_CRON` à `true` : la purge quotidienne ne doit pas dépendre
      d'un visiteur.
- [ ] `EP_PRIVATE_DIR` hors de la racine web, inscriptible par PHP seulement.

## 3. `wp-config.php`

- [ ] Nouvelle base, nouvel utilisateur limité à cette base, **nouveaux sels**.
- [ ] `WP_ENVIRONMENT_TYPE` → `production` ; `WP_DEBUG` → `false`.
- [ ] Liste blanche d'hôtes réduite à `api.expert-parquet.com` ; retirer
      `127.0.0.1:8080` et `localhost:8080`.
- [ ] `EP_CONSERVATION_MOIS`, `EP_SMTP_HOTE/PORT/USER/PASS`, `EP_MAIL_FROM`,
      `EP_MAIL_DEST`.
- [ ] SPF, DKIM et DMARC sur le domaine expéditeur — sans eux l'accusé de
      réception part dans les indésirables.

## 4. Extension

- [ ] `EP_ORIGINES_AUTORISEES` dans `expert-parquet-leads.php` : les seules
      origines du site public en production ; retirer `expert-parquet.test`,
      `localhost:8477`, `127.0.0.1:8477`.
- [ ] Activer l'extension, vérifier que `ep_schema_version` vaut 3, que les
      quatre tables `{prefix}expert_parquet_*` existent (InnoDB) et que la tâche
      `ep_purge_quotidienne` est planifiée.
- [ ] Un envoi d'essai réel depuis le site, photographies comprises, puis
      suppression de la demande d'essai.

## 5. Comptes

- [ ] Nouveau mot de passe `ep-admin` (il a été renouvelé en local, mais il a
      vécu sur un poste de développement).
- [ ] Un compte **Gestionnaire de demandes** pour le suivi quotidien.
      `ep-admin` ne sert qu'à administrer.

## 6. Front (`expert-parquet.com`)

- [ ] `js/config/site.js` : `FORMS.contactEndpoint` et `FORMS.quoteEndpoint`
      en `https://…/wp-json/expert-parquet/v1/{contact,quote}`.
- [ ] `CONTACT.legalEntity`, `CONTACT.email`, `RGPD.conservationMois`,
      `RGPD.sousTraitants`.
- [ ] `node tools/check.mjs` doit passer — il refuse la construction si l'un
      de ces éléments manque ou si l'URL est en clair. **Ne contournez pas ce
      contrôle** : il protège la véracité de la page de confidentialité.
- [ ] `BUILD_ENV=prod node tools/build.mjs` (indexation ouverte).
- [ ] Relire la page « Mentions légales et confidentialité » générée : elle
      nomme désormais le responsable, la finalité, la durée, le moyen
      d'exercer ses droits.

## 7. Après la bascule

- [ ] Sauvegarde **base + dossier privé + wp-config.php**, et un essai de
      restauration.
- [ ] Supervision de `GET /wp-json/expert-parquet/v1/health`.
- [ ] Première semaine : regarder le journal des courriels et l'historique des
      premières demandes ; vérifier qu'aucun `email_failed` n'apparaît.
