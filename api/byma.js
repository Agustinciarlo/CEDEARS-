// Proxy para cotización de CEDEARs usando Ambito Financiero
// Endpoint: mercados.ambito.com/cedear/{ticker}/ajax
// No requiere autenticación, funciona por ticker individual

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Falta parámetro ticker' });

  const sym = ticker.toUpperCase().trim();

  try {
    // Ambito devuelve: { fecha, ultimo, variacion, apertura, maximo, minimo, ... }
    const url = `https://mercados.ambito.com/cedear/${sym}/ajax`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://www.ambito.com/',
        'User-Agent': 'Mozilla/5.0 (compatible; CEDEARTracker/1.0)'
      }
    });

    if (!response.ok) throw new Error(`Ambito HTTP ${response.status} para ${sym}`);

    const data = await response.json();

    // Normalizar: ultimo puede venir como "53.925,00" (string con puntos y comas)
    const parseAR = str => {
      if (typeof str === 'number') return str;
      if (!str) return null;
      return parseFloat(str.toString().replace(/\./g, '').replace(',', '.'));
    };

    const precio = parseAR(data.ultimo || data.price || data.last);
    const variacion = parseAR(data.variacion || data.variation || data.change);

    if (!precio) throw new Error(`Sin precio para ${sym}`);

    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
    res.status(200).json({ ticker: sym, precio, variacion, fuente: 'ambito' });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
