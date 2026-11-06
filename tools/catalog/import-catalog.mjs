/**
 * Import des catalogues partenaires → data/catalog-*.json
 *
 * ---------------------------------------------------------------------------
 * D'OÙ VIENNENT LES DONNÉES
 *
 * Premibel et Over Parquet tournent tous deux sous WooCommerce et exposent
 * l'API « Store » de WooCommerce Blocks, publique et sans authentification :
 *
 *   {site}/wp-json/wc/store/v1/products?per_page=100&page=N
 *   {site}/wp-json/wc/store/v1/products/categories?per_page=100
 *
 * Relevé le 05/10/2026 : 783 produits chez Premibel, 877 chez Over Parquet,
 * tous avec identifiant, nom, URL canonique, référence (SKU), image(s),
 * catégories et attributs (essence, finition, chauffage au sol, épaisseur,
 * largeur, pose…). Aucune donnée n'est devinée : ce qui n'est pas dans la
 * réponse de l'enseigne n'existe pas pour nous.
 *
 * ---------------------------------------------------------------------------
 * CE QUE FAIT CE SCRIPT
 *
 * 1. Télécharge produits et catégories des deux enseignes (ou relit un dossier
 *    de réponses brutes avec `--source <dir>`, pour rejouer un import).
 * 2. Ne garde que les PARQUETS : accessoires, plinthes, colles, isolation,
 *    panneaux muraux et lots de fin de série sont écartés. Expert Parquet
 *    n'est pas un catalogue : il qualifie, recommande, redirige.
 * 3. Normalise chaque produit en facettes lisibles par le moteur de
 *    recommandation (type, motif, teinte, finition, pièces, chauffage au sol…)
 *    À PARTIR des catégories et attributs de l'enseigne, jamais du nom.
 * 4. Relie une référence Over Parquet à son équivalente Premibel quand nom et
 *    description sont strictement identiques (les deux enseignes partagent
 *    une base article : mêmes SKU à un infixe près, mêmes fichiers image).
 * 5. Écrit data/catalog-{enseigne}.json, data/catalog-index.json et
 *    js/config/catalog-version.js (empreinte → cache-busting).
 *
 * Usage :  node tools/catalog/import-catalog.mjs [--source <dir>]
 *
 * À relancer périodiquement : le site statique embarque un INSTANTANÉ du
 * catalogue, daté dans catalog-index.json et affiché à l'écran.
 *
 * Le rafraîchissement n'est PAS fait par le navigateur : le front ne contacte
 * jamais les sites des enseignes (robots.txt de Premibel interdit d'ailleurs
 * /wp-json/ aux robots ; un import ponctuel, identifié, à la cadence d'un
 * build, n'est pas un robot d'indexation — mais la décision de l'exploiter
 * appartient aux enseignes partenaires, voir README « Catalogue »).
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data');
const UA = 'ExpertParquetCatalogImport/1.0 (+https://expert-parquet.com)';

const ENSEIGNES = {
  premibel: { base: 'https://www.premibel.fr', nom: 'Premibel' },
  overparquet: { base: 'https://over-parquet.com', nom: 'Over Parquet' },
};

/* ------------------------------------------------------------ taxonomies
   Slugs de catégories tels qu'ils existent chez les enseignes (relevés dans
   la réponse /products/categories). Un slug absent d'une enseigne est
   simplement ignoré pour elle. */

