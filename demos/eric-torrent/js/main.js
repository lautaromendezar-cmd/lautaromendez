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
