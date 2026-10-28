// Avisa a Lautaro (push al celular vía /api/visto) cuando el cliente abre y lee la propuesta.
// Uso: <script src="/propuestas/_visto.js" data-p="slug" data-n="Nombre" defer></script>
// Para no avisar con tus propias visitas, abrí una vez cualquier propuesta con ?yo en cada dispositivo.
// En una web de otro dominio: src="https://lautaromendez.com.ar/propuestas/_visto.js" (el ?yo va aparte en ese dominio)
// y secciones con data-visto="seccion" data-visto-x="Empresas".
(() => {
  const s = document.currentScript;
  const API = new URL('/api/visto/', s.src).href;
  try {
    if (new URLSearchParams(location.search).has('yo')) localStorage.setItem('lm-yo', '1');
    if (localStorage.getItem('lm-yo')) return;
  } catch (e) {}
  if (navigator.webdriver) return;

  const p = s.dataset.p, n = s.dataset.n;
  const ya = k => {
    try { if (sessionStorage.getItem('lmv-' + k)) return true; sessionStorage.setItem('lmv-' + k, '1'); } catch (e) {}
    return false;
  };
  const enviar = (e, extra) => {
    if (ya(e + (extra && extra.x ? '-' + extra.x : ''))) return;
    const body = JSON.stringify(Object.assign({ p, n, e }, extra));
    if (!(navigator.sendBeacon && navigator.sendBeacon(API, body))) {
      fetch(API, { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  };
  window.lmVisto = enviar;

  enviar(s.dataset.e || 'abrio', { m: matchMedia('(max-width: 700px)').matches ? 'celular' : 'computadora' });

  document.querySelectorAll('[data-visto]').forEach(el => {
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) { enviar(el.dataset.visto, el.dataset.vistoX ? { x: el.dataset.vistoX } : undefined); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(el);
  });

  document.addEventListener('click', ev => {
    if (ev.target.closest && ev.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]')) enviar('whatsapp');
  });

  // Tiempo con la pestaña a la vista; se manda al salir, si pasó de 20 segundos.
  // pagehide cubre los navegadores de WhatsApp/Instagram, que a veces cierran sin visibilitychange.
  let activo = 0, desde = document.visibilityState === 'visible' ? Date.now() : 0;
  const acumulado = () => activo + (desde ? Date.now() - desde : 0);
  const salir = () => {
    activo = acumulado(); desde = 0;
    const seg = Math.round(activo / 1000);
    if (seg >= 20) enviar('tiempo', { s: seg });
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') salir(); else desde = Date.now();
  });
  addEventListener('pagehide', salir);

  // Aviso a los 30 segundos a la vista, aunque no cierren la página
  const reloj = setInterval(() => {
    if (acumulado() >= 30000) { enviar('leyendo'); clearInterval(reloj); }
  }, 5000);
})();
