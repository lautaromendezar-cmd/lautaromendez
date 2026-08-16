import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import fs from 'node:fs/promises';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'file:///C:/Users/Lautaro/Desktop/Claude/lautaromendezv3/index.html';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const ok  = (n, extra = '') => { pass++; console.log(`  OK   ${n}${extra ? '  — ' + extra : ''}`); };
const bad = (n, extra = '') => { fail++; console.log(`  FAIL ${n}${extra ? '  — ' + extra : ''}`); };
const is  = (cond, n, extra) => cond ? ok(n, extra) : bad(n, extra);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });

async function open(w = 1440, h = 900, opts = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  if (opts.rm) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  page.__errs = errs;
  return page;
}

/* ── 1. Preloader ─────────────────────────────────────────────────────── */
console.log('\n[1] Preloader');
{
  const page = await open();
  const alInicio = await page.$('#pre');
  is(!!alInicio, 'aparece en la primera visita');

  await sleep(2000);
  const sigue = await page.$('#pre');
  is(!sigue, 'se removió del DOM antes de los 2s');

  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(120);
  const enRecarga = await page.$('#pre');
  is(!enRecarga, 'NO reaparece en la segunda visita de la sesión (sessionStorage)');

  await sleep(2200);   // que la intro cierre del todo antes de medir
  const h1 = await page.evaluate(() =>
    [...document.querySelectorAll('.hero__h1 .ln > span')].map(s => {
      const m = getComputedStyle(s).transform;
      return m === 'none' ? 0 : Math.abs(parseFloat(m.split(',')[5]));
    }));
  is(h1.every(ty => ty < 1), 'el H1 queda en su lugar tras la intro',
     `desvío máx ${Math.max(...h1).toFixed(2)}px`);
  await page.close();
}

/* ── 2. prefers-reduced-motion ────────────────────────────────────────── */
console.log('\n[2] prefers-reduced-motion');
{
  const page = await open(1440, 900, { rm: true });
  await sleep(700);
  is(!(await page.$('#pre')), 'el preloader no existe');

  const r = await page.evaluate(() => {
    const vis = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { op: +cs.opacity, disp: cs.display, tr: cs.transform };
    };
    return {
      video: vis('#heroVideo'),
      brow: vis('.hero__brow'), sub: vis('.hero__sub'),
      acts: vis('.hero__acts'), meta: vis('.hero__meta'),
      linea: vis('.hero__h1 .ln > span'),
      h1txt: document.querySelector('.hero__h1').innerText.trim().length,
    };
  });
  is(r.video.disp === 'none', 'el video del hero no se dibuja');
  is([r.brow, r.sub, r.acts, r.meta].every(x => x.op === 1), 'hero completo y visible (opacity 1)');
  is(r.linea.tr === 'none', 'las líneas del H1 sin transform');
  is(r.h1txt > 20, 'el H1 tiene su texto', r.h1txt + ' caracteres');
  await page.close();
}

/* ── 2b. Video del hero: se carga sólo donde corresponde ──────────────── */
console.log('\n[2b] Video del hero');
{
  const estado = async (page) => {
    await sleep(3200);
    return page.evaluate(() => {
      const v = document.querySelector('#heroVideo');
      const img = document.querySelector('.hero__still');
      return {
        fuentes: v.querySelectorAll('source').length,
        andando: !v.paused && v.currentTime > 0,
        visible: v.classList.contains('is-on'),
        fija: img && img.complete && img.naturalWidth > 0,
        display: getComputedStyle(v).display,
      };
    });
  };

  const esc = await open(1440, 900);
  const d = await estado(esc);
  is(d.fuentes === 2, 'en escritorio inyecta webm + mp4', `${d.fuentes} fuentes`);
  is(d.andando, 'el video está reproduciéndose');
  is(d.visible, 'se fundió encima de la imagen fija (clase is-on)');
  is(d.fija, 'la imagen fija cargó igual', 'es el LCP y el respaldo');
  await esc.close();

  const mob = await open(390, 844);
  const m = await estado(mob);
  is(m.fuentes === 0, 'en mobile NO se baja el video', `${m.fuentes} fuentes`);
  is(m.fija, 'en mobile queda la imagen fija');
  await mob.close();

  const rm = await open(1440, 900, { rm: true });
  const r = await estado(rm);
  is(r.fuentes === 0, 'con reduced-motion NO se baja el video', `${r.fuentes} fuentes`);
  is(r.display === 'none', 'y el elemento queda oculto por CSS', r.display);
  is(r.fija, 'con reduced-motion queda la imagen fija');
  await rm.close();
}

