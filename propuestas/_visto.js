// Avisa a Lautaro (push al celular vía /api/visto) cuando el cliente abre y lee la propuesta.
// Uso: <script src="/propuestas/_visto.js" data-p="slug" data-n="Nombre" defer></script>
// Para no avisar con tus propias visitas, abrí una vez cualquier propuesta con ?yo en cada dispositivo.
(() => {
  const s = document.currentScript;
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
    if (ya(e)) return;
    const body = JSON.stringify(Object.assign({ p, n, e }, extra));
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/visto/', body))) {
      fetch('/api/visto/', { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  };
  window.lmVisto = enviar;

  enviar(s.dataset.e || 'abrio', { m: matchMedia('(max-width: 700px)').matches ? 'celular' : 'computadora' });

  document.querySelectorAll('[data-visto]').forEach(el => {
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) { enviar(el.dataset.visto); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(el);
  });

  // Tiempo con la pestaña a la vista; se manda al salir, si pasó de 20 segundos
  let activo = 0, desde = Date.now();
  const salir = () => {
    activo += Date.now() - desde;
    const seg = Math.round(activo / 1000);
    if (seg >= 20) enviar('tiempo', { s: seg });
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') salir(); else desde = Date.now();
  });
})();
