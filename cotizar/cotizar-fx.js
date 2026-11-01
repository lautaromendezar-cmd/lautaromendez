/* ══════════════════════════════════════════════════════════════════════════
   EFECTOS DE /cotizar/

   Nada de esto es necesario para cotizar: si GSAP no llega o se pidió menos
   movimiento, la página se lee completa y el formulario funciona.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const $ = (s) => document.querySelector(s);
  const azar = gsap.utils.random;

  /* Parte un texto en spans por palabra o letra, sin perder los <em> */
  const partir = (el, porLetra) => {
    const piezas = [];
    const envolver = (nodo) => {
      [...nodo.childNodes].forEach((n) => {
        if (n.nodeType === 1) return envolver(n);
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) return frag.append(p);
          const w = document.createElement('span');
          w.style.display = 'inline-block';
          if (porLetra) {
            [...p].forEach((c) => {
              const s = document.createElement('span');
              s.style.display = 'inline-block';
              s.textContent = c;
              w.append(s);
              piezas.push(s);
            });
          } else {
            w.textContent = p;
            piezas.push(w);
          }
          frag.append(w);
        });
        n.replaceWith(frag);
      });
    };
    envolver(el);
    return piezas;
  };

  const mm = gsap.matchMedia();
  const letras = partir($('#h1'), true);

  /* ── Escritorio: el campo de webs se desarma y se ordena en una cinta ───── */
  mm.add('(min-width: 900px)', () => {
    const hero = $('#hero');
    const campo = $('#campo');
    const plano = $('#plano');
    const tiles = gsap.utils.toArray('.t');
    const resto = gsap.utils.toArray('.hero__p, .cta:not(.cta--l), .hero__n');

    gsap.set(plano, { rotationX: 50, rotationZ: -36, scale: 1.2, transformPerspective: 0 });

    const anchoCinta = () => Math.min(innerWidth * .56, 900);
    const destino = (t, i) => {
      const r = anchoCinta();
      const paso = r + 18;
      const cx = innerWidth / 2 + (i - (tiles.length - 1) / 2) * paso + paso * 4;
      const cy = innerHeight / 2;
      return {
        x: cx - (plano.offsetLeft + t.offsetLeft + t.offsetWidth / 2),
        y: cy - (plano.offsetTop + t.offsetTop + t.offsetHeight / 2),
        s: r / t.offsetWidth
      };
    };

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: () => '+=' + innerHeight * 3,
        pin: true,
        anticipatePin: 1,
        scrub: .6,
        invalidateOnRefresh: true
      }
    });

    /* el texto se apaga letra por letra */
    tl.to(letras, { opacity: 0, y: -12, stagger: { amount: .14, from: 'end' }, duration: .05 }, 0)
      .to(resto, { autoAlpha: 0, duration: .08 }, 0)
      /* la grilla sale de su recuadro y ocupa toda la pantalla */
      .to(campo, { '--m': '130%', duration: .22, ease: 'power1.inOut' }, .04)
      /* las webs se dispersan en el espacio */
      .to(tiles, { filter: 'blur(0px)', duration: .1 }, .08)
      .to(tiles, {
        x: () => azar(-340, 340),
        y: () => azar(-300, 300),
        z: () => azar(-520, 460),
        rotationX: () => azar(-46, 46),
        rotationY: () => azar(-52, 52),
        rotation: () => azar(-22, 22),
        duration: .34,
        ease: 'power1.in',
        stagger: { amount: .1, from: 'random' }
      }, .08)
      /* de claro a negro */
      .to(hero, { '--wipe': '0%', duration: .16, ease: 'power3.inOut', onUpdate() { document.body.classList.toggle('es-oscuro', this.progress() > .5); } }, .3)
      /* el plano se endereza y las webs caen en fila */
      .to(plano, { rotationX: 0, rotationZ: 0, scale: 1, duration: .34, ease: 'power2.inOut' }, .44);

    tiles.forEach((t, i) => {
      tl.to(t, {
        x: () => destino(t, i).x,
        y: () => destino(t, i).y,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotation: 0,
        scale: () => destino(t, i).s,
        duration: .36,
        ease: 'power3.inOut'
      }, .44 + i * .002);
    });

    /* la cinta sigue su camino */
    gsap.set('#cintaN', { y: 16 });
    tl.to(plano, { x: () => -anchoCinta() * 4, duration: .24 }, .9)
      .to('#cintaN', { opacity: 1, y: 0, duration: .08 }, .88);

    return () => { };
  });

  /* ── Celular: mismo gesto, sin fijar la pantalla ────────────────────────── */

  /* ── Texto que se enciende ──────────────────────────────────────────────── */
  gsap.from(partir($('#t2'), false), {
    opacity: .14,
    stagger: .05,
    ease: 'none',
    scrollTrigger: { trigger: '#t2', start: 'top 78%', end: 'bottom 52%', scrub: .4 }
  });

  /* ── Rubros: lista gigante, la web de al lado cambia ────────────────────── */
  mm.add('(min-width: 900px)', () => {
    const rub = $('#rub');
    const lista = $('#rubros');
    const visor = $('#visor');
    const filas = gsap.utils.toArray('.r');
    rub.classList.add('rub--fx');

    const fotos = filas.map((f) => {
      const c = f.querySelector('img').cloneNode();
      c.loading = 'eager';
      visor.append(c);
      return c;
    });
    let activa = -1;
    const elegir = (i) => {
      if (i === activa) return;
      activa = i;
      filas.forEach((f, n) => f.classList.toggle('es-on', n === i));
      fotos.forEach((f, n) => f.classList.toggle('es-on', n === i));
      $('#visorC').textContent = filas[i].querySelector('.r__c')?.textContent || '';
    };
    elegir(0);

    const paso = () => filas[0].offsetHeight;
    const st = gsap.to(lista, {
      y: () => -(filas.length - 1) * paso(),
      ease: 'none',
      scrollTrigger: {
        trigger: rub,
        start: 'top top',
        end: () => '+=' + innerHeight * 2.4,
        pin: true,
        scrub: .3,
        invalidateOnRefresh: true,
        onUpdate: (s) => {
          elegir(Math.round(s.progress * (filas.length - 1)));
          visor.style.transform = `translateY(calc(-50% + ${(.5 - s.progress) * 90}px))`;
        }
      }
    });

    return () => {
      st.scrollTrigger?.kill();
      rub.classList.remove('rub--fx');
      visor.replaceChildren($('#visorC'));
    };
  });

  /* ── Profundidad: cada bloque viaja a su velocidad mientras se scrollea ──── */
  const viaja = (sel, y, extra = {}) => gsap.utils.toArray(sel).forEach((el) => {
    gsap.fromTo(el, { y: y }, { y: -y, ease: 'none', ...extra,
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: .5 } });
  });

  /* Títulos grandes: cada palabra sube desde abajo, una tras otra, atada al scroll */
  gsap.utils.toArray('.sub, .cierre__h').forEach((h) => {
    const palabras = partir(h, false);
    gsap.from(palabras, { y: '110%', opacity: 0, stagger: .06, ease: 'power3.out',
      scrollTrigger: { trigger: h, start: 'top 88%', end: 'top 45%', scrub: .6 } });
  });

  /* Cards de precios: la del medio se adelanta, las de los lados llegan después */
  gsap.utils.toArray('.plan').forEach((p, i) => {
    gsap.from(p, { y: [90, 30, 110][i], rotation: [-1.5, 0, 1.5][i], opacity: 0, ease: 'power2.out',
      scrollTrigger: { trigger: '.planes', start: 'top 85%', end: 'top 35%', scrub: .5 } });
  });
  viaja('.plan--d', -36);

  /* Pasos y preguntas: entran en cascada */
  gsap.from('.pasos li', { y: 60, opacity: 0, stagger: .12, ease: 'power2.out',
    scrollTrigger: { trigger: '.pasos ol', start: 'top 85%', end: 'top 45%', scrub: .5 } });
  gsap.from('.q', { x: -40, opacity: 0, stagger: .07, ease: 'power2.out',
    scrollTrigger: { trigger: '.faq__l', start: 'top 85%', end: 'top 40%', scrub: .5 } });
  viaja('.faq > .sub', 40);

  /* Texto grande: además de encenderse, se desplaza más lento que la página */
  viaja('#t2', 70);

  /* Rubros en celular: cada web sube un poco más rápido que su nombre */
  mm.add('(max-width: 899px)', () => { viaja('.r img', 28); });

  /* Cierre: el campo de webs flota y el titular se acerca */
  /* La imagen del cierre: se acerca con el scroll y sigue al puntero o al celular */
  const cierreImg = $('#cierreImg');
  gsap.fromTo(cierreImg, { scale: 1.25, yPercent: -6 }, { scale: 1, yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: '.cierre', start: 'top bottom', end: 'bottom top', scrub: .4 } });
  const sigueX = gsap.quickTo(cierreImg, 'x', { duration: .9, ease: 'power3' });
  const sigueY = gsap.quickTo(cierreImg, 'y', { duration: .9, ease: 'power3' });
  const giraY = gsap.quickTo(cierreImg, 'rotationY', { duration: .9, ease: 'power3' });
  const giraX = gsap.quickTo(cierreImg, 'rotationX', { duration: .9, ease: 'power3' });
  const mover = (nx, ny) => { sigueX(nx * 30); sigueY(ny * 22); giraY(nx * 4); giraX(-ny * 3); };
  if (matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => mover(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5), { passive: true });
  } else if ('DeviceOrientationEvent' in window) {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      mover(gsap.utils.clamp(-.5, .5, e.gamma / 60), gsap.utils.clamp(-.5, .5, (e.beta - 45) / 60));
    }, { passive: true });
  }
  gsap.fromTo('.cierre__in', { scale: .92 }, { scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.cierre', start: 'top bottom', end: 'top 20%', scrub: .5 } });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
})();
