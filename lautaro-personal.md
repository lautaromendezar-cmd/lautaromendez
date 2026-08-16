# CLAUDE.md — Sitio personal Lautaro Mendez

## Qué es esto

Sitio one-page de un freelance de diseño y desarrollo web en Buenos Aires.
Es la pieza de venta principal: lo primero que mira alguien antes de pedir
presupuesto. Tiene que verse mejor que el promedio de las agencias locales.

**No es un template.** Si una decisión se puede tomar de dos formas y una es
la que haría cualquiera, tomá la otra y justificá por qué.

---

## Stack — no negociable

- HTML + CSS + JS vanilla. **Sin frameworks, sin build step, sin npm.**
- GSAP 3.15 desde jsDelivr (CDN). Plugins: ScrollTrigger, ScrambleTextPlugin.
  Todos los plugins premium son gratis desde la 3.13 — no hace falta token.
- Google Fonts.
- Deploy en Vercel/Cloudflare Pages: el repo se sube tal cual y anda.

Motivo: el sitio tiene que sobrevivir 3 años sin que nadie corra `npm install`.

---

## Sistema visual

Fondo oscuro, texto claro, **un solo acento** (rojo). El acento ocupa menos del
5% de la superficie visible — aparece en detalles, nunca en bloques grandes.
Referencia de disciplina cromática: el poster de Tron Ares (casi todo gris
azulado, el rojo solo en las estelas de luz).

```css
--void:    #0A0B0D   /* fondo base, negro azulado — NO negro puro */
--carbon:  #101217   /* superficies elevadas */
--steel:   #191C23   /* bordes y separadores */
--fog:     #7D8491   /* texto secundario */
--bone:    #EDEBE8   /* texto principal, blanco cálido — NO #FFF */
--signal:  #FF2D46   /* acento único */
--ember:   #FF7A3D   /* SOLO dentro de degradés, nunca suelto */
```

Reglas: nada de rojo puro sobre negro puro (vibra). Nada de magenta como segundo
acento. Todo color sale de estas variables, cero hex hardcodeado en el CSS.

**Tipografía — dos familias:**

- `Archivo` variable (ejes wdth 62–125, wght 100–900) para display y body.
  Los títulos usan `font-variation-settings:'wdth' 104–118` — el ancho
  expandido es parte de la identidad, no un accidente.
- `JetBrains Mono` para labels, eyebrows, botones y todo texto que se scramblea.

---

## Estructura

```
Preloader → Hero → Franja scramble → Servicios → Bento portfolio → Contacto
```

### 1. Preloader

"LAUTARO" en Archivo 900 expandido, "MENDEZ" en JetBrains Mono 200 con
`letter-spacing:.62em`. El contraste entre las dos fuentes tiene que ser obvio.
Línea de progreso roja de 1px abajo.

- Máximo 1,5s. Sale con `expo.inOut`.
- **Una vez por sesión** vía `sessionStorage`. Si el visitante ya lo vio, se
  remueve del DOM sin animar.
- Con `prefers-reduced-motion`, no existe.

### 2. Hero

Ciudad futurista de Buenos Aires con el Obelisco, **4 capas con parallax de mouse**.

```html
<div class="layer" data-depth="6"><img src="assets/hero/01-sky.svg"></div>
<div class="layer" data-depth="16"><img src="assets/hero/02-skyline.svg"></div>
<div class="layer" data-depth="34"><img src="assets/hero/03-obelisco.svg"></div>
<div class="layer" data-depth="62"><img src="assets/hero/04-foreground.svg"></div>
```

- Movimiento con `gsap.quickTo` sobre `mousemove`, duration .9, `power3.out`.
  El eje Y se mueve la mitad que el X.
- Solo en `pointer:fine`. En mobile, parallax de scroll con ScrollTrigger scrub.
- Las capas van con `inset:-6%` para que no se vea el borde al desplazarse.
- Encima: 2 o 3 estelas rojas finas cruzando el encuadre en loop lento
  (`repeatDelay` random entre 3 y 6s). **Un elemento en movimiento, no diez.**
- Grano sutil por SVG inline en data-URI, opacity .05.

H1 con `overflow:hidden` por línea y entrada `yPercent:112`. El H1 es el LCP:
texto plano, sin scramble, sin JS que lo modifique.

**Si no existen los assets del hero, generalos vos como SVG placeholder**
(edificios en silueta con ventanitas, obelisco como polígono cónico) para que
el parallax se pueda validar antes de tener las imágenes finales.

### 3. Franja scramble

Separador entre hero y servicios, fondo `--carbon`, hairlines arriba y abajo.

```
>  lo próximo que vas a lanzar:   [SCRAMBLE]
```

