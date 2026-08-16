/* ══════════════════════════════════════════════════════════════════════════
   LAUTARO MENDEZ — comportamiento
   Todo son funciones con nombre que llama init() al final del archivo.
   Nada corre suelto: si mañana hay que apagar el parallax, se comenta una
   línea de init() y listo.
   ══════════════════════════════════════════════════════════════════════════ */

/* Preferencias del visitante que condicionan todo lo demás */
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE    = matchMedia('(pointer: fine)').matches;

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* Lee un color del CSS: así el JS tampoco tiene hex hardcodeados */
const token = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const WA_BASE = 'https://wa.me/5491130011145';

/* ══════════════════════════════════════════════════════════════════════════
   PRELOADER
   Una sola vez por sesión. Devuelve una promesa que resuelve cuando el hero
   ya puede entrar, así la intro no arranca tapada.
   ══════════════════════════════════════════════════════════════════════════ */
function preloader() {
  const pre = $('#pre');
  if (!pre) return Promise.resolve();

  const yaLoVio = sessionStorage.getItem('lm_pre') === '1';
  if (yaLoVio || REDUCED) {
    pre.remove();                       // sin animar: no existe y punto
    return Promise.resolve();
  }
  sessionStorage.setItem('lm_pre', '1');

  return new Promise((listo) => {
    const tl = gsap.timeline({
      onComplete: () => { pre.remove(); ScrollTrigger.refresh(); }
    });

    tl.from('.pre .lock__a', { yPercent: 34, opacity: 0, duration: .55, ease: 'expo.out' })
      .from('.pre .lock__b', { yPercent: 34, opacity: 0, duration: .6, ease: 'expo.out' }, .1)
      .to('.pre__fill',    { scaleX: 1, duration: .78, ease: 'power1.inOut' }, 0)
      .to('.pre__lock',    { yPercent: -14, opacity: 0, duration: .34, ease: 'power2.in' }, .86)
      /* la cortina sale hacia arriba; el hero ya está abajo esperando */
      .to(pre, { yPercent: -100, duration: .52, ease: 'expo.inOut', onStart: listo }, .98);
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   HEADER — fondo con blur a los 80px + barra de progreso de lectura
   ══════════════════════════════════════════════════════════════════════════ */
function header() {
  ScrollTrigger.create({
    start: 'top -80',
    end: 99999,
    toggleClass: { className: 'is-stuck', targets: '.hd' }
  });

  gsap.to('#hdProg', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: .25 }
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   HERO — entrada
   El H1 es el LCP: es texto plano y lo único que se le toca es el transform
   de cada línea. Ni scramble ni reescritura de contenido.
   ══════════════════════════════════════════════════════════════════════════ */
function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  /* fromTo y no to: GSAP lee el translateY(112%) que dejó el CSS como `y` en
     píxeles, así que tweenear sólo yPercent dejaría la línea abajo para
     siempre. Declarando el arranque, GSAP toma las riendas del transform. */
  tl.fromTo('.hero__h1 .ln > span',
      { yPercent: 112, y: 0 },
      { yPercent: 0, duration: 1.05, stagger: .085 })
    .fromTo('.hero__brow', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .7 }, .1)
    .fromTo('.hero__sub',  { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .8 }, .52)
    .fromTo('.hero__acts', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .8 }, .64)
    .fromTo('.hero__meta', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .8 }, .74);
}

/* ══════════════════════════════════════════════════════════════════════════
   HERO — video de fondo
   El <video> llega sin src a propósito: acá se decide si vale la pena bajarlo.
   Cuando no, abajo queda la imagen fija y el hero se ve igual, sólo quieto.
   ══════════════════════════════════════════════════════════════════════════ */
