/* ══════════════════════════════════════════════════════════════════════════
   CHEQUEO DEL PÍXEL DE META

   Verifica que dispare lo que tiene que disparar SIN mandarle un solo evento
   real a Facebook: se define un `fbq` falso antes de que corra pixel.js, que
   anota las llamadas. Como el arranque oficial hace `if (f.fbq) return`, al
   encontrarlo ya definido nunca baja fbevents.js — y por las dudas, cualquier
   pedido a facebook.net se aborta y se reporta como falla.

       node tools/check-pixel.mjs
   ══════════════════════════════════════════════════════════════════════════ */
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const RAIZ   = path.resolve(import.meta.dirname, '..');
const sleep  = (ms) => new Promise((r) => setTimeout(r, ms));

let pass = 0, fail = 0;
const ok  = (n, x = '') => { pass++; console.log(`  OK   ${n}${x ? '  — ' + x : ''}`); };
const bad = (n, x = '') => { fail++; console.log(`  FAIL ${n}${x ? '  — ' + x : ''}`); };
const is  = (c, n, x) => (c ? ok(n, x) : bad(n, x));

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

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });

async function abrir(ruta, { gpc = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const aFacebook = [];
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    if (/facebook\.(net|com)/.test(r.url())) { aFacebook.push(r.url()); return r.abort(); }
    r.continue();
  });

  await page.evaluateOnNewDocument((gpc) => {
    if (gpc) Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true });
    window.__fbq = [];
    window.fbq = function () { window.__fbq.push([...arguments]); };
    /* que un click en un CTA no abra pestañas: preventDefault NO frena a los
       demás listeners, así que el de pixel.js corre igual */
    document.addEventListener('click', (e) => e.preventDefault(), true);
  }, gpc);

  await page.goto(BASE + ruta, { waitUntil: 'networkidle0' });
  await sleep(900);
  page.__fb = aFacebook;
  return page;
}

const llamadas = (p) => p.evaluate(() => window.__fbq || []);

/* ── 1. Home ──────────────────────────────────────────────────────────────── */
console.log('\n[1] Home');
{
  const page = await abrir('/index.html');
  const c = await llamadas(page);

  const init = c.find((x) => x[0] === 'init');
  is(!!init, 'dispara init');
  is(init?.[1] === '1656439432235723', 'con el ID del pixel "Lautaro Web Pixel"', init?.[1]);
  is(c.some((x) => x[0] === 'track' && x[1] === 'PageView'), 'dispara PageView');
  is(c.filter((x) => x[0] === 'track' && x[1] === 'PageView').length === 1,
     'PageView una sola vez, no duplicado');
  await page.close();
}

/* ── 2. Lead por WhatsApp ─────────────────────────────────────────────────── */
console.log('\n[2] Lead por WhatsApp');
{
  const page = await abrir('/index.html');
  const n = await page.$$eval('a[href*="wa.me"]', (a) => a.length);
  is(n >= 3, `encuentra los CTAs de WhatsApp de la home`, `${n} links`);

  await page.evaluate(() => document.querySelector('a[href*="wa.me"]').click());
  await sleep(250);
  const c = await llamadas(page);
  const lead = c.find((x) => x[0] === 'track' && x[1] === 'Lead');
  is(!!lead, 'un click en WhatsApp dispara Lead');
  is(/whatsapp/.test(lead?.[2]?.content_name || ''), 'con content_name que dice de dónde salió',
     lead?.[2]?.content_name);

  /* el CTA de un servicio: main.js le reescribe el href al vuelo, así que se
     prueba aparte del botón del header */
  const svc = await page.$$eval('a[href*="wa.me"]', (a) => a.length);
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('a[href*="wa.me"]')].pop(); t.click();
  });
  await sleep(250);
  const c2 = await llamadas(page);
  is(c2.filter((x) => x[0] === 'track' && x[1] === 'Lead').length === 2,
     'cada CTA distinto cuenta su propio Lead', `${c2.filter((x) => x[1] === 'Lead').length} leads / ${svc} CTAs`);
  await page.close();
}

/* ── 3. Lead por formulario ───────────────────────────────────────────────── */
console.log('\n[3] Lead por formulario');
{
  const page = await abrir('/index.html');
  await page.evaluate(() => document.dispatchEvent(new CustomEvent('lm:form-ok')));
  await sleep(250);
  const c = await llamadas(page);
  const lead = c.find((x) => x[0] === 'track' && x[1] === 'Lead');
  is(!!lead, 'el evento lm:form-ok dispara Lead');
  is(lead?.[2]?.content_name === 'formulario', 'identificado como "formulario"', lead?.[2]?.content_name);

  /* que main.js realmente lo despache y no sólo que pixel.js lo escuche */
  const despacha = await page.evaluate(async () => {
    const r = await fetch('/js/main.js').then((x) => x.text());
    return /lm:form-ok/.test(r);
  });
  is(despacha, 'main.js despacha lm:form-ok al enviarse bien el formulario');
  await page.close();
}

/* ── 4. Portfolio ─────────────────────────────────────────────────────────── */
console.log('\n[4] Portfolio');
{
  const page = await abrir('/portfolio/index.html');
  const c = await llamadas(page);
  is(c.some((x) => x[0] === 'init' && x[1] === '1656439432235723'), 'usa el MISMO pixel que la home');
  is(c.some((x) => x[0] === 'track' && x[1] === 'PageView'), 'dispara PageView');

  await page.evaluate(() => document.querySelector('a[href*="wa.me"]').click());
  await sleep(250);
  is((await llamadas(page)).some((x) => x[1] === 'Lead'), 'el CTA de WhatsApp también mide Lead');

  /* los 34 links a sitios de clientes NO son conversiones */
  await page.evaluate(() => document.querySelector('.pf-card').click());
  await sleep(250);
  const leads = (await llamadas(page)).filter((x) => x[1] === 'Lead').length;
  is(leads === 1, 'un click en una tarjeta del portfolio NO cuenta como Lead', `${leads} leads`);
  await page.close();
}

/* ── 5. Global Privacy Control ────────────────────────────────────────────── */
console.log('\n[5] Global Privacy Control');
{
  const page = await abrir('/index.html', { gpc: true });
  const c = await llamadas(page);
  is(c.length === 0, 'con GPC activo no dispara NADA', `${c.length} llamadas`);
  is(page.__fb.length === 0, 'y ni siquiera pide el script de Facebook');
  await page.close();
}

/* ── 6. Que no se haya escapado un pedido real ────────────────────────────── */
console.log('\n[6] Higiene');
{
  const page = await abrir('/index.html');
  await sleep(600);
  is(page.__fb.length === 0, 'el stub evitó que se bajara fbevents.js de verdad',
     page.__fb.join(', '));

  const ids = await page.evaluate(async () => {
    const res = await Promise.all(['/index.html', '/portfolio/index.html', '/js/pixel.js']
      .map((u) => fetch(u).then((r) => r.text())));
    return res.map((t) => (t.match(/1656439432235723/g) || []).length);
  });
  is(ids[0] === 0 && ids[1] === 0 && ids[2] === 1,
     'el ID está escrito UNA sola vez, en js/pixel.js',
     `index=${ids[0]} portfolio=${ids[1]} pixel.js=${ids[2]}`);
  await page.close();
}

await browser.close();
server.close();
console.log(`\n${pass} OK · ${fail} FAIL\n`);
process.exit(fail ? 1 : 0);
