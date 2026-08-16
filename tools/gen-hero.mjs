/* ══════════════════════════════════════════════════════════════════════════
   Generador de las 4 capas SVG del hero — Buenos Aires nocturna estilo Tron.

   Dirección de arte (póster de Tron Ares): el cielo NO es negro, es azul
   pizarra luminoso con nubes; la ciudad son siluetas oscuras recortadas
   contra esa luz; las ventanas son cálidas (ámbar), no grises; el rojo
   aparece como bloom difuso en el horizonte y como neón en aristas, nunca
   como bloque plano.

   Uso: node tools/gen-hero.mjs assets/hero
   El sitio consume los .svg ya escritos: esto no corre en producción.
   ══════════════════════════════════════════════════════════════════════════ */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

const W = 1600, H = 900;

/* ── Paleta del DIBUJO (no es la del sitio: esto es una ilustración) ─────── */
const C = {
  skyTop:   '#0B1017',
  skyMid:   '#16202E',
  skyLow:   '#2C3D52',
  cloud:    '#3E5069',
  cloudHi:  '#556A86',
  far:      '#1E2937',
  mid:      '#141B26',
  near:     '#080C11',
  winWarm:  '#FFB775',
  winHot:   '#FFDCAF',
  winRed:   '#FF4A5C',
  neon:     '#FF2D46',
  ember:    '#FF7A3D',
  void:     '#0A0B0D',
};

/* PRNG con semilla: regenerar da siempre el mismo dibujo */
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R  = (r, a, b) => a + r() * (b - a);
const RI = (r, a, b) => Math.floor(R(r, a, b + 1));
const n  = (v) => Math.round(v * 100) / 100;
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

const head = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">`;

/* Glow radial reutilizable: es más barato que un blur y no se recorta */
const glow = (id, color, op) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/>` +
  `<stop offset=".45" stop-color="${color}" stop-opacity="${(op * .38).toFixed(3)}"/>` +
  `<stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;

