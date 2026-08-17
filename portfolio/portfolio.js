/* ══════════════════════════════════════════════════════════════════════════
   PORTFOLIO — comportamiento

   Mismo criterio que js/main.js: todo son funciones con nombre que llama
   init() al final. Y la regla que manda por encima de todo: la página tiene
   que quedar COMPLETA y usable sin nada de esto. Nada se esconde desde CSS
   esperando que el JS lo revele — las tarjetas se ven, el titular se lee y
   los filtros funcionan aunque no llegue ni GSAP ni three.js.
   ══════════════════════════════════════════════════════════════════════════ */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const token = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/* ══════════════════════════════════════════════════════════════════════════
   DATOS

   Una sola lista y de acá sale todo: la grilla, los botones de rubro, los
   contadores y el número del hero. Para sumar un proyecto se agrega un objeto
   y no hay que tocar nada más.
   ══════════════════════════════════════════════════════════════════════════ */
const RUBROS = {
  ecommerce:   'E-commerce',
  gastronomia: 'Gastronomía',
  servicios:   'Servicios',
  educacion:   'Educación',
  turismo:     'Turismo',
  industria:   'Industria',
  tecnologia:  'Tecnología',
  otros:       'Otros'
};

const PROYECTOS = [
  { img: 'port-pll.webp',               n: 'PLL Estudio Jurídico',       r: 'Servicios · Estudio jurídico',      cat: 'servicios',   url: 'https://www.estudiopll.com.ar/' },
  { img: 'port-place-vendome.webp',     n: 'Place Vendôme',              r: 'Inmobiliaria · Desarrollo premium', cat: 'otros',       url: 'https://placevendome.com.ar/' },
  { img: 'port-house-in-baires.webp',   n: 'House in Baires',            r: 'Turismo · Alquiler temporario',     cat: 'turismo',     url: 'https://www.houseinbaires.com.ar/' },
  { img: 'port-liliana-donato.webp',    n: 'Liliana Donato',             r: 'Arte · Portfolio de artista',       cat: 'otros',       url: 'https://www.liliana-donato.com.ar/' },
  { img: 'port-einar.webp',             n: 'Einar CNC',                  r: 'Industria · CNC',                   cat: 'industria',   url: 'https://einarcnc.com.ar/' },
  { img: 'port-folimetto.webp',         n: 'Folimetto',                  r: 'Belleza · Capilar',                 cat: 'otros',       url: 'https://folimetto.com.ar/' },
  { img: 'port-vita.webp',              n: 'Consultora Vita',            r: 'Servicios · Consultoría',           cat: 'servicios',   url: 'https://consultoravita.com.ar/' },
  { img: 'port-tecnico-clima.webp',     n: 'Técnico Clima',              r: 'Servicios · Gas y plomería',        cat: 'servicios',   url: 'https://tecnicoclima.com.ar/' },
  { img: 'port-eduardo-luraschi.webp',  n: 'Eduardo Luraschi',           r: 'Educación · Capacitación',          cat: 'educacion',   url: 'https://eduardoluraschi.com.ar/' },
  { img: 'port-indoor-xperience.webp',  n: 'Indoor Xperience',           r: 'Entretenimiento · Racing',          cat: 'otros',       url: 'https://indoorxperience.com/' },
  { img: 'port-luxor-transfers.webp',   n: 'Luxor Transfers',            r: 'Turismo · Transfers',               cat: 'turismo',     url: 'https://luxortransfers.com.ar/' },
  { img: 'port-alimentar-trabajo.webp', n: 'Alimentar Trabajo',          r: 'Servicios · Consultoría',           cat: 'servicios',   url: 'https://alimentartrabajo.com.ar/' },
  { img: 'port-si-jolie.webp',          n: 'Si Jolie',                   r: 'Educación · Instituto',             cat: 'educacion',   url: 'https://sijolie.com.ar/' },
  { img: 'port-uantu-turismo.webp',     n: 'Uantu Turismo',              r: 'Turismo · Agencia',                 cat: 'turismo',     url: 'https://uantuturismo.com.ar/' },
  { img: 'port-centenaria.webp',        n: 'Yerba Centenaria',           r: 'E-commerce · Yerba mate',           cat: 'ecommerce',   url: 'https://yerbamatecentenaria.com.ar/' },
  { img: 'port-learngroup.webp',        n: 'Learn Group App',            r: 'Educación · Escuela online de IA',  cat: 'educacion',   url: 'https://learngroupapp.com/' },
  { img: 'port-jaque-empanadas.webp',   n: 'Jaque Empanadas',            r: 'Gastronomía · Local SEO',           cat: 'gastronomia', url: 'https://empanadasjaque.com.ar/' },
  { img: 'port-el-sol.webp',            n: 'El Sol Panadería',           r: 'Gastronomía · Panadería',           cat: 'gastronomia', url: 'https://elsolpanaderiayconfiteria.com.ar/' },
  { img: 'port-arsak.webp',             n: 'Arsak SRL',                  r: 'Industria · B2B',                   cat: 'industria',   url: 'https://arsak.com.ar/' },
  { img: 'port-drager.webp',            n: 'Drager Solutions',           r: 'Tecnología · Leads B2B',            cat: 'tecnologia',  url: 'https://dragersolutions.com.ar/' },
  { img: 'port-digital-crams.webp',     n: 'Digital CRAMS',              r: 'Tecnología · Catálogo',             cat: 'tecnologia',  url: 'https://dcrams.com.ar/' },
  { img: 'port-variedad-online.webp',   n: 'Variedad Online',            r: 'E-commerce · Tienda',               cat: 'ecommerce',   url: 'https://variedadonline.com.ar/' },
  { img: 'port-yerba-latina.webp',      n: 'Yerba Latina',               r: 'E-commerce · Yerba mate',           cat: 'ecommerce',   url: 'https://yerbamatelatina.com.ar/' },
  { img: 'port-evelyn.webp',            n: 'Evelyn Orozco',              r: 'Portfolio · Arte visual',           cat: 'otros',       url: 'https://evvyart.com.ar/' },
  { img: 'port-jorgeribak.webp',        n: 'Jorge Ribak',                r: 'Magia · One-page',                  cat: 'otros',       url: 'https://jorgeribak.com.ar/' },
  { img: 'port-federestivo.webp',       n: 'Fede Restivo',               r: 'Fitness · Entrenamiento',           cat: 'otros',       url: 'https://federestivo.com/' },
  { img: 'port-aldetalle.webp',         n: 'Al Detalle Motos',           r: 'E-commerce · Repuestos',            cat: 'ecommerce',   url: 'https://aldetallemotos.com.ar/' },
  { img: 'port-elite.webp',             n: 'Elite Movil Accesorios',     r: 'E-commerce · Accesorios celular',   cat: 'ecommerce',   url: 'https://elitemovil.com.ar/' },
  { img: 'port-barba.webp',             n: 'Grupo Barba',                r: 'Distribución · One-page',           cat: 'otros',       url: 'https://grupobarba.com.ar/' },
  { img: 'port-tiendanube-barba.webp',  n: 'Tienda Nube Grupo Barba',    r: 'E-commerce · Tienda Nube',          cat: 'ecommerce',   url: 'https://distribuidoragrupobarba.mitiendanube.com/' },
  { img: 'port-santabarrica.webp',      n: 'Santa Barrica',              r: 'E-commerce · Tienda de vinos',      cat: 'ecommerce',   url: 'https://www.santabarrica.com.ar/apps/lp/club-barriquero' },
  { img: 'port-tr3.webp',               n: 'TR3 Viajes y Turismo',       r: 'Turismo · Hotelería',               cat: 'turismo',     url: 'https://www.tr3viajesyturismo.com/' },
  { img: 'port-magicdoor.webp',         n: 'Magic Door',                 r: 'Servicios · Eventos para empresas', cat: 'servicios',   url: 'https://www.magicdoor.com.ar/' },
  { img: 'port-adequate.webp',          n: 'Adequate',                   r: 'Inmobiliaria · Landing page',       cat: 'otros',       url: 'https://adequate.lat/' },
  { img: 'port-bacity.webp',            n: 'Buenos Aires City Transfers', r: 'Turismo · Transfers',              cat: 'turismo',     url: 'https://www.transferbuenosairescity.com/' }
];