/* ── 3. CTA de servicio → select + WhatsApp ───────────────────────────── */
console.log('\n[3] CTA de servicios');
{
  const page = await open();
  await sleep(1800);
  const antes = await page.evaluate(() => document.querySelector('[data-wa]').href);

  await page.evaluate(() => document.querySelector('[data-servicio="a-medida"]').click());
  await sleep(200);

  const r = await page.evaluate(() => ({
    select: document.querySelector('#f-svc').value,
    was: [...document.querySelectorAll('[data-wa]')].map(a => a.href),
  }));
  is(r.select === 'a-medida', 'preselecciona el servicio en el <select>', r.select);
  is(r.was.length === 3 && r.was.every(h => decodeURIComponent(h).includes('un desarrollo a medida')),
     `reescribe el ?text= de los ${r.was.length} links de WhatsApp`);
  is(r.was[0] !== antes, 'el link cambió respecto del inicial');
  await page.close();
}

/* ── 3b. Slider de servicios ──────────────────────────────────────────── */
console.log('\n[3b] Slider de servicios');
{
  const page = await open(1440, 900);
  await sleep(2200);

  const enc = await page.evaluate(() =>
    document.querySelector('#svcStage').classList.contains('is-slider'));
  is(enc, 'en escritorio se enciende el modo pantalla completa');

  const st = await page.evaluate(() => {
    const t = ScrollTrigger.getAll().find(x => x.pin && x.trigger.id === 'svcStage');
    return t ? { start: Math.round(t.start), end: Math.round(t.end) } : null;
  });
  is(!!st, 'quedó pinneado', st ? `${st.start}→${st.end}px` : 'sin trigger');

  /* rueda de a poco, como una persona: el snap usa la velocidad */
  const rueda = async (destino) => {
    let y = await page.evaluate(() => window.scrollY);
    let vueltas = 0;
    while (Math.abs(destino - y) > 6 && vueltas++ < 400) {
      await page.mouse.wheel({ deltaY: Math.sign(destino - y) * Math.min(90, Math.abs(destino - y)) });
      await sleep(24);
      y = await page.evaluate(() => window.scrollY);
    }
    await sleep(1200);
  };
  await page.mouse.move(700, 450);

  const leer = () => page.evaluate(() => {
    const t = ScrollTrigger.getAll().find(x => x.pin && x.trigger.id === 'svcStage');
    return {
      prog: +t.progress.toFixed(2),
      yp: [...document.querySelectorAll('.panel__outer')].map(e => Math.round(gsap.getProperty(e, 'yPercent'))),
      activo: [...document.querySelectorAll('#svcNav button')]
        .findIndex(b => b.getAttribute('aria-current') === 'true'),
    };
  });

  const esperado = [[0, 100, 100], [-100, 0, 100], [-100, -100, 0]];
  const lum = [];
  for (let i = 0; i < 3; i++) {
    await rueda(st.start + (st.end - st.start) * (i / 2));
    const r = await leer();
    is(JSON.stringify(r.yp) === JSON.stringify(esperado[i]),
       `panel ${i + 1} llega entero`, `yPercent=[${r.yp}]`);
    is(r.activo === i, `el índice marca el panel ${i + 1}`, `activo=${r.activo}`);

    /* Luminancia media del panel. Es la forma honesta de comprobar que el
       fondo "cambia": mirarlo no alcanza, dos negros distintos se parecen. */
    const shot = await page.screenshot();
    const { data, info } = await sharp(shot).removeAlpha().resize(220).raw()
      .toBuffer({ resolveWithObject: true });
    let s = 0;
    for (let k = 0; k < data.length; k += 3) s += .2126 * data[k] + .7152 * data[k + 1] + .0722 * data[k + 2];
    lum.push(s / (info.width * info.height));
  }
  const saltos = lum.slice(1).map((l, i) => Math.abs(l - lum[i]));
  is(Math.min(...saltos) >= 8, 'el cambio de fondo entre paneles se percibe',
     `luminancias ${lum.map(l => l.toFixed(1)).join(' → ')} · saltos ${saltos.map(s => s.toFixed(1)).join(', ')}`);

  /* ── Títulos partidos y animados ─────────────────────────────────────── */
  const t = await page.evaluate(() => {
    const h = document.querySelector('.panel--a .panel__t');
    return { chars: h.querySelectorAll('.c').length, aria: h.getAttribute('aria-label'),
             oculto: h.querySelector('.w').getAttribute('aria-hidden') };
  });
  is(t.chars === 11, 'el título se parte en letras', `${t.chars} letras`);
  is(t.aria === 'Landing Page', 'el <h3> conserva el texto para lectores de pantalla', t.aria);
  is(t.oculto === 'true', 'las esquirlas van con aria-hidden (si no se deletrea)');

  await page.close();

  /* La entrada se mide en una pestaña LIMPIA, bajando por primera vez.
     `activar()` no repite si el índice no cambió —a propósito, para no
     reanimar cada vez que alguien pasa por encima— así que salir y volver no
     sirve para observarla: hay que verla la primera vez.
     Y se muestrea sin pausa de cortesía: la entrada dura ~1s y esperar a que
     asiente mediría siempre el estado final, que es el que no prueba nada. */
  const fresca = await open(1440, 900);
  await sleep(2200);
  await fresca.mouse.move(700, 450);

  const paso = [];
  for (let k = 0; k < 80; k++) {
    await fresca.mouse.wheel({ deltaY: 70 });
    paso.push(await fresca.evaluate(() => {
      const cs = document.querySelectorAll('.panel--a .panel__t .c');
      const u = cs[cs.length - 1];
      return { y: Math.round(gsap.getProperty(u, 'yPercent')), color: getComputedStyle(cs[0]).color };
    }));
    await sleep(26);
  }
  const yMax = Math.max(...paso.map((x) => x.y));
  is(yMax > 20, 'las letras entran desde abajo', `desplazamiento máx ${yMax}%`);

  const acento = paso.filter((x) => {
    const [r, g] = x.color.match(/\d+/g).map(Number);
    return r > 200 && g < 200;          // tirando a rojo, no a hueso
  });
  is(acento.length > 0, 'y pasan por el acento antes de asentarse',
     acento.length ? `${acento.length} muestras, ej ${acento[0].color}` : paso.slice(-1)[0].color);
  await fresca.close();

  const mob = await open(390, 844);
  await sleep(2000);
  const m = await mob.evaluate(() => {
    const st = document.querySelector('#svcStage');
    const p = [...document.querySelectorAll('.panel')];
    const tops = p.map(e => Math.round(e.getBoundingClientRect().top));
    return {
      slider: st.classList.contains('is-slider'),
      apilados: tops[0] < tops[1] && tops[1] < tops[2],
      pinned: ScrollTrigger.getAll().some(x => x.pin && x.trigger.id === 'svcStage'),
    };
  });
  is(!m.slider, 'en mobile NO se enciende el slider');
  is(!m.pinned, 'en mobile no queda nada pinneado');
  is(m.apilados, 'en mobile los tres paneles quedan apilados y legibles');
  await mob.close();
}

