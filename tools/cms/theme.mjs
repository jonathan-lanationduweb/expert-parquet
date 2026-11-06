/**
 * La feuille de thème : les couleurs d'accent, écrites dans `css/theme.css`
 * à partir de la configuration du site (Site → Apparence).
 *
 * Ce fichier fait partie de l'outillage de développement (dossier `tools/`).
 * Il n'est PAS chargé par le site — c'est `css/theme.css` qui l'est, juste
 * après `variables.css`, où elle redéfinit les seules variables d'accent.
 *
 * Importé par layout.mjs AVANT le calcul des empreintes : le fichier existe et
 * est à jour quand les feuilles sont estampillées. Il n'est réécrit que s'il
 * change, pour ne pas faire bouger son empreinte à chaque build.
 *
 * Avec l'accent de la V1 (#B04A1E), les valeurs écrites sont exactement celles
 * de variables.css : rien ne change à l'écran.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { palette } from './site.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FICHIER = join(ROOT, 'css', 'theme.css');

export function contenuTheme() {
  const p = palette();
  return `/* Généré par tools/cms/theme.mjs depuis la configuration du site (Site → Apparence).
   Ne pas modifier à la main : relancer le build. Seules les variables d'accent
   sont redéfinies ici ; tout le reste de la direction artistique vit dans
   variables.css. */
:root {
  --color-terra: ${p.terra};
  --color-terra-dark: ${p.terraDark};
  --color-terra-soft: ${p.terraSoft};
  --color-terra-on-dark: ${p.terraOnDark};
}
`;
}

export function ecrireTheme() {
  const contenu = contenuTheme();
  const actuel = existsSync(FICHIER) ? readFileSync(FICHIER, 'utf8') : null;
  if (actuel !== contenu) writeFileSync(FICHIER, contenu, 'utf8');
  return contenu;
}

ecrireTheme();
