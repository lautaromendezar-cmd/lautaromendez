// Tándem · boceto. Menú, entradas suaves y el formulario que arma el mensaje de WhatsApp.
(() => {
  const WA = '5491168880899';
  const nav = document.querySelector('.nav');
  const flota = document.querySelector('.wa-flota');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scroll', y > 30);
    if (flota) flota.classList.toggle('is-on', y > window.innerHeight * 0.8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = document.querySelector('.burger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  nav.querySelectorAll('ul a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); document.body.style.overflow = '';
  }));

  const revs = document.querySelectorAll('.rev');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revs.forEach(el => io.observe(el));
  } else revs.forEach(el => el.classList.add('in'));

  // Los botones «Empecemos», «Quiero saber más», etc. preseleccionan el tipo de plan
  document.querySelectorAll('[data-plan]').forEach(a => a.addEventListener('click', () => {
    const r = document.querySelector(`.tipos input[value="${a.dataset.plan}"]`);
    if (r) r.checked = true;
  }));

  const form = document.getElementById('form-plan');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const v = k => (d.get(k) || '').toString().trim();
    let fecha = v('fecha');
    if (fecha) { const [a, m, dd] = fecha.split('-'); fecha = `${dd}/${m}/${a}`; }
    const lineas = [
      `Hola Tándem! Soy ${v('nombre') || '…'}${v('empresa') ? ` (${v('empresa')})` : ''}.`,
      `Busco un plan: ${v('tipo')}.`,
      fecha && `Fecha estimada: ${fecha}.`,
      v('invitados') && `Invitados aprox.: ${v('invitados')}.`,
      v('idea') && `Me gustaría que pase: ${v('idea')}`
    ].filter(Boolean);
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lineas.join('\n'))}`, '_blank', 'noopener');
  });
})();
