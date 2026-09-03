/* ══════════════════════════════════════════════════════════════════════════
   CAPTURA PARA LA GRILLA DEL PORTFOLIO

   Abre una URL en Chrome y guarda la captura en portfolio/trabajos/ con el
   mismo formato que las que ya están: webp, 1600×900, desde el borde de
   arriba del sitio. La tarjeta recorta con object-position: 50% 4%, así que
   lo que importa es el encabezado, no el fold entero.

       npm i puppeteer-core sharp
       node tools/cap-portfolio.mjs https://sitio.com/ port-nombre.webp [espera_ms]

   Espera a networkidle0 y después un par de segundos más: casi todos estos
   sitios entran con animación y sin esa pausa se captura la pantalla a mitad
   del reveal (o directamente en negro, si el CSS oculta hasta que el JS
   revela).

   Esos 3,5 s alcanzan para casi todos, pero no para los que abren con una
   intro larga: Fosque tarda unos 15 s en terminar de armar el encabezado y
   sin el tercer argumento se capturaba el titular solo, sin logotipo ni menú.
   Si la captura sale a medias, subí la espera antes de dar por perdido el
   sitio.
   ══════════════════════════════════════════════════════════════════════════ */
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RAIZ   = path.resolve(import.meta.dirname, '..');
const sleep  = (ms) => new Promise((r) => setTimeout(r, ms));

const [url, nombre, espera] = process.argv.slice(2);
const PAUSA = Number(espera) || 3500;
if (!url || !nombre) {
  console.error('uso: node tools/cap-portfolio.mjs <url> <port-nombre.webp>');
  process.exit(1);
}

const destino = path.join(RAIZ, 'portfolio', 'trabajos', nombre);

/* Se captura al doble (3200×1800) y se baja a 1600×900: el sitio se dibuja
   como en una pantalla retina y el texto chico de la captura no queda sucio. */
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--hide-scrollbars', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
});

const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });

const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

const res = await page.goto(url, { waitUntil: 'networkidle0', timeout: 90_000 });
console.log(`  ${res.status()}  ${res.url()}`);
if (!res.ok()) { console.error('  la página no respondió 200'); process.exit(1); }

await page.evaluate(() => document.fonts.ready);
await sleep(PAUSA);

const png = await page.screenshot({ type: 'png' });
await sharp(png).resize(1600, 900).webp({ quality: 82 }).toFile(destino);

const kb = (fs.statSync(destino).size / 1024).toFixed(0);
console.log(`  ${path.relative(RAIZ, destino)}  ${kb} KB`);
if (errs.length) console.log('  errores de la página:', errs.join(' | '));

await browser.close();
