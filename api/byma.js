export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // BYMA Open Data requiere POST con este body exacto
  const body = JSON.stringify({
    excludeNoPrice: true,
    T2: true,
    T1: false,
    T0: false,
    Content: [],
    Envíos: []
  });

  try {
    const response = await fetch(
      'https://open.bymadata.com.ar/vanoms-be-core/rest/api/bymadata/free/cedears',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://open.bymadata.com.ar',
          'Referer': 'https://open.bymadata.com.ar/'
        },
        body
      }
    );

    const text = await response.text();

    if (!response.ok) {
      return res.status(502).json({ error: `BYMA HTTP ${response.status}`, detail: text.slice(0, 300) });
    }

    let data;
    try { data = JSON.parse(text); } catch(e) {
      return res.status(502).json({ error: 'Respuesta no JSON de BYMA', detail: text.slice(0, 300) });
    }

    res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=60');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
