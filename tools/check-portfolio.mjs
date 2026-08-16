/* ══════════════════════════════════════════════════════════════════════════
   CHEQUEO DEL PORTFOLIO

   Lo mismo que tools/check.mjs pero para /portfolio: verifica lo que NO se ve
   mirando la pantalla. Se sirve por HTTP y no por file:// a propósito — con
   file:// las capturas son origen opaco, texImage2D tira SecurityError y el
   shader no se podría probar nunca.

       npm i puppeteer-core
       node tools/check-portfolio.mjs
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

/* ── servidor mínimo sobre la carpeta del proyecto ─────────────────────── */
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
const URL_PF = `${BASE}/portfolio/index.html`;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--hide-scrollbars', '--use-gl=swiftshader', '--enable-unsafe-swiftshader']
});

async function open(w = 1440, h = 900, opts = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  if (opts.rm) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  if (opts.sinGsap) {
    await page.setRequestInterception(true);
    page.on('request', (r) => (/gsap|opentype/.test(r.url()) ? r.abort() : r.continue()));
  }
  await page.goto(URL_PF, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  page.__errs = errs;
  return page;
}

/* ── 1. Se arma sin errores ───────────────────────────────────────────── */
console.log('\n[1] Armado');
{
  const page = await open();
  await sleep(900);
  is(page.__errs.length === 0, 'sin errores de consola', page.__errs[0] || '');

  const n = await page.$$eval('.pf-card', (e) => e.length);
  is(n === 34, 'la grilla tiene 34 tarjetas', `hay ${n}`);

  /* Hay que recorrer la página: las capturas van con loading="lazy" y las de
     abajo del pliegue todavía no empezaron a bajar. Medir sin scrollear daba
     16 "rotas" que en realidad ni se habían pedido. */
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    /* esperar a que TODAS terminen antes de volver arriba: si se sube de
       golpe, el navegador despriorriza las de abajo y quedan a medio bajar */
    await Promise.all([...document.querySelectorAll('.pf-card__img')].map((i) =>
      i.complete ? null : new Promise((r) => {
        i.addEventListener('load', r, { once: true });
        i.addEventListener('error', r, { once: true });
      })));
    window.scrollTo(0, 0);
  });
  await sleep(400);
  const rotas = await page.$$eval('.pf-card__img', (imgs) =>
    imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src')));
  is(rotas.length === 0, 'las 34 capturas cargan', rotas.join(', '));

  const cont = await page.$eval('#pfN', (e) => e.textContent.trim());
  const rub  = await page.$eval('#pfR', (e) => e.textContent.trim());
  is(cont === '34', 'el contador del hero dice 34', `dice ${cont}`);
  is(rub === '8', 'el contador de rubros dice 8', `dice ${rub}`);
  await page.close();
}

/* ── 2. Filtros ───────────────────────────────────────────────────────── */
console.log('\n[2] Filtros');
{
  const page = await open();
  await sleep(700);

  const btns = await page.$$eval('.pf-f', (b) => b.map((x) => x.dataset.cat));
  is(btns.length === 9, 'hay 9 botones (todos + 8 rubros)', `hay ${btns.length}`);
  is(btns[0] === 'all' && await page.$eval('.pf-f', (b) => b.getAttribute('aria-pressed')) === 'true',
     '"Todos" arranca activo');

  const suma = await page.$$eval('.pf-f__n', (n) => n.map((x) => +x.textContent));
  is(suma[0] === suma.slice(1).reduce((a, b) => a + b, 0),
     'las cuentas de los rubros suman el total', `${suma[0]} vs ${suma.slice(1).reduce((a, b) => a + b, 0)}`);

  await page.click('.pf-f[data-cat="turismo"]');
  await sleep(500);
  const vis = await page.$$eval('.pf-card', (c) =>
    c.filter((x) => !x.hidden).map((x) => x.dataset.cat));
  const nTurismo = 5;   /* house in baires, luxor, uantu, tr3, ba city */
  is(vis.length === nTurismo && vis.every((c) => c === 'turismo'),
     'filtrar por turismo deja sólo turismo', `${vis.length} visibles`);
  is(await page.$eval('.pf-f[data-cat="turismo"]', (b) => b.getAttribute('aria-pressed')) === 'true',
     'el botón filtrado queda aria-pressed=true');

  await page.click('.pf-f[data-cat="all"]');
  await sleep(500);
  const todas = await page.$$eval('.pf-card', (c) => c.filter((x) => !x.hidden).length);
  is(todas === 34, 'volver a "Todos" muestra las 34', `${todas}`);
  await page.close();
}

