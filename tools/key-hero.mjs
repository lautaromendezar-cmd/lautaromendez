/* ══════════════════════════════════════════════════════════════════════════
   Convierte las generaciones de Nano Banana Pro en las capas del hero.

   El modelo devolvió PNG de 3 canales con el damero de transparencia PINTADO
   encima en vez de un canal alpha real. Este script lo recorta de verdad:

   1. Marca como fondo los píxeles neutros y claros (el damero es #FFF y #CCC;
      la ciudad es azul oscuro, así que no se pisan).
   2. Flood fill desde los bordes: sólo se borra el fondo CONECTADO al marco.
      Sin esto, cualquier ventana clara del interior del edificio se borraría.
   3. Come 2px de la silueta para matar el halo blanco del antialias.
   4. Suaviza el borde 1px para que no quede escalonado.

   Uso: node tools/key-hero.mjs generaciones assets/hero
   ══════════════════════════════════════════════════════════════════════════ */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [SRC = 'generaciones', OUT = 'assets/hero'] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });

const ANCHO = 2400;          // suficiente para 1920 CSS con el inset de -6%
const NEUTRO = 14;           // tolerancia R≈G≈B
const CLARO  = 168;          // el damero más oscuro ronda 204

/* ── Saca el damero y devuelve un buffer RGBA ───────────────────────────── */
async function recortar(file) {
  const { data, info } = await sharp(file)
    .resize(ANCHO, null, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h } = info;
  const N = w * h;
  const esFondo = new Uint8Array(N);

  for (let i = 0; i < N; i++) {
    const p = i * 4;
    const r = data[p], g = data[p + 1], b = data[p + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max - min <= NEUTRO && min >= CLARO) esFondo[i] = 1;
  }

  /* flood fill desde el marco: sólo lo conectado al borde es fondo */
  const fuera = new Uint8Array(N);
  const pila = [];
  const empujar = (i) => { if (esFondo[i] && !fuera[i]) { fuera[i] = 1; pila.push(i); } };
  for (let x = 0; x < w; x++) { empujar(x); empujar((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { empujar(y * w); empujar(y * w + w - 1); }

  while (pila.length) {
    const i = pila.pop();
    const x = i % w, y = (i / w) | 0;
    if (x > 0)     empujar(i - 1);
    if (x < w - 1) empujar(i + 1);
    if (y > 0)     empujar(i - w);
    if (y < h - 1) empujar(i + w);
  }

  /* dilatar el fondo 2px = comerle 2px a la silueta, que es donde vive el
     halo claro del antialias contra el damero */
  let actual = fuera;
  for (let paso = 0; paso < 2; paso++) {
    const sig = actual.slice();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (actual[i]) continue;
        if ((x > 0 && actual[i - 1]) || (x < w - 1 && actual[i + 1]) ||
            (y > 0 && actual[i - w]) || (y < h - 1 && actual[i + w])) sig[i] = 1;
      }
    }
    actual = sig;
  }

  let vacios = 0;
  for (let i = 0; i < N; i++) {
    if (actual[i]) { data[i * 4 + 3] = 0; vacios++; }
  }

  return { data: Buffer.from(data), w, h, pct: (vacios / N) * 100 };
}

/* ── Capas 2 y 3: recortadas, a WebP con alpha ──────────────────────────── */
const recortes = {};
for (const [src, dst] of [['prompt-2.png', '02-city.webp'], ['prompt-3.png', '03-front.webp']]) {
  const r = await recortar(join(SRC, src));
  recortes[dst] = r;
  await sharp(r.data, { raw: { width: r.w, height: r.h, channels: 4 } })
    /* 1px de desenfoque SOLO sobre el borde ya recortado: quita el escalón
       del flood fill sin ablandar la imagen (el blur va antes del webp) */
    .blur(.4)
    .webp({ quality: 82, alphaQuality: 92, effort: 6 })
    .toFile(join(OUT, dst));
  console.log(`${dst.padEnd(16)} ${r.pct.toFixed(1)}% transparente`);
}

/* ── Capa 1: la base ─────────────────────────────────────────────────────
   La maestra tiene la ciudad Y el Obelisco. La capa 02 tiene lo mismo
   recortado y encima. Cuando el parallax las separa, el Obelisco de arriba
   se corre y aparece el de atrás: imagen doble, y en un elemento fino,
   brillante y de alto contraste eso canta muchísimo.

   Arreglo: dentro de la silueta de la ciudad, la base va DESENFOCADA. Ahí
   nunca se ve nada mientras las capas están alineadas, y cuando se separan
   lo que asoma es una mancha suave que se lee como resplandor, no como una
   copia mal puesta. El cielo, que sí se ve siempre, queda intacto y nítido.

   El radio del blur tiene que superar el desfasaje máximo entre las capas
   (data-depth 26 − 8 = 18px), si no el duplicado sigue siendo reconocible.
   ─────────────────────────────────────────────────────────────────────── */
const { w, h, data: cityRGBA } = recortes['02-city.webp'];

const nitida = await sharp(join(SRC, 'prompt-1.png'))
  .resize(ANCHO, null, { fit: 'inside' }).removeAlpha().toColourspace('srgb')
  .raw().toBuffer();

/* La máscara NO puede ser la silueta exacta. El modelo redibujó levemente el
   Obelisco al generar el recorte, así que el de la maestra queda unos píxeles
   corrido: el filo que sobresale de la silueta se salva del desenfoque y es
   justo el que se ve como Obelisco doble, incluso con las capas alineadas.

   Por eso la silueta se engorda bien más allá del desfasaje del parallax y
   después se le suaviza el borde, para que el paso de desenfocado a nítido
   sea un degradé y no un escalón. Lo que se pierde es nitidez en unos pocos
   píxeles de cielo pegados a los edificios, que son nubes lisas: no se nota. */
const cruda = Buffer.alloc(w * h);
for (let i = 0; i < w * h; i++) cruda[i] = cityRGBA[i * 4 + 3];

/* `toColourspace('b-w')` no es decorativo: sharp.blur() sobre un raw de 1
   canal devuelve 3, y sin esto la máscara termina leyendo RGB entrelazado. */
const gris = (buf) => sharp(buf, { raw: { width: w, height: h, channels: 1 } })
  .toColourspace('b-w');

const esparcida = await gris(cruda).blur(18).toColourspace('b-w').raw().toBuffer();
const engordada = Buffer.alloc(w * h);
for (let i = 0; i < w * h; i++) engordada[i] = esparcida[i] > 6 ? 255 : 0;

const mascara = await gris(engordada).blur(7).toColourspace('b-w').raw().toBuffer();

const borroso = await sharp(nitida, { raw: { width: w, height: h, channels: 3 } })
  .blur(26).raw().toBuffer();

const relleno = Buffer.alloc(w * h * 4);
for (let i = 0; i < w * h; i++) {
  relleno[i * 4]     = borroso[i * 3];
  relleno[i * 4 + 1] = borroso[i * 3 + 1];
  relleno[i * 4 + 2] = borroso[i * 3 + 2];
  relleno[i * 4 + 3] = mascara[i];
}

await sharp(nitida, { raw: { width: w, height: h, channels: 3 } })
  .composite([{ input: relleno, raw: { width: w, height: h, channels: 4 } }])
  .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' })
  .toFile(join(OUT, '01-base.jpg'));
console.log('01-base.jpg      cielo nítido + ciudad desenfocada por detrás');
