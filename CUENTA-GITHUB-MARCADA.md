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

**No rompe nada de lo que está publicado.** El 7-sep respondían 200 los ocho sitios con
backend, incluido `/studio` de Place Vendôme. Son deploys ya hechos: corren sin consultar
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

⚠️ **No abrir una cuenta nueva mientras el ticket esté abierto.** Crear otra para esquivar
una suspensión suele terminar con la nueva suspendida también. Si GitHub confirma que no la
restablece, recién ahí preguntarle explícitamente si se puede abrir otra.

## Lo que falta hacer en la PC de casa

**Backup espejo de todos los repos, mientras la cuenta siga dejando clonar.** Hoy se puede
porque el push y el clone van autenticados; si la cuenta pasara de *oculta* a *desactivada*,
eso se termina.

```
git clone --mirror https://github.com/lautaromendezar-cmd/<repo>.git
```

Un `--mirror` guarda ramas, tags e historial completos, y sirve para republicar en otra
cuenta o en otro servicio con `git push --mirror <nuevo-remoto>`.

⚠️ **Comparar contra `github.com/settings/repositories`**, que sí se ve estando logueado. El
inventario de abajo salió de cruzar los proyectos de Vercel con los clones locales, así que
**puede faltar algún repo que no tenga proyecto ni clon**. No se pudo listar la cuenta
entera: con la cuenta marcada, la API responde 404.

### Ya respaldado en la PC del trabajo (7-sep)

Los tres que no estaban en ninguna máquina quedaron como espejo en
`Desktop\Claude\zz-backup-github\`:

| repo | commits | último cambio |
|---|---|---|
| `empanadas-jaque` | 9 | 27-ago-2026 |
| `federestivo` | 8 | 12-jul-2026 |
| `sistema-barba` | 3 | 12-ago-2026 |

Y se corrió `git fetch --all --tags` en los 18 clones que ya estaban. **Ocho estaban
atrasados** y ahora tienen los objetos bajados, aunque el working tree siga sin actualizar:
`pll-studio` (14 commits), `cyc-repo` (7), `autoservicio-krb` (6), `liliana-donato` (6),
`perezlegales` (4), `Terrestre3` (3), `centenaria` (3), `diegocarbone-repo` (1).

### Los 21 repos conocidos

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
