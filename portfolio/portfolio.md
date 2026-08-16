# /portfolio

La grilla completa de trabajos publicados. Usa **el mismo sistema visual que la
home**: los tokens, el reset, la tipografía, el logotipo, los botones, el header
y el pie salen de `../css/style.css`. Acá no se declara ni un color ni una
familia nueva — si cambia la paleta de la home, esta página cambia sola.

```
index.html      la página
portfolio.css   sólo lo propio: hero, filtros, grilla, cierre
portfolio.js    los datos + el comportamiento
trabajos/       las 34 capturas (webp, 16:9)
```

---

## Agregar un proyecto

Un solo lugar: el array `PROYECTOS` en `portfolio.js`.

```js
{ img: 'port-NOMBRE.webp', n: 'Nombre Cliente', r: 'Rubro · Detalle', cat: 'turismo', url: 'https://sitio.com/' },
```

De ahí salen **solos** la grilla, los botones de rubro, las cuentas de cada
botón y el número del hero. No hay ningún contador escrito a mano en esta
página.

La captura va en `trabajos/` en **webp y 16:9** (las demás están a 1600×900).
La tarjeta recorta con `object-position: 50% 4%`, o sea que muestra la parte de
arriba del sitio: conviene capturar desde el borde superior.

`cat` tiene que ser una de estas ocho: `ecommerce`, `gastronomia`,
`servicios`, `educacion`, `turismo`, `industria`, `tecnologia`, `otros`. Los
botones se arman con los rubros que **tienen** proyectos, así que si un rubro
se queda vacío el botón desaparece solo en vez de ofrecer una categoría sin
nada adentro.

### Lo que hay que tocar además

El número de la home **sí** está escrito a mano, en tres lugares de
`../index.html`: `.hero__meta`, `.card__n` de la celda 5 del bento y el
`.work__cap-t` (que lo dice con letras: "Treinta y cuatro proyectos"). No hay
JS que los calcule. `tools/check.mjs` compara ese número contra este array y
falla si no coinciden — que es exactamente cómo se descubrió que la home decía
26 mientras acá ya había 34.

---

## Las animaciones

**El titular se arma con MorphSVG.** Dieciséis formas geométricas se
transforman en las letras de "Proyectos reales.", se quedan armadas unos
segundos y vuelven a la forma. Los contornos salen de Archivo con opentype.js,
que se baja como fuente estática desde fontsource.

Tres cosas de ese titular:

- **El `<text>` de adentro del `<svg>` es el estado de reposo y se ve siempre.**
  El JS lo apaga recién cuando ya construyó los paths. Si no hay JS, si el CDN
  no llega, si el `fetch` de la fuente falla o si el visitante pidió menos
  movimiento, queda el texto plano — el mismo criterio que el H1 de la home.
- **De rojo entra sólo el punto final**, que es el mismo gesto que el punto de
  "Lautaro Mendez." del logotipo. Las otras quince letras van de gris a hueso.
  La versión anterior las prendía las dieciséis en violeta a la vez: en este
  sistema eso se come de un saque todo el presupuesto de acento de la página.
- **El tamaño se ata al del H1 de la home.** Los paths están dibujados a 150
  unidades de cuerpo y el `<svg>` se mide en `em`, así que el `font-size:
  clamp(32px, 5.6vw, 80px)` de `.pf-h1` —el mismo de `.hero__h1`— manda igual
  que en cualquier texto. El JS escribe el ancho medido en `--pf-h1-w`.

**Las capturas llevan un shader al scrollear:** una onda y una separación de
canales RGB proporcional a la velocidad. Va en **WebGL crudo**, sin three.js:
el sitio entero se sostiene con GSAP y nada más, y meter 600 KB de librería
para un split de canales no se paga. (La versión anterior pedía
`three@0.169/build/three.min.js`, que devuelve **404** porque three sacó el
build UMD hace varias versiones. El efecto nunca llegó a correr.)

Cuatro cosas de ese shader que parecen detalle y no lo son:

1. **La `<img>` queda visible debajo del canvas.** El navegador aguanta unos 16
   contextos WebGL vivos; con 34 tarjetas, esconder la imagen significaba que
   al pasar ese tope las más viejas se quedaban en blanco. Con la foto abajo,
   perder el contexto sólo cuesta el efecto.
2. **Al salir de pantalla el contexto se destruye, no se pausa**, y además hay
   un **tope duro de 10 simultáneos** con desalojo del más lejano al centro de
   la pantalla. Sin el tope se medían 18 vivos a la vez y ahí Chrome empieza a
   matar contextos por su cuenta.
3. **Desde el disco (`file://`) no corre.** Las capturas quedan como origen
   opaco y `texImage2D` tira `SecurityError` — el mismo motivo por el que la
   obra del pie viene precocinada en `assets/arte.js`. Está adentro de un
   `try`: queda la foto y listo.
4. **Abajo de 861px no se instancia nada.** Son 34 texturas sobre una GPU de
   teléfono, justo donde peor se conecta. Mismo corte que el zoom del bento.

**Los filtros** desvanecen en dos tiempos (primero la opacidad, después salen
del flujo); de una sola vez la grilla pega un salto seco.

---

## Decisiones que conviene no revertir sin pensarlo

- **Nada se esconde desde CSS esperando que el JS lo revele.** Las tarjetas
  arrancan visibles y los reveals se hacen con `gsap.from`, que sólo existe si
  GSAP cargó. Al revés, un CDN caído dejaba la página en negro.
- **Los reveals van con `clearProps`.** Si GSAP deja el `transform` en línea le
  gana al `translateY(-3px)` del hover y las tarjetas dejan de levantarse.
- **La tarjeta es la misma que el bento de la home**: 16:9, foto desaturada que
  vuelve al color al pasar por encima, epígrafe sobre un degradé al pie, y el
  nombre en `wght 500` y no en el 330 del display, que a 15px sobre una foto
  desaparece.
- **El botón de filtro activo va en hueso, no en rojo.** Mismo criterio que el
  CTA principal de la home: el acento no rellena bloques.
- **Abajo de 560px se apagan el desaturado y el hover.** En el teléfono no hay
  hover: sin eso la foto se quedaba gris para siempre y el "ver sitio" no
  aparecía nunca.
- **El pie va sin la obra en trama de puntos.** Ese canvas cierra la portada,
  no una subpágina; por eso `.pf-page .ft` le baja el aire de arriba, que
  estaba puesto para que la obra respirara.

---

## Chequeo

`tools/check-portfolio.mjs` — 48 aserciones. Se sirve por HTTP y no por
`file://` a propósito: con `file://` las capturas son origen opaco y el shader
no se podría probar nunca.

```bash
npm i puppeteer-core          # sólo para la herramienta
node tools/check-portfolio.mjs
```

Verifica lo que no se ve mirando: que la grilla se arme completa, que las
cuentas de los rubros sumen el total, que el filtro deje sólo lo que
corresponde, que el titular respete la escala del H1 de la home, que el tope de
contextos WebGL se respete al recorrer las 34 tarjetas, que con
`prefers-reduced-motion` quede completa y quieta, que **sin GSAP la página no
quede en negro**, que los links vuelvan a la home, que no haya scroll
horizontal entre 360 y 1920px y que el foco de teclado tenga outline rojo.
