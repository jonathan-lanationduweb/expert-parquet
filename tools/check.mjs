#!/usr/bin/env node
/**
 * Contrôle qualité du site généré (outillage de développement).
 *
 * Vérifie : liens internes, ancres, images (existence, alt, dimensions),
 * absence de CSS/JS inline, unicité du H1, présence des métadonnées SEO,
 * cohérence du sitemap et validité du JSON-LD.
 *
 * Usage : node tools/check.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['tools', 'node_modules', '.git'].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const pages = walk(ROOT);
const anchorsByFile = new Map();

// Première passe : collecter les id de chaque page.
for (const file of pages) {
  // Les commentaires HTML (exemples de code, notes) ne sont pas analysés.
  const html = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  anchorsByFile.set(file, ids);
}

for (const file of pages) {
  const rel = relative(ROOT, file).split(sep).join('/');
  // Les commentaires HTML (exemples de code, notes) ne sont pas analysés.
  const html = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const fail = (msg) => errors.push(`${rel} : ${msg}`);
  const warn = (msg) => warnings.push(`${rel} : ${msg}`);

  // --- Interdits -----------------------------------------------------------
  if (/\sstyle="/.test(html)) fail('attribut style inline détecté');
  if (/<style[\s>]/.test(html)) fail('bloc <style> détecté');
  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  for (const [, body, ] of inlineScripts) {
    const type = /type="application\/ld\+json"/;
    const tag = html.slice(html.indexOf(body) - 200, html.indexOf(body));
    if (!type.test(tag)) fail('script inline non JSON-LD détecté');
  }
  for (const attr of ['onclick', 'onload', 'onerror', 'onsubmit', 'onchange']) {
    if (new RegExp(`\\s${attr}=`, 'i').test(html)) fail(`gestionnaire inline ${attr} détecté`);
  }

  // --- Structure -----------------------------------------------------------
  const h1s = [...html.matchAll(/<h1[\s>]/g)].length;
  if (h1s !== 1) fail(`${h1s} balise(s) H1 (attendu : 1)`);
  if (!/<title>[^<]{10,}<\/title>/.test(html)) fail('title manquant ou trop court');
  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) fail('meta description manquante ou trop courte');
  if (!/<link rel="canonical"/.test(html)) fail('canonical manquant');
  if (!/<meta property="og:title"/.test(html)) fail('Open Graph manquant');
  if (!/<html lang="fr"/.test(html)) fail('attribut lang manquant');
  if (!/class="skip-link"/.test(html)) fail('lien dévitement manquant');

  // --- JSON-LD -------------------------------------------------------------
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      fail(`JSON-LD invalide : ${error.message}`);
    }
  }

  // --- Liens ---------------------------------------------------------------
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(href)) {
      if (href.startsWith('#') && href.length > 1) {
        const id = href.slice(1);
        if (!anchorsByFile.get(file).has(id)) fail(`ancre interne introuvable : ${href}`);
      }
      continue;
    }
    const [path, hash] = href.split('#');
    const target = resolve(dirname(file), path);
    if (!existsSync(target)) {
      fail(`lien cassé : ${href}`);
      continue;
    }
    if (hash && target.endsWith('.html')) {
      const ids = anchorsByFile.get(target);
      if (ids && !ids.has(hash)) fail(`ancre introuvable dans la cible : ${href}`);
    }
  }

  // --- Images --------------------------------------------------------------
  for (const match of html.matchAll(/<img\s([^>]+)>/g)) {
    const attrs = match[1];
    const src = /src="([^"]+)"/.exec(attrs);
    if (!src) {
      fail('img sans src');
      continue;
    }
    if (!/^https?:/.test(src[1])) {
      const target = resolve(dirname(file), src[1]);
      if (!existsSync(target)) fail(`image introuvable : ${src[1]}`);
    }
    if (!/\salt="/.test(attrs)) fail(`img sans attribut alt : ${src[1]}`);
    if (!/\swidth="/.test(attrs) || !/\sheight="/.test(attrs)) {
      warn(`img sans width/height : ${src[1]}`);
    }
    if (!/loading="lazy"/.test(attrs) && !/fetchpriority="high"/.test(attrs)) {
      warn(`img sans stratégie de chargement : ${src[1]}`);
    }
  }

  // --- Champs de formulaire ------------------------------------------------
  for (const match of html.matchAll(/<(input|select|textarea)\s([^>]*)>/g)) {
    const attrs = match[2];
    if (/type="(hidden|radio|checkbox|file|submit|button)"/.test(attrs)) continue;
    const id = /\sid="([^"]+)"/.exec(attrs);
    if (!id) {
      fail(`champ ${match[1]} sans id`);
      continue;
    }
    if (!new RegExp(`for="${id[1]}"`).test(html)) fail(`champ sans label associé : #${id[1]}`);
  }
}

// --- Sitemap ---------------------------------------------------------------
const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>https:\/\/expert-parquet\.com\/([^<]*)<\/loc>/g)].map((m) => m[1]);
for (const loc of locs) {
  const target = join(ROOT, loc === '' ? 'index.html' : loc);
  if (!existsSync(target)) errors.push(`sitemap.xml : URL sans fichier correspondant (${loc})`);
}
const pageSet = new Set(pages.map((p) => relative(ROOT, p).split(sep).join('/')));
for (const page of pageSet) {
  const expected = page === 'index.html' ? '' : page;
  if (!locs.includes(expected)) errors.push(`sitemap.xml : page absente (${page})`);
}

// --- Rapport ---------------------------------------------------------------
console.log(`${pages.length} pages analysées.\n`);
if (warnings.length) {
  console.log(`AVERTISSEMENTS (${warnings.length}) :`);
  warnings.forEach((w) => console.log(`  - ${w}`));
  console.log('');
}
if (errors.length) {
  console.log(`ERREURS (${errors.length}) :`);
  errors.forEach((e) => console.log(`  - ${e}`));
  process.exitCode = 1;
} else {
  console.log('Aucune erreur détectée.');
}