const SLUGS = {
  /* Ce qui n'est pas un parquet. Un produit qui porte l'un de ces slugs (ou
     un de leurs descendants) est écarté. */
  horsParquet: [
    'accessoires', 'plinthe', 'barre-de-seuil', 'colle', 'isolation', 'sous-couche',
    'panneaux-muraux', 'finition-et-entretien', 'nez-de-marche', 'quart-de-rond',
    'plinthe-mdf', 'plinthe-bois', 'plinthe-electrique', 'huile-cire', 'vitrificateurs',
    'huile-de-protection', 'nettoyants', 'saturateur', 'accessoire-lame-de-terrasse',
    'chape-seche-thermo-acoustique', 'sous-chape-ciment', 'colle-pour-parquet',
    'colle-pour-isolation', 'lots-de-fin-de-serie', 'collection-derniere-chance',
  ],
  type: {
    massif: ['parquet-massif'],
    contrecolle: ['parquet-flottant'],
    stratifie: ['parquet-sol-stratifie'],
    terrasse: ['lames-de-terrasse'],
  },
  motif: {
    'lames-droites': ['lames-droites', 'parquet-massif-lames-droites'],
    'point-de-hongrie': ['point-de-hongrie', 'parquet-flottant-point-de-hongrie', 'point-de-hongrie-massif', 'parquet-massif-point-de-hongrie'],
    'baton-rompu': ['baton-rompu', 'parquet-massif-baton-rompu', 'parquet-flottant-baton-rompu'],
    versailles: ['versailles', 'parquet-flottant-versailles'],
  },
  teinte: {
    blanc: ['blanc'], clair: ['clair'], naturel: ['naturel'], miel: ['miel'],
    brun: ['brun'], cuivre: ['cuivre'], fonce: ['fonce'], gris: ['gris'],
  },
  finition: { brut: ['brut'], huile: ['huile'], verni: ['verni'] },
  pieces: {
    salon: ['parquet-salon'],
    chambre: ['parquet-chambre'],
    entree: ['parquet-entree-couloir'],
    bureau: ['parquet-bureau-usage-commercial'],
    humide: ['parquet-pour-salles-de-bain-et-cuisines', 'parquet-cuisine', 'parquet-salle-de-bain'],
  },
};

/* Attributs WooCommerce (taxonomies `pa_*`) → valeurs normalisées. */
const TERMES = {
  finition: { Verni: 'verni', 'Huilé': 'huile', Brut: 'brut', 'Stratifié': 'stratifie' },
  teinte: { Blanc: 'blanc', Clair: 'clair', Naturel: 'naturel', Miel: 'miel', Brun: 'brun', Cuivre: 'cuivre', 'Foncé': 'fonce', Gris: 'gris' },
  motif: { 'Lames droites': 'lames-droites', 'Point de Hongrie': 'point-de-hongrie', 'Bâton rompu': 'baton-rompu', Versailles: 'versailles' },
  type: { type_massif: 'massif', Massif: 'massif', type_contrecolle: 'contrecolle', 'Contrecollé': 'contrecolle', type_stratifie: 'stratifie', 'Stratifié': 'stratifie', type_lame_terrasse: 'terrasse' },
};

/* ------------------------------------------------------------ acquisition */

