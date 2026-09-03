/**
 * Génère les déclinaisons de l’identité visuelle à partir des deux sources
 * de `assets/brand/` : le symbole seul et le logotype horizontal.
 *
 * Ce fichier fait partie de l’outillage de développement (dossier `tools/`).
 * Il n’est PAS chargé par le site. Lancer : `node tools/make-icons.mjs`.
 *
 * Zéro dépendance, comme le reste du projet : décodeur / encodeur PNG,
 * rééchantillonnage Lanczos-3 et écriture ICO sont écrits ici.
 *
 * Sorties :
 *   assets/brand/expert-parquet-logo-on-light.png   logotype pour fonds clairs
 *   assets/brand/expert-parquet-logo-on-dark.png    logotype pour fonds sombres
 *   assets/icons/favicon-16x16.png                  déclinaison simplifiée
 *   assets/icons/favicon-32x32.png                  déclinaison simplifiée
 *   assets/icons/favicon.ico                        16 + 32 + 48
 *   assets/icons/apple-touch-icon.png               180 × 180, symbole complet
 *
 * Deux partis pris, documentés parce qu’ils ne sont pas évidents :
 *
 * 1. Sur fond sombre, seul le LOGOTYPE est inversé — le symbole reste
 *    intact. Éclaircir aussi le « P » le transforme en pièce métallique et
 *    change la matière de la marque ; le « P » sombre reste parfaitement
 *    lisible car les lames crème et la lame terre cuite en dessinent le
 *    contour.
 *
 * 2. Les favicons 16/32 sont une DÉCLINAISON SIMPLIFIÉE à aplats, sur une
 *    tuile opaque crème. Deux raisons : le symbole d’origine mêle du crème
 *    et du graphite, donc en transparence il perd ses lames sur fond clair
 *    et son « P » sur fond sombre ; et à 16 px les lames crème (#E8E1D6)
 *    disparaissent dans le fond ivoire. Les lames sont donc ramenées au
 *    gris pierre de la charte (`--color-stone`), assez sombre pour se lire
 *    sur la tuile, assez clair pour ne pas concurrencer le « P ».
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Couleurs de la charte (css/variables.css) ------------------------------------ */
const INK = [0x17, 0x18, 0x1a]; // --color-ink
const STONE = [0xc6, 0xc3, 0xbd]; // --color-stone
const TERRA = [0xb0, 0x4a, 0x1e]; // --color-terra
const PAPER = [0xf6, 0xf5, 0xf3]; // --color-white / --bg-page
const INVERSE = [0xe8, 0xe6, 0xe2]; // --text-inverse

