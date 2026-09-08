# La cuenta de GitHub está marcada — qué hacer

> Escrito el **7 de septiembre de 2026** desde la PC del trabajo, para poder seguir desde la
> de casa. Este archivo está en `.vercelignore`: no se publica en el sitio.

## Qué pasó

GitHub marcó (*flagged*) la cuenta **`lautaromendezar-cmd`**. Para cualquiera que no sea
Lautaro, la cuenta no existe.

**Cómo verificar si sigue así** — diez segundos:

```
curl -s -o /dev/null -w "%{http_code}\n" https://github.com/lautaromendezar-cmd
curl -s -o /dev/null -w "%{http_code}\n" https://api.github.com/users/lautaromendezar-cmd
```

**404 en las dos = sigue marcada. 200 = ya la restablecieron.**

Un perfil normal responde 200 aunque todos sus repos sean privados. Se comprobó contra
`torvalds`, `vercel` y `github`: los tres dan 200 desde la misma conexión.

## Qué rompe y qué no

**No rompe nada de lo que está publicado.** El 7-sep a la tarde se verificaron **los 20
proyectos de Vercel uno por uno, con parámetro anti-caché: los 20 dan 200**, más `/studio` de
Place Vendôme. Son deploys ya hechos: corren sin consultar
GitHub. Siguen andando los formularios, las funciones y el CMS — el circuito de Sanity le
pega al webhook del propio sitio, no pasa por GitHub.

**Sí rompe publicar cambios, y en los 20 proyectos a la vez:**

- No se puede instalar ninguna GitHub App: `/apps/<la-que-sea>/installations/new/permissions`
  da **404 duro**. Se reprodujo con Vercel y con Netlify, así que no es de una app.
- Por eso los proyectos de Vercel muestran «Error: Project Link not found» y los push ya no
  disparan deploys.
- **Hostinger también usa una GitHub App**, así que redeployar Place Vendôme desde el código
  puede fallar igual.
- Pero **`git push` funciona**, porque va autenticado como dueño.

⚠️ **No investigar del lado de Vercel: no es Vercel.** Se perdieron horas ahí. Todo esto
puede verse perfecto y la cuenta estar marcada igual: la GitHub App aparece instalada, con
*All repositories*, y la cuenta de Vercel tiene GitHub vinculado en Authentication. El
síntoma que manda es el perfil dando 404 desde afuera.

## Estado

**Ticket de reinstatement enviado el 7-sep-2026**, por support.github.com →
*Reinstatement request* → «Puedo iniciar sesión, pero mi perfil y contribuciones no son
visibles para los demás». Esperando respuesta.

**Reverificado el 7-sep a la tarde: sigue marcada.** Perfil y API siguen dando 404, y
`torvalds` da 200 desde la misma conexión.

**GitHub contestó el mismo 7-sep, a la noche.** Firma Tessa. Dice que la detección
automática de abuso marcó "alguna actividad" de la cuenta para revisión manual, y pregunta
una sola cosa: para qué pienso usar GitHub. No acusa de nada concreto ni nombra un repo.

**La carta se mandó el 7-sep a la noche.** Quedó guardada en
`zz-borrador-respuesta-github.txt`. Reconoce el patrón de `cyc` con los números medidos y
ofrece dos salidas: agrupar los cambios en menos commits, o sacar ese contenido de GitHub.

**Queda un seguimiento escrito y sin mandar**, en `zz-seguimiento-github.txt`: avisa que el
token venció solo y que el tráfico automático ya está cortado desde el 3-sep, y corrige el
único detalle que la carta afirmó de más (dijo que se estaba sacando el token del repo, y el
token nunca estuvo en el repo).

**El nombre del token cierra con el cliente**: `cyc` publica en `www.papeleracyc.com.ar`, así
que el fine-grained `catalogo-papelera` que venció es el del catálogo de `cyc`.

