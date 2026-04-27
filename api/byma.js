export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Falta parámetro ticker' });
  const sym = ticker.toUpperCase().trim();

  // Convierte strings tipo "53.925,00" o "53925.00" a número
  const parseAR = v => {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return isNaN(v) ? null : v;
    const s = String(v).trim();
    // Formato argentino: puntos como miles, coma como decimal
    const n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
  };

  // Intenta cada fuente en orden hasta obtener un precio válido
  const sources = [
    // Ambito — endpoint directo
    async () => {
      const r = await fetch(`https://mercados.ambito.com/cedear/${sym}/ajax`, {
        headers: { 'Referer': 'https://www.ambito.com/', 'Accept': 'application/json' }
      });
      if (!r.ok) throw new Error(`ambito ${r.status}`);
      const d = await r.json();
      // Ambito puede devolver array o objeto
      const obj = Array.isArray(d) ? d[0] : d;
      const precio = parseAR(obj?.ultimo ?? obj?.last ?? obj?.price ?? obj?.trade ?? obj?.close);
      const variacion = parseAR(obj?.variacion ?? obj?.variation ?? obj?.change ?? obj?.pct_change);
      if (!precio) throw new Error('sin precio en respuesta ambito');
      return { precio, variacion, fuente: 'ambito' };
    },
    // Fallback: Rava Bursátil (también público)
    async () => {
      const r = await fetch(`https://www.rava.com/perfil/cotizacion.php?e=${sym}&json=1`, {
        headers: { 'Referer': 'https://www.rava.com/', 'Accept': 'application/json' }
      });
      if (!r.ok) throw new Error(`rava ${r.status}`);
      const d = await r.json();
      const precio = parseAR(d?.last ?? d?.price ?? d?.ultimo);
      if (!precio) throw new Error('sin precio en respuesta rava');
      return { precio, variacion: parseAR(d?.change ?? d?.variacion), fuente: 'rava' };
    }
  ];

  for (const source of sources) {
    try {
      const result = await source();
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
      return res.status(200).json({ ticker: sym, ...result });
    } catch (e) {
      // Siguiente fuente
    }
  }

  res.status(500).json({ error: `Sin datos para ${sym} en ninguna fuente` });
}