/* ── 3. Titular con morph ─────────────────────────────────────────────── */
console.log('\n[3] Titular');
{
  const page = await open();
  await sleep(2200);

  const paths = await page.$$eval('#pfH1 path', (p) => p.length);
  is(paths === 16, 'se armaron los 16 paths de "Proyectos reales."', `hay ${paths}`);

  const plano = await page.$$eval('#pfH1 text', (t) =>
    t.every((x) => getComputedStyle(x).visibility === 'hidden' || +getComputedStyle(x).opacity === 0));
  is(plano, 'el texto plano se apagó recién después del morph');

  const rojos = await page.$$eval('#pfH1 path', (p) =>
    p.filter((x) => x.getAttribute('fill').toUpperCase().includes('FF2D46')).length);
  is(rojos === 1, 'sólo el punto final va en rojo', `${rojos} paths rojos`);

  const vb = await page.$eval('#pfH1', (s) => s.getAttribute('viewBox'));
  is(/^-?\d+ \d+ \d+ \d+$/.test(vb) && +vb.split(' ')[3] < 340,
     'el viewBox se recortó a la tinta real, sin aire muerto abajo', vb);

  /* El titular está dibujado a 150 unidades de cuerpo: el tamaño con el que
     se ve en pantalla es (ancho renderizado ÷ ancho del viewBox) × 150. Tiene
     que caer en la misma escala que el H1 de la home, que topea en 80px. */
  const cuerpo = await page.$eval('#pfH1', (s) =>
    s.getBoundingClientRect().width / +s.getAttribute('viewBox').split(' ')[2] * 150);
  is(cuerpo > 60 && cuerpo <= 82, 'el titular respeta la escala del H1 de la home',
     `se ve a ${cuerpo.toFixed(0)}px de cuerpo`);

  /* Con el titular en escala, la grilla tiene que asomar en un portátil. */
  const asoma = await page.evaluate(() =>
    document.querySelector('.pf-grid').getBoundingClientRect().top);
  is(asoma < 900, 'la grilla asoma en una pantalla de 1440×900', `arranca a ${Math.round(asoma)}px`);
  await page.close();
}

/* ── 4. Shader WebGL ──────────────────────────────────────────────────── */
console.log('\n[4] Shader de las capturas');
{
  const page = await open();
  await sleep(900);

  /* Hay que bajar hasta la grilla: con el hero arriba no hay ninguna tarjeta
     en pantalla y el observer no tiene por qué haber disparado. */
  await page.evaluate(() => document.querySelector('.pf-grid').scrollIntoView());
  await sleep(1400);

  const arriba = await page.$$eval('.pf-card__gl', (c) => c.length);
  is(arriba > 0, 'se instancia en las tarjetas a la vista', `${arriba} canvas`);
  is(arriba <= 12, 'no se instancia de más', `${arriba} canvas`);

  const foto = await page.$eval('.pf-card__img', (i) => getComputedStyle(i).visibility);
  is(foto === 'visible', 'la captura queda visible debajo del canvas (respaldo)');

  /* Recorrer la grilla entera contando contextos vivos: lo que se prueba es
     que la baja al salir de pantalla realmente ocurre. Sin eso las 34
     tarjetas dejarían 34 contextos y el navegador corta cerca de 16. */
  let pico = 0;
  for (let i = 0; i < 14; i++) {
    await page.evaluate(() => window.scrollBy(0, 420));
    await sleep(200);
    pico = Math.max(pico, await page.$$eval('.pf-card__gl', (c) => c.length));
  }
  /* El tope del código es 10. Se deja margen de uno por si la baja de un
     desalojo y la alta del que entra se cruzan en el mismo cuadro. */
  is(pico > 0 && pico <= 11, 'el tope de contextos WebGL se respeta al recorrer la grilla',
     `pico de ${pico} simultáneos sobre 34 tarjetas`);
  is(page.__errs.filter((e) => /context lost|context_lost/i.test(e)).length === 0,
     'ningún contexto se perdió por llegar al tope', page.__errs.find((e) => /context/i.test(e)) || '');
  await page.close();
}

/* ── 5. prefers-reduced-motion ────────────────────────────────────────── */
console.log('\n[5] prefers-reduced-motion');
{
  const page = await open(1440, 900, { rm: true });
  await sleep(900);

  const n = await page.$$eval('.pf-card', (c) => c.filter((x) => !x.hidden).length);
  is(n === 34, 'la grilla queda completa', `${n}`);

  const opacas = await page.$$eval('.pf-card', (c) =>
    c.every((x) => +getComputedStyle(x).opacity === 1));
  is(opacas, 'ninguna tarjeta queda invisible esperando una animación');

  is(await page.$$eval('.pf-card__gl', (c) => c.length) === 0, 'el shader no se instancia');
  is(await page.$$eval('#pfH1 path', (p) => p.length) === 0, 'el titular no se morphea');
  is(await page.$eval('#pfH1 text', (t) => getComputedStyle(t).visibility) === 'visible',
     'el titular queda como texto plano legible');
  is(await page.$eval('#pfN', (e) => e.textContent.trim()) === '34', 'el contador muestra el total sin animar');
  await page.close();
}

