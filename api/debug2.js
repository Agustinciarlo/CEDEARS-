export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { ticker = 'SPY' } = req.query;
  const sym = ticker.toUpperCase().trim();
  const results = {};

  const urls = [
    ['ambito_v1', `https://mercados.ambito.com/api/cotizaciones/cedear/${sym}`],
    ['ambito_v2', `https://mercados.ambito.com/cedear/${sym}/cotizacion`],
    ['ambito_v3', `https://mercados.ambito.com/cedear/${sym}`],
    ['ambito_v4', `https://api.ambito.com/api/items/cedear/${sym}?json=1`],
    ['rava_feed', `https://www.rava.com/feed/cotizaciones.php?e=${sym}`],
    ['rava_api',  `https://www.rava.com/api/cotizacion/${sym}`],
  ];

  for (const [name, url] of urls) {
    try {
      const r = await fetch(url, {
        headers: { 'Referer': 'https://www.ambito.com/', 'Accept': '*/*', 'User-Agent': 'Mozilla/5.0' }
      });
      const text = await r.text();
      results[name] = { status: r.status, preview: text.slice(0, 150) };
    } catch(e) {
      results[name] = { error: e.message };
    }
  }

  res.status(200).json(results);
}
