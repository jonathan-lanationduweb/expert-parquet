/**
 * Mini-routeur commercial.
 *
 * ---------------------------------------------------------------------------
 * CE QU'IL REMPLACE
 *
 * Pour être orienté vers une enseigne, il fallait auparavant traverser le
 * pré-diagnostic (cinq questions) ou le formulaire de devis (onze champs
 * obligatoires). Quelqu'un qui veut simplement acheter du parquet n'a rien à
 * faire dans un formulaire d'expertise : il passait un péage.
 *
 * Ici : UNE question, aucun champ, aucune donnée personnelle. Deux clics
 * séparent le bloc de la boutique — l'intention, puis le lien.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI IL N'Y A PLUS DE SECONDE QUESTION
 *
 * Il y en avait une : « particulier ou professionnel ? ». Elle ne changeait la
 * réponse dans aucun des trois cas. Premibel accueille les deux profils, donc
 * « choisir ou remplacer » mène chez Premibel quoi qu'il arrive ; et
 * « approvisionner un chantier professionnel » contient déjà le profil dans son
 * libellé. Poser une question dont on connaît la réponse, ce n'est pas
 * qualifier, c'est faire attendre.
 *
 * `customer_type` n'est pas supprimé pour autant : le formulaire d'expertise le
 * demande toujours, le lead le porte, le back-office s'en sert. Il disparaît
 * d'ici seulement, où il ne servait à rien.
 *
 * ---------------------------------------------------------------------------
 * SANS JAVASCRIPT
 *
 * Le HTML servi contient déjà un lien vers l'enseigne ouverte à tous. Ce module
 * le remplace par le routeur quand il peut s'installer : personne ne se
 * retrouve devant un bloc muet.
 */

import { ORIENTATION, partnerFor, partnerUrl } from '../config/site.js';
import { ROUTEUR, DIFFERENCE, BESOINS, orientation } from '../config/orientation-rules.js';

/* Plusieurs routeurs peuvent coexister (page + pré-diagnostic) : les
   identifiants d'accessibilité doivent rester uniques. */
let compteur = 0;

export function initOrientation() {
  document.querySelectorAll('[data-orientation-routeur]').forEach(monter);
}

