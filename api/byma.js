// Yahoo Finance — funciona desde servidores sin restricciones
// Trae el precio del subyacente en USD y calcula el CEDEAR en ARS

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker, ratio, ccl } = req.query;
  if (!ticker) return res.status(400).json({ error: 'Falta ticker' });

  const sym    = ticker.toUpperCase().trim();
  const ratioN = parseFloat(ratio) || 1;
  const cclN   = parseFloat(ccl)   || 1400;

  try {
    // Yahoo Finance v8 — no requiere API key
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });
    if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`);
    const data = await r.json();

    const meta       = data?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error('Sin datos de Yahoo');

    const precioUSD  = meta.regularMarketPrice ?? meta.previousClose;
    const prevUSD    = meta.previousClose ?? precioUSD;
    const variacion  = prevUSD > 0 ? ((precioUSD - prevUSD) / prevUSD) * 100 : 0;

    // Precio del CEDEAR en ARS = subyacente USD / ratio × CCL
    const precioARS  = (precioUSD / ratioN) * cclN;

    res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=60');
    res.status(200).json({
      ticker:    sym,
      precio:    Math.round(precioARS * 100) / 100,
      precioUSD: Math.round(precioUSD * 100) / 100,
      variacion: Math.round(variacion * 100) / 100,
      fuente:    'yahoo'
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