function heroVideo() {
  const v = $('#heroVideo');
  if (!v) return;

  const ahorroDeDatos = navigator.connection?.saveData === true;
  const pantallaChica = matchMedia('(max-width: 860px)').matches;

  /* En el teléfono no se carga: el recorte vertical se come la composición
     (queda una franja angosta del centro) y el megabyte pega justo donde peor
     se conecta. Ahí la imagen fija rinde más que el video. */
  if (REDUCED || ahorroDeDatos || pantallaChica) return;

  for (const [src, type] of [
    ['assets/hero/hero.webm', 'video/webm'],
    ['assets/hero/hero.mp4',  'video/mp4']
  ]) {
    const s = document.createElement('source');
    s.src = src;
    s.type = type;
    v.appendChild(s);
  }

  /* recién cuando hay imagen de verdad se funde encima de la fija */
  v.addEventListener('playing', () => v.classList.add('is-on'), { once: true });

  v.load();
  /* Safari e iOS pueden rechazar el autoplay aunque esté muteado. No es un
     error a resolver: si pasa, el hero se queda con la imagen fija. */
  v.play().catch(() => {});
}

/* ══════════════════════════════════════════════════════════════════════════
   HERO — parallax
   Ya no hay capas que separar: la escena es una sola pieza, así que el
   parallax pasó a ser una deriva de cámara sobre el conjunto.
   Con mouse: quickTo sobre mousemove. Sin mouse: scrub de scroll, porque en
   un teléfono no hay puntero al que seguir.
   ══════════════════════════════════════════════════════════════════════════ */
