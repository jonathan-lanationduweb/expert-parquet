/**
 * Les questions du moteur « Trouver mon parquet ».
 *
 * Cinq au plus, et chacune a été choisie APRÈS l'audit du catalogue (05/10/
 * 2026) : on ne demande que ce qui change réellement la recommandation, parce
 * que l'enseigne renseigne la donnée sur l'essentiel de ses parquets.
 *
 *   pièce      → catégories « Parquet Salon / Chambre / Entrée / Bureaux » et
 *                « Parquet pour salles de bain et cuisines » (393 / 413 parquets
 *                Premibel), « Lames de terrasse »
 *   chauffage  → attribut « Chauffage au sol » (374 / 413)
 *   type       → catégories Massif / Flottant (contrecollé) / Stratifié (391 / 413)
 *   motif      → catégories « Par motif » (378 / 413)
 *   teinte     → catégories « Par couleur » (351 / 413)
 *   finition   → attribut « Finition » (411 / 413)
 *
 * Ce qu'on ne demande PAS : le support, la classe d'usage, la largeur de lame,
 * la couche d'usure. Le visiteur ne les connaît généralement pas, et ils
 * n'écartent aucun produit à ce stade. Les caractéristiques réelles sont
 * affichées sur chaque résultat, où elles informent sans bloquer.
 *
 * Chaque option : { value, label, help? }. `value: null` = sans préférence.
 */

export const QUESTIONS = [
  {
    cle: 'piece',
    question: 'Où sera posé votre parquet ?',
    aide: 'Facultatif. Une pièce humide ou une terrasse demande des produits adaptés. Recliquez une carte pour l’annuler.',
    /* Critère facultatif : on peut désélectionner une carte pour revenir à
       « aucune pièce ». L'option « sans préférence » n'existe donc plus — elle
       ferait doublon avec l'absence de choix. */
    deselectable: true,
    options: [
      { value: 'salon', label: 'Séjour, salon' },
      { value: 'chambre', label: 'Chambre' },
      { value: 'entree', label: 'Entrée, couloir' },
      { value: 'humide', label: 'Cuisine ou salle de bain', help: 'pièce humide' },
      { value: 'bureau', label: 'Bureau, commerce', help: 'forte fréquentation' },
      { value: 'terrasse', label: 'Terrasse' },
    ],
    /* Une case à cocher sous la question, pas une sixième question. */
    complement: { cle: 'chauffage', label: 'Il y a un chauffage au sol' },
  },
  {
    cle: 'type',
    question: 'Quel type de parquet souhaitez-vous ?',
    aide: 'Massif : tout bois. Contrecollé : bois noble sur support. Stratifié : décor imprimé.',
    options: [
      { value: 'massif', label: 'Massif' },
      { value: 'contrecolle', label: 'Contrecollé' },
      { value: 'stratifie', label: 'Stratifié' },
      { value: null, label: 'Je ne sais pas encore' },
    ],
    /* L'essence sous la même question, pas une sixième : « Chêne » et
       « Bambou » sont les termes exacts de l'enseigne, « bois exotique » sa
       catégorie. Sans objet pour un stratifié (décor imprimé). */
    complement: {
      cle: 'essence',
      type: 'radio',
      label: 'Essence du bois',
      sauf: (c) => c.type === 'stratifie',
      options: [
        { value: 'chene', label: 'Chêne' },
        { value: 'bambou', label: 'Bambou' },
        { value: 'exotique', label: 'Bois exotique' },
        { value: null, label: 'Sans préférence' },
      ],
    },
    /* Pas de type pour une terrasse : ce sont des lames, pas des parquets. */
    sauf: (c) => c.piece === 'terrasse',
  },
  {
    cle: 'motif',
    question: 'Quel motif de pose ?',
    aide: null,
    options: [
      { value: 'lames-droites', label: 'Lames droites' },
      { value: 'point-de-hongrie', label: 'Point de Hongrie' },
      { value: 'baton-rompu', label: 'Bâton rompu' },
      { value: 'versailles', label: 'Versailles' },
      { value: null, label: 'Sans préférence' },
    ],
    sauf: (c) => c.piece === 'terrasse',
  },
  {
    cle: 'teinte',
    question: 'Quelle teinte ?',
    aide: 'La teinte réelle dépend aussi de la lumière et de la finition.',
    options: [
      { value: 'clair', label: 'Claire', help: 'blanc, blanchi, clair' },
      { value: 'naturel', label: 'Naturelle', help: 'naturel, miel' },
      { value: 'moyen', label: 'Moyenne à brune', help: 'brun, cuivre' },
      { value: 'fonce', label: 'Foncée' },
      { value: 'gris', label: 'Grise' },
      { value: null, label: 'Sans préférence' },
    ],
  },
  {
    cle: 'finition',
    question: 'Quelle finition ?',
    aide: 'Huilé : aspect mat, entretien ponctuel. Verni : surface protégée, entretien plus simple. Brut : à finir après la pose.',
    options: [
      { value: 'huile', label: 'Huilée' },
      { value: 'verni', label: 'Vernie' },
      { value: 'brut', label: 'Brute', help: 'à huiler ou vitrifier après pose' },
      { value: null, label: 'Sans préférence' },
    ],
    /* Un stratifié n'a pas de finition bois ; une terrasse non plus. */
    sauf: (c) => c.type === 'stratifie' || c.piece === 'terrasse',
  },
];