/* ── 4. Scramble ──────────────────────────────────────────────────────── */
console.log('\n[4] Franja scramble');
{
  const page = await open();
  await sleep(1800);
  const inicial = await page.evaluate(() => document.querySelector('#scramble').textContent);
  const antesDeScroll = await page.evaluate(() => document.querySelector('#scramble').textContent);
  is(inicial === antesDeScroll, 'no arranca al cargar la página', `"${inicial}"`);

  await page.evaluate(() => document.querySelector('.strip').scrollIntoView({ block: 'center' }));
  await sleep(1200);
  const durante = await page.evaluate(() => document.querySelector('#scramble').textContent);
  is(durante !== inicial, 'arranca al entrar en pantalla', `"${durante}"`);

  const mono = await page.evaluate(() =>
    getComputedStyle(document.querySelector('#scramble')).fontFamily);
  is(/JetBrains Mono/.test(mono), 'el elemento que se scramblea es monoespaciado');
  await page.close();
}

/* ── 5. Bento: zoom scrubbeado ─────────────────────────────────────────── */
console.log('\n[5] Zoom del bento');
{
  const page = await open(1440, 900);
  await sleep(2400);

  const enc = await page.evaluate(() =>
    document.querySelector('#workStage').classList.contains('is-zoom'));
  is(enc, 'en escritorio se enciende el zoom');

  const st = await page.evaluate(() => {
    const t = ScrollTrigger.getAll().find(x => x.pin && x.trigger.id === 'workStage');
    return t ? { start: Math.round(t.start), end: Math.round(t.end) } : null;
  });
  is(!!st, 'el escenario queda pinneado', st ? `${st.start}→${st.end}px` : 'sin trigger');

  const enP = async (f) => {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), st.start + (st.end - st.start) * f);
    await sleep(1400);
    return page.evaluate(() => {
      const h = document.querySelector('.tile--hero').getBoundingClientRect();
      return {
        escala: +gsap.getProperty('#bento', 'scale').toFixed(2),
        cubre: h.width >= window.innerWidth - 2 && h.height >= window.innerHeight - 2,
        cap: +getComputedStyle(document.querySelector('#workCap')).opacity,
        anillo: +getComputedStyle(document.querySelector('.tile:not(.tile--hero)')).opacity,
      };
    });
  };

  const centro = await page.evaluate(() => {
    const h = document.querySelector('.tile--hero');
    const todas = [...document.querySelectorAll('#bento .tile')];
    return { img: !!h.querySelector('img'), pos: todas.indexOf(h) + 1,
             n: h.querySelector('.card__n')?.textContent,
             link: h.getAttribute('href') };
  });
  is(!centro.img, 'la celda del centro NO es una captura de web');
  is(centro.pos === 5, 'y está en la posición 5, que es donde el zoom entra', `posición ${centro.pos}`);
  is(/portfolio/.test(centro.link), 'lleva al portfolio', centro.link);
  /* El contador de la celda 5 está escrito a mano en el HTML, pero la verdad
     la tiene el array de portfolio/portfolio.js. Se compara contra ese array y
     no contra un número fijo: así el día que se agregue un proyecto, es este
     chequeo el que avisa que hay que tocar el index — que es exactamente lo
     que pasó cuando la home decía 26 y el portfolio ya tenía 34. */
  const enPortfolio = (await fs.readFile('portfolio/portfolio.js', 'utf8'))
    .match(/^\s*\{ img: '/gm)?.length ?? 0;
  is(centro.n === String(enPortfolio),
     'el contador de la celda 5 coincide con el portfolio',
     `la home dice ${centro.n} y el portfolio tiene ${enPortfolio}`);

  const a = await enP(0), b2 = await enP(.5), c = await enP(1);
  is(a.escala === 1, 'arranca sin escalar', `escala ${a.escala}`);
  is(b2.escala > a.escala && c.escala > b2.escala, 'la grilla crece con el scroll',
     `${a.escala} → ${b2.escala} → ${c.escala}`);
  is(c.escala >= 3, 'el zoom llega lejos', `escala final ${c.escala}`);
  is(c.cubre, 'el panel del portfolio termina cubriendo la pantalla entera');
  is(a.cap < .05 && c.cap > .9, 'la invitación al portfolio aparece recién al final',
     `${a.cap} → ${c.cap}`);
  is(c.anillo < .05, 'las piezas del anillo se apagan', `opacidad ${c.anillo}`);

  /* expoScale: el crecimiento tiene que ser progresivo, no lineal. Con ease
     lineal la mitad estaría en (1+S)/2; acá tiene que estar bastante abajo. */
  const lineal = (1 + c.escala) / 2;
  is(b2.escala < lineal - .2, 'la curva es expoScale y no lineal',
     `a mitad ${b2.escala}, lineal daría ${lineal.toFixed(2)}`);
  await page.close();

  const mob = await open(390, 844);
  await sleep(2000);
  const m = await mob.evaluate(() => ({
    zoom: document.querySelector('#workStage').classList.contains('is-zoom'),
    pinned: ScrollTrigger.getAll().some(x => x.pin && x.trigger.id === 'workStage'),
    escala: gsap.getProperty('#bento', 'scale'),
    cols: getComputedStyle(document.querySelector('#bento')).gridTemplateColumns.split(' ').length,
  }));
  is(!m.zoom, 'en mobile NO se enciende el zoom');
  is(!m.pinned, 'en mobile no queda nada pinneado');
  is(m.escala === 1, 'y la grilla queda sin escalar', `escala ${m.escala}`);
  is(m.cols === 1, 'a 390px la grilla queda en 1 columna', `${m.cols} columnas`);
  await mob.close();

  /* la franja intermedia: 2 columnas entre 561 y 860 */
  const tab = await open(780, 900);
  await sleep(1800);
  const t2 = await tab.evaluate(() => ({
    cols: getComputedStyle(document.querySelector('#bento')).gridTemplateColumns.split(' ').length,
    zoom: document.querySelector('#workStage').classList.contains('is-zoom'),
  }));
  is(t2.cols === 2, 'a 780px la grilla queda en 2 columnas', `${t2.cols} columnas`);
  is(!t2.zoom, 'y a 780px tampoco se enciende el zoom');
  await tab.close();
}

/* ── 5b. Vitruvio del pie ──────────────────────────────────────────────── */
console.log('\n[5b] Trama del pie');
{
  const alPie = async (page) => {
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await sleep(2600);
  };
  const pintados = (page, rojo) => page.evaluate((soloRojo) => {
    const c = document.querySelector('#ftArt');
    const im = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < im.length; i += 4) {
      if (im[i + 3] < 8) continue;
      if (soloRojo) { if (im[i] > 150 && im[i + 1] < 110) n++; }
      else n++;
    }
    return n;
  }, rojo);

  const page = await open(1440, 900);
  await sleep(2200);
  const datos = await page.evaluate(() => window.ARTE
    ? { cols: window.ARTE.cols, rows: window.ARTE.rows, largo: window.ARTE.celdas.length } : null);
  is(!!datos, 'los datos de la obra cargan', datos ? `${datos.cols}×${datos.rows}` : 'sin window.ARTE');
  is(datos && datos.largo === datos.cols * datos.rows, 'la grilla está completa', `${datos?.largo} celdas`);

  await alPie(page);
  const quieto = await pintados(page, false);
  is(quieto > 5000, 'la trama se dibuja al llegar al pie', `${quieto} píxeles con tinta`);

  const rojoAntes = await pintados(page, true);
  const c = await page.evaluate(() => {
    const r = document.querySelector('#ftArt').getBoundingClientRect();
    return { x: Math.round(r.left + r.width * .5), y: Math.round(r.top + r.height * .45) };
  });
  await page.mouse.move(c.x, c.y);
  await sleep(700);
  const rojoDespues = await pintados(page, true);
  is(rojoAntes < 50, 'sin puntero no hay rojo', `${rojoAntes} px`);
  is(rojoDespues > 400, 'con el puntero encima se enciende el acento', `${rojoAntes} → ${rojoDespues} px`);

  /* el bucle no puede quedar corriendo cuando el pie no está a la vista */
  const fps = await page.evaluate(() => new Promise((ok) => {
    let n = 0; const t0 = performance.now();
    const f = () => { n++; performance.now() - t0 < 1000 ? requestAnimationFrame(f) : ok(n); };
    requestAnimationFrame(f);
  }));
  is(fps >= 50, 'el pie anima sin comerse los cuadros', `${fps} fps`);
  await page.close();

  const mob = await open(390, 844);
  await sleep(2000);
  await alPie(mob);
  const enMob = await pintados(mob, false);
  is(enMob > 1000, 'en mobile también se dibuja', `${enMob} píxeles`);
  await mob.close();

  const rm = await open(1440, 900, { rm: true });
  await sleep(1800);
  await alPie(rm);
  const enRm = await pintados(rm, false);
  is(enRm > 5000, 'con reduced-motion se dibuja entero y quieto', `${enRm} píxeles`);
  await rm.close();
}

