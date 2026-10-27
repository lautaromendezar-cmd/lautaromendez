// Aviso al celular cuando un cliente abre o lee una propuesta (ntfy.sh).
// El canal va en la variable NTFY_TOPIC de Vercel: el repo es público.
const EVENTOS = {
  abrio: ['📬', 'abrió la propuesta'],
  opciones: ['👀', 'llegó a las tres opciones'],
  final: ['✅', 'leyó hasta el final'],
  boceto: ['🖥️', 'abrió el boceto'],
  compra: ['🛒', 'probó comprar en el boceto'],
  tiempo: ['⏱️', 'estuvo leyendo'],
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || !/^[a-z0-9-]{1,40}$/.test(b.p || '') || !EVENTOS[b.e]) return res.status(400).end();
  const ua = req.headers['user-agent'] || '';
  if (/bot|crawl|spider|preview|facebookexternalhit|whatsapp|headless/i.test(ua)) return res.status(204).end();

  const [emoji, texto] = EVENTOS[b.e];
  const nombre = String(b.n || b.p).slice(0, 60);
  let detalle = '';
  if (b.e === 'abrio' && (b.m === 'celular' || b.m === 'computadora')) detalle = ` (en ${b.m})`;
  if (b.e === 'tiempo') {
    const s = Math.max(0, Math.min(36000, parseInt(b.s, 10) || 0));
    detalle = ` ${Math.floor(s / 60)} min ${s % 60} s`;
  }

  if (process.env.NTFY_TOPIC) {
    await fetch('https://ntfy.sh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: process.env.NTFY_TOPIC,
        title: nombre,
        message: `${emoji} ${texto}${detalle}`,
        click: `https://lautaromendez.com.ar/propuestas/${b.p}/`,
        priority: b.e === 'abrio' ? 4 : 3,
      }),
    }).catch(() => {});
  }
  res.status(204).end();
};