/* ══════════════════════════════════════════════════════════════════════════
   GRILLA

   Se arma en un fragment y se inserta de una: 34 appendChild sueltos son 34
   recálculos de layout.
   ══════════════════════════════════════════════════════════════════════════ */
function grilla() {
  const grid = $('#pfGrid');
  if (!grid) return;

  const flecha =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';

  const frag = document.createDocumentFragment();

  PROYECTOS.forEach((p) => {
    const a = document.createElement('a');
    a.className = 'pf-card';
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.dataset.cat = p.cat;
    /* El nombre y el rubro ya están en el epígrafe visible; lo que un lector
       de pantalla no puede deducir es que el link sale a otro sitio. */
    a.setAttribute('aria-label', p.n + ' — ' + p.r + ' (abre el sitio en otra pestaña)');

    a.innerHTML =
      '<img class="pf-card__img" src="trabajos/' + p.img + '" alt="Captura del sitio de ' + p.n + '"' +
      ' loading="lazy" decoding="async" width="1600" height="900">' +
      '<span class="pf-card__go">' + flecha + 'Ver sitio</span>' +
      '<span class="pf-card__cap">' +
        '<b class="pf-card__n">' + p.n + '</b>' +
        '<i class="pf-card__r">' + RUBROS[p.cat] + ' · ' + p.r.split(' · ').pop() + '</i>' +
      '</span>';

    frag.appendChild(a);
  });

  grid.appendChild(frag);
}

