export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const response = await fetch(
      'https://open.bymadata.com.ar/vanoms-be-core/rest/api/bymadata/free/cedears',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // BYMA requiere que parezca un browser
          'User-Agent': 'Mozilla/5.0 (compatible; CEDEARTracker/1.0)',
          'Referer': 'https://open.bymadata.com.ar/'
        }
      }
    );
    if (!response.ok) throw new Error('BYMA HTTP ' + response.status);
    const data = await response.json();
    // Cache 3 minutos en Vercel edge
    res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=60');
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
