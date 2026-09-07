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

⚠️ **No abrir una cuenta nueva mientras el ticket esté abierto.** Crear otra para esquivar
una suspensión suele terminar con la nueva suspendida también. Si GitHub confirma que no la
restablece, recién ahí preguntarle explícitamente si se puede abrir otra.

## Backup espejo — HECHO (7-sep, PC del trabajo)

**Los 21 repos conocidos están espejados en `Desktop\Claude\zz-backup-github\`**, 479 MB,
sin un solo fallo. Se hizo clonando de GitHub, así que también confirma que el clone
autenticado sigue funcionando con la cuenta marcada.

Un `--mirror` guarda ramas, tags e historial completos, y sirve para republicar en otra
cuenta o en otro servicio con `git push --mirror <nuevo-remoto>`:

```
git clone --mirror https://github.com/lautaromendezar-cmd/<repo>.git
```

**Conviene repetirlo cada tanto** mientras siga el problema: los espejos son de la foto del
7-sep, y lo que se trabaje después no está adentro hasta que se vuelva a correr. Con la
carpeta ya creada, un `git -C zz-backup-github/<repo>.git remote update` la pone al día.

### Lo único que falta: cerrar el inventario

Se necesita el navegador, logueado, porque con la cuenta marcada la API responde 404 y no hay
forma de listar la cuenta desde la terminal.

**Abrir `github.com/settings/repositories` y comparar contra la lista de 21 de abajo.** Si
aparece alguno que no esté, espejarlo también. Los 21 salieron de cruzar los 20 proyectos de
Vercel con los 21 clones locales, así que podría faltar alguno que no tenga ni proyecto ni
clon en ninguna de las dos PC.

### Sobre los clones de trabajo de esta PC

Ninguno tiene commits sin pushear: los 21 espejos tienen todo lo que hay. Ocho clones sí
están **atrasados** respecto de origin (se trabajó en la otra PC): `pll-studio` (14 commits),
`cyc-repo` (7), `autoservicio-krb` (6), `liliana-donato` (6), `perezlegales` (4),
`Terrestre3` (3), `centenaria` (3), `diegocarbone-repo` (1). Los objetos ya están bajados;
falta el `git pull` cuando se vaya a tocar cada uno.

### Los 21 repos espejados

`batata-studio` · `centenaria` · `cyc` · `diegocarbone` · `dist-nahuel` · `empanadas-jaque` ·
`equiponeurodialectico` · `eric-torrent` · `federestivo` · `house-in-baires` · `krb` ·
`latina` · `lautaromendez` · `lga` · `liliana-donato` · `perezlegales` · `physiomove` ·
`place-vendome` · `pll-studio` · `sistema-barba` · `Terrestre3`

Ojo con dos nombres que no coinciden con el proyecto de Vercel: el repo `dist-nahuel` es el
proyecto `venta-latina-cente`, y `Terrestre3` es `terrestre3`.

## Cómo publicar mientras tanto

Con el CLI de Vercel, que no pasa por GitHub. Ya quedó instalado y logueado en la PC del
trabajo; en casa hay que repetir el `npm i -g` y el login.

```
npm i -g vercel
vercel login lautaromendez.ar@gmail.com     # llega un mail, se confirma con un clic
vercel link --yes --project <proyecto> --scope lautaro-mendez-s-projects
vercel deploy          # preview: NO toca el dominio
vercel deploy --prod   # promueve y hace el alias al dominio
```

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
