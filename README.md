# lautaromendez.com.ar

Sitio personal one-page. HTML + CSS + JS vanilla, sin build step y sin `npm install`.
Se sube tal cual a Vercel o Cloudflare Pages y anda.

```
index.html          la página entera
404.html            la sirve Vercel para cualquier ruta que no exista
robots.txt          apunta al sitemap
sitemap.xml         dos URLs, a mano
vercel.json         redirects, trailingSlash, headers de caché y seguridad
css/style.css       una sola hoja, secciones separadas por banner
js/main.js          funciones con nombre llamadas desde init()
assets/hero/        el video del hero + su imagen fija (parallax/ y vectorial/ archivados)
assets/work/        las 8 capturas del bento
assets/og.jpg       imagen de Open Graph (1200×630)
assets/arte.js      La escuela de Atenas como grilla de puntos (pie)
assets/favicon.svg
portfolio/          la grilla completa — mismo sistema visual, ver portfolio/portfolio.md
tools/              generadores y chequeos — el sitio NO los necesita
```

Dependencias externas: GSAP 3.15 y Google Fonts, las dos por CDN. Nada más.
El portfolio suma dos plugins de GSAP (MorphSVG) y opentype.js, los tres
opcionales: si no llegan, esa página queda completa igual.

---

## Falta completar

