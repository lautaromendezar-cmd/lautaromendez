/* ══════════════════════════════════════════════════════════════════════════
   Convierte una obra en la trama de puntos del footer.

   La cuenta se hace ACÁ y no en el navegador por dos razones:

   1. Leer píxeles de una imagen con canvas desde file:// tira SecurityError
      (el canvas queda "tainted"). El sitio se abre desde el disco, así que
      muestrear en runtime directamente no es una opción.
   2. Así el navegador no decodifica ni recorre ninguna imagen: recibe la
      grilla ya masticada y sólo dibuja.

   Salida: assets/arte.js, que define window.ARTE con la grilla como un string
   de un carácter por celda (16 niveles de tinta, 0-f).

   Uso: node tools/gen-arte.mjs <imagen> [columnas]
   ══════════════════════════════════════════════════════════════════════════ */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const SRC  = process.argv[2];
const COLS = Number(process.argv[3]) || 108;
/* Recorte OPCIONAL. Por defecto se usa la imagen entera, así que una obra
   nueva funciona sin medir nada. Se pasa por variable de entorno cuando el
   escaneo trae cosas que sobran:
     CROP=100,268,1074,992 node tools/gen-arte.mjs vitruvio.jpg 108 --ver
   (ese es el del Vitruvio: el pliego trae texto manuscrito arriba y abajo y
   sólo queremos la figura con su círculo y su cuadrado). */
const CROP = process.env.CROP
  ? (([l, t, w, h]) => ({ left: l, top: t, width: w, height: h }))
      (process.env.CROP.split(',').map(Number))
  : null;

const ALFABETO = '0123456789abcdef';

/* Umbral y gamma afinables por CLI: dependen del escaneo y se ajustan
   mirando --ver, no adivinando. */
const CORTE = Number(process.env.CORTE) || 0.80;
const GAMMA = Number(process.env.GAMMA) || 0.70;

/* ── Corrección local de fondo ─────────────────────────────────────────────
   Un umbral global NO sirve acá: el pliego tiene 500 años, viñeteado y
   manchas, así que el "papel" es más oscuro en unas zonas que el trazo en
   otras. Recortando por un solo valor se perdía el dibujo en las partes
   claras y entraban las manchas de las oscuras.

   La solución es un pasa-altos: al original se le resta su propia versión muy
   desenfocada, que es una estimación del fondo. Lo que sobrevive es lo que
   difiere de su entorno inmediato — o sea las líneas, y sólo las líneas. */
const base = (CROP ? sharp(SRC).extract(CROP) : sharp(SRC)).greyscale();

const detalle = await base.clone()
  .resize(COLS, null, { fit: 'inside', kernel: 'lanczos3' })
  .raw().toBuffer({ resolveWithObject: true });

const fondo = await base.clone()
  .blur(18)                     // ~5x el grosor del trazo: se come las líneas
  .resize(COLS, null, { fit: 'inside', kernel: 'lanczos3' })
  .raw().toBuffer();

const { data, info } = detalle;
const { width: w, height: h } = info;

/* Dos maneras de leer una obra, según qué sea:

   linea (por defecto) — pasa-altos. Sirve para DIBUJOS: lo que sobrevive es
     lo que difiere de su entorno, o sea el trazo. Con una pintura devolvería
     un mapa de bordes y se perdería el claroscuro.

   luz — luminancia SIN invertir. Sirve para PINTURAS claras sobre un sitio
     oscuro: los puntos caen donde hay luz, así que las figuras emergen
     iluminadas sobre el fondo. Con 'tono' pasaba lo contrario —los puntos
     caían en las sombras— y el fresco se leía en negativo.

   tono — luminancia invertida. Para obras oscuras sobre fondo claro. */
const MODO = process.env.MODO || 'linea';

const tinta =
  MODO === 'luz'  ? Array.from(data, (g) => g / 255) :
  MODO === 'tono' ? Array.from(data, (g) => 1 - g / 255) :
  /* linea */       Array.from(data, (g, i) => Math.max(0, (fondo[i] - g) / 255));
/* CORTE es un PERCENTIL, no una fracción del máximo. Con la fracción, el
   resultado dependía de cuán oscuro fuera el píxel más oscuro de la obra: el
   dibujo del Vitruvio daba 19% de celdas con tinta y el fresco daba 100% con
   el mismo número. Como percentil, 0.80 deja ~20% en cualquier obra. */
const ordenado = [...tinta].sort((a, b) => a - b);
const papel = ordenado[Math.floor(ordenado.length * CORTE)];
const crudo = tinta.map((v) => Math.max(0, v - papel));

/* El techo sale de un percentil alto y no del máximo: cuatro píxeles muy
   oscuros —una mancha, el borde del pliego— comprimían todo el resto contra
   el piso y el dibujo salía apagadísimo aunque estuviera bien detectado. */
const positivos = crudo.filter((v) => v > 0).sort((a, b) => a - b);
const max = positivos[Math.floor(positivos.length * 0.985)] || 1;
let celdas = '';
let conTinta = 0;
for (let i = 0; i < crudo.length; i++) {
  const n = Math.pow(crudo[i] / max, GAMMA);
  const q = Math.max(0, Math.min(15, Math.round(n * 15)));
  if (q > 0) conTinta++;
  celdas += ALFABETO[q];
}

writeFileSync('assets/arte.js',
`/* Generado por tools/gen-arte.mjs — no editar a mano.
   Hombre de Vitruvio, Leonardo da Vinci, c.1490. Dominio público.
   Un carácter por celda, 16 niveles de tinta (0 = papel, f = trazo pleno). */
window.ARTE = {
  cols: ${w},
  rows: ${h},
  celdas: '${celdas}'
};
`, 'utf8');

console.log(`grilla ${w}×${h} = ${w * h} celdas`);
console.log(`con tinta: ${conTinta} (${(conTinta / (w * h) * 100).toFixed(1)}%)`);
console.log(`assets/arte.js — ${(celdas.length / 1024).toFixed(1)} KB de datos`);

/* ── Verificación: se vuelve a dibujar la grilla como imagen ──────────────
   Mirar el JSON no dice nada; esto sí muestra si la figura se reconoce. */
if (process.argv.includes('--ver')) {
  const ESC = 6;
  const lienzo = Buffer.alloc(w * ESC * h * ESC * 3, 10);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const q = ALFABETO.indexOf(celdas[y * w + x]);
      if (!q) continue;
      const r = Math.max(1, Math.round((q / 15) * ESC * .9));
      const off = Math.floor((ESC - r) / 2);
      const v = 40 + Math.round((q / 15) * 215);
      for (let dy = 0; dy < r; dy++) {
        for (let dx = 0; dx < r; dx++) {
          const px = ((y * ESC + off + dy) * w * ESC + (x * ESC + off + dx)) * 3;
          lienzo[px] = lienzo[px + 1] = lienzo[px + 2] = v;
        }
      }
    }
  }
  await sharp(lienzo, { raw: { width: w * ESC, height: h * ESC, channels: 3 } })
    .jpeg({ quality: 90 }).toFile('tools/_verificacion-arte.jpg');
  console.log('verificación escrita en tools/_verificacion-arte.jpg');
}
