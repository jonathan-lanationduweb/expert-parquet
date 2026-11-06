#!/usr/bin/env node
/**
 * Récupère l'instantané éditorial depuis WordPress et le pose dans le projet.
 *
 *   node tools/cms/fetch-snapshot.mjs            → data/content/snapshot.json
 *   node tools/cms/fetch-snapshot.mjs --apercu   → data/content/snapshot-apercu.json
 *                                                  (brouillons compris)
 *
 * Le build (tools/build.mjs) ne parle jamais à WordPress : il lit le fichier.
 * C'est ce qui le rend reproductible, relisible en diff, et possible hors
 * ligne. Ce script est la seule dépendance réseau de la chaîne.
 *
 * Les médias référencés sont copiés dans le projet : les images historiques
 * gardent leur place (assets/images/<nom>.jpg, variantes dans r/), les images
 * ajoutées depuis la médiathèque vont dans assets/images/cms/ avec les tailles
 * générées par WordPress. Le site public ne dépend donc jamais de WordPress
 * pour afficher une image.
 *
 * Authentification : le jeton de backend-private/build-token.txt (créé par le
 * plugin), ou la variable EP_BUILD_TOKEN. Adresse : EP_CMS_URL, par défaut
 * l'hôte de développement.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const API = (process.env.EP_CMS_URL || 'http://expert-parquet-dev.local/wp-json').replace(/\/$/, '');
const CMS_DIR = join(ROOT, 'assets', 'images', 'cms');

export function lireJeton() {
  if (process.env.EP_BUILD_TOKEN) return process.env.EP_BUILD_TOKEN.trim();
  const f = join(ROOT, 'backend-private', 'build-token.txt');
  if (!existsSync(f)) {
    throw new Error(`Jeton de build introuvable (${f}). Ouvrez une fois l'écran « Publication du site » dans WordPress, ou définissez EP_BUILD_TOKEN.`);
  }
  return readFileSync(f, 'utf8').trim();
}

async function appeler(chemin, jeton) {
  const url = `${API}/expert-parquet/v1/${chemin}`;
  const rep = await fetch(url, { headers: { 'X-EP-Build-Token': jeton } });
  if (!rep.ok) throw new Error(`${url} → HTTP ${rep.status}`);
  return rep;
}

/** Copie (ou télécharge) un média et ses tailles ; renvoie les noms de fichiers posés. */
async function rapatrier(media, jeton) {
  if (media.legacy) {
    /* Image historique : déjà dans assets/images avec ses variantes. On ne
       la recopie pas depuis WordPress — le fichier d'origine fait foi. */
    return [];
  }
  mkdirSync(join(CMS_DIR, 'r'), { recursive: true });
  const nom = basename(media.file);
  const base = nom.replace(/\.[^.]+$/, '');
  const ext = nom.slice(base.length);
  const poses = [];

  const poser = async (cible, source, url) => {
    if (source && existsSync(source)) {
      copyFileSync(source, cible);
    } else {
      const rep = await appeler(url.replace(`${API}/expert-parquet/v1/`, ''), jeton);
      writeFileSync(cible, Buffer.from(await rep.arrayBuffer()));
    }
    poses.push(cible);
  };

  await poser(join(CMS_DIR, nom), media.path, media.url);
  for (const [largeur, taille] of Object.entries(media.sizes || {})) {
    await poser(join(CMS_DIR, 'r', `${base}-${largeur}${ext}`), taille.path, taille.url);
  }
  return poses;
}

/** Retire de assets/images/cms ce qu'aucun contenu ne référence plus. */
function nettoyer(conserves) {
  if (!existsSync(CMS_DIR)) return 0;
  let retires = 0;
  for (const dossier of [CMS_DIR, join(CMS_DIR, 'r')]) {
    if (!existsSync(dossier)) continue;
    for (const f of readdirSync(dossier)) {
      const chemin = join(dossier, f);
      if (f.startsWith('.') || chemin === join(CMS_DIR, 'r')) continue;
      if (!conserves.has(chemin)) {
        unlinkSync(chemin);
        retires += 1;
      }
    }
  }
  return retires;
}

export async function recupererSnapshot({ apercu = false } = {}) {
  const jeton = lireJeton();
  const rep = await appeler(`content/export${apercu ? '?apercu=1' : ''}`, jeton);
  const snapshot = await rep.json();

  const conserves = new Set();
  for (const media of Object.values(snapshot.media || {})) {
    for (const f of await rapatrier(media, jeton)) conserves.add(f);
    /* Les chemins locaux de WordPress ne sortent pas du poste : inutiles au
       build, et ils décrivent l'arborescence du serveur. */
    delete media.path;
    for (const t of Object.values(media.sizes || {})) delete t.path;
  }
  /* Le favicon administré : les carrés produits par WordPress vont dans
     assets/icons/cms/, aux noms que le gabarit attend. */
  const fav = snapshot.site && snapshot.site.identity && snapshot.site.identity.favicon ? snapshot.media[String(snapshot.site.identity.favicon)] : null;
  if (fav && fav.sizes) {
    const dossier = join(ROOT, 'assets', 'icons', 'cms');
    mkdirSync(dossier, { recursive: true });
    const ext = (fav.file.match(/\.[a-z0-9]+$/i) || ['.png'])[0];
    const noms = { 'favicon-16': `favicon-16x16${ext}`, 'favicon-32': `favicon-32x32${ext}`, 'favicon-180': `apple-touch-icon${ext}` };
    for (const [cle, nom] of Object.entries(noms)) {
      const t = fav.sizes[cle];
      if (!t) continue;
      const cible = join(dossier, nom);
      if (t.path && existsSync(t.path)) copyFileSync(t.path, cible);
      else {
        const rep = await appeler(t.url.replace(`${API}/expert-parquet/v1/`, ''), jeton);
        writeFileSync(cible, Buffer.from(await rep.arrayBuffer()));
      }
    }
  }
  const retires = apercu ? 0 : nettoyer(conserves);

  const cible = join(ROOT, 'data', 'content', apercu ? 'snapshot-apercu.json' : 'snapshot.json');
  mkdirSync(dirname(cible), { recursive: true });
  writeFileSync(cible, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  return { cible, snapshot, retires };
}

const lance = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (lance) {
  recupererSnapshot({ apercu: process.argv.includes('--apercu') })
    .then(({ cible, snapshot, retires }) => {
      const s = snapshot;
      process.stdout.write(
        `${basename(cible)} : ${s.conseils.length} conseils, ${s.problemes.length} problèmes, ${s.faq.length} FAQ, ` +
          `${Object.keys(s.pages).length} pages, ${Object.keys(s.media).length} médias${retires ? `, ${retires} fichier(s) retiré(s) de assets/images/cms` : ''}.\n`
      );
    })
    .catch((e) => {
      console.error(e.message || e);
      process.exitCode = 1;
    });
}
