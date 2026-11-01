// Guarda cada lead de /cotizar/ en la planilla «Leads cotizar» (Google Sheets) y
// avisa al celular por ntfy. Las credenciales van en variables de Vercel: el repo
// es público.
//   LEADS_SHEET_ID   id de la planilla
//   LEADS_SA_EMAIL   cuenta de servicio con permiso de edición sobre la planilla
//   LEADS_SA_KEY     su clave privada (PEM, con \n literales o saltos reales)
//   NTFY_TOPIC       el mismo canal del aviso de lectura
const crypto = require('crypto');

const CAMPOS = ['nombre', 'negocio', 'donde', 'tiempo', 'precio', 'origen', 'campana', 'anuncio'];
const LARGO = 160;

const b64 = (s) => Buffer.from(s).toString('base64url');

async function token() {
  const ahora = Math.floor(Date.now() / 1000);
  const cabecera = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const cuerpo = b64(JSON.stringify({
    iss: process.env.LEADS_SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: ahora,
    exp: ahora + 600,
  }));
  const clave = (process.env.LEADS_SA_KEY || '').replace(/\\n/g, '\n');
  const firma = crypto.createSign('RSA-SHA256').update(`${cabecera}.${cuerpo}`).sign(clave, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${cabecera}.${cuerpo}.${firma}`,
  });
  if (!r.ok) throw new Error(`token ${r.status}`);
  return (await r.json()).access_token;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || !b.nombre || !b.negocio) return res.status(400).end();
  const ua = req.headers['user-agent'] || '';
  if (/bot|crawl|spider|preview|facebookexternalhit|headless/i.test(ua)) return res.status(204).end();

  const v = Object.fromEntries(CAMPOS.map((c) => [c, String(b[c] || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, LARGO)]));
  const fecha = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false });
  const fila = [fecha, v.campana, v.anuncio, v.nombre, v.negocio, v.donde, v.tiempo, v.precio, v.origen];

  const tareas = [];
  if (process.env.LEADS_SHEET_ID && process.env.LEADS_SA_EMAIL && process.env.LEADS_SA_KEY) {
    tareas.push((async () => {
      const t = await token();
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.LEADS_SHEET_ID}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [fila] }),
      });
      if (!r.ok) throw new Error(`sheets ${r.status}`);
    })());
  }
  if (process.env.NTFY_TOPIC) {
    tareas.push(fetch('https://ntfy.sh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: process.env.NTFY_TOPIC,
        title: `Lead: ${v.nombre}`,
        message: `${v.negocio} · ${v.precio} · ${v.tiempo}${v.campana ? ` · ${v.campana}` : ''}`,
        priority: 4,
      }),
    }));
  }
  const r = await Promise.allSettled(tareas);
  const fallo = r.find((x) => x.status === 'rejected');
  if (fallo) console.error('lead', fallo.reason && fallo.reason.message);
  res.status(204).end();
};