/* ── 6. Header pegajoso ───────────────────────────────────────────────── */
console.log('\n[6] Header');
{
  const page = await open();
  await sleep(1600);
  const arriba = await page.evaluate(() => document.querySelector('.hd').classList.contains('is-stuck'));
  is(!arriba, 'arranca transparente');
  await page.evaluate(() => window.scrollTo(0, 300));
  await sleep(500);
  const abajo = await page.evaluate(() => {
    const hd = document.querySelector('.hd');
    return { stuck: hd.classList.contains('is-stuck'), blur: getComputedStyle(hd).backdropFilter };
  });
  is(abajo.stuck, 'gana la clase is-stuck pasados los 80px');
  is(/blur/.test(abajo.blur), 'aplica el blur de fondo', abajo.blur);

  const prog = await page.evaluate(() => getComputedStyle(document.querySelector('#hdProg')).transform);
  is(prog !== 'matrix(1, 0, 0, 1, 0, 0)' && prog !== 'none', 'la barra de progreso avanzó', prog);
  await page.close();
}

/* ── 7. Sin scroll horizontal ─────────────────────────────────────────── */
console.log('\n[7] Overflow horizontal');
for (const w of [360, 390, 560, 768, 860, 1080, 1440, 1920]) {
  const page = await open(w, 800);
  await sleep(1500);
  const r = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: window.innerWidth,
    culpable: [...document.querySelectorAll('body *')]
      .filter(el => el.getBoundingClientRect().right > window.innerWidth + 1)
      .slice(0, 3).map(el => el.className || el.tagName),
  }));
  is(r.doc <= r.win + 1, `${w}px sin desborde`, r.doc > r.win + 1 ? `${r.doc}>${r.win} · ${r.culpable}` : '');
  await page.close();
}

