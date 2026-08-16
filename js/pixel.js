/* ══════════════════════════════════════════════════════════════════════════
   PÍXEL DE META

   Lo cargan las DOS páginas (index y portfolio). El ID vive acá y en ningún
   otro lado: es la única razón por la que esto es un archivo aparte y no el
   fragmento suelto que da Facebook pegado en cada <head>.

   Por eso tampoco está el <noscript><img> del fragmento oficial: obligaría a
   repetir el ID en cada HTML, y a cambio sólo mide visitantes con JS apagado,
   que además no pueden completar el formulario ni disparar ningún evento.

   Va con `defer`. El píxel no puede retrasar el LCP de un sitio que hoy pesa
   235 KB en el teléfono.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ID = '1656439432235723';   /* "Lautaro Web Pixel" */

  /* Global Privacy Control: el visitante pidió explícitamente que no lo
     rastreen. Se respeta y no se carga nada — ni el script de Facebook. */
  if (navigator.globalPrivacyControl) return;

  /* ── Arranque estándar de Meta ──────────────────────────────────────────
     Deja fbq() encolando llamadas y baja fbevents.js aparte; cuando llega,
     se despacha la cola. Copiado del fragmento oficial: no conviene
     "mejorarlo", es lo que la librería espera encontrar. */
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = true; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', ID);
  fbq('track', 'PageView');

  /* ── Lead ────────────────────────────────────────────────────────────────
     El píxel ya venía midiendo "Cliente potencial" (Lead) del sitio viejo, así
     que se mantiene ESE evento y no uno nuevo: cambiarlo por Contact partiría
     el histórico en dos y dejaría a las campañas optimizando sobre la mitad.

     Las dos vías reales de contacto son WhatsApp y el formulario. El portfolio
     sólo tiene la primera. */
  const lead = (desde) => {
    try {
      fbq('track', 'Lead', { content_name: desde, content_category: location.pathname });
    } catch (e) { /* que un bloqueador no rompa la navegación */ }
  };

  /* Delegado en el documento y por `href`, no por clase: hay CTAs de WhatsApp
     en el header, en el hero, en los tres servicios, en contacto y en el
     portfolio, y main.js encima les reescribe el href al vuelo. Buscar el
     dominio es lo único que no se desactualiza. */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="wa.me"]');
    if (!a) return;
    lead('whatsapp: ' + (a.textContent.trim().slice(0, 40) || 'sin texto'));
  }, { passive: true, capture: true });

  /* El formulario avisa por evento propio en vez de que este archivo le mire
     las tripas a contactForm(). Si mañana se cambia Web3Forms por otra cosa,
     mientras siga despachando `lm:form-ok` esto no se entera. */
  document.addEventListener('lm:form-ok', () => lead('formulario'));
})();