/* --- PNG ------------------------------------------------------------------------ */

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Décode un PNG 8 bits non entrelacé en RGBA. */
function decodePng(file) {
  const buf = readFileSync(file);
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error(`${file} : PNG attendu`);
  let off = 8;
  let head = null;
  let palette = null;
  let alphaTable = null;
  const parts = [];

  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      head = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === 'IDAT') parts.push(Buffer.from(data));
    else if (type === 'PLTE') palette = Buffer.from(data);
    else if (type === 'tRNS') alphaTable = Buffer.from(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }

  if (head.depth !== 8) throw new Error(`${file} : profondeur ${head.depth} non gérée`);
  if (head.interlace) throw new Error(`${file} : entrelacement non géré`);

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[head.colorType];
  const raw = zlib.inflateSync(Buffer.concat(parts));
  const { width, height } = head;
  const stride = width * channels;
  const lines = Buffer.alloc(stride * height);

  // Défiltrage ligne par ligne (types 0 à 4 de la spécification PNG).
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const cur = lines.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? lines.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
  }

  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    let r;
    let g;
    let b;
    let a = 255;
    if (head.colorType === 0) r = g = b = lines[i];
    else if (head.colorType === 4) {
      r = g = b = lines[i * 2];
      a = lines[i * 2 + 1];
    } else if (head.colorType === 2) {
      [r, g, b] = [lines[i * 3], lines[i * 3 + 1], lines[i * 3 + 2]];
    } else if (head.colorType === 6) {
      [r, g, b, a] = [lines[i * 4], lines[i * 4 + 1], lines[i * 4 + 2], lines[i * 4 + 3]];
    } else {
      const idx = lines[i];
      [r, g, b] = [palette[idx * 3], palette[idx * 3 + 1], palette[idx * 3 + 2]];
      if (alphaTable && idx < alphaTable.length) a = alphaTable[idx];
    }
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  }

  return { width, height, data };
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Encode un RGBA en PNG 8 bits (filtre 0, deflate maximal). */
function encodePng({ width, height, data }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/* --- Géométrie et rééchantillonnage -------------------------------------------- */

/** Boîte des pixels non transparents. */
function contentBox(img, threshold = 8) {
  const { width: w, height: h, data: d } = img;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > threshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

function crop(img, box) {
  const out = Buffer.alloc(box.width * box.height * 4);
  for (let y = 0; y < box.height; y++) {
    const from = ((y + box.y0) * img.width + box.x0) * 4;
    img.data.copy(out, y * box.width * 4, from, from + box.width * 4);
  }
  return { width: box.width, height: box.height, data: out };
}

/** Recadre sur le contenu puis centre dans un carré, `margin` = part du côté. */
function squareCrop(img, margin) {
  const box = contentBox(img);
  const side = Math.round(Math.max(box.width, box.height) / (1 - 2 * margin));
  const out = Buffer.alloc(side * side * 4);
  const ox = Math.round((side - box.width) / 2) - box.x0;
  const oy = Math.round((side - box.height) / 2) - box.y0;
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const tx = x + ox;
      const ty = y + oy;
      if (tx < 0 || tx >= side || ty < 0 || ty >= side) continue;
      const from = (y * img.width + x) * 4;
      img.data.copy(out, (ty * side + tx) * 4, from, from + 4);
    }
  }
  return { width: side, height: side, data: out };
}

const lanczos = (x, a = 3) => {
  if (x === 0) return 1;
  if (Math.abs(x) >= a) return 0;
  const px = Math.PI * x;
  return (a * Math.sin(px) * Math.sin(px / a)) / (px * px);
};

/**
 * Une passe (horizontale ou verticale) de rééchantillonnage.
 * Les couleurs sont pondérées PRÉMULTIPLIÉES par l’alpha : sans cela les
 * bords se salissent avec la couleur des pixels transparents.
 */
function pass(src, sw, sh, dw, dh, horizontal) {
  const outW = horizontal ? dw : sw;
  const outH = horizontal ? sh : dh;
  const out = Buffer.alloc(outW * outH * 4);
  const scale = horizontal ? dw / sw : dh / sh;
  const support = scale < 1 ? 3 / scale : 3;
  const srcLen = horizontal ? sw : sh;
  const dstLen = horizontal ? dw : dh;
  const otherLen = horizontal ? sh : sw;

  for (let i = 0; i < dstLen; i++) {
    const center = (i + 0.5) / scale - 0.5;
    const start = Math.max(0, Math.ceil(center - support));
    const end = Math.min(srcLen - 1, Math.floor(center + support));
    const weights = [];
    let total = 0;
    for (let j = start; j <= end; j++) {
      const w = lanczos(scale < 1 ? (j - center) * scale : j - center);
      weights.push(w);
      total += w;
    }
    for (let k = 0; k < otherLen; k++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let j = start; j <= end; j++) {
        const w = weights[j - start] / total;
        const o = horizontal ? (k * sw + j) * 4 : (j * sw + k) * 4;
        const av = src[o + 3];
        a += av * w;
        r += src[o] * (av / 255) * w;
        g += src[o + 1] * (av / 255) * w;
        b += src[o + 2] * (av / 255) * w;
      }
      const oo = horizontal ? (k * outW + i) * 4 : (i * outW + k) * 4;
      const ac = Math.min(255, Math.max(0, a));
      const inv = ac > 0.5 ? 255 / ac : 0;
      out[oo] = Math.min(255, Math.max(0, Math.round(r * inv)));
      out[oo + 1] = Math.min(255, Math.max(0, Math.round(g * inv)));
      out[oo + 2] = Math.min(255, Math.max(0, Math.round(b * inv)));
      out[oo + 3] = Math.round(ac);
    }
  }
  return out;
}