Cicla: `UNA LANDING PAGE` → `UN SITIO INSTITUCIONAL` → `UN DESARROLLO A MEDIDA`
→ `UNA CAMPAÑA QUE FUNCIONE`. Config: `speed:.42`, `revealDelay:.22`,
`chars:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_'`, 1.7s de pausa entre palabras.

**El elemento va en monoespaciada obligatoriamente** — con fuente proporcional
el texto salta de ancho mientras se arma y parece roto.

Arranca con ScrollTrigger `once:true`, no al cargar la página.

### 4. Servicios

Tres opciones: **Landing Page**, **Sitio Institucional**, **Desarrollo a Medida**.
**Sin precios** — la gente pregunta igual y el precio filtra mal.

**No usar tarjetas.** Filas horizontales tipo spec sheet, que es lo que hace que
no parezca un template. Cada fila: ruta mono (`/landing`), título, descripción,
lista de qué incluye, plazo estimado y CTA.

- Nada de marcadores 01/02/03: no son una secuencia, son opciones paralelas.
  Las rutas (`/landing`) sí codifican algo real y encajan con el rubro.
- Línea roja que se dibuja de izquierda a derecha en el borde inferior al hover.
- El CTA de cada fila preselecciona el servicio en el `<select>` del formulario
  y reescribe el `?text=` del link de WhatsApp.
- Nota al pie mencionando que también hace Google Ads y Meta Ads. Una línea, no
  una sección: el foco de este sitio es desarrollo web.

### 5. Bento portfolio

Preview de 6 piezas con efecto scrubbed. Referencia:
`https://demos.gsap.com/demo/scrubbed-bento-gallery/`

- Grid 3 columnas, `grid-auto-rows:230px`. Un tile `span 2` en filas
  (`tile--tall`) y otro `span 2` en columnas (`tile--wide`).
- Cada tile con `data-speed` entre 0.86 y 1.22. ScrollTrigger `scrub:1`,
  `fromTo` de `y:(1-speed)*90` a `y:(speed-1)*90`.
- Imágenes en grayscale(.55) que pasan a color en hover, con scale 1.04 → 1.1.
- **El scrub se desactiva abajo de 860px** — en mobile marea.
- Todo lleva a `portfolio.html` (otro archivo, se rehace después).
- Placeholders con nombres genéricos: se reemplazan a mano, así que el markup
  de cada tile tiene que ser obvio y repetitivo. Comentario arriba del bloque
  explicando qué tocar.

### 6. Contacto

**WhatsApp como acción principal**, formulario como alternativa. En Argentina
el form convierte mucho peor que WhatsApp.

- Link `wa.me` con mensaje prearmado.
- ~~Formulario vía Web3Forms (`https://api.web3forms.com/submit`), submit por
  `fetch` sin recargar, con estados de envío y error. Honeypot `botcheck`.~~
  ⚠ **Superado.** El formulario no manda un mail: arma un mensaje de WhatsApp
  con las respuestas y lo abre. Sin servicio de terceros, sin clave, sin
  cuota. Lo empujó este mismo párrafo: si el form convierte peor que WhatsApp,
  hacerlo depender de un servicio de mail es pagar un costo por el canal
  malo. El valor del bloque son las preguntas, no el mail. Ver el README.
- Placeholders visibles para lo que hay que completar: número de WhatsApp,
  ~~access key~~, mail, Instagram. (El mail se sacó: no lo usa.)

---

## Calidad — piso obligatorio

- Responsive real hasta 360px. Breakpoints 1080 / 860 / 560.
- `prefers-reduced-motion`: sin preloader, sin parallax, sin scramble, sin
  estelas. El sitio tiene que ser legible y completo igual.
- `:focus-visible` con outline rojo en todo lo interactivo.
- Header fijo que gana fondo con blur después de 80px de scroll.
- Imágenes con `loading="lazy"` y `decoding="async"` menos las del hero.
- Meta Open Graph completos.
- Cuidado con la especificidad del CSS: no generes reglas que se cancelen entre
  sí (típico con paddings entre `.section` y clases hijas).

## Copy

Español rioplatense, voseo, directo. Sin "soluciones digitales", sin
"potenciamos tu marca", sin "transformación digital". Verbos concretos.
El H1 tiene que hacer una afirmación, no describir el rubro.

## Convenciones

- Comentarios en castellano.
- CSS con las variables arriba de todo y secciones separadas por banner.
- JS en funciones nombradas (`heroParallax()`, `startScramble()`, `bento()`)
  llamadas desde un `init()`. Nada de un IIFE gigante.
- Un solo archivo por capa: `index.html`, `css/style.css`, `js/main.js`.