/* ══════════════════════════════════════════════════════════════════════════
   FILTROS

   Los botones salen de los rubros que REALMENTE tienen proyectos: si mañana
   se va el último de gastronomía, el botón desaparece solo en vez de quedar
   ofreciendo una categoría vacía.
   ══════════════════════════════════════════════════════════════════════════ */
function filtros() {
  const bar  = $('#pfBar');
  const grid = $('#pfGrid');
  if (!bar || !grid) return;

  const cuenta = (cat) =>
    cat === 'all' ? PROYECTOS.length : PROYECTOS.filter((p) => p.cat === cat).length;

  const usados = Object.keys(RUBROS).filter((c) => cuenta(c) > 0);

  ['all'].concat(usados).forEach((cat, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pf-f';
    b.dataset.cat = cat;
    b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    b.innerHTML = (cat === 'all' ? 'Todos' : RUBROS[cat]) +
                  '<span class="pf-f__n">' + cuenta(cat) + '</span>';
    bar.appendChild(b);
  });

  const vacio = $('#pfEmpty');
  let actual = 'all';
  let timer  = null;

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.pf-f');
    if (!btn || btn.dataset.cat === actual) return;
    actual = btn.dataset.cat;

    $$('.pf-f', bar).forEach((b) =>
      b.setAttribute('aria-pressed', String(b === btn)));

    const cards = $$('.pf-card', grid);
    const entra = (el) => actual === 'all' || el.dataset.cat === actual;

    /* Dos tiempos: primero se desvanece lo que se va (la clase), y recién
       después se saca del flujo. Al revés la grilla pega un salto seco. */
    cards.forEach((el) => { if (!entra(el)) el.classList.add('is-out'); });

    clearTimeout(timer);
    timer = setTimeout(() => {
      let visibles = 0;
      cards.forEach((el) => {
        const va = entra(el);
        el.hidden = !va;
        el.classList.remove('is-out');
        if (va) visibles++;
      });
      if (vacio) vacio.hidden = visibles > 0;
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }, REDUCED ? 0 : 240);
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   CONTADORES del hero — el número sale de la lista, nunca escrito a mano
   ══════════════════════════════════════════════════════════════════════════ */
function contadores() {
  const nEl = $('#pfN');
  const rEl = $('#pfR');
  const total  = PROYECTOS.length;
  const rubros = new Set(PROYECTOS.map((p) => p.cat)).size;

  if (rEl) rEl.textContent = rubros;
  if (!nEl) return;

  if (REDUCED || !window.gsap) { nEl.textContent = total; return; }

  const obj = { v: 0 };
  gsap.to(obj, {
    v: total,
    duration: 1.1,
    ease: 'expo.out',
    /* onUpdate y no un tween sobre textContent: gsap.to({}) no dispara
       onUpdate si el objeto no tiene la propiedad que se anima */
    onUpdate: () => { nEl.textContent = Math.round(obj.v); },
    onComplete: () => { nEl.textContent = total; }
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   HEADER — igual que en la home: fondo con blur a los 80px + progreso
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
   REVEALS — el mismo desplazamiento corto de la home.

   clearProps al terminar es obligatorio: si GSAP deja el transform en línea,
   le gana al translateY(-3px) del hover y las tarjetas dejan de levantarse.
   ══════════════════════════════════════════════════════════════════════════ */
function reveals() {
  $$('.pf-card').forEach((el) => {
    gsap.from(el, {
      y: 22,
      opacity: 0,
      duration: .8,
      ease: 'expo.out',
      clearProps: 'opacity,transform',
      scrollTrigger: { trigger: el, start: 'top 94%' }
    });
  });

  $$('.pf-end .eyebrow, .pf-end__t, .pf-end__d, .pf-end__acts, .ft__lock').forEach((el) => {
    gsap.from(el, {
      y: 26,
      opacity: 0,
      duration: .85,
      ease: 'expo.out',
      clearProps: 'opacity,transform',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   SHADER de las capturas — onda + separación de canales según la velocidad
   del scroll.

   Va en WebGL crudo y no con three.js. Dos razones: el sitio entero se
   sostiene con GSAP y nada más, y meter 600 KB de librería para un split de
   canales no se paga. (De paso: la versión anterior pedía
   three@0.169/build/three.min.js, que devuelve 404 porque three sacó el build
   UMD hace varias versiones. El efecto nunca llegó a correr.)

   Cuatro cosas que NO son detalle:

   1. La captura <img> queda VISIBLE debajo del canvas, no oculta. El navegador
      aguanta unos 16 contextos WebGL vivos: con 34 tarjetas, esconder la
      imagen significaba que al pasar ese tope las más viejas se quedaban en
      blanco. Con la foto abajo, perder el contexto sólo cuesta el efecto.
   2. Al salir de pantalla el contexto se DESTRUYE, no se pausa. Sin eso se
      acumulan hasta el tope y el navegador empieza a matarlos solo, en el
      orden que se le canta.
   3. Abrir el sitio desde el disco deja las capturas como origen opaco y
      texImage2D tira SecurityError — el mismo motivo por el que la obra del
      pie viene precocinada en assets/arte.js. Por eso la subida de la textura
      va adentro de un try: con file:// queda la foto y listo.
   4. Abajo de 860px no se instancia nada: son 34 texturas sobre una GPU de
      teléfono, justo donde peor se conecta. Mismo corte que el zoom del bento.
   ══════════════════════════════════════════════════════════════════════════ */
function shader() {
  if (REDUCED || !window.gsap) return;
  if (!matchMedia('(min-width: 861px)').matches) return;

  /* Velocidad del scroll compartida por todas las tarjetas: un solo
     ScrollTrigger para las 34, no uno por tarjeta. */
  const vel = { v: 0, s: 0 };
  const clamp = gsap.utils.clamp(-2000, 2000);

  ScrollTrigger.create({
    start: 0,
    end: () => document.documentElement.scrollHeight - window.innerHeight,
    onUpdate: (self) => {
      const norm = clamp(self.getVelocity()) / 1000;
      const str  = Math.min(1, Math.abs(norm));
      if (str > Math.abs(vel.s)) {
        vel.v = norm; vel.s = str;
        gsap.to(vel, { v: 0, s: 0, duration: .8, ease: 'sine.inOut', overwrite: true });
      }
    }
  });

  /* El recorte "cover" se resuelve acá y no en CSS: el quad ocupa la tarjeta
     entera y lo que se ajusta son las coordenadas de la textura. */
  const VERT = `
    attribute vec2 aPos;
    varying vec2 vUv;
    uniform vec2 uTexSize, uQuadSize;
    void main() {
      vec2 uv = aPos * 0.5 + 0.5;
      float texR  = uTexSize.x / uTexSize.y;
      float quadR = uQuadSize.x / uQuadSize.y;
      vec2 s = vec2(1.0);
      if (quadR > texR) { s.y = texR / quadR; } else { s.x = quadR / texR; }
      vUv = uv * s + (1.0 - s) * 0.5;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }`;

  const FRAG = `
    precision mediump float;
    uniform sampler2D uTex;
    uniform float uTime, uVel, uStr;
    varying vec2 vUv;
    void main() {
      vec2  tc  = vUv;
      float amt = 0.03 * uStr;
      float t   = uTime * 0.8;
      tc.y += sin((tc.x * 8.0) + t) * amt;
      tc.x += cos((tc.y * 6.0) - t * 0.8) * amt * 0.6;
      float d = sign(uVel);
      float r = texture2D(uTex, tc + vec2( amt * 0.50 * d, 0.0)).r;
      float g = texture2D(uTex, tc + vec2( amt * 0.25 * d, 0.0)).g;
      float b = texture2D(uTex, tc + vec2(-amt * 0.35 * d, 0.0)).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }`;

  function compilar(gl, tipo, src) {
    const sh = gl.createShader(tipo);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('[portfolio] shader:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function montar(card) {
    const img = $('.pf-card__img', card);
    if (!img || !img.complete || !img.naturalWidth) return false;

    const canvas = document.createElement('canvas');
    canvas.className = 'pf-card__gl';

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false });
    if (!gl) return false;   /* sin WebGL queda la foto, que es exactamente lo mismo */

    const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
    const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    /* la imagen viene de arriba hacia abajo y la textura de abajo hacia
       arriba: sin esto la captura sale dada vuelta */
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    /* las capturas no son potencia de dos: sin CLAMP_TO_EDGE y sin mipmaps
       WebGL devuelve negro */
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    } catch (e) {
      /* file:// — origen opaco. Queda la foto sola, que es lo mismo. */
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return false;
    }

    const uTex      = gl.getUniformLocation(prog, 'uTex');
    const uTexSize  = gl.getUniformLocation(prog, 'uTexSize');
    const uQuadSize = gl.getUniformLocation(prog, 'uQuadSize');
    const uTime     = gl.getUniformLocation(prog, 'uTime');
    const uVel      = gl.getUniformLocation(prog, 'uVel');
    const uStr      = gl.getUniformLocation(prog, 'uStr');

    gl.uniform1i(uTex, 0);
    gl.uniform2f(uTexSize, img.naturalWidth, img.naturalHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const medir = () => {
      const w = Math.max(card.clientWidth, 1);
      const h = Math.max(card.clientHeight, 1);
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uQuadSize, w, h);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(card);

    card.appendChild(canvas);

    let t = 0;
    const tick = (time, delta) => {
      t += delta * 0.001;
      gl.uniform1f(uTime, t);
      gl.uniform1f(uVel, vel.v);
      gl.uniform1f(uStr, vel.s);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    gsap.ticker.add(tick);

    card._gl = () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      canvas.remove();
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs); gl.deleteShader(fs);
      /* liberar el contexto a mano, no esperar al recolector: es justo lo que
         mantiene la cuenta abajo del tope del navegador */
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      card._gl = null;
    };
    return true;
  }

  /* ── Tope duro de contextos ──────────────────────────────────────────────
     Salir de pantalla no alcanza como única baja. En un monitor grande entran
     cuatro filas de tres y con el margen del observer se llegaba a 18 vivos a
     la vez: por arriba de ~16 Chrome empieza a matar los más viejos por su
     cuenta y aparecen tarjetas en blanco. Acá el desalojo lo decidimos
     nosotros y se va SIEMPRE el más lejano del centro de la pantalla, que es
     el que menos se está mirando. Quedarse sin efecto no se nota: abajo está
     la foto. */
  const TOPE = 10;
  const vivos = new Set();

  const distancia = (el) => {
    const r = el.getBoundingClientRect();
    return Math.abs((r.top + r.bottom) / 2 - window.innerHeight / 2);
  };

  const bajar = (card) => { card._gl?.(); vivos.delete(card); };

  const alta = (card) => {
    if (card._gl) return;
    if (vivos.size >= TOPE) {
      let lejano = null, max = -1;
      vivos.forEach((c) => { const d = distancia(c); if (d > max) { max = d; lejano = c; } });
      /* si el candidato a entrar está más lejos que el peor de los que ya
         están, no vale la pena el cambio */
      if (!lejano || max <= distancia(card)) return;
      bajar(lejano);
    }
    if (montar(card)) vivos.add(card);
  };

  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      const card = e.target;
      if (!e.isIntersecting) { bajar(card); return; }

      const img = $('.pf-card__img', card);
      /* con loading="lazy" la captura suele estar a mitad de camino cuando la
         tarjeta asoma: se espera al load y recién ahí se monta */
      if (img && !img.complete) img.addEventListener('load', () => alta(card), { once: true });
      else alta(card);
    });
  }, { rootMargin: '80px 0px' });

  $$('.pf-card').forEach((c) => io.observe(c));
}

/* ══════════════════════════════════════════════════════════════════════════
   TITULAR — las letras se arman desde formas geométricas (MorphSVG).

   El texto plano del <svg> es el estado de reposo y se ve siempre. Recién
   cuando se pudo bajar y parsear la fuente se lo apaga y entran los paths.
   Cualquier eslabón que falle —el CDN, el fetch, el parseo— deja el titular
   legible: por eso todo cuelga de un .catch() que no hace nada.

   Del rojo: entra SÓLO el punto final, que es el mismo gesto del punto de
   "Lautaro Mendez." del logotipo. Las 15 letras restantes van de gris a
   hueso. Con la paleta vieja las 16 entraban en violeta a la vez; en este
   sistema eso se comería de un saque todo el presupuesto de acento.
   ══════════════════════════════════════════════════════════════════════════ */
function titular() {
  const svg = $('#pfH1');
  if (!svg || REDUCED) return;
  if (!window.gsap || !window.MorphSVGPlugin || !window.opentype) return;

  gsap.registerPlugin(MorphSVGPlugin);

  const FUENTE = 'https://cdn.jsdelivr.net/npm/@fontsource/archivo/files/archivo-latin-300-normal.woff';
  const NS = 'http://www.w3.org/2000/svg';
  const FS = 150;
  const LINEAS = [{ txt: 'Proyectos', y: 160 }, { txt: 'reales.', y: 330 }];

  const GRIS   = token('--fog')    || '#7D8491';
  const HUESO  = token('--bone')   || '#EDEBE8';
  const SIGNAL = token('--signal') || '#FF2D46';

  fetch(FUENTE)
    .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(res.status))))
    .then((buf) => armar(opentype.parse(buf)))
    .catch(() => { /* queda el texto plano, que ya está en pantalla */ });

  /* opentype.js devuelve comandos Q (cuadráticos) para fuentes TrueType.
     MorphSVG sólo entiende M/L/C/Z: si le llega una Q toma la cadena entera
     por un selector CSS y revienta en querySelectorAll. Se elevan a cúbicas. */
  function aCubicas(path) {
    let d = '', x = 0, y = 0;
    for (const c of path.commands) {
      if (c.type === 'M' || c.type === 'L') {
        d += c.type + c.x.toFixed(2) + ' ' + c.y.toFixed(2) + ' ';
        x = c.x; y = c.y;
      } else if (c.type === 'Q') {
        d += 'C' + (2 / 3 * c.x1 + 1 / 3 * x).toFixed(2) + ' ' + (2 / 3 * c.y1 + 1 / 3 * y).toFixed(2)
           + ' ' + (2 / 3 * c.x1 + 1 / 3 * c.x).toFixed(2) + ' ' + (2 / 3 * c.y1 + 1 / 3 * c.y).toFixed(2)
           + ' ' + c.x.toFixed(2) + ' ' + c.y.toFixed(2) + ' ';
        x = c.x; y = c.y;
      } else if (c.type === 'C') {
        d += 'C' + c.x1.toFixed(2) + ' ' + c.y1.toFixed(2) + ' ' + c.x2.toFixed(2) + ' '
           + c.y2.toFixed(2) + ' ' + c.x.toFixed(2) + ' ' + c.y.toFixed(2) + ' ';
        x = c.x; y = c.y;
      } else if (c.type === 'Z') {
        d += 'Z ';
      }
    }
    return d.trim();
  }

  /* Formas de reposo, todas centradas en el mismo punto que la letra que van
     a formar: así el morph no arrastra la pieza por la pantalla. */
  const FORMAS = [
    (cx, cy, r) => { const d = r.toFixed(1), x = (cx - r).toFixed(1), w = (2 * r).toFixed(1);
                     return `M${x},${cy.toFixed(1)} a${d},${d} 0 1,0 ${w},0 a${d},${d} 0 1,0 -${w},0 Z`; },
    (cx, cy, r) => `M${(cx - r).toFixed(1)},${(cy - r).toFixed(1)} L${(cx + r).toFixed(1)},${(cy - r).toFixed(1)} `
                 + `L${(cx + r).toFixed(1)},${(cy + r).toFixed(1)} L${(cx - r).toFixed(1)},${(cy + r).toFixed(1)} Z`,
    (cx, cy, r) => `M${cx.toFixed(1)},${(cy - r).toFixed(1)} L${(cx + r).toFixed(1)},${cy.toFixed(1)} `
                 + `L${cx.toFixed(1)},${(cy + r).toFixed(1)} L${(cx - r).toFixed(1)},${cy.toFixed(1)} Z`,
    (cx, cy, r) => `M${cx.toFixed(1)},${(cy - r).toFixed(1)} L${(cx + r).toFixed(1)},${(cy + r).toFixed(1)} `
                 + `L${(cx - r).toFixed(1)},${(cy + r).toFixed(1)} Z`
  ];

  function armar(fuente) {
    const letras = [];
    const caja = { x2: 0, y1: Infinity, y2: -Infinity };

    LINEAS.forEach((ln) => {
      /* getPaths() ya devuelve una Path por carácter, escalada y ubicada.
         El offset alinea la tinta contra x=0: el titular va a la izquierda,
         igual que el H1 de la home, no centrado. */
      const bb = fuente.getPath(ln.txt, 0, 0, FS, { kerning: true }).getBoundingBox();
      fuente.getPaths(ln.txt, -bb.x1, ln.y, FS, { kerning: true }).forEach((p, i) => {
        const b = p.getBoundingBox();
        if (!b || !isFinite(b.x1) || b.x2 <= b.x1) return;
        caja.x2 = Math.max(caja.x2, b.x2);
        caja.y1 = Math.min(caja.y1, b.y1);
        caja.y2 = Math.max(caja.y2, b.y2);
        letras.push({
          d: aCubicas(p),
          cx: (b.x1 + b.x2) / 2,
          cy: (b.y1 + b.y2) / 2,
          r: Math.max(b.x2 - b.x1, b.y2 - b.y1) * 0.54,
          /* el punto final: último carácter de la última línea */
          punto: ln.txt.endsWith('.') && i === ln.txt.length - 1
        });
      });
    });

    if (!letras.length) return;

    /* El lienzo se recorta a la tinta REAL, alto incluido. Con el viewBox
       fijo de 400 sobraban ~90px muertos abajo de la última línea: como el
       <svg> escala por ancho, ese aire se traducía en un hero de casi 500px
       que empujaba la grilla entera abajo del pliegue. */
    const m = 4;
    const ancho = Math.ceil(caja.x2 + m * 2);
    svg.setAttribute('viewBox',
      [-m, Math.floor(caja.y1 - m), ancho, Math.ceil(caja.y2 - caja.y1 + m * 2)].join(' '));
    /* el ancho medido va al CSS: de ahí sale el tamaño en em (ver .pf-h1) */
    svg.style.setProperty('--pf-h1-w', ancho);

    const piezas = letras.map((l, i) => {
      const forma = FORMAS[i % FORMAS.length](l.cx, l.cy, l.r);
      const el = document.createElementNS(NS, 'path');
      el.setAttribute('d', forma);
      el.setAttribute('fill', l.punto ? SIGNAL : GRIS);
      svg.appendChild(el);
      return { el, forma, letra: l.d, fin: l.punto ? SIGNAL : HUESO, reposo: l.punto ? SIGNAL : GRIS };
    });

    /* recién ahora se apaga el texto plano */
    gsap.set($$('.pf-h1__t', svg), { autoAlpha: 0 });

    ciclo(piezas);
  }

  function ciclo(piezas) {
    const ENTRA = .62, PASO = .055, QUIETO = 3.4, SALE = .46, PASO_S = .04;
    const n = piezas.length;
    const finEntrada = (n - 1) * PASO + ENTRA;

    const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(1.1, () => ciclo(piezas)) });

    piezas.forEach((p, i) => {
      tl.to(p.el, {
        morphSVG: { shape: p.letra, type: 'rotational' },
        attr: { fill: p.fin },
        duration: ENTRA,
        ease: 'power3.inOut'
      }, i * PASO);
    });

    /* El descanso es largo a propósito: el titular tiene que leerse armado la
       mayor parte del tiempo. Un ciclo corto lo vuelve un cartel parpadeando. */
    tl.to({ x: 0 }, { x: 1, duration: QUIETO }, finEntrada);

    piezas.forEach((p, i) => {
      tl.to(p.el, {
        morphSVG: { shape: p.forma, type: 'rotational' },
        attr: { fill: p.reposo },
        duration: SALE,
        ease: 'power3.in'
      }, finEntrada + QUIETO + (n - 1 - i) * PASO_S);
    });
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   VARIOS
   ══════════════════════════════════════════════════════════════════════════ */
function setYear() {
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
}

/* ══════════════════════════════════════════════════════════════════════════
   INIT

   Primero lo que tiene que andar SIEMPRE (grilla, filtros, contadores) y
   recién después lo que depende de GSAP. Si el CDN no llegó, la página ya
   quedó armada y navegable unas líneas más arriba.
   ══════════════════════════════════════════════════════════════════════════ */
function init() {
  setYear();
  grilla();
  filtros();
  contadores();

  if (!window.gsap || !window.ScrollTrigger) {
    console.warn('[portfolio] GSAP no cargó: la página queda sin animaciones.');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  header();
  titular();

  if (REDUCED) return;   /* el resto es adorno y ya está todo visible */

  reveals();
  shader();

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

init();