**1. Access key de Web3Forms.** El formulario no envía hasta que se cargue.
Se saca gratis en [web3forms.com](https://web3forms.com) poniendo un mail: la clave
llega por correo. Va en `index.html`, en el `<input type="hidden" name="access_key">`
que hoy dice `REEMPLAZAR-CON-TU-ACCESS-KEY-DE-WEB3FORMS`.

Mientras esté sin poner, el formulario avisa en pantalla en vez de tirar un error
raro de la API.

**2. Revisar el copy de servicios.** Los plazos y los ítems de "qué incluye"
están propuestos, no dictados:

| Servicio | Plazo puesto |
|---|---|
| `/landing` | 7 a 10 días |
| `/institucional` | 3 a 4 semanas |
| `/a-medida` | Según alcance |

**3. El contador de proyectos está escrito a mano en tres lugares** de este
`index.html`: `.hero__meta`, el `.card__n` de la celda 5 del bento y el
`.work__cap-t`, que lo dice con letras ("Treinta y cuatro proyectos"). La
verdad la tiene el array `PROYECTOS` de `portfolio/portfolio.js`, y
`tools/check.mjs` compara los dos y falla si no coinciden — que es como se
descubrió que acá decía 26 mientras el portfolio ya tenía 34.

---

## Cómo cambiar cosas

**Una pieza del bento.** Guardá la captura en `assets/work/` (webp, 16:9) y en
el `<a class="tile">` que corresponda cambiá `src`, `alt` y los dos textos del
`<span>`.

Las 8 del anillo van a 900px de ancho: nunca se ven grandes.

**La celda 5 no es un trabajo: es la invitación al portfolio.** Es la única
sin foto, y eso está buscado — la vuelve el punto de fuga de la grilla, que es
justo por donde el zoom entra. Una captura de web ampliada 4x no le dice nada
a nadie; que el final sea "acá está todo el portfolio" sí.

Ventaja de arrastre: al ser color y texto en vez de un bitmap, se rasteriza
sola y a 4x no se ablanda. Con una foto en el centro había que preocuparse por
la resolución de origen.

La grilla tiene que seguir siendo **3×3 simétrica** y la invitación tiene que
seguir en la **posición 5**. El zoom escala desde `50% 50%`, que es exactamente
el centro de esa celda; si metés una que ocupe dos columnas, ese punto deja de
coincidir y el encuadre final queda corrido.

El contador ("26") está escrito a mano en dos lugares: la celda chica
(`.card__n`) y el cartel final (`.work__cap-t`). No hay JS que lo calcule.

**El hero es un video en loop sobre una imagen fija.** Los prompts que lo
generaron están en `tools/prompts-hero-v2.md`.

```
hero-poster.jpg   99 KB   primer fotograma. SIEMPRE presente: es el LCP y es
                          lo único que se ve con reduced-motion, en mobile o
                          si el navegador bloquea el autoplay.
hero.webm        603 KB   el loop. Lo carga el JS, no el HTML.
hero.mp4         923 KB   respaldo para Safari.
```

El `<video>` va **sin `src` ni `<source>` en el HTML** a propósito:
`heroVideo()` en `js/main.js` decide si vale la pena bajarlo y recién ahí los
inyecta. No lo baja si hay `prefers-reduced-motion`, si el visitante tiene
ahorro de datos activado, o si la pantalla mide menos de 861px — en el
teléfono el recorte vertical se come la composición y el megabyte pega justo
donde peor se conecta.

### Rehacer el loop desde un video nuevo

El original tiene un push-in lento, así que **cortado en seco el salto del
loop se ve**. La receta le funde el final contra el arranque:

```bash
# ajustar duración (D) y solape (X=1.2); offset = D - 2*X
ffmpeg -i original.mp4 -filter_complex "\
[0:v]split[b][p];\
[b]trim=start=1.2,setpts=PTS-STARTPTS,scale=1600:-2[body];\
[p]trim=duration=1.2,setpts=PTS-STARTPTS,scale=1600:-2[pre];\
[body][pre]xfade=transition=fade:duration=1.2:offset=3.641667,format=yuv420p[v]" \
-map "[v]" -an -c:v libx264 -crf 16 -preset slow loop-master.mp4

ffmpeg -i loop-master.mp4 -c:v libvpx-vp9 -crf 28 -b:v 0 -row-mt 1 \
  -deadline good -cpu-used 1 -pix_fmt yuv420p -an hero.webm
ffmpeg -i loop-master.mp4 -c:v libx264 -crf 23 -preset slow -tune film \
  -pix_fmt yuv420p -movflags +faststart -an hero.mp4
ffmpeg -i loop-master.mp4 -frames:v 1 -q:v 3 hero-poster.jpg
```

Escena oscura y lenta comprime muy bien: no hace falta apretar el CRF, y
apretarlo produce bandas feas en los degradés del cielo.

**La obra del pie.** Es un detalle de *La escuela de Atenas* de Rafael
(1509-1511, dominio público, escaneo de Wikimedia) dibujado como trama de
puntos en un `<canvas>` a todo el ancho. Es el sector del que salió la tapa de
*Use Your Illusion*. Cerca del puntero las celdas se agrandan, tiemblan y
pasan al acento.

Los datos vienen **precocinados** en `assets/arte.js` (18 KB): una grilla de
208×89 con 16 niveles de tinta, un carácter por celda. No es capricho —
`getImageData` sobre una imagen cargada desde `file://` tira `SecurityError`
porque el canvas queda *tainted*, y este sitio se abre desde el disco. De paso,
el navegador no decodifica ni recorre ninguna imagen: recibe la grilla lista.

### Cambiar la obra

Un comando. No hay que tocar CSS ni JS: el lienzo toma su proporción de la
grilla, así que una obra de otro formato entra sola.

```bash
node tools/gen-arte.mjs ruta/a/la/obra.jpg 108 --ver
```

`--ver` escribe `tools/_verificacion-arte.jpg` volviendo a dibujar la grilla.
**Usalo siempre:** mirar los números no dice nada, y ahí se ve si la figura se
reconoce.

Cuatro perillas, todas por variable de entorno, que se ajustan mirando esa
imagen. El objetivo de densidad depende del tipo de obra: **~20% de celdas con
tinta** para un dibujo a trazo, **~35%** para una pintura (que necesita masas,
no líneas). Más es ruido, menos se desarma.

| | |
|---|---|
| `MODO` | `luz` para pinturas claras (los puntos caen en la LUZ, la figura emerge iluminada sobre el fondo oscuro) · `linea` para dibujos a trazo, con pasa-altos · `tono` para obras oscuras sobre fondo claro. |
| `CORTE` | percentil que se descarta. 0.80 deja ~20% de celdas; para pinturas hace falta más densidad, ~0.60. |
| `GAMMA` | <1 levanta los medios, >1 los aplasta. |
| `CROP` | recorte opcional `left,top,ancho,alto`. Por defecto usa la imagen entera. |

Para rehacer la que está puesta:

```bash
MODO=luz CROP=1900,1500,1780,760 CORTE=0.62 GAMMA=1.15 \
  node tools/gen-arte.mjs atenas.jpg 208 --ver
```

El escaneo sale de Wikimedia Commons (*"The School of Athens" by Raffaello
Sanzio da Urbino*, 3820×2964). Cualquier obra anterior a 1900 es dominio
público. El archivo se baja por la API de Commons, no por URL armada a mano:
las de `thumb/` devuelven un error de 2 KB.

Y el Vitruvio de Leonardo, que estuvo antes:
`CROP=100,268,1074,992 CORTE=0.80 GAMMA=0.70 ... vitruvio.jpg 108`

Lo que costó acertar, por si hay que cambiar la obra:

- **El modo importa más que las perillas.** Un fresco leído con el pasa-altos
  del Vitruvio devuelve un mapa de bordes; leído con luminancia invertida
  dibuja las SOMBRAS y la obra sale en negativo. Para una pintura clara sobre
  un sitio oscuro va `luz`: los puntos caen donde hay luz y las figuras
  emergen iluminadas.
- **El umbral es un percentil, no una fracción del máximo.** Con la fracción,
  el mismo número daba 19% de celdas en un dibujo y 100% en un fresco.
- **Un umbral global de brillo no funciona en dibujos.** El pliego tiene 500 años, con viñeteado y
  manchas: el "papel" de una zona es más oscuro que el trazo de otra. Con un
  solo valor entraba media hoja (48% de celdas) o se perdía el dibujo. La
  solución es un **pasa-altos**: al original se le resta su propia versión muy
  desenfocada, que estima el fondo. Sobrevive lo que difiere de su entorno
  inmediato, o sea las líneas.
- **El techo de normalización sale de un percentil, no del máximo.** Cuatro
  píxeles muy oscuros comprimían todo el resto contra el piso.
- El objetivo es ~20% de celdas con tinta. Más es ruido, menos se desarma.

### Las versiones anteriores

- `assets/hero/parallax/` — las 3 capas fotográficas con alpha (286 KB), con
  parallax de profundidad real. `tools/key-hero.mjs` y `tools/prompts-hero.md`
  las reconstruyen.
- `assets/hero/vectorial/` — la ciudad dibujada en SVG (83 KB).
  `tools/gen-hero.mjs` la vuelve a dibujar.

**La imagen de Open Graph.** `tools/og.html` es la plantilla; se captura a
1200×630 y se guarda como `assets/og.jpg`.

**Los datos de contacto.** El número de WhatsApp aparece en `index.html` (tres
links con `data-wa`) y en `js/main.js` (`WA_BASE`). Si cambia, hay que tocar los
dos: el JS reescribe los `href` cuando alguien clickea un CTA de servicio.

---

## SEO y publicación

Las dos páginas tienen title, description, canonical, Open Graph completo con
`assets/og.jpg` (1200×630) y Twitter Card. La home además lleva JSON-LD de
`ProfessionalService`. Nada de eso depende de JS: está todo en el HTML.

**Las URLs canónicas llevan barra final y no llevan `index.html`.** Como los
links internos sí son relativos —para que el sitio siga abriéndose desde el
disco con doble clic—, `vercel.json` cierra la brecha:

| | |
|---|---|
| `trailingSlash: true` | `/portfolio` → `/portfolio/` |
| dos `redirects` | `/index.html` → `/` y `/portfolio/index.html` → `/portfolio/` |

Sin eso, cada página quedaba servida en dos URLs distintas con 200 en las dos.

`vercel.json` también pone lo que Vercel no trae por defecto:

- **Caché.** Vercel sirve TODO el estático con `max-age=0, must-revalidate`:
  cada captura y el video de 600 KB se revalidan en cada visita. Las imágenes
  y el video van a una hora, y CSS/JS a diez minutos, los dos con
  `stale-while-revalidate` para que la actualización pase en segundo plano.
  Deliberadamente **no** se usa `immutable`: los archivos no llevan hash en el
  nombre, así que reemplazar una captura tiene que verse el mismo día.
- **Seguridad.** `nosniff`, `Referrer-Policy`, `X-Frame-Options` y
  `Permissions-Policy`. El HSTS ya lo agrega Vercel solo. No hay CSP: el sitio
  usa scripts en línea y meterla con `unsafe-inline` no aportaría nada real.

⚠️ **El `sitemap.xml` es a mano.** Si se agrega una página hay que sumarla ahí
y que la `<loc>` coincida EXACTO con su `canonical`.

⚠️ **`googlef3a31e2c3e58ba21.html` NO se borra.** Son 53 bytes con un nombre
que parece basura, pero es lo que le prueba a Google Search Console que el
sitio es nuestro. Si desaparece, la propiedad se des-verifica sola y se
pierden los datos de búsqueda. Tiene que seguir respondiendo 200 para
siempre.

---

## Chequeo

`tools/check.mjs` verifica lo que no se ve mirando: que el preloader salga una
sola vez por sesión, que con `prefers-reduced-motion` el sitio quede completo y
quieto, que el CTA de cada servicio preseleccione el `<select>` y reescriba los
links de WhatsApp, que el scramble arranque recién al entrar en pantalla, que el
scrub del bento se apague abajo de 860px, que no haya scroll horizontal entre
360 y 1920px y que el foco de teclado tenga outline rojo.

```bash
npm i puppeteer-core sharp    # SÓLO para las herramientas, el sitio no usa nada
node tools/check.mjs             # la home — 87 aserciones
node tools/check-portfolio.mjs   # /portfolio — 48 aserciones
```

Instalá eso cuando vayas a correr algo de `tools/`, y después borrá
`node_modules/` si querés: el sitio no lo necesita ni para andar ni para
deployarse. `.gitignore` y `.vercelignore` ya lo dejan afuera, junto con
`generaciones/` (15 MB de PNG originales que no tienen por qué viajar).

---

## Si no se ven las animaciones

Antes de tocar código, descartá esto: **Ajustes de Windows → Accesibilidad →
Efectos visuales → Efectos de animación**. Si está apagado, Chrome informa
`prefers-reduced-motion: reduce` y el sitio apaga todo a propósito — preloader,
parallax, scramble y estelas. No es un bug, es el requisito de accesibilidad.

Para confirmarlo, pegá esto en la consola del navegador (F12):

```js
matchMedia('(prefers-reduced-motion: reduce)').matches   // true = está apagado
```

No hace falta subir nada a GitHub ni a Vercel: GSAP viene de un CDN por HTTPS y
funciona igual abriendo el `index.html` desde el disco.

---

## Decisiones que conviene no revertir sin pensarlo

- **El hero mide una pantalla completa** (`100svh`, no `100vh`: en el navegador
  del teléfono `vh` mide con la barra retraída y el CTA queda cortado). Hay un
  breakpoint por ALTURA en 800px para portátiles bajos tipo 1366×768, donde si
  no se achica el titular el botón cae abajo del pliegue.
- **El logotipo son dos estilos al mismo tamaño óptico,** no dos tamaños:
  Archivo liviano + Instrument Serif cursiva. El `1.16em` de `.lock__b` está
  para emparejar las cajas de las dos fuentes, no es un capricho.
- **Todo el display va liviano y de ancho normal** (`--fv-display`, wght 330 /
  wdth 100): el mismo trazo del "Lautaro" del logotipo. El peso lo dan el
  tamaño y el aire, no el grosor.
  ⚠ Esto **contradice a propósito** al brief original, que pedía títulos en
  `wdth` 104–118 y decía que el ancho expandido era parte de la identidad. Se
  probó y se descartó: quedaba gritón y genérico. Si alguna vez hay que
  volver, se cambian las dos variables y listo — no hay `font-variation-settings`
  suelto en ninguna regla salvo el pie de los tiles del bento, que a 17px y
  sobre una foto necesita más cuerpo (wght 500) o desaparece.

- **El acento rojo ocupa menos del 5% de la pantalla.** El CTA principal es
  hueso, no rojo. El rojo vive en la baliza del Obelisco, las estelas, el `>`
  de la franja, la línea que se dibuja al pasar por una fila de servicios, la
  barra de progreso y el outline de foco. Si se rellena un bloque grande de
  rojo, se cae el sistema entero.
- **El bento usa `expoScale`, no un ease lineal.** Un zoom con ease lineal se
  percibe acelerando cada vez más, porque el ojo registra el cambio RELATIVO
  de tamaño y no el absoluto. `expoScale(1, S)` compensa eso. Es la diferencia
  entre que parezca un efecto y que parezca una cámara. Viene de `EasePack`,
  que por eso es el cuarto script de GSAP en el HTML.
- **La celda del centro es la invitación al portfolio, no un trabajo.** Si
  algún día se pone una foto ahí: probé el caso y medí con varianza del
  laplaciano que Chrome re-rasteriza bien al escalar (renderizado 528 contra
  489 de la captura original a tamaño nativo). O sea que si a 4x se ve blanda,
  la imagen es blanda de origen y hay que cambiarla — tocar el CSS no sirve.
- **El bucle del pie lo prende un `IntersectionObserver`, no ScrollTrigger.**
  Con `end: 'bottom top'` el rango termina cuando el pie sale por arriba, cosa
  que en el último elemento de la página no puede pasar nunca: el trigger
  quedaba inactivo justo mientras el pie estaba a la vista y el canvas no se
  dibujaba jamás. Un rAF permanente por un adorno del final tampoco va — gasta
  batería en cada scroll del sitio.
- **El H1 es el LCP:** texto plano, sin scramble y sin JS que le cambie el
  contenido. Lo único que se le anima es el transform de cada línea.
- **La franja que se scramblea va en monoespaciada.** Con fuente proporcional
  el texto salta de ancho mientras se arma y parece roto.
- **Los servicios son un slider a pantalla completa,** un panel por servicio.
  Tres cosas que parecen detalles y no lo son:
  1. **Apilado es el estado de reposo.** El CSS deja los paneles uno abajo del
     otro y `servicesSlider()` le pone `is-slider` al escenario recién cuando
     pudo montar el pin. Al revés —pantalla completa por defecto— los paneles
     quedarían encimados e ilegibles sin JS, con reduced-motion y en mobile.
  2. **Es ScrollTrigger pinneado, no el plugin Observer** del demo original.
     Observer se queda con la rueda del mouse; en un one-page eso te deja
     trabado en la sección hasta ver los tres paneles, sin barra ni teclado.
  3. **El snap va con `inertia:false` y `directional:false`.** Por defecto
     proyecta con la velocidad, y ante un salto grande —el índice de abajo,
     AvPág, un ancla— se pasa de largo hasta el último panel.
  4. **Los títulos se parten en letras a mano,** sin SplitText: son tres
     títulos cortos y no justifica un plugin más en el CDN. El `<h3>` queda
     con `aria-label` y las esquirlas con `aria-hidden`, si no un lector de
     pantalla deletrea "L-a-n-d-i-n-g". Las letras entran en cascada y pasan
     del acento al hueso: el rojo va como destello, no como estado — un
     titular grande en rojo fijo se comería solo todo el presupuesto de
     acento de la página.
  5. **Las timelines de entrada se construyen adentro de `matchMedia`.** Un
     `fromTo` aplica su estado inicial apenas se crea, así que fuera de ahí
     dejaría los títulos invisibles en mobile, donde nadie los va a animar.
  6. **El panel B es el único con la base levantada** (#131A24 contra ~#09090C
     de los otros dos). Ese salto de luminancia —medido: 15 → 34 → 16 sobre
     255— es lo que hace que el cambio de panel se lea de golpe. Con tres
     negros distintos no se notaba nada.

  Sin numeración 01/02/03: son opciones paralelas, no una secuencia. Las rutas
  (`/landing`) sí codifican algo real y hacen de índice.
  ⚠ Esto también **contradice al brief a propósito**, que pedía filas tipo
  spec sheet y prohibía tarjetas. El contenido mantiene el ADN de spec sheet
  —ruta, título, qué incluye, plazo— pero adentro de un panel de 100svh.
- **Sin precios.** Filtran mal y la gente pregunta igual.
- **En mobile no hay menú hamburguesa.** El header deja sólo el logo y el CTA
  de WhatsApp: la página es corta y el pie tiene la navegación completa.