**El candidato a haber disparado la marca es `cyc`, medido sobre los espejos.** De sus 1312
commits, **1310 los hace la máquina**: 679 "Foto: fotos/N.jpg", 562 "Actualizar catálogo" y
49 subidas por la web. Los escriben `api/publish.js` y `api/upload-image.js` por la API REST,
un commit por cambio, con picos de **148 commits en un día** y 10 en un mismo minuto. Son el
**69% de los 1905 commits de toda la cuenta**. Mecánicamente es un bot, aunque atrás haya un
cliente cargando su catálogo de verdad.

**"Con panel" no quiere decir nada por sí solo: lo que importa es contra qué escribe.** Son
dos familias distintas y sólo una se ve desde GitHub.

- **Panel contra Supabase o Sanity — invisible para GitHub.** `Terrestre3` y `krb` y
  `house-in-baires` y `federestivo` van a Supabase; `place-vendome` va a Sanity. El cliente
  puede usarlos todos los días y no generan ni un commit.
- **Panel que commitea por la API — visible.** Sólo tres: `cyc`, `empanadas-jaque` y
  `liliana-donato`. De esos, dos nunca se usaron.

Así que **los paneles que los clientes sí usan son justo los que no tocan GitHub**, y el que
mueve el 69% de los commits es `cyc`, el que menos parece un "panel en uso".

⚠️ **`tr3` está vacío de verdad**: cero refs y cero objetos, nunca se le pusheó nada. La web
de turismo que el cliente usa es `Terrestre3` (59 commits, panel contra Supabase, deploy por
Vercel). `tr3` es un nombre viejo que quedó dando vueltas; se puede borrar cuando vuelva la
cuenta.

**Los otros dos paneles no tienen nada que ver**, contra lo que parecía: `empanadas-jaque`
**nunca** commiteó (el cliente ni sabe que existe el panel) y `liliana-donato` tiene **dos**
commits, los dos del 10-ago, pruebas propias del día que se armó. Ningún otro repo pasa de 4
commits automáticos. Conviene no repetir esa hipótesis: se verificó y es falsa.

**No hay ninguna credencial versionada, y esto se verificó bien.** Al principio se
anotó acá que `cyc/.env` tenía el `GITHUB_TOKEN` adentro y que había que rotarlo por estar en
el historial: **era falso**. Ese `.env` se commiteó una sola vez, el 9-jun, con los tres
nombres de variable y **ningún valor**. Se revisaron además todos los `.env*` de los 24 repos
en todo el historial: los únicos valores que existen son URLs, nombres de dataset, un host
SMTP y variables `NEXT_PUBLIC_*`. Ni una clave real. **El escaneo de secretos queda descartado
como causa de la marca.**

**El token del panel de `cyc` venció solo.** El 7-sep llegó el mail de GitHub avisando que el
fine-grained `catalogo-papelera` expiró. Encaja con que **el último commit de `cyc` es del
3-sep 17:36** y desde entonces el repo está quieto, después de meses de actividad diaria. O
sea que **el tráfico automático ya está cortado sin haber tocado nada**, y lo estaba desde
antes de que se mandara la carta.

⚠️ **No regenerar ese token mientras dure la revisión manual.** Volver a meter cien commits
por día en medio de un caso abierto por actividad automática es lo peor que se puede hacer, y
además la carta dice que se está sacando. Conviene aprovechar la pausa para que el panel
agrupe los cambios en menos commits, que es justo una de las dos salidas que se le ofrecieron
a GitHub.

⚠️ **El cliente de `cyc` no puede actualizar el catálogo desde el 3-sep** y capaz todavía no
avisó. Conviene decírselo antes de que lo descubra él.

**Tampoco hay Actions**: ni un workflow en los 24 repos. Eso se afirma en la carta y está
verificado.

**Reverificado el 7-sep a la noche, ya desde la PC de casa: sigue marcada.** Las dos URL dan
404 y `torvalds` da 200 desde esta otra conexión, así que no es la red de una máquina. El
`clone` y el `ls-remote` autenticados siguen andando.

⚠️ **No abrir una cuenta nueva mientras el ticket esté abierto.** Crear otra para esquivar
una suspensión suele terminar con la nueva suspendida también. Si GitHub confirma que no la
restablece, recién ahí preguntarle explícitamente si se puede abrir otra.

