/* ══════════════════════════════════════════════════════════════════════════
   ORIGEN DEL LEAD

   Anota de dónde llegó la visita y lo agrega al final del mensaje de
   WhatsApp: "(ref: fosque.com.ar)". Así cada consulta llega con su origen
   escrito, sin depender de ninguna plataforma de analítica. El píxel y
   Vercel Analytics dan totales; esto responde "¿y ESTE de dónde vino?".

   Qué cuenta como origen, en este orden:
     1. utm_source de la URL (los créditos de los sitios de clientes, los
        links de la bio, las campañas)
     2. gclid / fbclid → anuncio de Google / de Meta
     3. el dominio del referrer, si no es este mismo sitio
   Sin nada de eso (tipeó la URL, vino de WhatsApp, la app no manda
   referrer) no se pisa lo que ya había y, si no había nada, no se agrega
   ninguna marca al mensaje.

   Se guarda en localStorage 30 días: alguien que ve el sitio desde un
   crédito y escribe tres días después tipeando la URL sigue contando como
   ese crédito. Gana el último origen conocido, no el primero.

   Lo cargan las dos páginas. El formulario de la home arma su propia URL de
   WhatsApp, así que además se expone window.lmConOrigen(texto) para que
   main.js lo use si está — y si no está, el formulario anda igual.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const CLAVE = 'lm_origen';
  const DURA  = 30 * 24 * 60 * 60 * 1000;
  const PROPIO = /(^|\.)lautaromendez\.com\.ar$/;

  /* Los dominios que se leen mejor con su nombre que con el host crudo */
  const NOMBRES = [
    [/(^|\.)google\./,                 'google'],
    [/(^|\.)bing\.com$/,               'bing'],
    [/(^|\.)instagram\.com$/,          'instagram'],
    [/(^|\.)facebook\.com$/,           'facebook'],
    [/(^|\.)linkedin\.com$|^lnkd\.in$/, 'linkedin'],
    [/^t\.co$|(^|\.)x\.com$|(^|\.)twitter\.com$/, 'x'],
    [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, 'chatgpt'],
    [/(^|\.)perplexity\.ai$/,          'perplexity']
  ];

  const leer = () => {
    try {
      const o = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      return o && Date.now() - o.t < DURA ? o.v : '';
    } catch (e) { return ''; }
  };

  const guardar = (v) => {
    try { localStorage.setItem(CLAVE, JSON.stringify({ v, t: Date.now() })); } catch (e) {}
  };

  const detectar = () => {
    const q = new URLSearchParams(location.search);
    const utm = (q.get('utm_source') || '').trim().slice(0, 40);
    if (utm) return utm;
    if (q.has('gclid')) return 'google ads';
    if (q.has('fbclid')) return 'meta';

    let host = '';
    try { host = new URL(document.referrer).hostname.replace(/^www\./, ''); } catch (e) {}
    if (!host || PROPIO.test(host)) return '';
    for (const [re, nombre] of NOMBRES) if (re.test(host)) return nombre;
    return host;
  };

  const nuevo = detectar();
  if (nuevo) guardar(nuevo);
  const origen = () => nuevo || leer();

  /* La marca va siempre al final y se reemplaza si ya estaba: main.js
     reescribe los href al vuelo y el mismo link se puede tocar dos veces. */
  const MARCA = /\n*\(ref: [^)]*\)$/;
  const conOrigen = (texto) => {
    const o = origen();
    const base = (texto || '').replace(MARCA, '');
    return o ? `${base}\n\n(ref: ${o})` : base;
  };
  window.lmConOrigen = conOrigen;

  /* Se toca el href justo antes de que el navegador lo siga. Capture para
     llegar antes que cualquier otro listener; auxclick por la ruedita. */
  const alTocar = (e) => {
    const a = e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (!a) return;
    try {
      /* Armado a mano y no con searchParams.set: ese codifica los espacios
         como "+", y no hace falta apostar a que wa.me lo lea igual. */
      const url = new URL(a.href);
      const texto = conOrigen(url.searchParams.get('text'));
      a.href = `${url.origin}${url.pathname}?text=${encodeURIComponent(texto)}`;
    } catch (err) { /* un href raro no puede romper el click */ }
  };
  document.addEventListener('click', alTocar, true);
  document.addEventListener('auxclick', alTocar, true);
})();
