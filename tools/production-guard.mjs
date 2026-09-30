/**
 * Garde-fou du build de production.
 *
 * ---------------------------------------------------------------------------
 * CE QU'IL EMPÊCHE
 *
 * Qu'une version indexable parte en ligne avec des mentions légales en
 * `[À renseigner]`, une page de confidentialité qui ne nomme personne, ou un
 * formulaire qui promet un envoi vers `null`. Ce ne sont pas des détails
 * cosmétiques : nommer le responsable du traitement et annoncer une durée de
 * conservation sont des obligations, et un site qui recueille des demandes
 * sans les tenir expose son éditeur.
 *
 * La préproduction, elle, n'est pas concernée : elle est en `noindex`, ses
 * formulaires sont en démonstration et le disent. C'est justement l'endroit où
 * l'on travaille avec des valeurs manquantes.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UN ARRÊT, PAS UN AVERTISSEMENT
 *
 * Un avertissement se lit une fois puis se saute. Le jour de la mise en ligne,
 * personne ne relit la sortie du build. Un arrêt, lui, ne se saute pas — et
 * il énumère précisément ce qui manque, pour que la correction soit une liste
 * à cocher plutôt qu'une enquête.
 *
 * Aucune valeur n'est inventée pour contourner le blocage : ces informations
 * sont juridiques et commerciales, elles appartiennent à l'éditeur.
 */

import { CONTACT, RGPD, FORMS } from '../js/config/site.js';

/** Un contrôle : ce qu'on exige, et pourquoi c'est exigé. */
const EXIGENCES = [
  {
    cle: 'CONTACT.legalEntity',
    ok: () => Boolean(CONTACT.legalEntity),
    pourquoi: 'les mentions légales doivent nommer l’éditeur du site',
  },
  {
    cle: 'CONTACT.siret',
    ok: () => Boolean(CONTACT.siret),
    pourquoi: 'les mentions légales d’un professionnel doivent porter son numéro d’immatriculation',
  },
  {
    cle: 'CONTACT.address',
    ok: () => Boolean(CONTACT.address),
    pourquoi: 'les mentions légales doivent indiquer l’adresse de l’éditeur',
  },
  {
    cle: 'CONTACT.email',
    ok: () => Boolean(CONTACT.email),
    pourquoi: 'sans adresse de contact, aucun droit RGPD ne peut être exercé',
  },
  {
    cle: 'RGPD.conservationMois',
    ok: () => Number.isInteger(RGPD.conservationMois) && RGPD.conservationMois > 0,
    pourquoi: 'la durée de conservation doit être annoncée, et elle doit être celle que le backend applique réellement',
  },
  {
    cle: 'FORMS.contactEndpoint',
    ok: () => estHttps(FORMS.contactEndpoint || FORMS.endpoint),
    pourquoi: 'le formulaire de contact doit pointer vers une API de production en HTTPS',
  },
  {
    cle: 'FORMS.quoteEndpoint',
    ok: () => estHttps(FORMS.quoteEndpoint || FORMS.endpoint),
    pourquoi: 'la demande d’expertise doit pointer vers une API de production en HTTPS',
  },
];

/**
 * Ce qui manque n'empêche pas de publier, mais mérite d'être vu : une zone
 * d'intervention vide laisse une phrase en suspens, un téléphone absent ferme
 * un canal. Rien d'illégal, donc rien de bloquant.
 */
const RECOMMANDATIONS = [
  { cle: 'CONTACT.phone', ok: () => Boolean(CONTACT.phone) },
  { cle: 'CONTACT.coverage', ok: () => Boolean(CONTACT.coverage) },
  { cle: 'CONTACT.hours', ok: () => Boolean(CONTACT.hours) },
];

function estHttps(url) {
  return typeof url === 'string' && /^https:\/\//.test(url);
}

/** @returns {{manquants: object[], recommandes: string[]}} */
export function auditProduction() {
  return {
    manquants: EXIGENCES.filter((e) => !e.ok()),
    recommandes: RECOMMANDATIONS.filter((r) => !r.ok()).map((r) => r.cle),
  };
}

/**
 * Arrête le build de production si une exigence n'est pas satisfaite.
 * Ne fait rien en préproduction.
 */
export function exigerConfigurationProduction({ isProd }) {
  if (!isProd) return;

  const { manquants, recommandes } = auditProduction();
  if (manquants.length === 0) {
    if (recommandes.length) {
      console.warn(`\nAvertissement : ${recommandes.join(', ')} — non bloquant, mais des textes resteront incomplets.\n`);
    }
    return;
  }

  const lignes = manquants.map((m) => `  ${m.cle} is missing — ${m.pourquoi}`).join('\n');
  console.error(
    [
      '',
      'Production build blocked:',
      lignes,
      '',
      'Ces valeurs sont juridiques ou commerciales : elles ne peuvent pas être déduites.',
      'Renseignez-les dans js/config/site.js, puis relancez.',
      'La préproduction reste disponible : node tools/build.mjs',
      '',
    ].join('\n')
  );
  process.exit(1);
}