const blob = (id, cx, cy, rx, ry) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>`;

/* ── Ventanas: la mayoría apagadas, las encendidas cálidas y desparejas ──── */
function windows(r, x, y, w, h, opt) {
  const { cell = 11, gap = 7, lit = .26, pad = 8, hot = .12, red = .05, dim = 1 } = opt || {};
  const cols = Math.floor((w - pad * 2 + gap) / (cell + gap));
  const rows = Math.floor((h - pad * 2 + gap) / (cell * 1.4 + gap));
  if (cols < 1 || rows < 1) return '';
  const ox = x + (w - (cols * (cell + gap) - gap)) / 2;
  let out = '';
  for (let cy = 0; cy < rows; cy++) {
    /* pisos enteros encendidos de vez en cuando: rompe la textura uniforme */
    const piso = r() < .12;
    for (let cx = 0; cx < cols; cx++) {
      if (!piso && r() > lit) continue;
      const px = n(ox + cx * (cell + gap));
      const py = n(y + pad + cy * (cell * 1.4 + gap));
      const u = r();
      const col = u < red ? C.winRed : u < red + hot ? C.winHot : C.winWarm;
      const op = n(R(r, .28, .92) * dim);
      out += `<rect x="${px}" y="${py}" width="${cell}" height="${n(cell * .82)}" fill="${col}" opacity="${op}"/>`;
    }
  }
  return out;
}

/* ── Remates: antenas, tanques, cornisas ────────────────────────────────── */
function crown(r, x, y, w, fill) {
  const kind = RI(r, 0, 3);
  const cx = n(x + w / 2);
  if (kind === 0) {
    const hh = n(R(r, 30, 88));
    /* la antena va un punto más clara que la fachada: sin eso el mástil se
       pierde contra el cielo y la baliza queda como un punto rojo flotando */
    return `<rect x="${n(cx - 1.5)}" y="${n(y - hh)}" width="3" height="${hh}" fill="${fill}" opacity=".85"/>` +
           `<rect x="${n(cx - 1.5)}" y="${n(y - hh)}" width="3" height="${hh}" fill="#3D4C61" opacity=".5"/>` +
           `<circle cx="${cx}" cy="${n(y - hh)}" r="2.2" fill="${C.neon}" opacity=".7"/>`;
  }
  if (kind === 1) {
    const tw = n(w * R(r, .26, .44)), th = n(R(r, 14, 28));
    return `<rect x="${n(cx - tw / 2)}" y="${n(y - th)}" width="${tw}" height="${th}" fill="${fill}"/>` +
           `<rect x="${n(cx - tw / 2 - 3)}" y="${n(y - th - 4)}" width="${n(tw + 6)}" height="4" fill="${fill}"/>`;
  }
  if (kind === 2) {
    const iw = n(w * .7), ih = n(R(r, 10, 22));
    return `<rect x="${n(x + (w - iw) / 2)}" y="${n(y - ih)}" width="${iw}" height="${ih}" fill="${fill}"/>`;
  }
  return '';
}

/* ── Neón: bandas horizontales y tiras verticales sobre la fachada ──────── */
/* Una fachada lleva banda O tira, nunca las dos: cruzadas dibujan un signo
   más en el medio del edificio y se lee como un error, no como neón. */
function neonTrim(r, x, y, w, h, chance = .5) {
  if (r() > chance) return '';
  if (r() < .62) {                                      // banda horizontal
    const by = n(y + R(r, .12, .32) * h);
    const ix = n(x + w * .14), iw = n(w * .72);         // sin tocar los cantos
    return `<rect x="${ix}" y="${by}" width="${iw}" height="1.4" fill="${C.neon}" opacity=".7"/>` +
           `<rect x="${ix}" y="${n(by - 2.5)}" width="${iw}" height="6" fill="${C.neon}" opacity=".14"/>`;
  }
  const bx = n(x + R(r, .2, .8) * w);                   // tira vertical
  return `<rect x="${bx}" y="${n(y + h * .18)}" width="1.4" height="${n(h * .74)}" fill="${C.ember}" opacity=".55"/>`;
}

/* ── Estela gruesa con bloom: el gesto del póster ───────────────────────── */
function streak(id, d, coreW) {
  return `
  <path d="${d}" stroke="url(#${id}-b)" stroke-width="${coreW * 9}" stroke-linecap="round" filter="url(#soft)" opacity=".55"/>
  <path d="${d}" stroke="url(#${id}-c)" stroke-width="${coreW}" stroke-linecap="round" opacity=".95"/>`;
}
const streakGrads = (id) => `
  <linearGradient id="${id}-b" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.neon}" stop-opacity="0"/>
    <stop offset=".45" stop-color="${C.neon}" stop-opacity=".9"/>
    <stop offset="1" stop-color="${C.ember}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="${id}-c" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.neon}" stop-opacity="0"/>
    <stop offset=".4" stop-color="#FFC9B0" stop-opacity="1"/>
    <stop offset=".62" stop-color="${C.ember}" stop-opacity=".95"/>
    <stop offset="1" stop-color="${C.neon}" stop-opacity="0"/>
  </linearGradient>`;

/* ══ CAPA 1 — CIELO ════════════════════════════════════════════════════════ */
function sky() {
  const r = rng(11);

  let stars = '';
  for (let i = 0; i < 130; i++) {
    const x = n(R(r, 0, W)), y = n(R(r, 0, 430));
    const op = n(R(r, .12, .6) * (1 - y / 560));
    stars += `<circle cx="${x}" cy="${y}" r="${n(R(r, .5, 1.5))}" fill="#DCE6F5" opacity="${Math.max(0, op)}"/>`;
  }

  /* banco de nubes: elipses blandas encimadas, las de abajo tocadas de rojo */
  let clouds = '';
  for (let i = 0; i < 16; i++) {
    const cx = n(R(r, -80, W + 80));
    const cy = n(R(r, 130, 470));
    const rx = n(R(r, 170, 400));
    const ry = n(R(r, 34, 84));
    const bajo = cy > 340;
    clouds += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${bajo ? 'cloudR' : 'cloudB'})" opacity="${n(R(r, .3, .68))}"/>`;
  }

  return `${head()}
<defs>
  <linearGradient id="skyV" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.skyTop}"/>
    <stop offset=".34" stop-color="#101A26"/>
    <stop offset=".62" stop-color="${C.skyMid}"/>
    <stop offset=".84" stop-color="${C.skyLow}"/>
    <stop offset="1" stop-color="#3A4E66"/>
  </linearGradient>
  ${glow('cloudB', C.cloud, .55)}
  ${glow('cloudR', C.cloudHi, .5)}
  ${glow('bloomRed', C.neon, .55)}
  ${glow('bloomEmber', C.ember, .42)}
  ${glow('bloomCool', '#4E7196', .5)}
  ${streakGrads('s1')}
  <filter id="soft" x="-30%" y="-200%" width="160%" height="500%">
    <feGaussianBlur stdDeviation="13"/>
  </filter>
</defs>

<rect width="${W}" height="${H}" fill="url(#skyV)"/>
<g>${stars}</g>
<g>${clouds}</g>

<!-- bloom frío arriba a la izquierda: da profundidad al cielo -->
${blob('bloomCool', 300, 150, 620, 330)}
<!-- el gran resplandor rojo detrás de la ciudad: el corazón de la paleta -->
${blob('bloomRed', 980, 690, 720, 330)}
${blob('bloomEmber', 1150, 730, 430, 200)}

<!-- estelas gruesas horneadas: las finas animadas van encima, en el DOM -->
${streak('s1', 'M-120 250 C 320 180, 760 320, 1240 190 S 1680 120, 1760 150', 3)}
${streak('s1', 'M-120 520 C 380 470, 700 560, 1180 430 S 1620 400, 1760 430', 2.2)}

<!-- bruma sobre el horizonte -->
<rect x="0" y="600" width="${W}" height="120" fill="#48607D" opacity=".16"/>
<rect x="0" y="672" width="${W}" height="90" fill="${C.ember}" opacity=".05"/>
</svg>`;
}

