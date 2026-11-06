/**
 * Scénarios du moteur de recommandation — exécutés sans navigateur.
 *
 * Le moteur (js/recommendation/*) est du JavaScript pur : il tourne sous Node
 * tel quel, sur les instantanés data/catalog-*.json. Ce script joue les
 * scénarios ci-dessous et imprime, pour chacun : les critères, le niveau de
 * recommandation, les produits réels (ou la catégorie, ou l'enseigne) et la
 * justification. Il échoue si un scénario ne donne pas le niveau attendu.
 *
 * Usage : node tools/catalog/test-scenarios.mjs
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCriteria, criteresPoses } from '../../js/recommendation/criteria.js';
import { recommend, exclusion } from '../../js/recommendation/matching.js';
import { getCategoryFallback, getPartnerFallback } from '../../js/recommendation/fallbacks.js';
import { normalizeProduct } from '../../js/catalog/normalize.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const lire = (f) => JSON.parse(readFileSync(join(ROOT, 'data', f), 'utf8'));
const index = lire('catalog-index.json');
const catalogues = {
  premibel: lire('catalog-premibel.json').produits.map(normalizeProduct),
  overparquet: lire('catalog-overparquet.json').produits.map(normalizeProduct),
};

export const SCENARIOS = [
  { nom: '1. Séjour, chêne, clair, point de Hongrie', brut: { piece: 'salon', essence: 'chene', motif: 'point-de-hongrie', teinte: 'clair' }, attendu: 1 },
  { nom: '1b. Séjour, chêne, point de Hongrie, contrecollé, sans teinte', brut: { piece: 'salon', essence: 'chene', motif: 'point-de-hongrie', type: 'contrecolle' }, attendu: 1 },
  { nom: '2. Chambre, contrecollé, naturel', brut: { piece: 'chambre', type: 'contrecolle', teinte: 'naturel' }, attendu: 1 },
  { nom: '3. Salle de bain, sans autre critère — aucune compatibilité inventée', brut: { piece: 'humide' }, attendu: 1, verifier: 'humide' },
  { nom: '4. Professionnel, chantier, massif bâton rompu huilé', brut: { profil: 'professionnel', besoin: 'supply', type: 'massif', motif: 'baton-rompu', finition: 'huile' }, attendu: 1 },
  { nom: '5. Critères sans résultat exact : stratifié Versailles gris', brut: { type: 'stratifie', motif: 'versailles', teinte: 'gris' }, attendu: 2 },
  { nom: '6. Salle de bain avec chauffage au sol, teinte foncée', brut: { piece: 'humide', chauffage: true, teinte: 'fonce' }, attendu: 1 },
  { nom: '7. Terrasse', brut: { piece: 'terrasse' }, attendu: 1 },
  { nom: '8. Pré-diagnostic : pièce « cuisine », type massif (paramètres d’URL)', brut: { piece: 'cuisine', type: 'massif', via: 'pre-diagnostic' }, attendu: 1 },
];

let echecs = 0;
for (const s of SCENARIOS) {
  const c = normalizeCriteria(s.brut);
  const produits = catalogues[c.scope];
  const reco = recommend(produits, c);
  const categorie = getCategoryFallback(index, c, c.scope, 'test');
  const enseigne = getPartnerFallback(c.scope, c, 'test');
  const niveau = reco.exacts.length ? 1 : categorie ? 2 : 3;
  const ok = niveau === s.attendu;
  if (!ok) echecs++;
  console.log(`\n${ok ? 'OK ' : 'KO '} ${s.nom}`);
  console.log(`    critères : ${criteresPoses(c).map((x) => `${x.cle}=${x.valeur}`).join(', ') || '—'} | enseigne cherchée : ${c.scope} | candidats : ${reco.candidats}`);
  console.log(`    → niveau ${niveau}${ok ? '' : ` (attendu ${s.attendu})`}`);
  for (const r of reco.exacts) {
    console.log(`    • ${r.produit.nom} [${r.produit.enseigne}] score ${r.score}`);
    console.log(`      ${r.produit.url}`);
    console.log(`      pourquoi : ${r.raisons.join(' ✓ ')}`);
    if (r.produit.contrepartie) console.log(`      aussi chez ${r.produit.contrepartie.enseigne} : ${r.produit.contrepartie.url}`);
  }
  for (const r of reco.proches) {
    console.log(`    ~ proche : ${r.produit.nom} — diffère : ${r.ecarts.join(', ')}`);
  }
  if (categorie) console.log(`    repli catégorie : « ${categorie.nom} » (${categorie.nb} produits) ${categorie.url}`);
  if (enseigne) console.log(`    repli enseigne  : ${enseigne.nom} ${enseigne.url}`);
  if (s.verifier === 'humide') {
    const hors = produits.filter((p) => !p.pieces.includes('humide') && !exclusion(p, c)).length;
    console.log(`    contrôle : produits non classés « salles de bain et cuisines » proposés = ${hors}`);
    if (hors) echecs++;
  }
}

/* Règle absolue : jamais Over Parquet pour un particulier. */
const particulier = normalizeCriteria({ profil: 'particulier', besoin: 'supply', scope: 'overparquet' });
const inconnu = normalizeCriteria({ besoin: 'supply', scope: 'overparquet' });
console.log(`\nContrôle Over Parquet : particulier → ${particulier.scope}, profil inconnu → ${inconnu.scope}`);
if (particulier.scope !== 'premibel' || inconnu.scope !== 'premibel') echecs++;

console.log(echecs ? `\n${echecs} échec(s)` : '\nTous les scénarios donnent le niveau attendu.');
process.exit(echecs ? 1 : 0);