/* Les textes d'écran du moteur, en un seul endroit. */
export const TEXTES = {
  titre: 'Trouver mon parquet',
  intro: 'Quelques critères suffisent pour identifier les parquets qui correspondent à votre projet. Aucune donnée personnelle.',
  introPro: 'Identifiez le produit recherché, puis accédez à la solution d’approvisionnement professionnel. Aucune donnée personnelle.',
  resultats: (n) => (n === 1 ? '1 parquet correspond à votre projet' : `${n} parquets correspondent à votre projet`),
  aucun: 'Nous n’avons pas trouvé de référence suffisamment précise pour ces critères.',
  sansCritere: 'Indiquez au moins un critère — pièce, type, essence, motif, teinte ou finition — pour obtenir une sélection personnalisée.',
  pourquoiEnseigne: {
    premibel: 'Choix, conseil et achat de cette référence.',
    overparquet: 'Approvisionnement professionnel de cette référence.',
  },
  /* Positionnement des enseignes, en une ligne, avant le clic. */
  enseigneRole: {
    premibel: 'Choix, conseil et achat',
    overparquet: 'Approvisionnement professionnel',
  },
  /* L'étape sans total : le nombre de questions dépend des réponses (une
     terrasse en a deux, un stratifié trois). Annoncer « sur 5 » serait faux. */
  etape: (n) => `Étape ${n}`,
  promesse: 'À la fin : des références réelles correspondant à votre projet.',
  modeProQuestion: 'Vous approvisionnez un chantier professionnel ?',
  modePro: 'Passer en mode professionnel',
  modeProAide: 'En mode professionnel, Expert Parquet privilégie les références du catalogue Over Parquet, plateforme externe dédiée à l’approvisionnement des professionnels.',
  modeProPremibel: 'Lorsqu’une même référence existe chez Premibel, nous pouvons également l’indiquer.',
  overParquetLien: 'Découvrir Over Parquet',
  overParquetUrl: 'https://over-parquet.com/',
  proches: 'Références proches — avec ce qui diffère de votre recherche :',
  categorie: (libelle, enseigne) => `Voir les parquets « ${libelle} » chez ${enseigne}`,
  enseigne: (enseigne) => `Découvrir la sélection ${enseigne}`,
  voir: (enseigne) => `Voir ce parquet chez ${enseigne}`,
  pourquoi: 'Pourquoi ce parquet ?',
  instantane: (date) => `Catalogue relevé le ${date}. Disponibilité et prix : sur le site de l’enseigne.`,
  pro: 'Over Parquet est réservé aux professionnels (inscription sur justificatif d’entreprise). Pour le choix et le conseil, la même référence est aussi chez Premibel quand elle y existe.',
  particulierPro: 'Vous approvisionnez un chantier professionnel ?',
  modifier: 'Modifier mes critères',
  recommencer: 'Recommencer',
  retour: 'Retour',
  suivant: 'Continuer',
  voirResultats: 'Voir les parquets',
  chargement: 'Recherche dans le catalogue…',
  erreur: 'Le catalogue n’a pas pu être chargé. Vous pouvez consulter directement les parquets chez',
};
