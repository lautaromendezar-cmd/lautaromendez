/* ══════════════════════════════════════════════════════════════════════════
   CHEQUEO DEL ORIGEN DEL LEAD (js/origen.js)

   Que el mensaje de WhatsApp salga con "(ref: …)" según de dónde llegó la
   visita, en los links y en el formulario, sin duplicarse y sin romper el
   texto. Ningún click abre nada: se frena la navegación y se lee el href.

       node tools/check-origen.mjs
   ══════════════════════════════════════════════════════════════════════════ */
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RAIZ   = path.resolve(import.meta.dirname, '..');

let pass = 0, fail = 0;
const is = (c, n, x = '') => {
  c ? pass++ : fail++;
  console.log(`  ${c ? 'OK  ' : 'FAIL'} ${n}${x ? '  — ' + x : ''}`);
};

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
               '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(RAIZ, p);
  if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404); return res.end('no');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });

async function abrir(ctx, ruta, referer) {
  const page = await ctx.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setRequestInterception(true);
  page.on('request', (r) => (/facebook\.|_vercel\/insights/.test(r.url()) ? r.abort() : r.continue()));
  /* Un referrer https no pasa a este servidor http (downgrade): Chrome lo
     tira. Se simula document.referrer, que es lo único que lee origen.js. */
  await page.evaluateOnNewDocument((ref) => {
    if (ref) Object.defineProperty(document, 'referrer', { get: () => ref });
    window.fbq = () => {};
    document.addEventListener('click', (e) => e.preventDefault(), true);
    window.__abiertas = [];
    window.open = (u) => { window.__abiertas.push(u); return {}; };
    sessionStorage.setItem('lm_pre', '1');            // sin preloader
  }, referer || '');
  await page.goto(BASE + ruta, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.lmConOrigen === 'function');
  return page;
}

/* toca el primer link de WhatsApp y devuelve el texto que mandaría */
const tocar = (page, sel = 'a[href*="wa.me"]') => page.evaluate((sel) => {
  const a = document.querySelector(sel);
  a.click();
  return { href: a.href, texto: new URL(a.href).searchParams.get('text') };
}, sel);

const ctx = await browser.createBrowserContext();

console.log('\nHome con utm_source');
let p = await abrir(ctx, '/?utm_source=fosque&utm_medium=credito');
let r = await tocar(p);
is(r.texto.endsWith('\n\n(ref: fosque)'), 'el mensaje termina con (ref: fosque)', JSON.stringify(r.texto));
is(r.texto.startsWith('Hola Lautaro, te escribo desde la web.'), 'el saludo original sigue intacto');
is(!r.href.includes('+'), 'los espacios van como %20, no como +');
r = await tocar(p);
is((r.texto.match(/\(ref:/g) || []).length === 1, 'tocar dos veces no duplica la marca');

console.log('\nFormulario');
await p.evaluate(() => {
  document.querySelector('#f-svc').selectedIndex = 1;
  document.querySelector('#f-name').value = 'Prueba';
  document.querySelector('#f-mail').value = '1122334455';
  document.querySelector('#f-msg').value = 'Necesito una web';
  document.querySelector('#form').requestSubmit();
});
const abiertas = await p.evaluate(() => window.__abiertas);
const delForm = abiertas[0] ? new URL(abiertas[0]).searchParams.get('text') : '';
is(delForm.includes('Necesito una web') && delForm.endsWith('(ref: fosque)'),
   'el formulario también lleva la marca', JSON.stringify(delForm));
await p.close();

console.log('\nVuelve días después tipeando la URL');
p = await abrir(ctx, '/');
r = await tocar(p);
is(r.texto.endsWith('(ref: fosque)'), 'se acuerda del origen anterior');
await p.close();

console.log('\nPortfolio desde Google');
p = await abrir(ctx, '/portfolio/', 'https://www.google.com/');
r = await tocar(p);
is(r.texto.startsWith('Hola Lautaro, vi tu portfolio'), 'conserva el texto del portfolio');
is(r.texto.endsWith('(ref: google)'), 'un origen nuevo pisa al viejo', JSON.stringify(r.texto));
await p.close();

console.log('\nDesde el sitio de un cliente, sin UTM');
p = await abrir(ctx, '/portfolio/', 'https://www.batatastudio.com.ar/');
r = await tocar(p);
is(r.texto.endsWith('(ref: batatastudio.com.ar)'), 'usa el dominio del referrer sin www', JSON.stringify(r.texto));
await p.close();
await ctx.close();

console.log('\nVisita nueva sin ningún dato');
const limpio = await browser.createBrowserContext();
p = await abrir(limpio, '/');
r = await tocar(p);
is(!r.texto.includes('(ref:'), 'sin origen no agrega nada', JSON.stringify(r.texto));
await limpio.close();

await browser.close();
server.close();
console.log(`\n${pass} OK · ${fail} FAIL\n`);
process.exit(fail ? 1 : 0);
