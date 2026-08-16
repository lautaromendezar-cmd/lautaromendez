# Prompts para reemplazar el hero por imágenes generadas

El SVG vectorial que está andando hoy es la red de seguridad: si esto no sale,
el sitio queda como está. Nada de acá es obligatorio.

## La idea

Un modelo de imagen te da **un plano plano**, y el parallax necesita capas con
transparencia. Generar cada capa por separado no sirve: tres generaciones
distintas no coinciden entre sí, los edificios quedan en otro lugar.

Por eso el orden es: **generás una sola imagen maestra**, y después le pedís al
modelo que *recorte* pedazos de esa misma imagen. Como parte del original, todo
queda alineado.

```
1. Imagen maestra (opaca, 16:9)        → capa de fondo
2. Recorte del Obelisco + torres medias → capa media   (PNG con alpha)
3. Recorte de los edificios de adelante → capa cercana (PNG con alpha)
```

Quedan 3 capas en vez de 4. Alcanza y sobra: la diferencia entre 3 y 4 planos
no se nota, la que se nota es entre 1 y 3.

---

## 1 · Imagen maestra

Generá en 16:9 y en la resolución más alta que te deje. Esta es la única que
importa que salga perfecta — las otras dos son recortes de esta.

```
Cinematic night establishing shot of a futuristic Buenos Aires skyline,
Tron-inspired. Wide 16:9 horizontal composition.

The Obelisco de Buenos Aires stands at the center, monolithic and imposing,
its leading edge traced with a thin glowing red-orange neon line, a single
red beacon light at its apex.

Around it, dense high-rise towers in dark blue-grey silhouette, thousands of
small warm amber windows, a few facades carrying thin horizontal neon strips.

Above, a luminous slate blue-grey sky with heavy dramatic cloud banks — the
sky is NOT black, it glows. A deep red-orange bloom spreads along the horizon
behind the buildings, like light pollution.

Two or three thick curved streaks of red-orange light arc across the sky with
soft bloom, like long-exposure vehicle light trails.

Volumetric haze separating the depth planes.

Colour palette strictly limited: desaturated blue-grey, near-black, warm amber
window light, and one red-orange accent (#FF2D46 to #FF7A3D). No cyan, no
magenta, no purple, no green.

Photoreal, 35mm lens, high dynamic range, subtle film grain.
No people, no text, no logos, no watermark, no signature.
The lower third of the frame is noticeably darker than the rest.
```

**Ese último renglón importa:** ahí abajo a la izquierda va el titular. Si la
zona sale clara, el texto no se lee y hay que tapar la foto con un velo negro,
que es justo lo que arruina la imagen.

---

## 2 · Recorte de la capa media

Con la imagen maestra **como imagen de entrada**:

```
Using this exact image as reference, output ONLY the Obelisco and the
mid-ground towers immediately surrounding it.

The sky, the distant skyline, the horizon glow and the nearest foreground
buildings must all be FULLY TRANSPARENT.

Do not redraw, reposition or restyle anything: keep the exact position, scale,
perspective, lighting and colour of the elements you keep.

Output a PNG with a real alpha channel, same 16:9 dimensions as the input.
Clean cut-out edges, no white halo, no background colour, no checkerboard.
```

## 3 · Recorte de la capa cercana

Misma imagen maestra como entrada:

```
Using this exact image as reference, output ONLY the nearest foreground
buildings — the dark silhouettes closest to the camera at the left and right
edges of the frame.

The sky, the distant skyline and the Obelisco must all be FULLY TRANSPARENT.

Do not redraw, reposition or restyle anything: keep the exact position, scale,
perspective, lighting and colour of the buildings you keep.

Output a PNG with a real alpha channel, same 16:9 dimensions as the input.
Clean cut-out edges, no white halo, no background colour, no checkerboard.
```

---

## Cuando las tengas

Tirámelas en `assets/hero/` con el nombre que sea y yo hago el resto:

- **Optimizo el peso.** Un PNG con alpha de 2400px pesa varios MB; van a WebP
  con transparencia, que baja a la décima parte. La maestra va a JPEG.
- **Reajusto `data-depth`.** Con 3 capas los valores actuales (6/16/34/62) no
  sirven: la separación entre planos cambia.
- **Reviso el velo.** Si la parte de abajo salió más clara de lo pedido, hay
  que compensar en CSS, y eso conviene medirlo, no tantearlo.

## Si los recortes salen mal

Pasa seguido: el modelo devuelve el recorte con fondo negro en vez de
transparente, o se come parte del edificio. Dos salidas, en este orden:

1. **Reintentar el recorte** agregando al final del prompt:
   `The background must be transparent alpha, not black. Return RGBA.`
2. **Plan B:** usamos la imagen maestra sola como fondo y le dejo encima la
   capa de primer plano del SVG actual, que ya tiene alpha real. Queda con
   menos profundidad que las 3 capas pero con la foto grande, que es lo que
   te importaba.
