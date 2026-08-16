# Hero v2 — figura de espaldas + Buenos Aires (referencia: póster Tron Ares)

Dos pasos: primero la imagen fija, después esa misma imagen a video.

Tres cosas están escritas a propósito en el prompt y conviene no sacarlas,
porque son las que evitan que la imagen se lea como generada:

1. **La figura y el Obelisco van descentrados.** La simetría perfecta es el
   tell número uno de una imagen de IA. Van sobre el tercio derecho.
2. **El tercio izquierdo va oscuro y vacío.** No es un capricho de composición:
   ahí va el titular. Si sale ocupado hay que taparlo con un velo negro, y eso
   es justo lo que arruina la foto.
3. **Se pide suciedad.** Asfalto mojado, cables, una vereda rota. La ausencia
   total de imperfección es lo que hace que una imagen parezca renderizada.

---

## 1 · La imagen fija

Generar en **16:9 horizontal** y en la resolución más alta disponible.

```
Cinematic wide shot, 16:9 horizontal. Night. Buenos Aires, near-future.

FOREGROUND: a lone figure seen from behind, in full silhouette, standing at a
waterfront railing on a wet promenade. Male build, dark technical jacket,
short hair. He holds an open laptop down at his side in one hand; the screen
is the only cool light in the frame and it rim-lights his hand and forearm.
He is placed OFF-CENTRE, on the right third of the frame, small against the
city — roughly one fifth of the frame height. He is looking away, at the
skyline. No face visible.

BACKGROUND: the Buenos Aires skyline across dark water. Dense microcentro
towers, thousands of small warm amber windows, a few facades carrying thin
horizontal red neon strips. The Obelisco rises among them, NOT centred —
placed left of the figure, partly veiled by haze.

SKY: heavy dramatic cloud banks in desaturated slate blue-grey, luminous, not
black. A deep red-orange bloom spreads low along the horizon behind the
towers. Two or three thick curved streaks of red-orange light arc across the
sky with soft bloom, like long-exposure vehicle trails.

LIGHT: hard red-orange rim light along the figure's shoulders and the railing.
The wet promenade reflects the red glow in long vertical smears. Volumetric
haze separating each depth plane.

IMPORTANT — COMPOSITION: the LEFT THIRD of the frame must stay dark, quiet and
almost empty — deep shadow, water and haze, no bright detail. Typography will
sit there.

TEXTURE: wet asphalt with puddles, a cracked kerb, worn railing paint, a few
cables overhead. Real, slightly dirty, lived-in — not a clean render.

PALETTE: strictly limited to near-black, desaturated blue-grey, warm amber
window light and ONE red-orange accent (#FF2D46 to #FF7A3D). No cyan, no
magenta, no purple, no green.

Photoreal, 35mm anamorphic, shallow haze, high dynamic range, fine film grain.

NEGATIVE: no text, no logos, no watermark, no signature, no other people,
no lens flare stars, no perfectly symmetrical composition, no centred subject.
```

### Si querés que la silueta seas vos de verdad

Pasale además una foto tuya **de espaldas**, de cuerpo entero, y agregá al
final: `Match the build, posture and hair silhouette of the reference photo.`
Como es contraluz y no se ve la cara, con la silueta alcanza.

### Variante vertical para redes

Misma cosa cambiando `16:9 horizontal` por `4:5 vertical` y sacando la
instrucción del tercio izquierdo (ahí el texto va abajo, no al costado).

---

## 2 · De la imagen al video

Con la imagen fija **como primer fotograma**. La regla es que se mueva el
ambiente, no el personaje: apenas un modelo intenta animar a una persona
reconocible, aparece el efecto raro y se cae todo.

```
Animate this still. The camera pushes in very slowly, a subtle dolly forward,
no cuts, no zoom blur.

The red-orange light streaks travel slowly across the sky, leaving soft
trails. Cloud banks drift laterally, very slow. The red reflections on the wet
promenade shimmer and ripple gently. Distant window lights flicker almost
imperceptibly. A faint drift of haze passes in front of the towers.

The figure stays STILL — only the smallest movement in the jacket and hair,
as if from a light breeze. Do not turn him, do not move his arms, do not
animate his body.

Loopable, 6 to 8 seconds, no camera shake, no text, no transitions.
```

---

## 3 · Cuando lo tengas, para montarlo

Pasámelo y yo hago la integración. Lo que va a hacer falta:

- **Formato:** WebM (VP9) + MP4 (H.264) como respaldo, porque Safari no toma
  VP9 en todos lados. Objetivo: **menos de 2 MB**. Un hero de 8 MB tarda más
  en aparecer que la sección entera y el remedio sale peor que la enfermedad.
- **Poster:** la imagen fija va como `poster` del `<video>`, así se ve algo
  desde el primer frame en vez de un rectángulo negro.
- **Atributos:** `autoplay muted loop playsinline preload="none"`.
- **Con `prefers-reduced-motion` el video no se carga:** queda la imagen fija.
  Ya está resuelto para el resto del sitio y esto entra igual.
- **En mobile,** probablemente imagen fija y no video: el recorte vertical se
  come la composición y el peso pega justo donde la conexión es peor.

El parallax de 3 capas se reemplaza por el video, así que `data-depth` y las
capas actuales quedan sin uso. Las guardo antes de sacarlas.