/* ══ CAPA 2 — SKYLINE LEJANO ═══════════════════════════════════════════════ */
function skyline() {
  const r = rng(27);
  const base = 690;
  let b = '', x = -40;

  while (x < W + 40) {
    const w = n(R(r, 36, 104));
    const h = n(R(r, 48, 210));
    const y = n(base - h);
    b += `<rect x="${n(x)}" y="${y}" width="${w}" height="${n(h + 80)}" fill="${C.far}"/>`;
    b += crown(r, x, y, w, C.far);
    b += windows(r, x, y, w, h, { cell: 5, gap: 6, lit: .2, pad: 6, dim: .72 });
    b += neonTrim(r, x, y, w, h, .22);
    x += w + R(r, 3, 18);
  }

  /* dos siluetas reconocibles */
  const dome = `<g fill="#212D3C"><rect x="322" y="574" width="96" height="180"/>` +
    `<path d="M322 574a48 42 0 0 1 96 0z"/><rect x="366" y="524" width="8" height="52"/>` +
    `<circle cx="370" cy="520" r="3" fill="${C.neon}" opacity=".9"/></g>`;
  const step = `<g fill="#212D3C"><rect x="1146" y="540" width="104" height="214"/>` +
    `<rect x="1166" y="506" width="64" height="40"/><rect x="1188" y="470" width="20" height="40"/>` +
    `<rect x="1146" y="566" width="104" height="1.6" fill="${C.neon}" opacity=".8"/></g>`;

  return `${head()}
<g>${b}</g>${dome}${step}
<!-- bruma en la base: separa el skyline lejano de los edificios medios -->
<rect x="0" y="626" width="${W}" height="86" fill="#3E5570" opacity=".22"/>
</svg>`;
}

/* ══ CAPA 3 — OBELISCO + EDIFICIOS MEDIOS ══════════════════════════════════ */
function obelisco() {
  const r = rng(43);
  const base = 772;
  let b = '';

  for (const [from, to] of [[-60, 632], [968, W + 60]]) {
    let x = from;
    while (x < to) {
      const w = n(R(r, 56, 130));
      const h = n(R(r, 110, 300));
      const y = n(base - h);
      b += `<rect x="${n(x)}" y="${y}" width="${w}" height="${n(h + 120)}" fill="${C.mid}"/>`;
      b += crown(r, x, y, w, C.mid);
      b += windows(r, x, y, w, h, { cell: 8, gap: 7, lit: .3, pad: 8 });
      b += neonTrim(r, x, y, w, h, .5);
      x += w + R(r, 5, 24);
    }
  }

  /* edificios bajos abrazando la base del Obelisco */
  b += `<rect x="632" y="678" width="88" height="216" fill="#171F2B"/>`;
  b += windows(r, 632, 678, 88, 94, { cell: 8, gap: 7, lit: .34, pad: 9 });
  b += `<rect x="880" y="662" width="94" height="232" fill="#171F2B"/>`;
  b += windows(r, 880, 662, 94, 110, { cell: 8, gap: 7, lit: .34, pad: 9 });

  const cx = 800, top = 142, bot = 772;
  const hTop = 11, hBot = 33, capH = 44;

  return `${head()}
<defs>
  ${glow('baseGlow', C.neon, .5)}
  ${glow('balizaGlow', C.neon, .55)}
  <linearGradient id="obLit" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#4A5B72"/><stop offset="1" stop-color="#232F40"/>
  </linearGradient>
  <linearGradient id="obDark" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#232D3C"/><stop offset="1" stop-color="#131A24"/>
  </linearGradient>
  <linearGradient id="obEdge" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="${C.neon}" stop-opacity=".12"/>
    <stop offset=".42" stop-color="${C.neon}" stop-opacity=".5"/>
    <stop offset="1" stop-color="#FFD0C4" stop-opacity=".95"/>
  </linearGradient>
</defs>

<g>${b}</g>

<!-- resplandor a los pies del Obelisco: la plaza iluminada -->
${blob('baseGlow', cx, 790, 330, 120)}

<g>
  <!-- fuste: cara iluminada y cara en sombra, para que lea volumen -->
  <path d="M${cx - hBot} ${bot} L${cx - hTop} ${top + capH} L${cx} ${top + capH} L${cx} ${bot} Z" fill="url(#obLit)"/>
  <path d="M${cx} ${bot} L${cx} ${top + capH} L${cx + hTop} ${top + capH} L${cx + hBot} ${bot} Z" fill="url(#obDark)"/>
  <!-- piramidión -->
  <path d="M${cx - hTop} ${top + capH} L${cx} ${top} L${cx} ${top + capH} Z" fill="#5A6D87"/>
  <path d="M${cx} ${top} L${cx + hTop} ${top + capH} L${cx} ${top + capH} Z" fill="#2A3646"/>
  <!-- arista de neón sobre el canto: se apaga hacia abajo, si va pareja de
       punta a punta parece un láser cruzando el fuste y no una arista -->
  <path d="M${cx - hBot} ${bot} L${cx - hTop} ${top + capH} L${cx} ${top}"
        stroke="url(#obEdge)" stroke-width="1.5"/>
  <path d="M${cx - hBot} ${bot} L${cx - hTop} ${top + capH} L${cx} ${top}"
        stroke="url(#obEdge)" stroke-width="6" opacity=".22"/>
  <!-- ventana superior -->
  <rect x="${cx - 4}" y="${top + 76}" width="8" height="13" fill="#0A0B0D" opacity=".9"/>
  <rect x="${cx - 4}" y="${top + 76}" width="8" height="13" fill="${C.winWarm}" opacity=".5"/>
  <!-- basamento -->
  <rect x="${cx - 50}" y="${bot - 14}" width="100" height="20" fill="#2A3546"/>
  <rect x="${cx - 64}" y="${bot + 4}" width="128" height="16" fill="#1B2331"/>
  <rect x="${cx - 64}" y="${bot + 4}" width="128" height="1.6" fill="${C.ember}" opacity=".7"/>
  <!-- baliza -->
  ${blob('balizaGlow', cx, top + 8, 30, 30)}
  <circle cx="${cx}" cy="${top + 8}" r="2.6" fill="#FFD9CF"/>
</g>
</svg>`;
}

