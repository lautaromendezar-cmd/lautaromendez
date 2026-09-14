/* =========================================================================
   Eric Sebastián Torrent — JavaScript del boceto
   Sólo dos cosas: el menú mobile y una animación de aparición.

   Sin type="module" a propósito: así funciona abriendo el HTML con doble
   clic (file://), sin servidor.
   ========================================================================= */

(function () {
  'use strict';

  /* --- Menú mobile ---------------------------------------------------- */

  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');

  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var abierto = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    });

    // Cerrar con Escape y devolver el foco al botón.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });

    // Si se vuelve a desktop con el menú abierto, cerrarlo.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 767 && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- Las palabras del hero, de a una -------------------------------- */
  /* Parte el título y el mantram en <span> y los numera con --i, que es lo
     que el CSS usa para escalonar la entrada. Como los span los crea acá,
     si este script no corre no queda nada invisible: el texto ya está en el
     HTML y se ve entero. No toca nada si el sistema pide movimiento
     reducido, que es cuando falta la clase .js. */

  if (document.documentElement.className.indexOf('js') > -1) {
    var enHero = document.querySelectorAll('.hero__frase, .hero__mantram');
    var orden = 0;

    for (var h = 0; h < enHero.length; h++) {
      orden = partirEnPalabras(enHero[h], orden);
    }
  }

  function partirEnPalabras(el, desde) {
    var palabras = el.textContent.trim().split(/\s+/);
    var fragmento = document.createDocumentFragment();

    for (var i = 0; i < palabras.length; i++) {
      var span = document.createElement('span');
      span.className = 'hero__palabra';
      span.style.setProperty('--i', desde + i);
      span.textContent = palabras[i];
      fragmento.appendChild(span);
      // El espacio va suelto y no dentro del span: si no, al cortar la línea
      // el navegador se queda con un hueco colgando al final del renglón.
      if (i < palabras.length - 1) {
        fragmento.appendChild(document.createTextNode(' '));
      }
    }

    el.textContent = '';
    el.appendChild(fragmento);
    return desde + palabras.length;
  }

  /* --- Visor de fotos -------------------------------------------------- */
  /* Eric pidió el 13-sep poder abrir las fotos: «si yo quiero abrirla no
     tiene para abrir». Esto es el lightbox del boceto; en WordPress lo hace
     el widget Galería de Elementor y este archivo no se traduce.

     Va ANTES del bloque de aparición a propósito: ahí abajo hay un return
     para los navegadores sin IntersectionObserver, y si el visor quedara
     después, en esos navegadores no se armaría.

     El click se escucha en el contenedor, no en cada foto: son 216 y poner
     216 escuchas es tirar memoria al vacío. */

  var muro = document.querySelector('.muro');
  var visor = document.querySelector('.visor');

  if (muro && visor && typeof visor.showModal === 'function') {
    var visorFoto = visor.querySelector('.visor__foto');
    var visorCuenta = visor.querySelector('.visor__cuenta');
    var botones = Array.prototype.slice.call(
      document.querySelectorAll('.muro .muro__item')
    );
    var actual = 0;
    var volverA = null;

    function fotoDe(i) {
      return botones[i] ? botones[i].querySelector('img') : null;
    }

    function pintar(i) {
      // Da la vuelta en las dos puntas: desde la última, "siguiente" va a la
      // primera. Sin esto la flecha queda muerta y parece rota.
      actual = (i + botones.length) % botones.length;
      var img = fotoDe(actual);
      if (!img) return;
      visorFoto.src = img.src;
      visorFoto.alt = img.alt;
      visorCuenta.textContent = (actual + 1) + ' de ' + botones.length;

      // Se le pide al navegador la siguiente y la anterior mientras la
      // persona mira ésta, así la flecha responde de una.
      [actual + 1, actual - 1].forEach(function (v) {
        var vecina = fotoDe((v + botones.length) % botones.length);
        if (vecina) new Image().src = vecina.src;
      });
    }

    function abrir(i) {
      volverA = botones[i] || null;
      pintar(i);
      visor.showModal();
    }

    muro.addEventListener('click', function (e) {
      var item = e.target.closest ? e.target.closest('.muro__item') : null;
      if (!item) return;
      var i = botones.indexOf(item);
      if (i > -1) abrir(i);
    });

    visor.addEventListener('click', function (e) {
      if (e.target.closest('.visor__cerrar')) { visor.close(); return; }
      if (e.target.closest('.visor__paso--antes')) { pintar(actual - 1); return; }
      if (e.target.closest('.visor__paso--despues')) { pintar(actual + 1); return; }
      // Clic en el fondo: el <dialog> ocupa toda la pantalla, así que el
      // fondo es el propio dialog. La foto y los botones ya frenaron arriba.
      if (e.target === visor) visor.close();
    });

    visor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); pintar(actual - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); pintar(actual + 1); }
    });

    // Al cerrar, el foco vuelve a la foto desde la que se abrió: si no,
    // queda al principio de la página y hay que bajar 200 fotos de nuevo.
    visor.addEventListener('close', function () {
      if (volverA) volverA.focus();
    });
  }

  /* --- Aparición al entrar en pantalla -------------------------------- */
  /* La clase .js la agrega un script inline en el <head>, y sólo si el
     navegador NO pide movimiento reducido. Si algo de esto falla, el CSS
     nunca oculta nada: la página se ve completa igual. */

  var elementos = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < elementos.length; i++) {
      elementos[i].classList.add('is-visible');
    }
    return;
  }

  var pendientes = Array.prototype.slice.call(elementos);

  function mostrar(el) {
    el.classList.add('is-visible');
    observador.unobserve(el);
    var i = pendientes.indexOf(el);
    if (i > -1) pendientes.splice(i, 1);
  }

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (entrada.isIntersecting) mostrar(entrada.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

  for (var j = 0; j < elementos.length; j++) {
    observador.observe(elementos[j]);
  }

  /* Red de seguridad: si el scroll da un salto (tecla Fin, un enlace con
     ancla, "buscar en la página", restaurar la posición al volver atrás),
     el observador no llega a ver los elementos que quedaron en el medio y
     se quedarían invisibles para siempre. Acá se revisa quién ya quedó por
     encima del borde inferior de la pantalla y se lo muestra igual. */

  var pedido = false;

  function repasar() {
    pedido = false;
    var limite = window.innerHeight * 0.95;
    for (var k = pendientes.length - 1; k >= 0; k--) {
      if (pendientes[k].getBoundingClientRect().top < limite) mostrar(pendientes[k]);
    }
    if (!pendientes.length) {
      window.removeEventListener('scroll', agendar);
      window.removeEventListener('resize', agendar);
    }
  }

  function agendar() {
    if (pedido) return;
    pedido = true;
    window.requestAnimationFrame(repasar);
  }

  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);
  window.addEventListener('load', agendar);
  agendar();
})();
