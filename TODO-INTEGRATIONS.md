# Intégrations restant à faire

État du projet : **front complet, aucun service externe connecté.**
Rien n'est simulé silencieusement — chaque zone non branchée le dit explicitement à
l'utilisateur.

Les points sont classés par ordre de blocage pour une mise en ligne.

---

## Bloquant — à faire avant toute mise en ligne publique

### 1. Coordonnées réelles

**Fichier** : `js/config/site.js` → objet `CONTACT`.

```js
export const CONTACT = {
  email: null,          // → 'contact@expert-parquet.com'
  phone: null,          // → '+33123456789'
  phoneDisplay: null,   // → '01 23 45 67 89'
  address: null,
  hours: null,
  coverage: null,       // zone d'intervention
  legalEntity: null,
  siret: null,
};
```

Tant qu'une valeur vaut `null`, l'interface affiche `[À renseigner]`. Aucune coordonnée
n'a été inventée. Emplacements concernés : page contact, mentions légales, footer.

### 2. Mentions légales

`pages/mentions-legales.html` est un **gabarit**. À compléter :
raison sociale, forme juridique, siège, SIRET, directeur de la publication, hébergeur et
son adresse, responsable de traitement RGPD, durées de conservation, destinataires.

Les textes de consentement des formulaires portent la mention *« Texte provisoire : à
valider »* et doivent être relus par la personne responsable du traitement.

### 3. Page « À propos »

Les blocs *Structure juridique*, *Parcours et qualifications*, *Assurance
professionnelle* et *Zone d'intervention* attendent des informations vérifiables.
Aucune année d'expérience, aucun nombre de clients, aucune certification n'a été inventée.

### 4. Backend des formulaires

**Fichier** : `js/config/site.js` → objet `FORMS`.

```js
export const FORMS = {
  endpoint: null,        // → 'https://api.expert-parquet.com/v1/leads'
  method: 'POST',
  uploadEnabled: false,  // → true quand le stockage de fichiers existe
  maxFiles: 6,
  maxFileSizeMo: 8,
};
```

Comportement actuel : à la validation, le formulaire affiche le JSON exact qui serait
transmis et précise que rien n'a été envoyé. Dès que `endpoint` est renseigné, le module
bascule automatiquement en `fetch` POST JSON, avec gestion des erreurs réseau et message
de succès. **Aucune autre ligne de code n'est à modifier.**

Charge utile envoyée par `pages/devis.html` :

```json
{
  "probleme": ["humidite", "gonflement"],
  "type": "contrecolle",
  "support": "chape",
  "anciennete": "2-10-ans",
  "profil": "particulier",
  "logement": "appartement",
  "code_postal": "75011",
  "ville": "Paris",
  "piece": "sejour",
  "surface": "25-50",
  "delai": "mois",
  "description": "…",
  "prenom": "…", "nom": "…", "email": "…", "telephone": "…",
  "consentement": "oui",
  "_form": "devis",
  "_page": "/pages/devis.html"
}
```

`pages/contact.html` envoie `{ nom, email, telephone, objet, message, consentement, _form: "contact" }`.

**À prévoir côté serveur** : validation stricte (ne jamais faire confiance au client),
protection anti-spam sans CAPTCHA si possible (champ piège + limitation de débit),
en‑têtes CORS, et journalisation minimale.

---

## Important — à faire rapidement après la mise en ligne

### 5. Envoi d'e-mail

Accusé de réception à l'expéditeur + notification interne. Prévoir SPF, DKIM et DMARC
sur le domaine, sans quoi les messages partiront en indésirables.

### 6. Stockage des leads

Base de données ou CRM. Champs suggérés : les clés de la charge utile ci-dessus, plus
horodatage, source (`_page`), statut de traitement et éventuelles réponses du
pré-diagnostic.

### 7. Téléversement des photos

Actuellement : sélection, glisser-déposer et prévisualisation **locales**. Les fichiers
ne quittent jamais le navigateur, et l'interface l'indique clairement dans deux
encadrés.

Pour activer l'envoi :

