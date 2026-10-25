// Prueba js/ga.js sin mandar datos reales: sirve los archivos locales bajo el
// dominio de producción y aborta los hits a Google, registrándolos.
import puppeteer from 'puppeteer-core';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RAIZ = path.resolve(import.meta.dirname, '..');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
let ok = 0, mal = 0;
const check = (c, m) => { c ? ok++ : mal++; console.log((c ? 'OK   ' : 'FAIL ') + m); };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
for (const ruta of ['/', '/portfolio/']) {
  const page = await browser.newPage();
  const hits = [], lib = [];
  await page.setRequestInterception(true);
  page.on('request', async (r) => {
    const u = new URL(r.url());
    if (u.hostname.endsWith('google-analytics.com') && u.pathname.includes('collect')) {
      hits.push(u.searchParams.get('en') + ' ' + (r.postData() || '')); return r.abort();
    }
    if (u.hostname === 'www.googletagmanager.com') lib.push(Date.now());
    if (u.hostname.includes('facebook')) return r.abort();
    if (u.hostname === 'lautaromendez.com.ar') {
      let p = u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname;
      const ext = path.extname(p);
      if (TIPOS[ext]) {
        try { return r.respond({ status: 200, contentType: TIPOS[ext], body: await readFile(path.join(RAIZ, p)) }); }
        catch { /* sigue a producción */ }
      }
    }
    r.continue();
  });
  const t0 = Date.now();
  await page.goto('https://lautaromendez.com.ar' + ruta, { waitUntil: 'domcontentloaded' });
  await new Promise((s) => setTimeout(s, 800));
  check(lib.length === 0, `${ruta} gtag.js no baja antes de interactuar ni del load+3,5 s`);
  check(await page.evaluate(() => typeof gtag === 'function' && dataLayer.length >= 2), `${ruta} gtag encola desde el arranque`);
  await page.evaluate(() => {
    const a = document.querySelector('a[href*="wa.me"]');
    a.addEventListener('click', (e) => e.preventDefault(), { once: true });
    a.click();
  });
  await page.mouse.move(10, 10); await page.mouse.down(); await page.mouse.up();
  await new Promise((s) => setTimeout(s, 4000));
  check(lib.length > 0, `${ruta} gtag.js baja con la primera interacción`);
  // GA4 agrupa los eventos que siguen al page_view y los manda unos segundos después
  await new Promise((s) => setTimeout(s, 8000));
  await page.goto('about:blank');
  const todo = hits.join('\n');
  console.log('   hits:', todo.replace(/\s+/g, ' ').slice(0, 300));
  check(/page_view/.test(todo), `${ruta} sale page_view`);
  check(/whatsapp_click/.test(todo), `${ruta} sale whatsapp_click (en cola desde antes de la librería)`);
  await page.close();
}
// En otro host no carga nada
const page = await browser.newPage();
await page.goto('about:blank');
check(await page.evaluate(async (src) => { eval(src); return typeof window.gtag; }, await readFile(path.join(RAIZ, 'js/ga.js'), 'utf8')) === 'undefined', 'fuera de lautaromendez.com.ar no define gtag');
await browser.close();
console.log(`\n${ok} OK · ${mal} FAIL`);
process.exit(mal ? 1 : 0);
