# Punto de retorno de producción — 7-sep-2026

> Foto de los deployments que estaban **en vivo y en `● Ready`** el 7-sep-2026, tomada
> mientras la cuenta de GitHub está marcada (ver `CUENTA-GITHUB-MARCADA.md`). Este archivo
> está en `.vercelignore`: no se publica.

## Para qué sirve

Sin GitHub, los deploys se hacen a mano con `vercel deploy --prod`, y **no hay push que
revisar ni PR que mirar**: si uno sale mal, el sitio del cliente queda mal hasta que lo
arregles. Esta tabla es el punto al que se vuelve.

```
vercel rollback <url-de-la-tabla> --scope lautaro-mendez-s-projects
```

⚠️ **Antes de deployar, `git pull`.** `vercel deploy` sube lo que hay **en el disco**, no lo
que hay en GitHub. Con el push automático esto no podía fallar; ahora sí: deployar con el
working tree atrasado publica una versión vieja y le pisa trabajo al cliente, y el deploy
dice `Ready` igual.

## La tabla

| proyecto | dominio de producción | deployment al 7-sep |
|---|---|---|
| `lautaromendez` | lautaromendez.com.ar | `https://lautaromendez-ca6sfyu1x-lautaro-mendez-s-projects.vercel.app` |
| `batata-studio` | batatastudio.com.ar | `https://batata-studio-gugkz2kd1-lautaro-mendez-s-projects.vercel.app` |
| `latina` | latina-jet.vercel.app | `https://latina-e44dmvs40-lautaro-mendez-s-projects.vercel.app` |
| `cyc` | www.papeleracyc.com.ar | `https://cyc-br54g2rgq-lautaro-mendez-s-projects.vercel.app` |
| `venta-latina-cente` | venta-latina-cente.vercel.app | `https://venta-latina-cente-e3e3ww331-lautaro-mendez-s-projects.vercel.app` |
| `physiomove` | physiomove-tau.vercel.app | `https://physiomove-855pdaezh-lautaro-mendez-s-projects.vercel.app` |
| `centenaria` | centenaria.vercel.app | `https://centenaria-mb0q9or91-lautaro-mendez-s-projects.vercel.app` |
| `house-in-baires` | www.houseinbaires.com.ar | `https://house-in-baires-8qadkvh06-lautaro-mendez-s-projects.vercel.app` |
| `place-vendome` | place-vendome.vercel.app | `https://place-vendome-71y90am2y-lautaro-mendez-s-projects.vercel.app` |
| `perezlegales` | perezlegales.vercel.app | `https://perezlegales-foyg17ztl-lautaro-mendez-s-projects.vercel.app` |
| `empanadas-jaque` | empanadasjaque.com.ar | `https://empanadas-jaque-q3y6vmna9-lautaro-mendez-s-projects.vercel.app` |
| `lga` | lga-beta.vercel.app | `https://lga-65uzs1iga-lautaro-mendez-s-projects.vercel.app` |
| `pll-studio` | www.estudiopll.com.ar | `https://pll-studio-71h7yri1b-lautaro-mendez-s-projects.vercel.app` |
| `diegocarbone` | diegocarbone.vercel.app | `https://diegocarbone-mt3posn8p-lautaro-mendez-s-projects.vercel.app` |
| `sistema-barba` | sistema-barba.vercel.app | `https://sistema-barba-hi2y03w9d-lautaro-mendez-s-projects.vercel.app` |
| `liliana-donato` | liliana-donato.vercel.app | `https://liliana-donato-gr809p2cr-lautaro-mendez-s-projects.vercel.app` |
| `equiponeurodialectico` | equiponeurodialectico.vercel.app | `https://equiponeurodialectico-pd8h4ezkj-lautaro-mendez-s-projects.vercel.app` |
| `federestivo` | www.federestivo.com | `https://federestivo-e104422xq-lautaro-mendez-s-projects.vercel.app` |
| `krb` | krb-plum.vercel.app | `https://krb-jy9omdj4t-lautaro-mendez-s-projects.vercel.app` |
| `terrestre3` | terrestre3.vercel.app | `https://terrestre3-sp8emhmwk-lautaro-mendez-s-projects.vercel.app` |

Los 20 respondían **200** el 7-sep, más el `/studio` de Place Vendôme.

## Cómo regenerar esta tabla

Queda vieja apenas hagas un deploy. Para rehacerla:

```
vercel ls <proyecto> --prod --scope lautaro-mendez-s-projects
```

El primero de la lista es el que está sirviendo el dominio.