/* ── 6. Sin GSAP (CDN caído) ──────────────────────────────────────────── */
console.log('\n[6] Sin GSAP');
{
  const page = await open(1440, 900, { sinGsap: true });
  await sleep(600);

  const n = await page.$$eval('.pf-card', (c) => c.length);
  is(n === 34, 'la grilla se arma igual', `${n}`);

  const opacas = await page.$$eval('.pf-card', (c) =>
    c.every((x) => +getComputedStyle(x).opacity === 1));
  is(opacas, 'la página NO queda en negro esperando reveals');

  await page.click('.pf-f[data-cat="turismo"]');
  await sleep(500);
  const vis = await page.$$eval('.pf-card', (c) => c.filter((x) => !x.hidden).length);
  is(vis === 5, 'los filtros siguen andando sin GSAP', `${vis}`);
  await page.close();
}

/* ── 7. Conexión con la home ──────────────────────────────────────────── */
console.log('\n[7] Conexión con la home');
{
  const page = await open();
  const links = await page.evaluate(() => ({
    logo:   document.querySelector('.mark').getAttribute('href'),
    nav:    [...document.querySelectorAll('.hd__nav a')].map((a) => a.getAttribute('href')),
    pie:    [...document.querySelectorAll('.ft__nav a')].map((a) => a.getAttribute('href')),
    css:    [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.getAttribute('href'))
  }));
  is(links.logo === '../index.html', 'el logotipo vuelve al inicio', links.logo);
  is(links.nav.every((h) => h.startsWith('../index.html#')), 'la navegación apunta a la home', links.nav.join(' '));
  is(links.pie.includes('../index.html'), 'el pie tiene la vuelta al inicio');
  is(links.css.includes('../css/style.css'), 'usa la hoja de la home, no una copia');

  /* que los tokens lleguen de verdad, no sólo que el <link> esté */
  const tk = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return { signal: s.getPropertyValue('--signal').trim(), bone: s.getPropertyValue('--bone').trim() };
  });
  is(tk.signal === '#FF2D46' && tk.bone === '#EDEBE8', 'los tokens de la home están aplicados', JSON.stringify(tk));

  const fams = await page.evaluate(() =>
    [...new Set([...document.querySelectorAll('body *')]
      .map((e) => getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '')))]);
  is(!fams.some((f) => /Barlow/i.test(f)), 'no quedó nada en Barlow', fams.join(' · '));
  await page.close();
}

/* ── 8. Sin scroll horizontal ─────────────────────────────────────────── */
console.log('\n[8] Anchos');
{
  for (const w of [360, 390, 560, 768, 861, 1024, 1440, 1920]) {
    const page = await open(w, 900);
    await sleep(400);
    const d = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    is(d <= 0, `${w}px sin scroll horizontal`, d > 0 ? `se pasa ${d}px` : '');
    await page.close();
  }
}

/* ── 9. Teclado ───────────────────────────────────────────────────────── */
console.log('\n[9] Teclado');
{
  const page = await open();
  await sleep(600);
  await page.keyboard.press('Tab');
  const skip = await page.evaluate(() => document.activeElement.className);
  is(skip.includes('skip'), 'el primer tab da el link de saltar al contenido', skip);

  await page.evaluate(() => document.querySelector('.pf-f').focus());
  const out = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement);
    return { c: s.outlineColor, w: s.outlineWidth };
  });
  is(/255,\s*45,\s*70/.test(out.c) && parseFloat(out.w) >= 2, 'el foco tiene outline rojo', JSON.stringify(out));

  await page.evaluate(() => document.querySelector('.pf-card').focus());
  await sleep(600);   /* la transición del "ver sitio" dura 280ms */
  const go = await page.evaluate(() =>
    +getComputedStyle(document.querySelector('.pf-card .pf-card__go')).opacity);
  is(go === 1, 'con el teclado también aparece el "Ver sitio"', `opacidad ${go}`);
  await page.close();
}

/* ── cierre ───────────────────────────────────────────────────────────── */
await browser.close();
server.close();
console.log(`\n${pass} OK · ${fail} FAIL\n`);
process.exit(fail ? 1 : 0);