function heroParallax() {
  const scene = $('#scene');
  if (!scene) return;

  const AMPLITUD = 22;   // píxeles a cada lado; el -6% de inset da el margen

  if (FINE) {
    const x = gsap.quickTo(scene, 'x', { duration: 1.1, ease: 'power3.out' });
    const y = gsap.quickTo(scene, 'y', { duration: 1.1, ease: 'power3.out' });

    window.addEventListener('mousemove', (e) => {
      /* -0.5 .. 0.5 respecto del centro de la ventana */
      const nx = e.clientX / window.innerWidth  - .5;
      const ny = e.clientY / window.innerHeight - .5;
      /* el eje Y se mueve la mitad que el X: si no, marea */
      x(-nx * AMPLITUD * 2);
      y(-ny * AMPLITUD);
    }, { passive: true });

  } else {
    gsap.to(scene, {
      y: 64,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   FRANJA SCRAMBLE
   Arranca cuando la franja entra en pantalla (once), no al cargar la página:
   si no, el visitante se pierde la mitad del ciclo antes de llegar.
   ══════════════════════════════════════════════════════════════════════════ */
function startScramble() {
  const el = $('#scramble');
  if (!el) return;

  /* el primer valor ya está en el HTML, así que el ciclo empieza en el segundo */
  const PALABRAS = [
    'UN SITIO INSTITUCIONAL',
    'UN DESARROLLO A MEDIDA',
    'UNA CAMPAÑA QUE FUNCIONE',
    'UNA LANDING PAGE'
  ];
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_';

  ScrollTrigger.create({
    trigger: '.strip',
    start: 'top 88%',
    once: true,
    onEnter: () => {
      const tl = gsap.timeline({ repeat: -1, delay: .5 });
      PALABRAS.forEach((palabra) => {
        tl.to(el, {
          duration: 1.15,
          ease: 'none',
          scrambleText: { text: palabra, chars: CHARS, speed: .42, revealDelay: .22 }
        })
        .to({}, { duration: 1.7 });   // pausa para que se lea
      });
    }
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   SERVICIOS
   El CTA de cada fila preselecciona el servicio en el <select> y reescribe
   el ?text= de todos los links de WhatsApp: el que llega desde /a-medida no
   tiene que volver a explicar qué vino a buscar.
   ══════════════════════════════════════════════════════════════════════════ */
function services() {
  const select = $('#f-svc');
  const ctas   = $$('.svc-cta');
  if (!ctas.length) return;

  const FRASE = {
    'landing':       'una landing page',
    'institucional': 'un sitio institucional',
    'a-medida':      'un desarrollo a medida'
  };

  ctas.forEach((cta) => {
    cta.addEventListener('click', () => {
      const clave = cta.dataset.servicio;
      if (!FRASE[clave]) return;

      if (select) select.value = clave;

      const msg = `Hola Lautaro, te escribo desde la web. Me interesa ${FRASE[clave]}.`;
      $$('[data-wa]').forEach((a) => {
        a.href = `${WA_BASE}?text=${encodeURIComponent(msg)}`;
      });

      /* un parpadeo del borde para que se note que el formulario cambió */
      if (select && window.gsap && !REDUCED) {
        gsap.fromTo(select,
          { borderColor: token('--signal') },
          { borderColor: token('--steel'), duration: 1.4, ease: 'power2.out', delay: .5 });
      }
    });
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   SERVICIOS — slider a pantalla completa

   Cada panel ocupa 100svh. Al avanzar, el panel actual sube y sale mientras
   el siguiente sube desde abajo. Los dos usan el truco de la cortina: la
   ventana (.panel__outer) y el contenido (.panel__inner) se mueven en sentido
   contrario, así el texto parece quedarse quieto mientras lo descubren en vez
   de viajar con el panel.

   Es ScrollTrigger pinneado, no el plugin Observer del demo original. Observer
   se queda con la rueda del mouse, y en un one-page eso significa que el
   visitante no puede pasar de largo la sección ni usar la barra ni el teclado.
   Con pin + snap el gesto es el mismo y el scroll sigue siendo suyo.
   ══════════════════════════════════════════════════════════════════════════ */
/* Parte un texto en letras envueltas por palabra. Se hace a mano en vez de
   sumar SplitText: son tres títulos cortos y así no entra un plugin más al
   CDN. El <h3> queda con aria-label y las esquirlas con aria-hidden, si no un
   lector de pantalla deletrea "L-a-n-d-i-n-g". */
function partirEnLetras(el) {
  const texto = el.textContent.trim();
  el.setAttribute('aria-label', texto);
  el.textContent = '';

  texto.split(' ').forEach((palabra, i, todas) => {
    const w = document.createElement('span');
    w.className = 'w';
    w.setAttribute('aria-hidden', 'true');
    for (const ch of palabra) {
      const c = document.createElement('span');
      c.className = 'c';
      c.textContent = ch;
      w.appendChild(c);
    }
    el.appendChild(w);
    if (i < todas.length - 1) el.appendChild(document.createTextNode(' '));
  });

  return [...el.querySelectorAll('.c')];
}

function servicesSlider() {
  const stage  = $('#svcStage');
  const paneles = $$('.panel', stage || document);
  if (!stage || paneles.length < 2) return;

  const n     = paneles.length;
  const nav   = $$('#svcNav button');
  const outer = paneles.map((p) => $('.panel__outer', p));
  const inner = paneles.map((p) => $('.panel__inner', p));

  const marcar = (i) => nav.forEach((b, k) =>
    b.setAttribute('aria-current', k === i ? 'true' : 'false'));

  /* El corte en letras se hace UNA vez y acá afuera: si viviera adentro de
     matchMedia, cada cruce de los 861px volvería a partir un texto ya partido. */
  const letras = paneles.map((p) => partirEnLetras($('.panel__t', p)));
  const restos = paneles.map((p) => [$('.panel__d', p), $('.panel__cols', p)].filter(Boolean));

  /* matchMedia crea y destruye todo al cruzar los 861px, y revierte los
     estilos inline que dejó GSAP: abajo de eso los paneles se apilan. */
  gsap.matchMedia().add('(min-width: 861px)', () => {
    /* recién acá el CSS pasa de apilado a pantalla completa */
    stage.classList.add('is-slider');

    /* ── Entrada del contenido de cada panel ────────────────────────────
       Las letras suben en cascada y pasan del acento al hueso. El color va
       como destello y no como estado: un titular grande en rojo fijo se
       comería solo todo el presupuesto de acento de la página.

       Se construyen ACÁ ADENTRO y no afuera: un fromTo aplica su estado
       inicial apenas se crea, así que fuera de matchMedia dejaría los títulos
       invisibles en mobile, donde nadie los va a animar nunca.

       Una timeline por panel, en pausa. Con restart() no se acumulan tweens
       si el visitante sube y baja sobre la misma costura. */
    const entradas = paneles.map((p, i) =>
      gsap.timeline({ paused: true })
        .fromTo(letras[i],
          { yPercent: 116, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: .72, ease: 'expo.out', stagger: .022 })
        .fromTo(letras[i],
          { color: token('--signal') },
          { color: token('--bone'), duration: .5, ease: 'power2.out', stagger: .022 }, .1)
        .fromTo(restos[i],
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: .6, ease: 'expo.out', stagger: .09 }, .18)
    );

    let activo = -1;
    const activar = (i) => {
      if (i === activo) return;
      activo = i;
      marcar(i);
      entradas[i].restart();
    };

    /* el que está arriba tapa al de abajo */
    paneles.forEach((p, i) => gsap.set(p, { zIndex: i + 1 }));
    gsap.set(outer.slice(1), { yPercent: 100 });
    gsap.set(inner.slice(1), { yPercent: -100 });

    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    for (let i = 0; i < n - 1; i++) {
      tl.to(outer[i],     { yPercent: -100 }, i)   // el actual sube y se va
        .to(inner[i],     { yPercent: 100  }, i)
        .to(outer[i + 1], { yPercent: 0 },    i)   // el siguiente sube y entra
        .to(inner[i + 1], { yPercent: 0 },    i);
    }

    const st = ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: () => '+=' + window.innerHeight * (n - 1),
      pin: true,
      anticipatePin: 1,
      scrub: .55,
      /* `inertia:false` y `directional:false` a propósito: por defecto el snap
         proyecta hacia dónde ibas usando la velocidad, y ante un salto grande
         —el índice de abajo, AvPág, un ancla— esa proyección se pasa de largo
         y termina en el último panel. Así siempre cae en el más cercano. */
      snap: {
        snapTo: 1 / (n - 1),
        duration: { min: .2, max: .5 },
        delay: .06,
        ease: 'power2.inOut',
        inertia: false,
        directional: false
      },
      animation: tl,
      invalidateOnRefresh: true,
      onUpdate: (self) => activar(Math.round(self.progress * (n - 1))),
      /* onEnter además de onUpdate: al entrar a la sección el progreso es 0 y
         no cambia, así que sin esto el primer título se quedaría escondido en
         su estado inicial esperando un movimiento que no llega. */
      onEnter: () => activar(0),
      onEnterBack: () => activar(n - 1)
    });

    /* Las rutas de abajo funcionan como índice: llevan al panel que nombran.
       El scroll va nativo y no con ScrollToPlugin: es un plugin más para
       bajar del CDN por un salto que el navegador ya sabe hacer. */
    const irA = (i) => window.scrollTo({
      top: st.start + (st.end - st.start) * (i / (n - 1)),
      behavior: 'smooth'
    });
    nav.forEach((b, i) => b.addEventListener('click', () => irA(i)));

    /* Al cruzar a mobile se apaga todo y el contenido vuelve a su estado
       normal. El clearProps es imprescindible: sin él los paneles quedarían
       apilados pero con las letras en opacity 0, o sea invisibles. */
    return () => {
      stage.classList.remove('is-slider');
      entradas.forEach((e) => e.kill());
      gsap.set([...letras.flat(), ...restos.flat()], { clearProps: 'all' });
      marcar(0);
    };
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   TRABAJOS — bento con zoom scrubbeado

   La grilla entera escala desde su centro hasta que la celda del medio ocupa
   la pantalla. Las de alrededor se van de cuadro solas, no hay que moverlas
   una por una.

   La clave es la curva: con un ease lineal un zoom se percibe acelerando cada
   vez más, porque lo que el ojo registra es el cambio RELATIVO de tamaño y no
   el absoluto. `expoScale` compensa eso y el acercamiento se siente parejo de
   punta a punta. Es la diferencia entre que parezca un efecto y que parezca
   una cámara.
   ══════════════════════════════════════════════════════════════════════════ */
function bento() {
  const stage = $('#workStage');
  const grid  = $('#bento');
  const hero  = $('.tile--hero', grid || document);
  const cap   = $('#workCap');
  if (!stage || !grid || !hero) return;

  const anillo = $$('.tile:not(.tile--hero)', grid);

  gsap.matchMedia().add('(min-width: 861px)', () => {
    stage.classList.add('is-zoom');

    /* offsetWidth y no getBoundingClientRect: el rect ya viene multiplicado
       por la escala en curso, y acá hace falta la medida de layout. */
    const escala = () => Math.max(
      stage.clientWidth  / hero.offsetWidth,
      stage.clientHeight / hero.offsetHeight
    );
    let S = escala();

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: () => '+=' + window.innerHeight * 1.9,
        pin: true,
        anticipatePin: 1,
        scrub: .7,
        invalidateOnRefresh: true,
        onRefreshInit: () => { S = escala(); }
      }
    });

    tl.fromTo(grid,
        { scale: 1 },
        { scale: () => S, duration: 1, ease: `expoScale(1, ${S})` }, 0)
      /* los pies se apagan enseguida: escalados 4x quedan gigantes */
      .to('.tile__cap', { opacity: 0, duration: .12 }, 0)
      /* La miniatura de la invitación se apaga a mitad de camino y le deja el
         lugar al cartel de verdad. Si se quedara, el "26" escalado 4x chocaría
         con el texto grande que entra después. */
      .to($('.card', hero), { opacity: 0, duration: .2 }, .34)
      /* el panel pierde el marco: un borde de 1px escalado 4x se ve como un
         recuadro claro alrededor de algo que ya ocupa toda la pantalla */
      .to(hero, { borderRadius: 0, borderWidth: 0, duration: .3 }, .25)
      /* el anillo se desvanece cuando ya está fuera de foco */
      .to(anillo, { opacity: 0, duration: .3 }, .42)
      .fromTo(cap, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .22 }, .74);

    return () => {
      stage.classList.remove('is-zoom');
      gsap.set([grid, hero, cap, $('.card', hero), ...anillo, ...$$('.tile__cap', grid)],
        { clearProps: 'all' });
    };
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   REVEALS de sección — un desplazamiento corto, nada de cascadas largas
   ══════════════════════════════════════════════════════════════════════════ */
function reveals() {
  /* los paneles de servicios NO entran acá: ya los mueve el slider, y dos
     animaciones sobre el mismo transform se pisan */
  $$('.shead, .svc__intro, .svc__foot, .ct__left, .ct__right, .ft__lock').forEach((el) => {
    gsap.from(el, {
      y: 26,
      opacity: 0,
      duration: .85,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   FORMULARIO — Web3Forms por fetch, sin recargar
   ══════════════════════════════════════════════════════════════════════════ */
function contactForm() {
  const form = $('#form');
  if (!form) return;

  const nota  = $('#formNote');
  const texto = $('.form__send-t', form);
  const original = texto ? texto.textContent : '';

  const decir = (msg, estado) => {
    if (!nota) return;
    nota.textContent = msg;
    nota.className = 'form__note' + (estado ? ' is-' + estado : '');
  };

  /* TODO el manejador es SÍNCRONO. Ni un await antes de abrir la ventana: el
     navegador sólo deja abrir pestañas dentro del gesto del usuario, y en
     cuanto se cede el control a una promesa el permiso se pierde y el
     bloqueador de popups se come el envío. */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    const datos = Object.fromEntries(new FormData(form).entries());

    /* Honeypot: una persona no ve esa casilla. Se corta en silencio y con cara
       de éxito — avisarle al bot que lo detectamos sólo le enseña a evitarlo. */
    if (datos.botcheck) { decir('Listo, abrí WhatsApp para enviarlo.', 'ok'); return; }

    /* La etiqueta sale del <option> elegido y no de un diccionario acá: así
       agregar un servicio al <select> no obliga a tocar el JS. */
    const svc = $('#f-svc', form);
    const servicio = svc?.selectedOptions[0]?.textContent.trim() || datos.servicio || '—';

    const mensaje = [
      'Hola Lautaro, te escribo desde la web.',
      '',
      'Qué necesito: ' + servicio,
      'Nombre: ' + (datos.nombre || '').trim(),
      'Contacto: ' + (datos.contacto || '').trim(),
      '',
      (datos.text || '').trim()
    ].join('\n');

    const url = WA_BASE + '?text=' + encodeURIComponent(mensaje);

    /* Si el bloqueador igual se lo come, window.open devuelve null: ahí se
       navega en la misma pestaña, que siempre funciona. Perder el mensaje
       escrito por un popup bloqueado sería la peor forma de fallar. */
    const win = window.open(url, '_blank', 'noopener');
    if (!win) { location.href = url; return; }

    form.reset();
    if (texto) texto.textContent = 'Enviado';
    decir('Listo, te abrí WhatsApp con el mensaje escrito. Dale enviar y llega.', 'ok');

    /* Aviso para quien quiera medirlo (hoy js/pixel.js). Va por evento y no
       llamando a fbq() acá: si el píxel no está, o lo bloquearon, o mañana se
       cambia por otro, este archivo no se entera de nada. */
    document.dispatchEvent(new CustomEvent('lm:form-ok'));

    /* el botón vuelve a su texto después de un rato */
    if (texto) setTimeout(() => { texto.textContent = original; }, 4000);
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   PIE — el Hombre de Vitruvio como trama de puntos

   La obra llega ya muestreada desde assets/arte.js (la genera
   tools/gen-arte.mjs). Acá sólo se dibuja: un rectángulo por celda con tinta,
   del tamaño y la opacidad que le toca.

   Cerca del puntero las celdas se agrandan, se corren y pasan al acento, con
   un temblor propio por celda para que parezca ruido y no una mancha lisa.
   La fase del temblor se calcula UNA vez por celda al armar la lista: hacerlo
   por cuadro daría centelleo blanco en vez de movimiento.
   ══════════════════════════════════════════════════════════════════════════ */
function footerArt() {
  const lienzo = $('#ftArt');
  const arte = window.ARTE;
  if (!lienzo || !arte) return;

  const ctx = lienzo.getContext('2d', { alpha: true });
  const { cols, rows, celdas } = arte;

  /* Sólo las celdas con tinta. El pliego es casi todo papel: guardar las
     10.800 y saltearlas por cuadro sería recorrer cinco veces de más. */
  const puntos = [];
  for (let i = 0; i < celdas.length; i++) {
    const q = parseInt(celdas[i], 16);
    if (!q) continue;
    puntos.push({
      cx: i % cols,
      cy: (i / cols) | 0,
      v: q / 15,
      fase: Math.random() * Math.PI * 2,
      /* el orden de aparición sale de una mezcla de posición y azar: sólo
         azar se ve desprolijo, sólo posición se ve como una persiana */
      orden: ((i / cols) | 0) / rows * .55 + Math.random() * .45
    });
  }

  const BONE = token('--bone');
  const SIGNAL = token('--signal');
  const rgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  };
  const [br, bg, bb] = rgb(BONE);
  const [sr, sg, sb] = rgb(SIGNAL);

  /* La proporción del lienzo sale de la grilla y no del CSS: si la obra que
     viene tiene otro formato, el CSS con un valor fijo la estiraría. Así,
     cambiar de obra no obliga a tocar la hoja de estilos. */
  lienzo.style.aspectRatio = `${cols} / ${rows}`;

  let paso = 0, W = 0, H = 0;
  const raton = { x: -9999, y: -9999, activo: false };
  let entrada = REDUCED ? 1 : 0;      // 0..1, lo mueve el ScrollTrigger
  let t = 0;

  function medir() {
    const r = lienzo.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    lienzo.width = Math.round(W * dpr);
    lienzo.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paso = W / cols;
  }

  function dibujar() {
    ctx.clearRect(0, 0, W, H);
    const R = paso * 22;             // alcance del puntero, ~1/5 del ancho
    const R2 = R * R;

    for (const p of puntos) {
      /* aparición escalonada: cada celda tiene su propio umbral */
      const e = Math.max(0, Math.min(1, (entrada - p.orden * .6) / .4));
      if (e <= 0) continue;

      const x = p.cx * paso + paso / 2;
      const y = p.cy * paso + paso / 2;

      let cerca = 0;
      if (raton.activo) {
        const dx = x - raton.x, dy = y - raton.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) / R;
          /* exponente 1.3 y no 2: al cuadrado la caída era tan brusca que
             sólo se encendía el centro y el alcance real se veía la mitad */
          cerca = Math.pow(1 - d, 1.3);
        }
      }

      /* el temblor entra sólo cerca del puntero, si no el pie late siempre */
      const tem = cerca * paso * 1.6;
      const ox = tem * Math.sin(t * 7 + p.fase);
      const oy = tem * Math.cos(t * 6.2 + p.fase * 1.7);
      /* mientras aparece, la celda viene de un poco más abajo */
      const oe = (1 - e) * paso * 6;

      const lado = paso * (.3 + p.v * .52 + cerca * .62);
      const a = (.035 + p.v * .3) * e + cerca * .85;

      const m = cerca;
      ctx.fillStyle = `rgba(${Math.round(br + (sr - br) * m)},${Math.round(bg + (sg - bg) * m)},${Math.round(bb + (sb - bb) * m)},${Math.min(1, a)})`;
      ctx.fillRect(x - lado / 2 + ox, y - lado / 2 + oy + oe, lado, lado);
    }
  }

  /* El bucle corre SÓLO con el pie en pantalla. Un rAF permanente por un
     adorno del final gasta batería en cada scroll del sitio. */
  let vivo = false, rafId = 0;
  const cuadro = () => {
    if (!vivo) return;
    t += 1 / 60;
    dibujar();
    rafId = requestAnimationFrame(cuadro);
  };
  const arrancar = () => { if (!vivo) { vivo = true; cuadro(); } };
  const parar = () => { vivo = false; cancelAnimationFrame(rafId); };

  medir();
  dibujar();

  window.addEventListener('resize', () => { medir(); dibujar(); });

  if (FINE) {
    window.addEventListener('mousemove', (e) => {
      const r = lienzo.getBoundingClientRect();
      raton.x = e.clientX - r.left;
      raton.y = e.clientY - r.top;
      raton.activo = raton.x > -paso * 12 && raton.x < r.width + paso * 12 &&
                     raton.y > -paso * 12 && raton.y < r.height + paso * 12;
    }, { passive: true });
  }

  if (REDUCED) return;               // queda dibujado, quieto y entero

  /* IntersectionObserver y no ScrollTrigger para prender el bucle. Con
     `end: 'bottom top'` el rango termina cuando el pie sale por arriba, cosa
     que en el ÚLTIMO elemento de la página no puede pasar nunca: el trigger
     quedaba con progress 1 e inactivo justo mientras el pie estaba a la
     vista, y el canvas no se dibujaba jamás. "¿Está visible?" es exactamente
     lo que responde IntersectionObserver, sin geometría de por medio. */
  new IntersectionObserver(
    ([e]) => e.isIntersecting ? arrancar() : parar(),
    { threshold: 0 }
  ).observe(lienzo);

  /* Se anima una propiedad REAL de un objeto real. Con `gsap.to({}, ...)` el
     tween no tiene nada que animar y onUpdate no se llama nunca: el canvas
     quedaba en negro y sin un solo píxel pintado. */
  const estado = { p: 0 };
  gsap.to(estado, {
    p: 1,
    duration: 1.6,
    ease: 'power2.out',
    onUpdate: () => { entrada = estado.p; },
    scrollTrigger: { trigger: '.ft', start: 'top 90%', once: true }
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   VARIOS
   ══════════════════════════════════════════════════════════════════════════ */
function setYear() {
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
}

/* Si el CDN de GSAP no llegó, se saca la clase `js` y los estados iniciales
   de CSS dejan de aplicar: el sitio queda completo, quieto y usable. */
function sinGsap() {
  document.documentElement.classList.remove('js');
  $('#pre')?.remove();
  console.warn('[main] GSAP no cargó: el sitio queda sin animaciones.');
}

/* ══════════════════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════════════════ */
function init() {
  setYear();
  contactForm();
  services();

  if (!window.gsap) { sinGsap(); return; }
  gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, ExpoScaleEase);

  header();
  heroVideo();               // decide solo si corresponde bajarlo
  footerArt();               // con reduced-motion se dibuja quieto, no se apaga

  if (REDUCED) {
    $('#pre')?.remove();     // con reduced-motion el preloader directamente no existe
    return;                  // el resto ya quedó visible por CSS
  }

  preloader().then(() => {
    heroIntro();
    heroParallax();
  });

  startScramble();
  servicesSlider();
  bento();
  reveals();

  /* Las fuentes variables cambian la altura de los títulos al cargar:
     sin este refresh los ScrollTrigger quedan calculados sobre el fallback. */
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

init();
