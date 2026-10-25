/* ══════════════════════════════════════════════════════════════════════════
   GOOGLE ANALYTICS 4

   Mismo criterio que pixel.js: lo cargan las DOS páginas y el ID vive sólo
   acá. La propiedad «Lautaro Mendez» (501941691) no recibía nada desde que
   salió la v3 en agosto: el sitio viejo tenía el tag y este nunca lo llevó.

   gtag.js pesa ~150 KB y, inyectado en el load, llevó el LCP de 1,7 a 4 s en
   otro sitio. Por eso baja con la primera interacción o a los 3,5 s del load,
   lo que pase primero. No se pierde nada: gtag() encola en dataLayer desde ya
   y la cola sale cuando llega la librería.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ID = 'G-8NS4FV6PH4';   /* propiedad «Lautaro Mendez» */

  /* Global Privacy Control: igual que el píxel, no se carga nada. */
  if (navigator.globalPrivacyControl) return;

  /* Sólo en producción: ni los deploys de prueba de Vercel ni localhost
     tienen que ensuciar la propiedad. */
  if (location.hostname !== 'lautaromendez.com.ar') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', ID);

  let cargado = false;
  const cargar = () => {
    if (cargado) return;
    cargado = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
  };
  ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach((ev) =>
    addEventListener(ev, cargar, { once: true, passive: true }));
  if (document.readyState === 'complete') setTimeout(cargar, 3500);
  else addEventListener('load', () => setTimeout(cargar, 3500), { once: true });

  /* ── Contactos ───────────────────────────────────────────────────────────
     Los mismos dos que el píxel cuenta como Lead, con los nombres que ya usan
     las propiedades de los clientes. Se marcan como evento clave en GA4
     (Administrar → Eventos clave), no desde acá. */
  const evento = (nombre, params) => {
    try { gtag('event', nombre, params); } catch (e) { /* bloqueador */ }
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="wa.me"]');
    if (!a) return;
    evento('whatsapp_click', {
      lugar: a.textContent.trim().slice(0, 40) || 'sin texto',
      pagina: location.pathname,
    });
  }, { passive: true, capture: true });

  document.addEventListener('lm:form-ok', () =>
    evento('formulario_enviado', { pagina: location.pathname }));
})();
