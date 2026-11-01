/* ══════════════════════════════════════════════════════════════════════════
   MICROSOFT CLARITY

   Grabaciones y mapas de calor de /cotizar/: muestra hasta dónde llega la
   gente y en qué pregunta abandona. Lo carga sólo esa página.

   Mismo criterio que ga.js: respeta GPC, sólo mide en producción y no compite
   con el LCP (baja con la primera interacción o a 1 s del load). El formulario
   lleva data-clarity-mask: lo que escribe la persona no queda en la grabación.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ID = 'z6y9tbhbqg';

  if (navigator.globalPrivacyControl) return;
  if (location.hostname !== 'lautaromendez.com.ar') return;

  /* Fragmento oficial: encola hasta que llega la librería */
  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  /* Para filtrar las grabaciones por anuncio */
  const anuncio = new URLSearchParams(location.search).get('utm_content');
  if (anuncio) window.clarity('set', 'anuncio', anuncio);

  let cargado = false;
  const cargar = () => {
    if (cargado) return;
    cargado = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.clarity.ms/tag/' + ID;
    document.head.appendChild(s);
  };
  ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach((ev) =>
    addEventListener(ev, cargar, { once: true, passive: true }));
  if (document.readyState === 'complete') setTimeout(cargar, 1000);
  else addEventListener('load', () => setTimeout(cargar, 1000), { once: true });
})();