function resize(img, dw, dh) {
  const tmp = pass(img.data, img.width, img.height, dw, dh, true);
  return { width: dw, height: dh, data: pass(tmp, dw, img.height, dw, dh, false) };
}

/** Aplatit sur un fond opaque : plus aucun pixel transparent en sortie. */
function flatten(img, bg) {
  const out = Buffer.alloc(img.width * img.height * 4);
  for (let i = 0; i < img.width * img.height; i++) {
    const a = img.data[i * 4 + 3] / 255;
    out[i * 4] = Math.round(img.data[i * 4] * a + bg[0] * (1 - a));
    out[i * 4 + 1] = Math.round(img.data[i * 4 + 1] * a + bg[1] * (1 - a));
    out[i * 4 + 2] = Math.round(img.data[i * 4 + 2] * a + bg[2] * (1 - a));
    out[i * 4 + 3] = 255;
  }
  return { width: img.width, height: img.height, data: out };
}

/* --- Classement des trois matières du symbole ---------------------------------- */

/**
 * Chaque pixel opaque appartient à l’une des trois matières du dessin :
 * 1 = chêne fumé (le « P »), 2 = lames crème, 3 = lame terre cuite.
 * Les trois classes sont nettement séparées dans la source (moyennes
 * #313132, #E8E1D6 et #C07046), le classement est donc sûr.
 */
function classify(img) {
  const { width: w, height: h, data: d } = img;
  const cls = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (d[i * 4 + 3] < 128) continue;
    const r = d[i * 4];
    const g = d[i * 4 + 1];
    const b = d[i * 4 + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    cls[i] = sat > 38 && r > g && lum < 190 ? 3 : lum < 95 ? 1 : 2;
  }
  return cls;
}

/** Rendu à aplats des trois matières, alpha d’origine conservé. */
function flatRender(img, cls, palette) {
  const out = Buffer.alloc(img.width * img.height * 4);
  for (let i = 0; i < img.width * img.height; i++) {
    const c = cls[i];
    if (!c) continue;
    const p = palette[c];
    out[i * 4] = p[0];
    out[i * 4 + 1] = p[1];
    out[i * 4 + 2] = p[2];
    out[i * 4 + 3] = img.data[i * 4 + 3];
  }
  return { width: img.width, height: img.height, data: out };
}

/**
 * Passe le chêne fumé en clair, en TRANSLATANT la luminance au lieu de
 * l’aplatir : les chants et le modelé du plateau sont conservés.
 * `fromX` limite l’opération au logotype et laisse le symbole intact.
 */
