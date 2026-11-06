#!/usr/bin/env node
/**
 * Publication du site depuis WordPress — l'enchaînement complet, en une
 * commande FIXE que le plugin lance sans aucun argument venu de l'utilisateur.
 *
 *   node tools/publish.mjs --mode site      récupère l'instantané publié,
 *                                           régénère le site, le contrôle ;
 *                                           en cas d'échec, l'ancien site est
 *                                           remis en place tel quel
 *   node tools/publish.mjs --mode apercu    instantané AVEC brouillons, rendu
 *                                           dans _preview/ (jamais à la racine)
 *
 * État : backend-private/build/etat.json, lu par l'écran « Publication du
 * site ». Journal : backend-private/logs/build.log.
 *
 * Pourquoi un script séparé plutôt que `build && check` : le site en ligne est
 * le HTML de la racine. Si la génération échouait à mi-chemin, la racine
 * serait à moitié neuve. Ici, l'ancien HTML est sauvegardé AVANT, et restauré
 * si le build ou le contrôle échoue : le dernier site valide reste servi.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, cpSync, writeFileSync, appendFileSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { recupererSnapshot } from './cms/fetch-snapshot.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRIVE = join(ROOT, 'backend-private');
const ETAT = join(PRIVE, 'build', 'etat.json');
const JOURNAL = join(PRIVE, 'logs', 'build.log');
const SAUVEGARDE = join(PRIVE, 'build', 'sauvegarde');
const PREVIEW = join(ROOT, '_preview');

/* Ce que le build écrit à la racine, et donc ce qu'on sauvegarde. */
const SORTIES = ['index.html', 'pages', 'articles', 'sitemap.xml', 'robots.txt'];
/* Ce que la prévisualisation doit avoir sous la main pour des liens relatifs. */
const RESSOURCES = ['css', 'js', 'assets', 'data'];

const args = process.argv.slice(2);
const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'site';
if (!['site', 'apercu'].includes(mode)) {
  console.error('Mode inconnu. Attendu : --mode site | apercu');
  process.exit(2);
}

const debut = new Date();
const lignes = [];
function log(ligne) {
  const l = `[${new Date().toISOString()}] ${ligne}`;
  lignes.push(l);
  process.stdout.write(`${ligne}\n`);
}

function ecrireEtat(etat) {
  mkdirSync(dirname(ETAT), { recursive: true });
  writeFileSync(ETAT, JSON.stringify(etat, null, 2) + '\n', 'utf8');
  mkdirSync(dirname(JOURNAL), { recursive: true });
  appendFileSync(JOURNAL, lignes.join('\n') + '\n\n', 'utf8');
}