## Backup espejo — HECHO en las dos PC (7-sep)

**Los 24 repos están espejados en las dos PC**, en `Desktop\Claude\zz-backup-github\`.
En la del trabajo se hicieron 21 al mediodía (479 MB) y en la de casa los 24 a la noche
(570 MB), las dos veces sin un solo fallo. Se hizo clonando de GitHub, así que también
confirma que el clone autenticado sigue funcionando con la cuenta marcada.

Un `--mirror` guarda ramas, tags e historial completos, y sirve para republicar en otra
cuenta o en otro servicio con `git push --mirror <nuevo-remoto>`:

```
git clone --mirror https://github.com/lautaromendezar-cmd/<repo>.git
```

**Conviene repetirlo cada tanto** mientras siga el problema: los espejos son de la foto del
7-sep, y lo que se trabaje después no está adentro hasta que se vuelva a correr. Con la
carpeta ya creada, un `git -C zz-backup-github/<repo>.git remote update` la pone al día.

### El inventario, cerrado el 7-sep a la noche

**Sí se puede listar la cuenta desde la terminal, no hacía falta el navegador.** Lo que
responde 404 es el endpoint público (`/users/lautaromendezar-cmd`). El autenticado,
`/user/repos`, contesta igual de bien con la cuenta marcada, y de ahí salió el inventario
completo.

**Son 24 repos, no 21.** Los tres que faltaban en el espejo del mediodía:

- `fosque` — con contenido. **Estaba afuera del backup.**
- `luraschi` — con contenido, privado. **Estaba afuera del backup.**
- `tr3` — vacío, ni una sola ref. No hay nada que perder; el proyecto de verdad es
  `Terrestre3`.

Los dos primeros son justo los que no tienen proyecto en Vercel: `fosque` sube por FTP y
`luraschi` está en Cloudflare Pages. Por eso el cruce contra los 20 proyectos de Vercel no
podía encontrarlos, y por eso no conviene volver a inventariar por ahí.

### Sobre los clones de trabajo

**En la PC del trabajo**, ninguno tiene commits sin pushear. Ocho sí están **atrasados**
respecto de origin, porque se trabajó en la otra máquina: `pll-studio` (14 commits),
`cyc-repo` (7), `autoservicio-krb` (6), `liliana-donato` (6), `perezlegales` (4),
`Terrestre3` (3), `centenaria` (3), `diegocarbone-repo` (1). Los objetos ya están bajados;
falta el `git pull` cuando se vaya a tocar cada uno.

**En la PC de casa**, los 21 clones se compararon contra el espejo recién hecho y el HEAD de
todos está adentro: tampoco hay nada sin pushear. La comprobación no necesita red, que es la
gracia de tener el espejo al lado:

```
git -C zz-backup-github/<repo>.git cat-file -e $(git -C <clon> rev-parse HEAD)^{commit}
```

### Los 24 repos de la cuenta

`batata-studio` · `centenaria` · `cyc` · `diegocarbone` · `dist-nahuel` · `empanadas-jaque` ·
`equiponeurodialectico` · `eric-torrent` · `federestivo` · `fosque` · `house-in-baires` ·
`krb` · `latina` · `lautaromendez` · `lga` · `liliana-donato` · `luraschi` · `perezlegales` ·
`physiomove` · `place-vendome` · `pll-studio` · `sistema-barba` · `Terrestre3` · `tr3`

Ojo con dos nombres que no coinciden con el proyecto de Vercel: el repo `dist-nahuel` es el
proyecto `venta-latina-cente`, y `Terrestre3` es `terrestre3`.


## Lo que rompe afuera de GitHub: los logins con "Continue with GitHub"

**Esto es lo que más caro sale y no se ve venir.** Todo servicio donde la identidad es
GitHub queda cerrado, y desde adentro no se puede arreglar porque para pedir ayuda hay
que estar logueado.

**Supabase: bloqueado.** Es el caso real. El reseteo de contraseña **no sirve**: contestan
por escrito que la cuenta está atada a GitHub y que sólo se entra por ahí. Se mandó pedido
a **`support@supabase.com`** el 7-sep (borrador en `zz-soporte-supabase.txt`), que es la vía
documentada para quien no puede entrar al panel; piden captura del error y que el mail salga
de la casilla registrada. Lo que se pide es que **agreguen acceso por email a la cuenta que
ya existe**, no una cuenta nueva.

Son **dos organizaciones** bajo el mismo login, y hay que nombrar las dos o devuelven sólo
la paga:

- **Pro**: `fywsbdtuprfjlpvxminb` (Terrestre3 y TR3) y `atzdzazqzvwnzczxqhms` (KRB)
- **Free**: `valwsiljbrrslrmphrfv` (House in Baires)
- Hay un cuarto proyecto, el de `federestivo`, que usa Supabase sólo del lado del servidor.
  Su ref no está en el bundle: sale de `vercel env ls --project federestivo`.

⚠️ **Nunca mandar la service role key como prueba de titularidad.** Soporte legítimo no la
pide. Alcanza con la facturación y los refs.

**Vercel: a salvo, verificado.** El login es por Google, y además hay email registrado. La
conexión con GitHub figura ahí pero sin usar desde el 31-may. **No borrarla**: hace falta
para reinstalar la GitHub App cuando vuelva la cuenta.

**Sin revisar todavía**: Cloudflare, Sanity, Hostinger, Tienda Nube. En cada uno donde el
botón diga GitHub, conviene agregar un segundo método **antes** de que caduque la sesión
abierta.

**Mientras no haya panel de Supabase**, se puede consultar la base igual con la service role
key: `Terrestre3/.env.local` la tiene, y las de los otros se bajan con `vercel env pull`. . 
## Cómo publicar mientras tanto

Con el CLI de Vercel, que no pasa por GitHub. Ya quedó instalado y logueado en la PC del
trabajo; en casa hay que repetir el `npm i -g` y el login.

```
npm i -g vercel
vercel login                                # NO pasar el mail: quedó deprecado
```

El login ya no manda un mail con un clic: imprime una URL tipo
`vercel.com/oauth/device?user_code=XXXX-XXXX` y espera a que la abras y confirmes. El código
caduca en pocos minutos.

```
vercel link --yes --project <proyecto> --scope lautaro-mendez-s-projects
vercel deploy          # preview: NO toca el dominio
vercel deploy --prod   # promueve y hace el alias al dominio
```

**En la PC de casa ya está todo hecho**: sesión abierta como `lautaromendezar-5992` y
`centenaria`, `lga` y `physiomove` vinculados y verificados en vivo. Ojo que el nombre del
proyecto no siempre es el de la carpeta: `lga-group` es el proyecto `lga`.

Sube lo que hay **en disco** en esa carpeta y respeta `.vercelignore`, así que antes conviene
confirmar que el working tree está limpio y a la par de `origin`.

Detalles que hacen perder tiempo si no se saben:

- **El preview no se puede verificar con `curl`**: da 302 porque el proyecto tiene Deployment
  Protection. Se comprueba con `vercel inspect <url>` (que diga `● Ready`) y después se
  verifica en producción, que sí es pública.
- Antes de promover, anotar el deployment de producción actual con
  `vercel ls <proyecto> --prod`: es el punto de retorno para un rollback.
- Al verificar en vivo, **usar un parámetro anti-caché** (`?cb=123`): el CDN sirve HIT con
  horas de antigüedad y parece que el deploy no salió.
- `vercel link` crea `.vercel/` y un `.env.local` con un token. Los dos están gitignoreados.

## Cuando GitHub restablezca la cuenta

1. Verificar que el perfil vuelva a dar 200 con los dos `curl` de arriba.
2. Instalar la GitHub App de Vercel — ahora sí va a dejar.
3. Reconectar cada proyecto que haya perdido el link. Desde la carpeta de cada uno:
   `vercel git connect`. Instalar la app **no** reconecta solos los proyectos.
4. Probar con un push que el deploy automático vuelva a dispararse.