function lightenInk(img, light, fromX) {
  const { width: w, height: h, data: d } = img;
  const out = Buffer.from(d);
  for (let y = 0; y < h; y++) {
    for (let x = fromX; x < w; x++) {
      const i = y * w + x;
      if (!d[i * 4 + 3]) continue;
      const r = d[i * 4];
      const g = d[i * 4 + 1];
      const b = d[i * 4 + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if ((sat > 38 && r > g && lum < 190) || lum >= 95) continue;
      const k = lum / 49; // 49 = luminance moyenne de la classe graphite
      const gain = 0.72 + 0.28 * k;
      out[i * 4] = Math.min(255, Math.round(light[0] * gain));
      out[i * 4 + 1] = Math.min(255, Math.round(light[1] * gain));
      out[i * 4 + 2] = Math.min(255, Math.round(light[2] * gain));
    }
  }
  return { width: w, height: h, data: out };
}

/** Première colonne vide d’au moins `min` px : la césure symbole / logotype. */
function findSplit(img, box, min = 40) {
  const { width: w, data: d } = img;
  let run = 0;
  let start = -1;
  for (let x = box.x0; x <= box.x1; x++) {
    let filled = false;
    for (let y = box.y0; y <= box.y1 && !filled; y++) {
      if (d[(y * w + x) * 4 + 3] > 8) filled = true;
    }
    if (!filled) {
      if (run === 0) start = x;
      run++;
    } else {
      if (run >= min) return start;
      run = 0;
    }
  }
  throw new Error('césure symbole / logotype introuvable');
}

/* --- ICO ------------------------------------------------------------------------ */

/**
 * Écrit un ICO contenant des images DIB 32 bits (et non des PNG encapsulés) :
 * c’est la forme historique, comprise partout, et nos tuiles sont opaques
 * donc le masque AND est entièrement nul.
 */
function encodeIco(images) {
  const dibs = images.map(({ width, height, data }) => {
    const header = Buffer.alloc(40);
    header.writeUInt32LE(40, 0);
    header.writeInt32LE(width, 4);
    header.writeInt32LE(height * 2, 8); // XOR + masque AND
    header.writeUInt16LE(1, 12);
    header.writeUInt16LE(32, 14);
    const xor = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const s = ((height - 1 - y) * width + x) * 4; // DIB : bas vers le haut
        const o = (y * width + x) * 4;
        xor[o] = data[s + 2];
        xor[o + 1] = data[s + 1];
        xor[o + 2] = data[s];
        xor[o + 3] = data[s + 3];
      }
    }
    const maskRow = Math.ceil(width / 32) * 4;
    const mask = Buffer.alloc(maskRow * height);
    header.writeUInt32LE(xor.length + mask.length, 20);
    return { width, height, buf: Buffer.concat([header, xor, mask]) };
  });

  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(dibs.length, 4);

  let offset = 6 + dibs.length * 16;
  const entries = dibs.map((d) => {
    const e = Buffer.alloc(16);
    e[0] = d.width === 256 ? 0 : d.width;
    e[1] = d.height === 256 ? 0 : d.height;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(d.buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += d.buf.length;
    return e;
  });

  return Buffer.concat([dir, ...entries, ...dibs.map((d) => d.buf)]);
}

/* --- Production ----------------------------------------------------------------- */

function write(relPath, buf) {
  const file = join(ROOT, relPath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buf);
  console.log(`  ${relPath.padEnd(50)} ${String(buf.length).padStart(7)} o`);
}

const LOGO_HEIGHT = 128; // 2 × la plus grande utilisation (signature du pied, 64 px)

console.log('Logotype horizontal');
const logo = decodePng(join(ROOT, 'assets/brand/expert-parquet-logo.png'));
const logoBox = contentBox(logo);
const split = findSplit(logo, logoBox);
const logoWidth = Math.round((LOGO_HEIGHT * logoBox.width) / logoBox.height);

write(
  'assets/brand/expert-parquet-logo-on-light.png',
  encodePng(resize(crop(logo, logoBox), logoWidth, LOGO_HEIGHT))
);
write(
  'assets/brand/expert-parquet-logo-on-dark.png',
  encodePng(resize(crop(lightenInk(logo, INVERSE, split), logoBox), logoWidth, LOGO_HEIGHT))
);
console.log(`  (${logoWidth} × ${LOGO_HEIGHT}, césure du logotype à x=${split})`);

console.log('Favicons — déclinaison simplifiée à aplats sur tuile crème');
const mark = decodePng(join(ROOT, 'assets/brand/expert-parquet-mark.png'));
const markSquare = squareCrop(mark, 0.05);
const simplified = flatRender(markSquare, classify(markSquare), { 1: INK, 2: STONE, 3: TERRA });
const tile = (size) => flatten(resize(simplified, size, size), PAPER);

write('assets/icons/favicon-16x16.png', encodePng(tile(16)));
write('assets/icons/favicon-32x32.png', encodePng(tile(32)));
write('assets/icons/favicon.ico', encodeIco([tile(16), tile(32), tile(48)]));

console.log('Icône iOS — symbole complet, marge Apple');
write('assets/icons/apple-touch-icon.png', encodePng(flatten(resize(squareCrop(mark, 0.12), 180, 180), PAPER)));
