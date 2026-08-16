Resumen para agregar proyectos al portfolio

Archivo: c:\\Users\\Lautaro\\Desktop\\Claude\\portfolio-lautaro\\index.html



Dónde editar

El array de proyectos está en las líneas \~555–580. Cada proyecto es un objeto en esa lista. Para agregar uno nuevo, insertá un objeto más (podés copiarlo al principio o al final del array):





{img:'trabajos/port-NOMBRE.webp', name:'Nombre Cliente', rubro:'Categoría · Detalle', cat:'CATEGORIA', url:'https://sitio.com/'}

Agregá wide:true al final si querés que ocupe dos columnas (solo para proyectos que lo merezcan visualmente):





{..., wide:true}

Categorías disponibles

cat	Etiqueta visible

ecommerce	E-commerce

gastronomia	Gastronomía

servicios	Servicios

educacion	Educación

turismo	Turismo

industria	Industria

tecnologia	Tecnología

otros	Otros

Screenshot

Guardar en portfolio-lautaro/trabajos/

Nombre: port-NOMBRE.webp (WebP para peso óptimo)

Aspecto recomendado: 16:10 (el mismo que la card) para evitar recorte

Animaciones activas (no tocar)

Hero: formas geométricas violeta/rosa que morphean en "PROYECTOS REALES." (GSAP MorphSVGPlugin + opentype.js)

Scroll: shader WebGL en las imágenes de los proyectos: onda de distorsión + split RGB de canales al scrollear (Three.js r169 + GSAP ScrollTrigger)

Filtro por categoría: botones arriba de la grilla, el contador se actualiza automático con el total de proyectos

Contador automático

El número "26 proyectos reales" en el hero se actualiza solo — usa projects.length. No hay que tocar nada más que el array.

