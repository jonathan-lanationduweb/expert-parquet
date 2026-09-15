/**
 * Divulgation progressive d’une liste longue, sur petit écran uniquement.
 *
 * Pourquoi seulement sur petit écran : une liste de huit désordres tient sans
 * gêne sur un écran large, où elle sert de sommaire. Sur un téléphone elle
 * représente près de deux écrans de défilement avant le bloc suivant. Quatre
 * entrées suffisent à faire comprendre la nature de la liste ; les autres sont
 * à un geste.
 *
 * Pourquoi `hidden` plutôt que de retirer les nœuds : le contenu reste dans le
 * document. Les moteurs de recherche rendent la page et le lisent ; le lien
 * « Voir tous les problèmes » vers la page dédiée reste par ailleurs présent
 * au-dessus de la liste. Rien n’est retiré à la version mobile.
 *
 * Le repli est réversible : passer en paysage ou sur tablette rouvre la liste
 * intégralement, et une liste déjà dépliée par l’utilisateur ne se replie pas
 * dans son dos.
 */

const MOBILE = '(max-width: 640px)';

export function initRevealMore() {
  document.querySelectorAll('[data-reveal-more]').forEach(setup);
}

function setup(button) {
  const list = document.getElementById(button.dataset.revealMore);
  const count = Number(button.dataset.revealCount);
  const selector = button.dataset.revealItems;
  if (!list || !Number.isFinite(count) || !selector) return;

  const items = Array.from(list.querySelectorAll(selector));
  if (items.length <= count) {
    button.hidden = true;
    return;
  }

  const extra = items.slice(count);
  const mq = window.matchMedia(MOBILE);
  /* Une fois que l’utilisateur a demandé à voir la suite, on ne la lui reprend
     plus : replier sous ses yeux ce qu’il vient d’ouvrir est le contraire d’un
     geste prévisible. */
  let deplie = false;

  const replier = () => {
    extra.forEach((item) => {
      item.hidden = true;
    });
    list.dataset.collapsed = 'true';
    button.hidden = false;
    button.setAttribute('aria-expanded', 'false');
  };

  const deplier = () => {
    extra.forEach((item) => {
      item.hidden = false;
    });
    delete list.dataset.collapsed;
    button.setAttribute('aria-expanded', 'true');
    button.hidden = true;
  };

  const sync = () => {
    if (mq.matches && !deplie) replier();
    else deplier();
  };

  button.addEventListener('click', () => {
    deplie = true;
    const premier = extra[0];
    deplier();
    /* Le focus suit ce qui vient d’apparaître : sans cela, le bouton disparaît
       sous le doigt et le focus retombe sur <body>. */
    if (premier) {
      premier.setAttribute('tabindex', '-1');
      premier.focus({ preventScroll: true });
    }
  });

  mq.addEventListener('change', sync);
  sync();
}