function monter(racine) {
  /* Le pré-diagnostic rappelle initOrientation() pour installer SON routeur ;
     sans ce garde-fou, celui déjà en place sur la page repartirait de zéro. */
  if (racine.dataset.orientationMonte) return;
  racine.dataset.orientationMonte = '1';

  const contexte = racine.dataset.orientationRouteur || 'orientation';
  const identifiant = `orientation-${++compteur}`;
  /* Un besoin ou un profil déjà connus ne sont jamais redemandés : le
     pré-diagnostic, par exemple, sait déjà de quel problème on parle. */
  const etat = {
    need: racine.dataset.besoin || '',
    customerType: racine.dataset.profil || '',
  };
  /* Le lien interne de la branche « expertise ». C'est le gabarit qui le
     fournit : lui seul connaît la profondeur de la page. */
  const urlExpertise = racine.dataset.expertiseUrl || '';
  /* Ce qui vient du contexte n'appartient pas au routeur : il ne propose pas
     de revenir sur une réponse que le visiteur n'a pas donnée ici. L'écran qui
     a fourni la valeur garde son propre retour. */
  const acquis = { need: !!etat.need, customerType: !!etat.customerType };
  /* Le premier rendu a lieu au chargement de la page : on n'y vole pas le
     focus. Les suivants répondent à un clic, et là il faut le déplacer. */
  let premierRendu = true;

  rendre();

  function rendre() {
    racine.innerHTML = '';
    if (!etat.need) demander(ROUTEUR.besoin, 'need');
    else afficherSuite();
    annoncer();
    premierRendu = false;
  }

  /**
   * Déplacer le focus sur le texte qui vient d'apparaître.
   *
   * Sans cela, remplacer le contenu du bloc détruit le bouton qui avait le
   * focus : le clavier repart du haut du document, et un lecteur d'écran ne
   * signale rien du tout. On vise le texte plutôt que le premier bouton, pour
   * que la question soit lue avant les réponses.
   */
  function annoncer() {
    if (premierRendu) return;
    const texte = racine.querySelector('.orientation__question');
    if (!texte) return;
    texte.tabIndex = -1;
    texte.focus({ preventScroll: true });
  }

  /** Une question, une ligne de boutons. Rien d'autre à l'écran. */
  function demander(bloc, champ) {
    const question = el('p', 'orientation__question', bloc.question);
    question.id = `${identifiant}-question`;
    racine.append(question);

    /* Les boutons sont les réponses à CETTE question : le groupe le dit, sinon
       un lecteur d'écran annonce « Particulier » sans énoncer la question. */
    const groupe = el('div', 'orientation__choix');
    groupe.setAttribute('role', 'group');
    groupe.setAttribute('aria-labelledby', question.id);
    bloc.choix.forEach((choix) => {
      const bouton = el('button', 'btn btn--outline');
      bouton.type = 'button';
      bouton.textContent = choix.libelle;
      bouton.addEventListener('click', () => {
        etat[champ] = choix.valeur;
        rendre();
      });
      groupe.append(bouton);
    });
    racine.append(groupe);
    const retour = recommencer();
    if (retour) racine.append(retour);
  }

  /**
   * La suite, quelle qu'elle soit.
   *
   * Un problème de parquet ne mène nulle part ailleurs qu'ici : c'est le métier
   * du site. Les deux autres intentions mènent chez une enseigne. Dans les
   * trois cas, le visiteur a cliqué une fois et voit déjà où aller.
   */
  function afficherSuite() {
    const decision = orientation(etat);
    racine.append(el('p', 'orientation__question', decision.raison));

    if (decision.besoin === BESOINS.EXPERTISE) return afficherExpertise();
    if (decision.destinations.length === 0) {
      const retour = recommencer();
      if (retour) racine.append(retour);
      return;
    }
    return afficherDestinations(decision);
  }

  /**
   * Rester chez Expert Parquet : le pré-diagnostic, pas une enseigne.
   *
   * Sans URL fournie par le gabarit, on n'invente pas de chemin : la raison
   * reste affichée, et le visiteur garde la navigation du site.
   */
  function afficherExpertise() {
    if (urlExpertise) {
      const lien = document.createElement('a');
      lien.className = 'btn btn--primary btn--block';
      lien.href = urlExpertise;
      lien.textContent = 'Faire le pré-diagnostic';
      lien.dataset.event = 'orientation_expertise';
      lien.dataset.context = contexte;

      const carte = el('div', 'orientation__destination');
      carte.append(el('p', 'orientation__nom', 'Expert Parquet'), lien);

      const liste = el('div', 'orientation__destinations');
      liste.append(carte);
      racine.append(liste);
    }
    const retour = recommencer();
    if (retour) racine.append(retour);
  }

  function afficherDestinations(decision) {
    const multiple = decision.destinations.length > 1;

    const liste = el('div', 'orientation__destinations');
    decision.destinations.forEach((cle) => {
      const partenaire = partnerFor(cle);
      const url = partnerUrl(cle, contexte, decision.profil);
      if (!url) return;

      const carte = el('div', 'orientation__destination');
      carte.append(el('p', 'orientation__nom', partenaire.nom));
      if (multiple) carte.append(el('p', 'orientation__difference', DIFFERENCE[cle]));

      const lien = document.createElement('a');
      lien.className = 'btn btn--primary btn--block';
      lien.href = url;
      lien.rel = 'sponsored noopener';
      lien.textContent = ORIENTATION.action.replace('%s', partenaire.nom);
      lien.dataset.event = 'commercial_orientation';
      lien.dataset.destination = cle === 'overparquet' ? 'over-parquet' : cle;
      /* L'intention, elle, est toujours vraie : le visiteur vient de cliquer
         dessus. C'est elle qu'on mesure, pas un profil supposé. */
      lien.dataset.besoin = decision.besoin;
      /* Le profil DÉCLARÉ, jamais celui que le routage a déduit. Choisir
         « approvisionner un chantier professionnel » suffit à orienter vers
         Over Parquet, mais personne n'a demandé à ce visiteur qui il est :
         écrire « professionnel » dans la mesure ferait croire à une
         qualification qui n'a pas eu lieu. Attribut absent = inconnu. */
      if (etat.customerType) lien.dataset.customerType = etat.customerType;
      lien.dataset.context = contexte;
      carte.append(lien);

      liste.append(carte);
    });

    racine.append(liste);
    const retour = recommencer();
    if (retour) racine.append(retour);
    racine.append(el('p', 'disclaimer u-mt-sm', ORIENTATION.mention));
  }

  /**
   * Le retour d'un cran — ou rien du tout.
   *
   * On ne rend un bouton que s'il reste une réponse donnée ICI à corriger.
   * Sans ce filtre, le pré-diagnostic affichait deux retours côte à côte, dont
   * un qui effaçait un besoin que le visiteur n'avait jamais choisi.
   */
  function recommencer() {
    const champ = ['customerType', 'need'].find((c) => etat[c] && !acquis[c]);
    if (!champ) return null;

    const bouton = el('button', 'btn btn--ghost btn--sm');
    bouton.type = 'button';
    bouton.textContent = 'Revenir en arrière';
    bouton.addEventListener('click', () => {
      /* On revient d'un cran, pas au début : l'utilisateur corrige sa dernière
         réponse, il ne recommence pas tout. */
      etat[champ] = '';
      rendre();
    });
    return bouton;
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