1. mettre `FORMS.uploadEnabled = true` ;
2. dans `js/modules/forms.js`, fonction `submit()`, remplacer le corps JSON par un
   `FormData` incluant `zone.__files` (déjà exposé sur l'élément `[data-upload]`) ;
3. côté serveur : vérifier le type MIME réel, borner la taille, retirer les métadonnées
   EXIF (elles contiennent souvent la géolocalisation), stocker hors racine web ;
4. retirer les deux encadrés d'avertissement dans `tools/content/form-pages.mjs` puis
   relancer `node tools/build.mjs`.

### 8. Zone d'intervention

Plusieurs pages renvoient à `[À renseigner]`. Une fois la zone connue, mettre à jour
`CONTACT.coverage` et les réponses de FAQ concernées
(`tools/content/core-pages.mjs`, `tools/content/home.mjs`).

---

## Souhaitable

### 9. Mesure d'audience et Search Console

Aucun traceur, aucun cookie n'est présent aujourd'hui — c'est pourquoi le site n'a pas
de bandeau de consentement.

- Préférer une solution sans cookie (Plausible, Matomo en mode anonymisé) : elle évite
  d'avoir à demander un consentement.
- Si un outil déposant des cookies est retenu, **un dispositif de recueil du consentement
  devient obligatoire** et doit précéder tout dépôt. Mettre alors à jour la section
  « Cookies » des mentions légales.
- Search Console : vérifier le domaine, soumettre `sitemap.xml`, surveiller les pages
  problèmes (c'est là que se joue la longue traîne).

### 10. Données structurées `Organization`

Volontairement absentes : elles exigent des informations d'entreprise réelles.
À ajouter dans `tools/layout.mjs` (nom légal, URL, `contactPoint`, zone desservie) une
fois le point 1 réglé. Le `logo` est désormais disponible :
`assets/brand/expert-parquet-logo-on-light.png`.

### 11. Vidéo du hero

Voir [VIDEO_BRIEF.md](VIDEO_BRIEF.md). Le HTML et le CSS sont déjà prêts ; il manque le
fichier. Aucun fichier factice n'a été créé.

### 12. Photographies définitives

Les visuels actuels viennent de banques d'images libres
(voir `assets/images/CREDITS.md`). Des photographies de chantiers réels — détails de
lames, mesures d'humidité, jonctions, supports — auraient bien plus de valeur, y compris
pour la crédibilité. Deux visuels sont mutualisés faute de photo adaptée : la page
*Humidité* et la page *Dégât des eaux* partagent la même image.

### 13. Contenus SEO supplémentaires

L'architecture est duplicable : ajouter une entrée dans `PROBLEM_PAGES`
(`tools/content/problem-pages.mjs`) ou dans `ARTICLES` (`tools/partials.mjs`) puis
relancer le build. Fil d'Ariane, données structurées et sitemap suivent automatiquement.

Sujets naturels à couvrir ensuite : parquet et plancher chauffant, jeu entre lames en
hiver, parquet en salle de bain, réception de chantier, différences de teinte après
rénovation.

### 14. Liens éditoriaux vers Premibel

Trois liens contextuels existent aujourd'hui, tous vers `https://premibel.fr`, dans des
passages où le lecteur est effectivement en train de choisir un revêtement :

- `pages/conseils/renovation.html` — au moment d'arbitrer vers un remplacement ;
- `pages/conseils/choisir-parquet.html` — sur les données techniques par référence ;
- `articles/renover-un-parquet-tres-abime.html` — même contexte.

Règles retenues, à conserver : pas de lien dans chaque article, pas de bloc publicitaire,
pas d'ancre optimisée, jamais de lien avant que la cause du désordre ne soit traitée dans
le texte. L'utilité éditoriale prime sur le backlink.

Si des URL de rubriques précises de Premibel sont fournies (parquet massif,
contrecollé, stratifié), elles pourront remplacer le lien vers la page d'accueil —
ces chemins n'ont pas été devinés.

### 15. CMS

Le site est statique et généré depuis `tools/`. Si une équipe non technique doit publier
des articles, deux voies :

- **WordPress découplé** — WordPress en back-office, exposition via l'API REST, et
  génération du HTML par une adaptation de `tools/build.mjs` ;
- **CMS Git** (Decap, Pages CMS) — les contenus deviennent des fichiers Markdown lus par
  le générateur. Plus léger, sans base de données, cohérent avec l'existant.

---

## Vérifications avant mise en production

- [ ] `CONTACT` renseigné dans `js/config/site.js`
- [ ] Mentions légales complétées et relues
- [ ] Page « À propos » complétée, aucun `[À renseigner]` résiduel
- [ ] `FORMS.endpoint` branché et testé de bout en bout
- [ ] E-mails de notification reçus et non classés en indésirables
- [ ] `SITE.baseUrl` conforme au domaine réel (`tools/layout.mjs`)
- [ ] `sitemap.xml` régénéré et soumis à Search Console
- [ ] HTTPS actif, redirection `http` → `https`, `www` → apex (ou l'inverse)
- [ ] `node tools/check.mjs` sans erreur
- [ ] Test réel sur un mobile physique (menu, formulaire, pré-diagnostic)