/* ── 8. Foco visible ──────────────────────────────────────────────────── */
console.log('\n[8] Foco');
{
  const page = await open();
  await sleep(1600);
  const r = [];
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('Tab');
    r.push(await page.evaluate(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      return { tag: el.tagName, txt: (el.textContent || '').trim().slice(0, 22), color: cs.outlineColor, w: cs.outlineWidth, style: cs.outlineStyle };
    }));
  }
  const rojos = r.filter(x => x.color === 'rgb(255, 45, 70)' && parseFloat(x.w) >= 2 && x.style !== 'none');
  is(rojos.length === r.length, `los ${r.length} primeros focos tienen outline rojo de 2px`,
     rojos.length < r.length ? JSON.stringify(r.find(x => !rojos.includes(x))) : '');
  is(r[0].txt.includes('Saltar'), 'el primer tab es el link de salto', r[0].txt);
  await page.close();
}

/* ── 9. Imágenes y links ──────────────────────────────────────────────── */
console.log('\n[9] Recursos y links');
{
  const page = await open();
  await sleep(1800);
  /* Se recorre la página de a tramos y no de un salto: `loading="lazy"` sólo
     dispara cuando la imagen se acerca al viewport, y saltando al final de
     una las del bento nunca llegan a asomar. */
  const alto = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < alto; y += 500) {
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y);
    await sleep(120);
  }
  await sleep(1500);
  const r = await page.evaluate(() => ({
    rotas: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src.split('/').pop()),
    total: document.images.length,
    lazy: [...document.images].filter(i => i.loading === 'lazy').length,
    anclas: [...document.querySelectorAll('a[href^="#"]')]
      .map(a => a.getAttribute('href'))
      .filter(h => h !== '#' && !document.querySelector(h)),
    sinAlt: [...document.images].filter(i => !i.hasAttribute('alt')).length,
  }));
  is(r.rotas.length === 0, `las ${r.total} imágenes cargan`, r.rotas.join(', '));
  is(r.anclas.length === 0, 'todos los anclajes internos apuntan a un id existente', r.anclas.join(', '));
  is(r.sinAlt === 0, 'ninguna imagen sin atributo alt');
  /* 10 imágenes: 8 del anillo (lazy) + la destacada + la fija del hero.
     La destacada NO es lazy a propósito: es la que el zoom lleva a pantalla
     completa y tiene que estar decodificada antes de llegar. */
  is(r.lazy === 8, 'sólo el anillo del bento es lazy', `${r.lazy} lazy de ${r.total}`);
  is(page.__errs.length === 0, 'sin errores de consola', page.__errs.slice(0, 2).join(' | '));
  await page.close();
}

console.log(`\n${'─'.repeat(56)}\n  ${pass} OK · ${fail} FAIL\n`);
await browser.close();
process.exit(fail ? 1 : 0);
