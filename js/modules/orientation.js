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
 * Ici : deux questions, aucun champ, aucune donnée personnelle. Trois clics au
 * plus séparent le bloc de la boutique — besoin, profil, lien.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LA SECONDE QUESTION EXISTE
 *
 * Parce qu'elle change la réponse, et pour deux raisons vérifiables : Over
 * Parquet n'accepte pas les particuliers, et Premibel a une porte d'entrée
 * distincte pour les professionnels. Aucune troisième question n'est posée —
 * surface, délai, type de local ne changeraient pas la destination.
 *
 * ---------------------------------------------------------------------------
 * SANS JAVASCRIPT
 *
 * Le HTML servi contient déjà un lien vers l'enseigne ouverte à tous. Ce module
 * le remplace par le routeur quand il peut s'installer : personne ne se
 * retrouve devant un bloc muet.
 */

import { ORIENTATION, partnerFor, partnerUrl } from '../config/site.js';
import { ROUTEUR, DIFFERENCE, orientation } from '../config/orientation-rules.js';

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
    else if (!etat.customerType) demander(ROUTEUR.profil, 'customerType');
    else afficherDestinations();
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

  function afficherDestinations() {
    const decision = orientation(etat);

    if (decision.destinations.length === 0) {
      racine.append(el('p', 'orientation__question', decision.raison));
      const retour = recommencer();
      if (retour) racine.append(retour);
      return;
    }

    const multiple = decision.destinations.length > 1;
    racine.append(el('p', 'orientation__question', decision.raison));

    const liste = el('div', 'orientation__destinations');
    decision.destinations.forEach((cle) => {
      const partenaire = partnerFor(cle);
      const url = partnerUrl(cle, contexte, etat.customerType);
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
      lien.dataset.customerType = etat.customerType;
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