function lancer(script, env = {}) {
  const r = spawnSync(process.execPath, [join(ROOT, 'tools', script)], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  const sortie = `${r.stdout || ''}${r.stderr || ''}`.trim();
  for (const l of sortie.split('\n').slice(-40)) log(`  ${script}: ${l}`);
  return { ok: r.status === 0, sortie };
}

function compterPages(dossier) {
  let n = 0;
  const marcher = (d) => {
    for (const nom of readdirSync(d)) {
      const f = join(d, nom);
      if (statSync(f).isDirectory()) {
        if (!nom.startsWith('.') && !nom.startsWith('_') && !['tools', 'backend', 'backend-private', 'dist', 'node_modules', 'css', 'js', 'assets', 'data'].includes(nom)) marcher(f);
      } else if (nom.endsWith('.html') && nom !== 'maintenance.html') n += 1;
    }
  };
  marcher(dossier);
  return n;
}

function sauvegarder() {
  rmSync(SAUVEGARDE, { recursive: true, force: true });
  mkdirSync(SAUVEGARDE, { recursive: true });
  for (const s of SORTIES) {
    const src = join(ROOT, s);
    if (existsSync(src)) cpSync(src, join(SAUVEGARDE, s), { recursive: true });
  }
}

function restaurer() {
  for (const s of SORTIES) {
    const sauv = join(SAUVEGARDE, s);
    if (!existsSync(sauv)) continue;
    rmSync(join(ROOT, s), { recursive: true, force: true });
    cpSync(sauv, join(ROOT, s), { recursive: true });
  }
}

async function main() {
  const etat = { mode, debut: debut.toISOString(), fin: null, ok: false, pages: 0, message: '', etapes: [] };
  const etape = (nom, ok, detail = '') => {
    etat.etapes.push({ nom, ok, detail });
    log(`${ok ? '✓' : '✗'} ${nom}${detail ? ` — ${detail}` : ''}`);
  };

  try {
    /* 1. L'instantané. */
    const apercu = mode === 'apercu';
    const { cible, snapshot } = await recupererSnapshot({ apercu });
    etape('Instantané éditorial', true, `${snapshot.conseils.length} conseils, ${snapshot.problemes.length} problèmes, ${snapshot.faq.length} FAQ, ${Object.keys(snapshot.pages).length} pages`);

    if (apercu) {
      /* 2a. Prévisualisation : un site complet dans _preview/, brouillons compris.
         La feuille de thème (css/theme.css) est écrite à la racine par le build :
         on la remet telle qu'elle était après avoir copié les ressources, pour
         que le site en ligne ne change pas de couleur avant publication. */
      const theme = join(ROOT, 'css', 'theme.css');
      const themeAvant = existsSync(theme) ? readFileSync(theme, 'utf8') : null;
      rmSync(PREVIEW, { recursive: true, force: true });
      mkdirSync(PREVIEW, { recursive: true });
      const build = lancer('build.mjs', { BUILD_OUT: PREVIEW, EP_SNAPSHOT: cible });
      etape('Génération de l’aperçu', build.ok);
      for (const r of RESSOURCES) {
        if (existsSync(join(ROOT, r))) cpSync(join(ROOT, r), join(PREVIEW, r), { recursive: true });
      }
      if (themeAvant !== null) writeFileSync(theme, themeAvant, 'utf8');
      if (!build.ok) throw new Error('La génération de l’aperçu a échoué.');
      etape('Ressources copiées', true);
      etat.pages = compterPages(PREVIEW);
      etat.ok = true;
      etat.message = `Aperçu prêt : ${etat.pages} pages dans _preview/.`;
      return;
    }

    /* 2b. Site : sauvegarde, génération, contrôle, restauration si besoin. */
    sauvegarder();
    etape('Sauvegarde du site actuel', true);

    const build = lancer('build.mjs');
    etape('Génération du site', build.ok);
    if (!build.ok) {
      restaurer();
      etape('Site précédent restauré', true);
      throw new Error('La génération a échoué : le site précédent est resté en place.');
    }

    const check = lancer('check.mjs');
    etape('Contrôle qualité', check.ok);
    if (!check.ok) {
      restaurer();
      etape('Site précédent restauré', true);
      const erreurs = (check.sortie.match(/^\s+- .+$/gm) || []).slice(0, 10).join(' ');
      throw new Error(`Le contrôle qualité a refusé le site : le site précédent est resté en place. ${erreurs}`);
    }

    etat.pages = compterPages(ROOT);
    etat.ok = true;
    etat.message = `Site publié : ${etat.pages} pages générées, contrôle qualité sans erreur.`;
  } catch (e) {
    etat.ok = false;
    etat.message = e && e.message ? e.message : String(e);
    log(`✗ ${etat.message}`);
  } finally {
    etat.fin = new Date().toISOString();
    etat.dureeMs = Date.now() - debut.getTime();
    ecrireEtat(etat);
    process.stdout.write(`\n${etat.ok ? 'OK' : 'ÉCHEC'} — ${etat.message}\n`);
    process.exitCode = etat.ok ? 0 : 1;
  }
}

main();