async function getJson(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} — ${url}`);
  return { data: await r.json(), pages: Number(r.headers.get('x-wp-totalpages') || 1) };
}

async function telecharger(base, ressource) {
  const url = (page) => `${base}/wp-json/wc/store/v1/${ressource}?per_page=100&page=${page}`;
  const first = await getJson(url(1));
  let all = first.data;
  for (let p = 2; p <= first.pages; p++) all = all.concat((await getJson(url(p))).data);
  return all;
}

async function charger(cle, sourceDir) {
  const { base } = ENSEIGNES[cle];
  if (sourceDir) {
    const lire = (n) => JSON.parse(readFileSync(join(sourceDir, `${cle}-${n}.json`), 'utf8'));
    return { produits: lire('products'), categories: lire('categories') };
  }
  const produits = await telecharger(base, 'products');
  const categories = await telecharger(base, 'products/categories');
  return { produits, categories };
}

/* ------------------------------------------------------------ normalisation */

function arbre(categories) {
  const parId = new Map(categories.map((c) => [c.id, c]));
  /* Tous les slugs d'une catégorie ET de ses ancêtres. */
  const ancetres = (id) => {
    const out = [];
    let c = parId.get(id);
    let garde = 0;
    while (c && garde++ < 10) {
      out.push(c.slug);
      c = c.parent ? parId.get(c.parent) : null;
    }
    return out;
  };
  return { parId, ancetres };
}

const texte = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

function normaliser(p, cle, { ancetres }) {
  const slugs = new Set();
  for (const c of p.categories || []) for (const s of ancetres(c.id)) slugs.add(s);
  const a = (slug) => slugs.has(slug);
  const attr = (tax) => (p.attributes || []).find((x) => x.taxonomy === tax)?.terms?.map((t) => t.name) || [];
  const premier = (table, slugsParValeur, termes) => {
    for (const t of termes) if (table[t]) return table[t];
    for (const [valeur, liste] of Object.entries(slugsParValeur)) if (liste.some(a)) return valeur;
    return null;
  };

  if (SLUGS.horsParquet.some(a)) return null;
  const type = premier(TERMES.type, SLUGS.type, attr('pa_type_parquet'));
  const motif = premier(TERMES.motif, SLUGS.motif, attr('pa_motif'));
  if (!type && !motif && !a('parquet')) return null; // ni catégorisé parquet, ni typé : on ne sait pas ce que c'est

  const chauffageTermes = attr('pa_chauffage_au_sol');
  let chauffage = null;
  if (chauffageTermes.some((t) => /Non compatible/i.test(t))) chauffage = 'non';
  else if (chauffageTermes.some((t) => /Haute/i.test(t))) chauffage = 'haute';
  else if (chauffageTermes.some((t) => /Basse/i.test(t))) chauffage = 'basse';

  const pieces = Object.entries(SLUGS.pieces).filter(([, liste]) => liste.some(a)).map(([k]) => k);
  if (attr('pa_compatible_sdb').some((t) => /^Oui$/i.test(t)) && !pieces.includes('humide')) pieces.push('humide');

  const image = (p.images || [])[0] || null;
  const mm = (v) => (v ? String(v).replace(/\.0+$/, '').replace(/(\d)mm$/, '$1 mm').replace(/^(\d+(?:[.,]\d+)?)$/, '$1 mm') : null);

  return {
    id: p.id,
    enseigne: cle,
    sku: p.sku || null,
    nom: texte(p.name),
    url: p.permalink,
    image: image ? { src: image.src, thumb: image.thumbnail || image.src, alt: texte(image.alt || p.name) } : null,
    type,
    motif,
    teinte: premier(TERMES.teinte, SLUGS.teinte, attr('pa_couleur')),
    finition: premier(TERMES.finition, SLUGS.finition, attr('pa_finition')),
    essence: attr('pa_essence')[0] || null,
    pieces,
    chauffage,
    epaisseur: mm(attr('pa_epaisseur')[0]),
    largeur: mm(attr('pa_largeur')[0]),
    coucheUsure: mm(attr('pa_couche_usure')[0]),
    aspect: attr('pa_aspect').flatMap((t) => t.split(',').map((s) => s.trim())).filter(Boolean),
    enStock: Boolean(p.is_in_stock),
    /* Prix public TTC en centimes tel que servi par l'enseigne, conservé pour
       audit — il n'est PAS affiché : un prix figé dans un instantané serait
       faux dès la première mise à jour de l'enseigne. */
    prixCentimes: Number(p.prices?.price) > 0 ? Number(p.prices.price) : null,
    _desc: texte(p.description),
  };
}

/* Deux fiches sont « la même référence » si nom ET description sont identiques
   à la casse et aux espaces près. Pas de rapprochement sur le SKU seul : son
   infixe « PP » se place différemment selon les gammes. */
const cleRef = (p) => `${p.nom}::${p._desc}`.toLowerCase().replace(/\s+/g, ' ');

/* ------------------------------------------------------------ principal */

async function main() {
  const idx = process.argv.indexOf('--source');
  const sourceDir = idx > -1 ? process.argv[idx + 1] : null;
  mkdirSync(OUT, { recursive: true });

  const resultat = {};
  const brut = {};
  for (const cle of Object.keys(ENSEIGNES)) {
    const t0 = Date.now();
    const { produits, categories } = await charger(cle, sourceDir);
    const t = arbre(categories);
    const normalises = produits.map((p) => normaliser(p, cle, t)).filter(Boolean);
    brut[cle] = { produits, categories };
    resultat[cle] = { normalises, categories, total: produits.length, duree: Date.now() - t0 };
  }

  /* Contreparties Premibel ↔ Over Parquet. */
  const parRef = new Map(resultat.premibel.normalises.map((p) => [cleRef(p), p]));
  let liens = 0;
  for (const o of resultat.overparquet.normalises) {
    const p = parRef.get(cleRef(o));
    if (p) {
      o.contrepartie = { enseigne: 'premibel', id: p.id, url: p.url };
      p.contrepartie = { enseigne: 'overparquet', id: o.id, url: o.url };
      liens++;
    }
  }

  const index = { generatedAt: new Date().toISOString(), source: 'WooCommerce Store API (wc/store/v1), lecture publique', enseignes: {} };
  for (const [cle, r] of Object.entries(resultat)) {
    const produits = r.normalises
      .filter((p) => p.enStock && p.image)
      /* Ni prix ni stock dans l'instantané : tous les retenus sont en stock
         au moment de l'import, et un prix figé serait faux dès la première
         mise à jour de l'enseigne. Les deux restent consultables chez elle. */
      .map(({ _desc, prixCentimes, enStock, ...p }) => p)
      .sort((a, b) => a.id - b.id);
    const categories = {};
    for (const c of r.categories) {
      categories[c.slug] = { nom: texte(c.name), url: c.permalink, nb: c.count };
    }
    writeFileSync(join(OUT, `catalog-${cle}.json`), JSON.stringify({ enseigne: cle, generatedAt: index.generatedAt, produits }));
    const stats = {
      nom: ENSEIGNES[cle].nom,
      base: ENSEIGNES[cle].base,
      totalApi: r.total,
      parquets: r.normalises.length,
      retenus: produits.length,
      ecartesRuptureOuSansImage: r.normalises.length - produits.length,
      facettes: Object.fromEntries(['type', 'motif', 'teinte', 'finition', 'chauffage', 'essence'].map((f) => [f, produits.filter((p) => p[f]).length])),
      pieces: produits.filter((p) => p.pieces.length).length,
      contreparties: produits.filter((p) => p.contrepartie).length,
    };
    index.enseignes[cle] = { ...stats, categories };
    console.log(`${ENSEIGNES[cle].nom} : ${r.total} produits API → ${r.normalises.length} parquets → ${produits.length} retenus (en stock, avec image) en ${r.duree} ms`);
    console.log('   facettes :', JSON.stringify(stats.facettes), 'pièces :', stats.pieces, 'contreparties :', stats.contreparties);
  }
  console.log(`Références communes aux deux enseignes (nom + description identiques) : ${liens}`);
  writeFileSync(join(OUT, 'catalog-index.json'), JSON.stringify(index, null, 1));

  /* Empreinte → cache-busting des JSON (les .js, eux, sont déjà estampillés). */
  const h = createHash('sha256');
  for (const cle of Object.keys(ENSEIGNES)) h.update(readFileSync(join(OUT, `catalog-${cle}.json`)));
  const version = h.digest('hex').slice(0, 8);
  writeFileSync(
    join(ROOT, 'js', 'config', 'catalog-version.js'),
    `/* Généré par tools/catalog/import-catalog.mjs — ne pas éditer. */\nexport const CATALOG_VERSION = '${version}';\nexport const CATALOG_GENERATED_AT = '${index.generatedAt}';\n`
  );
  console.log(`Version catalogue : ${version} (${index.generatedAt})`);

  if (!existsSync(join(OUT, 'README.md'))) {
    writeFileSync(join(OUT, 'README.md'), '# data/\n\nInstantanés des catalogues partenaires, générés par `node tools/catalog/import-catalog.mjs`.\nNe pas éditer à la main. Voir ARCHITECTURE.md « Catalogue et recommandation ».\n');
  }
}

main().catch((e) => {
  console.error('Import catalogue : échec —', e.message);
  process.exit(1);
});