/* ══ CAPA 4 — PRIMER PLANO ═════════════════════════════════════════════════ */
function foreground() {
  const r = rng(61);
  let b = '';

  /* bloques que entran desde los costados, con luz de canto del lado del bloom */
  const specs = [
    [-70, 470, 210, 1], [148, 548, 176, 1], [330, 616, 150, 1],
    [1118, 630, 160, -1], [1288, 534, 188, -1], [1474, 486, 216, -1],
  ];
  for (const [x, y, w, dir] of specs) {
    b += `<rect x="${x}" y="${y}" width="${w}" height="${H - y + 40}" fill="${C.near}"/>`;
    b += crown(r, x, y, w, C.near);
    b += windows(r, x, y, w, 240, { cell: 10, gap: 10, lit: .1, pad: 12, dim: .8 });
    /* rim light: el canto que mira al resplandor se enciende */
    const rx = dir > 0 ? n(x + w - 1.4) : n(x);
    b += `<rect x="${rx}" y="${y}" width="1.4" height="${n((H - y) * .78)}" fill="url(#rim)"/>`;
    b += `<rect x="${n(rx - 3)}" y="${y}" width="7" height="${n((H - y) * .78)}" fill="url(#rim)" opacity=".3"/>`;
  }

  /* cornisa baja cruzando el encuadre: ancla el primer plano */
  b += `<rect x="470" y="852" width="660" height="${H - 852 + 40}" fill="#070A0E"/>`;
  b += `<rect x="470" y="852" width="660" height="1.6" fill="${C.ember}" opacity=".45"/>`;

  return `${head()}
<defs>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.void}" stop-opacity="0"/>
    <stop offset="1" stop-color="${C.void}" stop-opacity=".94"/>
  </linearGradient>
  <!-- la luz de canto se apaga hacia abajo: pareja de arriba a abajo parece
       una barra roja suelta y no el reflejo del resplandor -->
  <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.neon}" stop-opacity=".5"/>
    <stop offset=".55" stop-color="${C.neon}" stop-opacity=".28"/>
    <stop offset="1" stop-color="${C.neon}" stop-opacity="0"/>
  </linearGradient>
</defs>
<g>${b}</g>
<rect x="0" y="712" width="${W}" height="188" fill="url(#fade)"/>
</svg>`;
}

const files = {
  '01-sky.svg': sky(),
  '02-skyline.svg': skyline(),
  '03-obelisco.svg': obelisco(),
  '04-foreground.svg': foreground(),
};
for (const [name, body] of Object.entries(files)) {
  writeFileSync(join(OUT, name), body.replace(/\n\s*\n/g, '\n'), 'utf8');
  console.log(name.padEnd(20), (Buffer.byteLength(body) / 1024).toFixed(1) + ' KB');
}
