/**
 * Chargement du catalogue — à la demande, une enseigne à la fois.
 *
 * Les instantanés data/catalog-{enseigne}.json ne sont jamais embarqués dans
 * les pages : ils pèsent de l'ordre de 100 à 150 Ko chacun et ne servent qu'au
 * moteur « Trouver mon parquet ». On les lit quand le moteur en a besoin, une
 * fois, et on les garde en mémoire.
 *
 * L'adresse est résolue depuis CE module (import.meta.url), pas depuis la page :
 * l'accueil est à la racine, une page problème dans pages/problemes/, et les
 * deux doivent trouver le même fichier.
 */

import { CATALOG_VERSION } from '../config/catalog-version.js';
import { normalizeProduct } from './normalize.js';

const cache = new Map();

function urlDe(fichier) {
  const u = new URL(`../../data/${fichier}`, import.meta.url);
  u.searchParams.set('v', CATALOG_VERSION);
  return u.toString();
}

/**
 * @param {'premibel'|'overparquet'} enseigne
 * @returns {Promise<{enseigne: string, generatedAt: string, produits: object[]}>}
 */
export function loadCatalog(enseigne) {
  if (!cache.has(enseigne)) {
    const promesse = fetch(urlDe(`catalog-${enseigne}.json`), { credentials: 'omit' })
      .then((r) => {
        if (!r.ok) throw new Error(`catalogue ${enseigne} : HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => ({
        enseigne,
        generatedAt: json.generatedAt,
        produits: (json.produits || []).map(normalizeProduct).filter(Boolean),
      }))
      .catch((e) => {
        cache.delete(enseigne); // un échec réseau ne doit pas être mémorisé
        throw e;
      });
    cache.set(enseigne, promesse);
  }
  return cache.get(enseigne);
}

/** Index : date de l'instantané et catégories réelles de chaque enseigne. */
export function loadCatalogIndex() {
  if (!cache.has('index')) {
    cache.set(
      'index',
      fetch(urlDe('catalog-index.json'), { credentials: 'omit' }).then((r) => {
        if (!r.ok) throw new Error(`index catalogue : HTTP ${r.status}`);
        return r.json();
      })
    );
  }
  return cache.get('index');
}
