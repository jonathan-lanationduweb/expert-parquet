# Sécurité

Ce que le backend fait, pourquoi, et ce qui a été vérifié le 11/09/2026 après
la migration vers les tables dédiées. Rien ici ne repose sur une extension
tierce.

## Surface exposée

Quatre routes REST publiques, `/wp-admin/` et `/wp-login.php`. Le rendu
public de WordPress répond `404` texte. XML-RPC répond `403` dès
`XMLRPC_REQUEST` (aucune méthode exposée, pas même `pingback.ping`), `?author=N`
redirige, `wp/v2` est fermé aux anonymes et ses routes `users` retirées.
`robots.txt` répond `Disallow: /`. `expose_php = Off`.

## Base de données

- `$wpdb` confiné à `EP_DB` et aux quatre dépôts ; **toute valeur dynamique
  passe par `$wpdb->prepare()`** ; colonnes de tri et directions issues de
  listes blanches ; `esc_like()` sur les motifs LIKE.
- Recherche du back-office éprouvée avec `'`, `%`, `_`, `' OR 1=1 --`,
  `" OR ""="`, `'; DROP TABLE …;--`, `\`, `Robert')` : aucune erreur SQL,
  aucun élargissement (le motif est un littéral), table intacte. `%27` est
  vidé par `sanitize_text_field` (octets `%xx` retirés) → recherche vide,
  c'est-à-dire la liste complète, comportement WordPress standard.
- Aucune donnée métier dans `posts`/`postmeta` ; identifiant SQL jamais
  exposé (référence 128 bits) ; InnoDB.

## Entrées

- Validation serveur intégrale (`EP_Schema::valider`) : type, longueur,
  énumérations, e-mail, code postal. Hors liste = refusé. Les balises sont
  retirées des champs texte à l'entrée.
- Anti-robots sans tiers : champ leurre, durée de remplissage (< 3 s ou
  négative → refus), débit 5 / 10 min par empreinte HMAC d'IP et 60 / h global.
  Message de refus unique.
- Origine : liste blanche stricte ; `Origin` inconnu → `403`.

## Photographies

Type lu dans les octets ; **réencodage GD systématique** (polyglotte JPEG+PHP,
SVG, GIF déguisé, double extension, MIME menteur : neutralisés ou refusés) ;
EXIF/GPS supprimés ; nom aléatoire ; le nom d'origine est stocké à titre
informatif et **jamais** utilisé comme chemin (`../../evil.php` → aucun
fichier hors du dossier) ; stockage hors racine web avec `.htaccess` de garde ;
servies uniquement via `admin-post.php?action=ep_photo` après capacité **puis**
nonce lié à la référence, `Cache-Control: private, no-store` ; jeton de dépôt
30 min, aucune lecture ; **6 par demande, cumulé** ; 8 Mo ; `413` explicite
au-delà de `post_max_size`.

## Back-office

- Une capacité, `ep_gerer_demandes` ; contrôle direct page/action →
  `current_user_can()`, puis nonce lié à la référence. Aucune méta-capacité.
- Rôle `ep_gestionnaire` : demandes seulement (extensions, utilisateurs,
  réglages, articles, médias → `403`).
- `esc_html`/`esc_attr`/`esc_url` à l'affichage ; `wp_strip_all_tags` à
  l'écriture des notes. Un nom `Robert'); DROP TABLE x;--`, un prénom
  `=HYPERLINK(…)`, une description `<script>…` : affichés inertes.
- Export CSV : capacité + nonce ; cellules commençant par `= + - @`,
  tabulation ou retour préfixées d'une apostrophe (injection de formule
  neutralisée) ; référence publique, pas d'identifiant SQL ; événement
  `lead_exported`.
- Effacement : capacité + nonce + confirmation ; fichiers → photos → notes →
  événements → demande ; trace dans un journal privé sans donnée personnelle.
- `DISALLOW_FILE_EDIT`, messages de connexion génériques.

## Données personnelles

Aucune IP en clair ; référence non prédictible ; courriels texte brut ;
consentement versionné (`consent_version`, `consent_at`) ; purge quotidienne
(clos + `EP_CONSERVATION_MOIS`, indésirable + 30 jours, réouverture annule ;
**aucune valeur par défaut** : constante absente = pas d'effacement des clos,
avertissement dans le back-office) ;
export CSV lisible pour le droit d'accès ; effacement complet à la demande.
`metadata` des événements ne duplique jamais une donnée personnelle.

## En-têtes

Administration **et** REST : `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
CORS : origine de la liste blanche ou rien ; jamais `*`, jamais
`Allow-Credentials`.

## Vérifié le 11/09/2026 (schéma 3, Apache WAMP réel)

API : `Origin` evil `403` ; leurre `400` ; `_ts` 0,8 s `400` ; JSON invalide
`400` ; enum invalide `422` par champ ; champs trop longs `422` ; e-mail
invalide `422` ; débit `429` au 6ᵉ envoi.
Uploads : GIF déguisé, PHP renommé, SVG → refusés ; double extension,
traversal, MIME menteur, polyglotte → réencodés (aucun `<?php`, aucun EXIF,
aucun fichier hors dossier) ; > 8 Mo refusé et nommé ; jeton faux `403` ;
7ᵉ photo refusée ; jeton expiré `403`.
Admin : matrice administrateur / gestionnaire / abonné / anonyme conforme ;
action sans nonce `403` ; abonné avec nonce valide `403` ; photo anonyme `400` ;
XSS description et note inertes ; injections SQL sans effet ; ancienne URL du
type de contenu redirigée.

## Non couvert, à dire clairement

HTTPS (local en HTTP ; le front refuse un point d'envoi en clair) ;
restriction de `/wp-admin/` par IP ; `ServerTokens Prod` côté Apache ;
CAPTCHA seulement si du spam passe réellement.
