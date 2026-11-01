/* ══════════════════════════════════════════════════════════════════════════
   FORMULARIO DE /cotizar/

   Pantalla completa, 5 preguntas de a una. Filtra antes de WhatsApp: si no
   arrancó o tiene menos de $360.000 no se abre el chat.

   Eventos de Meta:
     SubmitApplication  pasó el filtro. Es el que optimiza la campaña. No se usa
                        Lead porque pixel.js lo dispara con cualquier wa.me del
                        sitio; por lo mismo WhatsApp se abre con location y no
                        con un <a href="wa.me">.
     CotizarInicio      respondió la primera pregunta.
     CotizarDescartado  el filtro lo frenó. Sólo para contar.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const WA = 'https://wa.me/5491130011145';
  const $ = (id) => document.getElementById(id);
  const dlg = $('dlg');
  const form = $('f');
  const fin = $('fin');
  const err = $('err');
  const atras = $('atras');
  const pasos = [...form.querySelectorAll('[data-st]')];
  const TOTAL = pasos.length;
  const TEXTOS = {
    negocio: { min: 3, error: 'Contame qué negocio tenés y en qué ciudad.' },
    donde: { min: 4, error: 'Pasame algo donde pueda ver tu negocio.' }
  };
  const REQUERIDOS = ['negocio', 'donde', 'tiempo', 'precio'];
  const AFUERA = { tiempo: 'Todavía no arrancó', precio: 'Menos de $360.000' };

  let actual = 0;
  let hondo = 0;          /* entradas de historial propias del formulario */
  let origenFoco = null;
  let iniciado = false;
  let enviando = false;
  let medido = false;
  try { medido = sessionStorage.getItem('cz_enviado') === '1'; } catch (e) { /* modo privado */ }
  let noTocarHasta = 0;   /* tapa el segundo toque de un doble toque */
  let timerAvance = 0;

  const meta = (tipo, evento, datos, opciones) => {
    try { if (window.fbq) fbq(tipo, evento, datos, opciones); } catch (e) { /* un bloqueador no frena el contacto */ }
  };

  /* GA4: el embudo del formulario, paso por paso, con el anuncio que trajo a
     la persona. Es lo que responde «dónde se queda la gente» por anuncio. */
  const q = new URLSearchParams(location.search);
  const ga = (nombre, params) => {
    try {
      if (window.gtag) gtag('event', nombre, Object.assign({ pagina: location.pathname, anuncio: q.get('utm_content') || '', campana: q.get('utm_campaign') || '' }, params || {}));
    } catch (e) { /* bloqueador */ }
  };

  /* Valor estimado del lead según el rango de presupuesto que eligió: deja a
     Meta y a GA4 distinguir una solicitud de $400.000 de una de $1.500.000. */
  const VALOR = { 'Más de $1.200.000': 1200000, '$600.000 a $1.200.000': 900000, '$360.000 a $600.000': 480000 };
  const galleta = (n) => { const m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; };
  const valor = (n) => form.elements[n].value.trim();
  const queda = (n, v) => AFUERA[n] === v;
  const pasoDe = (nombre) => pasos.findIndex((p) => p.querySelector(`[name="${nombre}"]`));

  const muestra = (i, foco) => {
    noTocarHasta = performance.now() + 350;
    actual = i;
    pasos.forEach((p, n) => p.classList.toggle('es-actual', n === i));
    $('paso').textContent = `Pregunta ${i + 1} de ${TOTAL}`;
    $('barra').style.width = `${((i + 1) / TOTAL) * 100}%`;
    atras.hidden = i === 0;
    err.hidden = true;
    if (!foco) return;
    const texto = pasos[i].querySelector('input[type="text"]');
    if (texto) texto.focus({ preventScroll: true });
    else { pasos[i].tabIndex = -1; pasos[i].focus({ preventScroll: true }); }
    dlg.scrollTop = 0;
  };

  const adelante = (i) => {
    hondo += 1;
    history.pushState({ cz: i, h: hondo }, '');
    muestra(i, true);
    ga('cotizar_paso', { paso: i + 1 });
  };

  const abrir = (e) => {
    origenFoco = e.currentTarget;
    fin.hidden = true;
    form.hidden = false;
    dlg.hidden = false;
    document.body.classList.add('lock');
    document.querySelectorAll('main, .top, .fija, .pie').forEach((el) => { el.inert = true; });
    hondo = 1;
    history.pushState({ cz: 0, h: 1 }, '');
    muestra(0, true);
    const bloque = origenFoco && origenFoco.closest('section, header, .fija');
    ga('cotizar_abrir', { lugar: bloque ? (bloque.id || bloque.className.split(' ')[0]) : 'otro' });
  };

  const ocultar = () => {
    clearTimeout(timerAvance);
    dlg.hidden = true;
    document.body.classList.remove('lock');
    document.querySelectorAll('main, .top, .fija, .pie').forEach((el) => { el.inert = false; });
    if (origenFoco) origenFoco.focus({ preventScroll: true });
  };

  const cerrar = () => {
    ocultar();
    if (hondo > 0) history.go(-hondo);
    hondo = 0;
  };

  const descartar = () => {
    meta('trackCustom', 'CotizarDescartado');
    ga('cotizar_descartado', { motivo: queda('tiempo', valor('tiempo')) ? 'no arrancó' : 'presupuesto' });
    noTocarHasta = 0;
    hondo += 1;
    history.pushState({ cz: actual, h: hondo }, '');
    form.hidden = true;
    fin.hidden = false;
    fin.focus({ preventScroll: true });
  };

  const seguirTexto = (nombre) => {
    if (valor(nombre).length < TEXTOS[nombre].min) {
      err.textContent = TEXTOS[nombre].error;
      err.hidden = false;
      $(nombre).focus();
      return;
    }
    if (!iniciado) { iniciado = true; meta('trackCustom', 'CotizarInicio'); ga('cotizar_inicio'); }
    adelante(actual + 1);
  };

  document.querySelectorAll('[data-abrir]').forEach((b) => b.addEventListener('click', abrir));
  $('cerrar').addEventListener('click', cerrar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dlg.hidden) cerrar(); });

  form.querySelectorAll('[data-seguir]').forEach((b) => {
    b.addEventListener('click', () => seguirTexto(b.dataset.seguir));
    $(b.dataset.seguir).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); seguirTexto(b.dataset.seguir); }
    });
  });

  /* Segundo toque de un doble toque: no es una respuesta */
  form.addEventListener('click', (e) => {
    if (performance.now() >= noTocarHasta) return;
    if (e.target.closest('.o, .sig, .atras')) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* Tocar una opción avanza solo. Se usa click y no change: tocar la opción ya
     marcada al volver tiene que avanzar. Las flechas también disparan click:
     ahí no se avanza. */
  let flecha = false;
  form.addEventListener('keydown', (e) => { if (e.target.type === 'radio' && e.key.startsWith('Arrow')) flecha = true; });
  form.addEventListener('keyup', () => { flecha = false; });
  form.addEventListener('click', (e) => {
    if (e.target.type !== 'radio' || flecha) return;
    const { name, value } = e.target;
    noTocarHasta = Infinity;
    clearTimeout(timerAvance);
    timerAvance = setTimeout(() => {
      if (queda(name, value)) return descartar();
      adelante(actual + 1);
    }, 180);
  });

  /* Enter sobre una opción con teclado: confirma y avanza */
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.type !== 'radio') return;
    e.preventDefault();
    e.target.checked = true;
    if (queda(e.target.name, e.target.value)) return descartar();
    adelante(actual + 1);
  });

  /* Enter en el nombre pasa al WhatsApp en vez de intentar enviar */
  $('nombre').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $('tel').focus(); }
  });

  atras.addEventListener('click', () => history.back());

  /* Tecla atrás del celular: vuelve de a una pregunta y al final cierra */
  /* Si la página se recargó con el formulario abierto (volver de WhatsApp sin
     bfcache), se sacan de una las entradas que dejó */
  if (history.state && history.state.h > 0) history.go(-history.state.h);
  else history.replaceState({}, '');
  window.addEventListener('popstate', (e) => {
    clearTimeout(timerAvance);
    hondo = (e.state && e.state.h) || 0;
    if (!e.state || typeof e.state.cz !== 'number') {
      if (!dlg.hidden) ocultar();
      hondo = 0;
      return;
    }
    fin.hidden = true;
    form.hidden = false;
    muestra(e.state.cz, true);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (enviando) return;
    if (valor('nombre').length < 2) {
      err.textContent = 'Decime cómo te llamás.';
      err.hidden = false;
      $('nombre').focus();
      return;
    }
    if (valor('tel').replace(/\D/g, '').length < 8) {
      err.textContent = 'Pasame un WhatsApp para poder escribirte.';
      err.hidden = false;
      $('tel').focus();
      return;
    }
    const falta = REQUERIDOS.find((n) => !valor(n));
    if (falta) return muestra(pasoDe(falta), true);
    if (queda('tiempo', valor('tiempo')) || queda('precio', valor('precio'))) return descartar();
    enviando = true;

    const texto = [
      `Hola Lautaro, soy ${valor('nombre')} y quiero cotizar una web.`,
      `Negocio: ${valor('negocio')}`,
      `Dónde verlo: ${valor('donde')}`,
      `Funciona hace: ${valor('tiempo')}`,
      `Presupuesto: ${valor('precio')}`
    ].join('\n');
    const mensaje = window.lmConOrigen ? window.lmConOrigen(texto) : texto;

    /* El mismo id va al píxel (eventID) y al servidor (event_id): si los dos
       llegan, Meta los deduplica; si un bloqueador frena al píxel, llega el
       del servidor igual. */
    const idEvento = 'cz-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    const valorLead = VALOR[valor('precio')] || 0;
    const primera = !medido;
    if (primera) {
      medido = true;
      try { sessionStorage.setItem('cz_enviado', '1'); } catch (e2) { /* modo privado */ }
      meta('track', 'SubmitApplication', { value: valorLead, currency: 'ARS', content_category: valor('precio') }, { eventID: idEvento });
      /* No se despacha lm:form-ok: pixel.js lo contaría como Lead */
      ga('formulario_enviado', { value: valorLead, currency: 'ARS', presupuesto: valor('precio'), tiempo: valor('tiempo') });
    }
    /* Queda en la planilla aunque después no toque enviar en WhatsApp */
    try {
      let origen = '';
      try { origen = (JSON.parse(localStorage.getItem('lm_origen') || 'null') || {}).v || ''; } catch (e3) { /* modo privado */ }
      const datos = JSON.stringify({
        nombre: valor('nombre'), tel: valor('tel'), negocio: valor('negocio'), donde: valor('donde'),
        tiempo: valor('tiempo'), precio: valor('precio'),
        origen: q.get('utm_source') || origen, campana: q.get('utm_campaign') || '', anuncio: q.get('utm_content') || '',
        /* para el evento del servidor (API de conversiones) */
        evento: primera ? idEvento : '', valor: valorLead, url: location.href, fbp: galleta('_fbp'), fbc: galleta('_fbc') || (q.get('fbclid') ? 'fb.1.' + Date.now() + '.' + q.get('fbclid') : '')
      });
      /* sendBeacon sobrevive a la salida de la página (abrir WhatsApp la deja
         atrás); fetch keepalive es el respaldo */
      const fue = navigator.sendBeacon && navigator.sendBeacon('/api/lead/', new Blob([datos], { type: 'text/plain' }));
      if (!fue) fetch('/api/lead/', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: datos }).catch(() => {});
    } catch (e4) { /* nunca frena el contacto */ }
    $('enviar').textContent = 'Abriendo WhatsApp';

    /* api.whatsapp.com y no wa.me: pixel.js contaría Lead con un enlace a wa.me */
    const respaldo = $('wa-manual');
    respaldo.href = `https://api.whatsapp.com/send?phone=5491130011145&text=${encodeURIComponent(mensaje)}`;

    /* Un momento para que salga el evento antes de dejar la página */
    setTimeout(() => { location.href = `${WA}?text=${encodeURIComponent(mensaje)}`; }, 350);
    /* Con la app abierta la página no se descarga y pageshow no llega nunca */
    setTimeout(() => { liberar(); respaldo.hidden = false; }, 3000);
  });

  /* Volver desde WhatsApp con el botón atrás: bfcache deja el botón trabado */
  const liberar = () => {
    enviando = false;
    $('enviar').textContent = 'Enviar por WhatsApp';
  };
  window.addEventListener('pageshow', liberar);

  /* Filas del hero en celular: se duplican para que el loop no tenga salto */
  if (matchMedia('(max-width: 899px)').matches) {
    document.querySelectorAll('.fila').forEach((fl) => {
      [...fl.children].forEach((img) => fl.appendChild(img.cloneNode(true)));
    });
  }

  /* El header cambia de color al salir del hero claro. Con GSAP en escritorio lo
     maneja la cortina del scrub; en los demás casos, esto. */
  if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(max-width: 899px)').matches) {
    new IntersectionObserver(([e]) => { document.body.classList.toggle('es-oscuro', !e.isIntersecting); }, { rootMargin: '-60px 0px 0px 0px' }).observe($('hero'));
  }

  /* Botón fijo del celular: aparece cuando el hero sale de pantalla */
  const fija = $('fija');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { fija.hidden = e.isIntersecting; }).observe($('heroTx'));
  }
})();
